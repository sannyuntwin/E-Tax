# Use Go 1.23 Alpine image
FROM golang:1.23-alpine AS builder

# Set working directory
WORKDIR /app

# Install git (required for go modules)
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Production build stage
FROM alpine:latest AS production
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
