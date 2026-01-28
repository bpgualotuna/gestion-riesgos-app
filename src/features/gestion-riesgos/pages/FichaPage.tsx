/**
 * Ficha Page - Modern Design
 * Configuración inicial del proceso según análisis Excel
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon } from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';

interface FichaData {
  vicepresidencia: string;
  gerencia: string;
  subdivision: string;
  responsable: string;
  cargo: string;
  fecha: string;
  objetivoProceso: string;
}

export default function FichaPage() {
  const { showSuccess, showError } = useNotification();
  const [formData, setFormData] = useState<FichaData>({
    vicepresidencia: 'Gestión Financiera y Administrativa',
    gerencia: 'Dirección Financiera Administrativa',
    subdivision: 'Talento Humano',
    responsable: 'Katherine Chávez',
    cargo: 'Analista de Talento Humano',
    fecha: new Date().toISOString().split('T')[0],
    objetivoProceso: '',
  });

  const handleChange = (field: keyof FichaData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.vicepresidencia || !formData.gerencia || !formData.responsable) {
        showError('Por favor complete todos los campos requeridos');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      localStorage.setItem('ficha_proceso', JSON.stringify(formData));
      showSuccess('Ficha del proceso guardada exitosamente');
    } catch (error) {
      showError('Error al guardar la ficha');
    }
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          fontWeight={700}
          sx={{
            color: '#1976d2',
            fontWeight: 700,
          }}
        >
          Ficha del Proceso
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Formulario de diligenciamiento obligatorio con información básica del proceso
        </Typography>
      </Box>

      {/* Info Alert */}
      <Alert 
        icon={<InfoIcon />} 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            color: '#00BFFF',
          },
        }}
      >
        Esta información es requerida para el correcto funcionamiento del sistema de gestión de riesgos.
      </Alert>

      {/* Main Form Card */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: '#F5F5F5',
            p: 3,
            borderBottom: '2px solid #1976d2',
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Información Organizacional
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete los datos de la estructura organizacional
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vicepresidencia / Gerencia Alta"
                value={formData.vicepresidencia}
                onChange={handleChange('vicepresidencia')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Gerencia"
                value={formData.gerencia}
                onChange={handleChange('gerencia')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subdivisión"
                value={formData.subdivision}
                onChange={handleChange('subdivision')}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={formData.fecha}
                onChange={handleChange('fecha')}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Responsable del Proceso
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Responsable del Proceso"
                value={formData.responsable}
                onChange={handleChange('responsable')}
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cargo"
                value={formData.cargo}
                onChange={handleChange('cargo')}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Objetivo del Proceso
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objetivo del Proceso"
                value={formData.objetivoProceso}
                onChange={handleChange('objetivoProceso')}
                multiline
                rows={5}
                variant="outlined"
                placeholder="Describa el objetivo principal del proceso..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFormData({
                      vicepresidencia: '',
                      gerencia: '',
                      subdivision: '',
                      responsable: '',
                      cargo: '',
                      fecha: new Date().toISOString().split('T')[0],
                      objetivoProceso: '',
                    });
                  }}
                  sx={{
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    background: '#1976d2',
                    '&:hover': {
                      background: '#1565c0',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Guardar Ficha
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
