/**
 * Indicadores Page
 * Muestra indicadores de gestión de riesgos
 */

import { Box, Typography, Card, CardContent, Grid2, Alert } from '@mui/material';
import { useProceso } from '../../../../shared/contexts/ProcesoContext';

export default function IndicadoresPage() {
  const { procesoSeleccionado } = useProceso();

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard para ver los indicadores.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Indicadores
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Indicadores de gestión de riesgos para el proceso: {procesoSeleccionado.nombre}
      </Typography>

      <Grid2 container spacing={3} sx={{ mt: 2 }}>
        <Grid2 xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Indicadores de Riesgo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Próximamente: Indicadores de riesgo inherente y residual
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Indicadores de Control
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Próximamente: Indicadores de efectividad de controles
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}

