/**
 * RTK Query API for Risk Management
 * Uses mock data when backend is not available
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../utils/constants';
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
const USE_MOCK_DATA = true;

// Mock base query que no hace llamadas reales
// Se usa solo como fallback, todos los endpoints usan queryFn
const mockBaseQuery = async () => {
  // Simular delay de red
  await new Promise(resolve => setTimeout(resolve, 100));
  return { data: null };
};

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery: mockBaseQuery,
  tagTypes: ['Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas', 'Proceso', 'Tarea', 'Notificacion', 'Observacion', 'Historial', 'PasoProceso', 'Encuesta', 'PreguntaEncuesta', 'ListaValores', 'ParametroValoracion', 'Tipologia', 'Formula', 'Configuracion', 'MapaConfig'],
  endpoints: (builder) => ({
    // ============================================
    // PROCESOS
    // ============================================
    getProcesos: builder.query<Proceso[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockProcesos() };
      },
      providesTags: ['Proceso'],
    }),

    getProcesoById: builder.query<Proceso, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const proceso = getMockProcesoById(id);
        if (!proceso) {
          return { error: { status: 404, data: 'Proceso no encontrado' } };
        }
        return { data: proceso };
      },
      providesTags: (_result, _error, id) => [{ type: 'Proceso', id }],
    }),

    createProceso: builder.mutation<Proceso, CreateProcesoDto>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevoProceso = createMockProceso(body);
        return { data: nuevoProceso };
      },
      invalidatesTags: ['Proceso'],
    }),

    updateProceso: builder.mutation<Proceso, UpdateProcesoDto>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const procesoActualizado = updateMockProceso(id, body);
        if (!procesoActualizado) {
          return { error: { status: 404, data: 'Proceso no encontrado' } };
        }
        return { data: procesoActualizado };
      },
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proceso', id }, 'Proceso'],
    }),

    deleteProceso: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockProceso(id);
        return { data: undefined };
      },
      invalidatesTags: ['Proceso'],
    }),

    duplicateProceso: builder.mutation<Proceso, { id: string; overrides?: Partial<CreateProcesoDto & { año?: number; areaNombre?: string }> }>({
      queryFn: async ({ id, overrides }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const procesoDuplicado = duplicateMockProceso(id, overrides);
        return { data: procesoDuplicado };
      },
      invalidatesTags: ['Proceso'],
    }),

    bulkUpdateProcesos: builder.mutation<Proceso[], Proceso[]>({
      queryFn: async (procesos) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        // We import the function dynamically to avoid circular dependencies if possible, or just use the one we have
        // Actually, we need to export a bulk update function from mockData too?
        // updateMockProcesos is exported.
        // But we can't import it here inside queryFn easily if it's not already imported.
        // It is imported as `updateMockProcesos` at top of file? No, I need to check imports.
        // line 41 is `updateMockProceso` (singular).
        // I need to add `updateMockProcesos` (plural) to imports first.
        const { updateMockProcesos } = await import('./mockData');
        const updated = updateMockProcesos(procesos);
        return { data: updated };
      },
      invalidatesTags: ['Proceso'],
    }),

    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<PaginatedResponse<Riesgo>, FiltrosRiesgo & { page?: number; pageSize?: number }>({
      queryFn: async (params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = getMockRiesgos({
          procesoId: params.procesoId,
          clasificacion: params.clasificacion && params.clasificacion !== 'all' ? params.clasificacion : undefined,
          busqueda: params.busqueda,
          zona: params.zona,
          page: params.page,
          pageSize: params.pageSize,
        });
        return { data: response };
      },
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = getMockRiesgos();
        const riesgo = response.data.find((r: Riesgo) => r.id === id);
        if (!riesgo) {
          return { error: { status: 404, data: 'Riesgo no encontrado' } };
        }
        return { data: riesgo };
      },
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevoRiesgo: Riesgo = {
          id: `riesgo-${Date.now()}`,
          numero: 0, // Se asignará automáticamente
          ...body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Riesgo;
        return { data: nuevoRiesgo };
      },
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    updateRiesgo: builder.mutation<Riesgo, UpdateRiesgoDto>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const response = getMockRiesgos();
        const riesgos = response.data;
        const index = riesgos.findIndex((r: Riesgo) => r.id === id);
        if (index === -1) {
          return { error: { status: 404, data: 'Riesgo no encontrado' } };
        }
        const actualizado = { ...riesgos[index], ...body, updatedAt: new Date().toISOString() };
        return { data: actualizado };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Riesgo', id },
        'Riesgo',
        'Estadisticas',
      ],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        // Eliminar de mockRiesgos
        return { data: undefined };
      },
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    // ============================================
    // EVALUACIONES
    // ============================================
    getEvaluacionesByRiesgo: builder.query<EvaluacionRiesgo[], string>({
      queryFn: async (riesgoId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const evaluaciones = getMockEvaluacionesByRiesgo(riesgoId);
        return { data: evaluaciones };
      },
      providesTags: (_result, _error, riesgoId) => [{ type: 'Evaluacion', id: riesgoId }],
    }),

    getEvaluacionById: builder.query<EvaluacionRiesgo, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const evaluaciones = getMockEvaluacionesByRiesgo('');
        const evaluacion = evaluaciones.find((e) => e.id === id);
        if (!evaluacion) return { error: { status: 404, data: 'Evaluación no encontrada' } };
        return { data: evaluacion };
      },
      providesTags: (_result, _error, id) => [{ type: 'Evaluacion', id }],
    }),

    createEvaluacion: builder.mutation<EvaluacionRiesgo, CreateEvaluacionDto>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaEvaluacion = createMockEvaluacion(body);
        return { data: nuevaEvaluacion };
      },
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
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const priorizaciones = getMockPriorizaciones();
        return { data: priorizaciones };
      },
      providesTags: ['Priorizacion'],
    }),

    createPriorizacion: builder.mutation<PriorizacionRiesgo, CreatePriorizacionDto>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaPriorizacion = createMockPriorizacion(body);
        return { data: nuevaPriorizacion };
      },
      invalidatesTags: ['Priorizacion'],
    }),

    // ============================================
    // DASHBOARD & ESTADÍSTICAS
    // ============================================
    getEstadisticas: builder.query<EstadisticasRiesgo, string | undefined>({
      queryFn: async (procesoId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockEstadisticas(procesoId) };
      },
      providesTags: ['Estadisticas'],
    }),

    getRiesgosRecientes: builder.query<RiesgoReciente[], number>({
      queryFn: async (limit = 10) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockRiesgosRecientes(limit) };
      },
      providesTags: ['Riesgo'],
    }),

    // ============================================
    // MAPA DE RIESGOS
    // ============================================
    getPuntosMapa: builder.query<PuntoMapa[], FiltrosRiesgo>({
      queryFn: async (params) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockPuntosMapa(params) };
      },
      providesTags: ['Riesgo', 'Evaluacion'],
    }),

    // ============================================
    // OBSERVACIONES
    // ============================================
    getObservaciones: builder.query<any[], string>({
      queryFn: async (procesoId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const observaciones = getMockObservaciones(procesoId);
        return { data: observaciones };
      },
      providesTags: ['Observacion'],
    }),

    createObservacion: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaObservacion = createMockObservacion(body);
        return { data: nuevaObservacion };
      },
      invalidatesTags: ['Observacion'],
    }),

    updateObservacion: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockObservacion(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Observación no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Observacion'],
    }),

    // ============================================
    // HISTORIAL
    // ============================================
    getHistorial: builder.query<any[], string>({
      queryFn: async (procesoId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const historial = getMockHistorial(procesoId);
        return { data: historial };
      },
      providesTags: ['Historial'],
    }),

    createHistorial: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevoHistorial = createMockHistorial(body);
        return { data: nuevoHistorial };
      },
      invalidatesTags: ['Historial'],
    }),

    // ============================================
    // TAREAS
    // ============================================
    getTareas: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const tareas = getMockTareas();
        return { data: tareas };
      },
      providesTags: ['Tarea'],
    }),

    createTarea: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaTarea = createMockTarea(body);
        return { data: nuevaTarea };
      },
      invalidatesTags: ['Tarea'],
    }),

    updateTarea: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockTarea(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Tarea no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Tarea'],
    }),

    // ============================================
    // NOTIFICACIONES
    // ============================================
    getNotificaciones: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const notificaciones = getMockNotificaciones();
        return { data: notificaciones };
      },
      providesTags: ['Notificacion'],
    }),

    createNotificacion: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaNotificacion = createMockNotificacion(body);
        return { data: nuevaNotificacion };
      },
      invalidatesTags: ['Notificacion'],
    }),

    updateNotificacion: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockNotificacion(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Notificación no encontrada' } };
        }
        return { data: actualizada };
      },
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
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockListasValores() };
      },
      providesTags: ['ListaValores'],
    }),

    getListaValoresById: builder.query<any, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const lista = getMockListaValoresById(id);
        if (!lista) {
          return { error: { status: 404, data: 'Lista no encontrada' } };
        }
        return { data: lista };
      },
      providesTags: (_result, _error, id) => [{ type: 'ListaValores', id }],
    }),

    updateListaValores: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockListaValores(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Lista no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['ListaValores'],
    }),

    // ============================================
    // PARÁMETROS DE VALORACIÓN
    // ============================================
    getParametrosValoracion: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockParametrosValoracion() };
      },
      providesTags: ['ParametroValoracion'],
    }),

    getParametroValoracionById: builder.query<any, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const parametro = getMockParametroValoracionById(id);
        if (!parametro) {
          return { error: { status: 404, data: 'Parámetro no encontrado' } };
        }
        return { data: parametro };
      },
      providesTags: (_result, _error, id) => [{ type: 'ParametroValoracion', id }],
    }),

    updateParametroValoracion: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizado = updateMockParametroValoracion(id, body);
        if (!actualizado) {
          return { error: { status: 404, data: 'Parámetro no encontrado' } };
        }
        return { data: actualizado };
      },
      invalidatesTags: ['ParametroValoracion'],
    }),

    // ============================================
    // TIPOLOGÍAS
    // ============================================
    getTipologias: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockTipologias() };
      },
      providesTags: ['Tipologia'],
    }),

    getTipologiaById: builder.query<any, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const tipologia = getMockTipologiaById(id);
        if (!tipologia) {
          return { error: { status: 404, data: 'Tipología no encontrada' } };
        }
        return { data: tipologia };
      },
      providesTags: (_result, _error, id) => [{ type: 'Tipologia', id }],
    }),

    createTipologia: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaTipologia = createMockTipologia(body);
        return { data: nuevaTipologia };
      },
      invalidatesTags: ['Tipologia'],
    }),

    updateTipologia: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockTipologia(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Tipología no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Tipologia'],
    }),

    deleteTipologia: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockTipologia(id);
        return { data: undefined };
      },
      invalidatesTags: ['Tipologia'],
    }),

    // ============================================
    // FÓRMULAS
    // ============================================
    getFormulas: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockFormulas() };
      },
      providesTags: ['Formula'],
    }),

    getFormulaById: builder.query<any, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const formula = getMockFormulaById(id);
        if (!formula) {
          return { error: { status: 404, data: 'Fórmula no encontrada' } };
        }
        return { data: formula };
      },
      providesTags: (_result, _error, id) => [{ type: 'Formula', id }],
    }),

    createFormula: builder.mutation<any, any>({
      queryFn: async (body) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const nuevaFormula = createMockFormula(body);
        return { data: nuevaFormula };
      },
      invalidatesTags: ['Formula'],
    }),

    updateFormula: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockFormula(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Fórmula no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Formula'],
    }),

    deleteFormula: builder.mutation<void, string>({
      queryFn: async (id) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        deleteMockFormula(id);
        return { data: undefined };
      },
      invalidatesTags: ['Formula'],
    }),

    // ============================================
    // CONFIGURACIONES
    // ============================================
    getConfiguraciones: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockConfiguraciones() };
      },
      providesTags: ['Configuracion'],
    }),

    updateConfiguracion: builder.mutation<any, { id: string;[key: string]: any }>({
      queryFn: async ({ id, ...body }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const actualizada = updateMockConfiguracion(id, body);
        if (!actualizada) {
          return { error: { status: 404, data: 'Configuración no encontrada' } };
        }
        return { data: actualizada };
      },
      invalidatesTags: ['Configuracion'],
    }),

    // ============================================
    // CONFIGURACIÓN DE IDENTIFICACIÓN Y CALIFICACIÓN
    // ============================================
    getTiposRiesgos: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockTiposRiesgos() };
      },
      providesTags: ['Configuracion'],
    }),

    updateTiposRiesgos: builder.mutation<any[], any[]>({
      queryFn: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: updateMockTiposRiesgos(data) };
      },
      invalidatesTags: ['Configuracion'],
    }),

    getObjetivos: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockObjetivos() };
      },
      providesTags: ['Configuracion'],
    }),

    updateObjetivos: builder.mutation<any[], any[]>({
      queryFn: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: updateMockObjetivos(data) };
      },
      invalidatesTags: ['Configuracion'],
    }),

    getFrecuencias: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockFrecuencias() };
      },
      providesTags: ['Configuracion'],
    }),

    updateFrecuencias: builder.mutation<any[], any[]>({
      queryFn: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: updateMockFrecuencias(data) };
      },
      invalidatesTags: ['Configuracion'],
    }),

    getFuentes: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockFuentes() };
      },
      providesTags: ['Configuracion'],
    }),

    updateFuentes: builder.mutation<any[], any[]>({
      queryFn: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: updateMockFuentes(data) };
      },
      invalidatesTags: ['Configuracion'],
    }),

    getImpactos: builder.query<ImpactoDescripcion[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockImpactos() };
      },
      providesTags: ['Configuracion'],
    }),

    updateImpactos: builder.mutation<any[], any[]>({
      queryFn: async (data) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: updateMockImpactos(data) };
      },
      invalidatesTags: ['Configuracion'],
    }),

    getOrigenes: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockOrigenes() };
      },
      providesTags: ['Configuracion'],
    }),

    getTiposProceso: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockTiposProceso() };
      },
      providesTags: ['Configuracion'],
    }),

    getConsecuencias: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockConsecuencias() };
      },
      providesTags: ['Configuracion'],
    }),

    getCausas: builder.query<Causa[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockCausas() };
      },
      providesTags: ['Configuracion'],
    }),

    getNivelesRiesgo: builder.query<any[], void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockNivelesRiesgo() };
      },
      providesTags: ['Configuracion'],
    }),

    // ============================================
    // MAP CONFIGURATION
    // ============================================
    getEjesMapa: builder.query<{ probabilidad: any[], impacto: any[] }, void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockEjesMapa() };
      },
      providesTags: ['Configuracion'],
    }),

    getMapaConfig: builder.query<any, void>({
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: getMockMapaConfig() };
      },
      providesTags: ['MapaConfig'],
    }),

    updateMapaConfig: builder.mutation<any, { type: 'inherente' | 'residual' | 'tolerancia'; data: any }>({
      queryFn: async ({ type, data }) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const updated = updateMockMapaConfig(type, data);
        return { data: updated };
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
