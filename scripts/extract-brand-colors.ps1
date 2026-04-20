param(
  [string]$Url = "https://cousynicaragua.com/",
  [string]$OutFile = "scripts/brand-colors.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-UrlText {
  param([Parameter(Mandatory = $true)][string]$Target)
  $res = Invoke-WebRequest -Uri $Target -Headers @{ "User-Agent" = "Mozilla/5.0 (compatible; CousyColorExtractor/1.0)" }
  return [string]$res.Content
}

function Get-AbsoluteUrl {
  param([Parameter(Mandatory = $true)][string]$PageUrl, [Parameter(Mandatory = $true)][string]$Ref)
  $baseUri = [Uri]::new($PageUrl)
  return ([Uri]::new($baseUri, $Ref)).AbsoluteUri
}

$html = Read-UrlText -Target $Url

$styles = New-Object System.Collections.Generic.List[string]

$styleTags = [regex]::Matches($html, "<style[^>]*>([\s\S]*?)</style>", "IgnoreCase")
foreach ($m in $styleTags) { $styles.Add($m.Groups[1].Value) }

$cssLinks = [regex]::Matches($html, "<link[^>]+rel\s*=\s*['""]stylesheet['""][^>]+href\s*=\s*['""]([^'""]+)['""]", "IgnoreCase")
foreach ($m in $cssLinks) {
  $href = $m.Groups[1].Value
  if (-not $href) { continue }
  $abs = if ($href -match "^https?://") { $href } else { Get-AbsoluteUrl -PageUrl $Url -Ref $href }
  try {
    $styles.Add((Read-UrlText -Target $abs))
  } catch {
    continue
  }
}

$text = ($styles -join "`n")
$hex = [regex]::Matches($text, "#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b")
$rgb = [regex]::Matches($text, "rgba?\([^)]+\)")

$counts = @{}
foreach ($m in $hex) {
  $c = $m.Value.ToLowerInvariant()
  if (-not $counts.ContainsKey($c)) { $counts[$c] = 0 }
  $counts[$c]++
}
foreach ($m in $rgb) {
  $c = $m.Value.ToLowerInvariant()
  if (-not $counts.ContainsKey($c)) { $counts[$c] = 0 }
  $counts[$c]++
}

$top = $counts.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 60
$result = [pscustomobject]@{
  url = $Url
  extractedAt = (Get-Date).ToString("o")
  topColors = @($top | ForEach-Object { [pscustomobject]@{ color = $_.Key; count = $_.Value } })
}

$json = $result | ConvertTo-Json -Depth 6
$dir = Split-Path -Parent $OutFile
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$json | Set-Content -Encoding UTF8 -Path $OutFile

Write-Host "Listo. Archivo generado: $OutFile"

