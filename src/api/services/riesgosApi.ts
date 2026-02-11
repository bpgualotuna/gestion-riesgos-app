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
} from '../../types';
import {
  getMockRiesgos,
  getAllRiesgos,
  saveRiesgos,
  getMockEvaluacionesByRiesgo,
  getMockEstadisticas,
  getMockRiesgosRecientes,
  getMockPuntosMapa,
  getMockPriorizaciones,
  createMockEvaluacion,
  createMockPriorizacion,
  getMockProcesos,
  getMockProcesoById,
  createMockProceso,
  updateMockProceso,
  deleteMockProceso,
  duplicateMockProceso,
} from './mockData';
import {
  getMockPasosProceso,
  createMockPasoProceso,
  updateMockPasoProceso,
  deleteMockPasoProceso,
  getMockEncuestas,
  getMockEncuestaById,
  createMockEncuesta,
  updateMockEncuesta,
  deleteMockEncuesta,
  getMockPreguntasEncuesta,
  createMockPreguntaEncuesta,
  updateMockPreguntaEncuesta,
  deleteMockPreguntaEncuesta,
  getMockListasValores,
  getMockListaValoresById,
  updateMockListaValores,
  getMockParametrosValoracion,
  getMockParametroValoracionById,
  updateMockParametroValoracion,
  getMockTipologias,
  getMockTipologiaById,
  createMockTipologia,
  updateMockTipologia,
  deleteMockTipologia,
  getMockFormulas,
  getMockFormulaById,
  createMockFormula,
  updateMockFormula,
  deleteMockFormula,
  getMockConfiguraciones,
  updateMockConfiguracion,
  getMockTiposRiesgos,
  updateMockTiposRiesgos,
  getMockObjetivos,
  updateMockObjetivos,
  getMockFrecuencias,
  getMockEjesMapa,
  updateMockFrecuencias,
  getMockFuentes,
  updateMockFuentes,
  getMockImpactos,
  updateMockImpactos,
  getMockObservaciones,
  createMockObservacion,
  updateMockObservacion,
  getMockHistorial,
  createMockHistorial,
  getMockTareas,
  createMockTarea,
  updateMockTarea,
  getMockNotificaciones,
  createMockNotificacion,
  updateMockNotificacion,
  getMockOrigenes,
  getMockTiposProceso,
  getMockConsecuencias,
  getMockCausas,
  getMockMapaConfig,
  updateMockMapaConfig,
  getMockNivelesRiesgo,
} from './mockData';

// Check if we should use mock data (when JSON Server is not available)
// Usar solo datos mock, no JSON Server
// Check if we should use mock data (when JSON Server is not available)
// Si es true, usa mock. Si es false, usa API real.
const USE_MOCK_DATA = false;

const mockBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    // Add auth token if needed
    return headers;
  },
});

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 'Tarea', 'Notificacion', 'Observacion', 'Historial', 'PasoProceso', 'Encuesta', 'PreguntaEncuesta', 'ListaValores', 'ParametroValoracion', 'Tipologia', 'Formula', 'Configuracion', 'MapaConfig'],
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
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockPasosProceso() };
      },
      providesTags: ['PasoProceso'],
    }),

    createPasoProceso: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevoPaso = createMockPasoProceso(body);
        return { data: nuevoPaso };
      },
      invalidatesTags: ['PasoProceso'],
    }),

    updatePasoProceso: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizado = updateMockPasoProceso(id, body);
        if (!actualizado) {
          return { error: { status: 404, data: 'Paso no encontrado' } };
        }
        return { data: actualizado };
      },
      invalidatesTags: ['PasoProceso'],
    }),

    deletePasoProceso: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockPasoProceso(id);
        return { data: undefined };
      },
      invalidatesTags: ['PasoProceso'],
    }),

    // ============================================
    // ENCUESTAS
    // ============================================
    getEncuestas: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockEncuestas() };
      },
      providesTags: ['Encuesta'],
    }),

    getEncuestaById: builder.query<any, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const encuesta = getMockEncuestaById(id);
        if (!encuesta) {
          return { error: { status: 404, data: 'Encuesta no encontrada' } };
        }
        return { data: encuesta };
      },
      providesTags: (_result, _error, id) => [{ type: 'Encuesta', id }],
    }),

    createEncuesta: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaEncuesta = createMockEncuesta(body);
        return { data: nuevaEncuesta };
      },
      invalidatesTags: ['Encuesta'],
    }),

    updateEncuesta: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockEncuesta(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Encuesta no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Encuesta'],
    }),

    deleteEncuesta: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockEncuesta(id);
        return { data: undefined };
      },
      invalidatesTags: ['Encuesta'],
    }),

    // ============================================
    // PREGUNTAS DE ENCUESTA
    // ============================================
    getPreguntasEncuesta: builder.query<any[], string>({
      queryFn: async (encuestaId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockPreguntasEncuesta(encuestaId) };
      },
      providesTags: ['PreguntaEncuesta'],
    }),

    createPreguntaEncuesta: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaPregunta = createMockPreguntaEncuesta(body);
        return { data: nuevaPregunta };
      },
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    updatePreguntaEncuesta: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockPreguntaEncuesta(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Pregunta no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['PreguntaEncuesta'],
    }),

    deletePreguntaEncuesta: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockPreguntaEncuesta(id);
        return { data: undefined };
      },
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
    // CONFIGURACIÓN DE IDENTIFICACIÓN Y CALIFICACIÓN
    // ============================================
    getTiposRiesgos: builder.query<any[], void>({
      query: () => 'catalogos/tipologias',
      providesTags: ['Configuracion'],
    }),

    updateTiposRiesgos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/tipologias',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getObjetivos: builder.query<any[], void>({
      query: () => 'catalogos/objetivos',
      providesTags: ['Configuracion'],
    }),

    updateObjetivos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/objetivos',
        method: 'PUT',
        body: data
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

    getImpactos: builder.query<ImpactoDescripcion[], void>({
      query: () => 'catalogos/impactos',
      providesTags: ['Configuracion'],
    }),

    updateImpactos: builder.mutation<any[], any[]>({
      query: (data) => ({
        url: 'catalogos/impactos',
        method: 'PUT',
        body: data
      }),
      invalidatesTags: ['Configuracion'],
    }),

    getOrigenes: builder.query<any[], void>({
      query: () => 'catalogos/origenes',
      providesTags: ['Configuracion'],
    }),

    getTiposProceso: builder.query<any[], void>({
      query: () => 'catalogos/tipos-proceso',
      providesTags: ['Configuracion'],
    }),

    getConsecuencias: builder.query<any[], void>({
      query: () => 'catalogos/consecuencias',
      providesTags: ['Configuracion'],
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
  // Dashboard
  useGetEstadisticasQuery,
  useGetRiesgosRecientesQuery,
  useGetPuntosMapaQuery,
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
  // Configuración de Identificación y Calificación
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
  useGetCausasQuery,
  useGetMapaConfigQuery,
  useUpdateMapaConfigMutation,
  useGetNivelesRiesgoQuery,
  useGetClasificacionesRiesgoQuery,
  useGetEjesMapaQuery,
} = riesgosApi;
