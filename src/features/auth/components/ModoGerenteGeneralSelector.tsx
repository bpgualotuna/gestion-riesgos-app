/**
 * Componente para seleccionar el modo de trabajo del Gerente General
 * Permite elegir entre modo "Procesos" o modo "Gerente"
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  BusinessCenter as BusinessCenterIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../../utils/constants';

export default function ModoGerenteGeneralSelector() {
  const navigate = useNavigate();
  const [modoSeleccionado, setModoSeleccionado] = useState<'procesos' | 'gerente' | null>(null);

  const handleSeleccionarModo = (modo: 'procesos' | 'gerente') => {
    setModoSeleccionado(modo);
    // Guardar el modo seleccionado en localStorage
    localStorage.setItem('gerenteGeneralModo', modo);
    
    if (modo === 'procesos') {
      navigate(ROUTES.PROCESOS_GERENTE_GENERAL);
    } else {
      navigate(ROUTES.DASHBOARD_GERENTE_GENERAL);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 800,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ mb: 1, textAlign: 'center', color: '#424242' }}
          >
            Seleccione el Modo de Trabajo
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, textAlign: 'center', color: '#757575' }}
          >
            Elija cómo desea acceder al sistema
          </Typography>

          <Grid2 container spacing={3}>
            {/* Modo Procesos */}
            <Grid2 xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: modoSeleccionado === 'procesos' ? '3px solid #1976d2' : '2px solid #e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    borderColor: '#1976d2',
                  },
                }}
                onClick={() => handleSeleccionarModo('procesos')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <BusinessCenterIcon sx={{ fontSize: 64, color: '#1976d2' }} />
                  <Typography variant="h5" fontWeight={600} sx={{ color: '#424242' }}>
                    Modo Procesos
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#757575' }}>
                    Gestione procesos de tipo gerencial. Similar al dueño de procesos, pero solo para procesos gerenciales.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeleccionarModo('procesos');
                    }}
                  >
                    Acceder a Procesos
                  </Button>
                </Box>
              </Paper>
            </Grid2>

            {/* Modo Gerente */}
            <Grid2 xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: modoSeleccionado === 'gerente' ? '3px solid #1976d2' : '2px solid #e0e0e0',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    borderColor: '#1976d2',
                  },
                }}
                onClick={() => handleSeleccionarModo('gerente')}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <DashboardIcon sx={{ fontSize: 64, color: '#1976d2' }} />
                  <Typography variant="h5" fontWeight={600} sx={{ color: '#424242' }}>
                    Modo Gerente
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#757575' }}>
                    Visualice un resumen gerencial de todos los procesos y áreas de la empresa.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeleccionarModo('gerente');
                    }}
                  >
                    Ver Resumen Gerencial
                  </Button>
                </Box>
              </Paper>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>
    </Box>
  );
}

