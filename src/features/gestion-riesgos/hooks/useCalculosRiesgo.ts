/**
 * Custom Hook for Risk Calculations
 */

import { useMemo } from 'react';
import {
  calcularImpactoGlobal,
  calcularImpactoMaximo,
  calcularRiesgoInherente,
  determinarNivelRiesgo,
  type Impactos,
} from '../../../utils/calculations';
import type { ClasificacionRiesgo, NivelRiesgo } from '../../../utils/constants';

export interface UseCalculosRiesgoParams {
  impactos: Impactos;
  probabilidad: number;
  clasificacion: ClasificacionRiesgo;
}

export interface CalculosRiesgoResult {
  impactoGlobal: number;
  impactoMaximo: number;
  riesgoInherente: number;
  nivelRiesgo: NivelRiesgo;
}

/**
 * Hook para calcular automáticamente los valores de riesgo
 * Implementa las fórmulas Excel traducidas
 */
export function useCalculosRiesgo({
  impactos,
  probabilidad,
  clasificacion,
}: UseCalculosRiesgoParams): CalculosRiesgoResult {
  return useMemo(() => {
    // Calcular impacto global ponderado
    const impactoGlobal = calcularImpactoGlobal(impactos);

    // Calcular impacto máximo
    const impactoMaximo = calcularImpactoMaximo(impactos);

    // Calcular riesgo inherente (con caso especial 3.99)
    const riesgoInherente = calcularRiesgoInherente(impactoMaximo, probabilidad);

    // Determinar nivel de riesgo
    const nivelRiesgo = determinarNivelRiesgo(riesgoInherente, clasificacion);

    return {
      impactoGlobal,
      impactoMaximo,
      riesgoInherente,
      nivelRiesgo,
    };
  }, [impactos, probabilidad, clasificacion]);
}
