import { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { colors } from '../../app/theme/colors';
import Grid2 from '../../utils/Grid2';

interface ResumenEstadisticasProps {
  matrizInherente: { [key: string]: any[] };
  matrizResidual: { [key: string]: any[] };
  procesos: any[];
  filtroArea?: string;
  filtroProceso?: string;
  puntosFiltrados: any[];
}

interface ComparativaRiesgo {
  riesgoId: string;
  numero?: number;
  sigla?: string;
  descripcion: string;
  procesoNombre: string;
  valorInherente: number;
  valorResidual: number;
  cambio: 'bajo' | 'subio' | 'se-mantuvo';
  diferencia: number;
  porcentajeReduccion: number;
}

const getEtiquetaNivel = (valor: number): string => {
  // Según documento Proceso_Calificacion_Inherente_Global.md
  // Zonas: 15-25 CRÍTICO, 10-14 ALTO, 4-9 MEDIO, 1-3 BAJO
  // Excepción: 2x2 = 3.99 (cae en zona baja)
  if (valor >= 15 && valor <= 25) return 'CRÍTICO';
  if (valor >= 10 && valor <= 14) return 'ALTO';
  if (valor >= 4 && valor <= 9) return 'MEDIO';
  return 'BAJO';
};

const getColorNivel = (valor: number): string => {
  // Según documento Proceso_Calificacion_Inherente_Global.md
  // Zonas: 15-25 Rojo (Crítico), 10-14 Naranja (Alto), 4-9 Amarillo (Medio), 1-3 Verde (Bajo)
  // Excepción: 2x2 = 3.99 (cae en zona verde)
  if (valor >= 15 && valor <= 25) return colors.risk.critical.main; // Rojo
  if (valor >= 10 && valor <= 14) return colors.risk.high.main; // Naranja
  if (valor >= 4 && valor <= 9) return colors.risk.medium.main; // Amarillo
  return colors.risk.low.main; // Verde (1-3, incluye 3.99)
};

export default function ResumenEstadisticasMapas({
  matrizInherente,
  matrizResidual,
  procesos,
  filtroArea,
  filtroProceso,
  puntosFiltrados,
}: ResumenEstadisticasProps) {
  const estadisticas = useMemo(() => {
    // Mapear riesgos con sus valores inherentes y residuales
    // Usar puntosFiltrados directamente para obtener valores consistentes
    const riesgosComparativa: ComparativaRiesgo[] = [];
    const riesgosProcessados = new Set<string>();

    // Procesar todos los puntos filtrados (tienen tanto inherente como residual)
    puntosFiltrados.forEach((punto: any) => {
      if (riesgosProcessados.has(String(punto.riesgoId))) return;
      riesgosProcessados.add(String(punto.riesgoId));

      // Calcular valor inherente desde probabilidad e impacto
      const probInh = Number(punto.probabilidad) || 1;
      const impInh = Number(punto.impacto) || 1;
      const valorInherente = probInh === 2 && impInh === 2 ? 3.99 : probInh * impInh;

      // Calcular valor residual desde probabilidadResidual e impactoResidual
      // Si no hay valores residuales, usar los inherentes (riesgo sin controles)
      const probRes = Number(punto.probabilidadResidual) || probInh;
      const impRes = Number(punto.impactoResidual) || impInh;
      const valorResidual = probRes === 2 && impRes === 2 ? 3.99 : probRes * impRes;

      // Determinar cambio
      let cambio: 'bajo' | 'subio' | 'se-mantuvo' = 'se-mantuvo';
      if (valorResidual < valorInherente) {
        cambio = 'bajo';
      } else if (valorResidual > valorInherente) {
        cambio = 'subio';
      }

      const diferencia = valorInherente - valorResidual;
      const porcentajeReduccion = valorInherente > 0 ? Math.round((diferencia / valorInherente) * 100) : 0;

      // Obtener nombre del proceso
      let procesoNombre = 'Proceso desconocido';
      const proceso = procesos.find((p) => String(p.id) === String(punto.procesoId));
      procesoNombre = proceso?.nombre || punto.procesoNombre || 'Proceso desconocido';

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

    // Ya no necesitamos filtrar porque procesamos directamente desde puntosFiltrados
    const riesgosFiltridos = riesgosComparativa;

    // Contar cambios
    const conteos = {
      bajaron: riesgosFiltridos.filter((r) => r.cambio === 'bajo').length,
      subieron: riesgosFiltridos.filter((r) => r.cambio === 'subio').length,
      seMantu: riesgosFiltridos.filter((r) => r.cambio === 'se-mantuvo').length,
    };

    // Totales
    const totalInherente = riesgosFiltridos.reduce((sum, r) => sum + r.valorInherente, 0);
    const totalResidual = riesgosFiltridos.reduce((sum, r) => sum + r.valorResidual, 0);
    const totalReducido = totalInherente - totalResidual;
    const porcentajeReduccionTotal = totalInherente > 0 ? Math.round((totalReducido / totalInherente) * 100) : 0;

    return {
      riesgosComparativa: riesgosFiltridos,
      conteos,
      totalInherente,
      totalResidual,
      totalReducido,
      porcentajeReduccionTotal,
    };
  }, [puntosFiltrados, procesos]);


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

        {/* Cards de Resumen */}
        <Grid2 container spacing={2} sx={{ mb: 4 }}>
          <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: '0.85rem' }}>
                Total Riesgos
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: colors.risk.critical.main }}>
                {estadisticas.riesgosComparativa.length}
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <ArrowDownIcon sx={{ color: '#10b981', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Bajaron
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#10b981' }}>
                {estadisticas.conteos.bajaron}
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fce4ec' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <ArrowUpIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Subieron
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#ef4444' }}>
                {estadisticas.conteos.subieron}
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  Se Mantuvieron
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#6366f1' }}>
                {estadisticas.conteos.seMantu}
              </Typography>
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f3e5f5' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  % Reducción
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#7c3aed' }}>
                {estadisticas.porcentajeReduccionTotal}%
              </Typography>
            </Paper>
          </Grid2>
        </Grid2>

        {/* Tabla Detallada de Riesgos */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
          Detalle: Cambios por Riesgo
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Riesgo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Proceso</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Inherente
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Residual
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Cambio
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  Reducción
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {estadisticas.riesgosComparativa.map((riesgo, index) => (
                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    #{riesgo.numero}
                    {riesgo.sigla}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.9rem' }}>{riesgo.procesoNombre}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${riesgo.valorInherente} (${getEtiquetaNivel(riesgo.valorInherente)})`}
                      sx={{
                        backgroundColor: getColorNivel(riesgo.valorInherente),
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${riesgo.valorResidual} (${getEtiquetaNivel(riesgo.valorResidual)})`}
                      sx={{
                        backgroundColor: getColorNivel(riesgo.valorResidual),
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {riesgo.cambio === 'bajo' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <ArrowDownIcon sx={{ color: '#10b981', fontSize: 18 }} />
                        <Chip label="Bajó" color="success" size="small" variant="outlined" />
                      </Box>
                    )}
                    {riesgo.cambio === 'subio' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <ArrowUpIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                        <Chip label="Subió" color="error" size="small" variant="outlined" />
                      </Box>
                    )}
                    {riesgo.cambio === 'se-mantuvo' && (
                      <Chip label="Igual" color="info" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {riesgo.diferencia > 0 ? (
                      <Chip
                        label={`-${riesgo.porcentajeReduccion}%`}
                        icon={<TrendingDownIcon />}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resumen Narrativo */}
        <Box
          sx={{
            p: 2.5,
            mt: 3,
            backgroundColor: '#f0f9ff',
            borderLeft: `4px solid ${colors.risk.critical.main}`,
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
            📈 Análisis Clave:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.95rem' }}>
            <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
              <strong>{estadisticas.conteos.bajaron} riesgo(s) bajaron de clasificación</strong> gracias a los
              controles implementados, mejorando la posición de riesgo.
            </Typography>
            {estadisticas.conteos.subieron > 0 && (
              <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6, color: '#dc2626' }}>
                <strong>⚠️ {estadisticas.conteos.subieron} riesgo(s) subieron de clasificación</strong>, requiriendo
                revisión de controles y posibles acciones correctivas.
              </Typography>
            )}
            {estadisticas.conteos.seMantu > 0 && (
              <Typography component="li" variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                <strong>{estadisticas.conteos.seMantu} riesgo(s) se mantuvieron</strong> en la misma clasificación
                entre inherente y residual.
              </Typography>
            )}
            <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
              <strong>Reducción promedio: {estadisticas.porcentajeReduccionTotal}%</strong> de los riesgos
              identificados gracias a la implementación de controles.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
