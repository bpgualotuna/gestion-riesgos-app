# Configuración de JSON Server

## Resumen

Se ha configurado JSON Server como backend para la aplicación de gestión de riesgos. El servidor utiliza los datos extraídos de los CSV de análisis de Talento Humano.

## Archivos Creados/Modificados

### 1. Scripts de Migración
- `scripts/generar-db-completo.js`: Script que lee los CSV de análisis y genera `db.json` con todos los datos

### 2. Configuración de JSON Server
- `db.json`: Base de datos JSON con todas las entidades
- `json-server.json`: Configuración del servidor
- `routes.json`: Rutas personalizadas
- `middleware.js`: Middleware para CORS y funcionalidades adicionales

### 3. APIs Actualizadas
- `src/features/gestion-riesgos/api/riesgosApi.ts`: Actualizado para usar JSON Server en lugar de mock data
  - Endpoints de procesos, riesgos, evaluaciones, priorizaciones
  - Nuevos endpoints: tareas, notificaciones, observaciones, historial

### 4. Hooks Actualizados
- `src/features/gestion-riesgos/hooks/useRevisionProceso.ts`: Actualizado para usar endpoints de JSON Server

## Estructura de db.json

```json
{
  "procesos": [...],
  "riesgos": [...],
  "evaluaciones": [...],
  "priorizaciones": [...],
  "planesAccion": [...],
  "tareas": [...],
  "notificaciones": [...],
  "observaciones": [...],
  "historial": [...],
  "areas": [...]
}
```

## Comandos

### Generar db.json desde CSV
```bash
npm run migrar
# o
node scripts/generar-db-completo.js
```

### Iniciar JSON Server
```bash
npm run server
```

### Iniciar servidor y frontend juntos
```bash
npm run dev:full
```

## Endpoints Disponibles

- `GET /procesos` - Listar procesos
- `GET /procesos/:id` - Obtener proceso por ID
- `POST /procesos` - Crear proceso
- `PATCH /procesos/:id` - Actualizar proceso
- `DELETE /procesos/:id` - Eliminar proceso (soft delete)

- `GET /riesgos` - Listar riesgos (con filtros)
- `GET /riesgos/:id` - Obtener riesgo por ID
- `POST /riesgos` - Crear riesgo
- `PATCH /riesgos/:id` - Actualizar riesgo
- `DELETE /riesgos/:id` - Eliminar riesgo

- `GET /evaluaciones?riesgoId=:id` - Obtener evaluaciones de un riesgo
- `POST /evaluaciones` - Crear evaluación

- `GET /priorizaciones` - Listar priorizaciones
- `POST /priorizaciones` - Crear priorización

- `GET /tareas` - Listar tareas
- `POST /tareas` - Crear tarea
- `PATCH /tareas/:id` - Actualizar tarea

- `GET /notificaciones` - Listar notificaciones
- `POST /notificaciones` - Crear notificación
- `PATCH /notificaciones/:id` - Actualizar notificación

- `GET /observaciones?procesoId=:id` - Obtener observaciones de un proceso
- `POST /observaciones` - Crear observación
- `PATCH /observaciones/:id` - Actualizar observación

- `GET /historial?procesoId=:id` - Obtener historial de un proceso
- `POST /historial` - Crear entrada de historial

## Datos Poblados

Los datos se generan desde:
- `analisis/datos_excel_talento_humano/3__Identificación.csv` - Riesgos
- `analisis/datos_excel_talento_humano/4__Evaluación.csv` - Evaluaciones
- `analisis/datos_excel_talento_humano/6__Priorización_y_Respuesta.csv` - Priorizaciones
- `analisis/datos_excel_talento_humano/1__Ficha.csv` - Información del proceso

## Notas

- El servidor corre en `http://localhost:3001`
- Los datos se guardan en `db.json` y se actualizan automáticamente
- El middleware maneja CORS para permitir peticiones desde el frontend
- Los endpoints tienen fallback a localStorage si el servidor no está disponible
