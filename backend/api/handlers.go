package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Add performance middleware
	r.Use(performanceMiddleware())

	// Companies
	r.GET("/api/companies", getCompanies(db))
	r.POST("/api/companies", createCompany(db))
	r.GET("/api/companies/:id", getCompany(db))
	r.PUT("/api/companies/:id", updateCompany(db))
	r.DELETE("/api/companies/:id", deleteCompany(db))

	// Customers
	r.GET("/api/customers", getCustomers(db))
	r.POST("/api/customers", createCustomer(db))
	r.GET("/api/customers/:id", getCustomer(db))
	r.PUT("/api/customers/:id", updateCustomer(db))
	r.DELETE("/api/customers/:id", deleteCustomer(db))

	// Products
	r.GET("/api/products", getProducts(db))
	r.POST("/api/products", createProduct(db))

	// Dashboard
	r.GET("/api/dashboard/stats", getDashboardStats(db))

	// Invoice Templates
	r.GET("/api/invoice-templates", getInvoiceTemplates(db))
	r.POST("/api/invoice-templates/:templateId/create", createInvoiceFromTemplate(db))

	// Recurring Invoices
	r.GET("/api/recurring-invoices", getRecurringInvoices(db))
	r.POST("/api/recurring-invoices", createRecurringInvoice(db))
	r.GET("/api/recurring-invoices/:id", getRecurringInvoices(db)) // Reuse for single
	r.PUT("/api/recurring-invoices/:id", updateRecurringInvoice(db))
	r.DELETE("/api/recurring-invoices/:id", deleteRecurringInvoice(db))
	r.POST("/api/recurring-invoices/:id/generate", generateInvoicesFromRecurring(db))
	r.POST("/api/recurring-invoices/:id/pause", pauseRecurringInvoice(db))
	r.POST("/api/recurring-invoices/:id/resume", resumeRecurringInvoice(db))
	r.GET("/api/recurring-invoices/stats", getRecurringInvoiceStats(db))

	// Payment Reminders
	r.GET("/api/payment-reminders", getPaymentReminders(db))
	r.POST("/api/payment-reminders", createPaymentReminder(db))
	r.POST("/api/payment-reminders/:id/send", sendPaymentReminder(db))

	// Payments
	r.GET("/api/payments", getPayments(db))
	r.POST("/api/payments", createPayment(db))
	r.PUT("/api/payments/:id", updatePayment(db))
	r.DELETE("/api/payments/:id", deletePayment(db))
	r.GET("/api/payments/stats", getPaymentStats(db))

	// Invoices - Performance optimized versions
	r.GET("/api/invoices", getInvoicesPaginated(db)) // New paginated version
	r.GET("/api/invoices/search", searchInvoices(db)) // Original search
	r.GET("/api/invoices/enhanced-search", enhancedSearch(db)) // New enhanced search
	r.GET("/api/invoices/search-optimized", searchInvoicesOptimized(db)) // Optimized search
	r.POST("/api/invoices", createInvoice(db))
	r.POST("/api/invoices/draft", saveDraft(db)) // Auto-save drafts
	r.POST("/api/invoices/:id/duplicate", duplicateInvoice(db)) // New duplicate feature
	r.GET("/api/invoices/:id", getInvoice(db))
	r.PUT("/api/invoices/:id", updateInvoice(db))
	r.DELETE("/api/invoices/:id", deleteInvoice(db))
	r.GET("/api/invoices/:id/pdf", generateInvoicePDF(db))
	r.GET("/api/invoices/:id/xml", generateInvoiceXML(db))

	// Invoice Items
	r.POST("/api/invoices/:id/items", addInvoiceItem(db))
	r.PUT("/api/invoice-items/:id", updateInvoiceItem(db))
	r.DELETE("/api/invoice-items/:id", deleteInvoiceItem(db))

	// Performance monitoring
	r.GET("/api/performance/metrics", getPerformanceMetrics(db))
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
