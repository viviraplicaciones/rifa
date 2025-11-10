/* =========================================================
   script.js (Con todas las nuevas funciones)
   ========================================================= */

let boletosRifa = [];
let participantes = [];
const PRECIO_BOLETO = 6000;

/* ---------------------------------------------------------
   Variables DOM
   --------------------------------------------------------- */
let sidebar;
let toggleSidebarGlobalBtn;
let navLinks;
let views;
let toastEl;
let toastMsg;
let toastCloseBtn;
let cuadriculaPublica;
let numerosSeleccionadosPublica = [];
let listaSeleccionPublica;
let badgeCantidad;
let subtotalEl;
let precioNumeroEl;
let btnProcederPago;
let switchOcultarComprados;
let cuadriculaAdmin;
let filtrosAdminContainer;
let tablaParticipantes; // AHORA ES 'tabla-participantes-cards'
let btnRegistrarVentaGlobal;
let modalRegistrarVenta;
let formRegistrarVenta;
let camposNumerosDinamicos;
let btnAnadirNumero;
let listaNumerosModal;
let btnMasInfo;
let modalMasInfo;
let modalCloseBtns;
let btnCompartir;

/* Nuevas variables (F, G, Modo Oscuro) */
let btnReportarFallo;
let modalReportarFallo;
let formReportarFallo;
let btnAdminLogin;
let modalAdminLogin;
let formAdminLogin;
let adminLinksContainer;
let btnDarkMode;
let iconDarkMode;

/* Slider */
let currentSlide = 0;
let slides;
let slideCount = 0;

/* =========================================================
   Inicialización al cargar el documento
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  inicializarBoletos();
  cachearElementosDOM();
  registrarEventListeners();
  
  // ===== CAMBIO PUNTO 1: Menú colapsado en móvil =====
  if (window.innerWidth < 768) {
    sidebar?.classList.add('collapsed');
    toggleSidebarGlobalBtn?.classList.add('left-4');
    toggleSidebarGlobalBtn?.classList.remove('md:left-64');
  }
  
  // Inicialización de Modo Oscuro
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    if(iconDarkMode) {
      iconDarkMode.classList.remove('fa-moon');
      iconDarkMode.classList.add('fa-sun');
    }
  } else {
    document.documentElement.classList.remove('dark');
    if(iconDarkMode) {
      iconDarkMode.classList.remove('fa-sun');
      iconDarkMode.classList.add('fa-moon');
    }
  }
  
  // Inicialización de Login Admin (G)
  if (sessionStorage.getItem('isAdmin') === 'true') {
    adminLinksContainer?.classList.remove('hidden');
  }

  // ============ Lógica de Deep Linking ============
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const modalParam = params.get('modal');
  
  let initialView = 'view-inicio'; // Default
  
  if (viewParam && document.getElementById(viewParam)) {
    initialView = viewParam;
  }
  
  actualizarVistaActiva(initialView); // Esto ya incluye el scroll-to-top (Punto 4)
  
  if (modalParam) {
    if (modalParam === 'admin' && modalAdminLogin) {
      modalAdminLogin.classList.add('flex');
    } else if (modalParam === 'reportar' && modalReportarFallo) {
      modalReportarFallo.classList.add('flex');
    }
  }
  
  // Inicializaciones visuales
  renderCuadriculaPublica();
  renderCuadriculaAdmin('todos');
  renderTablaParticipantes();
  actualizarSeleccionPublica();

  if (precioNumeroEl) {
    precioNumeroEl.textContent = `$ ${PRECIO_BOLETO.toLocaleString('es-CO')}`;
  }

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
  // ===== CAMBIO PUNTO 3: ID del contenedor de tarjetas =====
  tablaParticipantes = document.getElementById('tabla-participantes-cards');
  btnRegistrarVentaGlobal = document.getElementById('btn-registrar-venta-global');
  modalRegistrarVenta = document.getElementById('modal-registrar-venta');
  formRegistrarVenta = document.getElementById('form-registrar-venta');
  camposNumerosDinamicos = document.getElementById('campos-numeros-dinamicos');
  btnAnadirNumero = document.getElementById('btn-anadir-numero');
  listaNumerosModal = document.getElementById('lista-numeros-disponibles-modal');
  btnMasInfo = document.getElementById('btn-mas-info');
  modalMasInfo = document.getElementById('modal-mas-info');
  modalCloseBtns = document.querySelectorAll('.modal-close');
  btnCompartir = document.getElementById('btn-compartir');
  
  /* Nuevos caches (F, G, Modo Oscuro) */
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
  toggleSidebarGlobalBtn?.addEventListener('click', toggleSidebarGlobal);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = link.getAttribute('data-view');
      if (viewId) {
        actualizarVistaActiva(viewId);
        // Lógica de colapso solo en móvil
        if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
          toggleSidebarGlobalBtn?.classList.remove('md:left-64');
          toggleSidebarGlobalBtn?.classList.add('left-4');
        }
      }
    });
  });

  toastCloseBtn?.addEventListener('click', () => toastEl.classList.remove('opacity-100'));

  cuadriculaPublica?.addEventListener('click', handleSeleccionPublica);
  switchOcultarComprados?.addEventListener('change', renderCuadriculaPublica);

  btnProcederPago?.addEventListener('click', () => {
    if (numerosSeleccionadosPublica.length > 0) {
      mostrarToast(`Simulación de pago para ${numerosSeleccionadosPublica.length} números.`);
      numerosSeleccionadosPublica = [];
      renderCuadriculaPublica();
      actualizarSeleccionPublica();
    } else {
      mostrarToast("Por favor, selecciona al menos un número.", true);
    }
  });

  filtrosAdminContainer?.addEventListener('click', handleFiltroAdmin);
  btnRegistrarVentaGlobal?.addEventListener('click', () => abrirModalRegistro());
  formRegistrarVenta?.addEventListener('submit', handleGuardarVenta);
  btnAnadirNumero?.addEventListener('click', () => anadirCampoNumero(null));
  btnMasInfo?.addEventListener('click', () => modalMasInfo?.classList.add('flex'));

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

  btnDarkMode?.addEventListener('click', (e) => {
    e.preventDefault();
    const isDark = document.documentElement.classList.toggle('dark');
    if (isDark) {
      localStorage.setItem('theme', 'dark');
      if(iconDarkMode) {
        iconDarkMode.classList.remove('fa-moon');
        iconDarkMode.classList.add('fa-sun');
      }
    } else {
      localStorage.setItem('theme', 'light');
      if(iconDarkMode) {
        iconDarkMode.classList.remove('fa-sun');
        iconDarkMode.classList.add('fa-moon');
      }
    }
  });
}

/* =========================================================
   Funciones UI: sidebar y vistas
   ========================================================= */
function toggleSidebarGlobal() {
  sidebar?.classList.toggle('collapsed');
  if (sidebar?.classList.contains('collapsed')) {
    toggleSidebarGlobalBtn?.classList.remove('md:left-64');
    toggleSidebarGlobalBtn?.classList.add('left-4', 'md:left-4');
  } else {
    toggleSidebarGlobalBtn?.classList.remove('left-4');
    toggleSidebarGlobalBtn?.classList.add('md:left-64');
  }
}

function actualizarVistaActiva(viewId) {
  // ===== CAMBIO PUNTO 4: Scroll al Top =====
  const mainContent = document.querySelector('main');
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

/* =========================================================
   Toasts
   ========================================================= */
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

/* =========================================================
   Función Compartir (E)
   ========================================================= */
async function handleCompartir() {
  const shareTitle = 'Fabulosa Rifa de Navidad';
  const shareText = '¡Participa en esta increíble rifa y gánate 9 adornos navideños Amigurumi!';
  const shareUrl = window.location.href;

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
   Rifas (cuadrícula pública)
   ========================================================= */
function renderCuadriculaPublica() {
  if (!cuadriculaPublica) return;
  const ocultar = switchOcultarComprados?.checked;
  cuadriculaPublica.innerHTML = '';

  boletosRifa.forEach(boleto => {
    let claseEstado = '';
    let esOcupado = false;
    switch (boleto.estado) {
      case 'apartado':
      case 'pagado':
        claseEstado = 'ocupado'; esOcupado = true; break;
      case 'revisando':
        claseEstado = 'revisando'; esOcupado = true; break;
      case 'disponible':
      default:
        claseEstado = ''; break;
    }

    if (ocultar && esOcupado) return;

    const esSeleccionado = numerosSeleccionadosPublica.includes(boleto.numero);
    if (esSeleccionado && !esOcupado) claseEstado = 'seleccionado';

    const divBoleto = document.createElement('div');
    divBoleto.className = `numero-rifa-publico w-full aspect-square flex items-center justify-center font-bold text-xs border-2 rounded-xl p-0 cursor-pointer ${claseEstado}`;
    divBoleto.textContent = boleto.numero;
    divBoleto.dataset.numero = boleto.numero;
    divBoleto.dataset.estado = boleto.estado;
    cuadriculaPublica.appendChild(divBoleto);
  });
}

function handleSeleccionPublica(e) {
  const boletoEl = e.target.closest('.numero-rifa-publico');
  if (!boletoEl) return;
  const numero = boletoEl.dataset.numero;
  const estado = boletoEl.dataset.estado;

  if (estado !== 'disponible') {
    mostrarToast("Este número no está disponible.", true);
    return;
  }

  const index = numerosSeleccionadosPublica.indexOf(numero);
  if (index > -1) {
    numerosSeleccionadosPublica.splice(index, 1);
  } else {
    numerosSeleccionadosPublica.push(numero);
  }

  renderCuadriculaPublica();
  actualizarSeleccionPublica();
}

function actualizarSeleccionPublica() {
  if (!listaSeleccionPublica || !badgeCantidad || !subtotalEl || !btnProcederPago) return;

  const cantidad = numerosSeleccionadosPublica.length;
  listaSeleccionPublica.innerHTML = '';

  if (cantidad === 0) {
    listaSeleccionPublica.innerHTML = '<span class="text-gray-500 text-sm dark:text-gray-400">Selecciona tus números...</span>';
    btnProcederPago.disabled = true;
  } else {
    numerosSeleccionadosPublica.sort().forEach(numero => {
      const tiquet = document.createElement('div');
      tiquet.className = "relative bg-blue-600 text-white text-sm font-bold pl-3 pr-5 py-1 rounded-md flex items-center";
      tiquet.textContent = numero;
      tiquet.dataset.numero = numero;

      const closeBtn = document.createElement('button');
      closeBtn.className = "absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center -m-1 transition-transform hover:scale-110";
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        const numAEliminar = tiquet.dataset.numero;
        numerosSeleccionadosPublica = numerosSeleccionadosPublica.filter(n => n !== numAEliminar);
        renderCuadriculaPublica();
        actualizarSeleccionPublica();
      };
      
      tiquet.appendChild(closeBtn);
      listaSeleccionPublica.appendChild(tiquet);
    });
    btnProcederPago.disabled = false;
  }

  badgeCantidad.textContent = `${cantidad} números`;
  subtotalEl.textContent = `$ ${(cantidad * PRECIO_BOLETO).toLocaleString('es-CO')}`;
}

/* =========================================================
   Admin: cuadricula admin y filtros
   ========================================================= */
function renderCuadriculaAdmin(filtro) {
  if (!cuadriculaAdmin) return;
  cuadriculaAdmin.innerHTML = '';

  const boletosFiltrados = boletosRifa.filter(boleto => {
    if (filtro === 'todos') return true;
    return boleto.estado === filtro;
  });

  boletosFiltrados.forEach(boleto => {
    let claseColor = 'status-disponible';
    switch (boleto.estado) {
      case 'apartado': claseColor = 'status-apartado'; break;
      case 'revisando': claseColor = 'status-revisando'; break;
      case 'pagado': claseColor = 'status-pagado'; break;
    }

    const divBoleto = document.createElement('div');
    divBoleto.className = `w-full aspect-square flex items-center justify-center font-medium text-xs border rounded-md p-0 ${claseColor}`;
    divBoleto.textContent = boleto.numero;
    cuadriculaAdmin.appendChild(divBoleto);
  });
}

function handleFiltroAdmin(e) {
  if (e.target.tagName !== 'BUTTON') return;
  const filtro = e.target.dataset.filtro;
  filtrosAdminContainer.querySelectorAll('.filtro-btn-admin').forEach(btn => btn.classList.remove('filtro-admin-activo'));
  e.target.classList.add('filtro-admin-activo');
  renderCuadriculaAdmin(filtro);
}

/* =========================================================
   Tabla participantes
   ========================================================= */

// ===== CAMBIO PUNTO 3: Función re-escrita para usar Tarjetas =====
function renderTablaParticipantes() {
  if (!tablaParticipantes) return; // ID es 'tabla-participantes-cards'
  tablaParticipantes.innerHTML = '';

  if (participantes.length === 0) {
    tablaParticipantes.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400 shadow">
        Aún no hay participantes registrados.
      </div>
    `;
    return;
  }

  participantes.forEach(p => {
    let colorEstado = 'text-gray-700 dark:text-gray-300';
    let bgEstado = 'bg-gray-100 dark:bg-gray-600';
    switch (p.estado) {
      case 'apartado':
        colorEstado = 'text-blue-700 dark:text-blue-300';
        bgEstado = 'bg-blue-100 dark:bg-blue-900';
        break;
      case 'revisando':
        colorEstado = 'text-amber-700 dark:text-amber-300';
        bgEstado = 'bg-amber-100 dark:bg-amber-900';
        break;
      case 'pagado':
        colorEstado = 'text-red-700 dark:text-red-300';
        bgEstado = 'bg-red-100 dark:bg-red-900';
        break;
    }
    
    const estadoTexto = p.estado.charAt(0).toUpperCase() + p.estado.slice(1);

    const card = document.createElement('div');
    card.className = "bg-white dark:bg-gray-800 rounded-lg shadow p-4";
    
    // Usar grid-cols-4 para alinear con el header
    // 'truncate' evita que nombres largos rompan el layout
    card.innerHTML = `
      <div class="grid grid-cols-4 gap-4 items-center text-xs md:text-sm">
        <div class="font-medium text-gray-900 dark:text-white truncate" title="${p.nombre}">
          ${p.nombre}
        </div>
        <div class="text-gray-600 dark:text-gray-300 truncate">
          ${p.telefono}
        </div>
        <div class="text-gray-600 dark:text-gray-300 truncate">
          ${p.numeros.join(', ')}
        </div>
        <div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgEstado} ${colorEstado}">
            ${estadoTexto}
          </span>
        </div>
      </div>
    `;
    tablaParticipantes.appendChild(card);
  });
}


/* =========================================================
   Modal registro de venta (Admin)
   ========================================================= */
function abrirModalRegistro() {
  if (!modalRegistrarVenta || !formRegistrarVenta || !camposNumerosDinamicos) return;
  formRegistrarVenta.reset();
  camposNumerosDinamicos.innerHTML = '';
  actualizarListaDisponiblesModal();
  anadirCampoNumero(null);
  modalRegistrarVenta.classList.add('flex');
}

function getNumerosDisponibles() {
  return boletosRifa.filter(b => b.estado === 'disponible').map(b => b.numero);
}

function actualizarListaDisponiblesModal() {
  if (!listaNumerosModal) return;
  const disponibles = getNumerosDisponibles();
  if (disponibles.length > 0) {
    listaNumerosModal.textContent = `Disponibles: ${disponibles.join(', ')}`;
  } else {
    listaNumerosModal.textContent = '¡No quedan números disponibles!';
  }
}

function anadirCampoNumero(numeroSeleccionado) {
  if (!camposNumerosDinamicos) return;

  const numerosYaSeleccionadosEnModal = Array.from(camposNumerosDinamicos.querySelectorAll('select'))
    .map(select => select.value)
    .filter(val => val !== '');

  const numerosDisponibles = getNumerosDisponibles().filter(num => !numerosYaSeleccionadosEnModal.includes(num) || num === numeroSeleccionado);

  const divCampo = document.createElement('div');
  divCampo.className = 'flex items-center gap-2';

  const select = document.createElement('select');
  select.className = 'w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white select-numero-dinamico';
  select.required = true;

  let optionsHTML = '<option value="" disabled>Selecciona un número</option>';
  if (numeroSeleccionado) {
    optionsHTML += `<option value="${numeroSeleccionado}" selected>${numeroSeleccionado}</option>`;
  }
  numerosDisponibles.forEach(num => {
    optionsHTML += `<option value="${num}">${num}</option>`;
  });
  select.innerHTML = optionsHTML;
  if (!numeroSeleccionado) select.value = "";

  select.addEventListener('change', () => { actualizarSelectsDinamicos(); });

  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'text-red-500 hover:text-red-700 p-2';
  btnEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';
  btnEliminar.onclick = () => { divCampo.remove(); actualizarSelectsDinamicos(); };

  divCampo.appendChild(select);
  divCampo.appendChild(btnEliminar);
  camposNumerosDinamicos.appendChild(divCampo);
}

function actualizarSelectsDinamicos() {
  if (!camposNumerosDinamicos) return;

  const selects = camposNumerosDinamicos.querySelectorAll('.select-numero-dinamico');
  const valoresSeleccionados = Array.from(selects).map(s => s.value).filter(v => v !== '');
  const numerosDisponibles = getNumerosDisponibles();

  selects.forEach(select => {
    const valorActual = select.value;
    
    // Bug corregido de la v12
    let optionsHTML = '<option value="" disabled>Selecciona un número</option>';

    if (valorActual) optionsHTML += `<option value="${valorActual}" selected>${valorActual}</option>`;

    numerosDisponibles.forEach(num => {
      if (!valoresSeleccionados.includes(num) || num === valorActual) {
        if (num !== valorActual) optionsHTML += `<option value="${num}">${num}</option>`;
      }
    });

    select.innerHTML = optionsHTML;
    select.value = valorActual;
  });
}

function handleGuardarVenta(e) {
  e.preventDefault();
  if (!formRegistrarVenta) return;

  const nombre = document.getElementById('participante-nombre').value;
  const telefono = document.getElementById('participante-telefono').value;
  const estado = document.getElementById('participante-estado').value;

  const selectsNumeros = camposNumerosDinamicos.querySelectorAll('select');
  const numerosSeleccionados = Array.from(selectsNumeros).map(select => select.value).filter(value => value !== '');

  if (numerosSeleccionados.length === 0) {
    mostrarToast("Debes seleccionar al menos un número.", true);
    return;
  }
  
  for (const numero of numerosSeleccionados) {
    const boleto = boletosRifa.find(b => b.numero === numero);
    if (boleto.estado !== 'disponible') {
        mostrarToast(`El número ${numero} ya no está disponible.`, true);
        actualizarSelectsDinamicos();
        return;
    }
  }

  const nuevoParticipante = { id: `p${participantes.length + 1}`, nombre: nombre, telefono: telefono, numeros: numerosSeleccionados, estado: estado };
  participantes.push(nuevoParticipante);

  numerosSeleccionados.forEach(numero => {
    const boleto = boletosRifa.find(b => b.numero === numero);
    if (boleto) {
      boleto.estado = estado;
      boleto.participanteId = nuevoParticipante.id;
    }
  });

  renderTablaParticipantes();
  renderCuadriculaAdmin('todos');
  renderCuadriculaPublica();
  actualizarSeleccionPublica();
  modalRegistrarVenta.classList.remove('flex');
  mostrarToast("¡Venta registrada con éxito!");

  filtrosAdminContainer.querySelectorAll('.filtro-btn-admin').forEach(btn => btn.classList.remove('filtro-admin-activo'));
  const todosBtn = document.querySelector('.filtro-btn-admin[data-filtro="todos"]');
  if (todosBtn) todosBtn.classList.add('filtro-admin-activo');
}

/* ---------------------------------------------------------
   Estilo dinámico
   --------------------------------------------------------- */
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

/* =========================================================
   Fin del script
   ========================================================= */