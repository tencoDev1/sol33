import { supabase, signInAnonymously } from './supabase-config.js'

let currentFacingMode = 'environment'; // Cambiado de 'user' a 'environment'
let currentStream = null;

async function initCamera(facingMode = 'environment') { // Cambiado el valor por defecto
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');

    try {
        // Detener cualquier stream activo
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Configurar la cámara
        const constraints = {
            video: {
                facingMode: { exact: facingMode } // Usar exact para forzar la cámara trasera
            }
        };

        // Obtener acceso a la cámara
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        await video.play();

        // Habilitar el botón de captura
        captureBtn.disabled = false;
        currentFacingMode = facingMode;

    } catch (err) {
        console.error('Error al iniciar cámara:', err);
        handleCameraError(err);
    }
}

// Añadir función para manejar errores
function handleCameraError(err) {
    const message = err.name === 'NotAllowedError' ? 
        'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.' :
        `Error de cámara: ${err.message}`;
    
    alert(message);
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
async function loadSupabaseImages() {
    try {
        const { data, error } = await supabase
            .storage
            .from('photos')
            .list();

        if (error) throw error;

        for (const file of data) {
            const { data: { publicUrl } } = supabase
                .storage
                .from('photos')
                .getPublicUrl(file.name);

            const timestamp = new Date(file.created_at);
            showPreview(publicUrl, timestamp, file.name);
        }
    } catch (error) {
        console.error('Error loading images:', error);
    }
}

function showPreview(publicUrl, timestamp, fileName) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-preview';
    
    const img = document.createElement('img');
    img.src = publicUrl;
    
    // Añadir funcionalidad de lightbox
    img.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        lightboxImg.src = publicUrl;
        lightbox.style.display = 'flex';
    });
    
    const fileNameDiv = document.createElement('div');
    fileNameDiv.className = 'file-name';
    fileNameDiv.textContent = fileName || `Photo_${timestamp.toLocaleDateString()}`;
    
    const timeInfo = document.createElement('div');
    timeInfo.className = 'timestamp';
    timeInfo.textContent = timestamp.toLocaleTimeString();
    
    fileDiv.appendChild(img);
    fileDiv.appendChild(fileNameDiv);
    fileDiv.appendChild(timeInfo);
    
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.appendChild(fileDiv);
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadSupabaseImages();
    setupEventListeners();
});

// Eventos del lightbox
document.querySelector('.close-lightbox')?.addEventListener('click', () => {
    document.getElementById('lightbox').style.display = 'none';
});

document.getElementById('lightbox')?.addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') {
        e.target.style.display = 'none';
    }
});

function setupEventListeners() {
    // Configurar botón de toggle cámara
    const toggleCamera = document.getElementById('toggleCamera');
    const cameraInterface = document.getElementById('cameraInterface');
    
    if (toggleCamera && cameraInterface) {
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
                console.error('Error:', error);
                handleCameraError(error);
            }
        });
    }

    // Configurar botón de captura
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', capturePhoto);
    }

    // Configurar botón de cambio de cámara
    const switchBtn = document.getElementById('switchCameraBtn');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            const newMode = currentFacingMode === 'user' ? 'environment' : 'user';
            initCamera(newMode);
        });
    }
}