import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';

interface RecoveryCodesDisplayProps {
  codes: string[];
  onDownload?: () => void;
  showWarning?: boolean;
}

/**
 * Componente para mostrar códigos de respaldo de 2FA
 * Incluye opciones para copiar y descargar
 */
export const RecoveryCodesDisplay: React.FC<RecoveryCodesDisplayProps> = ({
  codes,
  onDownload,
  showWarning = true
}) => {
  const { showSuccess } = useNotification();
  const [isVisible, setIsVisible] = useState(true);

  const handleCopyAll = () => {
    const codesText = codes.join('\n');
    navigator.clipboard.writeText(codesText);
    showSuccess('Códigos copiados al portapapeles');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showSuccess('Código copiado');
  };

  const handleDownload = () => {
    const codesText = codes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos-respaldo-2fa-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccess('Códigos descargados');
    onDownload?.();
  };

  return (
    <Box>
      {showWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            ⚠️ Importante: Guarda estos códigos en un lugar seguro
          </Typography>
          <Typography variant="body2">
            Estos códigos te permitirán acceder a tu cuenta si pierdes tu dispositivo de autenticación.
            Cada código solo puede usarse una vez.
          </Typography>
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          backgroundColor: 'grey.50',
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Códigos de Respaldo
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isVisible ? 'Ocultar códigos' : 'Mostrar códigos'}>
              <IconButton
                size="small"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Copiar todos">
              <IconButton
                size="small"
                onClick={handleCopyAll}
                color="primary"
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Descargar">
              <IconButton
                size="small"
                onClick={handleDownload}
                color="primary"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {isVisible ? (
          <Grid container spacing={1.5}>
            {codes.map((code, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: 'grey.50'
                    }
                  }}
                >
                  <Typography
                    variant="body1"
                    fontFamily="monospace"
                    fontWeight={600}
                    sx={{ letterSpacing: 1 }}
                  >
                    {code}
                  </Typography>
                  
                  <IconButton
                    size="small"
                    onClick={() => handleCopyCode(code)}
                    sx={{ ml: 1 }}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'grey.300'
            }}
          >
            <VisibilityOffIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Códigos ocultos por seguridad
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyAll}
            size="small"
          >
            Copiar Todos
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            size="small"
          >
            Descargar
          </Button>
        </Box>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          💡 Recomendación: Imprime estos códigos o guárdalos en un gestor de contraseñas seguro.
          No los compartas con nadie y no los guardes en formato digital sin encriptar.
        </Typography>
      </Alert>
    </Box>
  );
};

export default RecoveryCodesDisplay;
