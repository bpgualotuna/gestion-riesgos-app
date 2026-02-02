/**
 * Procesos Page
 * Gestión de procesos - Solo visible para Dueño de Procesos
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BusinessCenter as BusinessCenterIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useGetProcesosQuery, useCreateProcesoMutation, useDeleteProcesoMutation } from '../api/riesgosApi';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../hooks/useNotification';
import { useRevisionProceso } from '../hooks/useRevisionProceso';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import type { CreateProcesoDto, ObservacionProceso, EstadoProceso, Proceso, HistorialCambioProceso } from '../types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

export default function ProcesosPage() {
  const { data: procesos = [], isLoading, refetch } = useGetProcesosQuery();
  const { procesoSeleccionado, setProcesoSeleccionado, puedeGestionarProcesos } = useProceso();
  const { user, esAdmin } = useAuth();
  const [createProceso, { isLoading: isCreating }] = useCreateProcesoMutation();
  const [deleteProceso] = useDeleteProcesoMutation();
  const { showSuccess, showError } = useNotification();
  const {
    enviarARevision,
    aprobarProceso,
    rechazarConObservaciones,
    resolverObservaciones,
    obtenerObservaciones,
    obtenerHistorial,
  } = useRevisionProceso();

  // Estados para diálogos
  const [observacionDialogOpen, setObservacionDialogOpen] = useState(false);
  const [historialDialogOpen, setHistorialDialogOpen] = useState(false);
  const [observacionTexto, setObservacionTexto] = useState('');
  const [procesoParaAccion, setProcesoParaAccion] = useState<Proceso | null>(null);

  // Obtener gerente (manager) - en producción vendría de la API
  const gerenteId = '2'; // ID del usuario manager
  const gerenteNombre = 'María González';

  const [formData, setFormData] = useState<CreateProcesoDto>({
    nombre: '',
    descripcion: '',
    vicepresidencia: '',
    gerencia: '',
    responsable: '',
    objetivoProceso: '',
    tipoProceso: 'Talento Humano',
  });

  const [showForm, setShowForm] = useState(false);
  
  // Obtener observaciones de un proceso usando el hook
  const getObservacionesProceso = (procesoId: string): ObservacionProceso[] => {
    return obtenerObservaciones(procesoId);
  };
  
  // Contar observaciones pendientes
  const contarObservacionesPendientes = (procesoId: string) => {
    return getObservacionesProceso(procesoId).filter((obs) => !obs.resuelta).length;
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

  // Handlers para acciones de revisión
  const handleEnviarRevision = async (proceso: Proceso) => {
    if (proceso.estado === 'aprobado') {
      showError('No se puede enviar a revisión un proceso ya aprobado');
      return;
    }
    const procesoActualizado = await enviarARevision(proceso, gerenteId, gerenteNombre);
    if (procesoActualizado && procesoSeleccionado?.id === proceso.id) {
      setProcesoSeleccionado(procesoActualizado);
    }
    refetch(); // Recargar procesos desde la API
  };

  const handleAprobar = async (proceso: Proceso) => {
    const procesoActualizado = await aprobarProceso(proceso);
    if (procesoActualizado && procesoSeleccionado?.id === proceso.id) {
      setProcesoSeleccionado(procesoActualizado);
    }
    refetch(); // Recargar procesos desde la API
  };

  const handleRechazar = (proceso: Proceso) => {
    setProcesoParaAccion(proceso);
    setObservacionDialogOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!procesoParaAccion || !observacionTexto.trim()) {
      showError('Por favor ingrese una observación');
      return;
    }
    const resultado = await rechazarConObservaciones(procesoParaAccion, observacionTexto);
    if (resultado?.proceso && procesoSeleccionado?.id === procesoParaAccion.id) {
      setProcesoSeleccionado(resultado.proceso);
    }
    setObservacionDialogOpen(false);
    setObservacionTexto('');
    setProcesoParaAccion(null);
    refetch(); // Recargar procesos desde la API
  };

  const handleResolverObservaciones = async (proceso: Proceso) => {
    const observacionesPendientes = getObservacionesProceso(proceso.id)
      .filter(obs => !obs.resuelta)
      .map(obs => obs.id);
    
    if (observacionesPendientes.length === 0) {
      showError('No hay observaciones pendientes para resolver');
      return;
    }
    
    const procesoActualizado = await resolverObservaciones(proceso, observacionesPendientes);
    if (procesoActualizado && procesoSeleccionado?.id === proceso.id) {
      setProcesoSeleccionado(procesoActualizado);
    }
    refetch(); // Recargar procesos desde la API
  };

  const handleVerHistorial = (proceso: Proceso) => {
    setProcesoParaAccion(proceso);
    setHistorialDialogOpen(true);
  };

  const handleChange = (field: keyof CreateProcesoDto) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProceso(formData).unwrap();
      showSuccess('Proceso creado exitosamente');
      setFormData({
        nombre: '',
        descripcion: '',
        vicepresidencia: '',
        gerencia: '',
        responsable: '',
        objetivoProceso: '',
        tipoProceso: 'Talento Humano',
      });
      setShowForm(false);
    } catch (error) {
      showError('Error al crear el proceso');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este proceso?')) {
      try {
        await deleteProceso(id).unwrap();
        showSuccess('Proceso eliminado exitosamente');
        // Si el proceso eliminado era el seleccionado, seleccionar otro
        if (procesoSeleccionado?.id === id) {
          const otrosProcesos = procesos.filter((p) => p.id !== id);
          if (otrosProcesos.length > 0) {
            setProcesoSeleccionado(otrosProcesos[0]);
          } else {
            setProcesoSeleccionado(null);
          }
        }
      } catch (error) {
        showError('Error al eliminar el proceso');
      }
    }
  };

  const handleSelect = (procesoId: string) => {
    const proceso = procesos.find((p) => p.id === procesoId);
    if (proceso) {
      setProcesoSeleccionado(proceso);
      showSuccess(`Proceso "${proceso.nombre}" seleccionado`);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'tipoProceso',
      headerName: 'Tipo',
      width: 180,
    },
    {
      field: 'vicepresidencia',
      headerName: 'Vicepresidencia',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'gerencia',
      headerName: 'Gerencia',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'responsable',
      headerName: 'Responsable',
      width: 200,
    },
    {
      field: 'estado',
      headerName: 'Estado Revisión',
      width: 150,
      renderCell: (params) => {
        const estado = params.row.estado || 'borrador';
        return (
          <Chip
            label={getEstadoLabel(estado)}
            color={getEstadoColor(estado)}
            size="small"
          />
        );
      },
    },
    {
      field: 'activo',
      headerName: 'Activo',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Sí' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 300,
      sortable: false,
      renderCell: (params) => {
        const proceso = params.row as Proceso;
        const estado = proceso.estado || 'borrador';
        const esDueño = puedeGestionarProcesos;
        const esGerente = user?.role === 'manager' || esAdmin;
        const observacionesPendientes = contarObservacionesPendientes(proceso.id);

        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {procesoSeleccionado?.id !== proceso.id && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleSelect(proceso.id)}
              >
                Seleccionar
              </Button>
            )}
            
            {/* Acciones para Dueño de Procesos */}
            {esDueño && estado === 'borrador' && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={() => handleEnviarRevision(proceso)}
              >
                Enviar a Revisión
              </Button>
            )}
            
            {esDueño && estado === 'con_observaciones' && observacionesPendientes > 0 && (
              <Button
                size="small"
                variant="contained"
                color="warning"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleResolverObservaciones(proceso)}
              >
                Resolver Observaciones
              </Button>
            )}

            {/* Acciones para Gerente */}
            {esGerente && estado === 'en_revision' && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAprobar(proceso)}
                >
                  Aprobar
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => handleRechazar(proceso)}
                >
                  Rechazar
                </Button>
              </>
            )}

            {/* Ver historial */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<HistoryIcon />}
              onClick={() => handleVerHistorial(proceso)}
            >
              Historial
            </Button>

            {/* Eliminar (solo dueño y en borrador) */}
            {esDueño && estado === 'borrador' && (
              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(proceso.id)}
              >
                <DeleteIcon fontSize="small" />
              </Button>
            )}
          </Box>
        );
      },
    },
  ];

  if (!puedeGestionarProcesos) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Solo el Dueño de Procesos puede gestionar procesos
          {user?.fullName && user?.esDueñoProcesos && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Usuario actual: <strong>{user.fullName}</strong>
            </Typography>
          )}
        </Alert>
        <Typography variant="h6" gutterBottom>
          Procesos Disponibles
        </Typography>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <AppDataGrid
            rows={procesos}
            columns={columns.filter((col) => col.field !== 'actions')}
            loading={isLoading}
            getRowId={(row) => row.id}
          />
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Gestión de Procesos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(!showForm)}
          sx={{ background: '#1976d2' }}
        >
          {showForm ? 'Cancelar' : 'Nuevo Proceso'}
        </Button>
      </Box>

      {showForm && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Crear Nuevo Proceso
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre del Proceso"
                    value={formData.nombre}
                    onChange={handleChange('nombre')}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tipo de Proceso"
                    select
                    SelectProps={{ native: true }}
                    value={formData.tipoProceso}
                    onChange={handleChange('tipoProceso')}
                    required
                  >
                    <option value="Talento Humano">Talento Humano</option>
                    <option value="Planificación Financiera">Planificación Financiera</option>
                    <option value="Otro">Otro</option>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={formData.descripcion}
                    onChange={handleChange('descripcion')}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vicepresidencia"
                    value={formData.vicepresidencia}
                    onChange={handleChange('vicepresidencia')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Gerencia"
                    value={formData.gerencia}
                    onChange={handleChange('gerencia')}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Responsable"
                    value={formData.responsable}
                    onChange={handleChange('responsable')}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Objetivo del Proceso"
                    value={formData.objetivoProceso}
                    onChange={handleChange('objetivoProceso')}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isCreating}
                    sx={{ background: '#1976d2' }}
                  >
                    {isCreating ? <CircularProgress size={24} /> : 'Crear Proceso'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" gutterBottom>
        Procesos Disponibles
      </Typography>
      {procesoSeleccionado && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Proceso activo: <strong>{procesoSeleccionado.nombre}</strong>
        </Alert>
      )}
      
      {/* Sección de Observaciones del Director */}
      {procesoSeleccionado && (
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Observaciones del Director
              </Typography>
              {contarObservacionesPendientes(procesoSeleccionado.id) > 0 && (
                <Badge badgeContent={contarObservacionesPendientes(procesoSeleccionado.id)} color="error">
                  <Chip
                    icon={<CommentIcon />}
                    label={`${contarObservacionesPendientes(procesoSeleccionado.id)} pendiente(s)`}
                    color="error"
                    size="small"
                  />
                </Badge>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            {getObservacionesProceso(procesoSeleccionado.id).length === 0 ? (
              <Alert severity="info">
                No hay observaciones del director para este proceso.
              </Alert>
            ) : (
              <List>
                {getObservacionesProceso(procesoSeleccionado.id).map((obs) => (
                  <ListItem
                    key={obs.id}
                    sx={{
                      borderLeft: `3px solid ${obs.resuelta ? '#2e7d32' : '#d32f2f'}`,
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
                            {obs.gerenteNombre}
                          </Typography>
                          <Chip
                            label={obs.resuelta ? 'Resuelta' : 'Pendiente'}
                            size="small"
                            color={obs.resuelta ? 'success' : 'error'}
                            icon={
                              obs.resuelta ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : (
                                <PendingIcon fontSize="small" />
                              )
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {obs.observacion}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {new Date(obs.fecha).toLocaleString('es-ES')}
                            {obs.fechaResuelta && ` • Resuelta: ${new Date(obs.fechaResuelta).toLocaleString('es-ES')}`}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}
      
      <AppDataGrid
        rows={procesos}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
      />

      {/* Diálogo para agregar observación al rechazar */}
      <Dialog open={observacionDialogOpen} onClose={() => setObservacionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Proceso con Observaciones</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Por favor indique las observaciones o razones por las que se rechaza este proceso:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Observaciones"
            value={observacionTexto}
            onChange={(e) => setObservacionTexto(e.target.value)}
            placeholder="Ingrese las observaciones..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setObservacionDialogOpen(false);
            setObservacionTexto('');
            setProcesoParaAccion(null);
          }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmarRechazo}>
            Rechazar con Observaciones
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de historial */}
      <Dialog open={historialDialogOpen} onClose={() => setHistorialDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Historial de Cambios
          {procesoParaAccion && ` - ${procesoParaAccion.nombre}`}
        </DialogTitle>
        <DialogContent>
          {procesoParaAccion ? (
            <List>
              {obtenerHistorial(procesoParaAccion.id).map((historial) => (
                <ListItem key={historial.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {historial.usuarioNombre}
                    </Typography>
                    <Chip
                      label={historial.accion.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        historial.accion === 'aprobado' ? 'success' :
                        historial.accion === 'rechazado' ? 'error' :
                        historial.accion === 'enviado_revision' ? 'warning' :
                        'default'
                      }
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {historial.descripcion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {new Date(historial.fecha).toLocaleString('es-ES')}
                  </Typography>
                </ListItem>
              ))}
              {obtenerHistorial(procesoParaAccion.id).length === 0 && (
                <Alert severity="info">No hay historial de cambios para este proceso.</Alert>
              )}
            </List>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setHistorialDialogOpen(false);
            setProcesoParaAccion(null);
          }}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

