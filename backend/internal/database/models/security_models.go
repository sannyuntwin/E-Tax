package database

import (
	"time"
	"gorm.io/gorm"
)

// Ensure gorm import is used
var _ gorm.DB

// User model for authentication
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"unique;not null" json:"username"`
	Email     string    `gorm:"unique;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	FirstName string    `gorm:"not null" json:"first_name"`
	LastName  string    `gorm:"not null" json:"last_name"`
	Role      string    `gorm:"not null;default:'user'" json:"role"` // admin, accountant, user
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	LastLogin *string   `json:"last_login"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Session model for token management
type Session struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	UserID       uint      `json:"user_id"`
	Token        string    `gorm:"unique;not null" json:"-"`
	RefreshToken string    `gorm:"unique;not null" json:"-"`
	ExpiresAt    time.Time `json:"expires_at"`
	CreatedAt    time.Time `json:"created_at"`
	LastUsedAt   time.Time `json:"last_used_at"`
	UserAgent    string    `json:"user_agent"`
	IPAddress   string    `json:"ip_address"`
	User         User      `gorm:"foreignKey:UserID" json:"user"`
}

// Audit log for security events
type AuditLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    *uint     `json:"user_id"`
	Action    string    `gorm:"not null" json:"action"` // login, logout, create, update, delete, view
	Resource  string    `json:"resource"` // invoice, customer, etc.
	ResourceID *uint   `json:"resource_id"`
	Details   string    `json:"details"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `gorm:"foreignKey:UserID" json:"user"`
}

// API key for external integrations
type APIKey struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Key         string    `gorm:"unique;not null" json:"-"`
	UserID      uint      `json:"user_id"`
	Permissions string    `json:"permissions"` // JSON array of permissions
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	LastUsed    *time.Time `json:"last_used"`
	ExpiresAt   *time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
	User        User      `gorm:"foreignKey:UserID" json:"user"`
}

// Security settings
type SecuritySettings struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	PasswordMinLength    int       `gorm:"default:8" json:"password_min_length"`
	RequireStrongPassword bool      `gorm:"default:true" json:"require_strong_password"`
	SessionTimeout       int       `gorm:"default:86400" json:"session_timeout"` // seconds
	MaxLoginAttempts     int       `gorm:"default:5" json:"max_login_attempts"`
	LockoutDuration      int       `gorm:"default:900" json:"lockout_duration"` // seconds
	RequireTwoFactor     bool      `gorm:"default:false" json:"require_two_factor"`
	IPWhitelist          string    `json:"ip_whitelist"` // JSON array
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// Login attempt tracking
type LoginAttempt struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"not null" json:"username"`
	IPAddress string    `json:"ip_address"`
	UserAgent string    `json:"user_agent"`
	Success   bool      `json:"success"`
	Reason    string    `json:"reason"` // success, invalid_credentials, locked_out, etc.
	CreatedAt time.Time `json:"created_at"`
}
