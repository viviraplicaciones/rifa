/* =========================================================
   functions/index.js
   VERSIÓN CORREGIDA 2 (Payload de Notificación Arreglado)
   ========================================================= */

// Importar las herramientas necesarias
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

// Inicializar la app de "administrador"
initializeApp();

/**
 * Esta es tu Cloud Function.
 * Se activa CADA VEZ que un documento de "participantes" es ACTUALIZADO.
 */
exports.notificarPagoAprobado = onDocumentUpdated("/participantes/{participanteId}", async (event) => {

  // Si no hay datos en el evento, no hacer nada.
  if (!event.data) {
    console.log("No hay datos en el evento.");
    return;
  }

  // Obtener los datos del participante ANTES y DESPUÉS del cambio
  const datosAntes = event.data.before.data();
  const datosDespues = event.data.after.data();

  // --- Condición de Seguridad ---
  // Solo nos interesa si el estado CAMBIÓ y si el NUEVO estado es "pagado"
  if (datosAntes.estado === "pagado" || datosDespues.estado !== "pagado") {
    console.log(`Estado no cambió a 'pagado'. Estado anterior: ${datosAntes.estado}, Nuevo estado: ${datosDespues.estado}`);
    return; // Salir de la función
  }

  // --- ¡Condición cumplida! El estado cambió a "pagado" ---
  console.log(`¡Pago aprobado para ${datosDespues.nombre}! Preparando notificación.`);

  // 1. Obtener el token de notificación del participante
  const fcmToken = datosDespues.fcmToken;

  // 2. Verificar si el participante tiene un token guardado
  if (!fcmToken) {
    console.log("El participante no tiene un token FCM guardado. No se puede notificar.");
    return; // Salir
  }

  // 3. Preparar el mensaje
  const nombreParticipante = datosDespues.nombre || "Participante";
  const numerosTexto = datosDespues.numeros.join(', ');

  // --- INICIO CÓDIGO CORREGIDO ---
  // El 'icon' se mueve a 'webpush' para que sea un payload válido.
  const payload = {
    notification: {
      title: "¡Felicidades, tu pago fue aprobado! 🥳",
      body: `¡Hola, ${nombreParticipante}! Tus números ${numerosTexto} ya están participando oficialmente. ¡Mucha suerte!`
    },
    webpush: {
      notification: {
        icon: "https://viviraplicaciones.github.io/rifa/images/logo.png" // Ícono para la notificación
      }
    }
  };
  // --- FIN CÓDIGO CORREGIDO ---

  // 4. Enviar la notificación a ese token específico
  try {
    console.log(`Enviando notificación a: ${fcmToken}`);
    
    // --- INICIO CÓDIGO CORREGIDO ---
    // Se envía el payload completo (...payload) en lugar de solo payload.notification
    await getMessaging().send({
      token: fcmToken,
      ...payload
    });
    // --- FIN CÓDIGO CORREGIDO ---

    console.log("¡Notificación enviada con éxito!");
    return;

  } catch (error) {
    console.error("Error al enviar la notificación:", error);
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log("Token inválido.");
    }
    return;
  }
});