package routes

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"etax/internal/api/handlers/auth"
	"etax/internal/api/handlers/invoice"
	"etax/internal/api/handlers/license"
	"etax/internal/api/handlers/payment"
	"etax/internal/api/handlers/pos"
	"etax/internal/api/handlers/subscription"
	authSvc "etax/internal/services/auth"
	invoiceSvc "etax/internal/services/invoice"
	middlewareAuth "etax/internal/api/middleware/auth"
	"etax/internal/database/models"
	"etax/internal/config"
)

type HandlerDependencies struct {
	DB             *gorm.DB
	SecurityService *middlewareAuth.SecurityService
}

func SetupRoutes(r *gin.Engine, db *gorm.DB, securityService *middlewareAuth.SecurityService) {
	// Initialize services
	authService := authSvc.NewAuthService(db, securityService)
	invoiceService := invoiceSvc.NewInvoiceService(db)
	
	// Initialize handlers
	authHandler := auth.NewAuthHandler(authService)
	invoiceHndlr := invoice.NewInvoiceHandler(invoiceService)
	
	// Initialize license configuration and client
	licenseConfig := config.LoadLicenseConfig()
	var licenseClient *license.LicenseServerClient
	if licenseConfig.Enabled {
		licenseClient = license.NewLicenseServerClient(licenseConfig.ServerURL, licenseConfig.APIKey)
	}

	// Health check endpoint (no auth required)
	r.GET("/health", HealthCheck(db))
	
	// API v1 group
	v1 := r.Group("/api/v1")
	{
		// Documentation and Health
		v1.GET("/docs", GetAPIDocumentation())
		v1.GET("/health", HealthCheck(db))

		// Root info endpoint
		v1.GET("/", func(c *gin.Context) {
			c.Header("Content-Type", "text/html")
			c.String(http.StatusOK, `<!DOCTYPE html><html><head><title>E-Tax API Documentation</title><style>body { font-family: Arial, sans-serif; margin: 40px; }.endpoint { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }.method { color: #007bff; font-weight: bold; }.path { color: #28a745; }</style></head><body><h1>E-Tax API Documentation</h1><p>API is running on port 8081</p><div class="endpoint"><h2>Health Check</h2><p><span class="method">GET</span> <span class="path">/health</span></p><p>Check API health status</p></div><div class="endpoint"><h2>API Health</h2><p><span class="method">GET</span> <span class="path">/api/v1/health</span></p><p>Detailed health information</p></div><div class="endpoint"><h2>Authentication</h2><p><span class="method">POST</span> <span class="path">/api/v1/auth/login</span></p><p>User login endpoint</p></div></body></html>`)
		})

		// Public authentication routes
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/login", authHandler.Login)
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/refresh", authHandler.Refresh)
			authGroup.POST("/logout", authHandler.Logout)
		}

		// Protected routes (require authentication)
		protected := v1.Group("/")
		protected.Use(securityService.AuthMiddleware())
		{
			// License routes
			licenseGroup := protected.Group("/license")
			{
				licenseGroup.GET("/info", license.GetCompanyLicense(db))
				licenseGroup.POST("/validate", license.ValidateLicenseKey(db, licenseClient))
				licenseGroup.GET("/check/:feature", license.CheckFeatureAccess(db, licenseClient))
			}

			// Profile routes
			protected.GET("/profile", authHandler.GetProfile)
			protected.PUT("/profile", authHandler.UpdateProfile)
			protected.POST("/change-password", authHandler.ChangePassword)

			// Invoice routes
			invoices := protected.Group("/invoices")
			{
				invoices.GET("", invoiceHndlr.GetInvoices)
				invoices.POST("", invoiceHndlr.CreateInvoice)
				invoices.GET("/stats", invoiceHndlr.GetInvoiceStats)
				invoices.GET("/overdue", invoiceHndlr.GetOverdueInvoices)
				invoices.GET("/:id", invoiceHndlr.GetInvoice)
				invoices.PUT("/:id", invoiceHndlr.UpdateInvoice)
				invoices.DELETE("/:id", invoiceHndlr.DeleteInvoice)
				invoices.PUT("/:id/status", invoiceHndlr.UpdateInvoiceStatus)
			}

			// Core Data Management
			protected.GET("/companies", GetCompanies(db))
			protected.POST("/companies", CreateCompany(db))
			protected.GET("/companies/:id", GetCompany(db))
			protected.PUT("/companies/:id", UpdateCompany(db))
			protected.DELETE("/companies/:id", DeleteCompany(db))

			protected.GET("/customers", GetCustomers(db))
			protected.POST("/customers", CreateCustomer(db))
			protected.GET("/customers/:id", GetCustomer(db))
			protected.PUT("/customers/:id", UpdateCustomer(db))
			protected.DELETE("/customers/:id", DeleteCustomer(db))

			protected.GET("/pos-vendors", GetPOSVendors(db))
			protected.POST("/pos-vendors", CreatePOSVendor(db))
			protected.GET("/pos-vendors/:id", GetPOSVendor(db))
			protected.PUT("/pos-vendors/:id", UpdatePOSVendor(db))
			protected.DELETE("/pos-vendors/:id", DeletePOSVendor(db))

			// Integrations and Usage
			protected.GET("/marketplace-integrations", GetMarketplaceIntegrations(db))
			protected.POST("/marketplace-integrations", CreateMarketplaceIntegration(db))
			protected.GET("/marketplace-integrations/:id", GetMarketplaceIntegration(db))
			protected.PUT("/marketplace-integrations/:id", UpdateMarketplaceIntegration(db))
			protected.DELETE("/marketplace-integrations/:id", DeleteMarketplaceIntegration(db))

			protected.GET("/api-usage", GetAPIUsage(db))
			protected.GET("/usage-quotas", GetUsageQuotas(db))

			// Dashboard
			dashboard := protected.Group("/dashboard")
			{
				dashboard.GET("/stats", GetDashboardStats(db))
				dashboard.GET("/recent-invoices", GetRecentInvoices(db))
				dashboard.GET("/revenue", GetRevenueStats(db))
			}

			// Monetization and Others
			subscription.RegisterRoutes(protected, db)
			protected.GET("/billing/history", GetBillingHistory(db))
			protected.POST("/billing/process-payment", ProcessPayment(db))
			
			protected.GET("/products", GetProducts(db))
			protected.POST("/products", CreateProduct(db))
			protected.PUT("/products/:id", UpdateProduct(db))
			protected.DELETE("/products/:id", DeleteProduct(db))

			// Invoice templates
			protected.GET("/invoice-templates", GetInvoiceTemplates(db))
			protected.POST("/invoice-templates", CreateInvoiceTemplate(db))
			protected.PUT("/invoice-templates/:id", UpdateInvoiceTemplate(db))
			protected.DELETE("/invoice-templates/:id", DeleteInvoiceTemplate(db))

			// Payments, reminders, recurring invoices and POS/marketplace extras
			payment.RegisterRoutes(protected, db)
			invoice.RegisterRecurringRoutes(protected, db)
			pos.RegisterExtraRoutes(protected, db)

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(securityService.RequireRole("admin"))
			{
				admin.GET("/users", GetUsers(db))
				admin.POST("/users", CreateUser(db))
				admin.GET("/users/:id", GetUser(db))
				admin.PUT("/users/:id", UpdateUser(db))
				admin.DELETE("/users/:id", DeleteUser(db))

				admin.GET("/companies/all", GetAllCompanies(db))
				admin.POST("/companies/:id/approve", ApproveCompany(db))
				admin.POST("/companies/:id/suspend", SuspendCompany(db))

				admin.GET("/system/stats", GetSystemStats(db))
				admin.GET("/system/health", GetSystemHealth(db))
				admin.POST("/system/backup", CreateBackup(db))
				admin.GET("/audit-logs", GetAuditLogs(db))
				admin.GET("/security/settings", GetSecuritySettings(db))
				admin.PUT("/security/settings", UpdateSecuritySettings(db))
				admin.GET("/login-attempts", GetLoginAttempts(db))
			}
		}
	}

	// Static Documentation
	r.Static("/api/docs/static", "./docs")
}

// Health check handler
func HealthCheck(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check database connection
		sqlDB, err := db.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error":  "Database connection failed",
			})
			return
		}

		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error":  "Database ping failed",
			})
			return
		}

		// Get database stats
		stats := sqlDB.Stats()

		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"database": gin.H{
				"idle":         stats.Idle,
				"in_use":       stats.InUse,
				"max_open_conns": stats.MaxOpenConnections,
				"open_connections": stats.OpenConnections,
			},
			"performance": gin.H{
				"request_count": 0,
				"average_time": 0,
				"slow_requests": 0,
				"error_count": 0,
				"last_request": "",
				"memory_usage_mb": 0,
			},
		})
	}
}

// Placeholder handlers for existing functionality
// These would be implemented with proper service layer


func GetAllCompanies(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page := 1
		limit := 20
		search := ""

		if p := c.Query("page"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
				page = parsed
			}
		}

		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		search = c.Query("search")

		var companies []database.Company
		var total int64

		query := db.Model(&database.Company{})
		
		if search != "" {
			query = query.Where("company_name ILIKE ? OR tax_id ILIKE ? OR email ILIKE ?", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
		}

		// Count total records
		query.Count(&total)

		// Get paginated results
		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&companies).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch companies"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"companies": companies,
			"total": total,
			"page": page,
			"limit": limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		})
	}
}


func GetRecentInvoices(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetRevenueStats(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetUsers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page := 1
		limit := 20
		search := ""

		if p := c.Query("page"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
				page = parsed
			}
		}

		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		search = c.Query("search")

		var users []database.User
		var total int64

		query := db.Model(&database.User{})
		
		if search != "" {
			searchPattern := "%" + search + "%"
			query = query.Where("username ILIKE ? OR email ILIKE ? OR first_name ILIKE ? OR last_name ILIKE ?", 
				searchPattern, searchPattern, searchPattern, searchPattern)
		}

		// Count total records
		query.Count(&total)

		// Get paginated results
		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"users": users,
			"total": total,
			"page": page,
			"limit": limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		})
	}
}
func CreateUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetSystemStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user statistics
		var totalUsers int64
		var activeUsers int64
		
		db.Model(&database.User{}).Count(&totalUsers)
		db.Model(&database.User{}).Where("is_active = ?", true).Count(&activeUsers)
		
		// Get company statistics
		var totalCompanies int64
		db.Model(&database.Company{}).Count(&totalCompanies)
		
		// Get invoice statistics
		var totalInvoices int64
		var draftInvoices int64
		var sentInvoices int64
		
		db.Model(&database.Invoice{}).Count(&totalInvoices)
		db.Model(&database.Invoice{}).Where("status = ?", "draft").Count(&draftInvoices)
		db.Model(&database.Invoice{}).Where("status IN ?", []string{"sent", "paid"}).Count(&sentInvoices)
		
		// Get recent activity (logins in last 24 hours)
		var recentLogins int64
		twentyFourHoursAgo := time.Now().Add(-24 * time.Hour)
		db.Model(&database.LoginAttempt{}).Where("success = ? AND created_at >= ?", true, twentyFourHoursAgo).Count(&recentLogins)
		
		systemStats := gin.H{
			"users": gin.H{
				"total": totalUsers,
				"active": activeUsers,
			},
			"companies": gin.H{
				"total": totalCompanies,
			},
			"invoices": gin.H{
				"total": totalInvoices,
				"draft": draftInvoices,
				"sent": sentInvoices,
			},
			"activity": gin.H{
				"recent_logins": recentLogins,
			},
		}

		c.JSON(http.StatusOK, gin.H{
			"stats": systemStats,
		})
	}
}
func GetSystemHealth(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get database connection stats
		sqlDB, err := db.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"health": gin.H{
					"database": gin.H{
						"status": "error",
						"message": "Database connection failed",
					},
					"server": gin.H{
						"status": "error",
						"timestamp": time.Now().Format(time.RFC3339),
						"uptime": "unknown",
					},
				},
			})
			return
		}

		// Test database connection
		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"health": gin.H{
					"database": gin.H{
						"status": "error",
						"message": "Database ping failed",
					},
					"server": gin.H{
						"status": "error",
						"timestamp": time.Now().Format(time.RFC3339),
						"uptime": "unknown",
					},
				},
			})
			return
		}

		// Get database stats
		stats := sqlDB.Stats()

		// Get system information in expected format
		healthInfo := gin.H{
			"health": gin.H{
				"database": gin.H{
					"status": "healthy",
					"open_connections": stats.OpenConnections,
					"in_use": stats.InUse,
					"idle": stats.Idle,
					"wait_count": stats.WaitCount,
					"wait_duration": stats.WaitDuration.String(),
					"max_idle_closed": stats.MaxIdleClosed,
					"max_lifetime_closed": stats.MaxLifetimeClosed,
				},
				"server": gin.H{
					"status": "healthy",
					"timestamp": time.Now().Format(time.RFC3339),
					"uptime": "0s", // TODO: Implement actual uptime tracking
				},
			},
		}

		c.JSON(http.StatusOK, healthInfo)
	}
}
func CreateBackup(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetAuditLogs(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page := 1
		limit := 50
		action := ""
		userID := ""

		if p := c.Query("page"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
				page = parsed
			}
		}

		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		action = c.Query("action")
		userID = c.Query("user_id")

		var logs []database.AuditLog
		var total int64

		query := db.Model(&database.AuditLog{})
		
		if action != "" {
			query = query.Where("action ILIKE ?", "%"+action+"%")
		}
		
		if userID != "" {
			query = query.Where("user_id = ?", userID)
		}

		// Count total records
		query.Count(&total)

		// Get paginated results
		offset := (page - 1) * limit
		if err := query.Preload("User").Offset(offset).Limit(limit).Order("created_at DESC").Find(&logs).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audit logs"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"logs": logs,
			"total": total,
			"page": page,
			"limit": limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		})
	}
}
func GetSecuritySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings database.SecuritySettings
		
		// Get the first (and only) security settings record
		if err := db.First(&settings).Error; err != nil {
			// If no settings exist, create default ones
			defaultSettings := database.SecuritySettings{
				PasswordMinLength:    8,
				RequireStrongPassword: true,
				SessionTimeout:       86400, // 24 hours
				MaxLoginAttempts:     5,
				LockoutDuration:      900, // 15 minutes
				RequireTwoFactor:     false,
				IPWhitelist:          "[]",
			}
			
			if err := db.Create(&defaultSettings).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default security settings"})
				return
			}
			
			settings = defaultSettings
		}

		c.JSON(http.StatusOK, gin.H{
			"settings": settings,
		})
	}
}

func UpdateSecuritySettings(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var settings database.SecuritySettings
		
		if err := c.ShouldBindJSON(&settings); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get existing settings
		var existingSettings database.SecuritySettings
		if err := db.First(&existingSettings).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Security settings not found"})
			return
		}

		// Update settings
		existingSettings.PasswordMinLength = settings.PasswordMinLength
		existingSettings.RequireStrongPassword = settings.RequireStrongPassword
		existingSettings.SessionTimeout = settings.SessionTimeout
		existingSettings.MaxLoginAttempts = settings.MaxLoginAttempts
		existingSettings.LockoutDuration = settings.LockoutDuration
		existingSettings.RequireTwoFactor = settings.RequireTwoFactor
		existingSettings.IPWhitelist = settings.IPWhitelist
		existingSettings.UpdatedAt = time.Now()

		if err := db.Save(&existingSettings).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update security settings"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"settings": existingSettings,
			"message": "Security settings updated successfully",
		})
	}
}
func GetLoginAttempts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		page := 1
		limit := 50
		success := ""

		if p := c.Query("page"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
				page = parsed
			}
		}

		if l := c.Query("limit"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				limit = parsed
			}
		}

		success = c.Query("success")

		var attempts []database.LoginAttempt
		var total int64

		query := db.Model(&database.LoginAttempt{})
		
		if success != "" {
			if success == "true" {
				query = query.Where("success = ?", true)
			} else if success == "false" {
				query = query.Where("success = ?", false)
			}
		}

		// Count total records
		query.Count(&total)

		// Get paginated results
		offset := (page - 1) * limit
		if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&attempts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch login attempts"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"attempts": attempts,
			"total": total,
			"page": page,
			"limit": limit,
			"total_pages": (total + int64(limit) - 1) / int64(limit),
		})
	}
}
func ApproveCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func SuspendCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetUserSubscriptions(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateSubscription(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CancelSubscription(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetBillingHistory(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func ProcessPayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

// POS Vendor handlers
func GetPOSVendors(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var vendors []database.POSVendorConfig
		if err := db.Where("is_active = ?", true).Find(&vendors).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch POS vendors"})
			return
		}

		c.JSON(http.StatusOK, vendors)
	}
}

func CreatePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var vendor database.POSVendorConfig
		if err := c.ShouldBindJSON(&vendor); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create POS vendor"})
			return
		}

		c.JSON(http.StatusCreated, vendor)
	}
}

func GetPOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		c.JSON(http.StatusOK, vendor)
	}
}

func UpdatePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		if err := c.ShouldBindJSON(&vendor); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update POS vendor"})
			return
		}

		c.JSON(http.StatusOK, vendor)
	}
}

func DeletePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.POSVendorConfig{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete POS vendor"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "POS vendor deleted successfully"})
	}
}

func GetWhiteLabelSettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateWhiteLabelSettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CustomizeWhiteLabel(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetPOSIntegrations(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreatePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

// Marketplace Integration handlers
func GetMarketplaceIntegrations(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var integrations []database.MarketplaceIntegration
		if err := db.Where("is_active = ?", true).Find(&integrations).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch marketplace integrations"})
			return
		}

		c.JSON(http.StatusOK, integrations)
	}
}

func CreateMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var integration database.MarketplaceIntegration
		if err := c.ShouldBindJSON(&integration); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create marketplace integration"})
			return
		}

		c.JSON(http.StatusCreated, integration)
	}
}

func GetMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var integration database.MarketplaceIntegration
		if err := db.First(&integration, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Marketplace integration not found"})
			return
		}

		c.JSON(http.StatusOK, integration)
	}
}

func UpdateMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var integration database.MarketplaceIntegration
		if err := db.First(&integration, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Marketplace integration not found"})
			return
		}

		if err := c.ShouldBindJSON(&integration); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update marketplace integration"})
			return
		}

		c.JSON(http.StatusOK, integration)
	}
}

func DeleteMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.MarketplaceIntegration{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete marketplace integration"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Marketplace integration deleted successfully"})
	}
}
func UpdatePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeletePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

// API Usage handlers
func GetAPIUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		period := c.DefaultQuery("period", "24h")
		
		var usage []database.APIUsage
		query := db.Model(&database.APIUsage{})
		
		// Filter by period
		switch period {
		case "1h":
			oneHourAgo := time.Now().Add(-1 * time.Hour)
			query = query.Where("timestamp >= ?", oneHourAgo)
		case "24h":
			twentyFourHoursAgo := time.Now().Add(-24 * time.Hour)
			query = query.Where("timestamp >= ?", twentyFourHoursAgo)
		case "7d":
			sevenDaysAgo := time.Now().Add(-7 * 24 * time.Hour)
			query = query.Where("timestamp >= ?", sevenDaysAgo)
		case "30d":
			thirtyDaysAgo := time.Now().Add(-30 * 24 * time.Hour)
			query = query.Where("timestamp >= ?", thirtyDaysAgo)
		}
		
		if err := query.Order("timestamp DESC").Limit(1000).Find(&usage).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch API usage"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"usage": usage,
		})
	}
}

func GetUsageQuotas(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var quotas []database.UsageQuota
		if err := db.Find(&quotas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch usage quotas"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"quotas": quotas,
		})
	}
}

func GetProductCategories(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetRecurringInvoices(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateRecurringInvoice(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateRecurringInvoice(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteRecurringInvoice(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GenerateRecurringInvoice(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetPaymentReminders(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreatePaymentReminder(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdatePaymentReminder(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeletePaymentReminder(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func SendPaymentReminder(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetPayments(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreatePayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdatePayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeletePayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }


func GetPerformanceMetrics(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPerformanceHealth(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPerformanceLogs(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetAPIDocumentation() gin.HandlerFunc { return placeholderHandler }

var placeholderHandler = func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Endpoint not yet implemented with new architecture"})
}
