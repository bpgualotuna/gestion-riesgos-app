import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import Grid2 from '../../utils/Grid2';
import {
  useGetCalificacionInherenteActivaQuery,
  useUpdateCalificacionInherenteMutation,
  useGetNivelesRiesgoQuery,
} from '../../api/services/riesgosApi';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import LoadingActionButton from '../../components/ui/LoadingActionButton';
import { useNotification } from '../../hooks/useNotification';
import { invalidarCache, getConfigActiva } from '../../services/calificacionInherenteService';
import { useAuth } from '../../contexts/AuthContext';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import {
  NIVEL_ALTO_BG,
  NIVEL_BAJO_BG,
  NIVEL_CRITICO_BG,
  NIVEL_MEDIO_BG,
} from '../../utils/paletaSemafotoCWR';

export default function CalificacionInherentePage() {
  const { puedeEditar } = useAuth();
  const canEdit = puedeEditar !== false;
  const { showSuccess, showError } = useNotification();
  const { data: config, isLoading, refetch } = useGetCalificacionInherenteActivaQuery();
  const { data: niveles } = useGetNivelesRiesgoQuery();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateCalificacionInherenteMutation();

  // Función para obtener el color de un nivel desde la configuración del mapa
  const getColorNivel = (nivelNombre: string): string => {
    if (!niveles || niveles.length === 0) {
      // Fallback a colores por defecto
      const coloresDefault: Record<string, string> = {
        Crítico: NIVEL_CRITICO_BG,
        Alto: NIVEL_ALTO_BG,
        Medio: NIVEL_MEDIO_BG,
        Bajo: NIVEL_BAJO_BG,
      };
      return coloresDefault[nivelNombre] || '#666';
    }

    // Buscar el nivel por nombre (case insensitive)
    const nivel = niveles.find((n: any) => 
      n.nombre?.toUpperCase() === nivelNombre.toUpperCase() ||
      n.nombre?.toUpperCase().includes('CRITICO') && nivelNombre.toUpperCase().includes('CRITICO') ||
      n.nombre?.toUpperCase().includes('ALTO') && nivelNombre.toUpperCase().includes('ALTO') ||
      n.nombre?.toUpperCase().includes('MEDIO') && nivelNombre.toUpperCase().includes('MEDIO') ||
      n.nombre?.toUpperCase().includes('BAJO') && nivelNombre.toUpperCase().includes('BAJO')
    );

    return nivel?.color || '#666';
  };

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true,
    formulaBase: {
      tipoOperacion: 'multiplicacion',
      campos: [] as Array<{ tabla: string; campo: string; tipo: string }>,
    },
    excepciones: [] as Array<{
      id?: number;
      condiciones: Record<string, number>;
      resultado: number;
      prioridad: number;
      activa: boolean;
    }>,
    rangos: [] as Array<{
      id?: number;
      nivelNombre: string;
      valorMinimo: number;
      valorMaximo: number;
      incluirMinimo: boolean;
      incluirMaximo: boolean;
      orden: number;
      activo: boolean;
    }>,
    reglaAgregacion: {
      tipoAgregacion: 'maximo',
      tablaOrigen: 'CausaRiesgo',
      campoOrigen: 'calificacionInherente',
    },
  });

  const [initialFormData, setInitialFormData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar cambios en el formulario
  const hasFormChanges = useFormChanges(initialFormData, formData, {
    deepCompare: true,
  });

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasFormChanges && canEdit,
    message: 'Tiene cambios sin guardar en la configuración de calificación inherente.',
    disabled: !canEdit,
  });

  const [excepcionDialog, setExcepcionDialog] = useState(false);
  const [excepcionEditando, setExcepcionEditando] = useState<number | null>(null);
  const [excepcionTemp, setExcepcionTemp] = useState({
    frecuencia: 2,
    calificacionGlobalImpacto: 2,
    resultado: 3.99,
    prioridad: 1,
    activa: true,
  });

  useEffect(() => {
    if (config) {
      const newData = {
        nombre: config.nombre || '',
        descripcion: config.descripcion || '',
        activa: config.activa ?? true,
        formulaBase: config.formulaBase ? {
          tipoOperacion: config.formulaBase.tipoOperacion || 'multiplicacion',
          campos: Array.isArray(config.formulaBase.campos) ? config.formulaBase.campos : [],
        } : {
          tipoOperacion: 'multiplicacion',
          campos: [],
        },
        excepciones: config.excepciones || [],
        rangos: config.rangos || [],
        reglaAgregacion: config.reglaAgregacion || {
          tipoAgregacion: 'maximo',
          tablaOrigen: 'CausaRiesgo',
          campoOrigen: 'calificacionInherente',
        },
      };
      setFormData(newData);
      setInitialFormData(newData);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      if (!config?.id) {
        showError('No hay configuración para actualizar');
        return;
      }

      setIsSaving(true);
      await updateConfig({
        id: config.id,
        ...formData,
      }).unwrap();

      invalidarCache(); // Invalidar cache para que se recargue la configuración
      await refetch(); // Esperar a que se recargue la configuración
      
      // Forzar recarga de la configuración en el servicio
      await getConfigActiva(); // Recargar configuración en el cache
      
      // Disparar evento para que otras páginas recarguen la configuración
      // Usar un pequeño delay para asegurar que el backend haya procesado la actualización
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('calificacion-inherente-updated', { 
          detail: { timestamp: Date.now() } 
        }));
      }, 100);
      
      setInitialFormData(formData);
      markAsSaved();
      showSuccess('Configuración guardada exitosamente. Los cambios se aplicarán inmediatamente.');
    } catch (error: any) {
      showError(error?.data?.error || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    await handleSave();
    if (!isSaving) {
      forceNavigate();
    }
  };

  const handleDiscardChanges = () => {
    setFormData(initialFormData);
    forceNavigate();
  };

  const handleAgregarExcepcion = () => {
    const nuevaExcepcion = {
      condiciones: {
        frecuencia: excepcionTemp.frecuencia,
        calificacionGlobalImpacto: excepcionTemp.calificacionGlobalImpacto,
      },
      resultado: excepcionTemp.resultado,
      prioridad: excepcionTemp.prioridad,
      activa: excepcionTemp.activa,
    };

    if (excepcionEditando !== null) {
      const nuevas = [...formData.excepciones];
      nuevas[excepcionEditando] = nuevaExcepcion;
      setFormData({ ...formData, excepciones: nuevas });
    } else {
      setFormData({
        ...formData,
        excepciones: [...formData.excepciones, nuevaExcepcion],
      });
    }

    setExcepcionDialog(false);
    setExcepcionEditando(null);
    setExcepcionTemp({
      frecuencia: 2,
      calificacionGlobalImpacto: 2,
      resultado: 3.99,
      prioridad: 1,
      activa: true,
    });
  };

  const handleEliminarExcepcion = (index: number) => {
    const nuevas = formData.excepciones.filter((_, i) => i !== index);
    setFormData({ ...formData, excepciones: nuevas });
  };

  const handleEditarExcepcion = (index: number) => {
    const exc = formData.excepciones[index];
    setExcepcionTemp({
      frecuencia: exc.condiciones.frecuencia || 2,
      calificacionGlobalImpacto: exc.condiciones.calificacionGlobalImpacto || 2,
      resultado: exc.resultado,
      prioridad: exc.prioridad,
      activa: exc.activa,
    });
    setExcepcionEditando(index);
    setExcepcionDialog(true);
  };

  const handleActualizarRango = (index: number, campo: string, valor: any) => {
    const nuevosRangos = [...formData.rangos];
    nuevosRangos[index] = { ...nuevosRangos[index], [campo]: valor };
    setFormData({ ...formData, rangos: nuevosRangos });
  };

  if (isLoading) {
    return (
      <AppPageLayout title="Calificación Inherente">
        <PageLoadingSkeleton lines={10} />
      </AppPageLayout>
    );
  }

  if (!config) {
    return (
      <AppPageLayout>
        <Alert severity="warning">No hay configuración activa. Contacte al administrador.</Alert>
      </AppPageLayout>
    );
  }

  return (
    <>
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en la configuración de calificación inherente."
      />
      <AppPageLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3, color: '#1976d2' }}>
          Configuración de Calificación Inherente
        </Typography>

        {/* Información General */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Información General
              </Typography>
              <Chip
                icon={<CheckCircleIcon />}
                label={formData.activa ? 'Configuración Activa' : 'Inactiva'}
                color={formData.activa ? 'success' : 'default'}
              />
            </Box>
            <Grid2 container spacing={2}>
              <Grid2 item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled
                />
              </Grid2>
              <Grid2 item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    />
                  }
                  label="Configuración Activa"
                />
              </Grid2>
              <Grid2 item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Fórmula Base */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              1. Fórmula Base
            </Typography>
            <Grid2 container spacing={2} sx={{ mt: 1 }}>
              <Grid2 item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Operación</InputLabel>
                  <Select
                    value={formData.formulaBase.tipoOperacion}
                    label="Tipo de Operación"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formulaBase: { ...formData.formulaBase, tipoOperacion: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="multiplicacion">Multiplicación</MenuItem>
                    <MenuItem value="suma">Suma</MenuItem>
                    <MenuItem value="promedio">Promedio</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 item xs={12} md={8}>
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    <strong>Campos actuales:</strong> Frecuencia × Calificación Global Impacto
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    Los campos se seleccionan de la tabla CausaRiesgo
                  </Typography>
                </Alert>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Excepciones */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                2. Excepciones
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setExcepcionEditando(null);
                  setExcepcionTemp({
                    frecuencia: 2,
                    calificacionGlobalImpacto: 2,
                    resultado: 3.99,
                    prioridad: 1,
                    activa: true,
                  });
                  setExcepcionDialog(true);
                }}
                size="small"
                disabled={!canEdit}
              >
                Agregar Excepción
              </Button>
            </Box>

            {formData.excepciones.length === 0 ? (
              <Alert severity="info">No hay excepciones configuradas</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Frecuencia</TableCell>
                      <TableCell>Calificación Global Impacto</TableCell>
                      <TableCell>Resultado</TableCell>
                      <TableCell>Prioridad</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.excepciones.map((exc, index) => (
                      <TableRow key={index}>
                        <TableCell>{exc.condiciones.frecuencia}</TableCell>
                        <TableCell>{exc.condiciones.calificacionGlobalImpacto}</TableCell>
                        <TableCell>
                          <Chip label={exc.resultado} color="primary" size="small" />
                        </TableCell>
                        <TableCell>{exc.prioridad}</TableCell>
                        <TableCell>
                          <Chip
                            label={exc.activa ? 'Activa' : 'Inactiva'}
                            color={exc.activa ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEditarExcepcion(index)}
                            color="primary"
                            disabled={!canEdit}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEliminarExcepcion(index)}
                            color="error"
                            disabled={!canEdit}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Rangos de Clasificación */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              3. Rangos de Clasificación
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Estos rangos definen qué valores corresponden a cada nivel de riesgo.
              Los colores se obtienen de la configuración del mapa de riesgos para mantener consistencia.
            </Alert>

            {formData.rangos.length === 0 ? (
              <Alert severity="warning">No hay rangos configurados</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nivel</TableCell>
                      <TableCell align="center">Valor Mínimo</TableCell>
                      <TableCell align="center">Valor Máximo</TableCell>
                      <TableCell align="center">Incluir Mínimo</TableCell>
                      <TableCell align="center">Incluir Máximo</TableCell>
                      <TableCell align="center">Orden</TableCell>
                      <TableCell align="center">Activo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...formData.rangos]
                      .sort((a, b) => a.orden - b.orden)
                      .map((rango, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip
                              label={rango.nivelNombre}
                              sx={{
                                backgroundColor: getColorNivel(rango.nivelNombre),
                                color: '#fff',
                                fontWeight: 600,
                                '& .MuiChip-label': {
                                  color: '#fff',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rango.valorMinimo}
                              onChange={(e) =>
                                handleActualizarRango(index, 'valorMinimo', parseFloat(e.target.value))
                              }
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rango.valorMaximo}
                              onChange={(e) =>
                                handleActualizarRango(index, 'valorMaximo', parseFloat(e.target.value))
                              }
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.incluirMinimo}
                              onChange={(e) =>
                                handleActualizarRango(index, 'incluirMinimo', e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.incluirMaximo}
                              onChange={(e) =>
                                handleActualizarRango(index, 'incluirMaximo', e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rango.orden}
                              onChange={(e) =>
                                handleActualizarRango(index, 'orden', parseInt(e.target.value))
                              }
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.activo}
                              onChange={(e) => handleActualizarRango(index, 'activo', e.target.checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Regla de Agregación */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              4. Regla de Agregación (Calificación Inherente Global)
            </Typography>
            <Grid2 container spacing={2} sx={{ mt: 1 }}>
              <Grid2 item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Agregación</InputLabel>
                  <Select
                    value={formData.reglaAgregacion.tipoAgregacion}
                    label="Tipo de Agregación"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reglaAgregacion: { ...formData.reglaAgregacion, tipoAgregacion: e.target.value },
                      })
                    }
                  >
                    <MenuItem value="maximo">Máximo</MenuItem>
                    <MenuItem value="promedio">Promedio</MenuItem>
                    <MenuItem value="suma">Suma</MenuItem>
                    <MenuItem value="minimo">Mínimo</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 item xs={12} md={8}>
                <Alert severity="info">
                  <Typography variant="body2">
                    La calificación inherente global del riesgo es el{' '}
                    <strong>{formData.reglaAgregacion.tipoAgregacion}</strong> de todas las calificaciones
                    inherentes de sus causas.
                  </Typography>
                </Alert>
              </Grid2>
            </Grid2>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={() => refetch()}>
            Cancelar
          </Button>
          <LoadingActionButton
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!canEdit}
            loading={isUpdating}
            loadingText="Guardando..."
          >
            Guardar Configuración
          </LoadingActionButton>
        </Box>

        {/* Dialog para Excepciones */}
        <Dialog open={excepcionDialog} onClose={() => setExcepcionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {excepcionEditando !== null ? 'Editar Excepción' : 'Agregar Excepción'}
          </DialogTitle>
          <DialogContent>
            <Grid2 container spacing={2} sx={{ mt: 1 }}>
              <Grid2 item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Frecuencia"
                  value={excepcionTemp.frecuencia}
                  onChange={(e) =>
                    setExcepcionTemp({ ...excepcionTemp, frecuencia: parseInt(e.target.value) })
                  }
                />
              </Grid2>
              <Grid2 item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Calificación Global Impacto"
                  value={excepcionTemp.calificacionGlobalImpacto}
                  onChange={(e) =>
                    setExcepcionTemp({
                      ...excepcionTemp,
                      calificacionGlobalImpacto: parseInt(e.target.value),
                    })
                  }
                />
              </Grid2>
              <Grid2 item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Resultado"
                  value={excepcionTemp.resultado}
                  onChange={(e) =>
                    setExcepcionTemp({ ...excepcionTemp, resultado: parseFloat(e.target.value) })
                  }
                />
              </Grid2>
              <Grid2 item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Prioridad"
                  value={excepcionTemp.prioridad}
                  onChange={(e) =>
                    setExcepcionTemp({ ...excepcionTemp, prioridad: parseInt(e.target.value) })
                  }
                />
              </Grid2>
              <Grid2 item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={excepcionTemp.activa}
                      onChange={(e) => setExcepcionTemp({ ...excepcionTemp, activa: e.target.checked })}
                    />
                  }
                  label="Activa"
                />
              </Grid2>
            </Grid2>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExcepcionDialog(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleAgregarExcepcion} disabled={!canEdit}>
              {excepcionEditando !== null ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </AppPageLayout>
    </>
  );
}

