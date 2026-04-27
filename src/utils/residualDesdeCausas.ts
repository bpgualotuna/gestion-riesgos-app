import type { Riesgo } from '../types';
import { causaTienePlanSinControlAsociado } from './avisoResidualPorCausa';

export interface ResultadoResidualDesdeCausas {
  probabilidadResidual: number;
  impactoResidual: number;
  riesgoResidual: number;
  nivelRiesgoResidual: string;
}

/** Bandas CWR alineadas con mapa / Controles (misma escala que `calcularNivelRiesgo` del mapa). */
export function nivelResidualDesdeCalificacionNumerica(mejorCal: number): string {
  let nivel = 'Sin Calificar';
  if (mejorCal >= 15 && mejorCal <= 25) nivel = 'Crítico';
  else if (mejorCal >= 10 && mejorCal < 15) nivel = 'Alto';
  else if (mejorCal >= 4 && mejorCal < 10) nivel = 'Medio';
  else if (mejorCal >= 1 && mejorCal < 4) nivel = 'Bajo';
  return nivel;
}

/** Causa que entra en el máximo residual por control (misma condición que el mapa estándar). */
export function causaIncluidaEnAgregadoResidualPorControles(c: any): boolean {
  const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
  const tieneControles = Array.isArray(c.controles) && c.controles.length > 0;
  return tipo === 'CONTROL' || tipo === 'AMBOS' || tieneControles;
}

function parseGestion(causa: any): Record<string, unknown> {
  if (!causa?.gestion) return {};
  if (typeof causa.gestion === 'string') {
    try {
      return JSON.parse(causa.gestion) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof causa.gestion === 'object') return causa.gestion as Record<string, unknown>;
  return {};
}

export interface OpcionesResidualPorCausa {
  /** Si true, no aplica porcentaje de mitigación del control (residual de la causa = inherente de la causa). */
  omitirMitigacion?: boolean;
}

export interface OpcionesResidualDesdeCausas {
  /**
   * Si true y el riesgo tiene al menos una causa con plan de acción **sin** control vinculado,
   * devuelve la calificación residual alineada con la evaluación inherente persistida (misma regla que el servidor).
   */
  forzarInherenteSiPlanCausa?: boolean;
}

/** Misma condición que `debeForzarResidualIgualInherentePorPlanesCausa` en backend (plan en causa sin control). */
export function riesgoTieneCausaConPlanSinControlCliente(
  riesgo: Riesgo | Record<string, unknown> | null | undefined
): boolean {
  const causas =
    riesgo && Array.isArray((riesgo as { causas?: unknown }).causas)
      ? ((riesgo as { causas: Record<string, unknown>[] }).causas)
      : [];
  return causas.some((c) => causaTienePlanSinControlAsociado(c));
}

/** @deprecated Usar `riesgoTieneCausaConPlanSinControlCliente` (regla refinada: solo plan sin control). */
export function riesgoTienePlanAccionEnAlgunaCausaCliente(
  riesgo: Riesgo | Record<string, unknown> | null | undefined
): boolean {
  return riesgoTieneCausaConPlanSinControlCliente(riesgo);
}

/**
 * Calificación residual de una sola causa con control (misma fórmula que el mapa).
 * Usa `causa.controles[0]` (ControlRiesgo) para mitigación cuando existe.
 */
export function calcularResidualPorCausa(
  causa: any,
  opts?: OpcionesResidualPorCausa
): ResultadoResidualDesdeCausas | null {
  if (!causa) return null;

  const control = causa.controles?.[0] || {};
  const g = parseGestion(causa);

  let porcentajeMitigacion = 0;
  if (!opts?.omitirMitigacion && control.estandarizacionPorcentajeMitigacion !== undefined) {
    porcentajeMitigacion = Number(control.estandarizacionPorcentajeMitigacion) / 100;
  } else if (!opts?.omitirMitigacion && g.porcentajeMitigacion !== undefined) {
    const valor = Number(g.porcentajeMitigacion);
    porcentajeMitigacion = valor > 1 ? valor / 100 : valor;
  } else if (!opts?.omitirMitigacion && causa.porcentajeMitigacion !== undefined) {
    const valor = Number(causa.porcentajeMitigacion);
    porcentajeMitigacion = valor > 1 ? valor / 100 : valor;
  }

  const tipoMitigacion =
    (control as any).disminuyeFrecuenciaImpactoAmbas ||
    (control as any).tipoMitigacion ||
    g.tipoMitigacion ||
    causa.tipoMitigacion ||
    'AMBAS';

  const frecuenciaInherente = Number(causa.frecuencia || 3);
  const impactoInherente = Number(causa.calificacionGlobalImpacto || 1);

  let fr = frecuenciaInherente;
  if (tipoMitigacion === 'FRECUENCIA' || tipoMitigacion === 'AMBAS') {
    fr = frecuenciaInherente - frecuenciaInherente * porcentajeMitigacion;
    fr = Math.max(1, Math.min(5, Math.ceil(fr)));
  }

  let ir = impactoInherente;
  if (tipoMitigacion === 'IMPACTO' || tipoMitigacion === 'AMBAS') {
    ir = impactoInherente - impactoInherente * porcentajeMitigacion;
    ir = Math.max(1, Math.min(5, Math.ceil(ir)));
  }

  const cal = fr === 2 && ir === 2 ? 3.99 : fr * ir;

  if (isNaN(cal) || cal <= 0) return null;

  return {
    probabilidadResidual: fr,
    impactoResidual: ir,
    riesgoResidual: cal,
    nivelRiesgoResidual: nivelResidualDesdeCalificacionNumerica(cal),
  };
}

/** Efectividad, % mitigación y descripción del control para tablas (prioriza ControlRiesgo). */
export function getDatosEvaluacionControlDesdeCausa(causa: any): {
  descripcionControl: string;
  efectividad: string;
  /** Entero 0–100 para mostrar con "%" */
  porcentajeMitigacionEntero: number;
} {
  const c = causa?.controles?.[0] || {};
  const g = parseGestion(causa);

  const descripcionControl =
    (c as any).descripcion ||
    (c as any).descripcionControl ||
    (g as any).controlDescripcion ||
    causa?.controlDescripcion ||
    'Sin descripción';

  const efectividad =
    (c as any).evaluacionDefinitiva ||
    (g as any).evaluacionDefinitiva ||
    causa?.evaluacionDefinitiva ||
    'Sin evaluar';

  let porcentajeMitigacionEntero = 0;
  if ((c as any).estandarizacionPorcentajeMitigacion !== undefined && (c as any).estandarizacionPorcentajeMitigacion !== null) {
    porcentajeMitigacionEntero = Math.round(Number((c as any).estandarizacionPorcentajeMitigacion));
  } else if (g.porcentajeMitigacion !== undefined) {
    const valor = Number(g.porcentajeMitigacion);
    porcentajeMitigacionEntero = valor > 1 ? Math.round(valor) : Math.round(valor * 100);
  } else if (causa?.porcentajeMitigacion !== undefined) {
    const valor = Number(causa.porcentajeMitigacion);
    porcentajeMitigacionEntero = valor > 1 ? Math.round(valor) : Math.round(valor * 100);
  }

  return { descripcionControl, efectividad, porcentajeMitigacionEntero };
}

/** Causa con mayor calificación residual (misma regla que Controles / mapa residual). */
export function calcularResidualDesdeCausas(
  riesgo: Riesgo | any,
  opts?: OpcionesResidualDesdeCausas
): ResultadoResidualDesdeCausas | null {
  const causas = riesgo && Array.isArray((riesgo as any).causas) ? (riesgo as any).causas : [];
  if (!causas || causas.length === 0) return null;

  if (opts?.forzarInherenteSiPlanCausa && riesgoTieneCausaConPlanSinControlCliente(riesgo)) {
    const ev = (riesgo as { evaluacion?: Record<string, unknown> }).evaluacion;
    if (!ev) return null;
    const pr = Math.max(1, Math.min(5, Math.round(Number(ev.probabilidad ?? 1))));
    const ig = ev.impactoGlobal != null ? Number(ev.impactoGlobal) : Number(ev.impactoMaximo ?? 1);
    const ir = Math.max(1, Math.min(5, Math.round(ig)));
    const rrRaw =
      ev.riesgoInherente != null && ev.riesgoInherente !== ''
        ? Number(ev.riesgoInherente)
        : pr * ir;
    const rr = pr === 2 && ir === 2 ? 3.99 : Number(rrRaw);
    const nivelPersistido = ev.nivelRiesgo != null ? String(ev.nivelRiesgo) : '';
    return {
      probabilidadResidual: pr,
      impactoResidual: ir,
      riesgoResidual: rr,
      nivelRiesgoResidual: nivelPersistido || nivelResidualDesdeCalificacionNumerica(rr),
    };
  }

  const causasConControles = causas.filter((c: any) => causaIncluidaEnAgregadoResidualPorControles(c));
  if (causasConControles.length === 0) return null;

  let mejorCal = 0;
  let mejorFrecuencia = 0;
  let mejorImpacto = 0;

  causasConControles.forEach((c: any) => {
    const r = calcularResidualPorCausa(c);
    if (!r) return;
    if (r.riesgoResidual > mejorCal) {
      mejorCal = r.riesgoResidual;
      mejorFrecuencia = r.probabilidadResidual;
      mejorImpacto = r.impactoResidual;
    }
  });

  if (mejorCal <= 0) return null;

  return {
    probabilidadResidual: mejorFrecuencia,
    impactoResidual: mejorImpacto,
    riesgoResidual: mejorCal,
    nivelRiesgoResidual: nivelResidualDesdeCalificacionNumerica(mejorCal),
  };
}
