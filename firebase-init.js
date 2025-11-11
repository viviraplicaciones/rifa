/* =========================================================
   firebase-init.js
   Inicialización y exportación de la base de datos.
   ========================================================= */

// Importa las funciones que necesitas de los SDK de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    addDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================================================
// TUS CREDENCIALES (Están correctas)
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
const app = initializeApp(firebaseConfig);

// Exportar la instancia de la base de datos (Firestore)
export const db = getFirestore(app);

// Exportar todas las funciones de Firestore que usaremos
export { 
    collection, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    addDoc,
    writeBatch
};