package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"etax/api"
	"etax/database"
	"etax/security"
	. "etax/database"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Auto migrate all models
	err = db.AutoMigrate(
		&Company{}, &Customer{}, &Invoice{}, &InvoiceItem{}, &Product{}, 
		&InvoiceTemplate{}, &RecurringInvoice{}, &PaymentReminder{}, &Payment{}, 
		&User{}, &Session{}, &AuditLog{}, &APIKey{}, &SecuritySettings{}, 
		&LoginAttempt{}, &SubscriptionPlan{}, &CompanySubscription{}, &APIUsage{}, 
		&BillingInvoice{}, &UsageQuota{}, &WhiteLabelConfig{}, &PaymentMethod{}, 
		&MarketplaceIntegration{}, &POSVendorConfig{},
	)
	if err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}

	return db
}

// setupTestRouter creates a test router with authentication middleware
func setupTestRouter(db *gorm.DB) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	// Mock security service
	securityService := security.NewSecurityService("test_secret_key_that_is_long_enough_for_testing")
	
	// Setup routes
	api.SetupRoutes(router, db, securityService)
	
	return router
}

// createTestUser creates a test user for authentication
func createTestUser(t *testing.T, db *gorm.DB) *database.User {
	user := &database.User{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "hashedpassword",
		Role:     "admin",
		IsActive: true,
		CreatedAt: time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		UpdatedAt: time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
	}
	
	if err := db.Create(user).Error; err != nil {
		t.Fatalf("Failed to create test user: %v", err)
	}
	
	return user
}

// getTestAuthToken generates a test JWT token
func getTestAuthToken(t *testing.T, userID uint, username, role string) string {
	securityService := security.NewSecurityService("test_secret_key_that_is_long_enough_for_testing")
	
	token, err := securityService.GenerateAccessToken(userID, username, role)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}
	
	return token
}

func TestHealthCheck(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	
	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestCreateCompany(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	company := Company{
		TaxID:       "1234567890",
		CompanyName: "Test Company",
		Address:     "123 Test St",
		Phone:       "123-456-7890",
		Email:       "test@company.com",
	}
	
	companyJSON, _ := json.Marshal(company)
	req, _ := http.NewRequest("POST", "/api/companies", bytes.NewBuffer(companyJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, company.TaxID, response["company"].(map[string]interface{})["tax_id"])
	assert.Equal(t, company.CompanyName, response["company"].(map[string]interface{})["company_name"])
}

func TestCreateCompanyWithoutAuth(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	
	company := Company{
		TaxID:       "1234567890",
		CompanyName: "Test Company",
	}
	
	companyJSON, _ := json.Marshal(company)
	req, _ := http.NewRequest("POST", "/api/companies", bytes.NewBuffer(companyJSON))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetCompanies(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	// Create test company
	company := Company{
		TaxID:       "1234567890",
		CompanyName: "Test Company",
	}
	db.Create(&company)
	
	req, _ := http.NewRequest("GET", "/api/companies", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Greater(t, len(response["companies"].([]interface{})), 0)
}

func TestCreateCustomer(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	customer := Customer{
		Name:    "Test Customer",
		TaxID:   "0987654321",
		Email:   "customer@test.com",
		Phone:   "098-765-4321",
		Address: "456 Customer Ave",
	}
	
	customerJSON, _ := json.Marshal(customer)
	req, _ := http.NewRequest("POST", "/api/customers", bytes.NewBuffer(customerJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, customer.Name, response["customer"].(map[string]interface{})["name"])
	assert.Equal(t, customer.Email, response["customer"].(map[string]interface{})["email"])
}

func TestCreateInvoice(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	// Create test company and customer
	company := Company{TaxID: "1234567890", CompanyName: "Test Company"}
	customer := Customer{Name: "Test Customer", Email: "customer@test.com"}
	db.Create(&company)
	db.Create(&customer)
	
	invoice := Invoice{
		InvoiceNo:  "INV-001",
		IssueDate:  "2023-01-01",
		DueDate:    "2023-01-15",
		CompanyID:  company.ID,
		CustomerID: customer.ID,
		Subtotal:   1000.00,
		VATAmount:  70.00,
		TotalAmount: 1070.00,
		Status:     "draft",
	}
	
	invoiceJSON, _ := json.Marshal(invoice)
	req, _ := http.NewRequest("POST", "/api/invoices", bytes.NewBuffer(invoiceJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, invoice.InvoiceNo, response["invoice"].(map[string]interface{})["invoice_no"])
	assert.Equal(t, invoice.TotalAmount, response["invoice"].(map[string]interface{})["total_amount"])
}

func TestCreateInvoiceWithItems(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	// Create test company and customer
	company := Company{TaxID: "1234567890", CompanyName: "Test Company"}
	customer := Customer{Name: "Test Customer", Email: "customer@test.com"}
	db.Create(&company)
	db.Create(&customer)
	
	invoiceWithItems := map[string]interface{}{
		"invoice": map[string]interface{}{
			"invoice_no":   "INV-002",
			"issue_date":   "2023-01-01",
			"due_date":     "2023-01-15",
			"company_id":   company.ID,
			"customer_id":  customer.ID,
			"subtotal":     1000.00,
			"vat_amount":   70.00,
			"total_amount": 1070.00,
			"status":       "draft",
		},
		"items": []map[string]interface{}{
			{
				"product_name": "Test Product 1",
				"description":  "Description for product 1",
				"quantity":     2.0,
				"unit_price":   500.00,
				"line_total":   1000.00,
			},
		},
	}
	
	invoiceJSON, _ := json.Marshal(invoiceWithItems)
	req, _ := http.NewRequest("POST", "/api/invoices", bytes.NewBuffer(invoiceJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	invoice := response["invoice"].(map[string]interface{})
	items := response["items"].([]interface{})
	assert.Equal(t, "INV-002", invoice["invoice_no"])
	assert.Equal(t, 1, len(items))
}

func TestAdminGetUsers(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Greater(t, len(response["users"].([]interface{})), 0)
}

func TestAdminGetUsersWithoutAdminRole(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	
	// Create user without admin role
	user := &User{
		Username: "regularuser",
		Email:    "regular@example.com",
		Role:     "user",
		IsActive: true,
	}
	db.Create(user)
	
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestCreateInvoiceValidation(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	// Test with missing required fields
	invoice := map[string]interface{}{
		"issue_date": "2023-01-01",
		// Missing invoice_no, company_id, customer_id
	}
	
	invoiceJSON, _ := json.Marshal(invoice)
	req, _ := http.NewRequest("POST", "/api/invoices", bytes.NewBuffer(invoiceJSON))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSearchInvoices(t *testing.T) {
	db := setupTestDB(t)
	router := setupTestRouter(db)
	user := createTestUser(t, db)
	token := getTestAuthToken(t, user.ID, user.Username, user.Role)
	
	// Create test company and customer
	company := Company{TaxID: "1234567890", CompanyName: "Test Company"}
	customer := Customer{Name: "Test Customer", Email: "customer@test.com"}
	db.Create(&company)
	db.Create(&customer)
	
	// Create test invoice
	invoice := Invoice{
		InvoiceNo:  "SEARCH-001",
		IssueDate:  "2023-01-01",
		CompanyID:  company.ID,
		CustomerID: customer.ID,
		TotalAmount: 1000.00,
		Status:     "sent",
	}
	db.Create(&invoice)
	
	req, _ := http.NewRequest("GET", "/api/invoices/search?q=SEARCH-001", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	
	invoices := response["invoices"].([]interface{})
	assert.Greater(t, len(invoices), 0)
}
