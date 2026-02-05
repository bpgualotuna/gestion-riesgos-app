/**
 * Incidencias Page
 * Gestión de incidencias relacionadas con riesgos
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../shared/hooks/useNotification';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';

// Tipo de incidencia
interface Incidencia {
  id: string;
  codigo: string;
  riesgoId?: string;
  procesoId?: string;
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
  accionesCorrectivas?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IncidenciasPage() {
  const { esAdmin, esAuditoria } = useAuth();
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
    });
  };

  const handleGuardar = () => {
    if (!formData.titulo || !formData.descripcion) {
      showError('Por favor complete todos los campos requeridos');
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
      const nuevaIncidencia: Incidencia = {
        id: `incidencia-${Date.now()}`,
        codigo: `INC-${Date.now()}`,
        ...formData,
        fechaReporte: formData.fechaReporte || new Date().toISOString().split('T')[0],
        reportadoPor: 'Usuario Actual', // En producción vendría del contexto de autenticación
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Incidencia;

      setIncidencias((prev) => [...prev, nuevaIncidencia]);
      showSuccess('Incidencia creada exitosamente');
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
            Incidencias
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestión de incidencias relacionadas con riesgos
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleAbrirDialog()}
          sx={{ background: '#1976d2' }}
        >
          Nueva Incidencia
        </Button>
      </Box>

      {/* Tabla de Incidencias */}
      <Card>
        <CardContent>
          <AppDataGrid
            rows={incidencias}
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

