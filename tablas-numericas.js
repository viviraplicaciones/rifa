/* ==============tablas-numericas.js (v29 - Lógica CRUD Participantes)=============================== */

// Importar la base de datos (db) y funciones de Firestore
import { 
    db, 
    collection, 
    addDoc, 
    doc, 
    writeBatch,
    updateDoc,  // <-- NUEVO: Para editar
    deleteDoc   // <-- NUEVO: Para borrar
} from './firebase-init.js';

// Variables de estado y DOM
let _boletosRifa = [];
let _participantes = [];
let _PRECIO_BOLETO = 5000;
let _numerosSeleccionadosPublica = [];
let _mostrarToast = () => {};
let _isSuerteDisabled = false; 

// DOM Elements
let _cuadriculaPublica, _switchOcultarComprados, _listaSeleccionPublica, _badgeCantidad,
    _subtotalEl, _btnProcederPago, _precioNumeroEl, _cuadriculaAdmin, _filtrosAdminContainer,
    _tablaParticipantes, _modalRegistrarVenta, _formRegistrarVenta,
    _camposNumerosDinamicos, _listaNumerosModal,
    _modalIngresarDatos, _formIngresarDatos,
    _btnSuerte, _modalSuerte, _modalSuerteNumero, _imgSuerte;


/**
 * Inicializa el módulo de la rifa con las dependencias necesarias.
 */
export function initRifa(config) {
  _boletosRifa = config.boletosRifa;
  _participantes = config.participantes;
  _PRECIO_BOLETO = config.PRECIO_BOLETO;
  _numerosSeleccionadosPublica = config.numerosSeleccionadosPublica;
  _mostrarToast = config.mostrarToast;

  // Cacheo de DOM
  _cuadriculaPublica = config.cuadriculaPublica;
  _switchOcultarComprados = config.switchOcultarComprados;
  _listaSeleccionPublica = config.listaSeleccionPublica;
  _badgeCantidad = config.badgeCantidad;
  _subtotalEl = config.subtotalEl;
  _btnProcederPago = config.btnProcederPago;
  _precioNumeroEl = config.precioNumeroEl;
  _cuadriculaAdmin = config.cuadriculaAdmin;
  _filtrosAdminContainer = config.filtrosAdminContainer;
  _tablaParticipantes = config.tablaParticipantes;
  _modalRegistrarVenta = config.modalRegistrarVenta;
  _formRegistrarVenta = config.formRegistrarVenta;
  _camposNumerosDinamicos = config.camposNumerosDinamicos;
  _listaNumerosModal = config.listaNumerosModal;
  _modalIngresarDatos = config.modalIngresarDatos;
  _formIngresarDatos = config.formIngresarDatos;
  _btnSuerte = config.btnSuerte;
  _modalSuerte = config.modalSuerte;
  _modalSuerteNumero = config.modalSuerteNumero;
  _imgSuerte = config.imgSuerte; 

  // Inicializar precio en la UI
  if (_precioNumeroEl) {
    _precioNumeroEl.textContent = `$ ${_PRECIO_BOLETO.toLocaleString('es-CO')}`;
  }
}

/* =========================================================
   Rifas (cuadrícula pública)
   ========================================================= */
export function renderCuadriculaPublica() {
  if (!_cuadriculaPublica) return;
  const ocultar = _switchOcultarComprados?.checked;
  _cuadriculaPublica.innerHTML = '';

  _boletosRifa.forEach(boleto => {
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

    const esSeleccionado = _numerosSeleccionadosPublica.includes(boleto.numero);
    if (esSeleccionado && !esOcupado) claseEstado = 'seleccionado';

    const divBoleto = document.createElement('div');
    divBoleto.className = `numero-rifa-publico w-full aspect-square flex items-center justify-center font-bold text-xs border-2 rounded-xl p-0 cursor-pointer ${claseEstado}`;
    divBoleto.textContent = boleto.numero;
    divBoleto.dataset.numero = boleto.numero;
    divBoleto.dataset.estado = boleto.estado;
    _cuadriculaPublica.appendChild(divBoleto);
  });
}

export function handleSeleccionPublica(e) {
  const boletoEl = e.target.closest('.numero-rifa-publico');
  if (!boletoEl) return;
  const numero = boletoEl.dataset.numero;
  const estado = boletoEl.dataset.estado;

  if (estado !== 'disponible') {
    _mostrarToast("Este número no está disponible.", true);
    return;
  }

  const index = _numerosSeleccionadosPublica.indexOf(numero);
  if (index > -1) {
    _numerosSeleccionadosPublica.splice(index, 1);
  } else {
    _numerosSeleccionadosPublica.push(numero);
  }

  renderCuadriculaPublica();
  actualizarSeleccionPublica();
}

export function actualizarSeleccionPublica() {
  if (!_listaSeleccionPublica || !_badgeCantidad || !_subtotalEl || !_btnProcederPago) return;

  const cantidad = _numerosSeleccionadosPublica.length;
  _listaSeleccionPublica.innerHTML = '';

  if (cantidad === 0) {
    _listaSeleccionPublica.innerHTML = '<span class="text-gray-500 text-sm dark:text-gray-400">Selecciona tus números...</span>';
    _btnProcederPago.disabled = true;
  } else {
    _numerosSeleccionadosPublica.sort().forEach(numero => {
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
        const idx = _numerosSeleccionadosPublica.indexOf(numAEliminar);
        if (idx > -1) _numerosSeleccionadosPublica.splice(idx, 1);
        
        renderCuadriculaPublica();
        actualizarSeleccionPublica();
      };
      
      tiquet.appendChild(closeBtn);
      _listaSeleccionPublica.appendChild(tiquet);
    });
    _btnProcederPago.disabled = false;
  }

  _badgeCantidad.textContent = `${cantidad} números`;
  _subtotalEl.textContent = `$ ${(cantidad * _PRECIO_BOLETO).toLocaleString('es-CO')}`;
}


/* =========================================================
   BOTÓN DE LA SUERTE (CON ANIMACIÓN)
   ========================================================= */
export function handleBotonSuerte() {
  if (_isSuerteDisabled) return;

  const disponibles = getNumerosDisponibles();
  const numerosParaElegir = disponibles.filter(num => !_numerosSeleccionadosPublica.includes(num));

  if (numerosParaElegir.length === 0) {
    _mostrarToast("¡No quedan números disponibles por elegir!", true);
    return;
  }
  
  _isSuerteDisabled = true;
  if (_imgSuerte) {
    _imgSuerte.src = `images/dado.gif?t=${new Date().getTime()}`;
  }

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * numerosParaElegir.length);
    const numeroSuerte = numerosParaElegir[randomIndex];
    _numerosSeleccionadosPublica.push(numeroSuerte);

    if (_modalSuerteNumero) _modalSuerteNumero.textContent = numeroSuerte;
    _modalSuerte?.classList.add('flex');

    renderCuadriculaPublica();
    actualizarSeleccionPublica();
    
    if (_imgSuerte) {
      _imgSuerte.src = 'images/dado.png';
    }
    
    setTimeout(() => {
      _modalSuerte?.classList.remove('flex');
    }, 2000);

    _isSuerteDisabled = false;

  }, 1500); 
}


/* =========================================================
   FLUJO DE PAGO (Usuario)
   ========================================================= */

export function handleProcederPago() {
  if (_numerosSeleccionadosPublica.length > 0) {
    _modalIngresarDatos?.classList.add('flex');
    _formIngresarDatos?.reset();
    document.getElementById('usuario-nombre')?.focus();
  } else {
    _mostrarToast("Por favor, selecciona al menos un número.", true);
  }
}

export async function handleGuardarCompraUsuario(e) {
  e.preventDefault();
  if (!_formIngresarDatos || _numerosSeleccionadosPublica.length === 0) return;

  const nombre = document.getElementById('usuario-nombre').value;
  const telefono = document.getElementById('usuario-telefono').value;
  const estado = "revisando"; 

  for (const numero of _numerosSeleccionadosPublica) {
    const boleto = _boletosRifa.find(b => b.numero === numero);
    if (!boleto || boleto.estado !== 'disponible') {
        _mostrarToast(`El número ${numero} ya no está disponible.`, true);
        return; 
    }
  }

  try {
    const nuevoParticipante = {
      nombre: nombre,
      telefono: telefono,
      numeros: _numerosSeleccionadosPublica.sort(), // <-- MODIFICADO: Ordenar números
      estado: estado
    };
    
    const docRef = await addDoc(collection(db, "participantes"), nuevoParticipante);

    const batch = writeBatch(db);
    _numerosSeleccionadosPublica.forEach(numero => {
      const boletoRef = doc(db, "boletos", numero); 
      batch.update(boletoRef, {
        estado: estado,
        participanteId: docRef.id 
      });
    });
    
    // --- INICIO CÓDIGO NUEVO: Enviar a WhatsApp ---
    // ¡REEMPLAZA 'TU_NUMERO_DE_WHATSAPP' con tu número! (ej: 573101234567)
    const telefonoWhatsapp = 'TU_NUMERO_DE_WHATSAPP'; 
    const numerosTexto = nuevoParticipante.numeros.join(', ');
    
    let mensajeWhatsapp = `¡Hola! tus números preseleccionados son ${numerosTexto}\n\n`;
    mensajeWhatsapp += 'Escoge tu forma de pago:\n';
    mensajeWhatsapp += 'A • Nequi\n';
    mensajeWhatsapp += 'B • Nu\n';
    mensajeWhatsapp += 'C • Corresponsal\n';
    mensajeWhatsapp += 'D • Llave\n';
    mensajeWhatsapp += 'E • Efectivo\n\n';
    mensajeWhatsapp += 'Envia tu comprobante a este mis whatsapp y revisa la App que el estado de tus números cambie a Rojo (Reservado)';

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefonoWhatsapp}&text=${encodeURIComponent(mensajeWhatsapp)}`;
    
    // Abrimos WhatsApp en una nueva pestaña
    window.open(whatsappUrl, '_blank');
    // --- FIN CÓDIGO NUEVO ---
    
    await batch.commit();

    _modalIngresarDatos.classList.remove('flex');
    _numerosSeleccionadosPublica.length = 0; 
    
    actualizarSeleccionPublica(); // <-- INICIO CÓDIGO NUEVO: Limpiar UI
    
    _mostrarToast("¡Números apartados! Te contactaremos pronto.");
    
  } catch (error) {
    console.error("Error al guardar la compra: ", error);
    _mostrarToast("Error al apartar los números. Intenta de nuevo.", true);
  }
}


/* =========================================================
   Admin: cuadricula admin y filtros
   ========================================================= */
export function renderCuadriculaAdmin(filtro) {
  if (!_cuadriculaAdmin) return;
  _cuadriculaAdmin.innerHTML = '';

  const boletosFiltrados = _boletosRifa.filter(boleto => {
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
    _cuadriculaAdmin.appendChild(divBoleto);
  });
}

export function handleFiltroAdmin(e) {
  if (e.target.tagName !== 'BUTTON' || !_filtrosAdminContainer) return;
  const filtro = e.target.dataset.filtro;
  _filtrosAdminContainer.querySelectorAll('.filtro-btn-admin').forEach(btn => btn.classList.remove('filtro-admin-activo'));
  e.target.classList.add('filtro-admin-activo');
  renderCuadriculaAdmin(filtro);
}

/* =========================================================
   Tabla participantes
   ========================================================= */
export function renderTablaParticipantes() {
  if (!_tablaParticipantes) return; 
  _tablaParticipantes.innerHTML = '';

  if (_participantes.length === 0) {
    _tablaParticipantes.innerHTML = `
      <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
        Aún no hay participantes registrados.
      </div>
    `;
    return;
  }

  // --- MODIFICADO: Ordenar por nombre ---
  _participantes.sort((a, b) => a.nombre.localeCompare(b.nombre));

  _participantes.forEach(p => {
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
    card.className = "bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow";
    
    // --- INICIO CÓDIGO MODIFICADO: Añadir botones a tarjeta móvil ---
    card.innerHTML = `
      <div class="space-y-2 text-sm">
        <p class="font-bold text-gray-900 dark:text-white truncate" title="${p.nombre}">
          <span class="text-gray-500 dark:text-gray-400 font-medium">NOMBRE: </span>
          ${p.nombre}
        </p>
        <p class="text-gray-700 dark:text-gray-300 truncate">
          <span class="text-gray-500 dark:text-gray-400 font-medium">TELÉFONO: </span>
          ${p.telefono}
        </p>
        <p class="text-gray-700 dark:text-gray-300 truncate">
          <span class="text-gray-500 dark:text-gray-400 font-medium">NÚMEROS: </span>
          ${p.numeros.join(', ')}
        </p>
        <div class="flex items-center">
          <span class="text-gray-500 dark:text-gray-400 font-medium mr-2">ESTADO: </span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgEstado} ${colorEstado}">
            ${estadoTexto}
          </span>
        </div>
        
        ${p.estado !== 'pagado' ? `
        <div class="flex items-center justify-end gap-4 pt-3 mt-2 border-t dark:border-gray-700">
          <button class="btn-editar-participante text-blue-500 hover:text-blue-700 text-lg" data-id="${p.id}">
            <i class="fa-solid fa-pencil"></i>
          </button>
          <button class="btn-borrar-participante text-red-500 hover:text-red-700 text-lg" data-id="${p.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        ` : ''}
      </div>
    `;
    // --- FIN CÓDIGO MODIFICADO ---
    
    card.classList.add('md:hidden');
    
    // --- INICIO CÓDIGO MODIFICADO: Añadir botones a fila de tabla ---
    const tableRow = document.createElement('div');
    // Cambiado de grid-cols-4 a grid-cols-5
    tableRow.className = "hidden md:grid grid-cols-5 gap-4 items-center text-xs md:text-sm p-4"; 
    tableRow.innerHTML = `
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
        <div>
          ${p.estado !== 'pagado' ? `
          <div class="flex items-center justify-start gap-4">
            <button class="btn-editar-participante text-blue-500 hover:text-blue-700" data-id="${p.id}">
              <i class="fa-solid fa-pencil"></i>
            </button>
            <button class="btn-borrar-participante text-red-500 hover:text-red-700" data-id="${p.id}">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          ` : '<span class="text-gray-400 dark:text-gray-500 text-xs">Completado</span>'}
        </div>
    `;
    // --- FIN CÓDIGO MODIFICADO ---

    _tablaParticipantes.appendChild(card); 
    _tablaParticipantes.appendChild(tableRow); 
    
    const separator = document.createElement('hr');
    separator.className = "hidden md:block dark:border-gray-700";
    _tablaParticipantes.appendChild(separator);

  });
}


/* =========================================================
   Modal registro de venta (Admin)
   ========================================================= */

// --- MODIFICADO: Aceptar un ID para modo "Edición" ---
export function abrirModalRegistro(participanteId = null) {
  if (!_modalRegistrarVenta || !_formRegistrarVenta || !_camposNumerosDinamicos) return;
  
  _formRegistrarVenta.reset();
  _camposNumerosDinamicos.innerHTML = '';
  actualizarListaDisponiblesModal();
  
  // Limpiar cualquier ID de edición anterior
  const hiddenIdInput = document.getElementById('participante-id-hidden');
  if (hiddenIdInput) hiddenIdInput.remove();

  if (participanteId) {
    // --- MODO EDICIÓN ---
    const participante = _participantes.find(p => p.id === participanteId);
    if (!participante) {
      _mostrarToast("No se encontró al participante.", true);
      return;
    }

    // Cambiar título del modal
    _modalRegistrarVenta.querySelector('h3').textContent = "Editar Venta";
    
    // Llenar campos
    document.getElementById('participante-nombre').value = participante.nombre;
    document.getElementById('participante-telefono').value = participante.telefono;
    document.getElementById('participante-estado').value = participante.estado;

    // Añadir los números actuales del participante
    participante.numeros.forEach(numero => {
      anadirCampoNumero(numero, participante.numeros); // Pasa los números del participante
    });

    // Guardar el ID para saber que estamos editando
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.id = 'participante-id-hidden';
    idInput.value = participanteId;
    _formRegistrarVenta.appendChild(idInput);
    
  } else {
    // --- MODO REGISTRO ---
    _modalRegistrarVenta.querySelector('h3').textContent = "Registrar Venta Manual";
    anadirCampoNumero(null);
  }
  
  actualizarSelectsDinamicos();
  _modalRegistrarVenta.classList.add('flex');
}

function getNumerosDisponibles() {
  return _boletosRifa.filter(b => b.estado === 'disponible').map(b => b.numero);
}

function actualizarListaDisponiblesModal() {
  if (!_listaNumerosModal) return;
  const disponibles = getNumerosDisponibles();
  if (disponibles.length > 0) {
    _listaNumerosModal.textContent = `Disponibles: ${disponibles.join(', ')}`;
  } else {
    _listaNumerosModal.textContent = '¡No quedan números disponibles!';
  }
}

// --- MODIFICADO: Aceptar números "propios" del participante en modo edición ---
export function anadirCampoNumero(numeroSeleccionado, numerosPropios = []) {
  if (!_camposNumerosDinamicos) return;

  const numerosYaSeleccionadosEnModal = Array.from(_camposNumerosDinamicos.querySelectorAll('select'))
    .map(select => select.value)
    .filter(val => val !== '');

  // Los disponibles son: los 'disponibles' + los que ya tiene este participante
  const numerosDisponibles = getNumerosDisponibles();
  const numerosPropiosFiltrados = numerosPropios.filter(num => num !== numeroSeleccionado);
  const numerosParaSelect = [...numerosDisponibles, ...numerosPropiosFiltrados];

  const divCampo = document.createElement('div');
  divCampo.className = 'flex items-center gap-2';

  const select = document.createElement('select');
  select.className = 'w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white select-numero-dinamico';

  let optionsHTML = '<option value="" disabled>Selecciona un número</option>';
  
  if (numeroSeleccionado) {
    optionsHTML += `<option value="${numeroSeleccionado}" selected>${numeroSeleccionado}</option>`;
  }
  
  // Añadir números disponibles (que no estén ya en el modal)
  numerosDisponibles.forEach(num => {
    if (!numerosYaSeleccionadosEnModal.includes(num) || num === numeroSeleccionado) {
      optionsHTML += `<option value="${num}">${num}</option>`;
    }
  });
  
  // Añadir números que ya eran del participante (si no están ya en el modal)
  numerosPropios.forEach(num => {
      if (num !== numeroSeleccionado && !numerosDisponibles.includes(num) && !numerosYaSeleccionadosEnModal.includes(num)) {
          optionsHTML += `<option value="${num}" class="text-blue-500">(Propio) ${num}</option>`;
      }
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
  _camposNumerosDinamicos.appendChild(divCampo);
}

// --- MODIFICADO: Lógica de actualización para modo edición ---
function actualizarSelectsDinamicos() {
  if (!_camposNumerosDinamicos) return;
  
  const idInput = document.getElementById('participante-id-hidden');
  const participanteId = idInput ? idInput.value : null;
  const participante = participanteId ? _participantes.find(p => p.id === participanteId) : null;
  const numerosPropios = participante ? participante.numeros : [];

  const selects = _camposNumerosDinamicos.querySelectorAll('.select-numero-dinamico');
  const valoresSeleccionados = Array.from(selects).map(s => s.value).filter(v => v !== '');
  const numerosDisponibles = getNumerosDisponibles();

  selects.forEach(select => {
    const valorActual = select.value;
    
    let optionsHTML = '<option value="" disabled>Selecciona un número</option>';
    if (valorActual) optionsHTML += `<option value="${valorActual}" selected>${valorActual}</option>`;

    // Números disponibles (que no estén seleccionados en otro select)
    numerosDisponibles.forEach(num => {
      if (!valoresSeleccionados.includes(num) || num === valorActual) {
        if (num !== valorActual) optionsHTML += `<option value="${num}">${num}</option>`;
      }
    });
    
    // Números propios del participante (que no estén seleccionados en otro select)
    numerosPropios.forEach(num => {
        if (!numerosDisponibles.includes(num) && (!valoresSeleccionados.includes(num) || num === valorActual)) {
             if (num !== valorActual) optionsHTML += `<option value="${num}" class="text-blue-500">(Propio) ${num}</option>`;
        }
    });

    select.innerHTML = optionsHTML;
    select.value = valorActual;
  });
}

// --- MODIFICADO: Distinguir entre Guardar (Nuevo) y Actualizar (Edición) ---
export async function handleGuardarVenta(e) {
  e.preventDefault();
  if (!_formRegistrarVenta) return;

  const nombre = document.getElementById('participante-nombre').value;
  const telefono = document.getElementById('participante-telefono').value;
  const estado = document.getElementById('participante-estado').value;
  const idInput = document.getElementById('participante-id-hidden');
  const participanteId = idInput ? idInput.value : null;

  const selectsNumeros = _camposNumerosDinamicos.querySelectorAll('select');
  const numerosNuevos = Array.from(selectsNumeros).map(select => select.value).filter(value => value !== '');

  if (numerosNuevos.length === 0) {
    _mostrarToast("Debes seleccionar al menos un número.", true);
    return;
  }
  
  // --- Lógica de Validación (Comprobar disponibilidad) ---
  const participante = participanteId ? _participantes.find(p => p.id === participanteId) : null;
  const numerosOriginales = participante ? participante.numeros : [];
  
  for (const numero of numerosNuevos) {
    // Si el número no estaba en la lista original, debe estar disponible
    if (!numerosOriginales.includes(numero)) {
      const boleto = _boletosRifa.find(b => b.numero === numero);
      if (!boleto || boleto.estado !== 'disponible') {
          _mostrarToast(`El número ${numero} ya no está disponible.`, true);
          actualizarSelectsDinamicos();
          return;
      }
    }
  }

  try {
    const batch = writeBatch(db);
    const datosParticipante = {
      nombre: nombre,
      telefono: telefono,
      numeros: numerosNuevos.sort(),
      estado: estado
    };

    // --- Decidir si crear o actualizar ---
    if (participanteId) {
      // --- ACTUALIZAR (EDITAR) ---
      const participanteRef = doc(db, "participantes", participanteId);
      batch.update(participanteRef, datosParticipante);
      
      // Números que se quitaron (liberar)
      const numerosLiberados = numerosOriginales.filter(num => !numerosNuevos.includes(num));
      numerosLiberados.forEach(numero => {
          const boletoRef = doc(db, "boletos", numero);
          batch.update(boletoRef, { estado: "disponible", participanteId: "" });
      });
      
      // Números que se añadieron o mantuvieron (asignar)
      numerosNuevos.forEach(numero => {
          const boletoRef = doc(db, "boletos", numero);
          batch.update(boletoRef, { estado: estado, participanteId: participanteId });
      });
      
    } else {
      // --- CREAR (NUEVO) ---
      const docRef = await addDoc(collection(db, "participantes"), datosParticipante);
      
      numerosNuevos.forEach(numero => {
        const boletoRef = doc(db, "boletos", numero); 
        batch.update(boletoRef, {
          estado: estado,
          participanteId: docRef.id 
        });
      });
    }
    
    await batch.commit();
    
    _modalRegistrarVenta.classList.remove('flex');
    _mostrarToast(participanteId ? "¡Venta actualizada!" : "¡Venta registrada con éxito!");
    
  } catch (error) {
    console.error("Error al guardar la venta: ", error);
    _mostrarToast("Error al guardar la venta. Intenta de nuevo.", true);
  }
}

// --- INICIO CÓDIGO NUEVO: Función para Borrar Participante ---
export async function handleBorrarParticipante(participanteId) {
  if (!participanteId) return;
  
  const participante = _participantes.find(p => p.id === participanteId);
  if (!participante) {
      _mostrarToast("No se encontró al participante.", true);
      return;
  }
  
  // Confirmación
  if (!confirm(`¿Estás seguro de que quieres borrar a ${participante.nombre}? \nSus números (${participante.numeros.join(', ')}) volverán a estar disponibles.`)) {
    return;
  }

  try {
    const batch = writeBatch(db);

    // 1. Poner sus boletos como "disponible"
    participante.numeros.forEach(numero => {
      const boletoRef = doc(db, "boletos", numero);
      batch.update(boletoRef, {
        estado: "disponible",
        participanteId: "" // Quitar la referencia al participante
      });
    });
    
    // 2. Borrar el documento del participante
    const participanteRef = doc(db, "participantes", participanteId);
    batch.delete(participanteRef);
    
    // 3. Ejecutar el batch
    await batch.commit();
    
    _mostrarToast("Participante borrado y números liberados.");
    
  } catch (error) {
    console.error("Error al borrar participante: ", error);
    _mostrarToast("Error al borrar. Intenta de nuevo.", true);
  }
}
// --- FIN CÓDIGO NUEVO ---