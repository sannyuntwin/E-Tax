package security

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"time"

	"golang.org/x/crypto/argon2"
	"github.com/golang-jwt/jwt/v5"
)

// JWT configuration
type JWTConfig struct {
	SecretKey     string
	AccessTokenTTL time.Duration
	RefreshTokenTTL time.Duration
	Issuer        string
}

// Password hashing configuration
type PasswordConfig struct {
	Memory      uint32
	Iterations  uint32
	Parallelism uint8
	SaltLength  uint32
	KeyLength   uint32
}

// Security service
type SecurityService struct {
	jwtConfig     JWTConfig
	passwordConfig PasswordConfig
}

// Create new security service
func NewSecurityService(secretKey string) *SecurityService {
	return &SecurityService{
		jwtConfig: JWTConfig{
			SecretKey:     secretKey,
			AccessTokenTTL: 15 * time.Minute,
			RefreshTokenTTL: 7 * 24 * time.Hour,
			Issuer:        "e-tax-api",
		},
		passwordConfig: PasswordConfig{
			Memory:      64 * 1024,
			Iterations:  3,
			Parallelism: 2,
			SaltLength:  16,
			KeyLength:   32,
		},
	}
}

// Hash password using Argon2
func (s *SecurityService) HashPassword(password string) (string, error) {
	salt := make([]byte, s.passwordConfig.SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	hash := argon2.IDKey([]byte(password), salt, s.passwordConfig.Iterations,
		s.passwordConfig.Memory, s.passwordConfig.Parallelism, s.passwordConfig.KeyLength)

	// Store salt + hash
	saltedHash := append(salt, hash...)
	return base64.StdEncoding.EncodeToString(saltedHash), nil
}

// Verify password
func (s *SecurityService) VerifyPassword(password, hashedPassword string) (bool, error) {
	saltedHash, err := base64.StdEncoding.DecodeString(hashedPassword)
	if err != nil {
		return false, fmt.Errorf("failed to decode hashed password: %w", err)
	}

	if len(saltedHash) < int(s.passwordConfig.SaltLength) {
		return false, fmt.Errorf("invalid hashed password format")
	}

	salt := saltedHash[:s.passwordConfig.SaltLength]
	hash := saltedHash[s.passwordConfig.SaltLength:]

	computedHash := argon2.IDKey([]byte(password), salt, s.passwordConfig.Iterations,
		s.passwordConfig.Memory, s.passwordConfig.Parallelism, s.passwordConfig.KeyLength)

	return subtle.ConstantTimeCompare(hash, computedHash) == 1, nil
}

// Generate JWT access token
func (s *SecurityService) GenerateAccessToken(userID uint, username, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"role":     role,
		"type":     "access",
		"exp":      time.Now().Add(s.jwtConfig.AccessTokenTTL).Unix(),
		"iat":      time.Now().Unix(),
		"iss":      s.jwtConfig.Issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtConfig.SecretKey))
}

// Generate JWT refresh token
func (s *SecurityService) GenerateRefreshToken(userID uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"type":    "refresh",
		"exp":     time.Now().Add(s.jwtConfig.RefreshTokenTTL).Unix(),
		"iat":     time.Now().Unix(),
		"iss":     s.jwtConfig.Issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtConfig.SecretKey))
}

// Validate JWT token
func (s *SecurityService) ValidateToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtConfig.SecretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// Generate secure random string
func GenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random string: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// Generate API key
func GenerateAPIKey() (string, error) {
	return GenerateRandomString(32)
}

// Validate password strength
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char == '!' || char == '@' || char == '#' || char == '$' || char == '%' || char == '^' || char == '&' || char == '*' || char == '(' || char == ')' || char == '-' || char == '_' || char == '+' || char == '=' || char == '{' || char == '}' || char == '[' || char == ']' || char == '|' || char == '\\' || char == ';' || char == ':' || char == '"' || char == '\'' || char == '<' || char == '>' || char == ',' || char == '.' || char == '?' || char == '/':
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}
	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

// Sanitize input string
func SanitizeInput(input string) string {
	// Basic sanitization - in production, use more sophisticated sanitization
	sanitized := input
	// Remove potentially dangerous characters
	dangerous := []string{"<", ">", "&", "\"", "'", "/", "\\", "(", ")", "{", "}", "[", "]"}
	for _, char := range dangerous {
		sanitized = replaceAll(sanitized, char, "")
	}
	return sanitized
}

func replaceAll(s string, old, new string) string {
	result := ""
	for _, char := range s {
		if string(char) == old {
			result += new
		} else {
			result += string(char)
		}
	}
	return result
}

// Validate email format
func ValidateEmail(email string) bool {
	// Basic email validation
	if len(email) < 5 || len(email) > 254 {
		return false
	}
	
	atIndex := -1
	for i, char := range email {
		if char == '@' {
			if atIndex != -1 {
				return false // Multiple @ symbols
			}
			atIndex = i
		}
	}
	
	if atIndex == -1 || atIndex == 0 || atIndex == len(email)-1 {
		return false
	}
	
	return true
}

// Generate session ID
func GenerateSessionID() (string, error) {
	return GenerateRandomString(64)
}

// Check if IP is in whitelist
func IsIPWhitelisted(ip string, whitelist []string) bool {
	if len(whitelist) == 0 {
		return true // No whitelist means allow all
	}
	
	for _, allowedIP := range whitelist {
		if ip == allowedIP {
			return true
		}
	}
	
	return false
}

// Rate limiting helper
type RateLimiter struct {
	attempts map[string]int
	lastReset map[string]time.Time
	maxAttempts int
	window time.Duration
}

func NewRateLimiter(maxAttempts int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		attempts:   make(map[string]int),
		lastReset:  make(map[string]time.Time),
		maxAttempts: maxAttempts,
		window:     window,
	}
}

func (r *RateLimiter) IsAllowed(key string) bool {
	now := time.Now()
	
	// Reset if window has passed
	if lastReset, exists := r.lastReset[key]; exists {
		if now.Sub(lastReset) > r.window {
			r.attempts[key] = 0
			r.lastReset[key] = now
		}
	} else {
		r.lastReset[key] = now
	}
	
	// Check attempts
	if r.attempts[key] >= r.maxAttempts {
		return false
	}
	
	r.attempts[key]++
	return true
}

func (r *RateLimiter) Reset(key string) {
	delete(r.attempts, key)
	delete(r.lastReset, key)
}
