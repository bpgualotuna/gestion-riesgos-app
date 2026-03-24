import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AUTH_TOKEN_KEY } from '../../utils/constants';

/**
 * API de Trazabilidad de Planes de Acción
 * Conecta con los endpoints del backend para gestionar planes
 */

// Tipos
export interface CambiarEstadoPlanRequest {
  estado: 'pendiente' | 'en_revision' | 'revisado';
  observacion?: string;
}

export interface ConvertirPlanAControlRequest {
  tipoControl: 'prevención' | 'detección' | 'corrección';
  observaciones?: string;
}

export interface AlertaVencimiento {
  id: number;
  tipo: 'proximo' | 'vencido';
  diasRestantes: number;
  leida: boolean;
  fechaGeneracion: string;
  plan: {
    causaId: number;
    descripcion: string;
    responsable: string;
    fechaEstimada: string;
    estado: string;
  };
  riesgo: {
    id: number;
    numeroIdentificacion: string;
    descripcion: string;
  };
  proceso: {
    id: number;
    nombre: string;
  };
}

export interface AlertasResponse {
  alertas: AlertaVencimiento[];
  total: number;
  proximasAVencer: number;
  vencidas: number;
  noLeidas: number;
}

export interface Trazabilidad {
  causa: {
    id: number;
    descripcion: string;
    tipoGestion: string;
    riesgo: {
      id: number;
      numeroIdentificacion: string;
      descripcion: string;
      proceso: string;
    };
  };
  plan: {
    descripcion: string;
    responsable: string;
    fechaEstimada: string;
    estado: string;
    detalle?: string;
    decision?: string;
  };
  historialEstados: Array<{
    estado: string;
    fecha: string;
    usuario: string;
    observacion: string;
  }>;
  controlDerivado: {
    id: number;
    descripcion: string;
    tipoControl: string;
    efectividad: number;
    fechaCreacion: string;
  } | null;
  eventos: Array<{
    fecha: string;
    usuario: string;
    accion: string;
    descripcion: string;
    valorAnterior?: string;
    valorNuevo?: string;
  }>;
}

export interface EstadoCron {
  cron: {
    activo: boolean;
    ultimaEjecucion: string | null;
    proximaEjecucion: string | null;
    horaConfigurada: string;
    intervalo: string;
  };
  alertas: {
    totalAlertas: number;
    alertasNoLeidas: number;
    alertasVencidas: number;
    alertasProximas: number;
    planesConAlertas: number;
  };
}

export interface PlanAccionAPI {
  id: number;
  causaRiesgoId: number;
  riesgoId: number;
  descripcion: string;
  causaDescripcion: string; // AGREGADO: Descripción de la causa
  responsable: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  fechaProgramada: string | null;
  estado: 'pendiente' | 'en_revision' | 'revisado';
  observaciones: string;
  controlDerivadoId: number | null;
  fechaConversion: string | null;
  createdAt: string;
  updatedAt: string;
  riesgo: {
    id: number;
    numeroIdentificacion: string;
    descripcion: string;
    proceso: {
      id: number;
      nombre: string;
    };
  };
}

export interface PlanesAccionResponse {
  planes: PlanAccionAPI[];
  stats: {
    total: number;
    pendientes: number;
    enRevision: number;
    revisados: number;
  };
}

export const planTrazabilidadApi = createApi({
  reducerPath: 'planTrazabilidadApi',
  baseQuery: fetchBaseQuery({
    baseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      import.meta.env.VITE_API_URL ||
      'http://localhost:8080/api',
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Alertas', 'Trazabilidad', 'Cron'],
  endpoints: (builder) => ({
    // Obtener todos los planes de acción
    obtenerPlanesAccion: builder.query<
      PlanesAccionResponse,
      { estado?: string; procesoId?: number } | void
    >({
      query: (params) => ({
        url: '/planes-accion',
        params: params || {},
      }),
      providesTags: ['Trazabilidad'],
    }),

    // Cambiar estado del plan
    cambiarEstadoPlan: builder.mutation<
      { success: boolean; estadoAnterior: string; estadoNuevo: string },
      { causaId: number; data: CambiarEstadoPlanRequest }
    >({
      query: ({ causaId, data }) => ({
        url: `/causas/${causaId}/plan/estado`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Trazabilidad', 'Alertas'],
    }),

    // Convertir plan a control
    convertirPlanAControl: builder.mutation<
      { success: boolean; control: any; message: string },
      { causaId: number; data: ConvertirPlanAControlRequest }
    >({
      query: ({ causaId, data }) => ({
        url: `/causas/${causaId}/plan/convertir-a-control`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Trazabilidad'],
    }),

    // Obtener trazabilidad del plan
    obtenerTrazabilidad: builder.query<Trazabilidad, number>({
      query: (causaId) => `/causas/${causaId}/plan/trazabilidad`,
      providesTags: ['Trazabilidad'],
    }),

    // Obtener alertas de vencimiento
    obtenerAlertas: builder.query<AlertasResponse, { soloNoLeidas?: boolean }>({
      query: ({ soloNoLeidas = false }) => ({
        url: '/alertas-vencimiento',
        params: { soloNoLeidas: soloNoLeidas.toString() },
      }),
      providesTags: ['Alertas'],
    }),

    // Marcar alerta como leída
    marcarAlertaLeida: builder.mutation<{ success: boolean }, number>({
      query: (alertaId) => ({
        url: `/alertas/${alertaId}/marcar-leida`,
        method: 'PUT',
      }),
      invalidatesTags: ['Alertas'],
    }),

    // Obtener estado del cron (para admin)
    obtenerEstadoCron: builder.query<EstadoCron, void>({
      query: () => '/cron/estado',
      providesTags: ['Cron'],
    }),

    // Ejecutar alertas manualmente (solo admin)
    ejecutarAlertasManualmente: builder.mutation<
      { success: boolean; message: string },
      void
    >({
      query: () => ({
        url: '/cron/ejecutar-alertas',
        method: 'POST',
      }),
      invalidatesTags: ['Alertas', 'Cron'],
    }),
  }),
});

export const {
  useObtenerPlanesAccionQuery,
  useCambiarEstadoPlanMutation,
  useConvertirPlanAControlMutation,
  useObtenerTrazabilidadQuery,
  useObtenerAlertasQuery,
  useMarcarAlertaLeidaMutation,
  useObtenerEstadoCronQuery,
  useEjecutarAlertasManualmenteMutation,
} = planTrazabilidadApi;
