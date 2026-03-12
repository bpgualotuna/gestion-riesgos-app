/**
 * Tipos para el Sistema de Auditoría
 * Define las interfaces para el historial de cambios
 */

export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE';

export type TablaAuditoria =
  | 'Riesgo'
  | 'Proceso'
  | 'Usuario'
  | 'Incidencia'
  | 'PlanAccion'
  | 'EvaluacionRiesgo'
  | 'PriorizacionRiesgo'
  | 'CausaRiesgo'
  | 'ControlRiesgo'
  | 'Area'
  | 'Role'
  | 'Cargo'
  | 'ProcesoResponsable'
  | 'DofaItem'
  | 'Normatividad'
  | 'Contexto';

export interface CambioDetalle {
  anterior: any;
  nuevo: any;
}

export interface AuditLog {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRole: string;
  accion: AccionAuditoria;
  tabla: TablaAuditoria;
  registroId?: number;
  registroDesc?: string;
  cambios?: Record<string, CambioDetalle>;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface FiltrosAuditoria {
  usuarioId?: string;
  tabla?: TablaAuditoria | '';
  accion?: AccionAuditoria | '';
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface PaginacionAuditoria {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface RespuestaAuditoria {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EstadisticasAuditoria {
  totalRegistros: number;
  creaciones: number;
  actualizaciones: number;
  eliminaciones: number;
  porTabla: Record<TablaAuditoria, number>;
  porUsuario: Record<string, number>;
  porDia: Record<string, number>;
}
