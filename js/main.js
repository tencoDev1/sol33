import { supabase, signInAnonymously } from './supabase-config.js'

let currentFacingMode = 'user'
let currentStream = null

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
    const errorMessage = getErrorMessage(err);
    alert(errorMessage);
}

function getErrorMessage(err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'Permiso de cámara denegado';
    } else if (err.name === 'NotFoundError') {
        return 'No se encontró cámara en el dispositivo';
    } else if (err.name === 'NotReadableError') {
        return 'La cámara está siendo usada por otra aplicación';
    }
    return `Error: ${err.message}`;
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

// Inicialización de la aplicación
async function initializeApp() {
    try {
        await signInAnonymously()
        await initCamera()
        setupEventListeners()
    } catch (error) {
        console.error('Error de inicialización:', error)
        handleError(error)
    }
}

// Función para capturar foto
async function capturePhoto() {
    try {
        const video = document.getElementById('videoElement')
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Capturar imagen
        const context = canvas.getContext('2d')
        context.drawImage(video, 0, 0)
        
        // Convertir a blob
        const blob = await new Promise(resolve => 
            canvas.toBlob(resolve, 'image/jpeg', 0.95)
        )

        // Generar nombre único
        const timestamp = new Date()
        const fileName = `photo_${timestamp.getTime()}.jpg`

        // Subir a Supabase
        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, blob)

        if (error) throw error

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)

        // Mostrar preview
        showPreview(publicUrl, timestamp)

    } catch (error) {
        console.error('Error:', error)
        alert('Error al subir la foto: ' + error.message)
    }
}

// Añadir esta función
function showPreview(publicUrl, timestamp) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-preview';
    
    const img = document.createElement('img');
    img.src = publicUrl;
    
    const fileNameDiv = document.createElement('div');
    fileNameDiv.className = 'file-name';
    fileNameDiv.textContent = `Photo_${timestamp.toLocaleDateString()}`;
    
    const timeInfo = document.createElement('div');
    timeInfo.className = 'timestamp';
    timeInfo.textContent = timestamp.toLocaleTimeString();
    
    fileDiv.appendChild(img);
    fileDiv.appendChild(fileNameDiv);
    fileDiv.appendChild(timeInfo);
    
    const previewContainer = document.getElementById('previewContainer');
    if (!previewContainer) {
        console.error('Container de preview no encontrado');
        return;
    }
    
    previewContainer.appendChild(fileDiv);
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Configurar botón de toggle cámara
    const toggleCamera = document.getElementById('toggleCamera');
    const cameraInterface = document.getElementById('cameraInterface');
    
    toggleCamera.addEventListener('click', async () => {
        try {
            if (cameraInterface.style.display === 'none') {
                await initCamera('user');
                cameraInterface.style.display = 'block';
                toggleCamera.textContent = '🎥 Disable Camera';
            } else {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }
                cameraInterface.style.display = 'none';
                toggleCamera.textContent = '📸 Enable Camera';
            }
        } catch (error) {
            console.error('Error con la cámara:', error);
            handleCameraError(error);
        }
    });

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

    // Configurar input de archivo
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

// Modificar handleCameraError para ser menos intrusivo
function handleCameraError(err) {
    const errorMessage = getErrorMessage(err);
    alert(errorMessage);
}

function getErrorMessage(err) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'Permiso de cámara denegado';
    } else if (err.name === 'NotFoundError') {
        return 'No se encontró cámara en el dispositivo';
    } else if (err.name === 'NotReadableError') {
        return 'La cámara está siendo usada por otra aplicación';
    }
    return `Error: ${err.message}`;
}