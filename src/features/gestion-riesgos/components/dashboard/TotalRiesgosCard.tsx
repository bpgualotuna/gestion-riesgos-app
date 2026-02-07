/**
 * Componente para mostrar el total de riesgos
 * Extraído del DashboardSupervisorPage para mejor escalabilidad
 */

import { Box, Typography, Chip } from '@mui/material';
import { Security as SecurityIcon, Error as ErrorIcon, Warning as WarningIcon } from '@mui/icons-material';
import { colors } from '../../../../app/theme/colors';

interface TotalRiesgosCardProps {
  total: number;
  criticos: number;
  altos: number;
}

export default function TotalRiesgosCard({ total, criticos, altos }: TotalRiesgosCardProps) {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderRadius: 3,
        p: 4,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(25, 118, 210, 0.3)',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Círculos decorativos */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SecurityIcon sx={{ fontSize: 40, color: 'white' }} />
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
              Total de Riesgos
            </Typography>
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              {total}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<ErrorIcon sx={{ color: '#ffcdd2 !important', fontSize: 18 }} />}
            label={`${criticos} Críticos`}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          />
          <Chip
            icon={<WarningIcon sx={{ color: '#ffe0b2 !important', fontSize: 18 }} />}
            label={`${altos} Altos`}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 32,
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

