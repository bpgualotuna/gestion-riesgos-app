/**
 * Detecta causas con vía de gestión por control pero sin control vinculado (afecta residual en mapa/cálculos).
 */
export function causaGestionControlSinControlesAsociados(causa: {
  tipoGestion?: string;
  puntajeTotal?: unknown;
  controles?: unknown[];
  gestion?: { estadoAmbos?: { controlActivo?: boolean } };
}): boolean {
  const tipo = String(causa.tipoGestion ?? (causa.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
  const sinCtrl = !Array.isArray(causa.controles) || causa.controles.length === 0;
  if (tipo === 'CONTROL' && sinCtrl) return true;
  if (tipo === 'AMBOS') {
    const estado = causa.gestion?.estadoAmbos;
    const controlActivo = estado ? estado.controlActivo !== false : true;
    if (controlActivo && sinCtrl) return true;
  }
  return false;
}

/** Hay al menos un plan de acción persistido en la causa. */
export function causaTienePlanEnRelacion(causa: { planesAccion?: unknown[] }): boolean {
  return Array.isArray(causa.planesAccion) && causa.planesAccion.length > 0;
}

/**
 * Control persistido con datos mínimos (no basta un array vacío o un objeto vacío).
 * Evita mostrar avisos «sin control» cuando ya existe un ControlRiesgo real.
 */
export function causaTieneControlVinculadoEfectivo(causa: { controles?: unknown[] }): boolean {
  if (!Array.isArray(causa.controles) || causa.controles.length === 0) return false;
  return causa.controles.some((raw) => {
    if (raw == null || typeof raw !== 'object') return false;
    const c = raw as Record<string, unknown>;
    const id = c.id;
    if (id != null && String(id).trim() !== '' && !Number.isNaN(Number(id))) return true;
    const desc = String(c.descripcionControl ?? c.descripcion ?? '').trim();
    if (desc.length > 0) return true;
    const pc = c.puntajeControl;
    if (pc != null && String(pc).trim() !== '') return true;
    return false;
  });
}

/** Alineado con backend: plan en la causa y sin control vinculado (condición de la regla residual = inherente). */
export function causaTienePlanSinControlAsociado(causa: {
  planesAccion?: unknown[];
  controles?: unknown[];
}): boolean {
  if (!causaTienePlanEnRelacion(causa)) return false;
  return !causaTieneControlVinculadoEfectivo(causa);
}

/** Texto nativo `title` en filas de tabla de controles (tooltip al pasar el mouse). */
export function tituloTooltipFilaControlResidual(reglaPlanCausaActiva: boolean): string {
  const extra = reglaPlanCausaActiva
    ? ' Con la regla «plan en causa» activa, también si hay plan en la causa y aún no hay control vinculado.'
    : '';
  return `La calificación residual puede coincidir con la inherente por falta de controles en la causa, o si el control no mitiga en el mapa.${extra}`;
}

/** Texto nativo `title` en filas de tabla de planes. */
export function tituloTooltipFilaPlanResidual(reglaPlanCausaActiva: boolean): string {
  if (reglaPlanCausaActiva) {
    return 'Regla activa: con plan y sin control vinculado, residual = inherente; con control, residual por mitigación.';
  }
  return 'El residual depende de controles y del plan; si falta control en causas gestionadas por control, el residual puede igualar al inherente.';
}
