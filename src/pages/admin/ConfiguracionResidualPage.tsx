import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import {
  useGetConfiguracionResidualQuery,
  useUpdateConfiguracionResidualMutation,
  useRecalcularClasificacionResidualMutation,
} from '../../api/services/riesgosApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}


export default function ConfiguracionResidualPage() {
  const { puedeEditar } = useAuth();
  const canEdit = puedeEditar !== false;
  const { showSuccess, showError } = useNotification();
  const [tabValue, setTabValue] = useState(0);

  // RTK Query hooks
  const { data: configData, isLoading, error } = useGetConfiguracionResidualQuery();
  const [updateConfig, { isLoading: isSaving }] = useUpdateConfiguracionResidualMutation();
  const [recalcularClasificacion, { isLoading: isRecalculating }] = useRecalcularClasificacionResidualMutation();

  // Estados locales (se inicializan con datos de la API)
  const [pesosCriterios, setPesosCriterios] = useState<any[]>([]);
  const [rangosEvaluacion, setRangosEvaluacion] = useState<any[]>([]);
  const [tablaMitigacion, setTablaMitigacion] = useState<any[]>([]);
  const [opcionesCriterios, setOpcionesCriterios] = useState<any[]>([]);
  const [rangosNivelRiesgo, setRangosNivelRiesgo] = useState<any[]>([]);
  const [porcentajeReduccionDimensionCruzada, setPorcentajeReduccionDimensionCruzada] = useState<number | ''>(0.34);

  // Cargar datos cuando llegan de la API
  // IMPORTANTE: Crear copias profundas para evitar mutación de datos inmutables de RTK Query
  React.useEffect(() => {
    if (configData) {
      setPesosCriterios(JSON.parse(JSON.stringify(configData.pesosCriterios || [])));
      setRangosEvaluacion(JSON.parse(JSON.stringify(configData.rangosEvaluacion || [])));
      setTablaMitigacion(JSON.parse(JSON.stringify(configData.tablaMitigacion || [])));
      setOpcionesCriterios(JSON.parse(JSON.stringify(configData.opcionesCriterios || [])));
      setRangosNivelRiesgo(JSON.parse(JSON.stringify(configData.rangosNivelRiesgo || [])));
      const p = configData.porcentajeReduccionDimensionCruzada;
      setPorcentajeReduccionDimensionCruzada(p != null && p >= 0 && p <= 1 ? p : 0.34);
    }
  }, [configData]);

  const handleSave = async () => {
    try {
      // Validar suma de pesos
      const sumaPesos = pesosCriterios.reduce((sum, p) => sum + p.peso, 0);
      if (Math.abs(sumaPesos - 1.0) > 0.01) {
        showError(`La suma de los pesos debe ser 100%. Actual: ${(sumaPesos * 100).toFixed(2)}%`);
        return;
      }

      const pCruz = porcentajeReduccionDimensionCruzada === '' ? undefined : Number(porcentajeReduccionDimensionCruzada);
      if (pCruz !== undefined && (pCruz < 0 || pCruz > 1)) {
        showError('El porcentaje de reducción en dimensión cruzada debe estar entre 0 y 1 (ej. 0.34).');
        return;
      }
      const result = await updateConfig({
        id: configData.id,
        nombre: configData.nombre,
        descripcion: configData.descripcion,
        activa: configData.activa,
        porcentajeReduccionDimensionCruzada: pCruz,
        pesosCriterios,
        rangosEvaluacion,
        tablaMitigacion,
        opcionesCriterios,
        rangosNivelRiesgo,
      }).unwrap();

      const recalc = result?.recalc;
      const msg = recalc
        ? `Configuración guardada. Se recalculó la clasificación de ${recalc.causasActualizadas ?? 0} causas y ${recalc.riesgosActualizados ?? 0} riesgos.`
        : (result?.message || 'Configuración guardada. Clasificación residual de todos los controles recalculada.');
      showSuccess(msg);
    } catch (error: any) {
      showError(error?.data?.message || 'Error al guardar la configuración');
    }
  };

  const handleRecalcular = async () => {
    try {
      const result = await recalcularClasificacion({ confirmacion: true }).unwrap();
      const r = result?.resultado;
      const msg = r
        ? `Clasificación residual recalculada: ${r.causasActualizadas ?? 0} causas y ${r.riesgosActualizados ?? 0} riesgos actualizados.`
        : 'Recálculo completado.';
      showSuccess(msg);
    } catch (error: any) {
      showError(error?.data?.message || 'Error al recalcular la clasificación residual');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AppPageLayout title="Configuración Residual">
        <PageLoadingSkeleton lines={10} />
      </AppPageLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppPageLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <Alert severity="error">
            Error al cargar la configuración. Por favor, intenta de nuevo.
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }

  // No data state
  if (!configData) {
    return (
      <AppPageLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <Alert severity="warning">
            No hay configuración residual disponible. Por favor, ejecuta el seed primero.
          </Alert>
        </Box>
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
          Esta configuración controla cómo se calcula la calificación residual. Al guardar, se recalculan automáticamente todos los residuales con la nueva configuración.
        </Alert>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab label="Pesos de Criterios" />
            <Tab label="Opciones de Criterios" />
            <Tab label="Rangos de Evaluación" />
            <Tab label="Tabla de Mitigación" />
            <Tab label="Rangos de Nivel de Riesgo Residual" />
          </Tabs>

          {/* Tab 1: Pesos de Criterios */}
          <TabPanel value={tabValue} index={0}>
            <Card sx={{ mb: 3, p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Parámetros generales
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Reducción dimensión cruzada (0-1)"
                    helperText="Cuando el control aplica a la otra dimensión (ej. 0.34 = 34%). Por defecto 0.34 (Excel)."
                    type="number"
                    value={porcentajeReduccionDimensionCruzada}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPorcentajeReduccionDimensionCruzada(v === '' ? '' : parseFloat(v));
                    }}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Card>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Pesos de Criterios de Evaluación
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Los pesos determinan la importancia de cada criterio en el cálculo del puntaje total del control.
              La suma de todos los pesos debe ser 1.0 (100%).
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Criterio</TableCell>
                    <TableCell align="center">Peso (%)</TableCell>
                    <TableCell align="center">Orden</TableCell>
                    <TableCell align="center">Activo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pesosCriterios.map((peso, index) => (
                    <TableRow key={peso.id}>
                      <TableCell>{peso.criterio}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={peso.peso * 100}
                          onChange={(e) => {
                            const nuevos = [...pesosCriterios];
                            nuevos[index].peso = parseFloat(e.target.value) / 100;
                            setPesosCriterios(nuevos);
                          }}
                          sx={{ width: 80 }}
                          inputProps={{ step: 1, min: 0, max: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">{peso.orden}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={peso.activo}
                          onChange={(e) => {
                            const nuevos = [...pesosCriterios];
                            nuevos[index].activo = e.target.checked;
                            setPesosCriterios(nuevos);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Suma actual: {(pesosCriterios.reduce((sum, p) => sum + p.peso, 0) * 100).toFixed(0)}%
              {Math.abs(pesosCriterios.reduce((sum, p) => sum + p.peso, 0) - 1.0) > 0.01 && ' - ⚠️ La suma debe ser 100%'}
            </Alert>
          </TabPanel>

          {/* Tab 2: Opciones de Criterios */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Opciones de Criterios (Dropdowns)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Define las opciones disponibles en cada criterio de evaluación y sus puntajes asociados.
              Puedes editar la descripción y el valor de cada opción.
            </Alert>

            {/* Aplicabilidad */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Aplicabilidad
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center" sx={{ width: 100 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Activo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opcionesCriterios
                        .filter(op => op.criterio === 'aplicabilidad')
                        .map((opcion) => {
                          const globalIndex = opcionesCriterios.findIndex(o => o.id === opcion.id);
                          return (
                            <TableRow key={opcion.id}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={opcion.label}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].label = e.target.value;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  multiline
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={opcion.valor}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].valor = parseFloat(e.target.value);
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  sx={{ width: 80 }}
                                  inputProps={{ step: 1, min: 0, max: 100 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  checked={opcion.activo}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].activo = e.target.checked;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Cobertura */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Cobertura
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center" sx={{ width: 100 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Activo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opcionesCriterios
                        .filter(op => op.criterio === 'cobertura')
                        .map((opcion) => {
                          const globalIndex = opcionesCriterios.findIndex(o => o.id === opcion.id);
                          return (
                            <TableRow key={opcion.id}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={opcion.label}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].label = e.target.value;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  multiline
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={opcion.valor}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].valor = parseFloat(e.target.value);
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  sx={{ width: 80 }}
                                  inputProps={{ step: 1, min: 0, max: 100 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  checked={opcion.activo}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].activo = e.target.checked;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Facilidad de Uso */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Facilidad de Uso
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center" sx={{ width: 100 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Activo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opcionesCriterios
                        .filter(op => op.criterio === 'facilidad')
                        .map((opcion) => {
                          const globalIndex = opcionesCriterios.findIndex(o => o.id === opcion.id);
                          return (
                            <TableRow key={opcion.id}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={opcion.label}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].label = e.target.value;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  multiline
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={opcion.valor}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].valor = parseFloat(e.target.value);
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  sx={{ width: 80 }}
                                  inputProps={{ step: 1, min: 0, max: 100 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  checked={opcion.activo}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].activo = e.target.checked;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Segregación */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Segregación de Funciones
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center" sx={{ width: 100 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Activo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opcionesCriterios
                        .filter(op => op.criterio === 'segregacion')
                        .map((opcion) => {
                          const globalIndex = opcionesCriterios.findIndex(o => o.id === opcion.id);
                          return (
                            <TableRow key={opcion.id}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={opcion.label}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].label = e.target.value;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  multiline
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={opcion.valor}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].valor = parseFloat(e.target.value);
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  sx={{ width: 80 }}
                                  inputProps={{ step: 1, min: 0, max: 100 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  checked={opcion.activo}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].activo = e.target.checked;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Naturaleza */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Naturaleza del Control
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell align="center" sx={{ width: 100 }}>Valor</TableCell>
                        <TableCell align="center" sx={{ width: 80 }}>Activo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {opcionesCriterios
                        .filter(op => op.criterio === 'naturaleza')
                        .map((opcion) => {
                          const globalIndex = opcionesCriterios.findIndex(o => o.id === opcion.id);
                          return (
                            <TableRow key={opcion.id}>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={opcion.label}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].label = e.target.value;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  multiline
                                />
                              </TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={opcion.valor}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].valor = parseFloat(e.target.value);
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  sx={{ width: 80 }}
                                  inputProps={{ step: 1, min: 0, max: 100 }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Switch
                                  checked={opcion.activo}
                                  onChange={(e) => {
                                    const nuevas = [...opcionesCriterios];
                                    nuevas[globalIndex].activo = e.target.checked;
                                    setOpcionesCriterios(nuevas);
                                  }}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Rangos de Evaluación Preliminar */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Rangos de Evaluación Preliminar
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Estos rangos definen qué puntaje total corresponde a cada nivel de efectividad del control.
            </Alert>
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
                  {rangosEvaluacion.map((rango, index) => (
                    <TableRow key={rango.id}>
                      <TableCell>
                        <Chip label={rango.nivelNombre} color="primary" />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rango.valorMinimo}
                          onChange={(e) => {
                            const nuevos = [...rangosEvaluacion];
                            nuevos[index].valorMinimo = parseFloat(e.target.value);
                            setRangosEvaluacion(nuevos);
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rango.valorMaximo}
                          onChange={(e) => {
                            const nuevos = [...rangosEvaluacion];
                            nuevos[index].valorMaximo = parseFloat(e.target.value);
                            setRangosEvaluacion(nuevos);
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.incluirMinimo}
                          onChange={(e) => {
                            const nuevos = [...rangosEvaluacion];
                            nuevos[index].incluirMinimo = e.target.checked;
                            setRangosEvaluacion(nuevos);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.incluirMaximo}
                          onChange={(e) => {
                            const nuevos = [...rangosEvaluacion];
                            nuevos[index].incluirMaximo = e.target.checked;
                            setRangosEvaluacion(nuevos);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">{rango.orden}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.activo}
                          onChange={(e) => {
                            const nuevos = [...rangosEvaluacion];
                            nuevos[index].activo = e.target.checked;
                            setRangosEvaluacion(nuevos);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab 4: Tabla de Mitigación */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Tabla de Porcentajes de Mitigación
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Define qué porcentaje de mitigación se aplica según la evaluación definitiva del control.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Evaluación</TableCell>
                    <TableCell align="center">Porcentaje de Mitigación (%)</TableCell>
                    <TableCell align="center">Orden</TableCell>
                    <TableCell align="center">Activo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tablaMitigacion.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip label={item.evaluacion} color="secondary" />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={item.porcentaje * 100}
                          onChange={(e) => {
                            const nuevos = [...tablaMitigacion];
                            nuevos[index].porcentaje = parseFloat(e.target.value) / 100;
                            setTablaMitigacion(nuevos);
                          }}
                          sx={{ width: 80 }}
                          inputProps={{ step: 1, min: 0, max: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">{item.orden}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={item.activo}
                          onChange={(e) => {
                            const nuevos = [...tablaMitigacion];
                            nuevos[index].activo = e.target.checked;
                            setTablaMitigacion(nuevos);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab 5: Rangos de Nivel de Riesgo Residual */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Rangos de Nivel de Riesgo Residual
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Define los rangos de calificación residual que determinan el nivel de riesgo final (Bajo, Medio, Alto, Crítico).
            </Alert>
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
                  {rangosNivelRiesgo.map((rango, index) => (
                    <TableRow key={rango.id}>
                      <TableCell>
                        <Chip label={rango.nivelNombre} color="primary" />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rango.valorMinimo}
                          onChange={(e) => {
                            const nuevos = [...rangosNivelRiesgo];
                            nuevos[index].valorMinimo = parseFloat(e.target.value);
                            setRangosNivelRiesgo(nuevos);
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={rango.valorMaximo}
                          onChange={(e) => {
                            const nuevos = [...rangosNivelRiesgo];
                            nuevos[index].valorMaximo = parseFloat(e.target.value);
                            setRangosNivelRiesgo(nuevos);
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.incluirMinimo}
                          onChange={(e) => {
                            const nuevos = [...rangosNivelRiesgo];
                            nuevos[index].incluirMinimo = e.target.checked;
                            setRangosNivelRiesgo(nuevos);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.incluirMaximo}
                          onChange={(e) => {
                            const nuevos = [...rangosNivelRiesgo];
                            nuevos[index].incluirMaximo = e.target.checked;
                            setRangosNivelRiesgo(nuevos);
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">{rango.orden}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={rango.activo}
                          onChange={(e) => {
                            const nuevos = [...rangosNivelRiesgo];
                            nuevos[index].activo = e.target.checked;
                            setRangosNivelRiesgo(nuevos);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>

        {/* Guardar (recalcula con nueva config) y Recalcular (solo actualiza clasificaciones con config actual) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={isRecalculating ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleRecalcular}
            disabled={!canEdit || isRecalculating || isSaving}
          >
            {isRecalculating ? 'Recalculando...' : 'Recalcular'}
          </Button>
          <Button
            variant="contained"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!canEdit || isSaving || isRecalculating}
          >
            {isSaving ? 'Guardando y recalculando residuales...' : 'Guardar Configuración'}
          </Button>
        </Box>

        <Backdrop open={isSaving || isRecalculating} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}>
          <CircularProgress color="inherit" />
          <Typography variant="h6" sx={{ color: 'white' }}>
            {isRecalculating ? 'Recalculando clasificación residual de todos los controles...' : 'Guardando y recalculando clasificación residual de todos los controles...'}
          </Typography>
        </Backdrop>
      </Box>
    </AppPageLayout>
  );
}
