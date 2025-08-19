// Service Worker eliminado - devolver error 404
// Este archivo existe solo para que el navegador entienda que el SW ya no está disponible

console.log('❌ Service Worker eliminado - devolviendo 404');

// Responder con 404 para todas las peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(new Response('Service Worker no disponible', {
    status: 404,
    statusText: 'Not Found'
  }));
});

// No hacer nada en install
self.addEventListener('install', (event) => {
  console.log('❌ SW: Install - pero será desregistrado');
});

// No hacer nada en activate  
self.addEventListener('activate', (event) => {
  console.log('❌ SW: Activate - pero será desregistrado');
});
