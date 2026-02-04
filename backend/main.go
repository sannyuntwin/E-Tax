package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"backend/api"
	"backend/database"
	"backend/security"
)

func main() {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		fmt.Println("No .env file found")
	}

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		return
	}

	// Initialize security service
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "your-super-secret-jwt-key-change-in-production"
		fmt.Println("WARNING: Using default JWT secret key. Set JWT_SECRET environment variable in production!")
	}
	
	securityService := security.NewSecurityService(secretKey)

	// Set up Gin router with security and performance optimizations
	r := gin.New()
	
	// Add security middleware first
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(security.EnhancedSecurityHeaders())
	r.Use(security.EnhancedCORS())
	r.Use(security.EnhancedRateLimiter(100, 20))
	r.Use(security.ValidateInput())
	r.Use(security.SecureFileUpload())
	
	// Add performance middleware
	r.Use(api.PerformanceMiddleware())
	r.Use(api.CompressionMiddleware())
	
	// Add audit logging
	r.Use(security.AuditLogger(db))

	// Setup API routes
	api.SetupRoutes(r, db, securityService)

	// Add health check endpoint
	r.GET("/health", api.HealthCheck(db))
	r.GET("/api/health", api.HealthCheck(db))

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🔒 E-Tax API Server starting on port %s\n", port)
	fmt.Printf("🏥 Health check available at: http://localhost:%s/health\n", port)
	fmt.Printf("📊 Performance metrics at: http://localhost:%s/api/performance/metrics\n", port)
	fmt.Printf("🔐 Security enabled with JWT authentication\n", port)
	fmt.Printf("📝 API Documentation: http://localhost:%s/api/docs\n", port)
	
	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	// Run server
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		fmt.Printf("Failed to start server: %v\n", err)
	}
}
