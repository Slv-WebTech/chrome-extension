$ErrorActionPreference = 'Stop'

Write-Host 'Building static export for Chrome extension...' -ForegroundColor Cyan
$env:BUILD_TARGET = 'static'
pnpm run build:static

if (-not (Test-Path './out/index.html')) {
  throw 'Static export failed: out/index.html was not generated.'
}

Write-Host 'Static extension build complete: ./out' -ForegroundColor Green
