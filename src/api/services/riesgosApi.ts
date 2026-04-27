/**
 * RTK Query API for Risk Management
 * All endpoints connect directly to the backend API
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, AUTH_TOKEN_KEY, CLASIFICACION_RIESGO } from '../../utils/constants';
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
  ConfigResidualEstrategicaResponse,
  StrategicEngineConfigDto,
  Causa,
  ImpactoDescripcion,
  ImpactoTipo,
} from '../../types';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: 15000,
  prepareHeaders: (headers) => {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
  credentials: 'include',
});

const baseQuery = async (args: any, api: any, extraOptions: any) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
  }
  return result;
};

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery,
  tagTypes: ['Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 'Tarea', 'Notificacion', 'Observacion', 'Historial', 'PasoProceso', 'Encuesta', 'PreguntaEncuesta', 'ListaValores', 'ParametroValoracion', 'Tipologia', 'Formula', 'Configuracion', 'ReglaResidualPlanCausa', 'ConfigResidualEstrategica', 'MapaConfig', 'Usuario', 'Role', 'Cargo', 'Gerencia', 'Area', 'Incidencia', 'PlanAccion', 'Control', 'Causa', 'CalificacionInherente', 'PuntosMapa'],
  // Caché: menos refetch y respuestas más ágiles; backend devuelve solo campos necesarios
  keepUnusedDataFor: 120,
  refetchOnMountOrArgChange: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    // ============================================
    // PROCESOS
    // ============================================
    getProcesos: builder.query<Proceso[], void>({
      query: () => 'procesos',
      providesTags: ['Proceso'],
      keepUnusedDataFor: 300,
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

    getConfigResidualEstrategica: builder.query<ConfigResidualEstrategicaResponse, void>({
      query: () => 'configuracion-residual-estrategica',
      providesTags: ['ConfigResidualEstrategica'],
    }),

    updateConfigResidualEstrategica: builder.mutation<
      ConfigResidualEstrategicaResponse,
      StrategicEngineConfigDto
    >({
      query: (config) => ({
        url: 'configuracion-residual-estrategica',
        method: 'PUT',
        body: { config },
      }),
      invalidatesTags: [
        'ConfigResidualEstrategica',
        'Proceso',
        'Riesgo',
        'Evaluacion',
        'PuntosMapa',
        'Estadisticas',
      ],
    }),

    recalcularResidualEstrategico: builder.mutation<{ procesados: number; errores: string[] }, void>({
      query: () => ({
        url: 'configuracion-residual-estrategica/recalcular',
        method: 'POST',
      }),
      invalidatesTags: ['Riesgo', 'Evaluacion', 'Proceso', 'PuntosMapa'],
    }),

    // Responsables múltiples por proceso
    getResponsablesByProceso: builder.query<any[], string>({
      query: (procesoId) => `procesos/${procesoId}/responsables`,
      providesTags: (_result, _error, procesoId) => [{ type: 'Proceso', id: procesoId }, 'Proceso'],
    }),

    addResponsableToProceso: builder.mutation<any, { procesoId: string; usuarioId: number }>({
      query: ({ procesoId, usuarioId }) => ({
        url: `procesos/${procesoId}/responsables`,
        method: 'POST',
        body: { usuarioId },
      }),
      invalidatesTags: (_result, _error, { procesoId }) => [{ type: 'Proceso', id: procesoId }, 'Proceso'],
    }),

    removeResponsableFromProceso: builder.mutation<void, { procesoId: string; usuarioId: number }>({
      query: ({ procesoId, usuarioId }) => ({
        url: `procesos/${procesoId}/responsables/${usuarioId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { procesoId }) => [{ type: 'Proceso', id: procesoId }, 'Proceso'],
    }),

    updateResponsablesProceso: builder.mutation<any[], { procesoId: string; responsablesIds?: number[]; responsables?: Array<{ usuarioId: number; modo?: 'dueño' | 'supervisor' | null }> }>({
      query: ({ procesoId, responsablesIds, responsables }) => ({
        url: `procesos/${procesoId}/responsables`,
        method: 'PUT',
        body: responsables ? { responsables } : { responsablesIds },
      }),
      invalidatesTags: (_result, _error, { procesoId }) => [{ type: 'Proceso', id: procesoId }, 'Proceso'],
    }),

    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<PaginatedResponse<Riesgo>, (FiltrosRiesgo & { page?: number; pageSize?: number }) | undefined>({
      query: (params) => {
        const p = params ?? {};
        const includeCausasReq = Boolean((p as { includeCausas?: boolean }).includeCausas);
        const maxPage = includeCausasReq ? 500 : 100;
        const raw: Record<string, unknown> = {
          procesoId: p.procesoId,
          clasificacion: p.clasificacion && p.clasificacion !== 'all' ? p.clasificacion : undefined,
          busqueda: p.busqueda,
          zona: p.zona,
          includeCausas: (p as any).includeCausas,
          page: p.page != null && Number(p.page) >= 1 ? Number(p.page) : 1,
          pageSize: p.pageSize != null && Number(p.pageSize) >= 1 ? Math.min(maxPage, Number(p.pageSize)) : 50,
        };
        const paramsClean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== null));
        return { url: 'riesgos', params: paramsClean };
      },
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      query: (id) => `riesgos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    getNextNumeroRiesgo: builder.query<{ nextNumero: number }, number | string>({
      query: (procesoId) => ({ url: 'riesgos/next-numero', params: { procesoId } }),
      providesTags: ['Riesgo'],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      query: (body) => ({
        url: 'riesgos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Riesgo', 'Evaluacion', 'PuntosMapa', 'Estadisticas'],
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
        'Evaluacion',
        'PuntosMapa',
        'Estadisticas',
      ],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      query: (id) => ({
        url: `riesgos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Riesgo', 'Evaluacion', 'PuntosMapa', 'Estadisticas'],
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
      invalidatesTags: ['Causa', 'Riesgo', 'Evaluacion', 'PuntosMapa'],
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
      query: (params) => {
        const p = params ?? {};
        const clasificacion =
          p.clasificacion && p.clasificacion !== 'all'
            ? p.clasificacion
            : CLASIFICACION_RIESGO.NEGATIVA;
        const raw: Record<string, unknown> = {
          procesoId: p.procesoId,
          clasificacion,
        };
        const paramsClean = Object.fromEntries(
          Object.entries(raw).filter(([, v]) => v !== undefined && v !== null)
        );
        return { url: 'riesgos/mapa', params: paramsClean };
      },
      providesTags: ['Riesgo', 'Evaluacion', 'PuntosMapa'],
      keepUnusedDataFor: 180,
    }),

    // ============================================
    // INCIDENCIAS
    // ============================================
    getIncidencias: builder.query<any[], { procesoId?: string | number; riesgoId?: string | number }>({
      query: (params) => {
        const raw = { procesoId: params?.procesoId, riesgoId: params?.riesgoId };
        const paramsClean = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== undefined && v !== null));
        return { url: 'incidencias', params: paramsClean };
      },
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
    getPlanes: builder.query<
      { data: any[]; total: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean },
      { page?: number; pageSize?: number } | void
    >({
      query: (params) => ({
        url: 'planes-accion',
        params: params && typeof params === 'object' && !Array.isArray(params)
          ? { page: params.page ?? 1, pageSize: params.pageSize ?? 20 }
          : { page: 1, pageSize: 20 },
      }),
      providesTags: ['PlanAccion'],
    }),
    getPlanesByRiesgo: builder.query<
      { data: any[]; total: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean },
      { riesgoId: number | string; page?: number; pageSize?: number }
    >({
      query: ({ riesgoId, page = 1, pageSize = 20 }) => ({
        url: `planes-accion/riesgo/${riesgoId}`,
        params: { page, pageSize },
      }),
      providesTags: ['PlanAccion'],
    }),

    getPlanesByIncidencia: builder.query<
      { data: any[]; total: number; page: number; pageSize: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean },
      { incidenciaId: number | string; page?: number; pageSize?: number }
    >({
      query: ({ incidenciaId, page = 1, pageSize = 20 }) => ({
        url: `planes-accion/incidencia/${incidenciaId}`,
        params: { page, pageSize },
      }),
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
    // HISTORIAL / AUDITORÍA
    // ============================================
    getHistorial: builder.query<any[], string>({
      query: (params) => ({
        url: 'audit/logs',
        params: params ? JSON.parse(params) : {}
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

    /** Flags UI: true = campo editable; false = bloqueado (panel admin). */
    getCamposHabilitacionUi: builder.query<Record<string, boolean>, void>({
      query: () => 'catalogos/campos-habilitacion-ui',
      providesTags: ['Configuracion'],
      keepUnusedDataFor: 120,
    }),

    updateCamposHabilitacionUi: builder.mutation<
      Record<string, boolean>,
      Record<string, boolean>
    >({
      query: (body) => ({
        url: 'catalogos/campos-habilitacion-ui',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Configuracion'],
    }),

    /** Regla: si hay plan de acción en alguna causa, residual = inherente (no mitigación por controles). */
    getReglaResidualPlanCausa: builder.query<{ activa: boolean }, void>({
      query: () => 'catalogos/regla-residual-plan-causa',
      providesTags: ['Configuracion', 'ReglaResidualPlanCausa'],
      keepUnusedDataFor: 120,
    }),

    updateReglaResidualPlanCausa: builder.mutation<{ activa: boolean }, { activa: boolean }>({
      query: (body) => ({
        url: 'catalogos/regla-residual-plan-causa',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Configuracion', 'ReglaResidualPlanCausa'],
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
      query: () => 'catalogos/mapa-config',
      transformResponse: (response: any) => response,
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
      query: () => 'catalogos/niveles-riesgo',
      transformResponse: (response: any) => response,
      providesTags: ['Configuracion'],
    }),

    // ============================================
    // MAP CONFIGURATION
    // ============================================
    getEjesMapa: builder.query<{ probabilidad: any[], impacto: any[] }, void>({
      query: () => 'catalogos/ejes-mapa',
      transformResponse: (response: any) => response,
      providesTags: ['Configuracion'],
    }),

    updateMapaConfig: builder.mutation<any, { type: 'inherente' | 'residual' | 'tolerancia'; data: any }>({
      query: ({ type, data }) => ({
        url: 'catalogos/mapa-config',
        method: 'PUT',
        body: { type, data }
      }),
      transformResponse: (response: any) => response,
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
    // ROLES
    // ============================================
    getRoles: builder.query<any[], void>({
      query: () => 'roles',
      providesTags: ['Role'],
    }),

    getRoleById: builder.query<any, string>({
      query: (id) => `roles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),

    createRole: builder.mutation<any, any>({
      query: (body) => ({
        url: 'roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Role'],
    }),

    updateRole: builder.mutation<any, any & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `roles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Role', id }, 'Role'],
    }),

    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
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

    getPesosImpacto: builder.query<any[], void>({
      query: () => 'catalogos/pesos-impacto',
      providesTags: ['Configuracion'],
    }),

    updatePesosImpacto: builder.mutation<any[], any[]>({
      query: (pesos) => ({
        url: 'catalogos/pesos-impacto',
        method: 'PUT',
        body: { pesos },
      }),
      invalidatesTags: ['Configuracion'],
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

    // ============================================
    // CALIFICACIÓN INHERENTE
    // ============================================
    getCalificacionInherenteActiva: builder.query<any, void>({
      query: () => 'calificacion-inherente/activa',
      providesTags: ['CalificacionInherente'],
    }),

    getAllCalificacionInherente: builder.query<any[], void>({
      query: () => 'calificacion-inherente',
      providesTags: ['CalificacionInherente'],
    }),

    getCalificacionInherenteById: builder.query<any, string | number>({
      query: (id) => `calificacion-inherente/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'CalificacionInherente', id }],
    }),

    createCalificacionInherente: builder.mutation<any, any>({
      query: (body) => ({
        url: 'calificacion-inherente',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CalificacionInherente'],
    }),

    updateCalificacionInherente: builder.mutation<any, { id: string | number } & any>({
      query: ({ id, ...body }) => ({
        url: `calificacion-inherente/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'CalificacionInherente', id }, 'CalificacionInherente'],
    }),

    deleteCalificacionInherente: builder.mutation<void, string | number>({
      query: (id) => ({
        url: `calificacion-inherente/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CalificacionInherente'],
    }),

    calcularCalificacionInherente: builder.mutation<any, { frecuencia: number; calificacionGlobalImpacto: number }>({
      query: (body) => ({
        url: 'calificacion-inherente/calcular',
        method: 'POST',
        body,
      }),
    }),

    // ============================================
    // CONFIGURACIÓN RESIDUAL
    // ============================================
    getConfiguracionResidual: builder.query<any, void>({
      query: () => 'configuracion-residual',
      providesTags: ['Configuracion'],
    }),

    updateConfiguracionResidual: builder.mutation<any, { id: number } & any>({
      query: ({ id, ...body }) => ({
        url: `configuracion-residual/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Configuracion', 'Riesgo', 'Evaluacion', 'PuntosMapa', 'Estadisticas'],
    }),

    /** Recalcular clasificación residual de todos los controles ya registrados (sin guardar config). */
    recalcularClasificacionResidual: builder.mutation<
      { success: boolean; preview: boolean; resultado: { causasActualizadas: number; riesgosActualizados: number; errores: string[] } },
      { confirmacion?: boolean }
    >({
      query: (body = {}) => ({
        url: 'configuracion-residual/recalcular',
        method: 'POST',
        body: { confirmacion: true, ...body },
      }),
      invalidatesTags: ['Configuracion', 'Riesgo', 'Evaluacion', 'PuntosMapa', 'Estadisticas'],
    }),

    // ============================================
    // REUNIONES Y ASISTENTES
    // ============================================
    getAsistentesProceso: builder.query<any[], string>({
      query: (procesoId) => `procesos/${procesoId}/asistentes`,
      providesTags: (_result, _error, procesoId) => [{ type: 'Proceso', id: procesoId }],
    }),

    asignarAsistentesProceso: builder.mutation<any[], { procesoId: string; usuariosIds: number[] }>({
      query: ({ procesoId, usuariosIds }) => ({
        url: `procesos/${procesoId}/asistentes`,
        method: 'POST',
        body: { usuariosIds },
      }),
      invalidatesTags: (_result, _error, { procesoId }) => [{ type: 'Proceso', id: procesoId }],
    }),

    getReuniones: builder.query<any[], string>({
      query: (procesoId) => `procesos/${procesoId}/reuniones`,
      providesTags: (_result, _error, procesoId) => [{ type: 'Proceso', id: procesoId }],
    }),

    crearReunion: builder.mutation<any, { procesoId: string; fecha: string; descripcion: string; estado: string }>({
      query: ({ procesoId, ...body }) => ({
        url: `procesos/${procesoId}/reuniones`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { procesoId }) => [{ type: 'Proceso', id: procesoId }],
    }),

    actualizarReunion: builder.mutation<any, { id: number; fecha?: string; descripcion?: string; estado?: string }>({
      query: ({ id, ...body }) => ({
        url: `reuniones/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Proceso'],
    }),

    eliminarReunion: builder.mutation<void, number>({
      query: (id) => ({
        url: `reuniones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Proceso'],
    }),

    getAsistencias: builder.query<any[], number>({
      query: (reunionId) => `reuniones/${reunionId}/asistencias`,
      providesTags: ['Proceso'],
    }),

    actualizarAsistencias: builder.mutation<any[], { reunionId: number; asistencias: Array<{ id: number; asistio: boolean }> }>({
      query: ({ reunionId, asistencias }) => ({
        url: `reuniones/${reunionId}/asistencias`,
        method: 'PUT',
        body: { asistencias },
      }),
      invalidatesTags: ['Proceso'],
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
  useGetConfigResidualEstrategicaQuery,
  useUpdateConfigResidualEstrategicaMutation,
  useRecalcularResidualEstrategicoMutation,
  useGetResponsablesByProcesoQuery,
  useAddResponsableToProcesoMutation,
  useRemoveResponsableFromProcesoMutation,
  useUpdateResponsablesProcesoMutation,
  // Riesgos
  useGetRiesgosQuery,
  useGetRiesgoByIdQuery,
  useLazyGetNextNumeroRiesgoQuery,
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
  useGetCamposHabilitacionUiQuery,
  useUpdateCamposHabilitacionUiMutation,
  useGetReglaResidualPlanCausaQuery,
  useUpdateReglaResidualPlanCausaMutation,
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
  // Usuarios
  useGetUsuariosQuery,
  useCreateUsuarioMutation,
  useUpdateUsuarioMutation,
  useDeleteUsuarioMutation,
  // Roles
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
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
  // Pesos de Impacto
  useGetPesosImpactoQuery,
  useUpdatePesosImpactoMutation,
  // Areas
  useGetAreasQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useDeleteAreaMutation,
  // Calificación Inherente
  useGetCalificacionInherenteActivaQuery,
  useGetAllCalificacionInherenteQuery,
  useGetCalificacionInherenteByIdQuery,
  useCreateCalificacionInherenteMutation,
  useUpdateCalificacionInherenteMutation,
  useDeleteCalificacionInherenteMutation,
  useCalcularCalificacionInherenteMutation,
  // Configuración Residual
  useGetConfiguracionResidualQuery,
  useUpdateConfiguracionResidualMutation,
  useRecalcularClasificacionResidualMutation,
  // Reuniones y Asistentes
  useGetAsistentesProcesoQuery,
  useAsignarAsistentesProcesoMutation,
  useGetReunionesQuery,
  useCrearReunionMutation,
  useActualizarReunionMutation,
  useEliminarReunionMutation,
  useGetAsistenciasQuery,
  useActualizarAsistenciasMutation,
} = riesgosApi;

// Alias para compatibilidad con código existente
export const useGetTiposRiesgosQuery = useGetTipologiasQuery;
