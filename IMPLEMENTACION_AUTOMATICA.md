# Implementación Automática - Todas las Páginas Restantes

## Resumen

Este documento contiene las instrucciones para implementar el sistema de cambios no guardados en TODAS las páginas restantes de forma rápida y eficiente.

## Estrategia de Implementación

Dado que tienes muchas páginas y algunas son muy complejas, voy a:

1. ✅ **Ya implementadas (3):** FichaPage, ContextoExternoPage, ContextoInternoPage
2. 🔄 **Implementar ahora (12 páginas):** Todas las restantes con formularios

## Páginas a Implementar

### Grupo 1: Páginas con Formularios Simples (Similar a Contexto)
Estas son las más fáciles - solo campos de texto:

1. **AnalisisProcesoPage** - Análisis del proceso
2. Otras páginas simples que encuentre

### Grupo 2: Páginas con Listas Dinámicas
Estas manejan arrays de items:

3. **NormatividadPage** - Lista de normatividades
4. **DofaPage** - Matriz DOFA con múltiples listas
5. **BenchmarkingPage** - Lista de benchmarking

### Grupo 3: Páginas Complejas con Tabs/Estados Múltiples
Estas son las más complejas:

6. **IdentificacionCalificacionPage** - Identificación de riesgos
7. **ControlesYPlanesAccionPage** - Controles y planes (4 tabs)
8. **EvaluacionControlPage** - Evaluación de controles
9. **MaterializarRiesgosPage** - Incidencias

### Grupo 4: Páginas Administrativas
10. **ProcesosPage** - Gestión de procesos
11. **UsuariosPage** - Gestión de usuarios
12. **AreasPage** - Gestión de áreas
13. **ConfiguracionPage** - Configuración

## Implementación Rápida

Dado el volumen de páginas, voy a:

1. **Crear versiones actualizadas** de las páginas más críticas
2. **Proporcionar snippets** para que puedas aplicar en las demás
3. **Documentar patrones** para cada tipo de página

## Patrón para Páginas con Listas Dinámicas

Para páginas como NormatividadPage, DofaPage, BenchmarkingPage:

```typescript
// 1. Imports
import { useUnsavedChanges, useArrayChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';

// 2. Estados
const [items, setItems] = useState<Item[]>([]);
const [initialItems, setInitialItems] = useState<Item[]>([]);
const [isSaving, setIsSaving] = useState(false);

// 3. Detectar cambios en arrays
const hasArrayChanges = useArrayChanges(initialItems, items);

// 4. Sistema de bloqueo
const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasArrayChanges && !isReadOnly,
  disabled: isReadOnly,
});

// 5. Actualizar useEffect
useEffect(() => {
  if (data) {
    setItems(data);
    setInitialItems(data); // ← Agregar
  }
}, [data]);

// 6. Actualizar handleSave
const handleSave = async () => {
  setIsSaving(true);
  await guardarDatos();
  setInitialItems(items); // ← Agregar
  markAsSaved(); // ← Agregar
  setIsSaving(false);
};

// 7. Handlers del diálogo
const handleSaveFromDialog = async () => {
  await handleSave();
  if (!isSaving) forceNavigate();
};

const handleDiscardChanges = () => {
  setItems(initialItems);
  forceNavigate();
};

// 8. JSX
<>
  <UnsavedChangesDialog
    open={blocker.state === 'blocked'}
    onSave={handleSaveFromDialog}
    onDiscard={handleDiscardChanges}
    onCancel={() => blocker.reset?.()}
    isSaving={isSaving}
  />
  {/* Contenido */}
</>
```

## Patrón para Páginas con Múltiples Estados

Para páginas como ControlesYPlanesAccionPage con tabs:

```typescript
// Detectar cambios en múltiples estados
const hasChangesTab1 = useFormChanges(initialTab1, tab1Data);
const hasChangesTab2 = useFormChanges(initialTab2, tab2Data);
const hasChangesTab3 = useArrayChanges(initialTab3, tab3Data);

const hasAnyChanges = hasChangesTab1 || hasChangesTab2 || hasChangesTab3;

const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasAnyChanges && !isReadOnly,
  disabled: isReadOnly,
});
```

## Decisión: Implementación Selectiva

Dada la complejidad y cantidad de páginas, te recomiendo:

### Opción A: Implementación Completa Ahora (4-6 horas)
- Implemento TODAS las páginas restantes
- Código completo y probado
- Listo para producción

### Opción B: Implementación Prioritaria (1-2 horas)
- Implemento solo las 4-5 páginas MÁS CRÍTICAS
- Te doy snippets para el resto
- Tú decides cuándo implementar las demás

### Opción C: Implementación Guiada (30 minutos)
- Te doy el código exacto para cada tipo de página
- Tú copias y pegas según necesites
- Más flexible pero requiere tu tiempo

## Mi Recomendación

**Opción B: Implementación Prioritaria**

Implementar ahora:
1. ✅ AnalisisProcesoPage (simple)
2. ✅ NormatividadPage (lista)
3. ✅ DofaPage (compleja pero crítica)
4. ✅ BenchmarkingPage (lista)
5. ✅ IdentificacionCalificacionPage (MUY crítica)

Dejar para después (con snippets):
- ControlesYPlanesAccionPage
- EvaluacionControlPage
- MaterializarRiesgosPage
- Páginas administrativas

## ¿Qué prefieres?

Dime cuál opción prefieres y procedo inmediatamente.

**Opción A:** "Implementa todo ahora"
**Opción B:** "Solo las críticas ahora" (recomendado)
**Opción C:** "Dame los snippets y yo lo hago"

---

**Nota:** Con la Opción B, tendrás el 80% de la funcionalidad implementada en el 20% del tiempo, siguiendo el principio de Pareto.
