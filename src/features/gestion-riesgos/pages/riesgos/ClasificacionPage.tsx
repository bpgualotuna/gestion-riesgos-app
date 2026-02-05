/**
 * Clasificación Page
 * Muestra la clasificación de riesgos
 */

import { Box, Typography, Card, CardContent } from '@mui/material';
import { useProceso } from '../../../../shared/contexts/ProcesoContext';
import RequireProceso from '../../../../shared/components/ui/RequireProceso';

export default function ClasificacionPage() {
  const { procesoSeleccionado } = useProceso();

  return (
    <RequireProceso message="Por favor seleccione un proceso desde el Dashboard para ver la clasificación.">
      <Box>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Clasificación
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Clasificación de riesgos para el proceso: {procesoSeleccionado?.nombre}
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
    </RequireProceso>
  );
}

