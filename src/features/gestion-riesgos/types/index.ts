/**
 * Type Definitions for Risk Management
 */

import type { NivelRiesgo, ClasificacionRiesgo, RespuestaRiesgo } from '../../../utils/constants';

// ============================================
// RIESGO (Risk)
// ============================================

export interface Riesgo {
  id: string;
  numero: number;
  descripcion: string;
  clasificacion: ClasificacionRiesgo;
  proceso: string;
  zona: string;
  tipologiaNivelI?: string;
  tipologiaNivelII?: string;
  tipologiaNivelIII?: string;
  tipologiaNivelIV?: string;
  causaRiesgo?: string;
  fuenteCausa?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRiesgoDto {
  descripcion: string;
  clasificacion: ClasificacionRiesgo;
  proceso: string;
  zona: string;
  tipologiaNivelI?: string;
  tipologiaNivelII?: string;
  tipologiaNivelIII?: string;
  tipologiaNivelIV?: string;
  causaRiesgo?: string;
  fuenteCausa?: string;
}

export interface UpdateRiesgoDto extends Partial<CreateRiesgoDto> {
  id: string;
}

// ============================================
// EVALUACIÓN (Evaluation)
// ============================================

export interface Impactos {
  personas: number;
  legal: number;
  ambiental: number;
  procesos: number;
  reputacion: number;
  economico: number;
  tecnologico: number;
}

export interface EvaluacionRiesgo {
  id: string;
  riesgoId: string;
  
  // Impactos (1-5)
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  impactoTecnologico: number;
  
  // Probabilidad (1-5)
  probabilidad: number;
  
  // Resultados calculados
  impactoGlobal: number;
  impactoMaximo: number;
  riesgoInherente: number;
  nivelRiesgo: NivelRiesgo;
  
  // Metadata
  fechaEvaluacion: string;
  evaluadoPor?: string;
  
  // Relaciones
  riesgo?: Riesgo;
}

export interface CreateEvaluacionDto {
  riesgoId: string;
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  impactoTecnologico: number;
  probabilidad: number;
}

// ============================================
// PRIORIZACIÓN (Prioritization)
// ============================================

export interface PriorizacionRiesgo {
  id: string;
  riesgoId: string;
  calificacionFinal: number;
  respuesta: RespuestaRiesgo;
  responsable?: string;
  fechaAsignacion: string;
  puntajePriorizacion?: number;
  
  // Relaciones
  riesgo?: Riesgo;
  evaluacion?: EvaluacionRiesgo;
}

export interface CreatePriorizacionDto {
  riesgoId: string;
  respuesta: RespuestaRiesgo;
  responsable?: string;
  puntajePriorizacion?: number;
}

// ============================================
// CONTROL
// ============================================

export interface Control {
  id: string;
  riesgoId: string;
  descripcion: string;
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
  efectividad?: number;
  
  // Relaciones
  riesgo?: Riesgo;
}

// ============================================
// MAPA DE RIESGOS (Risk Map)
// ============================================

export interface PuntoMapa {
  riesgoId: string;
  descripcion: string;
  probabilidad: number;
  impacto: number;
  nivelRiesgo: NivelRiesgo;
  clasificacion: ClasificacionRiesgo;
}

export interface MatrizRiesgo {
  probabilidad: number;
  impacto: number;
  riesgos: Riesgo[];
  count: number;
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface FiltrosRiesgo {
  busqueda?: string;
  clasificacion?: ClasificacionRiesgo | 'all';
  nivelRiesgo?: NivelRiesgo | 'all';
  proceso?: string;
  zona?: string;
  tipologiaNivelI?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// DASHBOARD
// ============================================

export interface EstadisticasRiesgo {
  totalRiesgos: number;
  criticos: number;
  altos: number;
  medios: number;
  bajos: number;
  positivos: number;
  negativos: number;
  evaluados: number;
  sinEvaluar: number;
}

export interface RiesgoReciente extends Riesgo {
  evaluacion?: EvaluacionRiesgo;
  fechaUltimaModificacion: string;
}
