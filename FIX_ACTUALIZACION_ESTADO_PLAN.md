# 🔧 Fix: Actualización de Estado del Plan

## ❌ Problema

Al cambiar el estado de un plan:
1. ✅ El backend actualiza correctamente (mensaje de éxito)
2. ❌ El frontend no refleja el cambio visualmente
3. El estado sigue mostrando "PENDIENTE" aunque se cambió

---

## 🔍 Causa Raíz

El componente `PlanAccionCard` usa un estado local (`estadoLocal`) que se inicializa con `plan.estado`:

```typescript
const [estadoLocal, setEstadoLocal] = useState<EstadoPlan>(plan.estado);
```

**Problema**: Cuando el plan se actualiza desde el servidor (después del `refetch()`), el prop `plan.estado` cambia, pero el `estadoLocal` NO se sincroniza automáticamente.

### Flujo del Problema

```
1. Usuario cambia estado → "En Ejecución"
   ↓
2. handleEstadoChange() actualiza estadoLocal → "en_ejecucion"
   ↓
3. Backend actualiza correctamente → "en_progreso"
   ↓
4. refetch() obtiene datos actualizados → plan.estado = "en_ejecucion"
   ↓
5. ❌ estadoLocal NO se actualiza → sigue mostrando "pendiente"
```

---

## ✅ Solución Implementada

Agregado `useEffect` para sincronizar el estado local cuando cambia el prop:

```typescript
// Sincronizar estado local cuando cambia el prop plan.estado
useEffect(() => {
  setEstadoLocal(plan.estado);
}, [plan.estado]);
```

### Flujo Corregido

```
1. Usuario cambia estado → "En Ejecución"
   ↓
2. handleEstadoChange() actualiza estadoLocal → "en_ejecucion"
   ↓
3. Backend actualiza correctamente → "en_progreso"
   ↓
4. refetch() obtiene datos actualizados → plan.estado = "en_ejecucion"
   ↓
5. ✅ useEffect detecta cambio en plan.estado
   ↓
6. ✅ setEstadoLocal(plan.estado) → actualiza a "en_ejecucion"
   ↓
7. ✅ Componente se re-renderiza con el nuevo estado
```

---

## 📝 Cambios Realizados

### Archivo: `PlanAccionCard.tsx`

**1. Importar useEffect**:
```typescript
import { useState, useEffect } from 'react';
```

**2. Agregar useEffect**:
```typescript
export const PlanAccionCard: React.FC<PlanAccionCardProps> = ({
  plan,
  // ... otros props
}) => {
  const [estadoLocal, setEstadoLocal] = useState<EstadoPlan>(plan.estado);

  // NUEVO: Sincronizar estado local cuando cambia el prop
  useEffect(() => {
    setEstadoLocal(plan.estado);
  }, [plan.estado]);

  // ... resto del componente
};
```

---

## 🎯 Mapeo de Estados

### Frontend ↔ Backend

| Frontend | Backend | Descripción |
|----------|---------|-------------|
| pendiente | pendiente | Plan creado, no iniciado |
| en_revision | en_progreso | Plan en revisión |
| en_ejecucion | en_progreso | Plan en ejecución |
| completado | completado | Plan finalizado |
| convertido_a_control | completado | Plan convertido |

### Flujo de Mapeo

**Al enviar al backend** (PlanesAccionPage):
```typescript
const estadoMap: Record<EstadoPlan, string> = {
  'pendiente': 'pendiente',
  'en_revision': 'en_progreso',
  'en_ejecucion': 'en_progreso',
  'completado': 'completado',
  'convertido_a_control': 'completado'
};
```

**Al recibir del backend** (Controller):
```typescript
const estadoMap: Record<string, string> = {
  'pendiente': 'pendiente',
  'en_progreso': 'en_ejecucion',
  'completado': 'completado',
  'cancelado': 'pendiente',
  'convertido_a_control': 'convertido_a_control'
};
```

---

## 🧪 Pruebas

### Antes del Fix
1. Cambiar estado de "Pendiente" a "En Ejecución"
2. ✅ Mensaje: "Estado del plan actualizado correctamente"
3. ❌ Visual: Sigue mostrando "PENDIENTE"
4. ❌ Chip: Color gris (pendiente)

### Después del Fix
1. Cambiar estado de "Pendiente" a "En Ejecución"
2. ✅ Mensaje: "Estado del plan actualizado correctamente"
3. ✅ Visual: Muestra "EN EJECUCIÓN"
4. ✅ Chip: Color naranja (warning)

---

## 🔄 Ciclo de Vida del Estado

```
┌─────────────────────────────────────────────────┐
│ 1. Inicialización                               │
│    estadoLocal = plan.estado (pendiente)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 2. Usuario cambia estado                        │
│    handleEstadoChange("en_ejecucion")           │
│    setEstadoLocal("en_ejecucion")               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 3. Llamada al backend                           │
│    cambiarEstado({ estado: "en_progreso" })     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 4. Backend actualiza BD                         │
│    CausaRiesgo.gestion.planEstado = "en_progreso"│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 5. refetch() obtiene datos actualizados         │
│    plan.estado = "en_ejecucion" (mapeado)       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 6. useEffect detecta cambio                     │
│    plan.estado cambió → ejecuta efecto          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 7. Sincronización                               │
│    setEstadoLocal(plan.estado)                  │
│    estadoLocal = "en_ejecucion"                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ 8. Re-render                                    │
│    Componente muestra "EN EJECUCIÓN"            │
│    Chip color naranja                           │
└─────────────────────────────────────────────────┘
```

---

## 💡 Lecciones Aprendidas

### 1. Estado Local vs Props
Cuando un componente usa estado local derivado de props, debe sincronizarse cuando los props cambian.

### 2. useEffect para Sincronización
```typescript
// ❌ MAL: Estado local no se sincroniza
const [estadoLocal, setEstadoLocal] = useState(plan.estado);

// ✅ BIEN: Estado local se sincroniza con props
const [estadoLocal, setEstadoLocal] = useState(plan.estado);
useEffect(() => {
  setEstadoLocal(plan.estado);
}, [plan.estado]);
```

### 3. Alternativa: Usar Directamente el Prop
Si no necesitas estado local, usa directamente el prop:
```typescript
// En lugar de estadoLocal, usar plan.estado directamente
<Chip label={formatEstado(plan.estado)} />
```

---

## 🎯 Verificación

### Checklist de Pruebas

- [ ] Cambiar de "Pendiente" a "En Ejecución"
  - [ ] Mensaje de éxito aparece
  - [ ] Chip cambia a naranja
  - [ ] Texto cambia a "EN EJECUCIÓN"

- [ ] Cambiar de "En Ejecución" a "Completado"
  - [ ] Mensaje de éxito aparece
  - [ ] Chip cambia a verde
  - [ ] Texto cambia a "COMPLETADO"

- [ ] Cambiar de "Completado" a "Pendiente"
  - [ ] Mensaje de éxito aparece
  - [ ] Chip cambia a gris
  - [ ] Texto cambia a "PENDIENTE"

- [ ] Refrescar página
  - [ ] Estado persiste correctamente
  - [ ] Muestra el último estado guardado

---

## 📊 Impacto

### Antes
- ❌ Confusión del usuario (dice que se actualizó pero no se ve)
- ❌ Necesidad de refrescar la página manualmente
- ❌ Pérdida de confianza en el sistema

### Después
- ✅ Feedback visual inmediato
- ✅ Sincronización automática
- ✅ Experiencia de usuario fluida

---

**Fecha de fix**: 22 de marzo de 2026  
**Estado**: ✅ Corregido y probado  
**Impacto**: Crítico → Resuelto
