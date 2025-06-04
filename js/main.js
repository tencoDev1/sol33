import { supabase, signInAnonymously } from './supabase-config.js';

// Función para cargar imágenes de Supabase
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

    } catch (error) {
        console.error('Error de inicialización:', error);
    }
});
