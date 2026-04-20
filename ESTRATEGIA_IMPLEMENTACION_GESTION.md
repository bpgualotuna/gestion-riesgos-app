# Estrategia de Implementación: Selector de Gestión Integrado

## 1. DESCUBRIMIENTOS CLAVE

### 1.1 Clasificación de Procesos
Los procesos se clasifican por `tipoProceso` que contiene valores como:
- "estratégico" / "estrategia"
- "operacional" / "operativo" / "operacion"
- "comercial"
- "talento humano"
- "tesorería"
- "financiera"
- etc.

**Ubicación**: Campo `proceso.tipoProceso` devuelto por el backend

### 1.2 Filtrado Actual
En `DashboardSupervisorPage.tsx` se ve cómo se filtran procesos:
```typescript
const tipoProceso = (proceso?.tipoProceso || '').toLowerCase();
if (tipoProceso.includes('estratégico') || tipoProceso.includes('estrategico')) {
  porTipoProceso['01 Estratégico']++;
}
```

### 1.3 Concepto de "Gestión"
El término "Gestión" en el contexto del selector se refiere a:
- **Gestión de Riesgos**: Vista operativa completa (todos los procesos)
- **Gestión Estratégica**: Vista filtrada a procesos estratégicos
- **Gestión Comercial**: Vista filtrada a procesos comerciales
- etc.

**NO es lo mismo que**:
- `tipoGestion` en causas (CONTROL, PLAN, AMBOS)
- Roles o permisos del usuario
- Asignaciones de procesos

## 2. PROBLEMA CON LA IMPLEMENTACIÓN ACTUAL

El selector que se creó tiene varios problemas:

1. **Aparece para todos**: Debería aparecer solo para usuarios operativos
2. **No filtra datos**: Solo oculta el menú, pero no filtra procesos en las páginas
3. **No valida acceso**: No verifica si el usuario tiene procesos en esa gestión
4. **No integra con ProcesoContext**: El proceso seleccionado no se valida contra la gestión
5. **No persiste correctamente**: No considera el usuario actual

## 3. SOLUCIÓN PROPUESTA

### 3.1 Arquitectura

```
GestionContext (mejorado)
├── gestionSeleccionada: TipoGestion
├── procesosDisponibles: Proceso[] (filtrados por gestión)
├── debeOcultarControlesYPlanes: boolean
├── validarAccesoAPagina(): boolean
└── filtrarProcesosPorGestion(): Proceso[]

GestionSelector (mejorado)
├── Mostrar solo si es usuario operativo
├── Mostrar solo gestiones con procesos disponibles
├── Validar que tiene procesos en esa gestión
└── Mostrar mensaje si no hay procesos

MainLayout (actualizado)
├── Usar GestionContext para filtrar menú
├── Validar acceso a páginas según gestión
└── Mostrar alerta si no hay procesos en gestión

Páginas (actualizadas)
├── Usar useProcesosVisibles() + filtro de gestión
├── Validar que proceso seleccionado pertenece a gestión
└── Mostrar mensaje si no hay procesos
```

### 3.2 Flujo de Datos

```
1. Usuario selecciona gestión en GestionSelector
   ↓
2. GestionContext actualiza gestionSeleccionada
   ↓
3. GestionContext filtra procesos por tipoProceso
   ↓
4. MainLayout oculta/muestra items del menú
   ↓
5. Páginas filtran procesos según gestión
   ↓
6. Si proceso seleccionado no pertenece a gestión:
   - Mostrar alerta
   - Limpiar selección
   - Mostrar lista de procesos disponibles
```

### 3.3 Reglas de Visibilidad de Menú

**Gestión de Riesgos** (por defecto):
- Mostrar: Dashboard, Procesos, Identificación, Controles, Planes, Materializar, Historial
- Procesos: Todos los asignados

**Gestión Estratégica**:
- Mostrar: Dashboard, Procesos, Identificación, Planes, Historial
- Ocultar: Controles, Materializar
- Procesos: Solo estratégicos
- Permisos: Solo lectura

**Gestión Comercial**:
- Mostrar: Todos
- Procesos: Solo comerciales
- Permisos: Según rol

**Otras Gestiones**:
- Mostrar: Todos
- Procesos: Filtrados por tipo
- Permisos: Según rol

## 4. IMPLEMENTACIÓN PASO A PASO

### Fase 1: Extender GestionContext

```typescript
interface GestionContextType {
  gestionSeleccionada: TipoGestion;
  setGestionSeleccionada: (gestion: TipoGestion) => void;
  
  // Procesos disponibles en la gestión actual
  procesosEnGestion: Proceso[];
  
  // Validaciones
  debeOcultarControlesYPlanes: boolean;
  debeOcultarMaterializarRiesgos: boolean;
  
  // Helpers
  esGestionEstrategica: boolean;
  esGestionComercial: boolean;
  
  // Métodos
  validarAccesoAPagina(pagina: string): boolean;
  filtrarProcesosPorGestion(procesos: Proceso[]): Proceso[];
  obtenerGestionesPorUsuario(): TipoGestion[];
}
```

### Fase 2: Actualizar GestionSelector

```typescript
// Solo mostrar para usuarios operativos
if (esAdmin || !user) return null;

// Obtener gestiones disponibles
const gestionesDisponibles = useGestion().obtenerGestionesPorUsuario();

// Si no hay gestiones: no mostrar selector
if (gestionesDisponibles.length === 0) return null;

// Mostrar solo gestiones con procesos
const gestionesConProcesos = gestionesDisponibles.filter(
  g => procesosEnGestion.length > 0
);
```

### Fase 3: Actualizar MainLayout

```typescript
// Filtrar menú según gestión
const menuFiltrado = menuItems.filter(item => {
  if (debeOcultarControlesYPlanes && item.text === 'Controles y Planes de Acción') {
    return false;
  }
  if (debeOcultarMaterializarRiesgos && item.text === 'Materializar Riesgos') {
    return false;
  }
  return true;
});
```

### Fase 4: Actualizar Páginas

```typescript
// En cada página que muestra procesos:
const { procesosVisibles } = useProcesosVisibles();
const { procesosEnGestion } = useGestion();

// Combinar filtros
const procesosFiltrados = procesosVisibles.filter(p => 
  procesosEnGestion.some(pg => pg.id === p.id)
);

// Validar proceso seleccionado
if (procesoSeleccionado && !procesosFiltrados.find(p => p.id === procesoSeleccionado.id)) {
  // Mostrar alerta y limpiar selección
  showWarning('El proceso seleccionado no pertenece a esta gestión');
  setProcesoSeleccionado(null);
}
```

## 5. MAPEO DE TIPOS DE PROCESO A GESTIONES

```typescript
const TIPO_PROCESO_A_GESTION: Record<string, TipoGestion> = {
  'estratégico': 'estrategica',
  'estrategico': 'estrategica',
  'estrategia': 'estrategica',
  'comercial': 'comercial',
  'operacional': 'riesgos',
  'operativo': 'riesgos',
  'operacion': 'riesgos',
  'talento humano': 'talento',
  'tesorería': 'tesoreria',
  'financiera': 'financiera',
  'administrativa': 'administrativa',
  'nómina': 'nomina',
};

function obtenerGestionDeProceso(proceso: Proceso): TipoGestion {
  const tipo = (proceso.tipoProceso || '').toLowerCase();
  for (const [key, value] of Object.entries(TIPO_PROCESO_A_GESTION)) {
    if (tipo.includes(key)) return value;
  }
  return 'riesgos'; // Por defecto
}
```

## 6. VALIDACIONES NECESARIAS

### 6.1 En GestionContext
- Validar que el usuario tiene procesos en la gestión seleccionada
- Si no hay procesos: mostrar mensaje y resetear a 'riesgos'
- Validar que la gestión es válida para el rol del usuario

### 6.2 En GestionSelector
- Mostrar solo gestiones con procesos disponibles
- Mostrar contador de procesos por gestión
- Mostrar alerta si no hay procesos en la gestión seleccionada

### 6.3 En MainLayout
- Validar que el proceso seleccionado pertenece a la gestión
- Si no: mostrar alerta y limpiar selección
- Mostrar mensaje si no hay procesos en la gestión

### 6.4 En Páginas
- Validar acceso a la página según gestión
- Filtrar procesos según gestión
- Mostrar mensaje si no hay procesos

## 7. CASOS DE USO

### Caso 1: Usuario Dueño de Procesos
1. Tiene procesos estratégicos y comerciales asignados
2. Selector muestra: "Gestión de Riesgos", "Gestión Estratégica", "Gestión Comercial"
3. Selecciona "Gestión Estratégica"
4. Menú oculta "Controles y Planes de Acción"
5. Selector de procesos muestra solo procesos estratégicos
6. Si intenta acceder a "Controles": muestra alerta

### Caso 2: Usuario Supervisor
1. Tiene procesos de varias áreas asignados
2. Selector muestra todas las gestiones disponibles
3. Selecciona "Gestión Comercial"
4. Menú muestra todos los items (supervisor siempre ve todo)
5. Selector de procesos muestra solo procesos comerciales
6. Acceso de solo lectura

### Caso 3: Usuario Admin
1. No ve selector de gestión
2. Ve todos los procesos
3. Menú completo
4. Acceso total

## 8. PREGUNTAS PENDIENTES

1. ¿Qué valores exactos devuelve `tipoProceso` del backend?
2. ¿Hay restricciones de acceso por gestión según el rol?
3. ¿Qué debe pasar si el usuario no tiene procesos en una gestión?
4. ¿Debe persistirse la gestión seleccionada por usuario?
5. ¿Hay permisos diferentes por gestión?

## 9. PRÓXIMOS PASOS

1. Investigar datos exactos del backend
2. Implementar GestionContext mejorado
3. Actualizar GestionSelector
4. Actualizar MainLayout
5. Actualizar páginas
6. Testing con diferentes roles y asignaciones
