import { useMemo, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useGetProcesosQuery } from '../../api/services/riesgosApi';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';

export default function ProcesoFiltros() {
  const { esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDuenoProcesos, user } = useAuth();
  const { setProcesoSeleccionado, procesoSeleccionado } = useProceso();
  const { data: procesos = [] } = useGetProcesosQuery();
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();

  // Solo mostrar filtros para Supervisor y Gerente General Director
  // Gerente General Proceso y Dueño de Proceso NO tienen filtros
  const mostrarFiltrosProceso = esSupervisorRiesgos || esGerenteGeneralDirector;

  const [filtroArea, setFiltroArea] = useState<string>('all');

  const procesosDisponibles = useMemo(() => {
    // Gerente General en modo Director ve todos
    if (esGerenteGeneralDirector) return procesos;

    // Gerente General en modo Proceso ve solo procesos asignados
    if (esGerenteGeneralProceso) {
      if (procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => procesosAsignados.includes(String(p.id)));
    }

    // Dueño de Procesos ve solo sus procesos asignados como responsable
    if (esDuenoProcesos && user) {
      return procesos.filter((p: any) => p.responsableId === user.id);
    }

    // Supervisor ve solo procesos de sus áreas/procesos asignados
    if (esSupervisorRiesgos && user) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
        return false;
      });
    }
    return procesos;
  }, [procesos, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDuenoProcesos, areasAsignadas, procesosAsignados, user]);

  const areasDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    procesosDisponibles.forEach((p: any) => {
      if (p.areaId) map.set(p.areaId, p.areaNombre || `Área ${p.areaId}`);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [procesosDisponibles]);

  const procesosFiltrados = useMemo(() => {
    let filtrados = procesosDisponibles;
    if (filtroArea !== 'all') {
      filtrados = filtrados.filter((p: any) => p.areaId === filtroArea);
    }
    return filtrados;
  }, [procesosDisponibles, filtroArea]);

  const [openOwnerDialog, setOpenOwnerDialog] = useState(false);

  // No retornamos null, queremos mostrar al menos la info del proceso si ya está seleccionado
  // if (!mostrarFiltrosProceso) return null;

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
                  {areasAsignadas.map((area: any) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
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
                  value={procesoSeleccionado?.id || ''}
                  onChange={(e) => {
                    const procesoId = e.target.value as string;
                    const proceso = procesosFiltrados.find((p: any) => p.id === procesoId);
                    if (proceso) {
                      setProcesoSeleccionado(proceso);
                    }
                  }}
                  label="Seleccionar Proceso"
                >
                  {procesosFiltrados.map((proceso: any) => (
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
        <Card variant="outlined" sx={{
          bgcolor: 'rgba(25, 118, 210, 0.01)',
          borderColor: 'rgba(0,0,0,0.08)',
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
            flexWrap: 'wrap',
            gap: 2,
            borderLeft: '4px solid #1976d2'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BusinessIcon sx={{ color: '#1976d2', fontSize: 20 }} />
              <Typography variant="body1" fontWeight={700} color="text.primary">
                {procesoSeleccionado.nombre}
              </Typography>
              <Chip label={procesoSeleccionado.tipoProceso || 'Operativo'} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(0,0,0,0.05)' }} />
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
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
              onClick={() => setOpenOwnerDialog(true)}
            >
              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
                <PersonIcon sx={{ fontSize: 16 }} />
              </Avatar>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                {procesoSeleccionado.responsable || 'No asignado'}
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* DIALOG DETALLE DUEÑO PROCESO */}
      <Dialog open={openOwnerDialog} onClose={() => setOpenOwnerDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon color="primary" /> Detalle del Responsable
        </DialogTitle>
        <DialogContent dividers>
          {procesoSeleccionado && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}
              >
                {procesoSeleccionado.responsable?.charAt(0) || 'D'}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{procesoSeleccionado.responsable || 'Sin asignar'}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>Gerente de Proceso</Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Cargo</Typography>
                  <Typography variant="body2" fontWeight={500}>Responsable de {procesoSeleccionado.nombre}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Área</Typography>
                  <Typography variant="body2" fontWeight={500}>{procesoSeleccionado.areaNombre || 'Área General'}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Correo Electrónico</Typography>
                  <Typography variant="body2" fontWeight={500}>{procesoSeleccionado.responsable?.toLowerCase().replace(' ', '.')}@conware.com</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOwnerDialog(false)} variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
