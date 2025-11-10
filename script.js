/* =========================================================
   script.js (Controlador Principal v16)
   ========================================================= */

// Importar lógica de UI compartida
import { toggleSidebarGlobal, initDarkMode, registerDarkModeHandler } from './common-ui.js';

// Importar lógica de la Rifa
import {
  initRifa,
  renderCuadriculaPublica,
  handleSeleccionPublica,
  actualizarSeleccionPublica,
  handleProcederPago,
  renderCuadriculaAdmin,
  handleFiltroAdmin,
  renderTablaParticipantes,
  abrirModalRegistro,
  handleGuardarVenta,
  anadirCampoNumero
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
let toggleSidebarGlobalBtn;
let toggleSidebarMobileBtn;
let mainContent;
let navLinks;
let views;
let toastEl;
let toastMsg;
let toastCloseBtn;
let cuadriculaPublica;
let listaSeleccionPublica;
let badgeCantidad;
let subtotalEl;
let precioNumeroEl;
let btnProcederPago;
let switchOcultarComprados;
let cuadriculaAdmin;
let filtrosAdminContainer;
let tablaParticipantes;
let btnRegistrarVentaGlobal;
let modalRegistrarVenta;
let formRegistrarVenta;
let camposNumerosDinamicos;
let btnAnadirNumero;
let listaNumerosModal;
let btnMasInfo;
let modalMasInfo;
let btnModalIrNumeros;
let modalCloseBtns;
let btnCompartir;
let btnReportarFallo;
let modalReportarFallo;
let formReportarFallo;
let btnAdminLogin;
let modalAdminLogin;
let formAdminLogin;
let adminLinksContainer;
let btnDarkMode;
let iconDarkMode;
let slides;
let currentSlide = 0;
let slideCount = 0;

/* =========================================================
   Inicialización al cargar el documento
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  inicializarBoletos();
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
    cuadriculaPublica: cuadriculaPublica,
    switchOcultarComprados: switchOcultarComprados,
    listaSeleccionPublica: listaSeleccionPublica,
    badgeCantidad: badgeCantidad,
    subtotalEl: subtotalEl,
    btnProcederPago: btnProcederPago,
    precioNumeroEl: precioNumeroEl,
    cuadriculaAdmin: cuadriculaAdmin,
    filtrosAdminContainer: filtrosAdminContainer,
    tablaParticipantes: tablaParticipantes,
    modalRegistrarVenta: modalRegistrarVenta,
    formRegistrarVenta: formRegistrarVenta,
    camposNumerosDinamicos: camposNumerosDinamicos,
    listaNumerosModal: listaNumerosModal
  });
  
  registrarEventListeners();
  
  if (window.innerWidth < 768) {
    sidebar?.classList.add('collapsed');
  } else {
    toggleSidebarGlobalBtn?.classList.add('left-4');
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
  actualizarVistaActiva(initialView);
  
  if (modalParam) {
    if (modalParam === 'admin' && modalAdminLogin) {
      modalAdminLogin.classList.add('flex');
    } else if (modalParam === 'reportar' && modalReportarFallo) {
      modalReportarFallo.classList.add('flex');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Renderizados iniciales (usando funciones importadas)
  renderCuadriculaPublica();
  renderCuadriculaAdmin('todos');
  renderTablaParticipantes();
  actualizarSeleccionPublica();

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
});

/* =========================================================
   Datos
   ========================================================= */
function inicializarBoletos() {
  boletosRifa = [];
  for (let i = 0; i < 100; i++) {
    const numero = String(i).padStart(2, '0');
    boletosRifa.push({ id: numero, numero: numero, estado: 'disponible', participanteId: null });
  }
  participantes = [];
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
}

/* =========================================================
   Registro de event listeners
   ========================================================= */
function registrarEventListeners() {
  // --- UI Común (Sidebar, DarkMode) ---
  toggleSidebarGlobalBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn));
  toggleSidebarMobileBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn));
  registerDarkModeHandler(btnDarkMode, iconDarkMode);

  // --- Navegación SPA ---
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const viewId = link.getAttribute('data-view');
      if (viewId) {
        e.preventDefault();
        actualizarVistaActiva(viewId);
        if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
        }
      }
    });
  });

  // --- Toast ---
  toastCloseBtn?.addEventListener('click', () => toastEl.classList.remove('opacity-100'));

  // --- Lógica de Rifa (Eventos delegados a módulos importados) ---
  cuadriculaPublica?.addEventListener('click', handleSeleccionPublica);
  switchOcultarComprados?.addEventListener('change', renderCuadriculaPublica);
  btnProcederPago?.addEventListener('click', handleProcederPago);
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
   (Estas funciones se quedan aquí porque son el "controlador" 
   o utilidades generales de la SPA)
   ========================================================= */

function actualizarVistaActiva(viewId) {
  if (mainContent) mainContent.scrollTop = 0;
  views.forEach(view => view.classList.remove('active'));
  document.getElementById(viewId)?.classList.add('active');

  navLinks.forEach(link => {
    link.classList.remove('active', 'bg-fuchsia-600');
    if (link.getAttribute('data-view') === viewId) {
      link.classList.add('active', 'bg-fuchsia-600');
    }
  });
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

  toastEl.classList.add('opacity-100');
  
  setTimeout(() => { 
    toastEl.classList.remove('opacity-100'); 
  }, 2000);
}

async function handleCompartir() {
  const shareTitle = 'Fabulosa Rifa de Navidad';
  const shareText = '¡Participa en esta increíble rifa y gánate 9 adornos navideños Amigurumi!';
  const shareUrl = window.location.href.split('?')[0]; // Limpiar params

  try {
    // (Asumiendo que banner.jpg está accesible)
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
   Estilo dinámico (Se queda aquí, es específico de la SPA)
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