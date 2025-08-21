// Service Worker de limpieza - se elimina a sí mismo
// Este archivo se ejecuta una vez para limpiar cualquier service worker anterior

console.log('[SW Cleanup] Service Worker de limpieza iniciado');

// Desregistrar este service worker inmediatamente
self.addEventListener('install', function(event) {
  console.log('[SW Cleanup] Instalando SW de limpieza...');
  // Saltamos la espera y activamos inmediatamente
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW Cleanup] Activando SW de limpieza...');
  
  event.waitUntil(
    (async function() {
      try {
        // Limpiar todos los caches
        const cacheNames = await caches.keys();
        console.log('[SW Cleanup] Eliminando caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW Cleanup] Eliminando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );

        console.log('[SW Cleanup] Todos los caches eliminados');

        // Notificar a todos los clientes para recargar
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          console.log('[SW Cleanup] Notificando cliente para recarga');
          client.postMessage({ type: 'SW_CLEANUP_COMPLETE' });
        });

        // Auto-desregistrarse después de la limpieza
        console.log('[SW Cleanup] Iniciando auto-desregistro...');
        
        // Enviar mensaje para desregistrar desde el cliente
        clients.forEach(client => {
          client.postMessage({ type: 'UNREGISTER_SW' });
        });

      } catch (error) {
        console.error('[SW Cleanup] Error durante limpieza:', error);
      }
    })()
  );
});

// Interceptar todas las peticiones y devolver 404 para forzar el fallo
self.addEventListener('fetch', function(event) {
  console.log('[SW Cleanup] Interceptando y rechazando fetch:', event.request.url);
  
  // Para recursos críticos, dejamos que pasen normalmente
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('.js') ||
      event.request.url.includes('.css') ||
      event.request.url.includes('.html')) {
    return; // Permitir que la red maneje estas peticiones
  }
  
  // Para todo lo demás, no interceptar
  return;
});

console.log('[SW Cleanup] Service Worker de limpieza listo');
