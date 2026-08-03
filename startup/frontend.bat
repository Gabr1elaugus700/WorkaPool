@echo off
cd /d "%~dp0..\frontend"

if not exist "dist\index.html" (
  echo [frontend] dist\index.html nao encontrado. Rode "npm run build" em frontend antes.
  pause
  exit /b 1
)

start "WorkaPool Frontend" cmd /c "npx --yes serve@14 dist -l 5173 -s >> "%~dp0frontend.log" 2>&1"
