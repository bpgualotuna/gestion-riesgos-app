/**
 * Componente para visualizar el historial de cambios de un proceso
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
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
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import type { HistorialCambio } from '../../types';
import { useHistorialCambios } from '../../hooks/useHistorialCambios';
import { useMemo } from 'react';

interface HistorialCambiosDialogProps {
  open: boolean;
  onClose: () => void;
  procesoId: string;
  procesoNombre: string;
  seccionFiltro?: HistorialCambio['seccion'];
}

export default function HistorialCambiosDialog({
  open,
  onClose,
  procesoId,
  procesoNombre,
  seccionFiltro,
}: HistorialCambiosDialogProps) {
  const { obtenerHistorialPorProceso, obtenerHistorialPorSeccion } = useHistorialCambios(procesoId);

  const historial = useMemo(() => {
    const cambios = seccionFiltro
      ? obtenerHistorialPorSeccion(procesoId, seccionFiltro)
      : obtenerHistorialPorProceso(procesoId);

    // Ordenar por fecha descendente (más reciente primero)
    return cambios.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [procesoId, seccionFiltro, obtenerHistorialPorProceso, obtenerHistorialPorSeccion]);

  const obtenerIconoAccion = (accion: HistorialCambio['accion']) => {
    switch (accion) {
      case 'crear':
        return <AddIcon fontSize="small" />;
      case 'editar':
        return <EditIcon fontSize="small" />;
      case 'eliminar':
        return <DeleteIcon fontSize="small" />;
      default:
        return <HistoryIcon fontSize="small" />;
    }
  };

  const obtenerColorAccion = (accion: HistorialCambio['accion']) => {
    switch (accion) {
      case 'crear':
        return 'success';
      case 'editar':
        return 'info';
      case 'eliminar':
        return 'error';
      default:
        return 'default';
    }
  };

  const obtenerNombreSeccion = (seccion: HistorialCambio['seccion']) => {
    const nombres: Record<HistorialCambio['seccion'], string> = {
      ficha: 'Ficha de Proceso',
      analisis: 'Análisis de Proceso',
      normatividad: 'Normatividad',
      contextoInterno: 'Contexto Interno',
      contextoExterno: 'Contexto Externo',
      dofa: 'DOFA',
      benchmarking: 'Benchmarking',
    };
    return nombres[seccion] || seccion;
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearValor = (valor: any): string => {
    if (valor === null || valor === undefined) return 'N/A';
    if (typeof valor === 'object') return JSON.stringify(valor, null, 2);
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    return String(valor);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Historial de Cambios
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {procesoNombre}
              {seccionFiltro && ` - ${obtenerNombreSeccion(seccionFiltro)}`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {historial.length === 0 ? (
          <Alert severity="info">
            No hay cambios registrados{seccionFiltro ? ` para ${obtenerNombreSeccion(seccionFiltro)}` : ''}.
          </Alert>
        ) : (
          <Timeline position="right" sx={{ p: 0, m: 0 }}>
            {historial.map((cambio, index) => (
              <TimelineItem key={cambio.id}>
                <TimelineSeparator>
                  <TimelineDot color={obtenerColorAccion(cambio.accion) as any} sx={{ p: 1 }}>
                    {obtenerIconoAccion(cambio.accion)}
                  </TimelineDot>
                  {index < historial.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 4 }}>
                  <Paper elevation={2} sx={{ p: 2 }}>
                    {/* Header del cambio */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Chip
                        label={cambio.accion.toUpperCase()}
                        size="small"
                        color={obtenerColorAccion(cambio.accion) as any}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        label={obtenerNombreSeccion(cambio.seccion)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    {/* Usuario y fecha */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {cambio.usuarioNombre}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {formatearFecha(cambio.fecha)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Razón del cambio */}
                    {cambio.razonCambio && (
                      <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                        <Typography variant="caption" fontWeight={600}>
                          Razón:
                        </Typography>{' '}
                        <Typography variant="caption">{cambio.razonCambio}</Typography>
                      </Alert>
                    )}

                    {/* Campos modificados */}
                    {cambio.camposModificados.length > 0 && (
                      <Accordion sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2" fontWeight={600}>
                            Campos modificados ({cambio.camposModificados.length})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <List dense>
                            {cambio.camposModificados.map((campo, idx) => (
                              <Box key={campo}>
                                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                    {campo}
                                  </Typography>
                                  {cambio.valoresAnteriores && cambio.valoresNuevos && (
                                    <Box sx={{ width: '100%', pl: 2 }}>
                                      <Box sx={{ mb: 0.5 }}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: 'block' }}
                                        >
                                          Anterior:
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: 'block',
                                            p: 1,
                                            backgroundColor: '#ffebee',
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {formatearValor(cambio.valoresAnteriores[campo])}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{ display: 'block' }}
                                        >
                                          Nuevo:
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            display: 'block',
                                            p: 1,
                                            backgroundColor: '#e8f5e9',
                                            borderRadius: 1,
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                          }}
                                        >
                                          {formatearValor(cambio.valoresNuevos[campo])}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                </ListItem>
                                {idx < cambio.camposModificados.length - 1 && <Divider />}
                              </Box>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
