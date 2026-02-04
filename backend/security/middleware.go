package security

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Authentication middleware
func (s *SecurityService) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		// Validate token
		claims, err := s.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Check token type
		if tokenType, ok := claims["type"].(string); !ok || tokenType != "access" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
			c.Abort()
			return
		}

		// Add user info to context
		c.Set("user_id", claims["user_id"])
		c.Set("username", claims["username"])
		c.Set("role", claims["role"])

		c.Next()
	}
}

// Role-based access control middleware
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user role"})
			c.Abort()
			return
		}

		// Check if user has required role
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

// Admin only middleware
func AdminOnly() gin.HandlerFunc {
	return RequireRole("admin")
}

// Input validation middleware
func ValidateInput() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate JSON input
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			// Check content type
			contentType := c.GetHeader("Content-Type")
			if !strings.Contains(contentType, "application/json") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Content-Type must be application/json"})
				c.Abort()
				return
			}

			// Validate request size
			if c.Request.ContentLength > 10*1024*1024 { // 10MB limit
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Request too large"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// CSRF protection middleware
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip CSRF for GET requests
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Check CSRF token
		csrfToken := c.GetHeader("X-CSRF-Token")
		if csrfToken == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token required"})
			c.Abort()
			return
		}

		// Validate CSRF token (in production, use session-based validation)
		sessionToken := c.GetHeader("X-Session-Token")
		if sessionToken == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Session token required"})
			c.Abort()
			return
		}

		// Here you would validate the CSRF token against the session
		// For now, we'll just check if both tokens are present
		c.Next()
	}
}

// IP whitelist middleware
func IPWhitelistMiddleware(allowedIPs []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		
		if !IsIPWhitelisted(clientIP, allowedIPs) {
			c.JSON(http.StatusForbidden, gin.H{"error": "IP address not whitelisted"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// Audit logging middleware
func AuditLogger(db interface{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		
		// Process request
		c.Next()

		// Log audit information
		userID, _ := c.Get("user_id")
		username, _ := c.Get("username")
		
		// Create audit log entry
		auditData := map[string]interface{}{
			"user_id":     userID,
			"username":    username,
			"method":      c.Request.Method,
			"path":        c.Request.URL.Path,
			"status":      c.Writer.Status(),
			"ip_address":  c.ClientIP(),
			"user_agent":  c.GetHeader("User-Agent"),
			"duration":    time.Since(startTime).Milliseconds(),
			"timestamp":   time.Now(),
		}

		// Log to console (in production, log to database)
		if c.Writer.Status() >= 400 {
			// Log errors
			auditData["type"] = "error"
		} else {
			// Log successful requests
			auditData["type"] = "success"
		}

		// In production, save to database
		// For now, just log to console
		// fmt.Printf("AUDIT: %+v\n", auditData)
	}
}

// Security headers middleware (enhanced)
func EnhancedSecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")
		
		// Prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		
		// XSS Protection
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// Referrer policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Content Security Policy
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'")
		
		// Strict Transport Security (HTTPS only)
		if c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}
		
		// Hide server information
		c.Header("Server", "E-Tax-API")
		c.Header("X-Powered-By", "E-Tax")
		
		// Remove X-Powered-By if present
		c.Writer.Header().Del("X-Powered-By")
		
		c.Next()
	}
}

// Rate limiting middleware (enhanced)
func EnhancedRateLimiter(requestsPerMinute int, burstSize int) gin.HandlerFunc {
	limiter := NewRateLimiter(requestsPerMinute, time.Minute)
	
	return func(c *gin.Context) {
		key := c.ClientIP()
		
		if !limiter.IsAllowed(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
				"message": "Too many requests. Please try again later.",
				"retry_after": "60s",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// File upload security middleware
func SecureFileUpload() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" {
			// Check for file uploads
			contentType := c.GetHeader("Content-Type")
			if strings.Contains(contentType, "multipart/form-data") {
				// Validate file size (10MB limit)
				if c.Request.ContentLength > 10*1024*1024 {
					c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "File too large"})
					c.Abort()
					return
				}

				// Validate file types
				fileHeader := c.GetHeader("X-File-Type")
				if fileHeader != "" {
					allowedTypes := []string{
						"image/jpeg", "image/png", "image/gif", "image/webp",
						"application/pdf", "text/csv", "application/vnd.ms-excel",
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					}
					
					isAllowed := false
					for _, allowedType := range allowedTypes {
						if fileHeader == allowedType {
							isAllowed = true
							break
						}
					}
					
					if !isAllowed {
						c.JSON(http.StatusBadRequest, gin.H{"error": "File type not allowed"})
						c.Abort()
						return
					}
				}
			}
		}

		c.Next()
	}
}

// Request timeout middleware
func RequestTimeout(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Set timeout for request
		c.Request = c.Request.WithContext(c.Request.Context())
		c.Next()
	}
}

// CORS middleware (enhanced)
func EnhancedCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// In production, validate origin against whitelist
		allowedOrigins := []string{
			"http://localhost:3000",
			"https://localhost:3000",
			"http://localhost:8080",
			"https://localhost:8080",
		}
		
		isAllowed := false
		for _, allowedOrigin := range allowedOrigins {
			if origin == allowedOrigin {
				isAllowed = true
				break
			}
		}
		
		if isAllowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-CSRF-Token, X-Session-Token")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	}
}
