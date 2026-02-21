# E-Tax Invoice Management System

<div align="center">

![E-Tax Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=E-Tax)

**Professional Invoice Management System for Modern Businesses**

[![Go Version](https://img.shields.io/badge/Go-1.23+-00ADD8?style=flat&logo=go)](https://golang.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](docs/api/API_REFERENCE.md) • [Deployment](docs/deployment/DEPLOYMENT.md)

</div>

## ✨ Features

### 🧾 Invoice Management
- Create, edit, and manage professional invoices
- Support for multiple currencies and tax rates
- Automatic invoice numbering and tracking
- Draft saving and invoice duplication
- PDF and XML export capabilities

### 👥 Customer & Product Management
- Comprehensive customer database
- Product catalog with pricing tiers
- Customer payment history tracking
- Bulk operations for efficiency

### 💳 Payment Processing
- Multiple payment method support
- Automated payment reminders
- Recurring invoice management
- Payment analytics and reporting

### 🔐 Enterprise Security
- JWT-based authentication
- Role-based access control (RBAC)
- Audit logging and compliance
- Rate limiting and DDoS protection
- GDPR compliant data handling

### 📊 Analytics & Reporting
- Real-time dashboard metrics
- Financial performance analytics
- Tax reporting automation
- Custom report generation

### 🚀 Performance & Scalability
- Optimized database queries
- Caching with Redis support
- Horizontal scaling ready
- API response compression

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (React)       │◄──►│    (Go API)     │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • Invoices      │
│ • Invoice UI    │    │ • JWT Auth      │    │ • Customers     │
│ • Reports       │    │ • Validation    │    │ • Products      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-org/E-Tax.git
cd E-Tax

# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup

```bash
# Start development environment
docker-compose -f docker/docker-compose.dev.yml up -d

# Access the application
# Frontend: http://localhost:3000 (run separately with npm run dev)
# Backend API: http://localhost:8080
# API Documentation: http://localhost:8080/api/docs
```

## 📁 Project Structure

```
E-Tax/
├── 📁 backend/                 # Go backend API
│   ├── 📁 api/                # API handlers and routes
│   ├── 📁 config/             # Configuration management
│   ├── 📁 database/           # Database models and migrations
│   ├── 📁 security/           # Authentication & authorization
│   └── 📁 tests/              # Unit and integration tests
├── 📁 frontend/               # React frontend application
├── 📁 database/               # Database schemas and migrations
├── 📁 docs/                   # Documentation
│   ├── 📁 api/                # API documentation
│   ├── 📁 deployment/         # Deployment guides
│   ├── 📁 development/        # Development docs
│   └── 📁 user-guides/        # User documentation
├── 📁 scripts/                # Utility scripts
├── 📁 docker/                 # Docker configurations
├── 📁 deployments/            # Kubernetes/Helm charts
└── 📁 nginx/                  # Nginx configuration
```

## 🔧 Development

### Environment Setup

1. **Backend Development**
   ```bash
   cd backend
   go mod download
   go run main.go
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Running Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
# Run migrations
docker-compose exec postgres psql -U postgres -d etax -f database/schema.sql
```

## 📚 Documentation

- **[API Reference](docs/api/API_REFERENCE.md)** - Complete API documentation
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment
- **[Development Guide](docs/development/SETUP.md)** - Development setup
- **[User Guide](docs/user-guides/USER_GUIDE.md)** - End-user documentation

## 🐳 Docker Environments

| Environment | Command | Description |
|-------------|---------|-------------|
| Development | `docker-compose -f docker/docker-compose.dev.yml up -d` | Local development |
| Production | `docker-compose -f docker/docker-compose.prod.yml up -d` | Production deployment |

## 🔐 Security

- **Authentication**: JWT tokens with configurable expiration
- **Authorization**: Role-based access control (Admin, User, ReadOnly)
- **Data Protection**: Encrypted sensitive data at rest
- **API Security**: Rate limiting, CORS, input validation
- **Audit Trail**: Complete audit logging for compliance

## 📊 Monitoring & Performance

### Health Checks
- **Backend**: `GET /health`
- **Database**: Connection pool monitoring
- **Frontend**: Application health monitoring
- **Database Health**: Connection and query performance
- **System Health**: Memory, CPU, disk usage

### Performance Metrics
- **Response Times**: Request duration tracking
- **Error Rates**: HTTP error monitoring
- **Throughput**: Requests per second
- **Resource Usage**: Memory and CPU monitoring

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Log Levels**: Debug, Info, Warn, Error
- **Audit Trails**: All user actions logged
- **Security Events**: Failed logins, suspicious activity

## Compliance

### Thailand Revenue Department
- ✅ e-Tax XML format compliance
- ✅ VAT calculation (7% standard rate)
- ✅ Digital signature support
- ✅ Invoice numbering requirements
- ✅ Data retention policies

### Data Privacy
- ✅ GDPR compliance features
- ✅ Data encryption at rest
- ✅ User consent management
- ✅ Right to deletion
- ✅ Data portability

## Deployment Options

### Docker Deployment
```bash
# Development
docker-compose -f docker/docker-compose.dev.yml up -d

# Production
docker-compose -f docker/docker-compose.prod.yml up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Cloud Platforms
- **AWS**: ECS, EKS, RDS
- **Google Cloud**: GKE, Cloud SQL
- **Azure**: AKS, Azure Database
- **DigitalOcean**: App Platform, Managed Databases

## Support

### Documentation
- **[User Guide](USER_GUIDE.md)**: Complete user documentation
- **[Deployment Guide](DEPLOYMENT.md)**: Production deployment instructions
- **[API Documentation](https://api.yourdomain.com/api/docs)**: Interactive API reference

### Getting Help
- **Email**: support@yourdomain.com
- **Documentation**: https://docs.yourdomain.com
- **Issues**: GitHub Issues
- **Community**: Discord/Slack community

### Professional Support
Available for enterprise customers:
- 24/7 technical support
- Custom development
- Training and onboarding
- SLA guarantees

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests
5. Submit pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

### Version 2.0 (Q2 2024)
- [ ] Multi-currency support
- [ ] Advanced reporting dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] API rate limiting per user

### Version 2.1 (Q3 2024)
- [ ] AI-powered invoice suggestions
- [ ] Automated expense categorization
- [ ] Advanced workflow automation
- [ ] Integration with accounting software

## Changelog

### v1.0.0 (Current)
- ✅ Production-ready core functionality
- ✅ Complete API with authentication
- ✅ Modern web interface
- ✅ Security hardening
- ✅ CI/CD pipeline
- ✅ Comprehensive testing
- ✅ Documentation

---

**E-Tax Invoice System** - Professional invoice management for Thailand Revenue Department compliance.

🚀 **Ready for Production** 🚀
