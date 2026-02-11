# Stop any running AlBaz Vendor app so dist\win-unpacked\*.exe is not locked during build
$names = @('AlBazVendor', 'AlBaz Vendor', 'electron')
foreach ($n in $names) {
  Get-Process -Name $n -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
