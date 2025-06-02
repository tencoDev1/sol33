import { supabase } from './supabase-config.js';

let currentFacingMode = 'user';
let currentStream = null;

async function initCamera(facingMode = 'user') {
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    
    try {
        // Detener cualquier stream activo
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Intentar obtener el stream con la cámara solicitada
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: facingMode }
            }
        });

        video.srcObject = currentStream;
        captureBtn.disabled = false;
        currentFacingMode = facingMode;

        // Actualizar texto del botón
        const switchBtn = document.getElementById('switchCameraBtn');
        if (switchBtn) {
            switchBtn.textContent = currentFacingMode === 'user' ? 
                '🔄 Cambiar a Cámara Trasera' : 
                '🔄 Cambiar a Cámara Frontal';
        }

    } catch (err) {
        console.error('Error al iniciar cámara:', err);
        handleCameraError(err);
    }
}

// Añadir función para manejar errores
function handleCameraError(err) {
    let errorMessage = 'Error al acceder a la cámara. ';
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage += 'Has denegado el permiso para usar la cámara.';
    } else if (err.name === 'NotFoundError') {
        errorMessage += 'No se encontró ninguna cámara en tu dispositivo.';
    } else if (err.name === 'NotReadableError') {
        errorMessage += 'Tu cámara está siendo usada por otra aplicación.';
    } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'No se pudo cambiar la cámara. Tu dispositivo puede no tener cámara trasera.';
    } else {
        errorMessage += err.message;
    }

    const cameraContainer = document.getElementById('cameraContainer');
    cameraContainer.innerHTML = `
        <div style="color: #e74c3c; padding: 20px; text-align: center;">
            <h3>❌ Error de Cámara</h3>
            <p>${errorMessage}</p>
            <button onclick="retryCamera()" class="camera-btn">
                🔄 Reintentar
            </button>
        </div>
    `;
}

function retryCamera() {
    const cameraContainer = document.getElementById('cameraContainer');
    cameraContainer.innerHTML = `
        <video id="videoElement" autoplay playsinline></video>
        <div class="camera-controls">
            <button id="captureBtn" class="camera-btn" disabled>📸 Take Photo</button>
            <button id="switchCameraBtn" class="camera-btn">🔄 Switch Camera</button>
        </div>
    `;
    initCamera(currentFacingMode);
    setupEventListeners();
}

async function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
        // Capturar frame del video
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        // Convertir a blob para Supabase
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        
        // Crear nombre único para el archivo
        const timestamp = new Date();
        const fileName = `photo_${timestamp.getTime()}.jpg`;

        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, blob);

        if (error) throw error;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

        // Crear preview
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-preview';
        
        const img = document.createElement('img');
        img.src = publicUrl;
        
        const fileNameDiv = document.createElement('div');
        fileNameDiv.className = 'file-name';
        fileNameDiv.textContent = `Photo_${timestamp.toISOString().slice(0,10)}`;
        
        const timeInfo = document.createElement('div');
        timeInfo.className = 'timestamp';
        timeInfo.textContent = timestamp.toLocaleTimeString();
        
        fileDiv.appendChild(img);
        fileDiv.appendChild(fileNameDiv);
        fileDiv.appendChild(timeInfo);
        
        document.getElementById('previewContainer').appendChild(fileDiv);

    } catch (error) {
        console.error('Error al subir la foto:', error);
        alert('Error al guardar la foto. Por favor, intenta de nuevo.');
    }
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    initCamera('user'); // Comenzar con la cámara frontal
    setupEventListeners();
});

function setupEventListeners() {
    // Configurar el botón de cambio de cámara
    const switchBtn = document.getElementById('switchCameraBtn');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            // Cambiar entre cámaras
            const newMode = currentFacingMode === 'user' ? 'environment' : 'user';
            initCamera(newMode);
        });
    }

    // Configurar el botón de captura
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }
}