package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"etax/api"
	"etax/config"
	"etax/database"
	"etax/security"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	// Set Gin mode based on environment
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		os.Exit(1)
	}

	// Initialize security service
	securityService := security.NewSecurityService(cfg.JWTSecret)

	// Set up Gin router with security and performance optimizations
	r := gin.New()
	
	// Add security middleware first
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(security.EnhancedSecurityHeaders())
	r.Use(security.EnhancedCORS(cfg.AllowedOrigins))
	r.Use(security.EnhancedRateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow))
	r.Use(security.ValidateInput())
	r.Use(security.SecureFileUpload(cfg.MaxFileSize))
	
	// Add performance middleware
	r.Use(api.PerformanceMiddleware())
	r.Use(api.CompressionMiddleware())
	
	// Add audit logging
	r.Use(security.AuditLogger(db))

	// Setup API routes
	api.SetupRoutes(r, db, securityService)

	fmt.Printf("🔒 E-Tax API Server starting on port %s\n", cfg.Port)
	fmt.Printf("🏥 Health check available at: http://localhost:%s/health\n", cfg.Port)
	fmt.Printf("📊 Performance metrics at: http://localhost:%s/api/performance/metrics\n", cfg.Port)
	fmt.Printf("🔐 Security enabled with JWT authentication\n")
	fmt.Printf("📝 API Documentation: http://localhost:%s/api/docs\n", cfg.Port)
	
	if cfg.IsDevelopment() {
		fmt.Printf("⚠️  Running in development mode\n")
	}
	
	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// Run server
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("Failed to start server: %v\n", err)
		os.Exit(1)
	}
}
