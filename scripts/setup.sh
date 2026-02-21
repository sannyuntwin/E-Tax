#!/bin/bash

# E-Tax Setup Script
# This script sets up the development environment

echo "🚀 Setting up E-Tax Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads

# Copy environment files
echo "⚙️ Setting up environment..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "📝 Created backend/.env from example"
fi

# Build and start services
echo "🐳 Building and starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    echo ""
    echo "🌐 Available endpoints:"
    echo "   Backend API: http://localhost:8080"
    echo "   Health Check: http://localhost:8080/health"
    echo "   API Docs: http://localhost:8080/api/docs"
    echo ""
    echo "🗄️ Database:"
    echo "   Host: localhost:5432"
    echo "   Database: etax"
    echo "   Username: postgres"
    echo "   Password: postgres"
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi

echo "🎉 Setup completed successfully!"
