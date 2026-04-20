param(
  [string]$PageUrl = "https://cousynicaragua.com/productos-promocionales-ecologicos",
  [string]$OutDir = "public/assets/products",
  [int]$DelayMs = 75
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$html = (Invoke-WebRequest -Uri $PageUrl -Headers @{ "User-Agent" = "Mozilla/5.0 (compatible; CousyEcommerceDownloader/1.0)" }).Content

$pattern = "https://cdn\.zyrosite\.com/cdn-ecommerce/store_[A-Za-z0-9]+/assets/[a-f0-9-]+\.(?:png|jpe?g|webp)"
$matches = [regex]::Matches($html, $pattern, "IgnoreCase") | ForEach-Object { $_.Value }
$urls = $matches | Select-Object -Unique

if (-not $urls -or $urls.Count -eq 0) {
  Write-Host "No se encontraron assets ecommerce en: $PageUrl"
  exit 0
}

$manifest = @()
$i = 0
foreach ($u in $urls) {
  $i++
  $fileName = [IO.Path]::GetFileName(([Uri]$u).AbsolutePath)
  $dest = Join-Path $OutDir $fileName

  if (Test-Path -LiteralPath $dest) {
    $manifest += [pscustomobject]@{ url = $u; file = $dest; skipped = $true }
    continue
  }

  Write-Host "[$i/$($urls.Count)] $fileName"
  Invoke-WebRequest -Uri $u -Headers @{ "User-Agent" = "Mozilla/5.0 (compatible; CousyEcommerceDownloader/1.0)" } -OutFile $dest
  $manifest += [pscustomobject]@{ url = $u; file = $dest; skipped = $false }
  Start-Sleep -Milliseconds $DelayMs
}

$manifestPath = Join-Path $OutDir "manifest.json"
($manifest | ConvertTo-Json -Depth 4) | Set-Content -Encoding UTF8 -Path $manifestPath

Write-Host ""
Write-Host "Listo. Descargados: $($urls.Count)"
Write-Host "OutDir: $OutDir"
Write-Host "Manifest: $manifestPath"

