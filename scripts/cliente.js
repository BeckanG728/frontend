// scripts/cliente.js
export async function viewLoadedCliente({ API_URL } = {}) {
  const api = API_URL || 'https://backend.tpdteam3.com/backend/api';
  const qs = (s, root=document) => root.querySelector(s);
  let clientes = [];

  function parseErrorMessage(error) {
    if (typeof error === 'string') {
      try { const p = JSON.parse(error); return p.message || p.mensaje || 'Error desconocido'; } catch { return error; }
    }
    if (error && typeof error === 'object') return error.message || error.mensaje || JSON.stringify(error);
    return 'Error desconocido';
  }

  function showAlert(message, type='info') {
    const container = qs('#alertContainer');
    if (!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);
    setTimeout(()=> alert.remove(), 4000);
  }

  async function loadClientes() {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${api}/clientes`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!res.ok) { showAlert('Error al cargar los clientes.', 'error'); return; }
      clientes = await res.json();
      renderClientes(clientes);
    } catch {
      showAlert('Error de conexión.', 'error');
    }
  }

  function renderClientes(list) {
    const tbody = qs('#clientesBody');
    if (!tbody) return;
    if (!list || list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="no-data"><h3>No hay clientes registrados</h3><p>Agrega tu primer cliente usando "Nuevo Cliente"</p></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(c => `
      <tr>
        <td class="cliente-id">#${c.codiClie}</td>
        <td class="cliente-nombre">${c.nombClie}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-edit" data-edit="${c.codiClie}"><span class="material-icons">edit</span>Editar</button>
            <button class="btn-delete" data-delete="${c.codiClie}"><span class="material-icons">delete</span>Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
    attachHandlers();
  }

  function attachHandlers() {
    const tbody = qs('#clientesBody');
    tbody.addEventListener('click', async (e) => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-delete]');
      if (edit) {
        const id = parseInt(edit.getAttribute('data-edit'), 10);
        openModal(id);
      } else if (del) {
        const id = parseInt(del.getAttribute('data-delete'), 10);
        await deleteCliente(id);
      }
    });
  }

  function openModal(id=null) {
    const modal = qs('#clienteModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden','false');
    qs('#clienteForm').reset();
    if (id) {
      const c = clientes.find(x => x.codiClie === id);
      qs('#modalTitleText').textContent = 'Editar Cliente';
      qs('#modalIcon').textContent = 'edit';
      qs('#clienteId').value = c.codiClie;
      qs('#clienteName').value = c.nombClie;
    } else {
      qs('#modalTitleText').textContent = 'Nuevo Cliente';
      qs('#modalIcon').textContent = 'person_add';
      qs('#clienteId').value = '';
    }
    setTimeout(()=> qs('#clienteName').focus(), 100);
  }

  function closeModal() {
    const modal = qs('#clienteModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden','true');
  }

  async function deleteCliente(id) {
    const cliente = clientes.find(c => c.codiClie === id);
    if (!confirm(`¿Eliminar cliente "${cliente.nombClie}"?`)) return;
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${api}/clientes/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        showAlert('Cliente eliminado.', 'success');
        await loadClientes();
      } else showAlert('No se pudo eliminar.', 'error');
    } catch {
      showAlert('Error de conexión.', 'error');
    }
  }

  // bind forms & buttons
  function bindUI() {
    const newBtn = qs('#btnNewClient');
    if (newBtn) newBtn.addEventListener('click', () => openModal());
    const closeBtn = qs('#clienteModalClose'); if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const cancelBtn = qs('#clienteFormCancel'); if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    qs('#clienteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = qs('#clienteId').value;
      const data = { nombClie: qs('#clienteName').value.trim() };
      try {
        const token = sessionStorage.getItem('token');
        const url = id ? `${api}/clientes/${id}` : `${api}/clientes`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
        if (res.ok) {
          showAlert(id ? 'Cliente actualizado.' : 'Cliente creado.', 'success');
          closeModal(); await loadClientes();
        } else {
          const err = await res.json().catch(()=>({ mensaje: 'Error desconocido' }));
          showAlert(parseErrorMessage(err), 'error');
        }
      } catch {
        showAlert('Error de conexión.', 'error');
      }
    });
    // search
    const search = qs('#searchInput');
    if (search) search.addEventListener('input', () => {
      const q = search.value.toLowerCase();
      const filtered = clientes.filter(c => (c.nombClie || '').toLowerCase().includes(q) || c.codiClie.toString().includes(q));
      renderClientes(filtered);
    });
  }

  bindUI();
  await loadClientes();
}
