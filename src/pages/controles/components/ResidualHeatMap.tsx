import React, { useMemo } from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import MapaMatriz from '../../mapas/components/MapaMatriz';
import { PuntoMapa } from '../../../types';

interface ResidualHeatMapProps {
  riesgos: any[];
  configuracion: any;
  onCellClick: (e: React.MouseEvent, prob: number, imp: number, tipo: 'inherente' | 'residual') => void;
}

const ResidualHeatMap = ({ riesgos, configuracion, onCellClick }: ResidualHeatMapProps) => {
  const matrizResidual = useMemo(() => {
    const matriz: { [key: string]: PuntoMapa[] } = {};
    
    riesgos.forEach(riesgo => {
      const ev = riesgo.evaluacion || {};
      const prob = Math.round(Number(ev.probabilidadResidual || 0));
      const imp = Math.round(Number(ev.impactoResidual || 0));
      
      if (prob > 0 && imp > 0) {
        const key = `${prob}-${imp}`;
        if (!matriz[key]) matriz[key] = [];
        matriz[key].push({
          riesgoId: riesgo.id,
          descripcion: riesgo.descripcionRiesgo || riesgo.descripcion || 'Sin descripción',
          numeroIdentificacion: riesgo.numeroIdentificacion || riesgo.id,
          probabilidad: prob,
          impacto: imp,
          nivelRiesgo: ev.nivelRiesgoResidual || ev.nivelRiesgo || 'Sin calificar',
          clasificacion: riesgo.clasificacion || '',
          numero: Number(riesgo.numero || 0),
          siglaGerencia: riesgo.siglaGerencia || '',
          probabilidadResidual: prob,
          impactoResidual: imp,
          riesgoResidual: Number(ev.riesgoResidual || 0),
          nivelRiesgoResidual: ev.nivelRiesgoResidual || null,
        });
      }
      
      // También incluir causas individuales si tienen residual (opcional, según requerimiento)
      // Pero usualmente el mapa muestra el nivel del riesgo.
    });
    
    return matriz;
  }, [riesgos]);

  const hasData = Object.keys(matrizResidual).length > 0;

  if (!hasData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">No hay datos de calificación residual suficientes para mostrar el mapa de calor.</Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Mapa de Calor Residual
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <MapaMatriz
          matriz={matrizResidual}
          tipo="residual"
          clasificacion="TODOS"
          ejes={configuracion?.ejes || { probabilidad: [], impacto: [] }}
          mapaConfig={configuracion}
          onCellClick={onCellClick}
          getCellColor={(p, i) => {
            // Implementar lógica de color similar a la de mapas si es necesario
            // O usar una genérica
            const val = p * i;
            if (val >= 15) return '#f44336'; // Crítico
            if (val >= 10) return '#ff9800'; // Alto
            if (val >= 4) return '#ffeb3b'; // Medio
            return '#4caf50'; // Bajo
          }}
          getBordesLimite={() => ({})}
          generarIdRiesgo={(p) => String(p.numeroIdentificacion || p.riesgoId)}
          colorZonaAlta="#d32f2f"
        />
      </Box>
    </Paper>
  );
};

export default ResidualHeatMap;
