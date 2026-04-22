import type { Riesgo, PuntoMapa } from '../types';
import { calcularResidualDesdeCausas } from './residualDesdeCausas';

export type ResidualModoMapa = 'ESTANDAR' | 'ESTRATEGICO' | undefined;

function coordsValidas(prob: unknown, imp: unknown): boolean {
  const p = Number(prob);
  const i = Number(imp);
  return Number.isFinite(p) && Number.isFinite(i) && p >= 1 && p <= 5 && i >= 1 && i <= 5;
}

function clampRoundCoord(n: number): number {
  return Math.max(1, Math.min(5, Math.round(Number(n))));
}

/**
 * Prioridad según modo:
 * - ESTANDAR: misma cadena que antes — causa dominante (residualDesdeCausas) → punto backend → inherente.
 * - ESTRATEGICO: evaluación persistida en backend (no usar residual estándar agregado por causas en cliente).
 */
export function resolverCoordsResidualMapa(
  punto: Partial<Pick<PuntoMapa, 'probabilidad' | 'impacto' | 'probabilidadResidual' | 'impactoResidual'>>,
  riesgo?: Riesgo | null,
  residualModo: ResidualModoMapa = 'ESTANDAR'
): { probabilidadResidual: number; impactoResidual: number } {
  let probabilidadResidual: number | undefined | null = undefined;
  let impactoResidual: number | undefined | null = undefined;

  const modo = residualModo === 'ESTRATEGICO' ? 'ESTRATEGICO' : 'ESTANDAR';

  if (modo === 'ESTRATEGICO') {
    const ev = riesgo?.evaluacion;
    if (coordsValidas(ev?.probabilidadResidual, ev?.impactoResidual)) {
      probabilidadResidual = Number(ev!.probabilidadResidual);
      impactoResidual = Number(ev!.impactoResidual);
    }
    if (!coordsValidas(probabilidadResidual, impactoResidual)) {
      if (coordsValidas(punto.probabilidadResidual, punto.impactoResidual)) {
        probabilidadResidual = Number(punto.probabilidadResidual);
        impactoResidual = Number(punto.impactoResidual);
      }
    }
  } else if (riesgo) {
    const desdeCausas = calcularResidualDesdeCausas(riesgo);
    if (desdeCausas) {
      probabilidadResidual = desdeCausas.probabilidadResidual;
      impactoResidual = desdeCausas.impactoResidual;
    }
  }

  if (!coordsValidas(probabilidadResidual, impactoResidual)) {
    probabilidadResidual = punto.probabilidadResidual;
    impactoResidual = punto.impactoResidual;
  }

  if (!coordsValidas(probabilidadResidual, impactoResidual)) {
    probabilidadResidual = punto.probabilidad || 1;
    impactoResidual = punto.impacto || 1;
  }

  return {
    probabilidadResidual: clampRoundCoord(Number(probabilidadResidual)),
    impactoResidual: clampRoundCoord(Number(impactoResidual)),
  };
}
