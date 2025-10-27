
import { BACKEND_URL } from './config.js';

let API_BASE_URL = `${BACKEND_URL}`;

// Configuración de la API
const LOGIN_ENDPOINT = '/api/auth/login';

const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btnLogin');
const alertBox = document.getElementById('alertBox');
const apiUrlInput = document.getElementById('apiUrl');

// Variable para almacenar la sesión en memoria
let sesionActual = null;

// Actualizar URL de la API cuando cambie el input
apiUrlInput.addEventListener('change', function() {
    API_BASE_URL = this.value.trim();
    console.log('URL de API actualizada:', API_BASE_URL);
});

// Validación en tiempo real
usernameInput.addEventListener('input', function() {
    validateField(this, 'usernameError');
});

passwordInput.addEventListener('input', function() {
    validateField(this, 'passwordError');
});

function validateField(input, errorId) {
    const errorElement = document.getElementById(errorId);
    if (input.value.trim() === '') {
        input.classList.add('error');
        errorElement.classList.add('show');
        return false;
    } else {
        input.classList.remove('error');
        errorElement.classList.remove('show');
        return true;
    }
}

function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} show`;
    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 4000);
}

async function loginUsuario(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: username,
                password: password
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Validar campos
    const isUsernameValid = validateField(usernameInput, 'usernameError');
    const isPasswordValid = validateField(passwordInput, 'passwordError');

    if (!isUsernameValid || !isPasswordValid) {
        showAlert('Por favor completa todos los campos');
        return;
    }

    // Deshabilitar botón durante el proceso
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';

    try {
        const resultado = await loginUsuario(username, password);

        console.log('Respuesta del servidor:', resultado);

        // Verificar la respuesta según el formato de MessageLogin
        if (resultado.resultado === 'Ok') {
            showAlert(resultado.mensaje || '¡Login exitoso!', 'success');

            // Guardar sesión en memoria
            sesionActual = {
                username: username,
                timestamp: new Date().toISOString(),
                mensaje: resultado.mensaje
            };

            console.log('Sesión iniciada:', sesionActual);

            // Redirigir al dashboard después de 1.5 segundos
            setTimeout(() => {
                alert('Login exitoso. Redirigiendo al dashboard...');
                window.location.href='/miapp/dashboard.html'
            }, 1500);

        } else {
            showAlert(resultado.mensaje || 'Credenciales inválidas');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Iniciar Sesión';
        }

    } catch (error) {
        console.error('Error al intentar login:', error);
        showAlert('Error de conexión con el servidor. Verifica que Spring Boot esté ejecutándose en ' + API_BASE_URL);
        btnLogin.disabled = false;
        btnLogin.textContent = 'Iniciar Sesión';
    }
});

// Evento para "olvidaste tu contraseña"
document.getElementById('forgotPassword').addEventListener('click', function(e) {
    e.preventDefault();
    alert('Funcionalidad de recuperación de contraseña próximamente');
});

// Información de configuración en consola
console.log('=== CONFIGURACIÓN ===');
console.log('API Base URL:', API_BASE_URL);
console.log('Login Endpoint:', LOGIN_ENDPOINT);
console.log('===================');
console.log('Asegúrate de que tu aplicación Spring Boot esté ejecutándose');
console.log('y que CORS esté correctamente configurado.');