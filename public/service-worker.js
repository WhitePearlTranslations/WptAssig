// Service Worker para notificaciones push
// Permite que las notificaciones funcionen incluso cuando la página está cerrada

const CACHE_NAME = 'wpt-notifications-v1';
const API_CACHE_NAME = 'wpt-api-cache-v1';

// URLs que queremos cachear para funcionamiento offline
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Activar inmediatamente este SW
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Eliminando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim()
    ])
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }

        // Si no, hacer petición de red
        return fetch(event.request)
          .then((response) => {
            // Verificar si es una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            // Cachear la respuesta
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla la petición, intentar servir desde cache
            return caches.match('/') || new Response('Offline');
          });
      })
  );
});

// Manejar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'CHECK_ASSIGNMENTS':
        checkForNewAssignments(event.data.userId);
        break;
      case 'UPDATE_USER_DATA':
        // Actualizar datos del usuario en indexedDB
        updateUserData(event.data.userData);
        break;
    }
  }
});

// Manejar notificaciones push del servidor
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Datos del push:', data);

    event.waitUntil(
      showNotification(data)
    );
  } catch (error) {
    console.error('[SW] Error procesando push:', error);
  }
});

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Click en notificación:', event);
  
  // Cerrar la notificación
  event.notification.close();

  const data = event.notification.data || {};
  const url = data.url || '/dashboard';

  event.waitUntil(
    // Buscar si hay una ventana abierta
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si hay una ventana abierta, enfocarla y navegar
        for (let client of clientList) {
          if (client.url.includes(self.registration.scope)) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: url,
              data: data
            });
            return;
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        return clients.openWindow(url);
      })
  );
});

// Función para mostrar notificaciones
async function showNotification(data) {
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'wpt-notification',
    requireInteraction: data.requireInteraction || true,
    actions: data.actions || [
      {
        action: 'view',
        title: 'Ver',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Descartar'
      }
    ],
    data: data.data || {}
  };

  return self.registration.showNotification(
    data.title || 'WPT Notificación',
    options
  );
}

// Verificar nuevas asignaciones periódicamente (background sync)
async function checkForNewAssignments(userId) {
  try {
    // Obtener datos almacenados del usuario
    const userData = await getUserData();
    if (!userData || !userData.lastCheck) {
      return;
    }

    // Simular verificación de nuevas asignaciones
    // En una implementación real, esto haría una petición a la API
    console.log('[SW] Verificando nuevas asignaciones para usuario:', userId);
    
    // Por ahora, esto es un placeholder
    // TODO: Implementar lógica real de verificación
    
  } catch (error) {
    console.error('[SW] Error verificando asignaciones:', error);
  }
}

// Almacenar datos del usuario usando IndexedDB
async function updateUserData(userData) {
  try {
    const request = indexedDB.open('WPTUserData', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['userData'], 'readwrite');
      const store = transaction.objectStore('userData');
      
      store.put({
        id: 'current',
        ...userData,
        lastUpdated: new Date().toISOString()
      });
    };
  } catch (error) {
    console.error('[SW] Error actualizando datos de usuario:', error);
  }
}

// Obtener datos del usuario desde IndexedDB
async function getUserData() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open('WPTUserData', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['userData'], 'readonly');
        const store = transaction.objectStore('userData');
        const getRequest = store.get('current');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };
        
        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Background sync para verificar datos periódicamente
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'check-assignments') {
    event.waitUntil(
      getUserData()
        .then((userData) => {
          if (userData && userData.userId) {
            return checkForNewAssignments(userData.userId);
          }
        })
        .catch((error) => {
          console.error('[SW] Error en background sync:', error);
        })
    );
  }
});

console.log('[SW] Service Worker cargado y configurado');
