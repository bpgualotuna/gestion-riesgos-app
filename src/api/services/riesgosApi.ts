/**
 * RTK Query API for Risk Management
 * Consumes real REST API at API_BASE_URL/api
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
  Area,
  Usuario,
} from '../../types';

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/api`,
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery,
  tagTypes: [
    'Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 'Tarea', 'Notificacion',
    'AsignacionesGerente',
    'Observacion', 'Historial', 'PasoProceso', 'Encuesta', 'PreguntaEncuesta', 'ListaValores',
    'ParametroValoracion', 'Tipologia', 'Formula', 'Configuracion', 'MapaConfig',
  ],
  endpoints: (builder) => ({
    // ============================================
    // PROCESOS
    // ============================================
    getProcesos: builder.query<Proceso[], void>({
      query: () => '/procesos',
      providesTags: ['Proceso'],
    }),

    getProcesoById: builder.query<Proceso, string>({
      query: (id) => `/procesos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Proceso', id }],
    }),

    createProceso: builder.mutation<Proceso, CreateProcesoDto>({
      query: (body) => ({ url: '/procesos', method: 'POST', body }),
      invalidatesTags: ['Proceso'],
    }),

    updateProceso: builder.mutation<Proceso, UpdateProcesoDto & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/procesos/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proceso', id }, 'Proceso'],
    }),

    deleteProceso: builder.mutation<void, string>({
      query: (id) => ({ url: `/procesos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Proceso'],
    }),

    duplicateProceso: builder.mutation<Proceso, { id: string; overrides?: Partial<CreateProcesoDto & { año?: number; areaNombre?: string }> }>({
      query: ({ id, overrides }) => ({ url: `/procesos/${id}/duplicate`, method: 'POST', body: overrides ?? {} }),
      invalidatesTags: ['Proceso'],
    }),

    bulkUpdateProcesos: builder.mutation<Proceso[], Proceso[]>({
      query: (procesos) => ({ url: '/procesos/bulk', method: 'PUT', body: procesos }),
      invalidatesTags: ['Proceso'],
    }),

    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<
      PaginatedResponse<Riesgo>,
      (FiltrosRiesgo & { page?: number; pageSize?: number }) | void
    >({
      query: (params = {}) => ({
        url: '/riesgos',
        params: {
          procesoId: params.procesoId,
          clasificacion: params.clasificacion && params.clasificacion !== 'all' ? params.clasificacion : undefined,
          busqueda: params.busqueda,
          zona: params.zona,
          page: params.page,
          pageSize: params.pageSize,
        },
      }),
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      query: (id) => `/riesgos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    getRiesgosRecientes: builder.query<RiesgoReciente[], number | void>({
      query: (limit = 10) => ({ url: '/riesgos/recientes', params: { limit } }),
      providesTags: ['Riesgo'],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      query: (body) => ({ url: '/riesgos', method: 'POST', body }),
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    updateRiesgo: builder.mutation<Riesgo, UpdateRiesgoDto & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/riesgos/${id}`, method: 'PUT', body }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Riesgo', id },
        'Riesgo',
        'Estadisticas',
      ],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      query: (id) => ({ url: `/riesgos/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    // ============================================
    // EVALUACIONES
    // ============================================
    getEvaluacionesByRiesgo: builder.query<EvaluacionRiesgo[], string>({
      query: (riesgoId) => `/riesgos/${riesgoId}/evaluaciones`,
      providesTags: (_result, _error, riesgoId) => [{ type: 'Evaluacion', id: riesgoId }],
    }),

    getEvaluacionById: builder.query<EvaluacionRiesgo, string>({
      query: (id) => `/evaluaciones/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Evaluacion', id }],
    }),

    createEvaluacion: builder.mutation<EvaluacionRiesgo, CreateEvaluacionDto>({
      query: (body) => ({ url: '/evaluaciones', method: 'POST', body }),
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
      providesTags: ['Priorizacion'],
    }),

    createPriorizacion: builder.mutation<PriorizacionRiesgo, CreatePriorizacionDto>({
      query: (body) => ({ url: '/priorizaciones', method: 'POST', body }),
      invalidatesTags: ['Priorizacion'],
    }),

    // ============================================
    // DASHBOARD & ESTADÍSTICAS
    // ============================================
    getEstadisticas: builder.query<EstadisticasRiesgo, string | undefined>({
      query: (procesoId) => ({
        url: '/estadisticas',
        params: procesoId ? { procesoId } : undefined,
      }),
      providesTags: ['Estadisticas'],
    }),

    getPuntosMapa: builder.query<PuntoMapa[], FiltrosRiesgo | void>({
      query: (params) => ({
        url: '/puntos-mapa',
        params: params ? { procesoId: params.procesoId, clasificacion: params.clasificacion } : undefined,
      }),
      providesTags: ['Riesgo', 'Evaluacion'],
    }),

    // ============================================
    // OBSERVACIONES
    // ============================================
    getObservaciones: builder.query<any[], string>({
      query: (procesoId) => `/procesos/${procesoId}/observaciones`,
      providesTags: ['Observacion'],
    }),

    createObservacion: builder.mutation<any, { procesoId?: string; contenido?: string }>({
      query: (body) => ({ url: '/observaciones', method: 'POST', body }),
      invalidatesTags: ['Observacion'],
    }),

    updateObservacion: builder.mutation<any, { id: string; contenido?: string }>({
      query: ({ id, ...body }) => ({ url: `/observaciones/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Observacion'],
    }),

    // ============================================
    // HISTORIAL
    // ============================================
    getHistorial: builder.query<any[], string>({
      query: (procesoId) => `/procesos/${procesoId}/historial`,
      providesTags: ['Historial'],
    }),

    createHistorial: builder.mutation<any, { procesoId?: string; accion?: string; detalle?: string }>({
      query: (body) => ({ url: '/historial', method: 'POST', body }),
      invalidatesTags: ['Historial'],
    }),

    // ============================================
    // TAREAS
    // ============================================
    getTareas: builder.query<any[], void>({
      query: () => '/tareas',
      providesTags: ['Tarea'],
    }),

    createTarea: builder.mutation<any, { titulo?: string; descripcion?: string; estado?: string }>({
      query: (body) => ({ url: '/tareas', method: 'POST', body }),
      invalidatesTags: ['Tarea'],
    }),

    updateTarea: builder.mutation<any, { id: string; titulo?: string; descripcion?: string; estado?: string; completada?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/tareas/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Tarea'],
    }),

    // ============================================
    // NOTIFICACIONES
    // ============================================
    getNotificaciones: builder.query<any[], void>({
      query: () => '/notificaciones',
      providesTags: ['Notificacion'],
    }),

    createNotificacion: builder.mutation<any, CreateNotificacionDto & { titulo?: string; usuarioId?: string }>({
      query: (body) => ({ url: '/notificaciones', method: 'POST', body }),
      invalidatesTags: ['Notificacion'],
    }),

    updateNotificacion: builder.mutation<any, UpdateNotificacionDto & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/notificaciones/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Notificacion'],
    }),

    // ============================================
    // PASOS DEL PROCESO
    // ============================================
    getPasosProceso: builder.query<any[], void>({
      query: () => '/pasos-proceso',
      providesTags: ['PasoProceso'],
    }),

    createPasoProceso: builder.mutation<any, any>({
      query: (body) => ({ url: '/pasos-proceso', method: 'POST', body }),
      invalidatesTags: ['PasoProceso'],
    }),

    updatePasoProceso: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/pasos-proceso/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PasoProceso'],
    }),

    deletePasoProceso: builder.mutation<void, string>({
      query: (id) => ({ url: `/pasos-proceso/${id}`, method: 'DELETE' }),
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
      query: (body) => ({ url: '/encuestas', method: 'POST', body }),
      invalidatesTags: ['Encuesta'],
    }),

    updateEncuesta: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/encuestas/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Encuesta'],
    }),

    deleteEncuesta: builder.mutation<void, string>({
      query: (id) => ({ url: `/encuestas/${id}`, method: 'DELETE' }),
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
      query: (body) => ({ url: '/preguntas-encuesta', method: 'POST', body }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    updatePreguntaEncuesta: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/preguntas-encuesta/${id}`, method: 'PUT', body }),
      invalidatesTags: ['PreguntaEncuesta'],
    }),

    deletePreguntaEncuesta: builder.mutation<void, string>({
      query: (id) => ({ url: `/preguntas-encuesta/${id}`, method: 'DELETE' }),
      invalidatesTags: ['PreguntaEncuesta', 'Encuesta'],
    }),

    // ============================================
    // LISTAS DE VALORES
    // ============================================
    getListasValores: builder.query<any[], void>({
      query: () => '/listas-valores',
      providesTags: ['ListaValores'],
    }),

    getListaValoresById: builder.query<any, string>({
      query: (id) => `/listas-valores/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ListaValores', id }],
    }),

    updateListaValores: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/listas-valores/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ListaValores'],
    }),

    // ============================================
    // PARÁMETROS DE VALORACIÓN
    // ============================================
    getParametrosValoracion: builder.query<any[], void>({
      query: () => '/parametros-valoracion',
      providesTags: ['ParametroValoracion'],
    }),

    getParametroValoracionById: builder.query<any, string>({
      query: (id) => `/parametros-valoracion/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ParametroValoracion', id }],
    }),

    updateParametroValoracion: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/parametros-valoracion/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ParametroValoracion'],
    }),

    // ============================================
    // TIPOLOGÍAS
    // ============================================
    getTipologias: builder.query<any[], void>({
      query: () => '/tipologias',
      providesTags: ['Tipologia'],
    }),

    getTipologiaById: builder.query<any, string>({
      query: (id) => `/tipologias/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Tipologia', id }],
    }),

    createTipologia: builder.mutation<any, any>({
      query: (body) => ({ url: '/tipologias', method: 'POST', body }),
      invalidatesTags: ['Tipologia'],
    }),

    updateTipologia: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/tipologias/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Tipologia'],
    }),

    deleteTipologia: builder.mutation<void, string>({
      query: (id) => ({ url: `/tipologias/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tipologia'],
    }),

    // ============================================
    // FÓRMULAS
    // ============================================
    getFormulas: builder.query<any[], void>({
      query: () => '/formulas',
      providesTags: ['Formula'],
    }),

    getFormulaById: builder.query<any, string>({
      query: (id) => `/formulas/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Formula', id }],
    }),

    createFormula: builder.mutation<any, any>({
      query: (body) => ({ url: '/formulas', method: 'POST', body }),
      invalidatesTags: ['Formula'],
    }),

    updateFormula: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/formulas/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Formula'],
    }),

    deleteFormula: builder.mutation<void, string>({
      query: (id) => ({ url: `/formulas/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Formula'],
    }),

    // ============================================
    // CONFIGURACIONES
    // ============================================
    getConfiguraciones: builder.query<any[], void>({
      query: () => '/configuraciones',
      providesTags: ['Configuracion'],
    }),

    updateConfiguracion: builder.mutation<any, { id: string } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/configuraciones/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Configuracion'],
    }),

    // ============================================
    // CATÁLOGOS (solo lectura - API no tiene mutations)
    // ============================================
    getTiposRiesgos: builder.query<any[], void>({
      query: () => '/tipos-riesgo',
      providesTags: ['Configuracion'],
    }),

    getObjetivos: builder.query<any[], void>({
      query: () => '/objetivos',
      providesTags: ['Configuracion'],
    }),

    getFrecuencias: builder.query<any[], void>({
      query: () => '/frecuencias',
      providesTags: ['Configuracion'],
    }),

    getFuentes: builder.query<any[], void>({
      query: () => '/fuentes',
      providesTags: ['Configuracion'],
    }),

    getImpactos: builder.query<ImpactoDescripcion[], void>({
      query: () => '/impactos',
      providesTags: ['Configuracion'],
    }),

    getOrigenes: builder.query<any[], void>({
      query: () => '/origenes',
      providesTags: ['Configuracion'],
    }),

    getTiposProceso: builder.query<any[], void>({
      query: () => '/tipos-proceso',
      providesTags: ['Configuracion'],
    }),

    getConsecuencias: builder.query<any[], void>({
      query: () => '/consecuencias',
      providesTags: ['Configuracion'],
    }),

    getCausas: builder.query<Causa[], void>({
      query: () => '/causas',
      providesTags: ['Configuracion'],
    }),

    getNivelesRiesgo: builder.query<any[], void>({
      query: () => '/niveles-riesgo',
      providesTags: ['Configuracion'],
    }),

    getClasificacionesRiesgo: builder.query<any[], void>({
      query: () => '/clasificaciones-riesgo',
      providesTags: ['Configuracion'],
    }),

    getEjesMapa: builder.query<{ probabilidad: any[]; impacto: any[] }, void>({
      query: () => '/ejes-mapa',
      providesTags: ['Configuracion'],
    }),

    getMapaConfig: builder.query<any, void>({
      query: () => '/mapa-config',
      providesTags: ['MapaConfig'],
    }),

    updateMapaConfig: builder.mutation<
      any,
      { type: 'inherente' | 'residual' | 'tolerancia'; data: any }
    >({
      query: (body) => ({ url: '/mapa-config', method: 'PUT', body }),
      invalidatesTags: ['MapaConfig'],
    }),

    // ============================================
    // ÁREAS Y USUARIOS (solo lectura)
    // ============================================
    getAreas: builder.query<Area[], void>({
      query: () => '/areas',
      providesTags: ['Configuracion'],
    }),

    getUsuarios: builder.query<Usuario[], void>({
      query: () => '/usuarios',
      providesTags: ['Configuracion'],
    }),

    // ============================================
    // PLANES DE ACCIÓN E INCIDENCIAS
    // ============================================
    getPlanesAccion: builder.query<any[], void>({
      query: () => '/planes-accion',
      providesTags: ['Proceso'],
    }),

    getIncidencias: builder.query<any[], void>({
      query: () => '/incidencias',
      providesTags: ['Proceso'],
    }),

    // Asignaciones Gerente General
    getAsignacionesGerente: builder.query<
      { areaIds: string[]; procesoIds: string[] },
      { usuarioId: string; modo: 'director' | 'proceso' }
    >({
      query: ({ usuarioId, modo }) => ({
        url: '/asignaciones-gerente',
        params: { usuarioId, modo },
      }),
      providesTags: (_result, _error, { usuarioId, modo }) => [
        { type: 'AsignacionesGerente', id: `${usuarioId}-${modo}` },
      ],
    }),
    saveAsignacionesGerente: builder.mutation<
      { areaIds: string[]; procesoIds: string[] },
      { usuarioId: string; modo: 'director' | 'proceso'; areaIds: string[]; procesoIds: string[] }
    >({
      query: (body) => ({
        url: '/asignaciones-gerente',
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'AsignacionesGerente', id: `${arg.usuarioId}-${arg.modo}` },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            riesgosApi.util.updateQueryData(
              'getAsignacionesGerente',
              { usuarioId: arg.usuarioId, modo: arg.modo },
              () => ({ areaIds: data.areaIds ?? [], procesoIds: data.procesoIds ?? [] })
            )
          );
        } catch {
          // Si falla, la invalidación hará refetch
        }
      },
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
  useGetRiesgosRecientesQuery,
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
  // Catálogos
  useGetTiposRiesgosQuery,
  useGetObjetivosQuery,
  useGetFrecuenciasQuery,
  useGetFuentesQuery,
  useGetImpactosQuery,
  useGetOrigenesQuery,
  useGetTiposProcesoQuery,
  useGetConsecuenciasQuery,
  useGetCausasQuery,
  useGetNivelesRiesgoQuery,
  useGetClasificacionesRiesgoQuery,
  useGetEjesMapaQuery,
  useGetMapaConfigQuery,
  useUpdateMapaConfigMutation,
  // Áreas y Usuarios
  useGetAreasQuery,
  useGetUsuariosQuery,
  // Planes e Incidencias
  useGetPlanesAccionQuery,
  useGetIncidenciasQuery,
  // Asignaciones Gerente General
  useGetAsignacionesGerenteQuery,
  useSaveAsignacionesGerenteMutation,
} = riesgosApi;
