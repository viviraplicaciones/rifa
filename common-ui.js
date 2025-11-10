/* =========================================================
   common-ui.js
   Lógica de UI compartida (Sidebar, Dark Mode)
   ========================================================= */

/**
 * Controla el colapso del sidebar y la posición del botón de PC.
 * @param {HTMLElement} sidebar - El elemento del sidebar.
 * @param {HTMLElement} toggleSidebarGlobalBtn - El botón de toggle (versión PC).
 */
export function toggleSidebarGlobal(sidebar, toggleSidebarGlobalBtn) {
  sidebar?.classList.toggle('collapsed');
  
  if (sidebar?.classList.contains('collapsed')) {
    toggleSidebarGlobalBtn?.classList.remove('md:left-[15rem]');
    toggleSidebarGlobalBtn?.classList.add('left-4', 'md:left-4');
  } else {
    toggleSidebarGlobalBtn?.classList.remove('left-4');
    toggleSidebarGlobalBtn?.classList.add('md:left-[15rem]');
  }
}

/**
 * Inicializa el tema (claro/oscuro) al cargar la página.
 * @param {HTMLElement} iconDarkMode - El ícono (luna/sol).
 */
export function initDarkMode(iconDarkMode) {
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
}

/**
 * Registra el event listener para el botón de Dark Mode.
 * @param {HTMLElement} btnDarkMode - El botón para cambiar el tema.
 * @param {HTMLElement} iconDarkMode - El ícono (luna/sol).
 */
export function registerDarkModeHandler(btnDarkMode, iconDarkMode) {
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