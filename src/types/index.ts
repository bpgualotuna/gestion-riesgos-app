
export interface Impactos {
  personas: number;
  legal: number;
  ambiental: number;
  procesos: number;
  reputacion: number;
  economico: number;
  tecnologico: number;
  confidencialidadSGSI?: number;
  disponibilidadSGSI?: number;
  integridadSGSI?: number;
}

export interface Riesgo {
  id: number | string;
  procesoId: number | string;
  numero: number;
  descripcion: string;
  clasificacion: string;
  proceso: string;
  zona?: string;
  tipologiaNivelI?: string;
  tipologiaNivelII?: string;
  causaRiesgo?: string;
  fuenteCausa?: string;
  origen?: string;
  vicepresidenciaGerenciaAlta?: string;
  siglaVicepresidencia?: string;
  gerencia?: string;
  siglaGerencia?: string;
  createdAt?: string;
  updatedAt?: string;
  fechaUltimaModificacion?: string;
  evaluacion?: EvaluacionRiesgo;
  causas?: CausaRiesgo[];
  // Compatibility fields
  tipoRiesgo?: string;
  subtipo?: string;
  objetivo?: string;
  descripcionTipoRiesgo?: string;
  descripcionSubtipo?: string;
  // Campos adicionales del proceso
  procesoNombre?: string;
  areaNombre?: string;
  responsableNombre?: string;
}

export interface Evaluacion {
  // Alias for compatibility if needed, but usage shows EvaluacionRiesgo
  id: string;
}

export interface EvaluacionRiesgo {
  id: number | string;
  riesgoId: number | string;
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  impactoTecnologico?: number;
  confidencialidadSGSI?: number;
  disponibilidadSGSI?: number;
  integridadSGSI?: number;
  probabilidad: number;
  impactoGlobal: number;
  impactoMaximo: number;
  riesgoInherente: number;
  nivelRiesgo: string;
  fechaEvaluacion?: string;
  evaluadoPor?: string;
  // Valores residuales
  probabilidadResidual?: number;
  impactoResidual?: number;
  riesgoResidual?: number;
  nivelRiesgoResidual?: string;
}

export interface PriorizacionRiesgo {
  id: number | string;
  riesgoId: number | string;
  calificacionFinal: number;
  respuesta: string;
  responsable?: string;
  fechaAsignacion: string;
  puntajePriorizacion?: number;
  riesgo?: Riesgo;
  evaluacion?: EvaluacionRiesgo;
}

export interface Proceso {
  id: number | string;
  nombre: string;
  descripcion: string;
  vicepresidencia: string;
  gerencia: string;
  sigla?: string; // Sigla del proceso para identificar riesgos (ej: "PF" para Planificación Financiera)
  responsable: string;
  responsableId: number | string;
  responsableNombre: string;
  areaId: number | string;
  areaNombre: string;
  directorId: number | string;
  directorNombre: string;
  gerenteId?: string;
  gerenteNombre?: string;
  objetivoProceso: string;
  tipoProceso: string;
  activo: boolean;
  estado: string; // borrador, en_revision, aprobado

  // Análisis y documentación
  analisis?: string;
  documentoUrl?: string;
  documentoNombre?: string;

  dofaItems?: any[];
  normatividades?: any[];
  contextos?: any[];
  createdAt: string;
  updatedAt: string;
  puedeCrear?: string[];
  responsablesList?: Array<{ id: number; nombre: string; email?: string; role?: string }>;
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
  id: number | string;
  nombre: string;
  descripcion?: string;
}

export interface Usuario {
  id: number | string;
  nombre: string;
  role: 'admin' | 'dueño_procesos' | 'supervisor' | 'gerente_general' | 'manager' | 'analyst' | 'director_procesos';
  email?: string;
  password?: string;
  activo: boolean;
  createdAt?: string;
  cargoId?: number | string;
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
  analisis?: string;
  documentoUrl?: string;
  documentoNombre?: string;
}

export interface UpdateProcesoDto extends Partial<CreateProcesoDto> {
  dofaItems?: Array<{ tipo: string; descripcion: string }>;
  normatividades?: any[];
  contextos?: Array<{ tipo: string; descripcion: string }>;
}

export interface CreateNotificacionDto {
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  fecha?: string;
}

export interface UpdateNotificacionDto extends Partial<CreateNotificacionDto> {
  leida?: boolean;
}

export const EstadoProceso = {
  BORRADOR: 'borrador',
  EN_REVISION: 'en_revision',
  APROBADO: 'aprobado'
} as const;

export type EstadoProceso = typeof EstadoProceso[keyof typeof EstadoProceso];

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FiltrosRiesgo {
  procesoId?: string | number;
  busqueda?: string;
  clasificacion?: string;
  nivelRiesgo?: string;
  proceso?: string;
  zona?: string;
  page?: number;
  pageSize?: number;
  includeCausas?: boolean;
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
  numeroIdentificacion?: string;
  probabilidadResidual?: number;
  impactoResidual?: number;
  procesoId?: number | string;
  procesoNombre?: string;
  zona?: string | null;
  tipologiaNivelI?: string | null;
}

export interface RiesgoMapa {
  riesgoId: string;
  probabilidad: number;
  impacto: number;
}

export interface CreateRiesgoDto {
  procesoId: number | string;
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
  prioridad: 'critica' | 'alta' | 'media' | 'baja';
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
  fuenteCausaHSEQ?: string;
  fuenteCausaLAFT?: string;
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
  controlDescripcion?: string;
  controlResponsable?: string;
  controlDesviaciones?: string;
  tieneControl?: boolean;
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

export interface ImpactoNivel {
  id: number;
  nivel: number;
  descripcion: string;
}

export interface ImpactoTipo {
  id: number;
  clave: string;
  nombre: string;
  niveles: ImpactoNivel[];
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
  riesgoResidual?: number;
}
export interface Vicepresidencia {
  id: string;
  nombre: string;
  sigla: string;
}

export interface Gerencia {
  id: number | string;
  nombre: string;
  sigla: string;
  subdivision?: string;
}

export interface ObservacionProceso {
  id: string;
  procesoId: string;
  texto: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
  resuelta: boolean;
}

export interface Observacion {
  id: string;
  procesoId: string;
  autorId: string;
  autorNombre: string;
  texto: string;
  tipo: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateObservacionDto {
  procesoId?: string;
  texto: string;
  tipo: string;
}

export interface HistorialCambioProceso {
  id: string;
  procesoId: string;
  tipo: 'envio_revision' | 'aprobacion' | 'rechazo' | 'resolucion' | 'modificacion' | 'creacion';
  mensaje: string;
  fecha: string;
  usuarioId: string;
  usuarioNombre: string;
  accion?: 'creado' | 'modificado' | 'enviado_revision' | 'aprobado' | 'rechazado' | 'observaciones_agregadas' | 'observaciones_resueltas';
  descripcion?: string;
  cambios?: Record<string, { anterior: any; nuevo: any }>;
}

/**
 * Historial de cambios para datos de procesos
 * Registra modificaciones en: ficha, análisis, normatividad, contexto, DOFA, benchmarking
 */
export interface HistorialCambio {
  id: string;
  procesoId: string;
  procesoNombre: string;
  seccion: 'ficha' | 'analisis' | 'normatividad' | 'contextoInterno' | 'contextoExterno' | 'dofa' | 'benchmarking';
  accion: 'crear' | 'editar' | 'eliminar';
  camposModificados: string[]; // Lista de campos que se modificaron
  valoresAnteriores?: Record<string, any>; // Valores antes del cambio
  valoresNuevos?: Record<string, any>; // Valores después del cambio
  razonCambio?: string; // Razón o decisión del cambio
  usuarioId: string;
  usuarioNombre: string;
  fecha: string; // ISO string
  createdAt: string;
}
export interface ControlRiesgo {
  id: string;
  causaRiesgoId: string;
  descripcion: string;
  tipoControl: TipoControlHSEQ;
  disminuyeFrecuenciaImpactoAmbas: TipoEfectoControl;
  responsable?: string;
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
  puntajeControl: number;
  evaluacionPreliminar: string;
  evaluacionDefinitiva: string;
  estandarizacionPorcentajeMitigacion: number;
}

export type TipoControlHSEQ = 'EVITAR_ELIMINAR' | 'SUSTITUIR' | 'CONTROL_INGENIERIA' | 'SENALIZACION_INFORMACION' | 'EPP' | 'RECOMENDACIONES_OTROS' | 'ADMINISTRATIVOS' | 'AUDITORIAS_INSPECCIONES_OBSERVACIONES' | 'AST_PERMISO' | 'MANTENIMIENTO' | 'MEDICIONES' | 'PROCEDIMIENTOS_OPERATIVOS_EMERGENCIA' | 'CHARLA_HSEQ_ENTRENAMIENTO' | 'TRANSFERIR_RIESGO' | 'COMPARTIR_RIESGO' | 'PROGRAMA_ASOCIADO';

export type TipoEfectoControl = 'FRECUENCIA' | 'IMPACTO' | 'AMBAS';

export type NaturalezaControl = 'Manual' | 'Semiautomático' | 'Automático';
