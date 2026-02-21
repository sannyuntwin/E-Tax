package database

import (
	"time"
	"gorm.io/gorm"
)

// Ensure gorm import is used
var _ gorm.DB

// Subscription plans
type SubscriptionPlan struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Price       float64   `gorm:"not null" json:"price"`
	Currency    string    `gorm:"not null;default:'THB'" json:"currency"`
	BillingCycle string    `gorm:"not null;default:'monthly'" json:"billing_cycle"` // monthly, yearly
	Features    string    `gorm:"type:jsonb" json:"features"` // JSON array of features
	MaxInvoices int       `gorm:"not null" json:"max_invoices"`
	MaxUsers    int       `gorm:"not null" json:"max_users"`
	MaxAPIKeys  int       `gorm:"not null" json:"max_api_keys"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	SortOrder   int       `gorm:"default:0" json:"sort_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Company subscriptions
type CompanySubscription struct {
	ID                 uint                `gorm:"primaryKey" json:"id"`
	CompanyID          uint                `json:"company_id"`
	SubscriptionPlanID uint                `json:"subscription_plan_id"`
	Status              string              `gorm:"not null;default:'trial'" json:"status"` // trial, active, cancelled, expired
	TrialEndsAt        *time.Time          `json:"trial_ends_at"`
	CurrentPeriodStart  time.Time           `json:"current_period_start"`
	CurrentPeriodEnd    time.Time           `json:"current_period_end"`
	NextBillingDate     time.Time           `json:"next_billing_date"`
	CancelledAt         *time.Time          `json:"cancelled_at"`
	CancelReason        string              `json:"cancel_reason"`
	AutoRenew           bool                `gorm:"default:true" json:"auto_renew"`
	UsageStats          string              `gorm:"type:jsonb" json:"usage_stats"` // JSON of current usage
	SubscriptionPlan   SubscriptionPlan    `gorm:"foreignKey:SubscriptionPlanID" json:"subscription_plan"`
	Company            Company             `gorm:"foreignKey:CompanyID" json:"company"`
	CreatedAt           time.Time           `json:"created_at"`
	UpdatedAt           time.Time           `json:"updated_at"`
}

// API usage tracking
type APIUsage struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CompanyID    uint      `json:"company_id"`
	UserID       *uint     `json:"user_id"`
	APIKeyID     *uint     `json:"api_key_id"`
	Endpoint     string    `gorm:"not null" json:"endpoint"`
	Method       string    `gorm:"not null" json:"method"`
	StatusCode  int       `json:"status_code"`
	ResponseTime int       `json:"response_time"` // milliseconds
	RequestSize  int       `json:"request_size"`  // bytes
	ResponseSize int       `json:"response_size"` // bytes
	IPAddress   string    `json:"ip_address"`
	UserAgent    string    `json:"user_agent"`
	Timestamp    time.Time `json:"timestamp"`
	
	Company      Company `gorm:"foreignKey:CompanyID" json:"company"`
	User         *User   `gorm:"foreignKey:UserID" json:"user"`
	APIKey       *APIKey `gorm:"foreignKey:APIKeyID" json:"api_key"`
}

// Billing invoices
type BillingInvoice struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CompanyID       uint      `json:"company_id"`
	SubscriptionID uint      `json:"subscription_id"`
	InvoiceNumber   string    `gorm:"not null;unique" json:"invoice_number"`
	Amount          float64   `gorm:"not null" json:"amount"`
	Currency        string    `gorm:"not null;default:'THB'" json:"currency"`
	Status          string    `gorm:"not null;default:'draft'" json:"status"` // draft, sent, paid, overdue, cancelled
	IssuedAt        time.Time `json:"issued_at"`
	DueDate         time.Time `json:"due_date"`
	PaidAt          *time.Time `json:"paid_at"`
	PaymentMethod   string    `json:"payment_method"`
	PaymentRef     string    `json:"payment_ref"`
	PeriodStart     time.Time `json:"period_start"`
	PeriodEnd       time.Time `json:"period_end"`
	UsageSummary    string    `gorm:"type:jsonb" json:"usage_summary"` // JSON of usage breakdown
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	Company         Company `gorm:"foreignKey:CompanyID" json:"company"`
	Subscription    CompanySubscription `gorm:"foreignKey:SubscriptionID" json:"subscription"`
}

// Usage quotas and limits
type UsageQuota struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	CompanyID        uint      `json:"company_id"`
	ResourceType     string    `gorm:"not null" json:"resource_type"` // invoices, api_calls, storage, users
	Limit            int       `gorm:"not null" json:"limit"`
	Used             int       `gorm:"default:0" json:"used"`
	ResetPeriod      string    `gorm:"not null;default:'monthly'" json:"reset_period"` // daily, weekly, monthly
	LastReset        time.Time `json:"last_reset"`
	IsOverLimit      bool      `gorm:"default:false" json:"is_over_limit"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
	
	Company          Company `gorm:"foreignKey:CompanyID" json:"company"`
}

// White-label configurations
type WhiteLabelConfig struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CompanyID       uint      `json:"company_id"`
	BrandName       string    `json:"brand_name"`
	LogoURL         string    `json:"logo_url"`
	PrimaryColor     string    `json:"primary_color"`
	SecondaryColor   string    `json:"secondary_color"`
	AccentColor     string    `json:"accent_color"`
	BackgroundColor string    `json:"background_color"`
	FontFamily      string    `json:"font_family"`
	CustomCSS       string    `json:"custom_css"`
	CustomDomain    string    `json:"custom_domain"`
	IsEnabled       bool      `gorm:"default:false" json:"is_enabled"`
	Settings        string    `gorm:"type:jsonb" json:"settings"` // Additional white-label settings
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	Company         Company `gorm:"foreignKey:CompanyID" json:"company"`
}

// Payment methods
type PaymentMethod struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CompanyID   uint      `json:"company_id"`
	Type        string    `json:"type"` // credit_card, bank_transfer, promptpay, etc.
	Provider    string    `json:"provider"`
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	Config      string    `gorm:"type:jsonb" json:"config"` // Provider-specific config
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	Company     Company `gorm:"foreignKey:CompanyID" json:"company"`
}

// Marketplace integrations
type MarketplaceIntegration struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	CompanyID   uint      `json:"company_id"`
	Platform    string    `json:"platform"` // shopify, woocommerce, magento, etc.
	StoreURL    string    `json:"store_url"`
	APIKey      string    `json:"api_key"`
	APISecret   string    `json:"api_secret"`
	WebhookURL  string    `json:"webhook_url"`
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	Config      string    `gorm:"type:jsonb" json:"config"` // Platform-specific config
	SyncStatus  string    `json:"sync_status"` // active, error, disabled
	LastSync    *time.Time `json:"last_sync"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	Company     Company `gorm:"foreignKey:CompanyID" json:"company"`
}

// POS vendor configurations
type POSVendorConfig struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	CompanyID       uint      `json:"company_id"`
	VendorName      string    `json:"vendor_name"`
	ContactEmail    string    `json:"contact_email"`
	ContactPhone    string    `json:"contact_phone"`
	Website         string    `json:"website"`
	IsActive        bool      `gorm:"default:false" json:"is_active"`
	CommissionRate  float64   `json:"commission_rate"` // percentage
	MaxInvoices     int       `json:"max_invoices"`
	Features        string    `gorm:"type:jsonb" json:"features"` // Allowed features
	APIAccess       bool      `gorm:"default:false" json:"api_access"`
	APIKey          string    `json:"api_key"`
	APISecret       string    `json:"api_secret"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	Company         Company `gorm:"foreignKey:CompanyID" json:"company"`
}
