package tests

import (
	"os"
	"testing"
	"etax/config"
)

func TestConfigLoad(t *testing.T) {
	// Save original environment variables
	originalEnv := make(map[string]string)
	envVars := []string{
		"PORT", "APP_ENV", "APP_LOG_LEVEL", "DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME",
		"JWT_SECRET", "JWT_EXPIRE_HOURS", "ALLOWED_ORIGINS", "RATE_LIMIT_REQUESTS", "RATE_LIMIT_WINDOW",
		"SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM",
		"MAX_FILE_SIZE", "UPLOAD_PATH", "DB_MAX_OPEN_CONNS", "DB_MAX_IDLE_CONNS", "DB_CONN_MAX_LIFETIME",
	}

	for _, env := range envVars {
		originalEnv[env] = os.Getenv(env)
	}

	// Clean up after test
	defer func() {
		for env, value := range originalEnv {
			if value == "" {
				os.Unsetenv(env)
			} else {
				os.Setenv(env, value)
			}
		}
	}()

	t.Run("Success with valid environment", func(t *testing.T) {
		os.Setenv("JWT_SECRET", "this_is_a_valid_secret_key_32_chars_long")
		os.Setenv("DB_HOST", "localhost")
		os.Setenv("DB_PASSWORD", "testpassword")
		
		config, err := config.Load()
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		if config.Port != "8080" {
			t.Errorf("Expected port 8080, got %s", config.Port)
		}
		
		if config.JWTSecret != "this_is_a_valid_secret_key_32_chars_long" {
			t.Errorf("Expected JWT secret to be set, got empty string")
		}
		
		if !config.IsDevelopment() {
			t.Errorf("Expected development mode, got production")
		}
	})

	t.Run("Production mode", func(t *testing.T) {
		os.Setenv("APP_ENV", "production")
		os.Setenv("JWT_SECRET", "this_is_a_valid_secret_key_32_chars_long")
		
		config, err := config.Load()
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		if !config.IsProduction() {
			t.Errorf("Expected production mode, got development")
		}
		
		if config.IsDevelopment() {
			t.Errorf("Expected not development mode in production")
		}
	})

	t.Run("Error with missing JWT secret", func(t *testing.T) {
		os.Unsetenv("JWT_SECRET")
		
		_, err := config.Load()
		
		if err == nil {
			t.Error("Expected error for missing JWT secret, got nil")
		}
		
		if err.Error() != "JWT_SECRET environment variable is required" {
			t.Errorf("Expected specific error message, got %v", err)
		}
	})

	t.Run("Error with short JWT secret", func(t *testing.T) {
		os.Setenv("JWT_SECRET", "short")
		
		_, err := config.Load()
		
		if err == nil {
			t.Error("Expected error for short JWT secret, got nil")
		}
		
		if err.Error() != "JWT_SECRET must be at least 32 characters long" {
			t.Errorf("Expected specific error message, got %v", err)
		}
	})

	t.Run("Default values", func(t *testing.T) {
		os.Setenv("JWT_SECRET", "this_is_a_valid_secret_key_32_chars_long")
		
		// Clear all other env vars
		for _, env := range envVars {
			if env != "JWT_SECRET" {
				os.Unsetenv(env)
			}
		}
		
		config, err := config.Load()
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		if config.Port != "8080" {
			t.Errorf("Expected default port 8080, got %s", config.Port)
		}
		
		if config.AppEnv != "development" {
			t.Errorf("Expected default app env development, got %s", config.AppEnv)
		}
		
		if config.LogLevel != "info" {
			t.Errorf("Expected default log level info, got %s", config.LogLevel)
		}
		
		if config.Database.Host != "localhost" {
			t.Errorf("Expected default DB host localhost, got %s", config.Database.Host)
		}
		
		if config.RateLimitRequests != 100 {
			t.Errorf("Expected default rate limit 100, got %d", config.RateLimitRequests)
		}
	})

	t.Run("Custom values", func(t *testing.T) {
		os.Setenv("JWT_SECRET", "this_is_a_valid_secret_key_32_chars_long")
		os.Setenv("PORT", "9000")
		os.Setenv("APP_ENV", "production")
		os.Setenv("DB_HOST", "customhost")
		os.Setenv("RATE_LIMIT_REQUESTS", "200")
		os.Setenv("ALLOWED_ORIGINS", "https://example.com,https://app.example.com")
		
		config, err := config.Load()
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		if config.Port != "9000" {
			t.Errorf("Expected port 9000, got %s", config.Port)
		}
		
		if config.AppEnv != "production" {
			t.Errorf("Expected app env production, got %s", config.AppEnv)
		}
		
		if config.Database.Host != "customhost" {
			t.Errorf("Expected DB host customhost, got %s", config.Database.Host)
		}
		
		if config.RateLimitRequests != 200 {
			t.Errorf("Expected rate limit 200, got %d", config.RateLimitRequests)
		}
		
		expectedOrigins := []string{"https://example.com", "https://app.example.com"}
		if len(config.AllowedOrigins) != 2 || 
		   config.AllowedOrigins[0] != expectedOrigins[0] || 
		   config.AllowedOrigins[1] != expectedOrigins[1] {
			t.Errorf("Expected allowed origins %v, got %v", expectedOrigins, config.AllowedOrigins)
		}
	})

	t.Run("Database URL generation", func(t *testing.T) {
		os.Setenv("JWT_SECRET", "this_is_a_valid_secret_key_32_chars_long")
		os.Setenv("DB_HOST", "testhost")
		os.Setenv("DB_USER", "testuser")
		os.Setenv("DB_PASSWORD", "testpass")
		os.Setenv("DB_NAME", "testdb")
		os.Setenv("DB_PORT", "5433")
		
		dbConfig, err := config.Load()
		
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		expectedURL := "host=testhost user=testuser password=testpass dbname=testdb port=5433 sslmode=disable"
		if dbConfig.DatabaseURL() != expectedURL {
			t.Errorf("Expected database URL %s, got %s", expectedURL, dbConfig.DatabaseURL())
		}
		
		// Test production SSL mode
		os.Setenv("APP_ENV", "production")
		prodConfig, err := config.Load()
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}
		
		expectedURL = "host=testhost user=testuser password=testpass dbname=testdb port=5433 sslmode=require"
		if prodConfig.DatabaseURL() != expectedURL {
			t.Errorf("Expected production database URL %s, got %s", expectedURL, prodConfig.DatabaseURL())
		}
	})
}
