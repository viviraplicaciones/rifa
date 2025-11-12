/* ==============tablas-numericas.js (v28 - Animación Suerte)=============================== */

// Importar la base de datos (db) y funciones de Firestore
import { 
    db, 
    collection, 
    addDoc, 
    doc, 
    writeBatch 
} from './firebase-init.js';

// Variables de estado y DOM
let _boletosRifa = [];
let _participantes = [];
let _PRECIO_BOLETO = 6000;
let _numerosSeleccionadosPublica = [];
let _mostrarToast = () => {};
let _isSuerteDisabled = false; // Previene doble clic en el botón Suerte

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
  _imgSuerte = config.imgSuerte; // <-- Imagen del dado

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
  // Si la animación ya está ocurriendo, no hacer nada
  if (_isSuerteDisabled) return;

  const disponibles = getNumerosDisponibles();
  const numerosParaElegir = disponibles.filter(num => !_numerosSeleccionadosPublica.includes(num));

  if (numerosParaElegir.length === 0) {
    _mostrarToast("¡No quedan números disponibles por elegir!", true);
    return;
  }
  
  // 1. Deshabilitar el botón y empezar la animación
  _isSuerteDisabled = true;
  if (_imgSuerte) {
    // Forzar el reinicio del GIF añadiendo un timestamp
    _imgSuerte.src = `images/dado.gif?t=${new Date().getTime()}`;
  }

  // 2. Esperar a que la animación ocurra
  setTimeout(() => {
    // 3. Seleccionar el número
    const randomIndex = Math.floor(Math.random() * numerosParaElegir.length);
    const numeroSuerte = numerosParaElegir[randomIndex];
    _numerosSeleccionadosPublica.push(numeroSuerte);

    // 4. Mostrar el modal de resultado
    if (_modalSuerteNumero) _modalSuerteNumero.textContent = numeroSuerte;
    _modalSuerte?.classList.add('flex');

    // 5. Refrescar la UI
    renderCuadriculaPublica();
    actualizarSeleccionPublica();
    
    // 6. Volver a la imagen estática
    if (_imgSuerte) {
      _imgSuerte.src = 'images/dado.png';
    }
    
    // 7. Ocultar el modal de resultado después de 2 seg
    setTimeout(() => {
      _modalSuerte?.classList.remove('flex');
    }, 2000);

    // 8. Rehabilitar el botón
    _isSuerteDisabled = false;

  }, 1500); // 1.5 segundos de animación del dado
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
      numeros: _numerosSeleccionadosPublica,
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
    
    await batch.commit();

    _modalIngresarDatos.classList.remove('flex');
    _numerosSeleccionadosPublica.length = 0; 
    
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
      </div>
    `;
    
    card.classList.add('md:hidden');
    
    const tableRow = document.createElement('div');
    tableRow.className = "hidden md:grid grid-cols-4 gap-4 items-center text-xs md:text-sm p-4"; 
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
    `;

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
export function abrirModalRegistro() {
  if (!_modalRegistrarVenta || !_formRegistrarVenta || !_camposNumerosDinamicos) return;
  _formRegistrarVenta.reset();
  _camposNumerosDinamicos.innerHTML = '';
  actualizarListaDisponiblesModal();
  anadirCampoNumero(null);
  _modalRegistrarVenta.classList.add('flex');
}

function getNumerosDisponibles() {
  // Esta función ahora es usada por 'handleBotonSuerte' y 'abrirModalRegistro'
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

export function anadirCampoNumero(numeroSeleccionado) {
  if (!_camposNumerosDinamicos) return;

  const numerosYaSeleccionadosEnModal = Array.from(_camposNumerosDinamicos.querySelectorAll('select'))
    .map(select => select.value)
    .filter(val => val !== '');

  const numerosDisponibles = getNumerosDisponibles().filter(num => !numerosYaSeleccionadosEnModal.includes(num) || num === numeroSeleccionado);

  const divCampo = document.createElement('div');
  divCampo.className = 'flex items-center gap-2';

  const select = document.createElement('select');
  select.className = 'w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white select-numero-dinamico';

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
  _camposNumerosDinamicos.appendChild(divCampo);
}

function actualizarSelectsDinamicos() {
  if (!_camposNumerosDinamicos) return;

  const selects = _camposNumerosDinamicos.querySelectorAll('.select-numero-dinamico');
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

export async function handleGuardarVenta(e) {
  e.preventDefault();
  if (!_formRegistrarVenta) return;

  const nombre = document.getElementById('participante-nombre').value;
  const telefono = document.getElementById('participante-telefono').value;
  const estado = document.getElementById('participante-estado').value;

  const selectsNumeros = _camposNumerosDinamicos.querySelectorAll('select');
  const numerosSeleccionados = Array.from(selectsNumeros).map(select => select.value).filter(value => value !== '');

  if (numerosSeleccionados.length === 0) {
    _mostrarToast("Debes seleccionar al menos un número.", true);
    return;
  }
  
  for (const numero of numerosSeleccionados) {
    const boleto = _boletosRifa.find(b => b.numero === numero);
    if (!boleto || boleto.estado !== 'disponible') {
        _mostrarToast(`El número ${numero} ya no está disponible.`, true);
        actualizarSelectsDinamicos();
        return;
    }
  }

  try {
    const nuevoParticipante = {
      nombre: nombre,
      telefono: telefono,
      numeros: numerosSeleccionados,
      estado: estado
    };
    
    const docRef = await addDoc(collection(db, "participantes"), nuevoParticipante);

    const batch = writeBatch(db);
    
    numerosSeleccionados.forEach(numero => {
      const boletoRef = doc(db, "boletos", numero); 
      batch.update(boletoRef, {
        estado: estado,
        participanteId: docRef.id 
      });
    });
    
    await batch.commit();
    
    _modalRegistrarVenta.classList.remove('flex');
    _mostrarToast("¡Venta registrada con éxito!");

    _filtrosAdminContainer.querySelectorAll('.filtro-btn-admin').forEach(btn => btn.classList.remove('filtro-admin-activo'));
    const todosBtn = document.querySelector('.filtro-btn-admin[data-filtro="todos"]');
    if (todosBtn) todosBtn.classList.add('filtro-admin-activo');
    
  } catch (error) {
    console.error("Error al guardar la venta: ", error);
    _mostrarToast("Error al guardar la venta. Intenta de nuevo.", true);
  }
}