package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"etax/internal/api/handlers/auth"
	"etax/internal/api/handlers/invoice"
	authSvc "etax/internal/services/auth"
	invoiceSvc "etax/internal/services/invoice"
	middlewareAuth "etax/internal/api/middleware/auth"
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
	invoiceHandler := invoice.NewInvoiceHandler(invoiceService)

	// Health check endpoint (no auth required)
	r.GET("/health", HealthCheck(db))
	r.GET("/api/health", HealthCheck(db))
	
	// Simple docs endpoint for browsers
	r.GET("/api", func(c *gin.Context) {
		c.Header("Content-Type", "text/html")
		c.String(http.StatusOK, `<!DOCTYPE html><html><head><title>E-Tax API Documentation</title><style>body { font-family: Arial, sans-serif; margin: 40px; }.endpoint { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }.method { color: #007bff; font-weight: bold; }.path { color: #28a745; }</style></head><body><h1>E-Tax API Documentation</h1><p>API is running on port 8080</p><div class="endpoint"><h2>Health Check</h2><p><span class="method">GET</span> <span class="path">/health</span></p><p>Check API health status</p></div><div class="endpoint"><h2>API Health</h2><p><span class="method">GET</span> <span class="path">/api/health</span></p><p>Detailed health information</p></div><div class="endpoint"><h2>Authentication</h2><p><span class="method">POST</span> <span class="path">/api/auth/login</span></p><p>User login endpoint</p></div><div class="endpoint"><h2>Companies</h2><p><span class="method">GET</span> <span class="path">/api/companies</span></p><p>Get companies (requires auth)</p></div></body></html>`)
	})

	// Public routes (no authentication required)
	public := r.Group("/api")
	{
		// Authentication routes
		public.POST("/auth/login", authHandler.Login)
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/refresh", authHandler.Refresh)
		public.POST("/auth/logout", authHandler.Logout)
	}

	// Protected routes (authentication required)
	protected := r.Group("/api")
	protected.Use(securityService.AuthMiddleware())
	{
		// User profile routes
		protected.GET("/profile", authHandler.GetProfile)
		protected.PUT("/profile", authHandler.UpdateProfile)
		protected.POST("/change-password", authHandler.ChangePassword)

		// Invoice routes
		protected.GET("/invoices", invoiceHandler.GetInvoices)
		protected.POST("/invoices", invoiceHandler.CreateInvoice)
		protected.GET("/invoices/:id", invoiceHandler.GetInvoice)
		protected.PUT("/invoices/:id", invoiceHandler.UpdateInvoice)
		protected.DELETE("/invoices/:id", invoiceHandler.DeleteInvoice)
		protected.GET("/invoices/stats", invoiceHandler.GetInvoiceStats)
		protected.PUT("/invoices/:id/status", invoiceHandler.UpdateInvoiceStatus)
		protected.GET("/invoices/overdue", invoiceHandler.GetOverdueInvoices)

		// Company routes
		protected.GET("/companies", GetCompanies(db))
		protected.POST("/companies", CreateCompany(db))
		protected.GET("/companies/:id", GetCompany(db))
		protected.PUT("/companies/:id", UpdateCompany(db))
		protected.DELETE("/companies/:id", DeleteCompany(db))

		// Customer routes
		protected.GET("/customers", GetCustomers(db))
		protected.POST("/customers", CreateCustomer(db))
		protected.GET("/customers/:id", GetCustomer(db))
		protected.PUT("/customers/:id", UpdateCustomer(db))
		protected.DELETE("/customers/:id", DeleteCustomer(db))

		// Dashboard routes
		protected.GET("/dashboard/stats", GetDashboardStats(db))
		protected.GET("/dashboard/recent-invoices", GetRecentInvoices(db))
		protected.GET("/dashboard/revenue", GetRevenueStats(db))

		// Admin routes (admin role required)
		adminGroup := protected.Group("/admin")
		adminGroup.Use(securityService.RequireRole("admin"))
		{
			// User management
			adminGroup.GET("/users", GetUsers(db))
			adminGroup.POST("/users", CreateUser(db))
			adminGroup.GET("/users/:id", GetUser(db))
			adminGroup.PUT("/users/:id", UpdateUser(db))
			adminGroup.DELETE("/users/:id", DeleteUser(db))

			// System management
			adminGroup.GET("/system/stats", GetSystemStats(db))
			adminGroup.GET("/system/health", GetSystemHealth(db))
			adminGroup.POST("/system/backup", CreateBackup(db))
			adminGroup.GET("/audit-logs", GetAuditLogs(db))
			adminGroup.GET("/security/settings", GetSecuritySettings(db))
			adminGroup.PUT("/security/settings", UpdateSecuritySettings(db))
			adminGroup.GET("/login-attempts", GetLoginAttempts(db))
			adminGroup.POST("/companies/:id/approve", ApproveCompany(db))
			adminGroup.POST("/companies/:id/suspend", SuspendCompany(db))
		}

		// Monetization routes
		protected.GET("/subscription-plans", GetSubscriptionPlans(db))
		protected.POST("/subscriptions", CreateSubscription(db))
		protected.GET("/subscriptions", GetUserSubscriptions(db))
		protected.PUT("/subscriptions/:id", UpdateSubscription(db))
		protected.DELETE("/subscriptions/:id", CancelSubscription(db))
		protected.GET("/billing/history", GetBillingHistory(db))
		protected.POST("/billing/process-payment", ProcessPayment(db))

		// White-label routes
		protected.GET("/white-label/settings", GetWhiteLabelSettings(db))
		protected.PUT("/white-label/settings", UpdateWhiteLabelSettings(db))
		protected.POST("/white-label/customize", CustomizeWhiteLabel(db))

		// POS integration routes
		protected.GET("/pos/vendors", GetPOSVendors(db))
		protected.POST("/pos/vendors", CreatePOSVendor(db))
		protected.PUT("/pos/vendors/:id", UpdatePOSVendor(db))
		protected.DELETE("/pos/vendors/:id", DeletePOSVendor(db))
		protected.GET("/pos/integrations", GetPOSIntegrations(db))
		protected.POST("/pos/integrations", CreatePOSIntegration(db))
		protected.PUT("/pos/integrations/:id", UpdatePOSIntegration(db))
		protected.DELETE("/pos/integrations/:id", DeletePOSIntegration(db))

		// Marketplace integration routes
		protected.GET("/marketplace/integrations", GetMarketplaceIntegrations(db))
		protected.POST("/marketplace/integrations", CreateMarketplaceIntegration(db))
		protected.PUT("/marketplace/integrations/:id", UpdateMarketplaceIntegration(db))
		protected.DELETE("/marketplace/integrations/:id", DeleteMarketplaceIntegration(db))

		// Product catalog routes
		protected.GET("/products", GetProducts(db))
		protected.POST("/products", CreateProduct(db))
		protected.PUT("/products/:id", UpdateProduct(db))
		protected.DELETE("/products/:id", DeleteProduct(db))
		protected.GET("/products/categories", GetProductCategories(db))

		// Recurring invoice routes
		protected.GET("/recurring-invoices", GetRecurringInvoices(db))
		protected.POST("/recurring-invoices", CreateRecurringInvoice(db))
		protected.PUT("/recurring-invoices/:id", UpdateRecurringInvoice(db))
		protected.DELETE("/recurring-invoices/:id", DeleteRecurringInvoice(db))
		protected.POST("/recurring-invoices/:id/generate", GenerateRecurringInvoice(db))

		// Payment reminder routes
		protected.GET("/payment-reminders", GetPaymentReminders(db))
		protected.POST("/payment-reminders", CreatePaymentReminder(db))
		protected.PUT("/payment-reminders/:id", UpdatePaymentReminder(db))
		protected.DELETE("/payment-reminders/:id", DeletePaymentReminder(db))
		protected.POST("/payment-reminders/:id/send", SendPaymentReminder(db))

		// Payment routes
		protected.GET("/payments", GetPayments(db))
		protected.POST("/payments", CreatePayment(db))
		protected.GET("/payments/:id", GetPayment(db))
		protected.PUT("/payments/:id", UpdatePayment(db))
		protected.DELETE("/payments/:id", DeletePayment(db))

		// Invoice template routes
		protected.GET("/invoice-templates", GetInvoiceTemplates(db))
		protected.POST("/invoice-templates", CreateInvoiceTemplate(db))
		protected.PUT("/invoice-templates/:id", UpdateInvoiceTemplate(db))
		protected.DELETE("/invoice-templates/:id", DeleteInvoiceTemplate(db))

		// Performance monitoring routes
		protected.GET("/performance/metrics", GetPerformanceMetrics(db))
		protected.GET("/performance/health", GetPerformanceHealth(db))
		protected.GET("/performance/logs", GetPerformanceLogs(db))
	}

	// API documentation
	r.GET("/api/docs", GetAPIDocumentation())
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

func GetCompanies(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetCustomers(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateCustomer(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetCustomer(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateCustomer(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteCustomer(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetDashboardStats(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetRecentInvoices(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetRevenueStats(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetUsers(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteUser(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetSystemStats(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetSystemHealth(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateBackup(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetAuditLogs(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetSecuritySettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateSecuritySettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetLoginAttempts(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func ApproveCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func SuspendCompany(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetSubscriptionPlans(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateSubscription(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetUserSubscriptions(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateSubscription(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CancelSubscription(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetBillingHistory(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func ProcessPayment(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetWhiteLabelSettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateWhiteLabelSettings(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CustomizeWhiteLabel(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetPOSVendors(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreatePOSVendor(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdatePOSVendor(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeletePOSVendor(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPOSIntegrations(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreatePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdatePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeletePOSIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetMarketplaceIntegrations(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetProducts(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateProduct(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateProduct(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteProduct(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
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

func GetInvoiceTemplates(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func CreateInvoiceTemplate(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func UpdateInvoiceTemplate(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func DeleteInvoiceTemplate(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetPerformanceMetrics(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPerformanceHealth(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }
func GetPerformanceLogs(db *gorm.DB) gin.HandlerFunc { return placeholderHandler }

func GetAPIDocumentation() gin.HandlerFunc { return placeholderHandler }

var placeholderHandler = func(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Endpoint not yet implemented with new architecture"})
}
