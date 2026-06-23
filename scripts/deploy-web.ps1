# Deploy web app to GitHub Pages (gh-pages branch)
# Usage: .\scripts\deploy-web.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path "$Root\ai-cardiologist-web\package.json")) {
    $Root = Split-Path $PSScriptRoot -Parent
}

$Web = Join-Path $Root "ai-cardiologist-web"
$Tmp = Join-Path $Root "_ghpages_deploy"

Push-Location $Web
$env:VITE_BASE_PATH = "/AICARDIOLOGIST/"
$env:VITE_API_BASE_URL = "https://ai-cardiologist-api.onrender.com"
npm run build
Copy-Item dist/index.html dist/404.html -Force
New-Item -ItemType File -Path dist/.nojekyll -Force | Out-Null
Pop-Location

if (Test-Path $Tmp) { Remove-Item $Tmp -Recurse -Force }
New-Item -ItemType Directory -Path $Tmp | Out-Null
Copy-Item "$Web\dist\*" $Tmp -Recurse -Force

Push-Location $Tmp
git init | Out-Null
git checkout -b gh-pages 2>$null
if ($LASTEXITCODE -ne 0) { git checkout gh-pages }
git add -A
git commit -m "Deploy AI Cardiologist web app $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git remote remove origin 2>$null
git remote add origin https://github.com/navendubrajesh/AICARDIOLOGIST.git
git push -f origin gh-pages
Pop-Location

Write-Host "Done. Enable Pages: Settings -> Pages -> Deploy from branch -> gh-pages / root"
Write-Host "URL: https://navendubrajesh.github.io/AICARDIOLOGIST/"
