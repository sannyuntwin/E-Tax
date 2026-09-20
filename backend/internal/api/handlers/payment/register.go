package payment

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes mounts payment, payment reminder and invoice search routes.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	rg.GET("/payments", getPayments(db))
	rg.POST("/payments", createPayment(db))
	rg.GET("/payments/stats", getPaymentStats(db))
	rg.PUT("/payments/:id", updatePayment(db))
	rg.DELETE("/payments/:id", deletePayment(db))

	rg.GET("/payment-reminders", getPaymentReminders(db))
	rg.POST("/payment-reminders", createPaymentReminder(db))
	rg.POST("/payment-reminders/:id/send", sendPaymentReminder(db))

	rg.GET("/invoices/search", enhancedSearch(db))
	rg.POST("/invoices/:id/duplicate", duplicateInvoice(db))
}
