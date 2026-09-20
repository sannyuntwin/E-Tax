# License Server Integration

This document explains how to integrate your external license server with the E-Tax system.

## Overview

The E-Tax system supports integration with external license servers to control feature access, user limits, and subscription management.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   E-Tax API     │    │ License Server  │    │   Database      │
│                 │◄──►│                 │◄──►│                 │
│ • Validation    │    │ • Key Generation│    │ • License Keys  │
│ • Middleware    │    │ • Feature Check │    │ • Usage Logs   │
│ • Usage Tracking│    │ • Plan Management│    │ • Audit Trail  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# License Server Configuration
LICENSE_ENABLED=true
LICENSE_SERVER_URL=https://your-license-server.com
LICENSE_API_KEY=your-license-server-api-key
LICENSE_TIMEOUT=30
LICENSE_RETRY_ATTEMPTS=3
LICENSE_CACHE_DURATION=300
```

### 2. License Server API

Your license server should implement these endpoints:

#### POST /api/validate
Validates a license key and returns feature access.

**Request:**
```json
{
  "license_key": "LICENSE-KEY-123",
  "company_id": 123,
  "action": "login",
  "feature": "white_label"
}
```

**Response:**
```json
{
  "valid": true,
  "license_type": "professional",
  "expires_at": "2024-12-31T23:59:59Z",
  "features": ["basic_invoicing", "advanced_invoicing", "api_access"],
  "max_users": 10,
  "max_invoices": 1000,
  "max_api_keys": 5,
  "message": "License valid"
}
```

## Integration Points

### 1. Database Models

#### LicenseKey
Stores license information locally for caching and offline validation:

```go
type LicenseKey struct {
    ID              uint      `gorm:"primaryKey"`
    CompanyID       uint      `json:"company_id"`
    LicenseKey      string    `json:"license_key"`
    LicenseType     string    `json:"license_type"`
    Status          string    `json:"status"`
    ExpiresAt       *time.Time `json:"expires_at"`
    MaxUsers        int       `json:"max_users"`
    MaxInvoices     int       `json:"max_invoices"`
    MaxAPIKeys      int       `json:"max_api_keys"`
    Features        string    `json:"features"` // JSON array
    LastValidated   *time.Time `json:"last_validated"`
    ValidationCount int       `json:"validation_count"`
    ServerURL       string    `json:"server_url"`
}
```

#### LicenseValidationLog
Tracks all license validation attempts:

```go
type LicenseValidationLog struct {
    ID           uint      `gorm:"primaryKey"`
    LicenseKeyID uint      `json:"license_key_id"`
    CompanyID    uint      `json:"company_id"`
    UserID       *uint     `json:"user_id"`
    Action       string    `json:"action"`
    IsValid      bool      `json:"is_valid"`
    ErrorMessage string    `json:"error_message"`
    ResponseTime int       `json:"response_time"`
    Timestamp    time.Time `json:"timestamp"`
}
```

### 2. API Endpoints

#### POST /api/license/validate
Validate a license key:

```bash
curl -X POST http://localhost:8080/api/license/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "LICENSE-KEY-123",
    "action": "login",
    "feature": "white_label"
  }'
```

#### GET /api/license/info
Get company license information:

```bash
curl -X GET http://localhost:8080/api/license/info \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET /api/license/check/:feature
Check access to specific feature:

```bash
curl -X GET http://localhost:8080/api/license/check/white_label \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Middleware Integration

#### License Validation Middleware
Protect premium features:

```go
// Apply to premium features group
premium := protected.Group("/premium")
premium.Use(middleware.LicenseValidation(db, licenseClient, "premium_features"))
{
    premium.GET("/white-label/settings", GetWhiteLabelSettings(db))
    premium.PUT("/white-label/settings", UpdateWhiteLabelSettings(db))
}
```

#### API License Middleware
Protect API endpoints:

```go
api := protected.Group("/api/v1")
api.Use(middleware.APILicenseValidation(db, licenseClient))
api.Use(middleware.TrackAPIUsage(db))
{
    api.GET("/companies", GetCompanies(db))
    api.POST("/companies", CreateCompany(db))
}
```

## License Features

### Available Features

| Feature | Description | Required Plan |
|---------|-------------|---------------|
| `basic_invoicing` | Create and manage basic invoices | trial |
| `advanced_invoicing` | Advanced invoice features with templates | basic |
| `recurring_invoices` | Create recurring invoice templates | professional |
| `white_label` | White-label customization options | enterprise |
| `api_access` | API access for integrations | professional |
| `multi_user` | Multiple user accounts | basic |
| `advanced_reporting` | Advanced financial reports | professional |
| `pos_integration` | Point of sale system integration | enterprise |
| `marketplace_sync` | E-commerce marketplace synchronization | professional |
| `unlimited_invoices` | Unlimited invoice creation | enterprise |

### License Types

| Type | Features | Limits |
|------|----------|--------|
| `trial` | Basic invoicing | 10 invoices, 1 user |
| `basic` | Basic + multi-user | 100 invoices, 5 users |
| `professional` | All basic features | 1000 invoices, 10 users, API access |
| `enterprise` | All features | Unlimited invoices, unlimited users |

## Usage Examples

### 1. License Key Validation

```go
// Client-side validation
client := license.NewLicenseServerClient("https://license-server.com", "api-key")

req := LicenseValidationRequest{
    LicenseKey: "LICENSE-123",
    CompanyID:  123,
    Action:     "login",
}

resp, err := client.ValidateLicense(req)
if err != nil {
    // Handle error
    return
}

if resp.Valid {
    // Grant access
} else {
    // Deny access
}
```

### 2. Feature Access Check

```go
// Middleware check
func checkFeature(feature string) bool {
    licenseFeatures := c.GetStringSlice("license_features")
    for _, f := range licenseFeatures {
        if f == feature || f == "all" {
            return true
        }
    }
    return false
}
```

### 3. Usage Tracking

```go
// Track API usage
usage := models.APIUsage{
    CompanyID:    companyID,
    Endpoint:     c.Request.URL.Path,
    Method:       c.Request.Method,
    StatusCode:   c.Writer.Status(),
    ResponseTime: responseTime,
    Timestamp:    time.Now(),
}

db.Create(&usage)
```

## Security Considerations

1. **API Key Security**: Store license server API keys securely
2. **HTTPS**: Always use HTTPS for license server communication
3. **Caching**: Cache license validation results to reduce server load
4. **Fallback**: Implement offline validation for network failures
5. **Audit Logging**: Log all license validation attempts

## Troubleshooting

### Common Issues

1. **License Server Unreachable**
   - Check network connectivity
   - Verify server URL and API key
   - Review timeout settings

2. **Invalid License Key**
   - Verify key format
   - Check key expiration
   - Review company association

3. **Feature Access Denied**
   - Verify license type
   - Check feature mapping
   - Review plan requirements

### Debug Logging

Enable debug logging to troubleshoot issues:

```bash
# Set log level to debug
APP_LOG_LEVEL=debug
```

Check logs for license validation attempts:

```bash
docker logs etax-backend | grep "License"
```

## Performance Optimization

1. **Caching**: Cache license validation results for 5 minutes
2. **Batch Validation**: Validate multiple features in one request
3. **Async Logging**: Log validation attempts asynchronously
4. **Connection Pooling**: Reuse HTTP connections to license server

## Migration

### From Built-in Licensing

1. Export existing subscription data
2. Generate license keys for active subscriptions
3. Update database with new license keys
4. Deploy new code with license server integration
5. Test license validation endpoints

### To External Licensing

1. Set up license server
2. Configure environment variables
3. Test license validation endpoints
4. Deploy with license middleware enabled
5. Monitor license validation logs
