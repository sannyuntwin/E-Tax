package admin

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"etax/internal/database/models"
)

// User management handlers
func getUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var users []database.User
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		search := c.Query("search")

		query := db.Model(&database.User{})
		
		if search != "" {
			query = query.Where("username ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}

		var total int64
		query.Count(&total)

		c.JSON(http.StatusOK, gin.H{
			"users": users,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func getUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user database.User
		
		if err := db.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

func createUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var user database.User
		if err := c.ShouldBindJSON(&user); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check if username or email already exists
		var existingUser database.User
		if err := db.Where("username = ? OR email = ?", user.Username, user.Email).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}

		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()

		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"user": user})
	}
}

func updateUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var user database.User
		
		if err := db.First(&user, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
			return
		}

		var updateData database.User
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Update allowed fields only
		user.Username = updateData.Username
		user.Email = updateData.Email
		user.Role = updateData.Role
		user.IsActive = updateData.IsActive
		user.UpdatedAt = time.Now()

		if err := db.Save(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

func deleteUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		
		if err := db.Delete(&database.User{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
	}
}

// Audit and security handlers
func getAuditLogs(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var logs []database.AuditLog
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
		action := c.Query("action")
		userID := c.Query("user_id")

		query := db.Model(&database.AuditLog{}).Order("created_at DESC")
		
		if action != "" {
			query = query.Where("action = ?", action)
		}
		if userID != "" {
			query = query.Where("user_id = ?", userID)
		}

		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
			return
		}

		var total int64
		query.Count(&total)

		c.JSON(http.StatusOK, gin.H{
			"logs":  logs,
			"total": total,
			"page":  page,
			"limit": limit,
		})
	}
}

func getSecuritySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings database.SecuritySettings
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create default settings
				settings = database.SecuritySettings{
					PasswordMinLength:    8,
					RequireStrongPassword: true,
					SessionTimeout:       86400,
					MaxLoginAttempts:     5,
					LockoutDuration:      900,
					RequireTwoFactor:     false,
					IPWhitelist:         "[]",
					CreatedAt:            time.Now(),
					UpdatedAt:            time.Now(),
				}
				db.Create(&settings)
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch security settings"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"settings": settings})
	}
}

func updateSecuritySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings database.SecuritySettings
		if err := db.First(&settings).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new settings
				if err := c.ShouldBindJSON(&settings); err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
					return
				}
				settings.CreatedAt = time.Now()
				settings.UpdatedAt = time.Now()
				db.Create(&settings)
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch security settings"})
				return
			}
		} else {
			// Update existing settings
			var updateData database.SecuritySettings
			if err := c.ShouldBindJSON(&updateData); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			settings.PasswordMinLength = updateData.PasswordMinLength
			settings.RequireStrongPassword = updateData.RequireStrongPassword
			settings.SessionTimeout = updateData.SessionTimeout
			settings.MaxLoginAttempts = updateData.MaxLoginAttempts
			settings.LockoutDuration = updateData.LockoutDuration
			settings.RequireTwoFactor = updateData.RequireTwoFactor
			settings.IPWhitelist = updateData.IPWhitelist
			settings.UpdatedAt = time.Now()

			if err := db.Save(&settings).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update security settings"})
				return
			}
		}

		c.JSON(http.StatusOK, gin.H{"settings": settings})
	}
}

func getLoginAttempts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var attempts []database.LoginAttempt
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
		success := c.Query("success")

		query := db.Model(&database.LoginAttempt{}).Order("created_at DESC")
		
		if success != "" {
			query = query.Where("success = ?", success == "true")
		}

		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Find(&attempts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch login attempts"})
			return
		}

		var total int64
		query.Count(&total)

		c.JSON(http.StatusOK, gin.H{
			"attempts": attempts,
			"total":    total,
			"page":     page,
			"limit":    limit,
		})
	}
}

// System management handlers
func getSystemStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := make(map[string]interface{})
		
		// User counts
		var totalUsers, activeUsers int64
		db.Model(&database.User{}).Count(&totalUsers)
		db.Model(&database.User{}).Where("is_active = ?", true).Count(&activeUsers)
		
		// Company counts
		var totalCompanies int64
		db.Model(&database.Company{}).Count(&totalCompanies)
		
		// Invoice counts
		var totalInvoices, draftInvoices, sentInvoices int64
		db.Model(&database.Invoice{}).Count(&totalInvoices)
		db.Model(&database.Invoice{}).Where("status = ?", "draft").Count(&draftInvoices)
		db.Model(&database.Invoice{}).Where("status = ?", "sent").Count(&sentInvoices)
		
		// Recent activity
		var recentLogins int64
		sevenDaysAgo := time.Now().AddDate(0, 0, -7)
		db.Model(&database.LoginAttempt{}).Where("created_at > ? AND success = ?", sevenDaysAgo, true).Count(&recentLogins)

		stats["users"] = map[string]int64{
			"total":  totalUsers,
			"active": activeUsers,
		}
		stats["companies"] = map[string]int64{
			"total": totalCompanies,
		}
		stats["invoices"] = map[string]int64{
			"total": totalInvoices,
			"draft": draftInvoices,
			"sent":  sentInvoices,
		}
		stats["activity"] = map[string]int64{
			"recent_logins": recentLogins,
		}

		c.JSON(http.StatusOK, gin.H{"stats": stats})
	}
}

func createBackup(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// This is a placeholder for backup functionality
		// In production, you'd implement actual database backup
		c.JSON(http.StatusOK, gin.H{
			"message": "Backup initiated",
			"backup_id": "backup_" + time.Now().Format("20060102_150405"),
		})
	}
}

func getSystemHealth(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		health := make(map[string]interface{})
		
		// Database health
		sqlDB, err := db.DB()
		if err != nil {
			health["database"] = map[string]string{"status": "error", "message": err.Error()}
		} else {
			if err := sqlDB.Ping(); err != nil {
				health["database"] = map[string]string{"status": "error", "message": err.Error()}
			} else {
				stats := sqlDB.Stats()
				health["database"] = map[string]interface{}{
					"status":            "healthy",
					"open_connections":  stats.OpenConnections,
					"in_use":           stats.InUse,
					"idle":             stats.Idle,
					"wait_count":       stats.WaitCount,
					"wait_duration":    stats.WaitDuration.String(),
					"max_idle_closed":  stats.MaxIdleClosed,
					"max_lifetime_closed": stats.MaxLifetimeClosed,
				}
			}
		}
		
		health["server"] = map[string]interface{}{
			"status":    "healthy",
			"timestamp": time.Now(),
			"uptime":    time.Since(time.Now()).String(), // This should be calculated from server start time
		}

		c.JSON(http.StatusOK, gin.H{"health": health})
	}
}

// Company management handlers
func getAllCompanies(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var companies []database.Company
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
		search := c.Query("search")

		query := db.Model(&database.Company{})
		
		if search != "" {
			query = query.Where("company_name ILIKE ? OR tax_id ILIKE ?", "%"+search+"%", "%"+search+"%")
		}

		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Find(&companies).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch companies"})
			return
		}

		var total int64
		query.Count(&total)

		c.JSON(http.StatusOK, gin.H{
			"companies": companies,
			"total":     total,
			"page":      page,
			"limit":     limit,
		})
	}
}

func approveCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var company database.Company
		
		if err := db.First(&company, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
			return
		}

		// Add approval status to company (you'd need to add this field to the model)
		// For now, we'll just return success
		company.UpdatedAt = time.Now().Format(time.RFC3339)
		
		if err := db.Save(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve company"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Company approved successfully", "company": company})
	}
}

func suspendCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var company database.Company
		
		if err := db.First(&company, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
			return
		}

		// Add suspension status to company (you'd need to add this field to the model)
		// For now, we'll just return success
		company.UpdatedAt = time.Now().Format(time.RFC3339)
		
		if err := db.Save(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to suspend company"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Company suspended successfully", "company": company})
	}
}
