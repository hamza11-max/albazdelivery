# Comprehensive script to verify and copy files from apps/ to app/
# This script compares structures and copies files with proper path adjustments

Write-Host "=== VERIFICATION AND COPY: apps/ → app/ ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Track statistics
$stats = @{
    FilesCompared = 0
    FilesCopied = 0
    FilesSkipped = 0
    FilesUpdated = 0
    Errors = 0
}

# Function to normalize paths for comparison
function Normalize-Path {
    param([string]$Path)
    return $Path -replace '\\', '/' -replace '//', '/'
}

# Function to compare two files
function Compare-File {
    param(
        [string]$Source,
        [string]$Destination
    )
    
    if (-not (Test-Path $Source)) {
        return $null
    }
    
    if (-not (Test-Path $Destination)) {
        return "Missing"
    }
    
    $sourceHash = (Get-FileHash $Source -Algorithm MD5).Hash
    $destHash = (Get-FileHash $Destination -Algorithm MD5).Hash
    
    if ($sourceHash -eq $destHash) {
        return "Identical"
    } else {
        return "Different"
    }
}

# Function to copy file with path adjustments for imports
function Copy-FileWithAdjustments {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$SourceBase,
        [string]$DestBase
    )
    
    if (-not (Test-Path $Source)) {
        Write-Host "  ⚠️  Source not found: $Source" -ForegroundColor Yellow
        $stats.Errors++
        return
    }
    
    try {
        # Create destination directory
        $destDir = Split-Path $Destination -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        
        # Read file content
        $content = Get-Content $Source -Raw
        
        # Calculate relative path adjustments needed
        # For example: apps/admin/app/admin/page.tsx → app/admin/page.tsx
        # Imports like ../../lib/ → ../lib/
        
        $sourceDepth = ($Source -replace [regex]::Escape($SourceBase), "").Split([IO.Path]::DirectorySeparatorChar).Count - 1
        $destDepth = ($Destination -replace [regex]::Escape($DestBase), "").Split([IO.Path]::DirectorySeparatorChar).Count - 1
        
        $depthDifference = $sourceDepth - $destDepth
        
        # Adjust import paths if needed (for TypeScript/TSX files)
        if ($Source -match '\.(ts|tsx|js|jsx)$' -and $depthDifference -ne 0) {
            # Adjust relative imports (../../ → ../)
            if ($depthDifference -gt 0) {
                # Need to reduce depth
                $pattern = '\.\.\\' * ($depthDifference + 1)
                $replacement = '..\'
                $content = $content -replace $pattern, $replacement
                
                # Also handle forward slashes
                $pattern = '\.\.\/' * ($depthDifference + 1)
                $replacement = '../'
                $content = $content -replace $pattern, $replacement
            }
        }
        
        # Write to destination
        Set-Content -Path $Destination -Value $content -NoNewline
        $stats.FilesCopied++
        Write-Host "  ✅ Copied: $(Split-Path $Source -Leaf)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Error copying $Source : $_" -ForegroundColor Red
        $stats.Errors++
    }
}

# Function to copy directory recursively
function Copy-DirectoryStructure {
    param(
        [string]$SourceDir,
        [string]$DestDir,
        [string]$SourceBase,
        [string]$DestBase,
        [array]$ExcludePatterns = @()
    )
    
    if (-not (Test-Path $SourceDir)) {
        return
    }
    
    $items = Get-ChildItem -Path $SourceDir -File
    
    foreach ($item in $items) {
        # Skip excluded patterns
        $shouldExclude = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($item.FullName -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if ($shouldExclude) {
            $stats.FilesSkipped++
            continue
        }
        
        # Calculate relative path
        $relativePath = $item.FullName -replace [regex]::Escape($SourceBase), ""
        $relativePath = $relativePath.TrimStart('\', '/')
        $destPath = Join-Path $DestDir $relativePath
        
        # Compare files
        $comparison = Compare-File -Source $item.FullName -Destination $destPath
        $stats.FilesCompared++
        
        # Copy if missing or different
        if ($comparison -eq "Missing" -or $comparison -eq "Different" -or $null -eq $comparison) {
            Copy-FileWithAdjustments -Source $item.FullName -Destination $destPath -SourceBase $SourceBase -DestBase $DestBase
            
            if ($comparison -eq "Different") {
                $stats.FilesUpdated++
            }
        }
        elseif ($comparison -eq "Identical") {
            Write-Host "  ⏭️  Skipped (identical): $(Split-Path $item.FullName -Leaf)" -ForegroundColor Gray
            $stats.FilesSkipped++
        }
    }
    
    # Recursively process subdirectories
    $subdirs = Get-ChildItem -Path $SourceDir -Directory
    foreach ($subdir in $subdirs) {
        $subRelativePath = $subdir.FullName -replace [regex]::Escape($SourceBase), ""
        $subRelativePath = $subRelativePath.TrimStart('\', '/')
        $subDestPath = Join-Path $DestDir $subRelativePath
        
        Copy-DirectoryStructure -SourceDir $subdir.FullName -DestDir $subDestPath -SourceBase $SourceBase -DestBase $DestBase -ExcludePatterns $ExcludePatterns
    }
}

# Define exclude patterns
$excludePatterns = @(
    "*node_modules*",
    "*.git*",
    "*.tsbuildinfo",
    "package.json",
    "tsconfig.json",
    "next.config.*",
    "next-env.d.ts",
    "*.log",
    "*.md",
    "*.ps1",
    "*.yml",
    "*.backup",
    "*__tests__*",
    "*coverage*",
    "*.test.*",
    "*.spec.*"
)

# ============================================
# ADMIN APP
# ============================================
Write-Host "`n=== ADMIN APP ===" -ForegroundColor Magenta

$adminSourceBase = Join-Path $PWD "apps\admin"
$adminDestBase = Join-Path $PWD "app"

# Copy admin/app/admin/* → app/admin/*
if (Test-Path "apps\admin\app\admin") {
    Copy-DirectoryStructure `
        -SourceDir "apps\admin\app\admin" `
        -DestDir "app\admin" `
        -SourceBase (Join-Path $PWD "apps\admin\app\admin") `
        -DestBase (Join-Path $PWD "app\admin") `
        -ExcludePatterns $excludePatterns
}

# Copy admin/components → app/admin/components
if (Test-Path "apps\admin\components") {
    Copy-DirectoryStructure `
        -SourceDir "apps\admin\components" `
        -DestDir "app\admin\components" `
        -SourceBase (Join-Path $PWD "apps\admin\components") `
        -DestBase (Join-Path $PWD "app\admin\components") `
        -ExcludePatterns $excludePatterns
}

# Copy admin/hooks → app/admin/hooks
if (Test-Path "apps\admin\hooks") {
    Copy-DirectoryStructure `
        -SourceDir "apps\admin\hooks" `
        -DestDir "app\admin\hooks" `
        -SourceBase (Join-Path $PWD "apps\admin\hooks") `
        -DestBase (Join-Path $PWD "app\admin\hooks") `
        -ExcludePatterns $excludePatterns
}

# Copy admin/lib → app/admin/lib
if (Test-Path "apps\admin\lib") {
    Copy-DirectoryStructure `
        -SourceDir "apps\admin\lib" `
        -DestDir "app\admin\lib" `
        -SourceBase (Join-Path $PWD "apps\admin\lib") `
        -DestBase (Join-Path $PWD "app\admin\lib") `
        -ExcludePatterns $excludePatterns
}

# Copy admin API routes: apps/admin/app/api/* → app/api/*
if (Test-Path "apps\admin\app\api") {
    Copy-DirectoryStructure `
        -SourceDir "apps\admin\app\api" `
        -DestDir "app\api" `
        -SourceBase (Join-Path $PWD "apps\admin\app\api") `
        -DestBase (Join-Path $PWD "app\api") `
        -ExcludePatterns $excludePatterns
}

# ============================================
# CUSTOMER APP
# ============================================
Write-Host "`n=== CUSTOMER APP ===" -ForegroundColor Magenta

# Copy customer/app/* → app/* (root level)
if (Test-Path "apps\customer\app") {
    $customerFiles = Get-ChildItem -Path "apps\customer\app" -Recurse -File
    
    foreach ($file in $customerFiles) {
        $relativePath = $file.FullName -replace [regex]::Escape((Join-Path $PWD "apps\customer\app")), ""
        $relativePath = $relativePath.TrimStart('\', '/')
        $destPath = Join-Path (Join-Path $PWD "app") $relativePath
        
        # Skip excluded files
        $shouldExclude = $false
        foreach ($pattern in $excludePatterns) {
            if ($file.FullName -like $pattern) {
                $shouldExclude = $true
                break
            }
        }
        
        if ($shouldExclude) {
            continue
        }
        
        # Compare and copy
        $comparison = Compare-File -Source $file.FullName -Destination $destPath
        $stats.FilesCompared++
        
        if ($comparison -eq "Missing" -or $comparison -eq "Different" -or $null -eq $comparison) {
            Copy-FileWithAdjustments `
                -Source $file.FullName `
                -Destination $destPath `
                -SourceBase (Join-Path $PWD "apps\customer\app") `
                -DestBase (Join-Path $PWD "app")
            
            if ($comparison -eq "Different") {
                $stats.FilesUpdated++
            }
        }
    }
}

# ============================================
# DRIVER APP
# ============================================
Write-Host "`n=== DRIVER APP ===" -ForegroundColor Magenta

# Copy driver/app/driver/* → app/driver/*
if (Test-Path "apps\driver\app\driver") {
    Copy-DirectoryStructure `
        -SourceDir "apps\driver\app\driver" `
        -DestDir "app\driver" `
        -SourceBase (Join-Path $PWD "apps\driver\app\driver") `
        -DestBase (Join-Path $PWD "app\driver") `
        -ExcludePatterns $excludePatterns
}

# Copy driver API routes
if (Test-Path "apps\driver\app\api") {
    Copy-DirectoryStructure `
        -SourceDir "apps\driver\app\api" `
        -DestDir "app\api" `
        -SourceBase (Join-Path $PWD "apps\driver\app\api") `
        -DestBase (Join-Path $PWD "app\api") `
        -ExcludePatterns $excludePatterns
}

# ============================================
# VENDOR APP
# ============================================
Write-Host "`n=== VENDOR APP ===" -ForegroundColor Magenta

# Copy vendor/app/vendor/* → app/vendor/*
if (Test-Path "apps\vendor\app\vendor") {
    Copy-DirectoryStructure `
        -SourceDir "apps\vendor\app\vendor" `
        -DestDir "app\vendor" `
        -SourceBase (Join-Path $PWD "apps\vendor\app\vendor") `
        -DestBase (Join-Path $PWD "app\vendor") `
        -ExcludePatterns $excludePatterns
}

# Copy vendor API routes
if (Test-Path "apps\vendor\app\api") {
    Copy-DirectoryStructure `
        -SourceDir "apps\vendor\app\api" `
        -DestDir "app\api" `
        -SourceBase (Join-Path $PWD "apps\vendor\app\api") `
        -DestBase (Join-Path $PWD "app\api") `
        -ExcludePatterns $excludePatterns
}

# Copy vendor login page
if (Test-Path "apps\vendor\app\login") {
    Copy-DirectoryStructure `
        -SourceDir "apps\vendor\app\login" `
        -DestDir "app\vendor\login" `
        -SourceBase (Join-Path $PWD "apps\vendor\app\login") `
        -DestBase (Join-Path $PWD "app\vendor\login") `
        -ExcludePatterns $excludePatterns
}

# ============================================
# SUMMARY
# ============================================
Write-Host "`n=== SUMMARY ===" -ForegroundColor Green
Write-Host ""
Write-Host "Files compared: $($stats.FilesCompared)" -ForegroundColor Cyan
Write-Host "Files copied: $($stats.FilesCopied)" -ForegroundColor Green
Write-Host "Files updated: $($stats.FilesUpdated)" -ForegroundColor Yellow
Write-Host "Files skipped: $($stats.FilesSkipped)" -ForegroundColor Gray
Write-Host "Errors: $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "✅ Copy operation complete!" -ForegroundColor Green

