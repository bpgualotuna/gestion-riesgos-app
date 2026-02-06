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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
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
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetEstadisticasQuery, useGetObservacionesQuery, useDuplicateProcesoMutation } from '../../gestion-riesgos/api/riesgosApi';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../shared/hooks/useNotification';
import { useGetProcesosQuery } from '../../gestion-riesgos/api/riesgosApi';
import { ROUTES } from '../../../utils/constants';
import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import ResumenDirectorPage from '../../gestion-riesgos/pages/ResumenDirectorPage';
import type { Proceso, EstadoProceso } from '../../gestion-riesgos/types';
import { useProcesosAsignados } from '../../gestion-riesgos/hooks/useAsignaciones';

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
  const procesosAsignadosIds = useProcesosAsignados(); // IDs de procesos asignados al usuario actual
  const [duplicateProceso] = useDuplicateProcesoMutation();
  const [procesoMenuAnchor, setProcesoMenuAnchor] = useState<null | HTMLElement>(null);
  const [resumenOpen, setResumenOpen] = useState(false);
  const [procesoResumen, setProcesoResumen] = useState<any>(null);
  
  // Estados para duplicar proceso
  const [openDuplicarDialog, setOpenDuplicarDialog] = useState(false);
  const [procesoADuplicar, setProcesoADuplicar] = useState<Proceso | null>(null);
  const [formDataDuplicar, setFormDataDuplicar] = useState({
    nombre: '',
    año: new Date().getFullYear(),
    descripcion: '',
  });
  
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

  // Filtrar procesos del dueño del proceso - Solo los asignados por admin
  const procesosDelDueño = useMemo(() => {
    if (esDueñoProcesos && user) {
      // Si hay asignaciones, solo mostrar procesos asignados
      if (procesosAsignadosIds.length > 0) {
        return procesosFiltrados.filter((p) => procesosAsignadosIds.includes(p.id));
      }
      // Si no hay asignaciones, mantener comportamiento anterior (por responsableId)
      return procesosFiltrados.filter((p) => p.responsableId === user.id);
    }
    return procesosFiltrados;
  }, [procesosFiltrados, esDueñoProcesos, user, procesosAsignadosIds]);

  // Mostrar información de asignaciones si es dueño de proceso
  const tieneProcesosAsignados = esDueñoProcesos && procesosAsignadosIds.length > 0;
  const sinProcesosAsignados = esDueñoProcesos && procesosAsignadosIds.length === 0;

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

  // Obtener áreas asignadas al usuario (solo áreas donde tiene procesos)
  // Si no tiene procesos, puede ver todas las áreas activas para crear el primero
  const areasAsignadas = useMemo(() => {
    if (!user || !esDueñoProcesos) return [];
    const areasDelUsuario = new Set<string>();
    procesosDelDueño.forEach((p) => {
      if (p.areaId) areasDelUsuario.add(p.areaId);
    });
    // Si tiene procesos, solo mostrar áreas donde tiene procesos
    // Si no tiene procesos, mostrar todas las áreas activas para que pueda crear uno
    if (areasDelUsuario.size > 0) {
      return areas.filter((a: any) => areasDelUsuario.has(a.id) && a.activa);
    } else {
      return areas.filter((a: any) => a.activa);
    }
  }, [procesosDelDueño, areas, user, esDueñoProcesos]);

  // Estados para filtros y tabla
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtrar procesos según los filtros
  const procesosFiltradosTabla = useMemo(() => {
    let filtrados = procesosDelDueño;
    
    if (filtroArea !== 'todas') {
      filtrados = filtrados.filter((p) => p.areaId === filtroArea);
    }
    
    if (filtroEstado !== 'todos') {
      filtrados = filtrados.filter((p) => p.estado === filtroEstado);
    }
    
    return filtrados;
  }, [procesosDelDueño, filtroArea, filtroEstado]);

  // Si es dueño del proceso, mostrar tabla de procesos
  if (esDueñoProcesos) {
    return (
      <Box>
        {/* Título y Botón Crear */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Mis Procesos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de procesos asignados
            </Typography>
          </Box>
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
              }}
            >
              Nuevo Proceso
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid2 container spacing={2}>
              <Grid2 xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Área</InputLabel>
                  <Select
                    value={filtroArea}
                    onChange={(e) => {
                      setFiltroArea(e.target.value);
                      setPage(0);
                    }}
                    label="Filtrar por Área"
                  >
                    <MenuItem value="todas">Todas las áreas</MenuItem>
                    {areasAsignadas.map((area: any) => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Filtrar por Estado</InputLabel>
                  <Select
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value);
                      setPage(0);
                    }}
                    label="Filtrar por Estado"
                  >
                    <MenuItem value="todos">Todos los estados</MenuItem>
                    <MenuItem value="borrador">Borrador</MenuItem>
                    <MenuItem value="en_revision">En Revisión</MenuItem>
                    <MenuItem value="aprobado">Aprobado</MenuItem>
                    <MenuItem value="con_observaciones">Con Observaciones</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Tabla de Procesos */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Área</strong></TableCell>
                  <TableCell><strong>Proceso</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Riesgos</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingProcesos ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <LinearProgress sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Cargando procesos...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : procesosFiltradosTabla.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Alert severity="info" sx={{ my: 2 }}>
                        {procesosDelDueño.length === 0 
                          ? 'No tiene procesos asignados. Cree uno nuevo para comenzar.'
                          : 'No hay procesos que coincidan con los filtros seleccionados.'}
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : (
                  procesosFiltradosTabla
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((proceso) => {
                      const stats = getEstadisticasProceso(proceso.id);
                      const area = areas.find((a: any) => a.id === proceso.areaId);
                      
                      return (
                        <TableRow 
                          key={proceso.id}
                          hover
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: procesoSeleccionado?.id === proceso.id ? 'rgba(25, 118, 210, 0.08)' : 'inherit',
                          }}
                          onClick={() => handleSelectProceso(proceso.id)}
                        >
                          <TableCell>{area?.nombre || proceso.areaNombre || 'Sin área'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {proceso.nombre}
                            </Typography>
                            {proceso.descripcion && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {proceso.descripcion.length > 50 
                                  ? `${proceso.descripcion.substring(0, 50)}...` 
                                  : proceso.descripcion}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getEstadoIcon(proceso.estado)}
                              label={getEstadoLabel(proceso.estado)}
                              color={getEstadoColor(proceso.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={stats.total}
                              size="small"
                              color={stats.total > 0 ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectProceso(proceso.id);
                                  iniciarModoVisualizar();
                                }}
                                title="Ver"
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              {proceso.estado !== 'aprobado' && proceso.estado !== 'en_revision' && (
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectProceso(proceso.id);
                                    iniciarModoEditar();
                                  }}
                                  title="Editar"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              )}
                              {puedeGestionarProcesos && (
                                <IconButton
                                  size="small"
                                  color="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProcesoADuplicar(proceso);
                                    setFormDataDuplicar({
                                      nombre: `${proceso.nombre} ${new Date().getFullYear()}`,
                                      año: new Date().getFullYear(),
                                      descripcion: proceso.descripcion || '',
                                    });
                                    setOpenDuplicarDialog(true);
                                  }}
                                  title="Duplicar"
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {procesosFiltradosTabla.length > 0 && (
            <TablePagination
              component="div"
              count={procesosFiltradosTabla.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
            />
          )}
        </Card>

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
                  {areasAsignadas.filter((a: any) => a.activa).map((area: any) => (
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

        {/* Diálogo para Duplicar Proceso */}
        <Dialog
          open={openDuplicarDialog}
          onClose={() => {
            setOpenDuplicarDialog(false);
            setProcesoADuplicar(null);
            setFormDataDuplicar({ nombre: '', año: new Date().getFullYear(), descripcion: '' });
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Duplicar Proceso</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Se creará una copia del proceso "{procesoADuplicar?.nombre}" para el nuevo año. 
                Puede modificar el nombre y otros campos antes de crear la copia.
              </Alert>
              <TextField
                fullWidth
                label="Año"
                type="number"
                value={formDataDuplicar.año}
                onChange={(e) => {
                  const año = parseInt(e.target.value) || new Date().getFullYear();
                  setFormDataDuplicar({
                    ...formDataDuplicar,
                    año,
                    nombre: procesoADuplicar ? `${procesoADuplicar.nombre.split(' ').slice(0, -1).join(' ')} ${año}`.trim() : '',
                  });
                }}
                inputProps={{ min: 2020, max: 2100 }}
                helperText="Año para el nuevo proceso"
              />
              <TextField
                fullWidth
                label="Nombre del Proceso"
                value={formDataDuplicar.nombre}
                onChange={(e) => setFormDataDuplicar({ ...formDataDuplicar, nombre: e.target.value })}
                required
                helperText="El nombre se actualiza automáticamente con el año, pero puede modificarlo"
              />
              <TextField
                fullWidth
                label="Descripción"
                value={formDataDuplicar.descripcion}
                onChange={(e) => setFormDataDuplicar({ ...formDataDuplicar, descripcion: e.target.value })}
                multiline
                rows={3}
                helperText="Puede modificar la descripción para el nuevo proceso"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDuplicarDialog(false);
              setProcesoADuplicar(null);
              setFormDataDuplicar({ nombre: '', año: new Date().getFullYear(), descripcion: '' });
            }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={async () => {
                if (!formDataDuplicar.nombre || !procesoADuplicar) {
                  showError('Debe completar el nombre del proceso');
                  return;
                }
                try {
                  await duplicateProceso({
                    id: procesoADuplicar.id,
                    overrides: {
                      nombre: formDataDuplicar.nombre,
                      descripcion: formDataDuplicar.descripcion || procesoADuplicar.descripcion,
                      año: formDataDuplicar.año,
                    },
                  }).unwrap();
                  showSuccess(`Proceso "${formDataDuplicar.nombre}" duplicado exitosamente`);
                  setOpenDuplicarDialog(false);
                  setProcesoADuplicar(null);
                  setFormDataDuplicar({ nombre: '', año: new Date().getFullYear(), descripcion: '' });
                } catch (error: any) {
                  showError(error?.data?.message || 'Error al duplicar el proceso');
                }
              }}
              disabled={!formDataDuplicar.nombre}
              startIcon={<ContentCopyIcon />}
            >
              Duplicar Proceso
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

      {/* Alerta si no tiene procesos asignados */}
      {sinProcesosAsignados && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            No tiene procesos asignados
          </Typography>
          <Typography variant="body2">
            Contacte al administrador para que le asigne procesos. 
            El administrador debe primero cargar todos los procesos y luego asignarle los procesos que debe gestionar.
          </Typography>
        </Alert>
      )}

      {/* Información de procesos asignados */}
      {tieneProcesosAsignados && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Procesos Asignados: {procesosAsignadosIds.length}
          </Typography>
          <Typography variant="body2">
            Solo puede ver y gestionar los procesos que el administrador le ha asignado.
          </Typography>
        </Alert>
      )}

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
