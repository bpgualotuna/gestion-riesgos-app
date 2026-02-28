/**
 * Skeleton de carga estándar para páginas.
 * Animación wave + shimmer suave con color primario. Se muestra hasta que los datos terminen de cargar.
 */

import { Box, Skeleton } from '@mui/material';

const shimmerKeyframes = {
  '@keyframes shimmer': {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
};

interface PageLoadingSkeletonProps {
  /** Número de líneas de skeleton (por defecto 8) */
  lines?: number;
  /** Si tiene tabla, mostrar skeleton tipo tabla */
  variant?: 'text' | 'table';
  /** Filas si variant === 'table' */
  tableRows?: number;
}

export default function PageLoadingSkeleton({
  lines = 8,
  variant = 'text',
  tableRows = 6,
}: PageLoadingSkeletonProps) {
  const wrapperSx = {
    width: '100%',
    ...shimmerKeyframes,
    '& .MuiSkeleton-root': {
      borderRadius: 1.5,
    },
  };

  if (variant === 'table') {
    return (
      <Box sx={{ ...wrapperSx }}>
        <Skeleton
          variant="rectangular"
          height={48}
          animation="wave"
          sx={{
            mb: 0,
            borderRadius: '12px 12px 0 0',
            bgcolor: 'rgba(25, 118, 210, 0.06)',
          }}
        />
        {Array.from({ length: tableRows }).map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={52}
            animation="wave"
            sx={{
              mt: 0,
              borderRadius: 0,
              bgcolor: i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(25, 118, 210, 0.03)',
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1, ...wrapperSx }}>
      <Skeleton
        variant="text"
        width="40%"
        height={40}
        animation="wave"
        sx={{ mb: 2, borderRadius: 1.5, bgcolor: 'rgba(25, 118, 210, 0.08)' }}
      />
      <Skeleton
        variant="text"
        width="70%"
        animation="wave"
        sx={{ borderRadius: 1.5, bgcolor: 'rgba(25, 118, 210, 0.06)', animationDelay: '0.05s' }}
      />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i % 2 === 0 ? '100%' : '88%'}
          animation="wave"
          sx={{
            borderRadius: 1.5,
            bgcolor: i % 2 === 0 ? 'rgba(25, 118, 210, 0.05)' : 'rgba(0,0,0,0.04)',
            animationDelay: `${(i + 2) * 0.04}s`,
          }}
        />
      ))}
    </Box>
  );
}
