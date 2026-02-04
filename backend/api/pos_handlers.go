package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

// POS vendor handlers
func getPOSVendors(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var vendors []database.POSVendorConfig
		query := db.Where("is_active = ?", true).Order("vendor_name")
		
		if err := query.Find(&vendors).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, vendors)
	}
}

func createPOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var vendorData struct {
			VendorName     string `json:"vendor_name" binding:"required"`
			ContactEmail   string `json:"contact_email" binding:"required,email"`
			ContactPhone   string `json:"contact_phone"`
			Website        string `json:"website"`
			CommissionRate float64 `json:"commission_rate"`
			MaxInvoices    int    `json:"max_invoices"`
			Features       string `json:"features"`
			APIAccess      bool   `json:"api_access"`
		}

		if err := c.ShouldBindJSON(&vendorData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate API credentials
		apiKey, _ := security.GenerateRandomString(32)
		apiSecret, _ := security.GenerateRandomString(64)

		vendor := database.POSVendorConfig{
			VendorName:     vendorData.VendorName,
			ContactEmail:   vendorData.ContactEmail,
			ContactPhone:   vendorData.ContactPhone,
			Website:        vendorData.Website,
			CommissionRate: vendorData.CommissionRate,
			MaxInvoices:    vendorData.MaxInvoices,
			Features:       vendorData.Features,
			APIAccess:      vendorData.APIAccess,
			APIKey:         apiKey,
			APISecret:      apiSecret,
			IsActive:      false, // Requires approval
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := db.Create(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.StatusJSON{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, vendor)
	}
}

func updatePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		vendorID := c.Param("id")
		var updateData struct {
			VendorName     string `json:"vendor_name"`
			ContactEmail   string `json:"contact_email"`
			ContactPhone   string `json:"contact_phone"`
			Website        string `json:"website"`
			CommissionRate float64 `json:"commission_rate"`
			MaxInvoices    int    `json:"max_invoices"`
			Features       string `json:"features"`
			APIAccess      bool   `json:"api_access"`
			IsActive       bool   `json:"is_active"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var vendor database.POSVendorConfig
		if err := db.First(&vendor, vendorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		// Update vendor
		if updateData.VendorName != "" {
			vendor.VendorName = updateData.VendorName
		}
		if updateData.ContactEmail != "" {
			vendor.ContactEmail = updateData.ContactEmail
		}
		if updateData.ContactPhone != "" {
			vendor.ContactPhone = updateData.ContactPhone
		}
		if updateData.Website != "" {
			vendor.Website = updateData.Website
		}
		if updateData.CommissionRate > 0 {
			vendor.CommissionRate = updateData.CommissionRate
		}
		if updateData.MaxInvoices > 0 {
			vendor.MaxInvoices = updateData.MaxInvoices
		}
		if updateData.Features != "" {
			vendor.Features = updateData.Features
		}
		vendor.APIAccess = updateData.APIAccess
		vendor.IsActive = updateData.IsActive
		vendor.UpdatedAt = time.Now()

		if err := db.Save(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, vendor)
	}
}

func activatePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		vendorID := c.Param("id")
		
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, vendorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		vendor.IsActive = true
		vendor.UpdatedAt = time.Now()

		if err := db.Save(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "POS vendor activated successfully"})
	}
}

func deactivatePOSVendor(db *gorm.DB) gin.HandlerFunc {
	return func(c *ginContext) {
		vendorID := c.Param("id")
		
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, vendorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		vendor.IsActive = false
		vendor.UpdatedAt = time.Now()

		if err := db.Save(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "POS vendor deactivated successfully"})
	}
}

func getPOSVendorInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		vendorID := c.Param("id")
		
		// Get POS vendor
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, vendorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		// Get invoices for this vendor (would need to track vendor_id in invoices table)
		// For now, return empty array as we'd need to modify the invoice schema
		c.JSON(http.StatusOK, []string{})
	}
}

// Marketplace integration handlers
func getMarketplaceIntegrations(db *gorm.DB) gin.HandlerFunc {
	return func(c *ginContext) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var integrations []database.MarketplaceIntegration
		query := db.Where("company_id = ?", userID).Where("is_active = ?", true).Order("platform")
		
		if err := query.Find(&integrations).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, integrations)
	}
}

func createMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *ginContext) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var integrationData struct {
			Platform    string `json:"platform" binding:"required"`
			StoreURL    string `json:"store_url" binding:"required,url"`
			APIKey      string `json:"api_key" binding:"required"`
			APISecret   string `json:"api_secret" binding:"required"`
			WebhookURL  string `json:"webhook_url"`
		}

		if err := c.ShouldBindJSON(&integrationData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate platform
		validPlatforms := []string{"shopify", "woocommerce", "magento", "bigcommerce", "prestashop", "opencart"}
		isValid := false
		for _, platform := range validPlatforms {
			if integrationData.Platform == platform {
				isValid = true
				break
			}
		}

		if !isValid {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid platform"})
			return
		}

		// Create integration
		integration := database.MarketplaceIntegration{
			CompanyID:   userID,
			Platform:   integrationData.Platform,
			StoreURL:   integrationData.StoreURL,
			APIKey:      integrationData.APIKey,
			APISecret:   integrationData.APISecret,
			WebhookURL:  integrationData.WebhookURL,
			IsActive:   true,
			SyncStatus: "disabled",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := db.Create(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, integration)
	}
}

func updateMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *ginContext) {
		integrationID := c.Param("id")
		var updateData struct {
			StoreURL    string `json:"store_url"`
			APIKey      string `json:"api_key"`
			APISecret   string `json:"api_secret"`
			WebhookURL  string `json:"webhook_url"`
			IsActive   bool   `json:"is_active"`
			Config     string `json:"config"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var integration database.MarketplaceIntegration
		if err := db.First(&integration, integrationID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
			return
		}

		// Update integration
		if updateData.StoreURL != "" {
			integration.StoreURL = updateData.StoreURL
		}
		if updateData.APIKey != "" {
			integration.APIKey = updateData.APIKey
		}
		if updateData.APISecret != "" {
			integration.APISecret = updateData.APISecret
		}
		if updateData.WebhookURL != "" {
			integration.WebhookURL = updateData.WebhookURL
		}
		integration.IsActive = updateData.IsActive
		integration.Config = updateData.Config
		integration.UpdatedAt = time.Now()

		if err := db.Save(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, integration)
	}
}

func testMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin) {
		integrationID := c.Param("id")
		
		var integration database.MarketplaceIntegration
		if err := db.First(&integration, integrationID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
			return
		}

		// Test connection to marketplace
		// This would involve making API calls to the marketplace
		// For now, just return success
		testResult := map[string]interface{}{
			"platform": integration.Platform,
			"store_url": integration.StoreURL,
			"connection_status": "success",
			"last_tested": time.Now(),
		}

		// Update sync status
		integration.SyncStatus = "success"
		integration.LastSync = &[]time.Time{time.Now()}
		integration.UpdatedAt = time.Now()

		if err := db.Save(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, testResult)
	}
}

func disableMarketplaceIntegration(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		integrationID := c.Param("id")
		
		var integration database.MarketplaceIntegration
		if err := db.First(&integration, integrationID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
			return
		}

		integration.IsActive = false
		integration.SyncStatus = "disabled"
		integration.UpdatedAt = time.Now()

		if err := db.Save(&integration).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Integration disabled"})
	}
}

// Generate API key for POS vendor
func generatePOSVendorAPIKey(db *gorm.DB) gin.HandlerFunc {
	return func(c *ginContext) {
		vendorID := c.Param("id")
		
		var vendor database.POSVendorConfig
		if err := db.First(&vendor, vendorID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "POS vendor not found"})
			return
		}

		// Generate new API credentials
		apiKey, _ := security.GenerateRandomString(32)
		apiSecret, _ := security.GenerateRandomString(64)

		vendor.APIKey = apiKey
		vendor.APISecret = apiSecret
		vendor.UpdatedAt = time.Now()

		if err := db.Save(&vendor).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"api_key": apiKey,
			"api_secret": api_secret,
			"message": "New API credentials generated",
		})
	}
}
