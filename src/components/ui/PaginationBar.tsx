/**
 * Barra de paginación reutilizable (lista arriba, mismo estilo en todas las páginas).
 * Escalable: un solo componente para Normatividad, Historial, etc.
 */
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';

export interface PaginationBarProps {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  /** Texto opcional a la izquierda (ej. "Mostrando X - Y de Z") */
  label?: string;
  /** Si true, usa borde inferior y fondo gris (barra superior) */
  variant?: 'top' | 'bottom';
}

export default function PaginationBar({
  from,
  to,
  total,
  page,
  totalPages,
  onPrev,
  onNext,
  label,
  variant = 'top',
}: PaginationBarProps) {
  const text = label ?? `Mostrando ${from} - ${to} de ${total}`;
  const isTop = variant === 'top';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        px: 2,
        py: 1.25,
        ...(isTop
          ? { borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }
          : { borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }),
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" disabled={page <= 1} onClick={onPrev} aria-label="Página anterior">
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 90, textAlign: 'center' }}>
          Pág. {page} de {totalPages}
        </Typography>
        <IconButton size="small" disabled={page >= totalPages} onClick={onNext} aria-label="Página siguiente">
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
