package database

import (
	"time"
)

type RecurringInvoice struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	Name              string    `gorm:"not null" json:"name"`
	Description       string    `json:"description"`
	CompanyID         uint      `json:"company_id"`
	CustomerID        uint      `json:"customer_id"`
	Frequency         string    `gorm:"not null" json:"frequency"` // daily, weekly, monthly, quarterly, yearly
	IntervalValue     int       `gorm:"default:1" json:"interval_value"`
	StartDate         string    `gorm:"not null" json:"start_date"`
	EndDate           string    `json:"end_date"`
	NextInvoiceDate   string    `gorm:"not null" json:"next_invoice_date"`
	IsActive          bool      `gorm:"default:true" json:"is_active"`
	LastGenerated     string    `json:"last_generated"`
	TotalGenerated    int       `gorm:"default:0" json:"total_generated"`
	TemplateData      string    `json:"template_data"` // JSON string
	CreatedAt         string    `json:"created_at"`
	UpdatedAt         string    `json:"updated_at"`
	
	Company           Company   `gorm:"foreignKey:CompanyID" json:"company"`
	Customer          Customer  `gorm:"foreignKey:CustomerID" json:"customer"`
	Invoices          []Invoice `gorm:"foreignKey:RecurringInvoiceID" json:"invoices"`
}

type RecurringInvoiceStats struct {
	ActiveCount       int     `json:"active_count"`
	InactiveCount     int     `json:"inactive_count"`
	ThisMonthCount     int     `json:"this_month_count"`
	TotalValue         float64 `json:"total_value"`
	NextDueCount       int     `json:"next_due_count"`
}
