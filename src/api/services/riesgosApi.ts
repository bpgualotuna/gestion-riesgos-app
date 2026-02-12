/**
 * RTK Query API for Risk Management
 * Uses mock data when backend is not available
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
  CreateNotificacionDto,
  UpdateNotificacionDto,
  Causa,
  ImpactoDescripcion,
  ImpactoTipo,
} from '../../types';
// Mock data completely removed as per user request.
// All endpoints must now connect to the backend.

// Check if we should use mock data (when JSON Server is not available)
// Usar solo datos mock, no JSON Server
// Check if we should use mock data (when JSON Server is not available)
// Si es true, usa mock. Si es false, usa API real.
const USE_MOCK_DATA = false;

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    // Add auth token if needed
    return headers;
  },
});

const baseQueryWithLogging = async (args: any, api: any, extraOptions: any) => {
  console.log('[FRONTEND] Request:', args);
  const result = await baseQuery(args, api, extraOptions);
  if (result.error) {
    console.error('[FRONTEND] Error Response:', result.error);
  } else {
    console.log('[FRONTEND] Success Response:', result.data);
  }
  return result;
};

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery: baseQueryWithLogging,
  tagTypes: ['Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 'Tarea', 'Notificacion', 'Observacion', 'Historial', 'PasoProceso', 'Encuesta', 'PreguntaEncuesta', 'ListaValores', 'ParametroValoracion', 'Tipologia', 'Formula', 'Configuracion', 'MapaConfig', 'Usuario', 'Cargo', 'Gerencia', 'Area', 'Incidencia', 'PlanAccion', 'Control', 'Causa'],
  endpoints: (builder) => ({
    // ============================================
    // PROCESOS
    // ============================================
    getProcesos: builder.query<Proceso[], void>({
      query: () => 'procesos',
      providesTags: ['Proceso'],
    }),

    getProcesoById: builder.query<Proceso, string>({
      query: (id) => `procesos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Proceso', id }],
    }),

    createProceso: builder.mutation<Proceso, CreateProcesoDto>({
      query: (body) => ({
        url: 'procesos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Proceso'],
    }),

    updateProceso: builder.mutation<Proceso, UpdateProcesoDto & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `procesos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proceso', id }, 'Proceso'],
    }),

    deleteProceso: builder.mutation<void, string>({
      query: (id) => ({
        url: `procesos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Proceso'],
    }),

    duplicateProceso: builder.mutation<Proceso, { id: string; overrides?: Partial<CreateProcesoDto & { año?: number; areaNombre?: string }> }>({
      query: ({ id, overrides }) => ({
        url: `procesos/${id}/duplicate`,
        method: 'POST',
        body: { overrides }
      }),
      invalidatesTags: ['Proceso'],
    }),

    bulkUpdateProcesos: builder.mutation<Proceso[], Proceso[]>({
      query: (procesos) => ({
        url: 'procesos/bulk',
        method: 'PUT',
        body: procesos
      }),
      invalidatesTags: ['Proceso'],
    }),

    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<PaginatedResponse<Riesgo>, FiltrosRiesgo & { page?: number; pageSize?: number }>({
      query: (params) => ({
        url: 'riesgos',
        params: {
          procesoId: params.procesoId,
          clasificacion: params.clasificacion && params.clasificacion !== 'all' ? params.clasificacion : undefined,
          busqueda: params.busqueda,
          zona: params.zona,
          includeCausas: (params as any).includeCausas,
          page: params.page,
          pageSize: params.pageSize,
        }
      }),
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      query: (id) => `riesgos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      query: (body) => ({
        url: 'riesgos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    updateRiesgo: builder.mutation<Riesgo, UpdateRiesgoDto & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `riesgos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Riesgo', id },
        'Riesgo',
        'Estadisticas',
      ],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      query: (id) => ({
        url: `riesgos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    // ============================================
    // EVALUACIONES
    // ============================================
    getEvaluacionesByRiesgo: builder.query<EvaluacionRiesgo[], string>({
      query: (riesgoId) => `evaluaciones/riesgo/${riesgoId}`,
      providesTags: (_result, _error, riesgoId) => [{ type: 'Evaluacion', id: riesgoId }],
    }),

    getEvaluacionById: builder.query<EvaluacionRiesgo, string>({
      query: (id) => `evaluaciones/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Evaluacion', id }],
    }),

    createEvaluacion: builder.mutation<EvaluacionRiesgo, CreateEvaluacionDto>({
      query: (body) => ({
        url: 'evaluaciones',
        method: 'POST',
        body,
      }),
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
      query: () => 'priorizaciones',
      providesTags: ['Priorizacion'],
    }),

    createPriorizacion: builder.mutation<PriorizacionRiesgo, CreatePriorizacionDto>({
      query: (body) => ({
        url: 'priorizaciones',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Priorizacion'],
    }),

    updateCausa: builder.mutation<any, { id: number | string; tipoGestion?: string; gestion?: any }>({
      query: ({ id, ...body }) => ({
        url: `riesgos/causas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Causa', 'Riesgo'],
    }),

    // ============================================
    // DASHBOARD & ESTADÍSTICAS
    // ============================================
    getEstadisticas: builder.query<EstadisticasRiesgo, string | undefined>({
      query: (procesoId) => ({
        url: 'riesgos/estadisticas',
        params: { procesoId }
      }),
      providesTags: ['Estadisticas'],
    }),

    getRiesgosRecientes: builder.query<RiesgoReciente[], number>({
      query: (limit) => ({
        url: 'riesgos/recientes',
        params: { limit }
      }),
      providesTags: ['Riesgo'],
    }),

    // ============================================
    // MAPA DE RIESGOS
    // ============================================
    getPuntosMapa: builder.query<PuntoMapa[], FiltrosRiesgo>({
      query: (params) => ({
        url: 'riesgos/mapa',
        params
      }),
      providesTags: ['Riesgo', 'Evaluacion'],
    }),

    // ============================================
    // INCIDENCIAS
    // ============================================
    getIncidencias: builder.query<any[], { procesoId?: string | number; riesgoId?: string | number }>({
      query: (params) => ({
        url: 'incidencias',
        params: {
          procesoId: params?.procesoId,
          riesgoId: params?.riesgoId,
        }
      }),
      providesTags: ['Incidencia'],
    }),

    createIncidencia: builder.mutation<any, any>({
      query: (body) => ({
        url: 'incidencias',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Incidencia'],
    }),

    updateIncidencia: builder.mutation<any, { id: number | string } & any>({
      query: ({ id, ...body }) => ({
        url: `incidencias/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Incidencia'],
    }),

    deleteIncidencia: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `incidencias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Incidencia'],
    }),

    getIncidenciasEstadisticas: builder.query<any, { procesoId?: string | number; riesgoId?: string | number } | void>({
      query: (params) => ({
        url: 'incidencias/estadisticas',
        params: {
          procesoId: params ? (params as any).procesoId : undefined,
          riesgoId: params ? (params as any).riesgoId : undefined,
        }
      }),
      providesTags: ['Incidencia'],
    }),

    // ============================================
    // PLANES DE ACCIÓN
    // ============================================
    getPlanes: builder.query<any[], void>({
      query: () => 'planes-accion',
      providesTags: ['PlanAccion'],
    }),
    getPlanesByRiesgo: builder.query<any[], number | string>({
      query: (riesgoId) => `planes-accion/riesgo/${riesgoId}`,
      providesTags: ['PlanAccion'],
    }),

    getPlanesByIncidencia: builder.query<any[], number | string>({
      query: (incidenciaId) => `planes-accion/incidencia/${incidenciaId}`,
      providesTags: ['PlanAccion'],
    }),

    getPlanesEstadisticas: builder.query<any, void>({
      query: () => 'planes-accion/estadisticas',
      providesTags: ['PlanAccion'],
    }),

    createPlanAccion: builder.mutation<any, any>({
      query: (body) => ({
        url: body?.riesgoId
          ? `planes-accion/riesgo/${body.riesgoId}`
          : `planes-accion/incidencia/${body.incidenciaId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PlanAccion'],
    }),

    updatePlanAccion: builder.mutation<any, { id: number | string } & any>({
      query: ({ id, ...body }) => ({
        url: `planes-accion/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PlanAccion'],
    }),

    deletePlanAccion: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `planes-accion/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlanAccion'],
    }),

    // ============================================
    // CONTROLES
    // ============================================
    getControlesByRiesgo: builder.query<any[], number | string>({
      query: (riesgoId) => `controles/riesgo/${riesgoId}`,
      providesTags: ['Control'],
    }),

    createControl: builder.mutation<any, any>({
      query: (body) => ({
        url: `controles/riesgo/${body.riesgoId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Control'],
    }),

    updateControl: builder.mutation<any, { id: number | string } & any>({
      query: ({ id, ...body }) => ({
        url: `controles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Control'],
    }),

    deleteControl: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `controles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Control'],
    }),

    // ============================================
    // OBSERVACIONES
    // ============================================
    getObservaciones: builder.query<any[], string>({
      query: (procesoId) => ({
        url: 'utilidades/observaciones',
        params: { procesoId }
      }),
      providesTags: ['Observacion'],
    }),

    createObservacion: builder.mutation<any, any>({
      query: (body) => ({
        url: 'utilidades/observaciones',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Observacion'],
    }),

    updateObservacion: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `utilidades/observaciones/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Observacion'],
    }),

    // ============================================
    // HISTORIAL
    // ============================================
    getHistorial: builder.query<any[], string>({
      query: (procesoId) => ({
        url: 'utilidades/historial',
        params: { procesoId }
      }),
      providesTags: ['Historial'],
    }),

    createHistorial: builder.mutation<any, any>({
      query: (body) => ({
        url: 'utilidades/historial',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Historial'],
    }),

    // ============================================
    // TAREAS
    // ============================================
    getTareas: builder.query<any[], void>({
      query: () => 'utilidades/tareas',
      providesTags: ['Tarea'],
    }),

    createTarea: builder.mutation<any, any>({
      query: (body) => ({
        url: 'utilidades/tareas',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Tarea'],
    }),

    updateTarea: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `utilidades/tareas/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Tarea'],
    }),

    // ============================================
    // NOTIFICACIONES
    // ============================================
    getNotificaciones: builder.query<any[], void>({
      query: () => 'utilidades/notificaciones',
      providesTags: ['Notificacion'],
    }),

    createNotificacion: builder.mutation<any, any>({
      query: (body) => ({
        url: 'utilidades/notificaciones',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Notificacion'],
    }),

    updateNotificacion: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `utilidades/notificaciones/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Notificacion'],
    }),

    // ============================================
    // PASOS DEL PROCESO
    // ============================================
    getPasosProceso: builder.query<any[], void>({
      query: () => 'procesos/pasos',
      providesTags: ['PasoProceso'],
    }),

    createPasoProceso: builder.mutation<any, any>({
      query: (body) => ({
        url: 'procesos/pasos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    updatePasoProceso: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `procesos/pasos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    deletePasoProceso: builder.mutation<void, string>({
      query: (id) => ({
        url: `procesos/pasos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PasoProceso'],
    }),

    // ============================================
    // ENCUESTAS
    // ============================================
    getEncuestas: builder.query<any[], void>({
      query: () => 'procesos/encuestas',
      providesTags: ['Encuesta'],
    }),

    getEncuestaById: builder.query<any, string>({
      query: (id) => `procesos/encuestas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Encuesta', id }],
    }),

    createEncuesta: builder.mutation<any, any>({
      query: (body) => ({
        url: 'procesos/encuestas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Encuesta'],
    }),

    updateEncuesta: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `procesos/encuestas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Encuesta'],
    }),

    deleteEncuesta: builder.mutation<void, string>({
      query: (id) => ({
        url: `procesos/encuestas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Encuesta'],
    }),

    // ============================================
    // PREGUNTAS DE ENCUESTA
    // ============================================
    getPreguntasEncuesta: builder.query<any[], string>({
      query: (encuestaId) => `procesos/encuestas/${encuestaId}/preguntas`,
      providesTags: ['PreguntaEncuesta'],
    }),

    createPreguntaEncuesta: builder.mutation<any, any>({
      query: (body) => ({
        url: 'procesos/encuestas/preguntas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    updatePreguntaEncuesta: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `procesos/encuestas/preguntas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['PreguntaEncuesta'],
    }),

    deletePreguntaEncuesta: builder.mutation<void, string>({
      query: (id) => ({
        url: `procesos/encuestas/preguntas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    // ============================================
    // LISTAS DE VALORES
    // ============================================
    getListasValores: builder.query<any[], void>({
      query: () => 'catalogos/listas-valores',
      providesTags: ['ListaValores'],
    }),

    getListaValoresById: builder.query<any, string>({
      query: (id) => `catalogos/listas-valores/${id}`,
      // Note: Backend endpoint for specific list value not implemented separately, 
      // but usually front filters or we need to add it. Keeping query style.
      providesTags: (_result, _error, id) => [{ type: 'ListaValores', id }],
    }),

    updateListaValores: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/listas-valores/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ListaValores'],
    }),

    // ============================================
    // PARÁMETROS DE VALORACIÓN
    // ============================================
    getParametrosValoracion: builder.query<any[], void>({
      // Not implemented in backend yet, keeping mock queryFn would be safer if mixed mode supported, 
      // but we switched USE_MOCK_DATA=false. 
      // I'll point to an endpoint that might return 404 or empty.
      query: () => 'catalogos/parametros-valoracion',
      providesTags: ['ParametroValoracion'],
    }),

    getParametroValoracionById: builder.query<any, string>({
      query: (id) => `catalogos/parametros-valoracion/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ParametroValoracion', id }],
    }),

    updateParametroValoracion: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/parametros-valoracion/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ParametroValoracion'],
    }),

    // ============================================
    // TIPOLOGÍAS
    // ============================================
    getTipologias: builder.query<any[], void>({
      query: () => 'catalogos/tipologias',
      providesTags: ['Tipologia'],
    }),

    getTipologiaById: builder.query<any, string>({
      query: (id) => `catalogos/tipologias/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Tipologia', id }],
    }),

    createTipologia: builder.mutation<any, any>({
      query: (body) => ({
        url: 'catalogos/tipologias',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Tipologia'],
    }),

    updateTipologia: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/tipologias/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Tipologia'],
    }),

    createSubtipo: builder.mutation<any, { tipoRiesgoId: number; nombre: string; descripcion?: string; codigo?: string }>({
      query: (body) => ({
        url: 'catalogos/subtipos',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Tipologia'],
    }),

    updateSubtipo: builder.mutation<any, { id: number; nombre?: string; descripcion?: string; codigo?: string }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/subtipos/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Tipologia'],
    }),

    deleteSubtipo: builder.mutation<void, number>({
      query: (id) => ({
        url: `catalogos/subtipos/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Tipologia'],
    }),

    deleteTipologia: builder.mutation<void, string>({
      query: (id) => ({
        url: `catalogos/tipologias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tipologia'],
    }),

    // ============================================
    // FÓRMULAS
    // ============================================
    getFormulas: builder.query<any[], void>({
      query: () => 'catalogos/formulas',
      providesTags: ['Formula'],
    }),

    getFormulaById: builder.query<any, string>({
      query: (id) => `catalogos/formulas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Formula', id }],
    }),

    createFormula: builder.mutation<any, any>({
      query: (body) => ({
        url: 'catalogos/formulas',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Formula'],
    }),

    updateFormula: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/formulas/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Formula'],
    }),

    deleteFormula: builder.mutation<void, string>({
      query: (id) => ({
        url: `catalogos/formulas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Formula'],
    }),

    // Configs and Objectives
    // Need to find where they are in file.

    // ============================================
    // CONFIGURACIONES
    // ============================================
    // ============================================
    // CONFIGURACIONES
    // ============================================
    getConfiguraciones: builder.query<any[], void>({
      query: () => 'catalogos/configuraciones',
      providesTags: ['Configuracion'],
    }),

    createConfiguracion: builder.mutation<any, { clave: string; valor: string; tipo: string; descripcion?: string }>({
      query: (body) => ({
        url: 'catalogos/configuraciones',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getMapaConfig: builder.query<any, void>({
      query: () => {
        console.log('🌐 API Call: GET catalogos/mapa-config');
        return 'catalogos/mapa-config';
      },
      transformResponse: (response: any) => {
        console.log('📥 API Response - getMapaConfig:', response);
        return response;
      },
      providesTags: ['MapaConfig'],
    }),

    updateConfiguracion: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/configuraciones/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Configuracion'],
    }),

    // ============================================
    // CONFIGURACIÓN DE IDENTIFICACIÓN Y CALIFICACIÓN (CONSOLIDADO)
    // ============================================

    getObjetivos: builder.query<any[], void>({
      query: () => 'catalogos/objetivos',
      providesTags: ['Configuracion'],
    }),

    createObjetivo: builder.mutation<any, any>({
      query: (body) => ({
        url: 'catalogos/objetivos',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Configuracion'],
    }),

    updateObjetivo: builder.mutation<any, { id: number;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `catalogos/objetivos/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['Configuracion'],
    }),

    deleteObjetivo: builder.mutation<void, number>({
      query: (id) => ({
        url: `catalogos/objetivos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getFrecuencias: builder.query<any[], void>({
      query: () => 'catalogos/frecuencias',
      providesTags: ['Configuracion'],
    }),

    updateFrecuencias: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/frecuencias',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getFuentes: builder.query<any[], void>({
      query: () => 'catalogos/fuentes',
      providesTags: ['Configuracion'],
    }),

    updateFuentes: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/fuentes',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getImpactos: builder.query<ImpactoTipo[], void>({
      query: () => 'catalogos/impactos',
      providesTags: ['Configuracion'],
    }),

    updateImpactos: builder.mutation<ImpactoTipo, { id: number; niveles: { nivel: number; descripcion: string }[] }>({
      query: ({ id, niveles }) => ({
        url: `catalogos/impactos/${id}`,
        method: 'PUT',
        body: { niveles }
      }),
      invalidatesTags: ['Configuracion'],
    }),

    createImpactoTipo: builder.mutation<ImpactoTipo, { clave: string; nombre: string }>({
      query: (body) => ({
        url: 'catalogos/impactos',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Configuracion'],
    }),

    deleteImpactoTipo: builder.mutation<void, number>({
      query: (id) => ({
        url: `catalogos/impactos/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getOrigenes: builder.query<any[], void>({
      query: () => 'catalogos/origenes',
      providesTags: ['Configuracion'],
    }),

    updateOrigenes: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/origenes',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getTiposProceso: builder.query<any[], void>({
      query: () => 'catalogos/tipos-proceso',
      providesTags: ['Configuracion'],
    }),

    getConsecuencias: builder.query<any[], void>({
      query: () => 'catalogos/consecuencias',
      providesTags: ['Configuracion'],
    }),

    updateConsecuencias: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/consecuencias',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getCausas: builder.query<Causa[], void>({
      query: () => 'riesgos/causas',
      providesTags: ['Configuracion'],
    }),

    getClasificacionesRiesgo: builder.query<any[], void>({
      query: () => 'catalogos/consecuencias',
      providesTags: ['Configuracion'],
    }),

    getNivelesRiesgo: builder.query<any[], void>({
      query: () => {
        console.log('🌐 API Call: GET catalogos/niveles-riesgo');
        return 'catalogos/niveles-riesgo';
      },
      transformResponse: (response: any) => {
        console.log('📥 API Response - getNivelesRiesgo:', response);
        return response;
      },
      providesTags: ['Configuracion'],
    }),

    // ============================================
    // BENCHMARKING
    // ============================================
    getBenchmarkingByProceso: builder.query<any[], number | string>({
      query: (procesoId) => `benchmarking/proceso/${procesoId}`,
      providesTags: ['Configuracion'],
    }),

    setBenchmarkingByProceso: builder.mutation<any[], { procesoId: number | string; items: any[] }>({
      query: ({ procesoId, items }) => ({
        url: `benchmarking/proceso/${procesoId}`,
        method: 'PUT',
        body: items,
      }),
      invalidatesTags: ['Configuracion'],
    }),

    deleteBenchmarkingItem: builder.mutation<void, number | string>({
      query: (id) => ({
        url: `benchmarking/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Configuracion'],
    }),

    // ============================================
    // MAP CONFIGURATION
    // ============================================
    getEjesMapa: builder.query<{ probabilidad: any[], impacto: any[] }, void>({
      query: () => {
        console.log('🌐 API Call: GET catalogos/ejes-mapa');
        return 'catalogos/ejes-mapa';
      },
      transformResponse: (response: any) => {
        console.log('📥 API Response - getEjesMapa:', response);
        return response;
      },
      providesTags: ['Configuracion'],
    }),

    updateMapaConfig: builder.mutation<any, { type: 'inherente' | 'residual' | 'tolerancia'; data: any }>({
      query: ({ type, data }) => {
        console.log('🌐 API Call: PUT catalogos/mapa-config');
        console.log('📤 Request body:', { type, data });
        return {
          url: 'catalogos/mapa-config',
          method: 'PUT',
          body: { type, data }
        };
      },
      transformResponse: (response: any) => {
        console.log('📥 API Response - updateMapaConfig:', response);
        return response;
      },
      invalidatesTags: ['MapaConfig'],
    }),
    // ============================================
    // USUARIOS
    // ============================================
    getUsuarios: builder.query<any[], void>({
      query: () => 'usuarios',
      providesTags: ['Usuario'],
    }),

    createUsuario: builder.mutation<any, any>({
      query: (body) => ({
        url: 'usuarios',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Usuario'],
    }),

    updateUsuario: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `usuarios/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Usuario'],
    }),

    deleteUsuario: builder.mutation<void, string>({
      query: (id) => ({
        url: `usuarios/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Usuario'],
    }),

    // ============================================
    // CARGOS
    // ============================================
    getCargos: builder.query<any[], void>({
      query: () => 'cargos',
      providesTags: ['Cargo'],
    }),

    createCargo: builder.mutation<any, any>({
      query: (body) => ({
        url: 'cargos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cargo'],
    }),

    updateCargo: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `cargos/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Cargo'],
    }),

    deleteCargo: builder.mutation<void, string>({
      query: (id) => ({
        url: `cargos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cargo'],
    }),

    // ============================================
    // GERENCIAS
    // ============================================
    getGerencias: builder.query<any[], void>({
      query: () => 'gerencias',
      providesTags: ['Gerencia'],
    }),

    createGerencia: builder.mutation<any, any>({
      query: (body) => ({
        url: 'gerencias',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Gerencia'],
    }),

    updateGerencia: builder.mutation<any, { id: string;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `gerencias/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Gerencia'],
    }),

    deleteGerencia: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `gerencias/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Gerencia'],
    }),

    getVicepresidencias: builder.query<any[], void>({
      query: () => 'catalogos/vicepresidencias',
      providesTags: ['Configuracion'],
    }),

    // Áreas
    getAreas: builder.query<any[], void>({
      query: () => 'areas',
      providesTags: ['Area'],
    }),

    createArea: builder.mutation<any, any>({
      query: (body) => ({
        url: 'areas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Area'],
    }),

    updateArea: builder.mutation<any, { id: string | number;[key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `areas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Area'],
    }),

    deleteArea: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `areas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Area'],
    }),
  }),
});

export const {
  // Procesos
  useGetProcesosQuery,
  useGetProcesoByIdQuery,
  useCreateProcesoMutation,
  useUpdateProcesoMutation,
  useDeleteProcesoMutation,
  useDuplicateProcesoMutation,
  useBulkUpdateProcesosMutation,
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
  // Causas
  useUpdateCausaMutation,
  // Dashboard
  useGetEstadisticasQuery,
  useGetRiesgosRecientesQuery,
  useGetPuntosMapaQuery,
  // Incidencias
  useGetIncidenciasQuery,
  useCreateIncidenciaMutation,
  useUpdateIncidenciaMutation,
  useDeleteIncidenciaMutation,
  useGetIncidenciasEstadisticasQuery,
  // Planes de accion
  useGetPlanesByRiesgoQuery,
  useGetPlanesByIncidenciaQuery,
  useGetPlanesQuery,
  useGetPlanesEstadisticasQuery,
  useCreatePlanAccionMutation,
  useUpdatePlanAccionMutation,
  useDeletePlanAccionMutation,
  // Controles
  useGetControlesByRiesgoQuery,
  useCreateControlMutation,
  useUpdateControlMutation,
  useDeleteControlMutation,
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
  useCreateSubtipoMutation,
  useUpdateSubtipoMutation,
  useDeleteSubtipoMutation,
  // Fórmulas
  useGetFormulasQuery,
  useGetFormulaByIdQuery,
  useCreateFormulaMutation,
  useUpdateFormulaMutation,
  useDeleteFormulaMutation,
  // Configuraciones
  useGetConfiguracionesQuery,
  useCreateConfiguracionMutation,
  useUpdateConfiguracionMutation,
  // Configuración de Identificación y Calificación
  useGetObjetivosQuery,
  useCreateObjetivoMutation,
  useUpdateObjetivoMutation,
  useDeleteObjetivoMutation,
  useGetFrecuenciasQuery,
  useUpdateFrecuenciasMutation,
  useGetFuentesQuery,
  useUpdateFuentesMutation,
  useGetImpactosQuery,
  useUpdateImpactosMutation,
  useCreateImpactoTipoMutation,
  useDeleteImpactoTipoMutation,
  useGetOrigenesQuery,
  useUpdateOrigenesMutation,
  useGetTiposProcesoQuery,
  useGetConsecuenciasQuery,
  useUpdateConsecuenciasMutation,
  useGetCausasQuery,
  useGetMapaConfigQuery,
  useUpdateMapaConfigMutation,
  useGetNivelesRiesgoQuery,
  useGetClasificacionesRiesgoQuery,
  useGetEjesMapaQuery,
  // Benchmarking
  useGetBenchmarkingByProcesoQuery,
  useSetBenchmarkingByProcesoMutation,
  useDeleteBenchmarkingItemMutation,
  // Usuarios
  useGetUsuariosQuery,
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
  useDeleteUsuarioMutation,
  // Cargos
  useGetCargosQuery,
  useCreateCargoMutation,
  useUpdateCargoMutation,
  useDeleteCargoMutation,
  // Gerencias
  useGetGerenciasQuery,
  useCreateGerenciaMutation,
  useUpdateGerenciaMutation,
  useDeleteGerenciaMutation,
  useGetVicepresidenciasQuery,
  // Areas
  useGetAreasQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useDeleteAreaMutation,
} = riesgosApi;

// Alias para compatibilidad con código existente
export const useGetTiposRiesgosQuery = useGetTipologiasQuery;
