import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://dxyvthvkzqthidzfltpm.supabase.co' // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eXZ0aHZrenF0aGlkemZsdHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MzQxODMsImV4cCI6MjA2NDQxMDE4M30.JGLVKMt5B1InLsRKxS9CnW4bLbDE-A2MtuGlqDpag6U'    // Reemplaza con tu key

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
})

// Función para autenticación anónima
export async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    return data
}