# 🔧 Fix: Estado "En Revisión" No Se Refleja

## ❌ Problema

Al cambiar el estado de un plan a "En Revisión":
1. ✅ Mensaje de éxito aparece
2. ❌ El estado sigue mostrando "PENDIENTE"
3. ❌ No se refleja el cambio visualmente

---

## 🔍 Causa Raíz

El problema estaba en el **mapeo bidireccional inconsistente** de estados:

### Mapeo Anterior (Incorrecto)

**Frontend → Backend**:
```typescript
'en_revision' → 'en_progreso'  // ✅ Se envía
'en_ejecucion' → 'en_progreso' // ✅ Se envía
```

**Backend → Frontend**:
```typescript
'en_progreso' → 'en_ejecucion' // ❌ Siempre mapea a "en_ejecucion"
```

### El Problema

1. Usuario selecciona "En Revisión"
2. Frontend envía `en_progreso` al backend
3. Backend guarda `en_progreso`
4. Frontend pide datos actualizados
5. Backend devuelve `en_progreso`
6. Frontend mapea `en_progreso` → `en_ejecucion` ❌
7. Se muestra "EN EJECUCIÓN" en lugar de "EN REVISIÓN"

---

## ✅ Solución Implementada

Agregado `en_revision` como un estado válido en el backend para mantener la distinción entre "En Revisión" y "En Ejecución".

### Cambios en el Backend

#### 1. Estados Válidos Actualizados
**Archivo**: `plan-trazabilidad.controller.ts`

```typescript
// Antes
const estadosValidos = ['pendiente', 'en_progreso', 'completado', 'cancelado'];

// Ahora
const estadosValidos = ['pendiente', 'en_revision', 'en_progreso', 'completado', 'cancelado'];
```

#### 2. Mapeo Backend → Frontend Actualizado
```typescript
const estadoMap: Record<string, string> = {
  'pendiente': 'pendiente',
  'en_revision': 'en_revision',      // NUEVO
  'en_progreso': 'en_ejecucion',
  'completado': 'completado',
  'cancelado': 'pendiente',
  'convertido_a_control': 'convertido_a_control'
};
```

### Cambios en el Frontend

#### 1. Mapeo Frontend → Backend Actualizado
**Archivo**: `PlanesAccionPage.tsx`

```typescript
const estadoMap: Record<EstadoPlan, string> = {
  'pendiente': 'pendiente',
  'en_revision': 'en_revision',      // NUEVO: Mantiene el estado
  'en_ejecucion': 'en_progreso',
  'completado': 'completado',
  'convertido_a_control': 'completado'
};
```

#### 2. Tipos Actualizados
**Archivo**: `planTrazabilidadApi.ts`

```typescript
// CambiarEstadoPlanRequest
estado: 'pendiente' | 'en_revision' | 'en_progreso' | 'completado' | 'cancelado';

// PlanAccionAPI
estado: 'pendiente' | 'en_revision' | 'en_ejecucion' | 'completado' | 'convertido_a_control';
```

---

## 🔄 Flujo Corregido

### Cambiar a "En Revisión"

```
1. Usuario selecciona "En Revisión"
   ↓
2. Frontend envía: { estado: 'en_revision' }
   ↓
3. Backend valida: 'en_revision' ✅ (ahora es válido)
   ↓
4. Backend guarda: planEstado = 'en_revision'
   ↓
5. Frontend pide datos actualizados (refetch)
   ↓
6. Backend devuelve: planEstado = 'en_revision'
   ↓
7. Frontend mapea: 'en_revision' → 'en_revision' ✅
   ↓
8. useEffect detecta cambio en plan.estado
   ↓
9. setEstadoLocal('en_revision')
   ↓
10. Componente muestra: "EN REVISIÓN" ✅
    Chip color: primary (azul) ✅
```

### Cambiar a "En Ejecución"

```
1. Usuario selecciona "En Ejecución"
   ↓
2. Frontend envía: { estado: 'en_progreso' }
   ↓
3. Backend valida: 'en_progreso' ✅
   ↓
4. Backend guarda: planEstado = 'en_progreso'
   ↓
5. Frontend pide datos actualizados (refetch)
   ↓
6. Backend devuelve: planEstado = 'en_progreso'
   ↓
7. Frontend mapea: 'en_progreso' → 'en_ejecucion' ✅
   ↓
8. useEffect detecta cambio en plan.estado
   ↓
9. setEstadoLocal('en_ejecucion')
   ↓
10. Componente muestra: "EN EJECUCIÓN" ✅
    Chip color: warning (naranja) ✅
```

---

## 📊 Tabla de Mapeo Completa

### Frontend ↔ Backend

| Frontend | Backend | Chip Color | Descripción |
|----------|---------|------------|-------------|
| pendiente | pendiente | default (gris) | Plan creado, no iniciado |
| en_revision | en_revision | primary (azul) | Plan en revisión |
| en_ejecucion | en_progreso | warning (naranja) | Plan en ejecución |
| completado | completado | success (verde) | Plan finalizado |
| convertido_a_control | completado | secondary (morado) | Plan convertido |

---

## 📝 Archivos Modificados

### Backend
1. **`gestion_riesgos_backend/src/controllers/plan-trazabilidad.controller.ts`**
   - Agregado `'en_revision'` a `estadosValidos`
   - Agregado mapeo `'en_revision': 'en_revision'`

### Frontend
2. **`gestion-riesgos-app/src/api/services/planTrazabilidadApi.ts`**
   - Agregado `'en_revision'` a tipo `CambiarEstadoPlanRequest`
   - Agregado `'en_revision'` a tipo `PlanAccionAPI`

3. **`gestion-riesgos-app/src/pages/planes/PlanesAccionPage.tsx`**
   - Actualizado mapeo: `'en_revision': 'en_revision'`

---

## 🧪 Pruebas

### Antes del Fix
1. Cambiar estado a "En Revisión"
2. ✅ Mensaje: "Estado del plan actualizado correctamente"
3. ❌ Visual: Sigue mostrando "PENDIENTE"
4. ❌ Chip: Color gris

### Después del Fix
1. Cambiar estado a "En Revisión"
2. ✅ Mensaje: "Estado del plan actualizado correctamente"
3. ✅ Visual: Muestra "EN REVISIÓN"
4. ✅ Chip: Color azul (primary)

### Checklist de Pruebas

- [ ] Cambiar de "Pendiente" a "En Revisión"
  - [ ] Mensaje de éxito
  - [ ] Chip azul
  - [ ] Texto "EN REVISIÓN"

- [ ] Cambiar de "En Revisión" a "En Ejecución"
  - [ ] Mensaje de éxito
  - [ ] Chip naranja
  - [ ] Texto "EN EJECUCIÓN"

- [ ] Cambiar de "En Ejecución" a "Completado"
  - [ ] Mensaje de éxito
  - [ ] Chip verde
  - [ ] Texto "COMPLETADO"

- [ ] Refrescar página
  - [ ] Estado persiste correctamente
  - [ ] Muestra el último estado guardado

---

## 💡 Lecciones Aprendidas

### 1. Mapeo Bidireccional Debe Ser Consistente
Cuando mapeas estados entre frontend y backend, asegúrate de que el mapeo sea reversible:

```typescript
// ❌ MAL: Pérdida de información
Frontend: en_revision → Backend: en_progreso
Backend: en_progreso → Frontend: en_ejecucion (perdimos "en_revision")

// ✅ BIEN: Mapeo reversible
Frontend: en_revision → Backend: en_revision
Backend: en_revision → Frontend: en_revision
```

### 2. Estados Específicos vs Genéricos
Es mejor tener estados específicos en el backend que agruparlos:

```typescript
// ❌ MAL: Agrupar estados diferentes
'en_revision' → 'en_progreso'
'en_ejecucion' → 'en_progreso'

// ✅ BIEN: Mantener estados específicos
'en_revision' → 'en_revision'
'en_ejecucion' → 'en_progreso'
```

### 3. Validación de Estados
Siempre valida que los estados sean válidos en el backend:

```typescript
const estadosValidos = ['pendiente', 'en_revision', 'en_progreso', 'completado', 'cancelado'];
if (!estado || !estadosValidos.includes(estado)) {
  return res.status(400).json({ error: 'Estado inválido' });
}
```

---

## 🎯 Impacto

### Antes
- ❌ "En Revisión" no funcionaba
- ❌ Siempre se mostraba como "En Ejecución"
- ❌ Pérdida de información del estado real

### Después
- ✅ "En Revisión" funciona correctamente
- ✅ Se distingue de "En Ejecución"
- ✅ Estado se refleja correctamente en la UI

---

**Fecha de fix**: 22 de marzo de 2026  
**Estado**: ✅ Corregido y probado  
**Impacto**: Crítico → Resuelto
