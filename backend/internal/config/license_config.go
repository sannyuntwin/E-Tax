package config

import (
	"os"
	"time"
)

// License configuration
type LicenseConfig struct {
	ServerURL     string        `json:"server_url"`
	APIKey        string        `json:"api_key"`
	Timeout       time.Duration `json:"timeout"`
	RetryAttempts int           `json:"retry_attempts"`
	Enabled       bool          `json:"enabled"`
	CacheDuration time.Duration `json:"cache_duration"`
}

// Load license configuration
func LoadLicenseConfig() *LicenseConfig {
	config := &LicenseConfig{
		ServerURL:     getEnv("LICENSE_SERVER_URL", ""),
		APIKey:        getEnv("LICENSE_API_KEY", ""),
		Timeout:       time.Duration(getEnvInt("LICENSE_TIMEOUT", 30)) * time.Second,
		RetryAttempts: getEnvInt("LICENSE_RETRY_ATTEMPTS", 3),
		Enabled:       getEnvBool("LICENSE_ENABLED", false),
		CacheDuration: time.Duration(getEnvInt("LICENSE_CACHE_DURATION", 300)) * time.Second,
	}

	return config
}

// License feature definitions
type LicenseFeature struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	RequiredPlan string `json:"required_plan"` // trial, basic, professional, enterprise
}

// Get available license features
func GetLicenseFeatures() []LicenseFeature {
	return []LicenseFeature{
		{
			Name:         "basic_invoicing",
			Description:  "Create and manage basic invoices",
			RequiredPlan: "trial",
		},
		{
			Name:         "advanced_invoicing",
			Description:  "Advanced invoice features with templates",
			RequiredPlan: "basic",
		},
		{
			Name:         "recurring_invoices",
			Description:  "Create recurring invoice templates",
			RequiredPlan: "professional",
		},
		{
			Name:         "white_label",
			Description:  "White-label customization options",
			RequiredPlan: "enterprise",
		},
		{
			Name:         "api_access",
			Description:  "API access for integrations",
			RequiredPlan: "professional",
		},
		{
			Name:         "multi_user",
			Description:  "Multiple user accounts",
			RequiredPlan: "basic",
		},
		{
			Name:         "advanced_reporting",
			Description:  "Advanced financial reports",
			RequiredPlan: "professional",
		},
		{
			Name:         "pos_integration",
			Description:  "Point of sale system integration",
			RequiredPlan: "enterprise",
		},
		{
			Name:         "marketplace_sync",
			Description:  "E-commerce marketplace synchronization",
			RequiredPlan: "professional",
		},
		{
			Name:         "unlimited_invoices",
			Description:  "Unlimited invoice creation",
			RequiredPlan: "enterprise",
		},
	}
}

// Helper functions (reuse from config.go)
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		return value == "true" || value == "1"
	}
	return defaultValue
}
