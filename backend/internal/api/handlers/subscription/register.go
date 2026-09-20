package subscription

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes mounts subscription, billing and white-label routes.
func RegisterRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	rg.GET("/subscription-plans", getSubscriptionPlans(db))
	rg.GET("/subscription", getCompanySubscription(db))
	rg.POST("/subscriptions", createCompanySubscription(db))
	rg.PUT("/subscriptions/:id", updateCompanySubscription(db))
	rg.DELETE("/subscriptions/:id", cancelCompanySubscription(db))

	rg.GET("/billing-invoices", getBillingInvoices(db))
	rg.POST("/billing-invoices", createBillingInvoice(db))

	rg.GET("/white-label", getWhiteLabelConfig(db))
	rg.PUT("/white-label", updateWhiteLabelConfig(db))
}
