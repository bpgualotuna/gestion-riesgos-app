# Implementación de Campana de Alertas en MainLayout

## Resumen
Se agregó un ícono de campana (bell) en el AppBar del MainLayout para mostrar alertas de vencimiento de planes de acción a usuarios operativos (no administradores).

## Cambios Realizados

### 1. MainLayout.tsx
**Archivo**: `gestion-riesgos-app/src/components/layout/MainLayout.tsx`

#### Imports agregados:
```typescript
import AlertasNotificationsMenu from "../common/AlertasNotificationsMenu";
import { useObtenerAlertasQuery } from "../../api/services/planTrazabilidadApi";
```

#### Estado agregado:
```typescript
const [alertasAnchorEl, setAlertasAnchorEl] = useState<null | HTMLElement>(null);

// Hook de alertas de vencimiento para usuarios operativos (no admin)
const { data: alertasData } = useObtenerAlertasQuery(
  { soloNoLeidas: true },
  { skip: esAdmin, pollingInterval: 60000 } // Actualizar cada minuto, skip si es admin
);
const alertasNoLeidas = alertasData?.noLeidas || 0;
```

#### Handlers agregados:
```typescript
const handleAlertasOpen = (event: React.MouseEvent<HTMLElement>) => {
  setAlertasAnchorEl(event.currentTarget);
};

const handleAlertasClose = () => {
  setAlertasAnchorEl(null);
};
```

#### Ícono de campana agregado (Móvil y Desktop):
```typescript
{/* Alertas de Vencimiento - Para usuarios operativos */}
{!esAdmin && (
  <IconButton
    onClick={handleAlertasOpen}
    sx={{ mr: 1 }}
    aria-label="Alertas de Vencimiento"
  >
    <Badge badgeContent={alertasNoLeidas} color="warning" max={99}>
      <NotificationsIcon sx={{ color: '#ff9800', fontSize: 26 }} />
    </Badge>
  </IconButton>
)}
```

#### Menú de alertas agregado:
```typescript
{/* Menú de Alertas de Vencimiento - Para usuarios operativos */}
{!esAdmin && (
  <AlertasNotificationsMenu
    anchorEl={alertasAnchorEl}
    open={Boolean(alertasAnchorEl)}
    onClose={handleAlertasClose}
  />
)}
```

## Características

### Visibilidad
- **Administradores**: Ven campana azul de notificaciones de auditoría (existente)
- **Usuarios operativos**: Ven campana naranja de alertas de vencimiento (nueva)

### Badge
- Muestra el número de alertas no leídas
- Color naranja (warning) para diferenciarse de las notificaciones de admin
- Máximo 99 (muestra "99+" si hay más)

### Actualización automática
- Polling cada 60 segundos (1 minuto)
- Se actualiza automáticamente sin necesidad de refrescar la página
- Solo se ejecuta para usuarios no administradores

### Menú desplegable
- Al hacer clic en la campana, se abre el menú `AlertasNotificationsMenu`
- Muestra el componente `AlertasVencimientoPanel` con solo alertas no leídas
- Incluye botón "Ver todas las alertas" que navega a `/planes-accion`

## Componentes Relacionados

### AlertasNotificationsMenu
**Archivo**: `gestion-riesgos-app/src/components/common/AlertasNotificationsMenu.tsx`
- Menú desplegable que contiene el panel de alertas
- Props: `anchorEl`, `open`, `onClose`
- Incluye header con título y botón de cerrar
- Footer con botón para ver todas las alertas

### AlertasVencimientoPanel
**Archivo**: `gestion-riesgos-app/src/components/plan-accion/AlertasVencimientoPanel.tsx`
- Panel que muestra la lista de alertas
- Prop `soloNoLeidas` para filtrar solo alertas no leídas
- Usa RTK Query para obtener datos del backend
- Permite marcar alertas como leídas
- Permite navegar al plan específico

### API Service
**Archivo**: `gestion-riesgos-app/src/api/services/planTrazabilidadApi.ts`
- Endpoint: `GET /api/alertas-vencimiento?soloNoLeidas=true`
- Mutation: `PUT /api/alertas/:id/marcar-leida`
- Configurado con polling y cache invalidation

## Flujo de Usuario

1. Usuario operativo inicia sesión
2. Ve campana naranja en el AppBar (al lado del avatar)
3. Badge muestra número de alertas no leídas
4. Al hacer clic en la campana:
   - Se abre menú desplegable
   - Muestra alertas de planes próximos a vencer o vencidos
   - Puede marcar alertas como leídas
   - Puede hacer clic en una alerta para ver el plan
   - Puede hacer clic en "Ver todas las alertas" para ir a la página completa

## Diferencias con Notificaciones de Admin

| Característica | Admin (Notificaciones) | Usuarios (Alertas) |
|----------------|------------------------|-------------------|
| Color campana | Azul (#1976d2) | Naranja (#ff9800) |
| Badge color | error (rojo) | warning (naranja) |
| Contenido | Auditoría de cambios | Vencimiento de planes |
| Polling | No | Sí (60 segundos) |
| Endpoint | Interno (hook) | `/api/alertas-vencimiento` |

## Testing

Para probar la funcionalidad:

1. Iniciar sesión con usuario operativo (no admin):
   - Email: `vbarahona@comware.com.ec`
   - Password: `Vini2026`

2. Verificar que aparece campana naranja en AppBar

3. Si hay alertas, el badge mostrará el número

4. Hacer clic en la campana para abrir el menú

5. Verificar que se muestran las alertas correctamente

6. Probar marcar como leída y navegar a un plan

## Estado Actual

✅ Implementación completa
✅ Sin errores de compilación
✅ Integrado con API real
✅ Polling automático configurado
✅ Responsive (móvil y desktop)

## Próximos Pasos

La implementación de la campana de alertas está completa. Los siguientes pasos serían:

1. Integrar el resto de componentes de la página de Planes de Acción con la API real
2. Probar en producción con datos reales
3. Ajustar estilos si es necesario según feedback del usuario
