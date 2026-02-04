package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

// Product handlers
func getProducts(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var products []database.Product
		if err := db.Where("is_active = ?", true).Find(&products).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, products)
	}
}

func createProduct(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var product database.Product
		if err := c.ShouldBindJSON(&product); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&product).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, product)
	}
}

// Dashboard analytics
func getDashboardStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var stats database.DashboardStats
		
		// Total revenue
		db.Model(&database.Invoice{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalRevenue)
		
		// Unpaid amount
		db.Model(&database.Invoice{}).Where("status IN ('sent', 'overdue')").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.UnpaidAmount)
		
		// This month revenue
		currentMonth := time.Now().Format("2006-01")
		db.Model(&database.Invoice{}).Where("issue_date LIKE ? AND status = 'paid'", currentMonth+"%").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.ThisMonthRevenue)
		
		// Invoice counts
		db.Model(&database.Invoice{}).Count(&stats.TotalInvoices)
		db.Model(&database.Invoice{}).Where("status = 'paid'").Count(&stats.PaidInvoices)
		db.Model(&database.Invoice{}).Where("status IN ('sent', 'overdue')").Count(&stats.UnpaidInvoices)
		db.Model(&database.Invoice{}).Where("status = 'overdue'").Count(&stats.OverdueInvoices)
		db.Model(&database.Invoice{}).Where("is_draft = ?", true).Count(&stats.DraftInvoices)
		
		c.JSON(http.StatusOK, stats)
	}
}

// Enhanced invoice handlers with auto-save
func saveDraft(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var invoice database.Invoice
		if err := c.ShouldBindJSON(&invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		invoice.IsDraft = true
		invoice.LastSaved = time.Now().Format("2006-01-02 15:04:05")
		
		// Generate invoice number if not provided
		if invoice.InvoiceNo == "" {
			invoice.InvoiceNo = generateInvoiceNumber(db)
		}
		
		calculateInvoiceTotals(&invoice)
		
		if err := db.Save(&invoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusOK, invoice)
	}
}

// Search and filter invoices
func searchInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := db.Preload("Company").Preload("Customer").Preload("Items")
		
		// Filter by customer
		if customerID := c.Query("customer_id"); customerID != "" {
			query = query.Where("customer_id = ?", customerID)
		}
		
		// Filter by status
		if status := c.Query("status"); status != "" {
			query = query.Where("status = ?", status)
		}
		
		// Filter by date range
		if startDate := c.Query("start_date"); startDate != "" {
			query = query.Where("issue_date >= ?", startDate)
		}
		if endDate := c.Query("end_date"); endDate != "" {
			query = query.Where("issue_date <= ?", endDate)
		}
		
		// Search by invoice number or customer name
		if search := c.Query("search"); search != "" {
			query = query.Where("invoice_no ILIKE ? OR EXISTS (SELECT 1 FROM customers WHERE id = invoices.customer_id AND name ILIKE ?)", 
				"%"+search+"%", "%"+search+"%")
		}
		
		var invoices []database.Invoice
		if err := query.Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusOK, invoices)
	}
}

// Template handlers
func getInvoiceTemplates(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var templates []database.InvoiceTemplate
		if err := db.Find(&templates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, templates)
	}
}

func createInvoiceFromTemplate(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		templateID := c.Param("templateId")
		var template database.InvoiceTemplate
		if err := db.First(&template, templateID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
			return
		}
		
		// Create invoice from template
		invoice := database.Invoice{
			InvoiceNo:  generateInvoiceNumber(db),
			IssueDate:  time.Now().Format("2006-01-02"),
			CompanyID: template.CompanyID,
			CustomerID: template.CustomerID,
			Notes:      template.Notes,
			Status:     "draft",
		}
		
		calculateInvoiceTotals(&invoice)
		
		if err := db.Create(&invoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusCreated, invoice)
	}
}
