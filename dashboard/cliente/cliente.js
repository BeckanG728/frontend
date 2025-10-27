
import { BACKEND_URL } from './config.js';

let API_BASE_URL = `${BACKEND_URL}`;

const API_CLIENTES = '/api/clientes';
let clientes = [];

const apiUrlInput = document.getElementById('apiUrl');
const alertBox = document.getElementById('alertBox');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tablaClientes = document.getElementById('tablaClientes');
const tbodyClientes = document.getElementById('tbody-clientes');
const modalCliente = document.getElementById('modalCliente');
const formCliente = document.getElementById('formCliente');
const modalTitulo = document.getElementById('modalTitulo');
const clienteIdInput = document.getElementById('clienteId');
const nombreClienteInput = document.getElementById('nombreCliente');

// Actualizar URL de la API
apiUrlInput.addEventListener('change', function() {
    API_BASE_URL = this.value.trim();
    console.log('URL de API actualizada:', API_BASE_URL);
    cargarClientes();
});

function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 4000);
}

async function cargarClientes() {
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        tablaClientes.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}${API_CLIENTES}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        clientes = await response.json();
        mostrarClientes();

    } catch (error) {
        console.error('Error al cargar clientes:', error);
        showAlert('Error al cargar clientes. Verifica que el servidor esté activo.');
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

function mostrarClientes() {
    loadingState.style.display = 'none';

    if (clientes.length === 0) {
        emptyState.style.display = 'block';
        tablaClientes.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tablaClientes.style.display = 'table';

    tbodyClientes.innerHTML = '';

    clientes.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cliente.codiClie}</td>
            <td>${cliente.nombClie}</td>
            <td>
                <button class="btn-action btn-editar" onclick="editarCliente(${cliente.codiClie})">Editar</button>
                <button class="btn-action btn-eliminar" onclick="confirmarEliminar(${cliente.codiClie}, '${cliente.nombClie}')">Eliminar</button>
            </td>
        `;
        tbodyClientes.appendChild(tr);
    });
}

function abrirModalNuevo() {
    modalTitulo.textContent = 'Nuevo Cliente';
    clienteIdInput.value = '';
    nombreClienteInput.value = '';
    modalCliente.classList.add('show');
}

function editarCliente(id) {
    const cliente = clientes.find(c => c.codiClie === id);
    if (!cliente) return;

    modalTitulo.textContent = 'Editar Cliente';
    clienteIdInput.value = cliente.codiClie;
    nombreClienteInput.value = cliente.nombClie;
    modalCliente.classList.add('show');
}

function cerrarModal() {
    modalCliente.classList.remove('show');
    formCliente.reset();
}

formCliente.addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = clienteIdInput.value;
    const nombre = nombreClienteInput.value.trim();

    if (!nombre) {
        showAlert('Por favor ingrese el nombre del cliente');
        return;
    }

    const clienteData = {
        nombClie: nombre
    };

    try {
        let response;

        if (id) {
            // Actualizar
            clienteData.codiClie = parseInt(id);
            response = await fetch(`${API_BASE_URL}${API_CLIENTES}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });
        } else {
            // Crear
            response = await fetch(`${API_BASE_URL}${API_CLIENTES}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });
        }

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const resultado = await response.json();
        console.log('Cliente guardado:', resultado);

        showAlert(id ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente', 'success');
        cerrarModal();
        cargarClientes();

    } catch (error) {
        console.error('Error al guardar cliente:', error);
        showAlert('Error al guardar el cliente. Intenta nuevamente.');
    }
});

async function confirmarEliminar(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar al cliente "${nombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${API_CLIENTES}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        showAlert('Cliente eliminado exitosamente', 'success');
        cargarClientes();

    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        showAlert('Error al eliminar el cliente. Intenta nuevamente.');
    }
}

// Cerrar modal al hacer click fuera
modalCliente.addEventListener('click', function(e) {
    if (e.target === modalCliente) {
        cerrarModal();
    }
});

// Cargar clientes al iniciar
window.addEventListener('load', function() {
    console.log('=== CRUD CLIENTES ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Clientes Endpoint:', API_CLIENTES);
    cargarClientes();
});