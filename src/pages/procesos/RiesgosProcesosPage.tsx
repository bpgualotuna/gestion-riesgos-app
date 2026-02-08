/**
 * Riesgos del Proceso Page
 * Muestra los riesgos del proceso seleccionado
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  BusinessCenter as BusinessCenterIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetEstadisticasQuery, useGetProcesosQuery } from '../../api/services/riesgosApi';
import { colors } from '../../app/theme/colors';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useProceso } from '../../contexts/ProcesoContext';
import { useRiesgo } from '../../contexts/RiesgoContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import type { Riesgo } from '../types';

export default function RiesgosProcesosPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { iniciarNuevo, iniciarVer, iniciarEditar, riesgoSeleccionado, modo } = useRiesgo();
  const { esAdmin, esAuditoria, esDueñoProcesos, esGerenteGeneralProceso } = useAuth();
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess } = useNotification();
  const [resumenOpen, setResumenOpen] = useState(false);
  const [procesoResumen, setProcesoResumen] = useState<any>(null);

  // Determinar qué riesgos puede ver el usuario
  // Admin y Auditoría: TODOS los riesgos a nivel compañía
  // Dueño del Proceso: Solo riesgos del proceso seleccionado
  const puedeVerTodosLosRiesgos = esAdmin || esAuditoria;

  // Obtener todos los procesos para mostrar el nombre en la tabla (solo para admin/auditoría)
  const { data: procesosData } = useGetProcesosQuery();
  const procesos = procesosData?.data || [];

  // Filtrar riesgos según el rol del usuario
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    puedeVerTodosLosRiesgos
      ? { pageSize: 1000 } // Admin y Auditoría ven todos los riesgos
      : procesoSeleccionado
        ? {
          procesoId: procesoSeleccionado.id,
          pageSize: 100,
        }
        : { pageSize: 100 }
  );

  // Estadísticas filtradas por proceso
  const { data: estadisticas } = useGetEstadisticasQuery(procesoSeleccionado?.id);

  const riesgos = riesgosData?.data || [];

  const handleNuevo = () => {
    iniciarNuevo();
    showSuccess('Modo creación activado. Complete los pasos del proceso.');
  };

  const handleVer = (riesgo: Riesgo) => {
    iniciarVer(riesgo);
    showSuccess(`Visualizando riesgo: ${riesgo.descripcion.substring(0, 50)}...`);
  };

  const handleEditar = (riesgo: Riesgo) => {
    iniciarEditar(riesgo);
    showSuccess(`Editando riesgo: ${riesgo.descripcion.substring(0, 50)}...`);
  };

  const handleVerResumen = (proceso: any) => {
    setProcesoResumen(proceso);
    setResumenOpen(true);
  };

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [clasificacionFilter, setClasificacionFilter] = useState<string>('all');

  // Filtrar riesgos
  const filteredRiesgos = riesgos.filter((riesgo: Riesgo) => {
    const matchesSearch = riesgo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      riesgo.numero.toString().includes(searchTerm);
    const matchesClasificacion = clasificacionFilter === 'all' ||
      (clasificacionFilter === 'positiva' && riesgo.clasificacion === 'Riesgo con consecuencia positiva') ||
      (clasificacionFilter === 'negativa' && riesgo.clasificacion !== 'Riesgo con consecuencia positiva');
    return matchesSearch && matchesClasificacion;
  });

  const columns: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro',
      width: 80,
    },
    ...(puedeVerTodosLosRiesgos ? [{
      field: 'proceso',
      headerName: 'Proceso',
      width: 200,
      renderCell: (params: any) => {
        const proceso = procesos.find((p: any) => p.id === params.row.procesoId);
        return proceso?.nombre || 'Sin proceso';
      },
    }] : []),
    {
      field: 'descripcion',
      headerName: 'Descripción del Riesgo',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value === 'Riesgo con consecuencia positiva' ? 'Positiva' : 'Negativa'}
          size="small"
          color={params.value === 'Riesgo con consecuencia positiva' ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'zona',
      headerName: 'Zona',
      width: 150,
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const riesgo = params.row as Riesgo;
        const isSelected = riesgoSeleccionado?.id === riesgo.id;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isSelected && !isReadOnly && (
              <>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVer(riesgo);
                  }}
                  title="Ver"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditar(riesgo);
                  }}
                  title="Editar"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {!isSelected && isReadOnly && (
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVer(riesgo);
                }}
                title="Ver"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            )}
            {isSelected && modo === 'ver' && (
              <Chip label="Viendo" color="info" size="small" />
            )}
            {isSelected && modo === 'editar' && !isReadOnly && (
              <Chip label="Editando" color="warning" size="small" />
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      {/* Indicador de Proceso Activo y Acción Actual */}
      {(procesoSeleccionado || puedeVerTodosLosRiesgos) && (
        <Card sx={{ mb: 3, background: 'rgba(25, 118, 210, 0.05)', border: '2px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BusinessCenterIcon sx={{ fontSize: 32, color: '#1976d2' }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {puedeVerTodosLosRiesgos
                      ? 'Vista Completa de Riesgos'
                      : `Proceso Activo: ${procesoSeleccionado?.nombre}`}
                  </Typography>
                  {modo === 'nuevo' && (
                    <Typography variant="body2" color="success.main" fontWeight={600}>
                      Modo: Creación de Nuevo Riesgo
                    </Typography>
                  )}
                  {riesgoSeleccionado && modo === 'ver' && (
                    <Typography variant="body2" color="info.main" fontWeight={600}>
                      Modo: Visualización - {riesgoSeleccionado.descripcion.substring(0, 50)}...
                    </Typography>
                  )}
                  {riesgoSeleccionado && modo === 'editar' && (
                    <Typography variant="body2" color="warning.main" fontWeight={600}>
                      Modo: Edición - {riesgoSeleccionado.descripcion.substring(0, 50)}...
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Estado actual del riesgo */}
      {(procesoSeleccionado || puedeVerTodosLosRiesgos) && modo === 'nuevo' && (
        <Card sx={{ mb: 3, background: 'rgba(25, 118, 210, 0.1)', border: '2px solid #1976d2' }}>
          <CardContent>
            <Typography variant="h6" color="primary" fontWeight={600}>
              Modo Creación Activado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete los pasos del proceso: Ficha → Análisis → Normatividad → Contexto Externo → Contexto Interno → DOFA → Benchmarking → Identificación → Evaluación → Mapa → Priorización
            </Typography>
          </CardContent>
        </Card>
      )}

      {(procesoSeleccionado || puedeVerTodosLosRiesgos) && riesgoSeleccionado && modo === 'ver' && (
        <Card sx={{ mb: 3, background: 'rgba(33, 150, 243, 0.1)', border: '2px solid #2196f3' }}>
          <CardContent>
            <Typography variant="h6" color="info.main" fontWeight={600}>
              Modo Visualización
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualizando: {riesgoSeleccionado.descripcion.substring(0, 100)}...
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => iniciarEditar(riesgoSeleccionado)}
              sx={{ mt: 1 }}
            >
              Cambiar a Modo Edición
            </Button>
          </CardContent>
        </Card>
      )}

      {(procesoSeleccionado || puedeVerTodosLosRiesgos) && riesgoSeleccionado && modo === 'editar' && !isReadOnly && (
        <Card sx={{ mb: 3, background: 'rgba(255, 152, 0, 0.1)', border: '2px solid #ff9800' }}>
          <CardContent>
            <Typography variant="h6" color="warning.main" fontWeight={600}>
              Modo Edición
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Editando: {riesgoSeleccionado.descripcion.substring(0, 100)}...
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => iniciarVer(riesgoSeleccionado)}
              sx={{ mt: 1 }}
            >
              Cambiar a Modo Visualización
            </Button>
          </CardContent>
        </Card>
      )}
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Está en modo visualización. Solo puede ver la información de los riesgos.
        </Alert>
      )}

      {/* Estadísticas */}
      {procesoSeleccionado && estadisticas && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          <Card
            sx={{
              background: 'rgba(211, 47, 47, 0.1)',
              border: '2px solid',
              borderColor: colors.risk.critical.main,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight={700} color={colors.risk.critical.main}>
                    {estadisticas.criticos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Críticos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card
            sx={{
              background: 'rgba(245, 124, 0, 0.1)',
              border: '2px solid',
              borderColor: colors.risk.high.main,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight={700} color={colors.risk.high.main}>
                    {estadisticas.altos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Altos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card
            sx={{
              background: 'rgba(251, 192, 45, 0.1)',
              border: '2px solid',
              borderColor: colors.risk.medium.main,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight={700} color={colors.risk.medium.main}>
                    {estadisticas.medios}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medios
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card
            sx={{
              background: 'rgba(56, 142, 60, 0.1)',
              border: '2px solid',
              borderColor: colors.risk.low.main,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight={700} color={colors.risk.low.main}>
                    {estadisticas.bajos}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bajos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabla de Riesgos */}
      {puedeVerTodosLosRiesgos || procesoSeleccionado ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" gutterBottom fontWeight={600}>
                {puedeVerTodosLosRiesgos
                  ? 'Riesgos de la Compañía'
                  : `Riesgos del Proceso: ${procesoSeleccionado?.nombre}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {puedeVerTodosLosRiesgos
                  ? 'Vista completa de todos los riesgos a nivel compañía'
                  : 'Seleccione un riesgo para ver o editar'}
              </Typography>
            </Box>
            {!isReadOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNuevo}
                disabled={modo === 'nuevo'}
                sx={{ background: '#1976d2' }}
              >
                Nuevo Riesgo
              </Button>
            )}
          </Box>

          {/* Filtros */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Buscar riesgos"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 1, bgcolor: 'background.paper' }}
              placeholder="Buscar por descripción o número..."
            />
            <TextField
              select
              label="Clasificación"
              variant="outlined"
              size="small"
              value={clasificacionFilter}
              onChange={(e) => setClasificacionFilter(e.target.value)}
              sx={{ width: 200, bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="positiva">Positiva</MenuItem>
              <MenuItem value="negativa">Negativa</MenuItem>
            </TextField>
          </Box>

          <AppDataGrid
            rows={filteredRiesgos}
            columns={columns}
            loading={loadingRiesgos}
            getRowId={(row) => row.id}
          />
        </>
      ) : (
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              {esDueñoProcesos
                ? 'Seleccione un proceso desde el Dashboard para ver sus riesgos'
                : 'Debe seleccionar un proceso para ver sus riesgos'}
            </Alert>
            {/* Validación removida - permite cargar sin proceso seleccionado */}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}



