# Análisis Profundo del Sistema de Gestión de Riesgos

## 1. ARQUITECTURA ACTUAL

### 1.1 Sistema de Roles y Permisos

El sistema tiene una arquitectura compleja con múltiples niveles de control:

```
ROLES PRINCIPALES:
├── admin (ámbito: SISTEMA)
│   └── Acceso total a panel de administración
├── dueño_procesos (ámbito: OPERATIVO)
│   └── Gestiona procesos asignados
├── gerente/gerente_general/manager (ámbito: OPERATIVO)
│   ├── Modo: 'dueño' → Actúa como dueño_procesos
│   └── Modo: 'supervisor' → Actúa como supervisor
├── supervisor (ámbito: OPERATIVO)
│   └── Supervisa riesgos y procesos
└── Otros roles
```

### 1.2 Sistema de Asignaciones

**Modelo Dual:**
- **Legacy**: `responsableId` (un responsable por proceso)
- **Nuevo**: `responsablesList` (múltiples responsables con modo)

```typescript
responsablesList: [
  { id: 1, nombre: "Juan", role: "dueño_procesos", modo: "proceso" },
  { id: 2, nombre: "María", role: "supervisor", modo: "director" }
]
```

### 1.3 Visibilidad de Procesos por Rol

| Rol | Condición | Modo | Acceso |
|-----|-----------|------|--------|
| Admin | Todos | - | Total |
| Gerente Director | `responsablesList.modo === 'director'` | Visualizar | Lectura |
| Gerente Dueño | `responsablesList.modo === 'proceso'` | Editar | Lectura/Escritura |
| Supervisor | `directorId === userId` OR en `responsablesList` | Visualizar | Lectura |
| Dueño Procesos | En `responsablesList` OR `responsableId` | Editar | Lectura/Escritura |

### 1.4 Visibilidad de Menú Actual

**Admin**: Solo ve opciones de administración
**Otros**: Ven menú operativo completo con filtrado por rol

```
Dashboard
├── Estadísticas
└── Mapa de Riesgo
Procesos
├── Ficha del Proceso
├── Análisis de Proceso
├── Normatividad
├── Contexto Interno
├── Contexto Externo
└── DOFA
Identificación y Calificación
Controles y Planes de Acción  ← DEBE OCULTARSE EN GESTIÓN ESTRATÉGICA
Gestión de Planes
Materializar Riesgos
Historial
```

## 2. PROBLEMA CON LA IMPLEMENTACIÓN ACTUAL

El selector de gestión que se creó es demasiado simple porque:

1. **No considera roles**: El selector aparece para todos, pero debería estar disponible solo para ciertos roles
2. **No valida permisos**: No verifica si el usuario tiene permiso para ver esa gestión
3. **No integra con asignaciones**: No considera qué procesos tiene asignados el usuario
4. **No persiste por usuario**: La gestión se guarda globalmente, no por usuario
5. **No afecta a datos**: Solo oculta el menú, pero no filtra datos en las páginas

## 3. REQUISITOS PARA UNA IMPLEMENTACIÓN CORRECTA

### 3.1 Requisitos Funcionales

1. **Selector de Gestión**:
   - Debe aparecer solo para usuarios operativos (no admin)
   - Debe mostrar solo gestiones para las que el usuario tiene procesos asignados
   - Debe persistir la selección por usuario

2. **Filtrado de Menú**:
   - Cuando se selecciona "Gestión Estratégica": ocultar "Controles y Planes de Acción"
   - Cuando se selecciona "Gestión Comercial": mostrar todos los items
   - Cuando se selecciona "Gestión de Riesgos": mostrar todos los items

3. **Filtrado de Datos**:
   - Las páginas deben filtrar procesos según la gestión seleccionada
   - Los riesgos deben filtrarse según la gestión del proceso
   - Los controles deben filtrarse según la gestión del proceso

4. **Validación de Acceso**:
   - Si el usuario no tiene procesos en esa gestión: mostrar mensaje
   - Si intenta acceder a una página no permitida: redirigir

### 3.2 Requisitos Técnicos

1. **Integración con AuthContext**:
   - Usar roles y permisos existentes
   - Validar acceso según rol

2. **Integración con ProcesoContext**:
   - Filtrar procesos según gestión seleccionada
   - Validar que el proceso seleccionado pertenece a la gestión

3. **Integración con Asignaciones**:
   - Usar `useProcesosVisibles()` para obtener procesos del usuario
   - Filtrar por tipo de gestión

4. **Persistencia**:
   - Guardar en localStorage con clave scoped por usuario
   - Restaurar al montar la app

## 4. TIPOS DE GESTIÓN Y SUS CARACTERÍSTICAS

### 4.1 Gestión de Riesgos (por defecto)
- **Descripción**: Gestión operativa de riesgos
- **Items visibles**: Todos
- **Procesos**: Todos los asignados
- **Permisos**: Según rol

### 4.2 Gestión Estratégica
- **Descripción**: Gestión a nivel estratégico
- **Items visibles**: Dashboard, Procesos, Identificación, Gestión de Planes, Historial
- **Procesos**: Solo procesos de tipo "estratégico"
- **Permisos**: Solo lectura (visualizar)
- **Ocultar**: "Controles y Planes de Acción", "Materializar Riesgos"

### 4.3 Gestión Comercial
- **Descripción**: Gestión de procesos comerciales
- **Items visibles**: Todos
- **Procesos**: Solo procesos de tipo "comercial"
- **Permisos**: Según rol

### 4.4 Otras Gestiones
- Tesorería, Nómina, Administrativa, Talento, Financiera
- Cada una con su propio filtrado de procesos

## 5. MODELO DE DATOS NECESARIO

### 5.1 Extensión del Proceso

```typescript
interface Proceso {
  // ... campos existentes
  tipoProceso: string; // "estratégico", "comercial", "operativo", etc.
  tipoGestion: string; // "riesgos", "estrategica", "comercial", etc.
  // ... otros campos
}
```

### 5.2 Extensión del Usuario

```typescript
interface User {
  // ... campos existentes
  gestionesDisponibles?: string[]; // Gestiones a las que tiene acceso
  // ... otros campos
}
```

## 6. FLUJO DE IMPLEMENTACIÓN

### Fase 1: Análisis de Datos
1. Verificar qué datos devuelve el backend para `tipoProceso`
2. Verificar si existe información de gestión en los procesos
3. Determinar cómo se clasifican los procesos por gestión

### Fase 2: Extensión del Context
1. Extender `GestionContext` para considerar roles y asignaciones
2. Agregar validación de permisos
3. Agregar filtrado de procesos por gestión

### Fase 3: Actualización del Selector
1. Mostrar solo gestiones disponibles para el usuario
2. Validar que tiene procesos en esa gestión
3. Mostrar mensaje si no hay procesos

### Fase 4: Filtrado de Menú
1. Actualizar lógica de filtrado en `MainLayout`
2. Considerar gestión seleccionada + rol + permisos

### Fase 5: Filtrado de Datos
1. Actualizar `useProcesosVisibles()` para filtrar por gestión
2. Actualizar páginas para usar el filtrado
3. Validar acceso a páginas según gestión

### Fase 6: Testing
1. Probar con diferentes roles
2. Probar con diferentes asignaciones
3. Probar cambio de gestión
4. Probar persistencia

## 7. PREGUNTAS CLAVE PARA EL BACKEND

1. ¿Qué valores tiene `tipoProceso`? (estratégico, comercial, operativo, etc.)
2. ¿Cómo se determina la gestión de un proceso?
3. ¿Hay restricciones de acceso por gestión según el rol?
4. ¿Qué procesos debe ver cada rol en cada gestión?
5. ¿Hay permisos diferentes por gestión?

## 8. PRÓXIMOS PASOS

1. **Investigar datos**: Verificar qué datos devuelve el backend
2. **Diseñar modelo**: Definir cómo se mapean gestiones a procesos
3. **Implementar Context**: Crear lógica compleja en GestionContext
4. **Actualizar Selector**: Mostrar solo gestiones disponibles
5. **Filtrar Menú**: Aplicar reglas de visibilidad
6. **Filtrar Datos**: Actualizar páginas para usar filtrado
7. **Testing**: Validar con diferentes escenarios
