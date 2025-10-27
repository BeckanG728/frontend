import { BACKEND_URL } from '../config.js';

let API_BASE_URL = `${BACKEND_URL}`;

// Toggle menu móvil
const hamburger = document.getElementById('hamburger');
const navbarMenu = document.getElementById('navbarMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navbarMenu.classList.toggle('active');
});

// Cerrar menú al hacer clic en un link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navbarMenu.classList.remove('active');
    });
});

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        console.log('Cerrando sesión...');
        window.location.href = '../index.html';
    }
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        // Cargar clientes
        const clientesResponse = await fetch(`${API_BASE_URL}/api/clientes`);
        if (clientesResponse.ok) {
            const clientes = await clientesResponse.json();
            document.getElementById('totalClientes').textContent = clientes.length;
            document.getElementById('clientesCount').textContent = clientes.length;
        }

        // Cargar productos
        const productosResponse = await fetch(`${API_BASE_URL}/api/productos`);
        if (productosResponse.ok) {
            const productos = await productosResponse.json();
            document.getElementById('totalProductos').textContent = productos.length;
            document.getElementById('productosCount').textContent = productos.length;

            // Calcular stock total
            const stockTotal = productos.reduce((sum, p) => sum + (p.stocProd || 0), 0);
            document.getElementById('stockTotal').textContent = stockTotal;

            // Calcular valor del inventario
            const valorInventario = productos.reduce((sum, p) =>
                sum + ((p.precProd || 0) * (p.stocProd || 0)), 0
            );
            document.getElementById('valorInventario').textContent =
                'S/. ' + valorInventario.toFixed(2);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Cargar estadísticas al iniciar
window.addEventListener('load', () => {
    console.log('=== DASHBOARD CARGADO ===');
    console.log('API Base URL:', API_BASE_URL);
    cargarEstadisticas();
});