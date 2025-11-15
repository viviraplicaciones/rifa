/* ===========================script.js (v38 - Delay WhatsApp Admin)=========================== */
// Importar la base de datos (db) y funciones de Firebase
import { 
    db, 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    doc,      
    setDoc    
} from './firebase-init.js';
// Importar funciones de Messaging
import { 
    messaging, 
    getToken, 
    onMessage 
} from './firebase-init.js'; 
// Importar lógica de UI compartida
import { toggleSidebarGlobal, initDarkMode, registerDarkModeHandler } from './common-ui.js';
// Importar lógica de la Rifa
import {
  initRifa,
  renderCuadriculaPublica,
  handleSeleccionPublica,
  actualizarSeleccionPublica,
  handleProcederPago,
  handleGuardarCompraUsuario, // Importamos la función que guarda
  renderCuadriculaAdmin,
  handleFiltroAdmin,
  renderTablaParticipantes, // Importamos el render
  abrirModalRegistro,
  handleGuardarVenta,
  anadirCampoNumero,
  handleBotonSuerte,
  handleBorrarParticipante 
} from './tablas-numericas.js'; 

/* -----------Constante de Notificación--------------------------- */
const VAPID_KEY = 'BLKW4ylTSLBySioHx0AOkYi6xZJPDjmQ1XAJAO8girT-ouIIwvdiAyvLlI6stV3M72dGrjnZ01fdr-YI7MmHSb0'; 

/* -----------Estado Global de la Aplicación----------------------- */
let boletosRifa = [];
let participantes = []; // Mantenemos la lista global de participantes
const PRECIO_BOLETO = 5000; 
let numerosSeleccionadosPublica = [];

/* -----------------------Variables DOM (Caché)---------------------------------- */
let sidebar;
let toggleSidebarGlobalBtn, toggleSidebarMobileBtn, mainContent, navLinks, views,
    toastEl, toastMsg, toastCloseBtn, cuadriculaPublica, listaSeleccionPublica,
    badgeCantidad, subtotalEl, precioNumeroEl, btnProcederPago, switchOcultarComprados,
    cuadriculaAdmin, filtrosAdminContainer, tablaParticipantes, btnRegistrarVentaGlobal,
    modalRegistrarVenta, formRegistrarVenta, camposNumerosDinamicos, btnAnadirNumero,
    listaNumerosModal, btnMasInfo, modalMasInfo, btnModalIrNumeros, modalCloseBtns,
    btnCompartir, btnReportarFallo, modalReportarFallo, formReportarFallo,
    btnAdminLogin, modalAdminLogin, formAdminLogin, adminLinksContainer,
    btnDarkMode, iconDarkMode, slides, currentSlide = 0, slideCount = 0;
let modalIngresarDatos;
let formIngresarDatos;
let btnSuerte;
let modalSuerte;
let modalSuerteNumero;
let imgSuerte;
let toggleNotificaciones;

// --- INICIO REQUERIMIENTO 1 (Modal Pago) ---
let modalConfirmacionPago, listaNumerosConfirmacion, btnEnviarComprobante;
// --- FIN REQUERIMIENTO 1 ---

// --- INICIO REQUERIMIENTO 2 (Filtro) ---
let filtroParticipantesInput;
// --- FIN REQUERIMIENTO 2 ---

// Variables para Modal VivirApp (Req 4)
let btnVivirAppModal, modalVivirApp, iframeVivirApp;

// --- Lightbox de Inicio ---
let lightboxModalInicio, lightboxImageInicio, lightboxCloseInicio, lightboxPrevInicio, lightboxNextInicio;
let sliderImagesData = []; 
let currentLightboxIndex = 0;

/* ========================= Inicialización al cargar el documento=================== */
document.addEventListener('DOMContentLoaded', () => {
  cachearElementosDOM();
  
  initDarkMode(iconDarkMode);  
  initRifa({
    boletosRifa: boletosRifa,
    participantes: participantes,
    PRECIO_BOLETO: PRECIO_BOLETO,
    numerosSeleccionadosPublica: numerosSeleccionadosPublica,
    mostrarToast: mostrarToast,
    // Elementos DOM
    cuadriculaPublica, switchOcultarComprados, listaSeleccionPublica, badgeCantidad,
    subtotalEl, btnProcederPago, precioNumeroEl, cuadriculaAdmin, filtrosAdminContainer,
    tablaParticipantes, modalRegistrarVenta, formRegistrarVenta,
    camposNumerosDinamicos, listaNumerosModal,
    modalIngresarDatos, formIngresarDatos,
    btnSuerte, modalSuerte, modalSuerteNumero,
    imgSuerte
  });
  
  registrarEventListeners();  
  // Corrección Menú PC
  if (window.innerWidth < 768) {
    sidebar?.classList.add('collapsed');
  } else {
    sidebar?.classList.remove('collapsed');
    toggleSidebarGlobalBtn?.classList.remove('left-4', 'md:left-4');
    toggleSidebarGlobalBtn?.classList.add('md:left-[15rem]');
  }
  
  if (sessionStorage.getItem('isAdmin') === 'true') {
    adminLinksContainer?.classList.remove('hidden');
  }
  // Lógica de Deep Linking
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const modalParam = params.get('modal');
  
  let initialView = 'view-inicio';
  if (viewParam && document.getElementById(viewParam)) {
    initialView = viewParam;
  }
  actualizarVistaActiva(initialView, true); 
  
  if (modalParam) {
    if (modalParam === 'admin' && modalAdminLogin) {
      modalAdminLogin.classList.add('flex');
    } else if (modalParam === 'reportar' && modalReportarFallo) {
      modalReportarFallo.classList.add('flex');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }  
  escucharBoletos();
  escucharParticipantes();
  
  // Slider
  slides = document.querySelectorAll('.slider-image');
  slideCount = slides.length;

  sliderImagesData = Array.from(slides).map((img, index) => ({
      src: img.src,
      alt: img.alt,
      originalIndex: index 
  }));

  if (slideCount > 0) {
    slides.forEach((slide, index) => {
      if (index === 0) {
        slide.classList.remove('hidden', 'opacity-0');
      } else {
        slide.classList.add('hidden', 'opacity-0');
      }
    });
    setInterval(() => {
      if (slides[currentSlide]) slides[currentSlide].classList.add('hidden', 'opacity-0');
      currentSlide = (currentSlide + 1) % slideCount;
      if (slides[currentSlide]) slides[currentSlide].classList.remove('hidden', 'opacity-0');
    }, 4000);
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Registrar el SW de CACHÉ (PWA)
      navigator.serviceWorker.register('./sw.js') 
        .then(registration => {
          console.log('Service Worker PWA (Cache) registrado:', registration.scope);
        })
        .catch(error => {
          console.error('Fallo al registrar el Service Worker PWA (Cache):', error);
        });
    });
  }
   
  inicializarEstadoNotificaciones();
});
/* ======================== Datos (Ahora con Firebase)============== */
function escucharBoletos() {
  const q = query(collection(db, "boletos"), orderBy("numero", "asc"));
  onSnapshot(q, (querySnapshot) => {
    const boletosTemporales = [];
    querySnapshot.forEach((doc) => {
      boletosTemporales.push({ id: doc.id, ...doc.data() });
    });
    boletosRifa.length = 0; 
    boletosRifa.push(...boletosTemporales);
    
    renderCuadriculaPublica();
    renderCuadriculaAdmin('todos'); 
    actualizarSeleccionPublica();
    
    const modalLista = document.getElementById('lista-numeros-disponibles-modal');
    if (modalLista && modalRegistrarVenta.classList.contains('flex')) {
        const disponibles = boletosRifa.filter(b => b.estado === 'disponible').map(b => b.numero);
        modalLista.textContent = `Disponibles: ${disponibles.join(', ')}`;
    }
  });
}

function escucharParticipantes() {
  const q = query(collection(db, "participantes"), orderBy("nombre", "asc"));
  onSnapshot(q, (querySnapshot) => {
    const participantesTemporales = [];
    querySnapshot.forEach((doc) => {
      participantesTemporales.push({ id: doc.id, ...doc.data() });
    });
    participantes.length = 0;
    participantes.push(...participantesTemporales);
    
    // --- MODIFICACIÓN REQUERIMIENTO 2 ---
    if (filtroParticipantesInput && filtroParticipantesInput.value.trim() !== '') {
        handleFiltroParticipantes({ target: filtroParticipantesInput }); 
    } else {
        renderTablaParticipantes(); 
    }
    // --- FIN MODIFICACIÓN ---
  });
}
/* ============================== Cacheo de elementos DOM ================ */
function cachearElementosDOM() {
  sidebar = document.getElementById('sidebar');
  toggleSidebarGlobalBtn = document.getElementById('toggle-sidebar-global');
  toggleSidebarMobileBtn = document.getElementById('toggle-sidebar-mobile');
  mainContent = document.getElementById('main-content');
  navLinks = document.querySelectorAll('.nav-link');
  views = document.querySelectorAll('.view');
  toastEl = document.getElementById('toast-notificacion');
  toastMsg = document.getElementById('toast-mensaje');
  toastCloseBtn = document.getElementById('toast-close');
  cuadriculaPublica = document.getElementById('cuadricula-numeros-publica');
  listaSeleccionPublica = document.getElementById('numeros-seleccionados-lista');
  badgeCantidad = document.getElementById('cantidad-seleccionada-badge');
  subtotalEl = document.getElementById('subtotal');
  precioNumeroEl = document.getElementById('precio-numero');
  btnProcederPago = document.getElementById('btn-proceder-pago');
  switchOcultarComprados = document.getElementById('ocultar-comprados');
  cuadriculaAdmin = document.getElementById('cuadricula-numeros-admin');
  filtrosAdminContainer = document.querySelector('#view-rifas-pv .flex-wrap');
  tablaParticipantes = document.getElementById('tabla-participantes-cards');
  btnRegistrarVentaGlobal = document.getElementById('btn-registrar-venta-global');
  modalRegistrarVenta = document.getElementById('modal-registrar-venta');
  formRegistrarVenta = document.getElementById('form-registrar-venta');
  camposNumerosDinamicos = document.getElementById('campos-numeros-dinamicos');
  btnAnadirNumero = document.getElementById('btn-anadir-numero');
  listaNumerosModal = document.getElementById('lista-numeros-disponibles-modal');
  btnMasInfo = document.getElementById('btn-mas-info');
  modalMasInfo = document.getElementById('modal-mas-info');
  btnModalIrNumeros = document.getElementById('btn-modal-ir-numeros');
  modalCloseBtns = document.querySelectorAll('.modal-close');
  btnCompartir = document.getElementById('btn-compartir');
  btnReportarFallo = document.getElementById('btn-reportar-fallo');
  modalReportarFallo = document.getElementById('modal-reportar-fallo');
  formReportarFallo = document.getElementById('form-reportar-fallo');
  btnAdminLogin = document.getElementById('btn-admin-login');
  modalAdminLogin = document.getElementById('modal-admin-login');
  formAdminLogin = document.getElementById('form-admin-login');
  adminLinksContainer = document.getElementById('admin-links-container');
  btnDarkMode = document.getElementById('btn-dark-mode');
  iconDarkMode = document.getElementById('icon-dark-mode');
  
  modalIngresarDatos = document.getElementById('modal-ingresar-datos');
  formIngresarDatos = document.getElementById('form-ingresar-datos');

  btnSuerte = document.getElementById('btn-suerte');
  modalSuerte = document.getElementById('modal-suerte');
  modalSuerteNumero = document.getElementById('modal-suerte-numero');
  imgSuerte = document.getElementById('img-suerte');

  toggleNotificaciones = document.getElementById('toggle-notificaciones');

  lightboxModalInicio = document.getElementById('lightbox-modal-inicio');
  lightboxImageInicio = document.getElementById('lightbox-image-inicio');
  lightboxCloseInicio = document.getElementById('lightbox-close-inicio');
  lightboxPrevInicio = document.getElementById('lightbox-prev-inicio');
  lightboxNextInicio = document.getElementById('lightbox-next-inicio');

  // --- INICIO REQUERIMIENTO 1 (Modal Pago) ---
  modalConfirmacionPago = document.getElementById('modal-confirmacion-pago');
  listaNumerosConfirmacion = document.getElementById('lista-numeros-confirmacion');
  btnEnviarComprobante = document.getElementById('btn-enviar-comprobante');
  // --- FIN REQUERIMIENTO 1 ---

  // --- INICIO REQUERIMIENTO 2 (Filtro) ---
  filtroParticipantesInput = document.getElementById('filtro-participantes');
  // --- FIN REQUERIMIENTO 2 ---

  // --- Variables Modal VivirApp (Req 4) ---
  btnVivirAppModal = document.getElementById('btn-vivirapp-modal');
  modalVivirApp = document.getElementById('modal-vivirapp');
  iframeVivirApp = document.getElementById('iframe-vivirapp');
}
/* ======================Registro de event listeners============= */
function registrarEventListeners() {
  // --- UI Común (Sidebar, DarkMode) ---
  toggleSidebarGlobalBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn, null));
  toggleSidebarMobileBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn, null));
  registerDarkModeHandler(btnDarkMode, iconDarkMode);
  // --- Navegación SPA ---
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const viewId = link.getAttribute('data-view');
      if (viewId) {
        e.preventDefault();
        actualizarVistaActiva(viewId);
        if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('collapsed')) {
          toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn, null);
        }
      }
    });
  });
  // --- Toast ---
  toastCloseBtn?.addEventListener('click', () => {
    toastEl.classList.remove('opacity-100', 'pointer-events-auto');
    toastEl.classList.add('opacity-0', 'pointer-events-none');
  });
  // --- Lógica de Rifa (Eventos delegados a módulos importados) ---
  cuadriculaPublica?.addEventListener('click', handleSeleccionPublica);
  switchOcultarComprados?.addEventListener('change', renderCuadriculaPublica);
    
  // --- Flujo de Pago ---
  btnProcederPago?.addEventListener('click', handleProcederPago);
  
  // --- INICIO REQUERIMIENTO 1 (Modal Pago) ---
  formIngresarDatos?.addEventListener('submit', handleFormularioCompraSubmit);
  // --- FIN REQUERIMIENTO 1 ---

  // --- Botón Suerte ---
  btnSuerte?.addEventListener('click', handleBotonSuerte); 
  // --- ADMIN ---
  filtrosAdminContainer?.addEventListener('click', handleFiltroAdmin);
  btnRegistrarVentaGlobal?.addEventListener('click', () => abrirModalRegistro(null)); 
  formRegistrarVenta?.addEventListener('submit', handleGuardarVenta); 
  btnAnadirNumero?.addEventListener('click', () => anadirCampoNumero(null));
  
  // --- INICIO REQUERIMIENTO 2 (Filtro) ---
  filtroParticipantesInput?.addEventListener('input', handleFiltroParticipantes);
  // --- FIN REQUERIMIENTO 2 ---
  
  tablaParticipantes?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-editar-participante');
    if (editBtn) {
      e.preventDefault();
      e.stopPropagation(); 
      const participanteId = editBtn.dataset.id;
      abrirModalRegistro(participanteId);
      return;
    }

    const deleteBtn = e.target.closest('.btn-borrar-participante');
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation(); 
      const participanteId = deleteBtn.dataset.id;
      handleBorrarParticipante(participanteId); 
      return;
    }

    const header = e.target.closest('.participante-header');
    if (header) {
        const card = header.closest('.participante-card');
        card.classList.toggle('abierto');
    }
  });
  
  // --- Modales (Lógica local) ---
  btnMasInfo?.addEventListener('click', () => modalMasInfo?.classList.add('flex'));
  btnModalIrNumeros?.addEventListener('click', () => {
    modalMasInfo?.classList.remove('flex');
    actualizarVistaActiva('view-comprar-numeros');
  });
  
  btnVivirAppModal?.addEventListener('click', (e) => {
    e.preventDefault();
    if (modalVivirApp && iframeVivirApp) {
        if (iframeVivirApp.src === 'about:blank' || iframeVivirApp.src === '') {
            iframeVivirApp.src = 'vivirapp.html';
        }
        modalVivirApp.classList.remove('hidden'); 
        modalVivirApp.classList.add('flex');
    }
  });
  
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-id');
      const modal = document.getElementById(modalId);
      if(modal) {
          modal.classList.remove('flex');
          if (modalId === 'modal-vivirapp') {
             modal.classList.add('hidden'); 
          }
      }
    });
  });
  
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('flex');
      if (event.target.id === 'modal-vivirapp') {
          event.target.classList.add('hidden');
      }
    }
  });

  // --- Eventos para Lightbox de Inicio ---
  const imageSlider = document.getElementById('image-slider'); 
  imageSlider?.addEventListener('click', (e) => {
    const trigger = e.target.closest('.slider-lightbox-trigger');
    if (trigger) {
      const clickedSrc = trigger.src;
      const index = sliderImagesData.findIndex(item => item.src === clickedSrc);
      
      if (index > -1) {
        showLightboxInicio(index);
      } else {
        showLightboxInicio(currentSlide);
      }
    }
  });

  lightboxCloseInicio?.addEventListener('click', closeLightboxInicio);
  lightboxPrevInicio?.addEventListener('click', () => showLightboxInicio(currentLightboxIndex - 1));
  lightboxNextInicio?.addEventListener('click', () => showLightboxInicio(currentLightboxIndex + 1));
  
  lightboxModalInicio?.addEventListener('click', (e) => {
    if (e.target === lightboxModalInicio) {
      closeLightboxInicio();
    }
  });

  // --- Utilitarios (Compartir, Reportar, Admin) ---
  btnCompartir?.addEventListener('click', (e) => {
    e.preventDefault();
    handleCompartir();
  });
  btnReportarFallo?.addEventListener('click', (e) => {
    e.preventDefault();
    modalReportarFallo?.classList.add('flex');
  });
  formReportarFallo?.addEventListener('submit', (e) => {
    e.preventDefault();
    const body = document.getElementById('reporte-textarea').value;
    const subject = 'Reporte de Fallo - Rifa Navideña';
    const to = 'viviraplicaciones@gmail.com';
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    modalReportarFallo?.classList.remove('flex');
    mostrarToast('Gracias por tu reporte.');
  });
  btnAdminLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!adminLinksContainer?.classList.contains('hidden')) return;
    modalAdminLogin?.classList.add('flex');
  });
  formAdminLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = document.getElementById('admin-password').value;
    if (pass === 'VivirApp2025') {
      sessionStorage.setItem('isAdmin', 'true');
      adminLinksContainer?.classList.remove('hidden');
      modalAdminLogin?.classList.remove('flex');
      mostrarToast('Acceso concedido.');
    } else {
      mostrarToast('Contraseña incorrecta.', true);
    }
    formAdminLogin.reset();
  });
  
  toggleNotificaciones?.addEventListener('change', () => {
    if (toggleNotificaciones.checked) {
      pedirPermisoNotificaciones(); 
    } else {
      console.log('Notificaciones desactivadas por el usuario.');
      mostrarToast('Notificaciones desactivadas.', true);
    }
  });
}

// --- INICIO REQUERIMIENTO 1 (Delay WhatsApp Admin) ---
/**
 * Función intermediaria para manejar el envío del formulario de compra.
 * Llama a 'handleGuardarCompraUsuario' y luego abre el modal de confirmación.
 * Añade un delay de 4s para abrir el WhatsApp del Admin.
 */
async function handleFormularioCompraSubmit(e) {
  e.preventDefault(); // Prevenir envío normal
  
  const resultado = await handleGuardarCompraUsuario(e);

  if (resultado && modalConfirmacionPago) {
    // 1. Poblar la lista de números en el modal de confirmación
    if (listaNumerosConfirmacion) {
      listaNumerosConfirmacion.innerHTML = ''; // Limpiar
      resultado.numeros.forEach(numero => {
        const tiquet = document.createElement('div');
        tiquet.className = "bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-md";
        tiquet.textContent = numero;
        listaNumerosConfirmacion.appendChild(tiquet);
      });
    }

    // 2. Configurar el botón de WhatsApp para el usuario (CON EL NUEVO MENSAJE)
    if (btnEnviarComprobante) {
      // --- INICIO DE LA MODIFICACIÓN (Nuevo Mensaje) ---
      const mensajeUsuario = `¡Hola! ${resultado.nombre} acaba de seleccionar los números ${resultado.numeros.join(', ')}... El pago esta pendiente.`;
      // --- FIN DE LA MODIFICACIÓN ---
      
      const whatsappUrlUsuario = `https://api.whatsapp.com/send?phone=${resultado.telefonoAdmin}&text=${encodeURIComponent(mensajeUsuario)}`;
      btnEnviarComprobante.href = whatsappUrlUsuario;
    }
    
    // 3. Mostrar el modal de confirmación (Inmediatamente)
    modalConfirmacionPago.classList.add('flex');

    // --- MODIFICACIÓN: Se eliminó el bloque completo de setTimeout ---
  }
}
// --- FIN REQUERIMIENTO 1 ---

// --- INICIO REQUERIMIENTO 2 (Filtro) ---
function handleFiltroParticipantes(e) {
    const termino = e.target.value.toLowerCase().trim();

    if (termino === '') {
        renderTablaParticipantes(participantes); 
        return;
    }

    const filtrados = participantes.filter(p => 
        p.nombre.toLowerCase().includes(termino) || 
        p.telefono.includes(termino)
    );

    renderTablaParticipantes(filtrados);
}
// --- FIN REQUERIMIENTO 2 ---


/* ================================LÓGICA DE NOTIFICACIONES (v3 - Corregido para GitHub Pages)================= */

export async function solicitarYObtenerToken() {
  if (VAPID_KEY === 'TU_CLAVE_VAPID_DE_FIREBASE_VA_AQUI' || !VAPID_KEY) {
      console.error("Error: Falta la VAPID_KEY en script.js");
      mostrarToast("Error de configuración de notificaciones.", true);
      return null;
  }

  if (!('Notification' in window) || !messaging || !('serviceWorker' in navigator)) {
    console.warn('Este navegador no soporta notificaciones push.');
    return null;
  }

  let permiso = Notification.permission;
  if (permiso === 'default') {
    permiso = await Notification.requestPermission();
  }

  if (permiso === 'denied') {
    console.log('Permiso de notificación denegado.');
    return null;
  }

  if (permiso === 'granted') {
    try {
      console.log('Registrando Firebase Messaging SW en ./');
      const swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', {
          scope: './' 
      });
      console.log('Firebase Messaging SW registrado:', swRegistration);
      
      const token = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration 
      });
      
      if (token) {
        console.log('Token de FCM obtenido:', token);
        await setDoc(doc(db, "suscripciones", token), {
          token: token,
          timestamp: new Date()
        });
        console.log('Token guardado en /suscripciones');
        
        activarEscuchaMensajesPrimerPlano();
        
        return token;
      } else {
        console.warn('No se pudo obtener el token de FCM.');
        mostrarToast('No se pudo obtener el token de suscripción.', true);
        return null;
      }
    } catch (err) {
      console.error('Error al obtener el token o guardarlo:', err);
      mostrarToast('Error al suscribirse a notificaciones.', true);
      return null;
    }
  }
  
  return null; 
}


function inicializarEstadoNotificaciones() {
  if (!('Notification' in window) || !messaging) {
    console.warn('Este navegador no soporta notificaciones push.');
    toggleNotificaciones?.parentElement.parentElement.classList.add('hidden'); 
    return;
  }

  if (Notification.permission === 'granted') {
    toggleNotificaciones.checked = true; 
    activarEscuchaMensajesPrimerPlano();
  } else {
    toggleNotificaciones.checked = false; 
  }
}

async function pedirPermisoNotificaciones() {
  const token = await solicitarYObtenerToken(); 
  
  if (token) {
    mostrarToast('¡Notificaciones activadas!');
    toggleNotificaciones.checked = true;
  } else {
    mostrarToast('No se pudo activar las notificaciones.', true);
    toggleNotificaciones.checked = false;
  }
}

function activarEscuchaMensajesPrimerPlano() {
    if (activarEscuchaMensajesPrimerPlano.listenerAttached) return;
    
    onMessage(messaging, (payload) => {
        console.log('Mensaje recibido en primer plano: ', payload);
        const mensaje = payload.notification.body || '¡Hay novedades en la rifa!';
        mostrarToast(mensaje, false); 
    });
    activarEscuchaMensajesPrimerPlano.listenerAttached = true;
}

/* =========Funciones UI: (Vistas, Toast, Compartir)======= */
function actualizarVistaActiva(viewId, isInitialLoad = false) {
  if (mainContent && !isInitialLoad) mainContent.scrollTop = 0;
  
  views.forEach(view => view.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');

  navLinks.forEach(link => {
    link.classList.remove('active', 'bg-fuchsia-600');
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active', 'bg-fuchsia-600');
    }
  });

  if (viewId === 'view-comprar-numeros') {
    btnSuerte?.classList.remove('hidden');
    setTimeout(() => {
        btnSuerte?.classList.remove('translate-y-1/2');
        btnSuerte?.classList.add('-translate-y-1/2', 'hover:-translate-y-[55%]');
    }, 50);
  } else {
    btnSuerte?.classList.add('hidden', 'translate-y-1/2');
    btnSuerte?.classList.remove('-translate-y-1/2', 'hover:-translate-y-[55%]');
  }
}

function mostrarToast(mensaje, esError = false) {
  if (!toastEl || !toastMsg) return;

  toastMsg.textContent = mensaje;
  const iconContainer = toastEl.querySelector('.inline-flex');
  const icon = iconContainer?.querySelector('i');

  iconContainer?.classList.remove('text-lime-500', 'bg-lime-100', 'text-red-500', 'bg-red-100');
  icon?.classList.remove('fa-check', 'fa-triangle-exclamation');

  if (esError) {
    iconContainer?.classList.add('text-red-500', 'bg-red-100');
    icon?.classList.add('fa-solid', 'fa-triangle-exclamation');
  } else {
    iconContainer?.classList.add('text-lime-500', 'bg-lime-100');
    icon?.classList.add('fa-solid', 'fa-check');
  }

  toastEl.classList.remove('opacity-0', 'pointer-events-none');
  toastEl.classList.add('opacity-100', 'pointer-events-auto');
  
  setTimeout(() => { 
    toastEl.classList.remove('opacity-100', 'pointer-events-auto');
    toastEl.classList.add('opacity-0', 'pointer-events-none');
  }, 2000);
}

async function handleCompartir() {
  const shareData = {
      title: 'Fabulosa Rifa de Navidad',
      text: '¡Participa en esta increíble rifa y gánate 9 adornos navideños Amigurumi!',
      url: window.location.href.split('?')[0] // URL limpia
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      mostrarToast('¡Gracias por compartir!');
    } else {
      throw new Error('Web Share API no soportada');
    }
  } catch (err) {
    console.log('Error al compartir o API no soportada:', err);
    navigator.clipboard.writeText(shareData.url);
    mostrarToast('Enlace copiado al portapapeles.');
  }
}

// --- Lógica del Lightbox de Inicio ---
function showLightboxInicio(index) {
  if (!lightboxModalInicio || !lightboxImageInicio || !lightboxPrevInicio || !lightboxNextInicio || sliderImagesData.length === 0) return;
  
  if (index < 0 || index >= sliderImagesData.length) {
    console.warn("Índice de Lightbox de Inicio fuera de rango:", index);
    return;
  }
  
  currentLightboxIndex = index;
  const item = sliderImagesData[index];
  
  lightboxImageInicio.src = item.src;
  lightboxImageInicio.alt = item.alt;
  
  lightboxModalInicio.classList.remove('hidden');
  
  lightboxPrevInicio.style.display = (index === 0) ? 'none' : 'flex';
  lightboxNextInicio.style.display = (index === sliderImagesData.length - 1) ? 'none' : 'flex';
}

function closeLightboxInicio() {
  if (!lightboxModalInicio) return;
  lightboxModalInicio.classList.add('hidden');
  lightboxImageInicio.src = ""; // Limpiar
}

/* =========================================================
   Estilo dinámico (Función sin cambios)
   ========================================================= */
(function insertarEstiloFiltroAdmin() {
  const style = document.createElement('style');
  style.innerHTML = `
    .filtro-btn-admin {padding: 0.5rem 1.25rem;border-radius: 0.75rem;font-weight: 600;transition: all 0.2s;border: 2px solid transparent;}
    .filtro-btn-admin[data-filtro="todos"] { border-color: #6B7280; color: #374151; }
    .filtro-btn-admin[data-filtro="disponible"] { border-color: #D1D5DB; color: #374151; }
    .filtro-btn-admin[data-filtro="apartado"] { border-color: #3B82F6; color: #3B82F6; }
    .filtro-btn-admin[data-filtro="revisando"] { border-color: #F59E0B; color: #F59E0B; }
    .filtro-btn-admin[data-filtro="pagado"] { border-color: #EF4444; color: #EF4444; }
    .filtro-btn-admin.filtro-btn-admin-activo, .filtro-btn-admin:hover {color: white !important;}
    .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="todos"], .filtro-btn-admin:hover[data-filtro="todos"] { background-color: #6B7280; }
    .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="disponible"], .filtro-btn-admin:hover[data-filtro="disponible"] { background-color: #9CA3AF; }
    .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="apartado"], .filtro-btn-admin:hover[data-filtro="apartado"] { background-color: #3B82F6; }
    .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="revisando"], .filtro-btn-admin:hover[data-filtro="revisando"] { background-color: #F59E0B; }
    .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="pagado"], .filtro-btn-admin:hover[data-filtro="pagado"] { background-color: #EF4444; }

    /* Estilos para modo oscuro en filtros */
    .dark .filtro-btn-admin[data-filtro="todos"] { border-color: #9CA3AF; color: #E5E7EB; }
    .dark .filtro-btn-admin[data-filtro="disponible"] { border-color: #4B5563; color: #D1D5DB; }
    .dark .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="todos"], .dark .filtro-btn-admin:hover[data-filtro="todos"] { background-color: #9CA3AF; color: white !important; }
    .dark .filtro-btn-admin.filtro-btn-admin-activo[data-filtro="disponible"], .dark .filtro-btn-admin:hover[data-filtro="disponible"] { background-color: #6B7280; color: white !importa; }
  `;
  document.head.appendChild(style);
})();