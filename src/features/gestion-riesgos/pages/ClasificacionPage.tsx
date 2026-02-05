/**
 * Clasificación Page
 * Muestra la clasificación de riesgos
 */

import { Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { useProceso } from '../../../contexts/ProcesoContext';

export default function ClasificacionPage() {
  const { procesoSeleccionado } = useProceso();

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard para ver la clasificación.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Clasificación
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Clasificación de riesgos para el proceso: {procesoSeleccionado.nombre}
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Clasificación de Riesgos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Próximamente: Tabla de clasificación de riesgos por tipo, nivel y categoría
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

