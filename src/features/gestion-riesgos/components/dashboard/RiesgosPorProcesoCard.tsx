/**
 * Componente para mostrar riesgos por proceso (Top 10)
 * Extraído del DashboardSupervisorPage para mejor escalabilidad
 */

import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { TrendingUp as TrendingUpIcon, Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { getMockRiesgosPorProceso } from '../../../../data/mockDataService';

interface RiesgosPorProcesoCardProps {
  datosReales?: Record<string, { nombre: string; count: number }>;
}

export default function RiesgosPorProcesoCard({ datosReales }: RiesgosPorProcesoCardProps) {
  // Usar datos mock si no hay suficientes datos reales
  const datosMock = getMockRiesgosPorProceso();
  
  let filas = Object.entries(datosReales || {})
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([id, data]) => ({
      id,
      nombre: data.nombre,
      count: data.count,
    }));

  // Completar hasta Top 10 con datos mock si faltan
  if (filas.length < 10) {
    const faltan = 10 - filas.length;
    filas = [
      ...filas,
      ...datosMock
        .filter((mock) => !filas.some((d) => d.nombre === mock.nombre))
        .slice(0, faltan)
        .map((mock) => ({
          id: mock.procesoId,
          nombre: mock.nombre,
          count: mock.count,
        })),
    ];
  }

  if (filas.length === 0) {
    return (
      <Card
        sx={{
          border: '1px solid #e0e0e0',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          height: '100%',
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: '#757575' }}>
            No hay datos disponibles para mostrar
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const total = filas.reduce((sum, f) => sum + f.count, 0);
  const maxCount = Math.max(...filas.map((f) => f.count));

  // Estimaciones rápidas por severidad
  const calcularCriticos = (count: number) => Math.round(count * 0.15);
  const calcularAltos = (count: number) => Math.round(count * 0.25);

  const totalCriticosTop10 = filas.reduce((sum, f) => sum + calcularCriticos(f.count), 0);
  const totalAltosTop10 = filas.reduce((sum, f) => sum + calcularAltos(f.count), 0);

  return (
    <Card
      sx={{
        border: '1px solid #e0e0e0',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
            fontWeight={600}
            sx={{ fontSize: '0.9rem', mb: 0, color: '#424242' }}
          >
            # de riesgos por proceso (Top 10)
          </Typography>
          <Chip
            icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
            label="Top 10"
            size="small"
            sx={{
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        <Box sx={{ mt: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filas.map((fila) => {
            const ancho = maxCount > 0 ? (fila.count / maxCount) * 100 : 0;
            const porcentajeTotal = total > 0 ? ((fila.count / total) * 100).toFixed(1) : '0.0';

            return (
              <Box
                key={fila.id}
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  backgroundColor: 'rgba(25,118,210,0.02)',
                  border: '1px solid rgba(25,118,210,0.06)',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transform: 'translateY(-2px)',
                    backgroundColor: 'rgba(25,118,210,0.04)',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 0.75,
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        maxWidth: { xs: '55vw', md: '65vw' },
                      }}
                      title={fila.nombre}
                    >
                      {fila.nombre}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip
                      icon={<ErrorIcon sx={{ color: '#d32f2f !important', fontSize: 14 }} />}
                      label={`~${calcularCriticos(fila.count)} críticos`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        color: '#d32f2f',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                    <Chip
                      icon={<WarningIcon sx={{ color: '#ed6c02 !important', fontSize: 14 }} />}
                      label={`~${calcularAltos(fila.count)} altos`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(237, 108, 2, 0.1)',
                        color: '#ed6c02',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#757575' }}>
                      {porcentajeTotal}%
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: '#1976d2', minWidth: 24, textAlign: 'right' }}
                    >
                      {fila.count}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    height: 18,
                    borderRadius: 999,
                    backgroundColor: '#f5f5f5',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.max(ancho, 8)}%`,
                      background: 'linear-gradient(90deg, #64b5f6 0%, #1976d2 100%)',
                      boxShadow: '0 2px 6px rgba(25,118,210,0.4)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </Box>
              </Box>
            );
          })}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              flexWrap: 'wrap',
              mt: 2,
              pt: 1.5,
              borderTop: '1px dashed #e0e0e0',
            }}
          >
            <Typography variant="caption" sx={{ color: '#757575' }}>
              Procesos en Top 10: <strong>{filas.length}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#757575' }}>
              Total riesgos (Top 10): <strong>{total}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#757575' }}>
              ~Críticos Top 10: <strong>{totalCriticosTop10}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#757575' }}>
              ~Altos Top 10: <strong>{totalAltosTop10}</strong>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

