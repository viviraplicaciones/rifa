/* =========================================================
   sw.js (Service Worker)
   ========================================================= */

// El nombre de nuestro caché. Cambia 'v1' a 'v2' si actualizas los archivos.
const CACHE_NAME = 'rifa-navidena-v1';

// Todos los archivos que la PWA necesita para funcionar offline.
const FILES_TO_CACHE = [
  '/', // La raíz del sitio
  'index.html',
  'index_01.html',
  'manifest.json',
  
  // Scripts
  'script.js',
  'tablas-numericas.js',
  'firebase-init.js',
  'common-ui.js',
  
  // Estilos
  'style.css',
  
  // Imágenes principales
  'logo.png',
  'icono.jpg',
  'banner.jpg',
  'dado.png',
  'dado.gif',
  'vivirapp.png',
  
  // Imágenes de la Rifa (Slider)
  '01.jpg',
  '02.jpg',
  '03.jpg',
  '04.jpg',
  '05.jpg',
  
  // Archivos externos (CDN)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

/**
 * Evento 'install': Se dispara cuando el Service Worker se instala por primera vez.
 * Aquí es donde "descargamos" todos los archivos al caché.
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Abriendo caché y guardando archivos principales.');
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(err => {
        console.error('[ServiceWorker] Falló el cacheo de archivos:', err);
      })
  );
  
  self.skipWaiting();
});

/**
 * Evento 'activate': Se dispara después de la instalación.
 * Aquí limpiamos cachés antiguos si hemos actualizado la versión (ej. de 'v1' a 'v2').
 */
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
  return self.clients.claim();
});

/**
 * Evento 'fetch': Se dispara CADA VEZ que la app pide un recurso (un script, una imagen, etc.)
 * Aquí interceptamos la petición y servimos desde el caché si es posible.
 */
self.addEventListener('fetch', (event) => {
  // Solo nos interesan las peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia: "Cache, falling back to Network"
  // (Intenta buscar en caché primero, si no, va a la red)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        
        if (response) {
          // ¡Encontrado en caché! Servir desde el caché.
          // console.log(`[ServiceWorker] Sirviendo desde caché: ${event.request.url}`);
          return response;
        }

        // No está en caché. Ir a la red.
        // console.log(`[ServiceWorker] Buscando en red: ${event.request.url}`);
        return fetch(event.request)
          .then((networkResponse) => {
            
            // Si la respuesta de red es válida, la guardamos en caché para la próxima vez
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          });
      })
      .catch((error) => {
        // Si falla (ej. sin conexión y no está en caché), simplemente falla.
        console.warn(`[ServiceWorker] Fallo en fetch: ${event.request.url}`, error);
        // Opcionalmente, aquí podríamos mostrar una página "offline" genérica.
      })
  );
});