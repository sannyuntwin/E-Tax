package database

import (
	"time"
)

// License key management
type LicenseKey struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CompanyID       uint      `json:"company_id"`
	LicenseKey      string    `gorm:"not null;unique" json:"license_key"`
	LicenseType     string    `gorm:"not null" json:"license_type"` // trial, basic, professional, enterprise
	Status          string    `gorm:"not null;default:'active'" json:"status"` // active, suspended, expired, revoked
	IssuedAt        time.Time `json:"issued_at"`
	ExpiresAt       *time.Time `json:"expires_at"`
	MaxUsers        int       `json:"max_users"`
	MaxInvoices     int       `json:"max_invoices"`
	MaxAPIKeys      int       `json:"max_api_keys"`
	Features        string    `gorm:"type:jsonb" json:"features"` // JSON array of enabled features
	UsageStats      string    `gorm:"type:jsonb" json:"usage_stats"` // Current usage statistics
	LastValidated   *time.Time `json:"last_validated"`
	ValidationCount int       `gorm:"default:0" json:"validation_count"`
	ServerURL       string    `json:"server_url"` // Your license server URL
	Metadata        string    `gorm:"type:jsonb" json:"metadata"` // Additional license metadata
	
	Company         Company   `gorm:"foreignKey:CompanyID" json:"company"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// License validation logs
type LicenseValidationLog struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	LicenseKeyID  uint      `json:"license_key_id"`
	CompanyID     uint      `json:"company_id"`
	UserID        *uint     `json:"user_id"`
	Action        string    `gorm:"not null" json:"action"` // login, api_call, feature_access
	IsValid       bool      `gorm:"not null" json:"is_valid"`
	ErrorMessage  string    `json:"error_message"`
	ResponseTime  int       `json:"response_time"` // milliseconds
	IPAddress     string    `json:"ip_address"`
	UserAgent     string    `json:"user_agent"`
	Timestamp     time.Time `json:"timestamp"`
	
	LicenseKey    LicenseKey `gorm:"foreignKey:LicenseKeyID" json:"license_key"`
	Company       Company    `gorm:"foreignKey:CompanyID" json:"company"`
	User          *User      `gorm:"foreignKey:UserID" json:"user"`
}

// License server configuration
type LicenseServerConfig struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	Name            string    `gorm:"not null" json:"name"`
	ServerURL       string    `gorm:"not null" json:"server_url"`
	APIKey          string    `json:"api_key"`
	Timeout         int       `gorm:"default:30" json:"timeout"` // seconds
	RetryAttempts   int       `gorm:"default:3" json:"retry_attempts"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	LastHealthCheck *time.Time `json:"last_health_check"`
	HealthStatus    string    `gorm:"default:'unknown'" json:"health_status"` // healthy, unhealthy, unknown
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
