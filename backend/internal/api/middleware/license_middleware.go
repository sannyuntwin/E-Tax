package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"etax/internal/api/handlers/license"
	models "etax/internal/database/models"
)

// License validation middleware
func LicenseValidation(db *gorm.DB, licenseClient *license.LicenseServerClient, requiredFeature string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip license validation for health checks and public endpoints
		if strings.HasPrefix(c.Request.URL.Path, "/health") ||
		   strings.HasPrefix(c.Request.URL.Path, "/test") ||
		   strings.HasPrefix(c.Request.URL.Path, "/api/auth/login") ||
		   strings.HasPrefix(c.Request.URL.Path, "/api/auth/register") {
			c.Next()
			return
		}

		// Get company ID from context (set by auth middleware)
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Company not authenticated"})
			c.Abort()
			return
		}

		cid, ok := companyID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid company ID"})
			c.Abort()
			return
		}

		// Get active license for company
		var licenseKey models.LicenseKey
		err := db.Where("company_id = ? AND status = 'active'", cid).First(&licenseKey).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "No active license found",
					"message": "Please activate your license to use this feature",
				})
				c.Abort()
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "License database error"})
			c.Abort()
			return
		}

		// Check if license is expired
		if licenseKey.ExpiresAt != nil && licenseKey.ExpiresAt.Before(time.Now()) {
			// Update license status to expired
			licenseKey.Status = "expired"
			db.Save(&licenseKey)
			
			c.JSON(http.StatusForbidden, gin.H{
				"error": "License expired",
				"message": "Your license has expired. Please renew to continue using the service.",
			})
			c.Abort()
			return
		}

		// Parse features JSON
		var features []string
		if licenseKey.Features != "" {
			if err := json.Unmarshal([]byte(licenseKey.Features), &features); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "License feature parsing error"})
				c.Abort()
				return
			}
		}

		// Check if required feature is available
		if requiredFeature != "" {
			hasAccess := false
			for _, feature := range features {
				if strings.EqualFold(feature, requiredFeature) || strings.EqualFold(feature, "all") {
					hasAccess = true
					break
				}
			}

			if !hasAccess {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "Feature not licensed",
					"message": "Your current license does not include access to: " + requiredFeature,
					"license_type": licenseKey.LicenseType,
				})
				c.Abort()
				return
			}
		}

		// Add license info to context for handlers to use
		c.Set("license_key", licenseKey)
		c.Set("license_features", features)

		c.Next()
	}
}

// Usage quota checking middleware
func UsageQuotaCheck(db *gorm.DB, resourceType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.Next()
			return // Skip if no company context
		}

		cid, ok := companyID.(uint)
		if !ok {
			c.Next()
			return
		}

		// Get usage quota for this resource type
		var quota models.UsageQuota
		err := db.Where("company_id = ? AND resource_type = ?", cid, resourceType).First(&quota).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// No quota set, allow access
				c.Next()
				return
			}
			c.Next()
			return
		}

		// Check if over limit
		if quota.IsOverLimit || quota.Used >= quota.Limit {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Usage quota exceeded",
				"message": "You have reached your limit for " + resourceType,
				"limit": quota.Limit,
				"used": quota.Used,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// License middleware for API endpoints
func APILicenseValidation(db *gorm.DB, licenseClient *license.LicenseServerClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get API key from header
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key required"})
			c.Abort()
			return
		}

		// Find API key in database
		var key models.APIKey
		err := db.Where("key = ? AND is_active = ?", apiKey, true).First(&key).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			}
			c.Abort()
			return
		}

		// Get company license
		var licenseKey models.LicenseKey
		err = db.Where("company_id = ? AND status = 'active'", key.UserID).First(&licenseKey).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, gin.H{"error": "No active license found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "License database error"})
			}
			c.Abort()
			return
		}

		// Check API key limit
		if licenseKey.MaxAPIKeys > 0 {
			var activeKeyCount int64
			db.Model(&models.APIKey{}).Where("is_active = ?", true).Count(&activeKeyCount)
			if int(activeKeyCount) > licenseKey.MaxAPIKeys {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "API key limit exceeded",
					"message": "Your license allows maximum " + string(rune(licenseKey.MaxAPIKeys)) + " API keys",
				})
				c.Abort()
				return
			}
		}

		// Add context for handlers
		c.Set("api_key", key)
		c.Set("license_key", licenseKey)
		c.Set("company_id", key.UserID) // Use UserID as CompanyID for now

		c.Next()
	}
}

// Middleware to track API usage
func TrackAPIUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get context values
		companyID, hasCompany := c.Get("company_id")
		userID, hasUser := c.Get("user_id")
		apiKey, hasAPIKey := c.Get("api_key")

		if !hasCompany {
			c.Next()
			return
		}

		// Create usage record
		usage := models.APIUsage{
			CompanyID:    companyID.(uint),
			Endpoint:     c.Request.URL.Path,
			Method:       c.Request.Method,
			StatusCode:   c.Writer.Status(),
			IPAddress:    c.ClientIP(),
			UserAgent:    c.GetHeader("User-Agent"),
			Timestamp:    time.Now(),
		}

		if hasUser {
			uid := userID.(uint)
			usage.UserID = &uid
		}

		if hasAPIKey {
			key := apiKey.(models.APIKey)
			usage.APIKeyID = &key.ID
		}

		// Save usage asynchronously (non-blocking)
		go func() {
			db.Create(&usage)
			
			// Update usage quota if needed
			var quota models.UsageQuota
			db.Where("company_id = ? AND resource_type = ?", usage.CompanyID, "api_calls").First(&quota)
			if quota.ID > 0 {
				quota.Used++
				if quota.Used >= quota.Limit {
					quota.IsOverLimit = true
				}
				db.Save(&quota)
			}
		}()

		c.Next()
	}
}
