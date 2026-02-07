/**
 * Servicio centralizado para leer datos mock desde JSON
 * Hace el código más escalable y mantenible
 */

import mockDataJson from './mockData.json';

export interface MockProceso {
  id: string;
  nombre: string;
  tipoProceso: string;
  activo: boolean;
}

export interface MockRiesgoPorProceso {
  id: string;
  procesoId: string;
  nombre: string;
  count: number;
}

export interface MockPlanAccion {
  id: string;
  nombre: string;
  proceso: string;
  fechaInicio: string;
  fechaLimite: string;
  estado: string;
  responsable: string;
  porcentajeAvance: number;
}

export interface MockIncidencia {
  id: string;
  codigo: string;
  titulo: string;
  fecha: string;
  severidad: string;
  estado: string;
  proceso: string;
}

export interface MockRiesgoResumen {
  id: string;
  codigo: string;
  proceso: string;
  descripcion: string;
  riesgoInherente: number;
  riesgoResidual: number;
  nivelRI: string;
  nivelRR: string;
}

/**
 * Obtiene todos los procesos mock
 */
export function getMockProcesos(): MockProceso[] {
  return mockDataJson.procesos as MockProceso[];
}

/**
 * Obtiene riesgos por proceso (Top 10)
 */
export function getMockRiesgosPorProceso(): MockRiesgoPorProceso[] {
  return mockDataJson.riesgosPorProceso as MockRiesgoPorProceso[];
}

/**
 * Obtiene distribución de riesgos por tipología
 */
export function getMockRiesgosPorTipologia(): Record<string, number> {
  return mockDataJson.riesgosPorTipologia as Record<string, number>;
}

/**
 * Obtiene distribución de riesgos por origen
 */
export function getMockOrigenRiesgos(): Record<string, number> {
  return mockDataJson.origenRiesgos as Record<string, number>;
}

/**
 * Obtiene todos los planes de acción
 */
export function getMockPlanesAccion(): MockPlanAccion[] {
  return mockDataJson.planesAccion as MockPlanAccion[];
}

/**
 * Obtiene todas las incidencias
 */
export function getMockIncidencias(): MockIncidencia[] {
  return mockDataJson.incidencias as MockIncidencia[];
}

/**
 * Obtiene resumen de riesgos para tabla
 */
export function getMockRiesgosResumen(): MockRiesgoResumen[] {
  return mockDataJson.riesgosResumen as MockRiesgoResumen[];
}

