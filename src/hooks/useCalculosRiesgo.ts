import { useMemo } from 'react';
import { PESOS_IMPACTO, UMBRALES_RIESGO, NivelRiesgo, NIVELES_RIESGO } from '../utils/constants';

interface Impactos {
    personas: number;
    legal: number;
    ambiental: number;
    procesos: number;
    reputacion: number;
    economico: number;
    tecnologico: number;
}

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
        // 1. Calcular Impacto Global Ponderado
        // Suma de (valor * peso) para cada dimensión
        const impactoGlobal = Number((
            (impactos.personas * PESOS_IMPACTO.personas) +
            (impactos.legal * PESOS_IMPACTO.legal) +
            (impactos.ambiental * PESOS_IMPACTO.ambiental) +
            (impactos.procesos * PESOS_IMPACTO.procesos) +
            (impactos.reputacion * PESOS_IMPACTO.reputacion) +
            (impactos.economico * PESOS_IMPACTO.economico) +
            (impactos.tecnologico * PESOS_IMPACTO.tecnologico)
        ).toFixed(2));

        // 2. Calcular Riesgo Inherente
        // Fórmula: Probabilidad * Impacto Global
        const riesgoInherente = Number((probabilidad * impactoGlobal).toFixed(2));

        // 3. Determinar Nivel de Riesgo
        let nivelRiesgo: NivelRiesgo;

        // Los umbrales pueden variar según si es positivo o negativo, 
        // pero por defecto usamos los definidos en constantes
        if (riesgoInherente >= UMBRALES_RIESGO.CRITICO) {
            nivelRiesgo = NIVELES_RIESGO.CRITICO;
        } else if (riesgoInherente >= UMBRALES_RIESGO.ALTO) {
            nivelRiesgo = NIVELES_RIESGO.ALTO;
        } else if (riesgoInherente >= UMBRALES_RIESGO.MEDIO) {
            nivelRiesgo = NIVELES_RIESGO.MEDIO;
        } else {
            nivelRiesgo = NIVELES_RIESGO.BAJO;
        }

        // 4. Calcular Impacto Máximo (la calificación más alta entre las dimensiones)
        const valoresImpacto = Object.values(impactos);
        const impactoMaximo = Math.max(...valoresImpacto);

        return {
            impactoGlobal,
            riesgoInherente,
            nivelRiesgo,
            impactoMaximo
        };
    }, [impactos, probabilidad, clasificacion]);

    return resultados;
};
