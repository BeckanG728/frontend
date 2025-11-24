const API_URL = 'https://backend.tpdteam3.com/backend/api';

// Importar el cargador de CSS
import { cssLoader, loadViewStyles, initBaseStyles } from './cssLoader.js';

// Utilidades
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} - true si tiene token, false si no
 */
function checkAuth() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/**
 * Carga la información del usuario en el sidebar
 */
function loadUserInfoToSidebar() {
  const username = sessionStorage.getItem('username') || '';
  qs('#userName').textContent = username || 'Usuario';
  qs('#userAvatar').textContent = (username[0] || 'U').toUpperCase();
}

/**
 * Maneja el logout del usuario
 */
function handleLogout() {
  const btnLogout = qs('#btnLogout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', () => {
    // Confirmación antes de cerrar sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Limpiar datos de sesión
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      
      // Redirigir al login
      window.location.href = 'index.html';
    }
  });
}

/**
 * Detecta si está en modo móvil
 * @returns {boolean}
 */
function isMobile() {
  return window.innerWidth <= 768;
}

/**
 * Cierra el menú móvil
 */
function closeMobileMenu() {
  const sidebar = qs('#sidebar');
  const overlay = qs('.sidebar-overlay');
  
  if (sidebar) {
    sidebar.classList.remove('mobile-open');
  }
  
  if (overlay) {
    overlay.classList.remove('active');
  }
  
  document.body.classList.remove('menu-open');
}

/**
 * Abre el menú móvil
 */
function openMobileMenu() {
  const sidebar = qs('#sidebar');
  const overlay = qs('.sidebar-overlay');
  
  if (sidebar) {
    sidebar.classList.add('mobile-open');
  }
  
  if (overlay) {
    overlay.classList.add('active');
  }
  
  document.body.classList.add('menu-open');
}

/**
 * Toggle del menú móvil
 */
function toggleMobileMenu() {
  const sidebar = qs('#sidebar');
  
  if (sidebar && sidebar.classList.contains('mobile-open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
}

/**
 * Maneja el comportamiento del sidebar colapsable
 */
function attachSidebarHandlers() {
  const sidebar = qs('#sidebar');
  const mainContent = qs('#mainContent');
  const toggleBtn = qs('#sidebarToggle');
  const toggleIcon = qs('#sidebarToggleIcon');
  const logo = qs('#sidebarLogo');

  if (!toggleBtn) return;

  // Crear overlay para móvil
  if (!qs('.sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.addEventListener('click', closeMobileMenu);
    document.body.appendChild(overlay);
  }

  toggleBtn.addEventListener('click', () => {
    if (isMobile()) {
      // Comportamiento móvil: toggle menú hamburguesa
      toggleMobileMenu();
    } else {
      // Comportamiento desktop: colapsar sidebar
      const collapsed = sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('sidebar-collapsed');

      if (collapsed) {
        toggleIcon.textContent = 'chevron_right';
        toggleBtn.setAttribute('title', 'Expandir menú');
        toggleBtn.setAttribute('aria-label', 'Expandir menú');
        logo.style.opacity = '0';
      } else {
        toggleIcon.textContent = 'chevron_left';
        toggleBtn.setAttribute('title', 'Colapsar menú');
        toggleBtn.setAttribute('aria-label', 'Colapsar menú');
        logo.style.opacity = '1';
      }
    }
  });

  // Actualizar ícono según el tamaño de pantalla
  const updateToggleIcon = () => {
    if (isMobile()) {
      // En móvil, siempre mostrar hamburguesa o X
      if (sidebar.classList.contains('mobile-open')) {
        toggleIcon.textContent = 'close';
      } else {
        toggleIcon.textContent = 'menu';
      }
    } else {
      // En desktop, mostrar chevron según estado
      closeMobileMenu(); // Cerrar menú si se cambia a desktop
      if (sidebar.classList.contains('collapsed')) {
        toggleIcon.textContent = 'chevron_right';
      } else {
        toggleIcon.textContent = 'chevron_left';
      }
    }
  };

  // Actualizar al cargar y al redimensionar
  updateToggleIcon();
  window.addEventListener('resize', updateToggleIcon);

  // Navegación SPA
  const sidebarMenu = qs('#sidebarMenu');
  if (sidebarMenu) {
    sidebarMenu.addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (!item) return;

      const view = item.dataset.view;
      if (view) {
        location.hash = `#${view}`;
        e.preventDefault();
        
        // Cerrar menú móvil al navegar
        if (isMobile()) {
          closeMobileMenu();
        }
      }
    });
  }
}

/**
 * Carga una vista HTML desde la carpeta views
 * @param {string} view - Nombre de la vista
 * @returns {Promise<string>} - HTML de la vista
 */
async function fetchView(view) {
  try {
    const res = await fetch(`views/${view}.html`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (error) {
    console.error(`Error cargando vista ${view}:`, error);
    return `
      <div class="no-data">
        <h3>Error al cargar la vista</h3>
        <p>No se pudo cargar el contenido. Por favor, intenta nuevamente.</p>
      </div>
    `;
  }
}

/**
 * Marca el item activo en el menú de navegación
 * @param {string} view - Nombre de la vista activa
 */
function setActiveNav(view) {
  qsa('.nav-item').forEach(item => {
    const isActive = item.dataset.view === view;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/**
 * Carga la ruta/vista actual basada en el hash de la URL
 */
async function loadRoute() {
  // Verificar autenticación
  if (!checkAuth()) return;

  // Cargar info del usuario
  loadUserInfoToSidebar();

  // Obtener vista del hash
  let view = (location.hash || '#dashboard').substring(1);
  view = view.split('?')[0] || 'dashboard';

  // Validar vista
  const validViews = ['dashboard', 'producto', 'cliente'];
  if (!validViews.includes(view)) {
    view = 'dashboard';
    location.hash = '#dashboard';
  }

  // Marcar navegación activa
  setActiveNav(view);

  // CARGAR CSS ESPECÍFICO DE LA VISTA
  console.log(`🎨 Cargando estilos para: ${view}`);
  await loadViewStyles(view);

  // Cargar HTML de la vista
  const html = await fetchView(view);
  const container = qs('#view');
  container.innerHTML = html;
  container.focus();

  // Cargar módulo JavaScript de la vista si existe
  try {
    const module = await import(`./${view}.js`);
    
    const functionMap = {
      dashboard: 'viewLoadedDashboard',
      producto: 'viewLoadedProducto',
      cliente: 'viewLoadedCliente'
    };

    const functionName = functionMap[view];
    if (module[functionName]) {
      await module[functionName]({ API_URL });
    }
  } catch (error) {
    console.warn(`No se encontró módulo para la vista ${view}:`, error);
  }

  // Log de estadísticas de CSS
  console.log('📊 Estadísticas CSS:', cssLoader.getStats());
}

/**
 * Inicializa la aplicación
 */
async function initApp() {
  // Verificar autenticación
  if (!checkAuth()) return;

  // CARGAR ESTILOS BASE (sidebar y base.css)
  console.log('🎨 Inicializando estilos base...');
  await initBaseStyles();

  // Configurar sidebar
  attachSidebarHandlers();

  // Configurar logout
  handleLogout();

  // Cargar ruta inicial
  await loadRoute();

  // Escuchar cambios en el hash
  window.addEventListener('hashchange', loadRoute);

  console.log('✅ Aplicación inicializada correctamente');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}