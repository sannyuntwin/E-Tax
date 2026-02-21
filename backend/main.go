package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"etax/internal/api/routes"
	"etax/internal/config"
	"etax/internal/database/models"
	"etax/internal/api/middleware"
	"etax/internal/api/middleware/auth"
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
	securityService := auth.NewSecurityService(cfg.JWTSecret)

	// Set up Gin router with security and performance optimizations
	r := gin.New()
	
	// Add security middleware first
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Next()
	})
	r.Use(middleware.EnhancedSecurityHeaders())
	r.Use(middleware.EnhancedCORS(cfg.AllowedOrigins))
	r.Use(middleware.EnhancedRateLimiter(cfg.RateLimitRequests, cfg.RateLimitWindow))
	r.Use(middleware.ValidateInput())
	r.Use(middleware.SecureFileUpload(cfg.MaxFileSize))
	
	// Add performance middleware
	r.Use(middleware.PerformanceMiddleware())
	// r.Use(middleware.CompressionMiddleware())  // Temporarily disabled
	
	// Add audit logging
	r.Use(middleware.AuditLogger(db))

	// Setup API routes
	routes.SetupRoutes(r, db, securityService)
	
	// Add root route to show API is running
	r.GET("/", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{
			"message": "🚀 E-Tax API is running!",
			"status": "healthy",
			"version": "1.0.0",
			"endpoints": gin.H{
				"public": gin.H{
					"health":       "/health",
					"test":         "/test",
					"docs":         "/api/docs",
				},
				"authentication": gin.H{
					"login":        "/api/auth/login",
					"register":     "/api/auth/register",
					"refresh":      "/api/auth/refresh",
					"logout":       "/api/auth/logout",
				},
				"user_profile": gin.H{
					"get_profile":       "/api/profile",
					"update_profile":    "/api/profile",
					"change_password":   "/api/change-password",
				},
				"invoices": gin.H{
					"list":              "/api/invoices",
					"create":            "/api/invoices",
					"get":               "/api/invoices/:id",
					"update":            "/api/invoices/:id",
					"delete":            "/api/invoices/:id",
					"stats":             "/api/invoices/stats",
					"update_status":     "/api/invoices/:id/status",
					"overdue":           "/api/invoices/overdue",
				},
				"companies": gin.H{
					"list":    "/api/companies",
					"create":  "/api/companies",
					"get":     "/api/companies/:id",
					"update":  "/api/companies/:id",
					"delete":  "/api/companies/:id",
				},
				"customers": gin.H{
					"list":    "/api/customers",
					"create":  "/api/customers",
					"get":     "/api/customers/:id",
					"update":  "/api/customers/:id",
					"delete":  "/api/customers/:id",
				},
				"dashboard": gin.H{
					"stats":           "/api/dashboard/stats",
					"recent_invoices": "/api/dashboard/recent-invoices",
					"revenue":         "/api/dashboard/revenue",
				},
				"admin": gin.H{
					"users": gin.H{
						"list":    "/api/admin/users",
						"create":  "/api/admin/users",
						"get":     "/api/admin/users/:id",
						"update":  "/api/admin/users/:id",
						"delete":  "/api/admin/users/:id",
					},
					"system": gin.H{
						"stats":             "/api/admin/system/stats",
						"health":            "/api/admin/system/health",
						"backup":            "/api/admin/system/backup",
						"audit_logs":        "/api/admin/audit-logs",
						"security_settings": "/api/admin/security/settings",
						"login_attempts":    "/api/admin/login-attempts",
					},
					"companies": gin.H{
						"approve": "/api/admin/companies/:id/approve",
						"suspend": "/api/admin/companies/:id/suspend",
					},
				},
				"subscriptions": gin.H{
					"plans":              "/api/subscription-plans",
					"create":             "/api/subscriptions",
					"list":               "/api/subscriptions",
					"update":             "/api/subscriptions/:id",
					"cancel":             "/api/subscriptions/:id",
					"billing_history":     "/api/billing/history",
					"process_payment":     "/api/billing/process-payment",
				},
				"white_label": gin.H{
					"get_settings": "/api/white-label/settings",
					"update_settings": "/api/white-label/settings",
					"customize": "/api/white-label/customize",
				},
				"pos": gin.H{
					"vendors": gin.H{
						"list":    "/api/pos/vendors",
						"create":  "/api/pos/vendors",
						"update":  "/api/pos/vendors/:id",
						"delete":  "/api/pos/vendors/:id",
					},
					"integrations": gin.H{
						"list":    "/api/pos/integrations",
						"create":  "/api/pos/integrations",
						"update":  "/api/pos/integrations/:id",
						"delete":  "/api/pos/integrations/:id",
					},
				},
				"marketplace": gin.H{
					"integrations": gin.H{
						"list":    "/api/marketplace/integrations",
						"create":  "/api/marketplace/integrations",
						"update":  "/api/marketplace/integrations/:id",
						"delete":  "/api/marketplace/integrations/:id",
					},
				},
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})
	
	// Add a simple test endpoint for browser
	r.GET("/test", func(c *gin.Context) {
		c.Header("Content-Type", "application/json")
		c.JSON(200, gin.H{
			"message": "API is working!",
			"status": "healthy",
			"timestamp": "2024-01-01T00:00:00Z",
		})
	})

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
