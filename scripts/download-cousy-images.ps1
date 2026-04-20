param(
  [string]$BaseUrl = "https://cousynicaragua.com/",
  [string]$SitemapUrl = "",
  [string]$OutDir = "public/assets/cousy",
  [int]$MaxPages = 500,
  [int]$DelayMs = 75,
  [switch]$DebugOutput
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-AbsoluteUrl {
  param(
    [Parameter(Mandatory = $true)][string]$PageUrl,
    [Parameter(Mandatory = $true)][string]$Ref
  )

  try {
    $baseUri = [Uri]::new($PageUrl)
    return ([Uri]::new($baseUri, $Ref)).AbsoluteUri
  } catch {
    return $null
  }
}

function Get-SitemapCandidates {
  param([string]$SiteBase)
  $trimmed = $SiteBase.TrimEnd("/")
  return @(
    "$trimmed/sitemap.xml",
    "$trimmed/sitemap_index.xml"
  )
}

function Read-UrlText {
  param([Parameter(Mandatory = $true)][string]$Url)
  $res = Invoke-WebRequest -Uri $Url -Headers @{ "User-Agent" = "Mozilla/5.0 (compatible; CousyImageDownloader/1.0)" }
  return [string]$res.Content
}

function Get-UrlsFromSitemapXml {
  param([Parameter(Mandatory = $true)][string]$XmlText)
  $xml = [xml]$XmlText
  $urls = New-Object System.Collections.Generic.List[string]

  if ($xml.urlset -and $xml.urlset.url) {
    foreach ($u in $xml.urlset.url) {
      if ($u.loc) { $urls.Add([string]$u.loc) }
    }
  }

  if ($xml.sitemapindex -and $xml.sitemapindex.sitemap) {
    foreach ($sm in $xml.sitemapindex.sitemap) {
      if (-not $sm.loc) { continue }
      try {
        $child = Read-UrlText -Url ([string]$sm.loc)
        foreach ($childUrl in (Get-UrlsFromSitemapXml -XmlText $child)) { $urls.Add($childUrl) }
      } catch {
        continue
      }
    }
  }

  return $urls | Select-Object -Unique
}

function Extract-ImageUrlsFromHtml {
  param(
    [Parameter(Mandatory = $true)][string]$PageUrl,
    [Parameter(Mandatory = $true)][string]$Html
  )

  $found = New-Object System.Collections.Generic.HashSet[string]

  $imgSrc = [regex]::Matches($Html, "<img[^>]+src\s*=\s*['""]([^'""]+)['""]", "IgnoreCase")
  foreach ($m in $imgSrc) { [void]$found.Add($m.Groups[1].Value) }

  $dataSrc = [regex]::Matches($Html, "<img[^>]+data-(?:src|lazy-src)\s*=\s*['""]([^'""]+)['""]", "IgnoreCase")
  foreach ($m in $dataSrc) { [void]$found.Add($m.Groups[1].Value) }

  $ogImg = [regex]::Matches(
    $Html,
    "<meta(?=[^>]+property\s*=\s*['""]og:image['""])(?=[^>]+content\s*=\s*['""]([^'""]+)['""])[^>]*>",
    "IgnoreCase"
  )
  foreach ($m in $ogImg) { [void]$found.Add($m.Groups[1].Value) }

  $icons = [regex]::Matches(
    $Html,
    "<link(?=[^>]+rel\s*=\s*['""][^'""]*icon[^'""]*['""])(?=[^>]+href\s*=\s*['""]([^'""]+)['""])[^>]*>",
    "IgnoreCase"
  )
  foreach ($m in $icons) { [void]$found.Add($m.Groups[1].Value) }

  $anyHttpImages = [regex]::Matches(
    $Html,
    "https?://[^\s'""<>]+?\.(?:png|jpe?g|webp|svg|gif)(?:\?[^\s'""<>]+)?",
    "IgnoreCase"
  )
  foreach ($m in $anyHttpImages) { [void]$found.Add($m.Value) }

  $absolute = New-Object System.Collections.Generic.HashSet[string]
  foreach ($ref in $found) {
    if ($ref -match "^\s*data:") { continue }
    if ($ref -match "^\s*javascript:") { continue }
    $abs = if ($ref -match "^\s*https?://") { $ref.Trim() } else { Get-AbsoluteUrl -PageUrl $PageUrl -Ref $ref.Trim() }
    if (-not $abs) { continue }
    if ($abs -notmatch "\.(?:png|jpe?g|webp|svg|gif)(?:\?|$)") { continue }
    [void]$absolute.Add($abs)
  }

  return $absolute
}

function Safe-FileNameFromUrl {
  param([Parameter(Mandatory = $true)][string]$Url)
  $u = [Uri]::new($Url)
  $path = $u.AbsolutePath
  if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") { $path = "/index" }
  $name = $path.Trim("/").Replace("/", "_")
  $name = [regex]::Replace($name, "[^\w\.\-]+", "_")
  if (-not ($name -match "\.[a-zA-Z0-9]{2,5}$")) { $name = "$name.bin" }
  return $name
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$sitemapTargets = @()
if ($SitemapUrl) {
  $sitemapTargets = @($SitemapUrl)
} else {
  $sitemapTargets = Get-SitemapCandidates -SiteBase $BaseUrl
}

$pageUrls = @()
foreach ($sm in $sitemapTargets) {
  try {
    $xmlText = Read-UrlText -Url $sm
    $pageUrls = Get-UrlsFromSitemapXml -XmlText $xmlText
    if ($pageUrls.Count -gt 0) { break }
  } catch {
    continue
  }
}

if (-not $pageUrls -or $pageUrls.Count -eq 0) {
  $pageUrls = @($BaseUrl)
}

$pageUrls = $pageUrls | Select-Object -First $MaxPages

$allowedHosts = @(
  "cousynicaragua.com",
  "www.cousynicaragua.com",
  "assets.zyrosite.com"
)

$images = New-Object System.Collections.Generic.HashSet[string]
$debugAdded = 0
$debugLoop = 0
foreach ($p in $pageUrls) {
  try {
    Write-Host "Leyendo: $p"
    $html = Read-UrlText -Url $p
    $pageImages = @(Extract-ImageUrlsFromHtml -PageUrl $p -Html $html)
    if ($DebugOutput) {
      Write-Host "  pageImagesType=$($pageImages.GetType().FullName)"
      Write-Host "  Referencias (sin filtrar): $($pageImages.Count)"
      if ($pageImages.Count -gt 0) {
        Write-Host "  firstType=$($pageImages[0].GetType().FullName)"
      }
      $sample = @($pageImages | Select-Object -First 6)
      foreach ($s in $sample) { Write-Host "  - $s" }
      foreach ($s in $sample) {
        try {
          $h = ([Uri]::new($s)).Host.ToLowerInvariant()
          $ok = $allowedHosts -contains $h
          Write-Host "    host=$h allowed=$ok"
        } catch {
          Write-Host "    host=(invalid)"
        }
      }
    }
    foreach ($img in $pageImages) {
      try {
        if ($DebugOutput -and $debugLoop -lt 6) {
          Write-Host "  loop raw=$img"
        }
        $imgHost = ([Uri]::new($img)).Host.ToLowerInvariant()
        if ($DebugOutput -and $debugLoop -lt 6) {
          $debugLoop++
          Write-Host "  loop host=$imgHost"
        }
        if ($allowedHosts -contains $imgHost) {
          $added = $images.Add([string]$img)
          if ($DebugOutput -and $debugAdded -lt 10) {
            $debugAdded++
            Write-Host "  add=$added count=$($images.Count) url=$img"
          }
        }
      } catch {
        if ($DebugOutput -and $debugLoop -lt 6) {
          $debugLoop++
          Write-Host "  loop error=$($_.Exception.Message)"
        }
        continue
      }
    }
    Start-Sleep -Milliseconds $DelayMs
  } catch {
    continue
  }
}

$manifest = @()
$i = 0
foreach ($imgUrl in ($images | Sort-Object)) {
  $i++
  $file = Safe-FileNameFromUrl -Url $imgUrl
  $dest = Join-Path $OutDir $file

  if (Test-Path -LiteralPath $dest) {
    $manifest += [pscustomobject]@{ url = $imgUrl; file = $dest; skipped = $true }
    continue
  }

  try {
    Write-Host "[$i/$($images.Count)] Descargando: $imgUrl"
    Invoke-WebRequest -Uri $imgUrl -Headers @{ "User-Agent" = "Mozilla/5.0 (compatible; CousyImageDownloader/1.0)" } -OutFile $dest
    $manifest += [pscustomobject]@{ url = $imgUrl; file = $dest; skipped = $false }
    Start-Sleep -Milliseconds $DelayMs
  } catch {
    $manifest += [pscustomobject]@{ url = $imgUrl; file = $dest; error = $_.Exception.Message }
    continue
  }
}

$manifestPath = Join-Path $OutDir "manifest.json"
$json = ConvertTo-Json -InputObject $manifest -Depth 4
$json | Set-Content -Encoding UTF8 -Path $manifestPath

Write-Host ""
Write-Host "Listo. Imágenes detectadas: $($images.Count)"
Write-Host "Guardadas en: $OutDir"
Write-Host "Manifest: $manifestPath"
