import { BACKEND_URL } from '../../config.js';

let API_BASE_URL = `${BACKEND_URL}`;

const API_PRODUCTOS = '/api/productos';
let productos = [];

const apiUrlInput = document.getElementById('apiUrl');
const alertBox = document.getElementById('alertBox');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tablaProductos = document.getElementById('tablaProductos');
const tbodyProductos = document.getElementById('tbody-productos');
const modalProducto = document.getElementById('modalProducto');
const formProducto = document.getElementById('formProducto');
const modalTitulo = document.getElementById('modalTitulo');
const productoIdInput = document.getElementById('productoId');
const productoVersionInput = document.getElementById('productoVersion');
const nombreProductoInput = document.getElementById('nombreProducto');
const precioProductoInput = document.getElementById('precioProducto');
const stockProductoInput = document.getElementById('stockProducto');
const versionInfo = document.getElementById('versionInfo');
const currentVersionSpan = document.getElementById('currentVersion');

// Actualizar URL de la API
apiUrlInput.addEventListener('change', function() {
    API_BASE_URL = this.value.trim();
    console.log('URL de API actualizada:', API_BASE_URL);
    cargarProductos();
});

function showAlert(message, type = 'error') {
    alertBox.innerHTML = message;
    alertBox.className = `alert alert-${type} show`;

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, type === 'conflict' ? 8000 : 4000);
}

async function cargarProductos() {
    try {
        loadingState.style.display = 'block';
        emptyState.style.display = 'none';
        tablaProductos.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}${API_PRODUCTOS}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        productos = await response.json();
        mostrarProductos();

    } catch (error) {
        console.error('Error al cargar productos:', error);
        showAlert('Error al cargar productos. Verifica que el servidor esté activo.');
        loadingState.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

function mostrarProductos() {
    loadingState.style.display = 'none';

    if (productos.length === 0) {
        emptyState.style.display = 'block';
        tablaProductos.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    tablaProductos.style.display = 'table';

    tbodyProductos.innerHTML = '';

    productos.forEach(producto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${producto.codiProd}</td>
            <td>${producto.nombProd}</td>
            <td>S/. ${parseFloat(producto.precProd).toFixed(2)}</td>
            <td>${producto.stocProd}</td>
            <td><span class="version-badge">v${producto.version}</span></td>
            <td>
                <button class="btn-action btn-editar" onclick="editarProducto(${producto.codiProd})">Editar</button>
                <button class="btn-action btn-eliminar" onclick="confirmarEliminar(${producto.codiProd}, '${producto.nombProd}')">Eliminar</button>
            </td>
        `;
        tbodyProductos.appendChild(tr);
    });
}

function abrirModalNuevo() {
    modalTitulo.textContent = 'Nuevo Producto';
    productoIdInput.value = '';
    productoVersionInput.value = '';
    nombreProductoInput.value = '';
    precioProductoInput.value = '';
    stockProductoInput.value = '';
    versionInfo.style.display = 'none';
    modalProducto.classList.add('show');
}

function editarProducto(id) {
    const producto = productos.find(p => p.codiProd === id);
    if (!producto) return;

    modalTitulo.textContent = 'Editar Producto';
    productoIdInput.value = producto.codiProd;
    productoVersionInput.value = producto.version;
    nombreProductoInput.value = producto.nombProd;
    precioProductoInput.value = producto.precProd;
    stockProductoInput.value = producto.stocProd;

    versionInfo.style.display = 'block';
    currentVersionSpan.textContent = producto.version;

    modalProducto.classList.add('show');
}

function cerrarModal() {
    modalProducto.classList.remove('show');
    formProducto.reset();
    versionInfo.style.display = 'none';
}

formProducto.addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = productoIdInput.value;
    const version = productoVersionInput.value;
    const nombre = nombreProductoInput.value.trim();
    const precio = parseFloat(precioProductoInput.value);
    const stock = parseFloat(stockProductoInput.value);

    if (!nombre || isNaN(precio) || isNaN(stock)) {
        showAlert('Por favor completa todos los campos correctamente');
        return;
    }

    if (precio < 0) {
        showAlert('El precio no puede ser negativo');
        return;
    }

    if (stock < 0) {
        showAlert('El stock no puede ser negativo');
        return;
    }

    const productoData = {
        nombProd: nombre,
        precProd: precio,
        stocProd: stock
    };

    // Si estamos editando, incluir la versión
    if (id && version) {
        productoData.codiProd = parseInt(id);
        productoData.version = parseInt(version);
    }

    console.log('Enviando datos:', productoData);

    try {
        let response;

        if (id) {
            // Actualizar
            response = await fetch(`${API_BASE_URL}${API_PRODUCTOS}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productoData)
            });
        } else {
            // Crear
            response = await fetch(`${API_BASE_URL}${API_PRODUCTOS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(productoData)
            });
        }

        console.log('Status de respuesta:', response.status);

        // Intentar parsear JSON solo si hay contenido
        let resultado = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
                resultado = JSON.parse(text);
            }
        }

        console.log('Resultado:', resultado);

        if (response.status === 409) {
            // Conflicto de concurrencia
            showAlert(
                `<div class="alert-conflict">
                    <span><strong>⚠️ Conflicto de Concurrencia:</strong> ${resultado?.message || 'El producto fue modificado por otro usuario'}</span>
                    <button class="btn-reload" onclick="recargarYEditar(${id})">🔄 Recargar Datos</button>
                </div>`,
                'conflict'
            );
            return;
        }

        if (!response.ok) {
            const mensaje = resultado?.message || `Error HTTP: ${response.status}`;
            showAlert(mensaje);
            return;
        }

        showAlert(id ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente', 'success');
        cerrarModal();
        cargarProductos();

    } catch (error) {
        console.error('Error al guardar producto:', error);
        showAlert(`Error al guardar el producto: ${error.message}`);
    }
});

async function recargarYEditar(id) {
    try {
        // Recargar todos los productos
        await cargarProductos();

        // Cerrar el modal actual
        cerrarModal();

        // Pequeña pausa para que el usuario vea que se recargaron los datos
        setTimeout(() => {
            // Abrir el modal de edición con los datos actualizados
            editarProducto(id);
            showAlert('Datos actualizados. Ahora puedes continuar con la edición.', 'success');
        }, 500);

    } catch (error) {
        showAlert('Error al recargar los datos. Intenta nuevamente.');
    }
}

async function confirmarEliminar(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${API_PRODUCTOS}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Intentar parsear JSON solo si hay contenido
        let resultado = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text) {
                resultado = JSON.parse(text);
            }
        }

        if (!response.ok) {
            const mensaje = resultado?.message || `Error HTTP: ${response.status}`;
            showAlert(mensaje);
            return;
        }

        showAlert('Producto eliminado exitosamente', 'success');
        cargarProductos();

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showAlert(`Error al eliminar el producto: ${error.message}`);
    }
}

// Cerrar modal al hacer click fuera
modalProducto.addEventListener('click', function(e) {
    if (e.target === modalProducto) {
        cerrarModal();
    }
});

// Cargar productos al iniciar
window.addEventListener('load', function() {
    console.log('=== CRUD PRODUCTOS CON CONTROL DE CONCURRENCIA ===');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Productos Endpoint:', API_PRODUCTOS);
    console.log('Control de concurrencia: OPTIMISTA (usando @Version)');
    cargarProductos();
});