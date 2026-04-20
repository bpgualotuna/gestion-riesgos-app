# Implementación: Selector de Gestión con Ocultamiento de Menú

## Descripción General
Se ha implementado un sistema para ocultar/mostrar elementos del menú lateral según la "Gestión" seleccionada en la barra superior. Cuando se selecciona "Gestión Estratégica", se oculta automáticamente el item "Controles y Planes de Acción" del menú lateral.

## Archivos Creados/Modificados

### 1. **Nuevo Context: `GestionContext.tsx`**
   - **Ubicación**: `src/contexts/GestionContext.tsx`
   - **Responsabilidad**: Gestiona el estado global de la "gestión" seleccionada
   - **Funcionalidades**:
     - Almacena la gestión seleccionada en localStorage
     - Proporciona el hook `useGestion()` para acceder al estado
     - Calcula automáticamente `debeOcultarControlesYPlanes` basado en la gestión seleccionada
   
   **Tipos de Gestión disponibles**:
   - `riesgos` - Gestión de Riesgos (por defecto)
   - `estrategica` - Gestión Estratégica
   - `comercial` - Gestión Comercial
   - `tesoreria` - Gestión de Tesorería
   - `nomina` - Gestión de Nómina
   - `administrativa` - Gestión Administrativa
   - `talento` - Gestión de Talento Humano
   - `financiera` - Gestión Financiera

### 2. **Nuevo Componente: `GestionSelector.tsx`**
   - **Ubicación**: `src/components/layout/GestionSelector.tsx`
   - **Responsabilidad**: Renderiza el dropdown menu en la barra superior
   - **Características**:
     - Botón con color dinámico según la gestión seleccionada
     - Menú desplegable con todas las opciones de gestión
     - Indicador visual (punto de color) para cada opción
     - Integración con el GestionContext

### 3. **Modificación: `App.tsx`**
   - Se agregó el `GestionProvider` como wrapper de la aplicación
   - Ubicación: Entre `CoraIAProvider` y `ErrorBoundary`

### 4. **Modificación: `MainLayout.tsx`**
   - Se importó el hook `useGestion`
   - Se importó el componente `GestionSelector`
   - Se agregó el filtro en el renderizado del menú lateral:
     ```typescript
     if (debeOcultarControlesYPlanes && item.text === 'Controles y Planes de Acción') {
       return false;
     }
     ```
   - Se agregó el `GestionSelector` en la barra superior (después del selector de Modo)

## Cómo Funciona

### Flujo de Datos:
1. Usuario hace clic en el botón "Gestión de Riesgos" en la barra superior
2. Se abre el menú desplegable con todas las opciones de gestión
3. Usuario selecciona una gestión (ej: "Gestión Estratégica")
4. El `GestionContext` actualiza el estado y lo persiste en localStorage
5. El `MainLayout` detecta el cambio y filtra el menú lateral
6. Si la gestión es "estrategica", se oculta "Controles y Planes de Acción"

### Persistencia:
- La gestión seleccionada se guarda en localStorage con la clave `gestionSeleccionada`
- Al recargar la página, se restaura la última gestión seleccionada

## Cómo Extender

### Para agregar más items que se oculten según la gestión:
1. Actualiza el `GestionContext.tsx` para agregar más lógica en el cálculo de visibilidad
2. Ejemplo:
   ```typescript
   const debeOcultarMaterializarRiesgos = gestionSeleccionada === 'estrategica';
   ```
3. Actualiza el filtro en `MainLayout.tsx`:
   ```typescript
   if (debeOcultarControlesYPlanes && item.text === 'Controles y Planes de Acción') {
     return false;
   }
   if (debeOcultarMaterializarRiesgos && item.text === 'Materializar Riesgos') {
     return false;
   }
   ```

### Para agregar más tipos de gestión:
1. Actualiza el array `GESTIONES` en `GestionSelector.tsx`
2. Actualiza el tipo `TipoGestion` en `GestionContext.tsx`
3. Agrega la lógica de visibilidad correspondiente en `GestionContext.tsx`

## Notas Técnicas

- El componente `GestionSelector` usa Material-UI (MUI) para mantener consistencia con el resto de la aplicación
- El estado se persiste en localStorage para mejorar la experiencia del usuario
- El filtrado del menú es reactivo: cualquier cambio en `gestionSeleccionada` actualiza automáticamente el menú
- El color del botón cambia dinámicamente según la gestión seleccionada

## Testing

Para verificar que funciona correctamente:
1. Abre la aplicación
2. Busca el botón "Gestión de Riesgos" en la barra superior (lado derecho, antes de las notificaciones)
3. Haz clic en el botón para abrir el menú desplegable
4. Selecciona "Gestión Estratégica"
5. Verifica que "Controles y Planes de Acción" desaparece del menú lateral
6. Selecciona "Gestión de Riesgos" nuevamente
7. Verifica que "Controles y Planes de Acción" reaparece en el menú lateral
