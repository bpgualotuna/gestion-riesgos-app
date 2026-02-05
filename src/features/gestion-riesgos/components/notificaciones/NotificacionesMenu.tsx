/**
 * Componente de menú de notificaciones para el AppBar
 */

import { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { useNotificacion } from '../../../../shared/contexts/NotificacionContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../shared/utils/constants';
// Función simple para formatear fecha relativa
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'hace unos momentos';
  if (minutes < 60) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  return `hace ${days} día${days > 1 ? 's' : ''}`;
};

export default function NotificacionesMenu() {
  const navigate = useNavigate();
  const { notificaciones, notificacionesNoLeidas, marcarNotificacionLeida } = useNotificacion();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificacionClick = (notificacion: any) => {
    marcarNotificacionLeida(notificacion.id);
    if (notificacion.procesoId) {
      navigate(ROUTES.PROCESOS);
    }
    handleClose();
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'proceso_enviado_revision':
        return <SendIcon fontSize="small" />;
      case 'proceso_aprobado':
        return <CheckCircleIcon fontSize="small" />;
      case 'proceso_rechazado':
      case 'observaciones_agregadas':
        return <CancelIcon fontSize="small" />;
      case 'observaciones_resueltas':
        return <CheckCircleIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getColor = (tipo: string) => {
    switch (tipo) {
      case 'proceso_aprobado':
      case 'observaciones_resueltas':
        return 'success';
      case 'proceso_rechazado':
      case 'observaciones_agregadas':
        return 'error';
      case 'proceso_enviado_revision':
        return 'warning';
      default:
        return 'default';
    }
  };

  const notificacionesOrdenadas = [...notificaciones]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10); // Mostrar solo las últimas 10

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        sx={{
          color: 'rgba(0, 0, 0, 0.87)',
        }}
      >
        <Badge badgeContent={notificacionesNoLeidas} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 350,
            maxWidth: 450,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="h6" fontWeight={600}>
            Notificaciones
          </Typography>
          {notificacionesNoLeidas > 0 && (
            <Chip
              label={`${notificacionesNoLeidas} sin leer`}
              size="small"
              color="error"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Divider />
        {notificacionesOrdenadas.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No hay notificaciones
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notificacionesOrdenadas.map((notificacion) => (
              <MenuItem
                key={notificacion.id}
                onClick={() => handleNotificacionClick(notificacion)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: notificacion.leida ? 'none' : '3px solid #1976d2',
                  bgcolor: notificacion.leida ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={{
                      color: `${getColor(notificacion.tipo)}.main`,
                    }}
                  >
                    {getIcon(notificacion.tipo)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={notificacion.leida ? 400 : 600}
                      sx={{ mb: 0.5 }}
                    >
                      {notificacion.titulo}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {notificacion.mensaje}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {formatDistanceToNow(new Date(notificacion.createdAt))}
                      </Typography>
                    </>
                  }
                />
              </MenuItem>
            ))}
          </List>
        )}
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Button
            fullWidth
            variant="text"
            onClick={() => {
              navigate(ROUTES.TAREAS || '/tareas');
              handleClose();
            }}
          >
            Ver todas las tareas
          </Button>
        </Box>
      </Menu>
    </>
  );
}

