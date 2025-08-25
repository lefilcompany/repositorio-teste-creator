# Script para usar ambiente de produção  
Write-Host "Configurando ambiente de PRODUCAO..." -ForegroundColor Red
Copy-Item .env.production .env -Force

Write-Host "Ambiente configurado para PRODUCAO" -ForegroundColor Green
Write-Host "Banco: pynnaycajkflymnvcfcd (PROD)" -ForegroundColor Yellow
Write-Host "URL: https://pynnaycajkflymnvcfcd.supabase.co" -ForegroundColor Yellow
