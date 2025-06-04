import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://dxyvthvkzqthidzfltpm.supabase.co' // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eXZ0aHZrenF0aGlkemZsdHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzQxODMsImV4cCI6MjA2NDQxMDE4M30.JGLVKMt5B1InLsRKxS9CnW4bLbDE-A2MtuGlqDpag6U'    // Reemplaza con tu key

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

export async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
}

/* filepath: h:\Trabajo\Paginas\Sol2\file-uploader\js\main.js */
import { supabase, signInAnonymously } from './supabase-config.js';

let currentFacingMode = 'environment';
let currentStream = null;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadSupabaseImages();
});

async function setupEventListeners() {
    const toggleCamera = document.getElementById('toggleCamera');
    const cameraInterface = document.getElementById('cameraInterface');
    const fileInput = document.getElementById('fileInput');
    const captureBtn = document.getElementById('captureBtn');
    const switchBtn = document.getElementById('switchCameraBtn');
    
    // Eventos de cámara
    toggleCamera?.addEventListener('click', handleCameraToggle);
    captureBtn?.addEventListener('click', capturePhoto);
    switchBtn?.addEventListener('click', handleCameraSwitch);
    
    // Evento de carga de archivo
    fileInput?.addEventListener('change', handleFileUpload);
    
    // Eventos de lightbox
    setupLightboxEvents();
}

// ... Resto de tus funciones existentes ...