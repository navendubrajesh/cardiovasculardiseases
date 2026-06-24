# Start AI Cardiologist locally (API + web dev server)
# Usage: .\scripts\start-local.ps1
# Optional: .\scripts\start-local.ps1 -SkipTrain

param([switch]$SkipTrain)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$Backend = Join-Path $Root "ai-cardiologist-backend"
$Web = Join-Path $Root "ai-cardiologist-web"
$Ml = Join-Path $Root "ai-cardiologist-ml"
$ModelsDir = Join-Path $Ml "models\artifacts"

if (-not $SkipTrain) {
    $hasModels = (Test-Path $ModelsDir) -and ((Get-ChildItem $ModelsDir -Filter "*.joblib" -ErrorAction SilentlyContinue).Count -gt 0)
    if (-not $hasModels) {
        Write-Host "Training models (first run — may take a few minutes)..."
        Push-Location $Ml
        $env:PYTHONPATH = "src"
        python scripts/train.py train --out models --synthetic-rows 4000
        Pop-Location
    }
}

Write-Host "Starting API on http://127.0.0.1:8000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$Backend'; `$env:MODELS_DIR='$ModelsDir'; `$env:CORS_ORIGINS='http://localhost:5179,http://127.0.0.1:5179'; uvicorn api.index:app --reload --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "Starting web on http://localhost:5179 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$Web'; npm run dev"
)

Write-Host ""
Write-Host "Local stack:"
Write-Host "  Web:  http://localhost:5179"
Write-Host "  API:  http://127.0.0.1:8000/api/health"
Write-Host "  Login with Google/GitHub/etc. (guest session via local API)"
