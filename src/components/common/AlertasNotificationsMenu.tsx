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
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AlertasVencimientoPanel } from '../plan-accion/AlertasVencimientoPanel';
import { useRiesgosCriticosNotifications } from '../../hooks/useRiesgosCriticosNotifications';

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
  const { conteo, loading } = useRiesgosCriticosNotifications(true);

  const handleVerTodas = () => {
    onClose();
    navigate('/planes-accion');
  };

  const handleVerMapa = () => {
    onClose();
    navigate('/mapa');
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
            Notificaciones
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Riesgos Críticos */}
      {conteo.total > 0 && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Card 
            sx={{ 
              bgcolor: 'error.lighter',
              border: '1px solid',
              borderColor: 'error.light',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: 2,
                borderColor: 'error.main',
              }
            }}
            onClick={handleVerMapa}
          >
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WarningIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="error.dark">
                    {conteo.total === 1 
                      ? 'Existe 1 riesgo en zona crítica' 
                      : `Existen ${conteo.total} riesgos en zona crítica`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    {conteo.inherentes > 0 && (
                      <Chip 
                        label={`${conteo.inherentes} inherente${conteo.inherentes > 1 ? 's' : ''}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {conteo.residuales > 0 && (
                      <Chip 
                        label={`${conteo.residuales} residual${conteo.residuales > 1 ? 'es' : ''}`}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </Box>
                <MapIcon color="error" />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Alertas de Vencimiento */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
          Alertas de Vencimiento
        </Typography>
      </Box>
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
