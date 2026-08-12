@echo off
cd /d "%~dp0..\backend"

if not exist "dist\server.js" (
  echo [backend] dist\server.js nao encontrado. Rode "npm run build" em backend antes.
  pause
  exit /b 1
)

set NODE_ENV=production
start "WorkaPool Backend" cmd /c "node dist\server.js >> "%~dp0backend.log" 2>&1"
