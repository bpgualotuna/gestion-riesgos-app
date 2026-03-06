import React from 'react';
import {
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

interface AuditNotification {
  id: number;
  usuarioNombre: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  tabla: string;
  registroDesc?: string;
  createdAt: string;
}

interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  notifications: AuditNotification[];
  onClear: () => void;
}

const TABLA_A_PAGINA: Record<string, string> = {
  'Riesgo': 'Riesgos',
  'Proceso': 'Procesos',
  'Usuario': 'Usuarios',
  'Incidencia': 'Incidencias',
  'PlanAccion': 'Planes de Acción',
  'EvaluacionRiesgo': 'Evaluación de Riesgos',
  'PriorizacionRiesgo': 'Priorización',
  'CausaRiesgo': 'Causas de Riesgo',
  'ControlRiesgo': 'Controles',
  'Area': 'Áreas y Asignaciones',
  'Role': 'Roles y Permisos',
  'Cargo': 'Cargos',
  'ProcesoResponsable': 'Responsables de Proceso',
  'DofaItem': 'Análisis DOFA',
  'Normatividad': 'Normatividad',
  'Contexto': 'Contexto',
  'Benchmarking': 'Benchmarking',
  'Gerencia': 'Gerencias',
  'Observacion': 'Observaciones',
};

const formatearFecha = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const ahora = new Date();
  const diff = ahora.getTime() - date.getTime();
  
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);
  
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h`;
  if (dias < 7) return `Hace ${dias} d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export default function NotificationsMenu({
  anchorEl,
  open,
  onClose,
  notifications,
  onClear,
}: NotificationsMenuProps) {
  const navigate = useNavigate();

  const handleViewHistory = () => {
    onClose();
    navigate(ROUTES.HISTORIAL);
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1.5,
          width: 380,
          maxWidth: '90vw',
          maxHeight: 500,
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Notificaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {notifications.length > 0 && (
            <IconButton size="small" onClick={onClear} title="Limpiar todas">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Divider />

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No hay notificaciones nuevas
          </Typography>
        </Box>
      ) : (
        <List sx={{ py: 0, maxHeight: 350, overflow: 'auto' }}>
          {notifications.map((notif) => {
            const accionColor =
              notif.accion === 'CREATE'
                ? 'success'
                : notif.accion === 'DELETE'
                ? 'error'
                : 'warning';
            const accionLabel =
              notif.accion === 'CREATE'
                ? 'creó'
                : notif.accion === 'DELETE'
                ? 'eliminó'
                : 'actualizó';

            return (
              <React.Fragment key={notif.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': { backgroundColor: 'action.hover' },
                    cursor: 'pointer',
                  }}
                  onClick={handleViewHistory}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                          {notif.usuarioNombre}
                        </Typography>
                        <Chip
                          label={accionLabel}
                          size="small"
                          color={accionColor}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                          {TABLA_A_PAGINA[notif.tabla] || notif.tabla}
                          {notif.registroDesc && `: ${notif.registroDesc}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatearFecha(notif.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={handleViewHistory}
              startIcon={<HistoryIcon />}
            >
              Ver todo el historial
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );
}
