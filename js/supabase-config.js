const supabaseUrl = 'TU_PROJECT_URL';       // Reemplaza con tu URL
const supabaseKey = 'TU_ANON_KEY';          // Reemplaza con tu key

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Exportar para uso en otros archivos
export { supabase };