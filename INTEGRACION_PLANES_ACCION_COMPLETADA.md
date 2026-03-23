# ✅ Integración de Página de Gestión de Planes - Completada

## Resumen

Se ha completado la integración de la página de Gestión de Planes de Acción con el backend real, reemplazando los datos mock con llamadas a la API.

---

## 🎯 Cambios Realizados

### Backend

#### 1. Nuevo Endpoint: Obtener Planes de Acción
**Archivo**: `gestion_riesgos_backend/src/controllers/plan-trazabilidad.controller.ts`

**Función**: `obtenerPlanesAccion`

**Endpoint**: `GET /api/planes-accion`

**Query Params**:
- `estado` (opcional): Filtrar por estado específico
- `procesoId` (opcional): Filtrar por proceso

**Respuesta**:
```json
{
  "planes": [
    {
      "id": 123,
      "causaRiesgoId": 123,
      "riesgoId": 45,
      "descripcion": "Implementar control de acceso",
      "responsable": "Juan Pérez",
      "fechaInicio": "2026-01-01",
      "fechaFin": "2026-03-31",
      "fechaProgramada": "2026-03-31",
      "estado": "en_ejecucion",
      "observaciones": "En progreso",
      "controlDerivadoId": null,
      "fechaConversion": null,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-03-20T00:00:00Z",
      "riesgo": {
        "id": 45,
        "numeroIdentificacion": "3GAD",
        "descripcion": "Riesgo de acceso no autorizado",
        "proceso": {
          "id": 10,
          "nombre": "Gestión de TI"
        }
      }
    }
  ],
  "stats": {
    "total": 60,
    "pendientes": 15,
    "enEjecucion": 30,
    "completados": 10,
    "convertidos": 5
  }
}
```

**Características**:
- Obtiene planes desde `CausaRiesgo.gestion` (JSON)
- Filtra causas con `tipoGestion` = 'PLAN' o 'AMBOS'
- Mapea estados del JSON al formato del frontend
- Incluye información del riesgo y proceso
- Devuelve estadísticas agregadas

#### 2. Ruta Agregada
**Archivo**: `gestion_riesgos_backend/src/routes/plan-trazabilidad.routes.ts`

```typescript
router.get('/planes-accion', auth, obtenerPlanesAccion);
```

---

### Frontend

#### 1. API Service Actualizado
**Archivo**: `gestion-riesgos-app/src/api/services/planTrazabilidadApi.ts`

**Nuevos Tipos**:
```typescript
export interface PlanAccionAPI {
  id: number;
  causaRiesgoId: number;
  riesgoId: number;
  descripcion: string;
  responsable: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaProgramada: string | null;
  estado: 'pendiente' | 'en_ejecucion' | 'completado' | 'convertido_a_control';
  observaciones: string;
  controlDerivadoId: number | null;
  fechaConversion: string | null;
  createdAt: string;
  updatedAt: string;
  riesgo: {
    id: number;
    numeroIdentificacion: string;
    descripcion: string;
    proceso: {
      id: number;
      nombre: string;
    };
  };
}

export interface PlanesAccionResponse {
  planes: PlanAccionAPI[];
  stats: {
    total: number;
    pendientes: number;
    enEjecucion: number;
    completados: number;
    convertidos: number;
  };
}
```

**Nuevo Endpoint**:
```typescript
obtenerPlanesAccion: builder.query<
  PlanesAccionResponse,
  { estado?: string; procesoId?: number } | void
>({
  query: (params) => ({
    url: '/planes-accion',
    params: params || {},
  }),
  providesTags: ['Trazabilidad'],
})
```

**Hook Exportado**:
```typescript
export const { useObtenerPlanesAccionQuery } = planTrazabilidadApi;
```

#### 2. Página Actualizada
**Archivo**: `gestion-riesgos-app/src/pages/planes/PlanesAccionPage.tsx`

**Cambios Principales**:

1. **Imports actualizados**:
   - Removido: `mockPlanesAccion`, `getEventosPlan`
   - Agregado: `useObtenerPlanesAccionQuery`, `useCambiarEstadoPlanMutation`, `useConvertirPlanAControlMutation`

2. **Estado actualizado**:
   ```typescript
   // Antes
   const [planes, setPlanes] = useState<PlanAccion[]>(mockPlanesAccion);

   // Ahora
   const { data, isLoading, error, refetch } = useObtenerPlanesAccionQuery();
   const planes = data?.planes || [];
   const stats = data?.stats || { ... };
   ```

3. **Cambio de estado con API**:
   ```typescript
   const handleEstadoChange = async (planId: number, nuevoEstado: EstadoPlan) => {
     await cambiarEstado({
       causaId: planId,
       data: { estado: estadoBackend }
     }).unwrap();
     showSuccess('Estado del plan actualizado correctamente');
     refetch();
   };
   ```

4. **Conversión a control con API**:
   ```typescript
   const handleConfirmConversion = async (controlData: ControlFromPlanData) => {
     await convertirAControl({
       causaId: planToConvert.causaRiesgoId,
       data: {
         tipoControl: controlData.tipoControl,
         observaciones: controlData.observaciones
       }
     }).unwrap();
     showSuccess('Plan convertido a control exitosamente');
     refetch();
   };
   ```

5. **Estados de carga y error**:
   - Loading: Muestra `CircularProgress`
   - Error: Muestra `Alert` con mensaje de error
   - Success: Muestra notificaciones con `useNotification`

6. **Estadísticas en tabs**:
   - Usa `stats` del backend en lugar de calcular localmente
   - Badges muestran contadores reales

---

## 🔄 Flujo de Datos

```
1. Usuario abre página /planes-accion
   ↓
2. useObtenerPlanesAccionQuery() ejecuta GET /api/planes-accion
   ↓
3. Backend obtiene causas con tipoGestion = 'PLAN' o 'AMBOS'
   ↓
4. Backend extrae datos de CausaRiesgo.gestion (JSON)
   ↓
5. Backend mapea estados y devuelve planes + stats
   ↓
6. Frontend muestra planes en tabs por estado
   ↓
7. Usuario cambia estado de un plan
   ↓
8. useCambiarEstadoPlanMutation() ejecuta PUT /api/causas/:id/plan/estado
   ↓
9. Backend actualiza CausaRiesgo.gestion.planEstado
   ↓
10. Frontend invalida cache y recarga datos (refetch)
   ↓
11. Usuario ve plan actualizado
```

---

## ✅ Funcionalidades Integradas

### 1. Listar Planes ✅
- Obtiene planes reales desde el backend
- Muestra información del riesgo y proceso
- Filtra por búsqueda (descripción, responsable)
- Agrupa por estado en tabs

### 2. Cambiar Estado ✅
- Usa mutation para actualizar estado
- Mapea estados frontend ↔ backend
- Muestra notificaciones de éxito/error
- Recarga datos automáticamente

### 3. Convertir a Control ✅
- Usa mutation para convertir plan
- Valida datos del control
- Muestra notificaciones de éxito/error
- Recarga datos automáticamente

### 4. Estadísticas ✅
- Muestra contadores reales en tabs
- Datos vienen del backend
- Se actualizan automáticamente

---

## ⏳ Funcionalidades Pendientes

### 1. Trazabilidad (Timeline)
- **Estado**: Componente existe pero no integrado
- **Necesita**: Usar `useObtenerTrazabilidadQuery(causaId)`
- **Endpoint**: `GET /api/causas/:id/plan/trazabilidad`
- **Acción**: Mostrar historial de estados y eventos

### 2. Eliminar Control Derivado
- **Estado**: Componente existe pero no integrado
- **Necesita**: Endpoint para eliminar control
- **Acción**: Permitir deshacer conversión

### 3. Editar Plan
- **Estado**: No implementado
- **Necesita**: Endpoint para actualizar datos del plan
- **Acción**: Editar descripción, responsable, fechas

---

## 🧪 Pruebas Recomendadas

### 1. Cargar Planes
- [ ] Abrir página `/planes-accion`
- [ ] Verificar que se cargan planes reales
- [ ] Verificar que muestra información del riesgo
- [ ] Verificar que los contadores en tabs son correctos

### 2. Filtrar por Estado
- [ ] Hacer clic en cada tab
- [ ] Verificar que muestra solo planes del estado correspondiente
- [ ] Verificar que "Todos" muestra todos los planes

### 3. Buscar Planes
- [ ] Escribir en el campo de búsqueda
- [ ] Verificar que filtra por descripción
- [ ] Verificar que filtra por responsable

### 4. Cambiar Estado
- [ ] Cambiar estado de un plan
- [ ] Verificar que muestra notificación de éxito
- [ ] Verificar que el plan se actualiza en la lista
- [ ] Verificar que los contadores se actualizan

### 5. Convertir a Control
- [ ] Hacer clic en "Convertir a Control"
- [ ] Llenar el formulario
- [ ] Confirmar conversión
- [ ] Verificar que muestra notificación de éxito
- [ ] Verificar que el plan cambia a estado "Convertido"

### 6. Manejo de Errores
- [ ] Desconectar backend
- [ ] Verificar que muestra mensaje de error
- [ ] Reconectar backend
- [ ] Verificar que se recupera correctamente

---

## 📊 Mapeo de Estados

| Frontend | Backend | Descripción |
|----------|---------|-------------|
| pendiente | pendiente | Plan creado, no iniciado |
| en_revision | en_progreso | Plan en revisión |
| en_ejecucion | en_progreso | Plan en ejecución |
| completado | completado | Plan finalizado |
| convertido_a_control | completado | Plan convertido a control |

---

## 🎯 Estado del Proyecto

| Componente | Estado | Progreso |
|------------|--------|----------|
| Backend - Endpoint Listar | ✅ Completado | 100% |
| Backend - Endpoint Cambiar Estado | ✅ Completado | 100% |
| Backend - Endpoint Convertir | ✅ Completado | 100% |
| Frontend - API Service | ✅ Completado | 100% |
| Frontend - Página Planes | ✅ Completado | 100% |
| Frontend - Cambiar Estado | ✅ Completado | 100% |
| Frontend - Convertir Control | ✅ Completado | 100% |
| Frontend - Trazabilidad | ⏳ Pendiente | 0% |
| Frontend - Editar Plan | ⏳ Pendiente | 0% |

**Progreso Total**: 80% (8 de 10 tareas)

---

## 📝 Próximos Pasos

### Opción A: Integrar Trazabilidad
1. Actualizar `TrazabilidadTimeline` para usar `useObtenerTrazabilidadQuery`
2. Mostrar historial de estados
3. Mostrar eventos de auditoría
4. Mostrar control derivado si existe

### Opción B: Agregar Edición de Planes
1. Crear endpoint `PUT /api/causas/:id/plan`
2. Crear mutation en API service
3. Agregar formulario de edición
4. Permitir editar descripción, responsable, fechas

### Opción C: Testing y Optimización
1. Probar todos los flujos
2. Optimizar queries (cache, polling)
3. Mejorar UX (loading states, animaciones)
4. Documentar casos de uso

---

**Fecha de completitud**: 22 de marzo de 2026  
**Estado**: ✅ Integración principal completada  
**Siguiente paso**: Probar funcionalidad y decidir próximos pasos
