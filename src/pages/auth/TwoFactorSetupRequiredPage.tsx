import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container
} from '@mui/material';
import {
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página que se muestra cuando el administrador ha habilitado 2FA globalmente
 * y el usuario debe configurarlo antes de continuar
 */
export const TwoFactorSetupRequiredPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [setupComplete, setSetupComplete] = useState(false);

  const email = location.state?.email || '';
  const obligatorio = location.state?.obligatorio || false;

  const handleSetupComplete = () => {
    setSetupComplete(true);
    // Redirigir al login para que el usuario inicie sesión con 2FA
    setTimeout(() => {
      navigate('/login', { 
        state: { 
          message: '2FA configurado exitosamente. Por favor, inicia sesión nuevamente.' 
        } 
      });
    }, 2000);
  };

  const handleCancel = () => {
    if (obligatorio) {
      // Si es obligatorio, cerrar sesión
      logout();
      navigate('/login', { 
        state: { 
          message: '2FA es obligatorio. Debes configurarlo para acceder al sistema.' 
        } 
      });
    } else {
      // Si no es obligatorio, permitir continuar
      navigate('/login');
    }
  };

  if (setupComplete) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <SecurityIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              ¡2FA Configurado!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Redirigiendo al login...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600}>
              Configurar Autenticación 2FA
            </Typography>
          </Box>

          <Alert severity={obligatorio ? 'warning' : 'info'} sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              {obligatorio 
                ? '⚠️ 2FA es obligatorio' 
                : 'ℹ️ 2FA está habilitado'}
            </Typography>
            <Typography variant="body2">
              {obligatorio
                ? 'El administrador ha habilitado 2FA como obligatorio. Debes configurarlo para acceder al sistema.'
                : 'El administrador ha habilitado 2FA. Te recomendamos configurarlo para mayor seguridad.'}
            </Typography>
          </Alert>

          <TwoFactorSetup
            onComplete={handleSetupComplete}
            onCancel={handleCancel}
          />

          {!obligatorio && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleCancel}
                color="inherit"
              >
                Configurar más tarde
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default TwoFactorSetupRequiredPage;
