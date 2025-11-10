# Test database connection script
# This script tests if your Supabase database is reachable

Write-Host "Testing database connection..." -ForegroundColor Yellow
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$directUrl = $env:DIRECT_URL
if (-not $directUrl) {
    Write-Host "❌ DIRECT_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Connection URL: $($directUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
Write-Host ""

# Try to connect using Test-NetConnection (Windows)
$urlParts = $directUrl -split '@'
$hostPart = $urlParts[1]
$hostParts = $hostPart -split ':'
$hostName = $hostParts[0]
$port = ($hostParts[1] -split '/')[0]

Write-Host "Testing connection to: $hostName:$port" -ForegroundColor Cyan

try {
    $connection = Test-NetConnection -ComputerName $hostName -Port $port -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "✅ Network connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Check if your Supabase project is active (not paused)" -ForegroundColor Cyan
        Write-Host "  2. Verify database credentials in Supabase dashboard" -ForegroundColor Cyan
        Write-Host "  3. Check if your IP is allowed in Supabase firewall settings" -ForegroundColor Cyan
        Write-Host "  4. Try running: npx prisma migrate dev --name init" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Cannot reach database server" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible issues:" -ForegroundColor Yellow
        Write-Host "  - Supabase project is paused (check Supabase dashboard)" -ForegroundColor Red
        Write-Host "  - Firewall blocking the connection" -ForegroundColor Red
        Write-Host "  - Incorrect hostname or port" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Connection test failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "To check Supabase project status:" -ForegroundColor Yellow
Write-Host "  1. Go to https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "  2. Select your project" -ForegroundColor Cyan
Write-Host "  3. Check if project is 'Active' (not 'Paused')" -ForegroundColor Cyan
Write-Host "  4. If paused, click 'Restore' to activate it" -ForegroundColor Cyan

