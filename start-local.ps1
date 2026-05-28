# start-local.ps1
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎨 Levantando Art Huila (Monolito Unificado)..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "📦 Iniciando Backend NestJS en Puerto 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm install; npm run start:dev" -Title "Art Huila - UNIFICADO"

Write-Host "-----------------------------------------" -ForegroundColor Gray
Write-Host "🚀 ¡El sistema monolítico se está iniciando!" -ForegroundColor Green
Write-Host "🌐 Accede al sistema en: http://localhost:3000" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan

