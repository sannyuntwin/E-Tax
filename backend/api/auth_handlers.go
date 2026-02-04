package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"backend/security"
	"gorm.io/gorm"
)

// Authentication handlers
func login(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var loginData struct {
			Username string `json:"username" binding:"required"`
			Password string `json:"password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&loginData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Sanitize input
		loginData.Username = security.SanitizeInput(loginData.Username)

		// Find user
		var user database.User
		if err := db.Where("username = ?", loginData.Username).First(&user).Error; err != nil {
			// Log failed attempt
			logLoginAttempt(db, loginData.Username, c.ClientIP(), c.GetHeader("User-Agent"), false, "invalid_credentials")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// Check if user is active
		if !user.IsActive {
			logLoginAttempt(db, loginData.Username, c.ClientIP(), c.GetHeader("User-Agent"), false, "user_inactive")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is inactive"})
			return
		}

		// Check if account is locked
		if isAccountLocked(db, user.ID) {
			logLoginAttempt(db, loginData.Username, c.ClientIP(), c.GetHeader("User-Agent"), false, "account_locked")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is locked. Please try again later."})
			return
		}

		// Verify password
		if err := securityService.VerifyPassword(loginData.Password, user.Password); err != nil {
			// Log failed attempt
			logLoginAttempt(db, loginData.Username, c.ClientIP(), c.GetHeader("User-Agent"), false, "invalid_password")
			incrementFailedAttempts(db, user.ID)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// Generate tokens
		accessToken, err := securityService.GenerateAccessToken(user.ID, user.Username, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
			return
		}

		refreshToken, err := securityService.GenerateRefreshToken(user.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
			return
		}

		// Create session
		sessionID, err := security.GenerateSessionID()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate session ID"})
			return
		}

		session := database.Session{
			ID:           sessionID,
			UserID:       user.ID,
			Token:        accessToken,
			RefreshToken: refreshToken,
			ExpiresAt:    time.Now().Add(24 * time.Hour),
			CreatedAt:    time.Now(),
			LastUsedAt:   time.Now(),
			UserAgent:    c.GetHeader("User-Agent"),
			IPAddress:   c.ClientIP(),
		}

		if err := db.Create(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create session"})
			return
		}

		// Update last login
		now := time.Now().Format("2006-01-02 15:04:05")
		db.Model(&user).Update("last_login", &now)

		// Log successful login
		logLoginAttempt(db, loginData.Username, c.ClientIP(), c.GetHeader("User-Agent"), true, "success")

		// Clear failed attempts
		clearFailedAttempts(db, user.ID)

		c.JSON(http.StatusOK, gin.H{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"session_id":    sessionID,
			"user": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"email":      user.Email,
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"role":       user.Role,
			},
			"expires_at": session.ExpiresAt,
		})
	}
}

func logout(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sessionID := c.GetHeader("X-Session-Token")
		if sessionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Session token required"})
			return
		}

		// Delete session
		if err := db.Where("id = ?", sessionID).Delete(&database.Session{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	}
}

func refresh(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var refreshData struct {
			RefreshToken string `json:"refresh_token" binding:"required"`
		}

		if err := c.ShouldBindJSON(&refreshData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate refresh token
		claims, err := securityService.ValidateToken(refreshData.RefreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
			return
		}

		// Check token type
		if tokenType, ok := claims["type"].(string); !ok || tokenType != "refresh" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
			return
		}

		// Get user ID from claims
		userID, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID in token"})
			return
		}

		// Find user
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}

		// Check if user is still active
		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is inactive"})
			return
		}

		// Generate new tokens
		accessToken, err := securityService.GenerateAccessToken(uint(userID), user.Username, user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
			return
		}

		newRefreshToken, err := securityService.GenerateRefreshToken(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"access_token":  accessToken,
			"refresh_token": newRefreshToken,
		})
	}
}

func register(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var registerData struct {
			Username  string `json:"username" binding:"required"`
			Email     string `json:"email" binding:"required,email"`
			Password  string `json:"password" binding:"required"`
			FirstName string `json:"first_name" binding:"required"`
			LastName  string `json:"last_name" binding:"required"`
		}

		if err := c.ShouldBindJSON(&registerData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate password strength
		if err := security.ValidatePasswordStrength(registerData.Password); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate email format
		if !security.ValidateEmail(registerData.Email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
			return
		}

		// Sanitize input
		registerData.Username = security.SanitizeInput(registerData.Username)
		registerData.FirstName = security.SanitizeInput(registerData.FirstName)
		registerData.LastName = security.SanitizeInput(registerData.LastName)

		// Check if username already exists
		var existingUser database.User
		if err := db.Where("username = ? OR email = ?", registerData.Username, registerData.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}

		// Hash password
		hashedPassword, err := securityService.HashPassword(registerData.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		// Create user
		user := database.User{
			Username:  registerData.Username,
			Email:     registerData.Email,
			Password:  hashedPassword,
			FirstName: registerData.FirstName,
			LastName:  registerData.LastName,
			Role:      "user", // Default role
			IsActive:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		// Log registration
		logAuditEvent(db, &user.ID, "register", "user", user.ID, "User registered", c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusCreated, gin.H{
			"message": "User created successfully",
			"user": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"email":      user.Email,
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"role":       user.Role,
			},
		})
	}
}

func getProfile(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"is_active":  user.IsActive,
			"last_login": user.LastLogin,
			"created_at": user.CreatedAt,
		})
	}
}

func updateProfile(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var updateData struct {
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Email     string `json:"email"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate email format
		if updateData.Email != "" && !security.ValidateEmail(updateData.Email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid email format"})
			return
		}

		// Sanitize input
		updateData.FirstName = security.SanitizeInput(updateData.FirstName)
		updateData.LastName = security.SanitizeInput(updateData.LastName)

		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Update user
		if updateData.FirstName != "" {
			user.FirstName = updateData.FirstName
		}
		if updateData.LastName != "" {
			user.LastName = updateData.LastName
		}
		if updateData.Email != "" {
			user.Email = updateData.Email
		}

		user.UpdatedAt = time.Now()

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}

		// Log update
		logAuditEvent(db, &userID, "update", "user", user.ID, "Profile updated", c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusOK, gin.H{
			"message": "Profile updated successfully",
			"user": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"email":      user.Email,
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"role":       user.Role,
			},
		})
	}
}

func changePassword(securityService *security.SecurityService, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var passwordData struct {
			CurrentPassword string `json:"current_password" binding:"required"`
			NewPassword     string `json:"new_password" binding:"required"`
		}

		if err := c.ShouldBindJSON(&passwordData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate new password strength
		if err := security.ValidatePasswordStrength(passwordData.NewPassword); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Verify current password
		if err := securityService.VerifyPassword(passwordData.CurrentPassword, user.Password); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
			return
		}

		// Hash new password
		hashedPassword, err := securityService.HashPassword(passwordData.NewPassword)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}

		// Update password
		user.Password = hashedPassword
		user.UpdatedAt = time.Now()

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
			return
		}

		// Log password change
		logAuditEvent(db, &userID, "change_password", "user", user.ID, "Password changed", c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
	}
}

// Helper functions
func logLoginAttempt(db *gorm.DB, username, ipAddress, userAgent string, success bool, reason string) {
	attempt := database.LoginAttempt{
		Username:  username,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Success:   success,
		Reason:    reason,
		CreatedAt: time.Now(),
	}
	db.Create(&attempt)
}

func logAuditEvent(db *gorm.DB, userID *uint, action, resource string, resourceID *uint, details, ipAddress, userAgent string) {
	auditLog := database.AuditLog{
		UserID:     userID,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Details:    details,
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
		CreatedAt:  time.Now(),
	}
	db.Create(&auditLog)
}

func isAccountLocked(db *gorm.DB, userID uint) bool {
	var count int64
	db.Model(&database.LoginAttempt{}).
		Where("username = (SELECT username FROM users WHERE id = ?) AND success = ? AND created_at > ?", 
			userID, false, time.Now().Add(-15*time.Minute)).
		Count(&count)
	return count >= 5
}

func incrementFailedAttempts(db *gorm.DB, userID uint) {
	// This would increment a counter in a real implementation
	// For now, just log the attempt
}

func clearFailedAttempts(db *gorm.DB, userID uint) {
	// This would clear the failed attempts counter
	// For now, just log the successful login
}
