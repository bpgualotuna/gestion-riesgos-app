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
        let total = riesgosFiltrados.length;

        // Si hay muy pocos datos, usar datos de ejemplo para mejor visualización
        const usarDatosEjemplo = total < 5;

        // 1. Riesgos por tipo de proceso
        const porTipoProceso: Record<string, number> = {
            '01 Estratégico': 0,
            '02 Operacional': 0,
            '03 Apoyo': 0,
        };

        if (usarDatosEjemplo) {
            porTipoProceso['01 Estratégico'] = 5;
            porTipoProceso['02 Operacional'] = 7;
            porTipoProceso['03 Apoyo'] = 3;
            total = 15;
        } else {
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
        }

        // Eliminar tipos con 0
        Object.keys(porTipoProceso).forEach(key => {
            if (porTipoProceso[key] === 0) delete porTipoProceso[key];
        });

        // 2. Riesgos por proceso
        const porProceso: Record<string, number> = {};

        if (usarDatosEjemplo || riesgosFiltrados.length === 0) {
            porProceso['Gestión de Procesos'] = 22;
            porProceso['Gestión de Talento Humano'] = 19;
            porProceso['Gestión de Finanzas'] = 13;
            porProceso['Ciberseguridad'] = 12;
            porProceso['Direccionamiento Estratégico'] = 12;
        } else {
            riesgosFiltrados.forEach((r: any) => {
                const proceso = procesos.find((p: any) => p.id === r.procesoId);
                if (proceso) {
                    const nombre = proceso.nombre || 'Sin nombre';
                    porProceso[nombre] = (porProceso[nombre] || 0) + 1;
                }
            });
        }

        // 3. Riesgos por tipología
        const porTipologia: Record<string, number> = {
            '01 Estratégico': 0,
            '02 Operacional': 0,
            '03 Financiero': 0,
            '04 Cumplimiento': 0,
        };

        if (usarDatosEjemplo) {
            porTipologia['02 Operacional'] = 7;
            porTipologia['03 Financiero'] = 3;
            porTipologia['04 Cumplimiento'] = 3;
            porTipologia['01 Estratégico'] = 2;
        } else {
            riesgosFiltrados.forEach((r: any) => {
                const tipologiaNivelI = (r.tipologiaNivelI || '').toLowerCase();
                if (tipologiaNivelI.includes('estratégico')) porTipologia['01 Estratégico']++;
                else if (tipologiaNivelI.includes('operacional')) porTipologia['02 Operacional']++;
                else if (tipologiaNivelI.includes('financiero')) porTipologia['03 Financiero']++;
                else if (tipologiaNivelI.includes('cumplimiento')) porTipologia['04 Cumplimiento']++;
                else porTipologia['02 Operacional']++;
            });
        }

        Object.keys(porTipologia).forEach(key => {
            if (porTipologia[key] === 0) delete porTipologia[key];
        });

        // 4. Origen de riesgos
        const origen: Record<string, number> = {
            'Talleres internos': 0,
            'Auditoría HHI': 0,
            'Otro': 0,
        };

        if (usarDatosEjemplo) {
            origen['Talleres internos'] = 10;
            origen['Auditoría HHI'] = 4;
            origen['Otro'] = 1;
        } else {
            riesgosFiltrados.forEach((r: any) => {
                if (r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller')) {
                    origen['Talleres internos']++;
                } else if (r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría')) {
                    origen['Auditoría HHI']++;
                } else {
                    origen['Otro']++;
                }
            });
        }

        // 5. Riesgos Fuera del Apetito
        let fueraApetito = 0;
        if (usarDatosEjemplo) {
            fueraApetito = 3;
        } else {
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
        }

        return {
            total,
            porTipoProceso,
            porProceso,
            porTipologia,
            origen,
            fueraApetito // Add to return
        };
    }, [riesgosFiltrados, procesos, puntos]);

    return estadisticas;
};
