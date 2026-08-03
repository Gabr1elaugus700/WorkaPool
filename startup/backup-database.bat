@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-database.ps1"
if errorlevel 1 (
  echo.
  echo [backup] Falhou. Veja a mensagem acima.
  pause
  exit /b 1
)
