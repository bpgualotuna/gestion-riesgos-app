import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useNotification } from '../../hooks/useNotification';

interface User2FA {
  id: number;
  nombre: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
  backupCodesUsed: number;
}

interface GlobalConfig {
  habilitado: boolean;
  obligatorio: boolean;
}

/**
 * Página de administración de 2FA
 * Solo accesible para administradores
 */
export const TwoFactorAdminPage: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GlobalConfig>({ habilitado: false, obligatorio: false });
  const [users, setUsers] = useState<User2FA[]>([]);
  const [selectedUser, setSelectedUser] = useState<User2FA | null>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Cargando configuración 2FA...');
      
      const configRes = await axios.get('/api/admin/2fa/config');
      console.log('Configuración recibida:', configRes.data);
      
      const usersRes = await axios.get('/api/admin/2fa/users');
      console.log('Usuarios recibidos:', usersRes.data);

      setConfig(configRes.data);
      setUsers(usersRes.data.usuarios || []);
    } catch (err: any) {
      console.error('Error al cargar datos 2FA:', err);
      console.error('Respuesta del error:', err.response);
      showError(err.response?.data?.error || err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHabilitado = async (checked: boolean) => {
    try {
      await axios.put('/api/admin/2fa/config', {
        habilitado: checked
      });

      setConfig({ ...config, habilitado: checked });
      showSuccess(checked ? '2FA habilitado para todos los usuarios' : '2FA deshabilitado globalmente');
      
      if (checked) {
        loadData(); // Recargar para ver usuarios que necesitan configurar
      }
    } catch (err: any) {
      showError(err.response?.data?.error || 'Error al actualizar configuración');
    }
  };

  const handleToggleObligatorio = async (checked: boolean) => {
    try {
      await axios.put('/api/admin/2fa/config', {
        obligatorio: checked
      });

      setConfig({ ...config, obligatorio: checked });
      showSuccess(checked ? '2FA ahora es obligatorio' : '2FA ya no es obligatorio');
    } catch (err: any) {
      showError(err.response?.data?.error || 'Error al actualizar configuración');
    }
  };

  const handleDisable2FA = async () => {
    if (!selectedUser) return;

    try {
      await axios.post(`/api/admin/2fa/force-disable/${selectedUser.id}`, {
        razon: disableReason
      });

      showSuccess(`2FA desactivado para ${selectedUser.nombre}`);
      setDisableDialogOpen(false);
      setSelectedUser(null);
      setDisableReason('');
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.error || 'Error al desactivar 2FA');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={600}>
          Autenticación de Dos Factores (2FA)
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          ℹ️ Información importante
        </Typography>
        <Typography variant="body2">
          • El administrador NO requiere 2FA (excepción de seguridad)
        </Typography>
        <Typography variant="body2">
          • Cuando habilitas 2FA, todos los usuarios deben configurarlo en su primer login
        </Typography>
        <Typography variant="body2">
          • Los usuarios usarán Google Authenticator para generar códigos
        </Typography>
      </Alert>

      {/* Configuración Global */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Configuración Global
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.habilitado}
                onChange={(e) => handleToggleHabilitado(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Habilitar 2FA para todos los usuarios
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Los usuarios deberán configurar Google Authenticator en su próximo login
                </Typography>
              </Box>
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.obligatorio}
                onChange={(e) => handleToggleObligatorio(e.target.checked)}
                disabled={!config.habilitado}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  Hacer 2FA obligatorio
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Los usuarios no podrán acceder sin configurar 2FA
                </Typography>
              </Box>
            }
          />
        </Box>

        {config.habilitado && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✅ 2FA está habilitado. Los usuarios verán un mensaje para configurarlo.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Lista de Usuarios con 2FA */}
      {config.habilitado && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Usuarios con 2FA Configurado
          </Typography>

          {users.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Ningún usuario ha configurado 2FA aún. Los usuarios deben configurarlo en su próximo login.
            </Alert>
          ) : (
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Rol</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Códigos de Respaldo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Chip
                            icon={<CheckIcon />}
                            label="Activo"
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<WarningIcon />}
                            label="Pendiente"
                            color="warning"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? (
                          <Typography variant="body2">
                            {user.backupCodesRemaining} disponibles / {user.backupCodesUsed} usados
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {user.twoFactorEnabled && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedUser(user);
                              setDisableDialogOpen(true);
                            }}
                          >
                            Desactivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Dialog para desactivar 2FA */}
      <Dialog open={disableDialogOpen} onClose={() => setDisableDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Desactivar 2FA para {selectedUser?.nombre}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta acción desactivará 2FA para este usuario. El usuario deberá configurarlo nuevamente.
          </Alert>

          <TextField
            fullWidth
            label="Razón (opcional)"
            multiline
            rows={3}
            value={disableReason}
            onChange={(e) => setDisableReason(e.target.value)}
            placeholder="Ej: Usuario perdió su dispositivo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDisableDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDisable2FA} color="error" variant="contained">
            Desactivar 2FA
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TwoFactorAdminPage;
