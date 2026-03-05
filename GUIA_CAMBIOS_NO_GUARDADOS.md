# Guía de Implementación: Sistema de Cambios No Guardados

## Descripción General

Sistema implementado para detectar y advertir al usuario cuando intenta navegar con cambios sin guardar en formularios.

## Componentes Creados

### 1. Hook: `useUnsavedChanges`
**Ubicación:** `src/hooks/useUnsavedChanges.ts`

**Funcionalidades:**
- Detecta cambios no guardados
- Bloquea navegación interna (React Router)
- Bloquea navegación externa (cerrar pestaña, recargar)
- Proporciona funciones para marcar como guardado o forzar navegación

**Hooks auxiliares:**
- `useFormChanges`: Compara estado inicial vs actual de objetos
- `useArrayChanges`: Compara arrays para detectar cambios

### 2. Componente: `UnsavedChangesDialog`
**Ubicación:** `src/components/common/UnsavedChangesDialog.tsx`

**Características:**
- Diálogo modal con 3 opciones: Guardar, Descartar, Cancelar
- Diseño consistente con Material-UI
- Soporte para estado de carga (guardando...)
- Mensajes personalizables

## Cómo Implementar en una Página

### Paso 1: Importar los hooks y componentes

```typescript
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
```

### Paso 2: Definir estado inicial y actual

```typescript
// Estado del formulario
const [formData, setFormData] = useState<MiTipoFormulario>({
  campo1: '',
  campo2: '',
  // ... más campos
});

// Estado inicial para comparación
const [initialFormData, setInitialFormData] = useState<MiTipoFormulario>(formData);
```

### Paso 3: Detectar cambios

```typescript
// Detectar cambios en el formulario
const hasFormChanges = useFormChanges(initialFormData, formData, {
  ignoreFields: ['campoSoloLectura'], // Opcional: campos a ignorar
  deepCompare: false, // true para comparación profunda de objetos anidados
});
```

### Paso 4: Configurar el sistema de bloqueo

```typescript
// Sistema de cambios no guardados
const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasFormChanges && !isReadOnly,
  message: 'Tiene cambios sin guardar.',
  disabled: isReadOnly, // Deshabilitar en modo solo lectura
});

const [isSaving, setIsSaving] = useState(false);
```

### Paso 5: Actualizar función de guardado

```typescript
const handleSave = async () => {
  try {
    setIsSaving(true);
    
    // Tu lógica de guardado existente
    await tuFuncionDeGuardado(formData);
    
    // IMPORTANTE: Marcar como guardado y actualizar estado inicial
    setInitialFormData(formData);
    markAsSaved();
    
    showSuccess('Guardado exitosamente');
  } catch (error) {
    showError('Error al guardar');
  } finally {
    setIsSaving(false);
  }
};
```

### Paso 6: Crear handlers para el diálogo

```typescript
// Handler para guardar desde el diálogo
const handleSaveFromDialog = async () => {
  await handleSave();
  if (!isSaving) {
    forceNavigate();
  }
};

// Handler para descartar cambios
const handleDiscardChanges = () => {
  setFormData(initialFormData);
  forceNavigate();
};
```

### Paso 7: Agregar el diálogo al JSX

```typescript
return (
  <>
    {/* Diálogo de cambios no guardados */}
    <UnsavedChangesDialog
      open={blocker.state === 'blocked'}
      onSave={handleSaveFromDialog}
      onDiscard={handleDiscardChanges}
      onCancel={() => blocker.reset?.()}
      isSaving={isSaving}
      message="Tiene cambios sin guardar."
      description="¿Desea guardar los cambios antes de salir?"
    />

    {/* Tu contenido existente */}
    <TuComponente />
  </>
);
```

### Paso 8: Actualizar botón de guardar (opcional)

```typescript
<Button
  onClick={handleSave}
  disabled={isSaving || !hasFormChanges}
>
  {isSaving ? 'Guardando...' : 'Guardar'}
</Button>
```

## Ejemplo Completo: Página Simple

```typescript
import { useState, useEffect } from 'react';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';

interface FormData {
  nombre: string;
  descripcion: string;
}

export default function MiPagina() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
  });
  
  const [initialFormData, setInitialFormData] = useState<FormData>(formData);
  const [isSaving, setIsSaving] = useState(false);
  
  // Detectar cambios
  const hasFormChanges = useFormChanges(initialFormData, formData);
  
  // Sistema de bloqueo
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasFormChanges,
    message: 'Tiene cambios sin guardar.',
  });
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchData();
      setFormData(data);
      setInitialFormData(data);
    };
    loadData();
  }, []);
  
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveData(formData);
      setInitialFormData(formData);
      markAsSaved();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!isSaving) forceNavigate();
  };
  
  const handleDiscardChanges = () => {
    setFormData(initialFormData);
    forceNavigate();
  };
  
  return (
    <>
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
      />
      
      <form>
        <input
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        />
        <button onClick={handleSave} disabled={isSaving || !hasFormChanges}>
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </>
  );
}
```

## Casos Especiales

### Formularios con Arrays (Listas de Items)

```typescript
const [items, setItems] = useState<Item[]>([]);
const [initialItems, setInitialItems] = useState<Item[]>([]);

const hasArrayChanges = useArrayChanges(initialItems, items, {
  compareFn: (a, b) => a.id === b.id && a.nombre === b.nombre
});

const hasChanges = hasFormChanges || hasArrayChanges;
```

### Múltiples Formularios en Tabs

```typescript
const hasChangesTab1 = useFormChanges(initialDataTab1, dataTab1);
const hasChangesTab2 = useFormChanges(initialDataTab2, dataTab2);

const hasAnyChanges = hasChangesTab1 || hasChangesTab2;

const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasAnyChanges,
});
```

### Deshabilitar Temporalmente

```typescript
const { blocker } = useUnsavedChanges({
  hasUnsavedChanges: hasChanges,
  disabled: isReadOnly || isSomeSpecialMode,
});
```

## Páginas Implementadas

✅ **FichaPage** - Implementación completa

## Páginas Pendientes de Implementar

Las siguientes páginas tienen formularios y requieren implementación:

### Alta Prioridad (Formularios Críticos)
1. **IdentificacionCalificacionPage** - Identificación y calificación de riesgos
2. **ControlesYPlanesAccionPage** - Controles y planes de acción
3. **EvaluacionControlPage** - Evaluación de controles
4. **MaterializarRiesgosPage** - Materialización de riesgos (incidencias)

### Media Prioridad (Formularios de Configuración)
5. **NormatividadPage** - Normatividad del proceso
6. **ContextoExternoPage** - Contexto externo
7. **ContextoInternoPage** - Contexto interno
8. **DofaPage** - Análisis DOFA
9. **BenchmarkingPage** - Benchmarking
10. **AnalisisProcesoPage** - Análisis del proceso

### Baja Prioridad (Formularios Administrativos)
11. **ProcesosPage** - Gestión de procesos
12. **UsuariosPage** - Gestión de usuarios
13. **AreasPage** - Gestión de áreas
14. **ConfiguracionPage** - Configuración general
15. **ParametrosCalificacionPage** - Parámetros de calificación
16. **MapasConfigPage** - Configuración de mapas

## Notas Importantes

1. **Modo Solo Lectura**: Siempre deshabilitar el sistema cuando `isReadOnly` o `modoProceso === 'visualizar'`

2. **Actualizar Estado Inicial**: Después de guardar exitosamente, SIEMPRE actualizar el estado inicial:
   ```typescript
   setInitialFormData(formData);
   markAsSaved();
   ```

3. **Campos Ignorados**: Usar `ignoreFields` para campos calculados o de solo lectura

4. **Performance**: El hook usa `useCallback` y `useMemo` internamente para optimizar

5. **Compatibilidad**: Funciona con React Router v7 y Material-UI v7

## Troubleshooting

### El diálogo no aparece
- Verificar que `blocker.state === 'blocked'`
- Asegurar que `hasUnsavedChanges` sea `true`
- Verificar que no esté `disabled: true`

### El diálogo aparece cuando no debería
- Revisar la lógica de comparación en `useFormChanges`
- Agregar campos a `ignoreFields` si es necesario
- Verificar que el estado inicial se actualice correctamente

### La navegación no se bloquea
- Asegurar que el hook esté en el componente de la página (no en un hijo)
- Verificar que React Router esté configurado correctamente
- Revisar que `useBlocker` esté disponible (React Router v6.4+)

## Soporte

Para dudas o problemas, revisar:
- Código de ejemplo en `FichaPage.tsx`
- Documentación del hook en `useUnsavedChanges.ts`
- Tests (si están disponibles)
