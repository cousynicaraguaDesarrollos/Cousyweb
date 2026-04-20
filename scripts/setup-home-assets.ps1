Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "public/assets/home" | Out-Null
New-Item -ItemType Directory -Force -Path "public/fonts" | Out-Null

Copy-Item -Force -LiteralPath "public/assets/_cousy-download/cdn-cgi_image_format_auto_w_375_fit_crop_YleQbkGQBZUk2zBB_logo-cousy-01-YbNJpzgnz0TWNO2b.png" -Destination "public/assets/logo-cousy.png"

Copy-Item -Force -LiteralPath "public/assets/_cousy-download/cdn-cgi_image_format_auto_w_768_h_562_fit_crop_YleQbkGQBZUk2zBB_56-I8kRrOlTP6OrpP6O.jpg" -Destination "public/assets/home/mochilas.jpg"
Copy-Item -Force -LiteralPath "public/assets/_cousy-download/cdn-cgi_image_format_auto_w_768_h_562_fit_crop_YleQbkGQBZUk2zBB_1-HOxawb3jWe068BXO.jpg" -Destination "public/assets/home/bolsos-y-tote-bags.jpg"
Copy-Item -Force -LiteralPath "public/assets/_cousy-download/cdn-cgi_image_format_auto_w_768_h_562_fit_crop_YleQbkGQBZUk2zBB_53-HWRjN6i8EncTe9KR.jpg" -Destination "public/assets/home/regalos-empresariales.jpg"
Copy-Item -Force -LiteralPath "public/assets/_cousy-download/cdn-cgi_image_format_auto_w_768_h_562_fit_crop_YleQbkGQBZUk2zBB_65-YJlVUAOJ6THs0Whk.jpg" -Destination "public/assets/home/infantiles.jpg"

$tavirajUrl = "https://assets.zyrosite.com/YleQbkGQBZUk2zBB/Taviraj%20ExtraLight%20Italic.woff2"
$tavirajOut = "public/fonts/Taviraj-ExtraLightItalic.woff2"
Invoke-WebRequest -Uri $tavirajUrl -Headers @{ "User-Agent" = "Mozilla/5.0" } -OutFile $tavirajOut

Write-Host "OK: assets y fuente Taviraj copiadas/descargadas."

