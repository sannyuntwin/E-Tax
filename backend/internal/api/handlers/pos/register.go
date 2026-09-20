package pos

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterExtraRoutes mounts the POS vendor and marketplace routes that are
// not covered by the basic CRUD handlers in the routes package.
func RegisterExtraRoutes(rg *gin.RouterGroup, db *gorm.DB) {
	rg.POST("/pos-vendors/:id/activate", activatePOSVendor(db))
	rg.POST("/pos-vendors/:id/deactivate", deactivatePOSVendor(db))
	rg.POST("/pos-vendors/:id/generate-api-key", generatePOSVendorAPIKey(db))
	rg.GET("/pos-vendors/:id/invoices", getPOSVendorInvoices(db))

	rg.POST("/marketplace-integrations/:id/test", testMarketplaceIntegration(db))
	rg.POST("/marketplace-integrations/:id/disable", disableMarketplaceIntegration(db))
}
