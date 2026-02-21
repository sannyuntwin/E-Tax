package invoice

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"etax/internal/services/invoice"
)

type InvoiceHandler struct {
	invoiceService *invoice.InvoiceService
}

func NewInvoiceHandler(invoiceService *invoice.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{
		invoiceService: invoiceService,
	}
}

// CreateInvoice handles creating a new invoice
func (h *InvoiceHandler) CreateInvoice(c *gin.Context) {
	var req invoice.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get company ID from context (from JWT)
	companyID := c.GetUint("company_id")
	if companyID > 0 {
		req.CompanyID = companyID
	}

	invoice, err := h.invoiceService.Create(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, invoice)
}

// GetInvoices handles listing invoices
func (h *InvoiceHandler) GetInvoices(c *gin.Context) {
	companyID := c.GetUint("company_id")
	
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	invoices, total, err := h.invoiceService.List(companyID, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"invoices": invoices,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// GetInvoice handles getting a single invoice
func (h *InvoiceHandler) GetInvoice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	invoice, err := h.invoiceService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// UpdateInvoice handles updating an invoice
func (h *InvoiceHandler) UpdateInvoice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req invoice.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invoice, err := h.invoiceService.Update(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invoice)
}

// DeleteInvoice handles deleting an invoice
func (h *InvoiceHandler) DeleteInvoice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	err = h.invoiceService.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

// GetInvoiceStats handles getting invoice statistics
func (h *InvoiceHandler) GetInvoiceStats(c *gin.Context) {
	companyID := c.GetUint("company_id")
	
	stats, err := h.invoiceService.GetInvoiceStats(companyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// UpdateInvoiceStatus handles updating invoice status
func (h *InvoiceHandler) UpdateInvoiceStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.invoiceService.UpdateStatus(uint(id), req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice status updated successfully"})
}

// GetOverdueInvoices handles getting overdue invoices
func (h *InvoiceHandler) GetOverdueInvoices(c *gin.Context) {
	companyID := c.GetUint("company_id")
	
	// For now, get all overdue invoices (you can filter by company later)
	invoices, err := h.invoiceService.GetOverdueInvoices()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Filter by company if needed
	if companyID > 0 {
		var filteredInvoices []interface{}
		for _, inv := range invoices {
			// Add filtering logic here
			filteredInvoices = append(filteredInvoices, inv)
		}
		c.JSON(http.StatusOK, gin.H{"invoices": filteredInvoices})
		return
	}

	c.JSON(http.StatusOK, gin.H{"invoices": invoices})
}
