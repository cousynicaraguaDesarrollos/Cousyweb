param(
  [string]$Url = "https://cousynicaragua.com/",
  [string]$OutFile = "scripts/_home.html"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$html = (Invoke-WebRequest -Uri $Url -Headers @{ "User-Agent" = "Mozilla/5.0" }).Content
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutFile) | Out-Null
$html | Set-Content -Encoding UTF8 -Path $OutFile
Write-Host "Saved: $OutFile"

