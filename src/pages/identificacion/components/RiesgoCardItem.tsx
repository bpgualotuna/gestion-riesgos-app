import { memo, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  IconButton,
  Chip,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { RiesgoFormulario } from './RiesgoFormulario';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';
import { 
  determinarNivelRiesgoSync, 
  calcularCalificacionInherentePorCausaSync, 
  agregarCalificacionInherenteGlobalSync 
} from '../../../services/calificacionInherenteService';
import { calcularImpactoGlobal } from '../../../utils/calculations';
import { swalConfirmEliminarCausa } from '../../../lib/swal';

interface RiesgoCardItemProps {
  riesgo: any;
  estaExpandido: boolean;
  onToggleExpand: (riesgo: any) => void;
  onEliminarRiesgo: (id: string | number) => void;
  isReadOnly: boolean;
  // State and Handlers
  cambiosPendientes: any;
  actualizarRiesgo: (riesgoId: string, actualizacion: any) => void;
  procesoSeleccionado: any;
  onSave: (riesgoId: string) => void;
  setRiesgoIdParaCausa: (id: string | null) => void;
  setCausaEditando: (causa: any) => void;
  setNuevaCausaDescripcion: (desc: string) => void;
  setNuevaCausaFuente: (fuente: string) => void;
  setNuevaCausaFrecuencia: (frec: number) => void;
  setDialogCausaOpen: (open: boolean) => void;
  setCausasPendientes: (fn: (prev: any) => any) => void;
  setCausaSeleccionadaDetalle: (causa: any) => void;
  setCausaDetalleOpen: (open: boolean) => void;
  showSuccess: (msg: string) => void;
  // Catalog Data
  fuentesCausa: any;
  tiposRiesgos: any[];
  origenes: any[];
  tiposProceso: any[];
  consecuencias: any[];
  objetivos: any[];
  labelsFrecuencia: any;
  descripcionesImpacto: any;
  tipologiasTipo1ParaAutocomplete: any[];
  frecuenciasApi: any[];
  pesosImpactoApi: any[];
  nivelesRiesgoApi: any[];
  causaEliminando: string | null;
}

export const RiesgoCardItem = memo(function RiesgoCardItem({
  riesgo,
  estaExpandido,
  onToggleExpand,
  onEliminarRiesgo,
  isReadOnly,
  cambiosPendientes,
  actualizarRiesgo,
  procesoSeleccionado,
  onSave,
  setRiesgoIdParaCausa,
  setCausaEditando,
  setNuevaCausaDescripcion,
  setNuevaCausaFuente,
  setNuevaCausaFrecuencia,
  setDialogCausaOpen,
  setCausasPendientes,
  setCausaSeleccionadaDetalle,
  setCausaDetalleOpen,
  showSuccess,
  fuentesCausa,
  tiposRiesgos,
  origenes,
  tiposProceso,
  consecuencias,
  objetivos,
  labelsFrecuencia,
  descripcionesImpacto,
  tipologiasTipo1ParaAutocomplete,
  frecuenciasApi,
  pesosImpactoApi,
  nivelesRiesgoApi,
  causaEliminando,
}: RiesgoCardItemProps) {
  
  // Helpers locales (basados en los de la página principal)
  const obtenerPesoFrecuencia = (frecuencia: any, catFrecuencias: any[]): number => {
    const freqId = String(frecuencia ?? '3');
    const f = catFrecuencias.find((x: any) => String(x.id) === freqId || String(x.valor) === freqId || x.nombre === freqId);
    return Number(f?.peso ?? f?.valor ?? 3);
  };

  const tipoRiesgoObj = useMemo(() => {
    const tid = (riesgo as any).tipoRiesgoId;
    return (tiposRiesgos || []).find((t: any) =>
      (tid != null && String(t.id) === String(tid)) ||
      t.nombre === riesgo.tipoRiesgo ||
      t.codigo === riesgo.tipoRiesgo ||
      String(t.id) === String(riesgo.tipoRiesgo)
    );
  }, [riesgo.tipoRiesgo, (riesgo as any).tipoRiesgoId, tiposRiesgos]);

  const subtipoObj = useMemo(() => {
    if (!tipoRiesgoObj) return null;
    const sid = (riesgo as any).subtipoRiesgoId;
    return (tipoRiesgoObj.subtipos || []).find((s: any) =>
      (sid != null && String(s.id) === String(sid)) ||
      s.nombre === riesgo.subtipoRiesgo ||
      s.codigo === riesgo.subtipoRiesgo
    );
  }, [riesgo.subtipoRiesgo, (riesgo as any).subtipoRiesgoId, tipoRiesgoObj]);

  const getNivelRiesgoSync = (calificacion: number): { nivel: string; color: string; bgColor: string } => {
    if (calificacion === 0) return { nivel: 'Sin Calificar', color: '#666', bgColor: '#f5f5f5' };
    try {
      const nivelNombre = determinarNivelRiesgoSync(calificacion);
      const nivelesRiesgo = nivelesRiesgoApi || [];
      const nivel = nivelesRiesgo.find((n: any) =>
        n.nombre?.toUpperCase() === nivelNombre.toUpperCase() ||
        (n.nombre?.toUpperCase().includes('CRITICO') && nivelNombre.toUpperCase().includes('CRITICO')) ||
        (n.nombre?.toUpperCase().includes('ALTO') && nivelNombre.toUpperCase().includes('ALTO')) ||
        (n.nombre?.toUpperCase().includes('MEDIO') && nivelNombre.toUpperCase().includes('MEDIO')) ||
        (n.nombre?.toUpperCase().includes('BAJO') && nivelNombre.toUpperCase().includes('BAJO'))
      );
      const bgColor = nivel?.color || '#666';
      return { nivel: nivelNombre.toUpperCase(), color: '#fff', bgColor };
    } catch {
      return { nivel: 'SIN CALIFICAR', color: '#ffffff', bgColor: '#9e9e9e' };
    }
  };

  const resumenCalificaciones = useMemo(() => {
    if (!estaExpandido) return null;

    const defaultImpactos = {
      economico: 1, procesos: 1, legal: 1, confidencialidadSGSI: 1,
      reputacion: 1, disponibilidadSGSI: 1, personas: 1, integridadSGSI: 1, ambiental: 1,
    };
    
    const causasOrdenadas = [...(riesgo.causas || [])].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

    const causasConCalificacion = causasOrdenadas.map((causa: any) => {
      const cgi = causa.calificacionGlobalImpacto != null && !Number.isNaN(Number(causa.calificacionGlobalImpacto))
        ? Number(causa.calificacionGlobalImpacto)
        : calcularImpactoGlobal(riesgo.impactos || defaultImpactos, pesosImpactoApi);
      
      const pesoFrec = obtenerPesoFrecuencia(causa.frecuencia, frecuenciasApi || []);
      const cipcExistente = causa.calificacionInherentePorCausa;
      const cipc = (typeof cipcExistente === 'number' && !Number.isNaN(cipcExistente))
        ? cipcExistente
        : (cipcExistente != null && typeof cipcExistente === 'object' && typeof (cipcExistente as any).resultado === 'number')
          ? (cipcExistente as any).resultado
          : calcularCalificacionInherentePorCausaSync(pesoFrec, cgi).resultado;
      
      return { ...causa, calificacionGlobalImpacto: cgi, calificacionInherentePorCausa: cipc };
    });

    const calificacionesInherentes = causasConCalificacion
      .map((causa: any) => {
        const c = causa.calificacionInherentePorCausa;
        if (typeof c === 'number' && !Number.isNaN(c)) return c;
        return null;
      })
      .filter((cal): cal is number => cal !== null);

    const calificacionInherenteGlobal = calificacionesInherentes.length > 0
      ? agregarCalificacionInherenteGlobalSync(calificacionesInherentes)
      : 0;

    const nivelInfo = calificacionInherenteGlobal > 0
      ? getNivelRiesgoSync(calificacionInherenteGlobal)
      : { nivel: 'SIN CALIFICAR', color: '#ffffff', bgColor: '#9e9e9e' };

    return { causasConCalificacion, calificacionInherenteGlobal, nivelInfo };
  }, [estaExpandido, riesgo, frecuenciasApi, pesosImpactoApi, nivelesRiesgoApi]);

  return (
    <Card sx={{ mb: 1.5 }}>
      {/* Header colapsable */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '28px 60px minmax(200px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 110px) minmax(88px, 90px) 44px',
          gap: 1,
          pl: 1,
          pr: 2,
          py: 1,
          cursor: 'pointer',
          bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          transition: 'all 0.2s',
          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
          minHeight: 56,
          boxSizing: 'border-box',
          '& > *': { minWidth: 0 },
        }}
        onClick={() => onToggleExpand(riesgo)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <IconButton size="small" color="primary" sx={{ p: 0.25, ml: -0.5 }}>
            {estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem">
          {riesgo.numeroIdentificacion || 'Sin ID'}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.4,
            fontSize: '0.8rem',
            color: 'text.primary',
            wordBreak: 'break-word',
          }}
        >
          {repairSpanishDisplayArtifacts(
            riesgo.descripcionRiesgo || (riesgo as any).descripcion || (riesgo as any).nombre || 'Sin descripción'
          )}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {repairSpanishDisplayArtifacts(
            tipoRiesgoObj ? (tipoRiesgoObj.nombre || tipoRiesgoObj.codigo) : (riesgo.tipoRiesgo || 'Sin tipología I')
          )}
        </Typography>

        <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {repairSpanishDisplayArtifacts(
            subtipoObj ? (subtipoObj.nombre || subtipoObj.codigo) : (riesgo.subtipoRiesgo || 'Sin tipología II')
          )}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={riesgo.nivelRiesgo ?? 'SIN CALIFICAR'}
            size="small"
            sx={{
              backgroundColor: riesgo.nivelBgColor ?? '#9e9e9e',
              color: riesgo.nivelColor ?? '#ffffff',
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 24,
              minWidth: 80
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={riesgo.causas && riesgo.causas.length > 0 ? `${riesgo.causas.length} CAUSAS` : 'SIN CAUSAS'}
            size="small"
            color={riesgo.causas && riesgo.causas.length > 0 ? 'primary' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEliminarRiesgo(riesgo.id);
            }}
            disabled={isReadOnly}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Contenido expandible */}
      <Collapse in={estaExpandido}>
        <Box sx={{ p: 0 }}>
          <RiesgoFormulario
            riesgo={{
              ...riesgo,
              ...(cambiosPendientes[riesgo.id] || {}),
              impactos: cambiosPendientes[riesgo.id]?.impactos
                ? { ...riesgo.impactos, ...cambiosPendientes[riesgo.id].impactos }
                : riesgo.impactos
            }}
            actualizarRiesgo={actualizarRiesgo}
            isReadOnly={isReadOnly}
            procesoSeleccionado={procesoSeleccionado}
            onSave={() => onSave(riesgo.id)}
            onAgregarCausa={(riesgoId) => {
              setRiesgoIdParaCausa(riesgoId);
              setCausaEditando(null);
              setNuevaCausaDescripcion('');
              
              let primeraFuente = '';
              if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
                const f = fuentesCausa[0];
                primeraFuente = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
              } else if (typeof fuentesCausa === 'object' && Object.keys(fuentesCausa).length > 0) {
                primeraFuente = Object.keys(fuentesCausa)[0];
              }
              setNuevaCausaFuente(primeraFuente);
              setNuevaCausaFrecuencia(3);
              setDialogCausaOpen(true);
            }}
            onEditarCausa={(riesgoId, causa) => {
              setRiesgoIdParaCausa(riesgoId);
              setCausaEditando(causa);
              setNuevaCausaDescripcion(causa.descripcion);

              let fuenteId = '';
              if (causa.fuenteCausa) {
                if (Array.isArray(fuentesCausa)) {
                  const fuenteObj = fuentesCausa.find((f: any) =>
                    f.nombre === causa.fuenteCausa ||
                    String(f.id) === String(causa.fuenteCausa) ||
                    String(f.codigo) === String(causa.fuenteCausa)
                  );
                  if (fuenteObj) fuenteId = String(fuenteObj.id ?? fuenteObj.codigo ?? fuenteObj.nombre ?? '');
                } else if (typeof fuentesCausa === 'object') {
                  const found = Object.entries(fuentesCausa).find(([key, value]: [string, any]) =>
                    value?.nombre === causa.fuenteCausa || key === String(causa.fuenteCausa)
                  );
                  if (found) fuenteId = found[0];
                }
              }

              if (!fuenteId) {
                if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
                  const f = fuentesCausa[0];
                  fuenteId = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
                } else if (typeof fuentesCausa === 'object' && Object.keys(fuentesCausa).length > 0) {
                  fuenteId = Object.keys(fuentesCausa)[0];
                }
              }

              setNuevaCausaFuente(fuenteId);
              setNuevaCausaFrecuencia(typeof causa.frecuencia === 'string' ? parseInt(causa.frecuencia) || 3 : (causa.frecuencia || 3));
              setDialogCausaOpen(true);
            }}
            onEliminarCausa={async (riesgoId, causaId) => {
              if (!(await swalConfirmEliminarCausa())) return;
              const pid = String(riesgoId);
              const cid = String(causaId);
              setCausasPendientes((prev: any) => {
                const next = { ...prev };
                next[pid] = {
                  toAdd: next[pid]?.toAdd ?? [],
                  toUpdate: next[pid]?.toUpdate ?? {},
                  toDelete: next[pid]?.toDelete ?? {},
                };
                if (cid.startsWith('temp-')) {
                  const idx = parseInt(cid.split('-').pop() || '0', 10);
                  next[pid].toAdd = next[pid].toAdd.filter((_: any, i: number) => i !== idx);
                } else {
                  next[pid].toDelete[cid] = true;
                }
                return next;
              });
              showSuccess('Causa quitada en memoria. Pulse "Guardar" en el riesgo para guardar todo en la base.');
            }}
            causaEliminando={causaEliminando}
            onVerDetalleCausa={(causa) => {
              setCausaSeleccionadaDetalle(causa);
              setCausaDetalleOpen(true);
            }}
            tiposRiesgos={tiposRiesgos}
            origenes={origenes}
            tiposProceso={tiposProceso}
            consecuencias={consecuencias}
            objetivos={objetivos}
            labelsFrecuencia={labelsFrecuencia}
            fuentesCausa={fuentesCausa}
            descripcionesImpacto={descripcionesImpacto}
            tipologiasTipo1ParaAutocomplete={tipologiasTipo1ParaAutocomplete}
          />

          {/* Resumen de Calificaciones */}
          {resumenCalificaciones && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Resumen de Calificaciones del Riesgo Inherente
              </Typography>

              {resumenCalificaciones.causasConCalificacion.length > 0 ? (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Causa</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Frecuencia</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación Global Impacto</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación Inherente por Causa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resumenCalificaciones.causasConCalificacion.map((causa: any, index: number) => (
                        <TableRow
                          key={causa.id}
                          onClick={() => {
                            setCausaSeleccionadaDetalle(causa);
                            setCausaDetalleOpen(true);
                          }}
                          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              Causa {index + 1}: {causa.descripcion.length > 60 ? `${causa.descripcion.substring(0, 60)}...` : causa.descripcion}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={labelsFrecuencia[causa.frecuencia || 3]?.label || 'N/A'} size="small" color="primary" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>{causa.calificacionGlobalImpacto?.toFixed(2) ?? 'N/A'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>{causa.calificacionInherentePorCausa?.toFixed(2) ?? 'N/A'}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No hay causas registradas. Agregue causas para calcular las calificaciones.
                </Alert>
              )}

              <Box sx={{ p: 2, backgroundColor: resumenCalificaciones.nivelInfo.bgColor, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" sx={{ color: resumenCalificaciones.nivelInfo.color, opacity: 0.9 }}>
                    CALIFICACIÓN DEL RIESGO INHERENTE GLOBAL
                  </Typography>
                  <Typography variant="h5" sx={{ color: resumenCalificaciones.nivelInfo.color, fontWeight: 700, mt: 0.5 }}>
                    {resumenCalificaciones.calificacionInherenteGlobal > 0 ? resumenCalificaciones.calificacionInherenteGlobal.toFixed(2) : 'N/A'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: resumenCalificaciones.nivelInfo.color, opacity: 0.8, mt: 0.5, display: 'block' }}>
                    (Máximo de todas las calificaciones inherentes por causa)
                  </Typography>
                </Box>
                <Chip
                  label={resumenCalificaciones.nivelInfo.nivel}
                  sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: resumenCalificaciones.nivelInfo.color, fontWeight: 700, fontSize: '0.875rem' }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
});
