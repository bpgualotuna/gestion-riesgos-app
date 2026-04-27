import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  IconButton,
  Alert,
  Link,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  SwapHoriz as ConvertIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  AccessTime as ClockIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { EstadoPlan, PlanAccionCardProps } from '../../types/planAccion.types';
import { EstadoPlanSelector } from './EstadoPlanSelector';
import { useState, useEffect } from 'react';
import { formatDate, formatDateISO } from '../../utils/formatters';

// Colores para cada estado
const ESTADO_COLORS: Record<EstadoPlan, 'default' | 'primary' | 'warning' | 'success' | 'secondary' | 'info'> = {
  pendiente: 'warning',
  en_revision: 'primary',
  revisado: 'success',
  en_ejecucion: 'info',
  completado: 'success',
  convertido_a_control: 'secondary',
};

export const PlanAccionCard: React.FC<PlanAccionCardProps> = ({
  plan,
  onEstadoChange,
  onConvertirAControl,
  onEdit,
  onDelete,
  onVerDetalle,
  showConversionButton = true,
  disableEstadoChange = false,
}) => {
  const [estadoLocal, setEstadoLocal] = useState<EstadoPlan>(plan.estado);

  // Sincronizar estado local cuando cambia el prop plan.estado
  useEffect(() => {
    console.log('🔄 useEffect - Sincronizando estado:', {
      planId: plan.id,
      estadoAnterior: estadoLocal,
      estadoNuevo: plan.estado,
      descripcion: plan.descripcion
    });
    setEstadoLocal(plan.estado);
  }, [plan.estado]);

  // Calcular si el plan está vencido o próximo a vencer
  const getVencimientoStatus = () => {
    if (!plan.fechaProgramada) return null;
    const fechaIso = formatDateISO(plan.fechaProgramada);
    if (!fechaIso) return null;
    const [y, m, d] = fechaIso.split('-').map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVencimiento = new Date(y, m - 1, d);
    fechaVencimiento.setHours(0, 0, 0, 0);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && plan.estado !== 'revisado') {
      return { tipo: 'vencido', dias: Math.abs(diffDays) };
    }

    if (diffDays >= 0 && diffDays <= 7 && plan.estado !== 'revisado') {
      return { tipo: 'proximo', dias: diffDays };
    }

    return null;
  };

  const vencimientoStatus = getVencimientoStatus();

  const handleEstadoChange = (nuevoEstado: EstadoPlan) => {
    console.log('🎯 PlanAccionCard - handleEstadoChange:', {
      planId: plan.id,
      estadoLocal,
      nuevoEstado,
      descripcion: plan.descripcion
    });
    setEstadoLocal(nuevoEstado);
    onEstadoChange(plan.id, nuevoEstado);
  };

  const formatFecha = (fecha?: string) => {
    if (!fecha) return 'No definida';
    return formatDate(fecha) || 'No definida';
  };

  const formatEstado = (estado: EstadoPlan) => {
    if (!estado) return 'REVISADO';
    
    const estadoLabels: Record<EstadoPlan, string> = {
      pendiente: 'PENDIENTE',
      en_revision: 'REVISADO',
      revisado: 'APROBADO',
      en_ejecucion: 'EN EJECUCIÓN',
      completado: 'COMPLETADO',
      convertido_a_control: 'CONVERTIDO A CONTROL',
    };
    
    return estadoLabels[estado] || estado.replace(/_/g, ' ').toUpperCase();
  };

  const puedeConvertir = false; // Ya no se permite conversión a control
  const esConvertido = false;

  return (
    <Card sx={{ mb: 2, position: 'relative' }}>
      {vencimientoStatus && (
        <Alert
          severity={vencimientoStatus.tipo === 'vencido' ? 'error' : 'warning'}
          icon={vencimientoStatus.tipo === 'vencido' ? <WarningIcon /> : <ClockIcon />}
          sx={{ borderRadius: 0 }}
          data-testid="overdue-indicator"
        >
          {vencimientoStatus.tipo === 'vencido'
            ? `Vencido hace ${vencimientoStatus.dias} días`
            : `Vence en ${vencimientoStatus.dias} días`}
        </Alert>
      )}

      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" gutterBottom>
              {plan.descripcion}
            </Typography>
            {(plan as any).causaDescripcion && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                Causa: {(plan as any).causaDescripcion}
              </Typography>
            )}
            <Chip
              label={formatEstado(estadoLocal)}
              color={ESTADO_COLORS[estadoLocal]}
              size="small"
              sx={{ mr: 1 }}
            />
            {plan.prioridad && (
              <Chip
                label={`Prioridad ${plan.prioridad}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Box>
            {onEdit && (
              <IconButton size="small" onClick={() => onEdit(plan.id)} title="Editar">
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton size="small" onClick={() => onDelete(plan.id)} title="Eliminar">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Responsable
            </Typography>
            <Typography variant="body1">{plan.responsable || 'No asignado'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Fecha Programada
            </Typography>
            <Typography variant="body1">{formatFecha(plan.fechaProgramada)}</Typography>
          </Box>
          {plan.presupuesto && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Presupuesto
              </Typography>
              <Typography variant="body1">
                ${plan.presupuesto.toLocaleString('es-ES')}
              </Typography>
            </Box>
          )}
        </Box>

        {esConvertido && plan.controlDerivadoId && (
          <Alert severity="info" icon={<LinkIcon />} sx={{ mt: 2 }}>
            Este plan fue convertido en un control permanente.{' '}
            <Link href={`/controles/${plan.controlDerivadoId}`} underline="hover">
              Ver Control #{plan.controlDerivadoId}
            </Link>
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <EstadoPlanSelector
            estadoActual={estadoLocal}
            onChange={handleEstadoChange}
            disabled={esConvertido || disableEstadoChange}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {onVerDetalle && (
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => onVerDetalle(plan.id)}
            size="small"
          >
            Ver Detalles
          </Button>
        )}
        {puedeConvertir && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ConvertIcon />}
            onClick={() => onConvertirAControl(plan.id)}
          >
            Convertir a Control
          </Button>
        )}
      </CardActions>
    </Card>
  );
};
