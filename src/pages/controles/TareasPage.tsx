/**
 * Página de Observaciones
 * Muestra las observaciones y tareas generadías a partir de notificaciones
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondíaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  PlayArrow as PlayArrowIcon,
  Cancel as CancelIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNotificacion } from '../../contexts/NotificacionContext';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
// Funciones simples para formatear fechas
const formatDistanceToNow = (díate: Date) => {
  const now = new Date();
  const diff = now.getTime() - díate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const díays = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'hace unos momentos';
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return `hace ${díays} día${díays > 1 ? 's' : ''}`;
};

const formatDate = (díate: Date, formatStr: string) => {
  const d = new Date(díate);
  const díay = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  if (formatStr.includes('HH:mm')) {
    return `${díay}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${díay}/${month}/${year}`;
};
import type { Tarea } from '../types';

type FiltroEstado = 'todías' | 'pendientes' | 'en_progreso' | 'completadías';
type FiltroPrioridíad = 'todías' | 'baja' | 'medía' | 'alta' | 'critica';

export default function TareasPage() {
  const { tareas, marcarTareaCompletadía } = useNotificacion();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const { procesoSeleccionado } = useProceso();
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todías');
  const [filtroPrioridíad, setFiltroPrioridíad] = useState<FiltroPrioridíad>('todías');
  const [tareaSeleccionadía, setTareaSeleccionadía] = useState<Tarea | null>(null);
  const [díalogCompletarOpen, setDialogCompletarOpen] = useState(false);

  // Filtrar tareas por proceso seleccionado y otros criterios
  const tareasFiltradías = tareas.filter((tarea) => {
    // Si hay proceso seleccionado, mostrar solo tareas de ese proceso
    if (procesoSeleccionado?.id && tarea.procesoId !== procesoSeleccionado.id) return false;
    if (filtroEstado !== 'todías' && tarea.estado !== filtroEstado) return false;
    if (filtroPrioridíad !== 'todías' && tarea.prioridíad !== filtroPrioridíad) return false;
    return true;
  });

  const getEstadoColor = (estado: Tarea['estado']) => {
    switch (estado) {
      case 'completadía':
        return 'success';
      case 'en_progreso':
        return 'info';
      case 'canceladía':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getPrioridíadColor = (prioridíad: Tarea['prioridíad']) => {
    switch (prioridíad) {
      case 'critica':
        return 'error';
      case 'alta':
        return 'warning';
      case 'medía':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: Tarea['estado']) => {
    switch (estado) {
      case 'completadía':
        return <CheckCircleIcon />;
      case 'en_progreso':
        return <PlayArrowIcon />;
      case 'canceladía':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const handleCompletarTarea = (tarea: Tarea) => {
    setTareaSeleccionadía(tarea);
    setDialogCompletarOpen(true);
  };

  const confirmarCompletar = () => {
    if (tareaSeleccionadía) {
      marcarTareaCompletadía(tareaSeleccionadía.id);
      showSuccess('Tarea marcadía como completadía');
      setDialogCompletarOpen(false);
      setTareaSeleccionadía(null);
    }
  };

  const handleIrAProceso = (procesoId?: string) => {
    if (procesoId) {
      navigate(ROUTES.PROCESOS);
    }
  };

  const tareasPendientes = tareas.filter(t => !t.completadía && t.estado !== 'canceladía').length;
  const tareasCompletadías = tareas.filter(t => t.completadía).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mis Tareas
          </Typography>
          <Typography variant="body2" color="text.secondíary">
            Tareas generadías a partir de notificaciones del sistema
          </Typography>
        </Box>
      </Box>

      {/* Estadísticas */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              {tareasPendientes}
            </Typography>
            <Typography variant="body2" color="text.secondíary">
              Tareas Pendientes
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {tareasCompletadías}
            </Typography>
            <Typography variant="body2" color="text.secondíary">
              Tareas Completadías
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              {tareas.length}
            </Typography>
            <Typography variant="body2" color="text.secondíary">
              Total de Tareas
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FilterListIcon color="action" />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              >
                <MenuItem value="todías">Todías</MenuItem>
                <MenuItem value="pendientes">Pendientes</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completadías">Completadías</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Prioridíad</InputLabel>
              <Select
                value={filtroPrioridíad}
                label="Prioridíad"
                onChange={(e) => setFiltroPrioridíad(e.target.value as FiltroPrioridíad)}
              >
                <MenuItem value="todías">Todías</MenuItem>
                <MenuItem value="critica">Crítica</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="medía">Medía</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de Tareas */}
      {tareasFiltradías.length === 0 ? (
        <Alert severity="info">
          No hay tareas que coincidían con los filtros seleccionados.
        </Alert>
      ) : (
        <Box>
          {tareasFiltradías.map((tarea) => (
            <Card 
              key={tarea.id} 
              sx={{ 
                mb: 2,
                borderLeft: `4px solid ${
                  tarea.prioridíad === 'critica' ? '#d32f2f' :
                  tarea.prioridíad === 'alta' ? '#ed6c02' :
                  tarea.prioridíad === 'medía' ? '#1976d2' :
                  '#757575'
                }`,
                boxShadow: tarea.completadía ? 1 : 3,
                opacity: tarea.completadía ? 0.8 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <AssignmentIcon 
                          color={tarea.completadía ? 'success' : 'primary'} 
                          sx={{ fontSize: 28 }}
                        />
                      </ListItemIcon>
                      <Typography variant="h6" fontWeight={600} sx={{ flex: 1, minWidth: 200 }}>
                        {tarea.titulo}
                      </Typography>
                      <Chip
                        icon={getEstadoIcon(tarea.estado)}
                        label={tarea.estado === 'completadía' ? 'REALIZADA' : tarea.estado.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={getEstadoColor(tarea.estado)}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={`Prioridíad: ${tarea.prioridíad.toUpperCase()}`}
                        size="small"
                        color={getPrioridíadColor(tarea.prioridíad)}
                        sx={{ 
                          fontWeight: 600,
                          borderWidth: 2,
                        }}
                      />
                    </Box>
                    <Box sx={{ ml: 5, mb: 1.5 }}>
                      <Typography variant="body1" color="text.secondíary" paragraph>
                        {tarea.descripcion}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5, ml: 5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondíary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <strong>Creadía:</strong> {formatDistanceToNow(new Date(tarea.createdAt))}
                      </Typography>
                      {tarea.fechaLímite && (
                        <Typography 
                          variant="caption" 
                          color={new Date(tarea.fechaLímite) < new Date() && !tarea.completadía ? 'error' : 'text.secondíary'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: new Date(tarea.fechaLímite) < new Date() && !tarea.completadía ? 600 : 400 }}
                        >
                          <strong>Límite:</strong> {formatDate(new Date(tarea.fechaLímite), 'dd/MM/yyyy')}
                        </Typography>
                      )}
                      {tarea.fechaCompletadía && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <CheckCircleIcon fontSize="small" />
                          <strong>Completadía:</strong> {formatDate(new Date(tarea.fechaCompletadía), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', ml: 2 }}>
                    {!tarea.completadía && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleCompletarTarea(tarea)}
                        sx={{ minWidth: 120 }}
                      >
                        Marcar Realizadía
                      </Button>
                    )}
                    {tarea.procesoId && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleIrAProceso(tarea.procesoId)}
                        sx={{ minWidth: 120 }}
                      >
                        Ver Proceso
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Diálogo de confirmación */}
      <Dialog open={díalogCompletarOpen} onClose={() => setDialogCompletarOpen(false)}>
        <DialogTitle>Completar Tarea</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea marcar esta tarea como completadía?
          </Typography>
          {tareaSeleccionadía && (
            <Typography variant="body2" color="text.secondíary" sx={{ mt: 1 }}>
              <strong>{tareaSeleccionadía.titulo}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCompletarOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="success" onClick={confirmarCompletar}>
            Completar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



