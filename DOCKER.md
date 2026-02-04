# Docker Setup for E-Tax System

This Docker setup includes all three services needed for the E-Tax invoice system:

## Services

- **PostgreSQL** (port 5432) - Database
- **Backend API** (port 8080) - Go server
- **Frontend** (port 3000) - Next.js web app

## Quick Start

### Prerequisites
- Docker Desktop installed
- Git (for cloning if needed)

### Steps

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432 (postgres/postgres)

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Development Mode

For development with hot reload:

```bash
# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Service Details

### PostgreSQL
- Image: postgres:15-alpine
- Database: etax
- User: postgres
- Password: postgres
- Schema automatically imported from `database/schema.sql`

### Backend
- Built from Go 1.21 Alpine
- Auto-reloads on code changes
- Connects to PostgreSQL via internal network

### Frontend
- Built from Node.js 18 Alpine
- Auto-reloads on code changes
- Connects to backend via localhost:8080

## Troubleshooting

### Port Conflicts
If ports are already in use, modify them in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend to 3001
```

### Database Issues
To reset the database:
```bash
docker-compose down -v  # Remove volumes
docker-compose up --build  # Start fresh
```

### Logs
View specific service logs:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## Environment Variables

The system uses these environment variables (configured in docker-compose.yml):

**Backend:**
- DB_HOST=postgres
- DB_PORT=5432
- DB_USER=postgres
- DB_PASSWORD=postgres
- DB_NAME=etax

**Frontend:**
- NEXT_PUBLIC_API_URL=http://localhost:8080

## Production Deployment

For production, consider:
1. Using environment-specific `.env` files
2. Adding SSL certificates
3. Setting up proper backup strategies
4. Using Docker Swarm or Kubernetes for scaling
