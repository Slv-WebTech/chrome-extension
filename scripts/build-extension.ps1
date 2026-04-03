$ErrorActionPreference = 'Stop'

Write-Host 'Building static export for Chrome extension...' -ForegroundColor Cyan
$env:BUILD_TARGET = 'static'
pnpm run build:static

powershell -ExecutionPolicy Bypass -File ./scripts/sanitize-extension-output.ps1 -OutDir './out'

if (-not (Test-Path './out/index.html')) {
  throw 'Static export failed: out/index.html was not generated.'
}

Write-Host 'Static extension build complete: ./out' -ForegroundColor Green
