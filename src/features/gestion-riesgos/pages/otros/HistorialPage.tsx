/**
 * Página de Historial
 * Muestra el historial de cambios realizados en los procesos
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Autocomplete,
  Paper,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Edit as EditIcon,
  Add as AddIcon,
  History as HistoryIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useProceso } from '../../../../contexts/ProcesoContext';
import { useRevisionProceso } from '../../hooks/useRevisionProceso';
import { useGetProcesosQuery } from '../../api/riesgosApi';
// Función simple para formatear fechas
const formatDate = (date: Date, formatStr: string) => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  
  if (formatStr.includes('HH:mm:ss')) {
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
  if (formatStr.includes('HH:mm')) {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
};
import type { HistorialCambioProceso, Proceso } from '../types';

type FiltroAccion = 'todas' | 'creado' | 'modificado' | 'enviado_revision' | 'aprobado' | 'rechazado' | 'observaciones_agregadas' | 'observaciones_resueltas';

export default function HistorialPage() {
  const { procesoSeleccionado } = useProceso();
  const { obtenerHistorial } = useRevisionProceso();
  const { data: procesos = [] } = useGetProcesosQuery();
  
  const [procesoFiltro, setProcesoFiltro] = useState<Proceso | null>(procesoSeleccionado);
  const [filtroAccion, setFiltroAccion] = useState<FiltroAccion>('todas');

  // Obtener historial del proceso seleccionado o del filtro
  const procesoParaHistorial = procesoFiltro || procesoSeleccionado;
  const historialCompleto = procesoParaHistorial 
    ? obtenerHistorial(procesoParaHistorial.id)
    : [];

  // Filtrar historial
  const historialFiltrado = historialCompleto.filter((item) => {
    if (filtroAccion !== 'todas' && item.accion !== filtroAccion) return false;
    return true;
  });

  const getAccionColor = (accion: HistorialCambioProceso['accion']) => {
    switch (accion) {
      case 'aprobado':
        return 'success';
      case 'rechazado':
      case 'observaciones_agregadas':
        return 'error';
      case 'enviado_revision':
        return 'warning';
      case 'observaciones_resueltas':
        return 'info';
      default:
        return 'primary';
    }
  };

  const getAccionIcon = (accion: HistorialCambioProceso['accion']) => {
    switch (accion) {
      case 'aprobado':
        return <CheckCircleIcon />;
      case 'rechazado':
        return <CancelIcon />;
      case 'enviado_revision':
        return <SendIcon />;
      case 'observaciones_agregadas':
        return <CancelIcon />;
      case 'observaciones_resueltas':
        return <CheckCircleIcon />;
      case 'modificado':
        return <EditIcon />;
      case 'creado':
        return <AddIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getAccionLabel = (accion: HistorialCambioProceso['accion']) => {
    const labels: Record<HistorialCambioProceso['accion'], string> = {
      creado: 'Proceso Creado',
      modificado: 'Proceso Modificado',
      enviado_revision: 'Enviado a Revisión',
      aprobado: 'Proceso Aprobado',
      rechazado: 'Proceso Rechazado',
      observaciones_agregadas: 'Observaciones Agregadas',
      observaciones_resueltas: 'Observaciones Resueltas',
    };
    return labels[accion] || accion;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Historial de Cambios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Registro completo de todos los cambios realizados en los procesos
          </Typography>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterListIcon color="action" />
            <Autocomplete
              options={procesos}
              getOptionLabel={(option) => option.nombre}
              value={procesoFiltro}
              onChange={(_, newValue) => setProcesoFiltro(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Seleccionar Proceso"
                  placeholder="Todos los procesos"
                  size="small"
                  sx={{ minWidth: 250 }}
                />
              )}
              sx={{ flex: 1, minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Acción</InputLabel>
              <Select
                value={filtroAccion}
                label="Acción"
                onChange={(e) => setFiltroAccion(e.target.value as FiltroAccion)}
              >
                <MenuItem value="todas">Todas las Acciones</MenuItem>
                <MenuItem value="creado">Creado</MenuItem>
                <MenuItem value="modificado">Modificado</MenuItem>
                <MenuItem value="enviado_revision">Enviado a Revisión</MenuItem>
                <MenuItem value="aprobado">Aprobado</MenuItem>
                <MenuItem value="rechazado">Rechazado</MenuItem>
                <MenuItem value="observaciones_agregadas">Observaciones Agregadas</MenuItem>
                <MenuItem value="observaciones_resueltas">Observaciones Resueltas</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Historial */}
      {!procesoParaHistorial ? (
        <Alert severity="info">
          Seleccione un proceso para ver su historial de cambios, o seleccione uno desde el filtro arriba.
        </Alert>
      ) : historialFiltrado.length === 0 ? (
        <Alert severity="info">
          No hay historial de cambios para este proceso con los filtros seleccionados.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Historial de: {procesoParaHistorial.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {historialFiltrado.length} registro(s) encontrado(s)
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Timeline>
              {historialFiltrado.map((item, index) => (
                <TimelineItem key={item.id}>
                  <TimelineSeparator>
                    <TimelineDot color={getAccionColor(item.accion)}>
                      {getAccionIcon(item.accion)}
                    </TimelineDot>
                    {index < historialFiltrado.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {getAccionLabel(item.accion)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Por: <strong>{item.usuarioNombre}</strong>
                          </Typography>
                        </Box>
                        <Chip
                          label={getAccionLabel(item.accion)}
                          size="small"
                          color={getAccionColor(item.accion)}
                          icon={getAccionIcon(item.accion)}
                        />
                      </Box>
                      <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                        {item.descripcion}
                      </Typography>
                      {item.cambios && Object.keys(item.cambios).length > 0 && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}>
                          <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                            Detalles de Cambios:
                          </Typography>
                          {Object.entries(item.cambios).map(([key, cambio]) => (
                            <Box key={key} sx={{ mb: 1 }}>
                              <Typography variant="caption" fontWeight={600}>
                                {key}:
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                <Typography variant="caption" color="error" display="block">
                                  Anterior: {String(cambio.anterior || 'N/A')}
                                </Typography>
                                <Typography variant="caption" color="success.main" display="block">
                                  Nuevo: {String(cambio.nuevo || 'N/A')}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {formatDate(new Date(item.fecha), 'dd/MM/yyyy HH:mm:ss')}
                      </Typography>
                    </Paper>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
