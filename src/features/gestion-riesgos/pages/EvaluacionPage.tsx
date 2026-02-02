/**
 * Evaluación Page - COMPLETA según Excel
 * Incluye: Evaluación Inherente (Negativa/Positiva), Causas, Controles, Evaluación Residual
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Alert,
  Paper,
  Tabs,
  Tab,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIconSmall,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useCreateEvaluacionMutation } from '../api/riesgosApi';
import { useCalculosRiesgo } from '../hooks/useCalculosRiesgo';
import { useNotification } from '../../../hooks/useNotification';
import { useProceso } from '../../../contexts/ProcesoContext';
import { DIMENSIONES_IMPACTO, LABELS_PROBABILIDAD, LABELS_IMPACTO } from '../../../utils/constants';
import { getRiskColor } from '../../../app/theme/colors';
import { formatRiskValue } from '../../../utils/formatters';
import type {
  Riesgo,
  Impactos,
  CausaRiesgo,
  ControlRiesgo,
  TipoControlHSEQ,
  TipoEfectoControl,
  NaturalezaControl,
} from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`evaluacion-tabpanel-${index}`}
      aria-labelledby={`evaluacion-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Opciones para tipos de control HSEQ
const TIPOS_CONTROL_HSEQ: { value: TipoControlHSEQ; label: string }[] = [
  { value: 'EVITAR_ELIMINAR', label: 'Evitar/Eliminar' },
  { value: 'SUSTITUIR', label: 'Sustituir' },
  { value: 'CONTROL_INGENIERIA', label: 'Control Ingeniería' },
  { value: 'SENALIZACION_INFORMACION', label: 'Señalización/Información' },
  { value: 'EPP', label: 'EPP' },
  { value: 'RECOMENDACIONES_OTROS', label: 'Recomendaciones/Otros Controles' },
  { value: 'ADMINISTRATIVOS', label: 'Administrativos' },
  { value: 'AUDITORIAS_INSPECCIONES_OBSERVACIONES', label: 'Auditorías/Inspecciones/Observaciones' },
  { value: 'AST_PERMISO', label: 'AST Permiso' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'MEDICIONES', label: 'Mediciones' },
  { value: 'PROCEDIMIENTOS_OPERATIVOS_EMERGENCIA', label: 'Procedimientos Operativos o de Emergencia' },
  { value: 'CHARLA_HSEQ_ENTRENAMIENTO', label: 'Charla HSEQ/Entrenamiento' },
  { value: 'TRANSFERIR_RIESGO', label: 'Transferir el Riesgo' },
  { value: 'COMPARTIR_RIESGO', label: 'Compartir el Riesgo' },
  { value: 'PROGRAMA_ASOCIADO', label: 'Programa Asociado' },
];

export default function EvaluacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { data: riesgosData } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id, pageSize: 1000 } : { pageSize: 1000 }
  );
  const [createEvaluacion, { isLoading: isSaving }] = useCreateEvaluacionMutation();
  const { showSuccess, showError } = useNotification();

  const riesgos = riesgosData?.data || [];
  const [selectedRiesgo, setSelectedRiesgo] = useState<Riesgo | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Evaluación Inherente - Negativa
  const [impactosNegativos, setImpactosNegativos] = useState<Omit<Impactos, 'tecnologico'>>({
    personas: 1,
    legal: 1,
    ambiental: 1,
    procesos: 1,
    reputacion: 1,
    economico: 1,
  });
  const [frecuenciaNegativa, setFrecuenciaNegativa] = useState<number>(1);

  // Evaluación Inherente - Positiva
  const [impactosPositivos, setImpactosPositivos] = useState<Omit<Impactos, 'tecnologico'>>({
    personas: 1,
    legal: 1,
    ambiental: 1,
    procesos: 1,
    reputacion: 1,
    economico: 1,
  });
  const [frecuenciaPositiva, setFrecuenciaPositiva] = useState<number>(1);

  // Causas del Riesgo
  const [causas, setCausas] = useState<CausaRiesgo[]>([]);
  const [causaDialogOpen, setCausaDialogOpen] = useState(false);
  const [causaEditando, setCausaEditando] = useState<CausaRiesgo | null>(null);
  const [nuevaCausa, setNuevaCausa] = useState({
    descripcion: '',
    fuenteCausa: '',
    fuenteCausaHSEQ: '',
    fuenteCausaLAFT: '',
  });

  // Controles
  const [controles, setControles] = useState<ControlRiesgo[]>([]);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [controlEditando, setControlEditando] = useState<ControlRiesgo | null>(null);
  const [nuevoControl, setNuevoControl] = useState({
    descripcion: '',
    tipoControl: '' as TipoControlHSEQ | '',
    disminuyeFrecuenciaImpactoAmbas: 'AMBAS' as TipoEfectoControl,
    responsable: '',
    aplicabilidad: 1,
    cobertura: 1,
    facilidadUso: 1,
    segregacion: 0,
    naturaleza: 0.4 as number,
    desviaciones: 0,
  });

  // Requiere Controles
  const [requiereControles, setRequiereControles] = useState<boolean>(false);

  // Cálculos para evaluación inherente negativa
  const resultadosNegativos = useCalculosRiesgo({
    impactos: { ...impactosNegativos, tecnologico: 0 },
    probabilidad: frecuenciaNegativa,
    clasificacion: 'Riesgo con consecuencia negativa',
  });

  // Cálculos para evaluación inherente positiva
  const resultadosPositivos = useCalculosRiesgo({
    impactos: { ...impactosPositivos, tecnologico: 0 },
    probabilidad: frecuenciaPositiva,
    clasificacion: 'Riesgo con consecuencia positiva',
  });

  const handleImpactoNegativoChange = (dimension: keyof Omit<Impactos, 'tecnologico'>, value: number) => {
    setImpactosNegativos((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleImpactoPositivoChange = (dimension: keyof Omit<Impactos, 'tecnologico'>, value: number) => {
    setImpactosPositivos((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleAgregarCausa = () => {
    if (!nuevaCausa.descripcion.trim()) {
      showError('La descripción de la causa es requerida');
      return;
    }

    const causa: CausaRiesgo = {
      id: `causa-${Date.now()}`,
      riesgoId: selectedRiesgo!.id,
      descripcion: nuevaCausa.descripcion,
      fuenteCausa: nuevaCausa.fuenteCausa || undefined,
      fuenteCausaHSEQ: nuevaCausa.fuenteCausaHSEQ || undefined,
      fuenteCausaLAFT: nuevaCausa.fuenteCausaLAFT || undefined,
    };

    if (causaEditando) {
      setCausas(causas.map((c) => (c.id === causaEditando.id ? { ...causa, id: causaEditando.id } : c)));
      showSuccess('Causa actualizada exitosamente');
    } else {
      setCausas([...causas, causa]);
      showSuccess('Causa agregada exitosamente');
    }

    setCausaDialogOpen(false);
    setCausaEditando(null);
    setNuevaCausa({
      descripcion: '',
      fuenteCausa: '',
      fuenteCausaHSEQ: '',
      fuenteCausaLAFT: '',
    });
  };

  const handleEditarCausa = (causa: CausaRiesgo) => {
    setCausaEditando(causa);
    setNuevaCausa({
      descripcion: causa.descripcion,
      fuenteCausa: causa.fuenteCausa || '',
      fuenteCausaHSEQ: causa.fuenteCausaHSEQ || '',
      fuenteCausaLAFT: causa.fuenteCausaLAFT || '',
    });
    setCausaDialogOpen(true);
  };

  const handleEliminarCausa = (causaId: string) => {
    setCausas(causas.filter((c) => c.id !== causaId));
    // También eliminar controles asociados
    setControles(controles.filter((c) => c.causaRiesgoId !== causaId));
    showSuccess('Causa eliminada exitosamente');
  };

  const handleAgregarControl = () => {
    if (!nuevoControl.descripcion.trim()) {
      showError('La descripción del control es requerida');
      return;
    }
    if (!nuevoControl.tipoControl) {
      showError('Debe seleccionar un tipo de control');
      return;
    }
    if (!causaEditando && causas.length === 0) {
      showError('Debe agregar al menos una causa antes de agregar controles');
      return;
    }

    const causaId = causaEditando?.id || causas[0]?.id;
    if (!causaId) {
      showError('Debe seleccionar una causa');
      return;
    }

    // Calcular puntaje del control
    const puntajeControl =
      nuevoControl.aplicabilidad *
      nuevoControl.cobertura *
      nuevoControl.facilidadUso *
      nuevoControl.segregacion *
      nuevoControl.naturaleza;

    // Calcular % de mitigación (simplificado)
    const porcentajeMitigacion = Math.round(puntajeControl * 100);

    const control: ControlRiesgo = {
      id: `control-${Date.now()}`,
      causaRiesgoId: causaId,
      descripcion: nuevoControl.descripcion,
      tipoControl: nuevoControl.tipoControl as TipoControlHSEQ,
      disminuyeFrecuenciaImpactoAmbas: nuevoControl.disminuyeFrecuenciaImpactoAmbas,
      responsable: nuevoControl.responsable || undefined,
      aplicabilidad: nuevoControl.aplicabilidad,
      cobertura: nuevoControl.cobertura,
      facilidadUso: nuevoControl.facilidadUso,
      segregacion: nuevoControl.segregacion,
      naturaleza: nuevoControl.naturaleza,
      desviaciones: nuevoControl.desviaciones,
      puntajeControl,
      evaluacionPreliminar: porcentajeMitigacion >= 50 ? 'Efectivo' : 'Inefectivo',
      evaluacionDefinitiva: porcentajeMitigacion >= 50 ? 'Efectivo' : 'Inefectivo',
      estandarizacionPorcentajeMitigacion: porcentajeMitigacion,
    };

    if (controlEditando) {
      setControles(controles.map((c) => (c.id === controlEditando.id ? { ...control, id: controlEditando.id } : c)));
      showSuccess('Control actualizado exitosamente');
    } else {
      setControles([...controles, control]);
      showSuccess('Control agregado exitosamente');
    }

    setControlDialogOpen(false);
    setControlEditando(null);
    setNuevoControl({
      descripcion: '',
      tipoControl: '' as TipoControlHSEQ | '',
      disminuyeFrecuenciaImpactoAmbas: 'AMBAS',
      responsable: '',
      aplicabilidad: 1,
      cobertura: 1,
      facilidadUso: 1,
      segregacion: 0,
      naturaleza: 0.4,
      desviaciones: 0,
    });
  };

  const handleEditarControl = (control: ControlRiesgo) => {
    setControlEditando(control);
    setNuevoControl({
      descripcion: control.descripcion,
      tipoControl: control.tipoControl || ('' as TipoControlHSEQ | ''),
      disminuyeFrecuenciaImpactoAmbas: control.disminuyeFrecuenciaImpactoAmbas || 'AMBAS',
      responsable: control.responsable || '',
      aplicabilidad: control.aplicabilidad || 1,
      cobertura: control.cobertura || 1,
      facilidadUso: control.facilidadUso || 1,
      segregacion: control.segregacion || 0,
      naturaleza: control.naturaleza || 0.4,
      desviaciones: control.desviaciones || 0,
    });
    setCausaEditando(causas.find((c) => c.id === control.causaRiesgoId) || null);
    setControlDialogOpen(true);
  };

  const handleEliminarControl = (controlId: string) => {
    setControles(controles.filter((c) => c.id !== controlId));
    showSuccess('Control eliminado exitosamente');
  };

  const handleSave = async () => {
    if (!selectedRiesgo) {
      showError('Debe seleccionar un riesgo');
      return;
    }

    try {
      await createEvaluacion({
        riesgoId: selectedRiesgo.id,
        impactoPersonas: impactosNegativos.personas,
        impactoLegal: impactosNegativos.legal,
        impactoAmbiental: impactosNegativos.ambiental,
        impactoProcesos: impactosNegativos.procesos,
        impactoReputacion: impactosNegativos.reputacion,
        impactoEconomico: impactosNegativos.economico,
        impactoTecnologico: 0,
        probabilidad: frecuenciaNegativa,
      }).unwrap();

      showSuccess('Evaluación guardada exitosamente');
    } catch (error) {
      showError('Error al guardar la evaluación');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">Por favor seleccione un proceso desde el Dashboard</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Evaluación de Riesgos
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Evaluación completa según estructura del Excel: Inherente (Negativa/Positiva), Causas, Controles y Residual
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
          <Chip icon={<EditIcon />} label="Modo Edición" color="warning" sx={{ fontWeight: 600 }} />
        )}
      </Box>
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Está en modo visualización. Solo puede ver la información.
        </Alert>
      )}

      {/* Selector de Riesgo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Seleccionar Riesgo
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Busque y seleccione un riesgo del proceso <strong>{procesoSeleccionado?.nombre}</strong> para evaluar
          </Typography>
          <Autocomplete
            options={riesgos}
            getOptionLabel={(option) => {
              const idRiesgo = `${option.numero}${option.siglaGerencia || ''}`;
              return `${idRiesgo} - ${option.descripcion.substring(0, 60)}...`;
            }}
            value={selectedRiesgo}
            onChange={(event, newValue) => {
              setSelectedRiesgo(newValue);
              // Resetear datos al cambiar de riesgo
              setCausas([]);
              setControles([]);
              setTabValue(0);
              if (newValue) {
                showSuccess(`Riesgo seleccionado: ${newValue.descripcion.substring(0, 50)}...`);
              }
            }}
            disabled={isReadOnly}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar riesgo"
                placeholder="Escriba para buscar un riesgo..."
                variant="outlined"
              />
            )}
            renderOption={(props, option) => {
              const idRiesgo = `${option.numero}${option.siglaGerencia || ''}`;
              return (
                <Box component="li" {...props} key={option.id}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={idRiesgo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {option.descripcion.substring(0, 80)}
                        {option.descripcion.length > 80 ? '...' : ''}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                      {option.clasificacion} • {option.zona}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            noOptionsText="No se encontraron riesgos"
            sx={{ width: '100%' }}
          />
        </CardContent>
      </Card>

      {/* Información del Riesgo Seleccionado */}
      {selectedRiesgo && (
        <Card sx={{ mb: 3, bgcolor: 'rgba(25, 118, 210, 0.05)', border: '1px solid rgba(25, 118, 210, 0.2)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Riesgo Seleccionado
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`ID: ${selectedRiesgo.numero}${selectedRiesgo.siglaGerencia || ''}`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={selectedRiesgo.clasificacion}
                    size="small"
                    color={selectedRiesgo.clasificacion.includes('positiva') ? 'success' : 'error'}
                  />
                  <Chip
                    label={`Zona: ${selectedRiesgo.zona}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {selectedRiesgo.descripcion}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {!selectedRiesgo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Seleccione un riesgo del buscador arriba para comenzar la evaluación.
        </Alert>
      )}

      {selectedRiesgo && (
        <>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Evaluación Inherente - Negativa" />
                <Tab label="Evaluación Inherente - Positiva" />
                <Tab label="Causas del Riesgo" />
                <Tab label="Controles" />
                <Tab label="Evaluación Residual" />
              </Tabs>
            </Box>

            {/* TAB 1: Evaluación Inherente - Negativa */}
            <TabPanel value={tabValue} index={0}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Evaluación Inherente - Riesgo Consecuencias Negativas/Peor Escenario
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Evalúe el impacto en cada dimensión y la frecuencia del riesgo
                  </Typography>
                </Box>

                {/* Impact Dimensions */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Dimensiones de Impacto (1-5)
                    </Typography>
                    <Grid container spacing={3}>
                      {DIMENSIONES_IMPACTO.filter((d) => d.key !== 'tecnologico').map((dimension) => (
                        <Grid2 xs={12} sm={6} md={4} key={dimension.key}>
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {dimension.label}
                              </Typography>
                              <Chip
                                label={`${(dimension.peso * 100).toFixed(0)}%`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Slider
                                value={impactosNegativos[dimension.key as keyof Omit<Impactos, 'tecnologico'>]}
                                onChange={(_, value) =>
                                  handleImpactoNegativoChange(
                                    dimension.key as keyof Omit<Impactos, 'tecnologico'>,
                                    value as number
                                  )
                                }
                                disabled={isReadOnly}
                                min={1}
                                max={5}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                                sx={{ flexGrow: 1 }}
                              />
                              <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                                {impactosNegativos[dimension.key as keyof Omit<Impactos, 'tecnologico'>]}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {LABELS_IMPACTO[
                                impactosNegativos[
                                  dimension.key as keyof Omit<Impactos, 'tecnologico'>
                                ] as keyof typeof LABELS_IMPACTO
                              ]}
                            </Typography>
                          </Box>
                        </Grid2>
                      ))}
                    </Grid2>
                  </CardContent>
                </Card>

                {/* Frequency */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Frecuencia (1-5)
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Slider
                        value={frecuenciaNegativa}
                        onChange={(_, value) => setFrecuenciaNegativa(value as number)}
                        disabled={isReadOnly}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                        {frecuenciaNegativa}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {LABELS_PROBABILIDAD[frecuenciaNegativa as keyof typeof LABELS_PROBABILIDAD]}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Results */}
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: `${getRiskColor(resultadosNegativos.nivelRiesgo)}15`,
                    border: `2px solid ${getRiskColor(resultadosNegativos.nivelRiesgo)}`,
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight={700}>
                    📊 Resultados Calculados
                  </Typography>
                  <Grid2 container spacing={3}>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Calificación Global Impacto
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {resultadosNegativos.impactoGlobal}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Calificación Inherente Global
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {formatRiskValue(resultadosNegativos.riesgoInherente)}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Nivel de Riesgo
                      </Typography>
                      <Chip
                        label={resultadosNegativos.nivelRiesgo}
                        sx={{
                          backgroundColor: getRiskColor(resultadosNegativos.nivelRiesgo),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                          mt: 1,
                        }}
                      />
                    </Grid2>
                  </Grid2>
                </Paper>

                {/* Requiere Controles */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      ¿Requiere Controles?
                    </Typography>
                    <FormControl fullWidth disabled={isReadOnly}>
                      <Select
                        value={requiereControles ? 'SI' : 'NO'}
                        onChange={(e) => setRequiereControles(e.target.value === 'SI')}
                      >
                        <MenuItem value="NO">NO</MenuItem>
                        <MenuItem value="SI">SI</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                {!isReadOnly && (
                  <Box display="flex" justifyContent="flex-end" gap={2}>
                    <Button variant="outlined" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </TabPanel>

            {/* TAB 2: Evaluación Inherente - Positiva */}
            <TabPanel value={tabValue} index={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Evaluación Inherente - Riesgo Consecuencias Positivas/Mejor Escenario
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Evalúe el impacto positivo en cada dimensión y la frecuencia del riesgo
                  </Typography>
                </Box>

                {/* Impact Dimensions */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Dimensiones de Impacto (1-5)
                    </Typography>
                    <Grid container spacing={3}>
                      {DIMENSIONES_IMPACTO.filter((d) => d.key !== 'tecnologico').map((dimension) => (
                        <Grid2 xs={12} sm={6} md={4} key={dimension.key}>
                          <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {dimension.label}
                              </Typography>
                              <Chip
                                label={`${(dimension.peso * 100).toFixed(0)}%`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Slider
                                value={impactosPositivos[dimension.key as keyof Omit<Impactos, 'tecnologico'>]}
                                onChange={(_, value) =>
                                  handleImpactoPositivoChange(
                                    dimension.key as keyof Omit<Impactos, 'tecnologico'>,
                                    value as number
                                  )
                                }
                                disabled={isReadOnly}
                                min={1}
                                max={5}
                                step={1}
                                marks
                                valueLabelDisplay="auto"
                                sx={{ flexGrow: 1 }}
                              />
                              <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                                {impactosPositivos[dimension.key as keyof Omit<Impactos, 'tecnologico'>]}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {LABELS_IMPACTO[
                                impactosPositivos[
                                  dimension.key as keyof Omit<Impactos, 'tecnologico'>
                                ] as keyof typeof LABELS_IMPACTO
                              ]}
                            </Typography>
                          </Box>
                        </Grid2>
                      ))}
                    </Grid2>
                  </CardContent>
                </Card>

                {/* Frequency */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Frecuencia (1-5)
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Slider
                        value={frecuenciaPositiva}
                        onChange={(_, value) => setFrecuenciaPositiva(value as number)}
                        disabled={isReadOnly}
                        min={1}
                        max={5}
                        step={1}
                        marks
                        valueLabelDisplay="auto"
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                        {frecuenciaPositiva}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {LABELS_PROBABILIDAD[frecuenciaPositiva as keyof typeof LABELS_PROBABILIDAD]}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Results */}
                <Paper
                  elevation={4}
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: `${getRiskColor(resultadosPositivos.nivelRiesgo)}15`,
                    border: `2px solid ${getRiskColor(resultadosPositivos.nivelRiesgo)}`,
                  }}
                >
                  <Typography variant="h6" gutterBottom fontWeight={700}>
                    📊 Resultados Calculados
                  </Typography>
                  <Grid2 container spacing={3}>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Calificación Global Impacto
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {resultadosPositivos.impactoGlobal}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Calificación Inherente Global
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {formatRiskValue(resultadosPositivos.riesgoInherente)}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Nivel de Riesgo
                      </Typography>
                      <Chip
                        label={resultadosPositivos.nivelRiesgo}
                        sx={{
                          backgroundColor: getRiskColor(resultadosPositivos.nivelRiesgo),
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          height: 32,
                          mt: 1,
                        }}
                      />
                    </Grid2>
                  </Grid2>
                </Paper>
              </CardContent>
            </TabPanel>

            {/* TAB 3: Causas del Riesgo */}
            <TabPanel value={tabValue} index={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Causas del Riesgo
                  </Typography>
                  {!isReadOnly && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setCausaEditando(null);
                        setNuevaCausa({
                          descripcion: '',
                          fuenteCausa: '',
                          fuenteCausaHSEQ: '',
                          fuenteCausaLAFT: '',
                        });
                        setCausaDialogOpen(true);
                      }}
                    >
                      Agregar Causa
                    </Button>
                  )}
                </Box>

                {causas.length === 0 ? (
                  <Alert severity="info">No hay causas registradas. Agregue una causa para comenzar.</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Fuente de Causa</TableCell>
                          <TableCell>Fuente HSEQ</TableCell>
                          <TableCell>Fuente LAFT</TableCell>
                          {!isReadOnly && <TableCell align="right">Acciones</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {causas.map((causa) => (
                          <TableRow key={causa.id}>
                            <TableCell>{causa.descripcion}</TableCell>
                            <TableCell>{causa.fuenteCausa || '-'}</TableCell>
                            <TableCell>{causa.fuenteCausaHSEQ || '-'}</TableCell>
                            <TableCell>{causa.fuenteCausaLAFT || '-'}</TableCell>
                            {!isReadOnly && (
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditarCausa(causa)}
                                  color="primary"
                                >
                                  <EditIconSmall fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEliminarCausa(causa.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </TabPanel>

            {/* TAB 4: Controles */}
            <TabPanel value={tabValue} index={3}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Controles del Riesgo
                  </Typography>
                  {!isReadOnly && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        if (causas.length === 0) {
                          showError('Debe agregar al menos una causa antes de agregar controles');
                          return;
                        }
                        setControlEditando(null);
                        setCausaEditando(causas[0]);
                        setNuevoControl({
                          descripcion: '',
                          tipoControl: '' as TipoControlHSEQ | '',
                          disminuyeFrecuenciaImpactoAmbas: 'AMBAS',
                          responsable: '',
                          aplicabilidad: 1,
                          cobertura: 1,
                          facilidadUso: 1,
                          segregacion: 0,
                          naturaleza: 0.4,
                          desviaciones: 0,
                        });
                        setControlDialogOpen(true);
                      }}
                    >
                      Agregar Control
                    </Button>
                  )}
                </Box>

                {controles.length === 0 ? (
                  <Alert severity="info">
                    No hay controles registrados. Agregue un control para comenzar.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell>Tipo Control</TableCell>
                          <TableCell>Efecto</TableCell>
                          <TableCell>Responsable</TableCell>
                          <TableCell>Efectividad</TableCell>
                          {!isReadOnly && <TableCell align="right">Acciones</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {controles.map((control) => {
                          const causa = causas.find((c) => c.id === control.causaRiesgoId);
                          return (
                            <TableRow key={control.id}>
                              <TableCell>{control.descripcion}</TableCell>
                              <TableCell>
                                {TIPOS_CONTROL_HSEQ.find((t) => t.value === control.tipoControl)?.label || '-'}
                              </TableCell>
                              <TableCell>{control.disminuyeFrecuenciaImpactoAmbas || '-'}</TableCell>
                              <TableCell>{control.responsable || '-'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    control.evaluacionDefinitiva === 'Efectivo'
                                      ? `${control.estandarizacionPorcentajeMitigacion}%`
                                      : 'Inefectivo'
                                  }
                                  color={control.evaluacionDefinitiva === 'Efectivo' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              {!isReadOnly && (
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditarControl(control)}
                                    color="primary"
                                  >
                                    <EditIconSmall fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEliminarControl(control.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </TabPanel>

            {/* TAB 5: Evaluación Residual */}
            <TabPanel value={tabValue} index={4}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Evaluación Residual
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Cálculo del riesgo residual después de aplicar los controles
                </Typography>

                {controles.length === 0 ? (
                  <Alert severity="warning">
                    No hay controles registrados. Agregue controles para calcular la evaluación residual.
                  </Alert>
                ) : (
                  <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Resumen de Controles
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Total de Controles: <strong>{controles.length}</strong>
                      </Typography>
                      <Typography variant="body2">
                        Controles Efectivos:{' '}
                        <strong>
                          {controles.filter((c) => c.evaluacionDefinitiva === 'Efectivo').length}
                        </strong>
                      </Typography>
                      <Typography variant="body2">
                        Controles Inefectivos:{' '}
                        <strong>
                          {controles.filter((c) => c.evaluacionDefinitiva === 'Inefectivo').length}
                        </strong>
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                      Cálculo Residual
                    </Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        La evaluación residual se calcula aplicando la efectividad de los controles sobre el riesgo
                        inherente.
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Riesgo Inherente:</strong> {formatRiskValue(resultadosNegativos.riesgoInherente)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Mitigación Promedio:</strong>{' '}
                        {controles.length > 0
                          ? Math.round(
                              controles.reduce(
                                (acc, c) => acc + (c.estandarizacionPorcentajeMitigacion || 0),
                                0
                              ) / controles.length
                            )
                          : 0}
                        %
                      </Typography>
                    </Alert>
                  </Paper>
                )}
              </CardContent>
            </TabPanel>
          </Card>
        </>
      )}

      {!selectedRiesgo && (
        <Alert severity="info">Selecciona un riesgo para comenzar la evaluación</Alert>
      )}

      {/* Dialog para Agregar/Editar Causa */}
      <Dialog open={causaDialogOpen} onClose={() => setCausaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa' : 'Agregar Causa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Descripción de la Causa *"
              value={nuevaCausa.descripcion}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
              disabled={isReadOnly}
            />
            <TextField
              label="Fuente de Causa"
              value={nuevaCausa.fuenteCausa}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausa: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />
            <TextField
              label="Fuente de Causa HSEQ"
              value={nuevaCausa.fuenteCausaHSEQ}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausaHSEQ: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />
            <TextField
              label="Fuente de Causa LAFT"
              value={nuevaCausa.fuenteCausaLAFT}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausaLAFT: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCausaDialogOpen(false)}>Cancelar</Button>
          {!isReadOnly && (
            <Button onClick={handleAgregarCausa} variant="contained" startIcon={<SaveIcon />}>
              {causaEditando ? 'Actualizar' : 'Agregar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para Agregar/Editar Control */}
      <Dialog open={controlDialogOpen} onClose={() => setControlDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{controlEditando ? 'Editar Control' : 'Agregar Control'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {causas.length > 1 && (
              <FormControl fullWidth disabled={isReadOnly}>
                <InputLabel>Causa del Riesgo *</InputLabel>
                <Select
                  value={causaEditando?.id || ''}
                  onChange={(e) => {
                    const causa = causas.find((c) => c.id === e.target.value);
                    setCausaEditando(causa || null);
                  }}
                  label="Causa del Riesgo *"
                >
                  {causas.map((causa) => (
                    <MenuItem key={causa.id} value={causa.id}>
                      {causa.descripcion}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Descripción del Control *"
              value={nuevoControl.descripcion}
              onChange={(e) => setNuevoControl({ ...nuevoControl, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
              disabled={isReadOnly}
            />

            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Clasificación Control (HSEQ) *</InputLabel>
              <Select
                value={nuevoControl.tipoControl}
                onChange={(e) =>
                  setNuevoControl({ ...nuevoControl, tipoControl: e.target.value as TipoControlHSEQ })
                }
                label="Clasificación Control (HSEQ) *"
              >
                {TIPOS_CONTROL_HSEQ.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Disminuye la Frecuencia, el Impacto o Ambas?</InputLabel>
              <Select
                value={nuevoControl.disminuyeFrecuenciaImpactoAmbas}
                onChange={(e) =>
                  setNuevoControl({
                    ...nuevoControl,
                    disminuyeFrecuenciaImpactoAmbas: e.target.value as TipoEfectoControl,
                  })
                }
                label="Disminuye la Frecuencia, el Impacto o Ambas?"
              >
                <MenuItem value="FRECUENCIA">Frecuencia</MenuItem>
                <MenuItem value="IMPACTO">Impacto</MenuItem>
                <MenuItem value="AMBAS">Ambas</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Responsable del Control"
              value={nuevoControl.responsable}
              onChange={(e) => setNuevoControl({ ...nuevoControl, responsable: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Variables de Evaluación del Control
            </Typography>

            <Grid container spacing={2}>
              <Grid2 xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Aplicabilidad</InputLabel>
                  <Select
                    value={nuevoControl.aplicabilidad}
                    onChange={(e) => setNuevoControl({ ...nuevoControl, aplicabilidad: e.target.value as number })}
                    label="Aplicabilidad"
                  >
                    <MenuItem value={0}>No se deja evidencia</MenuItem>
                    <MenuItem value={1}>Cuenta con procedimientos documentados</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid2 xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Cobertura</InputLabel>
                  <Select
                    value={nuevoControl.cobertura}
                    onChange={(e) => setNuevoControl({ ...nuevoControl, cobertura: e.target.value as number })}
                    label="Cobertura"
                  >
                    <MenuItem value={0.1}>Frecuencia eventual</MenuItem>
                    <MenuItem value={1}>Frecuencia definida, totalidad población</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid2 xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Facilidad de Uso</InputLabel>
                  <Select
                    value={nuevoControl.facilidadUso}
                    onChange={(e) => setNuevoControl({ ...nuevoControl, facilidadUso: e.target.value as number })}
                    label="Facilidad de Uso"
                  >
                    <MenuItem value={0.1}>Complejidad no coherente</MenuItem>
                    <MenuItem value={1}>Complejidad coherente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid2 xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Segregación</InputLabel>
                  <Select
                    value={nuevoControl.segregacion}
                    onChange={(e) => setNuevoControl({ ...nuevoControl, segregacion: e.target.value as number })}
                    label="Segregación"
                  >
                    <MenuItem value={0}>NO</MenuItem>
                    <MenuItem value={1}>SÍ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid2 xs={12} sm={6}>
                <FormControl fullWidth disabled={isReadOnly}>
                  <InputLabel>Naturaleza</InputLabel>
                  <Select
                    value={nuevoControl.naturaleza}
                    onChange={(e) => setNuevoControl({ ...nuevoControl, naturaleza: e.target.value as number })}
                    label="Naturaleza"
                  >
                    <MenuItem value={0.4}>Manual</MenuItem>
                    <MenuItem value={0.6}>Semiautomático</MenuItem>
                    <MenuItem value={1}>Automático</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid2 xs={12} sm={6}>
                <TextField
                  label="Desviaciones (fallos último año)"
                  type="number"
                  value={nuevoControl.desviaciones}
                  onChange={(e) =>
                    setNuevoControl({ ...nuevoControl, desviaciones: parseInt(e.target.value) || 0 })
                  }
                  fullWidth
                  disabled={isReadOnly}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setControlDialogOpen(false)}>Cancelar</Button>
          {!isReadOnly && (
            <Button onClick={handleAgregarControl} variant="contained" startIcon={<SaveIcon />}>
              {controlEditando ? 'Actualizar' : 'Agregar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
