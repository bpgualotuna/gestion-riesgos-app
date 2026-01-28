# 🚀 Guía de Inicio Local - Sistema de Gestión de Riesgos COMWARE

## 📋 Requisitos Previos

- **Node.js** >= 18.x (recomendado 22.x)
- **pnpm** >= 8.x (gestor de paquetes)

### Instalar pnpm (si no lo tienes)

```bash
# Con npm
npm install -g pnpm

# Con yarn
yarn global add pnpm

# Con Homebrew (macOS)
brew install pnpm
```

## 🔧 Instalación

### 1. Clonar el repositorio (si es necesario)

```bash
git clone <url-del-repositorio>
cd gestion-riesgos-app
```

### 2. Instalar dependencias

```bash
pnpm install
```

## ▶️ Comandos para Iniciar

### Desarrollo Local (Recomendado)

```bash
pnpm dev
```

Esto iniciará el servidor de desarrollo en:
- **URL**: http://localhost:5173
- **Hot Reload**: Activado (los cambios se reflejan automáticamente)

### Preview del Build de Producción

```bash
# Primero construir
pnpm build

# Luego hacer preview
pnpm preview
```

Esto iniciará un servidor de preview en:
- **URL**: http://localhost:4173

### Iniciar con Host Externo (para acceso desde red local)

```bash
pnpm start
```

Esto iniciará el servidor en:
- **URL**: http://0.0.0.0:4173
- Accesible desde otros dispositivos en la misma red

## 🛠️ Otros Comandos Útiles

### Linter (verificar código)

```bash
pnpm lint
```

### Build para Producción

```bash
pnpm build
```

Los archivos compilados se generarán en la carpeta `dist/`

### Verificar TypeScript

```bash
pnpm build
# El build incluye verificación de TypeScript
```

## 🔐 Credenciales de Acceso

Una vez iniciada la aplicación, puedes usar estos usuarios de prueba:

### Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Gerente
- **Usuario**: `manager`
- **Contraseña**: `manager123`

### Analista
- **Usuario**: `analyst`
- **Contraseña**: `analyst123`

## 📊 Datos Mock

La aplicación funciona con **datos mock** cuando no hay backend disponible. Los datos incluyen:

- ✅ 8 riesgos de ejemplo
- ✅ 5 evaluaciones con cálculos reales
- ✅ 5 priorizaciones asignadas
- ✅ Estadísticas calculadas dinámicamente
- ✅ Mapa de riesgos con puntos visualizados

## 🌐 Variables de Entorno (Opcional)

Si necesitas conectar a un backend, crea un archivo `.env` en la raíz:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Si no existe este archivo o la URL es localhost, la aplicación usará datos mock automáticamente.

## 🐛 Solución de Problemas

### Error: "pnpm: command not found"
```bash
npm install -g pnpm
```

### Error: "Port already in use"
```bash
# Cambiar el puerto en vite.config.ts o matar el proceso
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Error: "Cannot find module"
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### El servidor no inicia
```bash
# Verificar versión de Node.js
node --version  # Debe ser >= 18

# Verificar versión de pnpm
pnpm --version  # Debe ser >= 8
```

## 📝 Notas Importantes

1. **Primera vez**: Ejecuta `pnpm install` antes de iniciar
2. **Datos Mock**: La app funciona sin backend usando datos mock
3. **Hot Reload**: Los cambios en el código se reflejan automáticamente
4. **Puerto por defecto**: 5173 para desarrollo, 4173 para preview
5. **Navegador**: Se abre automáticamente al iniciar `pnpm dev`

## 🎯 Flujo de Trabajo Recomendado

```bash
# 1. Instalar dependencias (solo primera vez)
pnpm install

# 2. Iniciar desarrollo
pnpm dev

# 3. Abrir navegador en http://localhost:5173
# 4. Iniciar sesión con usuario de prueba
# 5. Explorar la aplicación
```

## 📚 Estructura de Comandos

```
pnpm dev          → Desarrollo con hot reload
pnpm build        → Compilar para producción
pnpm preview      → Preview del build
pnpm start        → Preview con host externo
pnpm lint         → Verificar código
```

---

**¡Listo para empezar!** 🎉

Ejecuta `pnpm dev` y abre http://localhost:5173 en tu navegador.

