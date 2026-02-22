package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port string
	AppEnv string
	AppDebug bool
	LogLevel string

	// Database
	Database DatabaseConfig

	// Security
	JWTSecret string
	JWTExpireHours int

	// CORS
	AllowedOrigins []string

	// Rate Limiting
	RateLimitRequests int
	RateLimitWindow  int

	// Email
	SMTP SMTPConfig

	// File Upload
	MaxFileSize int64
	UploadPath string
}

type DatabaseConfig struct {
	Host         string
	Port         string
	User         string
	Password     string
	Name         string
	MaxOpenConns int
	MaxIdleConns int
	MaxLifetime  time.Duration
}

type SMTPConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	From     string
}

func Load() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("/app/.env"); err != nil {
			fmt.Println("No .env file found, using environment variables")
		}
	}

	config := &Config{
		Port:    getEnv("PORT", "8080"),
		AppEnv:  getEnv("APP_ENV", "development"),
		LogLevel: getEnv("APP_LOG_LEVEL", "info"),
	}

	// App debug
	config.AppDebug = config.AppEnv == "development"

	// Database
	config.Database = DatabaseConfig{
		Host:         getEnv("DB_HOST", "localhost"),
		Port:         getEnv("DB_PORT", "5432"),
		User:         getEnv("DB_USER", "postgres"),
		Password:     getEnv("DB_PASSWORD", ""),
		Name:         getEnv("DB_NAME", "etax"),
		MaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 25),
		MaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 10),
		MaxLifetime:  time.Duration(getEnvInt("DB_CONN_MAX_LIFETIME", 300)) * time.Second,
	}

	// Security
	config.JWTSecret = getEnv("JWT_SECRET", "")
	if config.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}
	if len(config.JWTSecret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 characters long")
	}
	config.JWTExpireHours = getEnvInt("JWT_EXPIRE_HOURS", 24)

	// CORS
	allowedOrigins := getEnv("ALLOWED_ORIGINS", "http://localhost:3000")
	config.AllowedOrigins = strings.Split(allowedOrigins, ",")

	// Rate limiting
	config.RateLimitRequests = getEnvInt("RATE_LIMIT_REQUESTS", 100)
	config.RateLimitWindow = getEnvInt("RATE_LIMIT_WINDOW", 20)

	// Email
	config.SMTP = SMTPConfig{
		Host:     getEnv("SMTP_HOST", ""),
		Port:     getEnv("SMTP_PORT", ""),
		User:     getEnv("SMTP_USER", ""),
		Password: getEnv("SMTP_PASSWORD", ""),
		From:     getEnv("SMTP_FROM", ""),
	}

	// File upload
	config.MaxFileSize = getEnvInt64("MAX_FILE_SIZE", 10485760) // 10MB
	config.UploadPath = getEnv("UPLOAD_PATH", "./uploads")

	return config, nil
}

func GetConfig() *Config {
	// Legacy function for backward compatibility
	config, err := Load()
	if err != nil {
		panic(fmt.Sprintf("Failed to load config: %v", err))
	}
	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func (c *Config) IsProduction() bool {
	return c.AppEnv == "production"
}

func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

func (c *Config) DatabaseURL() string {
	// Check if DATABASE_URL is set (for Render)
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		return dbURL
	}
	
	// Fall back to individual DB variables (for local development)
	return fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		c.Database.Host,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.Port,
		map[bool]string{true: "require", false: "disable"}[c.IsProduction()],
	)
}
