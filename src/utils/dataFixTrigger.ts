
import { getMockTiposRiesgos } from '../api/services/mockData';

/**
 * Función para corregir datos inconsistentes en localStorage
 * Se ejecuta al iniciar la aplicación
 */
export const runDataFixes = () => {
    try {
        console.log('Running data consistency checks...');
        const key = 'catalog_tipos_riesgo'; // Asegurar que coincida con mockData.ts
        const stored = localStorage.getItem(key);

        let tiposRiesgo = [];
        if (stored) {
            tiposRiesgo = JSON.parse(stored);
        } else {
            // Si no hay localStorage, quizás estemos usando mocks, pero queremos asegurar
            // que si alguien guarda, se use una versión limpia.
            // Aunque lo ideal es no tocar localStorage si está vacío para no ensuciar.
            // Pero si el usuario ve datos corruptos, probablemente YA están en localStorage.
            return;
        }

        let changesMade = false;

        const correctedTipos = tiposRiesgo.map((tipo: any) => {
            let tipoChanged = false;
            let currentMaxCod = 0;

            // 1. Encontrar el mayor código existente
            (tipo.subtipos || []).forEach((sub: any) => {
                const cod = parseInt(sub.codigo);
                if (!isNaN(cod) && cod > currentMaxCod) {
                    currentMaxCod = cod;
                }
            });

            // 2. Asignar códigos a los faltantes
            const newSubtipos = (tipo.subtipos || []).map((sub: any) => {
                if (!sub.codigo || sub.codigo.toString().trim() === '' || sub.codigo === '-') {
                    currentMaxCod++;
                    tipoChanged = true;
                    //console.log(`Fixing subtipo ID for: ${sub.descripcion} -> ${currentMaxCod}`);
                    return { ...sub, codigo: String(currentMaxCod) };
                }
                return sub;
            });

            if (tipoChanged) {
                changesMade = true;
                return { ...tipo, subtipos: newSubtipos };
            }
            return tipo;
        });

        if (changesMade) {
            console.log('Fixed missing Subtipo IDs in localStorage');
            localStorage.setItem(key, JSON.stringify(correctedTipos));
            // Disparar evento de storage para update inmediato en otras pestañas/hooks
            window.dispatchEvent(new Event('storage'));
        } else {
            console.log('No inconsistencies found in Subtipos.');
        }

    } catch (error) {
        console.error('Error fixing subtipos IDs:', error);
    }
};
