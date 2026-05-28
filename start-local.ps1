# start-local.ps1
Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎨 Levantando Art Huila (Monolito)..." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📦 Instalando dependencias e iniciando NestJS en Puerto 3000..." -ForegroundColor Yellow
cd backend
npm install
npm run start:dev
