# E-Tax Production Deployment Guide

## Overview

This guide covers deploying the E-Tax invoice system to production environments.

## Prerequisites

### Infrastructure Requirements

- **Server**: Linux (Ubuntu 20.04+ recommended) with at least 2GB RAM
- **Database**: PostgreSQL 14+ 
- **Reverse Proxy**: Nginx or similar
- **SSL Certificate**: Valid SSL certificate for HTTPS
- **Domain**: Custom domain name configured

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- Go 1.23+ (if building from source)
- Node.js 18+ (if building frontend from source)

## Environment Configuration

### 1. Environment Variables

Create a `.env.production` file in the backend directory:

```bash
# Server Configuration
PORT=8080
APP_ENV=production
APP_DEBUG=false
APP_LOG_LEVEL=warn

# Database Configuration
DB_HOST=your_production_db_host
DB_PORT=5432
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=etax_production
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=10
DB_CONN_MAX_LIFETIME=300

# Security Configuration
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long_for_production
JWT_EXPIRE_HOURS=24

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=20

# Email Configuration
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=noreply@yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/var/uploads
```

### 2. Database Setup

```bash
# Create production database
createdb etax_production

# Create database user with limited privileges
createuser --interactive etax_user

# Grant privileges
psql -d etax_production -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO etax_user;"
```

### 3. SSL Certificate Setup

#### Using Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d app.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Using Custom Certificate

Place your certificate files in `/etc/ssl/certs/`:
- `yourdomain.com.crt`
- `yourdomain.com.key`

## Deployment Methods

### Method 1: Docker Compose (Recommended)

1. **Create production docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: etax-postgres
    environment:
      POSTGRES_DB: etax_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - etax-network
    restart: unless-stopped

  backend:
    image: your-dockerhub-username/etax-backend:latest
    container_name: etax-backend
    env_file:
      - ./backend/.env.production
    depends_on:
      - postgres
    networks:
      - etax-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: your-dockerhub-username/etax-frontend:latest
    container_name: etax-frontend
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    depends_on:
      - backend
    networks:
      - etax-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: etax-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - frontend
      - backend
    networks:
      - etax-network
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  etax-network:
    driver: bridge
```

2. **Create Nginx configuration** (`nginx/nginx.conf`):

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com app.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # Frontend (HTTPS)
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
        ssl_certificate_key /etc/ssl/certs/yourdomain.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Backend API (HTTPS)
    server {
        listen 443 ssl http2;
        server_name app.yourdomain.com;

        ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
        ssl_certificate_key /etc/ssl/certs/yourdomain.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Security headers
            add_header X-Frame-Options DENY;
            add_header X-Content-Type-Options nosniff;
            add_header X-XSS-Protection "1; mode=block";
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        }
    }
}
```

3. **Deploy**:

```bash
# Clone repository
git clone https://github.com/your-username/E-Tax.git
cd E-Tax

# Set up environment
cp backend/.env.example backend/.env.production
# Edit .env.production with your values

# Deploy
docker-compose -f docker-compose.yml --env-file backend/.env.production up -d
```

### Method 2: Kubernetes

1. **Create Kubernetes manifests**:

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: etax

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: etax-config
  namespace: etax
data:
  APP_ENV: "production"
  PORT: "8080"
```

2. **Deploy to Kubernetes**:

```bash
kubectl apply -f k8s/
```

## Monitoring and Logging

### 1. Application Monitoring

Set up monitoring with Prometheus and Grafana:

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 2. Log Management

Configure centralized logging:

```bash
# Application logs
docker-compose logs -f etax-backend

# System logs
journalctl -u docker -f
```

## Backup Strategy

### 1. Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="etax_production"

# Create backup
pg_dump -h localhost -U postgres -d $DB_NAME > $BACKUP_DIR/etax_backup_$DATE.sql

# Compress old backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -exec gzip {} \;

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 2. File Backups

```bash
# Backup uploaded files
rsync -av /var/uploads/ /backups/files/
```

## Security Considerations

### 1. Network Security

- Use firewall to restrict access to database
- Only expose necessary ports (80, 443)
- Use VPN for administrative access

### 2. Application Security

- Regularly update dependencies
- Monitor security advisories
- Use security scanning tools
- Implement rate limiting
- Enable audit logging

### 3. Database Security

- Use strong passwords
- Enable SSL connections
- Regular database backups
- Limit database user privileges
- Enable database auditing

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_invoices_status ON invoices(status);
CREATE INDEX CONCURRENTLY idx_invoices_date ON invoices(issue_date);
CREATE INDEX CONCURRENTLY idx_companies_tax_id ON companies(tax_id);
```

### 2. Caching

- Configure Redis for session storage
- Enable application-level caching
- Use CDN for static assets

## Scaling Considerations

### 1. Horizontal Scaling

- Load balance multiple backend instances
- Use read replicas for database
- Implement microservices architecture

### 2. Vertical Scaling

- Monitor resource usage
- Scale up CPU/RAM as needed
- Use SSD storage for better I/O

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **SSL Certificate Issues**
   - Verify certificate validity
   - Check certificate chain
   - Ensure proper file permissions

3. **High Memory Usage**
   - Monitor application memory
   - Check for memory leaks
   - Optimize database queries

### Health Checks

```bash
# Application health
curl https://app.yourdomain.com/health

# Database health
docker-compose exec postgres pg_isready

# Service status
docker-compose ps
```

## Maintenance

### Regular Tasks

1. **Daily**
   - Monitor application logs
   - Check system resources
   - Verify backups completed

2. **Weekly**
   - Update security patches
   - Review performance metrics
   - Clean up old logs

3. **Monthly**
   - Update dependencies
   - Security audit
   - Backup verification

### Rolling Updates

```bash
# Zero-downtime deployment
docker-compose up -d --no-deps backend
# Wait for health check
docker-compose up -d --no-deps frontend
```

## Support

For production support:

1. **Documentation**: Keep this guide updated
2. **Monitoring**: Set up alerts for critical issues
3. **Contact**: Maintain emergency contact information
4. **Escalation**: Define escalation procedures

---

**Note**: This guide should be adapted based on your specific infrastructure requirements and security policies.
