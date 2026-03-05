# 🚀 Inicio Rápido: Sistema de Cambios No Guardados

## ¿Qué es esto?

Un sistema que **advierte al usuario cuando intenta navegar con cambios sin guardar** en formularios. Evita pérdida accidental de datos.

## ✅ Ya Implementado en:

1. **FichaPage** - Información del proceso
2. **ContextoExternoPage** - Análisis externo
3. **ContextoInternoPage** - Análisis interno

## 🎯 Cómo Implementar en una Nueva Página (5 minutos)

### Paso 1: Importar (2 líneas)

```typescript
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
```

### Paso 2: Agregar Estados (3 líneas)

```typescript
const [initialFormData, setInitialFormData] = useState(formData);
const [isSaving, setIsSaving] = useState(false);
const hasFormChanges = useFormChanges(initialFormData, formData);
```

### Paso 3: Configurar Hook (4 líneas)

```typescript
const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
  hasUnsavedChanges: hasFormChanges && !isReadOnly,
  disabled: isReadOnly,
});
```

### Paso 4: Actualizar handleSave (3 líneas)

```typescript
const handleSave = async () => {
  setIsSaving(true);
  await tuFuncionDeGuardado();
  setInitialFormData(formData); // ← Agregar esta línea
  markAsSaved(); // ← Agregar esta línea
  setIsSaving(false);
};
```

### Paso 5: Crear Handlers (8 líneas)

```typescript
const handleSaveFromDialog = async () => {
  await handleSave();
  if (!isSaving) forceNavigate();
};

const handleDiscardChanges = () => {
  setFormData(initialFormData);
  forceNavigate();
};
```

### Paso 6: Agregar Diálogo al JSX (10 líneas)

```typescript
return (
  <>
    <UnsavedChangesDialog
      open={blocker.state === 'blocked'}
      onSave={handleSaveFromDialog}
      onDiscard={handleDiscardChanges}
      onCancel={() => blocker.reset?.()}
      isSaving={isSaving}
    />
    {/* Tu contenido existente */}
  </>
);
```

### Paso 7: Actualizar useEffect (1 línea)

```typescript
useEffect(() => {
  // Tu lógica de carga existente
  const newData = {...};
  setFormData(newData);
  setInitialFormData(newData); // ← Agregar esta línea
}, [dependencias]);
```

### Paso 8: Actualizar Botón Guardar (opcional)

```typescript
<Button
  onClick={handleSave}
  disabled={isSaving || !hasFormChanges} // ← Agregar !hasFormChanges
>
  {isSaving ? 'Guardando...' : 'Guardar'}
</Button>
```

## ✅ Listo!

Ahora tu página detecta cambios no guardados automáticamente.

## 🧪 Cómo Probar

1. Edita un campo
2. Intenta navegar a otra página
3. Debe aparecer el diálogo
4. Prueba las 3 opciones: Guardar, Descartar, Cancelar

## 📖 Documentación Completa

- **Guía detallada:** `GUIA_CAMBIOS_NO_GUARDADOS.md`
- **Ejemplo completo:** `src/pages/ficha/FichaPage.tsx`
- **Resumen técnico:** `RESUMEN_IMPLEMENTACION_CAMBIOS_NO_GUARDADOS.md`

## 🆘 Problemas Comunes

### El diálogo no aparece
- Verifica que `hasUnsavedChanges` sea `true`
- Verifica que `disabled` no sea `true`
- Verifica que `blocker.state === 'blocked'`

### El diálogo aparece cuando no debería
- Agrega campos a `ignoreFields` en `useFormChanges`
- Verifica que `initialFormData` se actualice correctamente

### El botón guardar no se deshabilita
- Agrega `disabled={isSaving || !hasFormChanges}` al botón

## 💡 Tips

1. **Siempre** actualiza `initialFormData` después de guardar
2. **Siempre** llama `markAsSaved()` después de guardar
3. **Ignora** campos de solo lectura con `ignoreFields`
4. **Deshabilita** en modo solo lectura con `disabled: isReadOnly`

## 📋 Checklist

- [ ] Imports agregados
- [ ] Estados creados
- [ ] Hook configurado
- [ ] handleSave actualizado
- [ ] Handlers creados
- [ ] Diálogo agregado
- [ ] useEffect actualizado
- [ ] Botón actualizado
- [ ] Probado manualmente

## 🎉 ¡Eso es todo!

En menos de 5 minutos tienes protección contra pérdida de datos.

---

**¿Dudas?** Revisa `GUIA_CAMBIOS_NO_GUARDADOS.md` o el código de `FichaPage.tsx`
