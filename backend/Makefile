# E-Tax Backend Makefile

.PHONY: help build run test clean docker-build docker-run

# Default target
help:
	@echo "Available commands:"
	@echo "  build      - Build the application"
	@echo "  run        - Run the application"
	@echo "  test       - Run tests"
	@echo "  test-cover - Run tests with coverage"
	@echo "  lint       - Run linter"
	@echo "  clean      - Clean build artifacts"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"

# Build the application
build:
	go build -o bin/etax-server cmd/server/main.go

# Run the application
run:
	go run cmd/server/main.go

# Run tests
test:
	go test ./...

# Run tests with coverage
test-cover:
	go test -cover ./...

# Run linter
lint:
	golangci-lint run

# Clean build artifacts
clean:
	rm -rf bin/
	go clean

# Build Docker image
docker-build:
	docker build -t etax-backend .

# Run Docker container
docker-run:
	docker run -p 8080:8080 etax-backend

# Install dependencies
deps:
	go mod download
	go mod tidy

# Update dependencies
deps-update:
	go get -u ./...
	go mod tidy

# Generate mocks (if using mockery)
mocks:
	mockery --all --output=tests/mocks

# Run database migrations
migrate-up:
	migrate -path migrations -database "postgres://user:password@localhost/etax?sslmode=disable" up

# Rollback database migrations
migrate-down:
	migrate -path migrations -database "postgres://user:password@localhost/etax?sslmode=disable" down

# Development server with hot reload (requires air)
dev:
	air -c .air.toml

# Format code
fmt:
	go fmt ./...

# Vet code
vet:
	go vet ./...

# Security scan
security:
	gosec ./...

# Benchmark tests
bench:
	go test -bench=. ./...

# Race condition tests
race:
	go test -race ./...

# Integration tests
integration:
	go test -tags=integration ./...

# Generate documentation
docs:
	godoc -http=:6060

# Check for outdated dependencies
outdated:
	go list -u -m all
