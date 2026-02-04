package api

import (
	"fmt"
	"net/http"
	"time"
	"runtime"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Performance metrics tracking
type PerformanceMetrics struct {
	RequestCount    int64         `json:"request_count"`
	AverageTime    time.Duration `json:"average_time"`
	SlowRequests   int64         `json:"slow_requests"`
	ErrorCount      int64         `json:"error_count"`
	LastRequest     time.Time     `json:"last_request"`
	MemoryUsage     int64         `json:"memory_usage_mb"`
}

var (
	metrics = PerformanceMetrics{
		RequestCount: 0,
		AverageTime: 0,
		SlowRequests: 0,
		ErrorCount: 0,
		LastRequest: time.Now(),
		MemoryUsage: 0,
	}
	requestTimes []time.Duration
)

// Performance monitoring middleware
func performanceMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		startTime := time.Now()
		
		// Process request
		c.Next()
		
		// Calculate request time
		requestTime := time.Since(startTime)
		requestTimes = append(requestTimes, requestTime)
		
		// Keep only last 100 requests for average calculation
		if len(requestTimes) > 100 {
			requestTimes = requestTimes[1:]
		}
		
		// Update metrics
		metrics.RequestCount++
		metrics.LastRequest = time.Now()
		
		// Calculate average time
		if len(requestTimes) > 0 {
			var total time.Duration
			for _, t := range requestTimes {
				total += t
			}
			metrics.AverageTime = total / time.Duration(len(requestTimes))
		}
		
		// Count slow requests (>500ms)
		if requestTime > 500*time.Millisecond {
			metrics.SlowRequests++
		}
		
		// Count errors
		if c.Writer.Status() >= 400 {
			metrics.ErrorCount++
		}
		
		// Get memory usage (approximate)
		var m runtime.MemStats
		m.ReadMemStats(&m)
		metrics.MemoryUsage = m.Alloc / 1024 / 1024 // Convert to MB
		
		// Add performance headers
		c.Header("X-Response-Time", requestTime.String())
		c.Header("X-Request-ID", generateRequestID())
		
		// Log slow requests
		if requestTime > 1000*time.Millisecond {
			logSlowRequest(c, requestTime)
		}
	})
}

// Rate limiting middleware
func rateLimiterMiddleware(requestsPerMinute int) gin.HandlerFunc {
	// Simple in-memory rate limiter
	clients := make(map[string]int)
	
	return gin.HandlerFunc(func(c *gin.Context) {
		clientIP := c.ClientIP()
		
		// Check rate limit
		if count, exists := clients[clientIP]; exists {
			if count >= requestsPerMinute {
				c.JSON(http.StatusTooManyRequests, gin.H{
					"error": "Rate limit exceeded",
					"message": fmt.Sprintf("Too many requests. Limit: %d per minute", requestsPerMinute),
					"retry_after": "60s",
				})
				c.Abort()
				return
			}
			clients[clientIP]++
		} else {
			clients[clientIP] = 1
		}
		
		// Reset counter every minute
		go func() {
			time.Sleep(time.Minute)
			delete(clients, clientIP)
		}()
		
		c.Next()
	})
}

// Response compression middleware
func compressionMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Check if client accepts compression
		acceptEncoding := c.GetHeader("Accept-Encoding")
		if acceptEncoding == "" {
			c.Next()
			return
		}
		
		// Set compression headers
		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")
		
		c.Next()
	})
}

// CORS middleware for API
func corsMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
		c.Header("Access-Control-Max-Age", "86400")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
}

// Security headers middleware
func securityHeadersMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Hide server information
		c.Header("Server", "E-Tax-API")
		c.Header("X-Powered-By", "Gin")
		
		c.Next()
	})
}

// Request ID generation
func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// Slow request logging
func logSlowRequest(c *gin.Context, duration time.Duration) {
	method := c.Request.Method
	path := c.Request.URL.Path
	status := c.Writer.Status()
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	
	fmt.Printf("[SLOW REQUEST] %s %s %d %v - %v - %s\n",
		method,
		path,
		status,
		duration,
		clientIP,
		userAgent,
	)
}

// Get performance metrics
func getPerformanceMetrics() PerformanceMetrics {
	return metrics
}

// Reset performance metrics
func resetPerformanceMetrics() {
	metrics = PerformanceMetrics{
		RequestCount: 0,
		AverageTime: 0,
		SlowRequests: 0,
		ErrorCount: 0,
		LastRequest: time.Now(),
		MemoryUsage: 0,
	}
	requestTimes = nil
}

// Health check endpoint
func healthCheck(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check database connection
		sqlDB, err := db.DB()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error": "Database connection failed",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}
		
		// Ping database
		if err := sqlDB.Ping(); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"error": "Database ping failed",
				"timestamp": time.Now().Format(time.RFC3339),
			})
			return
		}
		
		// Get database stats
		stats := sqlDB.Stats()
		
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"database": gin.H{
				"open_connections": stats.OpenConnections,
				"in_use": stats.InUse,
				"idle": stats.Idle,
				"max_open_conns": stats.MaxOpenConns,
			},
			"performance": getPerformanceMetrics(),
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
}

// Cache middleware (simple in-memory cache)
type CacheEntry struct {
	Data      interface{}
	ExpiresAt time.Time
}

var cache = make(map[string]CacheEntry)

func cacheMiddleware(ttl time.Duration) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Check cache for GET requests
		if c.Request.Method == "GET" {
			key := c.Request.URL.String()
			
			if entry, exists := cache[key]; exists {
				if time.Now().Before(entry.ExpiresAt) {
					// Serve from cache
					c.JSON(http.StatusOK, entry.Data)
					c.Header("X-Cache", "HIT")
					return
				} else {
					// Remove expired entry
					delete(cache, key)
				}
			}
		}
		
		c.Next()
	})
}

// Set cache data
func setCache(key string, data interface{}, ttl time.Duration) {
	cache[key] = CacheEntry{
		Data:      data,
		ExpiresAt: time.Now().Add(ttl),
	}
}

// Get cache data
func getCache(key string) (interface{}, bool) {
	if entry, exists := cache[key]; exists {
		if time.Now().Before(entry.ExpiresAt) {
			return entry.Data, true
		}
		delete(cache, key)
	}
	return nil, false
}

// Clear cache
func clearCache() {
	cache = make(map[string]CacheEntry)
}

// Cache invalidation middleware for specific routes
func invalidateCacheMiddleware(patterns []string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Clear cache for specific patterns
		for _, pattern := range patterns {
			delete(cache, pattern)
		}
		c.Next()
	})
}
