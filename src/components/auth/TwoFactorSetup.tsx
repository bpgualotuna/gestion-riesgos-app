import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  CheckCircle as CheckIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import TwoFactorInput from './TwoFactorInput';
import RecoveryCodesDisplay from './RecoveryCodesDisplay';
import axios from 'axios';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface SetupData {
  secret: string;
  qrCodeUrl: string;
}

/**
 * Componente para configurar 2FA paso a paso
 * 1. Mostrar código QR
 * 2. Verificar código inicial
 * 3. Mostrar códigos de respaldo
 */
export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  onComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState(false);

  const steps = [
    'Escanear código QR',
    'Verificar código',
    'Guardar códigos de respaldo'
  ];

  // Paso 1: Obtener QR code
  useEffect(() => {
    const initSetup = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.post('/api/auth/2fa/setup');
        setSetupData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al iniciar configuración de 2FA');
      } finally {
        setLoading(false);
      }
    };

    initSetup();
  }, []);

  // Paso 2: Verificar código
  const handleVerifyCode = async (code: string) => {
    setLoading(true);
    setVerificationError(false);
    setError('');

    try {
      const response = await axios.post('/api/auth/2fa/verify-setup', {
        token: code
      });

      setRecoveryCodes(response.data.recoveryCodes);
      setActiveStep(2);
    } catch (err: any) {
      setVerificationError(true);
      setError(err.response?.data?.error || 'Código incorrecto');
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (code: string) => {
    setVerificationCode(code);
    setVerificationError(false);
    setError('');
  };

  const handleFinish = () => {
    onComplete();
  };

  if (loading && !setupData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !setupData) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={onCancel} sx={{ mt: 1 }}>
          Volver
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Paso 1: Escanear QR */}
      {activeStep === 0 && setupData && (
        <Box>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              backgroundColor: 'grey.50'
            }}
          >
            <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Configura Google Authenticator
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Escanea este código QR con la aplicación Google Authenticator en tu dispositivo móvil
            </Typography>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3
              }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 2
                }}
              >
                <img
                  src={setupData.qrCodeUrl}
                  alt="QR Code para 2FA"
                  style={{
                    width: 200,
                    height: 200,
                    display: 'block'
                  }}
                />
              </Paper>
            </Box>

            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ¿No tienes Google Authenticator?
              </Typography>
              <Typography variant="body2">
                Descárgalo desde:
              </Typography>
              <Typography variant="body2">
                • iOS: App Store
              </Typography>
              <Typography variant="body2">
                • Android: Google Play Store
              </Typography>
            </Alert>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Código secreto (manual): <code>{setupData.secret}</code>
            </Typography>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={onCancel} variant="outlined">
              Cancelar
            </Button>
            <Button
              onClick={() => setActiveStep(1)}
              variant="contained"
              endIcon={<QrCodeIcon />}
            >
              Ya escaneé el código
            </Button>
          </Box>
        </Box>
      )}

      {/* Paso 2: Verificar código */}
      {activeStep === 1 && (
        <Box>
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'grey.50'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Verifica tu configuración
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Ingresa el código de 6 dígitos que aparece en Google Authenticator
            </Typography>

            <TwoFactorInput
              onComplete={handleVerifyCode}
              onCodeChange={handleCodeChange}
              error={verificationError}
              helperText={error || 'Ingresa el código de 6 dígitos'}
              disabled={loading}
              autoFocus
            />

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={() => setActiveStep(0)} variant="outlined" disabled={loading}>
              Volver
            </Button>
          </Box>
        </Box>
      )}

      {/* Paso 3: Códigos de respaldo */}
      {activeStep === 2 && recoveryCodes.length > 0 && (
        <Box>
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600}>
              ✅ ¡2FA activado correctamente!
            </Typography>
            <Typography variant="body2">
              Ahora tu cuenta está protegida con autenticación de dos factores.
            </Typography>
          </Alert>

          <RecoveryCodesDisplay
            codes={recoveryCodes}
            showWarning
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
            <Button
              onClick={handleFinish}
              variant="contained"
              endIcon={<CheckIcon />}
              size="large"
            >
              Finalizar
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TwoFactorSetup;
