package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

// Recurring invoice handlers
func getRecurringInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var recurringInvoices []database.RecurringInvoice
		query := db.Preload("Company").Preload("Customer").Preload("Invoices")
		
		// Filter by active status if provided
		if isActive := c.Query("active"); isActive != "" {
			query = query.Where("is_active = ?", isActive == "true")
		}
		
		if err := query.Find(&recurringInvoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, recurringInvoices)
	}
}

func createRecurringInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var recurringInvoice database.RecurringInvoice
		if err := c.ShouldBindJSON(&recurringInvoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Calculate next invoice date based on frequency
		nextDate, err := calculateNextInvoiceDate(recurringInvoice.StartDate, recurringInvoice.Frequency, recurringInvoice.IntervalValue)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid frequency or interval: " + err.Error()})
			return
		}
		recurringInvoice.NextInvoiceDate = nextDate

		if err := db.Create(&recurringInvoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load the complete recurring invoice with relations
		if err := db.Preload("Company").Preload("Customer").First(&recurringInvoice, recurringInvoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, recurringInvoice)
	}
}

func updateRecurringInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var recurringInvoice database.RecurringInvoice
		if err := db.First(&recurringInvoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Recurring invoice not found"})
			return
		}

		if err := c.ShouldBindJSON(&recurringInvoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Recalculate next invoice date if frequency or interval changed
		if c.ShouldBindJSON(&recurringInvoice) != nil {
			nextDate, err := calculateNextInvoiceDate(recurringInvoice.StartDate, recurringInvoice.Frequency, recurringInvoice.IntervalValue)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid frequency or interval: " + err.Error()})
				return
			}
			recurringInvoice.NextInvoiceDate = nextDate
		}

		if err := db.Save(&recurringInvoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load the complete recurring invoice with relations
		if err := db.Preload("Company").Preload("Customer").First(&recurringInvoice, recurringInvoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, recurringInvoice)
	}
}

func deleteRecurringInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.RecurringInvoice{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Recurring invoice deleted successfully"})
	}
}

func generateInvoicesFromRecurring(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var recurringInvoice database.RecurringInvoice
		if err := db.Preload("Company").Preload("Customer").First(&recurringInvoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Recurring invoice not found"})
			return
		}

		// Generate next invoice
		invoice, err := generateInvoiceFromRecurringData(db, recurringInvoice)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update recurring invoice
		nextDate, _ := calculateNextInvoiceDate(recurringInvoice.NextInvoiceDate, recurringInvoice.Frequency, recurringInvoice.IntervalValue)
		recurringInvoice.LastGenerated = time.Now().Format("2006-01-02")
		recurringInvoice.NextInvoiceDate = nextDate
		recurringInvoice.TotalGenerated++
		db.Save(&recurringInvoice)

		c.JSON(http.StatusCreated, invoice)
	}
}

func getRecurringInvoiceStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var stats database.RecurringInvoiceStats
		
		// Count active and inactive
		db.Model(&database.RecurringInvoice{}).Where("is_active = ?", true).Count(&stats.ActiveCount)
		db.Model(&database.RecurringInvoice{}).Where("is_active = ?", false).Count(&stats.InactiveCount)
		
		// Count due this month
		currentMonth := time.Now().Format("2006-01")
		db.Model(&database.RecurringInvoice{}).Where("next_invoice_date LIKE ? AND is_active = ?", currentMonth+"%", true).Count(&stats.ThisMonthCount)
		
		// Count due in next 7 days
		nextWeek := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
		db.Model(&database.RecurringInvoice{}).Where("next_invoice_date <= ? AND is_active = ?", nextWeek, true).Count(&stats.NextDueCount)
		
		// Calculate total monthly value
		var totalValue float64
		db.Model(&database.RecurringInvoice{}).
			Select("COALESCE(SUM(CASE WHEN frequency = 'monthly' THEN (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE recurring_invoice_id = recurring_invoices.id AND issue_date LIKE ?) " +
				"WHEN frequency = 'weekly' THEN (SELECT COALESCE(SUM(total_amount), 0) * 4 FROM invoices WHERE recurring_invoice_id = recurring_invoices.id AND issue_date LIKE ?) " +
				"WHEN frequency = 'quarterly' THEN (SELECT COALESCE(SUM(total_amount), 0) / 3 FROM invoices WHERE recurring_invoice_id = recurring_invoices.id AND issue_date LIKE ?) " +
				"WHEN frequency = 'yearly' THEN (SELECT COALESCE(SUM(total_amount), 0) / 12 FROM invoices WHERE recurring_invoice_id = recurring_invoices.id AND issue_date LIKE ?) " +
				"ELSE 0 END), 0)", currentMonth+"%", currentMonth+"%", currentMonth+"%", currentMonth+"%").
			Where("is_active = ?", true).
			Scan(&totalValue)
		stats.TotalValue = totalValue

		c.JSON(http.StatusOK, stats)
	}
}

func pauseRecurringInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Model(&database.RecurringInvoice{}).Where("id = ?", id).Update("is_active", false).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Recurring invoice paused"})
	}
}

func resumeRecurringInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Model(&database.RecurringInvoice{}).Where("id = ?", id).Update("is_active", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Recurring invoice resumed"})
	}
}

// Helper functions
func calculateNextInvoiceDate(startDate, frequency string, interval int) (string, error) {
	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return "", err
	}

	var nextDate time.Time
	switch frequency {
	case "daily":
		nextDate = start.AddDate(0, 0, interval)
	case "weekly":
		nextDate = start.AddDate(0, 0, interval*7)
	case "monthly":
		nextDate = start.AddDate(0, interval, 0)
	case "quarterly":
		nextDate = start.AddDate(0, interval*3, 0)
	case "yearly":
		nextDate = start.AddDate(interval, 0, 0)
	default:
		return "", fmt.Errorf("invalid frequency: %s", frequency)
	}

	return nextDate.Format("2006-01-02"), nil
}

func generateInvoiceFromRecurringData(db *gorm.DB, recurring database.RecurringInvoice) (*database.Invoice, error) {
	// Parse template data
	var templateData struct {
		Items []database.InvoiceItem `json:"items"`
		Notes string                  `json:"notes"`
	}
	
	if err := json.Unmarshal([]byte(recurring.TemplateData), &templateData); err != nil {
		return nil, err
	}

	// Generate invoice number
	invoiceNo := generateInvoiceNumber(db)

	// Create invoice
	invoice := database.Invoice{
		InvoiceNo:        invoiceNo,
		IssueDate:        time.Now().Format("2006-01-02"),
		CompanyID:        recurring.CompanyID,
		CustomerID:       recurring.CustomerID,
		Notes:            templateData.Notes,
		Status:           "draft",
		IsRecurring:      true,
		RecurringInvoiceID: &recurring.ID,
	}

	// Calculate totals
	subtotal := 0.0
	for _, item := range templateData.Items {
		subtotal += item.LineTotal
	}
	invoice.Subtotal = subtotal
	invoice.VATAmount = subtotal * 0.07 // 7% VAT
	invoice.TotalAmount = subtotal + invoice.VATAmount

	// Save invoice
	if err := db.Create(&invoice).Error; err != nil {
		return nil, err
	}

	// Save invoice items
	for _, item := range templateData.Items {
		item.InvoiceID = invoice.ID
		item.ID = 0 // Reset ID for new record
		if err := db.Create(&item).Error; err != nil {
			return nil, err
		}
	}

	// Load complete invoice with relations
	if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, invoice.ID).Error; err != nil {
		return nil, err
	}

	return &invoice, nil
}
