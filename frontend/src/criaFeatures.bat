@echo off
set FEATURE=%1

if "%FEATURE%"=="" (
    echo Uso: %0 nome_da_feature
    exit /b 1
)

mkdir features\%FEATURE%\services
mkdir features\%FEATURE%\model
mkdir features\%FEATURE%\view
mkdir features\%FEATURE%\modelview
mkdir features\%FEATURE%\components

type nul > features\%FEATURE%\services\%FEATURE%-service.js
type nul > features\%FEATURE%\model\%FEATURE%-model.js
type nul > features\%FEATURE%\view\%FEATURE%-view.js
type nul > features\%FEATURE%\modelview\%FEATURE%-modelview.js
type nul > features\%FEATURE%\components\%FEATURE%-component.js

echo Estrutura criada para a feature: %FEATURE%