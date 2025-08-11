import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
export const realtimeDb = getDatabase(app);  // Realtime Database
export const db = getFirestore(app);         // Firestore Database
export const auth = getAuth(app);
export const storage = getStorage(app);      // Firebase Storage

// Exportar configuración para debugging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase configurado correctamente:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL
  });
}

export default app;
