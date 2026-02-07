/**
 * Materializar Riesgos Page
 * Gestión de eventos/materialización de riesgos
 */

import { Box, Typography, Card, CardContent, Alert, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import ProcesoFiltros from '../../components/procesos/ProcesoFiltros';

export default function MaterializarRiesgosPage() {
  const { procesoSeleccionado } = useProceso();

  // Validación removida - permite cargar sin proceso seleccionado

  return (
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

      {/* Filtros para Supervisor */}
      <ProcesoFiltros />

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
  );
}


