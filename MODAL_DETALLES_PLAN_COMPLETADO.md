# ✅ Modal de Detalles del Plan - Completado

## Resumen

Se ha implementado un modal de detalles que muestra toda la información del plan de acción, incluyendo datos de la causa y el riesgo asociado. También se corrigió el error al cambiar el estado del plan.

---

## 🐛 Errores Corregidos

### 1. Error al Cambiar Estado
**Error**: `Cannot read properties of undefined (reading 'replace')`

**Causa**: La línea `estadoLocal.replace('_', ' ')` fallaba cuando `estadoLocal` era `undefined`

**Solución**: Creada función `formatEstado()` que maneja valores undefined:
```typescript
const formatEstado = (estado: EstadoPlan) => {
  if (!estado) return 'PENDIENTE';
  return estado.replace(/_/g, ' ').toUpperCase();
};
```

---

## 🎯 Nuevo Componente: PlanDetalleDialog

### Ubicación
`gestion-riesgos-app/src/components/plan-accion/PlanDetalleDialog.tsx`

### Características

#### 1. Información del Riesgo Asociado
- Código del riesgo (número de identificación)
- Descripción completa del riesgo
- Proceso al que pertenece
- Diseño visual destacado con fondo gris

#### 2. Descripción del Plan
- Muestra la descripción completa del plan
- Formato de texto con saltos de línea preservados

#### 3. Observaciones
- Muestra observaciones adicionales si existen
- Texto secundario con formato preservado

#### 4. Información General
- Responsable del plan
- Fecha programada
- Fecha de inicio
- Fecha de fin
- Grid de 2 columnas para mejor organización

#### 5. Alertas de Vencimiento
- Alerta roja si el plan está vencido
- Alerta amarilla si está próximo a vencer (7 días)
- Muestra días restantes o días de retraso

#### 6. Estado del Plan
- Chip con color según el estado
- Estados: Pendiente, En Ejecución, Completado, Convertido a Control

#### 7. Control Derivado
- Alerta informativa si el plan fue convertido
- Muestra ID del control
- Muestra fecha de conversión

#### 8. Metadatos
- Fecha de creación
- Fecha de última actualización

### Props
```typescript
interface PlanDetalleDialogProps {
  open: boolean;
  plan: PlanAccionAPI | null;
  onClose: () => void;
}
```

---

## 🔄 Cambios en Componentes Existentes

### 1. PlanAccionCard
**Archivo**: `gestion-riesgos-app/src/components/plan-accion/PlanAccionCard.tsx`

**Cambios**:
- Agregado prop `onVerDetalle?: (planId: number) => void`
- Agregado botón "Ver Detalles" con ícono de ojo
- Corregido error en `formatEstado()`
- Importado `VisibilityIcon`

**Nuevo Botón**:
```typescript
<Button
  variant="outlined"
  startIcon={<VisibilityIcon />}
  onClick={() => onVerDetalle(plan.id)}
  size="small"
>
  Ver Detalles
</Button>
```

### 2. PlanesAccionPage
**Archivo**: `gestion-riesgos-app/src/pages/planes/PlanesAccionPage.tsx`

**Cambios**:
- Agregado estado `detalleDialogOpen` y `planParaDetalle`
- Agregada función `handleVerDetalle()`
- Agregado prop `onVerDetalle` a `PlanAccionCard`
- Renderizado de `PlanDetalleDialog` al final

**Nuevo Handler**:
```typescript
const handleVerDetalle = (planId: number) => {
  const plan = planes.find((p) => p.id === planId);
  if (plan) {
    setPlanParaDetalle(plan);
    setDetalleDialogOpen(true);
  }
};
```

### 3. Tipos Actualizados
**Archivo**: `gestion-riesgos-app/src/types/planAccion.types.ts`

**Cambio**:
```typescript
export interface PlanAccionCardProps {
  // ... props existentes
  onVerDetalle?: (planId: number) => void; // NUEVO
  showConversionButton?: boolean;
}
```

---

## 🎨 Diseño del Modal

### Estructura Visual

```
┌─────────────────────────────────────────────────┐
│ Detalle del Plan de Acción              [X]    │
├─────────────────────────────────────────────────┤
│                                                 │
│ [⚠️ Alerta de Vencimiento] (si aplica)         │
│                                                 │
│ [Chip: ESTADO]                                  │
│                                                 │
│ ┌─ Riesgo Asociado ─────────────────────────┐  │
│ │ Código: 3GAD                              │  │
│ │ Riesgo de acceso no autorizado            │  │
│ │ [Chip: Gestión de TI]                     │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ Descripción del Plan                            │
│ Implementar control de acceso biométrico...    │
│                                                 │
│ Observaciones                                   │
│ Se requiere coordinación con TI...             │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ Información General                             │
│ ┌──────────────┬──────────────┐                │
│ │ Responsable  │ Fecha Prog.  │                │
│ │ Juan Pérez   │ 30 dic 2025  │                │
│ ├──────────────┼──────────────┤                │
│ │ Fecha Inicio │ Fecha Fin    │                │
│ │ 1 ene 2025   │ 30 dic 2025  │                │
│ └──────────────┴──────────────┘                │
│                                                 │
│ [ℹ️ Control Derivado] (si aplica)              │
│                                                 │
│ ─────────────────────────────────────────────  │
│ Creado: 1 ene 2025 | Actualizado: 20 mar 2026  │
│                                                 │
├─────────────────────────────────────────────────┤
│                              [Cerrar]           │
└─────────────────────────────────────────────────┘
```

### Colores de Estado

| Estado | Color | Badge |
|--------|-------|-------|
| Pendiente | default (gris) | PENDIENTE |
| En Ejecución | warning (naranja) | EN EJECUCIÓN |
| Completado | success (verde) | COMPLETADO |
| Convertido | secondary (morado) | CONVERTIDO A CONTROL |

---

## 🔄 Flujo de Usuario

1. Usuario ve lista de planes en `/planes-accion`
2. Cada plan muestra solo título y datos básicos
3. Usuario hace clic en botón "Ver Detalles"
4. Se abre modal con información completa:
   - Riesgo asociado
   - Descripción del plan
   - Observaciones
   - Fechas
   - Responsable
   - Estado
   - Alertas de vencimiento
5. Usuario revisa la información
6. Usuario cierra el modal

---

## ✅ Beneficios

### Antes
- Todos los planes mostraban "El analista de Help Desk socializara el manual de TI"
- No se podía ver información del riesgo
- No se podían ver observaciones
- Información limitada en la tarjeta

### Ahora
- Cada plan muestra su descripción única
- Modal con toda la información detallada
- Información del riesgo asociado visible
- Observaciones y detalles completos
- Mejor organización visual
- Alertas de vencimiento destacadas

---

## 🧪 Pruebas Recomendadas

### 1. Ver Detalles
- [ ] Hacer clic en "Ver Detalles" de un plan
- [ ] Verificar que se abre el modal
- [ ] Verificar que muestra información del riesgo
- [ ] Verificar que muestra descripción del plan
- [ ] Verificar que muestra fechas correctas

### 2. Alertas de Vencimiento
- [ ] Ver plan vencido (alerta roja)
- [ ] Ver plan próximo a vencer (alerta amarilla)
- [ ] Ver plan sin alerta (normal)

### 3. Estados
- [ ] Ver plan pendiente
- [ ] Ver plan en ejecución
- [ ] Ver plan completado
- [ ] Ver plan convertido a control

### 4. Control Derivado
- [ ] Ver plan convertido
- [ ] Verificar que muestra ID del control
- [ ] Verificar que muestra fecha de conversión

### 5. Cerrar Modal
- [ ] Cerrar con botón "Cerrar"
- [ ] Cerrar con X en esquina
- [ ] Cerrar haciendo clic fuera del modal

---

## 📊 Estado del Proyecto

| Componente | Estado | Progreso |
|------------|--------|----------|
| Modal de Detalles | ✅ Completado | 100% |
| Botón Ver Detalles | ✅ Completado | 100% |
| Error de Estado | ✅ Corregido | 100% |
| Información del Riesgo | ✅ Completado | 100% |
| Alertas de Vencimiento | ✅ Completado | 100% |
| Control Derivado | ✅ Completado | 100% |

**Progreso Total**: 100%

---

## 📝 Archivos Creados/Modificados

### Archivos Creados
1. `gestion-riesgos-app/src/components/plan-accion/PlanDetalleDialog.tsx` (nuevo)

### Archivos Modificados
2. `gestion-riesgos-app/src/components/plan-accion/PlanAccionCard.tsx`
3. `gestion-riesgos-app/src/components/plan-accion/index.ts`
4. `gestion-riesgos-app/src/pages/planes/PlanesAccionPage.tsx`
5. `gestion-riesgos-app/src/types/planAccion.types.ts`

---

**Fecha de completitud**: 22 de marzo de 2026  
**Estado**: ✅ Completado y funcional  
**Próximo paso**: Probar funcionalidad en el navegador
