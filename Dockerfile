# E-Tax Backend Dockerfile
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Install git (required for go modules)
RUN apk add --no-cache git

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/ .

# Build application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production build stage
FROM alpine:latest AS production
RUN apk --no-cache add ca-certificates
WORKDIR /app

# Copy the built binary
COPY --from=builder /app/main .

# Copy .env file if it exists (optional)
COPY --from=builder /app/backend/.env . || true

# Make the binary executable
RUN chmod +x /app/main

# Verify everything is in place
RUN ls -la /app/

EXPOSE 8080
CMD ["./main"]
