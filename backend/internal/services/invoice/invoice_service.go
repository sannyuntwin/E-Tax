package invoice

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"etax/internal/database/models"
	"etax/internal/database/repositories"
)

type InvoiceService struct {
	invoiceRepo *repositories.InvoiceRepository
	companyRepo *repositories.CompanyRepository
	customerRepo *repositories.CustomerRepository
}

func NewInvoiceService(db *gorm.DB) *InvoiceService {
	return &InvoiceService{
		invoiceRepo: repositories.NewInvoiceRepository(db),
		companyRepo: repositories.NewCompanyRepository(db),
		customerRepo: repositories.NewCustomerRepository(db),
	}
}

type CreateInvoiceRequest struct {
	InvoiceNo  string                    `json:"invoice_no" binding:"required"`
	IssueDate  time.Time                 `json:"issue_date" binding:"required"`
	DueDate    *time.Time                `json:"due_date"`
	CompanyID  uint                      `json:"company_id" binding:"required"`
	CustomerID uint                      `json:"customer_id" binding:"required"`
	Notes      string                    `json:"notes"`
	Items      []CreateInvoiceItemRequest `json:"items" binding:"required,min=1"`
}

type CreateInvoiceItemRequest struct {
	ProductName string  `json:"product_name" binding:"required"`
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity" binding:"required,min=0.01"`
	UnitPrice   float64 `json:"unit_price" binding:"required,min=0"`
}

type UpdateInvoiceRequest struct {
	IssueDate  *time.Time                `json:"issue_date"`
	DueDate    *time.Time                `json:"due_date"`
	Notes      string                    `json:"notes"`
	Status     string                    `json:"status"`
	Items      []CreateInvoiceItemRequest `json:"items"`
}

func (s *InvoiceService) Create(req *CreateInvoiceRequest) (*database.Invoice, error) {
	// Validate company exists
	_, err := s.companyRepo.GetByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	// Validate customer exists
	_, err = s.customerRepo.GetByID(req.CustomerID)
	if err != nil {
		return nil, errors.New("customer not found")
	}

	// Check if invoice number already exists
	existingInvoice, err := s.invoiceRepo.GetByInvoiceNo(req.InvoiceNo)
	if err == nil && existingInvoice != nil {
		return nil, errors.New("invoice number already exists")
	}

	// Calculate totals
	var subtotal float64
	var items []database.InvoiceItem

	for _, itemReq := range req.Items {
		lineTotal := itemReq.Quantity * itemReq.UnitPrice
		subtotal += lineTotal

		items = append(items, database.InvoiceItem{
			ProductName: itemReq.ProductName,
			Description: itemReq.Description,
			Quantity:    itemReq.Quantity,
			UnitPrice:   itemReq.UnitPrice,
			LineTotal:   lineTotal,
		})
	}

	// Calculate VAT (7% for Thailand)
	vatRate := 0.07
	vatAmount := subtotal * vatRate
	totalAmount := subtotal + vatAmount

	// Create invoice
	invoice := &database.Invoice{
		InvoiceNo:  req.InvoiceNo,
		IssueDate:  req.IssueDate.Format("2006-01-02"),
		DueDate:    req.DueDate.Format("2006-01-02"),
		CompanyID:  req.CompanyID,
		CustomerID: req.CustomerID,
		Subtotal:   subtotal,
		VATAmount:  vatAmount,
		TotalAmount: totalAmount,
		Status:     "draft",
		Notes:      req.Notes,
		Items:      items,
		CreatedAt:  time.Now().Format("2006-01-02 15:04:05"),
		UpdatedAt:  time.Now().Format("2006-01-02 15:04:05"),
	}

	if err := s.invoiceRepo.Create(invoice); err != nil {
		return nil, err
	}

	// Load relationships
	return s.invoiceRepo.GetByID(invoice.ID)
}

func (s *InvoiceService) GetByID(id uint) (*database.Invoice, error) {
	return s.invoiceRepo.GetByID(id)
}

func (s *InvoiceService) GetByInvoiceNo(invoiceNo string) (*database.Invoice, error) {
	return s.invoiceRepo.GetByInvoiceNo(invoiceNo)
}

func (s *InvoiceService) Update(id uint, req *UpdateInvoiceRequest) (*database.Invoice, error) {
	invoice, err := s.invoiceRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("invoice not found")
	}

	// Update fields
	if req.IssueDate != nil {
		invoice.IssueDate = req.IssueDate.Format("2006-01-02")
	}
	if req.DueDate != nil {
		invoice.DueDate = req.DueDate.Format("2006-01-02")
	}
	if req.Notes != "" {
		invoice.Notes = req.Notes
	}
	if req.Status != "" {
		invoice.Status = req.Status
	}

	// Update items if provided
	if len(req.Items) > 0 {
		var subtotal float64
		var items []database.InvoiceItem

		for _, itemReq := range req.Items {
			lineTotal := itemReq.Quantity * itemReq.UnitPrice
			subtotal += lineTotal

			items = append(items, database.InvoiceItem{
				InvoiceID:   invoice.ID,
				ProductName: itemReq.ProductName,
				Description: itemReq.Description,
				Quantity:    itemReq.Quantity,
				UnitPrice:   itemReq.UnitPrice,
				LineTotal:   lineTotal,
			})
		}

		// Recalculate totals
		vatRate := 0.07
		vatAmount := subtotal * vatRate
		totalAmount := subtotal + vatAmount

		invoice.Subtotal = subtotal
		invoice.VATAmount = vatAmount
		invoice.TotalAmount = totalAmount
		invoice.Items = items
	}

	invoice.UpdatedAt = time.Now().Format("2006-01-02 15:04:05")

	if err := s.invoiceRepo.Update(invoice); err != nil {
		return nil, err
	}

	return s.invoiceRepo.GetByID(invoice.ID)
}

func (s *InvoiceService) Delete(id uint) error {
	_, err := s.invoiceRepo.GetByID(id)
	if err != nil {
		return errors.New("invoice not found")
	}

	return s.invoiceRepo.Delete(id)
}

func (s *InvoiceService) List(companyID uint, page, limit int) ([]database.Invoice, int64, error) {
	return s.invoiceRepo.List(companyID, page, limit)
}

func (s *InvoiceService) GetByStatus(status string) ([]database.Invoice, error) {
	return s.invoiceRepo.GetByStatus(status)
}

func (s *InvoiceService) GetByCustomer(customerID uint) ([]database.Invoice, error) {
	return s.invoiceRepo.GetByCustomer(customerID)
}

func (s *InvoiceService) GetOverdueInvoices() ([]database.Invoice, error) {
	return s.invoiceRepo.GetOverdueInvoices()
}

func (s *InvoiceService) UpdateStatus(id uint, status string) error {
	validStatuses := map[string]bool{
		"draft":     true,
		"sent":      true,
		"paid":      true,
		"overdue":   true,
		"cancelled": true,
	}

	if !validStatuses[status] {
		return errors.New("invalid status")
	}

	return s.invoiceRepo.UpdateStatus(id, status)
}

func (s *InvoiceService) GetInvoiceStats(companyID uint) (map[string]interface{}, error) {
	return s.invoiceRepo.GetInvoiceStats(companyID)
}

func (s *InvoiceService) GenerateInvoiceNumber(companyID uint) (string, error) {
	// Get current year
	year := time.Now().Format("2006")
	
	// Validate company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return "", err
	}

	// Count invoices for this company this year
	var count int64
	s.invoiceRepo.GetDB().Model(&database.Invoice{}).
		Where("company_id = ? AND YEAR(created_at) = ?", companyID, year).
		Count(&count)

	// Generate invoice number: INV{YEAR}{COMPANY_ID}{SEQUENCE:04d}
	sequence := count + 1
	invoiceNo := fmt.Sprintf("INV%s%04d%04d", year, companyID, sequence)

	return invoiceNo, nil
}
