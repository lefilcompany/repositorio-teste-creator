# Script para usar ambiente de desenvolvimento
Write-Host "Configurando ambiente de DESENVOLVIMENTO..." -ForegroundColor Cyan
Copy-Item .env.development .env -Force

Write-Host "Ambiente configurado para DESENVOLVIMENTO" -ForegroundColor Green
Write-Host "Banco: ezovprllxlhwctltvmwx (DEV)" -ForegroundColor Yellow
Write-Host "URL: https://ezovprllxlhwctltvmwx.supabase.co" -ForegroundColor Yellow
