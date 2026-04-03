param(
  [string]$OutDir = './out'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $OutDir)) {
  throw "Output directory not found: $OutDir"
}

function Get-ForwardRelativePath {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  $base = (Resolve-Path $BasePath).Path.TrimEnd('\\')
  $target = (Resolve-Path $TargetPath).Path

  if ($target.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $target.Substring($base.Length).TrimStart('\\').Replace('\\', '/')
  }

  return $target.Replace('\\', '/')
}

$replacementMap = @{}

# 1) Rename top-level _next directory to next (Chrome blocks names starting with underscore).
$legacyNextDir = Join-Path $OutDir '_next'
$newNextDir = Join-Path $OutDir 'next'
if (Test-Path $legacyNextDir) {
  if (Test-Path $newNextDir) {
    Remove-Item $newNextDir -Recurse -Force
  }

  Rename-Item -Path $legacyNextDir -NewName 'next'
  $replacementMap['/_next/'] = '/next/'
}

# 2) Rename any remaining files/folders starting with underscore.
$underscoreItems = Get-ChildItem $OutDir -Recurse -Force | Where-Object {
  $_.Name.StartsWith('_')
} | Sort-Object { $_.FullName.Length } -Descending

foreach ($item in $underscoreItems) {
  if (-not (Test-Path $item.FullName)) {
    continue
  }

  $parentPath = Split-Path $item.FullName -Parent
  $newName = $item.Name.TrimStart('_')

  if ([string]::IsNullOrWhiteSpace($newName)) {
    $newName = 'item'
  }

  $newPath = Join-Path $parentPath $newName
  $suffix = 1
  while (Test-Path $newPath) {
    $newPath = Join-Path $parentPath ("{0}-{1}" -f $newName, $suffix)
    $suffix++
  }

  $oldRel = Get-ForwardRelativePath -BasePath $OutDir -TargetPath $item.FullName

  Rename-Item -Path $item.FullName -NewName (Split-Path $newPath -Leaf)

  $newRel = Get-ForwardRelativePath -BasePath $OutDir -TargetPath $newPath

  if ($oldRel -and $newRel -and $oldRel -ne $newRel) {
    $replacementMap["/$oldRel"] = "/$newRel"
  }
}

# 3) Rewrite references in exported text assets.
if ($replacementMap.Count -gt 0) {
  $textFiles = Get-ChildItem $OutDir -Recurse -File | Where-Object {
    $_.Extension -in @('.html', '.js', '.css', '.json', '.txt', '.map')
  }

  foreach ($file in $textFiles) {
    $content = Get-Content $file.FullName -Raw
    $updated = $content

    foreach ($key in $replacementMap.Keys) {
      $value = $replacementMap[$key]
      $updated = $updated.Replace($key, $value)
      $updated = $updated.Replace(($key -replace '/', '\\/'), ($value -replace '/', '\\/'))
    }

    if ($updated -ne $content) {
      Set-Content -Path $file.FullName -Value $updated -NoNewline
    }
  }
}

# 4) Final safety check: fail if anything still begins with underscore.
$remainingUnderscore = Get-ChildItem $OutDir -Recurse -Force | Where-Object { $_.Name.StartsWith('_') }
if ($remainingUnderscore) {
  $names = ($remainingUnderscore | Select-Object -ExpandProperty FullName) -join "`n"
  throw "Extension output still contains reserved underscore paths:`n$names"
}

# 5) Extract inline <script> blocks from index.html for Chrome MV3 CSP compliance.
#    Chrome extension pages block inline scripts (script-src 'self' default CSP).
#    Move each inline script body to an external .js file and replace with <script src=...>.
$indexHtml = Join-Path $OutDir 'index.html'
if (Test-Path $indexHtml) {
  $html = [System.IO.File]::ReadAllText($indexHtml, [System.Text.Encoding]::UTF8)
  $pattern = [regex]'(?s)<script(?![^>]*\bsrc=)[^>]*>(.*?)<\/script>'
  $scriptMatches = @($pattern.Matches($html))

  # Process in reverse order so replacements don't shift earlier indices.
  $scriptMatches = $scriptMatches | Sort-Object { $_.Index } -Descending

  $counter = 0
  foreach ($sm in $scriptMatches) {
    $inner = $sm.Groups[1].Value.Trim()
    if ([string]::IsNullOrWhiteSpace($inner)) { continue }

    $counter++
    $num    = $scriptMatches.Count - $counter + 1  # preserve original document order in filenames
    $jsFile = "ext-init-$num.js"
    $jsPath = Join-Path $OutDir $jsFile
    [System.IO.File]::WriteAllText($jsPath, $inner, [System.Text.Encoding]::UTF8)

    $replacement = "<script src='./$jsFile'></script>"
    $html = $html.Remove($sm.Index, $sm.Length).Insert($sm.Index, $replacement)
  }

  [System.IO.File]::WriteAllText($indexHtml, $html, [System.Text.Encoding]::UTF8)
  Write-Host "Extracted $counter inline script(s) from index.html for CSP compliance." -ForegroundColor Cyan
}

Write-Host 'Sanitized extension output for Chrome compatibility.' -ForegroundColor Green
