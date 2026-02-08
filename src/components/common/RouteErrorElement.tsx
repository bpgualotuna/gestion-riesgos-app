/**
 * Route Error Element Component
 * Displays friendly error messages for route errors
 */

import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate, useRouteError } from 'react-router-dom';
import { Error as ErrorIcon } from '@mui/icons-material';

export default function RouteErrorElement() {
  const navigate = useNavigate();
  const error = useRouteError() as any;

  const errorMessage = error?.message || 'Ha ocurrido un error desconocido';
  const errorStatus = error?.status || 500;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ color: 'error.main', mb: 2 }}>
          <ErrorIcon sx={{ fontSize: 80 }} />
        </Box>

        <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
          {errorStatus === 404 ? 'Página No Encontrada' : 'Error en la Aplicación'}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {errorStatus === 404
            ? 'La página que buscas no existe. Por favor regresa al dashboard.'
            : errorMessage}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3, fontFamily: 'monospace' }}>
          Código de error: {errorStatus}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Ir al Dashboard
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Volver Atrás
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
