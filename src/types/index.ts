
export interface Riesgo {
  id: string;
  procesoId: string;
  numero: number;
  descripcion: string;
  clasificacion: string;
  proceso: string;
  zona: string;
  tipologiaNivelI: string;
  tipologiaNivelII: string;
  causaRiesgo: string;
  fuenteCausa: string;
  origen: string;
  vicepresidenciaGerenciaAlta: string;
  siglaVicepresidencia: string;
  gerencia: string;
  siglaGerencia: string;
  createdAt?: string;
  updatedAt?: string;
  fechaUltimaModificacion?: string;
  evaluacion?: EvaluacionRiesgo;
  // Compatibility fields
  tipoRiesgo?: string;
  subtipo?: string;
  objetivo?: string;
  descripcionTipoRiesgo?: string;
  descripcionSubtipo?: string;
}

export interface Evaluacion {
  // Alias for compatibility if needed, but usage shows EvaluacionRiesgo
  id: string;
}

export interface EvaluacionRiesgo {
  id: string;
  riesgoId: string;
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  impactoTecnologico: number;
  probabilidad: number;
  impactoGlobal: number;
  impactoMaximo: number;
  riesgoInherente: number;
  nivelRiesgo: string;
  fechaEvaluacion: string;
  evaluadoPor: string;
}

export interface PriorizacionRiesgo {
  id: string;
  riesgoId: string;
  calificacionFinal: number;
  respuesta: string;
  responsable?: string;
  fechaAsignacion: string;
  puntajePriorizacion?: number;
  riesgo?: Riesgo;
  evaluacion?: EvaluacionRiesgo;
}

export interface Proceso {
  id: string;
  nombre: string;
  descripcion: string;
  vicepresidencia: string;
  gerencia: string;
  responsable: string;
  responsableId: string;
  responsableNombre: string;
  areaId: string;
  areaNombre: string;
  directorId: string;
  directorNombre: string;
  gerenteId?: string;
  gerenteNombre?: string;
  objetivoProceso: string;
  tipoProceso: string;
  activo: boolean;
  estado: 'borrador' | 'aprobado' | 'en_revision';
  createdAt: string;
  updatedAt: string;
  puedeCrear?: string[];
}

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  directorId?: string;
  directorNombre?: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaDto {
  nombre: string;
  descripcion: string;
  directorId?: string;
}

export interface UpdateAreaDto extends Partial<CreateAreaDto> { }

export interface CategoriaRiesgo {
  id: string;
  nombre: string;
  codigo: string;
}

export const NivelRiesgo = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico'
} as const;

export type NivelRiesgo = typeof NivelRiesgo[keyof typeof NivelRiesgo];

// ... existing interfaces
export interface Cargo {
  id: string;
  nombre: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  role: 'admin' | 'dueño_procesos' | 'supervisor' | 'gerente_general';
  email?: string;
  password?: string;
  activo: boolean;
  createdAt?: string;
  cargoId?: string;
  cargoNombre?: string;
}

export const EstadoRiesgo = {
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado',
  MITIGADO: 'Mitigado'
} as const;

export type EstadoRiesgo = typeof EstadoRiesgo[keyof typeof EstadoRiesgo];

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

export interface CreateProcesoDto {
  nombre: string;
  descripcion: string;
  objetivoProceso: string;
  tipoProceso: string;
  vicepresidencia: string;
  gerencia: string;
  responsableId: string;
  areaId: string;
  directorId: string;
}

export interface UpdateProcesoDto extends Partial<CreateProcesoDto> { }

export interface CreateNotificacionDto {
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fecha?: string;
}

export interface UpdateNotificacionDto extends Partial<CreateNotificacionDto> {
  leida?: boolean;
}

export enum EstadoProceso {
  BORRADOR = 'borrador',
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado'
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltrosRiesgo {
  procesoId?: string;
  busqueda?: string;
  clasificacion?: string;
  proceso?: string;
  zona?: string;
  page?: number;
  pageSize?: number;
}

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
  fechaUltimaModificacion: string;
  evaluacion?: EvaluacionRiesgo;
}

export interface PuntoMapa {
  riesgoId: string;
  descripcion: string;
  probabilidad: number;
  impacto: number;
  nivelRiesgo: string;
  clasificacion: string;
  numero: number;
  siglaGerencia: string;
}

export interface RiesgoMapa {
  riesgoId: string;
  probabilidad: number;
  impacto: number;
}

export interface CreateRiesgoDto {
  procesoId: string;
  descripcion: string;
  clasificacion: string;
  zona: string;
  tipologiaNivelI: string;
  tipologiaNivelII: string;
  causaRiesgo: string;
  fuenteCausa: string;
  origen: string;
  vicepresidenciaGerenciaAlta: string;
  siglaVicepresidencia: string;
  gerencia: string;
  siglaGerencia: string;
}

export interface UpdateRiesgoDto extends Partial<CreateRiesgoDto> { }

export interface CreatePriorizacionDto {
  riesgoId: string;
  calificacionFinal: number;
  respuesta: string;
  responsable?: string;
  puntajePriorizacion?: number;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  procesoId?: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fechaLeida?: string;
  createdAt: string;
}

export interface Tarea {
  id: string;
  notificacionId: string;
  usuarioId: string;
  procesoId?: string;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'alta' | 'media' | 'baja';
  completada: boolean;
  fechaCompletada?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Causa {
  id: string;
  descripcion: string;
  fuente: string;
  frecuencia: string;
  seleccionada?: boolean;
}

export interface CausaRiesgo {
  id: string;
  riesgoId?: string;
  descripcion: string;
  fuenteCausa?: string;
  frecuencia?: number;
  calificacionGlobalImpacto?: number;
  calificacionInherentePorCausa?: number;
  // Criterios de evaluación del control (para calificación residual)
  aplicabilidad?: string;
  puntajeAplicabilidad?: number;
  cobertura?: string;
  puntajeCobertura?: number;
  facilidadUso?: string;
  puntajeFacilidad?: number;
  segregacion?: string;
  puntajeSegregacion?: number;
  naturaleza?: string;
  puntajeNaturaleza?: number;
  puntajeTotal?: number;
  // Evaluación del control (preliminar y definitiva)
  evaluacionPreliminar?: string;
  evaluacionDefinitiva?: string;
  efectividadControl?: string;
  // Tipo de mitigación y recomendación
  tipoMitigacion?: 'FRECUENCIA' | 'IMPACTO' | 'AMBAS';
  recomendacion?: string;
  // Valores residuales calculados
  frecuenciaResidual?: number;
  impactoResidual?: number;
  calificacionResidual?: number;
  porcentajeMitigacion?: number;
}

export interface SubtipoRiesgo {
  codigo: string;
  descripcion: string;
}

export interface TipoRiesgo {
  codigo: string;
  nombre: string;
  descripcion: string;
  subtipos: SubtipoRiesgo[];
}

export interface Objetivo {
  id: number;
  codigo: string;
  descripcion: string;
}

export interface Frecuencia {
  id: number;
  label: string;
  descripcion: string;
}

export interface Fuente {
  id: number;
  nombre: string;
}

export interface ImpactoDescripcion {
  categoria?: string;
  nivel?: number;
  descripcion: string;
  tipo?: string; // For compatibility with page
  valor?: number; // For compatibility with page
}


export interface RiesgoFormData {
  id: string;
  descripcionRiesgo: string;
  numeroIdentificacion: string;
  origenRiesgo: string;
  tipoProceso: string;
  consecuencia: string;
  tipoRiesgo: string;
  subtipoRiesgo: string;
  objetivo: string;
  causas: CausaRiesgo[];
  impactos: {
    economico: number;
    procesos: number;
    legal: number;
    confidencialidadSGSI: number;
    reputacion: number;
    disponibilidadSGSI: number;
    personas: number;
    integridadSGSI: number;
    ambiental: number;
  };
}
export interface Vicepresidencia {
  id: string;
  nombre: string;
  sigla: string;
}

export interface Gerencia {
  id: string;
  nombre: string;
  sigla: string;
  subdivision?: string;
}
