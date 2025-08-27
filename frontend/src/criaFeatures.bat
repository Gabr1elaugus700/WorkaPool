@echo off
set FEATURE=%1

if "%FEATURE%"=="" (
    echo Uso: %0 nome_da_feature
    exit /b 1
)

mkdir features\%FEATURE%\components
mkdir features\%FEATURE%\models
mkdir features\%FEATURE%\services
mkdir features\%FEATURE%\types
mkdir features\%FEATURE%\viewmodels
mkdir features\%FEATURE%\views

type nul > features\%FEATURE%\components\%FEATURE%-service.ts
type nul > features\%FEATURE%\models\%FEATURE%-model.ts
type nul > features\%FEATURE%\views\%FEATURE%-view.ts
type nul > features\%FEATURE%\viewmodels\%FEATURE%-viewmodel.ts
type nul > features\%FEATURE%\types\%FEATURE%-component.ts
type nul > features\%FEATURE%\services\%FEATURE%-component.ts


echo Estrutura criada para a feature: %FEATURE%