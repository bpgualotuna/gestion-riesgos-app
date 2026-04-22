import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  TextField,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  Save as SaveIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import Grid2 from '../../utils/Grid2';
import {
  useGetProcesosQuery,
  useUpdateProcesoMutation,
  useGetConfigResidualEstrategicaQuery,
  useUpdateConfigResidualEstrategicaMutation,
  useRecalcularClasificacionResidualMutation,
  useGetTiposRiesgosQuery,
} from '../../api/services/riesgosApi';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import type { Proceso, StrategicEngineConfigDto, StrategicBaRowDto } from '../../types';
import {
  MA_PREGUNTA_ACTITUD_STAKEHOLDERS,
  MA_PREGUNTA_CAPACITACION_FUNCIONARIOS,
  MA_PREGUNTA_DOCUMENTACION_SOPORTE,
  MA_PREGUNTA_MONITOREO_DESEMPEÑO,
  MA_PREGUNTA_PRESUPUESTO_RECURSOS,
} from '../../utils/maEstrategicoLabels';
import { repairSpanishDisplayArtifacts } from '../../utils/utf8Repair';

function errorPayload(error: unknown): { message: string; details?: string } {
  if (!error || typeof error !== 'object') return { message: '' };
  const e = error as { data?: { error?: string; details?: string } };
  const data = e.data;
  return {
    message: typeof data?.error === 'string' ? data.error : '',
    details: typeof data?.details === 'string' ? data.details : undefined,
  };
}

function cloneCfg(c: StrategicEngineConfigDto): StrategicEngineConfigDto {
  return JSON.parse(JSON.stringify(c)) as StrategicEngineConfigDto;
}

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

function dispatchResidualRefreshEvent() {
  window.dispatchEvent(
    new CustomEvent('calificacion-residual-updated', { detail: { timestamp: Date.now() } })
  );
}

export default function ResidualEstrategicoCwrPage() {
  const { puedeEditar, esAdmin } = useAuth();
  const canEdit = puedeEditar !== false;
  const canEditMotor = esAdmin && canEdit;
  const { showSuccess, showError } = useNotification();

  const {
    data: procesosRaw,
    isLoading: loadingProcesos,
    isError: errProcesos,
    error: errorProcesos,
  } = useGetProcesosQuery();

  const {
    data: cfgResp,
    isLoading: loadingCfg,
    isError: errCfg,
    error: errorCfg,
  } = useGetConfigResidualEstrategicaQuery();

  const { data: tiposRiesgosCatalog = [] } = useGetTiposRiesgosQuery();

  const [updateProceso] = useUpdateProcesoMutation();
  const [updateConfigMotor, { isLoading: savingMotor }] = useUpdateConfigResidualEstrategicaMutation();
  const [recalcularClasificacionResidual, { isLoading: recalculandoGlobal }] =
    useRecalcularClasificacionResidualMutation();

  const [strategicProceso, setStrategicProceso] = useState<Proceso | null>(null);
  const [engineForm, setEngineForm] = useState<StrategicEngineConfigDto | null>(null);
  const [savingProcesos, setSavingProcesos] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<
    null | { kind: 'rangoAz' | 'tablaBa'; index: number }
  >(null);

  useEffect(() => {
    if (!procesosRaw) return;
    const list = procesosRaw.filter((p) => p.residualModo === 'ESTRATEGICO');
    setStrategicProceso(list[0] ?? null);
  }, [procesosRaw]);

  useEffect(() => {
    if (cfgResp?.config) {
      const c = cloneCfg(cfgResp.config);
      if (!Array.isArray(c.tipologiaTipo1IdsEstrategia)) c.tipologiaTipo1IdsEstrategia = [];
      else if (c.tipologiaTipo1IdsEstrategia.length > 1) {
        c.tipologiaTipo1IdsEstrategia = [c.tipologiaTipo1IdsEstrategia[0]];
      }
      setEngineForm(c);
    }
  }, [cfgResp]);

  const procesoOptions = useMemo(() => [...(procesosRaw ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre)), [procesosRaw]);

  const tipologiaTipo1Unica = useMemo(() => {
    if (!engineForm) return null;
    const id0 = engineForm.tipologiaTipo1IdsEstrategia?.[0];
    if (id0 == null) return null;
    return tiposRiesgosCatalog.find((t: { id?: number }) => Number(t.id) === Number(id0)) ?? null;
  }, [engineForm, tiposRiesgosCatalog]);

  const msgProcesos = errorPayload(errorProcesos);
  const msgCfg = errorPayload(errorCfg);

  const handleGuardarTabProcesosYMotor = async () => {
    if (!procesosRaw?.length && !engineForm) return;
    if (!canEdit && !canEditMotor) return;
    setSavingProcesos(true);
    try {
      const partes: string[] = [];
      if (canEdit && procesosRaw?.length) {
        const sid = strategicProceso ? Number(strategicProceso.id) : null;
        const ops: Promise<unknown>[] = [];
        for (const p of procesosRaw) {
          const want = sid != null && Number(p.id) === sid ? 'ESTRATEGICO' : 'ESTANDAR';
          const cur = p.residualModo === 'ESTRATEGICO' ? 'ESTRATEGICO' : 'ESTANDAR';
          if (want !== cur) {
            ops.push(updateProceso({ id: String(p.id), residualModo: want }).unwrap());
          }
        }
        if (ops.length > 0) {
          await Promise.all(ops);
          const resRecalc = await recalcularClasificacionResidual({ confirmacion: true }).unwrap();
          const r = resRecalc?.resultado;
          dispatchResidualRefreshEvent();
          const extra =
            r != null
              ? ` Clasificación residual: ${r.causasActualizadas ?? 0} causas, ${r.riesgosActualizados ?? 0} riesgos.`
              : '';
          partes.push(`Procesos: ${ops.length} actualizado(s).${extra}`);
        }
      }
      if (canEditMotor && engineForm) {
        const res = await updateConfigMotor(engineForm).unwrap();
        setEngineForm(cloneCfg(res.config));
        dispatchResidualRefreshEvent();
        const rec = res.recalc;
        let motorMsg =
          rec != null
            ? (res.message ||
                `Motor: residuales recalculados para ${rec.procesados} riesgo(s).`)
            : (res.message || 'Motor guardado.');
        if (rec?.errores?.length) {
          motorMsg += ` Advertencias: ${rec.errores.length}.`;
        }
        partes.push(motorMsg);
      }
      if (partes.length === 0) {
        showSuccess('No hay cambios que guardar.');
        return;
      }
      showSuccess(partes.join(' '));
    } catch (e: unknown) {
      showError(errorPayload(e).message || 'No se pudo guardar.');
    } finally {
      setSavingProcesos(false);
    }
  };

  const handleGuardarMotor = async () => {
    if (!engineForm || !canEditMotor) return;
    try {
      const res = await updateConfigMotor(engineForm).unwrap();
      setEngineForm(cloneCfg(res.config));
      dispatchResidualRefreshEvent();
      const rec = res.recalc;
      const base =
        rec != null
          ? (res.message ||
              `Parametrización guardada. Residuales estratégicos recalculados para ${rec.procesados} riesgo(s).`)
          : (res.message || 'Parametrización del motor residual estratégico guardada.');
      if (rec?.errores?.length) {
        showSuccess(`${base} Advertencias en recálculo: ${rec.errores.length} (revise logs).`);
      } else {
        showSuccess(base);
      }
    } catch (e: unknown) {
      showError(errorPayload(e).message || 'No se pudo guardar la parametrización.');
    }
  };

  const handleRestaurarDefaults = () => {
    if (!cfgResp?.defaults || !canEditMotor) return;
    setEngineForm(cloneCfg(cfgResp.defaults));
    showSuccess('Formulario restaurado a valores por defecto del sistema (guarde para persistir).');
  };

  const updateNumRecord = (
    key: 'presupuesto' | 'actitud' | 'capacitacionDocMon',
    opcion: string,
    val: number
  ) => {
    if (!engineForm) return;
    setEngineForm({
      ...engineForm,
      [key]: { ...engineForm[key], [opcion]: val },
    });
  };

  const ejecutarEliminacionPendiente = () => {
    if (!engineForm || !pendingDelete) return;
    if (pendingDelete.kind === 'rangoAz') {
      setEngineForm({
        ...engineForm,
        rangosAz: engineForm.rangosAz.filter((_, i) => i !== pendingDelete.index),
      });
    } else {
      setEngineForm({
        ...engineForm,
        tablaBa: engineForm.tablaBa.filter((_, i) => i !== pendingDelete.index),
      });
    }
    setPendingDelete(null);
  };

  if (loadingProcesos) {
    return (
      <AppPageLayout>
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
          <PageLoadingSkeleton lines={10} />
        </Box>
      </AppPageLayout>
    );
  }

  const motorListo = !errCfg && engineForm;

  return (
    <AppPageLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#1976d2', mb: 2 }}>
          Residual estratégico
        </Typography>

        {errProcesos && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {msgProcesos.message || 'No se pudieron cargar los procesos.'}
            {msgProcesos.details ? (
              <Typography variant="caption" component="div" sx={{ mt: 1, display: 'block', whiteSpace: 'pre-wrap' }}>
                {msgProcesos.details}
              </Typography>
            ) : null}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab label="Procesos estratégicos" />
            <Tab label="Ponderación de criterios" />
            <Tab label="Efectividad y coeficientes" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Elegir proceso estratégico
              </Typography>
              {!errProcesos && !canEdit && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Solo lectura: no puede modificar procesos.
                </Alert>
              )}
              {!errProcesos && (
                <Autocomplete
                  options={procesoOptions}
                  value={strategicProceso}
                  onChange={(_, v) => setStrategicProceso(v)}
                  getOptionLabel={(p) => repairSpanishDisplayArtifacts(p.nombre)}
                  isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
                  disabled={!canEdit || recalculandoGlobal}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Buscar proceso…" size="small" />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props as typeof props & { key?: string };
                    return (
                      <li key={key} {...rest}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{repairSpanishDisplayArtifacts(option.nombre)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.areaNombre || 'Sin área'}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                />
              )}
              </CardContent>
            </Card>

            {engineForm && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tipología tipo I en identificación (residual estratégico)
                </Typography>
                <Autocomplete
                  options={tiposRiesgosCatalog}
                  value={tipologiaTipo1Unica}
                  onChange={(_, v) =>
                    setEngineForm({
                      ...engineForm,
                      tipologiaTipo1IdsEstrategia:
                        v && typeof (v as { id?: number }).id !== 'undefined'
                          ? [Number((v as { id: number }).id)]
                          : [],
                    })
                  }
                  getOptionLabel={(t: { nombre?: string; codigo?: string }) =>
                    repairSpanishDisplayArtifacts(t.nombre || t.codigo || '')
                  }
                  isOptionEqualToValue={(a, b) => Number(a.id) === Number(b.id)}
                  disabled={!canEditMotor}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="Buscar tipología tipo I…" />
                  )}
                />
                </CardContent>
              </Card>
            )}

            {!errProcesos && (
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={
                    savingProcesos || savingMotor || recalculandoGlobal ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={() => void handleGuardarTabProcesosYMotor()}
                  disabled={
                    (!canEdit && !canEditMotor) || savingProcesos || savingMotor || recalculandoGlobal
                  }
                >
                  Guardar
                </Button>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {errCfg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {msgCfg.message || 'No se pudo cargar la parametrización.'}
                {msgCfg.details ? (
                  <Typography variant="caption" component="div" sx={{ mt: 1, display: 'block' }}>
                    {msgCfg.details}
                  </Typography>
                ) : null}
              </Alert>
            )}

            {loadingCfg && !engineForm && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {motorListo && (
              <>
                {!canEditMotor && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Solo administradores pueden editar la parametrización del motor. Puede revisar los valores actuales.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={savingMotor ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={() => void handleGuardarMotor()}
                    disabled={!canEditMotor || savingMotor}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ReplayIcon />}
                    onClick={handleRestaurarDefaults}
                    disabled={!canEditMotor || !cfgResp?.defaults}
                  >
                    Restaurar valores por defecto
                  </Button>
                </Box>

                <Card sx={{ mb: 3 }}>
                  <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Parámetros globales del motor de mitigación
                      </Typography>
                      <Grid2 container spacing={2}>
                        <Grid2 item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Peso por criterio de evaluación (típ. 0,20)"
                    inputProps={{ step: 0.01, min: 0.05, max: 0.5 }}
                    value={engineForm.pesoPorCriterio}
                    disabled={!canEditMotor}
                    onChange={(e) =>
                      setEngineForm({ ...engineForm, pesoPorCriterio: parseFloat(e.target.value) || 0 })
                    }
                  />
                </Grid2>
                <Grid2 item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Factor mitigación cruzada (típ. 0,34)"
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    value={engineForm.factorMitigacionCruzada}
                    disabled={!canEditMotor}
                    onChange={(e) =>
                      setEngineForm({ ...engineForm, factorMitigacionCruzada: parseFloat(e.target.value) || 0 })
                    }
                  />
                </Grid2>
                      </Grid2>
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Umbral 1</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Umbral 2</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Resultado especial</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  inputProps={{ step: 1, min: 0 }}
                                  value={engineForm.bdEspecialBb}
                                  disabled={!canEditMotor}
                                  onChange={(e) =>
                                    setEngineForm({ ...engineForm, bdEspecialBb: parseFloat(e.target.value) || 0 })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  inputProps={{ step: 1, min: 0 }}
                                  value={engineForm.bdEspecialBc}
                                  disabled={!canEditMotor}
                                  onChange={(e) =>
                                    setEngineForm({ ...engineForm, bdEspecialBc: parseFloat(e.target.value) || 0 })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  type="number"
                                  inputProps={{ step: 0.01, min: 0 }}
                                  value={engineForm.bdEspecialResultado}
                                  disabled={!canEditMotor}
                                  onChange={(e) =>
                                    setEngineForm({
                                      ...engineForm,
                                      bdEspecialResultado: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                  </CardContent>
                    </Card>

                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                      Configuración de criterios de mitigación
                    </Typography>
                    <Grid2 container spacing={2} sx={{ mb: 2 }}>
              {(
                [
                  {
                    field: 'presupuesto' as const,
                    titles: [MA_PREGUNTA_PRESUPUESTO_RECURSOS],
                    rec: engineForm.presupuesto,
                  },
                  {
                    field: 'actitud' as const,
                    titles: [MA_PREGUNTA_ACTITUD_STAKEHOLDERS],
                    rec: engineForm.actitud,
                  },
                  {
                    field: 'capacitacionDocMon' as const,
                    titles: [
                      MA_PREGUNTA_CAPACITACION_FUNCIONARIOS,
                      MA_PREGUNTA_DOCUMENTACION_SOPORTE,
                      MA_PREGUNTA_MONITOREO_DESEMPEÑO,
                    ],
                    rec: engineForm.capacitacionDocMon,
                  },
                ] as const
              ).map(({ field, titles, rec }) => (
                <Grid2 item xs={12} md={4} key={field}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ mb: 1 }}>
                      {titles.map((t) => (
                        <Typography
                          key={t}
                          variant="body2"
                          fontWeight={600}
                          sx={{ lineHeight: 1.35, mb: titles.length > 1 ? 0.75 : 0 }}
                        >
                          {t}
                        </Typography>
                      ))}
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Opción</TableCell>
                            <TableCell align="right">Peso 0–1</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.keys(rec).map((k) => (
                            <TableRow key={k}>
                              <TableCell>{k}</TableCell>
                              <TableCell align="right">
                                <TextField
                                  size="small"
                                  type="number"
                                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                                  value={rec[k]}
                                  disabled={!canEditMotor}
                                  onChange={(e) =>
                                    updateNumRecord(field, k, Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)))
                                  }
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid2>
              ))}
                    </Grid2>
              </>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {errCfg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {msgCfg.message || 'No se pudo cargar la parametrización.'}
                {msgCfg.details ? (
                  <Typography variant="caption" component="div" sx={{ mt: 1, display: 'block' }}>
                    {msgCfg.details}
                  </Typography>
                ) : null}
              </Alert>
            )}

            {loadingCfg && !engineForm && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {motorListo && (
              <>
                {!canEditMotor && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Solo administradores pueden editar la parametrización del motor. Puede revisar los valores actuales.
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={savingMotor ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={() => void handleGuardarMotor()}
                    disabled={!canEditMotor || savingMotor}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ReplayIcon />}
                    onClick={handleRestaurarDefaults}
                    disabled={!canEditMotor || !cfgResp?.defaults}
                  >
                    Restaurar valores por defecto
                  </Button>
                </Box>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Clasificación para mitigación cruzada
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        minRows={2}
                        disabled={!canEditMotor}
                        placeholder="Un nivel cualitativo por línea (debe coincidir con la escala de efectividad)"
                        value={(engineForm.etiquetasAzMitigacionCruzada || []).join('\n')}
                        onChange={(e) =>
                          setEngineForm({
                            ...engineForm,
                            etiquetasAzMitigacionCruzada: e.target.value
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        helperText="Niveles que califican para aplicar el factor de mitigación cruzada cuando el control actúa sobre la otra dimensión."
                      />
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            Escala de efectividad de mitigación
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Intervalos del índice de efectividad entre 0 y 1 (equivalente porcentual en la matriz de referencia).
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          disabled={!canEditMotor}
                          onClick={() =>
                            setEngineForm({
                              ...engineForm,
                              rangosAz: [
                                ...engineForm.rangosAz,
                                { etiqueta: 'Nuevo', min: 0, max: 1, incluirMin: true, incluirMax: true },
                              ],
                            })
                          }
                        >
                          Agregar tramo
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Nivel</TableCell>
                              <TableCell align="right">Límite inferior</TableCell>
                              <TableCell align="right">Límite superior</TableCell>
                              <TableCell align="center">Incluye límite inferior</TableCell>
                              <TableCell align="center">Incluye límite superior</TableCell>
                              <TableCell align="center" width={56} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {engineForm.rangosAz.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={row.etiqueta}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const rangosAz = [...engineForm.rangosAz];
                                      rangosAz[idx] = { ...row, etiqueta: e.target.value };
                                      setEngineForm({ ...engineForm, rangosAz });
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ step: 0.01 }}
                                    value={row.min}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const rangosAz = [...engineForm.rangosAz];
                                      rangosAz[idx] = { ...row, min: parseFloat(e.target.value) || 0 };
                                      setEngineForm({ ...engineForm, rangosAz });
                                    }}
                                    sx={{ width: 88 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ step: 0.01 }}
                                    value={row.max}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const rangosAz = [...engineForm.rangosAz];
                                      rangosAz[idx] = { ...row, max: parseFloat(e.target.value) || 0 };
                                      setEngineForm({ ...engineForm, rangosAz });
                                    }}
                                    sx={{ width: 88 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Switch
                                    size="small"
                                    checked={row.incluirMin}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const rangosAz = [...engineForm.rangosAz];
                                      rangosAz[idx] = { ...row, incluirMin: e.target.checked };
                                      setEngineForm({ ...engineForm, rangosAz });
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Switch
                                    size="small"
                                    checked={row.incluirMax}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const rangosAz = [...engineForm.rangosAz];
                                      rangosAz[idx] = { ...row, incluirMax: e.target.checked };
                                      setEngineForm({ ...engineForm, rangosAz });
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Eliminar tramo"
                                    disabled={!canEditMotor || engineForm.rangosAz.length <= 1}
                                    onClick={() => setPendingDelete({ kind: 'rangoAz', index: idx })}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            Coeficientes de mitigación por nivel de efectividad
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Factor numérico (0 a 1) asociado a cada nivel de la escala anterior.
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          disabled={!canEditMotor}
                          onClick={() =>
                            setEngineForm({
                              ...engineForm,
                              tablaBa: [...engineForm.tablaBa, { etiquetaAz: '', ba: 0 }],
                            })
                          }
                        >
                          Agregar fila
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Nivel de efectividad</TableCell>
                              <TableCell align="right">Coeficiente (0–1)</TableCell>
                              <TableCell align="center" width={56} />
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {engineForm.tablaBa.map((row: StrategicBaRowDto, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    value={row.etiquetaAz}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const tablaBa = [...engineForm.tablaBa];
                                      tablaBa[idx] = { ...row, etiquetaAz: e.target.value };
                                      setEngineForm({ ...engineForm, tablaBa });
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                                    value={row.ba}
                                    disabled={!canEditMotor}
                                    onChange={(e) => {
                                      const tablaBa = [...engineForm.tablaBa];
                                      tablaBa[idx] = {
                                        ...row,
                                        ba: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)),
                                      };
                                      setEngineForm({ ...engineForm, tablaBa });
                                    }}
                                    sx={{ width: 100 }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Eliminar fila"
                                    disabled={!canEditMotor || engineForm.tablaBa.length <= 1}
                                    onClick={() => setPendingDelete({ kind: 'tablaBa', index: idx })}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      </CardContent>
                    </Card>
              </>
            )}
          </TabPanel>
        </Paper>

        <Dialog open={pendingDelete != null} onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Eliminar registro</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              ¿Confirma eliminar esta fila? Los cambios se aplican al guardar la parametrización.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPendingDelete(null)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={ejecutarEliminacionPendiente}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppPageLayout>
  );
}
