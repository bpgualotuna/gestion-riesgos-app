/**
 * Componente reutilizable para mostrar métricas de riesgo
 * Extraído del DashboardSupervisorPage para mejor escalabilidad
 */

import { Box, Typography, Card } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';

interface MetricCardProps {
  titulo: string;
  valor: number;
  color: string;
  icono?: React.ReactNode;
  gradiente: string;
}

export default function MetricCard({ titulo, valor, color, icono, gradiente }: MetricCardProps) {
  return (
    <Card
      sx={{
        background: gradiente,
        borderRadius: 2,
        p: 2.5,
        height: '100%',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          {titulo}
        </Typography>
        {icono && (
          <Box sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'flex', alignItems: 'center' }}>
            {icono}
          </Box>
        )}
      </Box>
      <Typography
        variant="h4"
        sx={{
          color: 'white',
          fontWeight: 700,
          fontSize: '2rem',
          lineHeight: 1.2,
        }}
      >
        {valor}
      </Typography>
    </Card>
  );
}

