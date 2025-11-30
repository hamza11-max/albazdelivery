# Copy files from apps/ to app/ for production deployment
# This ensures Vercel deploys the latest code from apps/

Write-Host "=== Copying files from apps/ to app/ ===" -ForegroundColor Cyan
Write-Host ""

# Set error action preference
$ErrorActionPreference = "Continue"

# Function to copy directory recursively
function Copy-Directory {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        Write-Host "Copying $Description..." -ForegroundColor Yellow
        if (Test-Path $Destination) {
            Remove-Item -Path $Destination -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Path (Split-Path $Destination -Parent) -Force | Out-Null
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
        Write-Host "  ✅ Copied: $Source → $Destination" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Source not found: $Source" -ForegroundColor Yellow
    }
}

# Function to copy file
function Copy-File {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        Write-Host "Copying $Description..." -ForegroundColor Yellow
        $destDir = Split-Path $Destination -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "  ✅ Copied: $Source → $Destination" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Source not found: $Source" -ForegroundColor Yellow
    }
}

# ============================================
# ADMIN APP
# ============================================
Write-Host "`n=== ADMIN APP ===" -ForegroundColor Magenta

# Copy admin page
Copy-File "apps\admin\app\admin\page.tsx" "app\admin\page.tsx" "Admin page (with Phase 3)"

# Copy admin layout if exists
if (Test-Path "apps\admin\app\admin\layout.tsx") {
    Copy-File "apps\admin\app\admin\layout.tsx" "app\admin\layout.tsx" "Admin layout"
}
if (Test-Path "apps\admin\app\admin\loading.tsx") {
    Copy-File "apps\admin\app\admin\loading.tsx" "app\admin\loading.tsx" "Admin loading"
}

# Copy admin components
Copy-Directory "apps\admin\components" "app\admin\components" "Admin components (AnalyticsDashboard, etc.)"

# Copy admin hooks
Copy-Directory "apps\admin\hooks" "app\admin\hooks" "Admin hooks"

# Copy admin lib files
Copy-Directory "apps\admin\lib" "app\admin\lib" "Admin lib files (CSRF, audit, etc.)"

# Copy admin API routes
Write-Host "`nCopying Admin API routes..." -ForegroundColor Yellow

# Analytics API
Copy-File "apps\admin\app\api\admin\analytics\route.ts" "app\api\admin\analytics\route.ts" "Analytics API route"

# Export API
Copy-File "apps\admin\app\api\admin\export\route.ts" "app\api\admin\export\route.ts" "Export API route"

# Audit logs API
if (Test-Path "apps\admin\app\api\admin\audit-logs\route.ts") {
    Copy-File "apps\admin\app\api\admin\audit-logs\route.ts" "app\api\admin\audit-logs\route.ts" "Audit logs API route"
}

# Bulk users API
if (Test-Path "apps\admin\app\api\admin\users\bulk\route.ts") {
    Copy-File "apps\admin\app\api\admin\users\bulk\route.ts" "app\api\admin\users\bulk\route.ts" "Bulk users API"

    # Create directory if it doesn't exist
    $bulkDir = "app\api\admin\users\bulk"
    if (-not (Test-Path $bulkDir)) {
        New-Item -ItemType Directory -Path $bulkDir -Force | Out-Null
    }
}

# CSRF token API
if (Test-Path "apps\admin\app\api\csrf-token\route.ts") {
    Copy-File "apps\admin\app\api\csrf-token\route.ts" "app\api\csrf-token\route.ts" "CSRF token API route"
}

# Copy other admin API routes that might have been updated
$adminApiRoutes = @(
    "apps\admin\app\api\admin\ads",
    "apps\admin\app\api\admin\orders",
    "apps\admin\app\api\admin\registration-requests",
    "apps\admin\app\api\admin\users"
)

foreach ($route in $adminApiRoutes) {
    if (Test-Path $route) {
        $relativePath = $route -replace "apps\\admin\\app\\api", "app\api"
        Copy-Directory $route $relativePath "Admin API: $(Split-Path $route -Leaf)"
    }
}

# ============================================
# CUSTOMER APP (if needed)
# ============================================
Write-Host "`n=== CUSTOMER APP ===" -ForegroundColor Magenta
Write-Host "Skipping customer app (already in app/ root)" -ForegroundColor Gray

# ============================================
# DRIVER APP (if needed)
# ============================================
Write-Host "`n=== DRIVER APP ===" -ForegroundColor Magenta
Write-Host "Skipping driver app (already in app/ root)" -ForegroundColor Gray

# ============================================
# VENDOR APP (if needed)
# ============================================
Write-Host "`n=== VENDOR APP ===" -ForegroundColor Magenta
Write-Host "Skipping vendor app (already in app/ root)" -ForegroundColor Gray

# ============================================
# SUMMARY
# ============================================
Write-Host "`n=== COPY COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Files copied from apps/ to app/:" -ForegroundColor Cyan
Write-Host "  ✅ Admin page with Phase 3 Analytics" -ForegroundColor White
Write-Host "  ✅ Admin components (AnalyticsDashboard, etc.)" -ForegroundColor White
Write-Host "  ✅ Admin API routes (analytics, export, audit-logs, bulk)" -ForegroundColor White
Write-Host "  ✅ Admin hooks and lib files" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git status" -ForegroundColor White
Write-Host "  2. Commit changes: git add app/ && git commit -m 'Copy Phase 3 from apps/ to app/'" -ForegroundColor White
Write-Host "  3. Push to GitHub: git push origin main" -ForegroundColor White
Write-Host "  4. Vercel will auto-deploy with Phase 3 features" -ForegroundColor White
Write-Host ""

