#!/usr/bin/env node
/**
 * Script para configurar Firebase con variables de entorno
 * WhitePearl Translations - Sistema de Asignaciones
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

// Función para imprimir con colores
const print = (text, color = 'white') => {
    console.log(colors[color] + text + colors.reset);
};

// Interfaz de readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para hacer preguntas
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
};

// Función para validar input requerido
const getRequiredInput = async (prompt, defaultValue = '') => {
    let input = '';
    do {
        if (defaultValue) {
            input = await askQuestion(`${prompt} [${defaultValue}]: `);
            if (!input) input = defaultValue;
        } else {
            input = await askQuestion(`${prompt}: `);
        }
        
        if (!input) {
            print('⚠️  Este campo es obligatorio. Por favor, ingresa un valor.', 'yellow');
        }
    } while (!input);
    
    return input;
};

// Función principal
const setupFirebase = async () => {
    try {
        print('🔥 Configurador de Firebase para WhitePearl Translations', 'cyan');
        print('=========================================================', 'cyan');
        print('');

        print('📋 Ingresa los datos de tu proyecto Firebase:', 'green');
        print('   Puedes encontrar estos datos en: Firebase Console > Project Settings > General > Your apps > Web app', 'dim');
        print('');

        // Solicitar datos de Firebase
        const firebaseConfig = {
            apiKey: await getRequiredInput('🔑 API Key'),
            authDomain: await getRequiredInput('🌐 Auth Domain (ej: tu-proyecto.firebaseapp.com)'),
            databaseURL: await getRequiredInput('🗄️  Database URL (ej: https://tu-proyecto-default-rtdb.firebaseio.com/)'),
            projectId: await getRequiredInput('📂 Project ID'),
            storageBucket: await getRequiredInput('📦 Storage Bucket (ej: tu-proyecto.appspot.com)'),
            messagingSenderId: await getRequiredInput('📨 Messaging Sender ID'),
            appId: await getRequiredInput('🆔 App ID')
        };

        // Crear contenido del archivo .env
        const envContent = `# Firebase Configuration - WhitePearl Translations
# Generado automáticamente el ${new Date().toLocaleString('es-ES')}

# ⚠️ IMPORTANTE: No compartas este archivo públicamente
# Agrega .env a tu .gitignore si usas Git

# Firebase Project Configuration
REACT_APP_FIREBASE_API_KEY=${firebaseConfig.apiKey}
REACT_APP_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
REACT_APP_FIREBASE_DATABASE_URL=${firebaseConfig.databaseURL}
REACT_APP_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
REACT_APP_FIREBASE_STORAGE_BUCKET=${firebaseConfig.storageBucket}
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.messagingSenderId}
REACT_APP_FIREBASE_APP_ID=${firebaseConfig.appId}

# Opcional: URL base de la aplicación (para links compartidos)
REACT_APP_BASE_URL=http://localhost:3000
`;

        // Crear archivo .env
        const envPath = path.join(process.cwd(), '.env');
        fs.writeFileSync(envPath, envContent, 'utf8');
        print('✅ Archivo .env creado exitosamente', 'green');

        // Contenido actualizado para firebase.js
        const firebaseJsContent = `import { initializeApp } from 'firebase/app';
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
  missingVars.forEach(varName => console.error('- ' + varName));
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
`;

        // Actualizar firebase.js
        const firebaseJsPath = path.join(process.cwd(), 'src', 'services', 'firebase.js');
        fs.writeFileSync(firebaseJsPath, firebaseJsContent, 'utf8');
        print('✅ Archivo firebase.js actualizado para usar variables de entorno', 'green');

        // Crear .env.example
        const envExampleContent = `# Firebase Configuration - WhitePearl Translations
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
`;

        const envExamplePath = path.join(process.cwd(), '.env.example');
        fs.writeFileSync(envExamplePath, envExampleContent, 'utf8');
        print('✅ Archivo .env.example creado como referencia', 'green');

        // Gestionar .gitignore
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        let gitignoreContent = '';

        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            if (!gitignoreContent.includes('.env')) {
                print('🔒 Agregando .env a .gitignore por seguridad...', 'yellow');
                fs.appendFileSync(gitignorePath, '\n# Environment variables\n.env\n');
                print('✅ .env agregado a .gitignore', 'green');
            }
        } else {
            print('📝 Creando .gitignore con configuración de seguridad...', 'yellow');
            const gitignoreTemplate = `# Dependencies
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
`;
            fs.writeFileSync(gitignorePath, gitignoreTemplate, 'utf8');
            print('✅ .gitignore creado con configuraciones de seguridad', 'green');
        }

        // Mostrar resumen
        print('', 'white');
        print('🎉 ¡Configuración completada exitosamente!', 'green');
        print('=========================================', 'green');
        print('', 'white');
        print('📁 Archivos creados/actualizados:', 'cyan');
        print('   ✓ .env (configuración privada)', 'white');
        print('   ✓ .env.example (plantilla pública)', 'white');
        print('   ✓ src/services/firebase.js (actualizado)', 'white');
        print('   ✓ .gitignore (configuración de seguridad)', 'white');
        print('', 'white');
        print('🔐 Seguridad:', 'yellow');
        print('   • El archivo .env contiene información sensible', 'white');
        print('   • NO lo compartas públicamente o en repositorios', 'white');
        print('   • Ya está agregado a .gitignore para protegerlo', 'white');
        print('', 'white');
        print('🚀 Próximos pasos:', 'cyan');
        print('   1. Ejecuta: npm start', 'white');
        print('   2. Verifica que la aplicación se conecte a Firebase', 'white');
        print('   3. Configura las reglas de Realtime Database en Firebase Console', 'white');
        print('', 'white');
        print('📚 Documentación adicional en README.md', 'dim');
        print('', 'white');

        // Preguntar si desea ejecutar npm start
        const runNpm = await askQuestion('¿Deseas ejecutar npm start ahora? (y/N): ');
        if (runNpm.toLowerCase() === 'y' || runNpm.toLowerCase() === 'yes') {
            print('', 'white');
            print('🚀 Iniciando la aplicación...', 'green');
            
            // Ejecutar npm start
            const { spawn } = require('child_process');
            const npmStart = spawn('npm', ['start'], {
                stdio: 'inherit',
                shell: true
            });

            npmStart.on('error', (error) => {
                print(`❌ Error al ejecutar npm start: ${error.message}`, 'red');
            });
        }

        print('', 'white');
        print('✨ ¡Listo para usar WhitePearl Translations! ✨', 'magenta');

    } catch (error) {
        print(`❌ Error durante la configuración: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        rl.close();
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    setupFirebase();
}

module.exports = { setupFirebase };
