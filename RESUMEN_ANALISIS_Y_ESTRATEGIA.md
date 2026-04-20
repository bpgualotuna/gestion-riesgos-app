# Resumen Ejecutivo: Análisis y Estrategia de Implementación

## SITUACIÓN ACTUAL

### El Problema
El selector de gestión que se creó inicialmente es demasiado simple y no funciona correctamente porque:

1. **No considera la complejidad del sistema**: El sistema tiene múltiples niveles de control (roles, permisos, asignaciones)
2. **Solo oculta el menú**: No filtra datos en las páginas
3. **No valida acceso**: No verifica si el usuario tiene procesos en esa gestión
4. **No integra con el contexto de procesos**: El proceso seleccionado no se valida contra la gestión

### La Complejidad del Sistema

El sistema actual tiene:
- **5 tipos de roles**: admin, dueño_procesos, gerente (con 2 modos), supervisor
- **2 modelos de asignación**: legacy (responsableId) y nuevo (responsablesList con modo)
- **Múltiples niveles de filtrado**: por rol, por asignación, por área, por proceso
- **Permisos granulares**: visualizar, editar, según rol y estado del proceso
- **Persistencia compleja**: localStorage scoped por usuario

## DESCUBRIMIENTOS

### 1. Clasificación de Procesos
Los procesos se clasifican por `tipoProceso` que contiene:
- "estratégico" → Gestión Estratégica
- "comercial" → Gestión Comercial
- "operacional" → Gestión de Riesgos (por defecto)
- "talento humano" → Gestión de Talento
- etc.

### 2. Concepto de "Gestión"
"Gestión" es una vista filtrada de procesos según su tipo:
- **Gestión de Riesgos**: Vista completa (todos los procesos)
- **Gestión Estratégica**: Solo procesos estratégicos, menú limitado
- **Gestión Comercial**: Solo procesos comerciales
- etc.

### 3. Integración Necesaria
El selector debe integrarse con:
- **AuthContext**: Para validar rol y permisos
- **ProcesoContext**: Para validar proceso seleccionado
- **useProcesosVisibles()**: Para obtener procesos del usuario
- **MainLayout**: Para filtrar menú
- **Páginas**: Para filtrar datos

## ESTRATEGIA DE IMPLEMENTACIÓN

### Fase 1: Extender GestionContext (CRÍTICA)
El context debe:
- Obtener procesos del usuario usando `useProcesosVisibles()`
- Filtrar procesos por `tipoProceso`
- Calcular qué items del menú ocultar
- Validar acceso a páginas
- Persistir por usuario

### Fase 2: Mejorar GestionSelector
- Mostrar solo para usuarios operativos (no admin)
- Mostrar solo gestiones con procesos disponibles
- Mostrar contador de procesos
- Validar que tiene procesos en la gestión

### Fase 3: Actualizar MainLayout
- Usar GestionContext para filtrar menú
- Validar proceso seleccionado contra gestión
- Mostrar alerta si no hay procesos

### Fase 4: Actualizar Páginas
- Combinar filtros: `useProcesosVisibles()` + gestión
- Validar proceso seleccionado
- Mostrar mensaje si no hay procesos

## REGLAS DE VISIBILIDAD DE MENÚ

| Gestión | Dashboard | Procesos | Identificación | Controles | Planes | Materializar | Historial |
|---------|-----------|----------|----------------|-----------|--------|--------------|-----------|
| Riesgos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Estratégica | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ |
| Comercial | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Otras | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## FLUJO DE DATOS

```
Usuario selecciona gestión
    ↓
GestionContext filtra procesos por tipoProceso
    ↓
MainLayout oculta/muestra items del menú
    ↓
Páginas filtran procesos según gestión
    ↓
Si proceso no pertenece a gestión:
  - Mostrar alerta
  - Limpiar selección
  - Mostrar procesos disponibles
```

## CASOS DE USO

### Caso 1: Dueño de Procesos con Múltiples Gestiones
- Tiene procesos estratégicos y comerciales
- Selector muestra 3 opciones: Riesgos, Estratégica, Comercial
- Selecciona Estratégica
- Menú oculta Controles y Materializar
- Selector de procesos muestra solo estratégicos
- Si intenta acceder a Controles: alerta

### Caso 2: Supervisor de Riesgos
- Tiene procesos de varias áreas
- Selector muestra todas las gestiones
- Selecciona Comercial
- Menú muestra todos (supervisor ve todo)
- Selector de procesos muestra solo comerciales
- Acceso de solo lectura

### Caso 3: Admin
- No ve selector
- Ve todos los procesos
- Menú completo
- Acceso total

## PRÓXIMOS PASOS RECOMENDADOS

### Inmediato (Hoy)
1. ✓ Análisis completado
2. ✓ Estrategia definida
3. Investigar datos exactos del backend (¿qué valores tiene tipoProceso?)

### Corto Plazo (Esta semana)
1. Implementar GestionContext mejorado
2. Actualizar GestionSelector
3. Actualizar MainLayout
4. Testing básico

### Mediano Plazo (Próximas semanas)
1. Actualizar páginas para filtrar datos
2. Validar acceso a páginas
3. Testing exhaustivo con diferentes roles
4. Documentación

## ARCHIVOS GENERADOS

1. **ANALISIS_SISTEMA_COMPLEJO.md**: Análisis profundo del sistema
2. **ESTRATEGIA_IMPLEMENTACION_GESTION.md**: Estrategia detallada
3. **RESUMEN_ANALISIS_Y_ESTRATEGIA.md**: Este documento

## RECOMENDACIÓN

**NO continuar con la implementación actual**. El selector que se creó es demasiado simple y no funcionará correctamente.

**RECOMENDACIÓN**: Implementar la estrategia propuesta en fases, empezando por extender GestionContext para que considere:
- Roles y permisos del usuario
- Procesos asignados al usuario
- Filtrado por tipoProceso
- Validación de acceso

Esto requiere más trabajo inicial pero resultará en una solución robusta y mantenible.

## PREGUNTAS PARA EL BACKEND

Antes de continuar, necesitamos confirmar:

1. ¿Qué valores exactos devuelve `tipoProceso`?
   - Ejemplo: "Estratégico", "estratégico", "01 Estratégico"?
   
2. ¿Hay restricciones de acceso por gestión según el rol?
   - ¿El admin ve todas las gestiones?
   - ¿El supervisor ve todas las gestiones?
   
3. ¿Qué debe pasar si el usuario no tiene procesos en una gestión?
   - ¿Mostrar mensaje?
   - ¿Resetear a gestión por defecto?
   
4. ¿Hay permisos diferentes por gestión?
   - ¿Gestión Estratégica siempre es solo lectura?
   - ¿Hay otras restricciones?

5. ¿Cómo se determina si un proceso es "estratégico"?
   - ¿Solo por tipoProceso?
   - ¿Hay otros campos?
