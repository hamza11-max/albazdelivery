# Kill process using port 3001
param(
    [int]$Port = 3001
)

Write-Host "🔍 Checking for processes on port $Port..."

$connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    
    if ($process) {
        Write-Host "📌 Found process: $($process.ProcessName) (PID: $processId)"
        Write-Host "🛑 Killing process..."
        Stop-Process -Id $processId -Force
        Start-Sleep -Seconds 1
        Write-Host "✅ Process killed! Port $Port is now free."
    } else {
        Write-Host "⚠️  Process ID $processId not found (may have already exited)"
    }
} else {
    Write-Host "✅ Port $Port is already free!"
}

