@echo off
echo ========================================
echo    CONFIGURACIÓN CLOUDFLARE WORKER
echo    WPT Asignation System
echo ========================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js no está instalado
    echo    Descárgalo desde: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Verificar si Wrangler está instalado
wrangler --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 📦 Instalando Wrangler CLI...
    npm install -g wrangler
    if %ERRORLEVEL% neq 0 (
        echo ❌ Error instalando Wrangler
        pause
        exit /b 1
    )
    echo ✅ Wrangler instalado correctamente
) else (
    echo ✅ Wrangler ya está instalado
)
echo.

REM Navegar al directorio del worker
echo 📂 Navegando al directorio del worker...
cd cloudflare-worker
if %ERRORLEVEL% neq 0 (
    echo ❌ No se encontró el directorio cloudflare-worker
    pause
    exit /b 1
)

REM Instalar dependencias del worker
echo 📦 Instalando dependencias del worker...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo ========================================
echo    PRÓXIMOS PASOS MANUALES
echo ========================================
echo.
echo 1. 🔐 Configurar Cloudflare:
echo    - Crea cuenta en cloudflare.com (si no tienes)
echo    - Ejecuta: wrangler login
echo    - Obtén tu Account ID del dashboard
echo.
echo 2. ⚙️ Editar configuración:
echo    - Abre: cloudflare-worker\wrangler.toml
echo    - Reemplaza 'your-domain' con tu dominio real
echo    - Abre: cloudflare-worker\src\index.js
echo    - Actualiza ALLOWED_ORIGINS con tus dominios
echo.
echo 3. 🔑 Configurar secretos:
echo    cd cloudflare-worker
echo    npm run setup-secrets
echo.
echo 4. 🚀 Desplegar:
echo    npm run deploy
echo.
echo 5. 🔧 Configurar React:
echo    - Copia .env.cloudflare a .env.local
echo    - Actualiza REACT_APP_WORKER_URL con tu URL real
echo.
echo 📖 Lee CLOUDFLARE-WORKER-SETUP.md para más detalles
echo.
pause
