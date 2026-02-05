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
  Alert,
  Paper,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon, Info as InfoIcon, Edit as EditIcon, Visibility as VisibilityIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNotification } from '../../../../shared/hooks/useNotification';
import { useProceso } from '../../../../contexts/ProcesoContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useUpdateProcesoMutation, useGetProcesosQuery } from '../../api/riesgosApi';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../shared/utils/constants';

interface FichaData {
  vicepresidencia: string;
  gerencia: string;
  area: string;
  responsable: string;
  encargado: string; // Quién está a cargo del proceso
  fechaCreacion: string;
  objetivoProceso: string;
}

export default function FichaPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, iniciarModoEditar, iniciarModoVisualizar } = useProceso();
  const { esAdmin, esDueñoProcesos, user } = useAuth();
  const [updateProceso] = useUpdateProcesoMutation();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const navigate = useNavigate();
  
  // La ficha es del proceso, solo depende del modo del proceso
  const isReadOnly = modoProceso === 'visualizar';
  const isEditMode = modoProceso === 'editar';
  
  // Solo admin puede editar información organizacional
  const puedeEditarInfoOrganizacional = esAdmin && isEditMode;
  const puedeEditarFechaCreacion = esAdmin && isEditMode;

  // Cargar datos del proceso seleccionado
  const [formData, setFormData] = useState<FichaData>(() => {
    if (procesoSeleccionado) {
      return {
        vicepresidencia: procesoSeleccionado.vicepresidencia || '',
        gerencia: procesoSeleccionado.gerencia || '',
        area: procesoSeleccionado.areaNombre || '',
        responsable: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
        encargado: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
        fechaCreacion: procesoSeleccionado.createdAt ? new Date(procesoSeleccionado.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        objetivoProceso: procesoSeleccionado.objetivoProceso || '',
      };
    }
    return {
      vicepresidencia: '',
      gerencia: '',
      area: '',
      responsable: '',
      encargado: '',
      fechaCreacion: new Date().toISOString().split('T')[0],
      objetivoProceso: '',
    };
  });

  // Actualizar formData cuando cambie el proceso seleccionado
  useEffect(() => {
    if (procesoSeleccionado) {
      setFormData({
        vicepresidencia: procesoSeleccionado.vicepresidencia || '',
        gerencia: procesoSeleccionado.gerencia || '',
        area: procesoSeleccionado.areaNombre || '',
        responsable: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
        encargado: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
        fechaCreacion: procesoSeleccionado.createdAt ? new Date(procesoSeleccionado.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        objetivoProceso: procesoSeleccionado.objetivoProceso || '',
      });
    }
  }, [procesoSeleccionado]);

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
      if (!procesoSeleccionado) {
        showError('Debe seleccionar un proceso');
        return;
      }

      if (!formData.objetivoProceso.trim()) {
        showError('El objetivo del proceso es requerido');
        return;
      }

      // Actualizar solo los campos editables
      await updateProceso({
        id: procesoSeleccionado.id,
        objetivoProceso: formData.objetivoProceso,
        // Solo admin puede actualizar información organizacional
        ...(puedeEditarInfoOrganizacional && {
          vicepresidencia: formData.vicepresidencia,
          gerencia: formData.gerencia,
          responsable: formData.responsable,
          responsableNombre: formData.encargado,
        }),
      }).unwrap();

      showSuccess('Ficha del proceso guardada exitosamente');
    } catch (error: any) {
      showError(error?.data?.message || 'Error al guardar la ficha');
    }
  };

  // Filtrar procesos según el rol del usuario
  const procesosDisponibles = useMemo(() => {
    if (esAdmin) {
      return procesos;
    } else if (esDueñoProcesos && user) {
      return procesos.filter((p) => p.responsableId === user.id);
    }
    return procesos;
  }, [procesos, esAdmin, esDueñoProcesos, user]);

  // Verificar si hay proceso seleccionado
  if (!procesoSeleccionado) {
    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Alert 
              severity="info" 
              icon={<DashboardIcon />}
              sx={{ mb: 3 }}
            >
              <Typography variant="h6" gutterBottom>
                Seleccione un proceso
              </Typography>
              <Typography variant="body2">
                Para ver o editar la ficha de un proceso, primero debe seleccionarlo.
              </Typography>
            </Alert>

            {loadingProcesos ? (
              <Typography variant="body2" color="text.secondary">
                Cargando procesos...
              </Typography>
            ) : procesosDisponibles.length === 0 ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  No tiene procesos asignados
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {esDueñoProcesos 
                    ? 'Contacte al administrador para que le asigne procesos, o vaya al Dashboard para crear uno nuevo.'
                    : 'No hay procesos disponibles para seleccionar.'}
                </Typography>
                {esDueñoProcesos && (
                  <Button
                    variant="contained"
                    startIcon={<DashboardIcon />}
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                    sx={{ mt: 1 }}
                  >
                    Ir al Dashboard
                  </Button>
                )}
              </Alert>
            ) : (
              <Box>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Seleccionar Proceso</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      const procesoId = e.target.value as string;
                      const proceso = procesosDisponibles.find((p) => p.id === procesoId);
                      if (proceso) {
                        setProcesoSeleccionado(proceso);
                        // Por defecto, iniciar en modo visualización
                        iniciarModoVisualizar();
                        showSuccess(`Proceso "${proceso.nombre}" seleccionado`);
                      }
                    }}
                    label="Seleccionar Proceso"
                  >
                    {procesosDisponibles.map((proceso) => (
                      <MenuItem key={proceso.id} value={proceso.id}>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {proceso.nombre}
                          </Typography>
                          {proceso.areaNombre && (
                            <Typography variant="caption" color="text.secondary">
                              Área: {proceso.areaNombre}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                  fullWidth
                >
                  Ver todos los procesos en el Dashboard
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
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
              Ficha del Proceso
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Formulario de diligenciamiento obligatorio con información básica del proceso
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
          {isEditMode && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        {isReadOnly && modoProceso === 'visualizar' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Está en modo visualización. Solo puede ver la información. Para editar, seleccione el proceso en modo "Editar" desde el Dashboard.
          </Alert>
        )}
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            <Box>
              <TextField
                fullWidth
                label="Vicepresidencia / Gerencia Alta"
                value={formData.vicepresidencia}
                onChange={handleChange('vicepresidencia')}
                required
                disabled={!puedeEditarInfoOrganizacional}
                variant="outlined"
                helperText={!puedeEditarInfoOrganizacional ? 'Solo el administrador puede editar este campo' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Gerencia"
                value={formData.gerencia}
                onChange={handleChange('gerencia')}
                required
                disabled={!puedeEditarInfoOrganizacional}
                variant="outlined"
                helperText={!puedeEditarInfoOrganizacional ? 'Solo el administrador puede editar este campo' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Área"
                value={formData.area}
                disabled={true}
                variant="outlined"
                helperText="Asignada por el administrador"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Responsable del Proceso"
                value={formData.responsable}
                disabled={true}
                variant="outlined"
                helperText="Asignado por el administrador"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Fecha de Creación"
                type="date"
                value={formData.fechaCreacion}
                onChange={handleChange('fechaCreacion')}
                InputLabelProps={{ shrink: true }}
                disabled={!puedeEditarFechaCreacion}
                variant="outlined"
                helperText={!puedeEditarFechaCreacion ? 'Solo el administrador puede editar este campo' : ''}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Divider sx={{ my: 2 }} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quién está a cargo del Proceso
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puede modificar quién está a cargo del proceso
              </Typography>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Quién está a cargo del Proceso"
                value={formData.encargado}
                onChange={handleChange('encargado')}
                required
                disabled={isReadOnly}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Divider sx={{ my: 2 }} />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Objetivo del Proceso
              </Typography>
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                label="Objetivo del Proceso"
                value={formData.objetivoProceso}
                onChange={handleChange('objetivoProceso')}
                multiline
                rows={5}
                disabled={isReadOnly}
                variant="outlined"
                placeholder="Describa el objetivo principal del proceso..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {!isReadOnly && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (procesoSeleccionado) {
                        setFormData({
                          vicepresidencia: procesoSeleccionado.vicepresidencia || '',
                          gerencia: procesoSeleccionado.gerencia || '',
                          area: procesoSeleccionado.areaNombre || '',
                          responsable: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
                          encargado: procesoSeleccionado.responsableNombre || procesoSeleccionado.responsable || '',
                          fechaCreacion: procesoSeleccionado.createdAt ? new Date(procesoSeleccionado.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                          objetivoProceso: procesoSeleccionado.objetivoProceso || '',
                        });
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                    }}
                  >
                    Restaurar
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
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
