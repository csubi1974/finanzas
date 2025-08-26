import { createClient } from '@supabase/supabase-js'

// Configuración usando variables de entorno para deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// IMPORTANTE: Configura las variables de entorno en tu plataforma de deployment:
// VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY