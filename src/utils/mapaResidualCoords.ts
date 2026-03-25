import type { Riesgo, PuntoMapa } from '../types';
import { calcularResidualDesdeCausas } from './residualDesdeCausas';

/**
 * Misma cadena de prioridad que `matrizResidual` en MapaPage:
 * 1) causa con mayor calificación residual (BY/BZ)
 * 2) probabilidadResidual / impactoResidual del punto (backend)
 * 3) inherentes del punto
 */
export function resolverCoordsResidualMapa(
  punto: Pick<PuntoMapa, 'probabilidad' | 'impacto' | 'probabilidadResidual' | 'impactoResidual'>,
  riesgo?: Riesgo | null
): { probabilidadResidual: number; impactoResidual: number } {
  let probabilidadResidual: number | undefined | null = undefined;
  let impactoResidual: number | undefined | null = undefined;

  if (riesgo) {
    const desdeCausas = calcularResidualDesdeCausas(riesgo);
    if (desdeCausas) {
      probabilidadResidual = desdeCausas.probabilidadResidual;
      impactoResidual = desdeCausas.impactoResidual;
    }
  }

  if (!probabilidadResidual || !impactoResidual) {
    probabilidadResidual = punto.probabilidadResidual;
    impactoResidual = punto.impactoResidual;
  }

  if (!probabilidadResidual || !impactoResidual) {
    probabilidadResidual = punto.probabilidad || 1;
    impactoResidual = punto.impacto || 1;
  }

  probabilidadResidual = Math.max(1, Math.min(5, Math.round(Number(probabilidadResidual))));
  impactoResidual = Math.max(1, Math.min(5, Math.round(Number(impactoResidual))));

  return { probabilidadResidual, impactoResidual };
}
