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
  personas: 0.14,      // 14%
  legal: 0.22,         // 22%
  ambiental: 0.22,     // 22%
  procesos: 0.10,      // 10%
  reputacion: 0.10,    // 10%
  economico: 0.22,     // 22%
  tecnologico: 0.00,   // No tiene peso en el cálculo global
} as const;

// Dimensiones de Impacto
export const DIMENSIONES_IMPACTO = [
  { key: 'personas', label: 'Personas', peso: PESOS_IMPACTO.personas },
  { key: 'legal', label: 'Legal/Normativo', peso: PESOS_IMPACTO.legal },
  { key: 'ambiental', label: 'Ambiental', peso: PESOS_IMPACTO.ambiental },
  { key: 'procesos', label: 'Procesos', peso: PESOS_IMPACTO.procesos },
  { key: 'reputacion', label: 'Reputacional', peso: PESOS_IMPACTO.reputacion },
  { key: 'economico', label: 'Económico', peso: PESOS_IMPACTO.economico },
  { key: 'tecnologico', label: 'Tecnológico', peso: PESOS_IMPACTO.tecnologico },
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
} as const;

// API Base URL (configurar según entorno)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Configuración de Paginación
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
} as const;
