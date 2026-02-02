/**
 * Resumen Director Page
 * Vista de resumen para Director de Procesos
 * Muestra procesos por área, responsables y permite agregar observaciones
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Badge,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useGetProcesosQuery, useGetRiesgosQuery } from '../api/riesgosApi';
import { useNotification } from '../../../hooks/useNotification';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import type { Proceso, Observacion, CreateObservacionDto } from '../types';

// Mock de áreas - En producción vendría de la API
const mockAreas = [
  { id: '1', nombre: 'Gestión Financiera y Administrativa' },
  { id: '2', nombre: 'Talento Humano' },
  { id: '3', nombre: 'Operaciones' },
];

// Mock de observaciones - En producción vendría de la API
const mockObservaciones: Observacion[] = [
  {
    id: 'obs-1',
    procesoId: '1',
    autorId: '5',
    autorNombre: 'Carlos Director',
    texto: 'Se requiere revisar el proceso de selección de personal para mejorar los tiempos de contratación.',
    tipo: 'proceso',
    estado: 'pendiente',
    fechaCreacion: '2024-01-15T10:00:00Z',
    fechaActualizacion: '2024-01-15T10:00:00Z',
  },
];

export default function ResumenDirectorPage() {
  const { user, esDirectorProcesos } = useAuth();
  const navigate = useNavigate();
  const { setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { showSuccess, showError } = useNotification();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const { data: riesgosData } = useGetRiesgosQuery({ pageSize: 1000 });
  const todosRiesgos = riesgosData?.data || [];

  const [observaciones, setObservaciones] = useState<Observacion[]>(mockObservaciones);
  const [observacionDialogOpen, setObservacionDialogOpen] = useState(false);
  const [procesoSeleccionadoParaObs, setProcesoSeleccionadoParaObs] = useState<Proceso | null>(null);
  const [nuevaObservacion, setNuevaObservacion] = useState<CreateObservacionDto>({
    texto: '',
    tipo: 'proceso',
  });

  if (!esDirectorProcesos) {
    return (
      <Box>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo los directores de procesos pueden acceder.
        </Alert>
      </Box>
    );
  }

  // Filtrar procesos asignados al director
  const procesosAsignados = useMemo(() => {
    return procesos.filter((p) => p.directorId === user?.id);
  }, [procesos, user]);

  // Agrupar procesos por área
  const procesosPorArea = useMemo(() => {
    const agrupados: { [key: string]: { area: typeof mockAreas[0]; procesos: Proceso[] } } = {};
    procesosAsignados.forEach((proceso) => {
      const areaId = proceso.areaId || 'sin-area';
      if (!agrupados[areaId]) {
        const area = mockAreas.find((a) => a.id === areaId) || { id: areaId, nombre: 'Sin área asignada' };
        agrupados[areaId] = { area, procesos: [] };
      }
      agrupados[areaId].procesos.push(proceso);
    });
    return agrupados;
  }, [procesosAsignados]);

  // Obtener observaciones de un proceso
  const getObservacionesProceso = (procesoId: string) => {
    return observaciones.filter((obs) => obs.procesoId === procesoId);
  };

  // Contar observaciones pendientes
  const contarObservacionesPendientes = (procesoId: string) => {
    return getObservacionesProceso(procesoId).filter((obs) => obs.estado === 'pendiente').length;
  };

  // Obtener nombre del responsable
  const getResponsableNombre = (responsableId?: string) => {
    if (!responsableId) return 'Sin asignar';
    return 'Responsable del Proceso'; // En producción vendría de la API
  };

  // Obtener estadísticas de un proceso
  const getEstadisticasProceso = (procesoId: string) => {
    const riesgos = todosRiesgos.filter((r) => r.procesoId === procesoId);
    return {
      total: riesgos.length,
      criticos: 0,
      altos: 0,
      medios: 0,
      bajos: 0,
    };
  };

  const handleAgregarObservacion = (proceso: Proceso) => {
    setProcesoSeleccionadoParaObs(proceso);
    setNuevaObservacion({
      procesoId: proceso.id,
      texto: '',
      tipo: 'proceso',
    });
    setObservacionDialogOpen(true);
  };

  const handleGuardarObservacion = () => {
    if (!nuevaObservacion.texto.trim()) {
      showError('El texto de la observación es requerido');
      return;
    }

    if (!procesoSeleccionadoParaObs) {
      showError('Debe seleccionar un proceso');
      return;
    }

    const nuevaObs: Observacion = {
      id: `obs-${Date.now()}`,
      procesoId: procesoSeleccionadoParaObs.id,
      autorId: user?.id || '',
      autorNombre: user?.fullName || 'Director',
      texto: nuevaObservacion.texto,
      tipo: 'proceso',
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    setObservaciones([...observaciones, nuevaObs]);
    showSuccess('Observación agregada correctamente');
    setObservacionDialogOpen(false);
    setNuevaObservacion({ texto: '', tipo: 'proceso' });
    setProcesoSeleccionadoParaObs(null);
  };

  const handleVerProceso = (proceso: Proceso) => {
    setProcesoSeleccionado(proceso);
    iniciarModoVisualizar();
    navigate(ROUTES.DASHBOARD);
  };

  if (loadingProcesos) {
    return (
      <Box>
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          Cargando procesos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Resumen de Procesos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista de supervisión - Procesos asignados por área con responsables y observaciones
        </Typography>
      </Box>

      {/* Estadísticas Generales */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Procesos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {procesosAsignados.length}
                  </Typography>
                </Box>
                <BusinessCenterIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Áreas Asignadas
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {Object.keys(procesosPorArea).length}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: '#0288d1', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Riesgos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {procesosAsignados.reduce(
                      (acc, p) => acc + todosRiesgos.filter((r) => r.procesoId === p.id).length,
                      0
                    )}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: '#ed6c02', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Observaciones Pendientes
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="error.main">
                    {observaciones.filter((obs) => obs.estado === 'pendiente').length}
                  </Typography>
                </Box>
                <CommentIcon sx={{ fontSize: 40, color: '#d32f2f', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Procesos por Área */}
      {Object.keys(procesosPorArea).length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              No tiene procesos asignados. Contacte al administrador para asignar procesos a sus áreas.
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(procesosPorArea).map(([areaId, { area, procesos: procesosArea }]) => {
            const totalRiesgos = procesosArea.reduce(
              (acc, p) => acc + todosRiesgos.filter((r) => r.procesoId === p.id).length,
              0
            );
            const observacionesArea = procesosArea.reduce(
              (acc, p) => acc + getObservacionesProceso(p.id).length,
              0
            );
            const observacionesPendientesArea = procesosArea.reduce(
              (acc, p) => acc + contarObservacionesPendientes(p.id),
              0
            );

            return (
              <Card key={areaId}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        {area.nombre}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip
                          label={`${procesosArea.length} proceso(s)`}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={`${totalRiesgos} riesgo(s)`}
                          size="small"
                          color="warning"
                        />
                        {observacionesPendientesArea > 0 && (
                          <Chip
                            label={`${observacionesPendientesArea} observación(es) pendiente(s)`}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Lista de Procesos del Área */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {procesosArea.map((proceso) => {
                      const stats = getEstadisticasProceso(proceso.id);
                      const obsProceso = getObservacionesProceso(proceso.id);
                      const obsPendientes = contarObservacionesPendientes(proceso.id);

                      return (
                        <Accordion key={proceso.id} defaultExpanded={false}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                              <BusinessCenterIcon sx={{ color: proceso.activo ? '#1976d2' : 'rgba(0, 0, 0, 0.3)' }} />
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {proceso.nombre}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={proceso.activo ? 'Activo' : 'Inactivo'}
                                    size="small"
                                    color={proceso.activo ? 'success' : 'default'}
                                  />
                                  <Chip
                                    label={`${stats.total} riesgo(s)`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  {obsPendientes > 0 && (
                                    <Badge badgeContent={obsPendientes} color="error">
                                      <Chip
                                        icon={<CommentIcon />}
                                        label="Observaciones"
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                      />
                                    </Badge>
                                  )}
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                                  <PersonIcon fontSize="small" />
                                </Avatar>
                                <Typography variant="body2" color="text.secondary">
                                  {proceso.responsableNombre || getResponsableNombre(proceso.responsableId)}
                                </Typography>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Grid2 container spacing={2}>
                              <Grid2 xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Descripción
                                </Typography>
                                <Typography variant="body2" paragraph>
                                  {proceso.descripcion || 'Sin descripción'}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                                  Responsable
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#1976d2' }}>
                                    <PersonIcon fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2">
                                    {proceso.responsableNombre || getResponsableNombre(proceso.responsableId) || 'Sin asignar'}
                                  </Typography>
                                </Box>
                              </Grid2>
                              <Grid2 xs={12} md={6}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleVerProceso(proceso)}
                                  >
                                    Ver Proceso
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleAgregarObservacion(proceso)}
                                  >
                                    Agregar Observación
                                  </Button>
                                </Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                  Observaciones ({obsProceso.length})
                                </Typography>
                                {obsProceso.length === 0 ? (
                                  <Alert severity="info" sx={{ mt: 1 }}>
                                    No hay observaciones para este proceso
                                  </Alert>
                                ) : (
                                  <List dense>
                                    {obsProceso.map((obs) => (
                                      <ListItem
                                        key={obs.id}
                                        sx={{
                                          borderLeft: `3px solid ${
                                            obs.estado === 'pendiente'
                                              ? '#d32f2f'
                                              : obs.estado === 'revisada'
                                              ? '#ed6c02'
                                              : '#2e7d32'
                                          }`,
                                          pl: 2,
                                          mb: 1,
                                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                                          borderRadius: 1,
                                        }}
                                      >
                                        <ListItemAvatar>
                                          <Avatar sx={{ bgcolor: '#1976d2', width: 32, height: 32 }}>
                                            <CommentIcon fontSize="small" />
                                          </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight={600}>
                                                {obs.autorNombre}
                                              </Typography>
                                              <Chip
                                                label={obs.estado}
                                                size="small"
                                                color={
                                                  obs.estado === 'pendiente'
                                                    ? 'error'
                                                    : obs.estado === 'revisada'
                                                    ? 'warning'
                                                    : 'success'
                                                }
                                                icon={
                                                  obs.estado === 'pendiente' ? (
                                                    <PendingIcon fontSize="small" />
                                                  ) : (
                                                    <CheckCircleIcon fontSize="small" />
                                                  )
                                                }
                                              />
                                            </Box>
                                          }
                                          secondary={
                                            <>
                                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {obs.texto}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {new Date(obs.fechaCreacion).toLocaleString('es-ES')}
                                              </Typography>
                                            </>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                )}
                              </Grid2>
                            </Grid2>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Diálogo para Agregar Observación */}
      <Dialog
        open={observacionDialogOpen}
        onClose={() => {
          setObservacionDialogOpen(false);
          setNuevaObservacion({ texto: '', tipo: 'proceso' });
          setProcesoSeleccionadoParaObs(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Agregar Observación - {procesoSeleccionadoParaObs?.nombre}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Observación"
              value={nuevaObservacion.texto}
              onChange={(e) =>
                setNuevaObservacion({ ...nuevaObservacion, texto: e.target.value })
              }
              placeholder="Escriba su observación sobre este proceso. El dueño del proceso podrá verla y tomar las acciones correspondientes."
              helperText={`Esta observación será visible para el dueño del proceso y quedará registrada en el historial.`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setObservacionDialogOpen(false);
              setNuevaObservacion({ texto: '', tipo: 'proceso' });
              setProcesoSeleccionadoParaObs(null);
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleGuardarObservacion} variant="contained">
            Guardar Observación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

