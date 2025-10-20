# Quick login test script

Write-Host "Testing AL-baz Login API..." -ForegroundColor Cyan
Write-Host ""

# Test admin login
Write-Host "1. Testing Admin Login..." -ForegroundColor Yellow
$adminBody = @{
    email = "admin@albazdelivery.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $adminBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✓ Admin Login SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name) ($($response.data.user.role))" -ForegroundColor White
    } else {
        Write-Host "   ✗ Admin Login FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test customer login
Write-Host "2. Testing Customer Login..." -ForegroundColor Yellow
$customerBody = @{
    email = "customer@test.com"
    password = "Customer123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $customerBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✓ Customer Login SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name) ($($response.data.user.role))" -ForegroundColor White
    } else {
        Write-Host "   ✗ Customer Login FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test vendor login
Write-Host "3. Testing Vendor Login..." -ForegroundColor Yellow
$vendorBody = @{
    email = "vendor@test.com"
    password = "Vendor123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $vendorBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✓ Vendor Login SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name) ($($response.data.user.role))" -ForegroundColor White
    } else {
        Write-Host "   ✗ Vendor Login FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test driver login
Write-Host "4. Testing Driver Login..." -ForegroundColor Yellow
$driverBody = @{
    email = "driver@test.com"
    password = "Driver123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $driverBody -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✓ Driver Login SUCCESSFUL!" -ForegroundColor Green
        Write-Host "   User: $($response.data.user.name) ($($response.data.user.role))" -ForegroundColor White
    } else {
        Write-Host "   ✗ Driver Login FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To test in REST Client (VS Code):" -ForegroundColor Yellow
Write-Host "1. Install 'REST Client' extension" -ForegroundColor White
Write-Host "2. Open test-api.http" -ForegroundColor White
Write-Host "3. Click 'Send Request' above any login endpoint" -ForegroundColor White
