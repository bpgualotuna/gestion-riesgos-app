import { Box, Alert } from '@mui/material';

interface AlertNoPermisosProps {
  /** Mensaje opcional; por defecto: "No tiene permisos para acceder a esta página." */
  message?: string;
}

export default function AlertNoPermisos({
  message = 'No tiene permisos para acceder a esta página.',
}: AlertNoPermisosProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
}
