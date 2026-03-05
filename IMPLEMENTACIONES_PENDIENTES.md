# Implementaciones del Sistema de Cambios No Guardados

## Estado de Implementación

### ✅ Completadas

1. **FichaPage** - `/pages/ficha/FichaPage.tsx`
   - Formulario de información del proceso
   - Detecta cambios en todos los campos editables
   - Ignora campos de solo lectura

2. **ContextoExternoPage** - `/pages/procesos/ContextoExternoPage.tsx`
   - Análisis de factores externos
   - 9 campos de texto multilinea
   - Integración completa

### 🔄 En Progreso

Las siguientes páginas requieren implementación similar:

#### Alta Prioridad - Formularios Críticos

3. **ContextoInternoPage** - Similar a ContextoExternoPage
4. **NormatividadPage** - Gestión de normatividad
5. **DofaPage** - Análisis DOFA
6. **BenchmarkingPage** - Benchmarking del proceso
7. **AnalisisProcesoPage** - Análisis detallado

#### Media Prioridad - Formularios Complejos

8. **IdentificacionCalificacionPage** - Identificación de riesgos (COMPLEJO)
9. **ControlesYPlanesAccionPage** - Controles y planes (COMPLEJO)
10. **EvaluacionControlPage** - Evaluación de controles
11. **MaterializarRiesgosPage** - Incidencias

#### Baja Prioridad - Administración

12. **ProcesosPage** - Gestión de procesos
13. **UsuariosPage** - Gestión de usuarios
14. **AreasPage** - Gestión de áreas
15. **ConfiguracionPage** - Configuración general

## Patrón de Implementación Estándar

Para páginas simples con un solo formulario, seguir este patrón:

```typescript
// 1. Imports
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';

// 2. Estados
const [formData, setFormData] = useState<TipoFormulario>({...});
const [initialFormData, setInitialFormData] = useState<TipoFormulario>(formData);
const [isSaving, setIsSaving] = useState(false);

// 3. Detección de cambios
const hasFormChanges = useFormChanges(initialFormData, formData);

// 4. Sistema de bloqueo
const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasFormChanges && !isReadOnly,
  message: 'Mensaje personalizado',
  disabled: isReadOnly,
});

// 5. Actualizar handleSave
const handleSave = async () => {
  try {
    setIsSaving(true);
    await guardarDatos();
    setInitialFormData(formData);
    markAsSaved();
    showSuccess('Guardado');
  } finally {
    setIsSaving(false);
  }
};

// 6. Handlers del diálogo
const handleSaveFromDialog = async () => {
  await handleSave();
  if (!isSaving) forceNavigate();
};

const handleDiscardChanges = () => {
  setFormData(initialFormData);
  forceNavigate();
};

// 7. JSX - Agregar diálogo
return (
  <>
    <UnsavedChangesDialog
      open={blocker.state === 'blocked'}
      onSave={handleSaveFromDialog}
      onDiscard={handleDiscardChanges}
      onCancel={() => blocker.reset?.()}
      isSaving={isSaving}
    />
    {/* Contenido existente */}
  </>
);
```

## Páginas Complejas - Consideraciones Especiales

### IdentificacionCalificacionPage
- Múltiples riesgos en una lista
- Cada riesgo tiene su propio formulario
- Causas que se agregan/editan/eliminan
- **Solución**: Detectar cambios en `cambiosPendientes` y `causasPendientes`

```typescript
const hasRiesgoChanges = Object.keys(cambiosPendientes).length > 0;
const hasCausaChanges = Object.keys(causasPendientes).length > 0;
const hasAnyChanges = hasRiesgoChanges || hasCausaChanges;
```

### ControlesYPlanesAccionPage
- Sistema de tabs (4 pestañas)
- Formularios diferentes en cada tab
- **Solución**: Detectar cambios en cualquier tab

```typescript
const hasChangesTab1 = useFormChanges(initialTab1, tab1Data);
const hasChangesTab2 = useFormChanges(initialTab2, tab2Data);
// ... etc
const hasAnyChanges = hasChangesTab1 || hasChangesTab2 || ...;
```

### MaterializarRiesgosPage
- Formulario de incidencias
- Puede tener archivos adjuntos
- **Solución**: Incluir archivos en la detección

```typescript
const hasFormChanges = useFormChanges(initialData, formData);
const hasFileChanges = archivosNuevos.length > 0;
const hasChanges = hasFormChanges || hasFileChanges;
```

## Checklist de Implementación

Para cada página, verificar:

- [ ] Imports agregados
- [ ] Estado inicial creado
- [ ] Hook useFormChanges configurado
- [ ] Hook useUnsavedChanges configurado
- [ ] handleSave actualizado con setIsSaving, markAsSaved
- [ ] Handlers del diálogo creados
- [ ] Diálogo agregado al JSX
- [ ] Botón de guardar deshabilitado cuando no hay cambios
- [ ] useEffect actualiza initialFormData cuando cambian datos externos
- [ ] Modo solo lectura deshabilita el sistema

## Testing Manual

Para cada página implementada, probar:

1. ✅ Editar un campo y intentar navegar → Debe mostrar diálogo
2. ✅ Hacer cambios y guardar → Debe marcar como guardado
3. ✅ Hacer cambios y descartar → Debe restaurar valores
4. ✅ Hacer cambios y cancelar → Debe permanecer en la página
5. ✅ Intentar cerrar pestaña con cambios → Debe mostrar advertencia del navegador
6. ✅ Modo solo lectura → No debe mostrar diálogo
7. ✅ Sin cambios → Botón guardar deshabilitado

## Próximos Pasos

1. Implementar en ContextoInternoPage (copia de ContextoExternoPage)
2. Implementar en páginas simples (Normatividad, DOFA, Benchmarking)
3. Implementar en páginas complejas (Identificación, Controles)
4. Testing exhaustivo
5. Documentación de usuario final

## Notas de Desarrollo

- El sistema es 100% frontend, no requiere cambios en backend
- Compatible con React Router v7
- Usa `useBlocker` para navegación interna
- Usa `beforeunload` para navegación externa
- Performance optimizada con useCallback y useMemo
