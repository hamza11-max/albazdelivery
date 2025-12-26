# Unlock and install helper for Windows
# Stops electron, takes ownership of locked files, removes them, runs npm ci and npm test

Write-Output "Starting unlock-and-install script"

# Stop electron processes if running
Try {
    Stop-Process -Name electron -Force -ErrorAction SilentlyContinue
    Stop-Process -Name electron.exe -Force -ErrorAction SilentlyContinue
    Write-Output "Stopped electron processes (if any)."
} Catch {
    Write-Output "Error stopping electron: $($_.Exception.Message)"
}

Start-Sleep -Milliseconds 500

$targets = @(
    'E:\nn\albazdelivery\node_modules\electron\dist',
    'E:\nn\albazdelivery\node_modules\.prisma\client\query_engine-windows.dll.node',
    'E:\nn\albazdelivery\node_modules'
)

foreach ($t in $targets) {
    if (Test-Path $t) {
        Write-Output "Attempting to remove: $t"
        Try {
            # Try standard remove first
            Remove-Item -LiteralPath $t -Recurse -Force -ErrorAction Stop
            Write-Output ("Removed: {0}" -f $t)
        } Catch {
            Write-Output ("Remove failed for {0}: {1}" -f $($t), $($_.Exception.Message))
            # Attempt to take ownership and set permissions then remove
            Try {
                Write-Output ("Attempting takeown and icacls on {0}" -f $($t))
                takeown /f "$($t)" /a 2>$null | Out-Null
            } Catch {}
            Try {
                icacls "$($t)" /grant "Everyone:F" /C 2>$null | Out-Null
            } Catch {}
            Try {
                Remove-Item -LiteralPath $t -Recurse -Force -ErrorAction Stop
                Write-Output ("Removed after permission change: {0}" -f $t)
            } Catch {
                Write-Output ("Still could not remove {0}: {1}" -f $($t), $($_.Exception.Message))
            }
        }
    } else {
        Write-Output "Not found: $($t)"
    }
}

# Set environment variable to skip electron binary download
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
Write-Output "Set ELECTRON_SKIP_BINARY_DOWNLOAD=1"

# Run npm ci
Write-Output "Running npm ci --no-optional --loglevel warn"
npm ci --no-optional --loglevel warn
$ciExit = $LASTEXITCODE
Write-Output "npm ci exit code: $ciExit"
if ($ciExit -ne 0) {
    Write-Output "npm ci failed with code $ciExit"
    exit $ciExit
}

# Run tests
Write-Output "Running npm test"
npm test
$testExit = $LASTEXITCODE
Write-Output "npm test exit code: $testExit"
exit $testExit
