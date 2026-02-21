#!/bin/bash

# E-Tax Production Deployment Script
# This script deploys the application to production

set -e

echo "🚀 Deploying E-Tax to Production..."

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup..."
if docker-compose ps | grep -q "Up"; then
    docker-compose exec postgres pg_dump -U postgres etax > "$BACKUP_DIR/database.sql"
    echo "✅ Database backed up to $BACKUP_DIR/database.sql"
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build production images
echo "🐳 Building production images..."
docker-compose -f docker/docker-compose.prod.yml build --no-cache

# Stop existing services
echo "⏹️ Stopping existing services..."
docker-compose -f docker/docker-compose.prod.yml down

# Start production services
echo "▶️ Starting production services..."
docker-compose -f docker/docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    echo "🔄 Rolling back..."
    docker-compose -f docker/docker-compose.prod.yml down
    # Add rollback logic here if needed
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
echo ""
echo "🌐 Production endpoints:"
echo "   Backend API: https://your-domain.com/api"
echo "   Health Check: https://your-domain.com/health"
