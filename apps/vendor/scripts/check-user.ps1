# Check if vendor user exists in database
Write-Host "Checking database for vendor user..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "../../.env.local")) {
    Write-Host "WARNING: .env.local not found" -ForegroundColor Yellow
    Write-Host "Make sure DATABASE_URL is set in .env.local" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "To check if the user exists, you can:" -ForegroundColor Cyan
Write-Host "1. Run: npm run db:studio (opens Prisma Studio)" -ForegroundColor White
Write-Host "2. Or check the database directly" -ForegroundColor White
Write-Host ""
Write-Host "Expected vendor user:" -ForegroundColor Green
Write-Host "  Email: vendor@test.com" -ForegroundColor White
Write-Host "  Password: Vendor123!" -ForegroundColor White
Write-Host "  Status: APPROVED" -ForegroundColor White
Write-Host "  Role: VENDOR" -ForegroundColor White
Write-Host ""
Write-Host "If user doesn't exist, run:" -ForegroundColor Yellow
Write-Host "  npm run db:seed" -ForegroundColor White

