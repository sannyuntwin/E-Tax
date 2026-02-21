# E-Tax Backend API

## 📁 Project Structure

This backend follows a clean architecture pattern with clear separation of concerns:

```
backend/
├── cmd/server/main.go           # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/            # HTTP handlers grouped by domain
│   │   │   ├── auth/            # Authentication handlers
│   │   │   ├── admin/           # Admin management handlers
│   │   │   ├── invoice/         # Invoice handlers
│   │   │   ├── payment/         # Payment handlers
│   │   │   ├── subscription/    # Subscription handlers
│   │   │   └── pos/             # POS integration handlers
│   │   ├── middleware/          # HTTP middleware
│   │   ├── routes/             # Route definitions
│   │   └── validators/          # Request validation
│   ├── database/
│   │   ├── models/             # Database models
│   │   ├── repositories/       # Data access layer
│   │   └── migrations/         # Database migrations
│   ├── services/               # Business logic layer
│   │   ├── auth/               # Authentication service
│   │   ├── invoice/            # Invoice service
│   │   ├── payment/            # Payment service
│   │   └── notification/       # Notification service
│   ├── config/                 # Configuration management
│   └── utils/                  # Utility functions
├── pkg/                        # Public packages
├── migrations/                  # SQL migration files
├── docs/                       # API documentation
└── tests/                      # Test files
```

## 🏗️ Architecture Layers

### 1. **cmd/server** - Application Entry Point
- Main application bootstrap
- Dependency injection setup
- Server configuration

### 2. **internal/api** - API Layer
- **handlers**: HTTP request/response handling
- **middleware**: Cross-cutting concerns (auth, logging, etc.)
- **routes**: Route definitions and grouping
- **validators**: Request validation logic

### 3. **internal/services** - Business Logic Layer
- Domain-specific business logic
- Service orchestration
- Business rule enforcement

### 4. **internal/database** - Data Access Layer
- **models**: Database entities and relationships
- **repositories**: Data access patterns
- **migrations**: Database schema changes

### 5. **internal/config** - Configuration
- Environment variable management
- Application settings
- Database configuration

## 🚀 Getting Started

### Prerequisites
- Go 1.23+
- PostgreSQL 15+
- Docker (optional)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
go mod download
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application
```bash
go run cmd/server/main.go
```

### Docker Setup

```bash
# Build and run with Docker
docker-compose -f ../docker/docker-compose.yml up -d
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Invoice Endpoints
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice

### Admin Endpoints
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## 🔧 Development

### Adding New Features

1. **Create Model**: Add to `internal/database/models/`
2. **Create Repository**: Add to `internal/database/repositories/`
3. **Create Service**: Add to `internal/services/`
4. **Create Handler**: Add to `internal/api/handlers/`
5. **Add Routes**: Update `internal/api/routes/`

### Code Organization Principles

- **Single Responsibility**: Each file has one clear purpose
- **Dependency Injection**: Dependencies are injected, not created internally
- **Interface-based**: Services depend on interfaces, not implementations
- **Testable**: All layers can be unit tested independently

### Environment Variables

Key environment variables:

```env
# Server
PORT=8080
APP_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=etax

# Security
JWT_SECRET=your-secret-key
JWT_EXPIRE_HOURS=24

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=20
```

## 🧪 Testing

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific test
go test ./internal/services/auth/
```

## 📊 Performance

The application includes:
- Request/response logging
- Performance metrics
- Rate limiting
- Database connection pooling
- Response compression

## 🔒 Security Features

- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Security headers

## 📝 Logging

Structured logging with:
- Request/response logging
- Error tracking
- Performance metrics
- Audit trails

## 🚀 Deployment

### Production Build

```bash
# Build binary
go build -o etax-server cmd/server/main.go

# Run with Docker
docker build -t etax-backend .
docker run -p 8080:8080 etax-backend
```

### Environment Configuration

- **Development**: Debug mode, verbose logging
- **Production**: Release mode, optimized logging
- **Testing**: In-memory database, mock services

## 🤝 Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Follow Go best practices
5. Use meaningful commit messages

## 📄 License

[Your License Here]
