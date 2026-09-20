package invoice

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRecurringRoutes mounts recurring invoice routes.
func RegisterRecurringRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	rg.GET("/recurring-invoices", getRecurringInvoices(db))
	rg.POST("/recurring-invoices", createRecurringInvoice(db))
	rg.GET("/recurring-invoices/stats", getRecurringInvoiceStats(db))
	rg.PUT("/recurring-invoices/:id", updateRecurringInvoice(db))
	rg.DELETE("/recurring-invoices/:id", deleteRecurringInvoice(db))
	rg.POST("/recurring-invoices/:id/generate", generateInvoicesFromRecurring(db))
	rg.POST("/recurring-invoices/:id/pause", pauseRecurringInvoice(db))
	rg.POST("/recurring-invoices/:id/resume", resumeRecurringInvoice(db))
}
