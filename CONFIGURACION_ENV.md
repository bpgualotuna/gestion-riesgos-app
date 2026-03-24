# Configuración de Variables de Entorno

## Estructura de Archivos

Este proyecto usa un único archivo `.env` para todas las configuraciones, tanto en desarrollo como en producción. La configuración de Vite ha sido modificada para que **siempre** cargue las variables desde `.env`, ignorando archivos como `.env.production` o `.env.development`.

### Archivos:

- **`.env`** - Archivo principal con las variables de entorno (NO se sube a Git)
- **`.env.example`** - Plantilla de ejemplo (SÍ se sube a Git)
- **`.env.production`** - (OBSOLETO) Ya no se usa, ignorado por Git
- **`.env.development`** - (OBSOLETO) Ya no se usa, ignorado por Git

## Cambios en vite.config.ts

El archivo `vite.config.ts` ha sido modificado para:

1. **Cargar variables desde `.env`** usando `loadEnv(mode, process.cwd(), '')`
2. **Definir explícitamente las variables** en el objeto `define` para que estén disponibles en el código
3. **Ignorar archivos `.env.production` y `.env.development`** - solo se usa `.env`

Esto significa que **tanto en desarrollo como en producción**, Vite cargará las variables desde el mismo archivo `.env`.

## Configuración Actual

### En Desarrollo Local

Crea o edita el archivo `.env` con:

```env
# API Base URL - Desarrollo Local
VITE_API_BASE_URL=http://localhost:8080/api

# Application Name
VITE_APP_NAME=Sistema de Gestión de Riesgos

# Environment
VITE_ENV=development
```

### En Producción

El archivo `.env` en el servidor de producción debe tener:

```env
# API Base URL - Producción
VITE_API_BASE_URL=https://erm.comware.com.ec/api

# Application Name
VITE_APP_NAME=Sistema de Gestión de Riesgos

# Environment
VITE_ENV=production
```

## Configuración Inicial

### Para nuevos desarrolladores:

1. Clona el repositorio
2. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` con tus valores locales
4. Ejecuta el proyecto:
   ```bash
   npm install
   npm run dev
   ```

### Para despliegue en producción:

1. En tu servidor, crea el archivo `.env` con los valores de producción
2. Asegúrate de que `VITE_API_BASE_URL` apunte a tu backend en producción
3. Build y deploy:
   ```bash
   npm run build
   # Despliega el contenido de dist/
   ```

## Archivos Ignorados por Git

Los siguientes archivos NO se suben al repositorio (están en `.gitignore`):

- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- `.env.*.local`
- `*.local`

## Variables Disponibles

### VITE_API_BASE_URL
URL base del backend API.
- **Desarrollo:** `http://localhost:8080/api`
- **Producción:** `https://erm.comware.com.ec/api`

### VITE_APP_NAME
Nombre de la aplicación mostrado en la interfaz.
- **Valor:** `Sistema de Gestión de Riesgos`

### VITE_ENV
Entorno de ejecución.
- **Valores:** `development` | `production`

## Notas Importantes

1. **Vite requiere el prefijo `VITE_`** para exponer variables al frontend
2. **Nunca subas archivos `.env` al repositorio** - contienen información sensible
3. **Usa `.env.example`** como plantilla para documentar las variables necesarias
4. **Reinicia el servidor de desarrollo** después de cambiar variables de entorno
5. **En producción**, asegúrate de que el archivo `.env` esté en el servidor antes del build

## Troubleshooting

### Las variables no se cargan
- Verifica que el archivo se llame exactamente `.env` (sin espacios ni extensiones adicionales)
- Reinicia el servidor de desarrollo (`npm run dev`)
- Verifica que las variables empiecen con `VITE_`

### Error "Failed to fetch" en producción
- Verifica que `VITE_API_BASE_URL` apunte a la URL correcta del backend
- Asegúrate de que el backend esté corriendo y accesible
- Verifica la configuración de CORS en el backend

### Cambios no se reflejan
- Haz un rebuild completo: `npm run build`
- Limpia la caché del navegador (Ctrl+Shift+R)
- Verifica que el archivo `.env` esté en la raíz del proyecto frontend
