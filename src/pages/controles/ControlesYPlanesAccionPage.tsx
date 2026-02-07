/**
 * Controles y Planes de Acción Page
 * Gestión de controles de riesgos residuales y planes de acción
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Shield as ControlIcon,
  Assignment as PlanIcon,
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import ProcesoFiltros from '../../components/procesos/ProcesoFiltros';
import { getMockRiesgos } from '../../api/services/mockData';

interface Control {
  id: string;
  procesoId: string;
  riesgoId: string;
  riesgoNombre?: string;
  causaId: string;
  causaNombre?: string;
  descripcion: string;
  tipo: 'prevención' | 'detección' | 'corrección';
  estado: 'activo' | 'inactivo';
  createdAt: string;
  updatedAt: string;
}

interface PlanAccion {
  id: string;
  procesoId: string;
  controlId?: string;
  incidenciaId?: string;
  riesgoId: string;
  riesgoNombre?: string;
  causaId?: string;
  causaNombre?: string;
  descripcion: string;
  responsable: string;
  decision: string;
  fechaEstimada: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ControlesYPlanesAccionPage() {
  const { procesoSeleccionado } = useProceso();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState(0);

  // Estados
  const [controles, setControles] = useState<Control[]>([]);
  const [planesAccion, setPlanesAccion] = useState<PlanAccion[]>([]);
  const [dialogControlOpen, setDialogControlOpen] = useState(false);
  const [dialogPlanOpen, setDialogPlanOpen] = useState(false);
  const [controlSeleccionado, setControlSeleccionado] = useState<Control | null>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanAccion | null>(null);

  // Cargar riesgos del proceso
  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    const riesgosIdentificacion = localStorage.getItem(`riesgos_identificacion_${procesoSeleccionado.id}`);
    if (riesgosIdentificacion) {
      try {
        return JSON.parse(riesgosIdentificacion);
      } catch (error) {
        console.error('Error al cargar riesgos de identificación:', error);
      }
    }

    const riesgosData = localStorage.getItem('riesgos');
    const mockRiesgosResponse = getMockRiesgos({ procesoId: procesoSeleccionado.id });
    const riesgos = riesgosData ? JSON.parse(riesgosData) : mockRiesgosResponse.data;
    return riesgos.filter((r: any) => r.procesoId === procesoSeleccionado.id) || [];
  }, [procesoSeleccionado?.id]);

  // Cargar controles y planes desde localStorage al montar
  useEffect(() => {
    if (procesoSeleccionado?.id) {
      const controlesData = localStorage.getItem(`controles_${procesoSeleccionado.id}`);
      if (controlesData) {
        setControles(JSON.parse(controlesData));
      }

      const planesData = localStorage.getItem(`planes_${procesoSeleccionado.id}`);
      if (planesData) {
        setPlanesAccion(JSON.parse(planesData));
      }
    }
  }, [procesoSeleccionado?.id]);

  // Guardar controles en localStorage
  useEffect(() => {
    if (procesoSeleccionado?.id && controles.length > 0) {
      localStorage.setItem(`controles_${procesoSeleccionado.id}`, JSON.stringify(controles));
    }
  }, [controles, procesoSeleccionado?.id]);

  // Guardar planes en localStorage
  useEffect(() => {
    if (procesoSeleccionado?.id && planesAccion.length > 0) {
      localStorage.setItem(`planes_${procesoSeleccionado.id}`, JSON.stringify(planesAccion));
    }
  }, [planesAccion, procesoSeleccionado?.id]);

  // Formularios
  const [formControl, setFormControl] = useState<{
    riesgoId: string;
    causaId: string;
    descripcion: string;
    tipo: 'prevención' | 'detección' | 'corrección';
  }>({
    riesgoId: '',
    causaId: '',
    descripcion: '',
    tipo: 'prevención',
  });

  const [tipoRegistro, setTipoRegistro] = useState<'control' | 'plan'>('control');

  const [formPlanExtra, setFormPlanExtra] = useState({
    responsable: (user as any)?.nombre || '',
    decision: '',
    fechaEstimada: '',
  });

  const [formPlan, setFormPlan] = useState({
    controlId: '',
    riesgoId: '',
    descripcion: '',
    responsable: '',
    decision: '',
    fechaEstimada: '',
  });

  // Obtener causas del riesgo seleccionado
  const causasDelRiesgo = useMemo(() => {
    const riesgo = riesgosDelProceso.find((r: any) => r.id === formControl.riesgoId);
    return riesgo?.causas || [];
  }, [formControl.riesgoId, riesgosDelProceso]);

  if (!procesoSeleccionado) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Por favor selecciona un proceso para gestionar controles y planes de acción.
        </Alert>
      </Box>
    );
  }

  // Manejadores CONTROLES
  const handleAbrirDialogControl = () => {
    setControlSeleccionado(null);
    setFormControl({
      riesgoId: '',
      causaId: '',
      descripcion: '',
      tipo: 'prevención',
    });
    setTipoRegistro('control');
    setFormPlanExtra({
      responsable: (user as any)?.nombre || '',
      decision: '',
      fechaEstimada: '',
    });
    setDialogControlOpen(true);
  };

  const handleGuardarControl = () => {
    if (!formControl.riesgoId || !formControl.causaId || !formControl.descripcion) {
      showError('Por favor completa todos los campos');
      return;
    }

    const riesgoSeleccionado = riesgosDelProceso.find((r: any) => r.id === formControl.riesgoId);
    const causaSeleccionada = causasDelRiesgo.find((c: any) => c.id === formControl.causaId);

    if (tipoRegistro === 'plan') {
      if (!formPlanExtra.responsable || !formPlanExtra.decision || !formPlanExtra.fechaEstimada) {
        showError('Por favor completa los datos del plan de acción');
        return;
      }

      const nuevoPlan: PlanAccion = {
        id: `plan-${Date.now()}`,
        procesoId: procesoSeleccionado!.id,
        riesgoId: formControl.riesgoId,
        riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
        causaId: formControl.causaId,
        causaNombre: causaSeleccionada?.descripcion,
        descripcion: formControl.descripcion,
        responsable: formPlanExtra.responsable,
        decision: formPlanExtra.decision,
        fechaEstimada: formPlanExtra.fechaEstimada,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPlanesAccion([...planesAccion, nuevoPlan]);
      showSuccess('Plan de acción creado');
      setDialogControlOpen(false);
      return;
    }

    if (controlSeleccionado) {
      setControles(controles.map(c =>
        c.id === controlSeleccionado.id
          ? {
              ...c,
              ...formControl,
              riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
              causaNombre: causaSeleccionada?.descripcion,
              updatedAt: new Date().toISOString(),
            }
          : c
      ));
      showSuccess('Control actualizado');
    } else {
      const nuevoControl: Control = {
        id: `control-${Date.now()}`,
        procesoId: procesoSeleccionado!.id,
        ...formControl,
        riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
        causaNombre: causaSeleccionada?.descripcion,
        estado: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setControles([...controles, nuevoControl]);
      showSuccess('Control creado');
    }
    setDialogControlOpen(false);
  };

  const handleEliminarControl = (id: string) => {
    if (window.confirm('¿Eliminar este control?')) {
      setControles(controles.filter(c => c.id !== id));
      showSuccess('Control eliminado');
    }
  };

  // Manejadores PLANES DE ACCIÓN
  const handleAbrirDialogPlan = () => {
    setPlanSeleccionado(null);
    setFormPlan({
      controlId: '',
      riesgoId: '',
      descripcion: '',
      responsable: (user as any)?.nombre || '',
      decision: '',
      fechaEstimada: '',
    });
    setDialogPlanOpen(true);
  };

  const handleGuardarPlan = () => {
    if (!formPlan.riesgoId || !formPlan.descripcion || !formPlan.responsable) {
      showError('Por favor completa todos los campos');
      return;
    }

    const riesgoSeleccionado = riesgosDelProceso.find((r: any) => r.id === formPlan.riesgoId);

    if (planSeleccionado) {
      setPlanesAccion(planesAccion.map(p =>
        p.id === planSeleccionado.id
          ? {
              ...p,
              ...formPlan,
              riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
              estado: 'en_progreso',
              updatedAt: new Date().toISOString(),
            }
          : p
      ));
      showSuccess('Plan de acción actualizado');
    } else {
      const nuevoPlan: PlanAccion = {
        id: `plan-${Date.now()}`,
        procesoId: procesoSeleccionado!.id,
        ...formPlan,
        riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
        estado: 'pendiente',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlanesAccion([...planesAccion, nuevoPlan]);
      showSuccess('Plan de acción creado');
    }
    setDialogPlanOpen(false);
  };

  const handleEliminarPlan = (id: string) => {
    if (window.confirm('¿Eliminar este plan de acción?')) {
      setPlanesAccion(planesAccion.filter(p => p.id !== id));
      showSuccess('Plan de acción eliminado');
    }
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'activo':
      case 'completado':
        return 'success';
      case 'inactivo':
      case 'cancelado':
        return 'default';
      case 'pendiente':
        return 'warning';
      case 'en_progreso':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
          Controles y Planes de Acción
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Proceso: <strong>{procesoSeleccionado.nombre}</strong>
        </Typography>
      </Box>

      {/* Filtros para Supervisor */}
      <ProcesoFiltros />

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Controles" icon={<ControlIcon />} iconPosition="start" />
            <Tab label="Planes de Acción" icon={<PlanIcon />} iconPosition="start" />
          </Tabs>

          {/* TAB 1: CONTROLES */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Controles de Riesgos Residuales
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAbrirDialogControl}
              >
                Nuevo Control
              </Button>
            </Box>

            {controles.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Riesgo</strong></TableCell>
                      <TableCell><strong>Causa</strong></TableCell>
                      <TableCell><strong>Descripción</strong></TableCell>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {controles.map((control) => (
                      <TableRow key={control.id}>
                        <TableCell>
                          <Chip label={control.riesgoNombre || control.riesgoId} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{control.causaNombre || control.causaId}</TableCell>
                        <TableCell>{control.descripcion}</TableCell>
                        <TableCell>
                          <Chip label={control.tipo} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={control.estado}
                            size="small"
                            color={getColorEstado(control.estado) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setControlSeleccionado(control);
                              setFormControl({
                                riesgoId: control.riesgoId,
                                causaId: control.causaId,
                                descripcion: control.descripcion,
                                tipo: control.tipo,
                              });
                              setDialogControlOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEliminarControl(control.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No hay controles registrados</Alert>
            )}
          </TabPanel>

          {/* TAB 2: PLANES DE ACCIÓN */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                Planes de Acción
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAbrirDialogPlan}
              >
                Nuevo Plan
              </Button>
            </Box>

            {planesAccion.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Riesgo</strong></TableCell>
                      <TableCell><strong>Causa</strong></TableCell>
                      <TableCell><strong>Descripción</strong></TableCell>
                      <TableCell><strong>Responsable</strong></TableCell>
                      <TableCell><strong>Fecha Estimada</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {planesAccion.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <Chip label={plan.riesgoNombre || plan.riesgoId} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{plan.causaNombre || plan.causaId || '-'}</TableCell>
                        <TableCell>{plan.descripcion}</TableCell>
                        <TableCell>{plan.responsable}</TableCell>
                        <TableCell>{plan.fechaEstimada}</TableCell>
                        <TableCell>
                          <Chip
                            label={plan.estado}
                            size="small"
                            color={getColorEstado(plan.estado) as any}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setPlanSeleccionado(plan);
                              setFormPlan({
                                controlId: plan.controlId || '',
                                riesgoId: plan.riesgoId,
                                descripcion: plan.descripcion,
                                responsable: plan.responsable,
                                decision: plan.decision,
                                fechaEstimada: plan.fechaEstimada,
                              });
                              setDialogPlanOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEliminarPlan(plan.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No hay planes de acción registrados</Alert>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* DIALOG: CREAR/EDITAR CONTROL */}
      <Dialog open={dialogControlOpen} onClose={() => setDialogControlOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {controlSeleccionado ? 'Editar Control' : 'Nuevo Control'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={riesgosDelProceso}
            getOptionLabel={(option: any) => option.nombre || option.descripcionRiesgo || ''}
            value={riesgosDelProceso.find((r: any) => r.id === formControl.riesgoId) || null}
            onChange={(e, value) =>
              setFormControl({
                ...formControl,
                riesgoId: value?.id || '',
                causaId: '',
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Riesgo Residual"
                size="small"
                required
              />
            )}
            noOptionsText="Sin riesgos disponibles"
          />

          <Autocomplete
            options={causasDelRiesgo}
            getOptionLabel={(option: any) => option.descripcion || ''}
            value={causasDelRiesgo.find((c: any) => c.id === formControl.causaId) || null}
            onChange={(e, value) =>
              setFormControl({
                ...formControl,
                causaId: value?.id || '',
              })
            }
            disabled={!formControl.riesgoId}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Causa del Riesgo"
                size="small"
                required
              />
            )}
            noOptionsText="Selecciona un riesgo primero"
          />

          <TextField
            fullWidth
            label="Descripción del Control"
            value={formControl.descripcion}
            onChange={(e) => setFormControl({ ...formControl, descripcion: e.target.value })}
            size="small"
            multiline
            rows={3}
            required
          />

          <FormControl fullWidth size="small">
            <InputLabel>Registrar como</InputLabel>
            <Select
              value={tipoRegistro}
              onChange={(e) => setTipoRegistro(e.target.value as 'control' | 'plan')}
              label="Registrar como"
            >
              <MenuItem value="control">Control</MenuItem>
              <MenuItem value="plan">Plan de Acción</MenuItem>
            </Select>
          </FormControl>

          {tipoRegistro === 'control' && (
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Control</InputLabel>
              <Select
                value={formControl.tipo}
                onChange={(e) => setFormControl({ ...formControl, tipo: e.target.value as any })}
                label="Tipo de Control"
              >
                <MenuItem value="prevención">Prevención</MenuItem>
                <MenuItem value="detección">Detección</MenuItem>
                <MenuItem value="corrección">Corrección</MenuItem>
              </Select>
            </FormControl>
          )}

          {tipoRegistro === 'plan' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Responsable"
                value={formPlanExtra.responsable}
                onChange={(e) => setFormPlanExtra({ ...formPlanExtra, responsable: e.target.value })}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Decisión"
                value={formPlanExtra.decision}
                onChange={(e) => setFormPlanExtra({ ...formPlanExtra, decision: e.target.value })}
                size="small"
                required
              />
              <TextField
                fullWidth
                label="Fecha estimada de finalización"
                type="date"
                value={formPlanExtra.fechaEstimada}
                onChange={(e) => setFormPlanExtra({ ...formPlanExtra, fechaEstimada: e.target.value })}
                size="small"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogControlOpen(false)}>Cancelar</Button>
          <Button onClick={handleGuardarControl} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: CREAR/EDITAR PLAN DE ACCIÓN */}
      <Dialog open={dialogPlanOpen} onClose={() => setDialogPlanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {planSeleccionado ? 'Editar Plan de Acción' : 'Nuevo Plan de Acción'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={riesgosDelProceso}
            getOptionLabel={(option: any) => option.nombre || option.descripcionRiesgo || ''}
            value={riesgosDelProceso.find((r: any) => r.id === formPlan.riesgoId) || null}
            onChange={(e, value) =>
              setFormPlan({
                ...formPlan,
                riesgoId: value?.id || '',
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Riesgo Residual"
                size="small"
                required
              />
            )}
            noOptionsText="Sin riesgos disponibles"
          />

          <TextField
            fullWidth
            label="Descripción del Plan"
            value={formPlan.descripcion}
            onChange={(e) => setFormPlan({ ...formPlan, descripcion: e.target.value })}
            size="small"
            multiline
            rows={3}
            required
          />
          <TextField
            fullWidth
            label="Responsable"
            value={formPlan.responsable}
            onChange={(e) => setFormPlan({ ...formPlan, responsable: e.target.value })}
            size="small"
            required
          />
          <TextField
            fullWidth
            label="Decisión/Estado"
            value={formPlan.decision}
            onChange={(e) => setFormPlan({ ...formPlan, decision: e.target.value })}
            margin="normal"
            size="small"
          />
          <TextField
            fullWidth
            label="Fecha Estimada de Finalización"
            type="date"
            value={formPlan.fechaEstimada}
            onChange={(e) => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })}
            margin="normal"
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogPlanOpen(false)}>Cancelar</Button>
          <Button onClick={handleGuardarPlan} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
