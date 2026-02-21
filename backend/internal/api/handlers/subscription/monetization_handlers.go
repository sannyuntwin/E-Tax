package subscription

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"etax/internal/database/models"
)

// Helper function to extract user ID from context
func getUserID(c *gin.Context) (uint, bool) {
	userIDAny, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	
	userID, ok := userIDAny.(uint)
	if !ok {
		return 0, false
	}
	
	return userID, true
}

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
		userID, exists := getUserID(c)
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

		c.JSON(http.StatusOK, gin.H{
			"subscription": subscription,
		})
	}
}

func createCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := getUserID(c)
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

		// Create subscription
		trialEndsAt := time.Now().AddDate(0, 0, 14) // 14 days from now
		subscription := database.CompanySubscription{
			CompanyID:          user.ID,
			SubscriptionPlanID:   subscriptionData.SubscriptionPlanID,
			Status:             "trial",
			TrialEndsAt:        &trialEndsAt,
			CurrentPeriodStart:  time.Now(),
			CurrentPeriodEnd:    time.Now().AddDate(0, 0, 30), // 30 days from now
			NextBillingDate:     time.Now().AddDate(0, 0, 30), // 30 days from now
			AutoRenew:          true,
			CreatedAt:           time.Now(),
			UpdatedAt:           time.Now(),
		}

		if err := db.Create(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, subscription)
	}
}

func updateCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := getUserID(c)
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

		c.JSON(http.StatusOK, subscription)
	}
}

func cancelCompanySubscription(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := getUserID(c)
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

		// Get existing subscription
		var subscription database.CompanySubscription
		if err := db.Where("company_id = ?", user.ID).First(&subscription).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "No subscription found"})
			return
		}

		// Cancel subscription
		subscription.Status = "cancelled"
		subscription.UpdatedAt = time.Now()

		if err := db.Save(&subscription).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Subscription cancelled successfully"})
	}
}

// Placeholder handlers for other monetization features
func getUsageQuotas(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"quotas": []interface{}{}})
	}
}

func getAPIUsage(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"usage": []interface{}{}})
	}
}

func getBillingInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"invoices": []interface{}{}})
	}
}

func createBillingInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Billing invoice creation not implemented yet"})
	}
}

func getWhiteLabelConfig(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"config": map[string]interface{}{}})
	}
}

func updateWhiteLabelConfig(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "White label config update not implemented yet"})
	}
}
