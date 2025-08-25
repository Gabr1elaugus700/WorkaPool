@echo off
set FEATURE=%1

if "%FEATURE%"=="" (
    echo Uso: %0 nome_da_feature
    exit /b 1
)

mkdir src\features\%FEATURE%\controllers
mkdir src\features\%FEATURE%\routes
mkdir src\features\%FEATURE%\models
mkdir src\features\%FEATURE%\services
mkdir src\features\%FEATURE%\middlewares

type nul > src\features\%FEATURE%\controllers\%FEATURE%.controller.js
type nul > src\features\%FEATURE%\routes\%FEATURE%.routes.js
type nul > src\features\%FEATURE%\models\%FEATURE%.model.js
type nul > src\features\%FEATURE%\services\%FEATURE%.service.js
type nul > src\features\%FEATURE%\middlewares\%FEATURE%.middleware.js

echo Estrutura de backend criada para a feature: %FEATURE%