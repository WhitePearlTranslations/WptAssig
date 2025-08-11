# Script para configurar Firebase con variables de entorno
# WhitePearl Translations - Sistema de Asignaciones

Write-Host "🔥 Configurador de Firebase para WhitePearl Translations" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Función para solicitar input con validación
function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$DefaultValue = "",
        [bool]$Required = $true
    )
    
    do {
        if ($DefaultValue) {
            $input = Read-Host "$Prompt [$DefaultValue]"
            if ([string]::IsNullOrEmpty($input)) {
                $input = $DefaultValue
            }
        } else {
            $input = Read-Host $Prompt
        }
        
        if ($Required -and [string]::IsNullOrEmpty($input)) {
            Write-Host "⚠️  Este campo es obligatorio. Por favor, ingresa un valor." -ForegroundColor Yellow
        }
    } while ($Required -and [string]::IsNullOrEmpty($input))
    
    return $input
}

# Solicitar datos de configuración de Firebase
Write-Host "📋 Ingresa los datos de tu proyecto Firebase:" -ForegroundColor Green
Write-Host "   Puedes encontrar estos datos en: Firebase Console > Project Settings > General > Your apps > Web app" -ForegroundColor Gray
Write-Host ""

$apiKey = Get-UserInput "🔑 API Key"
$authDomain = Get-UserInput "🌐 Auth Domain (ej: tu-proyecto.firebaseapp.com)"
$databaseURL = Get-UserInput "🗄️  Database URL (ej: https://tu-proyecto-default-rtdb.firebaseio.com/)"
$projectId = Get-UserInput "📂 Project ID"
$storageBucket = Get-UserInput "📦 Storage Bucket (ej: tu-proyecto.appspot.com)"
$messagingSenderId = Get-UserInput "📨 Messaging Sender ID"
$appId = Get-UserInput "🆔 App ID"

# Crear contenido del archivo .env
$envContent = @"
# Firebase Configuration - WhitePearl Translations
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# ⚠️ IMPORTANTE: No compartas este archivo públicamente
# Agrega .env a tu .gitignore si usas Git

# Firebase Project Configuration
REACT_APP_FIREBASE_API_KEY=$apiKey
REACT_APP_FIREBASE_AUTH_DOMAIN=$authDomain
REACT_APP_FIREBASE_DATABASE_URL=$databaseURL
REACT_APP_FIREBASE_PROJECT_ID=$projectId
REACT_APP_FIREBASE_STORAGE_BUCKET=$storageBucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
REACT_APP_FIREBASE_APP_ID=$appId

# Opcional: URL base de la aplicación (para links compartidos)
REACT_APP_BASE_URL=http://localhost:3000
"@

# Crear archivo .env
$envPath = ".\.env"
try {
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    Write-Host "✅ Archivo .env creado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al crear el archivo .env: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Actualizar firebase.js para usar variables de entorno
$firebaseJsContent = @"
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Configuración de Firebase usando variables de entorno
// Las variables deben estar definidas en el archivo .env
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Validar que todas las variables estén configuradas
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('🔥 Error de configuración de Firebase:');
  console.error('Las siguientes variables de entorno no están configuradas:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('Por favor, verifica tu archivo .env');
  throw new Error('Configuración de Firebase incompleta');
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios de Firebase
export const db = getDatabase(app);  // Realtime Database
export const auth = getAuth(app);

// Exportar configuración para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase configurado correctamente:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL
  });
}

export default app;
"@

# Actualizar firebase.js
$firebaseJsPath = ".\src\services\firebase.js"
try {
    $firebaseJsContent | Out-File -FilePath $firebaseJsPath -Encoding UTF8
    Write-Host "✅ Archivo firebase.js actualizado para usar variables de entorno" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al actualizar firebase.js: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Crear .env.example para referencia
$envExampleContent = @"
# Firebase Configuration - WhitePearl Translations
# Archivo de ejemplo - Copia este archivo como .env y completa con tus datos reales

# Firebase Project Configuration
REACT_APP_FIREBASE_API_KEY=tu-api-key-aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com/
REACT_APP_FIREBASE_PROJECT_ID=tu-proyecto-id
REACT_APP_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Opcional: URL base de la aplicación
REACT_APP_BASE_URL=http://localhost:3000
"@

try {
    $envExampleContent | Out-File -FilePath ".\.env.example" -Encoding UTF8
    Write-Host "✅ Archivo .env.example creado como referencia" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No se pudo crear .env.example (opcional)" -ForegroundColor Yellow
}

# Verificar si existe .gitignore y agregar .env si es necesario
$gitignorePath = ".\.gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -notmatch "\.env") {
        Write-Host ""
        Write-Host "🔒 Agregando .env a .gitignore por seguridad..." -ForegroundColor Yellow
        Add-Content -Path $gitignorePath -Value "`n# Environment variables`n.env"
        Write-Host "✅ .env agregado a .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "📝 Creando .gitignore con configuración de seguridad..." -ForegroundColor Yellow
    $gitignoreContent = @"
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Environment variables (IMPORTANT: Never commit these)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"@
    try {
        $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8
        Write-Host "✅ .gitignore creado con configuraciones de seguridad" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ No se pudo crear .gitignore" -ForegroundColor Yellow
    }
}

# Mostrar resumen
Write-Host ""
Write-Host "🎉 ¡Configuración completada exitosamente!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivos creados/actualizados:" -ForegroundColor Cyan
Write-Host "   ✓ .env (configuración privada)" -ForegroundColor White
Write-Host "   ✓ .env.example (plantilla pública)" -ForegroundColor White
Write-Host "   ✓ src/services/firebase.js (actualizado)" -ForegroundColor White
Write-Host "   ✓ .gitignore (configuración de seguridad)" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Seguridad:" -ForegroundColor Yellow
Write-Host "   • El archivo .env contiene información sensible" -ForegroundColor White
Write-Host "   • NO lo compartas públicamente o en repositorios" -ForegroundColor White
Write-Host "   • Ya está agregado a .gitignore para protegerlo" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Ejecuta: npm start" -ForegroundColor White
Write-Host "   2. Verifica que la aplicación se conecte a Firebase" -ForegroundColor White
Write-Host "   3. Configura las reglas de Realtime Database en Firebase Console" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentación adicional en README.md" -ForegroundColor Gray
Write-Host ""

# Preguntar si desea ejecutar npm start
$runNpm = Read-Host "¿Deseas ejecutar 'npm start' ahora? (y/N)"
if ($runNpm -eq "y" -or $runNpm -eq "Y" -or $runNpm -eq "yes") {
    Write-Host ""
    Write-Host "🚀 Iniciando la aplicación..." -ForegroundColor Green
    npm start
}

Write-Host ""
Write-Host "✨ ¡Listo para usar WhitePearl Translations! ✨" -ForegroundColor Magenta
