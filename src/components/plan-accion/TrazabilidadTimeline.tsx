import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  SwapHoriz as ConvertIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { TrazabilidadTimelineProps } from '../../types/planAccion.types';

export const TrazabilidadTimeline: React.FC<TrazabilidadTimelineProps> = ({
  planId,
  controlId,
  eventos,
}) => {
  const getIconoEvento = (tipo: string) => {
    switch (tipo) {
      case 'creacion':
        return <AddIcon />;
      case 'cambio_estado':
        return <EditIcon />;
      case 'conversion':
        return <ConvertIcon />;
      case 'eliminacion':
        return <DeleteIcon />;
      default:
        return <EditIcon />;
    }
  };

  const getColorEvento = (tipo: string): 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' => {
    switch (tipo) {
      case 'creacion':
        return 'success';
      case 'cambio_estado':
        return 'info';
      case 'conversion':
        return 'secondary';
      case 'eliminacion':
        return 'error';
      default:
        return 'primary';
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFechaCorta = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (eventos.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No hay eventos de trazabilidad registrados
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Encabezado con enlaces bidireccionales */}
      {controlId && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'secondary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
            <Link href={`/planes-accion/${planId}`} underline="hover">
              <Chip
                icon={<LinkIcon />}
                label={`Plan de Acción #${planId}`}
                color="primary"
                clickable
              />
            </Link>
            <Typography variant="body2" color="text.secondary">
              ↔
            </Typography>
            <Link href={`/controles/${controlId}`} underline="hover">
              <Chip
                icon={<LinkIcon />}
                label={`Control #${controlId}`}
                color="secondary"
                clickable
              />
            </Link>
          </Box>
        </Paper>
      )}

      {/* Timeline de eventos */}
      <Timeline position="right">
        {eventos.map((evento, index) => (
          <TimelineItem key={evento.id}>
            <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
              <Typography variant="caption">{formatFechaCorta(evento.fecha)}</Typography>
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot color={getColorEvento(evento.tipo)} variant={evento.tipo === 'conversion' ? 'filled' : 'outlined'}>
                {getIconoEvento(evento.tipo)}
              </TimelineDot>
              {index < eventos.length - 1 && <TimelineConnector />}
            </TimelineSeparator>

            <TimelineContent>
              <Paper
                elevation={evento.tipo === 'conversion' ? 3 : 1}
                sx={{
                  p: 2,
                  bgcolor: evento.tipo === 'conversion' ? 'secondary.50' : 'background.paper',
                }}
              >
                <Typography variant="subtitle2" component="div">
                  {evento.descripcion}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Por: {evento.usuario}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {formatFecha(evento.fecha)}
                </Typography>

                {/* Mostrar cambios de estado si existen */}
                {evento.estadoAnterior && evento.estadoNuevo && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      label={evento.estadoAnterior.replace('_', ' ')}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="caption">→</Typography>
                    <Chip
                      label={evento.estadoNuevo.replace('_', ' ')}
                      size="small"
                      color="primary"
                    />
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
};
