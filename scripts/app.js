const API_URL = 'https://backend.tpdteam3.com/backend/api';

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

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
  qs('#userName').textContent = username || 'Usuario';
  qs('#userAvatar').textContent = (username[0] || 'U').toUpperCase();
}

/* -------------------------------------------------------
   SIDEBAR EFFECT EXACTO DEL ARCHIVO QUE MANDASTE
-------------------------------------------------------- */
function attachSidebarHandlers() {
  const sidebar = qs('#sidebar');
  const mainContent = qs('#mainContent');
  const toggleBtn = qs('#sidebarToggle');
  const toggleIcon = qs('#sidebarToggleIcon');
  const logo = qs('#sidebarLogo');

  toggleBtn.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed');

    if (collapsed) {
      // Sidebar colapsado → icono "Abrir" aparece
      toggleIcon.textContent = "left_panel_open";

      // El icono de abrir ocupa el lugar del logo
      logo.style.opacity = 0;
    } else {
      // Sidebar expandido → icono "Cerrar"
      toggleIcon.textContent = "left_panel_close";

      // Vuelve a mostrar el logo
      logo.style.opacity = 1;
    }
  });

  // navegación SPA
  qs('#sidebarMenu').addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;

    location.hash = `#${item.dataset.view}`;
    e.preventDefault();
  });
}

async function fetchView(view) {
  const res = await fetch(`views/${view}.html`, { cache: "no-store" });
  if (!res.ok) throw new Error('No se pudo cargar la vista');
  return res.text();
}

function setActiveNav(view) {
  qsa('.nav-item').forEach(a =>
    a.classList.toggle('active', a.dataset.view === view)
  );
}

async function loadRoute() {
  if (!checkAuth()) return;
  loadUserInfoToSidebar();

  let view = (location.hash || '#dashboard').substring(1);
  view = view.split('?')[0] || 'dashboard';

  setActiveNav(view);

  const html = await fetchView(view);
  const container = qs('#view');
  container.innerHTML = html;
  container.focus();

  try {
    const module = await import(`../scripts/${view}.js`);
    const fn = {
      dashboard: 'viewLoadedDashboard',
      producto: 'viewLoadedProducto',
      cliente: 'viewLoadedCliente'
    }[view];

    if (module[fn]) module[fn]({ API_URL });
  } catch (e) {
    console.warn("No module for view:", e);
  }
}

/* -------------------------------------------------- */

window.addEventListener('hashchange', loadRoute);
document.addEventListener('DOMContentLoaded', () => {
  attachSidebarHandlers();
  loadRoute();
});
