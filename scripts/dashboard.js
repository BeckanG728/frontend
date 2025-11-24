// scripts/dashboard.js
export async function viewLoadedDashboard({ API_URL } = {}) {
  // Called after dashboard content is injected in DOM
  const api = API_URL || 'https://backend.tpdteam3.com/backend/api';

  function qs(sel) { return document.querySelector(sel); }

  async function loadStats() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
      const productosRes = await fetch(`${api}/productos`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (productosRes.ok) {
        const productos = await productosRes.json();
        qs('#totalProductos').textContent = productos.length;
        const conImagen = productos.filter(p => p.imagenId).length;
        qs('#productosConImagen').textContent = conImagen;
      }
      const clientesRes = await fetch(`${api}/clientes`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (clientesRes.ok) {
        const clientes = await clientesRes.json();
        qs('#totalClientes').textContent = clientes.length;
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }

  // execute
  loadStats();
}
