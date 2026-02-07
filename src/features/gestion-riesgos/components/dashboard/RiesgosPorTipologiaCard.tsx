/**
 * Componente para mostrar riesgos por tipología (Treemap)
 * Extraído para mejorar escalabilidad
 */

import { Box, Typography, Card, CardContent } from '@mui/material';

interface RiesgosPorTipologiaCardProps {
  datos: Record<string, number>;
}

export default function RiesgosPorTipologiaCard({ datos }: RiesgosPorTipologiaCardProps) {
  const sortedEntries = Object.entries(datos).sort(([, a], [, b]) => b - a);
  const colores: Record<string, string> = {
    '01 Estratégico': '#ed6c02',
    '02 Operacional': '#1976d2',
    '03 Financiero': '#1565c0',
    '04 Cumplimiento': '#9c27b0',
  };

  const mayor = sortedEntries[0];
  const menores = sortedEntries.slice(1);

  return (
    <Card
      sx={{
        height: '100%',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: 2,
        background: 'white',
        minHeight: 200,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom fontWeight={600} sx={{ mb: 2, fontSize: '0.875rem', color: '#424242' }}>
          Riesgos por tipo
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, height: 150, alignItems: 'flex-start' }}>
          {mayor && (
            <Box
              sx={{
                backgroundColor: colores[mayor[0]] || '#1976d2',
                color: 'white',
                p: 2,
                borderRadius: 1,
                width: '65%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60px',
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, textAlign: 'center', fontSize: '0.75rem' }}>
                {mayor[0]}
              </Typography>
              <Typography variant="h4" fontWeight={700} sx={{ fontSize: '2rem' }}>
                {mayor[1]}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '32%', height: '100%' }}>
            {menores.map(([tipologia, count]) => (
              <Box
                key={tipologia}
                sx={{
                  backgroundColor: colores[tipologia] || '#1976d2',
                  color: 'white',
                  p: 1.5,
                  borderRadius: 1,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '45px',
                }}
              >
                <Typography variant="caption" fontWeight={600} sx={{ mb: 0.25, textAlign: 'center', fontSize: '0.7rem' }}>
                  {tipologia}
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.25rem' }}>
                  {count}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

