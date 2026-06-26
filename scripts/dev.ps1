# Starts the GreenWave backend and frontend for local development (Windows / PowerShell).
# Usage:  ./scripts/dev.ps1   (run from the greenwave/ folder)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting GreenWave API on http://localhost:8000 ..." -ForegroundColor Green
$api = Start-Process -PassThru -WorkingDirectory "$root\apps\api" powershell -ArgumentList @(
  "-NoExit", "-Command",
  "pip install -r requirements.txt; uvicorn main:app --host 0.0.0.0 --port 8000"
)

Start-Sleep -Seconds 2

Write-Host "Starting GreenWave web on http://localhost:5173 ..." -ForegroundColor Green
$web = Start-Process -PassThru -WorkingDirectory "$root\apps\web" powershell -ArgumentList @(
  "-NoExit", "-Command",
  "npm install; npm run dev"
)

Write-Host ""
Write-Host "GreenWave is starting in two new windows." -ForegroundColor Cyan
Write-Host "  API : http://localhost:8000/health"
Write-Host "  Web : http://localhost:5173"
Write-Host "Close those windows to stop the servers."
