/**
 * Incidencias Page
 * Gestión de incidencias relacionadas con riesgos
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
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import ProcesoFiltros from '../../components/procesos/ProcesoFiltros';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetRiesgosQuery } from '../../api/services/riesgosApi';

// Tipo de incidencia
interface Incidencia {
  id: string;
  codigo: string;
  riesgoId?: string;
  riesgoNombre?: string;
  causaId?: string;
  causaNombre?: string;
  procesoId?: string;
  procesoNombre?: string;
  titulo: string;
  descripcion: string;
  tipo: 'incidente' | 'casi_incidente' | 'observacion' | 'no_conformidad';
  severidad: 'critica' | 'alta' | 'media' | 'baja';
  estado: 'abierta' | 'en_investigacion' | 'resuelta' | 'cerrada';
  fechaOcurrencia: string;
  fechaReporte: string;
  fechaResolucion?: string;
  reportadoPor: string;
  responsableId?: string;
  responsableNombre?: string;
  planAccionId?: string;
  accionesCorrectivas?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncidenciasPage() {
  const { esAdmin, esAuditoria, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos } = useAuth();
  const { procesoSeleccionado } = useProceso();
  const { showSuccess, showError } = useNotification();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Formulario
  const [formData, setFormData] = useState<Partial<Incidencia>>({
    titulo: '',
    descripcion: '',
    tipo: 'incidente',
    severidad: 'media',
    estado: 'abierta',
    fechaOcurrencia: new Date().toISOString().split('T')[0],
    fechaReporte: new Date().toISOString().split('T')[0],
  });

  const [planData, setPlanData] = useState({
    responsable: '',
    decision: '',
    fechaEstimada: '',
  });

  const puedeElegirSinProceso = esSupervisorRiesgos || esGerenteGeneralDirector;

  const { data: riesgosResponse } = useGetRiesgosQuery(
    { procesoId: procesoSeleccionado?.id, pageSize: 500 },
    { skip: false }
  );
  const riesgosDisponibles = useMemo(() => {
    const data = riesgosResponse?.data || [];
    return Array.isArray(data) ? data : [];
  }, [riesgosResponse]);

  const causasDelRiesgo = useMemo(() => {
    if (!formData.riesgoId) return [];
    const riesgo = riesgosDisponibles.find((r: any) => r.id === formData.riesgoId);
    return riesgo?.causas || [];
  }, [formData.riesgoId, riesgosDisponibles]);

  // Filtrar incidencias por proceso seleccionado
  const incidenciasFiltradas = useMemo(() => {
    if (puedeElegirSinProceso) {
      return incidencias;
    }
    if (procesoSeleccionado?.id) {
      return incidencias.filter(inc => inc.procesoId === procesoSeleccionado.id);
    }
    return [];
  }, [incidencias, procesoSeleccionado, puedeElegirSinProceso]);

  const handleAbrirDialog = (incidencia?: Incidencia) => {
    if (incidencia) {
      setIncidenciaSeleccionada(incidencia);
      setFormData(incidencia);
      setModoEdicion(true);
      setPlanData({
        responsable: '',
        decision: '',
        fechaEstimada: '',
      });
    } else {
      setIncidenciaSeleccionada(null);
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'incidente',
        severidad: 'media',
        estado: 'abierta',
        fechaOcurrencia: new Date().toISOString().split('T')[0],
        fechaReporte: new Date().toISOString().split('T')[0],
        procesoId: procesoSeleccionado?.id,
      });
      setPlanData({
        responsable: '',
        decision: '',
        fechaEstimada: '',
      });
      setModoEdicion(false);
    }
    setDialogOpen(true);
  };

  const handleCerrarDialog = () => {
    setDialogOpen(false);
    setIncidenciaSeleccionada(null);
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'incidente',
      severidad: 'media',
      estado: 'abierta',
      fechaOcurrencia: new Date().toISOString().split('T')[0],
      fechaReporte: new Date().toISOString().split('T')[0],
      procesoId: procesoSeleccionado?.id,
    });
    setPlanData({
      responsable: '',
      decision: '',
      fechaEstimada: '',
    });
  };

  const handleGuardar = () => {
    if (!formData.titulo || !formData.descripcion) {
      showError('Por favor complete todos los campos requeridos');
      return;
    }

    if (!procesoSeleccionado?.id) {
      showError('Debe seleccionar un proceso');
      return;
    }

    if (!formData.riesgoId || !formData.causaId) {
      showError('Debe seleccionar el riesgo y la causa materializada');
      return;
    }

    if (!planData.responsable || !planData.decision || !planData.fechaEstimada) {
      showError('Debe completar los datos del plan de acción');
      return;
    }

    if (modoEdicion && incidenciaSeleccionada) {
      // Actualizar incidencia
      setIncidencias((prev) =>
        prev.map((inc) =>
          inc.id === incidenciaSeleccionada.id
            ? { ...inc, ...formData, updatedAt: new Date().toISOString() }
            : inc
        )
      );
      showSuccess('Incidencia actualizada exitosamente');
    } else {
      const riesgoSeleccionado = riesgosDelProceso.find((r: any) => r.id === formData.riesgoId);
      const causaSeleccionada = causasDelRiesgo.find((c: any) => c.id === formData.causaId);

      // Crear nueva incidencia
      const incidenciaId = `incidencia-${Date.now()}`;
      const planId = `plan-${Date.now()}`;

      const nuevaIncidencia: Incidencia = {
        id: incidenciaId,
        codigo: `INC-${Date.now()}`,
        ...formData,
        procesoId: procesoSeleccionado.id,
        procesoNombre: procesoSeleccionado.nombre,
        riesgoNombre: riesgoSeleccionado?.nombre || riesgoSeleccionado?.descripcionRiesgo,
        causaNombre: causaSeleccionada?.descripcion,
        planAccionId: planId,
        fechaReporte: formData.fechaReporte || new Date().toISOString().split('T')[0],
        reportadoPor: 'Usuario Actual', // En producción vendría del contexto de autenticación
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Incidencia;

      setIncidencias((prev) => [...prev, nuevaIncidencia]);

      // Plan de acción: la API no tiene endpoint para crear planes por incidencia
      showSuccess('Incidencia registrada (los planes de acción requieren soporte en el backend)');
    }

    handleCerrarDialog();
  };

  const handleEliminar = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta incidencia?')) {
      setIncidencias((prev) => prev.filter((inc) => inc.id !== id));
      showSuccess('Incidencia eliminada exitosamente');
    }
  };

  const obtenerColorSeveridad = (severidad: string) => {
    switch (severidad) {
      case 'critica':
        return 'error';
      case 'alta':
        return 'warning';
      case 'media':
        return 'info';
      case 'baja':
        return 'success';
      default:
        return 'default';
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'abierta':
        return 'error';
      case 'en_investigacion':
        return 'warning';
      case 'resuelta':
        return 'success';
      case 'cerrada':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
    },
    {
      field: 'titulo',
      headerName: 'Título',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'riesgoNombre',
      headerName: 'Riesgo Residual',
      width: 180,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          <Typography variant="caption" color="textSecondary">-</Typography>
        ),
    },
    {
      field: 'causaNombre',
      headerName: 'Causa',
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          <Typography variant="caption" color="textSecondary">-</Typography>
        ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 150,
      renderCell: (params) => {
        const tipos: Record<string, string> = {
          incidente: 'Incidente',
          casi_incidente: 'Casi Incidente',
          observacion: 'Observación',
          no_conformidad: 'No Conformidad',
        };
        return <Chip label={tipos[params.value] || params.value} size="small" />;
      },
    },
    {
      field: 'severidad',
      headerName: 'Severidad',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          size="small"
          color={obtenerColorSeveridad(params.value) as any}
        />
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          size="small"
          color={obtenerColorEstado(params.value) as any}
        />
      ),
    },
    {
      field: 'fechaOcurrencia',
      headerName: 'Fecha Ocurrencia',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'fechaReporte',
      headerName: 'Fecha Reporte',
      width: 150,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleAbrirDialog(params.row)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleEliminar(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
            Eventos - Materialización de Riesgos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registro de materialización de riesgos residuales por causa
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAbrirDialog()}
          disabled={!puedeElegirSinProceso && !procesoSeleccionado?.id}
          sx={{ background: '#1976d2' }}
        >
          Nueva Incidencia
        </Button>
      </Box>

      {/* Filtros para Supervisor */}
      <ProcesoFiltros />

      {!puedeElegirSinProceso && !procesoSeleccionado?.id && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Selecciona un proceso para registrar eventos
        </Alert>
      )}

      {/* Tabla de Incidencias */}
      <Card>
        <CardContent>
          <AppDataGrid
            rows={incidenciasFiltradas}
            columns={columns}
            loading={false}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Dialog para crear/editar incidencia */}
      <Dialog open={dialogOpen} onClose={handleCerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Incidencia' : 'Nueva Incidencia'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Autocomplete
              options={riesgosDisponibles}
              getOptionLabel={(option: any) => option.nombre || option.descripcionRiesgo || ''}
              value={riesgosDisponibles.find((r: any) => r.id === formData.riesgoId) || null}
              onChange={(e, value) =>
                setFormData({
                  ...formData,
                  riesgoId: value?.id,
                  riesgoNombre: value?.nombre || value?.descripcionRiesgo,
                  causaId: undefined,
                  causaNombre: undefined,
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Riesgo Residual Materializado"
                  placeholder="Selecciona el riesgo"
                  required
                />
              )}
              noOptionsText={puedeElegirSinProceso ? 'No hay riesgos disponibles' : 'No hay riesgos para este proceso'}
            />

            <Autocomplete
              options={causasDelRiesgo}
              getOptionLabel={(option: any) => option.descripcion || ''}
              value={causasDelRiesgo.find((c: any) => c.id === formData.causaId) || null}
              onChange={(e, value) =>
                setFormData({
                  ...formData,
                  causaId: value?.id,
                  causaNombre: value?.descripcion,
                })
              }
              disabled={!formData.riesgoId}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Causa materializada"
                  placeholder="Selecciona la causa"
                />
              )}
              noOptionsText="Selecciona un riesgo primero"
            />

            <TextField
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={4}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  label="Tipo"
                >
                  <MenuItem value="incidente">Incidente</MenuItem>
                  <MenuItem value="casi_incidente">Casi Incidente</MenuItem>
                  <MenuItem value="observacion">Observación</MenuItem>
                  <MenuItem value="no_conformidad">No Conformidad</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Severidad</InputLabel>
                <Select
                  value={formData.severidad}
                  onChange={(e) => setFormData({ ...formData, severidad: e.target.value as any })}
                  label="Severidad"
                >
                  <MenuItem value="critica">Crítica</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="media">Media</MenuItem>
                  <MenuItem value="baja">Baja</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Fecha de Ocurrencia"
                type="date"
                value={formData.fechaOcurrencia}
                onChange={(e) => setFormData({ ...formData, fechaOcurrencia: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Fecha de Reporte"
                type="date"
                value={formData.fechaReporte}
                onChange={(e) => setFormData({ ...formData, fechaReporte: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Plan de Acción Asociado
            </Typography>
            <TextField
              label="Responsable"
              value={planData.responsable}
              onChange={(e) => setPlanData({ ...planData, responsable: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Decisión"
              value={planData.decision}
              onChange={(e) => setPlanData({ ...planData, decision: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Fecha estimada de finalización"
              type="date"
              value={planData.fechaEstimada}
              onChange={(e) => setPlanData({ ...planData, fechaEstimada: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            {modoEdicion && (
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  label="Estado"
                >
                  <MenuItem value="abierta">Abierta</MenuItem>
                  <MenuItem value="en_investigacion">En Investigación</MenuItem>
                  <MenuItem value="resuelta">Resuelta</MenuItem>
                  <MenuItem value="cerrada">Cerrada</MenuItem>
                </Select>
              </FormControl>
            )}
            <TextField
              label="Acciones Correctivas"
              value={formData.accionesCorrectivas || ''}
              onChange={(e) => setFormData({ ...formData, accionesCorrectivas: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCerrarDialog}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained" color="primary">
            {modoEdicion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



