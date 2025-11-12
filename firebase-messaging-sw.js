/* =========================================================
   firebase-messaging-sw.js
   Service Worker dedicado para Firebase Cloud Messaging.
   Maneja notificaciones en segundo plano.
   ========================================================= */

// Importar scripts de Firebase
// OJO: La versión debe coincidir con la de tus otros archivos (10.12.2)
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// =========================================================
// TU MISMA CONFIGURACIÓN DE 'firebase-init.js'
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDQxf7pZpe2st6wrJsVV6Q9EBW2PxWf6o4",
  authDomain: "rifanavidad-344f0.firebaseapp.com",
  projectId: "rifanavidad-344f0",
  storageBucket: "rifanavidad-344f0.firebasestorage.app",
  messagingSenderId: "719709518329",
  appId: "1:719709518329:web:e84990017306fecb416528",
  measurementId: "G-E1XWBTJ00R"
};
// =========================================================

// Inicializar Firebase (usando la API de compatibilidad para SW)
firebase.initializeApp(firebaseConfig);

// Obtener la instancia de mensajería
const messaging = firebase.messaging();

// Manejador de mensajes en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);

  // Personaliza el título y cuerpo de la notificación
  const notificationTitle = payload.notification.title || 'Rifa Navideña';
  const notificationOptions = {
    body: payload.notification.body || '¡Hay novedades sobre la rifa!',
    icon: payload.notification.icon || './images/logo.png', // Tu logo
    // Puedes añadir más opciones aquí (vibración, acciones, etc.)
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});