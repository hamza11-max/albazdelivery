# Push Phase 3 Changes to GitHub
# Run this script from the repository root: E:\nn\albazdelivery

Write-Host "=== Pushing Phase 3 Changes to GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in git repository root!" -ForegroundColor Red
    Write-Host "Please run from: E:\nn\albazdelivery" -ForegroundColor Yellow
    exit 1
}

# Show current status
Write-Host "Current branch:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

# Check for uncommitted changes
Write-Host "Checking for uncommitted changes..." -ForegroundColor Yellow
$uncommitted = git diff --name-only
$untracked = git ls-files --others --exclude-standard

if ($uncommitted -or $untracked) {
    Write-Host "⚠️  Found uncommitted changes:" -ForegroundColor Yellow
    if ($uncommitted) {
        Write-Host "Modified files:" -ForegroundColor Yellow
        $uncommitted | ForEach-Object { Write-Host "  - $_" }
    }
    if ($untracked) {
        Write-Host "Untracked files:" -ForegroundColor Yellow
        $untracked | ForEach-Object { Write-Host "  - $_" }
    }
    Write-Host ""
    $add = Read-Host "Add and commit these changes? (y/n)"
    if ($add -eq "y" -or $add -eq "Y") {
        git add .
        $message = Read-Host "Commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($message)) {
            $message = "Add Phase 3: Analytics Dashboard and Export functionality"
        }
        git commit -m $message
        Write-Host "✅ Changes committed!" -ForegroundColor Green
    }
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Pull on other machines: git pull origin main" -ForegroundColor White
    Write-Host "2. Restart dev server to see changes" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Push failed! Check the error above." -ForegroundColor Red
}

