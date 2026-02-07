/**
 * Componente para mostrar estadísticas de incidencias
 * Extraído para mejorar escalabilidad
 */

import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { ReportProblem as ReportProblemIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../shared/utils/constants';

interface IncidenciasCardProps {
  total: number;
}

export default function IncidenciasCard({ total }: IncidenciasCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        border: '1px solid #e0e0e0',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <ReportProblemIcon sx={{ fontSize: 48, color: '#f44336', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1, color: '#424242' }}>
          {total}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: '#757575', textAlign: 'center' }}>
          Incidencias Registradas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(ROUTES.INCIDENCIAS)}
          sx={{ mt: 1 }}
        >
          Ver Todas las Incidencias
        </Button>
      </CardContent>
    </Card>
  );
}

