# Start Next and Expo dev servers in background PowerShell processes and capture logs.
# Usage: From repo root run: .\scripts\capture-dev-logs.ps1
# Disable specific ScriptAnalyzer rule that flags switch parameters with explicit defaults
# (we intentionally avoid setting defaults for switches and add explicit Parameter attributes).
# PSScriptAnalyzerDisableRule: PSAvoidDefaultValueSwitchParameter

[CmdletBinding()]
Param(
    [Parameter(Mandatory=$false)] [int] $WaitSeconds = 120,
    [Parameter(Mandatory=$false)] [switch] $StartNext,
    [Parameter(Mandatory=$false)] [switch] $StartExpo,
    [Parameter(Mandatory=$false)] [string] $ExpoCmd = 'npm run web'
)

function Start-BackgroundProcess($workDir, $command, $outFile) {
    Write-Host "Starting: $command (cwd: $workDir) -> $outFile"
    $psCommand = "Set-Location '$workDir'; $command *> `"$outFile`" 2>&1"
    Start-Process -FilePath powershell -ArgumentList @('-NoProfile','-NoExit','-Command',$psCommand) -WindowStyle Hidden | Out-Null
}

function Wait-ForLog($path, [string[]] $markers, $timeoutSec) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $timeoutSec) {
        if (Test-Path $path) {
            $content = Get-Content $path -Raw -ErrorAction SilentlyContinue
            foreach ($m in $markers) {
                if ($content -and $content.IndexOf($m, [System.StringComparison]::InvariantCultureIgnoreCase) -ge 0) {
                    return $true
                }
            }
        }
        Start-Sleep -Seconds 1
    }
    return $false
}

try {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $repoRoot = Split-Path -Parent $scriptDir
    Set-Location $repoRoot

    $nextLog = Join-Path $repoRoot 'next-dev.log'
    $expoLog = Join-Path $repoRoot 'expo-web.log'

    if ($StartNext) {
        Start-BackgroundProcess $repoRoot 'npm run dev' $nextLog
    }

    if ($StartExpo) {
        $expoDir = Join-Path $repoRoot 'mobile-apps\customer-app'
        Start-BackgroundProcess $expoDir $ExpoCmd $expoLog
    }

    Write-Host "Waiting up to $WaitSeconds seconds for servers to become ready..."

    $nextReady = $false
    $expoReady = $false

    if ($StartNext) {
        $nextReady = Wait-ForLog $nextLog @('ready','local:','localhost','started') $WaitSeconds
        $nextColor = 'Yellow'
        if ($nextReady) { $nextColor = 'Green' }
        Write-Host "Next ready: $nextReady" -ForegroundColor $nextColor
    }

    if ($StartExpo) {
        $expoReady = Wait-ForLog $expoLog @('web is waiting on','project started','Metro Bundler','compiled') $WaitSeconds
        $expoColor = 'Yellow'
        if ($expoReady) { $expoColor = 'Green' }
        Write-Host "Expo ready: $expoReady" -ForegroundColor $expoColor
    }

    Write-Host "`n--- next-dev.log (first 300 lines) ---"
    if (Test-Path $nextLog) { Get-Content $nextLog -TotalCount 300 | ForEach-Object { Write-Output $_ } } else { Write-Output "(no $nextLog found)" }

    Write-Host "`n--- expo-web.log (first 300 lines) ---"
    if (Test-Path $expoLog) { Get-Content $expoLog -TotalCount 300 | ForEach-Object { Write-Output $_ } } else { Write-Output "(no $expoLog found)" }

    Write-Host "`nLogs written to: $nextLog and $expoLog"
    Write-Host "If you want to tail logs interactively, run: Get-Content .\next-dev.log -Wait -Tail 50"

} catch {
    Write-Error "Error during script execution: $_"
}
