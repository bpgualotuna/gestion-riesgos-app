import React, { memo, Fragment } from 'react';
import {
  Card,
  Box,
  Typography,
  IconButton,
  Chip,
  Collapse,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Shield as ShieldIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';
import { etiquetaTipologiaRiesgoTabla } from '../../../utils/tipologiaEstrategia';
import { formatDateISO } from '../../../utils/formatters';
import {
  etiquetaNivelMostrar,
  normalizarCalificacionResidualNumero,
  estiloCajaPorCalificacionCWR
} from '../utils/controlesUtils';
import { estiloNivelResidualDesdeNombre } from '../../../utils/residualNivelColor';
import { NIVELES_RIESGO } from '../../../utils/constants';
import { useGetReglaResidualPlanCausaQuery } from '../../../api/services/riesgosApi';
import {
  causaGestionControlSinControlesAsociados,
  causaTienePlanSinControlAsociado,
  tituloTooltipFilaControlResidual,
  tituloTooltipFilaPlanResidual,
} from '../../../utils/avisoResidualPorCausa';

const esClasificacionPositiva = (valor: string | null | undefined): boolean => {
  const texto = String(valor || '').trim().toLowerCase();
  return texto.includes('positiva') || texto.includes('oportunidad');
};

/**
 * Calcula el nivel de riesgo inherente basado en las causas si no existe uno global.
 */
export const getNivelRiesgoCalculado = (riesgo: any) => {
  let nivelRiesgo = riesgo.evaluacion?.nivelRiesgo || riesgo.nivelRiesgo;

  if (!nivelRiesgo && riesgo.causas && riesgo.causas.length > 0) {
    const calificaciones = riesgo.causas
      .map((c: any) => {
        const impacto = c.calificacionGlobalImpacto || riesgo.evaluacion?.impactoGlobal || 1;
        const frecuencia = typeof c.frecuencia === 'string'
          ? (c.frecuencia === '1' ? 1 : c.frecuencia === '2' ? 2 : c.frecuencia === '3' ? 3 : c.frecuencia === '4' ? 4 : c.frecuencia === '5' ? 5 : 3)
          : (c.frecuencia || 3);
        const cal = frecuencia === 2 && impacto === 2 ? 3.99 : frecuencia * impacto;
        return cal;
      })
      .filter((cal: number) => !isNaN(cal));

    if (calificaciones.length > 0) {
      const calificacionMax = Math.max(...calificaciones);
      if (calificacionMax >= 15 && calificacionMax <= 25) nivelRiesgo = 'Crítico';
      else if (calificacionMax >= 10 && calificacionMax <= 14) nivelRiesgo = 'Alto';
      else if (calificacionMax >= 4 && calificacionMax <= 9) nivelRiesgo = 'Medio';
      else if (calificacionMax >= 1 && calificacionMax <= 3) nivelRiesgo = 'Bajo';
      else nivelRiesgo = 'Sin Calificar';
    }
  }
  return nivelRiesgo || 'Sin Calificar';
};

export const getNivelResidualFromRangos = (rangos: any[] | undefined, calificacion: number): string => {
  if (!rangos?.length) return 'Sin Calificar';
  for (const r of rangos) {
    const okMin = r.incluirMinimo ? calificacion >= r.valorMinimo : calificacion > r.valorMinimo;
    const okMax = r.incluirMaximo ? calificacion <= r.valorMaximo : calificacion < r.valorMaximo;
    if (okMin && okMax) return r.nivelNombre;
  }
  return 'Sin Calificar';
};

// COMPONENTE DE FILA MEMOIZADO PARA CLASIFICACIÓN
export const RiesgoCardClasificacion = memo(({ riesgo, estaExpandido, onToggle, onEvaluar, setTipoClasificacion, nivelesRiesgoCatalog }: any) => {
  const nivelRiesgo = getNivelRiesgoCalculado(riesgo);
  const stChip = estiloNivelResidualDesdeNombre(nivelRiesgo, nivelesRiesgoCatalog);
  const riesgoPositivo = esClasificacionPositiva(riesgo?.clasificacion);

  return (
    <Card sx={{ mb: 1.5, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '48px 50px 1fr 120px 100px 100px 48px' },
          gap: { xs: 1, md: 2 },
          p: { xs: 2, md: 1.5 },
          px: { md: 3 },
          cursor: 'pointer',
          bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
          alignItems: { xs: 'flex-start', md: 'center' },
          width: '100%',
          minWidth: 0,
          minHeight: 64,
          position: 'relative',
          boxSizing: 'border-box',
          '& > *': { minWidth: 0 },
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
            {estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>
        <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ minWidth: 0, textAlign: { md: 'center' } }}>
          {riesgo.numeroIdentificacion || riesgo.id}
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4, py: 0.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'break-word', wordBreak: 'break-word', minWidth: 0, maxWidth: '100%', textAlign: 'left' }}>
          {repairSpanishDisplayArtifacts(riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || 'Sin descripción')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: { md: 'nowrap' } }}>
          {etiquetaTipologiaRiesgoTabla(riesgo)}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0, width: '100%' }}>
          <Chip label={etiquetaNivelMostrar(nivelRiesgo)} size="small" sx={{ backgroundColor: stChip.bg, color: stChip.color, fontWeight: 700, fontSize: '0.65rem', height: 24, minWidth: 80 }} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0, width: '100%' }}>
          <Chip label={`${riesgo.causas.length} pend.`} size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
        </Box>
        <Box sx={{ minWidth: 0 }} />
      </Box>
      <Collapse in={estaExpandido}>
        <Box sx={{ p: 2 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#eee' }}>
                  <TableCell>Causa</TableCell>
                  <TableCell align="center">Frecuencia</TableCell>
                  <TableCell align="center">Impacto</TableCell>
                  <TableCell align="center" width="250">Tipo de Gestión</TableCell>
                  <TableCell align="center">Pendiente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgo.causas.map((causa: any) => {
                  const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
                  if (tipoGestion === 'AMBOS') {
                    const estadoAmbos = causa.gestion?.estadoAmbos;
                    if (estadoAmbos?.controlActivo !== false && estadoAmbos?.planActivo !== false) return null;
                  } else if (tipoGestion !== 'PENDIENTE' && tipoGestion !== 'CONTROL' && tipoGestion !== 'PLAN') {
                    return null;
                  }

                  return (
                    <TableRow key={causa.id}>
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>{causa.descripcion}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>{causa.frecuencia || 1}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem' }}>{(causa.calificacionGlobalImpacto || 1).toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel sx={{ fontSize: '0.75rem' }}>Acción de Gestión</InputLabel>
                          <Select
                            value=""
                            label="Acción de Gestión"
                            sx={{ height: 32, fontSize: '0.75rem' }}
                            onChange={(e) => {
                              const accion = e.target.value;
                              if (accion) {
                                setTipoClasificacion(accion as any);
                                setTimeout(() => onEvaluar(riesgo.id, causa), 0);
                              }
                            }}
                          >
                            {!riesgoPositivo && (
                              <MenuItem value="CONTROL"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShieldIcon sx={{ fontSize: 16 }} /> Control</Box></MenuItem>
                            )}
                            <MenuItem value="PLAN"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AssignmentIcon sx={{ fontSize: 16 }} /> Plan de Acción</Box></MenuItem>
                            {!riesgoPositivo && (
                              <MenuItem value="AMBOS"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CheckCircleIcon sx={{ fontSize: 16 }} /> Ambos</Box></MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const t = (causa.tipoGestion || '').toUpperCase();
                          if (t === 'PENDIENTE' || !t) return <Chip label="Sin Clasificar" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#f5f5f5', color: '#757575' }} />;
                          return <Chip label={t === 'CONTROL' ? 'Control' : t === 'PLAN' ? 'Plan' : 'Ambos'} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />;
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Card>
  );
});

// COMPONENTE DE FILA MEMOIZADO PARA CONTROLES
export const RiesgoCardControles = memo(({ riesgo, estaExpandido, onToggle, onEvaluar, onEliminar, setTipoClasificacion, nivelesRiesgoCatalog, configResidual, procesoResidualEstrategico }: any) => {
  const { data: reglaResidualPlanCausa } = useGetReglaResidualPlanCausaQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const reglaPlanCausaActiva = Boolean(reglaResidualPlanCausa?.activa);
  const riesgoPositivo = esClasificacionPositiva(riesgo?.clasificacion);
  const ev = riesgo.evaluacion || {};
  let nivelRiesgo: string | undefined | null = null;

  if (procesoResidualEstrategico) {
    const nvG = ev.nivelRiesgoResidual;
    if (nvG && String(nvG).trim() && String(nvG).trim() !== 'Sin Calificar') {
      nivelRiesgo = String(nvG).trim();
    } else if (ev.riesgoResidual != null && ev.riesgoResidual !== '') {
      const calG = normalizarCalificacionResidualNumero(ev.riesgoResidual);
      if (calG != null && calG > 0 && configResidual?.rangosNivelRiesgo?.length) {
        const nv = getNivelResidualFromRangos(configResidual.rangosNivelRiesgo, calG);
        if (nv && nv !== 'Sin Calificar') nivelRiesgo = nv;
      }
    }
  }

  if (!nivelRiesgo && riesgo.causas?.length) {
    const causasConControles = riesgo.causas.filter((c: any) => {
      const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
      return tipo === 'CONTROL' || tipo === 'AMBOS';
    });
    if (causasConControles.length > 0) {
      const qualifications = causasConControles.map((c: any) => {
        if (c.calificacionResidual != null) return Number(c.calificacionResidual);
        if (c.riesgoResidual != null) return Number(c.riesgoResidual);
        const fr = Number(c.frecuenciaResidual ?? c.gestion?.frecuenciaResidual);
        const ir = Number(c.impactoResidual ?? c.gestion?.impactoResidual);
        if (isNaN(fr) || isNaN(ir)) return NaN;
        return fr === 2 && ir === 2 ? 3.99 : fr * ir;
      }).filter((cal: number) => !isNaN(cal) && cal > 0);
      
      if (qualifications.length > 0) {
        const calMax = Math.max(...qualifications);
        if (calMax >= 15) nivelRiesgo = 'Crítico';
        else if (calMax >= 10) nivelRiesgo = 'Alto';
        else if (calMax >= 4) nivelRiesgo = 'Medio';
        else if (calMax >= 1) nivelRiesgo = 'Bajo';
      }
    }
  }

  const nivelParaLabel = String(nivelRiesgo || 'Sin Calificar').replace(/nivel\s*/gi, '').trim();
  const prGlob = ev.probabilidadResidual;
  const irGlob = ev.impactoResidual;
  const rrGlob = ev.riesgoResidual;
  let calParaSemaforo: number | null = null;
  let fSem: any = prGlob;
  let iSem: any = irGlob;

  const calDesdeGlobal = normalizarCalificacionResidualNumero(rrGlob);
  if (calDesdeGlobal != null && calDesdeGlobal >= 0) {
    calParaSemaforo = calDesdeGlobal;
  } else if (procesoResidualEstrategico && riesgo.causas?.length) {
    const causasRes = riesgo.causas.map((c: any) => {
      const fr = Number(c.frecuenciaResidual ?? c.gestion?.frecuenciaResidual ?? prGlob);
      const ir = Number(c.impactoResidual ?? c.gestion?.impactoResidual ?? irGlob);
      const cal = Number(c.calificacionResidual ?? c.gestion?.calificacionResidual ?? rrGlob ?? (fr === 2 && ir === 2 ? 3.99 : fr * ir));
      return { fr, ir, cal };
    }).filter((x: any) => !isNaN(x.cal) && x.cal > 0);

    const calMax = causasRes.length > 0 ? Math.max(...causasRes.map((x: any) => x.cal)) : 0;
    if (calMax > 0) {
      calParaSemaforo = calMax;
      const winner = causasRes.find((x: any) => Math.abs(x.cal - calMax) < 0.1);
      if (winner) { fSem = winner.fr; iSem = winner.ir; }
    }
  }

  const stChip2 = procesoResidualEstrategico && calParaSemaforo != null && calParaSemaforo > 0
    ? estiloCajaPorCalificacionCWR(calParaSemaforo, nivelParaLabel, fSem, iSem, nivelesRiesgoCatalog)
    : estiloNivelResidualDesdeNombre(nivelParaLabel, nivelesRiesgoCatalog);

  return (
    <Card sx={{ mb: 1.5, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '45px minmax(64px, 90px) minmax(220px, 2.2fr) minmax(96px, 150px) minmax(100px, 120px) minmax(100px, 120px) 50px' },
          gap: { xs: 1, md: 1 },
          p: { xs: 2, md: 1.5 },
          cursor: 'pointer',
          bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
          alignItems: { xs: 'flex-start', md: 'center' },
          width: '100%',
          minWidth: 0,
          minHeight: 64,
          position: 'relative',
          boxSizing: 'border-box',
          '& > *': { minWidth: 0 },
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}><IconButton size="small" color="primary" sx={{ p: 0.5 }}>{estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton></Box>
        <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem" sx={{ minWidth: 0, textAlign: { md: 'center' } }}>{riesgo.numeroIdentificacion || riesgo.numero || 'Sin ID'}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, fontSize: '0.8rem', color: 'text.primary', overflowWrap: 'break-word', wordBreak: 'break-word', pr: 1, minWidth: 0, maxWidth: '100%', textAlign: 'left' }}>{repairSpanishDisplayArtifacts(riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || 'Sin descripción')}</Typography>
        <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%' }}>{etiquetaTipologiaRiesgoTabla(riesgo)}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0, width: '100%' }}><Chip label={etiquetaNivelMostrar(nivelParaLabel)} size="small" sx={{ backgroundColor: stChip2.bg, color: stChip2.color, fontWeight: 700, fontSize: '0.65rem', height: 24, minWidth: 80 }} /></Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0, width: '100%' }}><Chip label={riesgoPositivo ? 'No Aplica' : 'Control Activo'} size="small" color={riesgoPositivo ? 'default' : 'success'} variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }} /></Box>
        <Box sx={{ minWidth: 0 }} />
      </Box>
      <Collapse in={estaExpandido}>
        <Box sx={{ p: 2 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#eee' }}><TableCell>Causa Original</TableCell><TableCell>Descripción del Control</TableCell><TableCell align="center">Efectividad</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
              <TableBody>
                {riesgo.causas.map((causa: any) => {
                  const control = causa.controles?.[0] || {};
                  return (
                    <Fragment key={causa.id}>
                      {causaGestionControlSinControlesAsociados(causa) && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ py: 0.5, border: 0 }}>
                            <Alert severity="warning" variant="outlined" sx={{ py: 0.25, '& .MuiAlert-message': { py: 0 } }}>
                              <Typography variant="caption" component="span">
                                Calificación <strong>residual</strong> puede igualar a la <strong>inherente</strong> por falta de control asociado a esta causa.
                              </Typography>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow title={tituloTooltipFilaControlResidual(reglaPlanCausaActiva)}>
                        <TableCell sx={{ maxWidth: 250 }}><Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>{causa.descripcion}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{repairSpanishDisplayArtifacts(control.descripcionControl || control.descripcion || causa.controlDescripcion || 'Sin descripción')}</Typography></TableCell>
                        <TableCell align="center"><Chip label={riesgoPositivo ? 'No Aplica' : (control.evaluacionDefinitiva || 'Sin Evaluar')} size="small" variant="outlined" color={riesgoPositivo ? 'default' : (control.evaluacionDefinitiva ? "primary" : "default")} sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} /></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            {!riesgoPositivo && (
                              <>
                                <IconButton size="small" color="primary" onClick={() => { setTipoClasificacion('CONTROL'); onEvaluar(riesgo.id, causa); }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                                <IconButton size="small" color="error" onClick={() => onEliminar(riesgo.id, causa, 'CONTROL')}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Card>
  );
});

// COMPONENTE DE FILA MEMOIZADO PARA PLANES
export const RiesgoCardPlanes = memo(({ riesgo, estaExpandido, onToggle, onEvaluar, onEliminar, setTipoClasificacion }: any) => {
  const { data: reglaResidualPlanCausa } = useGetReglaResidualPlanCausaQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const reglaPlanCausaActiva = Boolean(reglaResidualPlanCausa?.activa);
  return (
    <Card sx={{ mb: 1.5, width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '45px minmax(64px, 90px) minmax(220px, 2.4fr) minmax(96px, 150px) minmax(100px, 120px) 50px' },
          gap: { xs: 1, md: 1 },
          p: { xs: 2, md: 1.5 },
          cursor: 'pointer',
          bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
          alignItems: { xs: 'flex-start', md: 'center' },
          width: '100%',
          minWidth: 0,
          minHeight: 64,
          position: 'relative',
          boxSizing: 'border-box',
          '& > *': { minWidth: 0 },
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}><IconButton size="small" color="primary" sx={{ p: 0.5 }}>{estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton></Box>
        <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem" sx={{ minWidth: 0, textAlign: { md: 'center' } }}>{riesgo.numeroIdentificacion || riesgo.id}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4, fontSize: '0.8rem', color: 'text.primary', overflowWrap: 'break-word', wordBreak: 'break-word', pr: 1, minWidth: 0, maxWidth: '100%', textAlign: 'left' }}>{repairSpanishDisplayArtifacts(riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || 'Sin descripción')}</Typography>
        <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '100%' }}>{etiquetaTipologiaRiesgoTabla(riesgo)}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0, width: '100%' }}><Chip label="Plan Activo" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></Box>
        <Box sx={{ minWidth: 0 }} />
      </Box>
      <Collapse in={estaExpandido}>
        <Box sx={{ p: 2 }}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow sx={{ bgcolor: '#eee' }}><TableCell>Causa Original</TableCell><TableCell>Descripción del Plan</TableCell><TableCell>Responsable</TableCell><TableCell align="center">Fecha Estimada</TableCell><TableCell align="center">Acciones</TableCell></TableRow></TableHead>
              <TableBody>
                {riesgo.causas.map((causa: any) => {
                  const plan = causa.planesAccion?.[0] || {};
                  return (
                    <Fragment key={causa.id}>
                      {reglaPlanCausaActiva && causaTienePlanSinControlAsociado(causa) ? (
                        <TableRow>
                          <TableCell colSpan={5} sx={{ py: 0.5, border: 0 }}>
                            <Alert severity="info" variant="outlined" sx={{ py: 0.25, '& .MuiAlert-message': { py: 0 } }}>
                              <Typography variant="caption" component="span">
                                <strong>Residual = inherente</strong>: plan sin control (regla activa).
                              </Typography>
                            </Alert>
                          </TableCell>
                        </TableRow>
                      ) : (
                        causaGestionControlSinControlesAsociados(causa) && (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ py: 0.5, border: 0 }}>
                              <Alert severity="warning" variant="outlined" sx={{ py: 0.25, '& .MuiAlert-message': { py: 0 } }}>
                                <Typography variant="caption" component="span">
                                  Calificación <strong>residual</strong> puede igualar a la <strong>inherente</strong> por falta de control en esta causa.
                                </Typography>
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                      <TableRow title={tituloTooltipFilaPlanResidual(reglaPlanCausaActiva)}>
                        <TableCell sx={{ maxWidth: 250 }}><Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>{causa.descripcion}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{plan.descripcion || 'Sin descripción'}</Typography></TableCell>
                        <TableCell><Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{plan.responsable || 'N/A'}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{formatDateISO(plan.fechaFin || plan.fechaProgramada) || 'N/A'}</Typography></TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <IconButton size="small" color="primary" onClick={() => { setTipoClasificacion('PLAN'); onEvaluar(riesgo.id, causa); }}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                            <IconButton size="small" color="error" onClick={() => onEliminar(riesgo.id, causa, 'PLAN')}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </Card>
  );
});
