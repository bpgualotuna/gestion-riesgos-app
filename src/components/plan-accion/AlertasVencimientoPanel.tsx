import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  Typography,
  Badge,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useObtenerAlertasQuery, useMarcarAlertaLeidaMutation } from '../../api/services/planTrazabilidadApi';
import { useNavigate } from 'react-router-dom';

interface AlertasVencimientoPanelProps {
  soloNoLeidas?: boolean;
}

export const AlertasVencimientoPanel: React.FC<AlertasVencimientoPanelProps> = ({
  soloNoLeidas = false,
}) => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useObtenerAlertasQuery({ soloNoLeidas });
  const [marcarLeida] = useMarcarAlertaLeidaMutation();

  const handleMarcarLeida = async (alertaId: number) => {
    try {
      await marcarLeida(alertaId).unwrap();
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
    }
  };

  const handleVerPlan = () => {
    // Navegar a la página de controles y planes de acción
    navigate('/plan-accion');
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMensajeAlerta = (diasRestantes: number, tipo: string) => {
    const dias = Math.abs(diasRestantes);
    if (tipo === 'vencido') {
      return `Vencido hace ${dias} día${dias !== 1 ? 's' : ''}`;
    }
    return `Vence en ${dias} día${dias !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error al cargar alertas. Por favor, intenta de nuevo.
        </Alert>
      </Box>
    );
  }

  const alertas = data?.alertas || [];
  const alertasVencidas = data?.vencidas || 0;
  const alertasProximas = data?.proximasAVencer || 0;
  const alertasNoLeidas = data?.noLeidas || 0;

  if (alertas.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          No hay alertas de vencimiento
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Todos los planes están al día
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Resumen de alertas */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip
            icon={<ErrorIcon />}
            label={`${alertasVencidas} Vencidas`}
            color="error"
            size="small"
          />
          <Chip
            icon={<WarningIcon />}
            label={`${alertasProximas} Próximas`}
            color="warning"
            size="small"
          />
          <Badge badgeContent={alertasNoLeidas} color="primary">
            <Chip label="No leídas" size="small" variant="outlined" />
          </Badge>
        </Box>
        <IconButton size="small" onClick={() => refetch()} title="Actualizar">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Lista de alertas */}
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {alertas.map((alerta, index) => (
          <Box key={alerta.id}>
            <ListItem
              disablePadding
              secondaryAction={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleVerPlan()}
                    title="Ver plan"
                  >
                    <ViewIcon />
                  </IconButton>
                  {!alerta.leida && (
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleMarcarLeida(alerta.id)}
                      title="Marcar como leída"
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                </Box>
              }
              sx={{
                bgcolor: alerta.leida ? 'transparent' : 'action.hover',
                opacity: alerta.leida ? 0.7 : 1,
              }}
            >
              <ListItemButton onClick={() => handleVerPlan()}>
                <Box sx={{ mr: 2 }}>
                  {alerta.tipo === 'vencido' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: alerta.leida ? 'normal' : 'bold' }}>
                        {alerta.plan.descripcion}
                      </Typography>
                      <Chip
                        label={alerta.riesgo.numeroIdentificacion}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block" color={alerta.tipo === 'vencido' ? 'error' : 'warning.main'}>
                        {getMensajeAlerta(alerta.diasRestantes, alerta.tipo)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Proceso: {alerta.proceso.nombre}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Responsable: {alerta.plan.responsable}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < alertas.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
    </Box>
  );
};
