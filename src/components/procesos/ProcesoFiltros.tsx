import { useState } from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import { Person as PersonIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useProcesosFiltradosPorArea } from '../../hooks/useAsignaciones';
import ResponsableProcesoDialog from './ResponsableProcesoDialog';

export default function ProcesoFiltros() {
  const { esSupervisorRiesgos, esGerenteGeneralDirector } = useAuth();
  const { setProcesoSeleccionado, procesoSeleccionado } = useProceso();
  const { areasDisponibles, procesosFiltrados, filtroArea, setFiltroArea } = useProcesosFiltradosPorArea('all');
  const [openOwnerDialog, setOpenOwnerDialog] = useState(false);

  const mostrarFiltrosProceso = esSupervisorRiesgos || esGerenteGeneralDirector;

  return (
    <Box sx={{ mb: 3 }}>
      {mostrarFiltrosProceso && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Selección de Proceso
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 220 }} size="small">
                <InputLabel>Filtrar por Área</InputLabel>
                <Select
                  value={filtroArea}
                  onChange={(e) => setFiltroArea(e.target.value)}
                  label="Filtrar por Área"
                >
                  <MenuItem value="all">Todas las áreas</MenuItem>
                  {areasDisponibles.map((area) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 260 }} size="small">
                <InputLabel>Seleccionar Proceso</InputLabel>
                <Select
                  value={procesoSeleccionado?.id ?? ''}
                  onChange={(e) => {
                    const procesoId = e.target.value as string;
                    const proceso = procesosFiltrados.find((p) => String(p.id) === procesoId);
                    if (proceso) setProcesoSeleccionado(proceso);
                  }}
                  label="Seleccionar Proceso"
                >
                  {procesosFiltrados.map((proceso) => (
                    <MenuItem key={proceso.id} value={proceso.id}>
                      {proceso.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      )}

      {procesoSeleccionado && (
        <Card
          variant="outlined"
          sx={{
            bgcolor: 'rgba(25, 118, 210, 0.01)',
            borderColor: 'rgba(0,0,0,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1,
              flexWrap: 'wrap',
              gap: 2,
              borderLeft: '4px solid #1976d2',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BusinessIcon sx={{ color: '#1976d2', fontSize: 20 }} />
              <Typography variant="body1" fontWeight={700} color="text.primary">
                {procesoSeleccionado.nombre}
              </Typography>
              <Chip
                label={(procesoSeleccionado as { tipoProceso?: string }).tipoProceso || 'Operativo'}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(0,0,0,0.05)' }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
              }}
              onClick={() => setOpenOwnerDialog(true)}
            >
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {(procesoSeleccionado as { responsable?: string }).responsable || 'No asignado'}
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      <ResponsableProcesoDialog
        open={openOwnerDialog}
        onClose={() => setOpenOwnerDialog(false)}
        proceso={procesoSeleccionado ? {
          nombre: procesoSeleccionado.nombre,
          responsable: (procesoSeleccionado as { responsable?: string }).responsable,
          areaNombre: (procesoSeleccionado as { areaNombre?: string }).areaNombre,
        } : null}
      />
    </Box>
  );
}
