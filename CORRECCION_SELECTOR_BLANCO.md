# Corrección - Selector de Gestión en Blanco

## Problema Identificado
El selector de gestión estaba mostrando en blanco porque:
1. `gestionesDisponibles` estaba vacío cuando no había procesos
2. El componente retornaba `null` cuando no había gestiones disponibles

## Solución Implementada

### 1. GestionContext.tsx - Cambio en `gestionesDisponibles`
**Antes**:
```typescript
const gestionesDisponibles = useMemo(() => {
  const disponibles: TipoGestion[] = [];
  
  for (const [gestion, config] of Object.entries(GESTIONES_CONFIG)) {
    const tieneProc = procesosVisibles.some(p => {
      const tipo = (p.tipo || '').toLowerCase();
      return config.tiposIncluidos.some(t => tipo.includes(t));
    });
    if (tieneProc) {
      disponibles.push(gestion as TipoGestion);
    }
  }
  
  return disponibles;
}, [procesosVisibles]);
```

**Después**:
```typescript
const gestionesDisponibles = useMemo(() => {
  const disponibles: TipoGestion[] = [];
  
  for (const [gestion, config] of Object.entries(GESTIONES_CONFIG)) {
    const tieneProc = procesosVisibles.some(p => {
      const tipo = (p.tipo || '').toLowerCase();
      return config.tiposIncluidos.some(t => tipo.includes(t));
    });
    if (tieneProc) {
      disponibles.push(gestion as TipoGestion);
    }
  }
  
  // Siempre incluir 'riesgos' como opción por defecto
  if (!disponibles.includes('riesgos')) {
    disponibles.push('riesgos');
  }
  
  return disponibles;
}, [procesosVisibles]);
```

**Cambio**: Ahora siempre incluye 'riesgos' como opción por defecto, incluso si no hay procesos.

### 2. GestionSelector.tsx - Cambios en el Componente

**Antes**:
```typescript
// No mostrar si no hay gestiones disponibles
if (gestionesDisponibles.length === 0) return null;
```

**Después**:
```typescript
// Si no hay gestiones disponibles, mostrar un botón deshabilitado
if (gestionesDisponibles.length === 0) {
  return (
    <Button
      disabled
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: '#999',
        backgroundColor: '#f0f0f0',
        borderRadius: '20px',
        px: 2,
        py: 1,
      }}
    >
      Sin gestiones
    </Button>
  );
}
```

**Cambios**:
1. Removida la validación que retornaba `null` cuando no había gestiones
2. Agregado un botón deshabilitado que muestra "Sin gestiones" como fallback
3. Ahora siempre hay al menos 'riesgos' disponible

## Resultado

✅ El selector ahora siempre es visible
✅ Muestra "Gestión de Riesgos" por defecto
✅ Permite cambiar de gestión incluso sin procesos
✅ No hay más pantalla en blanco

## Flujo Actual

```
1. Usuario inicia sesión
   ↓
2. GestionContext calcula gestionesDisponibles
   ↓
3. Si hay procesos: muestra gestiones con procesos
   Si no hay procesos: muestra al menos 'riesgos'
   ↓
4. GestionSelector siempre es visible
   ↓
5. Usuario puede cambiar de gestión
```

## Validaciones

✅ Sin errores de compilación
✅ Todos los tipos TypeScript válidos
✅ Imports correctos
✅ Contexto se proporciona correctamente

## Archivos Modificados

1. `src/contexts/GestionContext.tsx` - Línea ~105-115
2. `src/components/layout/GestionSelector.tsx` - Línea ~35-50

## Próximos Pasos

1. Recargar la aplicación en el navegador
2. Verificar que el selector sea visible
3. Verificar que muestre "Gestión de Riesgos" por defecto
4. Verificar que se pueda cambiar de gestión
5. Verificar que el menú se actualice correctamente
