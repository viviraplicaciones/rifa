/* =======================sw.js (Service Worker - versión corregida para GitHub Pages)================== */
// Cambia la versión cuando actualices archivos (v2, v3, etc.)
const CACHE_NAME = 'rifa-navidena-v2';
// Archivos esenciales para el funcionamiento offline
const FILES_TO_CACHE = [
  './', // la raíz del proyecto (./ en lugar de /)
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
  console.log('[ServiceWorker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Archivos almacenados en caché');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(err => console.error('[ServiceWorker] Error en instalación:', err))
  );
  self.skipWaiting();
});
/* =========================Evento: activate======================= */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activando...');
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
  self.clients.claim();
});
/* =======================Evento: fetch=============================== */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) return response;
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('[ServiceWorker] Error al obtener recurso:', event.request.url, error);
          });
      })
  );
});