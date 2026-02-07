/**
 * Type Definitions for Risk Management
 */

import type { NivelRiesgo, ClasificacionRiesgo, RespuestaRiesgo } from '../../shared/utils/constants';

// ============================================
// ÁREA (Area)
// ============================================

export interface Area {
  id: string;
  nombre: string;
  descripcion?: string;
  directorId?: string; // ID del usuario director de procesos asignado
  directorNombre?: string; // Nombre del director (para display)
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaDto {
  nombre: string;
  descripcion?: string;
  directorId?: string;
}

export interface UpdateAreaDto extends Partial<CreateAreaDto> {
  id: string;
  activo?: boolean;
}

// ============================================
// PROCESO (Process)
// ============================================

// Estados del proceso
export type EstadoProceso = 'borrador' | 'en_revision' | 'aprobado' | 'con_observaciones';

export interface Proceso {
  id: string;
  nombre: string;
  descripcion?: string;
  vicepresidencia?: string;
  gerencia?: string;
  responsable?: string;
  responsableId?: string; // ID del usuario responsable
  responsableNombre?: string; // Nombre del responsable (para display)
  areaId?: string; // ID del área a la que pertenece
  areaNombre?: string; // Nombre del área (para display)
  directorId?: string; // ID del director de procesos asignado (heredado del área o específico)
  directorNombre?: string; // Nombre del director (para display)
  objetivoProceso?: string;
  tipoProceso?: '01 Estratégico' | '02 Operacional' | '03 Apoyo' | 'Talento Humano' | 'Planificación Financiera' | 'Otro' | string;
  puedeCrear?: string[]; // IDs de usuarios que pueden crear este proceso
  activo: boolean;
  estado: EstadoProceso; // Estado del proceso en el flujo de revisión
  gerenteId?: string; // ID del gerente que revisa
  gerenteNombre?: string; // Nombre del gerente (para display)
  fechaEnviadoRevision?: string; // Fecha en que se envió a revisión
  fechaAprobado?: string; // Fecha en que fue aprobado
  createdAt: string;
  updatedAt: string;
}

export interface CreateProcesoDto {
  nombre: string;
  descripcion?: string;
  vicepresidencia?: string;
  gerencia?: string;
  responsable?: string;
  responsableId?: string;
  areaId?: string;
  directorId?: string;
  objetivoProceso?: string;
  tipoProceso?: '01 Estratégico' | '02 Operacional' | '03 Apoyo' | 'Talento Humano' | 'Planificación Financiera' | 'Otro' | string;
  puedeCrear?: string[];
}

export interface UpdateProcesoDto extends Partial<CreateProcesoDto> {
  estado?: EstadoProceso;
  id: string;
  activo?: boolean;
}

// ============================================
// RIESGO (Risk)
// ============================================

export interface Riesgo {
  id: string;
  procesoId: string; // ID del proceso al que pertenece
  numero: number;
  
  // Estructura Organizacional
  vicepresidenciaGerenciaAlta?: string;
  siglaVicepresidencia?: string;
  gerencia?: string;
  siglaGerencia?: string;
  subdivision?: string;
  siglaSubdivision?: string;
  zona: string;
  proceso: string; // Nombre del proceso (para compatibilidad)
  macroproceso?: string;
  
  // Información del Riesgo
  descripcion: string;
  clasificacion: ClasificacionRiesgo;
  tipologiaNivelI?: string;
  tipologiaNivelII?: string;
  tipologiaNivelIII?: string;
  tipologiaNivelIV?: string;
  
  // Causa del Riesgo (legacy - mantener para compatibilidad, pero usar CausaRiesgo[])
  causaRiesgo?: string;
  fuenteCausa?: string;
  fuenteCausaHSEQ?: string;
  fuenteCausaLAFT?: string;
  origen?: string; // Origen del riesgo (Talleres internos, Auditoría HHI, etc.)
  
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRiesgoDto {
  procesoId: string; // ID del proceso (requerido)
  
  // Estructura Organizacional
  vicepresidenciaGerenciaAlta?: string;
  siglaVicepresidencia?: string;
  gerencia?: string;
  siglaGerencia?: string;
  subdivision?: string;
  siglaSubdivision?: string;
  zona: string;
  proceso: string; // Nombre del proceso (para compatibilidad)
  macroproceso?: string;
  
  // Información del Riesgo
  descripcion: string;
  clasificacion: ClasificacionRiesgo;
  tipologiaNivelI?: string;
  tipologiaNivelII?: string;
  tipologiaNivelIII?: string;
  tipologiaNivelIV?: string;
  
  // Causa del Riesgo (legacy)
  causaRiesgo?: string;
  fuenteCausa?: string;
  fuenteCausaHSEQ?: string;
  fuenteCausaLAFT?: string;
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

// ============================================
// EVALUACIÓN INHERENTE - CONSECUENCIAS NEGATIVAS
// ============================================

export interface EvaluacionInherenteNegativa {
  id: string;
  riesgoId: string;
  
  // Impactos (1-5)
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  
  // Frecuencia (1-5)
  frecuencia: number;
  
  // Resultados calculados
  calificacionGlobalImpacto: number;
  calificacionInherenteGlobal: number;
  
  // Metadata
  fechaEvaluacion: string;
  evaluadoPor?: string;
  
  // Relaciones
  riesgo?: Riesgo;
  causas?: CausaRiesgo[];
}

// ============================================
// EVALUACIÓN INHERENTE - CONSECUENCIAS POSITIVAS
// ============================================

export interface EvaluacionInherentePositiva {
  id: string;
  riesgoId: string;
  
  // Impactos (1-5)
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  
  // Frecuencia (1-5)
  frecuencia: number;
  
  // Resultados calculados
  calificacionGlobalImpacto: number;
  calificacionInherenteGlobal: number;
  
  // Metadata
  fechaEvaluacion: string;
  evaluadoPor?: string;
  
  // Relaciones
  riesgo?: Riesgo;
}

// ============================================
// EVALUACIÓN RESIDUAL
// ============================================

export interface EvaluacionResidual {
  id: string;
  riesgoId: string;
  evaluacionInherenteNegativaId: string;
  
  // Calificaciones Residuales
  calificacionResidualFrecuencia: number;
  calificacionResidualImpacto: number;
  calificacionCausaResidual: number;
  calificacionRiesgoResidual: number;
  
  // Metadata
  fechaEvaluacion: string;
  evaluadoPor?: string;
  
  // Relaciones
  riesgo?: Riesgo;
  evaluacionInherenteNegativa?: EvaluacionInherenteNegativa;
}

// ============================================
// EVALUACIÓN COMPLETA DEL RIESGO (Legacy - mantener para compatibilidad)
// ============================================

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
// CAUSA DEL RIESGO (Risk Cause)
// ============================================

export interface CausaRiesgo {
  id: string;
  riesgoId: string;
  descripcion: string;
  fuenteCausa?: string;
  fuenteCausaHSEQ?: string;
  fuenteCausaLAFT?: string;
  areasAfectadasHSEQ?: string; // AREAS A LAS QUE AFECTA EL RIESGO (Salud Ocupacional/Ambiental)
  
  // Evaluación Inherente por Causa
  frecuencia?: number;
  impactoProcesos?: number;
  impactoEconomico?: number;
  impactoReputacional?: number;
  impactoAmbiental?: number;
  impactoPersonas?: number;
  impactoLegal?: number;
  calificacionGlobalImpacto?: number;
  calificacionInherentePorCausa?: number;
  
  // Relaciones
  riesgo?: Riesgo;
  controles?: ControlRiesgo[];
}

export interface CreateCausaRiesgoDto {
  riesgoId: string;
  descripcion: string;
  fuenteCausa?: string;
  fuenteCausaHSEQ?: string;
  fuenteCausaLAFT?: string;
  areasAfectadasHSEQ?: string;
}

// ============================================
// CONTROL DEL RIESGO (Risk Control)
// ============================================

export type TipoControlHSEQ =
  | 'EVITAR_ELIMINAR'
  | 'SUSTITUIR'
  | 'CONTROL_INGENIERIA'
  | 'SENALIZACION_INFORMACION'
  | 'EPP'
  | 'RECOMENDACIONES_OTROS'
  | 'ADMINISTRATIVOS'
  | 'AUDITORIAS_INSPECCIONES_OBSERVACIONES'
  | 'AST_PERMISO'
  | 'MANTENIMIENTO'
  | 'MEDICIONES'
  | 'PROCEDIMIENTOS_OPERATIVOS_EMERGENCIA'
  | 'CHARLA_HSEQ_ENTRENAMIENTO'
  | 'TRANSFERIR_RIESGO'
  | 'COMPARTIR_RIESGO'
  | 'PROGRAMA_ASOCIADO';

export type TipoEfectoControl = 'FRECUENCIA' | 'IMPACTO' | 'AMBAS';

export type NaturalezaControl = 'Manual' | 'Semiautomático' | 'Automático';

export type EvaluacionControl = 'Efectivo' | 'Inefectivo';

export interface ControlRiesgo {
  id: string;
  causaRiesgoId: string;
  descripcion: string;
  
  // Clasificación del Control (HSEQ)
  tipoControl?: TipoControlHSEQ;
  
  // Efecto del Control
  disminuyeFrecuenciaImpactoAmbas?: TipoEfectoControl;
  
  // Responsable
  responsable?: string;
  
  // Variables de Evaluación del Control
  aplicabilidad?: number; // 0 o 1
  cobertura?: number; // 0, 0.1, o 1
  facilidadUso?: number; // 0, 0.1, o 1
  segregacion?: number; // 0 o 1
  naturaleza?: number; // 0.4, 0.6, o 1
  desviaciones?: number; // Número de fallos en el último año
  
  // Cálculos
  puntajeControl?: number;
  evaluacionPreliminar?: EvaluacionControl;
  evaluacionDefinitiva?: EvaluacionControl;
  estandarizacionPorcentajeMitigacion?: number; // Porcentaje
  
  // Evaluación Residual por Control
  calificacionResidualFrecuencia?: number;
  calificacionResidualImpacto?: number;
  calificacionCausaResidual?: number;
  calificacionRiesgoResidual?: number;
  
  // Relaciones
  causaRiesgo?: CausaRiesgo;
}

export interface CreateControlRiesgoDto {
  causaRiesgoId: string;
  descripcion: string;
  tipoControl?: TipoControlHSEQ;
  disminuyeFrecuenciaImpactoAmbas?: TipoEfectoControl;
  responsable?: string;
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
}

// ============================================
// CONTROL (Legacy - mantener para compatibilidad)
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
  numero?: number;
  siglaGerencia?: string;
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

// ============================================
// OBSERVACIONES (Observations)
// ============================================

export interface Observacion {
  id: string;
  procesoId?: string; // Si es observación de proceso
  riesgoId?: string; // Si es observación de riesgo
  autorId: string; // ID del usuario que crea la observación
  autorNombre: string; // Nombre del autor
  texto: string;
  tipo: 'proceso' | 'riesgo' | 'general';
  estado: 'pendiente' | 'revisada' | 'resuelta';
  fechaCreacion: string;
  fechaActualizacion: string;
  respuestas?: RespuestaObservacion[]; // Historial de respuestas
}

export interface RespuestaObservacion {
  id: string;
  observacionId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  fechaCreacion: string;
}

export interface CreateObservacionDto {
  procesoId?: string;
  riesgoId?: string;
  texto: string;
  tipo: 'proceso' | 'riesgo' | 'general';
}

export interface UpdateObservacionDto {
  id: string;
  texto?: string;
  estado?: 'pendiente' | 'revisada' | 'resuelta';
}

// ============================================
// FILTROS Y BÚSQUEDA
// ============================================

export interface FiltrosRiesgo {
  procesoId?: string; // Filtrar por ID de proceso
  busqueda?: string;
  clasificacion?: ClasificacionRiesgo | 'all';
  nivelRiesgo?: NivelRiesgo | 'all';
  proceso?: string; // Nombre del proceso (para compatibilidad)
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

// ============================================
// REVISIÓN Y APROBACIÓN DE PROCESOS
// ============================================

// Estados del proceso en el flujo de revisión (ya definido arriba, no duplicar)

// Observación del gerente sobre un proceso
export interface ObservacionProceso {
  id: string;
  procesoId: string;
  gerenteId: string;
  gerenteNombre: string;
  observacion: string;
  fecha: string;
  resuelta: boolean;
  fechaResuelta?: string;
  createdAt: string;
}

// Historial de cambios del proceso
export interface HistorialCambioProceso {
  id: string;
  procesoId: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: 'creado' | 'modificado' | 'enviado_revision' | 'aprobado' | 'rechazado' | 'observaciones_agregadas' | 'observaciones_resueltas';
  descripcion: string;
  cambios?: Record<string, { anterior: any; nuevo: any }>; // Detalle de los cambios
  fecha: string;
  createdAt: string;
}

// Notificación del sistema
export interface Notificacion {
  id: string;
  usuarioId: string; // Usuario destinatario
  tipo: 'proceso_enviado_revision' | 'proceso_aprobado' | 'proceso_rechazado' | 'observaciones_agregadas' | 'observaciones_resueltas';
  titulo: string;
  mensaje: string;
  procesoId?: string;
  observacionId?: string;
  leida: boolean;
  fechaLeida?: string;
  createdAt: string;
}

// Tarea generada a partir de una notificación
export interface Tarea {
  id: string;
  notificacionId: string;
  usuarioId: string;
  procesoId?: string;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  fechaLimite?: string;
  completada: boolean;
  fechaCompletada?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateObservacionProcesoDto {
  procesoId: string;
  observacion: string;
}

export interface UpdateObservacionProcesoDto {
  id: string;
  resuelta: boolean;
}
