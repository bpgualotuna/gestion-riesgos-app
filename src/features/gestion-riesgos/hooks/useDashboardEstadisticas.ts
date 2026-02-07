/**
 * Hook personalizado para calcular estadísticas del dashboard
 * Extraído para mejorar escalabilidad y reutilización
 */

import { useMemo } from 'react';
import { UMBRALES_RIESGO } from '../../../shared/utils/constants';

interface UseDashboardEstadisticasProps {
  riesgosFiltrados: any[];
  procesos: any[];
  puntos: any[];
}

export function useDashboardEstadisticas({ riesgosFiltrados, procesos, puntos }: UseDashboardEstadisticasProps) {
  const estadisticas = useMemo(() => {
    const total = riesgosFiltrados.length;

    // Riesgos por tipo de proceso
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
    Object.keys(porTipoProceso).forEach((key) => {
      if (porTipoProceso[key] === 0) {
        delete porTipoProceso[key];
      }
    });

    // Riesgos por proceso
    const porProceso: Record<string, { nombre: string; count: number }> = {};
    riesgosFiltrados.forEach((r: any) => {
      const proceso = procesos.find((p: any) => p.id === r.procesoId);
      if (proceso) {
        if (!porProceso[proceso.id]) {
          porProceso[proceso.id] = { nombre: proceso.nombre, count: 0 };
        }
        porProceso[proceso.id].count++;
      }
    });

    // Riesgos por tipología
    const porTipologia: Record<string, number> = {
      '01 Estratégico': 0,
      '02 Operacional': 0,
      '03 Financiero': 0,
      '04 Cumplimiento': 0,
    };
    riesgosFiltrados.forEach((r: any) => {
      const tipologiaNivelI = (r.tipologiaNivelI || '').toLowerCase();
      if (tipologiaNivelI.includes('estratégico') || tipologiaNivelI.includes('estrategico') || tipologiaNivelI.includes('estrategia')) {
        porTipologia['01 Estratégico']++;
      } else if (tipologiaNivelI.includes('operacional') || tipologiaNivelI.includes('operativo') || tipologiaNivelI.includes('operacion')) {
        porTipologia['02 Operacional']++;
      } else if (tipologiaNivelI.includes('financiero') || tipologiaNivelI.includes('finanza')) {
        porTipologia['03 Financiero']++;
      } else if (tipologiaNivelI.includes('cumplimiento') || tipologiaNivelI.includes('compliance')) {
        porTipologia['04 Cumplimiento']++;
      } else {
        porTipologia['02 Operacional']++;
      }
    });
    Object.keys(porTipologia).forEach((key) => {
      if (porTipologia[key] === 0) {
        delete porTipologia[key];
      }
    });

    // Origen de riesgos
    const origen: Record<string, number> = {
      'Talleres internos': 0,
      'Auditoría HHI': 0,
    };
    riesgosFiltrados.forEach((r: any) => {
      if (r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller') || r.origen?.includes('Taller')) {
        origen['Talleres internos']++;
      } else if (r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría') || r.origen?.includes('Auditoría')) {
        origen['Auditoría HHI']++;
      } else {
        origen['Talleres internos']++;
      }
    });

    // Riesgos fuera del apetito
    const fueraApetito = puntos.filter((p: any) => {
      const valorRiesgo = p.probabilidad * p.impacto;
      return valorRiesgo >= UMBRALES_RIESGO.ALTO;
    });

    return {
      total,
      porTipoProceso,
      porProceso,
      porTipologia,
      origen,
      fueraApetito: fueraApetito.length,
    };
  }, [riesgosFiltrados, procesos, puntos]);

  return estadisticas;
}

