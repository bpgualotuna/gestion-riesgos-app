/**
 * Página de Administración de Asignaciones
 * Permite al admin asignar:
 * 1. Responsables a procesos
 * 2. Supervisores a áreas/procesos
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  BusinessCenter as BusinessCenterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useGetProcesosQuery } from '../../gestion-riesgos/api/riesgosApi';
import Grid2 from '../../../utils/Grid2';
import type { Proceso } from '../../gestion-riesgos/types';

// Mock de usuarios disponibles
const USUARIOS_DISPONIBLES = [
  { id: '1', nombre: 'Katherine Chávez', email: 'katherine.chavez@comware.com', rol: 'dueño_procesos' },
  { id: '2', nombre: 'María González', email: 'maria.gonzalez@comware.com', rol: 'manager' },
  { id: '3', nombre: 'Juan Pérez', email: 'juan.perez@comware.com', rol: 'analyst' },
  { id: '5', nombre: 'Carlos Rodríguez', email: 'carlos.rodriguez@comware.com', rol: 'supervisor_riesgos' },
];

// Mock de áreas disponibles
const AREAS_DISPONIBLES = [
  { id: 'area-1', nombre: 'Gestión Financiera y Administrativa' },
  { id: 'area-2', nombre: 'Gestión de Talento Humano' },
  { id: 'area-3', nombre: 'Gestión de TI' },
  { id: 'area-4', nombre: 'Gestión Comercial' },
];

// Mock de asignaciones (en producción vendría de la API)

export default function AsignacionesPage() {
  const { esAdmin } = useAuth();
  const { data: procesos = [] } = useGetProcesosQuery();
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'responsable' | 'supervisor'>('responsable');
  const [formData, setFormData] = useState<any>({});
  const [asignacionesResponsables, setAsignacionesResponsables] = useState<any[]>([]);
  const [asignacionesSupervisores, setAsignacionesSupervisores] = useState<any[]>([]);

  // Cargar asignaciones del localStorage
  const loadAsignaciones = () => {
    const storedResponsables = localStorage.getItem('asignaciones_responsables');
    const storedSupervisores = localStorage.getItem('asignaciones_supervisores');
    
    if (storedResponsables) {
      setAsignacionesResponsables(JSON.parse(storedResponsables));
    }
    if (storedSupervisores) {
      setAsignacionesSupervisores(JSON.parse(storedSupervisores));
    }
  };

  // Guardar asignaciones en localStorage
  const saveAsignaciones = (type: 'responsable' | 'supervisor', data: any[]) => {
    if (type === 'responsable') {
      localStorage.setItem('asignaciones_responsables', JSON.stringify(data));
      setAsignacionesResponsables(data);
    } else {
      localStorage.setItem('asignaciones_supervisores', JSON.stringify(data));
      setAsignacionesSupervisores(data);
    }
  };

  // Inicializar al cargar
  useEffect(() => {
    loadAsignaciones();
  }, []);

  const handleOpenDialog = (type: 'responsable' | 'supervisor', item?: any) => {
    setDialogType(type);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({});
  };

  const handleSave = () => {
    if (dialogType === 'responsable') {
      const nuevas = formData.id
        ? asignacionesResponsables.map((a) => (a.id === formData.id ? formData : a))
        : [...asignacionesResponsables, { ...formData, id: `asig-resp-${Date.now()}` }];
      saveAsignaciones('responsable', nuevas);
    } else {
      const nuevas = formData.id
        ? asignacionesSupervisores.map((a) => (a.id === formData.id ? formData : a))
        : [...asignacionesSupervisores, { ...formData, id: `asig-sup-${Date.now()}` }];
      saveAsignaciones('supervisor', nuevas);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string, type: 'responsable' | 'supervisor') => {
    if (type === 'responsable') {
      const nuevas = asignacionesResponsables.filter((a) => a.id !== id);
      saveAsignaciones('responsable', nuevas);
    } else {
      const nuevas = asignacionesSupervisores.filter((a) => a.id !== id);
      saveAsignaciones('supervisor', nuevas);
    }
  };

  if (!esAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Gestión de Asignaciones
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Asigne responsables a procesos y supervisores a áreas/procesos
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="Responsables a Procesos" icon={<PersonIcon />} iconPosition="start" />
            <Tab label="Supervisores a Áreas/Procesos" icon={<AssignmentIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 1: Asignación de Responsables */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Asignar Responsables a Procesos</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('responsable')}
                >
                  Nueva Asignación
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Proceso</TableCell>
                      <TableCell>Responsable</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asignacionesResponsables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No hay asignaciones. Cree una nueva asignación.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      asignacionesResponsables.map((asig) => {
                        const proceso = procesos.find((p: Proceso) => p.id === asig.procesoId);
                        const usuario = USUARIOS_DISPONIBLES.find((u) => u.id === asig.responsableId);
                        return (
                          <TableRow key={asig.id}>
                            <TableCell>{proceso?.nombre || 'Proceso no encontrado'}</TableCell>
                            <TableCell>{usuario?.nombre || 'Usuario no encontrado'}</TableCell>
                            <TableCell>{usuario?.email || '-'}</TableCell>
                            <TableCell>
                              <Chip label={usuario?.rol || '-'} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog('responsable', asig)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(asig.id, 'responsable')}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: Asignación de Supervisores */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">Asignar Supervisores a Áreas/Procesos</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('supervisor')}
                >
                  Nueva Asignación
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Área/Proceso</TableCell>
                      <TableCell>Supervisor</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {asignacionesSupervisores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No hay asignaciones. Cree una nueva asignación.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      asignacionesSupervisores.map((asig) => {
                        const supervisor = USUARIOS_DISPONIBLES.find((u) => u.id === asig.supervisorId);
                        const nombreAsignado =
                          asig.tipoAsignacion === 'area'
                            ? AREAS_DISPONIBLES.find((a) => a.id === asig.areaId)?.nombre
                            : procesos.find((p: Proceso) => p.id === asig.procesoId)?.nombre;
                        return (
                          <TableRow key={asig.id}>
                            <TableCell>
                              <Chip
                                label={asig.tipoAsignacion === 'area' ? 'Área' : 'Proceso'}
                                size="small"
                                color={asig.tipoAsignacion === 'area' ? 'primary' : 'secondary'}
                              />
                            </TableCell>
                            <TableCell>{nombreAsignado || 'No encontrado'}</TableCell>
                            <TableCell>{supervisor?.nombre || 'Usuario no encontrado'}</TableCell>
                            <TableCell>{supervisor?.email || '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog('supervisor', asig)}
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(asig.id, 'supervisor')}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar asignación */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'responsable' ? 'Asignar Responsable a Proceso' : 'Asignar Supervisor'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'responsable' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Proceso</InputLabel>
                <Select
                  value={formData.procesoId || ''}
                  onChange={(e) => setFormData({ ...formData, procesoId: e.target.value })}
                  label="Proceso"
                >
                  {procesos.map((p: Proceso) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Responsable</InputLabel>
                <Select
                  value={formData.responsableId || ''}
                  onChange={(e) => setFormData({ ...formData, responsableId: e.target.value })}
                  label="Responsable"
                >
                  {USUARIOS_DISPONIBLES.filter((u) => u.rol === 'dueño_procesos' || u.rol === 'manager').map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={formData.supervisorId || ''}
                  onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                  label="Supervisor"
                >
                  {USUARIOS_DISPONIBLES.filter((u) => u.rol === 'supervisor_riesgos').map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Tipo de Asignación</InputLabel>
                <Select
                  value={formData.tipoAsignacion || 'area'}
                  onChange={(e) => setFormData({ ...formData, tipoAsignacion: e.target.value, areaId: undefined, procesoId: undefined })}
                  label="Tipo de Asignación"
                >
                  <MenuItem value="area">Por Área</MenuItem>
                  <MenuItem value="proceso">Por Proceso</MenuItem>
                </Select>
              </FormControl>
              {formData.tipoAsignacion === 'area' ? (
                <FormControl fullWidth>
                  <InputLabel>Área</InputLabel>
                  <Select
                    value={formData.areaId || ''}
                    onChange={(e) => setFormData({ ...formData, areaId: e.target.value, procesoId: undefined })}
                    label="Área"
                  >
                    {AREAS_DISPONIBLES.map((a) => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Proceso</InputLabel>
                  <Select
                    value={formData.procesoId || ''}
                    onChange={(e) => setFormData({ ...formData, procesoId: e.target.value, areaId: undefined })}
                    label="Proceso"
                  >
                    {procesos.map((p: Proceso) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              dialogType === 'responsable'
                ? !formData.procesoId || !formData.responsableId
                : !formData.supervisorId || (!formData.areaId && !formData.procesoId)
            }
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

