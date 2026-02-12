/**
 * Gestión de Controles y Planes de Acción
 * Incluye: Clasificación de Causas, Calificación Residual y Planes de Acción
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Collapse,
  Alert,
  Divider,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  FactCheck as FactCheckIcon,
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useGetRiesgosQuery, useUpdateRiesgoMutation, useUpdateCausaMutation, useGetPlanesQuery, useCreatePlanAccionMutation } from '../../api/services/riesgosApi';
import { RiesgoFormData, CausaRiesgo } from '../../types';
import {
  calcularPuntajeControl,
  determinarEfectividadControl,
  obtenerPorcentajeMitigacion,
  calcularFrecuenciaResidual,
  calcularImpactoResidual,
  calcularCalificacionResidual,
  determinarEvaluacionPreliminar,
  determinarEvaluacionDefinitiva,
  obtenerPorcentajeMitigacionAvanzado,
  calcularFrecuenciaResidualAvanzada,
  calcularImpactoResidualAvanzado,
} from '../../utils/calculations';

// Tipos locales para Plan de Acción (Mock)
interface PlanAccion {
  id: string;
  riesgoId: string;
  nombre: string;
  descripcion?: string;
  objetivo: string;
  fechaInicio: string;
  fechaLimite: string;
  responsableNombre?: string;
  estado: 'borrador' | 'en_ejecucion' | 'completado' | 'atrasado';
  porcentajeAvance: number;
  presupuesto?: number;
  observaciones?: string;
}

export default function PlanAccionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { showSuccess } = useNotification();

  // Estados
  const [activeTab, setActiveTab] = useState(0); // 0: Clasificación, 1: Residual, 2: Planes
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});

  // Estados para Clasificación
  const [clasificacionDialogOpen, setClasificacionDialogOpen] = useState(false);
  const [causaSeleccionada, setCausaSeleccionada] = useState<CausaRiesgo | null>(null);
  const [tipoGestion, setTipoGestion] = useState<'CONTROL' | 'PLAN' | null>(null);

  // Estados para Evaluación de Control
  const [dialogEvaluacionOpen, setDialogEvaluacionOpen] = useState(false);
  const [riesgoIdEvaluacion, setRiesgoIdEvaluacion] = useState<string | null>(null);
  const [causaIdEvaluacion, setCausaIdEvaluacion] = useState<string | null>(null);
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState({
    aplicabilidad: '', puntajeAplicabilidad: 0,
    cobertura: '', puntajeCobertura: 0,
    facilidadUso: '', puntajeFacilidad: 0,
    segregacion: '', puntajeSegregacion: 0,
    naturaleza: '', puntajeNaturaleza: 0,
    tipoMitigacion: 'AMBAS' as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
    recomendacion: '',
  });

  // Mock Planes
  const [planesAccion, setPlanesAccion] = useState<PlanAccion[]>([]);
  const { data: planesApi = [] } = useGetPlanesQuery();
  const [createPlanAccion] = useCreatePlanAccionMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();
  const [updateCausa] = useUpdateCausaMutation();
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDetalleOpen, setPlanDetalleOpen] = useState(false);
  const [planSeleccionadoDetalle, setPlanSeleccionadoDetalle] = useState<PlanAccion | null>(null);
  const [formPlan, setFormPlan] = useState({
    nombre: '',
    descripcion: '',
    objetivo: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responsableNombre: '',
    presupuesto: 0,
    observaciones: ''
  });

  // Carga de Riesgos
  const { data: riesgosData } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id, pageSize: 1000, includeCausas: true } : { pageSize: 1000 }
  );

  const riesgos = useMemo(() => {
    const data = ((riesgosData as any)?.data || []) as any[];
    return data.map((riesgo) => ({
      ...riesgo,
      descripcionRiesgo: riesgo.descripcion,
      causas: (riesgo.causas || []).map((causa: any) => ({
        ...causa,
        ...(causa.gestion || {})
      }))
    }));
  }, [riesgosData, procesoSeleccionado]);

  useEffect(() => {
    const mapped = (planesApi || []).map((plan: any) => ({
      id: String(plan.id),
      riesgoId: String(plan.riesgoId || ''),
      nombre: plan.nombre || plan.descripcion || 'Plan de acción',
      descripcion: plan.descripcion,
      objetivo: plan.objetivo || '',
      fechaInicio: plan.fechaInicio ? String(plan.fechaInicio).slice(0, 10) : '',
      fechaLimite: plan.fechaFin ? String(plan.fechaFin).slice(0, 10) : '',
      responsableNombre: plan.responsable || '',
      estado: (plan.estado || 'borrador') as any,
      porcentajeAvance: plan.porcentajeAvance || 0,
      presupuesto: plan.presupuesto,
      observaciones: plan.observaciones
    }));
    setPlanesAccion(mapped);
  }, [planesApi]);

  const handleToggleExpandir = (id: string) => {
    setRiesgosExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const actualizarRiesgoApi = async (riesgoId: string, updates: Partial<RiesgoFormData>) => {
    await updateRiesgo({ id: String(riesgoId), ...updates } as any).unwrap();
  };

  const isReadOnly = modoProceso === 'visualizar';

  // Handlers Clasificación
  const handleClasificarCausa = (riesgo: any, causa: CausaRiesgo) => {
    setRiesgoIdEvaluacion(riesgo.id);
    setCausaSeleccionada(causa);
    setCausaIdEvaluacion(causa.id);
    setTipoGestion(null);

    // Precargar si ya tiene evaluacion de control
    if (causa.puntajeTotal !== undefined) {
      setCriteriosEvaluacion({
        aplicabilidad: causa.aplicabilidad || '',
        puntajeAplicabilidad: causa.puntajeAplicabilidad || 0,
        cobertura: causa.cobertura || '',
        puntajeCobertura: causa.puntajeCobertura || 0,
        facilidadUso: causa.facilidadUso || '',
        puntajeFacilidad: causa.puntajeFacilidad || 0,
        segregacion: causa.segregacion || '',
        puntajeSegregacion: causa.puntajeSegregacion || 0,
        naturaleza: causa.naturaleza || '',
        puntajeNaturaleza: causa.puntajeNaturaleza || 0,
        tipoMitigacion: causa.tipoMitigacion || 'AMBAS',
        recomendacion: causa.recomendacion || '',
      });
      setTipoGestion('CONTROL');
    } else {
      // Reset
      setCriteriosEvaluacion({
        aplicabilidad: '', puntajeAplicabilidad: 0,
        cobertura: '', puntajeCobertura: 0,
        facilidadUso: '', puntajeFacilidad: 0,
        segregacion: '', puntajeSegregacion: 0,
        naturaleza: '', puntajeNaturaleza: 0,
        tipoMitigacion: 'AMBAS', recomendaciones: ''
      } as any);
    }
    setClasificacionDialogOpen(true);
  };

  const handleProcesarClasificacion = () => {
    if (tipoGestion === 'CONTROL') {
      setClasificacionDialogOpen(false);
      setDialogEvaluacionOpen(true);
    } else if (tipoGestion === 'PLAN') {
      setFormPlan({
        nombre: `Plan: ${causaSeleccionada?.descripcion.substring(0, 30)}...`,
        descripcion: '',
        objetivo: `Mitigar la causa: ${causaSeleccionada?.descripcion}`,
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        responsableNombre: '',
        presupuesto: 0,
        observaciones: ''
      });
      setClasificacionDialogOpen(false);
      setPlanDialogOpen(true);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>Controles y Planes de Acción</Typography>

        {/* Tabs Principales */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: 'white', borderRadius: 1 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab key="clasif" label="CLASIFICACIÓN DE CAUSA" icon={<FactCheckIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
            <Tab key="residual" label="CALIFICACIÓN RESIDUAL" icon={<SecurityIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
            <Tab key="planes" label="PLANES DE ACCIÓN" icon={<AssignmentIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
          </Tabs>
        </Box>

        {/* TAB 0: CLASIFICACIÓN DE CAUSA */}
        {activeTab === 0 && (
          <Box>
            {riesgos.length === 0 ? (
              <Card><CardContent><Typography align="center">No hay riesgos registrados.</Typography></CardContent></Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {riesgos.map((riesgo) => {
                  const estaExpandido = riesgosExpandidos[riesgo.id] || false;
                  return (
                    <Card key={riesgo.id} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 2, cursor: 'pointer',
                          backgroundColor: estaExpandido ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                        }}
                        onClick={() => handleToggleExpandir(riesgo.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton size="small">{estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                          <Typography variant="subtitle1" fontWeight={600}>{riesgo.numeroIdentificacion} - {riesgo.descripcionRiesgo}</Typography>
                        </Box>
                      </Box>

                      <Collapse in={estaExpandido}>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Causas Identificadas</Typography>
                          {riesgo.causas && riesgo.causas.length > 0 ? (
                            <TableContainer component={Paper} sx={{ mb: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Causa</strong></TableCell>
                                    <TableCell><strong>Estado Gestión</strong></TableCell>
                                    <TableCell align="center"><strong>Acción</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {riesgo.causas.map((causa: any) => (
                                    <TableRow
                                      key={causa.id}
                                      hover
                                      sx={{ cursor: 'pointer' }}
                                      onClick={() => handleClasificarCausa(riesgo, causa)}
                                    >
                                      <TableCell><Typography variant="body2">{causa.descripcion}</Typography></TableCell>
                                      <TableCell>
                                        {causa.puntajeTotal !== undefined ?
                                          <Chip label="Control Evaluado" color="success" size="small" /> :
                                          <Chip label="Pendiente Clasificación" color="warning" size="small" />
                                        }
                                      </TableCell>
                                      <TableCell align="center">
                                        <Button size="small" variant="contained" onClick={() => handleClasificarCausa(riesgo, causa)}>
                                          Gestionar
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (<Alert severity="info">No hay causas registradas.</Alert>)}
                        </Box>
                      </Collapse>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 1: CALIFICACION RESIDUAL (Copia de Identificación) */}
        {activeTab === 1 && (
          <Box>
            {riesgos.length === 0 ? (
              <Card><CardContent><Typography align="center">No hay riesgos registrados.</Typography></CardContent></Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {riesgos.map((riesgo) => {
                  const estaExpandido = riesgosExpandidos[riesgo.id] || false;
                  return (
                    <Card key={riesgo.id} sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          p: 2, cursor: 'pointer',
                          backgroundColor: estaExpandido ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' },
                        }}
                        onClick={() => handleToggleExpandir(riesgo.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <IconButton size="small">{estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                          <Typography variant="subtitle1" fontWeight={600}>{riesgo.numeroIdentificacion} - {riesgo.descripcionRiesgo}</Typography>
                        </Box>
                      </Box>

                      <Collapse in={estaExpandido}>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Evaluación Residual</Typography>
                          {riesgo.causas && riesgo.causas.length > 0 ? (
                            <TableContainer component={Paper} sx={{ mb: 2 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Causa</strong></TableCell>
                                    <TableCell align="center"><strong>Frec. Inh.</strong></TableCell>
                                    <TableCell align="center"><strong>Imp. Inh.</strong></TableCell>
                                    <TableCell align="center"><strong>Control</strong></TableCell>
                                    <TableCell align="center"><strong>% Mit.</strong></TableCell>
                                    <TableCell align="center"><strong>Frec. Res.</strong></TableCell>
                                    <TableCell align="center"><strong>Imp. Res.</strong></TableCell>
                                    <TableCell align="center"><strong>Calif. Res.</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {riesgo.causas.map((causa: any) => {
                                    const puntajeTotal = calcularPuntajeControl(
                                      causa.puntajeAplicabilidad || 0, causa.puntajeCobertura || 0,
                                      causa.puntajeFacilidad || 0, causa.puntajeSegregacion || 0,
                                      causa.puntajeNaturaleza || 0
                                    );
                                    const efectividad = puntajeTotal > 0 ? determinarEfectividadControl(puntajeTotal) : 'No evaluado';
                                    const mit = obtenerPorcentajeMitigacion(efectividad);
                                    const fRes = calcularFrecuenciaResidual(causa.frecuencia || 1, mit);
                                    const iRes = calcularImpactoResidual(causa.calificacionGlobalImpacto || 1, mit);
                                    const cRes = calcularCalificacionResidual(fRes, iRes);

                                    return (
                                      <TableRow
                                        key={causa.id}
                                        hover
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => handleClasificarCausa(riesgo, causa)}
                                      >
                                        <TableCell><Typography variant="body2" sx={{ maxWidth: 200 }}>{causa.descripcion}</Typography></TableCell>
                                        <TableCell align="center">{causa.frecuencia}</TableCell>
                                        <TableCell align="center">{causa.calificacionGlobalImpacto?.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                          <Button size="small" variant={puntajeTotal > 0 ? "outlined" : "contained"}
                                            onClick={() => handleClasificarCausa(riesgo, causa)}
                                          >
                                            {puntajeTotal > 0 ? `${puntajeTotal} pts` : 'Evaluar'}
                                          </Button>
                                        </TableCell>
                                        <TableCell align="center">{(mit * 100).toFixed(0)}%</TableCell>
                                        <TableCell align="center">{fRes}</TableCell>
                                        <TableCell align="center">{iRes.toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                          <Chip label={cRes.toFixed(2)} color={cRes >= 15 ? 'error' : cRes >= 10 ? 'warning' : 'success'} size="small" variant="outlined" />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          ) : (<Alert severity="info">No hay causas.</Alert>)}
                        </Box>
                      </Collapse>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: PLANES DE ACCIÓN */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                setFormPlan({
                  nombre: '',
                  descripcion: '',
                  objetivo: '',
                  fechaInicio: new Date().toISOString().split('T')[0],
                  fechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  responsableNombre: '',
                  presupuesto: 0,
                  observaciones: ''
                });
                setPlanDialogOpen(true);
              }}>
                Nuevo Plan
              </Button>
            </Box>
            {planesAccion.length === 0 && <Typography align="center" sx={{ py: 3 }}>No hay planes creados.</Typography>}
            {planesAccion.map((p, i) => (
              <Card
                key={i}
                sx={{ mb: 1, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                onClick={() => { setPlanSeleccionadoDetalle(p); setPlanDetalleOpen(true); }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{p.nombre}</Typography>
                    <Chip label={p.estado?.toUpperCase() || 'BORRADOR'} size="small" color="info" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>{p.objetivo}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                    <Typography variant="caption"><strong>Inicio:</strong> {p.fechaInicio}</Typography>
                    <Typography variant="caption"><strong>Límite:</strong> {p.fechaLimite}</Typography>
                    <Typography variant="caption"><strong>Responsable:</strong> {p.responsableNombre || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress variant="determinate" value={p.porcentajeAvance} sx={{ flexGrow: 1, height: 8, borderRadius: 1 }} />
                    <Typography variant="caption" fontWeight="bold">{p.porcentajeAvance}%</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* DIALOG CLASIFICACION */}
      <Dialog open={clasificacionDialogOpen} onClose={() => setClasificacionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gestionar Causa</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Causa: <strong>{causaSeleccionada?.descripcion}</strong></Typography>
          <Typography variant="subtitle2" gutterBottom>Seleccione el tipo de gestión para esta causa:</Typography>
          <RadioGroup value={tipoGestion} onChange={(e) => setTipoGestion(e.target.value as any)}>
            <FormControlLabel value="CONTROL" control={<Radio />} label="Control (Mitigación Inmediata - Afecta Residual)" />
            <FormControlLabel value="PLAN" control={<Radio />} label="Plan de Acción (Mejora Futura)" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClasificacionDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleProcesarClasificacion} disabled={!tipoGestion}>Continuar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG PLAN */}
      <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Plan de Acción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth label="Nombre del Plan" value={formPlan.nombre} onChange={e => setFormPlan({ ...formPlan, nombre: e.target.value })} />
            <TextField fullWidth label="Descripción" multiline rows={2} value={formPlan.descripcion} onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })} />
            <TextField fullWidth label="Objetivo" multiline rows={2} value={formPlan.objetivo} onChange={e => setFormPlan({ ...formPlan, objetivo: e.target.value })} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Fecha Inicio" type="date" InputLabelProps={{ shrink: true }} value={formPlan.fechaInicio} onChange={e => setFormPlan({ ...formPlan, fechaInicio: e.target.value })} />
              <TextField fullWidth label="Fecha Límite" type="date" InputLabelProps={{ shrink: true }} value={formPlan.fechaLimite} onChange={e => setFormPlan({ ...formPlan, fechaLimite: e.target.value })} />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Responsable" value={formPlan.responsableNombre} onChange={e => setFormPlan({ ...formPlan, responsableNombre: e.target.value })} />
              <TextField fullWidth label="Presupuesto" type="number" value={formPlan.presupuesto} onChange={e => setFormPlan({ ...formPlan, presupuesto: Number(e.target.value) })} />
            </Box>

            <TextField fullWidth label="Observaciones" multiline rows={2} value={formPlan.observaciones} onChange={e => setFormPlan({ ...formPlan, observaciones: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            const created = await createPlanAccion({
              riesgoId: riesgoIdEvaluacion,
              nombre: formPlan.nombre,
              descripcion: formPlan.descripcion,
              objetivo: formPlan.objetivo,
              fechaInicio: formPlan.fechaInicio,
              fechaFin: formPlan.fechaLimite,
              responsable: formPlan.responsableNombre,
              presupuesto: formPlan.presupuesto,
              observaciones: formPlan.observaciones,
              estado: 'borrador',
              porcentajeAvance: 0
            }).unwrap();

            setPlanesAccion([...planesAccion, {
              id: String(created.id),
              riesgoId: String(created.riesgoId || riesgoIdEvaluacion || ''),
              nombre: created.nombre || formPlan.nombre,
              descripcion: created.descripcion,
              objetivo: created.objetivo || formPlan.objetivo,
              fechaInicio: created.fechaInicio ? String(created.fechaInicio).slice(0, 10) : formPlan.fechaInicio,
              fechaLimite: created.fechaFin ? String(created.fechaFin).slice(0, 10) : formPlan.fechaLimite,
              responsableNombre: created.responsable || formPlan.responsableNombre,
              estado: created.estado || 'borrador',
              porcentajeAvance: created.porcentajeAvance || 0,
              presupuesto: created.presupuesto,
              observaciones: created.observaciones
            }]);
            setPlanDialogOpen(false);
            showSuccess('Plan de acción creado exitosamente');
          }}>Guardar Plan</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DETALLE PLAN */}
      <Dialog open={planDetalleOpen} onClose={() => setPlanDetalleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Detalle del Plan de Acción</DialogTitle>
        <DialogContent dividers>
          {planSeleccionadoDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Nombre</Typography>
                <Typography variant="h6">{planSeleccionadoDetalle.nombre}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Objetivo</Typography>
                  <Typography variant="body1">{planSeleccionadoDetalle.objetivo}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Descripción</Typography>
                  <Typography variant="body1">{planSeleccionadoDetalle.descripcion || 'Sin descripción'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Fecha Inicio</Typography>
                  <Typography variant="body1">{planSeleccionadoDetalle.fechaInicio}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Fecha Límite</Typography>
                  <Typography variant="body1">{planSeleccionadoDetalle.fechaLimite}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Estado</Typography>
                  <Chip label={planSeleccionadoDetalle.estado?.toUpperCase()} color="info" size="small" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Responsable</Typography>
                  <Typography variant="body1">{planSeleccionadoDetalle.responsableNombre || 'No asignado'}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Presupuesto</Typography>
                  <Typography variant="body1">${planSeleccionadoDetalle.presupuesto?.toLocaleString() || '0'}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Avance</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress variant="determinate" value={planSeleccionadoDetalle.porcentajeAvance} sx={{ flexGrow: 1, height: 10, borderRadius: 1 }} />
                  <Typography variant="h6">{planSeleccionadoDetalle.porcentajeAvance}%</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">Observaciones</Typography>
                <Typography variant="body2">{planSeleccionadoDetalle.observaciones || 'Sin observaciones'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDetalleOpen(false)} variant="contained">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG EVALUACIÓN CONTROL (Residual) */}
      <Dialog open={dialogEvaluacionOpen} onClose={() => setDialogEvaluacionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Evaluación de Control</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Aplicabilidad</InputLabel>
              <Select value={criteriosEvaluacion.aplicabilidad} label="Aplicabilidad" onChange={(e) => {
                const v = e.target.value; const p = v === 'totalmente' ? 100 : v === 'parcial' ? 30 : 0;
                setCriteriosEvaluacion(pr => ({ ...pr, aplicabilidad: v, puntajeAplicabilidad: p }));
              }}>
                <MenuItem value="totalmente">Totalmente (100)</MenuItem>
                <MenuItem value="parcial">Parcialmente (30)</MenuItem>
                <MenuItem value="nula">Nula (0)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Cobertura</InputLabel>
              <Select value={criteriosEvaluacion.cobertura} label="Cobertura" onChange={(e) => {
                const v = e.target.value; const p = v === 'total' ? 100 : v === 'significativa' ? 70 : 10;
                setCriteriosEvaluacion(pr => ({ ...pr, cobertura: v, puntajeCobertura: p }));
              }}>
                <MenuItem value="total">Total (100)</MenuItem>
                <MenuItem value="significativa">Significativa (70)</MenuItem>
                <MenuItem value="minima">Mínima (10)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Facilidad de Uso</InputLabel>
              <Select value={criteriosEvaluacion.facilidadUso} label="Facilidad de Uso" onChange={(e) => {
                const v = e.target.value; const p = v === 'facil' ? 100 : v === 'moderada' ? 70 : 30;
                setCriteriosEvaluacion(pr => ({ ...pr, facilidadUso: v, puntajeFacilidad: p }));
              }}>
                <MenuItem value="facil">Fácil (100)</MenuItem>
                <MenuItem value="moderada">Moderada (70)</MenuItem>
                <MenuItem value="dificil">Difícil (30)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Segregación</InputLabel>
              <Select value={criteriosEvaluacion.segregacion} label="Segregación" onChange={(e) => {
                const v = e.target.value; const p = v === 'si' ? 100 : 0;
                setCriteriosEvaluacion(pr => ({ ...pr, segregacion: v, puntajeSegregacion: p }));
              }}>
                <MenuItem value="si">Sí (100)</MenuItem>
                <MenuItem value="no">No (0)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Naturaleza</InputLabel>
              <Select value={criteriosEvaluacion.naturaleza} label="Naturaleza" onChange={(e) => {
                const v = e.target.value; const p = v === 'preventivo' ? 100 : v === 'detective' ? 60 : 40;
                setCriteriosEvaluacion(pr => ({ ...pr, naturaleza: v, puntajeNaturaleza: p }));
              }}>
                <MenuItem value="preventivo">Preventivo (100)</MenuItem>
                <MenuItem value="detective">Detective (60)</MenuItem>
                <MenuItem value="correctivo">Correctivo (40)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Mitigación</InputLabel>
              <Select value={criteriosEvaluacion.tipoMitigacion} label="Tipo Mitigación" onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, tipoMitigacion: e.target.value as any }))}>
                <MenuItem value="FRECUENCIA">Frecuencia</MenuItem>
                <MenuItem value="IMPACTO">Impacto</MenuItem>
                <MenuItem value="AMBAS">Ambas</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Recomendación" multiline rows={2} value={criteriosEvaluacion.recomendacion} onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, recomendacion: e.target.value }))} />

            {/* Calculo Preview */}
            {(() => {
              const pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
              return <Typography variant="subtitle2" align="right">Puntaje Total: {pt.toFixed(0)}</Typography>;
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEvaluacionOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={async () => {
            const riesgo = riesgos.find(r => r.id === riesgoIdEvaluacion);
            if (riesgo && causaIdEvaluacion) {
              let causaActualizada: any = null;
              const causasUpd = riesgo.causas.map((c: any) => {
                if (c.id === causaIdEvaluacion) {
                  // Logic recalculation
                  const pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
                  const prel = determinarEvaluacionPreliminar(pt);
                  const def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.recomendacion);
                  const mit = obtenerPorcentajeMitigacionAvanzado(def);
                  const fRes = calcularFrecuenciaResidualAvanzada(c.frecuencia || 1, c.calificacionGlobalImpacto || 1, mit, criteriosEvaluacion.tipoMitigacion);
                  const iRes = calcularImpactoResidualAvanzado(c.calificacionGlobalImpacto || 1, c.frecuencia || 1, mit, criteriosEvaluacion.tipoMitigacion);

                  causaActualizada = {
                    ...c, ...criteriosEvaluacion,
                    puntajeTotal: pt, evaluacionDefinitiva: def, porcentajeMitigacion: mit,
                    frecuenciaResidual: fRes, impactoResidual: iRes,
                    calificacionResidual: calcularCalificacionResidual(fRes, iRes)
                  };
                  return causaActualizada;
                }
                return c;
              });
              if (causaActualizada) {
                await updateCausa({
                  id: causaActualizada.id,
                  tipoGestion: 'CONTROL',
                  gestion: causaActualizada
                }).unwrap();
              }
              await actualizarRiesgoApi(riesgoIdEvaluacion!, { causas: causasUpd } as any);
              setDialogEvaluacionOpen(false);
            }
          }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
