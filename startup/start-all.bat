@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo  WorkaPool - subindo aplicacao
echo ========================================
echo.

call "%~dp0database.bat"
if errorlevel 1 exit /b 1

echo [wait] Aguardando Postgres...
timeout /t 5 /nobreak >nul

call "%~dp0backend.bat"
if errorlevel 1 exit /b 1

call "%~dp0frontend.bat"
if errorlevel 1 exit /b 1

echo.
echo [ok] Aplicacao no ar:
echo   Backend  - http://localhost:3005
echo   Frontend - http://localhost:5173
echo   Postgres - localhost:5433
echo.
echo Logs em: %~dp0*.log
echo Para parar: stop-all.bat
endlocal
