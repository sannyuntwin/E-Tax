package database

import (
	"fmt"
	"backend/config"
	"time"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	cfg := config.GetConfig()
	
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	var db *gorm.DB
	var err error
	
	// Retry connection for up to 30 seconds
	for i := 0; i < 30; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err == nil {
			break
		}
		
		fmt.Printf("Database connection attempt %d failed: %v\n", i+1, err)
		time.Sleep(1 * time.Second)
	}
	
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after 30 attempts: %w", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&Company{}, &Customer{}, &Invoice{}, &InvoiceItem{}, &Product{}, &InvoiceTemplate{}, &RecurringInvoice{}, &PaymentReminder{}, &Payment{})
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	DB = db
	return db, nil
}

type Company struct {
	ID             uint   `gorm:"primaryKey" json:"id"`
	TaxID          string `gorm:"unique;not null" json:"tax_id"`
	CompanyName    string `gorm:"not null" json:"company_name"`
	Address        string `json:"address"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	CertificatePath string `json:"certificate_path"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}

type Customer struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"not null" json:"name"`
	TaxID     string `json:"tax_id"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type Invoice struct {
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
}

type InvoiceItem struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	InvoiceID   uint    `json:"invoice_id"`
	ProductName string  `gorm:"not null" json:"product_name"`
	Description string  `json:"description"`
	Quantity    float64 `gorm:"default:1" json:"quantity"`
	UnitPrice   float64 `gorm:"default:0" json:"unit_price"`
	LineTotal   float64 `gorm:"default:0" json:"line_total"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}
