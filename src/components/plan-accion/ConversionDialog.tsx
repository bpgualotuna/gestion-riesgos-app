import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SwapHoriz as ConvertIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { ConversionDialogProps, ControlFromPlanData } from '../../types/planAccion.types';

export const ConversionDialog: React.FC<ConversionDialogProps> = ({
  open,
  plan,
  onClose,
  onConfirm,
}) => {
  const [formData, setFormData] = useState<ControlFromPlanData>({
    descripcion: '',
    tipoControl: 'prevención',
    responsable: '',
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-llenar campos con datos del plan cuando se abre el diálogo
  useEffect(() => {
    if (plan && open) {
      setFormData({
        descripcion: plan.descripcion,
        tipoControl: 'prevención',
        responsable: plan.responsable || '',
        observaciones: '',
      });
      setError(null);
    }
  }, [plan, open]);

  const handleChange = (field: keyof ControlFromPlanData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validar campos requeridos
    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida');
      return;
    }

    if (!formData.responsable.trim()) {
      setError('El responsable es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ConvertIcon />
          <span>Convertir Plan de Acción a Control</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          El plan de acción será convertido en un control permanente. El plan original se mantendrá
          con estado "Convertido a Control" para mantener la trazabilidad.
        </Alert>

        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Plan de Acción Original
          </Typography>
          <Typography variant="body2">
            <strong>ID:</strong> {plan.id}
          </Typography>
          <Typography variant="body2">
            <strong>Descripción:</strong> {plan.descripcion}
          </Typography>
          <Typography variant="body2">
            <strong>Responsable:</strong> {plan.responsable || 'No asignado'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Descripción del Control"
            multiline
            rows={3}
            fullWidth
            required
            value={formData.descripcion}
            onChange={(e) => handleChange('descripcion', e.target.value)}
            disabled={loading}
            helperText="Descripción del control que se creará"
          />

          <FormControl fullWidth required disabled={loading}>
            <InputLabel id="tipo-control-label">Tipo de Control</InputLabel>
            <Select
              labelId="tipo-control-label"
              value={formData.tipoControl}
              label="Tipo de Control"
              onChange={(e) => handleChange('tipoControl', e.target.value)}
            >
              <MenuItem value="prevención">Prevención</MenuItem>
              <MenuItem value="detección">Detección</MenuItem>
              <MenuItem value="corrección">Corrección</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Responsable"
            fullWidth
            required
            value={formData.responsable}
            onChange={(e) => handleChange('responsable', e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Observaciones"
            multiline
            rows={2}
            fullWidth
            value={formData.observaciones}
            onChange={(e) => handleChange('observaciones', e.target.value)}
            disabled={loading}
            helperText="Información adicional sobre la conversión (opcional)"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ConvertIcon />}
        >
          {loading ? 'Convirtiendo...' : 'Convertir a Control'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
