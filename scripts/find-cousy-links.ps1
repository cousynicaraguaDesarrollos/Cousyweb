param(
  [string]$Url = "https://cousynicaragua.com/"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$html = (Invoke-WebRequest -Uri $Url -Headers @{ "User-Agent" = "Mozilla/5.0" }).Content

$hrefs = [regex]::Matches($html, "href\s*=\s*['""]([^'""]+)['""]", "IgnoreCase") | ForEach-Object {
  $_.Groups[1].Value
}

$filtered = $hrefs | Where-Object { $_ -match "(?i)tienda|shop|store|producto|catalogo|coleccion" } | Select-Object -Unique
$filtered | ForEach-Object { $_ }

