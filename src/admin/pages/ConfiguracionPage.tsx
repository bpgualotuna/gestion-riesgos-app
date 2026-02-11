import { Box, Typography, Paper, Alert } from '@mui/material';

interface ConfiguracionPageProps {
  user: any;
}

export default function ConfiguracionPage({ user }: ConfiguracionPageProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Configuración General
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Módulo de configuración general en desarrollo. Aquí se podrán ajustar:
        </Alert>

        <ul>
          <li>Parámetros de evaluación de riesgos</li>
          <li>Escalas de impacto y probabilidad</li>
          <li>Configuraciones de reportes</li>
          <li>Integraciones externas</li>
          <li>Respaldo y recuperación de datos</li>
        </ul>
      </Paper>
    </Box>
  );
}
