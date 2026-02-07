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
  LinkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import ProcesoFiltros from '../../components/procesos/ProcesoFiltros';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { getMockRiesgos } from '../../api/services/mockData';

// Tipo de incidencia - Materialización de riesgos residuales
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
  planAccionId?: string; // Auto-generado al registrar incidencia
  accionesCorrectivas?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncidenciasPage() {
  const { esAdmin, esAuditoria } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado } = useProceso();
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Obtener riesgos del proceso seleccionado
  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    const riesgosData = localStorage.getItem('riesgos');
    const mockRiesgos = getMockRiesgos();
    const riesgos = riesgosData ? JSON.parse(riesgosData) : mockRiesgos.data;
    return riesgos.filter((r: any) => r.procesoId === procesoSeleccionado.id) || [];
  }, [procesoSeleccionado?.id]);

  // Filtrar incidencias por proceso
  const incidenciasFiltradas = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    return incidencias.filter((inc) => inc.procesoId === procesoSeleccionado.id);
  }, [incidencias, procesoSeleccionado?.id]);

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

  // Obtener causas del riesgo seleccionado en el formulario
  const causasDelRiesgo = useMemo(() => {
    if (!formData.riesgoId) return [];
    const riesgo = riesgosDelProceso.find((r: any) => r.id === formData.riesgoId);
    return riesgo?.causas || [];
  }, [formData.riesgoId, riesgosDelProceso]);

  const handleAbrirDialog = (incidencia?: Incidencia) => {
    if (incidencia) {
      setIncidenciaSeleccionada(incidencia);
      setFormData(incidencia);
      setModoEdicion(true);
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
      // Crear nueva incidencia
      const riesgoSeleccionado = riesgosDelProceso.find((r: any) => r.id === formData.riesgoId);
      const causaSeleccionada = causasDelRiesgo.find((c: any) => c.id === formData.causaId);

      const nuevaIncidencia: Incidencia = {
        id: `incidencia-${Date.now()}`,
        codigo: `INC-${Date.now()}`,
        ...formData,
        procesoId: procesoSeleccionado.id,
        procesoNombre: procesoSeleccionado.nombre,
        riesgoNombre: riesgoSeleccionado?.nombre,
        causaNombre: causaSeleccionada?.descripcion,
        fechaReporte: formData.fechaReporte || new Date().toISOString().split('T')[0],
        reportadoPor: 'Usuario Actual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Incidencia;

      setIncidencias((prev) => [...prev, nuevaIncidencia]);
      showSuccess('Incidencia creada exitosamente - Se creará plan de acción automáticamente');
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
      width: 110,
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
          <Typography variant="caption" color="textSecondary">
            -
          </Typography>
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
          <Typography variant="caption" color="textSecondary">
            -
          </Typography>
        ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 120,
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
      width: 110,
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
      width: 130,
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
      width: 140,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleAbrirDialog(params.row)}
            title="Editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleEliminar(params.row.id)}
            title="Eliminar"
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
            Incidencias - Materialización de Riesgos Residuales
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Registro de incidentes que materializan riesgos residuales del proceso{' '}
            <strong>{procesoSeleccionado?.nombre || 'No seleccionado'}</strong>
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAbrirDialog()}
          disabled={!procesoSeleccionado?.id}
          title={!procesoSeleccionado?.id ? 'Selecciona un proceso primero' : ''}
          sx={{ background: '#1976d2' }}
        >
          Nueva Incidencia
        </Button>
      </Box>

      {/* Filtros de Proceso */}
      <ProcesoFiltros />

      {/* Alerta si no hay proceso seleccionado */}
      {!procesoSeleccionado?.id && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Selecciona un proceso en la barra de navegación para gestionar incidencias
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
          {modoEdicion ? 'Editar Incidencia' : 'Nueva Incidencia - Materialización de Riesgo Residual'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Riesgo Residual Materializado */}
            <Autocomplete
              options={riesgosDelProceso}
              getOptionLabel={(option: any) => option.nombre || ''}
              value={riesgosDelProceso.find((r: any) => r.id === formData.riesgoId) || null}
              onChange={(e, value) =>
                setFormData({
                  ...formData,
                  riesgoId: value?.id,
                  riesgoNombre: value?.nombre,
                  causaId: undefined,
                  causaNombre: undefined,
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Riesgo Residual Materializado"
                  placeholder="Selecciona el riesgo que se materializó"
                  required
                />
              )}
              noOptionsText="No hay riesgos disponibles para este proceso"
            />

            {/* Causa del Riesgo */}
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
                  label="Causa del Riesgo"
                  placeholder="Selecciona la causa raíz"
                />
              )}
              noOptionsText="Selecciona un riesgo primero"
            />

            <TextField
              label="Título de la Incidencia"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              fullWidth
              required
              placeholder="Ej: Fuga de datos confidenciales"
            />
            <TextField
              label="Descripción Detallada"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={4}
              required
              placeholder="Describe cómo ocurrió la materialización del riesgo..."
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
              placeholder="Acciones tomadas o a tomar para resolver..."
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


