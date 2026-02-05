package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"backend/security"
	"gorm.io/gorm"
)

// Subscription plan handlers
func getSubscriptionPlans(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var plans []database.SubscriptionPlan
		query := db.Where("is_active = ?", true).Order("sort_order ASC")
		
		if err := query.Find(&plans).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, plans)
	}
}

func getCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get company subscription
		var subscription database.CompanySubscription
		err := db.Preload("SubscriptionPlan").Where("company_id = ?", user.ID).First(&subscription).Error
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "No subscription found"})
			return
		}

		// Calculate usage stats
		usageStats := calculateUsageStats(db, user.ID, subscription.CurrentPeriodStart, subscription.CurrentPeriodEnd)

		c.JSON(http.StatusOK, gin.H{
			"subscription": subscription,
			"usage_stats": usageStats,
		})
	}
}

func createCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var subscriptionData struct {
			SubscriptionPlanID uint `json:"subscription_plan_id" binding:"required"`
			PaymentMethod      string `json:"payment_method" binding:"required"`
		}

		if err := c.ShouldBindJSON(&subscriptionData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get subscription plan
		var plan database.SubscriptionPlan
		if err := db.First(&plan, subscriptionData.SubscriptionPlanID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Subscription plan not found"})
			return
		}

		// Check if user already has a subscription
		var existingSubscription database.CompanySubscription
		err = db.Where("company_id = ?", user.ID).First(&existingSubscription).Error
		if err == nil && existingSubscription.Status != "cancelled" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company already has an active subscription"})
			return
		}

		// Create subscription
		subscription := database.CompanySubscription{
			CompanyID:          user.ID,
			SubscriptionPlanID:   subscriptionData.SubscriptionID,
			Status:             "trial",
			TrialEndsAt:        &[]time.Time{time.Now().AddDate(14 * 24 * time.Hour)},
			CurrentPeriodStart:  time.Now(),
			CurrentPeriodEnd:    time.Now().AddDate(30 * 24 * time.Hour),
			NextBillingDate:     time.Now().AddDate(30 * 24 * time.Hour),
			AutoRenew:          true,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		if err := db.Create(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load complete subscription with plan details
		if err := db.Preload("SubscriptionPlan").First(&subscription, subscription.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Log subscription creation
		logAuditEvent(db, &userID, "create_subscription", "company_subscription", subscription.ID, 
			"Created subscription for plan: "+plan.Name, c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusCreated, subscription)
	}
}

func updateCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var updateData struct {
			SubscriptionPlanID uint `json:"subscription_plan_id"`
			AutoRenew        bool   `json:"auto_renew"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get existing subscription
		var subscription database.CompanySubscription
		if err := db.Preload("SubscriptionPlan").Where("company_id = ?", user.ID).First(&subscription).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "No subscription found"})
			return
		}

		// Update subscription
		if updateData.SubscriptionPlanID > 0 {
			subscription.SubscriptionPlanID = updateData.SubscriptionPlanID
		}
		subscription.AutoRenew = updateData.AutoRenew
		subscription.UpdatedAt = time.Now()

		if err := db.Save(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load complete subscription with plan details
		if err := db.Preload("SubscriptionPlan").First(&subscription, subscription.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Log subscription update
		logAuditEvent(db, &userID, "update_subscription", "company_subscription", subscription.ID, 
			"Updated subscription", c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusOK, subscription)
	}
}

func cancelCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var cancelData struct {
			Reason string `json:"reason"`
		}

		if err := c.ShouldBindJSON(&cancelData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get existing subscription
		var subscription database.CompanySubscription
		if err := db.Where("company_id = ?", user.ID).First(&subscription).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "No subscription found"})
			return
		}

		// Cancel subscription
		subscription.Status = "cancelled"
		subscription.CancelledAt = &[]time.Time{time.Now()}
		subscription.CancelReason = cancelData.Reason
		subscription.AutoRenew = false
		subscription.UpdatedAt = time.Now()

		if err := db.Save(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Log subscription cancellation
		logAuditEvent(db, &userID, "cancel_subscription", "company_subscription", subscription.ID, 
			"Cancelled subscription: "+cancelData.Reason, c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusOK, gin.H{"message": "Subscription cancelled successfully"})
	}
}

func getUsageQuotas(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get usage quotas
		var quotas []database.UsageQuota
		if err := db.Where("company_id = ?", user.ID).Find(&quotas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, quotas)
	}
}

func getAPIUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Parse query parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))
		startDate := c.Query("start_date")
		endDate := c.Query("end_date")
		endpoint := c.Query("endpoint")
		method := c.Query("method")

		// Build query
		query := db.Model(&database.APIUsage{}).Where("company_id = ?", user.ID)
		
		if startDate != "" {
			query = query.Where("timestamp >= ?", startDate)
		}
		if endDate != "" {
			query = query.Where("timestamp <= ?", endDate)
		}
		if endpoint != "" {
			query = query.Where("endpoint ILIKE ?", "%"+endpoint+"%")
		}
		if method != "" {
			query = query.Where("method = ?", method)
		}

		// Get total count
		var total int64
		countQuery := query.Session(&gorm.Session{})
		if startDate != "" {
			countQuery = countQuery.Where("timestamp >= ?", startDate)
		}
		if endDate != "" {
			countQuery = countQuery.Where("timestamp <= ?", endDate)
		}
		if endpoint != "" {
			countQuery = countQuery.Where("endpoint ILIKE ?", "%"+endpoint+"%")
		}
		if method != "" {
			countQuery = countQuery.Where("method = ?", method)
		}
		countQuery.Count(&total)

		// Apply pagination
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize).Order("timestamp DESC")

		var usage []database.APIUsage
		if err := query.Find(&usage).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":       usage,
			"total":      total,
			"page":       page,
			"page_size":  pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		"has_next":   page < (total/int64(pageSize)),
		"has_prev":   page > 1,
	})
	}
}

func getBillingInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Parse query parameters
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
		status := c.Query("status")

		// Build query
		query := db.Model(&database.BillingInvoice{}).Preload("Subscription").Where("company_id = ?", user.ID)
		
		if status != "" {
			query = query.Where("status = ?", status)
		}

		// Get total count
		var total int64
		countQuery := query.Session(&gorm.Session{})
		if status != "" {
			countQuery = countQuery.Where("status = ?", status)
		}
		countQuery.Count(&total)

		// Apply pagination
		offset := (page - 1) * pageSize
		query = query.Offset(offset).Limit(pageSize).Order("issued_at DESC")

		var invoices []database.BillingInvoice
		if err := query.Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"data":       invoices,
			"total":      total,
			"page":       page,
			"page_size":   pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
			"has_next":   page < (total/int64(pageSize)),
			"has_prev":   page > 1,
		})
	}
}

func createBillingInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var invoiceData struct {
			SubscriptionID uint `json:"subscription_id" binding:"required"`
			Amount        float64 `json:"amount" binding:"required"`
			Currency      string  `json:"currency"`
			PaymentMethod string  `json:"payment_method"`
			DueDate       string  `json:"due_date"`
		}

		if err := c.ShouldBindJSON(&invoiceData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get subscription
		var subscription database.CompanySubscription
		if err := db.Preload("SubscriptionPlan").Where("company_id = ?", user.ID).First(&subscription, invoiceData.SubscriptionID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Subscription not found"})
			return
		}

		// Parse dates
		issuedAt := time.Now()
		dueDate, err := time.Parse("2006-01-02", invoiceData.DueDate)
		if err != nil {
			dueDate = issuedAt.AddDate(30 * 24 * time.Hour)
		}

		// Generate invoice number
		invoiceNumber := generateInvoiceNumber(db)

		// Create billing invoice
		invoice := database.BillingInvoice{
			CompanyID:       user.ID,
			SubscriptionID:   subscription.ID,
			InvoiceNumber:   invoiceNumber,
			Amount:          invoiceData.Amount,
			Currency:        invoiceData.Currency,
			Status:          "draft",
			IssuedAt:        issuedAt,
			DueDate:         dueDate,
			PaymentMethod:   invoiceData.PaymentMethod,
			PeriodStart:    subscription.CurrentPeriodStart,
			PeriodEnd:      subscription.CurrentPeriodEnd,
			CreatedAt:       time.Now(),
			UpdatedAt:       time.Now(),
		}

		if err := db.Create(&invoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load complete invoice with subscription details
		if err := db.Preload("Subscription").First(&invoice, invoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Log invoice creation
		logAuditEvent(db, &userID, "create_billing_invoice", "billing_invoice", invoice.ID, 
			"Created billing invoice: "+invoice.InvoiceNumber, c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusCreated, invoice)
	}
}

func getWhiteLabelConfig(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get white-label config
		var config database.WhiteLabelConfig
		err := db.Where("company_id = ?", user.ID).First(&config).Error
		if err != nil {
			// Create default config if not exists
			config = database.WhiteLabelConfig{
				CompanyID:    user.ID,
				BrandName:    "E-Tax",
				PrimaryColor: "#3b82f6",
				IsEnabled:   false,
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}
			db.Create(&config)
		}

		c.JSON(http.StatusOK, config)
	}
}

func updateWhiteLabelConfig(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		var configData struct {
			BrandName       string `json:"brand_name"`
			LogoURL         string `json:"logo_url"`
			PrimaryColor     string `json:"primary_color"`
			SecondaryColor   string `json:"secondary_color"`
			AccentColor     string `json:"accent_color"`
			BackgroundColor string `json:"background_color"`
			FontFamily      string `json:"font_family"`
			CustomCSS       string `json:"custom_css"`
			CustomDomain    string `json:"custom_domain"`
			IsEnabled       bool   `json:"is_enabled"`
		Settings        string `json:"settings"`
		}

		if err := c.ShouldBindJSON(&configData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user's company
		var user database.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// Get existing config
		var config database.WhiteLabelConfig
		if err := db.Where("company_id = ?", user.ID).First(&config).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "White-label config not found"})
			return
		}

		// Update config
		config.BrandName = configData.BrandName
		config.LogoURL = configData.LogoURL
		config.PrimaryColor = configData.PrimaryColor
		config.SecondaryColor = configData.SecondaryColor
		config.AccentColor = configData.AccentColor
		config.BackgroundColor = configData.BackgroundColor
		config.FontFamily = configData.FontFamily
		config.CustomCSS = configData.CustomCSS
		config.CustomDomain = configData.CustomDomain
		config.IsEnabled = configData.IsEnabled
		config.Settings = configData.Settings
		config.UpdatedAt = time.Now()

		if err := db.Save(&config).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Log config update
		logAuditEvent(db, &userID, "update_white_label", "white_label_config", config.ID, 
			"Updated white-label config: "+config.BrandName, c.ClientIP(), c.GetHeader("User-Agent"))

		c.JSON(http.StatusOK, config)
	}
}

// Helper functions
func calculateUsageStats(db *gorm.DB, companyID uint, startDate, endDate time.Time) map[string]interface{} {
	var invoiceCount int64
	var apiCalls int64
	var activeUsers int64

	// Count invoices in period
	db.Model(&database.Invoice{}).Where("company_id = ? AND created_at BETWEEN ? AND ?", 
		companyID, startDate, endDate).Count(&invoiceCount)

	// Count API calls in period
	db.Model(&database.APIUsage{}).Where("company_id = ? AND timestamp BETWEEN ? AND ?", 
		companyID, startDate, endDate).Count(&apiCalls)

	// Count active users in period
	db.Model(&database.APIUsage{}).Where("company_id = ? AND timestamp BETWEEN ? AND ? AND user_id IS NOT NULL", 
		companyID, startDate, endDate).Distinct("user_id").Count(&activeUsers)

	return map[string]interface{}{
		"invoice_count": invoiceCount,
		"api_calls":     apiCalls,
		"active_users":  activeUsers,
		"period_start": startDate,
		"period_end":   endDate,
	}
}

func generateInvoiceNumber(db *gorm.DB) string {
	var lastInvoice database.BillingInvoice
	db.Order("id DESC").First(&lastInvoice).Error
	
	if lastInvoice.ID == 0 {
		return "INV-2024-001"
	}

	// Extract numeric part and increment
	parts := []rune{}
	for _, char := range lastInvoice.InvoiceNumber {
		if char >= '0' && char <= '9' {
			parts = append(parts, char)
		}
	}

	num := 1
		if len(parts) > 0 {
		num, _ = strconv.Atoi(string(parts))
		num++
	}

	return fmt.Sprintf("INV-2024-%03d", num)
}

func logAuditEvent(db *gorm.DB, userID *uint, action, resource string, resourceID *uint, details, ipAddress, userAgent string) {
	auditLog := database.AuditLog{
		UserID:     userID,
		Action:     action,
		Resource:   resource,
		ResourceID: resourceID,
		Details:    details,
		IPAddress: ipAddress,
		UserAgent:  userAgent,
		CreatedAt:  time.Now(),
	}
	db.Create(&auditLog)
}
