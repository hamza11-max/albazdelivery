# Download Node.js Windows x64 for Electron bundle (run before electron-builder on Windows)
# Root = app dir (apps/vendor) so electron-builder "from: build/node" finds it
$ErrorActionPreference = "Stop"
$NodeVersion = "v20.18.0"
$Root = Split-Path -Parent $PSScriptRoot
$BuildNode = Join-Path $Root "build\node"
$ZipPath = Join-Path $Root "build\node.zip"
$Url = "https://nodejs.org/dist/$NodeVersion/node-$NodeVersion-win-x64.zip"

if (Test-Path (Join-Path $BuildNode "node.exe")) {
  Write-Host "[download-node-win] build/node/node.exe already exists, skipping."
  exit 0
}

New-Item -ItemType Directory -Force -Path $BuildNode | Out-Null
Write-Host "[download-node-win] Downloading Node.js $NodeVersion for Windows x64..."
Invoke-WebRequest -Uri $Url -OutFile $ZipPath -UseBasicParsing
Expand-Archive -Path $ZipPath -DestinationPath (Join-Path $Root "build") -Force
$Extracted = Join-Path $Root "build\node-$NodeVersion-win-x64"
Copy-Item (Join-Path $Extracted "node.exe") (Join-Path $BuildNode "node.exe") -Force
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
Remove-Item $Extracted -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[download-node-win] Done. node.exe at $BuildNode\node.exe"
