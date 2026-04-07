/* =======================sw.js (v3 - Auto-Update Force)================== */
// INCREMENTA ESTA VERSIÓN CADA VEZ QUE SUBAS CAMBIOS (v3, v4, v5...)
const CACHE_NAME = 'rifa-navidena-v3';

// Archivos esenciales para el funcionamiento offline
const FILES_TO_CACHE = [
  './', 
  './index.html',
  './index_01.html',
  './manifest.json',
  // Scripts
  './script.js',
  './tablas-numericas.js',
  './firebase-init.js',
  './common-ui.js',
  // Estilos
  './style.css',
  // Imágenes principales
  './images/logo.png',
  './images/icono.jpg',
  './images/banner.jpg',
  './images/dado.png',
  './images/dado.gif',
  './images/vivirapp.png',
  // Imágenes del slider
  './images/01.jpg',
  './images/02.jpg',
  './images/03.jpg',
  './images/04.jpg',
  './images/05.jpg'
];

/* ======================Evento: install=========================== */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando v3...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Almacenando archivos en caché...');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(err => console.error('[ServiceWorker] Error en instalación:', err))
  );
  // Fuerza al Service Worker recién instalado a convertirse en el activo
  self.skipWaiting();
});

/* =========================Evento: activate======================= */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activando y reclamando clientes...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Eliminando caché antiguo:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Permite que el SW controle las pestañas abiertas inmediatamente
  self.clients.claim();
});

/* =======================Evento: fetch=============================== */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna desde caché si existe
        if (response) return response;
        
        // Si no está en caché, va a la red
        return fetch(event.request)
          .then((networkResponse) => {
            // No cacheamos respuestas que no sean exitosas o sean de otras fuentes (APIs externas)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.warn('[ServiceWorker] Error al obtener recurso:', event.request.url, error);
          });
      })
  );
});