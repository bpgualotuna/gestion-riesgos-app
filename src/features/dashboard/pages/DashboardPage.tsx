/**
 * Dashboard Page
 * Lista de riesgos con opción de crear nuevo o seleccionar para ver/editar
 */

import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Button, 
  Menu,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  TextField,
} from '@mui/material';
// @ts-expect-error - Grid2 is available in @mui/material v7 but types may not be recognized
import Grid2 from '@mui/material/Grid2';
import {
  Add as AddIcon,
  BusinessCenter as BusinessCenterIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetEstadisticasQuery, useGetObservacionesQuery } from '../../gestion-riesgos/api/riesgosApi';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../hooks/useNotification';
import { useGetProcesosQuery } from '../../gestion-riesgos/api/riesgosApi';
import { ROUTES } from '../../../utils/constants';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import ResumenDirectorPage from '../../gestion-riesgos/pages/ResumenDirectorPage';
import type { Proceso, EstadoProceso } from '../../gestion-riesgos/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, esAdmin, esDirectorProcesos, esDueñoProcesos } = useAuth();
  
  // Si es admin, redirigir a administración
  if (esAdmin) {
    return <Navigate to={ROUTES.ADMINISTRACION} replace />;
  }
  
  // Si es director de procesos, mostrar el resumen en lugar del dashboard normal
  if (esDirectorProcesos) {
    return <ResumenDirectorPage />;
  }
  const { procesoSeleccionado, setProcesoSeleccionado, puedeGestionarProcesos, iniciarModoEditar, iniciarModoVisualizar } = useProceso();
  const { showSuccess, showError } = useNotification();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const [procesoMenuAnchor, setProcesoMenuAnchor] = useState<null | HTMLElement>(null);
  const [resumenOpen, setResumenOpen] = useState(false);
  const [procesoResumen, setProcesoResumen] = useState<any>(null);
  
  // Filtrar procesos según el rol del usuario
  const procesosFiltrados = useMemo(() => {
    if (esAdmin) {
      // Admin ve todos los procesos
      return procesos;
    } else if (esDirectorProcesos && user) {
      // Director de procesos solo ve procesos de sus áreas asignadas
      return procesos.filter((p) => p.directorId === user.id);
    } else {
      // Otros usuarios ven todos los procesos (comportamiento por defecto)
      return procesos;
    }
  }, [procesos, esAdmin, esDirectorProcesos, user]);

  // Obtener todos los riesgos para calcular estadísticas
  const { data: todosRiesgosData } = useGetRiesgosQuery({ pageSize: 1000 });
  const todosRiesgos = todosRiesgosData?.data || [];

  // Filtrar procesos del dueño de procesos
  const procesosDelDueño = useMemo(() => {
    if (esDueñoProcesos && user) {
      return procesosFiltrados.filter((p) => p.responsableId === user.id);
    }
    return procesosFiltrados;
  }, [procesosFiltrados, esDueñoProcesos, user]);

  // Obtener áreas desde localStorage (igual que en AdminPage)
  const areas = useMemo(() => {
    const stored = localStorage.getItem('admin_areas');
    if (stored) {
      return JSON.parse(stored);
    }
    return [
      { id: '1', nombre: 'Gestión Financiera y Administrativa', gerentesIds: [], activa: true },
      { id: '2', nombre: 'Talento Humano', gerentesIds: [], activa: true },
      { id: '3', nombre: 'Operaciones', gerentesIds: [], activa: true },
    ];
  }, []);

  // Agrupar procesos por área
  const procesosPorArea = useMemo(() => {
    const agrupados: { [key: string]: { area: typeof areas[0]; procesos: Proceso[] } } = {};
    
    procesosDelDueño.forEach((proceso) => {
      const areaId = proceso.areaId || 'sin-area';
      if (!agrupados[areaId]) {
        const area = areas.find((a: any) => a.id === areaId) || { 
          id: areaId, 
          nombre: proceso.areaNombre || 'Sin área asignada',
          gerentesIds: [],
          activa: true
        };
        agrupados[areaId] = { area, procesos: [] };
      }
      agrupados[areaId].procesos.push(proceso);
    });
    
    return agrupados;
  }, [procesosDelDueño, areas]);

  // Estados para crear proceso por área
  const [openCrearProcesoDialog, setOpenCrearProcesoDialog] = useState(false);
  const [areaSeleccionadaParaCrear, setAreaSeleccionadaParaCrear] = useState<string>('');
  const [formDataNuevoProceso, setFormDataNuevoProceso] = useState({
    nombre: '',
    descripcion: '',
    areaId: '',
    areaNombre: '',
  });

  // Calcular estadísticas generales de riesgos
  const estadisticasRiesgos = useMemo(() => {
    const riesgosDelDueño = todosRiesgos.filter((r) => {
      const proceso = procesosDelDueño.find((p) => p.id === r.procesoId);
      return proceso !== undefined;
    });

    return {
      total: riesgosDelDueño.length,
      criticos: riesgosDelDueño.filter((r) => {
        // Calcular nivel de riesgo basado en evaluación si existe
        return false; // Por ahora, se puede mejorar con evaluaciones
      }).length,
      altos: 0,
      medios: 0,
      bajos: 0,
    };
  }, [todosRiesgos, procesosDelDueño]);

  // Obtener estadísticas por proceso
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

  // Obtener color del estado
  const getEstadoColor = (estado?: EstadoProceso) => {
    switch (estado) {
      case 'borrador':
        return 'default';
      case 'en_revision':
        return 'warning';
      case 'aprobado':
        return 'success';
      case 'con_observaciones':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener label del estado
  const getEstadoLabel = (estado?: EstadoProceso) => {
    switch (estado) {
      case 'borrador':
        return 'Borrador';
      case 'en_revision':
        return 'En Revisión';
      case 'aprobado':
        return 'Aprobado';
      case 'con_observaciones':
        return 'Con Observaciones';
      default:
        return 'Borrador';
    }
  };

  // Obtener icono del estado
  const getEstadoIcon = (estado?: EstadoProceso) => {
    switch (estado) {
      case 'aprobado':
        return <CheckCircleIcon />;
      case 'en_revision':
        return <PendingIcon />;
      case 'con_observaciones':
        return <WarningIcon />;
      default:
        return <EditIcon />;
    }
  };

  const handleProcesoMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProcesoMenuAnchor(event.currentTarget);
  };

  const handleProcesoMenuClose = () => {
    setProcesoMenuAnchor(null);
  };

  const handleSelectProceso = (procesoId: string) => {
    const proceso = procesosFiltrados.find((p) => p.id === procesoId);
    if (proceso) {
      setProcesoSeleccionado(proceso);
      showSuccess(`Proceso "${proceso.nombre}" seleccionado`);
      handleProcesoMenuClose();
    }
  };

  const handleCrearProceso = () => {
    handleProcesoMenuClose();
    navigate(ROUTES.PROCESOS_NUEVO);
  };

  const handleVerResumen = (proceso: any) => {
    const riesgosDelProceso = todosRiesgos.filter((r) => r.procesoId === proceso.id);
    const estadisticas = {
      total: riesgosDelProceso.length,
      criticos: 0,
      altos: 0,
      medios: 0,
      bajos: 0,
    };
    setProcesoResumen({ ...proceso, riesgos: riesgosDelProceso, estadisticas });
    setResumenOpen(true);
  };

  // Si es dueño de procesos, mostrar dashboard mejorado
  if (esDueñoProcesos) {
    return (
      <Box>
        {/* Título Principal */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Resumen de procesos y riesgos a su cargo
          </Typography>
        </Box>

        {/* Estadísticas Generales de Riesgos */}
        <Grid2 container spacing={3} sx={{ mb: 4 }}>
          <Grid2 xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Riesgos
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {estadisticasRiesgos.total}
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.3 }} />
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
                      Procesos Asignados
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="info.main">
                      {procesosDelDueño.length}
                    </Typography>
                  </Box>
                  <BusinessCenterIcon sx={{ fontSize: 40, color: '#0288d1', opacity: 0.3 }} />
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
                      Procesos Aprobados
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {procesosDelDueño.filter((p) => p.estado === 'aprobado').length}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#2e7d32', opacity: 0.3 }} />
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
                      Con Observaciones
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {procesosDelDueño.filter((p) => p.estado === 'con_observaciones').length}
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: '#d32f2f', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Lista de Procesos con Estados */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Mis Procesos por Área
            </Typography>
            {puedeGestionarProcesos && (
              <Button
                variant="contained"
                size="medium"
                startIcon={<AddIcon />}
                onClick={() => setOpenCrearProcesoDialog(true)}
                sx={{ 
                  background: '#1976d2',
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: '#1565c0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Nuevo Proceso
              </Button>
            )}
          </Box>

          {loadingProcesos ? (
            <Card>
              <CardContent>
                <LinearProgress />
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
                  Cargando procesos...
                </Typography>
              </CardContent>
            </Card>
          ) : procesosDelDueño.length === 0 ? (
            <Card>
              <CardContent>
                <Alert severity="info">
                  No tiene procesos asignados. Cree uno nuevo para comenzar.
                </Alert>
              </CardContent>
            </Card>
          ) : Object.keys(procesosPorArea).length === 0 ? (
            <Card>
              <CardContent>
                <Alert severity="info">
                  No tiene procesos asignados. Cree uno nuevo para comenzar.
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(procesosPorArea).map(([areaId, { area, procesos: procesosArea }]) => {
                const totalRiesgosArea = procesosArea.reduce(
                  (acc, p) => acc + getEstadisticasProceso(p.id).total,
                  0
                );
                const procesosAprobados = procesosArea.filter((p) => p.estado === 'aprobado').length;
                const procesosConObs = procesosArea.filter((p) => p.estado === 'con_observaciones').length;
                const procesosEnRevision = procesosArea.filter((p) => p.estado === 'en_revision').length;
                const procesosBorrador = procesosArea.filter((p) => p.estado === 'borrador').length;

                return (
                  <Card key={areaId} sx={{ overflow: 'visible' }}>
                    <CardContent>
                      {/* Header del Área */}
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
                              label={`${totalRiesgosArea} riesgo(s)`}
                              size="small"
                              color="warning"
                            />
                            {procesosAprobados > 0 && (
                              <Chip
                                label={`${procesosAprobados} aprobado(s)`}
                                size="small"
                                color="success"
                              />
                            )}
                            {procesosConObs > 0 && (
                              <Chip
                                label={`${procesosConObs} con observaciones`}
                                size="small"
                                color="error"
                              />
                            )}
                            {procesosEnRevision > 0 && (
                              <Chip
                                label={`${procesosEnRevision} en revisión`}
                                size="small"
                                color="warning"
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      {/* Grid de Procesos del Área */}
                      <Grid2 container spacing={3}>
                        {procesosArea.map((proceso) => {
                          const stats = getEstadisticasProceso(proceso.id);
                          // Obtener observaciones pendientes desde localStorage (temporal)
                          const stored = localStorage.getItem('observaciones_procesos');
                          const todasObservaciones = stored ? JSON.parse(stored) : [];
                          const observacionesPendientes = todasObservaciones.filter(
                            (obs: any) => obs.procesoId === proceso.id && !obs.resuelta
                          ).length;

                          return (
                            <Grid2 xs={12} md={6} lg={4} key={proceso.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: procesoSeleccionado?.id === proceso.id ? '2px solid #1976d2' : '1px solid rgba(0, 0, 0, 0.12)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                        },
                      }}
                      onClick={() => handleSelectProceso(proceso.id)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <BusinessCenterIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                              {proceso.nombre}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          icon={getEstadoIcon(proceso.estado)}
                          label={getEstadoLabel(proceso.estado)}
                          color={getEstadoColor(proceso.estado)}
                          size="small"
                          sx={{ mb: 2 }}
                        />

                        {proceso.descripcion && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {proceso.descripcion.length > 100 
                              ? `${proceso.descripcion.substring(0, 100)}...` 
                              : proceso.descripcion}
                          </Typography>
                        )}

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Riesgos:
                          </Typography>
                          <Chip
                            label={stats.total}
                            size="small"
                            color={stats.total > 0 ? 'primary' : 'default'}
                          />
                        </Box>

                        {observacionesPendientes > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Observaciones pendientes:
                            </Typography>
                            <Chip
                              label={observacionesPendientes}
                              size="small"
                              color="error"
                              icon={<WarningIcon />}
                            />
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProceso(proceso.id);
                              iniciarModoVisualizar();
                            }}
                            sx={{ flex: 1, textTransform: 'none' }}
                          >
                            Ver
                          </Button>
                          {proceso.estado !== 'aprobado' && proceso.estado !== 'en_revision' && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProceso(proceso.id);
                                iniciarModoEditar();
                              }}
                              sx={{ flex: 1, textTransform: 'none' }}
                            >
                              Editar
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid2>
                );
              })}
                      </Grid2>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Diálogo para Crear Proceso por Área */}
        <Dialog
          open={openCrearProcesoDialog}
          onClose={() => {
            setOpenCrearProcesoDialog(false);
            setAreaSeleccionadaParaCrear('');
            setFormDataNuevoProceso({ nombre: '', descripcion: '', areaId: '', areaNombre: '' });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Crear Nuevo Proceso</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Seleccionar Área</InputLabel>
                <Select
                  value={areaSeleccionadaParaCrear}
                  onChange={(e) => {
                    const areaId = e.target.value;
                    const area = areas.find((a: any) => a.id === areaId);
                    setAreaSeleccionadaParaCrear(areaId);
                    setFormDataNuevoProceso({
                      ...formDataNuevoProceso,
                      areaId,
                      areaNombre: area?.nombre || '',
                    });
                  }}
                  label="Seleccionar Área"
                >
                  {areas.filter((a: any) => a.activa).map((area: any) => (
                    <MenuItem key={area.id} value={area.id}>
                      {area.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {areaSeleccionadaParaCrear && (
                <>
                  <TextField
                    fullWidth
                    label="Nombre del Proceso"
                    value={formDataNuevoProceso.nombre}
                    onChange={(e) => setFormDataNuevoProceso({ ...formDataNuevoProceso, nombre: e.target.value })}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formDataNuevoProceso.descripcion}
                    onChange={(e) => setFormDataNuevoProceso({ ...formDataNuevoProceso, descripcion: e.target.value })}
                    multiline
                    rows={3}
                  />
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenCrearProcesoDialog(false);
              setAreaSeleccionadaParaCrear('');
              setFormDataNuevoProceso({ nombre: '', descripcion: '', areaId: '', areaNombre: '' });
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                if (!formDataNuevoProceso.nombre || !areaSeleccionadaParaCrear) {
                  showError('Debe completar el nombre del proceso y seleccionar un área');
                  return;
                }
                // Navegar a crear proceso con el área pre-seleccionada
                navigate(ROUTES.PROCESOS_NUEVO, { 
                  state: { 
                    areaId: areaSeleccionadaParaCrear,
                    areaNombre: formDataNuevoProceso.areaNombre,
                    nombre: formDataNuevoProceso.nombre,
                    descripcion: formDataNuevoProceso.descripcion,
                  }
                });
                setOpenCrearProcesoDialog(false);
                setAreaSeleccionadaParaCrear('');
                setFormDataNuevoProceso({ nombre: '', descripcion: '', areaId: '', areaNombre: '' });
              }}
              disabled={!formDataNuevoProceso.nombre || !areaSeleccionadaParaCrear}
              startIcon={<AddIcon />}
            >
              Crear Proceso
            </Button>
          </DialogActions>
        </Dialog>

      {/* Selector de Proceso - Compacto */}
      {procesoSeleccionado && (
        <Card sx={{ mb: 3, background: 'rgba(25, 118, 210, 0.05)', border: '2px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessCenterIcon sx={{ fontSize: 32, color: '#1976d2' }} />
    <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Proceso Activo
      </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {procesoSeleccionado.nombre}
      </Typography>
                </Box>
              </Box>
              <Chip
                icon={<BusinessCenterIcon />}
                label={procesoSeleccionado.nombre}
                onClick={handleProcesoMenuOpen}
                sx={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Menu de Selección de Proceso */}
      <Menu
        anchorEl={procesoMenuAnchor}
        open={Boolean(procesoMenuAnchor)}
        onClose={handleProcesoMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 300,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {!procesoSeleccionado && (
          <Box sx={{ px: 2, py: 1 }}>
            <Alert severity="warning" sx={{ mb: 1 }}>
              Debe seleccionar un proceso para continuar
            </Alert>
          </Box>
        )}
        {loadingProcesos ? (
          <MenuItem disabled>Cargando procesos...</MenuItem>
        ) : procesosFiltrados.length === 0 ? (
          <MenuItem disabled>No hay procesos disponibles</MenuItem>
        ) : (
          procesosFiltrados.map((proceso) => (
            <MenuItem
              key={proceso.id}
              onClick={() => handleSelectProceso(proceso.id)}
              selected={procesoSeleccionado?.id === proceso.id}
            sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
              '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  },
              },
            }}
          >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {proceso.nombre}
                  </Typography>
                {proceso.descripcion && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {proceso.descripcion}
                  </Typography>
                )}
                </Box>
            </MenuItem>
          ))
        )}
        {puedeGestionarProcesos && (
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCrearProceso}
              sx={{ mt: 1 }}
            >
              Crear Nuevo Proceso
            </Button>
          </Box>
        )}
      </Menu>

        {/* Diálogo de Resumen del Proceso */}
        <Dialog
        open={resumenOpen}
        onClose={() => setResumenOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenterIcon sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Resumen del Proceso: {procesoResumen?.nombre}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {procesoResumen && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                Descripción
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                {procesoResumen.descripcion || 'Sin descripción'}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mt: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vicepresidencia
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.vicepresidencia || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Gerencia
            </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.gerencia || '-'}
            </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responsable
            </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.responsable || '-'}
            </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total de Riesgos
            </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {procesoResumen.estadisticas?.total || 0}
            </Typography>
                </Box>
      </Box>

              {procesoResumen.estadisticas && procesoResumen.estadisticas.total > 0 && (
                <Box sx={{ mt: 4, p: 2.5, background: 'rgba(25, 118, 210, 0.05)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                    Estadísticas de Riesgos
        </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                    <Chip 
                      label={`Críticos: ${procesoResumen.estadisticas.criticos}`} 
                      color="error" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Altos: ${procesoResumen.estadisticas.altos}`} 
                      color="warning" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Medios: ${procesoResumen.estadisticas.medios}`} 
                      color="info" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Bajos: ${procesoResumen.estadisticas.bajos}`} 
                      color="success" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
        />
      </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => setResumenOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            Cerrar
          </Button>
          {procesoResumen && (
            <>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  handleSelectProceso(procesoResumen.id);
                  iniciarModoVisualizar();
                  setResumenOpen(false);
                  showSuccess(`Proceso "${procesoResumen.nombre}" seleccionado en modo visualización. Las opciones del menú están habilitadas.`);
                }}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    background: 'rgba(25, 118, 210, 0.08)',
                  },
                }}
              >
                Visualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleSelectProceso(procesoResumen.id);
                  iniciarModoEditar();
                  setResumenOpen(false);
                  showSuccess(`Proceso "${procesoResumen.nombre}" seleccionado en modo edición. Puede editar el contenido de todas las pestañas.`);
                }}
                sx={{ 
                  background: '#1976d2',
                  borderRadius: 2,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: '#1565c0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Editar
              </Button>
            </>
          )}
        </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Dashboard normal para otros usuarios (sin cambios)
  return (
    <Box>
      {/* Título Principal */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestión de riesgos por proceso
        </Typography>
      </Box>

      {/* Tabla de Procesos - Solo para usuarios que no son dueños */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            Procesos
          </Typography>
          {puedeGestionarProcesos && (
            <Button
              variant="contained"
              size="medium"
              startIcon={<AddIcon />}
              onClick={handleCrearProceso}
              sx={{ 
                background: '#1976d2',
                borderRadius: 2,
                px: 3,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  background: '#1565c0',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                },
                transition: 'all 0.2s',
              }}
            >
              Nuevo Proceso
            </Button>
          )}
        </Box>

        {loadingProcesos ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                Cargando procesos...
              </Typography>
            </CardContent>
          </Card>
        ) : procesosFiltrados.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center">
                No hay procesos disponibles. Cree uno nuevo para comenzar.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">
            Seleccione un proceso desde el menú de procesos en la barra superior.
          </Alert>
        )}
      </Box>

      {/* Selector de Proceso - Compacto */}
      {procesoSeleccionado && (
        <Card sx={{ mb: 3, background: 'rgba(25, 118, 210, 0.05)', border: '2px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessCenterIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Proceso Activo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {procesoSeleccionado.nombre}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={<BusinessCenterIcon />}
                label={procesoSeleccionado.nombre}
                onClick={handleProcesoMenuOpen}
                sx={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#1565c0',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Menu de Selección de Proceso */}
      <Menu
        anchorEl={procesoMenuAnchor}
        open={Boolean(procesoMenuAnchor)}
        onClose={handleProcesoMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 300,
            maxHeight: 400,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        {!procesoSeleccionado && (
          <Box sx={{ px: 2, py: 1 }}>
            <Alert severity="warning" sx={{ mb: 1 }}>
              Debe seleccionar un proceso para continuar
            </Alert>
          </Box>
        )}
        {loadingProcesos ? (
          <MenuItem disabled>Cargando procesos...</MenuItem>
        ) : procesosFiltrados.length === 0 ? (
          <MenuItem disabled>No hay procesos disponibles</MenuItem>
        ) : (
          procesosFiltrados.map((proceso) => (
            <MenuItem
              key={proceso.id}
              onClick={() => handleSelectProceso(proceso.id)}
              selected={procesoSeleccionado?.id === proceso.id}
              sx={{
                py: 1.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.15)',
                  },
                },
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {proceso.nombre}
                </Typography>
                {proceso.descripcion && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {proceso.descripcion}
                  </Typography>
                )}
              </Box>
            </MenuItem>
          ))
        )}
        {puedeGestionarProcesos && (
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCrearProceso}
              sx={{ mt: 1 }}
            >
              Crear Nuevo Proceso
            </Button>
          </Box>
        )}
      </Menu>

      {/* Diálogo de Resumen del Proceso */}
      <Dialog
        open={resumenOpen}
        onClose={() => setResumenOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessCenterIcon sx={{ color: '#1976d2', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Resumen del Proceso: {procesoResumen?.nombre}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {procesoResumen && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                Descripción
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                {procesoResumen.descripcion || 'Sin descripción'}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3, mt: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Vicepresidencia
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.vicepresidencia || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Gerencia
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.gerencia || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responsable
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {procesoResumen.responsable || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total de Riesgos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {procesoResumen.estadisticas?.total || 0}
                  </Typography>
                </Box>
              </Box>

              {procesoResumen.estadisticas && procesoResumen.estadisticas.total > 0 && (
                <Box sx={{ mt: 4, p: 2.5, background: 'rgba(25, 118, 210, 0.05)', borderRadius: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom fontWeight={600}>
                    Estadísticas de Riesgos
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                    <Chip 
                      label={`Críticos: ${procesoResumen.estadisticas.criticos}`} 
                      color="error" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Altos: ${procesoResumen.estadisticas.altos}`} 
                      color="warning" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Medios: ${procesoResumen.estadisticas.medios}`} 
                      color="info" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                    <Chip 
                      label={`Bajos: ${procesoResumen.estadisticas.bajos}`} 
                      color="success" 
                      size="medium"
                      sx={{ fontWeight: 600, px: 1 }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 2, gap: 1.5 }}>
          <Button 
            onClick={() => setResumenOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            Cerrar
          </Button>
          {procesoResumen && (
            <>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={() => {
                  handleSelectProceso(procesoResumen.id);
                  iniciarModoVisualizar();
                  setResumenOpen(false);
                  showSuccess(`Proceso "${procesoResumen.nombre}" seleccionado en modo visualización. Las opciones del menú están habilitadas.`);
                }}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  '&:hover': {
                    borderColor: '#1565c0',
                    background: 'rgba(25, 118, 210, 0.08)',
                  },
                }}
              >
                Visualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleSelectProceso(procesoResumen.id);
                  iniciarModoEditar();
                  setResumenOpen(false);
                  showSuccess(`Proceso "${procesoResumen.nombre}" seleccionado en modo edición. Puede editar el contenido de todas las pestañas.`);
                }}
                sx={{ 
                  background: '#1976d2',
                  borderRadius: 2,
                  px: 4,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    background: '#1565c0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  },
                  transition: 'all 0.2s',
                }}
              >
                Editar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
