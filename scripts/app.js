// scripts/app.js
const API_URL = 'https://backend.tpdteam3.com/backend/api';

function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

function checkAuth() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function loadUserInfoToSidebar() {
  const username = sessionStorage.getItem('username') || '';
  const userNameEl = qs('#userName');
  const avatarEl = qs('#userAvatar');
  if (userNameEl) userNameEl.textContent = username || 'Usuario';
  if (avatarEl) avatarEl.textContent = (username && username.charAt(0).toUpperCase()) || 'U';
}

async function fetchView(view) {
  const res = await fetch(`views/${view}.html`, { cache: "no-store" });
  if (!res.ok) throw new Error('No se pudo cargar la vista');
  return res.text();
}

function setActiveNav(view) {
  qsa('.nav-item').forEach(a => {
    a.classList.toggle('active', a.dataset.view === view);
  });
}

function attachGlobalUIHandlers() {
  const sidebarToggle = qs('#sidebarToggle');
  const sidebar = qs('#sidebar');
  const mainContent = qs('#mainContent');
  const toggleIcon = sidebarToggle && sidebarToggle.querySelector('.material-icons');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      mainContent.classList.toggle('sidebar-collapsed');
      if (toggleIcon) {
        toggleIcon.textContent = sidebar.classList.contains('collapsed') ? 'left_panel_open' : 'left_panel_close';
      }
    });
  }

  const logoutBtn = qs('#btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('username');
      window.location.href = 'index.html';
    });
  }

  // delegate in-sidebar links to router (in case user clicks inside sidebar)
  document.getElementById('sidebarMenu').addEventListener('click', (e) => {
    const a = e.target.closest('a.nav-item');
    if (a && a.dataset.view) {
      // set hash which triggers router
      window.location.hash = `#${a.dataset.view}`;
      e.preventDefault();
    }
  });
}

async function loadRoute() {
  if (!checkAuth()) return;
  loadUserInfoToSidebar();

  let view = (window.location.hash || '#dashboard').replace('#', '') || 'dashboard';
  // normalize
  view = view.split('?')[0];

  setActiveNav(view);

  try {
    const html = await fetchView(view);
    const container = qs('#view');
    container.innerHTML = html;
    container.focus();

    // dynamic import of script for the view
    try {
      const module = await import(`../scripts/${view}.js`);
      const fnName = {
        dashboard: 'viewLoadedDashboard',
        producto: 'viewLoadedProducto',
        cliente: 'viewLoadedCliente'
      }[view];

      if (module && typeof module[fnName] === 'function') {
        await module[fnName]({ API_URL });
      }
    } catch (err) {
      console.warn('No module for view or module failed:', err);
    }
  } catch (err) {
    console.error('Error cargando vista:', err);
    qs('#view').innerHTML = `<div class="no-data"><h3>Error cargando la vista</h3><p>${err.message}</p></div>`;
  }
}

// Router hooks
window.addEventListener('hashchange', loadRoute);
window.addEventListener('popstate', loadRoute);

// initial bootstrap
document.addEventListener('DOMContentLoaded', () => {
  attachGlobalUIHandlers();
  loadRoute();
});
