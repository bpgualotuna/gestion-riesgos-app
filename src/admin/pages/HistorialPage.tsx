import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../../utils/constants';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Mapeo de tablas de BD a nombres de páginas/módulos
const TABLA_A_PAGINA: Record<string, string> = {
  'Riesgo': 'Riesgos',
  'Proceso': 'Procesos',
  'Usuario': 'Usuarios',
  'Incidencia': 'Incidencias',
  'PlanAccion': 'Planes de Acción',
  'EvaluacionRiesgo': 'Evaluación de Riesgos',
  'PriorizacionRiesgo': 'Priorización',
  'CausaRiesgo': 'Causas de Riesgo',
  'ControlRiesgo': 'Controles',
  'Area': 'Áreas y Asignaciones',
  'Role': 'Roles y Permisos',
  'Cargo': 'Cargos',
  'ProcesoResponsable': 'Responsables de Proceso',
  'DofaItem': 'Análisis DOFA',
  'Normatividad': 'Normatividad',
  'Contexto': 'Contexto',
  'Benchmarking': 'Benchmarking',
  'Gerencia': 'Gerencias',
  'Observacion': 'Observaciones',
};

// Helper para formatear fechas sin dependencias externas
const formatearFecha = (fecha: string | Date, incluirHora: boolean = true): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  
  if (!incluirHora) {
    return `${dia}/${mes}/${anio}`;
  }
  
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  
  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
};

const formatearFechaDetallada = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  
  return `${dia}/${mes}/${anio} a las ${horas}:${minutos}:${segundos}`;
};

interface AuditLog {
  id: number;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRole: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  tabla: string;
  registroId?: number;
  registroDesc?: string;
  cambios?: Record<string, { anterior: any; nuevo: any }>;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface HistorialPageProps {
  user?: any;
}

export default function HistorialPage({ user }: HistorialPageProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(true); // Expandido por defecto
  const [filtros, setFiltros] = useState({
    usuarioId: '',
    tabla: '',
    accion: '',
    fechaDesde: '',
    fechaHasta: '',
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });

  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

  useEffect(() => {
    cargarHistorial();
  }, [paginacion.page, paginacion.pageSize]);

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId);
      if (filtros.tabla) params.append('tabla', filtros.tabla);
      if (filtros.accion) params.append('accion', filtros.accion);
      if (filtros.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
      if (filtros.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
      params.append('page', String(paginacion.page));
      params.append('pageSize', String(paginacion.pageSize));

      const response = await axios.get(`${API_URL}/audit/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(response.data.data || []);
      setPaginacion((prev) => ({
        ...prev,
        total: response.data.total || 0,
      }));
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      
      // Si es error 401 o 403, mostrar mensaje de autorización
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('No autorizado para ver el historial de auditoría.');
        setLogs([]);
      } 
      // Si es error de red o el endpoint no existe
      else if (!err.response || err.response?.status === 404) {
        setError('El sistema de auditoría no está disponible. Contacta al administrador.');
        setLogs([]);
      }
      // Otros errores
      else {
        setError(err.response?.data?.error || 'Error al cargar el historial.');
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (log: AuditLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLog(null);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      usuarioId: '',
      tabla: '',
      accion: '',
      fechaDesde: '',
      fechaHasta: '',
    });
  };

  const columns: GridColDef[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha/Hora',
      width: 180,
      renderCell: (params) => formatearFecha(params.value),
    },
    {
      field: 'usuarioNombre',
      headerName: 'Usuario',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {params.row.usuarioEmail}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'usuarioRole',
      headerName: 'Rol',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'accion',
      headerName: 'Acción',
      width: 120,
      renderCell: (params) => {
        const color =
          params.value === 'CREATE'
            ? 'success'
            : params.value === 'DELETE'
            ? 'error'
            : 'warning';
        const label =
          params.value === 'CREATE'
            ? 'CREAR'
            : params.value === 'DELETE'
            ? 'ELIMINAR'
            : 'ACTUALIZAR';
        return <Chip label={label} size="small" color={color} />;
      },
    },
    {
      field: 'tabla',
      headerName: 'Página/Módulo',
      width: 180,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={500}>
          {TABLA_A_PAGINA[params.value] || params.value}
        </Typography>
      ),
    },
    {
      field: 'registroDesc',
      headerName: 'Registro',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'cambios',
      headerName: 'Cambios',
      width: 120,
      align: 'center',
      renderCell: (params) => {
        if (!params.value) return <Typography variant="body2">-</Typography>;
        const numCambios = Object.keys(params.value).length;
        return (
          <Chip
            label={`${numCambios} campo${numCambios > 1 ? 's' : ''}`}
            size="small"
            variant="outlined"
            color="info"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Detalles',
      width: 100,
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<InfoIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleVerDetalles(params.row);
          }}
        >
          Ver
        </Button>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Historial de Cambios
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Registro de auditoría de todas las operaciones realizadas en el sistema
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarHistorial}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Alert de error o info */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Mostrando datos de ejemplo para visualización. Implementa el backend para ver datos reales.
          </Typography>
        </Alert>
      )}

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Total de Registros
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {paginacion.total || logs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Creaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {logs.filter((l) => l.accion === 'CREATE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Actualizaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {logs.filter((l) => l.accion === 'UPDATE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Eliminaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {logs.filter((l) => l.accion === 'DELETE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Accordion 
        expanded={filtrosExpandidos}
        onChange={(e, isExpanded) => setFiltrosExpandidos(isExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography fontWeight={500}>Filtros de Búsqueda</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Página/Módulo"
                value={filtros.tabla}
                onChange={(e) => setFiltros({ ...filtros, tabla: e.target.value })}
                size="small"
                SelectProps={{
                  displayEmpty: true,
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="Riesgo">Riesgos</MenuItem>
                <MenuItem value="Proceso">Procesos</MenuItem>
                <MenuItem value="Usuario">Usuarios</MenuItem>
                <MenuItem value="Incidencia">Incidencias</MenuItem>
                <MenuItem value="PlanAccion">Planes de Acción</MenuItem>
                <MenuItem value="EvaluacionRiesgo">Evaluación de Riesgos</MenuItem>
                <MenuItem value="Area">Áreas y Asignaciones</MenuItem>
                <MenuItem value="Role">Roles y Permisos</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Acción"
                value={filtros.accion}
                onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}
                size="small"
                SelectProps={{
                  displayEmpty: true,
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="CREATE">Crear</MenuItem>
                <MenuItem value="UPDATE">Actualizar</MenuItem>
                <MenuItem value="DELETE">Eliminar</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                fullWidth
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={filtros.fechaDesde}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaDesde: e.target.value })
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                fullWidth
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                value={filtros.fechaHasta}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaHasta: e.target.value })
                }
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={cargarHistorial}
                  fullWidth
                  disabled={loading}
                >
                  Aplicar Filtros
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleLimpiarFiltros}
                  fullWidth
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Tabla */}
      <Paper elevation={2}>
        <AppDataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Dialog de Detalles */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Detalles del Cambio
            </Typography>
            <Button
              onClick={handleCloseDialog}
              size="small"
              startIcon={<CloseIcon />}
            >
              Cerrar
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={3}>
              {/* Información General */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  INFORMACIÓN GENERAL
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Fecha y Hora
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatearFechaDetallada(selectedLog.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Acción
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          selectedLog.accion === 'CREATE'
                            ? 'CREAR'
                            : selectedLog.accion === 'DELETE'
                            ? 'ELIMINAR'
                            : 'ACTUALIZAR'
                        }
                        size="small"
                        color={
                          selectedLog.accion === 'CREATE'
                            ? 'success'
                            : selectedLog.accion === 'DELETE'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Usuario
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.usuarioNombre}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedLog.usuarioEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Rol
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedLog.usuarioRole}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Página/Módulo
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {TABLA_A_PAGINA[selectedLog.tabla] || selectedLog.tabla}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      ID del Registro
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.registroId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Descripción del Registro
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.registroDesc || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Cambios Realizados */}
              {selectedLog.cambios && Object.keys(selectedLog.cambios).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    CAMBIOS REALIZADOS
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {Object.entries(selectedLog.cambios).map(([campo, valores]) => (
                      <Paper key={campo} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {campo}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Valor Anterior
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1,
                                mt: 0.5,
                                bgcolor: 'error.lighter',
                                borderColor: 'error.light',
                              }}
                            >
                              <Typography variant="body2" fontFamily="monospace">
                                {JSON.stringify(valores.anterior, null, 2)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Valor Nuevo
                            </Typography>
                            <Paper
                              variant="outlined"
                              sx={{
                                p: 1,
                                mt: 0.5,
                                bgcolor: 'success.lighter',
                                borderColor: 'success.light',
                              }}
                            >
                              <Typography variant="body2" fontFamily="monospace">
                                {JSON.stringify(valores.nuevo, null, 2)}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Para CREATE: Mostrar solo datos nuevos */}
              {selectedLog.accion === 'CREATE' && selectedLog.datosNuevos && !selectedLog.cambios && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    DATOS DEL REGISTRO CREADO
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {Object.entries(selectedLog.datosNuevos).map(([campo, valor]) => (
                      <Paper key={campo} variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {campo}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Para DELETE: Mostrar solo datos anteriores */}
              {selectedLog.accion === 'DELETE' && selectedLog.datosAnteriores && !selectedLog.cambios && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    DATOS DEL REGISTRO ELIMINADO
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {Object.entries(selectedLog.datosAnteriores).map(([campo, valor]) => (
                      <Paper key={campo} variant="outlined" sx={{ p: 1.5, bgcolor: 'error.lighter' }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {campo}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
