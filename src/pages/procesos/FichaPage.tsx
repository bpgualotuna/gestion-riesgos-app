import React from 'react';
import { Box, Card, CardContent, Typography, Alert, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function FichaPage() {
  return (
    <Box>
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="h6">
              Ficha del Proceso
            </Typography>
            <Typography variant="body2">
              Página de ficha del proceso - En desarrollo
            </Typography>
          </Alert>
          <Button
            variant="outlined"
            startIcon={<DashboardIcon />}
            sx={{ mt: 2 }}
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
