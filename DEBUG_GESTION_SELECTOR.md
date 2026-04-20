# Debug: Gestión Selector - Ocultar "Controles y Planes de Acción"

## Objetivo
Cuando se selecciona "Gestión Estratégica" en el selector de gestiones del Dashboard del Supervisor, el menú lateral debe ocultar automáticamente la opción "Controles y Planes de Acción".

## Cambios Realizados

### 1. Eliminado componente innecesario
- **Archivo eliminado**: `src/components/layout/GestionSelector.tsx`
- **Razón**: Este componente fue creado pero nunca se usó.

### 2. Creado selector de gestiones en DashboardFiltros
- **Archivo modificado**: `src/components/dashboard/DashboardFiltros.tsx`
- **Cambios**:
  - Agregada prop `mostrarSelectorGestion` para habilitar el selector
  - Integrado con `GestionContext` para manejar el estado
  - El selector muestra todas las gestiones disponibles con sus colores
  - Al seleccionar una gestión, se actualiza el contexto global

### 3. Habilitado selector en DashboardSupervisorPage
- **Archivo modificado**: `src/pages/supervision/DashboardSupervisorPage.tsx`
- **Cambios**:
  - Agregada prop `mostrarSelectorGestion={true}` al componente `DashboardFiltros`
  - Ahora el dashboard del supervisor muestra el selector de gestiones

### 4. Removido hook automático
- **Archivo modificado**: `src/components/layout/MainLayout.tsx`
- **Cambios**:
  - Eliminado `useSyncProcesoToGestion()` que intentaba sincronizar automáticamente
  - Ahora el usuario selecciona manualmente la gestión desde el selector

### 5. Mejorado logging
- **Archivos modificados**: 
  - `src/contexts/GestionContext.tsx` - Logs detallados del estado
  - `src/components/layout/MainLayout.tsx` - Logs del filtrado de menú
  - `src/components/dashboard/DashboardFiltros.tsx` - Log al seleccionar gestión

## Cómo Usar

### Paso 1: Ir al Dashboard del Supervisor
Navega a la página del Dashboard (como Supervisor de Riesgos)

### Paso 2: Buscar el selector de Gestión
En la sección "Filtros del Dashboard", verás un nuevo selector llamado "Gestión" (primer selector a la izquierda)

### Paso 3: Seleccionar "Gestión Estratégica"
Haz clic en el selector y elige "Gestión Estratégica" de la lista

### Paso 4: Verificar el menú lateral
El item "Controles y Planes de Acción" debe desaparecer del menú lateral

## Verificar en la Consola

Abre la consola del navegador (F12) y deberías ver:

```
[DashboardFiltros] Gestión seleccionada: estrategica

[GestionContext] ========================================
[GestionContext] gestionSeleccionada: estrategica
[GestionContext] Config: {label: "Gestión Estratégica", color: "#d32f2f", ...}
[GestionContext] ocultarItems: ["Controles y Planes de Acción"]
[GestionContext] debeOcultarControlesYPlanes: true
[GestionContext] ========================================

[MainLayout] Evaluando item: Controles y Planes de Acción
[MainLayout] debeOcultarControlesYPlanes: true
[MainLayout] ✓ Ocultando "Controles y Planes de Acción" por gestión estratégica
```

## Gestiones Disponibles

El selector mostrará las siguientes gestiones (según los procesos disponibles):

- **Gestión de Riesgos** (azul) - Procesos operacionales
- **Gestión Estratégica** (rojo) - Procesos estratégicos - OCULTA "Controles y Planes de Acción"
- **Gestión Comercial** (naranja) - Procesos comerciales
- **Gestión de Talento Humano** (rosa) - Procesos de talento
- **Gestión de Tesorería** (verde) - Procesos de tesorería
- **Gestión Financiera** (morado) - Procesos financieros
- **Gestión Administrativa** (cyan) - Procesos administrativos
- **Gestión de Nómina** (púrpura) - Procesos de nómina

## Persistencia

La gestión seleccionada se guarda en `localStorage`, por lo que se mantendrá al recargar la página.

## Solución de Problemas

### Problema 1: No veo el selector de Gestión
**Causa**: Estás en una página diferente al Dashboard del Supervisor
**Solución**: Navega al Dashboard del Supervisor

### Problema 2: El selector está vacío
**Causa**: No hay procesos asignados o no hay procesos de diferentes tipos
**Solución**: Verifica que tengas procesos asignados con diferentes tipos

### Problema 3: El menú no se oculta
**Causa**: El contexto no se está actualizando
**Solución**: 
1. Abre la consola y verifica los logs
2. Asegúrate de ver `debeOcultarControlesYPlanes: true`
3. Si es `false`, el problema está en el contexto
