@echo off
set FEATURE=%1

if "%FEATURE%"=="" (
    echo Uso: %0 nome_da_feature
    exit /b 1
)

mkdir src\features\%FEATURE%\controllers
mkdir src\features\%FEATURE%\routes
mkdir src\features\%FEATURE%\schemas
mkdir src\features\%FEATURE%\services
mkdir src\features\%FEATURE%\repositories

type nul > src\features\%FEATURE%\controllers\%FEATURE%.controller.js
type nul > src\features\%FEATURE%\routes\%FEATURE%.routes.js
type nul > src\features\%FEATURE%\schemas\%FEATURE%.schema.js
type nul > src\features\%FEATURE%\services\%FEATURE%.service.js
type nul > src\features\%FEATURE%\repositories\%FEATURE%.repository.js

echo Estrutura de backend criada para a feature: %FEATURE%