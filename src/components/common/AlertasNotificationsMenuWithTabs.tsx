import React, { useState } from 'react';
import {
  Menu,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  Tabs,
  Tab,
  Badge,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AlertasVencimientoPanel } from '../plan-accion/AlertasVencimientoPanel';
import { useRiesgosCriticosNotifications } from '../../hooks/useRiesgosCriticosNotifications';
import { useObtenerPlanesAccionQuery } from '../../api/services/planTrazabilidadApi';
import { useProceso } from '../../contexts/ProcesoContext';

interface AlertasNotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notif-tabpanel-${index}`}
      aria-labelledby={`notif-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function AlertasNotificationsMenuWithTabs({
  anchorEl,
  open,
  onClose,
}: AlertasNotificationsMenuProps) {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { conteo: conteoRiesgos, loading: loadingRiesgos } = useRiesgosCriticosNotifications(true);
  const { procesoSeleccionado } = useProceso();
  
  // Filtrar planes por proceso seleccionado (igual que en PlanesAccionPage)
  const { data: planesData } = useObtenerPlanesAccionQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id } : undefined
  );

  const planesPendientes = planesData?.planes?.filter(p => p.estado === 'pendiente').length || 0;
  const planesRevisados = planesData?.planes?.filter(p => p.estado === 'en_revision').length || 0;
  const alertasVencimiento = planesData?.stats?.pendientes || 0;

  const totalPlanesNotif = planesPendientes + planesRevisados;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleVerMapa = () => {
    onClose();
    navigate('/mapa');
  };

  const handleVerPlanes = (filtro?: string) => {
    onClose();
    navigate('/planes-accion', { state: { filtro } });
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
          width: 450,
          maxWidth: '90vw',
          maxHeight: 650,
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

      {/* Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontSize: '0.875rem',
          },
        }}
      >
        <Tab
          label={
            <Badge badgeContent={conteoRiesgos.total} color="error" max={99}>
              <Box sx={{ px: 1 }}>Riesgos</Box>
            </Badge>
          }
        />
        <Tab
          label={
            <Badge badgeContent={totalPlanesNotif} color="warning" max={99}>
              <Box sx={{ px: 1 }}>Planes</Box>
            </Badge>
          }
        />
        <Tab label="Todas" />
      </Tabs>

      {/* Tab Panel: Riesgos */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ maxHeight: 450, overflowY: 'auto' }}>
          {conteoRiesgos.total > 0 ? (
            <Box sx={{ p: 2 }}>
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
                  },
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
                        {conteoRiesgos.total === 1
                          ? 'Existe 1 riesgo en zona crítica'
                          : `Existen ${conteoRiesgos.total} riesgos en zona crítica`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {conteoRiesgos.inherentes > 0 && (
                          <Chip
                            label={`${conteoRiesgos.inherentes} inherente${conteoRiesgos.inherentes > 1 ? 's' : ''}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {conteoRiesgos.residuales > 0 && (
                          <Chip
                            label={`${conteoRiesgos.residuales} residual${conteoRiesgos.residuales > 1 ? 'es' : ''}`}
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
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay riesgos críticos
              </Typography>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Tab Panel: Planes */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ maxHeight: 450, overflowY: 'auto' }}>
          {/* Notificaciones de Estados */}
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
              Estados de Planes
            </Typography>
            <List disablePadding>
              {planesPendientes > 0 && (
                <ListItem
                  sx={{
                    bgcolor: 'warning.lighter',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'warning.light' },
                  }}
                  onClick={() => handleVerPlanes('pendiente')}
                >
                  <ListItemIcon>
                    <PendingIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {planesPendientes} {planesPendientes === 1 ? 'plan pendiente' : 'planes pendientes'}
                      </Typography>
                    }
                    secondary="Requieren revisión"
                  />
                  <Chip label={planesPendientes} color="warning" size="small" />
                </ListItem>
              )}

              {planesRevisados > 0 && (
                <ListItem
                  sx={{
                    bgcolor: 'info.lighter',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'info.light' },
                  }}
                  onClick={() => handleVerPlanes('en_revision')}
                >
                  <ListItemIcon>
                    <AssignmentIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={600}>
                        {planesRevisados} {planesRevisados === 1 ? 'plan revisado' : 'planes revisados'}
                      </Typography>
                    }
                    secondary="Pendientes de aprobación"
                  />
                  <Chip label={planesRevisados} color="info" size="small" />
                </ListItem>
              )}

              {planesPendientes === 0 && planesRevisados === 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Todos los planes están al día
                  </Typography>
                </Box>
              )}
            </List>
          </Box>

          <Divider />

          {/* Alertas de Vencimiento */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              Alertas de Vencimiento
            </Typography>
          </Box>
          <AlertasVencimientoPanel soloNoLeidas={true} />
        </Box>
      </TabPanel>

      {/* Tab Panel: Todas */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ maxHeight: 450, overflowY: 'auto' }}>
          {/* Riesgos Críticos */}
          {conteoRiesgos.total > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
                Riesgos Críticos
              </Typography>
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
                  },
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
                        {conteoRiesgos.total === 1
                          ? 'Existe 1 riesgo en zona crítica'
                          : `Existen ${conteoRiesgos.total} riesgos en zona crítica`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {conteoRiesgos.inherentes > 0 && (
                          <Chip
                            label={`${conteoRiesgos.inherentes} inherente${conteoRiesgos.inherentes > 1 ? 's' : ''}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {conteoRiesgos.residuales > 0 && (
                          <Chip
                            label={`${conteoRiesgos.residuales} residual${conteoRiesgos.residuales > 1 ? 'es' : ''}`}
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

          {/* Estados de Planes */}
          {totalPlanesNotif > 0 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>
                Estados de Planes
              </Typography>
              <List disablePadding>
                {planesPendientes > 0 && (
                  <ListItem
                    sx={{
                      bgcolor: 'warning.lighter',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'warning.light' },
                    }}
                    onClick={() => handleVerPlanes('pendiente')}
                  >
                    <ListItemIcon>
                      <PendingIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {planesPendientes} {planesPendientes === 1 ? 'plan pendiente' : 'planes pendientes'}
                        </Typography>
                      }
                      secondary="Requieren revisión"
                    />
                    <Chip label={planesPendientes} color="warning" size="small" />
                  </ListItem>
                )}

                {planesRevisados > 0 && (
                  <ListItem
                    sx={{
                      bgcolor: 'info.lighter',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'info.light' },
                    }}
                    onClick={() => handleVerPlanes('en_revision')}
                  >
                    <ListItemIcon>
                      <AssignmentIcon color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {planesRevisados} {planesRevisados === 1 ? 'plan revisado' : 'planes revisados'}
                        </Typography>
                      }
                      secondary="Pendientes de aprobación"
                    />
                    <Chip label={planesRevisados} color="info" size="small" />
                  </ListItem>
                )}
              </List>
            </Box>
          )}

          {/* Alertas de Vencimiento */}
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              Alertas de Vencimiento
            </Typography>
          </Box>
          <AlertasVencimientoPanel soloNoLeidas={true} />
        </Box>
      </TabPanel>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button fullWidth variant="text" size="small" onClick={() => handleVerPlanes()}>
          Ver todos los planes
        </Button>
      </Box>
    </Menu>
  );
}
