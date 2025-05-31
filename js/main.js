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

function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Capturar frame del video
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Convertir a imagen
    const imageData = canvas.toDataURL('image/jpeg');
    
    // Crear preview
    const fileDiv = document.createElement('div');
    fileDiv.className = 'file-preview';
    
    const img = document.createElement('img');
    img.src = imageData;
    
    const timestamp = new Date();
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.textContent = `Photo_${timestamp.toISOString().slice(0,10)}`;
    
    const timeInfo = document.createElement('div');
    timeInfo.className = 'timestamp';
    timeInfo.textContent = timestamp.toLocaleTimeString();
    
    fileDiv.appendChild(img);
    fileDiv.appendChild(fileName);
    fileDiv.appendChild(timeInfo);
    
    document.getElementById('previewContainer').appendChild(fileDiv);
    
    // Guardar en localStorage
    const savedPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
    savedPhotos.push({
        data: imageData,
        name: fileName.textContent,
        timestamp: timestamp.toISOString()
    });
    localStorage.setItem('photos', JSON.stringify(savedPhotos));
}

// Inicializar cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => {
    initCamera('user'); // Comenzar con la cámara frontal
    setupEventListeners();
    
    // Cargar fotos guardadas
    const savedPhotos = JSON.parse(localStorage.getItem('photos') || '[]');
    savedPhotos.forEach(photo => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'file-preview';
        
        const img = document.createElement('img');
        img.src = photo.data;
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = photo.name;
        
        const timeInfo = document.createElement('div');
        timeInfo.className = 'timestamp';
        timeInfo.textContent = new Date(photo.timestamp).toLocaleTimeString();
        
        fileDiv.appendChild(img);
        fileDiv.appendChild(fileName);
        fileDiv.appendChild(timeInfo);
        
        document.getElementById('previewContainer').appendChild(fileDiv);
    });
});