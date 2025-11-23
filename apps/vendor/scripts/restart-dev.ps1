# Restart development server with clean cache
Write-Host "Restarting Electron dev server..." -ForegroundColor Cyan

# Kill any process on port 3001
Write-Host "Checking port 3001..." -ForegroundColor Yellow
$connection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($connection) {
    $processId = $connection.OwningProcess
    Write-Host "Killing process on port 3001 (PID: $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Clear Next.js cache
Write-Host "Clearing .next cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "Cache cleared" -ForegroundColor Green
} else {
    Write-Host "No cache to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Ready to restart!" -ForegroundColor Green
Write-Host "Run: npm run electron:dev" -ForegroundColor Cyan

