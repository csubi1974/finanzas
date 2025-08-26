import { createClient } from '@supabase/supabase-js'

// Reemplaza estos valores con los de tu proyecto de Supabase
const supabaseUrl = 'https://tu-proyecto.supabase.co'
const supabaseKey = 'tu-clave-anonima-aqui'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Instrucciones:
// 1. Copia este archivo como 'supabaseClient.js'
// 2. Reemplaza supabaseUrl con la URL de tu proyecto Supabase
// 3. Reemplaza supabaseKey con tu clave anónima de Supabase
// 4. Puedes encontrar estos valores en tu dashboard de Supabase en Settings > API