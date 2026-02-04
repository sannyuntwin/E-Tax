package database

import (
	"time"
)

type PaymentReminder struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	InvoiceID     uint      `json:"invoice_id"`
	ReminderType  string    `json:"reminder_type"` // due_date, overdue, custom
	DaysBefore    int       `json:"days_before"`
	IsSent        bool      `gorm:"default:false" json:"is_sent"`
	ScheduledDate string    `json:"scheduled_date"`
	SentDate      string    `json:"sent_date"`
	EmailSent     bool      `gorm:"default:false" json:"email_sent"`
	SMSSent       bool      `gorm:"default:false" json:"sms_sent"`
	Message       string    `json:"message"`
	CreatedAt     string    `json:"created_at"`
	UpdatedAt     string    `json:"updated_at"`
	
	Invoice       Invoice   `gorm:"foreignKey:InvoiceID" json:"invoice"`
}

type Payment struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	InvoiceID      uint   `json:"invoice_id"`
	Amount         float64 `json:"amount"`
	PaymentDate    string `json:"payment_date"`
	PaymentMethod  string `json:"payment_method"`
	ReferenceNumber string `json:"reference_number"`
	Notes          string `json:"notes"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
	
	Invoice        Invoice `gorm:"foreignKey:InvoiceID" json:"invoice"`
}

type PaymentStats struct {
	TotalPaid      float64 `json:"total_paid"`
	TotalUnpaid    float64 `json:"total_unpaid"`
	OverdueAmount  float64 `json:"overdue_amount"`
	ThisMonthPaid  float64 `json:"this_month_paid"`
	PaidInvoices   int     `json:"paid_invoices"`
	UnpaidInvoices int     `json:"unpaid_invoices"`
	OverdueInvoices int    `json:"overdue_invoices"`
}

// Enhanced Invoice with payment tracking
type InvoiceWithPayments struct {
	ID                  uint     `gorm:"primaryKey" json:"id"`
	InvoiceNo           string   `gorm:"unique;not null" json:"invoice_no"`
	IssueDate           string   `gorm:"not null" json:"issue_date"`
	DueDate             string   `json:"due_date"`
	CompanyID           uint     `json:"company_id"`
	CustomerID          uint     `json:"customer_id"`
	Subtotal            float64  `gorm:"default:0" json:"subtotal"`
	VATAmount           float64  `gorm:"default:0" json:"vat_amount"`
	TotalAmount         float64  `gorm:"default:0" json:"total_amount"`
	Status              string   `gorm:"default:draft" json:"status"`
	Notes               string   `json:"notes"`
	IsDraft             bool     `gorm:"default:false" json:"is_draft"`
	LastSaved           string   `json:"last_saved"`
	IsRecurring         bool     `gorm:"default:false" json:"is_recurring"`
	RecurringInvoiceID  *uint    `json:"recurring_invoice_id"`
	PaymentStatus       string   `gorm:"default:unpaid" json:"payment_status"` // unpaid, partial, paid, overdue
	PaidAmount          float64  `gorm:"default:0" json:"paid_amount"`
	PaymentDate         string   `json:"payment_date"`
	PaymentMethod       string   `json:"payment_method"`
	CreatedAt           string   `json:"created_at"`
	UpdatedAt           string   `json:"updated_at"`
	
	Company    Company       `gorm:"foreignKey:CompanyID" json:"company"`
	Customer   Customer      `gorm:"foreignKey:CustomerID" json:"customer"`
	Items      []InvoiceItem `gorm:"foreignKey:InvoiceID" json:"items"`
	Payments   []Payment     `gorm:"foreignKey:InvoiceID" json:"payments"`
	Reminders []PaymentReminder `gorm:"foreignKey:InvoiceID" json:"reminders"`
}
