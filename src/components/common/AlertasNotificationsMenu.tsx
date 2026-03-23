import React from 'react';
import {
  Menu,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AlertasVencimientoPanel } from '../plan-accion/AlertasVencimientoPanel';

interface AlertasNotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function AlertasNotificationsMenu({
  anchorEl,
  open,
  onClose,
}: AlertasNotificationsMenuProps) {
  const navigate = useNavigate();

  const handleVerTodas = () => {
    onClose();
    navigate('/planes-accion');
  };

  if (anchorEl == null) return null;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: 420,
          maxWidth: '90vw',
          maxHeight: 600,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Alertas de Vencimiento
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Alertas Panel */}
      <AlertasVencimientoPanel soloNoLeidas={true} />

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="text"
          size="small"
          onClick={handleVerTodas}
        >
          Ver todas las alertas
        </Button>
      </Box>
    </Menu>
  );
}
