# E-Tax API Reference

## Overview

The E-Tax API provides RESTful endpoints for managing invoices, customers, products, and more. All API endpoints require authentication except for health checks and authentication endpoints.

## Base URL

- **Development**: `http://localhost:8080`
- **Production**: `https://your-domain.com`

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

- **Development**: 100 requests per 20 seconds
- **Production**: Configurable based on subscription plan

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/refresh` | Refresh JWT token | No |
| POST | `/api/auth/logout` | User logout | No |

### Health & System

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/health` | Health check | No |
| GET | `/api/health` | Health check | No |
| GET | `/api/performance/metrics` | Performance metrics | Yes |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/profile` | Get user profile | Yes |
| PUT | `/api/profile` | Update user profile | Yes |
| POST | `/api/change-password` | Change password | Yes |

### Companies

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/companies` | List companies | Yes |
| POST | `/api/companies` | Create company | Yes |
| GET | `/api/companies/:id` | Get company details | Yes |
| PUT | `/api/companies/:id` | Update company | Yes |
| DELETE | `/api/companies/:id` | Delete company | Yes |

### Customers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/customers` | List customers | Yes |
| POST | `/api/customers` | Create customer | Yes |
| GET | `/api/customers/:id` | Get customer details | Yes |
| PUT | `/api/customers/:id` | Update customer | Yes |
| DELETE | `/api/customers/:id` | Delete customer | Yes |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/products` | List products | Yes |
| POST | `/api/products` | Create product | Yes |

### Invoices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/invoices` | List invoices (paginated) | Yes |
| GET | `/api/invoices/search` | Search invoices | Yes |
| GET | `/api/invoices/enhanced-search` | Enhanced search | Yes |
| GET | `/api/invoices/search-optimized` | Optimized search | Yes |
| POST | `/api/invoices` | Create invoice | Yes |
| POST | `/api/invoices/draft` | Save draft invoice | Yes |
| POST | `/api/invoices/:id/duplicate` | Duplicate invoice | Yes |
| GET | `/api/invoices/:id` | Get invoice details | Yes |
| PUT | `/api/invoices/:id` | Update invoice | Yes |
| DELETE | `/api/invoices/:id` | Delete invoice | Yes |
| GET | `/api/invoices/:id/xml` | Generate XML invoice | Yes |

### Invoice Items

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/invoices/:id/items` | Add invoice item | Yes |
| PUT | `/api/invoice-items/:id` | Update invoice item | Yes |
| DELETE | `/api/invoice-items/:id` | Delete invoice item | Yes |

### Payments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/payments` | List payments | Yes |
| POST | `/api/payments` | Create payment | Yes |
| GET | `/api/payments/:id` | Get payment details | Yes |
| PUT | `/api/payments/:id` | Update payment | Yes |
| DELETE | `/api/payments/:id` | Delete payment | Yes |
| GET | `/api/payments/stats` | Payment statistics | Yes |

### Recurring Invoices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/recurring-invoices` | List recurring invoices | Yes |
| POST | `/api/recurring-invoices` | Create recurring invoice | Yes |
| GET | `/api/recurring-invoices/:id` | Get recurring invoice | Yes |
| PUT | `/api/recurring-invoices/:id` | Update recurring invoice | Yes |
| DELETE | `/api/recurring-invoices/:id` | Delete recurring invoice | Yes |
| POST | `/api/recurring-invoices/:id/generate` | Generate invoices | Yes |
| POST | `/api/recurring-invoices/:id/pause` | Pause recurring invoice | Yes |
| POST | `/api/recurring-invoices/:id/resume` | Resume recurring invoice | Yes |
| GET | `/api/recurring-invoices/stats` | Recurring invoice stats | Yes |

### Payment Reminders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/payment-reminders` | List payment reminders | Yes |
| POST | `/api/payment-reminders` | Create payment reminder | Yes |
| POST | `/api/payment-reminders/:id/send` | Send payment reminder | Yes |

### Admin Only

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| GET | `/api/admin/users` | List all users | Admin |
| POST | `/api/admin/users` | Create user | Admin |
| GET | `/api/admin/users/:id` | Get user details | Admin |
| PUT | `/api/admin/users/:id` | Update user | Admin |
| DELETE | `/api/admin/users/:id` | Delete user | Admin |
| GET | `/api/admin/audit-logs` | Get audit logs | Admin |
| GET | `/api/admin/security-settings` | Get security settings | Admin |
| PUT | `/api/admin/security-settings` | Update security settings | Admin |
| GET | `/api/admin/login-attempts` | Get login attempts | Admin |
| GET | `/api/admin/system/stats` | Get system statistics | Admin |
| POST | `/api/admin/system/backup` | Create system backup | Admin |
| GET | `/api/admin/system/health` | Get system health | Admin |

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

## Pagination

List endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sort` - Sort field
- `order` - Sort order (asc/desc)

Example: `/api/invoices?page=2&limit=10&sort=created_at&order=desc`

## Data Formats

### Date/Time
All datetime fields use ISO 8601 format: `2023-12-01T10:30:00Z`

### Currency
All monetary values are in cents (integer) to avoid floating point precision issues.

## SDKs and Libraries

- **Go**: Native Go client
- **JavaScript**: npm package coming soon
- **Python**: PyPI package coming soon

## Support

For API support and questions:
- Documentation: `/api/docs`
- Email: support@etax.com
- Issues: GitHub Issues
