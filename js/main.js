import { supabase, signInAnonymously } from './supabase-config.js';

let currentFacingMode = 'environment'; // Cambiado de 'user' a 'environment'
let currentStream = null;

async function initCamera() {
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');

    try {
        // Detener cualquier stream activo
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        // Buscar la cámara trasera por deviceId si es posible
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        let backCamera = videoDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('trasera') ||
            device.label.toLowerCase().includes('environment')
        );

        let constraints;
        if (backCamera) {
            constraints = { video: { deviceId: { exact: backCamera.deviceId } } };
        } else {
            // Si no se encuentra, intentar con facingMode
            constraints = { video: { facingMode: { ideal: 'environment' } } };
        }

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);

        video.srcObject = currentStream;
        await video.play();
        captureBtn.disabled = false;

    } catch (err) {
        console.error('Error final al iniciar cámara:', err);
        handleCameraError(err);
    }
}

// Añadir función para manejar errores
function handleCameraError(err) {
    let message = '';
    switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
            message = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara.';
            break;
        case 'NotFoundError':
            message = 'No se encontró ninguna cámara en el dispositivo.';
            break;
        case 'NotReadableError':
            message = 'La cámara está siendo usada por otra aplicación.';
            break;
        case 'OverconstrainedError':
            message = 'No se encontró cámara trasera. Usando cámara frontal.';
            break;
        default:
            message = `Error de cámara: ${err.message}`;
    }
    
    console.error(message);
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

async function loadSupabaseImages() {
    try {
        // Limpiar contenedor de imágenes
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.innerHTML = '';

        // Obtener lista de archivos
        const { data, error } = await supabase
            .storage
            .from('photos')
            .list();

        if (error) {
            console.error('Error al cargar imágenes:', error);
            return;
        }

        // Ordenar por fecha más reciente
        const sortedFiles = data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        // Mostrar cada imagen
        for (const file of sortedFiles) {
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

// Función para mostrar preview
function showPreview(publicUrl, timestamp, fileName) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-preview';
    
    const img = document.createElement('img');
    img.src = publicUrl;
    img.alt = fileName;
    img.loading = 'lazy';
    
    // Añadir funcionalidad de lightbox
    img.addEventListener('click', () => {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        lightboxImg.src = publicUrl;
        lightbox.style.display = 'flex';
    });
    
    const timeInfo = document.createElement('div');
    timeInfo.className = 'timestamp';
    timeInfo.textContent = timestamp.toLocaleString();
    
    fileDiv.appendChild(img);
    fileDiv.appendChild(timeInfo);
    
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.appendChild(fileDiv);
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await signInAnonymously();
        await loadSupabaseImages();
        
        // Configurar lightbox
        const lightbox = document.getElementById('lightbox');
        const closeLightbox = document.querySelector('.close-lightbox');
        
        if (closeLightbox) {
            closeLightbox.addEventListener('click', () => {
                lightbox.style.display = 'none';
            });
        }
        
        lightbox?.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = 'none';
            }
        });

        // Configurar botón de captura
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }
    } catch (error) {
        console.error('Error de inicialización:', error);
    }
});
