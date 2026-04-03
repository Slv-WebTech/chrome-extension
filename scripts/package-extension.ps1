$ErrorActionPreference = 'Stop'

$zipDir = './release'
$zipPath = Join-Path $zipDir 'chrome-extension.zip'

Write-Host 'Preparing extension package...' -ForegroundColor Cyan

# Ensure fresh static output exists
$env:BUILD_TARGET = 'static'
pnpm run build:static

if (-not (Test-Path './out/index.html')) {
  throw 'Cannot package extension: out/index.html not found.'
}

if (-not (Test-Path $zipDir)) {
  New-Item -ItemType Directory -Path $zipDir | Out-Null
}

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

Compress-Archive -Path './out/*' -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Extension zip created: $zipPath" -ForegroundColor Green
