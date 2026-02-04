package database

import (
	"time"
)

type Product struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Name        string  `gorm:"not null" json:"name"`
	Description string  `json:"description"`
	UnitPrice   float64 `gorm:"default:0" json:"unit_price"`
	VATRate     float64 `gorm:"default:7" json:"vat_rate"`
	Category    string  `json:"category"`
	SKU         string  `json:"sku"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type InvoiceTemplate struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	CompanyID   uint   `json:"company_id"`
	CustomerID  uint   `json:"customer_id"`
	Items       string `json:"items"` // JSON string
	Notes       string `json:"notes"`
	IsDefault   bool   `gorm:"default:false" json:"is_default"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

// Enhanced Invoice with draft support
type InvoiceDraft struct {
	ID          uint     `gorm:"primaryKey" json:"id"`
	InvoiceNo   string   `gorm:"unique;not null" json:"invoice_no"`
	IssueDate   string   `gorm:"not null" json:"issue_date"`
	DueDate     string   `json:"due_date"`
	CompanyID   uint     `json:"company_id"`
	CustomerID  uint     `json:"customer_id"`
	Subtotal    float64  `gorm:"default:0" json:"subtotal"`
	VATAmount   float64  `gorm:"default:0" json:"vat_amount"`
	TotalAmount float64  `gorm:"default:0" json:"total_amount"`
	Status      string   `gorm:"default:draft" json:"status"`
	Notes       string   `json:"notes"`
	IsDraft     bool     `gorm:"default:false" json:"is_draft"`
	LastSaved   string   `json:"last_saved"`
	CreatedAt   string   `json:"created_at"`
	UpdatedAt   string   `json:"updated_at"`
	
	Company    Company       `gorm:"foreignKey:CompanyID" json:"company"`
	Customer   Customer      `gorm:"foreignKey:CustomerID" json:"customer"`
	Items      []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"items"`
}

// Dashboard Analytics
type DashboardStats struct {
	TotalRevenue      float64 `json:"total_revenue"`
	UnpaidAmount      float64 `json:"unpaid_amount"`
	ThisMonthRevenue  float64 `json:"this_month_revenue"`
	TotalInvoices     int     `json:"total_invoices"`
	PaidInvoices      int     `json:"paid_invoices"`
	UnpaidInvoices    int     `json:"unpaid_invoices"`
	OverdueInvoices   int     `json:"overdue_invoices"`
	DraftInvoices     int     `json:"draft_invoices"`
}
