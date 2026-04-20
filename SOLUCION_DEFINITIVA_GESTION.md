# Solución Definitiva - Gestión Estratégica

## Resumen

La solución ahora funciona automáticamente: cuando seleccionas un proceso en el selector existente, el sistema detecta el tipo de proceso y actualiza la gestión automáticamente, ocultando "Controles y Planes de Acción" si es un proceso estratégico.

## Cambios Realizados

### 1. Eliminado GestionSelector Innecesario
**Archivos**: `src/components/layout/MainLayout.tsx`

**Cambios**:
- Removido import de GestionSelector
- Removido componente GestionSelector del JSX
- El selector que creé ya no es necesario

### 2. Actualizado GestionContext
**Archivo**: `src/contexts/GestionContext.tsx`

**Cambio**: Solo ocultar "Controles y Planes de Acción", NO "Materializar Riesgos"

**Antes**:
```typescript
'estrategica': {
  label: 'Gestión Estratégica',
  color: '#d32f2f',
  tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
  ocultarItems: ['Controles y Planes de Acción', 'Materializar Riesgos'], // ❌
  soloLectura: true
},
```

**Después**:
```typescript
'estrategica': {
  label: 'Gestión Estratégica',
  color: '#d32f2f',
  tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
  ocultarItems: ['Controles y Planes de Acción'], // ✅ Solo este
  soloLectura: true
},
```

### 3. Creado Hook de Sincronización
**Archivo**: `src/hooks/useSyncProcesoToGestion.ts` (NUEVO)

**Propósito**: Sincronizar automáticamente el proceso seleccionado con la gestión

**Funcionalidad**:
```typescript
// Cuando se selecciona un proceso:
1. Detecta el tipo del proceso (proceso.tipo)
2. Mapea el tipo a una gestión:
   - 'estratégico' → 'estrategica'
   - 'comercial' → 'comercial'
   - 'operacional' → 'riesgos'
   - etc.
3. Actualiza la gestión automáticamente
4. El GestionContext oculta los items del menú según la gestión
```

**Mapeo**:
```typescript
const TIPO_A_GESTION = {
  'estratégico': 'estrategica',
  'estrategico': 'estrategica',
  'estrategia': 'estrategica',
  'operacional': 'riesgos',
  'operativo': 'riesgos',
  'operacion': 'riesgos',
  'comercial': 'comercial',
  'talento humano': 'talento',
  'talento': 'talento',
  'tesorería': 'tesoreria',
  'tesoreria': 'tesoreria',
  'financiera': 'financiera',
  'administrativa': 'administrativa',
  'nómina': 'nomina',
  'nomina': 'nomina',
};
```

### 4. Integrado Hook en MainLayout
**Archivo**: `src/components/layout/MainLayout.tsx`

**Cambios**:
- Importado `useSyncProcesoToGestion`
- Llamado al hook al inicio del componente
- El hook se ejecuta automáticamente cuando cambia el proceso

**Código**:
```typescript
export default function MainLayout() {
  // Sincronizar proceso seleccionado con gestión
  useSyncProcesoToGestion();
  
  // ... resto del código
}
```

### 5. Actualizado Filtrado del Menú
**Archivo**: `src/components/layout/MainLayout.tsx`

**Cambios**:
- Removida lógica de ocultar "Materializar Riesgos"
- Solo se oculta "Controles y Planes de Acción"
- Removida variable `debeOcultarMaterializarRiesgos`

**Código**:
```typescript
.filter((item) => {
  // Filtro por rol PRIMERO
  if (esSupervisorRiesgos) {
    const allowedMenus = [...];
    if (!allowedMenus.includes(item.text)) {
      return false;
    }
  }
  
  // Filtro por gestión DESPUÉS
  if (debeOcultarControlesYPlanes && item.text === 'Controles y Planes de Acción') {
    return false; // ✅ Solo este item se oculta
  }
  
  return true;
})
```

## Flujo de Funcionamiento

```
1. Usuario abre la aplicación
   ↓
2. Usuario selecciona un proceso en el selector existente
   (Ejemplo: "Gestión Estratégica" → "Planificación Estratégica")
   ↓
3. useSyncProcesoToGestion detecta el cambio
   ↓
4. Hook lee proceso.tipo = "Estratégico"
   ↓
5. Hook mapea "Estratégico" → 'estrategica'
   ↓
6. Hook llama setGestionSeleccionada('estrategica')
   ↓
7. GestionContext actualiza:
   - gestionSeleccionada = 'estrategica'
   - debeOcultarControlesYPlanes = true
   ↓
8. MainLayout filtra el menú:
   - Aplica filtro por rol
   - Aplica filtro por gestión
   ↓
9. "Controles y Planes de Acción" se oculta del menú lateral
   ↓
10. "Materializar Riesgos" permanece visible ✅
```

## Validaciones

✅ Sin errores de compilación
✅ GestionSelector innecesario eliminado
✅ Solo se oculta "Controles y Planes de Acción"
✅ "Materializar Riesgos" permanece visible
✅ Sincronización automática con el proceso seleccionado
✅ No requiere selector adicional

## Archivos Modificados

1. `src/contexts/GestionContext.tsx` - Removido "Materializar Riesgos" de ocultarItems
2. `src/components/layout/MainLayout.tsx` - Removido GestionSelector, agregado hook
3. `src/hooks/useSyncProcesoToGestion.ts` - NUEVO - Hook de sincronización

## Archivos Eliminados/No Usados

- `src/components/layout/GestionSelector.tsx` - Ya no se usa (puede eliminarse)

## Resultado Esperado

Cuando seleccionas un proceso estratégico en el selector existente:
- ✅ "Controles y Planes de Acción" desaparece del menú lateral
- ✅ "Materializar Riesgos" permanece visible
- ✅ Los demás items permanecen visibles
- ✅ No hay selector adicional innecesario

Cuando seleccionas un proceso de otra gestión:
- ✅ "Controles y Planes de Acción" reaparece en el menú lateral
- ✅ Todo funciona automáticamente

## Próximos Pasos

1. Recargar la aplicación en el navegador
2. Seleccionar un proceso estratégico en el selector existente
3. Verificar que "Controles y Planes de Acción" desaparezca del menú lateral
4. Verificar que "Materializar Riesgos" permanezca visible
5. Seleccionar un proceso de otra gestión
6. Verificar que "Controles y Planes de Acción" reaparezca
