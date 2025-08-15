/**
 * Script para configurar los secretos necesarios para funciones administrativas
 * del worker de Cloudflare, incluyendo eliminación de usuarios de Firebase Auth
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function setupAdminSecrets() {
  console.log('=== Configuración de Secretos Administrativos ===\n');

  try {
    // 1. Token de eliminación de administrador
    console.log('1. Token de seguridad para eliminación de usuarios:');
    console.log('   Este token protege las operaciones de eliminación.');
    const deleteToken = await question('   Ingresa un token seguro (o presiona Enter para usar el predeterminado): ');
    const adminToken = deleteToken.trim() || 'wpt-admin-delete-2024-secure';

    // 2. Clave de cuenta de servicio de Firebase
    console.log('\n2. Clave de cuenta de servicio de Firebase:');
    console.log('   Necesitas descargar la clave JSON de tu proyecto Firebase.');
    console.log('   Ve a: Firebase Console > Configuración del proyecto > Cuentas de servicio');
    console.log('   Genera nueva clave privada y descarga el archivo JSON.');
    const serviceAccountPath = await question('   Ruta del archivo de clave de servicio: ');

    if (!serviceAccountPath.trim()) {
      throw new Error('La ruta de la clave de servicio es requerida');
    }

    // Leer el archivo de clave de servicio
    const fs = require('fs');
    const serviceAccountKey = fs.readFileSync(serviceAccountPath.trim(), 'utf8');
    
    // Validar que el archivo JSON es válido
    try {
      JSON.parse(serviceAccountKey);
    } catch (e) {
      throw new Error('El archivo de clave de servicio no es un JSON válido');
    }

    console.log('\n=== Configurando secretos en Cloudflare Workers ===');

    // Configurar el token de administrador
    console.log('Configurando ADMIN_DELETE_TOKEN...');
    execSync(`wrangler secret put ADMIN_DELETE_TOKEN`, {
      input: adminToken,
      cwd: process.cwd(),
      stdio: ['pipe', 'inherit', 'inherit']
    });

    // Configurar la clave de servicio
    console.log('Configurando FIREBASE_SERVICE_ACCOUNT_KEY...');
    execSync(`wrangler secret put FIREBASE_SERVICE_ACCOUNT_KEY`, {
      input: serviceAccountKey,
      cwd: process.cwd(),
      stdio: ['pipe', 'inherit', 'inherit']
    });

    console.log('\n✅ Secretos configurados exitosamente!');
    console.log('\nPara el frontend, agrega estas variables a tu .env:');
    console.log(`REACT_APP_ADMIN_DELETE_TOKEN=${adminToken}`);
    console.log(`REACT_APP_WORKER_URL=https://tu-worker.workers.dev`);

    console.log('\n=== Próximos pasos ===');
    console.log('1. Despliega el worker: npm run deploy');
    console.log('2. Actualiza la URL del worker en tu archivo .env del frontend');
    console.log('3. Prueba la eliminación de usuarios desde el panel de administración');

  } catch (error) {
    console.error('\n❌ Error configurando secretos:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Verificar que wrangler está instalado
try {
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: wrangler CLI no está instalado o no está en el PATH');
  console.log('Instálalo con: npm install -g wrangler');
  process.exit(1);
}

setupAdminSecrets();
