/* =========================================================
   script.js (v29 - PWA Service Worker)
   ========================================================= */

// Importar la base de datos (db) y funciones de Firebase
import { 
    db, 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
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
  handleGuardarCompraUsuario,
  renderCuadriculaAdmin,
  handleFiltroAdmin,
  renderTablaParticipantes,
  abrirModalRegistro,
  handleGuardarVenta,
  anadirCampoNumero,
  handleBotonSuerte 
} from './tablas-numericas.js';

/* ---------------------------------------------------------
   Estado Global de la Aplicación
   --------------------------------------------------------- */
let boletosRifa = [];
let participantes = [];
const PRECIO_BOLETO = 6000;
let numerosSeleccionadosPublica = [];

/* ---------------------------------------------------------
   Variables DOM (Caché)
   --------------------------------------------------------- */
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
let imgSuerte; // <-- NUEVA VARIABLE


/* =========================================================
   Inicialización al cargar el documento
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  cachearElementosDOM();
  
  // Inyectar dependencias en el módulo de UI común
  initDarkMode(iconDarkMode);
  
  // Inyectar dependencias en el módulo de la Rifa
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
    // --- NUEVO ELEMENTO ---
    imgSuerte // <-- Pasar la imagen del dado
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
  
  // Empezar a escuchar los datos de Firebase
  escucharBoletos();
  escucharParticipantes();

  // Slider
  slides = document.querySelectorAll('.slider-image');
  slideCount = slides.length;
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

  // =========================================================
// PASO 4: REGISTRAR EL SERVICE WORKER (PWA)
// =========================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${window.location.pathname.replace(/\/[^/]*$/, '/') }sw.js`;
    navigator.serviceWorker.register(swPath)
      .then(registration => {
        console.log('Service Worker PWA registrado con éxito, alcance:', registration.scope);
      })
      .catch(error => {
        console.error('Fallo al registrar el Service Worker PWA:', error);
      });
  });
}
// =========================================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker PWA registrado con éxito, alcance:', registration.scope);
        })
        .catch(error => {
          console.error('Fallo al registrar el Service Worker PWA:', error);
        });
    });
  }
  // =========================================================

});

/* =========================================================
   Datos (Ahora con Firebase)
   ========================================================= */

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
    renderTablaParticipantes();
  });
}


/* =========================================================
   Cacheo de elementos DOM
   ========================================================= */
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
  
  // --- CACHEAR IMAGEN DEL DADO ---
  imgSuerte = document.getElementById('img-suerte');
}

/* =========================================================
   Registro de event listeners
   ========================================================= */
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
  formIngresarDatos?.addEventListener('submit', handleGuardarCompraUsuario);

  // --- Botón Suerte ---
  btnSuerte?.addEventListener('click', handleBotonSuerte); 

  // --- ADMIN ---
  filtrosAdminContainer?.addEventListener('click', handleFiltroAdmin);
  btnRegistrarVentaGlobal?.addEventListener('click', () => abrirModalRegistro());
  formRegistrarVenta?.addEventListener('submit', handleGuardarVenta); 
  btnAnadirNumero?.addEventListener('click', () => anadirCampoNumero(null));

  // --- Modales (Lógica local) ---
  btnMasInfo?.addEventListener('click', () => modalMasInfo?.classList.add('flex'));
  btnModalIrNumeros?.addEventListener('click', () => {
    modalMasInfo?.classList.remove('flex');
    actualizarVistaActiva('view-comprar-numeros');
  });
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-id');
      document.getElementById(modalId)?.classList.remove('flex');
    });
  });
  window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('flex');
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
}

/* =========================================================
   Funciones UI: (Vistas, Toast, Compartir)
   ========================================================= */

/**
 * Actualiza la vista activa y muestra/oculta el botón de suerte.
 * @param {string} viewId - El ID de la vista a mostrar.
 * @param {boolean} [isInitialLoad=false] - Indica si es la carga inicial de la página.
 */
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

  // --- LÓGICA DEL BOTÓN SUERTE ---
  if (viewId === 'view-comprar-numeros') {
    btnSuerte?.classList.remove('hidden');
    // Pequeña animación de entrada
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
  const shareTitle = 'Fabulosa Rifa de Navidad';
  const shareText = '¡Participa en esta increíble rifa y gánate 9 adornos navideños Amigurumi!';
  const shareUrl = window.location.href.split('?')[0]; 

  try {
    const response = await fetch('banner.jpg');
    const blob = await response.blob();
    const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
      files: [file]
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
      mostrarToast('¡Gracias por compartir!');
    } else {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      mostrarToast('¡Gracias por compartir!');
    }
  } catch (err) {
    navigator.clipboard.writeText(shareUrl);
    mostrarToast('Enlace copiado al portapapeles.');
  }
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
    .filtro-btn-admin.filtro-admin-activo, .filtro-btn-admin:hover {color: white !important;}
    .filtro-btn-admin.filtro-admin-activo[data-filtro="todos"], .filtro-btn-admin:hover[data-filtro="todos"] { background-color: #6B7280; }
    .filtro-btn-admin.filtro-admin-activo[data-filtro="disponible"], .filtro-btn-admin:hover[data-filtro="disponible"] { background-color: #9CA3AF; }
    .filtro-btn-admin.filtro-admin-activo[data-filtro="apartado"], .filtro-btn-admin:hover[data-filtro="apartado"] { background-color: #3B82F6; }
    .filtro-btn-admin.filtro-admin-activo[data-filtro="revisando"], .filtro-btn-admin:hover[data-filtro="revisando"] { background-color: #F59E0B; }
    .filtro-btn-admin.filtro-admin-activo[data-filtro="pagado"], .filtro-btn-admin:hover[data-filtro="pagado"] { background-color: #EF4444; }

    /* Estilos para modo oscuro en filtros */
    .dark .filtro-btn-admin[data-filtro="todos"] { border-color: #9CA3AF; color: #E5E7EB; }
    .dark .filtro-btn-admin[data-filtro="disponible"] { border-color: #4B5563; color: #D1D5DB; }
    .dark .filtro-btn-admin.filtro-admin-activo[data-filtro="todos"], .dark .filtro-btn-admin:hover[data-filtro="todos"] { background-color: #9CA3AF; color: white !important; }
    .dark .filtro-btn-admin.filtro-admin-activo[data-filtro="disponible"], .dark .filtro-btn-admin:hover[data-filtro="disponible"] { background-color: #6B7280; color: white !important; }
  `;
  document.head.appendChild(style);
})();