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

type nul > features\%FEATURE%\components\%FEATURE%Component.ts
type nul > features\%FEATURE%\models\%FEATURE%Model.ts
type nul > features\%FEATURE%\views\%FEATURE%View.ts
type nul > features\%FEATURE%\viewmodels\%FEATURE%Viewmodel.ts
type nul > features\%FEATURE%\types\%FEATURE%Type.ts
type nul > features\%FEATURE%\services\%FEATURE%Service.ts


echo Estrutura criada para a feature: %FEATURE%