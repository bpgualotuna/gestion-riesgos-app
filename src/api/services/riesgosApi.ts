/**
 * RTK Query API for Risk Management
 * Connects to real backend API at Render
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../utils/constants';
import type {
  Riesgo,
  CreateRiesgoDto,
  UpdateRiesgoDto,
  EvaluacionRiesgo,
  CreateEvaluacionDto,
  PriorizacionRiesgo,
  CreatePriorizacionDto,
  PaginatedResponse,
  FiltrosRiesgo,
  EstadisticasRiesgo,
  RiesgoReciente,
  PuntoMapa,
  Proceso,
  CreateProcesoDto,
  UpdateProcesoDto,
  Causa,
  ImpactoDescripcion,
} from '../../types';

// Base query configuration for API calls
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    // Add any authentication headers if needed in the future
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Helper to transform API response to match frontend types
const transformProceso = (data: any): Proceso => ({
  id: String(data.id),
  nombre: data.nombre_proceso || data.nombre || '',
  descripcion: data.descripcion || '',
  vicepresidencia: data.vicepresidencia || '',
  gerencia: data.gerencia || '',
  responsable: data.responsable || data.responsable_nombre || '',
  responsableId: String(data.responsable_id || data.id_responsable || ''),
  responsableNombre: data.responsable_nombre || data.responsable || '',
  areaId: String(data.area_id || ''),
  areaNombre: data.area_nombre || '',
  directorId: String(data.director_id || ''),
  directorNombre: data.director_nombre || '',
  gerenteId: data.gerente_id ? String(data.gerente_id) : undefined,
  gerenteNombre: data.gerente_nombre || undefined,
  objetivoProceso: data.objetivo || data.objetivo_proceso || '',
  tipoProceso: data.tipo_proceso || '',
  activo: data.activo ?? true,
  estado: data.estado || 'borrador',
  createdAt: data.fecha_creacion || new Date().toISOString(),
  updatedAt: data.fecha_actualizacion || new Date().toISOString(),
});

const transformRiesgo = (data: any): Riesgo => ({
  id: String(data.id),
  procesoId: String(data.id_proceso || data.proceso_id || ''),
  numero: data.numero || 0,
  descripcion: data.descripcion_riesgo || data.descripcion || '',
  clasificacion: data.clasificacion || '',
  proceso: data.proceso || '',
  zona: data.zona || '',
  tipologiaNivelI: data.tipologia_nivel_i || '',
  tipologiaNivelII: data.tipologia_nivel_ii || '',
  causaRiesgo: data.causa_riesgo || '',
  fuenteCausa: data.fuente_causa || '',
  origen: data.origen || '',
  vicepresidenciaGerenciaAlta: data.vicepresidencia_gerencia_alta || '',
  siglaVicepresidencia: data.sigla_vicepresidencia || '',
  gerencia: data.gerencia || '',
  siglaGerencia: data.sigla_gerencia || '',
  createdAt: data.fecha_creacion || new Date().toISOString(),
  updatedAt: data.fecha_actualizacion || new Date().toISOString(),
  tipoRiesgo: data.tipo_riesgo || '',
  objetivo: data.objetivo || '',
});

const transformEvaluacion = (data: any): EvaluacionRiesgo => ({
  id: String(data.id),
  riesgoId: String(data.riesgo_id || ''),
  impactoPersonas: data.impacto_personas || 1,
  impactoLegal: data.impacto_legal || 1,
  impactoAmbiental: data.impacto_ambiental || 1,
  impactoProcesos: data.impacto_procesos || 1,
  impactoReputacion: data.impacto_reputacional || data.impacto_reputacion || 1,
  impactoEconomico: data.impacto_economico || 1,
  impactoTecnologico: data.impacto_tecnologico || 1,
  probabilidad: data.probabilidad || data.frecuencia || 1,
  impactoGlobal: data.impacto_global || 0,
  impactoMaximo: data.impacto_maximo || 0,
  riesgoInherente: data.riesgo_inherente || 0,
  nivelRiesgo: data.nivel_riesgo || 'Bajo',
  fechaEvaluacion: data.fecha_evaluacion || new Date().toISOString(),
  evaluadoPor: data.evaluado_por || '',
});

// Helper to safely extract array from response (handles both array and {data: []} formats)
const extractArray = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && typeof response === 'object') return [response];
  return [];
};

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery: baseQuery,
  tagTypes: [
    'Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 
    'Tarea', 'Notificacion', 'Observacion', 'Historial', 'PasoProceso', 
    'Encuesta', 'PreguntaEncuesta', 'ListaValores', 'ParametroValoracion', 
    'Tipologia', 'Formula', 'Configuracion', 'MapaConfig', 'Area', 'Catalogo'
  ],
  endpoints: (builder) => ({
    // ============================================
    // PROCESOS
    // ============================================
    getProcesos: builder.query<Proceso[], void>({
      query: () => '/procesos',
      transformResponse: (response: any) => extractArray(response).map(transformProceso),
      providesTags: ['Proceso'],
    }),

    getProcesoById: builder.query<Proceso, string>({
      query: (id) => `/procesos/${id}`,
      transformResponse: transformProceso,
      providesTags: (_result, _error, id) => [{ type: 'Proceso', id }],
    }),

    createProceso: builder.mutation<Proceso, CreateProcesoDto>({
      query: (body) => ({
        url: '/procesos',
        method: 'POST',
        body: {
          codigo_proceso: `PROC-${Date.now()}`,
          nombre_proceso: body.nombre,
          descripcion: body.descripcion,
          objetivo: body.objetivoProceso,
          tipo_proceso: body.tipoProceso,
          vicepresidencia: body.vicepresidencia,
          gerencia: body.gerencia,
          id_responsable: body.responsableId,
          area_id: body.areaId,
          director_id: body.directorId,
        },
      }),
      transformResponse: transformProceso,
      invalidatesTags: ['Proceso'],
    }),

    updateProceso: builder.mutation<Proceso, UpdateProcesoDto & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/procesos/${id}`,
        method: 'PUT',
        body: {
          nombre_proceso: body.nombre,
          descripcion: body.descripcion,
          objetivo: body.objetivoProceso,
          tipo_proceso: body.tipoProceso,
          vicepresidencia: body.vicepresidencia,
          gerencia: body.gerencia,
          id_responsable: body.responsableId,
          area_id: body.areaId,
          director_id: body.directorId,
        },
      }),
      transformResponse: transformProceso,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proceso', id }, 'Proceso'],
    }),

    deleteProceso: builder.mutation<void, string>({
      query: (id) => ({
        url: `/procesos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Proceso'],
    }),

    duplicateProceso: builder.mutation<Proceso, { id: string; overrides?: Partial<CreateProcesoDto> }>({
      query: ({ id }) => `/procesos/${id}`,
      async onQueryStarted({ id, overrides }, { dispatch, queryFulfilled }) {
        try {
          const { data: original } = await queryFulfilled;
          // Create a copy with overrides
          dispatch(
            riesgosApi.endpoints.createProceso.initiate({
              nombre: overrides?.nombre || `${original.nombre} (Copia)`,
              descripcion: overrides?.descripcion || original.descripcion,
              objetivoProceso: overrides?.objetivoProceso || original.objetivoProceso,
              tipoProceso: overrides?.tipoProceso || original.tipoProceso,
              vicepresidencia: overrides?.vicepresidencia || original.vicepresidencia,
              gerencia: overrides?.gerencia || original.gerencia,
              responsableId: overrides?.responsableId || original.responsableId,
              areaId: overrides?.areaId || original.areaId,
              directorId: overrides?.directorId || original.directorId,
            })
          );
        } catch (err) {
          console.error('Error duplicating proceso:', err);
        }
      },
      transformResponse: transformProceso,
      invalidatesTags: ['Proceso'],
    }),

    bulkUpdateProcesos: builder.mutation<Proceso[], Proceso[]>({
      query: (procesos) => ({
        url: '/procesos/bulk',
        method: 'PUT',
        body: procesos.map(p => ({
          id: p.id,
          nombre_proceso: p.nombre,
          descripcion: p.descripcion,
          estado: p.estado,
          activo: p.activo,
        })),
      }),
      transformResponse: (response: any[]) => response.map(transformProceso),
      invalidatesTags: ['Proceso'],
    }),

    // ============================================
    // AREAS
    // ============================================
    getAreas: builder.query<any[], void>({
      query: () => '/areas',
      providesTags: ['Area'],
    }),

    getAreaById: builder.query<any, string>({
      query: (id) => `/areas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Area', id }],
    }),

    createArea: builder.mutation<any, any>({
      query: (body) => ({
        url: '/areas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Area'],
    }),

    updateArea: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/areas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Area'],
    }),

    deleteArea: builder.mutation<void, string>({
      query: (id) => ({
        url: `/areas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Area'],
    }),

    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<PaginatedResponse<Riesgo>, FiltrosRiesgo & { page?: number; pageSize?: number }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.procesoId) queryParams.append('proceso_id', params.procesoId);
        if (params.clasificacion && params.clasificacion !== 'all') queryParams.append('clasificacion', params.clasificacion);
        if (params.busqueda) queryParams.append('busqueda', params.busqueda);
        if (params.zona) queryParams.append('zona', params.zona);
        if (params.page) queryParams.append('page', String(params.page));
        if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
        return `/riesgos?${queryParams.toString()}`;
      },
      transformResponse: (response: any): PaginatedResponse<Riesgo> => {
        const data = Array.isArray(response) ? response : response.data || [];
        return {
          data: data.map(transformRiesgo),
          total: response.total || data.length,
          page: response.page || 1,
          pageSize: response.pageSize || data.length,
          totalPages: response.totalPages || 1,
        };
      },
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      query: (id) => `/riesgos/${id}`,
      transformResponse: transformRiesgo,
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      query: (body) => ({
        url: '/riesgos',
        method: 'POST',
        body: {
          codigo_riesgo: `RIE-${Date.now()}`,
          nombre_riesgo: body.descripcion.substring(0, 100),
          descripcion_riesgo: body.descripcion,
          id_proceso: body.procesoId,
          clasificacion: body.clasificacion,
          zona: body.zona,
          tipologia_nivel_i: body.tipologiaNivelI,
          tipologia_nivel_ii: body.tipologiaNivelII,
          causa_riesgo: body.causaRiesgo,
          fuente_causa: body.fuenteCausa,
          origen: body.origen,
          vicepresidencia_gerencia_alta: body.vicepresidenciaGerenciaAlta,
          sigla_vicepresidencia: body.siglaVicepresidencia,
          gerencia: body.gerencia,
          sigla_gerencia: body.siglaGerencia,
        },
      }),
      transformResponse: transformRiesgo,
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    updateRiesgo: builder.mutation<Riesgo, UpdateRiesgoDto & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/riesgos/${id}`,
        method: 'PUT',
        body: {
          descripcion_riesgo: body.descripcion,
          clasificacion: body.clasificacion,
          zona: body.zona,
          tipologia_nivel_i: body.tipologiaNivelI,
          tipologia_nivel_ii: body.tipologiaNivelII,
          causa_riesgo: body.causaRiesgo,
          fuente_causa: body.fuenteCausa,
        },
      }),
      transformResponse: transformRiesgo,
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Riesgo', id }, 'Riesgo', 'Estadisticas'],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      query: (id) => ({
        url: `/riesgos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    // ============================================
    // EVALUACIONES
    // ============================================
    getEvaluacionesByRiesgo: builder.query<EvaluacionRiesgo[], string>({
      query: (riesgoId) => `/evaluaciones-riesgo?riesgo_id=${riesgoId}`,
      transformResponse: (response: any) => extractArray(response).map(transformEvaluacion),
      providesTags: (_result, _error, riesgoId) => [{ type: 'Evaluacion', id: riesgoId }],
    }),

    getEvaluacionById: builder.query<EvaluacionRiesgo, string>({
      query: (id) => `/evaluaciones-riesgo/${id}`,
      transformResponse: transformEvaluacion,
      providesTags: (_result, _error, id) => [{ type: 'Evaluacion', id }],
    }),

    createEvaluacion: builder.mutation<EvaluacionRiesgo, CreateEvaluacionDto>({
      query: (body) => ({
        url: '/evaluaciones-riesgo',
        method: 'POST',
        body: {
          riesgo_id: body.riesgoId,
          impacto_personas: body.impactoPersonas,
          impacto_legal: body.impactoLegal,
          impacto_ambiental: body.impactoAmbiental,
          impacto_procesos: body.impactoProcesos,
          impacto_reputacional: body.impactoReputacion,
          impacto_economico: body.impactoEconomico,
          impacto_tecnologico: body.impactoTecnologico,
          frecuencia: body.probabilidad,
        },
      }),
      transformResponse: transformEvaluacion,
      invalidatesTags: (_result, _error, { riesgoId }) => [
        { type: 'Evaluacion', id: riesgoId },
        { type: 'Riesgo', id: riesgoId },
        'Estadisticas',
      ],
    }),

    // ============================================
    // PRIORIZACIÓN
    // ============================================
    getPriorizaciones: builder.query<PriorizacionRiesgo[], void>({
      query: () => '/priorizaciones',
      transformResponse: (response: any) => extractArray(response).map((p) => ({
        id: String(p.id),
        riesgoId: String(p.riesgo_id),
        calificacionFinal: p.calificacion_final || 0,
        respuesta: p.respuesta || '',
        responsable: p.responsable || '',
        fechaAsignacion: p.fecha_asignacion || new Date().toISOString(),
      })),
      providesTags: ['Priorizacion'],
    }),

    createPriorizacion: builder.mutation<PriorizacionRiesgo, CreatePriorizacionDto>({
      query: (body) => ({
        url: '/priorizaciones',
        method: 'POST',
        body: {
          riesgo_id: body.riesgoId,
          calificacion_final: body.calificacionFinal,
          respuesta: body.respuesta,
          responsable: body.responsable,
        },
      }),
      invalidatesTags: ['Priorizacion'],
    }),

    // ============================================
    // DASHBOARD & ESTADÍSTICAS
    // ============================================
    getEstadisticas: builder.query<EstadisticasRiesgo, string | undefined>({
      query: (procesoId) => procesoId ? `/riesgos/estadisticas?proceso_id=${procesoId}` : '/riesgos/estadisticas',
      transformResponse: (response: any): EstadisticasRiesgo => ({
        totalRiesgos: response.total_riesgos || response.totalRiesgos || 0,
        criticos: response.criticos || 0,
        altos: response.altos || 0,
        medios: response.medios || 0,
        bajos: response.bajos || 0,
        positivos: response.positivos || 0,
        negativos: response.negativos || 0,
        evaluados: response.evaluados || 0,
        sinEvaluar: response.sin_evaluar || response.sinEvaluar || 0,
      }),
      providesTags: ['Estadisticas'],
    }),

    getRiesgosRecientes: builder.query<RiesgoReciente[], number>({
      query: (limit = 10) => `/riesgos?limit=${limit}&order=fecha_actualizacion`,
      transformResponse: (response: any): RiesgoReciente[] => 
        extractArray(response).slice(0, 10).map(r => ({
          ...transformRiesgo(r),
          fechaUltimaModificacion: r.fecha_actualizacion || new Date().toISOString(),
        })),
      providesTags: ['Riesgo'],
    }),

    // ============================================
    // MAPA DE RIESGOS
    // ============================================
    getPuntosMapa: builder.query<PuntoMapa[], FiltrosRiesgo>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.procesoId) queryParams.append('proceso_id', params.procesoId);
        return `/riesgos?${queryParams.toString()}`;
      },
      transformResponse: (response: any): PuntoMapa[] => 
        extractArray(response).map(r => ({
          riesgoId: String(r.id),
          descripcion: r.descripcion_riesgo || r.descripcion || '',
          probabilidad: r.frecuencia || r.probabilidad || 1,
          impacto: r.impacto_maximo || r.impacto_global || 1,
          nivelRiesgo: r.nivel_riesgo || 'Bajo',
          clasificacion: r.clasificacion || '',
          numero: r.numero || 0,
          siglaGerencia: r.sigla_gerencia || '',
        })),
      providesTags: ['Riesgo', 'Evaluacion'],
    }),

    // ============================================
    // CAUSAS
    // ============================================
    getCausas: builder.query<Causa[], void>({
      query: () => '/causas',
      transformResponse: (response: any): Causa[] => extractArray(response).map(c => ({
        id: String(c.id),
        descripcion: c.descripcion_causa || c.descripcion || '',
        fuente: c.fuente || '',
        frecuencia: String(c.frecuencia || ''),
      })),
      providesTags: ['Catalogo'],
    }),

    getCausasByRiesgo: builder.query<any[], string>({
      query: (riesgoId) => `/causas?riesgo_id=${riesgoId}`,
      providesTags: ['Catalogo'],
    }),

    createCausa: builder.mutation<any, any>({
      query: (body) => ({
        url: '/causas',
        method: 'POST',
        body: {
          descripcion_causa: body.descripcion,
          id_riesgo: body.riesgoId,
          id_fuente: body.fuenteId,
          id_frecuencia: body.frecuenciaId,
        },
      }),
      invalidatesTags: ['Catalogo'],
    }),

    // ============================================
    // CONTROLES
    // ============================================
    getControles: builder.query<any[], void>({
      query: () => '/controles-riesgo',
      providesTags: ['Catalogo'],
    }),

    getControlesByCausa: builder.query<any[], string>({
      query: (causaId) => `/controles-riesgo?causa_riesgo_id=${causaId}`,
      providesTags: ['Catalogo'],
    }),

    createControl: builder.mutation<any, any>({
      query: (body) => ({
        url: '/controles-riesgo',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    updateControl: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/controles-riesgo/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    // ============================================
    // PLANES DE ACCIÓN
    // ============================================
    getPlanesAccion: builder.query<any[], void>({
      query: () => '/planes-accion',
      providesTags: ['Catalogo'],
    }),

    createPlanAccion: builder.mutation<any, any>({
      query: (body) => ({
        url: '/planes-accion',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    updatePlanAccion: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/planes-accion/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    // ============================================
    // ACCIONES DEL PLAN
    // ============================================
    getAccionesPlan: builder.query<any[], string>({
      query: (planId) => `/acciones-plan?plan_id=${planId}`,
      providesTags: ['Catalogo'],
    }),

    createAccionPlan: builder.mutation<any, any>({
      query: (body) => ({
        url: '/acciones-plan',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    // ============================================
    // OBSERVACIONES
    // ============================================
    getObservaciones: builder.query<any[], string>({
      query: (procesoId) => `/workflow/observaciones-proceso?proceso_id=${procesoId}`,
      providesTags: ['Observacion'],
    }),

    createObservacion: builder.mutation<any, any>({
      query: (body) => ({
        url: '/workflow/observaciones-proceso',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Observacion'],
    }),

    updateObservacion: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/workflow/observaciones-proceso/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Observacion'],
    }),

    // ============================================
    // HISTORIAL
    // ============================================
    getHistorial: builder.query<any[], string>({
      query: (procesoId) => `/workflow/historial-cambios?proceso_id=${procesoId}`,
      providesTags: ['Historial'],
    }),

    createHistorial: builder.mutation<any, any>({
      query: (body) => ({
        url: '/workflow/historial-cambios',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Historial'],
    }),

    // ============================================
    // TAREAS
    // ============================================
    getTareas: builder.query<any[], void>({
      query: () => '/workflow/tareas',
      providesTags: ['Tarea'],
    }),

    createTarea: builder.mutation<any, any>({
      query: (body) => ({
        url: '/workflow/tareas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tarea'],
    }),

    updateTarea: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/workflow/tareas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Tarea'],
    }),

    // ============================================
    // NOTIFICACIONES
    // ============================================
    getNotificaciones: builder.query<any[], void>({
      query: () => '/workflow/notificaciones',
      providesTags: ['Notificacion'],
    }),

    createNotificacion: builder.mutation<any, any>({
      query: (body) => ({
        url: '/workflow/notificaciones',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notificacion'],
    }),

    updateNotificacion: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/workflow/notificaciones/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Notificacion'],
    }),

    // ============================================
    // PASOS DEL PROCESO
    // ============================================
    getPasosProceso: builder.query<any[], void>({
      query: () => '/configuracion/pasos-proceso',
      providesTags: ['PasoProceso'],
    }),

    createPasoProceso: builder.mutation<any, any>({
      query: (body) => ({
        url: '/configuracion/pasos-proceso',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    updatePasoProceso: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/configuracion/pasos-proceso/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    deletePasoProceso: builder.mutation<void, string>({
      query: (id) => ({
        url: `/configuracion/pasos-proceso/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    // ============================================
    // ENCUESTAS
    // ============================================
    getEncuestas: builder.query<any[], void>({
      query: () => '/encuestas',
      providesTags: ['Encuesta'],
    }),

    getEncuestaById: builder.query<any, string>({
      query: (id) => `/encuestas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Encuesta', id }],
    }),

    createEncuesta: builder.mutation<any, any>({
      query: (body) => ({
        url: '/encuestas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encuesta'],
    }),

    updateEncuesta: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/encuestas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Encuesta'],
    }),

    deleteEncuesta: builder.mutation<void, string>({
      query: (id) => ({
        url: `/encuestas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Encuesta'],
    }),

    // ============================================
    // PREGUNTAS DE ENCUESTA
    // ============================================
    getPreguntasEncuesta: builder.query<any[], string>({
      query: (encuestaId) => `/encuestas/${encuestaId}/preguntas`,
      providesTags: ['PreguntaEncuesta'],
    }),

    createPreguntaEncuesta: builder.mutation<any, any>({
      query: (body) => ({
        url: `/encuestas/${body.encuestaId}/preguntas`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    updatePreguntaEncuesta: builder.mutation<any, { id: string; encuestaId: string; [key: string]: any }>({
      query: ({ id, encuestaId, ...body }) => ({
        url: `/encuestas/${encuestaId}/preguntas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PreguntaEncuesta'],
    }),

    deletePreguntaEncuesta: builder.mutation<void, { id: string; encuestaId: string }>({
      query: ({ id, encuestaId }) => ({
        url: `/encuestas/${encuestaId}/preguntas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    // ============================================
    // LISTAS DE VALORES
    // ============================================
    getListasValores: builder.query<any[], void>({
      query: () => '/configuracion/listas-valores',
      providesTags: ['ListaValores'],
    }),

    getListaValoresById: builder.query<any, string>({
      query: (id) => `/configuracion/listas-valores/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ListaValores', id }],
    }),

    updateListaValores: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/configuracion/listas-valores/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ListaValores'],
    }),

    // ============================================
    // PARÁMETROS DE VALORACIÓN
    // ============================================
    getParametrosValoracion: builder.query<any[], void>({
      query: () => '/configuracion/parametros-valoracion',
      providesTags: ['ParametroValoracion'],
    }),

    getParametroValoracionById: builder.query<any, string>({
      query: (id) => `/configuracion/parametros-valoracion/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ParametroValoracion', id }],
    }),

    updateParametroValoracion: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/configuracion/parametros-valoracion/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ParametroValoracion'],
    }),

    // ============================================
    // TIPOLOGÍAS
    // ============================================
    getTipologias: builder.query<any[], void>({
      query: () => '/catalogos/tipologias',
      providesTags: ['Tipologia'],
    }),

    getTipologiaById: builder.query<any, string>({
      query: (id) => `/catalogos/tipologias/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Tipologia', id }],
    }),

    createTipologia: builder.mutation<any, any>({
      query: (body) => ({
        url: '/catalogos/tipologias',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tipologia'],
    }),

    updateTipologia: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/catalogos/tipologias/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Tipologia'],
    }),

    deleteTipologia: builder.mutation<void, string>({
      query: (id) => ({
        url: `/catalogos/tipologias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tipologia'],
    }),

    // ============================================
    // FÓRMULAS
    // ============================================
    getFormulas: builder.query<any[], void>({
      query: () => '/catalogos/formulas',
      providesTags: ['Formula'],
    }),

    getFormulaById: builder.query<any, string>({
      query: (id) => `/catalogos/formulas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Formula', id }],
    }),

    createFormula: builder.mutation<any, any>({
      query: (body) => ({
        url: '/catalogos/formulas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Formula'],
    }),

    updateFormula: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/catalogos/formulas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Formula'],
    }),

    deleteFormula: builder.mutation<void, string>({
      query: (id) => ({
        url: `/catalogos/formulas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Formula'],
    }),

    // ============================================
    // CONFIGURACIONES
    // ============================================
    getConfiguraciones: builder.query<any[], void>({
      query: () => '/configuracion/configuraciones',
      providesTags: ['Configuracion'],
    }),

    updateConfiguracion: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/configuracion/configuraciones/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Configuracion'],
    }),

    // ============================================
    // CATÁLOGOS DE IDENTIFICACIÓN
    // ============================================
    getTiposRiesgos: builder.query<any[], void>({
      query: () => '/catalogos/tipos-riesgo',
      providesTags: ['Catalogo'],
    }),

    updateTiposRiesgos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: '/catalogos/tipos-riesgo/bulk',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    getObjetivos: builder.query<any[], void>({
      query: () => '/catalogos/objetivos',
      providesTags: ['Catalogo'],
    }),

    updateObjetivos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: '/catalogos/objetivos/bulk',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    getFrecuencias: builder.query<any[], void>({
      query: () => '/catalogos/frecuencias',
      providesTags: ['Catalogo'],
    }),

    updateFrecuencias: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: '/catalogos/frecuencias/bulk',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    getFuentes: builder.query<any[], void>({
      query: () => '/catalogos/fuentes-causa',
      providesTags: ['Catalogo'],
    }),

    updateFuentes: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: '/catalogos/fuentes-causa/bulk',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    getImpactos: builder.query<ImpactoDescripcion[], void>({
      query: () => '/catalogos/niveles-impacto',
      transformResponse: (response: any): ImpactoDescripcion[] => 
        extractArray(response).map(i => ({
          categoria: i.tipo_impacto || i.categoria,
          nivel: i.valor_nivel || i.nivel,
          descripcion: i.descripcion || '',
          tipo: i.tipo_impacto,
          valor: i.valor_nivel,
        })),
      providesTags: ['Catalogo'],
    }),

    updateImpactos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: '/catalogos/niveles-impacto/bulk',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    getOrigenes: builder.query<any[], void>({
      query: () => '/catalogos/origenes-riesgo',
      providesTags: ['Catalogo'],
    }),

    getTiposProceso: builder.query<any[], void>({
      query: () => '/catalogos/tipos-proceso',
      providesTags: ['Catalogo'],
    }),

    getConsecuencias: builder.query<any[], void>({
      query: () => '/catalogos/consecuencias',
      providesTags: ['Catalogo'],
    }),

    getNivelesRiesgo: builder.query<any[], void>({
      query: () => '/catalogos/niveles-impacto',
      providesTags: ['Catalogo'],
    }),

    getClasificacionesRiesgo: builder.query<any[], void>({
      query: () => '/catalogos/consecuencias',
      providesTags: ['Catalogo'],
    }),

    // ============================================
    // MAP CONFIGURATION
    // ============================================
    getEjesMapa: builder.query<{ probabilidad: any[], impacto: any[] }, void>({
      query: () => '/catalogos/frecuencias',
      transformResponse: (frecuencias: any[]) => ({
        probabilidad: frecuencias.map(f => ({
          id: f.id,
          label: f.nombre_frecuencia || f.label,
          descripcion: f.descripcion,
        })),
        impacto: [1, 2, 3, 4, 5].map(n => ({
          id: n,
          label: ['Muy Bajo', 'Bajo', 'Moderado', 'Alto', 'Muy Alto'][n - 1],
          valor: n,
        })),
      }),
      providesTags: ['Configuracion'],
    }),

    getMapaConfig: builder.query<any, void>({
      query: () => '/configuracion/configuraciones',
      transformResponse: (configs: any[]) => {
        const mapaConfig = configs.find(c => c.clave === 'mapa_config');
        return mapaConfig?.valor ? JSON.parse(mapaConfig.valor) : {
          inherente: { colores: {}, umbrales: {} },
          residual: { colores: {}, umbrales: {} },
          tolerancia: { linea: [], visible: true },
        };
      },
      providesTags: ['MapaConfig'],
    }),

    updateMapaConfig: builder.mutation<any, { type: 'inherente' | 'residual' | 'tolerancia'; data: any }>({
      query: ({ type, data }) => ({
        url: '/configuracion/configuraciones',
        method: 'PUT',
        body: {
          clave: 'mapa_config',
          valor: JSON.stringify({ [type]: data }),
        },
      }),
      invalidatesTags: ['MapaConfig'],
    }),

    // ============================================
    // USUARIOS
    // ============================================
    getUsuarios: builder.query<any[], void>({
      query: () => '/usuarios',
      providesTags: ['Catalogo'],
    }),

    getUsuarioById: builder.query<any, string>({
      query: (id) => `/usuarios/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Catalogo', id }],
    }),

    createUsuario: builder.mutation<any, any>({
      query: (body) => ({
        url: '/usuarios',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    updateUsuario: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/usuarios/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Catalogo'],
    }),

    deleteUsuario: builder.mutation<void, string>({
      query: (id) => ({
        url: `/usuarios/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Catalogo'],
    }),

    // ============================================
    // PERSONAS
    // ============================================
    getPersonas: builder.query<any[], void>({
      query: () => '/personas',
      providesTags: ['Catalogo'],
    }),
  }),
});

// Export hooks
export const {
  // Procesos
  useGetProcesosQuery,
  useGetProcesoByIdQuery,
  useCreateProcesoMutation,
  useUpdateProcesoMutation,
  useDeleteProcesoMutation,
  useDuplicateProcesoMutation,
  useBulkUpdateProcesosMutation,
  // Areas
  useGetAreasQuery,
  useGetAreaByIdQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useDeleteAreaMutation,
  // Riesgos
  useGetRiesgosQuery,
  useGetRiesgoByIdQuery,
  useCreateRiesgoMutation,
  useUpdateRiesgoMutation,
  useDeleteRiesgoMutation,
  // Evaluaciones
  useGetEvaluacionesByRiesgoQuery,
  useGetEvaluacionByIdQuery,
  useCreateEvaluacionMutation,
  // Priorizaciones
  useGetPriorizacionesQuery,
  useCreatePriorizacionMutation,
  // Dashboard
  useGetEstadisticasQuery,
  useGetRiesgosRecientesQuery,
  useGetPuntosMapaQuery,
  // Causas
  useGetCausasQuery,
  useGetCausasByRiesgoQuery,
  useCreateCausaMutation,
  // Controles
  useGetControlesQuery,
  useGetControlesByCausaQuery,
  useCreateControlMutation,
  useUpdateControlMutation,
  // Planes de Acción
  useGetPlanesAccionQuery,
  useCreatePlanAccionMutation,
  useUpdatePlanAccionMutation,
  // Acciones del Plan
  useGetAccionesPlanQuery,
  useCreateAccionPlanMutation,
  // Tareas
  useGetTareasQuery,
  useCreateTareaMutation,
  useUpdateTareaMutation,
  // Notificaciones
  useGetNotificacionesQuery,
  useCreateNotificacionMutation,
  useUpdateNotificacionMutation,
  // Observaciones
  useGetObservacionesQuery,
  useCreateObservacionMutation,
  useUpdateObservacionMutation,
  // Historial
  useGetHistorialQuery,
  useCreateHistorialMutation,
  // Pasos del Proceso
  useGetPasosProcesoQuery,
  useCreatePasoProcesoMutation,
  useUpdatePasoProcesoMutation,
  useDeletePasoProcesoMutation,
  // Encuestas
  useGetEncuestasQuery,
  useGetEncuestaByIdQuery,
  useCreateEncuestaMutation,
  useUpdateEncuestaMutation,
  useDeleteEncuestaMutation,
  // Preguntas Encuesta
  useGetPreguntasEncuestaQuery,
  useCreatePreguntaEncuestaMutation,
  useUpdatePreguntaEncuestaMutation,
  useDeletePreguntaEncuestaMutation,
  // Listas de Valores
  useGetListasValoresQuery,
  useGetListaValoresByIdQuery,
  useUpdateListaValoresMutation,
  // Parámetros de Valoración
  useGetParametrosValoracionQuery,
  useGetParametroValoracionByIdQuery,
  useUpdateParametroValoracionMutation,
  // Tipologías
  useGetTipologiasQuery,
  useGetTipologiaByIdQuery,
  useCreateTipologiaMutation,
  useUpdateTipologiaMutation,
  useDeleteTipologiaMutation,
  // Fórmulas
  useGetFormulasQuery,
  useGetFormulaByIdQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useDeleteFormulaMutation,
  // Configuraciones
  useGetConfiguracionesQuery,
  useUpdateConfiguracionMutation,
  // Catálogos de Identificación
  useGetTiposRiesgosQuery,
  useUpdateTiposRiesgosMutation,
  useGetObjetivosQuery,
  useUpdateObjetivosMutation,
  useGetFrecuenciasQuery,
  useUpdateFrecuenciasMutation,
  useGetFuentesQuery,
  useUpdateFuentesMutation,
  useGetImpactosQuery,
  useUpdateImpactosMutation,
  useGetOrigenesQuery,
  useGetTiposProcesoQuery,
  useGetConsecuenciasQuery,
  useGetNivelesRiesgoQuery,
  useGetClasificacionesRiesgoQuery,
  // Map Config
  useGetMapaConfigQuery,
  useUpdateMapaConfigMutation,
  useGetEjesMapaQuery,
  // Usuarios
  useGetUsuariosQuery,
  useGetUsuarioByIdQuery,
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
  useDeleteUsuarioMutation,
  // Personas
  useGetPersonasQuery,
} = riesgosApi;
