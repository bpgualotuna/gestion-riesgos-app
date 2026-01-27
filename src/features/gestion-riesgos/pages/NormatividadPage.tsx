/**
 * Normatividad Page
 * Manage regulatory compliance
 */

import { Box, Typography } from '@mui/material';

export default function NormatividadPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Normatividad
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Gestión de cumplimiento normativo y regulatorio
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Esta funcionalidad estará disponible próximamente.
        </Typography>
      </Box>
    </Box>
  );
}
