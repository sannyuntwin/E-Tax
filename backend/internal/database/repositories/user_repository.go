package repositories

import (
	"gorm.io/gorm"
	"etax/internal/database/models"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *database.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) GetByID(id uint) (*database.User, error) {
	var user database.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByUsername(username string) (*database.User, error) {
	var user database.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetByEmail(email string) (*database.User, error) {
	var user database.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) Update(user *database.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&database.User{}, id).Error
}

func (r *UserRepository) List(page, limit int) ([]database.User, int64, error) {
	var users []database.User
	var total int64

	offset := (page - 1) * limit

	if err := r.db.Model(&database.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *UserRepository) FindByUsernameOrEmail(username, email string) (*database.User, error) {
	var user database.User
	if err := r.db.Where("username = ? OR email = ?", username, email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateLastLogin(userID uint) error {
	return r.db.Model(&database.User{}).Where("id = ?", userID).Update("last_login", gorm.Expr("NOW()")).Error
}

func (r *UserRepository) UpdatePassword(userID uint, hashedPassword string) error {
	return r.db.Model(&database.User{}).Where("id = ?", userID).Update("password", hashedPassword).Error
}

func (r *UserRepository) ActivateUser(userID uint) error {
	return r.db.Model(&database.User{}).Where("id = ?", userID).Update("is_active", true).Error
}

func (r *UserRepository) DeactivateUser(userID uint) error {
	return r.db.Model(&database.User{}).Where("id = ?", userID).Update("is_active", false).Error
}

func (r *UserRepository) GetActiveUsers() ([]database.User, error) {
	var users []database.User
	if err := r.db.Where("is_active = ?", true).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *UserRepository) GetUserStats() (map[string]interface{}, error) {
	var totalUsers, activeUsers int64

	if err := r.db.Model(&database.User{}).Count(&totalUsers).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&database.User{}).Where("is_active = ?", true).Count(&activeUsers).Error; err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"total_users":  totalUsers,
		"active_users": activeUsers,
		"inactive_users": totalUsers - activeUsers,
	}, nil
}
