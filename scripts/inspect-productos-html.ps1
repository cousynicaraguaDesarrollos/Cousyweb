param(
  [string]$Path = "scripts/_productos.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Path)) {
  Write-Host "No existe: $Path"
  exit 1
}

$patterns = @(
  "store_",
  "ecommerceStoreId",
  "product",
  "/api",
  "graphql",
  "zyro",
  "ecommerce"
)

foreach ($p in $patterns) {
  $m = Select-String -Path $Path -Pattern $p -SimpleMatch -List
  if ($m) {
    Write-Host "MATCH: $p"
    Write-Host $m.Line
    Write-Host ""
  }
}

