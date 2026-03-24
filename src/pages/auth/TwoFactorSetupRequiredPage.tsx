import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import {
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import TwoFactorSetup from '../../components/auth/TwoFactorSetup';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

/**
 * Página para configurar 2FA cuando es obligatorio
 * Se muestra cuando el admin ha habilitado 2FA globalmente
 */
export const TwoFactorSetupRequiredPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email || '';
  const obligatorio = location.state?.obligatorio || false;

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleSetupComplete = async () => {
    try {
      // Completar login después de configurar 2FA
      const response = await axios.post('/api/auth/complete-2fa-login', {
        email
      });

      if (response.data.success && response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error al completar login:', err);
      navigate('/login');
    }
  };

  const handleCancel = () => {
    if (obligatorio) {
      // Si es obligatorio, no puede cancelar, debe volver al login
      navigate('/login');
    } else {
      // Si no es obligatorio, puede omitirlo por ahora
      handleSetupComplete();
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%'
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Configuración de Seguridad Requerida
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              El administrador ha habilitado la autenticación de dos factores (2FA) para mayor seguridad
            </Typography>
          </Box>

          {obligatorio ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight={600}>
                ⚠️ Configuración Obligatoria
              </Typography>
              <Typography variant="body2">
                Debes configurar 2FA para poder acceder al sistema. No podrás continuar sin completar este paso.
              </Typography>
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                ℹ️ Se recomienda configurar 2FA para proteger tu cuenta. Puedes omitirlo por ahora, pero se te pedirá nuevamente en el futuro.
              </Typography>
            </Alert>
          )}

          <TwoFactorSetup
            onComplete={handleSetupComplete}
            onCancel={handleCancel}
          />
        </Paper>
      </Box>
    </Container>
  );
};

export default TwoFactorSetupRequiredPage;
