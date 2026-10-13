# start-ml-server.ps1
# Run from: e:\AntiGravity Projects\access-map-ml
# This starts the FastAPI ML server for accessibility detection

Write-Host "Starting AccessMap ML API Server..." -ForegroundColor Cyan
Write-Host "Model: models/best.pt (Stairs detector)" -ForegroundColor Yellow
Write-Host "API: http://localhost:8000" -ForegroundColor Green
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Green

# Activate virtual environment if present
$venvPath = "..\\.venv\\Scripts\\Activate.ps1"
if (Test-Path $venvPath) {
    Write-Host "Activating venv..." -ForegroundColor DarkGray
    & $venvPath
}

# Start uvicorn
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
