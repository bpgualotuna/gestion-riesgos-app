/**
 * Diálogo de confirmación para cambios no guardados
 * Se muestra cuando el usuario intenta navegar con cambios pendientes
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DeleteOutline as DiscardIcon,
} from '@mui/icons-material';

export interface UnsavedChangesDialogProps {
  /**
   * Controla si el diálogo está abierto
   */
  open: boolean;
  
  /**
   * Título del diálogo
   */
  title?: string;
  
  /**
   * Mensaje principal
   */
  message?: string;
  
  /**
   * Mensaje adicional o descripción
   */
  description?: string;
  
  /**
   * Callback cuando el usuario decide guardar
   */
  onSave?: () => void | Promise<void>;
  
  /**
   * Callback cuando el usuario decide descartar cambios
   */
  onDiscard: () => void;
  
  /**
   * Callback cuando el usuario cancela (se queda en la página)
   */
  onCancel: () => void;
  
  /**
   * Texto del botón de guardar
   */
  saveButtonText?: string;
  
  /**
   * Texto del botón de descartar
   */
  discardButtonText?: string;
  
  /**
   * Texto del botón de cancelar
   */
  cancelButtonText?: string;
  
  /**
   * Si es true, muestra un loading en el botón de guardar
   */
  isSaving?: boolean;
  
  /**
   * Si es true, oculta el botón de guardar (solo permite descartar o cancelar)
   */
  hideSaveButton?: boolean;
}

export default function UnsavedChangesDialog({
  open,
  title = 'Cambios sin guardar',
  message = 'Tiene cambios sin guardar en esta página.',
  description = '¿Qué desea hacer con los cambios realizados?',
  onSave,
  onDiscard,
  onCancel,
  saveButtonText = 'Guardar cambios',
  discardButtonText = 'Descartar cambios',
  cancelButtonText = 'Cancelar',
  isSaving = false,
  hideSaveButton = false,
}: UnsavedChangesDialogProps) {
  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'warning.light',
            color: 'warning.dark',
          }}
        >
          <WarningIcon />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {message}
        </Alert>

        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          pt: 1,
          gap: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          startIcon={<CloseIcon />}
          sx={{ borderRadius: 2 }}
        >
          {cancelButtonText}
        </Button>

        <Box sx={{ flex: 1 }} />

        <Button
          onClick={onDiscard}
          variant="outlined"
          color="error"
          startIcon={<DiscardIcon />}
          sx={{ borderRadius: 2 }}
          disabled={isSaving}
        >
          {discardButtonText}
        </Button>

        {!hideSaveButton && onSave && (
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={isSaving}
            sx={{
              borderRadius: 2,
              minWidth: 140,
            }}
          >
            {isSaving ? 'Guardando...' : saveButtonText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
