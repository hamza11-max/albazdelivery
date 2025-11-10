# Enhanced database connection test script
# Tests multiple connection methods and provides detailed diagnostics

Write-Host "=== Database Connection Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envFile = ".env"
if (Test-Path ".env.local") {
    $envFile = ".env.local"
}

if (Test-Path $envFile) {
    Write-Host "Loading environment from: $envFile" -ForegroundColor Gray
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ No .env file found!" -ForegroundColor Red
    exit 1
}

$directUrl = $env:DIRECT_URL
$databaseUrl = $env:DATABASE_URL

if (-not $directUrl -and -not $databaseUrl) {
    Write-Host "❌ No database URL found in environment variables" -ForegroundColor Red
    Write-Host "   Looking for: DIRECT_URL or DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

$testUrl = $directUrl
if (-not $testUrl) {
    $testUrl = $databaseUrl
}

Write-Host "Testing connection URL: $($testUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Gray
Write-Host ""

# Parse connection string
try {
    $urlParts = $testUrl -split '@'
    if ($urlParts.Length -lt 2) {
        throw "Invalid URL format"
    }
    $hostPart = $urlParts[1]
    $hostParts = $hostPart -split ':'
    $hostName = $hostParts[0]
    
    # Extract port (could be in format host:port/path or host:port?params)
    if ($hostParts.Length -gt 1) {
        $portPart = $hostParts[1]
        $portParts = $portPart -split '/'
        $portWithParams = $portParts[0]
        $portParts2 = $portWithParams -split '\?'
        $port = $portParts2[0]
    } else {
        $port = "5432" # Default PostgreSQL port
    }
    
    Write-Host "Host: $hostName" -ForegroundColor Cyan
    Write-Host "Port: $port" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Host "❌ Failed to parse connection URL: $_" -ForegroundColor Red
    exit 1
}

# Test 1: Network connectivity
Write-Host "Test 1: Network Connectivity" -ForegroundColor Yellow
    Write-Host "  Testing connection to ${hostName}:${port}..." -ForegroundColor Gray
try {
    $connection = Test-NetConnection -ComputerName $hostName -Port $port -WarningAction SilentlyContinue -ErrorAction Stop
    if ($connection.TcpTestSucceeded) {
        Write-Host "  ✅ Network connection successful!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Cannot reach database server" -ForegroundColor Red
        Write-Host "  Possible issues:" -ForegroundColor Yellow
        Write-Host "    - Firewall blocking connection" -ForegroundColor Red
        Write-Host "    - Database server is down" -ForegroundColor Red
        Write-Host "    - Incorrect hostname or port" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "  ❌ Connection test failed: $_" -ForegroundColor Red
    Write-Host "  This might be normal if the hostname is not directly accessible" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: DNS resolution
Write-Host "Test 2: DNS Resolution" -ForegroundColor Yellow
try {
    $dnsResult = Resolve-DnsName -Name $hostName -ErrorAction Stop
    Write-Host "  ✅ DNS resolution successful" -ForegroundColor Green
    Write-Host "  IP Address(es): $($dnsResult | ForEach-Object { $_.IPAddress } | Join-String -Separator ', ')" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  DNS resolution failed: $_" -ForegroundColor Yellow
    Write-Host "  This might indicate a network issue" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Prisma connection test
Write-Host "Test 3: Prisma Connection Test" -ForegroundColor Yellow
Write-Host "  Testing with Prisma..." -ForegroundColor Gray
try {
    # Try to use Prisma to test connection
    $prismaTest = npx prisma db execute --stdin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Prisma connection successful!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Prisma connection failed" -ForegroundColor Red
        Write-Host "  Output: $prismaTest" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️  Could not test with Prisma: $_" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Supabase-specific checks
Write-Host "Test 4: Supabase-Specific Checks" -ForegroundColor Yellow
if ($hostName -match "supabase\.co") {
    Write-Host "  Detected Supabase database" -ForegroundColor Gray
    Write-Host "  ✅ Using correct Supabase hostname format" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Important Supabase checks:" -ForegroundColor Cyan
    Write-Host "    1. Go to https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "    2. Check if your project is ACTIVE (not paused)" -ForegroundColor White
    Write-Host "    3. If paused, click 'Restore' to activate it" -ForegroundColor White
    Write-Host "    4. Wait 1-2 minutes for project to become active" -ForegroundColor White
    Write-Host "    5. Check Settings > Database for connection string" -ForegroundColor White
    Write-Host ""
    Write-Host "  Common Supabase issues:" -ForegroundColor Yellow
    Write-Host "    - Project is paused (free tier auto-pauses after inactivity)" -ForegroundColor Red
    Write-Host "    - Connection string uses wrong port (5432 for direct, 6543 for pooled)" -ForegroundColor Red
    Write-Host "    - Missing SSL parameters (should include ?sslmode=require)" -ForegroundColor Red
    Write-Host "    - IP address not whitelisted (check firewall settings)" -ForegroundColor Red
} else {
    Write-Host "  Not a Supabase database, skipping Supabase-specific checks" -ForegroundColor Gray
}

Write-Host ""

# Test 5: Connection string validation
Write-Host "Test 5: Connection String Validation" -ForegroundColor Yellow
$issues = @()

if (-not $testUrl -match "sslmode") {
    $issues += "Missing SSL mode parameter (should include ?sslmode=require)"
}

if ($testUrl -match ":6543" -and -not $testUrl -match "pgbouncer") {
    $issues += "Port 6543 detected but pgbouncer parameter missing"
}

if ($testUrl -match "localhost" -and $hostName -match "supabase") {
    $issues += "Connection string might be incorrect (localhost vs Supabase hostname)"
}

if ($issues.Count -eq 0) {
    Write-Host "  ✅ Connection string format looks correct" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Potential issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "    - $issue" -ForegroundColor Red
    }
}

Write-Host ""

# Summary and recommendations
Write-Host "=== Summary and Recommendations ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify Supabase project is active in dashboard" -ForegroundColor White
Write-Host "  2. Check connection string format in .env file" -ForegroundColor White
Write-Host "  3. Try using db push instead of migrate:" -ForegroundColor White
Write-Host "     npx prisma db push" -ForegroundColor Cyan
Write-Host "  4. Check Supabase project logs for errors" -ForegroundColor White
Write-Host "  5. Verify database credentials are correct" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Use pooled connection for testing" -ForegroundColor Yellow
Write-Host "  Update DATABASE_URL to use port 6543 with pgbouncer=true" -ForegroundColor White
Write-Host ""

