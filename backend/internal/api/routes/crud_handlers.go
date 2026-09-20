package routes

import (
	"net/http"
	"reflect"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"etax/internal/database/models"
)

// stamp sets the string based CreatedAt/UpdatedAt fields used by the models.
func stamp(v interface{}, created bool) {
	rv := reflect.ValueOf(v).Elem()
	now := time.Now().Format(time.RFC3339)
	if f := rv.FieldByName("UpdatedAt"); f.IsValid() && f.Kind() == reflect.String {
		f.SetString(now)
	}
	if created {
		if f := rv.FieldByName("CreatedAt"); f.IsValid() && f.Kind() == reflect.String {
			f.SetString(now)
		}
	}
}

func listHandler[T any](db *gorm.DB, order string) gin.HandlerFunc {
	return func(c *gin.Context) {
		items := []T{}
		if err := db.Order(order).Find(&items).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, items)
	}
}

func getHandler[T any](db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item T
		if err := db.First(&item, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		c.JSON(http.StatusOK, item)
	}
}

func createHandler[T any](db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item T
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		reflect.ValueOf(&item).Elem().FieldByName("ID").SetUint(0)
		stamp(&item, true)
		if err := db.Create(&item).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, item)
	}
}

func updateHandler[T any](db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item T
		if err := db.First(&item, c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		id := reflect.ValueOf(&item).Elem().FieldByName("ID").Uint()
		created := reflect.ValueOf(&item).Elem().FieldByName("CreatedAt")
		createdAt := ""
		if created.IsValid() && created.Kind() == reflect.String {
			createdAt = created.String()
		}

		// Bind over the loaded record so fields missing from the body are kept.
		if err := c.ShouldBindJSON(&item); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		rv := reflect.ValueOf(&item).Elem()
		rv.FieldByName("ID").SetUint(id)
		if created.IsValid() && created.Kind() == reflect.String {
			rv.FieldByName("CreatedAt").SetString(createdAt)
		}
		stamp(&item, false)
		if err := db.Save(&item).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, item)
	}
}

func deleteHandler[T any](db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var item T
		res := db.Delete(&item, c.Param("id"))
		if res.Error != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": res.Error.Error()})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
	}
}

// Companies
func GetCompanies(db *gorm.DB) gin.HandlerFunc   { return listHandler[database.Company](db, "id ASC") }
func CreateCompany(db *gorm.DB) gin.HandlerFunc  { return createHandler[database.Company](db) }
func GetCompany(db *gorm.DB) gin.HandlerFunc     { return getHandler[database.Company](db) }
func UpdateCompany(db *gorm.DB) gin.HandlerFunc  { return updateHandler[database.Company](db) }
func DeleteCompany(db *gorm.DB) gin.HandlerFunc  { return deleteHandler[database.Company](db) }

// Customers
func GetCustomers(db *gorm.DB) gin.HandlerFunc   { return listHandler[database.Customer](db, "id ASC") }
func CreateCustomer(db *gorm.DB) gin.HandlerFunc { return createHandler[database.Customer](db) }
func GetCustomer(db *gorm.DB) gin.HandlerFunc    { return getHandler[database.Customer](db) }
func UpdateCustomer(db *gorm.DB) gin.HandlerFunc { return updateHandler[database.Customer](db) }
func DeleteCustomer(db *gorm.DB) gin.HandlerFunc { return deleteHandler[database.Customer](db) }

// Products
func GetProducts(db *gorm.DB) gin.HandlerFunc    { return listHandler[database.Product](db, "id ASC") }
func CreateProduct(db *gorm.DB) gin.HandlerFunc  { return createHandler[database.Product](db) }
func UpdateProduct(db *gorm.DB) gin.HandlerFunc  { return updateHandler[database.Product](db) }
func DeleteProduct(db *gorm.DB) gin.HandlerFunc  { return deleteHandler[database.Product](db) }

// Invoice templates
func GetInvoiceTemplates(db *gorm.DB) gin.HandlerFunc {
	return listHandler[database.InvoiceTemplate](db, "id DESC")
}
func CreateInvoiceTemplate(db *gorm.DB) gin.HandlerFunc {
	return createHandler[database.InvoiceTemplate](db)
}
func UpdateInvoiceTemplate(db *gorm.DB) gin.HandlerFunc {
	return updateHandler[database.InvoiceTemplate](db)
}
func DeleteInvoiceTemplate(db *gorm.DB) gin.HandlerFunc {
	return deleteHandler[database.InvoiceTemplate](db)
}

// GetDashboardStats returns aggregate invoice numbers for the dashboard.
func GetDashboardStats(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var stats database.DashboardStats
		invoices := func() *gorm.DB { return db.Model(&database.Invoice{}) }

		invoices().Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.TotalRevenue)
		invoices().Where("status IN ('sent', 'overdue')").Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.UnpaidAmount)
		invoices().Where("issue_date LIKE ? AND status = 'paid'", time.Now().Format("2006-01")+"%").
			Select("COALESCE(SUM(total_amount), 0)").Scan(&stats.ThisMonthRevenue)

		invoices().Count(&stats.TotalInvoices)
		invoices().Where("status = 'paid'").Count(&stats.PaidInvoices)
		invoices().Where("status IN ('sent', 'overdue')").Count(&stats.UnpaidInvoices)
		invoices().Where("status = 'overdue'").Count(&stats.OverdueInvoices)
		invoices().Where("is_draft = ?", true).Count(&stats.DraftInvoices)

		c.JSON(http.StatusOK, stats)
	}
}
