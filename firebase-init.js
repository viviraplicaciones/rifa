/* =========================================================
   firebase-init.js
   Inicialización y exportación de la base de datos.
   (Versión Modular v11+ Optimizada y Estable)
   ========================================================= */

// Importaciones modulares directas (más ligeras y modernas)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    addDoc,
    writeBatch,
    setDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { 
    getMessaging, 
    getToken, 
    onMessage 
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js"; 

// =========================================================
// TUS CREDENCIALES
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

// Inicializar Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase (v11) inicializado correctamente.");
} catch (error) {
    console.error("Error crítico al inicializar Firebase:", error);
}

// Exportar la instancia de la base de datos (Firestore)
export const db = getFirestore(app);

// Exportar la instancia de mensajería (Messaging)
// Nota: getMessaging puede fallar en entornos sin Service Worker o incógnito
let messagingInstance;
try {
    messagingInstance = getMessaging(app);
} catch (e) {
    console.warn("Messaging no soportado en este entorno:", e);
    messagingInstance = null;
}
export const messaging = messagingInstance;

// Exportar todas las funciones de Firestore que usaremos
export { 
    collection, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    addDoc,
    writeBatch,
    setDoc,
    updateDoc,
    deleteDoc
};

// Exportar todas las funciones de Messaging que usaremos
export {
    getToken,
    onMessage
};
