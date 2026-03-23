import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { Warning as WarningIcon, Link as LinkIcon } from '@mui/icons-material';

interface DeleteControlDialogProps {
  open: boolean;
  controlId: number;
  planAccionOrigen?: {
    id: number;
    descripcion: string;
  };
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteControlDialog: React.FC<DeleteControlDialogProps> = ({
  open,
  controlId,
  planAccionOrigen,
  onClose,
  onConfirm,
}) => {
  const tieneVinculo = !!planAccionOrigen;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          <span>Confirmar Eliminación de Control</span>
        </Box>
      </DialogTitle>

      <DialogContent>
        {tieneVinculo ? (
          <>
            <Alert severity="warning" icon={<LinkIcon />} sx={{ mb: 2 }}>
              Este control está vinculado a un plan de acción
            </Alert>

            <Typography variant="body1" paragraph>
              El control <strong>#{controlId}</strong> fue creado a partir del siguiente plan de
              acción:
            </Typography>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="body2">
                <strong>Plan de Acción #{planAccionOrigen.id}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {planAccionOrigen.descripcion}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              Si elimina este control, el plan de acción original se mantendrá sin cambios para
              preservar la trazabilidad. Sin embargo, se perderá la relación entre ambos.
            </Typography>

            <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium' }}>
              ¿Desea continuar con la eliminación?
            </Typography>
          </>
        ) : (
          <Typography variant="body1">
            ¿Está seguro que desea eliminar el control <strong>#{controlId}</strong>?
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Eliminar Control
        </Button>
      </DialogActions>
    </Dialog>
  );
};
