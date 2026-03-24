import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

/**
 * Página de administración de 2FA - Versión Simple para Testing
 */
export const TwoFactorAdminPageSimple: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" fontWeight={600}>
          Autenticación de Dos Factores (2FA)
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Página de configuración 2FA cargada correctamente.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Esta es una versión simplificada para testing. Si ves este mensaje, 
          el problema está en el componente completo TwoFactorAdminPage.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TwoFactorAdminPageSimple;
