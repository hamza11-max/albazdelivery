# PowerShell equivalent to update packages pinned to "latest" using npm-check-updates
param()

Write-Output "Running npm-check-updates to pin 'latest' deps across workspace"

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Error "npx not found. Install Node.js/npm to proceed."
    exit 1
}

Write-Output "Updating root package.json"
npx npm-check-updates '/.*/' -u --packageFile package.json

# Update workspace package.json files
$pkgFiles = git ls-files -- 'packages/*/package.json' 'apps/*/package.json' '*/*/package.json' 2>$null
foreach ($f in $pkgFiles) {
    Write-Output "Updating $f"
    npx npm-check-updates -u --packageFile $f
}

Write-Output "Installing to regenerate lockfile"
npm install
Write-Output "Done. Review changes and run tests before merging."
