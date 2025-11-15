/* ===========================
   script_01.js
   Lógica dedicada para la página index_01.html ("Nuestra Web")
   =========================== */

// Importar la lógica de UI común
import { toggleSidebarGlobal, initDarkMode, registerDarkModeHandler } from './common-ui.js';

// --- INICIO: Lógica de WhatsApp ---
// Modificado: Número de WhatsApp actualizado
const WHATSAPP_NUMBER = '573205893469';

function handleReservarClick(productName) {
  let texto = `Este Amiguruni me encanto, me puedes dar información para poder adquirirlo... Gracias!!`;
  
  if (productName && productName !== 'Producto') {
    texto = `¡Hola! Me encantó el producto "${productName}". Me puedes dar información para poder adquirirlo... ¡Gracias!`;
  }
  
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(texto)}`;
  window.open(whatsappUrl, '_blank');
}
// --- FIN: Lógica de WhatsApp ---

// --- INICIO: Lógica de Compartir (copiada de script.js) ---
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
    // Fallback: Copiar al portapapeles
    console.log('Error al compartir o API no soportada:', err);
    navigator.clipboard.writeText(shareData.url);
    mostrarToast('Enlace copiado al portapapeles.');
  }
}
// --- FIN: Lógica de Compartir ---

// --- INICIO: Lógica de Toast (copiada de script.js) ---
let toastEl, toastMsg, toastCloseBtn;
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
// --- FIN: Lógica de Toast ---

// --- INICIO: Lógica de Vistas (simplificada) ---
let views, navLinks, mainContent;
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

  // Cargar el script de Instagram si la vista es la de Instagram
  if (viewId === 'view-instagram') {
    if (typeof instgrm !== 'undefined') {
      instgrm.Embeds.process();
    }
  }
}
// --- FIN: Lógica de Vistas ---


document.addEventListener('DOMContentLoaded', () => {
// ===== CAMBIO 4: Scroll al Top =====
mainContent = document.getElementById('main-content');
if (mainContent) mainContent.scrollTop = 0;
      
// Cachear elementos de esta página
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggle-sidebar-global');
const toggleBtnMobile = document.getElementById('toggle-sidebar-mobile');
const btnDarkMode = document.getElementById('btn-dark-mode');
const iconDarkMode = document.getElementById('icon-dark-mode');
const btnCompartir = document.getElementById('btn-compartir');
      
// --- INICIO: Cacheo de nuevos elementos ---
const navLinksContainer = document.getElementById('nav-links-container');
navLinks = navLinksContainer ? navLinksContainer.querySelectorAll('.nav-link') : [];
views = document.querySelectorAll('.view');
toastEl = document.getElementById('toast-notificacion');
toastMsg = document.getElementById('toast-mensaje');
toastCloseBtn = document.getElementById('toast-close');
const modalCloseBtns = document.querySelectorAll('.modal-close');

const btnReportarFallo = document.getElementById('btn-reportar-fallo');
const modalReportarFallo = document.getElementById('modal-reportar-fallo');
const formReportarFallo = document.getElementById('form-reportar-fallo');

const btnVivirAppModal = document.getElementById('btn-vivirapp-modal');
const modalVivirApp = document.getElementById('modal-vivirapp');
const iframeVivirApp = document.getElementById('iframe-vivirapp');

const btnInstagramView = document.getElementById('btn-instagram-view');
// --- FIN: Cacheo de nuevos elementos ---

// ===== CAMBIO 1: Menú colapsado en móvil =====
if (window.innerWidth < 768) {
sidebar?.classList.add('collapsed');
}
    
// --- Lógica importada de common-ui.js ---
initDarkMode(iconDarkMode);
toggleBtn?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleBtn, null));
toggleBtnMobile?.addEventListener('click', () => toggleSidebarGlobal(sidebar, toggleBtn, null));
registerDarkModeHandler(btnDarkMode, iconDarkMode);
// --- Fin de lógica importada ---

// Lógica de Links Especiales (Específica de esta página)
const btnNuestraWeb = document.getElementById('btn-nuestra-web');
// btnNuestraWeb?.addEventListener('click', (e) => e.preventDefault()); // Removido para que funcione el data-view
    
// Lógica de "Compartir" (Modificado para usar handleCompartir)
btnCompartir?.addEventListener('click', (e) => {
  e.preventDefault();
  handleCompartir();
});
    
// Lógica para links que van al index.html
const mainLinks = document.querySelectorAll('a[href^="index.html"]');
mainLinks.forEach(link => {
link.addEventListener('click', () => {
// Ocultar menú en móvil al hacer clic
if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('collapsed')) {
sidebar.classList.add('collapsed');
}
});
});


// --- INICIO: Lógica para nuevos Modales y Vistas ---

// Navegación de Vistas
if(navLinksContainer) {
  navLinksContainer.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link && link.dataset.view) {
      e.preventDefault();
      actualizarVistaActiva(link.dataset.view);
      if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('collapsed')) {
        toggleSidebarGlobal(sidebar, toggleBtn, null);
      }
    }
  });
}

// Abrir Modales
btnReportarFallo?.addEventListener('click', (e) => {
  e.preventDefault();
  modalReportarFallo?.classList.add('flex');
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

// Cerrar Modales
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

// Formulario Reportar Fallo
formReportarFallo?.addEventListener('submit', (e) => {
  e.preventDefault();
  const body = document.getElementById('reporte-textarea').value;
  const subject = 'Reporte de Fallo - Rifa Navideña';
  const to = 'viviraplicaciones@gmail.com';
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  modalReportarFallo?.classList.remove('flex');
  mostrarToast('Gracias por tu reporte.');
});

// Toast
toastCloseBtn?.addEventListener('click', () => {
  toastEl.classList.remove('opacity-100', 'pointer-events-auto');
  toastEl.classList.add('opacity-0', 'pointer-events-none');
});

// --- FIN: Lógica para nuevos Modales y Vistas ---


// --- INICIO: Lógica del Carrusel/Lightbox ---
const galeria = document.getElementById('galeria-productos');
const lightbox = document.getElementById('lightbox-modal');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxReservar = document.getElementById('lightbox-reservar-btn');

let galleryItems = [];
let currentIndex = 0;

// 1. Recopilar todos los ítems de la galería
const galleryCards = document.querySelectorAll('.gallery-item-card');
galleryCards.forEach(card => {
  const img = card.querySelector('.gallery-image');
  const title = card.querySelector('.product-title');
  if (img && title) {
    galleryItems.push({
      src: img.src,
      title: title.textContent.trim()
    });
  }
});

// 2. Función para mostrar el Lightbox
function showLightbox(index) {
  if (index < 0 || index >= galleryItems.length) return;
  
  currentIndex = index;
  const item = galleryItems[index];
  
  lightboxImage.src = item.src;
  lightboxReservar.dataset.productName = item.title; // Guardar el nombre para el botón
  
  lightbox.classList.remove('hidden');
  
  // Mostrar/ocultar flechas
  lightboxPrev.style.display = (index === 0) ? 'none' : 'flex';
  lightboxNext.style.display = (index === galleryItems.length - 1) ? 'none' : 'flex';
}

// 3. Función para cerrar el Lightbox
function closeLightbox() {
  lightbox.classList.add('hidden');
  lightboxImage.src = ""; // Limpiar para evitar flashes
}

// 4. Event Listeners para el Lightbox
if (galeria) {
  galeria.addEventListener('click', (e) => {
    // Clic en una imagen de la galería
    const clickedImage = e.target.closest('.gallery-image');
    if (clickedImage) {
      const card = clickedImage.closest('.gallery-item-card');
      const index = Array.from(galleryCards).indexOf(card);
      if (index > -1) {
        showLightbox(index);
      }
    }
    
    // Clic en un botón "Reservar" DENTRO de la tarjeta
    const clickedReservar = e.target.closest('.btn-reservar-amigurumi');
    if (clickedReservar) {
      const card = clickedReservar.closest('.gallery-item-card');
      const title = card.querySelector('.product-title')?.textContent.trim() || 'Producto';
      handleReservarClick(title);
    }
  });
}

lightboxClose?.addEventListener('click', closeLightbox);
lightboxPrev?.addEventListener('click', () => showLightbox(currentIndex - 1));
lightboxNext?.addEventListener('click', () => showLightbox(currentIndex + 1));

// Clic en el botón "Reservar" DENTRO del lightbox
lightboxReservar?.addEventListener('click', () => {
  handleReservarClick(lightboxReservar.dataset.productName);
});

// Cerrar con clic fuera de la imagen (en el fondo)
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});
// --- FIN: Lógica del Carrisel/Lightbox ---
      
});