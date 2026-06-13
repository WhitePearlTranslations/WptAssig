/**
 * Wrappers traced para operaciones de Firebase
 * Crea child spans automáticamente para todas las operaciones
 */

import { ref, get, set, update, remove, push, onValue, off } from 'firebase/database';
import { traceFirebaseOperation } from './observability';

/**
 * get() con tracing
 */
export async function tracedGet(database, path) {
  return traceFirebaseOperation(
    'get',
    async () => {
      const dbRef = ref(database, path);
      const snapshot = await get(dbRef);
      return snapshot;
    },
    {
      'db.path': path,
      'db.method': 'get',
    }
  );
}

/**
 * set() con tracing
 */
export async function tracedSet(database, path, data) {
  return traceFirebaseOperation(
    'set',
    async () => {
      const dbRef = ref(database, path);
      await set(dbRef, data);
    },
    {
      'db.path': path,
      'db.method': 'set',
      'db.data_size': JSON.stringify(data).length,
    }
  );
}

/**
 * update() con tracing
 */
export async function tracedUpdate(database, path, updates) {
  return traceFirebaseOperation(
    'update',
    async () => {
      const dbRef = ref(database, path);
      await update(dbRef, updates);
    },
    {
      'db.path': path,
      'db.method': 'update',
      'db.update_keys': Object.keys(updates).length,
    }
  );
}

/**
 * remove() con tracing
 */
export async function tracedRemove(database, path) {
  return traceFirebaseOperation(
    'remove',
    async () => {
      const dbRef = ref(database, path);
      await remove(dbRef);
    },
    {
      'db.path': path,
      'db.method': 'remove',
    }
  );
}

/**
 * push() con tracing
 */
export async function tracedPush(database, path, data) {
  return traceFirebaseOperation(
    'push',
    async () => {
      const dbRef = ref(database, path);
      const newRef = push(dbRef);
      await set(newRef, data);
      return newRef;
    },
    {
      'db.path': path,
      'db.method': 'push',
      'db.data_size': JSON.stringify(data).length,
    }
  );
}

/**
 * onValue() con tracing (para listeners en tiempo real)
 * Nota: El span se crea al suscribirse, eventos posteriores no crean spans
 */
export function tracedOnValue(database, path, callback, errorCallback) {
  const span = require('./observability').createSpan('firebase.onValue', {
    'db.path': path,
    'db.method': 'onValue',
    'db.listener': 'realtime',
  });

  const dbRef = ref(database, path);
  
  const wrappedCallback = (snapshot) => {
    if (span) {
      span.addEvent('data_received', {
        'db.snapshot_size': snapshot.size || 0,
        'db.has_data': snapshot.exists(),
      });
    }
    callback(snapshot);
  };

  const wrappedErrorCallback = (error) => {
    if (span) {
      span.setStatus(2, error.message);
      span.end({
        'error.message': error.message,
        'error.code': error.code,
      });
    }
    if (errorCallback) errorCallback(error);
  };

  onValue(dbRef, wrappedCallback, wrappedErrorCallback);

  // Retornar función para limpiar
  return () => {
    off(dbRef);
    if (span) {
      span.end({ 'listener.detached': true });
    }
  };
}

// Exportar también las funciones originales por si se necesitan
export { ref, get, set, update, remove, push, onValue, off };
