param(
  [string]$Dir = "public/assets/cousy"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Dir)) {
  Write-Host "No existe: $Dir"
  exit 0
}

Get-ChildItem -Force -LiteralPath $Dir | ForEach-Object {
  Remove-Item -Force -Recurse -LiteralPath $_.FullName
}

Write-Host "Listo. Carpeta limpiada: $Dir"

