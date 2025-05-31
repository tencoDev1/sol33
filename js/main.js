let currentFacingMode = 'user';
let currentStream = null;

async function initCamera(facingMode = 'user') {
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');
    
    // Si hay un stream activo, detenerlo
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Tu navegador no soporta acceso a la cámara');
        }

        // Modificar las constraints para forzar el cambio de cámara
        const constraints = {
            video: {
                facingMode: { exact: facingMode }, // Usar exact para forzar el modo
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        await video.play();
        captureBtn.disabled = false;
        currentFacingMode = facingMode;

        // Actualizar el texto del botón según la cámara activa
        const switchBtn = document.getElementById('switchCameraBtn');
        if (switchBtn) {
            switchBtn.textContent = facingMode === 'user' ? '🔄 Usar Cámara Trasera' : '🔄 Usar Cámara Frontal';
        }

    } catch (err) {
        console.error('Error detallado:', err);
        
        // Si falla con exact, intentar sin exact
        if (err.name === 'OverconstrainedError') {
            try {
                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                video.srcObject = currentStream;
                await video.play();
                captureBtn.disabled = false;
                currentFacingMode = facingMode;
            } catch (retryErr) {
                handleCameraError(retryErr);
            }
        } else {
            handleCameraError(err);
        }
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
    const switchBtn = document.getElementById('switchCameraBtn');
    const captureBtn = document.getElementById('captureBtn');

    if (switchBtn) {
        // Eliminar listeners anteriores
        switchBtn.replaceWith(switchBtn.cloneNode(true));
        const newSwitchBtn = document.getElementById('switchCameraBtn');
        
        newSwitchBtn.addEventListener('click', async () => {
            try {
                const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
                await initCamera(newFacingMode);
            } catch (err) {
                console.error('Error al cambiar cámara:', err);
                handleCameraError(err);
            }
        });
    }

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
    initCamera();
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