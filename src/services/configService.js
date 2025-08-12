/**
 * Servicio para obtener configuración desde Cloudflare Worker
 * Reemplaza la dependencia directa del archivo .env
 */

// URL del Cloudflare Worker - actualiza esto con tu dominio real
const WORKER_URL = process.env.REACT_APP_WORKER_URL || 'https://wpt-config-api.your-account.workers.dev';

// Cache para la configuración
let configCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Obtiene la configuración desde el Cloudflare Worker
 * @returns {Promise<Object>} Configuración de Firebase
 */
export async function getFirebaseConfig() {
  // En desarrollo, usar directamente la configuración local para evitar CORS
  if (process.env.NODE_ENV === 'development') {
    console.log('🔥 Modo desarrollo: usando configuración local');
    return getFallbackConfig();
  }

  // Verificar si tenemos configuración en cache válida
  if (configCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    console.log('🔥 Usando configuración desde cache');
    return configCache;
  }

  try {
    console.log('🌐 Obteniendo configuración desde Cloudflare Worker...');
    
    const response = await fetch(`${WORKER_URL}/firebase-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Incluir el origen para verificación CORS
        'Origin': window.location.origin
      },
      // Incluir credenciales si es necesario
      credentials: 'omit'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Error ${response.status}: ${errorData.error || 'Error desconocido'}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.config) {
      throw new Error('Respuesta inválida del Worker');
    }

    // Validar que tenemos todas las claves necesarias
    const requiredKeys = [
      'apiKey',
      'authDomain', 
      'databaseURL',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];

    const missingKeys = requiredKeys.filter(key => !data.config[key]);
    if (missingKeys.length > 0) {
      throw new Error(`Configuración incompleta. Faltan: ${missingKeys.join(', ')}`);
    }

    // Guardar en cache
    configCache = data.config;
    cacheTimestamp = Date.now();

    console.log('🔥 Configuración obtenida exitosamente desde Worker');
    return configCache;

  } catch (error) {
    console.error('❌ Error obteniendo configuración desde Worker:', error);
    
    // Fallback: intentar usar variables de entorno locales
    console.warn('⚠️ Usando fallback a variables de entorno locales...');
    return getFallbackConfig();
  }
}

/**
 * Configuración de fallback usando variables de entorno locales
 * Solo se usa en desarrollo cuando el Worker no está disponible
 */
function getFallbackConfig() {
  const fallbackConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    baseUrl: process.env.REACT_APP_BASE_URL || 'http://localhost:3000'
  };

  // Verificar que el fallback tiene todas las claves necesarias
  const missingKeys = Object.entries(fallbackConfig)
    .filter(([key, value]) => !value && key !== 'baseUrl')
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Configuración de fallback incompleta. Faltan: ${missingKeys.join(', ')}`);
  }

  console.warn('🔥 Usando configuración de fallback desde .env local');
  return fallbackConfig;
}

/**
 * Verifica el estado del servicio de configuración
 * @returns {Promise<Object>} Estado del servicio
 */
export async function getServiceHealth() {
  try {
    const response = await fetch(`${WORKER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    const data = await response.json();
    return {
      ...data,
      workerUrl: WORKER_URL
    };

  } catch (error) {
    console.error('❌ Error verificando estado del Worker:', error);
    return {
      status: 'error',
      error: error.message,
      workerUrl: WORKER_URL
    };
  }
}

/**
 * Limpia el cache de configuración
 */
export function clearConfigCache() {
  configCache = null;
  cacheTimestamp = null;
  console.log('🗑️ Cache de configuración limpiado');
}
