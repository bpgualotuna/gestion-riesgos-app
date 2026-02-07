/**
 * RequireProceso Component
 * Wrapper component that ensures a process is selected before rendering children
 * Reduces code duplication across pages
 */

import { ReactNode } from 'react';
import { Box, Alert } from '@mui/material';
import { useProceso } from '../../../shared/contexts/ProcesoContext';

interface RequireProcesoProps {
  children: ReactNode;
  message?: string;
}

export default function RequireProceso({ 
  children, 
  message = 'Por favor seleccione un proceso desde el Dashboard' 
}: RequireProcesoProps) {
  const { procesoSeleccionado } = useProceso();

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">{message}</Alert>
      </Box>
    );
  }

  return <>{children}</>;
}

