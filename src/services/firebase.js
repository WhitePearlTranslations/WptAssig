import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirebaseConfig } from './configService';

// Variables globales para Firebase
let app = null;
let realtimeDb = null;
let db = null;
let auth = null;
let storage = null;
let initializationPromise = null;
let isInitialized = false;

/**
 * Inicializa Firebase usando fallback a .env si Worker no está disponible
 * @returns {Promise<Object>} Servicios de Firebase inicializados
 */
async function initializeFirebaseAsync() {
  try {
    console.log('🔥 Inicializando Firebase...');
    
    let firebaseConfig;
    let configSource = 'unknown';
    
    try {
      // Intentar obtener configuración desde Cloudflare Worker
      firebaseConfig = await getFirebaseConfig();
      configSource = 'Cloudflare Worker';
    } catch (workerError) {
      console.warn('⚠️ Worker no disponible, usando configuración local:', workerError.message);
      
      // Fallback a configuración local desde .env
      firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      };
      configSource = 'Local .env';
      
      // Validar configuración local
      const missingKeys = Object.entries(firebaseConfig)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingKeys.length > 0) {
        throw new Error(`Configuración local incompleta. Faltan: ${missingKeys.join(', ')}`);
      }
    }
    
    // Inicializar Firebase con la configuración obtenida
    app = initializeApp(firebaseConfig);
    
    // Inicializar servicios de Firebase
    realtimeDb = getDatabase(app);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    
    isInitialized = true;
    
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 Firebase configurado correctamente:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        databaseURL: firebaseConfig.databaseURL,
        source: configSource
      });
    }
    
    return { app, realtimeDb, db, auth, storage };
    
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    throw new Error(`Error de inicialización de Firebase: ${error.message}`);
  }
}

/**
 * Obtiene o inicializa Firebase si no está ya inicializado
 * @returns {Promise<Object>} Servicios de Firebase
 */
export async function getFirebaseServices() {
  if (!initializationPromise) {
    initializationPromise = initializeFirebaseAsync();
  }
  
  return await initializationPromise;
}

// Funciones para obtener servicios individuales de forma asíncrona
export async function getRealtimeDb() {
  const services = await getFirebaseServices();
  return services.realtimeDb;
}

export async function getFirestoreDb() {
  const services = await getFirebaseServices();
  return services.db;
}

export async function getFirebaseAuth() {
  const services = await getFirebaseServices();
  return services.auth;
}

export async function getFirebaseStorage() {
  const services = await getFirebaseServices();
  return services.storage;
}

export async function getFirebaseApp() {
  const services = await getFirebaseServices();
  return services.app;
}

// Funciones síncronas que devuelven los servicios si están disponibles
// o null si aún no se han inicializado
export function getRealtimeDbSync() {
  return realtimeDb;
}

export function getFirestoreDbSync() {
  return db;
}

export function getFirebaseAuthSync() {
  return auth;
}

export function getFirebaseStorageSync() {
  return storage;
}

export function getFirebaseAppSync() {
  return app;
}

export function isFirebaseInitialized() {
  return isInitialized;
}

// Exportaciones síncronas para compatibilidad con código existente
// NOTA: Estas pueden ser null hasta que Firebase esté inicializado
export { realtimeDb, db, auth, storage };
export default app;

// Inicializar Firebase automáticamente al importar el módulo
initializeFirebaseAsync().catch(error => {
  console.error('❌ Error en inicialización automática de Firebase:', error);
});
