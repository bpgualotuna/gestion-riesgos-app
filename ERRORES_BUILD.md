# ⚠️ Errores Críticos a Corregir Antes del Deploy

## 🔴 Bloqueantes de Build

### 1. Imports de Módulos Inexistentes

#### Problema: Rutas relativas incorrectas
```typescript
// ❌ Archivos con imports rotos:
src/pages/riesgos/MapaPage.tsx
src/pages/riesgos/RiesgosProcesosPage.tsx
src/pages/supervision/ResumenDirectorPage.tsx
src/pages/supervision/ResumenRiesgosPage.tsx

// ❌ Import incorrecto:
import '../types'
import '../../../../shared/components/ui/AppDataGrid'
import '../../../../../shared/components/ui/Grid2'

// ✅ Debe ser:
import '../../types'
import '../../components/ui/AppDataGrid'
import from '@mui/material' // Grid en lugar de Grid2
```

**Acción**: Buscar y reemplazar todas las rutas de import

---

### 2. Grid2 No Existe en Material-UI

#### Archivos afectados:
- `src/pages/supervision/EstadisticasPage.tsx`
- `src/utils/Grid2.tsx`
- Múltiples páginas que importan Grid2

```typescript
// ❌ No existe
import { Grid2 } from '@mui/material';

// ✅ Usar
import { Grid } from '@mui/material';
// O implementar Grid2 como wrapper de Grid
```

**Acción**: Reemplazar todos los usos de Grid2 por Grid

---

### 3. Propiedades Faltantes en Constantes

#### src/utils/constants.ts

```typescript
// ❌ Actual - objeto incompleto
export const PESOS_IMPACTO = {
  '1': 0.22,
  '2': 0,
  // ...
} as const;

// ✅ Debe tener propiedades nombradas
export const PESOS_IMPACTO = {
  personas: 0.22,
  legal: 0.15,
  ambiental: 0.12,
  procesos: 0.18,
  reputacion: 0.13,
  economico: 0.20,
  tecnologico: 0.10
} as const;
```

**Acción**: Reestructurar PESOS_IMPACTO con propiedades nombradas

---

### 4. Propiedades Faltantes en AuthContext

#### src/contexts/AuthContext.tsx

```typescript
// ❌ Faltan propiedades
export interface AuthContextType {
  // ... existentes
  esAdmin: boolean;
  esSupervisorRiesgos: boolean;
  // ❌ Faltantes:
  esAuditoria?: boolean;
  esDirectorProcesos?: boolean;
}
```

**Acción**: Agregar propiedades faltantes o eliminar referencias

---

### 5. Errores en riesgosApi.ts

#### src/api/services/riesgosApi.ts

```typescript
// ❌ UpdateProcesoDto no tiene 'id'
await updateProceso({
  id: procesoActual.id, // ❌ Error
  objetivoProceso: formData.objetivoProceso
});

// ✅ Corregir endpoint
updateProceso: builder.mutation<Proceso, { id: string; data: UpdateProcesoDto }>({
  query: ({ id, data }) => ({
    url: `/procesos/${id}`,
    method: 'PUT',
    body: data
  })
})
```

**Acción**: Separar ID del DTO en las mutaciones

---

## 🟡 Advertencias (No Bloqueantes)

### 6. TypeScript Strict Mode Deshabilitado

```jsonc
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": false // ⚠️ Temporal - volver a true después de corregir
  }
}
```

**Recomendación**: Una vez corregidos todos los errores, volver a `"strict": true`

---

## 📋 Plan de Corrección

### Paso 1: Corregir Imports (15 min)
```bash
# Buscar archivos con imports rotos
grep -r "from '../types'" src/pages/riesgos/
grep -r "from '../../../../shared" src/pages/

# Reemplazar manualmente cada import con la ruta correcta
```

### Paso 2: Reemplazar Grid2 (10 min)
```bash
# Buscar todos los usos
grep -r "Grid2" src/ --include="*.tsx"

# Opción A: Reemplazar por Grid de MUI
# Opción B: Crear wrapper Grid2 personalizado
```

### Paso 3: Corregir Constantes (5 min)
```typescript
// src/utils/constants.ts
export const PESOS_IMPACTO = {
  personas: 0.22,
  legal: 0.15,
  ambiental: 0.12,
  procesos: 0.18,
  reputacion: 0.13,
  economico: 0.20,
  tecnologico: 0.10
} as const;

// Actualizar todos los usos
const pesoPersonas = PESOS_IMPACTO.personas;
```

### Paso 4: Completar AuthContext (5 min)
```typescript
// Si esAuditoria se usa:
export interface AuthContextType {
  // ... existentes
  esAuditoria: boolean;
  esDirectorProcesos: boolean;
}

// O eliminar referencias si no se usan
```

### Paso 5: Arreglar API Mutations (10 min)
```typescript
// Patrón correcto para updates
updateProceso: builder.mutation<Proceso, { id: string; updates: UpdateProcesoDto }>({
  query: ({ id, updates }) => ({
    url: `/procesos/${id}`,
    method: 'PUT',
    body: updates
  })
})
```

---

## ✅ Verificación Final

```bash
# 1. Limpiar build anterior
rm -rf dist

# 2. Limpiar caché
rm -rf node_modules/.vite

# 3. Build completo
pnpm run build

# 4. Si build exitoso:
# ✅ No hay errores TypeScript
# ✅ Genera carpeta dist/
# ✅ Assets optimizados

# 5. Test local
pnpm run preview
# Abrir http://localhost:4173
```

---

## 🚀 Deploy a Render (Después de Correcciones)

### Configuración en Render Dashboard

1. **New Static Site**
   - Connect Repository
   - Branch: `main`

2. **Build Settings**
   ```
   Build Command: pnpm install && pnpm run build
   Publish Directory: dist
   ```

3. **Environment Variables**
   ```
   NODE_VERSION=20
   PNPM_VERSION=9
   ```

4. **Redirects**
   Crear `public/_redirects`:
   ```
   /*    /index.html   200
   ```

5. **Deploy**
   - Commit cambios
   - Push a GitHub
   - Auto-deploy en Render

---

## 📊 Estimación de Tiempo

| Tarea | Tiempo Estimado |
|-------|----------------|
| Corregir imports | 15 min |
| Reemplazar Grid2 | 10 min |
| Arreglar constantes | 5 min |
| Completar tipos | 5 min |
| Arreglar API mutations | 10 min |
| Build y pruebas | 10 min |
| **TOTAL** | **55 min** |

---

## 🆘 Si Persisten Errores

1. **Verificar versiones**
   ```bash
   node --version  # Debe ser >= 18
   pnpm --version  # Debe ser >= 8
   ```

2. **Reinstalar dependencias**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

3. **Verificar tsconfig.json**
   - `moduleResolution: "bundler"`
   - `skipLibCheck: true`

4. **Deshabilitar temporalmente strict**
   ```json
   {
     "compilerOptions": {
       "strict": false,
       "noImplicitAny": false
     }
   }
   ```

---

**Estado**: ⚠️ Requiere correcciones antes de deploy  
**Prioridad**: 🔴 Alta - Bloqueante de producción  
**Tiempo estimado de corrección**: ~1 hora
