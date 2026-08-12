@echo off
setlocal
cd /d "%~dp0"

echo [stop] Encerrando Backend e Frontend...
taskkill /FI "WINDOWTITLE eq WorkaPool Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq WorkaPool Frontend*" /T /F >nul 2>&1

echo [stop] Parando PostgreSQL (Docker)...
pushd "%~dp0..\backend"
docker compose -f docker-compose.dev.yml stop >> "%~dp0database.log" 2>&1
popd

echo [ok] Servicos parados.
endlocal
