/**
 * Materializar Riesgos Page
 * Gestión de eventos/materialización de riesgos
 */

import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useProceso } from '../../../../shared/contexts/ProcesoContext';
import RequireProceso from '../../../../shared/components/ui/RequireProceso';

export default function MaterializarRiesgosPage() {
  const { procesoSeleccionado } = useProceso();

  return (
    <RequireProceso message="Por favor seleccione un proceso desde el Dashboard para gestionar la materialización de riesgos.">
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Materializar Riesgos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de eventos y materialización de riesgos para el proceso: {procesoSeleccionado.nombre}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Nuevo Evento
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Eventos Materializados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Próximamente: Tabla de eventos materializados con fecha, descripción, impacto y acciones tomadas
          </Typography>
        </CardContent>
      </Card>
    </Box>
    </RequireProceso>
  );
}

