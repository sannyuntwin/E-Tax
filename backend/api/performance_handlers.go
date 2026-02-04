package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"backend/database"
	"gorm.io/gorm"
)

// Performance-optimized handlers with pagination

// Paginated response structure
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
	HasNext    bool        `json:"has_next"`
	HasPrev    bool        `json:"has_prev"`
}

// Pagination parameters
type PaginationParams struct {
	Page     int    `form:"page" json:"page"`
	PageSize int    `form:"page_size" json:"page_size"`
	Sort     string `form:"sort" json:"sort"`
	Order    string `form:"order" json:"order"`
}

// Default pagination values
const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

// Enhanced invoice handler with pagination
func getInvoicesPaginated(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Parse pagination parameters
		params := parsePaginationParams(c)
		
		// Build query with optimizations
		query := db.Model(&database.Invoice{}).
			Preload("Company").
			Preload("Customer").
			Preload("Items").
			Preload("Payments").
			Preload("Reminders")

		// Apply filters
		applyInvoiceFilters(query, c)

		// Get total count
		var total int64
		countQuery := query.Session(&gorm.Session{})
		applyInvoiceFilters(countQuery, c)
		countQuery.Count(&total)

		// Apply pagination
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)

		// Apply sorting
		applySorting(query, params.Sort, params.Order, "issue_date")

		// Execute query
		var invoices []database.Invoice
		if err := query.Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create paginated response
		totalPages := int((total + int64(params.PageSize) - 1) / int64(params.PageSize))
		response := PaginatedResponse{
			Data:       invoices,
			Total:      total,
			Page:       params.Page,
			PageSize:   params.PageSize,
			TotalPages: totalPages,
			HasNext:    params.Page < totalPages,
			HasPrev:    params.Page > 1,
		}

		c.JSON(http.StatusOK, response)
	}
}

// Optimized search with full-text search
func searchInvoicesOptimized(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		params := parsePaginationParams(c)
		search := c.Query("search")
		
		if search == "" {
			getInvoicesPaginated(db)(c)
			return
		}

		// Use full-text search for better performance
		var invoices []database.Invoice
		query := db.Model(&database.Invoice{}).
			Preload("Company").
			Preload("Customer").
			Preload("Items").
			Preload("Payments").
			Preload("Reminders").
			Where("search_vector @@ plainto_tsquery(?)", search).
			Order("ts_rank(search_vector, plainto_tsquery(?)) DESC", search)

		// Apply additional filters
		applyInvoiceFilters(query, c)

		// Get total count
		var total int64
		countQuery := query.Session(&gorm.Session{})
		countQuery.Where("search_vector @@ plainto_tsquery(?)", search)
		applyInvoiceFilters(countQuery, c)
		countQuery.Count(&total)

		// Apply pagination
		offset := (params.Page - 1) * params.PageSize
		query = query.Offset(offset).Limit(params.PageSize)

		if err := query.Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		totalPages := int((total + int64(params.PageSize) - 1) / int64(params.PageSize))
		response := PaginatedResponse{
			Data:       invoices,
			Total:      total,
			Page:       params.Page,
			PageSize:   params.PageSize,
			TotalPages: totalPages,
			HasNext:    params.Page < totalPages,
			HasPrev:    params.Page > 1,
		}

		c.JSON(http.StatusOK, response)
	}
}

// Cached dashboard stats
func getDashboardStatsCached(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use a simple cache key based on time
		cacheKey := "dashboard_stats_" + time.Now().Format("2006-01-02-15")
		
		// Try to get from cache (Redis would be ideal, but using memory cache for simplicity)
		if cached := getFromCache(cacheKey); cached != nil {
			c.JSON(http.StatusOK, cached)
			return
		}

		// Generate stats
		stats := generateDashboardStats(db)
		
		// Cache for 5 minutes
		setCache(cacheKey, stats, 5*time.Minute)
		
		c.JSON(http.StatusOK, stats)
	}
}

// Optimized customer search
func searchCustomersOptimized(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		search := c.Query("search")
		
		if search == "" {
			getCustomers(db)(c)
			return
		}

		var customers []database.Customer
		query := db.Model(&database.Customer{}).
			Where("search_vector @@ plainto_tsquery(?)", search).
			Order("ts_rank(search_vector, plainto_tsquery(?)) DESC", search)

		if err := query.Find(&customers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, customers)
	}
}

// Performance metrics endpoint
func getPerformanceMetrics(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		metrics := getPerformanceMetrics()
		
		// Get database stats if available
		var dbStats interface{}
		if sqlDB, err := db.DB(); err == nil {
			stats := sqlDB.Stats()
			dbStats = gin.H{
				"open_connections": stats.OpenConnections,
				"in_use": stats.InUse,
				"idle": stats.Idle,
				"max_open_conns": stats.MaxOpenConns,
			}
		}
		
		response := gin.H{
			"performance": metrics,
			"database": dbStats,
			"timestamp": time.Now().Format(time.RFC3339),
		}
		
		c.JSON(http.StatusOK, response)
	}
}

// Helper functions
func parsePaginationParams(c *gin.Context) PaginationParams {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(DefaultPageSize)))
	
	// Validate and sanitize
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}

	return PaginationParams{
		Page:     page,
		PageSize: pageSize,
		Sort:     c.DefaultQuery("sort", "issue_date"),
		Order:    c.DefaultQuery("order", "desc"),
	}
}

func applyInvoiceFilters(query *gorm.DB, c *gin.Context) *gorm.DB {
	// Customer filter
	if customerID := c.Query("customer_id"); customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}
	
	// Status filter
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// Payment status filter
	if paymentStatus := c.Query("payment_status"); paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	
	// Amount range filter
	if minAmount := c.Query("min_amount"); minAmount != "" {
		query = query.Where("total_amount >= ?", minAmount)
	}
	if maxAmount := c.Query("max_amount"); maxAmount != "" {
		query = query.Where("total_amount <= ?", maxAmount)
	}
	
	// Date range filter
	if startDate := c.Query("start_date"); startDate != "" {
		query = query.Where("issue_date >= ?", startDate)
	}
	if endDate := c.Query("end_date"); endDate != "" {
		query = query.Where("issue_date <= ?", endDate)
	}
	
	// Due date range filter
	if dueDateStart := c.Query("due_date_start"); dueDateStart != "" {
		query = query.Where("due_date >= ?", dueDateStart)
	}
	if dueDateEnd := c.Query("due_date_end"); dueDateEnd != "" {
		query = query.Where("due_date <= ?", dueDateEnd)
	}
	
	return query
}

func applySorting(query *gorm.DB, sort, order, defaultSort string) *gorm.DB {
	if sort == "" {
		sort = defaultSort
	}
	
	// Validate sort field to prevent SQL injection
	validSorts := map[string]bool{
		"issue_date": true,
		"due_date": true,
		"total_amount": true,
		"invoice_no": true,
		"status": true,
		"payment_status": true,
		"created_at": true,
		"updated_at": true,
	}
	
	if !validSorts[sort] {
		sort = defaultSort
	}
	
	if order == "" || (order != "asc" && order != "desc") {
		order = "desc"
	}
	
	return query.Order(sort + " " + order)
}

// Simple in-memory cache (in production, use Redis)
var (
	cache = make(map[string]cacheEntry)
)

type cacheEntry struct {
	Data      interface{}
	ExpiresAt time.Time
}

func getFromCache(key string) interface{} {
	if entry, exists := cache[key]; exists {
		if time.Now().Before(entry.ExpiresAt) {
			return entry.Data
		}
		delete(cache, key)
	}
	return nil
}

func setCache(key string, data interface{}, ttl time.Duration) {
	cache[key] = cacheEntry{
		Data:      data,
		ExpiresAt: time.Now().Add(ttl),
	}
}

func generateDashboardStats(db *gorm.DB) interface{} {
	// This would contain the existing dashboard stats logic
	// For now, return a placeholder
	return map[string]interface{}{
		"total_revenue": 0.0,
		"unpaid_amount": 0.0,
		"this_month_revenue": 0.0,
		"total_invoices": 0,
		"paid_invoices": 0,
		"unpaid_invoices": 0,
		"overdue_invoices": 0,
	}
}
