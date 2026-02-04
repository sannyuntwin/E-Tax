package api

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jung-kurt/gofpdf"
	"backend/database"
	"gorm.io/gorm"
)

// Invoice handlers
func getInvoices(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var invoices []database.Invoice
		if err := db.Preload("Company").Preload("Customer").Preload("Items").Find(&invoices).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, invoices)
	}
}

func createInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var invoice database.Invoice
		if err := c.ShouldBindJSON(&invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate invoice number if not provided
		if invoice.InvoiceNo == "" {
			invoice.InvoiceNo = generateInvoiceNumber(db)
		}

		// Calculate totals
		calculateInvoiceTotals(&invoice)

		if err := db.Create(&invoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load the complete invoice with relations
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, invoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, invoice)
	}
}

func getInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var invoice database.Invoice
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusOK, invoice)
	}
}

func updateInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var invoice database.Invoice
		if err := db.First(&invoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		if err := c.ShouldBindJSON(&invoice); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Recalculate totals
		calculateInvoiceTotals(&invoice)

		if err := db.Save(&invoice).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Load the complete invoice with relations
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, invoice.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, invoice)
	}
}

func deleteInvoice(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&database.Invoice{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
	}
}

func generateInvoicePDF(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var invoice database.Invoice
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		pdf := gofpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 16)
		
		// Title
		pdf.Cell(0, 10, "TAX INVOICE")
		pdf.Ln(15)
		
		// Invoice details
		pdf.SetFont("Arial", "", 12)
		pdf.Cell(0, 8, fmt.Sprintf("Invoice No: %s", invoice.InvoiceNo))
		pdf.Ln(8)
		pdf.Cell(0, 8, fmt.Sprintf("Issue Date: %s", invoice.IssueDate))
		pdf.Ln(8)
		pdf.Cell(0, 8, fmt.Sprintf("Due Date: %s", invoice.DueDate))
		pdf.Ln(15)
		
		// Company info
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(0, 8, "Seller:")
		pdf.Ln(8)
		pdf.SetFont("Arial", "", 12)
		pdf.Cell(0, 8, invoice.Company.CompanyName)
		pdf.Ln(8)
		pdf.Cell(0, 8, fmt.Sprintf("Tax ID: %s", invoice.Company.TaxID))
		pdf.Ln(8)
		pdf.Cell(0, 8, invoice.Company.Address)
		pdf.Ln(15)
		
		// Customer info
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(0, 8, "Buyer:")
		pdf.Ln(8)
		pdf.SetFont("Arial", "", 12)
		pdf.Cell(0, 8, invoice.Customer.Name)
		if invoice.Customer.TaxID != "" {
			pdf.Ln(8)
			pdf.Cell(0, 8, fmt.Sprintf("Tax ID: %s", invoice.Customer.TaxID))
		}
		pdf.Ln(15)
		
		// Items table
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(80, 8, "Description")
		pdf.Cell(30, 8, "Quantity")
		pdf.Cell(40, 8, "Amount")
		pdf.Cell(40, 8, "Total")
		pdf.Ln(8)
		
		pdf.SetFont("Arial", "", 12)
		for _, item := range invoice.Items {
			pdf.Cell(80, 8, item.ProductName)
			pdf.Cell(30, 8, fmt.Sprintf("%.2f", item.Quantity))
			pdf.Cell(40, 8, fmt.Sprintf("%.2f", item.UnitPrice))
			pdf.Cell(40, 8, fmt.Sprintf("%.2f", item.LineTotal))
			pdf.Ln(8)
		}
		
		pdf.Ln(10)
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(150, 8, "Subtotal:")
		pdf.Cell(40, 8, fmt.Sprintf("%.2f", invoice.Subtotal))
		pdf.Ln(8)
		pdf.Cell(150, 8, "VAT (7%):")
		pdf.Cell(40, 8, fmt.Sprintf("%.2f", invoice.VATAmount))
		pdf.Ln(8)
		pdf.Cell(150, 8, "Total:")
		pdf.Cell(40, 8, fmt.Sprintf("%.2f", invoice.TotalAmount))
		
		// Set headers for PDF download
		c.Header("Content-Type", "application/pdf")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=invoice_%s.pdf", invoice.InvoiceNo))
		
		err := pdf.Output(c.Writer)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
			return
		}
	}
}

func generateInvoiceXML(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var invoice database.Invoice
		if err := db.Preload("Company").Preload("Customer").Preload("Items").First(&invoice, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}

		// Create e-Tax XML structure
		taxInvoice := TaxInvoice{
			XMLName:      xml.Name{Local: "TaxInvoice"},
			SellerTaxID:  invoice.Company.TaxID,
			SellerName:   invoice.Company.CompanyName,
			BuyerTaxID:   invoice.Customer.TaxID,
			BuyerName:    invoice.Customer.Name,
			InvoiceNo:    invoice.InvoiceNo,
			IssueDate:    invoice.IssueDate,
			Subtotal:     invoice.Subtotal,
			VAT:          invoice.VATAmount,
			TotalAmount:  invoice.TotalAmount,
		}

		xmlData, err := xml.MarshalIndent(taxInvoice, "", "  ")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate XML"})
			return
		}

		c.Header("Content-Type", "application/xml")
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=invoice_%s.xml", invoice.InvoiceNo))
		c.String(http.StatusOK, xml.Header+string(xmlData))
	}
}

// Invoice Item handlers
func addInvoiceItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		invoiceID := c.Param("id")
		var item database.InvoiceItem
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Convert invoiceID to uint
		id, err := strconv.ParseUint(invoiceID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
			return
		}
		item.InvoiceID = uint(id)
		item.LineTotal = item.Quantity * item.UnitPrice

		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice totals
		updateInvoiceTotals(db, uint(id))

		c.JSON(http.StatusCreated, item)
	}
}

func updateInvoiceItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item database.InvoiceItem
		if err := db.First(&item, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice item not found"})
			return
		}

		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		item.LineTotal = item.Quantity * item.UnitPrice

		if err := db.Save(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice totals
		updateInvoiceTotals(db, item.InvoiceID)

		c.JSON(http.StatusOK, item)
	}
}

func deleteInvoiceItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var item database.InvoiceItem
		if err := db.First(&item, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice item not found"})
			return
		}

		invoiceID := item.InvoiceID
		if err := db.Delete(&item).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Update invoice totals
		updateInvoiceTotals(db, invoiceID)

		c.JSON(http.StatusOK, gin.H{"message": "Invoice item deleted successfully"})
	}
}

// Helper functions
func generateInvoiceNumber(db *gorm.DB) string {
	now := time.Now()
	year := now.Year()
	month := int(now.Month())
	
	var count int64
	db.Model(&database.Invoice{}).Where("EXTRACT(YEAR FROM created_at) = ? AND EXTRACT(MONTH FROM created_at) = ?", year, month).Count(&count)
	
	return fmt.Sprintf("INV%04d%02d%04d", year%10000, month, count+1)
}

func calculateInvoiceTotals(invoice *database.Invoice) {
	subtotal := 0.0
	for _, item := range invoice.Items {
		subtotal += item.LineTotal
	}
	invoice.Subtotal = subtotal
	invoice.VATAmount = subtotal * 0.07 // 7% VAT
	invoice.TotalAmount = subtotal + invoice.VATAmount
}

func updateInvoiceTotals(db *gorm.DB, invoiceID uint) {
	var invoice database.Invoice
	if err := db.Preload("Items").First(&invoice, invoiceID).Error; err != nil {
		return
	}
	
	calculateInvoiceTotals(&invoice)
	db.Save(&invoice)
}

// XML structure for e-Tax
type TaxInvoice struct {
	XMLName     xml.Name `xml:"TaxInvoice"`
	SellerTaxID string   `xml:"SellerTaxID"`
	SellerName  string   `xml:"SellerName"`
	BuyerTaxID  string   `xml:"BuyerTaxID,omitempty"`
	BuyerName   string   `xml:"BuyerName"`
	InvoiceNo   string   `xml:"InvoiceNo"`
	IssueDate   string   `xml:"IssueDate"`
	Subtotal    float64  `xml:"Subtotal"`
	VAT         float64  `xml:"VAT"`
	TotalAmount float64  `xml:"TotalAmount"`
}
