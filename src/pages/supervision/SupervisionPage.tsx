/**
 * Supervisión Page
 * Vista especial para Director de Procesos
 * Muestra procesos asignados, responsables y estados
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Avatar,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useGetProcesosQuery, useGetRiesgosQuery } from '../../api/services/riesgosApi';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import type { Proceso } from '../types';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';

// Mock de áreas - En producción vendría de la API
const mockAreas = [
  { id: '1', nombre: 'Gestión Financiera y Administrativa' },
  { id: '2', nombre: 'Talento Humano' },
  { id: '3', nombre: 'Operaciones' },
];

// Mock de usuarios responsables - En producción vendría de la API
const mockUsuarios = [
  { id: '1', nombre: 'Dueño del Proceso', email: 'dueño@comware.com' },
  { id: '2', nombre: 'María Gerente', email: 'manager@comware.com' },
  { id: '3', nombre: 'Juan Analista', email: 'analyst@comware.com' },
];

export default function SupervisionPage() {
  const { user, esDirectorProcesos } = useAuth();
  const navigate = useNavigate();
  const { setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const { data: riesgosData } = useGetRiesgosQuery({ pageSize: 1000 });
  const todosRiesgos = riesgosData?.data || [];

  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroEstado, setFiltroEstado] = useState<string>('all');

  if (!esDirectorProcesos) {
    return (
      <Box>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo los directores de procesos pueden acceder.
        </Alert>
      </Box>
    );
  }

  // Filtrar procesos asignados al director
  const procesosAsignados = useMemo(() => {
    return procesos.filter((p) => p.directorId === user?.id);
  }, [procesos, user]);

  // Agrupar procesos por área
  const procesosPorArea = useMemo(() => {
    const agrupados: { [key: string]: Proceso[] } = {};
    procesosAsignados.forEach((proceso) => {
      const areaId = proceso.areaId || 'sin-area';
      if (!agrupados[areaId]) {
        agrupados[areaId] = [];
      }
      agrupados[areaId].push(proceso);
    });
    return agrupados;
  }, [procesosAsignados]);

  // Filtrar procesos según filtros
  const procesosFiltrados = useMemo(() => {
    let filtrados = procesosAsignados;

    if (filtroArea !== 'all') {
      filtrados = filtrados.filter((p) => p.areaId === filtroArea);
    }

    if (filtroEstado !== 'all') {
      if (filtroEstado === 'activo') {
        filtrados = filtrados.filter((p) => p.activo);
      } else if (filtroEstado === 'inactivo') {
        filtrados = filtrados.filter((p) => !p.activo);
      }
    }

    return filtrados;
  }, [procesosAsignados, filtroArea, filtroEstado]);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const total = procesosAsignados.length;
    const activos = procesosAsignados.filter((p) => p.activo).length;
    const inactivos = total - activos;
    const totalRiesgos = procesosAsignados.reduce((acc, p) => {
      return acc + todosRiesgos.filter((r) => r.procesoId === p.id).length;
    }, 0);
    const areasUnicas = new Set(procesosAsignados.map((p) => p.areaId).filter(Boolean)).size;

    return {
      total,
      activos,
      inactivos,
      totalRiesgos,
      areasUnicas,
    };
  }, [procesosAsignados, todosRiesgos]);

  // Obtener nombre del responsable
  const getResponsableNombre = (responsableId?: string) => {
    if (!responsableId) return 'Sin asignar';
    const usuario = mockUsuarios.find((u) => u.id === responsableId);
    return usuario?.nombre || 'Usuario no encontrado';
  };

  // Obtener nombre del área
  const getAreaNombre = (areaId?: string) => {
    if (!areaId) return 'Sin área asignada';
    const area = mockAreas.find((a) => a.id === areaId);
    return area?.nombre || 'Área no encontrada';
  };

  // Obtener estadísticas de un proceso
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

  const handleVerProceso = (proceso: Proceso) => {
    setProcesoSeleccionado(proceso);
    iniciarModoVisualizar();
    navigate(ROUTES.DASHBOARD);
  };

  const columns: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre del Proceso',
      flex: 1,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessCenterIcon sx={{ color: params.row.activo ? '#1976d2' : 'rgba(0, 0, 0, 0.3)' }} />
          <Typography variant="body2" fontWeight={600}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'responsableNombre',
      headerName: 'Responsable',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const responsable = params.row.responsableNombre || getResponsableNombre(params.row.responsableId) || 'Sin asignar';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2">
              {responsable}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'areaNombre',
      headerName: 'Área',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        const area = params.row.areaNombre || getAreaNombre(params.row.areaId);
        return (
          <Chip
            label={area}
            size="small"
            color="primary"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 150,
      renderCell: (params) => {
        const estado = params.row.estado || (params.row.activo ? 'activo' : 'inactivo');
        const estadoLabel = estado === 'aprobado' ? 'Aprobado' : 
                           estado === 'en_revision' ? 'En Revisión' :
                           estado === 'con_observaciones' ? 'Con Observaciones' :
                           estado === 'borrador' ? 'Borrador' :
                           params.row.activo ? 'Activo' : 'Inactivo';
        const estadoColor = estado === 'aprobado' ? 'success' :
                           estado === 'en_revision' ? 'info' :
                           estado === 'con_observaciones' ? 'warning' :
                           estado === 'borrador' ? 'default' :
                           params.row.activo ? 'success' : 'default';
        return (
          <Chip
            label={estadoLabel}
            size="small"
            color={estadoColor}
          />
        );
      },
    },
    {
      field: 'riesgos',
      headerName: 'Riesgos',
      width: 120,
      align: 'center',
      renderCell: (params) => {
        const stats = getEstadisticasProceso(params.row.id);
        return (
          <Tooltip title={`Total: ${stats.total} riesgos`}>
            <Chip
              label={stats.total}
              size="small"
              color={stats.total > 0 ? 'primary' : 'default'}
            />
          </Tooltip>
        );
      },
    },
  ];

  if (loadingProcesos) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="body1" sx={{ mt: 2 }} align="center">
          Cargando procesos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Supervisión de Procesos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista de supervisión para director de procesos - Gestión y seguimiento de procesos asignados
        </Typography>
      </Box>

      {/* Estadísticas Generales */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
            <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Procesos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {estadisticas.total}
                  </Typography>
                </Box>
                <BusinessCenterIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Procesos Activos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {estadisticas.activos}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#2e7d32', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Riesgos
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {estadisticas.totalRiesgos}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: '#ed6c02', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Áreas Asignadas
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {estadisticas.areasUnicas}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: '#0288d1', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <FilterListIcon color="action" />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Área</InputLabel>
              <Select
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
                label="Filtrar por Área"
              >
                <MenuItem value="all">Todas las áreas</MenuItem>
                {mockAreas.map((area) => (
                  <MenuItem key={area.id} value={area.id}>
                    {area.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Filtrar por Estado</InputLabel>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                label="Filtrar por Estado"
              >
                <MenuItem value="all">Todos los estados</MenuItem>
                <MenuItem value="activo">Activos</MenuItem>
                <MenuItem value="inactivo">Inactivos</MenuItem>
              </Select>
            </FormControl>
            <Chip
              label={`${procesosFiltrados.length} proceso(s) encontrado(s)`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabla de Procesos */}
      {procesosFiltrados.length === 0 ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {procesosAsignados.length === 0
                ? 'No tiene procesos asignados. Contacte al administrador para asignar procesos a sus áreas.'
                : 'No hay procesos que coincidan con los filtros seleccionados.'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Procesos Asignados
            </Typography>
            <AppDataGrid
              rows={procesosFiltrados.map((p) => ({
                ...p,
                responsableNombre: getResponsableNombre(p.responsableId),
                areaNombre: getAreaNombre(p.areaId),
              }))}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 },
                },
              }}
              getRowId={(row) => row.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Resumen por Área */}
      {Object.keys(procesosPorArea).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Resumen por Área
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid2 container spacing={2}>
              {Object.entries(procesosPorArea).map(([areaId, procesosArea]) => {
                const areaNombre = getAreaNombre(areaId);
                const totalRiesgos = procesosArea.reduce(
                  (acc, p) => acc + todosRiesgos.filter((r) => r.procesoId === p.id).length,
                  0
                );
                return (
                  <Grid2 xs={12} md={6} lg={4} key={areaId}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {areaNombre}
                        </Typography>
                        <Chip label={`${procesosArea.length} proceso(s)`} size="small" color="primary" />
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Riesgos totales: <strong>{totalRiesgos}</strong>
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Responsables:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {Array.from(
                            new Set(procesosArea.map((p) => getResponsableNombre(p.responsableId)))
                          ).map((responsable, idx) => (
                            <Chip
                              key={idx}
                              label={responsable}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid2>
                );
              })}
            </Grid2>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}


