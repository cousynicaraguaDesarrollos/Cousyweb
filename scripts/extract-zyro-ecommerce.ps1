param(
  [string]$Path = "scripts/_productos.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$raw = Get-Content -Raw -Path $Path

$storeId = ([regex]::Match($raw, "store_[A-Za-z0-9]+")).Value
if ($storeId) {
  Write-Host "storeId=$storeId"
} else {
  Write-Host "storeId=(no encontrado)"
}

$urls = [regex]::Matches($raw, "https?://[^'\""<>\s]+") | ForEach-Object { $_.Value }
$interesting = $urls | Where-Object { $_ -match "(?i)ecommerce|store|api|graphql|zyro" } | Select-Object -Unique

Write-Host ""
Write-Host "URLs interesantes:"
$interesting | ForEach-Object { $_ }

