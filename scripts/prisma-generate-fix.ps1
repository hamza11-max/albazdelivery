# Fix EPERM on Prisma generate: remove .prisma and regenerate.
# Run from repo root. If EPERM persists, close Cursor and run PowerShell "As Administrator".
# Optional: -KillNode stops all Node processes first (use if a dev server holds the DLL).

param([switch]$KillNode)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path "$root\prisma\schema.prisma")) { $root = $PSScriptRoot }
Set-Location $root

if ($KillNode) {
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

$prismaDir = "$root\node_modules\.prisma"
if (Test-Path $prismaDir) {
    Remove-Item -Recurse -Force $prismaDir
    Write-Host "Removed $prismaDir"
}

& npx prisma generate --schema=./prisma/schema.prisma
Write-Host "Prisma generate completed."
