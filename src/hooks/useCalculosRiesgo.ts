import { useMemo } from 'react';
import { NivelRiesgo } from '../utils/constants';
import { calcularImpactoGlobal, calcularImpactoMaximo, calcularRiesgoInherente, determinarNivelRiesgo } from '../utils/calculations';
import { Impactos } from '../types';

interface UseCalculosRiesgoProps {
    impactos: Impactos;
    probabilidad: number;
    clasificacion: string;
}

interface UseCalculosRiesgoResult {
    impactoGlobal: number;
    riesgoInherente: number;
    nivelRiesgo: NivelRiesgo;
    impactoMaximo: number;
}

export const useCalculosRiesgo = ({
    impactos,
    probabilidad,
    clasificacion
}: UseCalculosRiesgoProps): UseCalculosRiesgoResult => {

    const resultados = useMemo(() => {
        // 1. Calcular Impacto Global Ponderado (Referencia)
        const impactoGlobal = calcularImpactoGlobal(impactos);

        // 2. Calcular Impacto Máximo (Para Riesgo Inherente)
        const impactoMaximo = calcularImpactoMaximo(impactos);

        // 3. Calcular Riesgo Inherente (Probabilidad * Impacto Máximo)
        const riesgoInherente = calcularRiesgoInherente(impactoMaximo, probabilidad);

        // 4. Determinar Nivel de Riesgo
        // TODO: Fix typing for clasificacion to match constants
        const nivelRiesgo = determinarNivelRiesgo(riesgoInherente, clasificacion as any);

        return {
            impactoGlobal,
            riesgoInherente,
            nivelRiesgo,
            impactoMaximo
        };
    }, [impactos, probabilidad, clasificacion]);

    return resultados;
};
