package repositories

import (
	"gorm.io/gorm"
	"etax/internal/database/models"
)

type CustomerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) *CustomerRepository {
	return &CustomerRepository{db: db}
}

func (r *CustomerRepository) Create(customer *database.Customer) error {
	return r.db.Create(customer).Error
}

func (r *CustomerRepository) GetByID(id uint) (*database.Customer, error) {
	var customer database.Customer
	if err := r.db.First(&customer, id).Error; err != nil {
		return nil, err
	}
	return &customer, nil
}

func (r *CustomerRepository) Update(customer *database.Customer) error {
	return r.db.Save(customer).Error
}

func (r *CustomerRepository) Delete(id uint) error {
	return r.db.Delete(&database.Customer{}, id).Error
}

func (r *CustomerRepository) List(page, limit int) ([]database.Customer, int64, error) {
	var customers []database.Customer
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&database.Customer{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Offset(offset).Limit(limit).Find(&customers).Error; err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (r *CustomerRepository) Search(query string, page, limit int) ([]database.Customer, int64, error) {
	var customers []database.Customer
	var total int64

	offset := (page - 1) * limit
	searchPattern := "%" + query + "%"

	if err := r.db.Model(&database.Customer{}).Where("name LIKE ? OR email LIKE ? OR tax_id LIKE ?", searchPattern, searchPattern, searchPattern).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Where("name LIKE ? OR email LIKE ? OR tax_id LIKE ?", searchPattern, searchPattern, searchPattern).
		Offset(offset).Limit(limit).Find(&customers).Error; err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

func (r *CustomerRepository) GetCustomerStats() (map[string]interface{}, error) {
	var totalCustomers int64

	if err := r.db.Model(&database.Customer{}).Count(&totalCustomers).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_customers": totalCustomers,
	}, nil
}
