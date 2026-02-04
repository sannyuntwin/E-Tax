package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"backend/api"
	"backend/database"
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

	// Set up Gin router with performance optimizations
	r := gin.New()
	
	// Add performance and security middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(api.PerformanceMiddleware())
	r.Use(api.CorsMiddleware())
	r.Use(api.SecurityHeadersMiddleware())
	r.Use(api.CompressionMiddleware())
	
	// Add rate limiting (100 requests per minute)
	r.Use(api.RateLimiterMiddleware(100))

	// Setup API routes
	api.SetupRoutes(r, db)

	// Add health check endpoint
	r.GET("/health", api.HealthCheck(db))
	r.GET("/api/health", api.HealthCheck(db))

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("E-Tax API Server starting on port %s\n", port)
	fmt.Printf("Health check available at: http://localhost:%s/health\n", port)
	fmt.Printf("Performance metrics at: http://localhost:%s/api/performance/metrics\n", port)
	
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
