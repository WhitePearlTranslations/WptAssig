@echo off
echo 🔥 Deploying Firebase Realtime Database Rules...
echo.

:: Verificar sintaxis de reglas
echo Checking rules syntax...
firebase database:rules:get > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Firebase CLI not authenticated or project not configured
    echo Please run: firebase login
    pause
    exit /b 1
)

:: Deploy reglas
echo Deploying rules to Firebase...
firebase deploy --only database

if %errorlevel% equ 0 (
    echo.
    echo ✅ Rules deployed successfully!
    echo.
    echo 🎯 What was deployed:
    echo - Updated approval workflow states: 'pendiente_aprobacion', 'aprobado'
    echo - New fields: completedDate, completedBy, pendingApprovalSince, reviewRequiredBy
    echo - Permissions for workers to update assignment status
    echo.
    echo 🚀 Your approval system is now active!
) else (
    echo.
    echo ❌ Deployment failed!
    echo Check the error messages above
)

echo.
pause
