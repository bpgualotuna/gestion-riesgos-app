/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  TextField,
  MenuItem,
} from '@mui/material';
import { useGetPuntosMapaQuery } from '../api/riesgosApi';
import { colors } from '../../../app/theme/colors';
import { CLASIFICACION_RIESGO } from '../../../utils/constants';

export default function MapaPage() {
  const [clasificacion, setClasificacion] = useState<string>('all');

  const { data: puntos, isLoading } = useGetPuntosMapaQuery({
    clasificacion: clasificacion === 'all' ? undefined : clasificacion,
  });

  // Create 5x5 matrix
  const matriz: { [key: string]: typeof puntos } = {};
  puntos?.forEach((punto) => {
    const key = `${punto.probabilidad}-${punto.impacto}`;
    if (!matriz[key]) {
      matriz[key] = [];
    }
    matriz[key].push(punto);
  });

  const getCellColor = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return colors.risk.critical.main;
    if (riesgo >= 15) return colors.risk.high.main;
    if (riesgo >= 10) return colors.risk.medium.main;
    return colors.risk.low.main;
  };

  const getCellLabel = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return 'CRÍTICO';
    if (riesgo >= 15) return 'ALTO';
    if (riesgo >= 10) return 'MEDIO';
    return 'BAJO';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Mapa de Riesgos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Matriz 5x5 de Probabilidad vs Impacto
      </Typography>

      {/* Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Clasificación"
                value={clasificacion}
                onChange={(e) => setClasificacion(e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
                <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Leyenda
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.risk.critical.main,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="body2">Crítico (≥20)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.risk.high.main,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="body2">Alto (≥15)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.risk.medium.main,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="body2">Medio (≥10)</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    backgroundColor: colors.risk.low.main,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="body2">Bajo (&lt;10)</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Matrix */}
      <Paper elevation={3} sx={{ p: 2, overflowX: 'auto' }}>
        <Box sx={{ minWidth: 600 }}>
          {/* Y-axis label */}
          <Box display="flex" alignItems="center" mb={2}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                mr: 2,
              }}
            >
              IMPACTO
            </Typography>

            <Box flexGrow={1}>
              {/* Matrix Grid */}
              <Box>
                {[5, 4, 3, 2, 1].map((impacto) => (
                  <Box key={impacto} display="flex" mb={1}>
                    {/* Y-axis value */}
                    <Box
                      sx={{
                        width: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {impacto}
                    </Box>

                    {/* Cells */}
                    {[1, 2, 3, 4, 5].map((probabilidad) => {
                      const key = `${probabilidad}-${impacto}`;
                      const cellRiesgos = matriz[key] || [];
                      const cellColor = getCellColor(probabilidad, impacto);
                      const cellLabel = getCellLabel(probabilidad, impacto);

                      return (
                        <Box
                          key={probabilidad}
                          sx={{
                            width: 100,
                            height: 100,
                            border: '2px solid',
                            borderColor: colors.divider,
                            backgroundColor: `${cellColor}20`,
                            borderLeftColor: cellColor,
                            borderLeftWidth: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: cellRiesgos.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: `${cellColor}40`,
                              transform: cellRiesgos.length > 0 ? 'scale(1.05)' : 'none',
                            },
                            ml: 0.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {cellLabel}
                          </Typography>
                          <Chip
                            label={cellRiesgos.length}
                            size="small"
                            sx={{
                              mt: 1,
                              backgroundColor: cellColor,
                              color: '#fff',
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                ))}

                {/* X-axis values */}
                <Box display="flex" mt={1}>
                  <Box sx={{ width: 40 }} />
                  {[1, 2, 3, 4, 5].map((prob) => (
                    <Box
                      key={prob}
                      sx={{
                        width: 100,
                        display: 'flex',
                        justifyContent: 'center',
                        fontWeight: 600,
                        ml: 0.5,
                      }}
                    >
                      {prob}
                    </Box>
                  ))}
                </Box>

                {/* X-axis label */}
                <Box display="flex" justifyContent="center" mt={2}>
                  <Typography variant="h6" fontWeight={600}>
                    PROBABILIDAD
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Resumen
          </Typography>
          <Typography variant="body1">
            Total de riesgos en el mapa: <strong>{puntos?.length || 0}</strong>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
