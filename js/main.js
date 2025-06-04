import { supabase, signInAnonymously } from './supabase-config.js';

let currentStream = null;

// Función para cargar imágenes de Supabase
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

// Función para mostrar preview
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
    
    fileDiv.appendChild(img);
    fileDiv.appendChild(fileNameDiv);
    
    const previewContainer = document.getElementById('previewContainer');
    previewContainer.appendChild(fileDiv);
}

// Función para iniciar la cámara
async function initCamera() {
    const video = document.getElementById('videoElement');
    const captureBtn = document.getElementById('captureBtn');

    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            video: { facingMode: 'environment' }
        };

        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = currentStream;
        await video.play();
        captureBtn.disabled = false;

    } catch (err) {
        console.error('Error al iniciar cámara:', err);
        alert('Error al acceder a la cámara: ' + err.message);
    }
}

// Función para capturar foto
async function capturePhoto() {
    try {
        const video = document.getElementById('videoElement');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0);
        
        const blob = await new Promise(resolve => 
            canvas.toBlob(resolve, 'image/jpeg', 0.95)
        );

        const timestamp = new Date();
        const fileName = `photo_${timestamp.getTime()}.jpg`;

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, blob);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

        showPreview(publicUrl, timestamp, fileName);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al capturar la foto: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await signInAnonymously();
        await loadSupabaseImages();
        
        // Setup camera button
        const toggleCamera = document.getElementById('toggleCamera');
        if (toggleCamera) {
            toggleCamera.addEventListener('click', async () => {
                const cameraInterface = document.getElementById('cameraInterface');
                if (cameraInterface.style.display === 'none') {
                    await initCamera();
                    cameraInterface.style.display = 'block';
                } else {
                    if (currentStream) {
                        currentStream.getTracks().forEach(track => track.stop());
                    }
                    cameraInterface.style.display = 'none';
                }
            });
        }

        // Setup capture button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }

        // Setup lightbox close
        const closeLightbox = document.querySelector('.close-lightbox');
        if (closeLightbox) {
            closeLightbox.addEventListener('click', () => {
                document.getElementById('lightbox').style.display = 'none';
            });
        }

    } catch (error) {
        console.error('Error de inicialización:', error);
    }
});