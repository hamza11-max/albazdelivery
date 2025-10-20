# AL-baz Delivery Platform - Quick Setup Script
# Run this script with: .\setup.ps1

Write-Host "AL-baz Delivery Platform - Quick Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
Write-Host "[INFO] Checking for pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "[OK] pnpm $pnpmVersion found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] pnpm not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g pnpm" -ForegroundColor White
    exit 1
}

# Check if .env.local exists
Write-Host ""
Write-Host "[INFO] Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "[OK] .env.local already exists" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Creating .env.local from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env.local"
    Write-Host "[OK] .env.local created" -ForegroundColor Green
    Write-Host ""
    Write-Host "[IMPORTANT] Edit .env.local and add your DATABASE_URL" -ForegroundColor Red
    Write-Host "   Minimum required:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL" -ForegroundColor White
    Write-Host "   - NEXTAUTH_SECRET (run: openssl rand -base64 32)" -ForegroundColor White
    Write-Host "   - NEXTAUTH_URL=http://localhost:3000" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Have you configured .env.local? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please configure .env.local and run this script again." -ForegroundColor Yellow
        exit 0
    }
}

# Install dependencies
Write-Host ""
Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host ""
Write-Host "[INFO] Generating Prisma Client..." -ForegroundColor Yellow
pnpm db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Push database schema
Write-Host ""
Write-Host "[INFO] Pushing database schema..." -ForegroundColor Yellow
pnpm db:push
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database schema pushed" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to push database schema" -ForegroundColor Red
    Write-Host "   Make sure your DATABASE_URL is correct in .env.local" -ForegroundColor Yellow
    exit 1
}

# Seed database
Write-Host ""
Write-Host "[INFO] Seeding database with test data..." -ForegroundColor Yellow
$seedResponse = Read-Host "Do you want to seed the database with test data? (y/n)"
if ($seedResponse -eq "y") {
    pnpm db:seed
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database seeded successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "[INFO] Test Accounts Created:" -ForegroundColor Cyan
        Write-Host "   Admin:    admin@albazdelivery.com / Admin123!" -ForegroundColor White
        Write-Host "   Customer: customer@test.com / Customer123!" -ForegroundColor White
        Write-Host "   Vendor:   vendor@test.com / Vendor123!" -ForegroundColor White
        Write-Host "   Driver:   driver@test.com / Driver123!" -ForegroundColor White
    } else {
        Write-Host "[ERROR] Failed to seed database" -ForegroundColor Red
    }
} else {
    Write-Host "[INFO] Skipping database seeding" -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[NEXT] Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start the development server:" -ForegroundColor White
Write-Host "      pnpm dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   2. Open your browser:" -ForegroundColor White
Write-Host "      http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   3. (Optional) Open Prisma Studio:" -ForegroundColor White
Write-Host "      pnpm db:studio" -ForegroundColor Cyan
Write-Host ""
Write-Host "[DOCS] Documentation:" -ForegroundColor Yellow
Write-Host "   - SETUP_GUIDE.md - Complete setup instructions" -ForegroundColor White
Write-Host "   - PROGRESS_UPDATE.md - Current implementation status" -ForegroundColor White
Write-Host "   - WHATS_NEXT.md - Next steps and action plan" -ForegroundColor White
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
