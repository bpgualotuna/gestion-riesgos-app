import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface ProcesoConResponsable {
  nombre?: string;
  responsable?: string;
  areaNombre?: string;
}

interface ResponsableProcesoDialogProps {
  open: boolean;
  onClose: () => void;
  proceso: ProcesoConResponsable | null;
}

export default function ResponsableProcesoDialog({ open, onClose, proceso }: ResponsableProcesoDialogProps) {
  if (!proceso) return null;

  const email = proceso.responsable
    ? `${proceso.responsable.toLowerCase().replace(/\s+/g, '.')}@conware.com`
    : '—';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" /> Detalle del Responsable
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '2rem' }}>
            {proceso.responsable?.charAt(0) || 'D'}
          </Avatar>
          <Typography variant="h6" fontWeight={700}>
            {proceso.responsable || 'Sin asignar'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Gerente de Proceso
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="caption" color="text.secondary">
              Cargo
            </Typography>
            <Typography variant="body2" fontWeight={500} display="block" sx={{ mb: 1.5 }}>
              Responsable de {proceso.nombre}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Área
            </Typography>
            <Typography variant="body2" fontWeight={500} display="block" sx={{ mb: 1.5 }}>
              {proceso.areaNombre || 'Área General'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Correo Electrónico
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {email}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
