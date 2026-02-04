# E-Tax System Setup Guide

## Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 14+

## Quick Start

### 1. Database Setup

```bash
# Create database
createdb etax

# Import schema
psql -d etax -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies
go mod tidy

# Run server
go run main.go
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local

# Install dependencies
npm install

# Run development server
npm run dev
```

## API Endpoints

### Companies
- `GET /api/companies` - List companies
- `POST /api/companies` - Create company
- `GET /api/companies/:id` - Get company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Download PDF
- `GET /api/invoices/:id/xml` - Download e-Tax XML

### Invoice Items
- `POST /api/invoices/:id/items` - Add item
- `PUT /api/invoice-items/:id` - Update item
- `DELETE /api/invoice-items/:id` - Delete item

## Features Implemented

✅ **Phase 1 (MVP)**
- Web interface for invoice creation
- 7% VAT calculation
- PDF invoice generation
- PostgreSQL database storage

✅ **Phase 2 (e-Tax XML)**
- XML generation following Thailand Revenue Dept schema
- Field validation for tax compliance

🔄 **Phase 3 (Digital Signature)**
- Ready for digital certificate integration

## Sample Data

The system includes sample company and customer data for testing.

## Development Notes

- Backend runs on port 8080
- Frontend runs on port 3000
- CORS is enabled for development
- Database uses GORM for ORM
- Frontend uses Next.js 14 with App Router
