package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB, securityService *security.SecurityService) {
	// Authentication routes (no auth required)
	r.POST("/api/auth/login", login(securityService, db))
	r.POST("/api/auth/register", register(securityService, db))
	r.POST("/api/auth/refresh", refresh(securityService, db))
	r.POST("/api/auth/logout", logout(securityService, db))

	// Public routes (no authentication required)
	r.GET("/health", healthCheck(db))
	r.GET("/api/health", healthCheck(db))

	// Protected routes (authentication required)
	authGroup := r.Group("/api")
	authGroup.Use(securityService.AuthMiddleware())
	{
		// User profile routes
		authGroup.GET("/profile", getProfile(db))
		authGroup.PUT("/profile", updateProfile(securityService, db))
		authGroup.POST("/change-password", changePassword(securityService, db))

		// Admin only routes
		adminGroup := authGroup.Group("/admin")
		adminGroup.Use(security.RequireRole("admin"))
		{
			adminGroup.GET("/users", getUsers(db))
			adminGroup.POST("/users", createUser(db))
			adminGroup.PUT("/users/:id", updateUser(db))
			adminGroup.DELETE("/users/:id", deleteUser(db))
			adminGroup.GET("/audit-logs", getAuditLogs(db))
			adminGroup.GET("/security-settings", getSecuritySettings(db))
			adminGroup.PUT("/security-settings", updateSecuritySettings(db))
		}

		// Monetization routes
		authGroup.GET("/subscription-plans", getSubscriptionPlans(db))
		authGroup.GET("/subscription", getCompanySubscription(db))
		authGroup.POST("/subscription", createCompanySubscription(db))
		authGroup.PUT("/subscription", updateCompanySubscription(db))
		authGroup.POST("/subscription/cancel", cancelCompanySubscription(db))
		authGroup.GET("/usage-quotas", getUsageQuotas(db))
		authGroup.GET("/api-usage", getAPIUsage(db))
		authGroup.GET("/billing-invoices", getBillingInvoices(db))
		authGroup.POST("/billing-invoices", createBillingInvoice(db))

		// White-label routes
		authGroup.GET("/white-label", getWhiteLabelConfig(db))
		authGroup.PUT("/white-label", updateWhiteLabelConfig(db))

		// POS vendor routes
		authGroup.GET("/pos-vendors", getPOSVendors(db))
		authGroup.POST("/pos-vendors", createPOSVendor(db))
		authGroup.PUT("/pos-vendors/:id", updatePOSVendor(db))
		authGroup.POST("/pos-vendors/:id/activate", activatePOSVendor(db))
		authGroup.POST("/pos-vendors/:id/deactivate", deactivatePOSVendor(db))
		authGroup.GET("/pos-vendors/:id/invoices", getPOSVendorInvoices(db))

		// Marketplace integration routes
		authGroup.GET("/marketplace-integrations", getMarketplaceIntegrations(db))
		authGroup.POST("/marketplace-integrations", createMarketplaceIntegration(db))
		authGroup.PUT("/marketplace-integrations/:id", updateMarketplaceIntegration(db))
		authGroup.POST("/marketplace-integrations/:id/test", testMarketplaceIntegration(db))
		authGroup.POST("/marketplace-integrations/:id/disable", disableMarketplaceIntegration(db))
		authGroup.POST("/pos-vendors/:id/generate-api-key", generatePOSVendorAPIKey(db))

		// Original routes (now protected)
		// Companies
		authGroup.GET("/companies", getCompanies(db))
		authGroup.POST("/companies", createCompany(db))
		authGroup.GET("/companies/:id", getCompany(db))
		authGroup.PUT("/companies/:id", updateCompany(db))
		authGroup.DELETE("/companies/:id", deleteCompany(db))

		// Customers
		authGroup.GET("/customers", getCustomers(db))
		authGroup.POST("/customers", createCustomer(db))
		authGroup.GET("/customers/:id", getCustomer(db))
		authGroup.PUT("/customers/:id", updateCustomer(db))
		authGroup.DELETE("/customers/:id", deleteCustomer(db))

		// Products
		authGroup.GET("/products", getProducts(db))
		authGroup.POST("/products", createProduct(db))

		// Dashboard
		authGroup.GET("/dashboard/stats", getDashboardStats(db))

		// Invoice Templates
		authGroup.GET("/invoice-templates", getInvoiceTemplates(db))
		authGroup.POST("/invoice-templates/:templateId/create", createInvoiceFromTemplate(db))

		// Recurring Invoices
		authGroup.GET("/recurring-invoices", getRecurringInvoices(db))
		authGroup.POST("/recurring-invoices", createRecurringInvoice(db))
		authGroup.GET("/recurring-invoices/:id", getRecurringInvoices(db)) // Reuse for single
		authGroup.PUT("/recurring-invoices/:id", updateRecurringInvoice(db))
		authGroup.DELETE("/recurring-invoices/:id", deleteRecurringInvoice(db))
		authGroup.POST("/recurring-invoices/:id/generate", generateInvoicesFromRecurring(db))
		authGroup.POST("/recurring-invoices/:id/pause", pauseRecurringInvoice(db))
		authGroup.POST("/recurring-invoices/:id/resume", resumeRecurringInvoice(db))
		authGroup.GET("/recurring-invoices/stats", getRecurringInvoiceStats(db))

		// Payment Reminders
		authGroup.GET("/payment-reminders", getPaymentReminders(db))
		authGroup.POST("/payment-reminders", createPaymentReminder(db))
		authGroup.POST("/payment-reminders/:id/send", sendPaymentReminder(db))

		// Payments
		authGroup.GET("/payments", getPayments(db))
		authGroup.POST("/payments", createPayment(db))
		authGroup.PUT("/payments/:id", updatePayment(db))
		authGroup.DELETE("/payments/:id", deletePayment(db))
		authGroup.GET("/payments/stats", getPaymentStats(db))

		// Invoices - Performance optimized versions
		authGroup.GET("/invoices", getInvoicesPaginated(db)) // New paginated version
		authGroup.GET("/invoices/search", searchInvoices(db)) // Original search
		authGroup.GET("/invoices/enhanced-search", enhancedSearch(db)) // New enhanced search
		authGroup.GET("/invoices/search-optimized", searchInvoicesOptimized(db)) // Optimized search
		authGroup.POST("/invoices", createInvoice(db))
		authGroup.POST("/invoices/draft", saveDraft(db)) // Auto-save drafts
		authGroup.POST("/invoices/:id/duplicate", duplicateInvoice(db)) // New duplicate feature
		authGroup.GET("/invoices/:id", getInvoice(db))
		authGroup.PUT("/invoices/:id", updateInvoice(db))
		authGroup.DELETE("/invoices/:id", deleteInvoice(db))
		authGroup.GET("/invoices/:id/pdf", generateInvoicePDF(db))
		authGroup.GET("/invoices/:id/xml", generateInvoiceXML(db))

		// Invoice Items
		authGroup.POST("/invoices/:id/items", addInvoiceItem(db))
		authGroup.PUT("/invoice-items/:id", updateInvoiceItem(db))
		authGroup.DELETE("/invoice-items/:id", deleteInvoiceItem(db))

		// Performance monitoring
		authGroup.GET("/performance/metrics", getPerformanceMetrics(db))
	}
}

// Company handlers
func getCompanies(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var companies []database.Company
		if err := db.Find(&companies).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, companies)
	}
}

func createCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var company database.Company
		if err := c.ShouldBindJSON(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, company)
	}
}

func getCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var company database.Company
		if err := db.First(&company, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		c.JSON(http.StatusOK, company)
	}
}

func updateCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var company database.Company
		if err := db.First(&company, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}
		if err := c.ShouldBindJSON(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Save(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, company)
	}
}

func deleteCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.Company{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Company deleted successfully"})
	}
}

// Customer handlers
func getCustomers(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var customers []database.Customer
		if err := db.Find(&customers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, customers)
	}
}

func createCustomer(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var customer database.Customer
		if err := c.ShouldBindJSON(&customer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&customer).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, customer)
	}
}

func getCustomer(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var customer database.Customer
		if err := db.First(&customer, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		c.JSON(http.StatusOK, customer)
	}
}

func updateCustomer(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var customer database.Customer
		if err := db.First(&customer, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Customer not found"})
			return
		}
		if err := c.ShouldBindJSON(&customer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Save(&customer).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, customer)
	}
}

func deleteCustomer(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.Customer{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Customer deleted successfully"})
	}
}
