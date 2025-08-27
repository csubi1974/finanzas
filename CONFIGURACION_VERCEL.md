# Configuración de Variables de Entorno en Vercel

## Problema Actual
La aplicación en Vercel está mostrando datos de ejemplo en lugar de los datos reales de la base de datos porque las variables de entorno de Supabase no están configuradas correctamente.

## Solución

### 1. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "finanzas-self"
3. Ve a **Settings** → **Environment Variables**
4. Agrega las siguientes variables:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
VITE_OPENAI_API_KEY=tu_api_key_de_openai
```

### 2. Obtener las Credenciales de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** → **anon public** → `VITE_SUPABASE_ANON_KEY`

### 3. Configuración Local (Opcional)

Para desarrollo local:
1. Crea un archivo `.env` en la raíz del proyecto
2. Copia el contenido de `.env.example`
3. Reemplaza los valores con tus credenciales reales

### 4. Redesplegar en Vercel

Después de configurar las variables:
1. Ve a **Deployments** en tu proyecto de Vercel
2. Haz clic en **Redeploy** en el último deployment
3. O haz un nuevo commit y push al repositorio

## Verificación

Después del redespliegue:
1. Abre la consola del navegador en tu sitio de Vercel
2. Deberías ver logs como:
   ```
   Intentando conectar con Supabase...
   URL: https://tu-proyecto.supabase.co
   Key exists: true
   Datos cargados exitosamente: { transacciones: X, balance: Y }
   ```

## Notas Importantes

- Las variables que empiezan con `VITE_` son públicas y se incluyen en el bundle del frontend
- Nunca pongas claves secretas en variables `VITE_`
- La clave `VITE_SUPABASE_ANON_KEY` es segura para uso público (tiene restricciones RLS)
- Si ves "Usando datos de ejemplo" significa que la conexión a Supabase falló

## Troubleshooting

Si sigues viendo datos de ejemplo:
1. Verifica que las variables estén configuradas correctamente en Vercel
2. Asegúrate de haber redesplegar después de agregar las variables
3. Revisa los logs de la consola del navegador para errores específicos
4. Verifica que tu proyecto de Supabase esté activo y accesible