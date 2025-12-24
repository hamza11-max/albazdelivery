Write-Output "Killing common dev processes and attempting to remove locks"

$names = @('node','node.exe','npm','npm.exe','npx','npx.exe','ts-node','ts-node.exe','tsx','tsx.exe','playwright','playwright.exe','electron','electron.exe')
foreach ($n in $names) {
    $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        try {
            Write-Output ("Stopping process: {0} (Id={1})" -f $p.ProcessName, $p.Id)
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        } catch {
            Write-Output ("Failed stopping process {0}: {1}" -f $p.Id, $_.Exception.Message)
        }
    }
}

Start-Sleep -Milliseconds 500

$p = 'E:\nn\albazdelivery\node_modules\\.prisma\\client\\query_engine-windows.dll.node'
if (Test-Path $p) {
    Write-Output 'Taking ownership and granting permissions for prisma engine file'
    try { takeown /f $p /a | Out-Null } catch {}
    try { icacls $p /grant 'Everyone:F' /C | Out-Null } catch {}
    try { Remove-Item -LiteralPath $p -Force -ErrorAction Stop; Write-Output 'Removed prisma query engine file' } catch { Write-Output ("Failed to remove prisma file: {0}" -f $_.Exception.Message) }
} else {
    Write-Output 'Prisma file not found'
}

try {
    Write-Output 'Attempting to remove node_modules folder'
    Remove-Item -LiteralPath 'E:\nn\albazdelivery\node_modules' -Recurse -Force -ErrorAction Stop
    Write-Output 'Removed node_modules'
} catch {
    Write-Output ("Could not remove node_modules: {0}" -f $_.Exception.Message)
}

Write-Output 'Running npm ci with ELECTRON_SKIP_BINARY_DOWNLOAD=1'
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
cd 'E:\nn\albazdelivery'
npm ci --no-optional --loglevel warn
Write-Output ('npm ci exit code: {0}' -f $LASTEXITCODE)
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Output 'Running npm test'
npm test
Write-Output ('npm test exit code: {0}' -f $LASTEXITCODE)
exit $LASTEXITCODE
