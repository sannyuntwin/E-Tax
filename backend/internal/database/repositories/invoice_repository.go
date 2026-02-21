package repositories

import (
	"gorm.io/gorm"
	"etax/internal/database/models"
)

type InvoiceRepository struct {
	db *gorm.DB
}

func NewInvoiceRepository(db *gorm.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) GetDB() *gorm.DB {
	return r.db
}

func (r *InvoiceRepository) Create(invoice *database.Invoice) error {
	return r.db.Create(invoice).Error
}

func (r *InvoiceRepository) GetByID(id uint) (*database.Invoice, error) {
	var invoice database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").First(&invoice, id).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

func (r *InvoiceRepository) GetByInvoiceNo(invoiceNo string) (*database.Invoice, error) {
	var invoice database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").Where("invoice_no = ?", invoiceNo).First(&invoice).Error; err != nil {
		return nil, err
	}
	return &invoice, nil
}

func (r *InvoiceRepository) Update(invoice *database.Invoice) error {
	return r.db.Save(invoice).Error
}

func (r *InvoiceRepository) Delete(id uint) error {
	return r.db.Delete(&database.Invoice{}, id).Error
}

func (r *InvoiceRepository) List(companyID uint, page, limit int) ([]database.Invoice, int64, error) {
	var invoices []database.Invoice
	var total int64

	offset := (page - 1) * limit
	query := r.db.Model(&database.Invoice{})

	if companyID > 0 {
		query = query.Where("company_id = ?", companyID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("Items").Preload("Company").Preload("Customer").
		Offset(offset).Limit(limit).Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, 0, err
	}

	return invoices, total, nil
}

func (r *InvoiceRepository) GetByStatus(status string) ([]database.Invoice, error) {
	var invoices []database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").
		Where("status = ?", status).Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *InvoiceRepository) GetByCustomer(customerID uint) ([]database.Invoice, error) {
	var invoices []database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").
		Where("customer_id = ?", customerID).Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *InvoiceRepository) GetByDateRange(startDate, endDate string) ([]database.Invoice, error) {
	var invoices []database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").
		Where("issue_date BETWEEN ? AND ?", startDate, endDate).Order("created_at DESC").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *InvoiceRepository) GetOverdueInvoices() ([]database.Invoice, error) {
	var invoices []database.Invoice
	if err := r.db.Preload("Items").Preload("Company").Preload("Customer").
		Where("due_date < ? AND status != 'paid'", "NOW()").Order("due_date ASC").Find(&invoices).Error; err != nil {
		return nil, err
	}
	return invoices, nil
}

func (r *InvoiceRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&database.Invoice{}).Where("id = ?", id).Update("status", status).Error
}

func (r *InvoiceRepository) GetInvoiceStats(companyID uint) (map[string]interface{}, error) {
	var stats struct {
		TotalInvoices    int64   `json:"total_invoices"`
		PaidInvoices     int64   `json:"paid_invoices"`
		UnpaidInvoices   int64   `json:"unpaid_invoices"`
		OverdueInvoices  int64   `json:"overdue_invoices"`
		TotalAmount      float64 `json:"total_amount"`
		PaidAmount       float64 `json:"paid_amount"`
		UnpaidAmount     float64 `json:"unpaid_amount"`
	}

	query := r.db.Model(&database.Invoice{})
	if companyID > 0 {
		query = query.Where("company_id = ?", companyID)
	}

	// Count invoices
	if err := query.Count(&stats.TotalInvoices).Error; err != nil {
		return nil, err
	}

	// Count paid invoices
	if err := query.Where("status = ?", "paid").Count(&stats.PaidInvoices).Error; err != nil {
		return nil, err
	}

	// Count unpaid invoices
	if err := query.Where("status != ?", "paid").Count(&stats.UnpaidInvoices).Error; err != nil {
		return nil, err
	}

	// Count overdue invoices
	if err := query.Where("due_date < ? AND status != ?", "NOW()", "paid").Count(&stats.OverdueInvoices).Error; err != nil {
		return nil, err
	}

	// Sum amounts
	if err := query.Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalAmount).Error; err != nil {
		return nil, err
	}

	if err := query.Where("status = ?", "paid").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.PaidAmount).Error; err != nil {
		return nil, err
	}

	stats.UnpaidAmount = stats.TotalAmount - stats.PaidAmount

	return map[string]interface{}{
		"total_invoices":    stats.TotalInvoices,
		"paid_invoices":     stats.PaidInvoices,
		"unpaid_invoices":   stats.UnpaidInvoices,
		"overdue_invoices":  stats.OverdueInvoices,
		"total_amount":      stats.TotalAmount,
		"paid_amount":       stats.PaidAmount,
		"unpaid_amount":     stats.UnpaidAmount,
	}, nil
}
