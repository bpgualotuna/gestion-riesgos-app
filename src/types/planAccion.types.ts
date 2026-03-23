// Tipos para el sistema de trazabilidad y evolución de Planes de Acción

export type EstadoPlan =
  | 'en_revision'
  | 'revisado';

export interface PlanAccion {
  id: number;
  priorizacionId?: number;
  riesgoId?: number;
  incidenciaId?: number;
  causaRiesgoId?: number;
  nombre?: string;
  objetivo?: string;
  descripcion: string;
  responsable?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaProgramada?: string;
  fechaEjecucion?: string;
  estado: EstadoPlan;
  prioridad?: number;
  presupuesto?: number;
  porcentajeAvance?: number;
  observaciones?: string;
  controlDerivadoId?: number;
  fechaConversion?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones populadas
  controlDerivado?: Control;
  riesgo?: any;
  incidencia?: any;
}

export interface Control {
  id: number;
  riesgoId: number;
  descripcion?: string;
  tipoControl?: string;
  diseño: number;
  ejecucion: number;
  solidez: number;
  efectividad: number;
  riesgoResidual: number;
  clasificacionResidual: string;
  planAccionOrigenId?: number;
  fechaCreacionDesdePlan?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones populadas
  planAccionOrigen?: PlanAccion;
  riesgo?: any;
}

export interface AlertaVencimiento {
  id: number;
  planAccionId: number;
  usuarioId: number;
  tipo: 'proximo' | 'vencido';
  diasRestantes?: number;
  leida: boolean;
  fechaGeneracion: string;
  fechaLectura?: string;

  // Relaciones populadas
  planAccion?: PlanAccion;
  usuario?: any;
}

export interface EventoTrazabilidad {
  id: number;
  fecha: string;
  tipo: 'creacion' | 'cambio_estado' | 'conversion' | 'eliminacion';
  descripcion: string;
  usuario: string;
  estadoAnterior?: EstadoPlan;
  estadoNuevo?: EstadoPlan;
}

export interface ControlFromPlanData {
  descripcion: string;
  tipoControl: 'prevención' | 'detección' | 'corrección';
  responsable: string;
  observaciones?: string;
}

// Props de componentes

export interface PlanAccionCardProps {
  plan: PlanAccion;
  onEstadoChange: (planId: number, nuevoEstado: EstadoPlan) => void;
  onConvertirAControl: (planId: number) => void;
  onEdit?: (planId: number) => void;
  onDelete?: (planId: number) => void;
  onVerDetalle?: (planId: number) => void;
  showConversionButton?: boolean;
}

export interface ConversionDialogProps {
  open: boolean;
  plan: PlanAccion | null;
  onClose: () => void;
  onConfirm: (controlData: ControlFromPlanData) => Promise<void>;
}

export interface EstadoPlanSelectorProps {
  estadoActual: EstadoPlan;
  onChange: (nuevoEstado: EstadoPlan) => void;
  disabled?: boolean;
}

export interface AlertasVencimientoPanelProps {
  alertas: AlertaVencimiento[];
  onMarcarLeida: (alertaId: number) => void;
  onVerPlan: (planId: number) => void;
}

export interface TrazabilidadTimelineProps {
  planId: number;
  controlId?: number;
  eventos: EventoTrazabilidad[];
}
