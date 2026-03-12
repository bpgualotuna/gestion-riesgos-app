/**
 * Utilidades de calificación de riesgo (inherente/residual).
 * Zonas según Proceso_Calificacion_Inherente_Global.md
 */

import { colors } from '../app/theme/colors';

export function getEtiquetaNivel(valor: number): string {
  if (valor >= 15 && valor <= 25) return 'CRÍTICO';
  if (valor >= 10 && valor <= 14) return 'ALTO';
  if (valor >= 4 && valor <= 9) return 'MEDIO';
  return 'BAJO';
}

export function getColorNivel(valor: number): string {
  if (valor >= 15 && valor <= 25) return colors.risk.critical.main;
  if (valor >= 10 && valor <= 14) return colors.risk.high.main;
  if (valor >= 4 && valor <= 9) return colors.risk.medium.main;
  return colors.risk.low.main;
}
