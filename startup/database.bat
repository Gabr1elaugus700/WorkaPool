@echo off
setlocal
cd /d "%~dp0..\backend"

where docker >nul 2>&1
if errorlevel 1 (
  echo [database] Docker nao encontrado no PATH.
  pause
  exit /b 1
)

echo [database] Subindo PostgreSQL (porta 5433)...
docker compose -f docker-compose.dev.yml up -d >> "%~dp0database.log" 2>&1
if errorlevel 1 (
  echo [database] Falhou. Veja startup\database.log
  pause
  exit /b 1
)

echo [database] OK - localhost:5433 (workapool_dev)
endlocal
