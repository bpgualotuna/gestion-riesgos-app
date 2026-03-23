import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { PlanAccionAPI } from '../../api/services/planTrazabilidadApi';

interface PlanDetalleDialogProps {
  open: boolean;
  plan: PlanAccionAPI | null;
  onClose: () => void;
}

const ESTADO_LABELS: Record<string, string> = {
  'pendiente': 'Pendiente',
  'en_ejecucion': 'En Ejecución',
  'completado': 'Completado',
  'convertido_a_control': 'Convertido a Control',
};

const ESTADO_COLORS: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'secondary'> = {
  'pendiente': 'default',
  'en_ejecucion': 'warning',
  'completado': 'success',
  'convertido_a_control': 'secondary',
};

export const PlanDetalleDialog: React.FC<PlanDetalleDialogProps> = ({
  open,
  plan,
  onClose,
}) => {
  if (!plan) return null;

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getVencimientoStatus = () => {
    if (!plan.fechaProgramada) return null;

    const hoy = new Date();
    const fechaVencimiento = new Date(plan.fechaProgramada);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && plan.estado !== 'completado' && plan.estado !== 'convertido_a_control') {
      return { tipo: 'vencido', dias: Math.abs(diffDays) };
    }

    if (diffDays >= 0 && diffDays <= 7 && plan.estado !== 'completado' && plan.estado !== 'convertido_a_control') {
      return { tipo: 'proximo', dias: diffDays };
    }

    return null;
  };

  const vencimientoStatus = getVencimientoStatus();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            Detalle del Plan de Acción
          </Typography>
          <Button
            onClick={onClose}
            size="small"
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Alerta de vencimiento */}
        {vencimientoStatus && (
          <Alert
            severity={vencimientoStatus.tipo === 'vencido' ? 'error' : 'warning'}
            icon={<WarningIcon />}
            sx={{ mb: 3 }}
          >
            {vencimientoStatus.tipo === 'vencido'
              ? `Este plan está vencido hace ${vencimientoStatus.dias} días`
              : `Este plan vence en ${vencimientoStatus.dias} días`}
          </Alert>
        )}

        {/* Estado */}
        <Box sx={{ mb: 3 }}>
          <Chip
            label={ESTADO_LABELS[plan.estado] || plan.estado}
            color={ESTADO_COLORS[plan.estado] || 'default'}
            size="medium"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Información del Riesgo */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
            Riesgo Asociado
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Código: <strong>{plan.riesgo.numeroIdentificacion}</strong>
            </Typography>
            <Typography variant="body1" gutterBottom>
              {plan.riesgo.descripcion}
            </Typography>
            <Chip
              label={plan.riesgo.proceso.nombre}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        {/* Causa del Riesgo */}
        {plan.causaDescripcion && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              Causa del Riesgo
            </Typography>
            <Box sx={{ bgcolor: 'info.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="body2">
                {plan.causaDescripcion}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Descripción del Plan */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
            Descripción del Plan
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {plan.descripcion || 'Sin descripción'}
          </Typography>
        </Box>

        {/* Observaciones */}
        {plan.observaciones && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
              Observaciones
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
              {plan.observaciones}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Información General */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
            Información General
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Responsable
              </Typography>
              <Typography variant="body1">
                {plan.responsable || 'No asignado'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Fecha Programada
              </Typography>
              <Typography variant="body1">
                {formatFecha(plan.fechaProgramada)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Fecha de Inicio
              </Typography>
              <Typography variant="body1">
                {formatFecha(plan.fechaInicio)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Fecha de Fin
              </Typography>
              <Typography variant="body1">
                {formatFecha(plan.fechaFin)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Control Derivado */}
        {plan.estado === 'convertido_a_control' && plan.controlDerivadoId && (
          <Alert severity="info" icon={<CheckIcon />} sx={{ mt: 3 }}>
            Este plan fue convertido en un control permanente (ID: {plan.controlDerivadoId})
            {plan.fechaConversion && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Fecha de conversión: {formatFecha(plan.fechaConversion)}
              </Typography>
            )}
          </Alert>
        )}

        {/* Metadatos */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Creado el
              </Typography>
              <Typography variant="body2">
                {formatFecha(plan.createdAt)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Última actualización
              </Typography>
              <Typography variant="body2">
                {formatFecha(plan.updatedAt)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
