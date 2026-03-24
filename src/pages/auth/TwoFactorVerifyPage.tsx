import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Security as SecurityIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import TwoFactorInput from '../../components/auth/TwoFactorInput';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Página de verificación de 2FA durante el login
 * Se muestra después de ingresar email y contraseña correctamente
 */
export const TwoFactorVerifyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleVerifyCode = async (inputCode: string) => {
    setLoading(true);
    setError('');

    try {
      // 1. Verificar código 2FA
      await axios.post('/api/auth/2fa/verify-login', {
        email,
        token: inputCode,
        trustDevice
      });

      // 2. Completar login y obtener token
      const response = await axios.post('/api/auth/complete-2fa-login', {
        email
      });

      // 3. Guardar token y usuario en contexto
      if (response.data.success && response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRecoveryCode = async () => {
    if (!recoveryCode.trim()) {
      setError('Ingresa un código de respaldo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Verificar código de respaldo
      await axios.post('/api/auth/2fa/verify-login', {
        email,
        token: recoveryCode.trim().toUpperCase(),
        trustDevice
      });

      // 2. Completar login
      const response = await axios.post('/api/auth/complete-2fa-login', {
        email
      });

      if (response.data.success && response.data.token) {
        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código de respaldo incorrecto');
      setRecoveryCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/login');
  };

  return (
    <Container maxWidth="sm">
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
            width: '100%',
            maxWidth: 500
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Verificación de Dos Factores
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              Ingresa el código de 6 dígitos desde Google Authenticator
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!showRecoveryInput ? (
            <>
              <Box sx={{ mb: 3 }}>
                <TwoFactorInput
                  onComplete={handleVerifyCode}
                  onCodeChange={setCode}
                  error={!!error}
                  disabled={loading}
                  autoFocus
                />
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    Confiar en este dispositivo por 30 días
                  </Typography>
                }
                sx={{ mb: 2 }}
              />

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => setShowRecoveryInput(true)}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                >
                  ¿Perdiste tu dispositivo? Usa un código de respaldo
                </Link>
              </Box>
            </>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Ingresa uno de tus códigos de respaldo (formato: XXXX-XXXX)
                </Typography>
              </Alert>

              <Box sx={{ mb: 3 }}>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="XXXX-XXXX"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    textAlign: 'center',
                    border: '2px solid #1976d2',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyRecoveryCode();
                    }
                  }}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyRecoveryCode}
                disabled={loading || !recoveryCode.trim()}
                sx={{ mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Verificar Código de Respaldo'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setShowRecoveryInput(false);
                    setRecoveryCode('');
                    setError('');
                  }}
                  disabled={loading}
                  sx={{ cursor: 'pointer' }}
                >
                  Volver a código de 6 dígitos
                </Link>
              </Box>
            </>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBack}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Volver al Login
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default TwoFactorVerifyPage;
