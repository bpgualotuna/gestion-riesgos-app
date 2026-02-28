import { useMemo } from 'react';
import { UMBRALES_RIESGO } from '../utils/constants';

interface UseDashboardEstadisticasProps {
    riesgosFiltrados: any[];
    procesos: any[];
    puntos: any[];
}

export const useDashboardEstadisticas = ({
    riesgosFiltrados = [],
    procesos = [],
    puntos = []
}: UseDashboardEstadisticasProps) => {

    const estadisticas = useMemo(() => {
        const total = riesgosFiltrados.length;

        // 1. Riesgos por tipo de proceso
        const porTipoProceso: Record<string, number> = {
            '01 Estratégico': 0,
            '02 Operacional': 0,
            '03 Apoyo': 0,
        };

        riesgosFiltrados.forEach((r: any) => {
            const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
            const tipoProceso = (proceso?.tipoProceso || '').toLowerCase();
            if (tipoProceso.includes('estratégico') || tipoProceso.includes('estrategico') || tipoProceso.includes('estrategia')) {
                porTipoProceso['01 Estratégico']++;
            } else if (tipoProceso.includes('operacional') || tipoProceso.includes('operativo') || tipoProceso.includes('operacion')) {
                porTipoProceso['02 Operacional']++;
            } else {
                porTipoProceso['03 Apoyo']++;
            }
        });

        // Eliminar tipos con 0
        Object.keys(porTipoProceso).forEach(key => {
            if (porTipoProceso[key] === 0) delete porTipoProceso[key];
        });

        // 2. Riesgos por proceso - inicializar TODOS los procesos con 0
        const porProceso: Record<string, number> = {};
        procesos.forEach((p: any) => {
            const nombre = p.nombre || 'Sin nombre';
            porProceso[nombre] = 0;
        });

        riesgosFiltrados.forEach((r: any) => {
            const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
            if (proceso) {
                const nombre = proceso.nombre || 'Sin nombre';
                porProceso[nombre] = (porProceso[nombre] || 0) + 1;
            } else {
                // Si no encuentra el proceso, usar un nombre genérico
                const nombre = 'Proceso desconocido';
                porProceso[nombre] = (porProceso[nombre] || 0) + 1;
            }
        });

        // 3. Riesgos por tipología
        const porTipologia: Record<string, number> = {
            '01 Estratégico': 0,
            '02 Operacional': 0,
            '03 Financiero': 0,
            '04 Cumplimiento': 0,
        };

        riesgosFiltrados.forEach((r: any) => {
            const tipologiaNivelI = (r.tipologiaNivelI || '').toLowerCase();
            if (tipologiaNivelI.includes('estratégico')) porTipologia['01 Estratégico']++;
            else if (tipologiaNivelI.includes('operacional')) porTipologia['02 Operacional']++;
            else if (tipologiaNivelI.includes('financiero')) porTipologia['03 Financiero']++;
            else if (tipologiaNivelI.includes('cumplimiento')) porTipologia['04 Cumplimiento']++;
            else porTipologia['02 Operacional']++;
        });

        Object.keys(porTipologia).forEach(key => {
            if (porTipologia[key] === 0) delete porTipologia[key];
        });

        // 4. Origen de riesgos
        const origen: Record<string, number> = {
            'Talleres internos': 0,
            'Auditoría HHI': 0,
            'Otro': 0,
        };

        riesgosFiltrados.forEach((r: any) => {
            if (r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller')) {
                origen['Talleres internos']++;
            } else if (r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría')) {
                origen['Auditoría HHI']++;
            } else {
                origen['Otro']++;
            }
        });

        // 5. Riesgos Fuera del Apetito
        let fueraApetito = 0;
        
        // Calcular basado en puntos (evaluaciones)
        riesgosFiltrados.forEach((r: any) => {
            const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
            if (punto) {
                const valor = punto.probabilidad * punto.impacto;
                if (valor >= UMBRALES_RIESGO.ALTO) { // Usando ALTO (15) como umbral fuera de apetito
                    fueraApetito++;
                }
            }
        });

        // 6. Calificaciones por Nivel de Riesgo — SIEMPRE calcular desde probabilidad × impacto
        const porNivelRiesgo: Record<string, number> = {
            'Crítico': 0,
            'Alto': 0,
            'Medio': 0,
            'Bajo': 0,
            'Sin Calificar': 0,
        };

        riesgosFiltrados.forEach((r: any) => {
            const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
            
            // Calcular valor numérico desde puntos o evaluación
            let valor = 0;
            if (punto && punto.probabilidad && punto.impacto) {
                // Aplicar excepción 2x2 = 3.99
                if (punto.probabilidad === 2 && punto.impacto === 2) {
                    valor = 3.99;
                } else {
                    valor = punto.probabilidad * punto.impacto;
                }
            } else if (r.evaluacion?.riesgoInherente) {
                valor = r.evaluacion.riesgoInherente;
            }

            // Clasificar usando rangos correctos según Proceso_Calificacion_Inherente_Global.md:
            // Crítico: 15-25, Alto: 10-14, Medio: 4-9, Bajo: 1-3 (incluye 3.99)
            if (valor <= 0) {
                porNivelRiesgo['Sin Calificar']++;
            } else if (valor >= 15 && valor <= 25) {
                porNivelRiesgo['Crítico']++;
            } else if (valor >= 10 && valor <= 14) {
                porNivelRiesgo['Alto']++;
            } else if (valor >= 4 && valor <= 9) {
                porNivelRiesgo['Medio']++;
            } else if ((valor >= 1 && valor <= 3) || valor === 3.99) {
                porNivelRiesgo['Bajo']++;
            } else {
                porNivelRiesgo['Sin Calificar']++;
            }
        });

        const resultado = {
            total,
            porTipoProceso,
            porProceso,
            porTipologia,
            origen,
            fueraApetito,
            porNivelRiesgo // Añadir calificaciones por nivel
        };
        return resultado;
    }, [riesgosFiltrados, procesos, puntos]);

    return estadisticas;
};
