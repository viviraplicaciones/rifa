/* =========================================================
   script.js (desminificado, mismo nombres de funciones/vars)
   Mantiene todo el comportamiento original.
   ========================================================= */

let boletosRifa = [];
let participantes = [];
const PRECIO_BOLETO = 6000;

/* ---------------------------------------------------------
   Variables DOM (se cachean en cachearElementosDOM)
   --------------------------------------------------------- */
let sidebar;
let toggleSidebarGlobalBtn; // Renombrado para diferenciar
let navLinks;
let views;
let toastEl;
let toastMsg;
let toastCloseBtn;
let cuadriculaPublica;
let numerosSeleccionadosPublica = [];
let listaSeleccionPublica;
let badgeCantidad;
let subtotalEl; // Sigue siendo 'subtotalEl' por consistencia en la lógica, aunque el texto sea 'Total'
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
let modalCloseBtns;

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

  // Inicializaciones visuales
  actualizarVistaActiva('view-inicio');
  renderCuadriculaPublica();
  renderCuadriculaAdmin('todos');
  renderTablaParticipantes();
  actualizarSeleccionPublica();

  if (precioNumeroEl) {
    precioNumeroEl.textContent = `$ ${PRECIO_BOLETO.toLocaleString('es-CO')}`;
  }

  // Slider: seleccionar imágenes y arrancar
  slides = document.querySelectorAll('.slider-image');
  slideCount = slides.length;
  if (slideCount > 0) {
    // Asegurarse de que solo la primera imagen sea visible inicialmente
    slides.forEach((slide, index) => {
      if (index === 0) {
        slide.classList.remove('hidden', 'opacity-0');
      } else {
        slide.classList.add('hidden', 'opacity-0');
      }
    });

    setInterval(() => {
      // esconder el actual y mostrar el siguiente
      slides[currentSlide].classList.add('hidden', 'opacity-0');
      currentSlide = (currentSlide + 1) % slideCount;
      slides[currentSlide].classList.remove('hidden', 'opacity-0');
    }, 4000);
  }
});

/* =========================================================
   Datos de ejemplo: inicializar boletos y participantes
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
  toggleSidebarGlobalBtn = document.getElementById('toggle-sidebar-global'); // Nuevo ID
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
  tablaParticipantes = document.getElementById('tabla-participantes');
  btnRegistrarVentaGlobal = document.getElementById('btn-registrar-venta-global');
  modalRegistrarVenta = document.getElementById('modal-registrar-venta');
  formRegistrarVenta = document.getElementById('form-registrar-venta');
  camposNumerosDinamicos = document.getElementById('campos-numeros-dinamicos');
  btnAnadirNumero = document.getElementById('btn-anadir-numero');
  listaNumerosModal = document.getElementById('lista-numeros-disponibles-modal');
  btnMasInfo = document.getElementById('btn-mas-info');
  modalMasInfo = document.getElementById('modal-mas-info');
  modalCloseBtns = document.querySelectorAll('.modal-close');
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
        // Colapsar sidebar en móvil y al cambiar de vista en cualquier tamaño
        if (sidebar && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
          toggleSidebarGlobalBtn?.classList.remove('md:left-4');
          toggleSidebarGlobalBtn?.classList.add('left-4'); // Asegura que vuelva a la posición inicial al colapsar
        }
      }
    });
  });

  toastCloseBtn?.addEventListener('click', () => toastEl.classList.add('hidden'));

  cuadriculaPublica?.addEventListener('click', handleSeleccionPublica);
  switchOcultarComprados?.addEventListener('change', renderCuadriculaPublica);

  btnProcederPago?.addEventListener('click', () => {
    if (numerosSeleccionadosPublica.length > 0) {
      mostrarToast(`Simulación de pago para ${numerosSeleccionadosPublica.length} números.`);
      // Limpiar selección después de simular el pago
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

  const btnCompartir = document.getElementById('btn-compartir');
  btnCompartir?.addEventListener('click', (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: 'Rifa Amigurumi',
        text: '¡Participa en esta increíble rifa!',
        url: window.location.href
      }).then(() => {
        mostrarToast('¡Gracias por compartir!');
      }).catch((err) => {
        mostrarToast('No se pudo compartir.', true);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      mostrarToast('Enlace copiado al portapapeles.');
    }
  });
}

/* =========================================================
   Funciones UI: sidebar y vistas
   ========================================================= */
function toggleSidebarGlobal() {
  sidebar?.classList.toggle('collapsed');
  // Ajustar la posición del botón de toggle
  if (sidebar?.classList.contains('collapsed')) {
    toggleSidebarGlobalBtn?.classList.remove('md:left-64');
    toggleSidebarGlobalBtn?.classList.add('left-4', 'md:left-4'); // Vuelve a la izquierda cuando está colapsado
  } else {
    toggleSidebarGlobalBtn?.classList.remove('left-4');
    toggleSidebarGlobalBtn?.classList.add('md:left-64'); // Se mueve con el sidebar cuando está expandido
  }
}

function actualizarVistaActiva(viewId) {
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
  if (icon) icon.classList.remove('fa-check', 'fa-triangle-exclamation');

  if (esError) {
    iconContainer?.classList.add('text-red-500', 'bg-red-100');
    if (icon) icon.classList.add('fa-solid', 'fa-triangle-exclamation');
  } else {
    iconContainer?.classList.add('text-lime-500', 'bg-lime-100');
    if (icon) icon.classList.add('fa-solid', 'fa-check');
  }

  toastEl.classList.remove('hidden');
  setTimeout(() => { toastEl.classList.add('hidden'); }, 3000);
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
        claseEstado = 'ocupado';
        esOcupado = true;
        break;
      case 'revisando':
        claseEstado = 'revisando';
        esOcupado = true;
        break;
      case 'disponible':
      default:
        claseEstado = '';
        break;
    }

    if (ocultar && esOcupado) return;

    const esSeleccionado = numerosSeleccionadosPublica.includes(boleto.numero);
    if (esSeleccionado && !esOcupado) claseEstado = 'seleccionado';

    const divBoleto = document.createElement('div');

    // CAMBIO: Divs de números aún más pequeños (text-sm y padding ajustado)
    divBoleto.className = `numero-rifa-publico w-full aspect-square flex items-center justify-center font-bold text-sm border-2 rounded-xl p-0.5 cursor-pointer ${claseEstado}`;

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
    listaSeleccionPublica.innerHTML = '<span class="text-gray-500 text-sm">Selecciona tus números...</span>';
    btnProcederPago.disabled = true;
  } else {
    numerosSeleccionadosPublica.sort().forEach(numero => {
      const tiquet = document.createElement('div'); // Cambiado a div para mejor control del layout
      tiquet.className = "relative bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-md flex items-center group";
      tiquet.textContent = numero;
      tiquet.dataset.numero = numero; // Para identificarlo al eliminar

      const closeBtn = document.createElement('button');
      closeBtn.className = "absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200";
      closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      closeBtn.onclick = (e) => {
        e.stopPropagation(); // Evitar que el clic se propague al div si se agrega otra función
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
    divBoleto.className = `w-full aspect-square flex items-center justify-center font-medium text-sm border rounded-md p-0.5 ${claseColor}`; // Ajuste de padding
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
function renderTablaParticipantes() {
  if (!tablaParticipantes) return;
  tablaParticipantes.innerHTML = '';

  if (participantes.length === 0) {
    tablaParticipantes.innerHTML = `
      <tr class="no-participantes"><td colspan="4" class="p-6 text-center text-gray-500">Aún no hay participantes registrados.</td></tr>
    `;
    return;
  }

  participantes.forEach(p => {
    let colorEstado = 'text-gray-700';
    switch (p.estado) {
      case 'apartado': colorEstado = 'text-blue-600 font-medium'; break;
      case 'revisando': colorEstado = 'text-amber-600 font-medium'; break;
      case 'pagado': colorEstado = 'text-red-600 font-medium'; break;
    }

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td class="p-4 text-sm text-gray-800">${p.nombre}</td>
      <td class="p-4 text-sm text-gray-600">${p.telefono}</td>
      <td class="p-4 text-sm text-gray-600">${p.numeros.join(', ')}</td>
      <td class="p-4 text-sm ${colorEstado}">${p.estado.charAt(0).toUpperCase() + p.estado.slice(1)}</td>
    `;
    tablaParticipantes.appendChild(fila);
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
  select.className = 'w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white select-numero-dinamico';
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
   Estilo dinámico (se inyecta al final como en el original)
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
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   Fin del script
   ========================================================= */