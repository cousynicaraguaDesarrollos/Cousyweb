Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$paths = @(
  "public/assets/_cousy-download",
  "public/assets/_productos-download",
  "public/assets/_catalog-download",
  "public/assets/_tienda-download",
  "scripts/_productos.html",
  "scripts/_tienda.html"
)

foreach ($p in $paths) {
  if (-not (Test-Path -LiteralPath $p)) { continue }
  Write-Host "Remove: $p"
  Remove-Item -Force -Recurse -LiteralPath $p
}

Write-Host "OK: limpieza completada."

