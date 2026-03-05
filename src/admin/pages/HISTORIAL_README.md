# 📋 Página de Historial de Cambios - Frontend

## 🎯 Descripción

Página de auditoría que muestra un registro completo de todas las operaciones realizadas en el sistema, permitiendo a los administradores rastrear cambios, identificar quién hizo qué y cuándo.

## ✨ Características Implementadas

### 1. **Visualización de Registros**
- ✅ Tabla con DataGrid personalizado (AppDataGrid)
- ✅ Columnas: Fecha/Hora, Usuario, Rol, Acción, Tabla, Registro, Cambios
- ✅ Paginación automática
- ✅ Ordenamiento por fecha (más recientes primero)

### 2. **Filtros de Búsqueda**
- ✅ Filtro por Tabla (Riesgo, Proceso, Usuario, etc.)
- ✅ Filtro por Acción (CREATE, UPDATE, DELETE)
- ✅ Filtro por Rango de Fechas (Desde/Hasta)
- ✅ Botón de Limpiar Filtros
- ✅ Acordeón colapsable para ahorrar espacio

### 3. **Estadísticas Rápidas**
- ✅ Total de Registros
- ✅ Contador de Creaciones (verde)
- ✅ Contador de Actualizaciones (amarillo)
- ✅ Contador de Eliminaciones (rojo)

### 4. **Detalles de Cambios**
- ✅ Dialog modal con información completa
- ✅ Información General (fecha, usuario, rol, acción)
- ✅ Cambios Realizados (diff campo por campo)
- ✅ Visualización de valores anteriores vs nuevos
- ✅ Datos completos en formato JSON
- ✅ Información técnica (IP, User Agent)

### 5. **Experiencia de Usuario**
- ✅ Chips de colores para acciones (verde/amarillo/rojo)
- ✅ Iconos intuitivos
- ✅ Diseño responsive
- ✅ Loading states
- ✅ Manejo de errores con alertas
- ✅ Datos de ejemplo para visualización

## 🎨 Componentes Utilizados

```typescript
// Material-UI
- Box, Typography, Paper, TextField, MenuItem
- Button, Chip, Accordion, Grid, Dialog
- Alert, Divider, Stack, Card, CardContent

// Custom Components
- AppDataGrid (DataGrid personalizado del proyecto)

// Icons
- ExpandMore, FilterList, Refresh, Info, Close
```

## 📊 Estructura de Datos

```typescript
interface AuditLog {
  id: number;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRole: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  tabla: string;
  registroId?: number;
  registroDesc?: string;
  cambios?: Record<string, { anterior: any; nuevo: any }>;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
```

## 🔌 Integración con Backend

### Endpoint Esperado
```
GET /api/audit/logs
```

### Query Parameters
- `usuarioId` (opcional): Filtrar por ID de usuario
- `tabla` (opcional): Filtrar por tabla
- `accion` (opcional): Filtrar por acción (CREATE/UPDATE/DELETE)
- `fechaDesde` (opcional): Fecha inicio (YYYY-MM-DD)
- `fechaHasta` (opcional): Fecha fin (YYYY-MM-DD)
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Tamaño de página (default: 50)

### Respuesta Esperada
```json
{
  "data": [
    {
      "id": 1,
      "usuarioNombre": "Juan Pérez",
      "usuarioEmail": "juan.perez@comware.com.co",
      "usuarioRole": "admin",
      "accion": "CREATE",
      "tabla": "Riesgo",
      "registroId": 123,
      "registroDesc": "1P - Riesgo de seguridad",
      "cambios": null,
      "datosNuevos": { "descripcion": "..." },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 50,
  "totalPages": 3
}
```

## 🚀 Estado Actual

### ✅ Implementado (Frontend)
- Página completa con UI/UX
- Sistema de filtros
- Visualización de datos
- Dialog de detalles
- Estadísticas
- Manejo de errores
- Datos de ejemplo

### ⏳ Pendiente (Backend)
- Tabla `AuditLog` en Prisma
- Servicio de auditoría
- Middleware de captura
- Controlador de auditoría
- Endpoints REST

## 📝 Datos de Ejemplo

La página incluye datos de ejemplo que se muestran cuando el backend aún no está implementado:

```typescript
// 5 registros de ejemplo con diferentes acciones
- CREATE: Creación de riesgo
- UPDATE: Actualización de proceso
- DELETE: Eliminación de incidencia
- UPDATE: Actualización de plan de acción
- UPDATE: Cambio de rol de usuario
```

## 🎯 Próximos Pasos

1. **Backend - Modelo de Datos**
   - Crear tabla `AuditLog` en schema.prisma
   - Ejecutar migración

2. **Backend - Servicio**
   - Implementar `audit.service.ts`
   - Función `registrarAuditoria()`
   - Función `obtenerHistorial()`

3. **Backend - Middleware**
   - Crear `audit.middleware.ts`
   - Capturar operaciones POST/PUT/DELETE
   - Registrar cambios automáticamente

4. **Backend - Controlador**
   - Crear `audit.controller.ts`
   - Endpoint GET `/api/audit/logs`
   - Endpoint GET `/api/audit/stats`

5. **Testing**
   - Verificar captura de cambios
   - Probar filtros
   - Validar performance

## 💡 Notas Técnicas

### Manejo de Errores
- Si el backend no está disponible, muestra datos de ejemplo
- Alert informativo indicando que es visualización de ejemplo
- No bloquea la navegación del usuario

### Performance
- Paginación del lado del servidor
- Límite de 50 registros por página
- Índices recomendados en BD para filtros

### Seguridad
- Solo accesible para rol `admin`
- Token JWT requerido
- Validación de permisos en backend

## 🎨 Capturas de Pantalla

### Vista Principal
- Tabla con registros de auditoría
- Filtros colapsables
- Estadísticas en cards

### Dialog de Detalles
- Información general del cambio
- Diff de campos modificados
- Datos completos en JSON
- Información técnica

## 📚 Recursos

- [Material-UI DataGrid](https://mui.com/x/react-data-grid/)
- [date-fns](https://date-fns.org/)
- [Axios](https://axios-http.com/)

## 👥 Autor

Implementación Frontend - Sistema de Gestión de Riesgos COMWARE

---

**Versión:** 1.0.0  
**Fecha:** 2024  
**Estado:** ✅ Frontend Completo | ⏳ Backend Pendiente
