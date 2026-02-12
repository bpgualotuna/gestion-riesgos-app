/**
 * Identificación y Calificación Page
 * Rebuilt with rich UI (Causas, Impacto) and full Backend Integration.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';

import {
  useGetRiesgosQuery,
  useCreateRiesgoMutation,
  useUpdateRiesgoMutation,
  useDeleteRiesgoMutation,
  useGetTiposRiesgosQuery,
  useGetObjetivosQuery,
  useGetFrecuenciasQuery,
  useGetFuentesQuery,
  useGetOrigenesQuery,
  useGetTiposProcesoQuery,
  useGetConsecuenciasQuery,
  useGetImpactosQuery,
  useGetVicepresidenciasQuery,
} from '../../api/services/riesgosApi';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';

// Helpers
const normalizarDescripcionesImpacto = (data?: any[]) => {
  const result: Record<string, Record<number, string>> = {
    economico: {}, procesos: {}, legal: {}, confidencialidadSGSI: {},
    reputacion: {}, disponibilidadSGSI: {}, integridadSGSI: {}, ambiental: {}, personas: {}
  };
  if (!data) return result;
  data.forEach((item: any) => {
    try {
      if (item.clave.startsWith('impacto_')) {
        const key = item.clave.replace('impacto_', '');
        result[key] = JSON.parse(item.valor);
      }
    } catch (e) { }
  });
  return result;
};

export default function IdentificacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess, showError } = useNotification();

  // Queries
  const { data: riesgosData, isLoading: isLoadingRiesgos } = useGetRiesgosQuery(
    { procesoId: procesoSeleccionado?.id ? Number(procesoSeleccionado.id) : undefined },
    { skip: !procesoSeleccionado?.id }
  );

  const { data: tiposRiesgosApi } = useGetTiposRiesgosQuery();
  const { data: objetivosApi } = useGetObjetivosQuery();
  const { data: frecuenciasApi } = useGetFrecuenciasQuery();
  const { data: fuentesApi } = useGetFuentesQuery();
  const { data: origenesApi } = useGetOrigenesQuery();
  const { data: tiposProcesoApi } = useGetTiposProcesoQuery();
  const { data: consecuenciasApi } = useGetConsecuenciasQuery();
  const { data: impactosApi } = useGetImpactosQuery();
  const { data: vpsApi } = useGetVicepresidenciasQuery();

  // Mutations
  const [createRiesgo] = useCreateRiesgoMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();
  const [deleteRiesgo] = useDeleteRiesgoMutation();

  const [expanded, setExpanded] = useState<string | false>(false);

  // Catalogs
  const catalogos = useMemo(() => ({
    tiposRiesgos: (tiposRiesgosApi || []).map((t: any) => ({
      ...t,
      subtipos: t.subtipos || []
    })),
    objetivos: objetivosApi || [],
    frecuencias: (frecuenciasApi || []).map((f: any, i: number) => ({
      id: i + 1,
      nombre: f.nombre || f.label || f
    })),
    fuentes: (fuentesApi || []).map((f: any) => f.nombre || f),
    origenes: (origenesApi || []).map((o: any) => o.nombre || o),
    tiposProceso: (tiposProcesoApi || []).map((t: any) => t.nombre || t),
    consecuencias: (consecuenciasApi || []).map((c: any) => c.nombre || c),
    impactosDesc: normalizarDescripcionesImpacto(impactosApi),
  }), [tiposRiesgosApi, objetivosApi, frecuenciasApi, fuentesApi, origenesApi, tiposProcesoApi, consecuenciasApi, impactosApi]);

  const handleAgregarRiesgo = async () => {
    if (!procesoSeleccionado) return;
    try {
      const numeroIdentificacion = `RIES-${Date.now()}`;
      await createRiesgo({
        procesoId: Number(procesoSeleccionado.id),
        descripcion: 'Nuevo Riesgo',
        numeroIdentificacion,
        evaluacion: {
          impactoEconomico: 1, impactoProcesos: 1, impactoLegal: 1,
          impactoTecnologico: 1, impactoReputacion: 1, impactoAmbiental: 1, impactoPersonas: 1,
          probabilidad: 1, impactoGlobal: 1, impactoMaximo: 1, riesgoInherente: 1, nivelRiesgo: 'Bajo'
        }
      }).unwrap();
      showSuccess('Riesgo creado');
    } catch (e) {
      showError('Error al crear riesgo');
    }
  };

  const handleEliminarRiesgo = async (id: string) => {
    if (!window.confirm('¿Eliminar riesgo?')) return;
    try {
      await deleteRiesgo(id).unwrap();
      showSuccess('Riesgo eliminado');
    } catch (e) {
      showError('Error al eliminar');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout title="Identificación y Calificación">
        <FiltroProcesoSupervisor />
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Seleccione un proceso para continuar</Typography>
        </Box>
      </AppPageLayout>
    );
  }

  return (
    <AppPageLayout title={`Identificación - ${procesoSeleccionado.nombre}`}>
      <FiltroProcesoSupervisor />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Riesgos Identificados</Typography>
        {!isReadOnly && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAgregarRiesgo}>
            Añadir Riesgo
          </Button>
        )}
      </Box>

      {isLoadingRiesgos ? <CircularProgress /> : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {riesgosData?.data.map((r: any) => (
            <Accordion key={r.id} expanded={expanded === r.id.toString()} onChange={() => setExpanded(expanded === r.id.toString() ? false : r.id.toString())}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', pr: 2 }}>
                  <Typography fontWeight={700} color="primary">
                    {r.numeroIdentificacion} - {r.descripcion || 'Sin descripción'}
                  </Typography>
                  {!isReadOnly && (
                    <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleEliminarRiesgo(r.id); }}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <RiesgoFormDetailed
                  riesgo={r}
                  catalogos={catalogos}
                  isReadOnly={isReadOnly}
                  onUpdate={(id: any, fields: any) => updateRiesgo({ id, ...fields })}
                />
              </AccordionDetails>
            </Accordion>
          ))}
          {riesgosData?.data.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No hay riesgos registrados para este proceso</Typography>
            </Paper>
          )}
        </Box>
      )}
    </AppPageLayout>
  );
}

function RiesgoFormDetailed({ riesgo, catalogos, isReadOnly, onUpdate }: any) {
  const { showSuccess, showError } = useNotification();
  const [localRiesgo, setLocalRiesgo] = useState(riesgo);
  const [dialogCausaOpen, setDialogCausaOpen] = useState(false);
  const [causaEditando, setCausaEditando] = useState<any>(null);

  useEffect(() => { setLocalRiesgo(riesgo); }, [riesgo]);

  const handleChange = (field: string, value: any) => {
    setLocalRiesgo((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await onUpdate(localRiesgo.id, {
        descripcion: localRiesgo.descripcion,
        tipoRiesgoId: localRiesgo.tipoRiesgoId,
        objetivoId: localRiesgo.objetivoId,
        evaluacion: localRiesgo.evaluacion,
        causas: localRiesgo.causas
      }).unwrap();
      showSuccess('Guardado correctamente');
    } catch (e) {
      showError('Error al guardar');
    }
  };

  const currentEvaluacion = localRiesgo.evaluacion || {
    impactoEconomico: 1, impactoProcesos: 1, impactoLegal: 1,
    impactoTecnologico: 1, impactoReputacion: 1, impactoAmbiental: 1, impactoPersonas: 1
  };

  const handleImpactUpdate = (field: string, val: number) => {
    const newEval = { ...currentEvaluacion, [field]: val };
    handleChange('evaluacion', newEval);
  };

  return (
    <Box>
      <Grid2 container spacing={3}>
        {/* Panel RIESGO */}
        <Grid2 xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 1.5, textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>RIESGO</Typography>
            </Box>
            <CardContent>
              <TextField
                fullWidth label="Descripción del Riesgo" multiline rows={4}
                value={localRiesgo.descripcion || ''}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                disabled={isReadOnly} margin="normal" size="small"
              />
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Tipo de Riesgo</InputLabel>
                <Select
                  value={localRiesgo.tipoRiesgoId || ''}
                  onChange={(e) => handleChange('tipoRiesgoId', e.target.value)}
                  disabled={isReadOnly}
                >
                  {catalogos.tiposRiesgos.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Objetivo</InputLabel>
                <Select
                  value={localRiesgo.objetivoId || ''}
                  onChange={(e) => handleChange('objetivoId', e.target.value)}
                  disabled={isReadOnly}
                >
                  {catalogos.objetivos.map((o: any) => <MenuItem key={o.id} value={o.id}>{o.descripcion}</MenuItem>)}
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid2>

        {/* Panel CAUSAS */}
        <Grid2 xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 1.5, textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>CAUSAS</Typography>
            </Box>
            <CardContent sx={{ p: 0 }}>
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Frec.</TableCell>
                      {!isReadOnly && <TableCell align="right"></TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {localRiesgo.causas?.map((c: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: '0.75rem' }}>{c.descripcion}</TableCell>
                        <TableCell align="right">
                          <Chip label={c.frecuencia || 'N/A'} size="small" sx={{ height: 20, fontSize: '0.65rem' }} />
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => { setCausaEditando(c); setDialogCausaOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {(!localRiesgo.causas || localRiesgo.causas.length === 0) && (
                      <TableRow><TableCell colSpan={3} align="center"><Typography variant="caption">Sin causas</Typography></TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {!isReadOnly && (
                <Box sx={{ p: 2 }}>
                  <Button fullWidth variant="outlined" size="small" startIcon={<AddIcon />} onClick={() => { setCausaEditando(null); setDialogCausaOpen(true); }}>Añadir Causa</Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>

        {/* Panel IMPACTO */}
        <Grid2 xs={12} lg={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ bgcolor: '#1976d2', color: 'white', p: 1.5, textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>IMPACTO</Typography>
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries({
                  'Económico': 'impactoEconomico',
                  'Procesos': 'impactoProcesos',
                  'Legal': 'impactoLegal',
                  'Reputación': 'impactoReputacion',
                  'Personas': 'impactoPersonas',
                  'Ambiental': 'impactoAmbiental',
                  'Tecnológico': 'impactoTecnologico'
                }).map(([label, key]) => (
                  <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5, borderBottom: '1px solid #eee' }}>
                    <Typography variant="caption" fontWeight={500}>{label}</Typography>
                    <Select
                      size="small"
                      value={currentEvaluacion[key] || 1}
                      onChange={(e) => handleImpactUpdate(key, Number(e.target.value))}
                      disabled={isReadOnly}
                      sx={{ height: 24, fontSize: '0.75rem', width: 60 }}
                    >
                      {[1, 2, 3, 4, 5].map(v => <MenuItem key={v} value={v} sx={{ fontSize: '0.75rem' }}>{v}</MenuItem>)}
                    </Select>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {!isReadOnly && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave}>Guardar Cambios</Button>
        </Box>
      )}

      {/* Causa Dialog */}
      <Dialog open={dialogCausaOpen} onClose={() => setDialogCausaOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa' : 'Añadir Causa'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Descripción" multiline rows={2} margin="normal" size="small"
            defaultValue={causaEditando?.descripcion || ''}
            onBlur={(e) => setCausaEditando((prev: any) => ({ ...prev, descripcion: e.target.value }))}
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>Frecuencia</InputLabel>
            <Select
              defaultValue={causaEditando?.frecuencia || ''}
              onChange={(e) => setCausaEditando((prev: any) => ({ ...prev, frecuencia: e.target.value }))}
            >
              {catalogos.frecuencias.map((f: any) => <MenuItem key={f.id} value={f.nombre}>{f.nombre}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCausaOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => {
            const nuevasCausas = [...(localRiesgo.causas || [])];
            if (causaEditando?.id) {
              const idx = nuevasCausas.findIndex(c => c.id === causaEditando.id);
              if (idx !== -1) nuevasCausas[idx] = causaEditando;
            } else {
              nuevasCausas.push({ ...causaEditando, id: Date.now() });
            }
            handleChange('causas', nuevasCausas);
            setDialogCausaOpen(false);
          }}>Aceptar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
