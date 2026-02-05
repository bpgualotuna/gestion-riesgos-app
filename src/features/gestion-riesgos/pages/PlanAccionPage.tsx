/**
 * Plan de Acción Page
 * Gestión de planes de acción para riesgos con seguimiento y tareas
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
// Usaremos TextField con type="date" en lugar de DatePicker para evitar dependencias adicionales
import { useProceso } from '../../../contexts/ProcesoContext';
import { useRiesgo } from '../../../shared/contexts/RiesgoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../shared/hooks/useNotification';
import { useGetRiesgosQuery } from '../api/riesgosApi';
// Tipos locales para Plan de Acción (en producción vendrían de la API)
interface PlanAccion {
  id: string;
  riesgoId: string;
  procesoId: string;
  nombre: string;
  descripcion?: string;
  objetivo: string;
  fechaCreacion: string;
  fechaInicio: string;
  fechaLimite: string;
  estado: 'borrador' | 'en_ejecucion' | 'completado' | 'cancelado' | 'atrasado';
  responsableId?: string;
  responsableNombre?: string;
  creadorId: string;
  creadorNombre: string;
  tareas: TareaPlanAccion[];
  porcentajeAvance: number;
  presupuesto?: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

interface TareaPlanAccion {
  id: string;
  planAccionId: string;
  descripcion: string;
  responsableId?: string;
  responsableNombre?: string;
  fechaInicio: string;
  fechaLimite: string;
  fechaCumplimiento?: string;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'atrasada' | 'cancelada';
  prioridad: 'alta' | 'media' | 'baja';
  porcentajeAvance: number;
  observaciones?: string;
  evidencias?: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreatePlanAccionDto {
  riesgoId: string;
  procesoId: string;
  nombre: string;
  descripcion?: string;
  objetivo: string;
  fechaInicio: string;
  fechaLimite: string;
  responsableId?: string;
  presupuesto?: number;
  observaciones?: string;
}

interface CreateTareaPlanAccionDto {
  planAccionId: string;
  descripcion: string;
  responsableId?: string;
  fechaInicio: string;
  fechaLimite: string;
  prioridad: 'alta' | 'media' | 'baja';
  observaciones?: string;
}

// Mock de planes de acción - En producción vendría de la API
const mockPlanesAccion: PlanAccion[] = [
  {
    id: 'plan-1',
    riesgoId: '1',
    procesoId: '1',
    nombre: 'Plan de Mejora - Selección de Personal',
    descripcion: 'Plan para mejorar el proceso de selección de personal y reducir tiempos de contratación',
    objetivo: 'Reducir el tiempo de contratación en un 30% y mejorar la calidad de los candidatos seleccionados',
    fechaCreacion: '2024-01-15T10:00:00Z',
    fechaInicio: '2024-01-20T00:00:00Z',
    fechaLimite: '2024-03-31T23:59:59Z',
    estado: 'en_ejecucion',
    responsableId: '2',
    responsableNombre: 'María Gerente',
    creadorId: '1',
    creadorNombre: 'Dueño de Procesos',
    tareas: [
      {
        id: 'tarea-1',
        planAccionId: 'plan-1',
        descripcion: 'Revisar y actualizar perfiles de cargo',
        responsableId: '2',
        responsableNombre: 'María Gerente',
        fechaInicio: '2024-01-20T00:00:00Z',
        fechaLimite: '2024-02-15T23:59:59Z',
        estado: 'en_progreso',
        prioridad: 'alta',
        porcentajeAvance: 60,
        observaciones: 'Se han actualizado 8 de 12 perfiles',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z',
      },
      {
        id: 'tarea-2',
        planAccionId: 'plan-1',
        descripcion: 'Implementar pruebas psicométricas mejoradas',
        responsableId: '2',
        responsableNombre: 'María Gerente',
        fechaInicio: '2024-02-01T00:00:00Z',
        fechaLimite: '2024-02-28T23:59:59Z',
        estado: 'pendiente',
        prioridad: 'alta',
        porcentajeAvance: 0,
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z',
      },
    ],
    porcentajeAvance: 30,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-25T14:30:00Z',
  },
];

export default function PlanAccionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { riesgoSeleccionado: riesgoSeleccionadoContext, iniciarVer } = useRiesgo();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  // Estado local para el riesgo seleccionado en esta página
  const [riesgoSeleccionadoLocal, setRiesgoSeleccionadoLocal] = useState<any>(riesgoSeleccionadoContext);
  
  // Obtener todos los riesgos del proceso seleccionado
  const { data: riesgosData } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id, pageSize: 1000 } : { pageSize: 1000 }
  );
  const riesgos = riesgosData?.data || [];
  
  // Usar el riesgo del contexto si existe, sino el local
  const riesgoSeleccionado = riesgoSeleccionadoContext || riesgoSeleccionadoLocal;

  const [planesAccion, setPlanesAccion] = useState<PlanAccion[]>(mockPlanesAccion);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [tareaDialogOpen, setTareaDialogOpen] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanAccion | null>(null);
  const [modoEdicion, setModoEdicion] = useState<'crear' | 'editar'>('crear');
  const [modoEdicionTarea, setModoEdicionTarea] = useState<'crear' | 'editar'>('crear');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<TareaPlanAccion | null>(null);

  const [formPlan, setFormPlan] = useState<CreatePlanAccionDto>({
    riesgoId: riesgoSeleccionado?.id || '',
    procesoId: procesoSeleccionado?.id || '',
    nombre: '',
    descripcion: '',
    objetivo: '',
    fechaInicio: new Date().toISOString(),
    fechaLimite: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 días
    responsableId: '',
    presupuesto: undefined,
    observaciones: '',
  });

  const [formTarea, setFormTarea] = useState<CreateTareaPlanAccionDto>({
    planAccionId: '',
    descripcion: '',
    responsableId: '',
    fechaInicio: new Date().toISOString(),
    fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    prioridad: 'media',
    observaciones: '',
  });

  const isReadOnly = modoProceso === 'visualizar';

  // Filtrar planes de acción por riesgo seleccionado (obligatorio)
  const planesFiltrados = useMemo(() => {
    if (!riesgoSeleccionado) {
      return [];
    }
    return planesAccion.filter((plan) => plan.riesgoId === riesgoSeleccionado.id);
  }, [planesAccion, riesgoSeleccionado]);

  // Calcular porcentaje de avance de un plan
  const calcularAvancePlan = (plan: PlanAccion): number => {
    if (plan.tareas.length === 0) return 0;
    const totalAvance = plan.tareas.reduce((sum: number, tarea: TareaPlanAccion) => sum + tarea.porcentajeAvance, 0);
    return Math.round(totalAvance / plan.tareas.length);
  };

  // Obtener color del estado
  const getColorEstado = (estado: PlanAccion['estado'] | TareaPlanAccion['estado']) => {
    switch (estado) {
      case 'completado':
      case 'completada':
        return 'success';
      case 'en_ejecucion':
      case 'en_progreso':
        return 'info';
      case 'atrasado':
      case 'atrasada':
        return 'error';
      case 'cancelado':
      case 'cancelada':
        return 'default';
      default:
        return 'warning';
    }
  };

  // Obtener icono del estado
  const getIconoEstado = (estado: PlanAccion['estado'] | TareaPlanAccion['estado']) => {
    switch (estado) {
      case 'completado':
      case 'completada':
        return <CheckCircleIcon fontSize="small" />;
      case 'en_ejecucion':
      case 'en_progreso':
        return <PlayArrowIcon fontSize="small" />;
      case 'atrasado':
      case 'atrasada':
        return <WarningIcon fontSize="small" />;
      case 'cancelado':
      case 'cancelada':
        return <CancelIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  // Verificar si una tarea está atrasada
  const estaAtrasada = (fechaLimite: string): boolean => {
    return new Date(fechaLimite) < new Date() && new Date(fechaLimite).getTime() !== 0;
  };

  const handleCrearPlan = () => {
    if (!riesgoSeleccionado) {
      showError('Debe seleccionar un riesgo desde "Riesgos de los Procesos" para crear un plan de acción');
      return;
    }
    if (!procesoSeleccionado) {
      showError('Debe seleccionar un proceso desde el Dashboard');
      return;
    }
    setFormPlan({
      riesgoId: riesgoSeleccionado.id,
      procesoId: procesoSeleccionado.id,
      nombre: '',
      descripcion: '',
      objetivo: '',
      fechaInicio: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      responsableId: '',
      presupuesto: undefined,
      observaciones: '',
    });
    setModoEdicion('crear');
    setPlanSeleccionado(null);
    setPlanDialogOpen(true);
  };

  const handleEditarPlan = (plan: PlanAccion) => {
    setFormPlan({
      riesgoId: plan.riesgoId,
      procesoId: plan.procesoId,
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      objetivo: plan.objetivo,
      fechaInicio: plan.fechaInicio,
      fechaLimite: plan.fechaLimite,
      responsableId: plan.responsableId || '',
      presupuesto: plan.presupuesto,
      observaciones: plan.observaciones || '',
    });
    setModoEdicion('editar');
    setPlanSeleccionado(plan);
    setPlanDialogOpen(true);
  };

  const handleGuardarPlan = () => {
    if (!formPlan.nombre.trim() || !formPlan.objetivo.trim()) {
      showError('El nombre y objetivo son requeridos');
      return;
    }

    if (modoEdicion === 'crear') {
      const nuevoPlan: PlanAccion = {
        id: `plan-${Date.now()}`,
        ...formPlan,
        fechaCreacion: new Date().toISOString(),
        estado: 'borrador',
        creadorId: user?.id || '',
        creadorNombre: user?.fullName || 'Usuario',
        responsableNombre: formPlan.responsableId ? 'Responsable' : (user?.fullName || 'Usuario'), // En producción vendría de la API
        tareas: [],
        porcentajeAvance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlanesAccion([...planesAccion, nuevoPlan]);
      showSuccess('Plan de acción creado exitosamente');
    } else {
      const planActualizado = planesAccion.map((plan) =>
        plan.id === planSeleccionado?.id
          ? {
              ...plan,
              nombre: formPlan.nombre,
              descripcion: formPlan.descripcion,
              objetivo: formPlan.objetivo,
              fechaInicio: formPlan.fechaInicio,
              fechaLimite: formPlan.fechaLimite,
              responsableId: formPlan.responsableId,
              presupuesto: formPlan.presupuesto,
              observaciones: formPlan.observaciones,
              porcentajeAvance: calcularAvancePlan(plan),
              updatedAt: new Date().toISOString(),
            }
          : plan
      );
      setPlanesAccion(planActualizado);
      showSuccess('Plan de acción actualizado exitosamente');
    }
    setPlanDialogOpen(false);
  };

  const handleEliminarPlan = (planId: string) => {
    if (window.confirm('¿Está seguro de eliminar este plan de acción?')) {
      setPlanesAccion(planesAccion.filter((plan) => plan.id !== planId));
      showSuccess('Plan de acción eliminado exitosamente');
    }
  };

  const handleCrearTarea = (plan: PlanAccion) => {
    setFormTarea({
      planAccionId: plan.id,
      descripcion: '',
      responsableId: '',
      fechaInicio: new Date().toISOString(),
      fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      prioridad: 'media',
      observaciones: '',
    });
    setModoEdicionTarea('crear');
    setTareaSeleccionada(null);
    setPlanSeleccionado(plan);
    setTareaDialogOpen(true);
  };

  const handleEditarTarea = (tarea: TareaPlanAccion, plan: PlanAccion) => {
    setFormTarea({
      planAccionId: plan.id,
      descripcion: tarea.descripcion,
      responsableId: tarea.responsableId || '',
      fechaInicio: tarea.fechaInicio,
      fechaLimite: tarea.fechaLimite,
      prioridad: tarea.prioridad,
      observaciones: tarea.observaciones || '',
    });
    setModoEdicionTarea('editar');
    setTareaSeleccionada(tarea);
    setPlanSeleccionado(plan);
    setTareaDialogOpen(true);
  };

  const handleGuardarTarea = () => {
    if (!formTarea.descripcion.trim()) {
      showError('La descripción de la tarea es requerida');
      return;
    }

    if (modoEdicionTarea === 'crear') {
      const nuevaTarea: TareaPlanAccion = {
        id: `tarea-${Date.now()}`,
        ...formTarea,
        estado: 'pendiente',
        porcentajeAvance: 0,
        responsableNombre: 'Responsable', // En producción vendría de la API
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const planesActualizados = planesAccion.map((plan) =>
        plan.id === formTarea.planAccionId
          ? {
              ...plan,
              tareas: [...plan.tareas, nuevaTarea],
              porcentajeAvance: calcularAvancePlan({ ...plan, tareas: [...plan.tareas, nuevaTarea] }),
              updatedAt: new Date().toISOString(),
            }
          : plan
      );
      setPlanesAccion(planesActualizados);
      showSuccess('Tarea creada exitosamente');
    } else {
      const planesActualizados = planesAccion.map((plan) =>
        plan.id === formTarea.planAccionId
          ? {
              ...plan,
              tareas: plan.tareas.map((tarea) =>
                tarea.id === tareaSeleccionada?.id
                  ? {
                      ...tarea,
                      descripcion: formTarea.descripcion,
                      responsableId: formTarea.responsableId,
                      fechaInicio: formTarea.fechaInicio,
                      fechaLimite: formTarea.fechaLimite,
                      prioridad: formTarea.prioridad,
                      observaciones: formTarea.observaciones,
                      updatedAt: new Date().toISOString(),
                    }
                  : tarea
              ),
              porcentajeAvance: calcularAvancePlan(plan),
              updatedAt: new Date().toISOString(),
            }
          : plan
      );
      setPlanesAccion(planesActualizados);
      showSuccess('Tarea actualizada exitosamente');
    }
    setTareaDialogOpen(false);
  };

  const handleActualizarAvanceTarea = (planId: string, tareaId: string, nuevoAvance: number) => {
    const planesActualizados = planesAccion.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            tareas: plan.tareas.map((tarea) =>
              tarea.id === tareaId
                ? {
                    ...tarea,
                    porcentajeAvance: nuevoAvance,
                    estado: (nuevoAvance === 100 ? 'completada' : nuevoAvance > 0 ? 'en_progreso' : 'pendiente') as TareaPlanAccion['estado'],
                    fechaCumplimiento: nuevoAvance === 100 ? new Date().toISOString() : undefined,
                    updatedAt: new Date().toISOString(),
                  }
                : tarea
            ),
            porcentajeAvance: calcularAvancePlan(plan),
            updatedAt: new Date().toISOString(),
          }
        : plan
    );
    setPlanesAccion(planesActualizados);
    showSuccess('Avance de tarea actualizado');
  };

  const handleEliminarTarea = (planId: string, tareaId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta tarea?')) {
      const planesActualizados = planesAccion.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              tareas: plan.tareas.filter((tarea) => tarea.id !== tareaId),
              porcentajeAvance: calcularAvancePlan(plan),
              updatedAt: new Date().toISOString(),
            }
          : plan
      );
      setPlanesAccion(planesActualizados);
      showSuccess('Tarea eliminada exitosamente');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  // Función para seleccionar un riesgo
  const handleSeleccionarRiesgo = (riesgo: any) => {
    setRiesgoSeleccionadoLocal(riesgo);
    iniciarVer(riesgo);
    showSuccess(`Riesgo seleccionado: ${riesgo.descripcion.substring(0, 50)}...`);
  };

  // Función helper para formatear fecha para input type="date"
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" gutterBottom fontWeight={700}>
              Plan de Acción
            </Typography>
            {!isReadOnly && riesgoSeleccionado && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCrearPlan}
                sx={{ background: '#1976d2' }}
              >
                Nuevo Plan de Acción
              </Button>
            )}
          </Box>

          {/* Tabla Consolidada de Planes de Acción con Fechas */}
          {riesgoSeleccionado && planesFiltrados.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Tabla de Planes de Acción
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Objetivo</strong></TableCell>
                        <TableCell><strong>Responsable</strong></TableCell>
                        <TableCell><strong>Fecha Inicio</strong></TableCell>
                        <TableCell><strong>Fecha Límite</strong></TableCell>
                        <TableCell><strong>Estado</strong></TableCell>
                        <TableCell><strong>Progreso</strong></TableCell>
                        <TableCell><strong>Tareas</strong></TableCell>
                        {!isReadOnly && <TableCell><strong>Acciones</strong></TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {planesFiltrados.map((plan) => {
                        const avance = calcularAvancePlan(plan);
                        return (
                          <TableRow key={plan.id} hover>
                            <TableCell>{plan.nombre}</TableCell>
                            <TableCell>{plan.objetivo}</TableCell>
                            <TableCell>{plan.responsableNombre || 'Sin asignar'}</TableCell>
                            <TableCell>
                              {new Date(plan.fechaInicio).toLocaleDateString('es-ES')}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={estaAtrasada(plan.fechaLimite) ? 'error' : 'inherit'}
                                fontWeight={estaAtrasada(plan.fechaLimite) ? 600 : 400}
                              >
                                {new Date(plan.fechaLimite).toLocaleDateString('es-ES')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getIconoEstado(plan.estado)}
                                label={plan.estado.replace('_', ' ').toUpperCase()}
                                color={getColorEstado(plan.estado)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={avance}
                                  sx={{ width: 80, height: 6, borderRadius: 1 }}
                                />
                                <Typography variant="body2" fontWeight={600}>
                                  {avance}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${plan.tareas.length} tarea${plan.tareas.length !== 1 ? 's' : ''}`}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            {!isReadOnly && (
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditarPlan(plan)}
                                    title="Editar"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleEliminarPlan(plan.id)}
                                    title="Eliminar"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Selector de Riesgo */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Seleccionar Riesgo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Busque y seleccione un riesgo del proceso <strong>{procesoSeleccionado?.nombre}</strong> para ver o crear sus planes de acción
              </Typography>
              <Autocomplete
                options={riesgos}
                getOptionLabel={(option) => {
                  const idRiesgo = `${option.numero}${option.siglaGerencia || ''}`;
                  return `${idRiesgo} - ${option.descripcion.substring(0, 60)}...`;
                }}
                value={riesgoSeleccionado || null}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleSeleccionarRiesgo(newValue);
                  } else {
                    setRiesgoSeleccionadoLocal(null);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar riesgo"
                    placeholder="Escriba para buscar un riesgo..."
                    variant="outlined"
                  />
                )}
                renderOption={(props, option) => {
                  const idRiesgo = `${option.numero}${option.siglaGerencia || ''}`;
                  return (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={idRiesgo}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2" fontWeight={600}>
                            {option.descripcion.substring(0, 80)}
                            {option.descripcion.length > 80 ? '...' : ''}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {option.clasificacion} • {option.zona}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                noOptionsText="No se encontraron riesgos"
                sx={{ width: '100%' }}
              />
            </CardContent>
          </Card>

          {/* Información del Riesgo Seleccionado */}
          {riesgoSeleccionado && (
            <Card sx={{ mb: 3, bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Riesgo Seleccionado
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={`ID: ${riesgoSeleccionado.numero}${riesgoSeleccionado.siglaGerencia || ''}`}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={riesgoSeleccionado.clasificacion}
                        size="small"
                        color={riesgoSeleccionado.clasificacion.includes('positiva') ? 'success' : 'error'}
                      />
                      <Chip
                        label={`Zona: ${riesgoSeleccionado.zona}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {riesgoSeleccionado.descripcion}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {isReadOnly && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Está en modo visualización. Solo puede ver la información.
            </Alert>
          )}

          {!riesgoSeleccionado && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Seleccione un riesgo del buscador arriba para ver o crear planes de acción.
            </Alert>
          )}
        </Box>

        {/* Lista de Planes de Acción */}
        {!riesgoSeleccionado ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Seleccione un riesgo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use el buscador de arriba para seleccionar un riesgo y ver o crear sus planes de acción.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : planesFiltrados.length === 0 ? (
          <Card>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No hay planes de acción
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {!isReadOnly
                    ? 'Cree un plan de acción para gestionar las acciones correctivas y preventivas del riesgo seleccionado.'
                    : 'No hay planes de acción para visualizar.'}
                </Typography>
                {!isReadOnly && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={handleCrearPlan}>
                    Crear Plan de Acción
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {planesFiltrados.map((plan) => {
              const avance = calcularAvancePlan(plan);
              const tareasAtrasadas = plan.tareas.filter((tarea: TareaPlanAccion) => estaAtrasada(tarea.fechaLimite) && tarea.estado !== 'completada');
              const tareasPendientes = plan.tareas.filter((tarea: TareaPlanAccion) => tarea.estado === 'pendiente').length;
              const tareasEnProgreso = plan.tareas.filter((tarea: TareaPlanAccion) => tarea.estado === 'en_progreso').length;
              const tareasCompletadas = plan.tareas.filter((tarea: TareaPlanAccion) => tarea.estado === 'completada').length;

              return (
                <Card key={plan.id} sx={{ border: '1px solid #e0e0e0' }}>
                  <CardContent>
                    {/* Header del Plan */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {plan.nombre}
                          </Typography>
                          <Chip
                            icon={getIconoEstado(plan.estado)}
                            label={plan.estado.replace('_', ' ').toUpperCase()}
                            color={getColorEstado(plan.estado)}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {plan.descripcion}
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                          Objetivo: <span style={{ fontWeight: 400 }}>{plan.objetivo}</span>
                        </Typography>
                      </Box>
                      {!isReadOnly && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => handleEditarPlan(plan)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleEliminarPlan(plan.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>

                    {/* Información del Plan */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Responsable
                        </Typography>
                        <Typography variant="body2">{plan.responsableNombre || 'Sin asignar'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Fecha Inicio
                        </Typography>
                        <Typography variant="body2">
                          {new Date(plan.fechaInicio).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Fecha Límite
                        </Typography>
                        <Typography variant="body2" color={estaAtrasada(plan.fechaLimite) ? 'error' : 'inherit'}>
                          {new Date(plan.fechaLimite).toLocaleDateString('es-ES')}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Presupuesto
                        </Typography>
                        <Typography variant="body2">
                          {plan.presupuesto ? `$${plan.presupuesto.toLocaleString()}` : 'No definido'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Barra de Progreso */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Progreso General
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight={600}>
                          {avance}%
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={avance} sx={{ height: 8, borderRadius: 1 }} />
                    </Box>

                    {/* Estadísticas de Tareas */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`${plan.tareas.length} tarea(s)`} size="small" variant="outlined" />
                      <Chip
                        label={`${tareasPendientes} pendiente(s)`}
                        size="small"
                        color="warning"
                        icon={<PendingIcon />}
                      />
                      <Chip
                        label={`${tareasEnProgreso} en progreso`}
                        size="small"
                        color="info"
                        icon={<PlayArrowIcon />}
                      />
                      <Chip
                        label={`${tareasCompletadas} completada(s)`}
                        size="small"
                        color="success"
                        icon={<CheckCircleIcon />}
                      />
                      {tareasAtrasadas.length > 0 && (
                        <Chip
                          label={`${tareasAtrasadas.length} atrasada(s)`}
                          size="small"
                          color="error"
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Tareas del Plan */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          Tareas
                        </Typography>
                        {!isReadOnly && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => handleCrearTarea(plan)}
                          >
                            Agregar Tarea
                          </Button>
                        )}
                      </Box>

                      {plan.tareas.length === 0 ? (
                        <Alert severity="info">No hay tareas asignadas a este plan de acción.</Alert>
                      ) : (
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Responsable</TableCell>
                                <TableCell>Prioridad</TableCell>
                                <TableCell>Fechas</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Avance</TableCell>
                                {!isReadOnly && <TableCell align="right">Acciones</TableCell>}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {plan.tareas.map((tarea: TareaPlanAccion) => {
                                const atrasada = estaAtrasada(tarea.fechaLimite) && tarea.estado !== 'completada';
                                return (
                                  <TableRow key={tarea.id} sx={{ bgcolor: atrasada ? 'rgba(211, 47, 47, 0.05)' : 'inherit' }}>
                                    <TableCell>
                                      <Typography variant="body2">{tarea.descripcion}</Typography>
                                      {tarea.observaciones && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          {tarea.observaciones}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2">{tarea.responsableNombre || 'Sin asignar'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={tarea.prioridad}
                                        size="small"
                                        color={tarea.prioridad === 'alta' ? 'error' : tarea.prioridad === 'media' ? 'warning' : 'default'}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="caption" display="block">
                                        Inicio: {new Date(tarea.fechaInicio).toLocaleDateString('es-ES')}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        display="block"
                                        color={atrasada ? 'error' : 'text.secondary'}
                                      >
                                        Límite: {new Date(tarea.fechaLimite).toLocaleDateString('es-ES')}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        icon={getIconoEstado(tarea.estado)}
                                        label={tarea.estado.replace('_', ' ')}
                                        color={getColorEstado(tarea.estado)}
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                                        <LinearProgress
                                          variant="determinate"
                                          value={tarea.porcentajeAvance}
                                          sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                                        />
                                        <Typography variant="caption" fontWeight={600}>
                                          {tarea.porcentajeAvance}%
                                        </Typography>
                                      </Box>
                                      {!isReadOnly && (
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                          {[0, 25, 50, 75, 100].map((valor) => (
                                            <Button
                                              key={valor}
                                              size="small"
                                              variant={tarea.porcentajeAvance === valor ? 'contained' : 'outlined'}
                                              onClick={() => handleActualizarAvanceTarea(plan.id, tarea.id, valor)}
                                              sx={{ minWidth: 40, p: 0.5 }}
                                            >
                                              {valor}%
                                            </Button>
                                          ))}
                                        </Box>
                                      )}
                                    </TableCell>
                                    {!isReadOnly && (
                                      <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEditarTarea(tarea, plan)}>
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => handleEliminarTarea(plan.id, tarea.id)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </TableCell>
                                    )}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>

                    {/* Observaciones del Plan */}
                    {plan.observaciones && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Observaciones
                        </Typography>
                        <Typography variant="body2">{plan.observaciones}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Diálogo para Crear/Editar Plan */}
        <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{modoEdicion === 'crear' ? 'Nuevo Plan de Acción' : 'Editar Plan de Acción'}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre del Plan"
                value={formPlan.nombre}
                onChange={(e) => setFormPlan({ ...formPlan, nombre: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Descripción"
                value={formPlan.descripcion}
                onChange={(e) => setFormPlan({ ...formPlan, descripcion: e.target.value })}
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Objetivo"
                value={formPlan.objetivo}
                onChange={(e) => setFormPlan({ ...formPlan, objetivo: e.target.value })}
                required
                multiline
                rows={2}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Fecha de Inicio"
                  type="date"
                  value={formatDateForInput(formPlan.fechaInicio)}
                  onChange={(e) =>
                    setFormPlan({
                      ...formPlan,
                      fechaInicio: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 200px', minWidth: 200 }}
                />
                <TextField
                  label="Fecha Límite"
                  type="date"
                  value={formatDateForInput(formPlan.fechaLimite)}
                  onChange={(e) =>
                    setFormPlan({
                      ...formPlan,
                      fechaLimite: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 200px', minWidth: 200 }}
                />
              </Box>
              <TextField
                fullWidth
                label="Responsable (ID)"
                value={formPlan.responsableId}
                onChange={(e) => setFormPlan({ ...formPlan, responsableId: e.target.value })}
                helperText="En producción, esto sería un selector de usuarios"
              />
              <TextField
                fullWidth
                label="Presupuesto"
                type="number"
                value={formPlan.presupuesto || ''}
                onChange={(e) =>
                  setFormPlan({ ...formPlan, presupuesto: e.target.value ? parseFloat(e.target.value) : undefined })
                }
              />
              <TextField
                fullWidth
                label="Observaciones"
                value={formPlan.observaciones}
                onChange={(e) => setFormPlan({ ...formPlan, observaciones: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardarPlan} variant="contained" startIcon={<SaveIcon />}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para Crear/Editar Tarea */}
        <Dialog open={tareaDialogOpen} onClose={() => setTareaDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modoEdicionTarea === 'crear' ? 'Nueva Tarea' : 'Editar Tarea'} - {planSeleccionado?.nombre}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Descripción de la Tarea"
                value={formTarea.descripcion}
                onChange={(e) => setFormTarea({ ...formTarea, descripcion: e.target.value })}
                required
                multiline
                rows={3}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Fecha de Inicio"
                  type="date"
                  value={formatDateForInput(formTarea.fechaInicio)}
                  onChange={(e) =>
                    setFormTarea({
                      ...formTarea,
                      fechaInicio: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 200px', minWidth: 200 }}
                />
                <TextField
                  label="Fecha Límite"
                  type="date"
                  value={formatDateForInput(formTarea.fechaLimite)}
                  onChange={(e) =>
                    setFormTarea({
                      ...formTarea,
                      fechaLimite: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString(),
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: '1 1 200px', minWidth: 200 }}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formTarea.prioridad}
                  label="Prioridad"
                  onChange={(e) => setFormTarea({ ...formTarea, prioridad: e.target.value as 'alta' | 'media' | 'baja' })}
                >
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Responsable (ID)"
                value={formTarea.responsableId}
                onChange={(e) => setFormTarea({ ...formTarea, responsableId: e.target.value })}
                helperText="En producción, esto sería un selector de usuarios"
              />
              <TextField
                fullWidth
                label="Observaciones"
                value={formTarea.observaciones}
                onChange={(e) => setFormTarea({ ...formTarea, observaciones: e.target.value })}
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTareaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleGuardarTarea} variant="contained" startIcon={<SaveIcon />}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
}

