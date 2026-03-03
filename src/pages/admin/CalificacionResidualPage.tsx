import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

export type VariableControlItem = {
  codigo: string;
  nombre: string;
  pesoCriterio: number;
  opciones: Array<{ descripcion: string; pesoVar?: number; indicador?: string; nota?: string }>;
};
export type EvaluacionControlItem = {
  nombre: string;
  rangoMin: number;
  rangoMax: number;
  limiteInferior: number;
  estandarizacion: number;
};
export type EvaluacionPriorizacionItem = {
  nombre: string;
  rangoMin?: number;
  rangoMax?: number;
  limiteSupMP?: number;
  limiteSupMR?: number;
  limiteInfMP?: number;
  limiteInfMR?: number;
};
import {
  useGetCalificacionResidualActivaQuery,
  useUpdateCalificacionResidualMutation,
  useGetNivelesRiesgoQuery,
} from '../../api/services/riesgosApi';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';

export default function CalificacionResidualPage() {
  const { puedeEditar } = useAuth();
  const canEdit = puedeEditar !== false;
  const { showSuccess, showError } = useNotification();
  const { data: config, isLoading, refetch } = useGetCalificacionResidualActivaQuery();
  const { data: niveles } = useGetNivelesRiesgoQuery();
  const [updateConfig, { isLoading: isUpdating }] = useUpdateCalificacionResidualMutation();

  const getColorNivel = (nivelNombre: string): string => {
    if (!niveles?.length) {
      const def: Record<string, string> = {
        Crítico: '#d32f2f',
        CRÍTICO: '#d32f2f',
        Alto: '#f57c00',
        ALTO: '#f57c00',
        Medio: '#fbc02d',
        MEDIO: '#fbc02d',
        Bajo: '#388e3c',
        BAJO: '#388e3c',
      };
      return def[nivelNombre] ?? '#666';
    }
    const n = niveles.find(
      (x: any) =>
        x.nombre?.toUpperCase() === nivelNombre?.toUpperCase() ||
        nivelNombre?.toUpperCase().includes(x.nombre?.toUpperCase() ?? '')
    );
    return n?.color ?? '#666';
  };

  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true,
    decimalesEfectividad: 2,
    decimalesResidual: 2,
    maxPuntosEfectividad: 15,
    formulaTipo: 'reduccion_por_efectividad',
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
    variablesControl: [] as VariableControlItem[],
    evaluacionControl: [] as EvaluacionControlItem[],
    criteriosPriorizacion: [] as VariableControlItem[],
    evaluacionPriorizacion: [] as EvaluacionPriorizacionItem[],
  });

  useEffect(() => {
    if (config) {
      setFormData({
        nombre: config.nombre ?? '',
        descripcion: config.descripcion ?? '',
        activa: config.activa ?? true,
        decimalesEfectividad: config.decimalesEfectividad ?? 2,
        decimalesResidual: config.decimalesResidual ?? 2,
        maxPuntosEfectividad: config.maxPuntosEfectividad ?? 15,
        formulaTipo: config.formulaTipo ?? 'reduccion_por_efectividad',
        rangos: (config.rangos ?? []).map((r: any) => ({
          id: r.id,
          nivelNombre: r.nivelNombre,
          valorMinimo: r.valorMinimo,
          valorMaximo: r.valorMaximo,
          incluirMinimo: r.incluirMinimo !== false,
          incluirMaximo: r.incluirMaximo !== false,
          orden: r.orden,
          activo: r.activo !== false,
        })),
        variablesControl: Array.isArray(config.variablesControl) ? config.variablesControl : [],
        evaluacionControl: Array.isArray(config.evaluacionControl) ? config.evaluacionControl : [],
        criteriosPriorizacion: Array.isArray(config.criteriosPriorizacion) ? config.criteriosPriorizacion : [],
        evaluacionPriorizacion: Array.isArray(config.evaluacionPriorizacion) ? config.evaluacionPriorizacion : [],
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      if (!config?.id) {
        showError('No hay configuración para actualizar');
        return;
      }
      await updateConfig({
        id: config.id,
        ...formData,
      }).unwrap();
      await refetch();
      window.dispatchEvent(
        new CustomEvent('calificacion-residual-updated', { detail: { timestamp: Date.now() } })
      );
      showSuccess('Configuración de calificación residual guardada.');
    } catch (error: any) {
      showError(error?.data?.error || 'Error al guardar');
    }
  };

  const handleActualizarRango = (index: number, campo: string, valor: unknown) => {
    const nuevos = [...formData.rangos];
    nuevos[index] = { ...nuevos[index], [campo]: valor };
    setFormData({ ...formData, rangos: nuevos });
  };

  if (isLoading) {
    return (
      <AppPageLayout title="Configuración de Calificación Residual">
        <PageLoadingSkeleton lines={10} />
      </AppPageLayout>
    );
  }

  if (!config) {
    return (
      <AppPageLayout>
        <Alert severity="warning">No hay configuración activa de calificación residual.</Alert>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3, color: '#1976d2' }}>
          Configuración de Calificación Residual
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          La calificación residual se obtiene a partir de los controles. Configure aquí variables de control, evaluación y priorización.
        </Alert>

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab label="General" />
          <Tab label="Rangos residual" />
          <Tab label="Variables de control" />
          <Tab label="Evaluación control" />
          <Tab label="Priorización" />
        </Tabs>

        {tabValue === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Información general
              </Typography>
              <Chip
                label={formData.activa ? 'Configuración Activa' : 'Inactiva'}
                color={formData.activa ? 'success' : 'default'}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    />
                  }
                  label="Configuración activa"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        )}

        {tabValue === 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Parámetros numéricos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 6 }}
                  label="Decimales efectividad"
                  value={formData.decimalesEfectividad}
                  onChange={(e) =>
                    setFormData({ ...formData, decimalesEfectividad: parseInt(e.target.value) || 0 })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 6 }}
                  label="Decimales riesgo residual"
                  value={formData.decimalesResidual}
                  onChange={(e) =>
                    setFormData({ ...formData, decimalesResidual: parseInt(e.target.value) || 0 })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  inputProps={{ min: 1, max: 100 }}
                  label="Máx. puntos efectividad"
                  value={formData.maxPuntosEfectividad}
                  onChange={(e) =>
                    setFormData({ ...formData, maxPuntosEfectividad: parseInt(e.target.value) || 15 })
                  }
                  helperText="Ej: 15 = diseño+ejecución+solidez (5+5+5)"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Fórmula residual</InputLabel>
                  <Select
                    label="Fórmula residual"
                    value={formData.formulaTipo}
                    onChange={(e) => setFormData({ ...formData, formulaTipo: e.target.value })}
                  >
                    <MenuItem value="reduccion_por_efectividad">Reducción por efectividad</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        )}

        {tabValue === 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Rangos de clasificación (nivel residual)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Define los intervalos de valor del riesgo residual para cada nivel (BAJO, MEDIO, ALTO, CRÍTICO).
            </Alert>
            {formData.rangos.length === 0 ? (
              <Alert severity="warning">No hay rangos configurados.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nivel</TableCell>
                      <TableCell align="center">Valor mín.</TableCell>
                      <TableCell align="center">Valor máx.</TableCell>
                      <TableCell align="center">Incl. mín.</TableCell>
                      <TableCell align="center">Incl. máx.</TableCell>
                      <TableCell align="center">Orden</TableCell>
                      <TableCell align="center">Activo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.rangos
                      .map((rango, idx) => ({ rango, idx }))
                      .sort((a, b) => a.rango.orden - b.rango.orden)
                      .map(({ rango, idx }) => (
                        <TableRow key={rango.id ?? idx}>
                          <TableCell>
                            <Chip
                              label={rango.nivelNombre}
                              sx={{
                                backgroundColor: getColorNivel(rango.nivelNombre),
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rango.valorMinimo}
                              onChange={(e) =>
                                handleActualizarRango(idx, 'valorMinimo', parseFloat(e.target.value))
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
                                handleActualizarRango(idx, 'valorMaximo', parseFloat(e.target.value))
                              }
                              sx={{ width: 80 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.incluirMinimo}
                              onChange={(e) =>
                                handleActualizarRango(idx, 'incluirMinimo', e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.incluirMaximo}
                              onChange={(e) =>
                                handleActualizarRango(idx, 'incluirMaximo', e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              value={rango.orden}
                              onChange={(e) =>
                                handleActualizarRango(idx, 'orden', parseInt(e.target.value))
                              }
                              sx={{ width: 60 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch
                              checked={rango.activo}
                              onChange={(e) =>
                                handleActualizarRango(idx, 'activo', e.target.checked)
                              }
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
        )}

        {tabValue === 2 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Variables de control</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Criterios (Aplicabilidad, Cobertura, Facilidad de uso, Segregación, Naturaleza, Desviaciones) con peso y opciones.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Criterio</TableCell>
                    <TableCell align="right">Peso %</TableCell>
                    <TableCell>Opciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.variablesControl.map((c, i) => (
                    <TableRow key={c.codigo || i}>
                      <TableCell>
                        <TextField size="small" fullWidth value={c.nombre} onChange={e => {
                          const v = [...formData.variablesControl]; v[i] = { ...v[i], nombre: e.target.value }; setFormData({ ...formData, variablesControl: v });
                        }} />
                      </TableCell>
                      <TableCell align="right" sx={{ width: 80 }}>
                        <TextField type="number" size="small" value={c.pesoCriterio} onChange={e => {
                          const v = [...formData.variablesControl]; v[i] = { ...v[i], pesoCriterio: Number(e.target.value) }; setFormData({ ...formData, variablesControl: v });
                        }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{ (c.opciones || []).map((o: any) => o.descripcion || o.pesoVar).join(' | ') }</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        )}

        {tabValue === 3 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Evaluación control</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Niveles (Altamente Efectivo, Efectivo, etc.) con rango %, límite inferior y estandarización.
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nivel</TableCell>
                    <TableCell align="right">Rango min</TableCell>
                    <TableCell align="right">Rango máx</TableCell>
                    <TableCell align="right">Límite inf.</TableCell>
                    <TableCell align="right">Estandar. %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.evaluacionControl.map((e, i) => (
                    <TableRow key={e.nombre || i}>
                      <TableCell><TextField size="small" value={e.nombre} onChange={ev => { const v = [...formData.evaluacionControl]; v[i] = { ...v[i], nombre: ev.target.value }; setFormData({ ...formData, evaluacionControl: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 70 }} value={e.rangoMin} onChange={ev => { const v = [...formData.evaluacionControl]; v[i] = { ...v[i], rangoMin: Number(ev.target.value) }; setFormData({ ...formData, evaluacionControl: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 70 }} value={e.rangoMax} onChange={ev => { const v = [...formData.evaluacionControl]; v[i] = { ...v[i], rangoMax: Number(ev.target.value) }; setFormData({ ...formData, evaluacionControl: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 70 }} value={e.limiteInferior} onChange={ev => { const v = [...formData.evaluacionControl]; v[i] = { ...v[i], limiteInferior: Number(ev.target.value) }; setFormData({ ...formData, evaluacionControl: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 70 }} value={e.estandarizacion} onChange={ev => { const v = [...formData.evaluacionControl]; v[i] = { ...v[i], estandarizacion: Number(ev.target.value) }; setFormData({ ...formData, evaluacionControl: v }); }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        )}

        {tabValue === 4 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>Criterios priorización</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Adaptabilidad, Complejidad, Velocidad, Persistencia.</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Criterio</TableCell><TableCell align="right">Peso %</TableCell></TableRow></TableHead>
                <TableBody>
                  {formData.criteriosPriorizacion.map((c, i) => (
                    <TableRow key={c.codigo || i}>
                      <TableCell><TextField size="small" value={c.nombre} onChange={ev => { const v = [...formData.criteriosPriorizacion]; v[i] = { ...v[i], nombre: ev.target.value }; setFormData({ ...formData, criteriosPriorizacion: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 80 }} value={c.pesoCriterio} onChange={ev => { const v = [...formData.criteriosPriorizacion]; v[i] = { ...v[i], pesoCriterio: Number(ev.target.value) }; setFormData({ ...formData, criteriosPriorizacion: v }); }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h6" fontWeight={600} sx={{ mt: 3 }}>Evaluación priorización (límites MP/MR)</Typography>
            <TableContainer sx={{ mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nivel</TableCell>
                    <TableCell align="right">LimSup MP</TableCell>
                    <TableCell align="right">LimSup MR</TableCell>
                    <TableCell align="right">LimInf MP</TableCell>
                    <TableCell align="right">LimInf MR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.evaluacionPriorizacion.map((e, i) => (
                    <TableRow key={e.nombre || i}>
                      <TableCell><TextField size="small" value={e.nombre} onChange={ev => { const v = [...formData.evaluacionPriorizacion]; v[i] = { ...v[i], nombre: ev.target.value }; setFormData({ ...formData, evaluacionPriorizacion: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 80 }} value={e.limiteSupMP ?? ''} onChange={ev => { const v = [...formData.evaluacionPriorizacion]; v[i] = { ...v[i], limiteSupMP: Number(ev.target.value) }; setFormData({ ...formData, evaluacionPriorizacion: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 80 }} value={e.limiteSupMR ?? ''} onChange={ev => { const v = [...formData.evaluacionPriorizacion]; v[i] = { ...v[i], limiteSupMR: Number(ev.target.value) }; setFormData({ ...formData, evaluacionPriorizacion: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 80 }} value={e.limiteInfMP ?? ''} onChange={ev => { const v = [...formData.evaluacionPriorizacion]; v[i] = { ...v[i], limiteInfMP: Number(ev.target.value) }; setFormData({ ...formData, evaluacionPriorizacion: v }); }} /></TableCell>
                      <TableCell align="right"><TextField type="number" size="small" sx={{ width: 80 }} value={e.limiteInfMR ?? ''} onChange={ev => { const v = [...formData.evaluacionPriorizacion]; v[i] = { ...v[i], limiteInfMR: Number(ev.target.value) }; setFormData({ ...formData, evaluacionPriorizacion: v }); }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button variant="outlined" onClick={() => refetch()}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!canEdit || isUpdating}
          >
            {isUpdating ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </Box>
      </Box>
    </AppPageLayout>
  );
}
