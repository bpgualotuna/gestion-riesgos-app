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
} from '../types';
import {
  getMockRiesgos,
  getMockEvaluacionesByRiesgo,
  getMockEstadisticas,
  getMockRiesgosRecientes,
  getMockPuntosMapa,
  getMockPriorizaciones,
  createMockEvaluacion,
  createMockPriorizacion,
} from './mockData';

// Check if we should use mock data (when API_BASE_URL is localhost or not set)
const USE_MOCK_DATA = !import.meta.env.VITE_API_BASE_URL || API_BASE_URL.includes('localhost');

export const riesgosApi = createApi({
  reducerPath: 'riesgosApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Riesgo', 'Evaluacion', 'Priorizacion', 'Estadisticas'],
  endpoints: (builder) => ({
    // ============================================
    // RIESGOS
    // ============================================
    getRiesgos: builder.query<PaginatedResponse<Riesgo>, FiltrosRiesgo & { page?: number; pageSize?: number }>({
      queryFn: async (params) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate network delay
          return { data: getMockRiesgos(params) };
        }
        return { data: null as any };
      },
      providesTags: ['Riesgo'],
    }),

    getRiesgoById: builder.query<Riesgo, string>({
      queryFn: async (id) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const riesgos = getMockRiesgos({ pageSize: 100 });
          const riesgo = riesgos.data.find((r) => r.id === id);
          if (!riesgo) return { error: { status: 404, data: 'Riesgo no encontrado' } };
          return { data: riesgo };
        }
        return { data: null as any };
      },
      providesTags: (_result, _error, id) => [{ type: 'Riesgo', id }],
    }),

    createRiesgo: builder.mutation<Riesgo, CreateRiesgoDto>({
      queryFn: async (body) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          const nuevoRiesgo: Riesgo = {
            id: `riesgo-${Date.now()}`,
            numero: getMockRiesgos({ pageSize: 100 }).total + 1,
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { data: nuevoRiesgo };
        }
        return { data: null as any };
      },
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    updateRiesgo: builder.mutation<Riesgo, UpdateRiesgoDto>({
      queryFn: async ({ id, ...body }) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const riesgos = getMockRiesgos({ pageSize: 100 });
          const riesgo = riesgos.data.find((r) => r.id === id);
          if (!riesgo) return { error: { status: 404, data: 'Riesgo no encontrado' } };
          const updated = { ...riesgo, ...body, updatedAt: new Date().toISOString() };
          return { data: updated };
        }
        return { data: null as any };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Riesgo', id },
        'Riesgo',
        'Estadisticas',
      ],
    }),

    deleteRiesgo: builder.mutation<void, string>({
      queryFn: async (id) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { data: undefined };
        }
        return { data: undefined };
      },
      invalidatesTags: ['Riesgo', 'Estadisticas'],
    }),

    // ============================================
    // EVALUACIONES
    // ============================================
    getEvaluacionesByRiesgo: builder.query<EvaluacionRiesgo[], string>({
      queryFn: async (riesgoId) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          return { data: getMockEvaluacionesByRiesgo(riesgoId) };
        }
        return { data: [] };
      },
      providesTags: (_result, _error, riesgoId) => [{ type: 'Evaluacion', id: riesgoId }],
    }),

    getEvaluacionById: builder.query<EvaluacionRiesgo, string>({
      queryFn: async (id) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const evaluaciones = getMockEvaluacionesByRiesgo('any');
          const evaluacion = evaluaciones.find((e) => e.id === id);
          if (!evaluacion) return { error: { status: 404, data: 'Evaluación no encontrada' } };
          return { data: evaluacion };
        }
        return { data: null as any };
      },
      providesTags: (_result, _error, id) => [{ type: 'Evaluacion', id }],
    }),

    createEvaluacion: builder.mutation<EvaluacionRiesgo, CreateEvaluacionDto>({
      queryFn: async (body) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          try {
            const nuevaEvaluacion = createMockEvaluacion(body);
            return { data: nuevaEvaluacion };
          } catch (error: any) {
            return { error: { status: 400, data: error.message } };
          }
        }
        return { data: null as any };
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
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { data: getMockPriorizaciones() };
        }
        return { data: [] };
      },
      providesTags: ['Priorizacion'],
    }),

    createPriorizacion: builder.mutation<PriorizacionRiesgo, CreatePriorizacionDto>({
      queryFn: async (body) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          try {
            const nuevaPriorizacion = createMockPriorizacion(body);
            return { data: nuevaPriorizacion };
          } catch (error: any) {
            return { error: { status: 400, data: error.message } };
          }
        }
        return { data: null as any };
      },
      invalidatesTags: ['Priorizacion'],
    }),

    // ============================================
    // DASHBOARD & ESTADÍSTICAS
    // ============================================
    getEstadisticas: builder.query<EstadisticasRiesgo, void>({
      queryFn: async () => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return { data: getMockEstadisticas() };
        }
        return { data: null as any };
      },
      providesTags: ['Estadisticas'],
    }),

    getRiesgosRecientes: builder.query<RiesgoReciente[], number>({
      queryFn: async (limit = 10) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          return { data: getMockRiesgosRecientes(limit) };
        }
        return { data: [] };
      },
      providesTags: ['Riesgo'],
    }),

    // ============================================
    // MAPA DE RIESGOS
    // ============================================
    getPuntosMapa: builder.query<PuntoMapa[], FiltrosRiesgo>({
      queryFn: async (params) => {
        if (USE_MOCK_DATA) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return { data: getMockPuntosMapa(params) };
        }
        return { data: [] };
      },
      providesTags: ['Riesgo', 'Evaluacion'],
    }),
  }),
});

export const {
  useGetRiesgosQuery,
  useGetRiesgoByIdQuery,
  useCreateRiesgoMutation,
  useUpdateRiesgoMutation,
  useDeleteRiesgoMutation,
  useGetEvaluacionesByRiesgoQuery,
  useGetEvaluacionByIdQuery,
  useCreateEvaluacionMutation,
  useGetPriorizacionesQuery,
  useCreatePriorizacionMutation,
  useGetEstadisticasQuery,
  useGetRiesgosRecientesQuery,
  useGetPuntosMapaQuery,
} = riesgosApi;
