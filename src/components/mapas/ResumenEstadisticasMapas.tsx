import { useMemo } from 'react';
import { Card, CardContent, Typography, Alert } from '@mui/material';
import ResumenEstadisticasCards from './ResumenEstadisticasCards';
import TablaComparativaRiesgos, { type ComparativaRiesgo } from './TablaComparativaRiesgos';
import ResumenNarrativoMapas from './ResumenNarrativoMapas';
import type { Riesgo } from '../../types';
import { resolverCoordsResidualMapa } from '../../utils/mapaResidualCoords';

interface ResumenEstadisticasProps {
  matrizInherente: { [key: string]: unknown[] };
  matrizResidual: { [key: string]: unknown[] };
  procesos: { id: string | number; nombre?: string; areaId?: string; areaNombre?: string }[];
  filtroArea?: string;
  filtroProceso?: string;
  puntosFiltrados: {
    riesgoId: string | number;
    procesoId: string | number;
    procesoNombre?: string;
    numero?: number;
    siglaGerencia?: string;
    descripcion?: string;
    probabilidad?: number;
    impacto?: number;
    probabilidadResidual?: number;
    impactoResidual?: number;
  }[];
  /** Misma fuente que el mapa residual (causas → punto residual → inherente). */
  riesgosCompletos?: Riesgo[];
}

export default function ResumenEstadisticasMapas({
  procesos,
  puntosFiltrados,
  riesgosCompletos = [],
}: ResumenEstadisticasProps) {
  const estadisticas = useMemo(() => {
    const riesgosComparativa: ComparativaRiesgo[] = [];
    const riesgosProcessados = new Set<string>();

    puntosFiltrados.forEach((punto) => {
      if (riesgosProcessados.has(String(punto.riesgoId))) return;
      riesgosProcessados.add(String(punto.riesgoId));

      const probInh = Number(punto.probabilidad) || 1;
      const impInh = Number(punto.impacto) || 1;
      const valorInherente = probInh === 2 && impInh === 2 ? 3.99 : probInh * impInh;

      const riesgo = riesgosCompletos.find((r) => String(r.id) === String(punto.riesgoId));
      const { probabilidadResidual: probRes, impactoResidual: impRes } = resolverCoordsResidualMapa(
        punto,
        riesgo ?? undefined
      );
      const valorResidual = probRes === 2 && impRes === 2 ? 3.99 : probRes * impRes;

      let cambio: 'bajo' | 'subio' | 'se-mantuvo' = 'se-mantuvo';
      if (valorResidual < valorInherente) cambio = 'bajo';
      else if (valorResidual > valorInherente) cambio = 'subio';

      const diferencia = valorInherente - valorResidual;
      const porcentajeReduccion = valorInherente > 0 ? Math.round((diferencia / valorInherente) * 100) : 0;

      const proceso = procesos.find((p) => String(p.id) === String(punto.procesoId));
      const procesoNombre = proceso?.nombre || punto.procesoNombre || 'Proceso desconocido';

      riesgosComparativa.push({
        riesgoId: String(punto.riesgoId),
        numero: punto.numero,
        sigla: punto.siglaGerencia,
        descripcion: punto.descripcion || 'Sin descripción',
        procesoNombre,
        valorInherente,
        valorResidual,
        cambio,
        diferencia,
        porcentajeReduccion,
      });
    });

    const conteos = {
      bajaron: riesgosComparativa.filter((r) => r.cambio === 'bajo').length,
      subieron: riesgosComparativa.filter((r) => r.cambio === 'subio').length,
      seMantu: riesgosComparativa.filter((r) => r.cambio === 'se-mantuvo').length,
    };
    const totalInherente = riesgosComparativa.reduce((sum, r) => sum + r.valorInherente, 0);
    const totalResidual = riesgosComparativa.reduce((sum, r) => sum + r.valorResidual, 0);
    const porcentajeReduccionTotal =
      totalInherente > 0 ? Math.round(((totalInherente - totalResidual) / totalInherente) * 100) : 0;

    return {
      riesgosComparativa,
      conteos,
      porcentajeReduccionTotal,
    };
  }, [puntosFiltrados, procesos, riesgosCompletos]);

  if (estadisticas.riesgosComparativa.length === 0) {
    return (
      <Card sx={{ mt: 4, mb: 3 }}>
        <CardContent>
          <Alert severity="info">
            No hay datos disponibles para mostrar estadísticas. Selecciona un área o proceso para ver la comparativa de
            riesgos.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mt: 4, mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom fontWeight={700} sx={{ mb: 3 }}>
          📊 Comparativa: Riesgos Inherente vs Residual
        </Typography>

        <ResumenEstadisticasCards
          totalRiesgos={estadisticas.riesgosComparativa.length}
          conteos={estadisticas.conteos}
          porcentajeReduccionTotal={estadisticas.porcentajeReduccionTotal}
        />

        <TablaComparativaRiesgos riesgos={estadisticas.riesgosComparativa} />
        <ResumenNarrativoMapas
          conteos={estadisticas.conteos}
          porcentajeReduccionTotal={estadisticas.porcentajeReduccionTotal}
        />
      </CardContent>
    </Card>
  );
}
