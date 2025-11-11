// Importar el SDK de Firebase Admin
const admin = require('firebase-admin');

// Inicializar Firebase con las credenciales de tu proyecto
admin.initializeApp({
  credential: admin.credential.cert('./rifanavidad-344f0-firebase-adminsdk-fbsvc-12ff6efad8.json'),  // Reemplaza con la ruta a tu archivo JSON
  databaseURL: 'https://console.firebase.google.com/project/rifanavidad-344f0/overview',  // Reemplaza con el URL de tu proyecto
});

// Obtener la referencia a Firestore
const db = admin.firestore();

// Función para crear los 100 documentos en la colección 'boletos'
async function crearBoletos() {
  const coleccionBoletos = db.collection('boletos');

  for (let i = 0; i < 100; i++) {
    const idDocumento = String(i).padStart(2, '0');  // Asegurarse de que el ID tenga dos cifras
    const docRef = coleccionBoletos.doc(idDocumento);

    // Crear el documento con los campos que mencionaste
    await docRef.set({
      numero: idDocumento,  // El campo 'numero' será igual al ID
      estado: 'disponible',  // El campo 'estado' se inicializa como 'disponible'
      participanteId: 'vacio',  // El campo 'participanteId' se inicializa como 'vacio'
    });

    console.log(`Documento ${idDocumento} creado.`);
  }

  console.log('Todos los boletos han sido creados.');
}

// Llamar a la función
crearBoletos().catch((error) => console.error('Error al crear los boletos:', error));
