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
            const proceso = procesos.find((p: any) => p.id === r.procesoId);
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

        // 2. Riesgos por proceso
        const porProceso: Record<string, number> = {};

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
            const punto = puntos.find((p: any) => p.riesgoId === r.id);
            if (punto) {
                const valor = punto.probabilidad * punto.impacto;
                if (valor >= UMBRALES_RIESGO.ALTO) { // Usando ALTO (15) como umbral fuera de apetito
                    fueraApetito++;
                }
            }
        });

        // 6. Calificaciones por Nivel de Riesgo
        const porNivelRiesgo: Record<string, number> = {
            'Crítico': 0,
            'Alto': 0,
            'Medio': 0,
            'Bajo': 0,
            'Sin Calificar': 0,
        };

        riesgosFiltrados.forEach((r: any) => {
            // Priorizar nivel desde puntos del mapa (más confiable)
            const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
            let nivelRiesgo: string | null = null;
            
            if (punto && punto.nivelRiesgo) {
                // Usar nivel del punto del mapa directamente
                nivelRiesgo = punto.nivelRiesgo;
            } else if (r.evaluacion?.nivelRiesgo) {
                // Si no hay punto, usar evaluación del riesgo
                nivelRiesgo = r.evaluacion.nivelRiesgo;
            } else if (r.nivelRiesgo) {
                // Último recurso: nivel directo del riesgo
                nivelRiesgo = r.nivelRiesgo;
            } else if (punto) {
                // Si hay punto pero sin nivel, calcular desde probabilidad e impacto
                const valor = punto.probabilidad * punto.impacto;
                // Aplicar umbrales: 15-25 CRÍTICO, 10-14 ALTO, 4-9 MEDIO, 1-3 BAJO
                if (valor >= 15 && valor <= 25) {
                    nivelRiesgo = 'Crítico';
                } else if (valor >= 10 && valor <= 14) {
                    nivelRiesgo = 'Alto';
                } else if (valor >= 4 && valor <= 9) {
                    nivelRiesgo = 'Medio';
                } else if (valor >= 1 && valor <= 3) {
                    nivelRiesgo = 'Bajo';
                } else {
                    nivelRiesgo = 'Sin Calificar';
                }
            } else {
                nivelRiesgo = 'Sin Calificar';
            }
            
            // Normalizar nombre del nivel (manejar variaciones)
            const nivelNormalizado = nivelRiesgo?.toLowerCase() || 'sin calificar';
            if (nivelNormalizado.includes('crítico') || nivelNormalizado.includes('critico')) {
                porNivelRiesgo['Crítico']++;
            } else if (nivelNormalizado.includes('alto')) {
                porNivelRiesgo['Alto']++;
            } else if (nivelNormalizado.includes('medio')) {
                porNivelRiesgo['Medio']++;
            } else if (nivelNormalizado.includes('bajo')) {
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
        
        console.log('[useDashboardEstadisticas] 📊 Estadísticas calculadas:', {
            totalRiesgos: total,
            porNivelRiesgo: resultado.porNivelRiesgo,
            riesgosFiltradosCount: riesgosFiltrados.length,
            puntosCount: puntos.length
        });
        
        return resultado;
    }, [riesgosFiltrados, procesos, puntos]);

    return estadisticas;
};
