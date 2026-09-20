package license

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	models "etax/internal/database/models"
)

// Helper to parse expiry date from different formats
func parseExpiryDate(dateStr string) *time.Time {
	if dateStr == "" {
		return nil
	}
	
	// Try RFC3339 (2024-02-28T15:04:05Z)
	t, err := time.Parse(time.RFC3339, dateStr)
	if err == nil {
		return &t
	}
	
	// Try ISO8601 variant (2024-02-28T15:04:05)
	t, err = time.Parse("2006-01-02T15:04:05", dateStr)
	if err == nil {
		return &t
	}
	
	// Try YYYY-MM-DD
	t, err = time.Parse("2006-01-02", dateStr)
	if err == nil {
		return &t
	}
	
	// Try YYYY-MM-DD HH:MM:SS
	t, err = time.Parse("2006-01-02 15:04:05", dateStr)
	if err == nil {
		return &t
	}
	
	fmt.Printf("Warning: Failed to parse expiry date: %s\n", dateStr)
	return nil
}

// License server client
type LicenseServerClient struct {
	ServerURL string
	APIKey    string
	Timeout   time.Duration
}

// License validation request/response structures
type LicenseValidationRequest struct {
	LicenseKey  string      `json:"license_key"`
	CompanyID   uint        `json:"company_id,omitempty"`
	Action      string      `json:"action,omitempty"`
	Feature     string      `json:"feature,omitempty"`
	MachineID   string      `json:"machine_id,omitempty"`
	MachineInfo interface{} `json:"machine_info,omitempty"`
}

type LicenseValidationResponse struct {
	Valid       bool     `json:"valid"`
	LicenseType string   `json:"license_type"`
	ExpiresAt   string   `json:"expires_at"`
	Features    []string `json:"features"`
	MaxUsers    int      `json:"max_users"`
	MaxInvoices int     `json:"max_invoices"`
	MaxAPIKeys  int      `json:"max_api_keys"`
	Message     string   `json:"message"`
}

// Create license server client
func NewLicenseServerClient(serverURL, apiKey string) *LicenseServerClient {
	return &LicenseServerClient{
		ServerURL: serverURL,
		APIKey:    apiKey,
		Timeout:   30 * time.Second,
	}
}

// Validate license with external server
func (client *LicenseServerClient) ValidateLicense(req LicenseValidationRequest) (*LicenseValidationResponse, error) {
	// Prepare request
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Determine endpoint based on action
	endpoint := "/api/v1/licenses/validate"
	if req.Action == "activate" {
		endpoint = "/api/v1/licenses/activate"
	}

	// Create HTTP request
	httpReq, err := http.NewRequest("POST", client.ServerURL+endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+client.APIKey)
	httpReq.Header.Set("User-Agent", "E-Tax-Backend/1.0")

	// Create HTTP client with timeout
	httpClient := &http.Client{
		Timeout: client.Timeout,
	}

	// Send request
	startTime := time.Now()
	resp, err := httpClient.Do(httpReq)
	responseTime := time.Since(startTime).Milliseconds()
	
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Parse response
	var validationResp LicenseValidationResponse
	if err := json.NewDecoder(resp.Body).Decode(&validationResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Log response time for monitoring
	fmt.Printf("License validation took %dms\n", responseTime)

	return &validationResp, nil
}

// ValidateLicenseKey handler
func ValidateLicenseKey(db *gorm.DB, licenseClient *LicenseServerClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			LicenseKey  string      `json:"license_key" binding:"required"`
			Action      string      `json:"action"`
			Feature     string      `json:"feature,omitempty"`
			MachineID   string      `json:"machine_id,omitempty"`
			MachineInfo interface{} `json:"machine_info,omitempty"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Get user ID from context (if authenticated)
		userID, exists := c.Get("user_id")
		var userIDPtr *uint
		if exists {
			if uid, ok := userID.(uint); ok {
				userIDPtr = &uid
			}
		}

		// Get company ID (you'll need to implement this logic based on your auth)
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID not found"})
			return
		}

		cid, ok := companyID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid company ID type"})
			return
		}

		// Validate with license server
		validationReq := LicenseValidationRequest{
			LicenseKey:  req.LicenseKey,
			CompanyID:   cid,
			Action:      req.Action,
			Feature:     req.Feature,
			MachineID:   req.MachineID,
			MachineInfo: req.MachineInfo,
		}

		// Set default machine ID if empty
		if validationReq.MachineID == "" {
			validationReq.MachineID = "etax-server-" + fmt.Sprint(cid)
		}

		// Check if license client is initialized
		if licenseClient == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "License server is not enabled or configured"})
			return
		}

		startTime := time.Now()
		validationResp, err := licenseClient.ValidateLicense(validationReq)
		responseTime := time.Since(startTime).Milliseconds()

		// Log validation attempt
		logEntry := models.LicenseValidationLog{
			CompanyID:    cid,
			UserID:       userIDPtr,
			Action:       req.Action,
			IsValid:      err == nil && validationResp != nil && validationResp.Valid,
			ResponseTime: int(responseTime),
			IPAddress:    c.ClientIP(),
			UserAgent:    c.GetHeader("User-Agent"),
			Timestamp:    time.Now(),
		}

		if err != nil || validationResp == nil {
			errorMsg := "Unknown error"
			if err != nil {
				errorMsg = err.Error()
			} else if validationResp == nil {
				errorMsg = "Empty response from license server"
			}
			
			logEntry.ErrorMessage = errorMsg
			// Save log entry for failure
			db.Create(&logEntry)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "License validation failed",
				"details": errorMsg,
			})
			return
		}

		// Don't save log entry yet, wait for LicenseKeyID

		// Update or create license key record
		var licenseKey models.LicenseKey
		err = db.Where("license_key = ?", req.LicenseKey).First(&licenseKey).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new license record
				featuresJSON, _ := json.Marshal(validationResp.Features)
				expiresAt := parseExpiryDate(validationResp.ExpiresAt)

				status := "suspended"
				if validationResp.Valid {
					status = "active"
				}

				now := time.Now()
				licenseKey = models.LicenseKey{
					CompanyID:     cid,
					LicenseKey:    req.LicenseKey,
					LicenseType:   validationResp.LicenseType,
					Status:        status,
					IssuedAt:      now,
					ExpiresAt:     expiresAt,
					MaxUsers:      validationResp.MaxUsers,
					MaxInvoices:   validationResp.MaxInvoices,
					MaxAPIKeys:    validationResp.MaxAPIKeys,
					Features:      string(featuresJSON),
					UsageStats:    "{}",
					Metadata:      "{}",
					LastValidated: &now,
					ValidationCount: 1,
					ServerURL:     licenseClient.ServerURL,
				}
				err = db.Create(&licenseKey).Error
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{
						"error": "Failed to create license record",
						"details": err.Error(),
					})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
				return
			}
		} else {
			// Update existing license record
			now := time.Now()
			licenseKey.LastValidated = &now
			licenseKey.ValidationCount++
			if validationResp.Valid {
				licenseKey.Status = "active"
			} else {
				licenseKey.Status = "suspended"
			}
			
			// Always ensure company association
			licenseKey.CompanyID = cid
			
			err = db.Save(&licenseKey).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": "Failed to update license record",
					"details": err.Error(),
				})
				return
			}
		}

		// Now save the log entry with LicenseKeyID
		logEntry.LicenseKeyID = licenseKey.ID
		db.Create(&logEntry)

		// Return validation response
		c.JSON(http.StatusOK, gin.H{
			"valid":        validationResp.Valid,
			"license_type": validationResp.LicenseType,
			"expires_at":   validationResp.ExpiresAt,
			"features":     validationResp.Features,
			"message":      validationResp.Message,
		})
	}
}

// GetCompanyLicense info
func GetCompanyLicense(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Company ID not found"})
			return
		}

		cid, ok := companyID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid company ID type"})
			return
		}

		var licenseKey models.LicenseKey
		err := db.Where("company_id = ?", cid).Order("id DESC").First(&licenseKey).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Return 200 with specific message instead of 404 to avoid frontend errors
				c.JSON(http.StatusOK, gin.H{
					"license_key":  "",
					"status":       "unactivated",
					"license_type": "none",
					"message":      "No active license found",
					"features":     []string{},
					"max_users":    0,
					"max_invoices": 0,
					"max_api_keys": 0,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		// Parse features JSON
		features := []string{}
		if licenseKey.Features != "" {
			json.Unmarshal([]byte(licenseKey.Features), &features)
		}

		c.JSON(http.StatusOK, gin.H{
			"id":                licenseKey.ID,
			"license_key":        licenseKey.LicenseKey,
			"license_type":       licenseKey.LicenseType,
			"status":            licenseKey.Status,
			"expires_at":        licenseKey.ExpiresAt,
			"max_users":         licenseKey.MaxUsers,
			"max_invoices":      licenseKey.MaxInvoices,
			"max_api_keys":      licenseKey.MaxAPIKeys,
			"features":          features,
			"validation_count":  licenseKey.ValidationCount,
			"last_validated":    licenseKey.LastValidated,
		})
	}
}

// CheckFeatureAccess for specific feature
func CheckFeatureAccess(db *gorm.DB, licenseClient *LicenseServerClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		if licenseClient == nil {
			// If license server is not enabled, we might implicitly grant access
			// or deny it. For now, let's deny with a clear error.
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "License server is not enabled or configured"})
			return
		}

		feature := c.Param("feature")
		if feature == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Feature parameter required"})
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Company ID not found"})
			return
		}

		cid, ok := companyID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid company ID type"})
			return
		}

		// Get active license for company
		var licenseKey models.LicenseKey
		err := db.Where("company_id = ? AND status = 'active'", cid).First(&licenseKey).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "No active license found",
					"feature_access": false,
				})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}

		// Parse features
		var features []string
		if licenseKey.Features != "" {
			json.Unmarshal([]byte(licenseKey.Features), &features)
		}

		// Check if feature is available
		hasAccess := false
		for _, f := range features {
			if f == feature || f == "all" {
				hasAccess = true
				break
			}
		}

		// Optional: Revalidate with license server for critical features
		if !hasAccess && licenseClient != nil {
			validationReq := LicenseValidationRequest{
				LicenseKey: licenseKey.LicenseKey,
				CompanyID:  cid,
				Action:     "feature_access",
				Feature:    feature,
			}

			validationResp, err := licenseClient.ValidateLicense(validationReq)
			if err == nil && validationResp.Valid {
				// Update local features if server says it's valid
				featuresJSON, _ := json.Marshal(validationResp.Features)
				licenseKey.Features = string(featuresJSON)
				db.Save(&licenseKey)
				
				// Check again
				for _, f := range validationResp.Features {
					if f == feature || f == "all" {
						hasAccess = true
						break
					}
				}
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"feature":        feature,
			"feature_access": hasAccess,
			"license_type":   licenseKey.LicenseType,
		})
	}
}
