# 🚀 Guía de Deploy a Render

## ✅ Pasos Completados

### 1. Limpieza del Proyecto
- [x] Errores TypeScript críticos corregidos en:
  - `ProcesosPage.tsx` - Tipos y propiedades
  - `FichaPage.tsx` - Comparación de IDs
  - `UsuariosPage.tsx` - Carga de gerencias
  
- [x] Archivos innecesarios eliminados:
  - ❌ `EJEMPLOS_COLORES_TABLAS.tsx.backup`
  - ❌ `middleware.js`
  - ❌ `reorganizar-completo.ps1`
  - ❌ `routes.json`
  - ❌ `test-simple.html`
  - ❌ `limpiar-localStorage.js`
  - ❌ `limpiar-cache-datos.js`
  - ❌ `verificar-servidor.js`
  - ❌ `VERIFICACION_DATOS.md`

### 2. Estructura Mock Data
- [x] `mockData.ts` ya está estructurado con:
  - ✅ Helpers `loadFromStorage()` y `saveToStorage()`
  - ✅ Datos normalizados (sin redundancias)
  - ✅ Preparado para migración a APIs
  - ✅ Usa localStorage como capa de persistencia temporal

---

## ⚠️ Errores Pendientes a Corregir

### Errores Críticos de Build

1. **Imports de módulos inexistentes:**
   ```
   - '../types' en múltiples archivos de pages/riesgos/
   - '../../../../../shared/components/ui/Grid2'
   - '../../../../shared/components/ui/AppDataGrid'
   ```
   **Solución**: Verificar rutas de importación y crear archivos faltantes

2. **Propiedades inexistentes en tipos:**
   ```typescript
   // AuthContextType
   - esAuditoria (no existe)
   - esDirectorProcesos (no existe)
   
   // Proceso
   - data (no es array con propiedad data)
   
   // CreatePriorizacionDto
   - responsableId (debe ser 'responsable')
   ```

3. **Constantes con propiedades faltantes:**
   ```typescript
   // constants.ts - PESOS_IMPACTO no tiene:
   - personas, legal, ambiental, procesos, reputacion, economico
   ```

4. **Grid2 de Material-UI:**
   ```
   - Usar 'Grid' en lugar de 'Grid2' (no existe en @mui/material)
   ```

---

## 📋 Checklist Pre-Deploy

### A. Corrección de Código

- [ ] **Corregir imports de tipos**
  ```bash
  # Buscar todos los imports incorrectos
  grep -r "from '../types'" src/pages/
  grep -r "from '../../../../shared" src/pages/
  ```

- [ ] **Reemplazar Grid2 por Grid**
  ```bash
  # Buscar y reemplazar
  grep -r "Grid2" src/ --include="*.tsx"
  ```

- [ ] **Completar tipos faltantes**
  - Agregar `esAuditoria` y `esDirectorProcesos` a `AuthContextType`
  - Agregar propiedades faltantes a constantes de impacto

- [ ] **Verificar build local**
  ```bash
  pnpm run build
  ```

### B. Configuración de Render

#### 1. Crear servicio en Render
   - Tipo: **Static Site**
   - Repositorio: Conectar con GitHub
   - Branch: `main` o `master`

#### 2. Configuración Build
   ```yaml
   Build Command: pnpm install && pnpm run build
   Publish Directory: dist
   ```

#### 3. Variables de Entorno (si necesarias)
   ```bash
   NODE_VERSION=20
   VITE_API_URL=https://api.tu-dominio.com
   ```

#### 4. Redirects (para React Router)
   Crear archivo `public/_redirects`:
   ```
   /*    /index.html   200
   ```

### C. Optimización para Producción

- [ ] **Verificar package.json**
  ```json
  {
    "scripts": {
      "dev": "vite",
      "build": "tsc -b && vite build",
      "preview": "vite preview --host 0.0.0.0",
      "start": "vite preview --host 0.0.0.0"
    }
  }
  ```

- [ ] **Archivo .gitignore actualizado**
  ```
  node_modules/
  dist/
  .env
  .env.local
  ```

- [ ] **Eliminar console.log innecesarios**

- [ ] **Optimizar assets**
  - Comprimir imágenes
  - Minimizar CSS/JS (automático con Vite)

---

## 🔧 Comandos Útiles

### Desarrollo Local
```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Build local
pnpm run build

# Preview del build
pnpm run preview
```

### Deploy Manual
```bash
# 1. Build
pnpm run build

# 2. Test local del build
pnpm run preview

# 3. Subir a Render (automático desde GitHub)
git add .
git commit -m "Preparado para deploy"
git push origin main
```

---

## 📊 Estado Actual del Proyecto

### ✅ Funcionando
- Sistema de autenticación por roles
- Gestión de Gerente General (Director/Proceso)
- Asignaciones persistentes en localStorage
- UI consistente entre roles
- Dashboard para roles

### ⚠️ Requiere Atención
- **Errores de compilación TypeScript** (bloqueante para deploy)
- Imports de módulos inexistentes
- Tipos incompletos en constantes
- Grid2 no disponible en MUI

### 🔄 Migración a Backend Pendiente
Cuando esté listo el backend, migrar desde `mockData.ts`:
```typescript
// Actual (Mock)
const gerencias = getMockGerencias();

// Futuro (API)
const { data: gerencias } = await api.get('/gerencias');
```

**Estructura actual preparada**:
- Funciones `get*` y `update*` en mockData.ts
- RTK Query configurado en riesgosApi.ts
- Solo cambiar el dataProvider de localStorage a HTTP

---

## 🚨 Prioridades Inmediatas

1. **URGENTE**: Corregir errores de compilación
   - Arreglar imports de tipos
   - Reemplazar Grid2 por Grid
   - Completar propiedades en constantes

2. **IMPORTANTE**: Verificar build exitoso
   ```bash
   pnpm run build
   # Debe completar sin errores
   ```

3. **DEPLOY**: Una vez build exitoso
   - Push a GitHub
   - Configurar en Render
   - Deploy automático

---

## 📝 Notas de Implementación

### Mock Data → API Migration Path

```typescript
// 1. Mock actual (localStorage)
export function getMockGerencias(): Gerencia[] {
  return loadFromStorage('catalog_gerencias_v2', defaultGerencias);
}

// 2. Futuro con API
export async function getGerencias(): Promise<Gerencia[]> {
  const response = await fetch('/api/gerencias');
  return response.json();
}
```

### Estructura Normalizada
- ✅ Sin datos duplicados
- ✅ IDs como strings para compatibilidad
- ✅ Relaciones por ID (no objetos anidados completos)
- ✅ Separación de catálogos (gerencias, procesos, áreas)

---

## 📧 Soporte

**Proyecto**: Gestión de Riesgos App  
**URL Render**: https://dashboard.render.com/project/prj-d5cuhebe5dus738vm0rg  
**Framework**: React 19 + TypeScript + Vite + MUI  
**Estado**: Preparación para producción
