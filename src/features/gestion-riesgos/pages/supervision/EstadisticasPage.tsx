/**
 * Estadísticas Page
 * Muestra estadísticas de gestión de riesgos
 */

import { Box, Typography, Card, CardContent, Grid2, Alert } from '@mui/material';
import { useProceso } from '../../../../shared/contexts/ProcesoContext';

export default function EstadisticasPage() {
  const { procesoSeleccionado } = useProceso();

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard para ver las estadísticas.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Estadísticas
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Estadísticas de gestión de riesgos para el proceso: {procesoSeleccionado.nombre}
      </Typography>

      <Grid2 container spacing={3} sx={{ mt: 2 }}>
        <Grid2 xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Riesgos
              </Typography>
              <Typography variant="h3" color="primary">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Riesgos Críticos
              </Typography>
              <Typography variant="h3" color="error">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Controles Activos
              </Typography>
              <Typography variant="h3" color="success.main">
                -
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </Box>
  );
}

