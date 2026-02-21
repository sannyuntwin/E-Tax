package auth

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"etax/internal/database/models"
	"etax/internal/api/middleware/auth"
)

type AuthService struct {
	db             *gorm.DB
	securityService *auth.SecurityService
}

func NewAuthService(db *gorm.DB, securityService *auth.SecurityService) *AuthService {
	return &AuthService{
		db:             db,
		securityService: securityService,
	}
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User      *database.User `json:"user"`
}

func (s *AuthService) Login(req *LoginRequest) (*LoginResponse, error) {
	// Find user by username
	var user database.User
	if err := s.db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, err
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.New("user account is disabled")
	}

	// Verify password
	valid, err := s.securityService.VerifyPassword(req.Password, user.Password)
	if err != nil || !valid {
		return nil, errors.New("invalid credentials")
	}

	// Generate JWT token
	accessToken, err := s.securityService.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, err
	}

	// Generate refresh token (for now, use the same token)
	refreshToken, err := s.securityService.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, err
	}

	// Update last login
	now := time.Now()
	s.db.Model(&user).Update("last_login", &now)

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         &user,
	}, nil
}

func (s *AuthService) Register(req *RegisterRequest) (*LoginResponse, error) {
	// Check if user already exists
	var existingUser database.User
	if err := s.db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("user already exists")
	}

	// Hash password
	hashedPassword, err := s.securityService.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// Create user
	user := database.User{
		Username:  req.Username,
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Password:  hashedPassword,
		Role:      "user", // Default role
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, err
	}

	// Generate tokens
	accessToken, err := s.securityService.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.securityService.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, err
	}

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         &user,
	}, nil
}

type RegisterRequest struct {
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Password  string `json:"password" binding:"required,min=6"`
}

func (s *AuthService) GetProfile(userID uint) (*database.User, error) {
	var user database.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *AuthService) UpdateProfile(userID uint, req *UpdateProfileRequest) (*database.User, error) {
	var user database.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	// Update fields
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	user.UpdatedAt = time.Now()

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

type UpdateProfileRequest struct {
	Email     string `json:"email,omitempty"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}

func (s *AuthService) ChangePassword(userID uint, currentPassword, newPassword string) error {
	var user database.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return err
	}

	// Verify current password
	valid, err := s.securityService.VerifyPassword(currentPassword, user.Password)
	if err != nil || !valid {
		return errors.New("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := s.securityService.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// Update password
	user.Password = hashedPassword
	user.UpdatedAt = time.Now()

	return s.db.Save(&user).Error
}
