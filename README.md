# 💰 Finanzas - Aplicación de Gestión Financiera Personal

Una aplicación web moderna y completa para la gestión de finanzas personales, desarrollada con React y Vite, con funcionalidades avanzadas de seguimiento de gastos, metas de ahorro y análisis financiero.

## 🚀 Características Principales

### 📊 Gestión de Transacciones
- ✅ Agregar, editar y eliminar transacciones
- 🔍 Búsqueda avanzada por descripción
- 🏷️ Filtros por fecha y categoría
- 💱 Formato en pesos chilenos (CLP) con separadores de miles
- 📱 Interfaz responsive y moderna

### 🎯 Metas de Ahorro
- 🎯 Crear y gestionar metas de ahorro personalizadas
- 📈 Seguimiento visual del progreso
- 💰 Contribuciones flexibles a las metas
- 🏆 Visualización del estado de cumplimiento

### 📈 Análisis y Visualización
- 📊 Gráficos interactivos con Chart.js
- 📉 Análisis de ingresos vs gastos
- 🔄 Distribución por categorías
- 📅 Tendencias temporales

### 🏷️ Categorías Personalizadas
- ➕ Crear categorías personalizadas
- 🎨 Iconos y colores personalizables
- 📝 Gestión completa de categorías
- 🔄 Categorías predefinidas incluidas

### 📱 PWA (Progressive Web App)
- 📲 Instalable en dispositivos móviles
- 🔄 Funciona offline
- 🔔 Notificaciones push
- ⚡ Carga rápida con service worker

### 📤 Exportación de Datos
- 📄 Exportar transacciones a CSV
- 📊 Reportes personalizables
- 💾 Respaldo de datos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18, Vite
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Gráficos**: Chart.js
- **Iconos**: Lucide React
- **PWA**: Service Worker, Web App Manifest

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Cuenta de Supabase

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/csubi1974/finanzas.git
cd finanzas
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia tu URL y clave anónima del proyecto
3. Crea el archivo `supabaseClient.js` en la raíz del proyecto:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TU_SUPABASE_URL'
const supabaseKey = 'TU_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 4. Configurar la base de datos

Ejecuta el script SQL en el editor de Supabase:

```bash
# Ejecutar database_schema.sql en Supabase SQL Editor
# Luego ejecutar fix_trigger.sql para corregir los triggers
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
finanzas/
├── public/
│   ├── icon-192x192.svg      # Icono PWA 192x192
│   ├── icon-512x512.svg      # Icono PWA 512x512
│   ├── manifest.json         # Manifiesto PWA
│   └── sw.js                 # Service Worker
├── src/
│   ├── Finanzas_App.jsx      # Componente principal
│   ├── App_Test.jsx          # Componente de prueba
│   ├── main.jsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── database_schema.sql       # Schema de la base de datos
├── fix_trigger.sql          # Corrección de triggers
├── supabaseClient.js        # Configuración de Supabase
└── package.json             # Dependencias del proyecto
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **transactions**: Gestión de transacciones financieras
- **user_balance**: Balance total del usuario
- **savings_goals**: Metas de ahorro
- **goal_contributions**: Contribuciones a las metas
- **custom_categories**: Categorías personalizadas

### Características de Seguridad

- Row Level Security (RLS) habilitado
- Triggers automáticos para actualización de balances
- Validaciones de integridad de datos

## 🎨 Funcionalidades Detalladas

### Dashboard Principal
- Balance total en tiempo real
- Resumen de ingresos y gastos
- Transacciones recientes
- Gráficos de tendencias

### Gestión de Transacciones
- Formulario intuitivo para agregar transacciones
- Edición inline de transacciones existentes
- Filtros avanzados por fecha y categoría
- Búsqueda por descripción

### Sistema de Metas
- Creación de metas con nombre y objetivo
- Contribuciones parciales o totales
- Progreso visual con barras de progreso
- Estado de cumplimiento automático

### Análisis Visual
- Gráfico de líneas para tendencias temporales
- Gráfico de dona para distribución por categorías
- Comparativas de ingresos vs gastos
- Filtros interactivos

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Construir para producción
npm run preview      # Vista previa de la build
npm run lint         # Linter de código
```

## 🌟 Características PWA

- **Instalable**: Se puede instalar como app nativa
- **Offline**: Funciona sin conexión a internet
- **Responsive**: Adaptable a cualquier dispositivo
- **Rápida**: Carga instantánea con cache

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**csubi1974**

- GitHub: [@csubi1974](https://github.com/csubi1974)

## 🙏 Agradecimientos

- [React](https://reactjs.org/) - Framework de JavaScript
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS
- [Supabase](https://supabase.com/) - Backend as a Service
- [Chart.js](https://www.chartjs.org/) - Librería de gráficos
- [Lucide](https://lucide.dev/) - Iconos

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!