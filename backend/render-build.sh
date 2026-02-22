#!/bin/bash

# Render build script for E-Tax Backend
echo "🚀 Starting E-Tax Backend build for Render..."

# Set Go version
export GO_VERSION=1.23

# Download dependencies
echo "📦 Downloading Go modules..."
go mod download
go mod verify

# Build the application
echo "🔨 Building the application..."
go build -ldflags="-s -w" -o bin/main .

# Verify the build
echo "✅ Build completed successfully!"
ls -la bin/

echo "🎯 Backend is ready for deployment!"
