/**
 * Controles y Planes de Acción Page - NUEVA VERSIÓN CON 4 TABS
 * Incluye: Clasificación, Controles, Evaluación Residual (Copiada), Planes
 */

import { useState, useMemo, useEffect, Fragment } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  FormControlLabel,
  Switch,
  LinearProgress
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Shield as ShieldIcon,
  FactCheck as FactCheckIcon,
  Security as SecurityIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useGetRiesgosQuery, useUpdateCausaMutation, useUpdateRiesgoMutation } from '../../api/services/riesgosApi';
import { DIMENSIONES_IMPACTO, LABELS_IMPACTO, LABELS_PROBABILIDAD, UMBRALES_RIESGO, NIVELES_RIESGO } from '../../utils/constants';
import {
  calcularRiesgoInherente,
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
  determinarNivelRiesgo
} from '../../utils/calculations';
import { RiesgoFormData } from '../../types';

interface ClasificacionCausa {
  id: string;
  causaId: string;
  riesgoId: string;
  tipo: 'seleccion' | 'control' | 'plan' | 'CONTROL' | 'PLAN';
  controlDescripcion?: string;
  controlTipo?: 'prevención' | 'detección' | 'corrección';
  controlDesviaciones?: string;
  impactosResiduales?: { personas: number; legal: number; ambiental: number; procesos: number; reputacion: number; economico: number; };
  frecuenciaResidual?: number;
  riesgoResidual?: number;
  nivelRiesgoResidual?: string;
  planDescripcion?: string;
  planDetalle?: string;
  planResponsable?: string;
  planDecision?: string;
  planFechaEstimada?: string;
  planEstado?: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  procesoId: string;
  createdAt: string;
  updatedAt: string;
}

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ControlesYPlanesAccionPageNueva() {
  const { procesoSeleccionado } = useProceso();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [activeTab, setActiveTab] = useState(0);

  // Estados Clasificación Existente
  const [clasificaciones, setClasificaciones] = useState<ClasificacionCausa[]>([]);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [causaEnEdicion, setCausaEnEdicion] = useState<{ riesgoId: string; causa: any; clasificacion?: ClasificacionCausa; } | null>(null);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [itemDetalle, setItemDetalle] = useState<ClasificacionCausa | null>(null);
  const [tipoClasificacion, setTipoClasificacion] = useState<'seleccion' | 'control' | 'plan' | 'CONTROL' | 'PLAN'>('seleccion');
  const [formControl, setFormControl] = useState({ descripcion: '', tipo: 'prevención' as 'prevención' | 'detección' | 'corrección' });
  const [formPlan, setFormPlan] = useState({ descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completado' | 'cancelado' });
  const [impactosResiduales, setImpactosResiduales] = useState({ personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 });
  const [frecuenciaResidual, setFrecuenciaResidual] = useState(1);

  // Estados Evaluación Residual (COPIADO)
  const [riesgosExpandidosResidual, setRiesgosExpandidosResidual] = useState<Record<string, boolean>>({});
  const [dialogEvaluacionOpen, setDialogEvaluacionOpen] = useState(false); // Kept for reference or removal
  const [evaluacionExpandida, setEvaluacionExpandida] = useState<{ riesgoId: string; causaId: string } | null>(null);
  const [riesgoIdEvaluacion, setRiesgoIdEvaluacion] = useState<string | null>(null);
  const [causaIdEvaluacion, setCausaIdEvaluacion] = useState<string | null>(null);
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState({
    aplicabilidad: '', puntajeAplicabilidad: 0,
    cobertura: '', puntajeCobertura: 0,
    facilidadUso: '', puntajeFacilidad: 0,
    segregacion: '', puntajeSegregacion: 0,
    naturaleza: '', puntajeNaturaleza: 0,
    desviaciones: 'A',
    tipoMitigacion: 'AMBAS' as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
    recomendacion: '',
    descripcionControl: '',
    responsable: '',
    tieneControl: true
  });

  // Cargar riesgos
  const { data: riesgosApiData } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: String(procesoSeleccionado.id), pageSize: 1000, includeCausas: true } : { pageSize: 0 },
    { skip: !procesoSeleccionado }
  );

  const [updateCausa] = useUpdateCausaMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();

  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    const data = ((riesgosApiData as any)?.data || []) as any[];
    return data.map((riesgo) => ({
      ...riesgo,
      causas: (riesgo.causas || []).map((causa: any) => ({
        ...causa,
        ...(causa.gestion || {})
      }))
    }));
  }, [procesoSeleccionado?.id, riesgosApiData]);

  useEffect(() => {
    const nuevas: ClasificacionCausa[] = [];
    riesgosDelProceso.forEach((riesgo: any) => {
      (riesgo.causas || []).forEach((causa: any) => {
        if (causa.tipoGestion || causa.gestion) {
          nuevas.push({
            id: `${riesgo.id}-${causa.id}`,
            causaId: causa.id,
            riesgoId: String(riesgo.id),
            tipo: (String(causa.tipoGestion || causa.gestion?.tipoGestion || '') || '').toLowerCase() as any,
            controlDescripcion: causa.controlDescripcion,
            controlTipo: causa.controlTipo,
            controlDesviaciones: causa.controlDesviaciones,
            impactosResiduales: causa.impactosResiduales,
            frecuenciaResidual: causa.frecuenciaResidual,
            riesgoResidual: causa.riesgoResidual,
            nivelRiesgoResidual: causa.nivelRiesgoResidual,
            planDescripcion: causa.planDescripcion,
            planDetalle: causa.planDetalle,
            planResponsable: causa.planResponsable,
            planDecision: causa.planDecision,
            planFechaEstimada: causa.planFechaEstimada,
            planEstado: causa.planEstado,
            procesoId: String(procesoSeleccionado?.id || ''),
            createdAt: causa.createdAt || new Date().toISOString(),
            updatedAt: causa.updatedAt || new Date().toISOString(),
          });
        }
      });
    });
    setClasificaciones(nuevas);
  }, [riesgosDelProceso, procesoSeleccionado?.id]);

  // Derived Logic
  const causasNoClasificadas = useMemo(() => {
    return riesgosDelProceso.map((riesgo: any) => {
      const causas = riesgo.causas || [];
      const causasSinClasificar = causas.filter((causa: any) => !clasificaciones.some(c => c.causaId === causa.id && c.riesgoId === riesgo.id));
      return { riesgo, causas: causasSinClasificar };
    }).filter(item => item.causas.length > 0);
  }, [riesgosDelProceso, clasificaciones]);

  // Filtros Derivados (Agrupados por Riesgo)
  const riesgosPendientes = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
        return tipo === 'PENDIENTE';
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  const riesgosConPlanes = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || '').toUpperCase();
        return tipo === 'PLAN';
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  const riesgosConControles = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
        return tipo === 'CONTROL';
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  // Legacy arrays (kept for compatibility in case used elsewhere, but ideally replaced)
  const controles = useMemo(() => clasificaciones.filter(c => c.tipo === 'control'), [clasificaciones]);
  const planes = useMemo(() => clasificaciones.filter(c => c.tipo === 'plan'), [clasificaciones]);

  // Actualizar Riesgo en API (Residual)
  const actualizarRiesgoApi = async (riesgoId: string, updates: Partial<RiesgoFormData>) => {
    await updateRiesgo({ id: String(riesgoId), ...updates } as any).unwrap();
  };

  // Handlers Residual
  const handleToggleExpandirResidual = (id: string) => {
    setRiesgosExpandidosResidual((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEvaluarControl = (riesgoId: string, causa: any) => {
    setRiesgoIdEvaluacion(riesgoId);
    setCausaIdEvaluacion(causa.id);

    // Initial load for Plan if exists
    if (causa.planDescripcion || (causa.tipoGestion && causa.tipoGestion.toUpperCase() === 'PLAN')) {
      setFormPlan({
        descripcion: causa.planDescripcion || '',
        detalle: causa.planDetalle || '',
        responsable: causa.planResponsable || (user as any)?.fullName || '',
        decision: causa.planDecision || causa.gestion?.planDecision || '',
        fechaEstimada: causa.planFechaEstimada || '',
        estado: causa.planEstado || 'pendiente'
      });
    } else {
      setFormPlan({ descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' });
    }

    // Load existing if present
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
        desviaciones: causa.desviaciones || 'A',
        tipoMitigacion: causa.tipoMitigacion || 'AMBAS',
        recomendacion: causa.recomendacion || '',
        descripcionControl: causa.controlDescripcion || '',
        responsable: causa.controlResponsable || (user as any)?.fullName || '',
        tieneControl: causa.tieneControl !== undefined ? causa.tieneControl : true
      });
    } else {
      setCriteriosEvaluacion({
        aplicabilidad: '', puntajeAplicabilidad: 0,
        cobertura: '', puntajeCobertura: 0,
        facilidadUso: '', puntajeFacilidad: 0,
        segregacion: '', puntajeSegregacion: 0,
        naturaleza: '', puntajeNaturaleza: 0,
        desviaciones: 'A',
        tipoMitigacion: 'AMBAS', recomendacion: '',
        descripcionControl: '', responsable: (user as any)?.fullName || '',
        tieneControl: true
      });
    }
    setEvaluacionExpandida({ riesgoId, causaId: causa.id });
    setDialogEvaluacionOpen(false); // Ensure dialog is closed if previously used
  };

  // Handlers Clasificación
  const handleAbrirClasificacion = (riesgoId: string, causa: any) => {
    const clasificacionExistente = clasificaciones.find(c => c.causaId === causa.id && c.riesgoId === riesgoId);
    setCausaEnEdicion({ riesgoId, causa, clasificacion: clasificacionExistente });
    if (clasificacionExistente) {
      setTipoClasificacion(clasificacionExistente.tipo);
      if (clasificacionExistente.tipo === 'control') {
        setFormControl({ descripcion: clasificacionExistente.controlDescripcion || '', tipo: clasificacionExistente.controlTipo || 'prevención' });
        setImpactosResiduales(clasificacionExistente.impactosResiduales || { personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 });
        setFrecuenciaResidual(clasificacionExistente.frecuenciaResidual || 1);
      } else if (clasificacionExistente.tipo === 'plan') {
        setFormPlan({ descripcion: clasificacionExistente.planDescripcion || '', detalle: clasificacionExistente.planDetalle || '', responsable: clasificacionExistente.planResponsable || '', decision: clasificacionExistente.planDecision || '', fechaEstimada: clasificacionExistente.planFechaEstimada || '', estado: clasificacionExistente.planEstado || 'pendiente' });
      }
    } else {
      setTipoClasificacion('seleccion');
      setFormControl({ descripcion: '', tipo: 'prevención' });
      setFormPlan({ descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' });
      setImpactosResiduales({ personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 });
      setFrecuenciaResidual(1);
    }
  };

  const handleGuardarClasificacion = async () => {
    if (!causaEnEdicion) return;
    const { riesgoId, causa, clasificacion } = causaEnEdicion;
    // ... Validations simplified for brevity ...
    const nuevaClasificacion: ClasificacionCausa = {
      id: clasificacion?.id || `clas-${Date.now()}-${causa.id}`,
      causaId: causa.id, riesgoId, tipo: tipoClasificacion,
      controlDescripcion: tipoClasificacion === 'control' ? formControl.descripcion : undefined,
      controlTipo: tipoClasificacion === 'control' ? formControl.tipo : undefined,
      impactosResiduales: tipoClasificacion === 'control' ? impactosResiduales : undefined,
      frecuenciaResidual: tipoClasificacion === 'control' ? frecuenciaResidual : undefined,
      planDescripcion: tipoClasificacion === 'plan' ? formPlan.descripcion : undefined,
      planResponsable: tipoClasificacion === 'plan' ? formPlan.responsable : undefined,
      planDecision: tipoClasificacion === 'plan' ? formPlan.decision : undefined,
      planFechaEstimada: tipoClasificacion === 'plan' ? formPlan.fechaEstimada : undefined,
      planEstado: tipoClasificacion === 'plan' ? formPlan.estado : undefined,
      procesoId: String(procesoSeleccionado!.id),
      createdAt: clasificacion?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    if (clasificacion) setClasificaciones(clasificaciones.map(c => c.id === clasificacion.id ? nuevaClasificacion : c));
    else setClasificaciones([...clasificaciones, nuevaClasificacion]);
    await updateCausa({
      id: causa.id,
      tipoGestion: tipoClasificacion.toUpperCase(),
      gestion: {
        ...nuevaClasificacion,
        tipoGestion: tipoClasificacion.toUpperCase()
      }
    }).unwrap();
    showSuccess('Causa clasificada correctamente');
    setCausaEnEdicion(null);
  };

  const getRiesgoNombre = (riesgoId: string) => {
    const r = riesgosDelProceso.find((r: any) => r.id === riesgoId);
    return r?.nombre || r?.descripcionRiesgo || riesgoId;
  };
  const handleGuardarEvaluacion = async () => {
    const riesgo = riesgosDelProceso.find((r: any) => r.id === riesgoIdEvaluacion);
    if (!riesgo || !causaIdEvaluacion) return;

    let causaActualizada: any = null;
    const causasUpd = riesgo.causas.map((c: any) => {
      if (c.id === causaIdEvaluacion) {
        if (tipoClasificacion === 'CONTROL' || tipoClasificacion === 'control' || (!tipoClasificacion)) {
          let pt = 0;
          let prel = 'Inefectivo';
          let def = 'Inefectivo';
          let mit = 0;

          if (criteriosEvaluacion.tieneControl) {
            pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
            prel = determinarEvaluacionPreliminar(pt);
            def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
            mit = obtenerPorcentajeMitigacionAvanzado(def);
          } else {
            // If no control, reset scores and mitigation
            pt = 0;
            prel = 'Inefectivo';
            def = 'Inefectivo';
            mit = 0;
          }

          const fRes = calcularFrecuenciaResidualAvanzada(c.frecuencia || 1, c.calificacionGlobalImpacto || 1, mit, criteriosEvaluacion.tipoMitigacion);
          const iRes = calcularImpactoResidualAvanzado(c.calificacionGlobalImpacto || 1, c.frecuencia || 1, mit, criteriosEvaluacion.tipoMitigacion);
          causaActualizada = {
            ...c, ...criteriosEvaluacion,
            controlDesviaciones: criteriosEvaluacion.desviaciones,
            controlDescripcion: criteriosEvaluacion.descripcionControl,
            controlResponsable: criteriosEvaluacion.responsable,
            tieneControl: criteriosEvaluacion.tieneControl,
            tipoGestion: 'CONTROL',
            puntajeTotal: pt, evaluacionDefinitiva: def, porcentajeMitigacion: mit,
            frecuenciaResidual: fRes, impactoResidual: iRes,
            calificacionResidual: calcularCalificacionResidual(fRes, iRes)
          };
          return causaActualizada;
        } else {
          // PLAN
          causaActualizada = {
            ...c,
            tipoGestion: 'PLAN',
            planDescripcion: formPlan.descripcion,
            planDetalle: formPlan.detalle,
            planResponsable: formPlan.responsable,
            planDecision: formPlan.decision,
            planFechaEstimada: formPlan.fechaEstimada,
            planEstado: formPlan.estado,
            puntajeTotal: undefined, porcentajeMitigacion: 0
          };
          return causaActualizada;
        }
      }
      return c;
    });

    if (riesgoIdEvaluacion) {
      // Calcular Riesgo Residual Global (MAX de los residuales de las causas)
      // Si una causa no tiene evaluación residual (ej. pendiente), se usa su inherente
      // Si la causa no tiene valores propios, usamos los del riesgo padre
      const maxRiesgoResidual = Math.max(...causasUpd.map((c: any) => {
        const residual = c.calificacionResidual;

        // Fallback robusto para cálculo inherente
        const prob = c.frecuencia || riesgo.evaluacion?.probabilidad || 0;
        const imp = c.calificacionGlobalImpacto || riesgo.evaluacion?.impactoMaximo || 0;
        const inherente = prob * imp;

        return residual !== undefined ? residual : inherente;
      }));

      if (causaActualizada) {
        try {
          await updateCausa({
            id: causaActualizada.id,
            tipoGestion: causaActualizada.tipoGestion,
            gestion: causaActualizada
          }).unwrap();
        } catch (err) {
          console.error('Error al actualizar causa:', err);
        }
      }

      try {
        await actualizarRiesgoApi(riesgoIdEvaluacion, {
          causas: causasUpd,
          riesgoResidual: maxRiesgoResidual
        } as any);
        setEvaluacionExpandida(null);
        showSuccess('Gestión guardada exitosamente y Riesgo Residual Actualizado');
      } catch (err) {
        console.error('Error al actualizar riesgo:', err);
        showError('Error al guardar clasificación');
      }
    }
  };

  const getCausaDescripcion = (riesgoId: string, causaId: string) => {
    const r = riesgosDelProceso.find((r: any) => r.id === riesgoId);
    const c = r?.causas?.find((c: any) => c.id === causaId);
    return c?.descripcion || causaId;
  };

  const handleEliminarClasificacion = async (riesgoId: string, causa: any) => {
    try {
      await updateCausa({
        id: causa.id,
        tipoGestion: null,
        planDescripcion: null,
        planDetalle: null,
        planResponsable: null,
        planFechaEstimada: null,
        planEstado: null,
        controlDescripcion: null,
        controlTipo: null,
        controlDesviaciones: null,
        gestion: null
      }).unwrap();
      showSuccess('Clasificación eliminada. La causa volverá a aparecer en Clasificación.');
    } catch (error) {
      showError('Error al eliminar clasificación');
    }
  };

  if (!procesoSeleccionado) return <Box sx={{ p: 3 }}><Alert severity="info">Por favor selecciona un proceso.</Alert></Box>;

  return (
    <AppPageLayout
      title="Controles y Planes de Acción"
      description="Gestionar controles y planes asociados a los riesgos identificados."
      topContent={<FiltroProcesoSupervisor />}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<FactCheckIcon />} label="CLASIFICACIÓN" iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab icon={<ShieldIcon />} label="CONTROLES" iconPosition="start" sx={{ fontWeight: 600 }} />
          <Tab icon={<AssignmentIcon />} label="PLANES DE ACCIÓN" iconPosition="start" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* TAB 0: CLASIFICACIÓN Y GESTIÓN */}
      <TabPanel value={activeTab} index={0}>
        <Box>
          {riesgosPendientes.length === 0 ? (
            <Card><CardContent><Typography align="center">No hay causas pendientes de clasificar. ¡Excelente trabajo!</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Summary Counter */}
              <Alert severity="info" sx={{ mb: 2 }}>
                {(() => {
                  let pendientes = 0;
                  riesgosPendientes.forEach((r: any) => r.causas?.forEach((c: any) => pendientes++));
                  return `Tienes ${pendientes} causas pendientes de clasificar.`;
                })()}
              </Alert>

              {/* Column Headers */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                gap: 2,
                px: 3,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box /> {/* Spacer for icon */}
                <Typography variant="caption" fontWeight={700} color="text.secondary">ID RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">DESCRIPCIÓN DEL RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPOLOGÍA</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                <Box /> {/* Spacer for end icon */}
              </Box>

              {riesgosPendientes.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                        gap: 2,
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                        alignItems: 'center'
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <IconButton size="small" color="primary">
                        {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>

                      <Typography variant="subtitle2" fontWeight={700} color="primary">
                        {riesgo.numeroIdentificacion || riesgo.id}
                      </Typography>

                      <Typography variant="body2" sx={{
                        fontWeight: 500,
                        lineHeight: 1.4,
                        py: 0.5
                      }}>
                        {riesgo.descripcionRiesgo || riesgo.nombre}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {riesgo.tipologiaNivelI || '02 Operacional'}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip
                          label={`${riesgo.causas.length} pend.`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Box />
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
                                <TableCell align="center">Estado</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => {
                                const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
                                // Double check filter (should be redundant if memos work, but safe)
                                if (tipoGestion !== 'PENDIENTE') return null;

                                return (
                                  <Fragment key={causa.id}>
                                    <TableRow>
                                      <TableCell sx={{ maxWidth: 300 }}>{causa.descripcion}</TableCell>
                                      <TableCell align="center">{causa.frecuencia || 1}</TableCell>
                                      <TableCell align="center">{(causa.calificacionGlobalImpacto || 1).toFixed(2)}</TableCell>
                                      <TableCell align="center">
                                        <FormControl fullWidth size="small">
                                          <Select
                                            value={tipoGestion === 'PENDIENTE' ? '' : tipoGestion}
                                            displayEmpty
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val === 'CONTROL' || val === 'PLAN') {
                                                setTipoClasificacion(val as any);
                                                handleEvaluarControl(riesgo.id, causa);
                                              }
                                            }}
                                            renderValue={(selected) => {
                                              if (!selected || selected === 'PENDIENTE') return <Typography color="text.secondary" variant="body2">-- Seleccione --</Typography>;
                                              return selected === 'CONTROL' ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShieldIcon fontSize="small" /> Control</Box>
                                                : <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><AssignmentIcon fontSize="small" /> Plan</Box>;
                                            }}
                                          >
                                            <MenuItem value="" disabled><em>Seleccione...</em></MenuItem>
                                            <MenuItem value="CONTROL">Control</MenuItem>
                                            <MenuItem value="PLAN">Plan de Acción</MenuItem>
                                          </Select>
                                        </FormControl>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip label="Pendiente" variant="outlined" size="small" />
                                      </TableCell>
                                    </TableRow>
                                    {
                                      evaluacionExpandida?.riesgoId === riesgo.id && evaluacionExpandida?.causaId === causa.id && (
                                        <TableRow>
                                          <TableCell colSpan={6} sx={{ p: 0 }}>
                                            <Collapse in={true}>
                                              <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                                                  {tipoClasificacion === 'PLAN' ? 'Configurar Plan de Acción' : 'Evaluar Efectividad del Control'}
                                                </Typography>

                                                {(tipoClasificacion === 'CONTROL' || tipoClasificacion === 'control' || (!tipoClasificacion && !causaIdEvaluacion)) && (
                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                    {(() => {
                                                      const inherentProb = Number(causa.frecuencia || riesgo.evaluacion?.probabilidad || 1);
                                                      const inherentImp = Number(causa.calificacionGlobalImpacto || riesgo.evaluacion?.impactoMaximo || 1);
                                                      let pt = 0;
                                                      let def = 'Inefectivo';
                                                      let mit = 0;

                                                      if (criteriosEvaluacion.tieneControl) {
                                                        pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
                                                        const prel = determinarEvaluacionPreliminar(pt);
                                                        def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
                                                        mit = obtenerPorcentajeMitigacionAvanzado(def);
                                                      }

                                                      const fRes = calcularFrecuenciaResidualAvanzada(inherentProb, inherentImp, mit, criteriosEvaluacion.tipoMitigacion);
                                                      const iRes = calcularImpactoResidualAvanzado(inherentImp, inherentProb, mit, criteriosEvaluacion.tipoMitigacion);
                                                      const calRes = calcularCalificacionResidual(fRes, iRes);
                                                      const nivelRes = determinarNivelRiesgo(calRes, riesgo.clasificacion as any);

                                                      const getColorNivel = (n: string) => {
                                                        if (n === NIVELES_RIESGO.CRITICO) return '#d32f2f';
                                                        if (n === NIVELES_RIESGO.ALTO) return '#f57c00';
                                                        if (n === NIVELES_RIESGO.MEDIO) return '#fdd835';
                                                        if (n === NIVELES_RIESGO.BAJO) return '#388e3c';
                                                        return '#e0e0e0';
                                                      };

                                                      return (
                                                        <>
                                                          <Box sx={{ mb: 2 }}>
                                                            <FormControlLabel
                                                              control={<Switch checked={criteriosEvaluacion.tieneControl} onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, tieneControl: e.target.checked }))} />}
                                                              label={<Typography fontWeight="bold">¿Tiene Control Implementado?</Typography>}
                                                            />
                                                          </Box>

                                                          {criteriosEvaluacion.tieneControl && (
                                                            <Collapse in={true}>
                                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                                {/* Sección 1: Datos Generales del Control */}
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
                                                                  <TextField
                                                                    label="Descripción del Control"
                                                                    multiline
                                                                    rows={2}
                                                                    value={criteriosEvaluacion.descripcionControl || ''}
                                                                    onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, descripcionControl: e.target.value }))}
                                                                    fullWidth
                                                                    placeholder="Describa el control..."
                                                                  />
                                                                  <FormControl fullWidth size="small">
                                                                    <InputLabel>¿Disminuye Frecuencia o Impacto?</InputLabel>
                                                                    <Select
                                                                      value={criteriosEvaluacion.tipoMitigacion}
                                                                      label="¿Disminuye Frecuencia o Impacto?"
                                                                      onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, tipoMitigacion: e.target.value as any }))}
                                                                    >
                                                                      <MenuItem value="FRECUENCIA">Disminuye Frecuencia</MenuItem>
                                                                      <MenuItem value="IMPACTO">Disminuye Impacto</MenuItem>
                                                                      <MenuItem value="AMBAS">Ambas</MenuItem>
                                                                    </Select>
                                                                  </FormControl>
                                                                  <TextField
                                                                    label="Responsable del Control"
                                                                    value={criteriosEvaluacion.responsable || ''}
                                                                    onChange={(e) => setCriteriosEvaluacion(pr => ({ ...pr, responsable: e.target.value }))}
                                                                    fullWidth
                                                                  />
                                                                </Box>

                                                                <Divider>Evaluación de Criterios (Puntaje Variable)</Divider>

                                                                {/* Sección 2: Criterios de Evaluación */}
                                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                                                  {/* Columna Izquierda */}
                                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Aplicabilidad</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.aplicabilidad}
                                                                        label="Aplicabilidad"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          const v = e.target.value; const p = v === 'totalmente' ? 100 : v === 'parcial' ? 30 : 0;
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, aplicabilidad: v, puntajeAplicabilidad: p }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="totalmente" sx={{ whiteSpace: 'normal' }}>Cuenta con procedimientos documentados y se deja evidencia de su ejecución (100)</MenuItem>
                                                                        <MenuItem value="parcial" sx={{ whiteSpace: 'normal' }}>Cuenta con procedimientos documentados total o parcialmente pero no se deja evidencia de su ejecución, o al contrario (30)</MenuItem>
                                                                        <MenuItem value="nula" sx={{ whiteSpace: 'normal' }}>No se deja evidencia de su ejecución, ni se cuenta con los procedimientos documentados (0)</MenuItem>
                                                                      </Select>
                                                                    </FormControl>

                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Cobertura</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.cobertura}
                                                                        label="Cobertura"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          const v = e.target.value; const p = v === 'total' ? 100 : v === 'parcial' ? 70 : 10;
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, cobertura: v, puntajeCobertura: p }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="total" sx={{ whiteSpace: 'normal' }}>La frecuencia del control tiene una periodicidad definida y se realiza sobre la totalidad de la población (100)</MenuItem>
                                                                        <MenuItem value="parcial" sx={{ whiteSpace: 'normal' }}>La frecuencia del control tiene una periodicidad definida y se hace sobre una muestra de la población (70)</MenuItem>
                                                                        <MenuItem value="eventual" sx={{ whiteSpace: 'normal' }}>La frecuencia del control es eventual o a discreción del funcionario que realiza el control (10)</MenuItem>
                                                                      </Select>
                                                                    </FormControl>

                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Facilidad de Uso</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.facilidadUso}
                                                                        label="Facilidad de Uso"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          const v = e.target.value; const p = v === 'coherente' ? 100 : v === 'complejo' ? 70 : 30;
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, facilidadUso: v, puntajeFacilidad: p }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="coherente" sx={{ whiteSpace: 'normal' }}>La complejidad del control es coherente con el riesgo identificado y la actividad realizada (100)</MenuItem>
                                                                        <MenuItem value="complejo" sx={{ whiteSpace: 'normal' }}>El control es muy complejo en su ejecución y requiere simplificación (70)</MenuItem>
                                                                        <MenuItem value="sencillo" sx={{ whiteSpace: 'normal' }}>El control es muy sencillo en comparación con el riesgo identificado y la actividad realizada, y requiere mayor profundización (30)</MenuItem>
                                                                      </Select>
                                                                    </FormControl>
                                                                  </Box>

                                                                  {/* Columna Derecha */}
                                                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Segregación</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.segregacion}
                                                                        label="Segregación"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          const v = e.target.value; const p = v === 'si' ? 100 : v === 'na' ? 100 : 0;
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, segregacion: v, puntajeSegregacion: p }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="si">Sí (100)</MenuItem>
                                                                        <MenuItem value="no">No (0)</MenuItem>
                                                                        <MenuItem value="na">N/A (100)</MenuItem>
                                                                      </Select>
                                                                    </FormControl>

                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Naturaleza</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.naturaleza}
                                                                        label="Naturaleza"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          const v = e.target.value; const p = v === 'automatico' ? 80 : v === 'semiautomatico' ? 60 : 40;
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, naturaleza: v, puntajeNaturaleza: p }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="automatico">Automático (80)</MenuItem>
                                                                        <MenuItem value="semiautomatico">Semiautomático (60)</MenuItem>
                                                                        <MenuItem value="manual">Manual (40)</MenuItem>
                                                                      </Select>
                                                                    </FormControl>

                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Desviaciones</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.desviaciones || 'A'}
                                                                        label="Desviaciones"
                                                                        sx={{ '& .MuiSelect-select': { whiteSpace: 'normal' } }}
                                                                        onChange={(e) => {
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, desviaciones: e.target.value }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="A" sx={{ whiteSpace: 'normal' }}>A. El control ha fallado 0 veces durante el último año</MenuItem>
                                                                        <MenuItem value="B" sx={{ whiteSpace: 'normal' }}>B. Se han encontrado desviaciones en el desempeño del control</MenuItem>
                                                                        <MenuItem value="C" sx={{ whiteSpace: 'normal' }}>C. El control falla la mayoría de las veces</MenuItem>
                                                                      </Select>
                                                                    </FormControl>
                                                                  </Box>
                                                                </Box>
                                                              </Box>
                                                            </Collapse>
                                                          )}

                                                          {/* RESULTADOS CALCULADOS */}
                                                          <Box sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}>
                                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                                              CALIFICACIÓN DEL RIESGO RESIDUAL
                                                            </Typography>
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, textAlign: 'center' }}>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">Eficacia Control</Typography>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                  {criteriosEvaluacion.tieneControl ? def : 'Inefectivo (Sin Control)'}
                                                                </Typography>
                                                                {criteriosEvaluacion.tieneControl && (
                                                                  <Typography variant="caption">({pt.toFixed(0)} pts)</Typography>
                                                                )}
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">% Mitigación</Typography>
                                                                <Typography variant="h6" color="primary">
                                                                  {(mit * 100).toFixed(0)}%
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">Frec. Residual</Typography>
                                                                <Typography variant="h6">
                                                                  {fRes}
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">Imp. Residual</Typography>
                                                                <Typography variant="h6">
                                                                  {iRes}
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Paper elevation={0} sx={{
                                                                  p: 1,
                                                                  bgcolor: getColorNivel(nivelRes),
                                                                  color: ['ALTO', 'CRÍTICO', 'CRITICO'].includes(nivelRes.toUpperCase()) ? 'white' : 'black',
                                                                  borderRadius: 1
                                                                }}>
                                                                  <Typography variant="caption" display="block" fontWeight="bold">Riesgo Residual</Typography>
                                                                  <Typography variant="h5" fontWeight="bold">
                                                                    {calRes}
                                                                  </Typography>
                                                                  <Typography variant="caption">
                                                                    {nivelRes}
                                                                  </Typography>
                                                                </Paper>
                                                              </Box>
                                                            </Box>
                                                          </Box>
                                                        </>
                                                      );
                                                    })()}
                                                  </Box>
                                                )}

                                                {(tipoClasificacion === 'PLAN' || tipoClasificacion === 'plan') && (
                                                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <TextField label="Nombre del Plan / Acción" value={formPlan.descripcion} onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })} fullWidth />
                                                      <TextField label="Responsable" value={formPlan.responsable} onChange={e => setFormPlan({ ...formPlan, responsable: e.target.value })} fullWidth />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <TextField label="Descripción Detallada" multiline rows={3} value={formPlan.detalle || ''} onChange={e => setFormPlan({ ...formPlan, detalle: e.target.value })} fullWidth />
                                                      <TextField label="Fecha Estimada de Finalización" type="date" value={formPlan.fechaEstimada} onChange={e => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
                                                    </Box>
                                                  </Box>
                                                )}

                                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                                  <Button onClick={() => setEvaluacionExpandida(null)}>Cancelar</Button>
                                                  <Button variant="contained" onClick={handleGuardarEvaluacion}>Guardar y Clasificar</Button>
                                                </Box>
                                              </Box>
                                            </Collapse>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    }
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
              })}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* TAB 1: CONTROLES */}
      <TabPanel value={activeTab} index={1}>
        <Box>
          {riesgosConControles.length === 0 ? (
            <Card><CardContent><Typography align="center">No hay controles registrados.</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Column Headers */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                gap: 2,
                px: 3,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box />
                <Typography variant="caption" fontWeight={700} color="text.secondary">ID RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">DESCRIPCIÓN DEL RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPOLOGÍA</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                <Box />
              </Box>

              {riesgosConControles.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                        gap: 2,
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: 'center'
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <IconButton size="small" color="primary">
                        {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="subtitle2" fontWeight={700} color="primary">
                        {riesgo.numeroIdentificacion || riesgo.numero || 'Sin ID'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{riesgo.descripcionRiesgo || riesgo.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {riesgo.tipologiaNivelI || '02 Operacional'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip
                          label="Control Activo"
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                      <Box />
                    </Box>
                    <Collapse in={estaExpandido}>
                      <Box sx={{ p: 2 }}>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#eee' }}>
                                <TableCell>Causa Original</TableCell>
                                <TableCell>Descripción del Control</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="center">Efectividad</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => (
                                <TableRow
                                  key={causa.id}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                    setItemDetalle(causa);
                                    setDialogDetailOpen(true);
                                    setCausaEnEdicion({ riesgoId: riesgo.id, causa });
                                  }}
                                >
                                  <TableCell sx={{ maxWidth: 250 }}>{causa.descripcion}</TableCell>
                                  <TableCell>{causa.controlDescripcion || causa.gestion?.controlDescripcion || 'Sin descripción'}</TableCell>
                                  <TableCell>{causa.controlTipo || causa.gestion?.controlTipo || 'N/A'}</TableCell>
                                  <TableCell align="center">
                                    {causa.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva || 'Sin evaluar'}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTipoClasificacion('CONTROL');
                                          handleEvaluarControl(riesgo.id, causa);
                                        }}
                                      >
                                        Editar
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEliminarClasificacion(riesgo.id, causa);
                                        }}
                                      >
                                        Eliminar
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* TAB 2: PLANES DE ACCIÓN */}
      <TabPanel value={activeTab} index={2}>
        <Box>
          {riesgosConPlanes.length === 0 ? (
            <Card><CardContent><Typography align="center">No hay planes de acción registrados.</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Column Headers */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                gap: 2,
                px: 3,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box />
                <Typography variant="caption" fontWeight={700} color="text.secondary">ID RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">DESCRIPCIÓN DEL RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPOLOGÍA</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                <Box />
              </Box>

              {riesgosConPlanes.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '48px 100px 1.5fr 200px 120px 48px',
                        gap: 2,
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: 'center'
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <IconButton size="small" color="primary">
                        {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="subtitle2" fontWeight={700} color="primary">{riesgo.numeroIdentificacion || riesgo.id}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{riesgo.descripcionRiesgo || riesgo.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">{riesgo.tipologiaNivelI || '02 Operacional'}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip label="Plan Activo" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                      </Box>
                      <Box />
                    </Box>
                    <Collapse in={estaExpandido}>
                      <Box sx={{ p: 2 }}>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#eee' }}>
                                <TableCell>Causa Original</TableCell>
                                <TableCell>Descripción del Plan</TableCell>
                                <TableCell>Responsable</TableCell>
                                <TableCell>Decisión</TableCell>
                                <TableCell align="center">Fecha Estimada</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => (
                                <Fragment key={causa.id}>
                                  <TableRow>
                                    <TableCell sx={{ maxWidth: 250 }}>{causa.descripcion}</TableCell>
                                    <TableCell>{causa.planDescripcion}</TableCell>
                                    <TableCell>{causa.planResponsable}</TableCell>
                                    <TableCell>{causa.planDecision || causa.gestion?.planDecision || 'N/A'}</TableCell>
                                    <TableCell align="center">{causa.planFechaEstimada}</TableCell>
                                    <TableCell align="center">
                                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setTipoClasificacion('PLAN');
                                            handleEvaluarControl(riesgo.id, causa);
                                          }}
                                        >
                                          Editar
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarClasificacion(riesgo.id, causa);
                                          }}
                                        >
                                          Eliminar
                                        </Button>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                  {evaluacionExpandida?.riesgoId === riesgo.id && evaluacionExpandida?.causaId === causa.id && (
                                    <TableRow>
                                      <TableCell colSpan={6} sx={{ p: 0 }}>
                                        <Collapse in={true}>
                                          <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                            <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>Configurar Plan de Acción</Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <TextField label="Nombre del Plan / Acción" value={formPlan.descripcion} onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })} fullWidth />
                                                <TextField label="Responsable" value={formPlan.responsable} onChange={e => setFormPlan({ ...formPlan, responsable: e.target.value })} fullWidth />
                                              </Box>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <TextField label="Descripción Detallada" multiline rows={3} value={formPlan.detalle || ''} onChange={e => setFormPlan({ ...formPlan, detalle: e.target.value })} fullWidth />
                                                <TextField label="Fecha Estimada de Finalización" type="date" value={formPlan.fechaEstimada} onChange={e => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
                                              </Box>
                                            </Box>
                                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                              <Button onClick={() => setEvaluacionExpandida(null)}>Cancelar</Button>
                                              <Button variant="contained" onClick={handleGuardarEvaluacion}>Guardar Plan</Button>
                                            </Box>
                                          </Box>
                                        </Collapse>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* DIALOG DETALLE CAUSA (New) */}
      <Dialog open={dialogDetailOpen} onClose={() => setDialogDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de la Causa</DialogTitle>
        <DialogContent dividers>
          {itemDetalle ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2">Descripción</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.descripcion}</Typography>

                <Typography variant="subtitle2">Fuente</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.fuenteCausa || itemDetalle.fuente || 'N/A'}</Typography>

                <Typography variant="subtitle2">Frecuencia</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.frecuencia || 'N/A'}</Typography>

                <Typography variant="subtitle2">Impacto Global</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{(itemDetalle.calificacionGlobalImpacto || itemDetalle.impactoMaximo || 'N/A')}</Typography>

                <Typography variant="subtitle2">Evaluación Definitiva</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.evaluacionDefinitiva || itemDetalle.gestion?.evaluacionDefinitiva || 'Sin evaluar'}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2">Control - Descripción</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.controlDescripcion || itemDetalle.gestion?.controlDescripcion || 'Sin descripción'}</Typography>

                <Typography variant="subtitle2">Control - Tipo</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.controlTipo || itemDetalle.gestion?.controlTipo || 'N/A'}</Typography>

                <Typography variant="subtitle2">Plan - Descripción</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.planDescripcion || itemDetalle.gestion?.planDescripcion || 'N/A'}</Typography>

                <Typography variant="subtitle2">Plan - Responsable / Fecha</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{(itemDetalle.planResponsable || itemDetalle.gestion?.planResponsable || 'N/A')} / {(itemDetalle.planFechaEstimada || itemDetalle.gestion?.planFechaEstimada || 'N/A')}</Typography>

                <Typography variant="subtitle2">Plan - Decisión</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{itemDetalle.planDecision || itemDetalle.gestion?.planDecision || 'N/A'}</Typography>

                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Impactos Residuales</Typography>
                {itemDetalle.impactosResiduales ? Object.entries(itemDetalle.impactosResiduales).map(([k, v]) => (
                  <Typography key={k} variant="body2">{k}: {String(v)}</Typography>
                )) : <Typography variant="body2">N/A</Typography>}
              </Box>
            </Box>
          ) : (
            <Typography>Sin detalle seleccionado.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetailOpen(false)}>Cerrar</Button>
          <Button
            onClick={() => {
              if (!causaEnEdicion) return;
              const { riesgoId, causa } = causaEnEdicion as any;
              // Ensure the risk card is expanded and open evaluation flow
              setRiesgosExpandidosResidual(pr => ({ ...pr, [riesgoId]: true }));
              setDialogDetailOpen(false);
              setTipoClasificacion((causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')).toLowerCase() as any);
              handleEvaluarControl(riesgoId, causa);
            }}
            variant="contained"
          >
            Editar
          </Button>
          <Button
            onClick={() => {
              if (!causaEnEdicion) return;
              const { riesgoId, causa } = causaEnEdicion as any;
              setDialogDetailOpen(false);
              handleAbrirClasificacion(riesgoId, causa);
            }}
          >
            Clasificar
          </Button>
          <Button
            color="error"
            onClick={async () => {
              if (!causaEnEdicion) return;
              await handleEliminarClasificacion(causaEnEdicion.riesgoId, causaEnEdicion.causa);
              setDialogDetailOpen(false);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CLASIFICACION CAUSA (Existing) */}
      <Dialog open={!!causaEnEdicion} onClose={() => setCausaEnEdicion(null)} maxWidth="md" fullWidth>
        <DialogTitle>Clasificar Causa</DialogTitle>
        <DialogContent>
          {/* ... Simplified Form ... */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo</InputLabel>
            <Select value={tipoClasificacion} onChange={(e) => setTipoClasificacion(e.target.value as any)} label="Tipo">
              <MenuItem value="seleccion">Selección</MenuItem>
              <MenuItem value="control">Control</MenuItem>
              <MenuItem value="plan">Plan de Acción</MenuItem>
            </Select>
          </FormControl>
          {tipoClasificacion === 'control' && <TextField fullWidth label="Descripción Control" value={formControl.descripcion} onChange={e => setFormControl({ ...formControl, descripcion: e.target.value })} sx={{ mt: 2 }} />}
          {tipoClasificacion === 'plan' && (
            <>
              <TextField fullWidth label="Descripción Plan" value={formPlan.descripcion} onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })} sx={{ mt: 2 }} />
              <TextField fullWidth label="Decisión" value={formPlan.decision} onChange={e => setFormPlan({ ...formPlan, decision: e.target.value })} sx={{ mt: 2 }} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCausaEnEdicion(null)}>Cancelar</Button>
          <Button onClick={handleGuardarClasificacion} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>



    </AppPageLayout>
  );
}
