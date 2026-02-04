package api

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

// Payment reminder handlers
func getPaymentReminders(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var reminders []database.PaymentReminder
		query := db.Preload("Invoice").Preload("Invoice.Customer")
		
		// Filter by invoice ID if provided
		if invoiceID := c.Query("invoice_id"); invoiceID != "" {
			query = query.Where("invoice_id = ?", invoiceID)
		}
		
		// Filter by sent status if provided
		if isSent := c.Query("is_sent"); isSent != "" {
			query = query.Where("is_sent = ?", isSent == "true")
		}
		
		// Filter by reminder type if provided
		if reminderType := c.Query("reminder_type"); reminderType != "" {
			query = query.Where("reminder_type = ?", reminderType)
		}
		
		if err := query.Find(&reminders).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, reminders)
	}
}

func createPaymentReminder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var reminder database.PaymentReminder
		if err := c.ShouldBindJSON(&reminder); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Create(&reminder).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load complete reminder with relations
		if err := db.Preload("Invoice").Preload("Invoice.Customer").First(&reminder, reminder.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, reminder)
	}
}

func sendPaymentReminder(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var reminder database.PaymentReminder
		if err := db.Preload("Invoice").Preload("Invoice.Customer").First(&reminder, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Reminder not found"})
			return
		}

		// Send email (mock implementation)
		emailSent := sendEmailReminder(reminder)
		
		// Update reminder status
		reminder.IsSent = true
		reminder.SentDate = time.Now().Format("2006-01-02 15:04:05")
		reminder.EmailSent = emailSent
		
		if err := db.Save(&reminder).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Reminder sent successfully",
			"email_sent": emailSent,
		})
	}
}

// Payment handlers
func getPayments(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payments []database.Payment
		query := db.Preload("Invoice").Preload("Invoice.Customer")
		
		// Filter by invoice ID if provided
		if invoiceID := c.Query("invoice_id"); invoiceID != "" {
			query = query.Where("invoice_id = ?", invoiceID)
		}
		
		// Filter by payment date range if provided
		if startDate := c.Query("start_date"); startDate != "" {
			query = query.Where("payment_date >= ?", startDate)
		}
		if endDate := c.Query("end_date"); endDate != "" {
			query = query.Where("payment_date <= ?", endDate)
		}
		
		if err := query.Find(&payments).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, payments)
	}
}

func createPayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var payment database.Payment
		if err := c.ShouldBindJSON(&payment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start transaction
		tx := db.Begin()

		// Create payment record
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice payment status
		if err := updateInvoicePaymentStatus(tx, payment.InvoiceID); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load complete payment with relations
		if err := db.Preload("Invoice").Preload("Invoice.Customer").First(&payment, payment.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, payment)
	}
}

func updatePayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var payment database.Payment
		if err := db.First(&payment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}

		if err := c.ShouldBindJSON(&payment); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Start transaction
		tx := db.Begin()

		// Update payment
		if err := tx.Save(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice payment status
		if err := updateInvoicePaymentStatus(tx, payment.InvoiceID); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, payment)
	}
}

func deletePayment(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var payment database.Payment
		if err := db.First(&payment, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
			return
		}

		// Start transaction
		tx := db.Begin()

		// Delete payment
		if err := tx.Delete(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice payment status
		if err := updateInvoicePaymentStatus(tx, payment.InvoiceID); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Commit transaction
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Payment deleted successfully"})
	}
}

func getPaymentStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var stats database.PaymentStats
		
		// Calculate total paid amount
		db.Model(&database.Payment{}).Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalPaid)
		
		// Calculate total unpaid amount
		db.Model(&database.Invoice{}).Where("payment_status IN ('unpaid', 'partial')").Select("COALESCE(SUM(total_amount - paid_amount), 0)").Scan(&stats.TotalUnpaid)
		
		// Calculate overdue amount
		db.Model(&database.Invoice{}).Where("payment_status IN ('unpaid', 'partial') AND due_date < ?", time.Now().Format("2006-01-02")).Select("COALESCE(SUM(total_amount - paid_amount), 0)").Scan(&stats.OverdueAmount)
		
		// Calculate this month paid amount
		currentMonth := time.Now().Format("2006-01")
		db.Model(&database.Payment{}).Where("payment_date LIKE ?", currentMonth+"%").Select("COALESCE(SUM(amount), 0)").Scan(&stats.ThisMonthPaid)
		
		// Count invoice statuses
		db.Model(&database.Invoice{}).Where("payment_status = 'paid'").Count(&stats.PaidInvoices)
		db.Model(&database.Invoice{}).Where("payment_status IN ('unpaid', 'partial')").Count(&stats.UnpaidInvoices)
		db.Model(&database.Invoice{}).Where("payment_status IN ('unpaid', 'partial') AND due_date < ?", time.Now().Format("2006-01-02")).Count(&stats.OverdueInvoices)

		c.JSON(http.StatusOK, stats)
	}
}

// Invoice duplication handler
func duplicateInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var originalInvoice database.Invoice
		if err := db.Preload("Items").Preload("Company").Preload("Customer").First(&originalInvoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		// Create duplicated invoice
		duplicatedInvoice := database.Invoice{
			InvoiceNo:      generateInvoiceNumber(db),
			IssueDate:      time.Now().Format("2006-01-02"),
			CompanyID:      originalInvoice.CompanyID,
			CustomerID:     originalInvoice.CustomerID,
			Subtotal:       originalInvoice.Subtotal,
			VATAmount:      originalInvoice.VATAmount,
			TotalAmount:    originalInvoice.TotalAmount,
			Status:         "draft",
			Notes:          originalInvoice.Notes,
			PaymentStatus:  "unpaid",
		}

		// Save duplicated invoice
		if err := db.Create(&duplicatedInvoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Duplicate invoice items
		for _, item := range originalInvoice.Items {
			duplicatedItem := database.InvoiceItem{
				InvoiceID:   duplicatedInvoice.ID,
				ProductName: item.ProductName,
				Description: item.Description,
				Quantity:    item.Quantity,
				UnitPrice:   item.UnitPrice,
				LineTotal:   item.LineTotal,
			}
			if err := db.Create(&duplicatedItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		// Load complete duplicated invoice
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&duplicatedInvoice, duplicatedInvoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, duplicatedInvoice)
	}
}

// Enhanced search handler
func enhancedSearch(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var invoices []database.InvoiceWithPayments
		query := db.Preload("Company").Preload("Customer").Preload("Items").Preload("Payments").Preload("Reminders")
		
		// Get search parameters
		search := c.Query("search")
		customerID := c.Query("customer_id")
		status := c.Query("status")
		paymentStatus := c.Query("payment_status")
		minAmount := c.Query("min_amount")
		maxAmount := c.Query("max_amount")
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")
		dueDateStart := c.Query("due_date_start")
		dueDateEnd := c.Query("due_date_end")
		
		// Apply filters
		if search != "" {
			query = query.Where("invoice_no ILIKE ? OR EXISTS (SELECT 1 FROM customers WHERE id = invoices.customer_id AND name ILIKE ?) OR EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = invoices.id AND product_name ILIKE ?)", 
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
		}
		
		if customerID != "" {
			query = query.Where("customer_id = ?", customerID)
		}
		
		if status != "" {
			query = query.Where("status = ?", status)
		}
		
		if paymentStatus != "" {
			query = query.Where("payment_status = ?", paymentStatus)
		}
		
		if minAmount != "" {
			query = query.Where("total_amount >= ?", minAmount)
		}
		
		if maxAmount != "" {
			query = query.Where("total_amount <= ?", maxAmount)
		}
		
		if startDate != "" {
			query = query.Where("issue_date >= ?", startDate)
		}
		
		if endDate != "" {
			query = query.Where("issue_date <= ?", endDate)
		}
		
		if dueDateStart != "" {
			query = query.Where("due_date >= ?", dueDateStart)
		}
		
		if dueDateEnd != "" {
			query = query.Where("due_date <= ?", dueDateEnd)
		}
		
		// Order by issue date descending
		query = query.Order("issue_date DESC")
		
		if err := query.Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(http.StatusOK, invoices)
	}
}

// Helper functions
func sendEmailReminder(reminder database.PaymentReminder) bool {
	// Mock email sending - in real implementation, integrate with email service
	fmt.Printf("Sending email reminder for invoice %s to customer %s\n", 
		reminder.Invoice.InvoiceNo, reminder.Invoice.Customer.Name)
	fmt.Printf("Message: %s\n", reminder.Message)
	return true
}

func updateInvoicePaymentStatus(tx *gorm.DB, invoiceID uint) error {
	var invoice database.Invoice
	if err := tx.First(&invoice, invoiceID).Error; err != nil {
		return err
	}

	// Calculate total paid amount
	var totalPaid float64
	tx.Model(&database.Payment{}).Where("invoice_id = ?", invoiceID).Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

	// Update payment status
	invoice.PaidAmount = totalPaid
	if totalPaid >= invoice.TotalAmount {
		invoice.PaymentStatus = "paid"
		invoice.Status = "paid"
	} else if totalPaid > 0 {
		invoice.PaymentStatus = "partial"
	} else {
		invoice.PaymentStatus = "unpaid"
	}

	// Check if overdue
	if invoice.PaymentStatus != "paid" && invoice.DueDate < time.Now().Format("2006-01-02") {
		invoice.PaymentStatus = "overdue"
	}

	return tx.Save(&invoice).Error
}
