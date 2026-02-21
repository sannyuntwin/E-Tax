package repositories

import (
	"gorm.io/gorm"
	"etax/internal/database/models"
)

type CompanyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) *CompanyRepository {
	return &CompanyRepository{db: db}
}

func (r *CompanyRepository) Create(company *database.Company) error {
	return r.db.Create(company).Error
}

func (r *CompanyRepository) GetByID(id uint) (*database.Company, error) {
	var company database.Company
	if err := r.db.First(&company, id).Error; err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *CompanyRepository) GetByTaxID(taxID string) (*database.Company, error) {
	var company database.Company
	if err := r.db.Where("tax_id = ?", taxID).First(&company).Error; err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *CompanyRepository) Update(company *database.Company) error {
	return r.db.Save(company).Error
}

func (r *CompanyRepository) Delete(id uint) error {
	return r.db.Delete(&database.Company{}, id).Error
}

func (r *CompanyRepository) List(page, limit int) ([]database.Company, int64, error) {
	var companies []database.Company
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&database.Company{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Offset(offset).Limit(limit).Find(&companies).Error; err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

func (r *CompanyRepository) GetActiveCompanies() ([]database.Company, error) {
	var companies []database.Company
	if err := r.db.Where("is_active = ?", true).Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}

func (r *CompanyRepository) UpdateStatus(id uint, status string) error {
	return r.db.Model(&database.Company{}).Where("id = ?", id).Update("status", status).Error
}

func (r *CompanyRepository) GetCompanyStats() (map[string]interface{}, error) {
	var totalCompanies, activeCompanies int64

	if err := r.db.Model(&database.Company{}).Count(&totalCompanies).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&database.Company{}).Where("is_active = ?", true).Count(&activeCompanies).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_companies":  totalCompanies,
		"active_companies": activeCompanies,
		"inactive_companies": totalCompanies - activeCompanies,
	}, nil
}
