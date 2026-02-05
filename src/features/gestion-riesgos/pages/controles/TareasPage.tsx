/**
 * Página de Observaciones
 * Muestra las observaciones y tareas generadas a partir de notificaciones
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
  ListItemSecondaryAction,
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
import { useNotificacion } from '../../../../shared/contexts/NotificacionContext';
import { useNotification } from '../../../../shared/hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../shared/utils/constants';
// Funciones simples para formatear fechas
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'hace unos momentos';
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return `hace ${days} día${days > 1 ? 's' : ''}`;
};

const formatDate = (date: Date, formatStr: string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  if (formatStr.includes('HH:mm')) {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
};
import type { Tarea } from '../types';

type FiltroEstado = 'todas' | 'pendientes' | 'en_progreso' | 'completadas';
type FiltroPrioridad = 'todas' | 'baja' | 'media' | 'alta' | 'critica';

export default function TareasPage() {
  const { tareas, marcarTareaCompletada } = useNotificacion();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>('todas');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);
  const [dialogCompletarOpen, setDialogCompletarOpen] = useState(false);

  // Filtrar tareas
  const tareasFiltradas = tareas.filter((tarea) => {
    if (filtroEstado !== 'todas' && tarea.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todas' && tarea.prioridad !== filtroPrioridad) return false;
    return true;
  });

  const getEstadoColor = (estado: Tarea['estado']) => {
    switch (estado) {
      case 'completada':
        return 'success';
      case 'en_progreso':
        return 'info';
      case 'cancelada':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getPrioridadColor = (prioridad: Tarea['prioridad']) => {
    switch (prioridad) {
      case 'critica':
        return 'error';
      case 'alta':
        return 'warning';
      case 'media':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: Tarea['estado']) => {
    switch (estado) {
      case 'completada':
        return <CheckCircleIcon />;
      case 'en_progreso':
        return <PlayArrowIcon />;
      case 'cancelada':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const handleCompletarTarea = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setDialogCompletarOpen(true);
  };

  const confirmarCompletar = () => {
    if (tareaSeleccionada) {
      marcarTareaCompletada(tareaSeleccionada.id);
      showSuccess('Tarea marcada como completada');
      setDialogCompletarOpen(false);
      setTareaSeleccionada(null);
    }
  };

  const handleIrAProceso = (procesoId?: string) => {
    if (procesoId) {
      navigate(ROUTES.PROCESOS);
    }
  };

  const tareasPendientes = tareas.filter(t => !t.completada && t.estado !== 'cancelada').length;
  const tareasCompletadas = tareas.filter(t => t.completada).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mis Tareas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tareas generadas a partir de notificaciones del sistema
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
            <Typography variant="body2" color="text.secondary">
              Tareas Pendientes
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {tareasCompletadas}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tareas Completadas
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>
              {tareas.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
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
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="pendientes">Pendientes</MenuItem>
                <MenuItem value="en_progreso">En Progreso</MenuItem>
                <MenuItem value="completadas">Completadas</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Prioridad</InputLabel>
              <Select
                value={filtroPrioridad}
                label="Prioridad"
                onChange={(e) => setFiltroPrioridad(e.target.value as FiltroPrioridad)}
              >
                <MenuItem value="todas">Todas</MenuItem>
                <MenuItem value="critica">Crítica</MenuItem>
                <MenuItem value="alta">Alta</MenuItem>
                <MenuItem value="media">Media</MenuItem>
                <MenuItem value="baja">Baja</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Lista de Tareas */}
      {tareasFiltradas.length === 0 ? (
        <Alert severity="info">
          No hay tareas que coincidan con los filtros seleccionados.
        </Alert>
      ) : (
        <Box>
          {tareasFiltradas.map((tarea) => (
            <Card 
              key={tarea.id} 
              sx={{ 
                mb: 2,
                borderLeft: `4px solid ${
                  tarea.prioridad === 'critica' ? '#d32f2f' :
                  tarea.prioridad === 'alta' ? '#ed6c02' :
                  tarea.prioridad === 'media' ? '#1976d2' :
                  '#757575'
                }`,
                boxShadow: tarea.completada ? 1 : 3,
                opacity: tarea.completada ? 0.8 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <AssignmentIcon 
                          color={tarea.completada ? 'success' : 'primary'} 
                          sx={{ fontSize: 28 }}
                        />
                      </ListItemIcon>
                      <Typography variant="h6" fontWeight={600} sx={{ flex: 1, minWidth: 200 }}>
                        {tarea.titulo}
                      </Typography>
                      <Chip
                        icon={getEstadoIcon(tarea.estado)}
                        label={tarea.estado === 'completada' ? 'REALIZADA' : tarea.estado.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={getEstadoColor(tarea.estado)}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={`Prioridad: ${tarea.prioridad.toUpperCase()}`}
                        size="small"
                        color={getPrioridadColor(tarea.prioridad)}
                        sx={{ 
                          fontWeight: 600,
                          borderWidth: 2,
                        }}
                      />
                    </Box>
                    <Box sx={{ ml: 5, mb: 1.5 }}>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {tarea.descripcion}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1.5, ml: 5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <strong>Creada:</strong> {formatDistanceToNow(new Date(tarea.createdAt))}
                      </Typography>
                      {tarea.fechaLimite && (
                        <Typography 
                          variant="caption" 
                          color={new Date(tarea.fechaLimite) < new Date() && !tarea.completada ? 'error' : 'text.secondary'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: new Date(tarea.fechaLimite) < new Date() && !tarea.completada ? 600 : 400 }}
                        >
                          <strong>Límite:</strong> {formatDate(new Date(tarea.fechaLimite), 'dd/MM/yyyy')}
                        </Typography>
                      )}
                      {tarea.fechaCompletada && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
                          <CheckCircleIcon fontSize="small" />
                          <strong>Completada:</strong> {formatDate(new Date(tarea.fechaCompletada), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', ml: 2 }}>
                    {!tarea.completada && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleCompletarTarea(tarea)}
                        sx={{ minWidth: 120 }}
                      >
                        Marcar Realizada
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
      <Dialog open={dialogCompletarOpen} onClose={() => setDialogCompletarOpen(false)}>
        <DialogTitle>Completar Tarea</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea marcar esta tarea como completada?
          </Typography>
          {tareaSeleccionada && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>{tareaSeleccionada.titulo}</strong>
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

