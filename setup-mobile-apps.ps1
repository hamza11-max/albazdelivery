#!/usr/bin/env pwsh
# Mobile Apps Setup Script for AL-baz Delivery

Write-Host "🚀 AL-baz Delivery - Mobile Apps Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check pnpm
Write-Host "`n📦 Checking pnpm..." -ForegroundColor Yellow
$pnpmVersion = pnpm --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ pnpm installed: $pnpmVersion" -ForegroundColor Green
} else {
    Write-Host "❌ pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Install Expo CLI
Write-Host "`n📱 Installing Expo CLI..." -ForegroundColor Yellow
npm install -g expo-cli eas-cli
Write-Host "✅ Expo CLI installed" -ForegroundColor Green

# Create mobile-apps directory
Write-Host "`n📁 Creating mobile-apps directory..." -ForegroundColor Yellow
if (-not (Test-Path "mobile-apps")) {
    New-Item -ItemType Directory -Path "mobile-apps" | Out-Null
    Write-Host "✅ Created mobile-apps directory" -ForegroundColor Green
} else {
    Write-Host "✅ mobile-apps directory already exists" -ForegroundColor Green
}

# Ask user what to create
Write-Host "`n📱 What would you like to create?" -ForegroundColor Cyan
Write-Host "1. Customer App only" -ForegroundColor White
Write-Host "2. Driver App only" -ForegroundColor White
Write-Host "3. Both apps (recommended)" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White

$choice = Read-Host "`nEnter your choice (1-4)"

function Create-App {
    param(
        [string]$AppName,
        [string]$DisplayName
    )
    
    Write-Host "`n🏗️ Creating $DisplayName..." -ForegroundColor Yellow
    
    Set-Location "mobile-apps"
    
    if (Test-Path $AppName) {
        Write-Host "⚠️ $DisplayName already exists. Skipping..." -ForegroundColor Yellow
        Set-Location ..
        return
    }
    
    # Create Expo app
    npx create-expo-app@latest $AppName --template tabs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create $DisplayName" -ForegroundColor Red
        Set-Location ..
        return
    }
    
    Set-Location $AppName
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm add @react-navigation/native @react-navigation/stack
    pnpm add react-native-maps
    pnpm add @tanstack/react-query
    pnpm add zustand
    pnpm add axios
    pnpm add react-native-safe-area-context
    pnpm add react-native-screens
    pnpm add expo-location
    pnpm add expo-notifications
    pnpm add expo-secure-store
    
    if ($AppName -eq "driver-app") {
        pnpm add expo-camera expo-image-picker
    }
    
    # Create directories
    Write-Host "📁 Creating project structure..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "services" -Force | Out-Null
    New-Item -ItemType Directory -Path "stores" -Force | Out-Null
    New-Item -ItemType Directory -Path "types" -Force | Out-Null
    
    Write-Host "✅ $DisplayName created successfully!" -ForegroundColor Green
    
    Set-Location ../..
}

switch ($choice) {
    "1" {
        Create-App "customer-app" "Customer App"
    }
    "2" {
        Create-App "driver-app" "Driver App"
    }
    "3" {
        Create-App "customer-app" "Customer App"
        Create-App "driver-app" "Driver App"
    }
    "4" {
        Write-Host "`n👋 Setup cancelled" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "`n❌ Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📱 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Install Expo Go on your phone:" -ForegroundColor White
Write-Host "   • Android: https://play.google.com/store/apps/details?id=host.exp.exponent" -ForegroundColor Gray
Write-Host "   • iOS: https://apps.apple.com/app/expo-go/id982107779" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start development:" -ForegroundColor White
Write-Host "   cd mobile-apps\customer-app" -ForegroundColor Gray
Write-Host "   pnpm start" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Scan QR code with Expo Go app" -ForegroundColor White
Write-Host ""
Write-Host "📚 Read MOBILE_APP_GUIDE.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
