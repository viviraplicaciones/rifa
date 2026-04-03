/* ===========================script.js (v40 - Tema Radical & Madres Update)=========================== */
import { 
    db, 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    doc,      
    setDoc    
} from './firebase-init.js';
import { 
    messaging, 
    getToken, 
    onMessage 
} from './firebase-init.js'; 
import { toggleSidebarGlobal, initDarkMode, registerDarkModeHandler } from './common-ui.js';
import {
  initRifa,
  renderCuadriculaPublica,
  handleSeleccionPublica,
  actualizarSeleccionPublica,
  handleProcederPago,
  handleGuardarCompraUsuario, 
  renderCuadriculaAdmin,
  handleFiltroAdmin,
  renderTablaParticipantes, 
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
let participantes = []; 
const PRECIO_BOLETO = 10000; // Actualizado a 10.000
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
let modalIngresarDatos, formIngresarDatos, btnSuerte, modalSuerte, modalSuerteNumero, imgSuerte, toggleNotificaciones;
let btnVerVideo, modalVideoDemo, videoPlayerDemo;
let btnToggleMusic, iconMusicMode, backgroundMusic;
let modalConfirmacionPago, listaNumerosConfirmacion, btnEnviarComprobante;
let filtroParticipantesInput;
let btnVivirAppModal, modalVivirApp, iframeVivirApp;
let lightboxModalInicio, lightboxImageInicio, lightboxCloseInicio, lightboxPrevInicio, lightboxNextInicio;
let sliderImagesData = []; 
let currentLightboxIndex = 0;

/* ========================= Inicialización =================== */
document.addEventListener('DOMContentLoaded', () => {
  cachearElementosDOM();
  
  // Inicializar Dark Mode con persistencia
  aplicarPreferenciaTema();

  initRifa({
    boletosRifa: boletosRifa,
    participantes: participantes,
    PRECIO_BOLETO: PRECIO_BOLETO,
    numerosSeleccionadosPublica: numerosSeleccionadosPublica,
    mostrarToast: mostrarToast,
    cuadriculaPublica, switchOcultarComprados, listaSeleccionPublica, badgeCantidad,
    subtotalEl, btnProcederPago, precioNumeroEl, cuadriculaAdmin, filtrosAdminContainer,
    tablaParticipantes, modalRegistrarVenta, formRegistrarVenta,
    camposNumerosDinamicos, listaNumerosModal,
    modalIngresarDatos, formIngresarDatos,
    btnSuerte, modalSuerte, modalSuerteNumero,
    imgSuerte
  });
  
  registrarEventListeners();  

  if (window.innerWidth < 768) {
    sidebar?.classList.add('collapsed');
  } else {
    sidebar?.classList.remove('collapsed');
    toggleSidebarGlobalBtn?.classList.add('md:left-[15rem]');
  }
  
  if (sessionStorage.getItem('isAdmin') === 'true') {
    adminLinksContainer?.classList.remove('hidden');
  }

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  let initialView = viewParam && document.getElementById(viewParam) ? viewParam : 'view-inicio';
  actualizarVistaActiva(initialView, true); 
  
  escucharBoletos();
  escucharParticipantes();
  
  // Slider Config
  slides = document.querySelectorAll('.slider-image');
  slideCount = slides.length;
  sliderImagesData = Array.from(slides).map((img, index) => ({ src: img.src, alt: img.alt, originalIndex: index }));

  if (slideCount > 0) {
    slides.forEach((slide, index) => index === 0 ? slide.classList.remove('hidden', 'opacity-0') : slide.classList.add('hidden', 'opacity-0'));
    setInterval(() => {
      slides[currentSlide]?.classList.add('hidden', 'opacity-0');
      currentSlide = (currentSlide + 1) % slideCount;
      slides[currentSlide]?.classList.remove('hidden', 'opacity-0');
    }, 4000);
  }
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then(reg => console.log('SW registrado')).catch(err => console.log('Error SW', err));
    });
  }
  inicializarEstadoNotificaciones();
});

/* ======================== Lógica de Tema Radical ============================== */
function aplicarPreferenciaTema() {
  const temaGuardado = localStorage.getItem('theme');
  if (temaGuardado === 'dark' || (!temaGuardado && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark');
    iconDarkMode?.classList.replace('fa-moon', 'fa-sun');
  } else {
    document.body.classList.remove('dark');
    iconDarkMode?.classList.replace('fa-sun', 'fa-moon');
  }
}

function handleCambioTema(e) {
  e.preventDefault();
  const esOscuro = document.body.classList.toggle('dark');
  localStorage.setItem('theme', esOscuro ? 'dark' : 'light');
  
  if (esOscuro) {
    iconDarkMode?.classList.replace('fa-moon', 'fa-sun');
    mostrarToast('Modo Oscuro activado');
  } else {
    iconDarkMode?.classList.replace('fa-sun', 'fa-moon');
    mostrarToast('Modo Claro activado');
  }
}

/* ======================== Firebase & Datos ============================== */
function escucharBoletos() {
  const q = query(collection(db, "boletos"), orderBy("numero", "asc"));
  onSnapshot(q, (querySnapshot) => {
    const boletosTemporales = [];
    querySnapshot.forEach((doc) => boletosTemporales.push({ id: doc.id, ...doc.data() }));
    boletosRifa.length = 0; 
    boletosRifa.push(...boletosTemporales);
    renderCuadriculaPublica();
    renderCuadriculaAdmin('todos'); 
    actualizarSeleccionPublica();
  }, (error) => mostrarToast("Error al cargar datos", true));
}

function escucharParticipantes() {
  const q = query(collection(db, "participantes"), orderBy("nombre", "asc"));
  onSnapshot(q, (querySnapshot) => {
    const participantesTemporales = [];
    querySnapshot.forEach((doc) => participantesTemporales.push({ id: doc.id, ...doc.data() }));
    participantes.length = 0;
    participantes.push(...participantesTemporales);
    if (filtroParticipantesInput?.value.trim() !== '') {
        handleFiltroParticipantes({ target: filtroParticipantesInput }); 
    } else {
        renderTablaParticipantes(); 
    }
  });
}

/* ============================== Cacheo DOM ================================ */
function cachearElementosDOM() {
  sidebar = document.getElementById('sidebar');
  toggleSidebarGlobalBtn = document.getElementById('toggle-sidebar-global');
  toggleSidebarMobileBtn = document.getElementById('toggle-sidebar-mobile');
  mainContent = document.getElementById('main-content');
  navLinks = document.querySelectorAll('.nav-link, .nav-link-trigger');
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
  btnVerVideo = document.getElementById('btn-ver-video');
  modalVideoDemo = document.getElementById('modal-video-demo');
  videoPlayerDemo = document.getElementById('video-player-demo');
  btnToggleMusic = document.getElementById('btn-toggle-music');
  iconMusicMode = document.getElementById('icon-music-mode');
  backgroundMusic = document.getElementById('background-music');
  modalIngresarDatos = document.getElementById('modal-ingresar-datos');
  formIngresarDatos = document.getElementById('form-ingresar-datos');
  btnSuerte = document.getElementById('btn-suerte');
  modalSuerte = document.getElementById('modal-suerte');
  modalSuerteNumero = document.getElementById('modal-suerte-numero');
  imgSuerte = document.getElementById('img-suerte');
  toggleNotificaciones = document.getElementById('toggle-notificaciones');
  modalConfirmacionPago = document.getElementById('modal-confirmacion-pago');
  listaNumerosConfirmacion = document.getElementById('lista-numeros-confirmacion');
  btnEnviarComprobante = document.getElementById('btn-enviar-comprobante');
  filtroParticipantesInput = document.getElementById('filtro-participantes');
  btnVivirAppModal = document.getElementById('btn-vivirapp-modal');
  modalVivirApp = document.getElementById('modal-vivirapp');
  iframeVivirApp = document.getElementById('iframe-vivirapp');
  lightboxModalInicio = document.getElementById('lightbox-modal-inicio');
  lightboxImageInicio = document.getElementById('lightbox-image-inicio');
  lightboxCloseInicio = document.getElementById('lightbox-close-inicio');
}

/* ====================== Event Listeners ============================= */
function registrarEventListeners() {
  toggleSidebarGlobalBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn));
  toggleSidebarMobileBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn));
  
  // Nuevo manejador de Dark Mode Radical
  btnDarkMode?.addEventListener('click', handleCambioTema);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const viewId = link.getAttribute('data-view');
      if (viewId) {
        e.preventDefault();
        actualizarVistaActiva(viewId);
        if (window.innerWidth < 768 && !sidebar?.classList.contains('collapsed')) toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn);
      }
    });
  });

  cuadriculaPublica?.addEventListener('click', handleSeleccionPublica);
  switchOcultarComprados?.addEventListener('change', renderCuadriculaPublica);
  btnProcederPago?.addEventListener('click', handleProcederPago);
  formIngresarDatos?.addEventListener('submit', handleFormularioCompraSubmit);
  
  btnEnviarComprobante?.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(btnEnviarComprobante.href, '_blank');
      modalConfirmacionPago?.classList.remove('flex');
  });

  btnSuerte?.addEventListener('click', handleBotonSuerte); 
  filtrosAdminContainer?.addEventListener('click', handleFiltroAdmin);
  btnRegistrarVentaGlobal?.addEventListener('click', () => abrirModalRegistro(null)); 
  formRegistrarVenta?.addEventListener('submit', handleGuardarVenta); 
  btnAnadirNumero?.addEventListener('click', () => anadirCampoNumero(null));
  filtroParticipantesInput?.addEventListener('input', handleFiltroParticipantes);
  
  tablaParticipantes?.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-editar-participante');
    if (editBtn) return abrirModalRegistro(editBtn.dataset.id);
    const deleteBtn = e.target.closest('.btn-borrar-participante');
    if (deleteBtn) return handleBorrarParticipante(deleteBtn.dataset.id);
    const card = e.target.closest('.participante-card');
    if (card) card.classList.toggle('abierto');
  });
  
  btnMasInfo?.addEventListener('click', () => modalMasInfo?.classList.add('flex'));
  btnModalIrNumeros?.addEventListener('click', () => {
    modalMasInfo?.classList.remove('flex');
    actualizarVistaActiva('view-comprar-numeros');
  });
  
  btnVerVideo?.addEventListener('click', () => {
    modalVideoDemo?.classList.add('flex');
    videoPlayerDemo?.play().catch(err => console.log(err));
  });

  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById(btn.dataset.modalId);
      if(modal) {
          modal.classList.remove('flex');
          if (modal.id === 'modal-vivirapp') modal.classList.add('hidden');
          if (modal.id === 'modal-video-demo') { videoPlayerDemo?.pause(); videoPlayerDemo.currentTime = 0; }
      }
    });
  });

  btnToggleMusic?.addEventListener('click', (e) => {
      e.preventDefault();
      if (backgroundMusic.paused) {
          backgroundMusic.play();
          iconMusicMode?.classList.replace('fa-volume-off', 'fa-volume-high');
      } else {
          backgroundMusic.pause();
          iconMusicMode?.classList.replace('fa-volume-high', 'fa-volume-off');
      }
  });

  btnAdminLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    if (adminLinksContainer?.classList.contains('hidden')) modalAdminLogin?.classList.add('flex');
  });

  formAdminLogin?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('admin-password').value === 'vivirapp') { // Password según evidencia
      sessionStorage.setItem('isAdmin', 'true');
      adminLinksContainer?.classList.remove('hidden');
      modalAdminLogin?.classList.remove('flex');
      mostrarToast('Acceso concedido');
    } else {
      mostrarToast('Contraseña incorrecta', true);
    }
  });
}

/* ================================ Lógica de Pago & WhatsApp ================= */
async function handleFormularioCompraSubmit(e) {
  e.preventDefault(); 
  const resultado = await handleGuardarCompraUsuario(e);

  if (resultado && modalConfirmacionPago) {
    if (listaNumerosConfirmacion) {
      listaNumerosConfirmacion.innerHTML = '';
      resultado.numeros.forEach(num => {
        const t = document.createElement('div');
        t.className = "bg-accent text-white text-sm font-bold px-3 py-1 rounded-md";
        t.textContent = num;
        listaNumerosConfirmacion.appendChild(t);
      });
    }

    if (btnEnviarComprobante) {
      const msg = `¡Hola! ${resultado.nombre} seleccionó los números ${resultado.numeros.join(', ')}. Pago pendiente.`;
      btnEnviarComprobante.href = `https://api.whatsapp.com/send?phone=${resultado.telefonoAdmin}&text=${encodeURIComponent(msg)}`;
    }
    modalConfirmacionPago.classList.add('flex');
  }
}

function handleFiltroParticipantes(e) {
    const t = e.target.value.toLowerCase().trim();
    const filtrados = t === '' ? participantes : participantes.filter(p => p.nombre.toLowerCase().includes(t) || p.telefono.includes(t));
    renderTablaParticipantes(filtrados);
}

/* ================================ Utilidades UI ============================== */
function actualizarVistaActiva(viewId, isInitialLoad = false) {
  if (mainContent && !isInitialLoad) mainContent.scrollTop = 0;
  views.forEach(v => v.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewId));
}

function mostrarToast(m, e = false) {
  if (!toastEl) return;
  toastMsg.textContent = m;
  toastEl.classList.replace('opacity-0', 'opacity-100');
  toastEl.classList.replace('pointer-events-none', 'pointer-events-auto');
  setTimeout(() => { 
    toastEl.classList.replace('opacity-100', 'opacity-0');
    toastEl.classList.replace('pointer-events-auto', 'pointer-events-none');
  }, 3000);
}

async function solicitarYObtenerToken() {
  if (!('Notification' in window) || !messaging) return null;
  let p = await Notification.requestPermission();
  if (p === 'granted') {
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) await setDoc(doc(db, "suscripciones", token), { token, timestamp: new Date() });
    return token;
  }
  return null;
}

function inicializarEstadoNotificaciones() {
  if (Notification.permission === 'granted') toggleNotificaciones.checked = true;
}