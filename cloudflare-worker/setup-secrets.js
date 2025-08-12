const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Leer el archivo .env del proyecto principal
const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env en la raíz del proyecto');
  console.error('   Asegúrate de que existe: ' + path.resolve(envPath));
  process.exit(1);
}

console.log('📖 Leyendo configuración desde .env...');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parsear variables de entorno
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Variables que necesitamos configurar como secretos en Cloudflare
const requiredSecrets = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_DATABASE_URL',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'REACT_APP_BASE_URL'
];

console.log('🔐 Configurando secretos en Cloudflare Worker...');
console.log('   (Necesitarás estar autenticado con wrangler)');
console.log('');

// Verificar que tenemos todas las variables necesarias
const missingVars = requiredSecrets.filter(varName => !envVars[varName]);
if (missingVars.length > 0) {
  console.error('❌ Faltan las siguientes variables en el .env:');
  missingVars.forEach(varName => console.error('   - ' + varName));
  process.exit(1);
}

// Configurar cada secreto
let successCount = 0;
let errorCount = 0;

for (const varName of requiredSecrets) {
  try {
    const value = envVars[varName];
    console.log(`🔑 Configurando ${varName}...`);
    
    // Ejecutar wrangler secret put
    execSync(`wrangler secret put ${varName}`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: __dirname
    });
    
    successCount++;
  } catch (error) {
    console.error(`❌ Error configurando ${varName}:`, error.message);
    errorCount++;
  }
}

console.log('');
console.log('📊 Resumen:');
console.log(`   ✅ Secretos configurados exitosamente: ${successCount}`);
if (errorCount > 0) {
  console.log(`   ❌ Errores: ${errorCount}`);
}
console.log('');

if (errorCount === 0) {
  console.log('🎉 ¡Todos los secretos se configuraron correctamente!');
  console.log('');
  console.log('Próximos pasos:');
  console.log('1. Ejecuta: npm run deploy');
  console.log('2. Actualiza tu aplicación React para usar el Worker');
  console.log('3. Prueba que todo funcione correctamente');
} else {
  console.log('⚠️  Algunos secretos no se pudieron configurar.');
  console.log('   Revisa los errores anteriores y vuelve a intentarlo.');
}

console.log('');
console.log('💡 Comandos útiles:');
console.log('   - Ver secretos: wrangler secret list');
console.log('   - Eliminar secreto: wrangler secret delete <NOMBRE>');
console.log('   - Desplegar: wrangler deploy');
