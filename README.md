# E-Tax Invoice System

A comprehensive e-Tax invoice management system for Thailand Revenue Department compliance.

## Features

- ✅ Create and manage tax invoices
- ✅ Calculate VAT (7%)
- ✅ Generate PDF invoices
- ✅ Convert invoices to e-Tax XML format
- ✅ Digital signature support
- ✅ PostgreSQL database storage

## Tech Stack

### Backend
- Go (Gin framework)
- PostgreSQL
- GORM ORM

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Lucide React icons

## Project Structure

```
E-Tax/
├── backend/          # Go backend API
├── frontend/         # Next.js frontend
├── database/         # Database migrations and schema
└── docs/            # Documentation
```

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup
```bash
cd backend
go mod tidy
go run main.go
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
1. Create PostgreSQL database `etax`
2. Run migrations from `database/migrations`

## API Endpoints

- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/pdf` - Generate PDF
- `GET /api/invoices/:id/xml` - Generate e-Tax XML

## Development

This project follows the phased approach:

### Phase 1: MVP
- Web app to create invoices
- VAT calculation (7%)
- PDF invoice generation
- Database storage

### Phase 2: e-Tax XML Generator
- Convert invoice data to XML
- Revenue Department schema compliance
- Field validation

### Phase 3: Digital Signature
- Digital certificate integration
- XML signing functionality

### Phase 4: Revenue Department Integration
- Direct submission or provider API integration
