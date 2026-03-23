# 🔍 Solución: Planes Aparentemente Duplicados

## 📋 Problema Identificado

Los usuarios veían múltiples planes con la misma descripción:
- "El analista de Help Desk socializara el manual de TI"
- Mismo riesgo: 2GTI
- Mismas observaciones

Esto daba la impresión de que había planes duplicados.

---

## 🎯 Causa Raíz

**NO son planes duplicados**. Son planes diferentes asociados a **causas diferentes del mismo riesgo**.

### Estructura de Datos

```
Riesgo 2GTI: "Pérdida de integridad de la información..."
├── Causa 1: "Falta de capacitación del personal"
│   └── Plan: "El analista de Help Desk socializara el manual de TI"
├── Causa 2: "Desconocimiento de procedimientos"
│   └── Plan: "El analista de Help Desk socializara el manual de TI"
└── Causa 3: "Falta de documentación actualizada"
    └── Plan: "El analista de Help Desk socializara el manual de TI"
```

Cada causa tiene su propio plan, pero como el plan es el mismo (socializar el manual), parecían duplicados.

---

## ✅ Solución Implementada

### 1. Agregar Descripción de la Causa

**Backend**: Agregado campo `causaDescripcion` al endpoint
```typescript
return {
  id: causa.id,
  causaRiesgoId: causa.id,
  riesgoId: causa.riesgoId,
  descripcion: gestion.planDescripcion || '',
  causaDescripcion: causa.descripcion || '', // NUEVO
  responsable: gestion.planResponsable || '',
  // ... resto de campos
};
```

**Frontend**: Actualizado tipo `PlanAccionAPI`
```typescript
export interface PlanAccionAPI {
  // ... campos existentes
  causaDescripcion: string; // NUEVO
}
```

### 2. Mostrar Causa en la Tarjeta del Plan

Ahora cada tarjeta muestra:
```
┌─────────────────────────────────────────────┐
│ El analista de Help Desk socializara...    │
│ Causa: Falta de capacitación del personal  │ ← NUEVO
│ [PENDIENTE]                                 │
└─────────────────────────────────────────────┘
```

### 3. Mostrar Causa en el Modal de Detalles

El modal ahora incluye una sección nueva:
```
Riesgo Asociado
┌─────────────────────────────────────────┐
│ Código: 2GTI                            │
│ Pérdida de integridad de la información │
│ [Gestión de TI]                         │
└─────────────────────────────────────────┘

Causa del Riesgo                          ← NUEVO
┌─────────────────────────────────────────┐
│ Falta de capacitación del personal      │
└─────────────────────────────────────────┘

Descripción del Plan
El analista de Help Desk socializara...
```

---

## 🎨 Cambios Visuales

### Antes
```
Plan 1: El analista de Help Desk socializara el manual de TI
Plan 2: El analista de Help Desk socializara el manual de TI
Plan 3: El analista de Help Desk socializara el manual de TI
```
❌ Parecen duplicados

### Ahora
```
Plan 1: El analista de Help Desk socializara el manual de TI
        Causa: Falta de capacitación del personal

Plan 2: El analista de Help Desk socializara el manual de TI
        Causa: Desconocimiento de procedimientos

Plan 3: El analista de Help Desk socializara el manual de TI
        Causa: Falta de documentación actualizada
```
✅ Se entiende que son planes diferentes para causas diferentes

---

## 📊 Archivos Modificados

### Backend
1. **`gestion_riesgos_backend/src/controllers/plan-trazabilidad.controller.ts`**
   - Agregado `causaDescripcion: causa.descripcion` al objeto del plan

### Frontend
2. **`gestion-riesgos-app/src/api/services/planTrazabilidadApi.ts`**
   - Agregado `causaDescripcion: string` al tipo `PlanAccionAPI`

3. **`gestion-riesgos-app/src/components/plan-accion/PlanAccionCard.tsx`**
   - Agregado texto de causa debajo del título del plan
   - Estilo: texto secundario en cursiva

4. **`gestion-riesgos-app/src/components/plan-accion/PlanDetalleDialog.tsx`**
   - Agregada sección "Causa del Riesgo"
   - Caja con fondo azul claro y borde

---

## 🔍 Verificación

Para verificar que los planes son realmente diferentes, ejecuta:

```sql
-- Ver todas las causas del riesgo 2GTI con sus planes
SELECT 
    c.id as causa_id,
    c.descripcion as causa_descripcion,
    c.gestion->>'planDescripcion' as plan_descripcion
FROM "CausaRiesgo" c
WHERE c."riesgoId" IN (
    SELECT id FROM "Riesgo" WHERE "numeroIdentificacion" = '2GTI'
)
AND c."tipoGestion" IN ('PLAN', 'AMBOS')
ORDER BY c.id;
```

Resultado esperado:
```
causa_id | causa_descripcion                    | plan_descripcion
---------|--------------------------------------|----------------------------------
123      | Falta de capacitación del personal   | El analista de Help Desk...
124      | Desconocimiento de procedimientos    | El analista de Help Desk...
125      | Falta de documentación actualizada   | El analista de Help Desk...
```

---

## 💡 Explicación Conceptual

### ¿Por qué múltiples causas tienen el mismo plan?

En la gestión de riesgos, es común que:
1. Un riesgo tenga múltiples causas
2. Varias causas se mitiguen con el mismo plan de acción
3. Cada causa mantiene su propio registro del plan

**Ejemplo Real**:
- **Riesgo**: Pérdida de información
- **Causas**: 
  - Falta de capacitación
  - Desconocimiento de procedimientos
  - Falta de documentación
- **Plan Común**: Socializar el manual de TI

El plan es el mismo, pero se aplica a cada causa de forma independiente.

---

## 🎯 Beneficios de la Solución

### 1. Transparencia
- Ahora se ve claramente que son planes para causas diferentes
- No hay confusión sobre "duplicados"

### 2. Trazabilidad
- Cada plan mantiene su relación con su causa específica
- Se puede hacer seguimiento independiente

### 3. Flexibilidad
- Si en el futuro una causa necesita un plan diferente, se puede modificar sin afectar las otras

### 4. Auditoría
- Se mantiene el registro de qué plan se aplicó a qué causa
- Historial completo de cambios por causa

---

## 🔄 Alternativas Consideradas

### Opción A: Agrupar Planes Idénticos
**Descartada**: Perdería la trazabilidad individual por causa

### Opción B: Mostrar Causa (Implementada)
**Seleccionada**: Mantiene trazabilidad y claridad

### Opción C: Filtrar Duplicados Exactos
**Descartada**: Ocultaría información importante

---

## 📝 Recomendaciones

### Para el Futuro

1. **Considerar Planes Compartidos**: Si muchos planes son idénticos, evaluar crear un sistema de "planes compartidos" que múltiples causas puedan referenciar.

2. **Validación en Creación**: Al crear un plan, mostrar si ya existe uno similar para otra causa del mismo riesgo.

3. **Agrupación Visual**: En la vista de lista, considerar agrupar planes idénticos con un contador "3 causas".

---

**Fecha de solución**: 22 de marzo de 2026  
**Estado**: ✅ Implementado y funcional  
**Impacto**: Mejora la claridad sin cambiar la estructura de datos
