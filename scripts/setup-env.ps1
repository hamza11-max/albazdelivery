# PowerShell script to set up environment variables for Supabase
# Run this script to configure your .env.local file

$directUrl = "postgresql://postgres:albaz96hamza@db.lftmnkziovagctibmwff.supabase.co:5432/postgres?sslmode=require"
$pooledUrl = "postgresql://postgres:albaz96hamza@db.lftmnkziovagctibmwff.supabase.co:6543/postgres?pgbouncer=true&sslmode=require"

# Generate a secure random secret for NextAuth (32 characters)
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$nextAuthSecret = [Convert]::ToBase64String($bytes)

$envLines = @(
    "# Database - Supabase",
    "# Direct connection for migrations (REQUIRED)",
    "DIRECT_URL=$directUrl",
    "",
    "# Application connection (using pooled for better performance)",
    "DATABASE_URL=$pooledUrl",
    "",
    "# Authentication - NextAuth.js",
    "NEXTAUTH_SECRET=$nextAuthSecret",
    "NEXTAUTH_URL=http://localhost:3000",
    "",
    "# Redis (Optional for Phase 1)",
    "# REDIS_URL=redis://localhost:6379",
    "",
    "# Email (for OTP/Notifications)",
    "# SMTP_HOST=smtp.gmail.com",
    "# SMTP_PORT=587",
    "# SMTP_USER=your-email@gmail.com",
    "# SMTP_PASSWORD=your-app-password",
    "",
    "# SMS (Optional for Phase 1)",
    "# SMS_API_KEY=your-sms-api-key",
    "",
    "# Payment Gateway (Phase 2)",
    "# STRIPE_SECRET_KEY=sk_test_...",
    "# STRIPE_PUBLISHABLE_KEY=pk_test_...",
    "",
    "# Maps (Phase 2)",
    "# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key",
    "",
    "# File Upload",
    "# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name",
    "# CLOUDINARY_API_KEY=your-api-key",
    "# CLOUDINARY_API_SECRET=your-api-secret",
    "",
    "# Analytics",
    "# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX",
    "",
    "# Sentry (Error Tracking)",
    "# SENTRY_DSN=your-sentry-dsn",
    "# NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn"
)

# Write to .env.local (for Next.js)
$envLines | Out-File -FilePath ".env.local" -Encoding utf8

# Also write to .env (for Prisma CLI)
# Prisma CLI reads from .env by default
$envLines | Out-File -FilePath ".env" -Encoding utf8

Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host "  - .env.local (for Next.js)" -ForegroundColor Gray
Write-Host "  - .env (for Prisma CLI)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npx prisma generate" -ForegroundColor Cyan
Write-Host "  2. Run: npx prisma migrate dev --name init" -ForegroundColor Cyan
