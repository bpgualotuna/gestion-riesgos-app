/**
 * Análisis de Proceso Page - Modern Design
 * Documentación del análisis del proceso según análisis Excel
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Upload as UploadIcon,
  Description as DescriptionIcon,
  AccountTree as AccountTreeIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';
import { useProceso } from '../../../contexts/ProcesoContext';
import { Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';

export default function AnalisisProcesoPage() {
  const { showSuccess } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [descripcion, setDescripcion] = useState(
    'El proceso de Gestión de Talento Humano comprende todas las actividades relacionadas con la administración, desarrollo y retención del capital humano de la organización...'
  );

  useEffect(() => {
    const saved = localStorage.getItem('analisis_proceso');
    if (saved) {
      const data = JSON.parse(saved);
      setDescripcion(data.descripcion || '');
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('analisis_proceso', JSON.stringify({ descripcion }));
    showSuccess('Análisis de proceso guardado exitosamente');
  };

  const instrucciones = [
    'Diagramas de proceso',
    'Descripción de actividades',
    'Flujos de trabajo',
    'Interacciones entre áreas',
    'Puntos de control',
    'Indicadores de desempeño',
  ];

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography 
              variant="h4" 
              gutterBottom 
              fontWeight={700}
              sx={{
                color: '#1976d2',
                fontWeight: 700,
              }}
            >
              Análisis de Proceso
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Documentación del análisis del proceso mediante diagramas y descripciones
            </Typography>
          </Box>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        {isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Está en modo visualización. Solo puede ver la información.
          </Alert>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Instructions Card */}
        <Box>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: '#F5F5F5',
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccountTreeIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Instrucciones
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" paragraph color="text.secondary">
                En esta sección debe documentar el análisis detallado del proceso, incluyendo:
              </Typography>
              <List dense>
                {instrucciones.map((item, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Chip
                        label={index + 1}
                        size="small"
                        sx={{
                          background: '#1976d2',
                          color: '#fff',
                          fontWeight: 600,
                          width: 24,
                          height: 24,
                          fontSize: '0.75rem',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontSize: '0.875rem',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Main Editor Card */}
        <Box>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              sx={{
                background: '#F5F5F5',
                p: 2.5,
                borderBottom: '2px solid #1976d2',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <DescriptionIcon sx={{ color: '#C8D900', fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Documentación del Proceso
                </Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Descripción del Proceso"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={isReadOnly}
                    multiline
                    rows={15}
                    variant="outlined"
                    placeholder="Describa el proceso de Talento Humano, sus actividades principales, flujos de trabajo, interacciones con otras áreas, puntos de control, etc."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: 'rgba(255, 165, 0, 0.05)',
                      border: '1px dashed',
                      borderColor: '#FFA500',
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <SettingsIcon sx={{ color: '#FFA500', mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Nota Importante
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Puede adjuntar diagramas y archivos adicionales usando el botón de carga. 
                          Los archivos soportados son: PDF, PNG, JPG, DOCX.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>

                {!isReadOnly && (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          borderColor: '#C8D900',
                          color: '#C8D900',
                          '&:hover': {
                            borderColor: '#B8C800',
                            backgroundColor: 'rgba(200, 217, 0, 0.08)',
                          },
                        }}
                      >
                        Adjuntar Archivos
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
                        Guardar Análisis
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
