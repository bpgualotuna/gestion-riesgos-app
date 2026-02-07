/**
 * Administración Page
 * Gestión de áreas, asignación de responsables y permisos
 * Solo visible para Administradores
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Autocomplete,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../hooks/useNotification';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import type { Area, Proceso, CreateAreaDto, UpdateAreaDto } from '../types';

// Mock data - En producción esto vendría de la API
const mockAreas: Area[] = [
  {
    id: '1',
    nombre: 'Gestión Financiera y Administrativa',
    descripcion: 'Área responsable de procesos financieros y administrativos',
    directorId: '5',
    directorNombre: 'Carlos Director',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Talento Humano',
    descripcion: 'Área responsable de procesos de recursos humanos',
    directorId: undefined,
    directorNombre: undefined,
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockUsuarios = [
  { id: '1', nombre: 'Dueño del Proceso', role: 'dueño_procesos' },
  { id: '2', nombre: 'María Gerente', role: 'manager' },
  { id: '3', nombre: 'Juan Analista', role: 'analyst' },
  { id: '4', nombre: 'Administrador Sistema', role: 'admin' },
  { id: '5', nombre: 'Carlos Director', role: 'director_procesos' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdministracionPage() {
  const { user, esAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [procesoDialogOpen, setProcesoDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editingProceso, setEditingProceso] = useState<Proceso | null>(null);

  const [areaFormData, setAreaFormData] = useState<CreateAreaDto>({
    nombre: '',
    descripcion: '',
    directorId: undefined,
  });

  const [procesoFormData, setProcesoFormData] = useState<{
    procesoId: string;
    responsableId: string;
    areaId: string;
    directorId: string;
    puedeCrear: string[];
  }>({
    procesoId: '',
    responsableId: '',
    areaId: '',
    directorId: '',
    puedeCrear: [],
  });

  if (!esAdmin) {
    return (
      <Box>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo los administradores pueden gestionar asignaciones.
        </Alert>
      </Box>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAreaDialog = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setAreaFormData({
        nombre: area.nombre,
        descripcion: area.descripcion || '',
        directorId: area.directorId,
      });
    } else {
      setEditingArea(null);
      setAreaFormData({
        nombre: '',
        descripcion: '',
        directorId: undefined,
      });
    }
    setAreaDialogOpen(true);
  };

  const handleCloseAreaDialog = () => {
    setAreaDialogOpen(false);
    setEditingArea(null);
    setAreaFormData({
      nombre: '',
      descripcion: '',
      directorId: undefined,
    });
  };

  const handleSaveArea = () => {
    if (!areaFormData.nombre.trim()) {
      showError('El nombre del área es requerido');
      return;
    }

    if (editingArea) {
      // Actualizar área
      setAreas(
        areas.map((a) =>
          a.id === editingArea.id
            ? {
                ...a,
                ...areaFormData,
                directorNombre: mockUsuarios.find((u) => u.id === areaFormData.directorId)?.nombre,
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      showSuccess('Área actualizada correctamente');
    } else {
      // Crear área
      const newArea: Area = {
        id: `area-${Date.now()}`,
        ...areaFormData,
        directorNombre: mockUsuarios.find((u) => u.id === areaFormData.directorId)?.nombre,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAreas([...areas, newArea]);
      showSuccess('Área creada correctamente');
    }
    handleCloseAreaDialog();
  };

  const handleDeleteArea = (areaId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta área?')) {
      setAreas(areas.filter((a) => a.id !== areaId));
      showSuccess('Área eliminada correctamente');
    }
  };

  const handleOpenProcesoDialog = (proceso?: Proceso) => {
    if (proceso) {
      setEditingProceso(proceso);
      setProcesoFormData({
        procesoId: proceso.id,
        responsableId: proceso.responsableId || '',
        areaId: proceso.areaId || '',
        directorId: proceso.directorId || '',
        puedeCrear: proceso.puedeCrear || [],
      });
    } else {
      setEditingProceso(null);
      setProcesoFormData({
        procesoId: '',
        responsableId: '',
        areaId: '',
        directorId: '',
        puedeCrear: [],
      });
    }
    setProcesoDialogOpen(true);
  };

  const handleCloseProcesoDialog = () => {
    setProcesoDialogOpen(false);
    setEditingProceso(null);
  };

  const handleSaveProceso = () => {
    if (!procesoFormData.procesoId) {
      showError('Debe seleccionar un proceso');
      return;
    }

    // Aquí se actualizaría el proceso en la API
    showSuccess('Asignaciones del proceso actualizadas correctamente');
    handleCloseProcesoDialog();
  };

  const areaColumns: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1 },
    {
      field: 'directorNombre',
      headerName: 'Director Asignado',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Sin asignar'}
          color={params.value ? 'primary' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'activo',
      headerName: 'Estado',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Activo' : 'Inactivo'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'acciones',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenAreaDialog(params.row)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteArea(params.row.id)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Administración del Sistema
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestione áreas, asigne responsables a procesos y configure permisos de creación
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Áreas" />
            <Tab label="Asignación de Procesos" />
            <Tab label="Permisos de Creación" />
          </Tabs>
        </Box>

        {/* Tab: Áreas */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Gestión de Áreas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAreaDialog()}
            >
              Nueva Área
            </Button>
          </Box>
          <AppDataGrid
            rows={areas}
            columns={areaColumns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            getRowId={(row) => row.id}
          />
        </TabPanel>

        {/* Tab: Asignación de Procesos */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Asignar Responsables a Procesos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Seleccione un proceso y asigne un responsable y un área
            </Typography>
          </Box>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Proceso</InputLabel>
                <Select
                  value={procesoFormData.procesoId}
                  onChange={(e) =>
                    setProcesoFormData({ ...procesoFormData, procesoId: e.target.value })
                  }
                  label="Proceso"
                >
                  <MenuItem value="">Seleccione un proceso</MenuItem>
                  {procesos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Área</InputLabel>
                <Select
                  value={procesoFormData.areaId}
                  onChange={(e) =>
                    setProcesoFormData({ ...procesoFormData, areaId: e.target.value })
                  }
                  label="Área"
                >
                  <MenuItem value="">Seleccione un área</MenuItem>
                  {areas.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Responsable</InputLabel>
                <Select
                  value={procesoFormData.responsableId}
                  onChange={(e) =>
                    setProcesoFormData({ ...procesoFormData, responsableId: e.target.value })
                  }
                  label="Responsable"
                >
                  <MenuItem value="">Seleccione un responsable</MenuItem>
                  {mockUsuarios.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre} ({u.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Director de Procesos</InputLabel>
                <Select
                  value={procesoFormData.directorId}
                  onChange={(e) =>
                    setProcesoFormData({ ...procesoFormData, directorId: e.target.value })
                  }
                  label="Director de Procesos"
                >
                  <MenuItem value="">Seleccione un director</MenuItem>
                  {mockUsuarios
                    .filter((u) => u.role === 'director_procesos')
                    .map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.nombre}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProceso}
                disabled={!procesoFormData.procesoId}
              >
                Guardar Asignaciones
              </Button>
            </Grid2>
          </Grid2>
        </TabPanel>

        {/* Tab: Permisos de Creación */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Permisos de Creación de Procesos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Asigne qué usuarios pueden crear procesos específicos
            </Typography>
          </Box>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Proceso</InputLabel>
                <Select
                  value={procesoFormData.procesoId}
                  onChange={(e) =>
                    setProcesoFormData({ ...procesoFormData, procesoId: e.target.value })
                  }
                  label="Proceso"
                >
                  <MenuItem value="">Seleccione un proceso</MenuItem>
                  {procesos.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <Autocomplete
                multiple
                options={mockUsuarios}
                getOptionLabel={(option) => `${option.nombre} (${option.role})`}
                value={mockUsuarios.filter((u) => procesoFormData.puedeCrear.includes(u.id))}
                onChange={(_event, newValue) => {
                  setProcesoFormData({
                    ...procesoFormData,
                    puedeCrear: newValue.map((u) => u.id),
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Usuarios que pueden crear" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={`${option.nombre} (${option.role})`}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
            </Grid2>
            <Grid2 xs={12}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProceso}
                disabled={!procesoFormData.procesoId}
              >
                Guardar Permisos
              </Button>
            </Grid2>
          </Grid2>
        </TabPanel>
      </Card>

      {/* Diálogo de Área */}
      <Dialog open={areaDialogOpen} onClose={handleCloseAreaDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingArea ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
        <DialogContent>
          <Grid2 container spacing={2} sx={{ mt: 1 }}>
            <Grid2 xs={12}>
              <TextField
                fullWidth
                label="Nombre del Área *"
                value={areaFormData.nombre}
                onChange={(e) =>
                  setAreaFormData({ ...areaFormData, nombre: e.target.value })
                }
                required
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={areaFormData.descripcion}
                onChange={(e) =>
                  setAreaFormData({ ...areaFormData, descripcion: e.target.value })
                }
                multiline
                rows={3}
              />
            </Grid2>
            <Grid2 xs={12}>
              <FormControl fullWidth>
                <InputLabel>Director de Procesos</InputLabel>
                <Select
                  value={areaFormData.directorId || ''}
                  onChange={(e) =>
                    setAreaFormData({ ...areaFormData, directorId: e.target.value || undefined })
                  }
                  label="Director de Procesos"
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {mockUsuarios
                    .filter((u) => u.role === 'director_procesos')
                    .map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.nombre}
                      </MenuItem>
                    ))}
                  </Select>
              </FormControl>
            </Grid2>
          </Grid2>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAreaDialog} startIcon={<CancelIcon />}>
            Cancelar
          </Button>
          <Button onClick={handleSaveArea} variant="contained" startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

