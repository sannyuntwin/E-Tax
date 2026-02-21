# E-Tax API Testing Script
# This script helps test the E-Tax backend API endpoints

$BASE_URL = "http://localhost:8080"

Write-Host "E-Tax API Testing Script" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
    Write-Host "Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "   Database Status: $($response.database.status)" -ForegroundColor Cyan
    Write-Host "   Performance: $($response.performance.request_count) requests processed" -ForegroundColor Cyan
} catch {
    Write-Host "Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Root Endpoint (API Documentation)
Write-Host "2. Testing Root Endpoint (API Docs)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/" -Method GET
    Write-Host "Root Endpoint: SUCCESS" -ForegroundColor Green
    Write-Host "   API Status: $($response.status)" -ForegroundColor Cyan
    Write-Host "   Version: $($response.version)" -ForegroundColor Cyan
    Write-Host "   Available Categories: $($response.endpoints.psobject.properties.name -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "Root Endpoint: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Authentication Endpoints
Write-Host "3. Testing Authentication Endpoints..." -ForegroundColor Yellow

# Test Login (should fail with invalid credentials)
Write-Host "   Testing Login (invalid credentials)..." -ForegroundColor Cyan
try {
    $body = @{
        username = "testuser"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   Login: Unexpected success" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   Login: Correctly rejected invalid credentials" -ForegroundColor Green
    } else {
        Write-Host "   Login: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test Register
Write-Host "   Testing Register endpoint..." -ForegroundColor Cyan
try {
    $body = @{
        username = "testuser$(Get-Random)"
        email = "test$(Get-Random)@example.com"
        password = "testpassword123"
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   Register: SUCCESS - User created" -ForegroundColor Green
    Write-Host "   User ID: $($response.id)" -ForegroundColor Cyan
} catch {
    Write-Host "   Register: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Protected Endpoints (should fail without auth)
Write-Host "4. Testing Protected Endpoints (without authentication)..." -ForegroundColor Yellow
$protectedEndpoints = @(
    "/api/profile",
    "/api/invoices",
    "/api/companies",
    "/api/customers",
    "/api/dashboard/stats"
)

foreach ($endpoint in $protectedEndpoints) {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL$endpoint" -Method GET -ErrorAction Stop
        Write-Host "   $endpoint : Unexpected success (should require auth)" -ForegroundColor Red
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   $endpoint : Correctly requires authentication" -ForegroundColor Green
        } else {
            Write-Host "   $endpoint : FAILED - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Test 5: Test Endpoint
Write-Host "5. Testing Test Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/test" -Method GET
    Write-Host "Test Endpoint: SUCCESS" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
    Write-Host "   Status: $($response.status)" -ForegroundColor Cyan
} catch {
    Write-Host "Test Endpoint: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "API Testing Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:3000" -ForegroundColor Blue
Write-Host "Backend API: http://localhost:8080" -ForegroundColor Blue
Write-Host "API Docs: http://localhost:8080/" -ForegroundColor Blue
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "   • Use the frontend at http://localhost:3000 for full UI testing" -ForegroundColor Gray
Write-Host "   • Check the API docs at http://localhost:8080 for all endpoints" -ForegroundColor Gray
Write-Host "   • Use this script to quickly verify API functionality" -ForegroundColor Gray
