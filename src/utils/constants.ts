/**
 * Application Constants
 */

// Niveles de Riesgo
export const NIVELES_RIESGO = {
  CRITICO: 'NIVEL CRÍTICO',
  ALTO: 'NIVEL ALTO',
  MEDIO: 'NIVEL MEDIO',
  BAJO: 'NIVEL BAJO',
} as const;

export type NivelRiesgo = typeof NIVELES_RIESGO[keyof typeof NIVELES_RIESGO];

// Clasificación de Riesgo
export const CLASIFICACION_RIESGO = {
  POSITIVA: 'Riesgo con consecuencia positiva',
  NEGATIVA: 'Riesgo con consecuencia negativa',
} as const;

export type ClasificacionRiesgo = typeof CLASIFICACION_RIESGO[keyof typeof CLASIFICACION_RIESGO];

// Pesos de Impacto (según Excel)
export const PESOS_IMPACTO = {
  '1': 0.22,      // Ambiental - 22%
  '2': 0.00,      // Confidencialidad - 0% (no tiene peso en el cálculo global)
  '3': 0.00,      // Disponibilidad SGSI - 0%
  '4': 0.22,      // Económico - 22%
  '5': 0.00,      // Integridad SGSI - 0%
  '6': 0.22,      // Legal - 22%
  '7': 0.14,      // Personas - 14%
  '8': 0.10,      // Procesos - 10%
  '9': 0.10,      // Reputación - 10%
} as const;

// Dimensiones de Impacto
export const DIMENSIONES_IMPACTO = [
  { key: '1', label: 'Ambiental', peso: PESOS_IMPACTO['1'] },
  { key: '2', label: 'Confidencialidad', peso: PESOS_IMPACTO['2'] },
  { key: '3', label: 'Disponibilidad SGSI', peso: PESOS_IMPACTO['3'] },
  { key: '4', label: 'Económico', peso: PESOS_IMPACTO['4'] },
  { key: '5', label: 'Integridad SGSI', peso: PESOS_IMPACTO['5'] },
  { key: '6', label: 'Legal/Normativo', peso: PESOS_IMPACTO['6'] },
  { key: '7', label: 'Personas', peso: PESOS_IMPACTO['7'] },
  { key: '8', label: 'Procesos', peso: PESOS_IMPACTO['8'] },
  { key: '9', label: 'Reputacional', peso: PESOS_IMPACTO['9'] },
] as const;

// Escalas de Calificación
export const ESCALA_CALIFICACION = [1, 2, 3, 4, 5] as const;

export const LABELS_PROBABILIDAD = {
  1: 'Muy Baja',
  2: 'Baja',
  3: 'Moderada',
  4: 'Alta',
  5: 'Muy Alta',
} as const;

export const LABELS_IMPACTO = {
  1: 'Muy Bajo',
  2: 'Bajo',
  3: 'Moderado',
  4: 'Alto',
  5: 'Muy Alto',
} as const;

// Umbrales de Nivel de Riesgo
export const UMBRALES_RIESGO = {
  CRITICO: 20,
  ALTO: 15,
  MEDIO: 10,
  BAJO: 5,
} as const;

// Respuestas al Riesgo
export const RESPUESTAS_RIESGO = [
  'Aceptar',
  'Evitar',
  'Reducir',
  'Compartir',
] as const;

export type RespuestaRiesgo = typeof RESPUESTAS_RIESGO[number];

// Estados de Normatividad
export const ESTADOS_NORMATIVIDAD = [
  'Proyecto',
  'Requerida',
  'Existente',
] as const;

export type EstadoNormatividad = typeof ESTADOS_NORMATIVIDAD[number];

// Niveles de Cumplimiento
export const NIVELES_CUMPLIMIENTO = [
  'Total',
  'Parcial',
  'No cumple',
] as const;

export type NivelCumplimiento = typeof NIVELES_CUMPLIMIENTO[number];

// Rutas de la Aplicación
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  FICHA: '/ficha',
  IDENTIFICACION: '/identificacion',
  EVALUACION: '/evaluacion',
  MAPA: '/mapa',
  PRIORIZACION: '/priorizacion',
  NORMATIVIDAD: '/normatividad',
  CONTEXTO_EXTERNO: '/contexto-externo',
  CONTEXTO_INTERNO: '/contexto-interno',
  DOFA: '/dofa',
  ANALISIS_PROCESO: '/analisis-proceso',
  BENCHMARKING: '/benchmarking',
  AYUDA: '/ayuda',
  LOGIN: '/login',
  PROCESOS: '/procesos',
  PROCESOS_NUEVO: '/procesos/nuevo',
  RIESGOS_PROCESOS: '/riesgos-procesos',
  ADMINISTRACION: '/administracion',
  SUPERVISION: '/supervision',
  RESUMEN_DIRECTOR: '/resumen-director',
  DASHBOARD_SUPERVISOR: '/dashboard-supervisor',
  PLAN_ACCION: '/plan-accion',
  EVALUACION_CONTROL: '/evaluacion-control',
  TAREAS: '/tareas',
  HISTORIAL: '/historial',
  RESUMEN_RIESGOS: '/resumen-riesgos',
  RIESGOS_POR_PROCESO: '/riesgos-por-proceso',
  RIESGOS_POR_TIPOLOGIA: '/riesgos-por-tipologia',
  INCIDENCIAS: '/incidencias',
  MODO_GERENTE_GENERAL: '/modo-gerente-general',
  PROCESOS_GERENTE_GENERAL: '/procesos-gerente-general',
  DASHBOARD_GERENTE_GENERAL: '/dashboard-gerente-general',
  ASIGNACIONES: '/asignaciones',
  ADMIN_USUARIOS: '/administracion/usuarios',
  ADMIN_PROCESOS: '/administracion/procesos',
  ADMIN_AREAS: '/administracion/areas',
  ADMIN_ASIGNACIONES: '/administracion/asignaciones',
  ADMIN_PERMISOS: '/administracion/permisos',
  ADMIN_CONFIGURACION: '/administracion/configuracion',
  ADMIN_MAPA_CONFIG: '/admin/configuracion-mapa',
} as const;

// API Base URL - API real desplegada en Render
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apicomware.onrender.com';

// Configuración de Paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
} as const;
