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
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useGetRiesgosQuery, useUpdateCausaMutation, useUpdateRiesgoMutation, riesgosApi } from '../../api/services/riesgosApi';
import { useAppDispatch } from '../../app/hooks';
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
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState(0);

  // Estados Clasificación Existente
  const [clasificaciones, setClasificaciones] = useState<ClasificacionCausa[]>([]);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [causaEnEdicion, setCausaEnEdicion] = useState<{ riesgoId: string; causa: any; clasificacion?: ClasificacionCausa; } | null>(null);
  const [causaDetalleView, setCausaDetalleView] = useState<{ riesgoId: string; causa: any } | null>(null);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [itemDetalle, setItemDetalle] = useState<ClasificacionCausa | null>(null);
  const [tipoClasificacion, setTipoClasificacion] = useState<'seleccion' | 'control' | 'plan' | 'CONTROL' | 'PLAN' | 'AMBOS' | string>('seleccion');
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

  // OPTIMIZADO: Cargar riesgos con paginación razonable
  // Usar pageSize máximo permitido (100) y paginación si es necesario
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100; // Máximo permitido por el backend
  
  // OPTIMIZADO: Caché agresivo para mejor rendimiento
  const { data: riesgosApiData } = useGetRiesgosQuery(
    procesoSeleccionado ? { 
      procesoId: String(procesoSeleccionado.id), 
      pageSize: pageSize, 
      page: currentPage,
      includeCausas: true 
    } : { pageSize: 0 },
    { 
      skip: !procesoSeleccionado,
      refetchOnMountOrArgChange: false, // OPTIMIZADO: No refetch si ya está en caché
      refetchOnFocus: false,
      refetchOnReconnect: false,
      keepUnusedDataFor: 600 // 10 minutos de caché
    }
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
        
        // Causas sin clasificar
        if (tipo === 'PENDIENTE' || !tipo) return true;
        
        // AMBOS incompleto (falta control o plan)
        if (tipo === 'AMBOS') {
          const estadoAmbos = c.gestion?.estadoAmbos;
          const controlActivo = estadoAmbos?.controlActivo ?? true;
          const planActivo = estadoAmbos?.planActivo ?? true;
          
          // Mostrar en clasificación si falta alguno
          return !controlActivo || !planActivo;
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  const riesgosConPlanes = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || '').toUpperCase();
        
        if (tipo === 'PLAN') return true;
        
        if (tipo === 'AMBOS') {
          const planActivo = c.gestion?.estadoAmbos?.planActivo ?? true;
          return planActivo; // ← Solo mostrar si plan está activo
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  const riesgosConControles = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
        
        if (tipo === 'CONTROL') return true;
        
        if (tipo === 'AMBOS') {
          const controlActivo = c.gestion?.estadoAmbos?.controlActivo ?? true;
          return controlActivo; // ← Solo mostrar si control está activo
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  // Ordenamiento para las listas de riesgos en las pestañas
  type RiesgoSortFieldSimple = 'id' | 'descripcion' | 'tipologia' | 'clasificacion' | 'estado';

  const [sortPendientes, setSortPendientes] = useState<{ field: RiesgoSortFieldSimple; direction: 'asc' | 'desc' }>({
    field: 'id',
    direction: 'asc',
  });
  const [sortControles, setSortControles] = useState<{ field: RiesgoSortFieldSimple; direction: 'asc' | 'desc' }>({
    field: 'id',
    direction: 'asc',
  });
  const [sortPlanes, setSortPlanes] = useState<{ field: RiesgoSortFieldSimple; direction: 'asc' | 'desc' }>({
    field: 'id',
    direction: 'asc',
  });

  const getRiesgoSimpleSortValue = (riesgo: any, field: RiesgoSortFieldSimple) => {
    switch (field) {
      case 'id':
        return riesgo.numeroIdentificacion || riesgo.numero || riesgo.id || '';
      case 'descripcion':
        return riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || '';
      case 'tipologia':
        return riesgo.tipologiaNivelI || riesgo.tipologia || '';
      case 'clasificacion':
        // Usar nivel de riesgo residual si existe, o nivel inherente
        return (
          riesgo.evaluacion?.nivelRiesgoResidual ||
          riesgo.nivelRiesgoResidual ||
          riesgo.riesgoResidual ||
          riesgo.evaluacion?.nivelRiesgo ||
          riesgo.nivelRiesgo ||
          ''
        );
      case 'estado':
        return riesgo.estado || '';
      default:
        return '';
    }
  };

  const ordenarRiesgos = (lista: any[], sort: { field: RiesgoSortFieldSimple; direction: 'asc' | 'desc' }) => {
    const data = [...lista];
    data.sort((a, b) => {
      const aVal = getRiesgoSimpleSortValue(a, sort.field);
      const bVal = getRiesgoSimpleSortValue(b, sort.field);
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comp = aStr.localeCompare(bStr, 'es');
      return sort.direction === 'asc' ? comp : -comp;
    });
    return data;
  };

  const riesgosPendientesOrdenados = useMemo(
    () => ordenarRiesgos(riesgosPendientes, sortPendientes),
    [riesgosPendientes, sortPendientes],
  );
  const riesgosConControlesOrdenados = useMemo(
    () => ordenarRiesgos(riesgosConControles, sortControles),
    [riesgosConControles, sortControles],
  );
  const riesgosConPlanesOrdenados = useMemo(
    () => ordenarRiesgos(riesgosConPlanes, sortPlanes),
    [riesgosConPlanes, sortPlanes],
  );

  const toggleSort =
    (setter: React.Dispatch<React.SetStateAction<{ field: RiesgoSortFieldSimple; direction: 'asc' | 'desc' }>>) =>
    (field: RiesgoSortFieldSimple) => {
      setter((prev) =>
        prev.field === field
          ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
          : { field, direction: 'asc' },
      );
    };

  const handleSortPendientes = toggleSort(setSortPendientes);
  const handleSortControlesLista = toggleSort(setSortControles);
  const handleSortPlanesLista = toggleSort(setSortPlanes);

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
        const tipoActual = (c.tipoGestion || '').toUpperCase();
        
        // Si es AMBOS, reactivar la parte que se está agregando
        if (tipoActual === 'AMBOS') {
          const estadoAmbosActual = c.gestion?.estadoAmbos || { controlActivo: true, planActivo: true };
          
          // Si se selecciona AMBOS, reactivar ambas partes
          const nuevoEstadoAmbos = tipoClasificacion === 'AMBOS' 
            ? { controlActivo: true, planActivo: true }
            : {
                controlActivo: tipoClasificacion === 'CONTROL' ? true : estadoAmbosActual.controlActivo,
                planActivo: tipoClasificacion === 'PLAN' ? true : estadoAmbosActual.planActivo
              };
          
          // Si se selecciona AMBOS (re-agregar ambos)
          if (tipoClasificacion === 'AMBOS') {
            let pt = 0;
            let prel = 'Inefectivo';
            let def = 'Inefectivo';
            let mit = 0;

            if (criteriosEvaluacion.tieneControl) {
              pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
              prel = determinarEvaluacionPreliminar(pt);
              def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
              mit = obtenerPorcentajeMitigacionAvanzado(def);
            }

            const fRes = calcularFrecuenciaResidualAvanzada(c.frecuencia || 1, c.calificacionGlobalImpacto || 1, mit, criteriosEvaluacion.tipoMitigacion);
            const iRes = calcularImpactoResidualAvanzado(c.calificacionGlobalImpacto || 1, c.frecuencia || 1, mit, criteriosEvaluacion.tipoMitigacion);
            const calRes = calcularCalificacionResidual(fRes, iRes);
            
            let nivelResidualCausa = 'Sin Calificar';
            if (calRes >= 15 && calRes <= 25) nivelResidualCausa = 'Crítico';
            else if (calRes >= 10 && calRes <= 14) nivelResidualCausa = 'Alto';
            else if (calRes >= 5 && calRes <= 9) nivelResidualCausa = 'Medio';
            else if (calRes >= 1 && calRes <= 4) nivelResidualCausa = 'Bajo';
            
            causaActualizada = {
              ...c,
              ...criteriosEvaluacion,
              controlDesviaciones: criteriosEvaluacion.desviaciones,
              controlDescripcion: criteriosEvaluacion.descripcionControl,
              controlResponsable: criteriosEvaluacion.responsable,
              tieneControl: criteriosEvaluacion.tieneControl,
              tipoGestion: 'AMBOS',
              puntajeTotal: pt,
              evaluacionDefinitiva: def,
              porcentajeMitigacion: mit,
              frecuenciaResidual: fRes,
              impactoResidual: iRes,
              calificacionResidual: calRes,
              nivelRiesgoResidual: nivelResidualCausa,
              // Datos del plan
              planDescripcion: formPlan.descripcion,
              planDetalle: formPlan.detalle,
              planResponsable: formPlan.responsable,
              planDecision: formPlan.decision,
              planFechaEstimada: formPlan.fechaEstimada,
              planEstado: formPlan.estado,
              gestion: {
                ...(c.gestion || {}),
                estadoAmbos: nuevoEstadoAmbos
              }
            };
            return causaActualizada;
          }
          
          // Mantener AMBOS y actualizar estado (solo control o solo plan)
          if (tipoClasificacion === 'CONTROL' || tipoClasificacion === 'control') {
            let pt = 0;
            let prel = 'Inefectivo';
            let def = 'Inefectivo';
            let mit = 0;

            if (criteriosEvaluacion.tieneControl) {
              pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
              prel = determinarEvaluacionPreliminar(pt);
              def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
              mit = obtenerPorcentajeMitigacionAvanzado(def);
            }

            const fRes = calcularFrecuenciaResidualAvanzada(c.frecuencia || 1, c.calificacionGlobalImpacto || 1, mit, criteriosEvaluacion.tipoMitigacion);
            const iRes = calcularImpactoResidualAvanzado(c.calificacionGlobalImpacto || 1, c.frecuencia || 1, mit, criteriosEvaluacion.tipoMitigacion);
            const calRes = calcularCalificacionResidual(fRes, iRes);
            
            let nivelResidualCausa = 'Sin Calificar';
            if (calRes >= 15 && calRes <= 25) nivelResidualCausa = 'Crítico';
            else if (calRes >= 10 && calRes <= 14) nivelResidualCausa = 'Alto';
            else if (calRes >= 5 && calRes <= 9) nivelResidualCausa = 'Medio';
            else if (calRes >= 1 && calRes <= 4) nivelResidualCausa = 'Bajo';
            
            causaActualizada = {
              ...c,
              ...criteriosEvaluacion,
              controlDesviaciones: criteriosEvaluacion.desviaciones,
              controlDescripcion: criteriosEvaluacion.descripcionControl,
              controlResponsable: criteriosEvaluacion.responsable,
              tieneControl: criteriosEvaluacion.tieneControl,
              tipoGestion: 'AMBOS', // ← Mantener AMBOS
              puntajeTotal: pt,
              evaluacionDefinitiva: def,
              porcentajeMitigacion: mit,
              frecuenciaResidual: fRes,
              impactoResidual: iRes,
              calificacionResidual: calRes,
              nivelRiesgoResidual: nivelResidualCausa,
              // ← PRESERVAR datos del plan existente
              planDescripcion: c.planDescripcion,
              planDetalle: c.planDetalle,
              planResponsable: c.planResponsable,
              planDecision: c.planDecision,
              planFechaEstimada: c.planFechaEstimada,
              planEstado: c.planEstado,
              gestion: {
                ...(c.gestion || {}),
                estadoAmbos: nuevoEstadoAmbos
              }
            };
          } else {
            // PLAN
            causaActualizada = {
              ...c,
              tipoGestion: 'AMBOS', // ← Mantener AMBOS
              planDescripcion: formPlan.descripcion,
              planDetalle: formPlan.detalle,
              planResponsable: formPlan.responsable,
              planDecision: formPlan.decision,
              planFechaEstimada: formPlan.fechaEstimada,
              planEstado: formPlan.estado,
              // ← PRESERVAR datos del control existente
              ...criteriosEvaluacion,
              controlDesviaciones: c.controlDesviaciones,
              controlDescripcion: c.controlDescripcion,
              controlResponsable: c.controlResponsable,
              tieneControl: c.tieneControl,
              puntajeTotal: c.puntajeTotal,
              evaluacionDefinitiva: c.evaluacionDefinitiva,
              porcentajeMitigacion: c.porcentajeMitigacion,
              frecuenciaResidual: c.frecuenciaResidual,
              impactoResidual: c.impactoResidual,
              calificacionResidual: c.calificacionResidual,
              nivelRiesgoResidual: c.nivelRiesgoResidual,
              gestion: {
                ...(c.gestion || {}),
                estadoAmbos: nuevoEstadoAmbos
              }
            };
          }
          
          return causaActualizada;
        }
        
        // Si NO es AMBOS, comportamiento normal
        if (tipoClasificacion === 'CONTROL' || tipoClasificacion === 'control' || tipoClasificacion === 'AMBOS' || (!tipoClasificacion)) {
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
            pt = 0;
            prel = 'Inefectivo';
            def = 'Inefectivo';
            mit = 0;
          }

          const fRes = calcularFrecuenciaResidualAvanzada(c.frecuencia || 1, c.calificacionGlobalImpacto || 1, mit, criteriosEvaluacion.tipoMitigacion);
          const iRes = calcularImpactoResidualAvanzado(c.calificacionGlobalImpacto || 1, c.frecuencia || 1, mit, criteriosEvaluacion.tipoMitigacion);
          const calRes = calcularCalificacionResidual(fRes, iRes);
          
          let nivelResidualCausa = 'Sin Calificar';
          if (calRes >= 15 && calRes <= 25) nivelResidualCausa = 'Crítico';
          else if (calRes >= 10 && calRes <= 14) nivelResidualCausa = 'Alto';
          else if (calRes >= 5 && calRes <= 9) nivelResidualCausa = 'Medio';
          else if (calRes >= 1 && calRes <= 4) nivelResidualCausa = 'Bajo';
          
          causaActualizada = {
            ...c, ...criteriosEvaluacion,
            controlDesviaciones: criteriosEvaluacion.desviaciones,
            controlDescripcion: criteriosEvaluacion.descripcionControl,
            controlResponsable: criteriosEvaluacion.responsable,
            tieneControl: criteriosEvaluacion.tieneControl,
            tipoGestion: tipoClasificacion === 'AMBOS' ? 'AMBOS' : 'CONTROL',
            puntajeTotal: pt, evaluacionDefinitiva: def, porcentajeMitigacion: mit,
            frecuenciaResidual: fRes, impactoResidual: iRes,
            calificacionResidual: calRes,
            nivelRiesgoResidual: nivelResidualCausa,
            ...(tipoClasificacion === 'AMBOS' && {
              planDescripcion: formPlan.descripcion,
              planDetalle: formPlan.detalle,
              planResponsable: formPlan.responsable,
              planDecision: formPlan.decision,
              planFechaEstimada: formPlan.fechaEstimada,
              planEstado: formPlan.estado,
              gestion: {
                estadoAmbos: { controlActivo: true, planActivo: true }
              }
            }),
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
      // Calcular Riesgo Residual Global (MAX de los residuales de TODAS las causas con controles)
      const todasLasCausas = causasUpd;
      
      // Filtrar solo las causas que tienen controles aplicados Y activos
      const causasConControles = todasLasCausas.filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
        
        if (tipo === 'CONTROL') return true;
        
        if (tipo === 'AMBOS') {
          const controlActivo = c.gestion?.estadoAmbos?.controlActivo ?? true;
          return controlActivo; // ← Solo contar si está activo
        }
        
        return false;
      });
      
      // Calcular calificaciones residuales de TODAS las causas con controles
      const calificacionesResiduales = causasConControles.map((c: any) => {
        // Priorizar calificacionResidual calculada
        if (c.calificacionResidual !== undefined && c.calificacionResidual !== null) {
          return Number(c.calificacionResidual);
        }
        
        // Si no hay calificación residual, intentar calcular desde frecuenciaResidual e impactoResidual
        if (c.frecuenciaResidual !== undefined && c.impactoResidual !== undefined) {
          const freqRes = Number(c.frecuenciaResidual);
          const impRes = Number(c.impactoResidual);
          if (!isNaN(freqRes) && !isNaN(impRes) && freqRes >= 1 && freqRes <= 5 && impRes >= 1 && impRes <= 5) {
            // Aplicar excepción 2x2 = 3.99
            if (freqRes === 2 && impRes === 2) {
              return 3.99;
            }
            return freqRes * impRes;
          }
        }
        
        // Fallback: usar riesgo inherente de la causa (si no tiene control, usar inherente)
        const prob = c.frecuencia || riesgo.evaluacion?.probabilidad || 1;
        const imp = c.calificacionGlobalImpacto || riesgo.evaluacion?.impactoGlobal || riesgo.evaluacion?.impactoMaximo || 1;
        const inherente = prob * imp;
        return inherente;
      });
      
      // El riesgo residual global SIEMPRE es el MÁXIMO de todas las calificaciones residuales
      // Si no hay causas con controles, usar el riesgo inherente del riesgo
      const maxRiesgoResidual = calificacionesResiduales.length > 0 
        ? Math.max(...calificacionesResiduales)
        : (riesgo.evaluacion?.riesgoInherente || riesgo.evaluacion?.probabilidad * riesgo.evaluacion?.impactoGlobal || 0);
      
      // Calcular probabilidadResidual e impactoResidual desde maxRiesgoResidual
      let mejorProbRes = 1;
      let mejorImpRes = 1;
      let menorDiferenciaRes = Math.abs(maxRiesgoResidual - (mejorProbRes * mejorImpRes));
      
      for (let prob = 1; prob <= 5; prob++) {
        for (let imp = 1; imp <= 5; imp++) {
          const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
          
          if (valor >= maxRiesgoResidual) {
            const diferencia = valor - maxRiesgoResidual;
            if (diferencia < menorDiferenciaRes || (menorDiferenciaRes > 0 && valor < (mejorProbRes * mejorImpRes))) {
              menorDiferenciaRes = diferencia;
              mejorProbRes = prob;
              mejorImpRes = imp;
            }
          } else {
            const diferencia = Math.abs(maxRiesgoResidual - valor);
            if (diferencia < menorDiferenciaRes) {
              menorDiferenciaRes = diferencia;
              mejorProbRes = prob;
              mejorImpRes = imp;
            }
          }
        }
      }
      
      // Calcular nivelRiesgoResidual
      let nivelRiesgoResidual = 'Sin Calificar';
      if (maxRiesgoResidual >= 15 && maxRiesgoResidual <= 25) {
        nivelRiesgoResidual = 'Crítico';
      } else if (maxRiesgoResidual >= 10 && maxRiesgoResidual <= 14) {
        nivelRiesgoResidual = 'Alto';
      } else if (maxRiesgoResidual >= 5 && maxRiesgoResidual <= 9) {
        nivelRiesgoResidual = 'Medio';
      } else if (maxRiesgoResidual >= 1 && maxRiesgoResidual <= 4) {
        nivelRiesgoResidual = 'Bajo';
      }

      console.log('[Controles] 💾 Guardando valores residuales:', {
        riesgoId: riesgoIdEvaluacion,
        maxRiesgoResidual,
        probabilidadResidual: mejorProbRes,
        impactoResidual: mejorImpRes,
        nivelRiesgoResidual
      });

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
        // Guardar todos los valores residuales en la evaluación
        await actualizarRiesgoApi(riesgoIdEvaluacion, {
          causas: causasUpd,
          evaluacion: {
            riesgoResidual: maxRiesgoResidual,
            probabilidadResidual: mejorProbRes,
            impactoResidual: mejorImpRes,
            nivelRiesgoResidual: nivelRiesgoResidual
          }
        } as any);
        
        // Invalidar caché de RTK Query para actualizar el mapa
        dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion']));
        
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

  const handleEliminarClasificacion = async (
    riesgoId: string, 
    causa: any, 
    contexto: 'CONTROL' | 'PLAN'
  ) => {
    try {
      const tipoActual = (causa.tipoGestion || '').toUpperCase();
      
      if (tipoActual === 'AMBOS') {
        // Calcular el nuevo estado después de eliminar
        const gestionActual = causa.gestion || {};
        const estadoAmbosActual = gestionActual.estadoAmbos || { controlActivo: true, planActivo: true };
        
        const nuevoEstadoAmbos = {
          controlActivo: contexto === 'CONTROL' ? false : estadoAmbosActual.controlActivo,
          planActivo: contexto === 'PLAN' ? false : estadoAmbosActual.planActivo
        };
        
        // Si ambos están inactivos, volver a estado sin clasificar
        if (!nuevoEstadoAmbos.controlActivo && !nuevoEstadoAmbos.planActivo) {
          // Opcional: guardar historial para trazabilidad
          const historial = {
            fechaEliminacion: new Date().toISOString(),
            tipoGestionAnterior: 'AMBOS',
            datosAnteriores: gestionActual
          };
          
          await updateCausa({
            id: causa.id,
            tipoGestion: null, // ← Volver a sin clasificar
            gestion: { historial } // Guardar historial para trazabilidad
          }).unwrap();
          
          showSuccess('Ambos eliminados. La causa vuelve a estado sin clasificar.');
        } else {
          // Mantener AMBOS con estado parcial (solo uno eliminado)
          // Construir objeto gestion con TODOS los datos
          const gestionActualizada = {
            ...gestionActual,
            estadoAmbos: nuevoEstadoAmbos,
            // Datos del plan
            planDescripcion: causa.planDescripcion,
            planDetalle: causa.planDetalle,
            planResponsable: causa.planResponsable,
            planDecision: causa.planDecision,
            planFechaEstimada: causa.planFechaEstimada,
            planEstado: causa.planEstado,
            // Datos del control
            aplicabilidad: causa.aplicabilidad,
            puntajeAplicabilidad: causa.puntajeAplicabilidad,
            cobertura: causa.cobertura,
            puntajeCobertura: causa.puntajeCobertura,
            facilidadUso: causa.facilidadUso,
            puntajeFacilidad: causa.puntajeFacilidad,
            segregacionFunciones: causa.segregacionFunciones,
            puntajeSegregacion: causa.puntajeSegregacion,
            naturalezaControl: causa.naturalezaControl,
            puntajeNaturaleza: causa.puntajeNaturaleza,
            desviaciones: causa.desviaciones,
            controlDesviaciones: causa.controlDesviaciones,
            descripcionControl: causa.descripcionControl,
            controlDescripcion: causa.controlDescripcion,
            responsable: causa.responsable,
            controlResponsable: causa.controlResponsable,
            tieneControl: causa.tieneControl,
            tipoMitigacion: causa.tipoMitigacion,
            puntajeTotal: causa.puntajeTotal,
            evaluacionPreliminar: causa.evaluacionPreliminar,
            evaluacionDefinitiva: causa.evaluacionDefinitiva,
            porcentajeMitigacion: causa.porcentajeMitigacion,
            frecuenciaResidual: causa.frecuenciaResidual,
            impactoResidual: causa.impactoResidual,
            calificacionResidual: causa.calificacionResidual,
            nivelRiesgoResidual: causa.nivelRiesgoResidual
          };
          
          await updateCausa({
            id: causa.id,
            tipoGestion: 'AMBOS',
            gestion: gestionActualizada
          }).unwrap();
          
          showSuccess(
            contexto === 'CONTROL' 
              ? 'Control eliminado. Puede re-agregarlo desde Clasificación.'
              : 'Plan de Acción eliminado. Puede re-agregarlo desde Clasificación.'
          );
        }
      } else {
        // Si NO es AMBOS, eliminar completamente la clasificación
        await updateCausa({
          id: causa.id,
          tipoGestion: null,
          gestion: null
        }).unwrap();
        
        showSuccess('Clasificación eliminada. La causa volverá a aparecer en Clasificación.');
      }
    } catch (error) {
      console.error('Error al eliminar clasificación:', error);
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
                gridTemplateColumns: '48px 100px 1.5fr 200px 120px 120px 48px',
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
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPendientes('id')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary">ID RIESGO</Typography>
                  {sortPendientes.field === 'id' ? (
                    sortPendientes.direction === 'asc' ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />
                  ) : (
                    <UnfoldMoreIcon fontSize="inherit" />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPendientes('descripcion')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary">DESCRIPCIÓN DEL RIESGO</Typography>
                  {sortPendientes.field === 'descripcion' ? (
                    sortPendientes.direction === 'asc' ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />
                  ) : (
                    <UnfoldMoreIcon fontSize="inherit" />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPendientes('tipologia')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPOLOGÍA</Typography>
                  {sortPendientes.field === 'tipologia' ? (
                    sortPendientes.direction === 'asc' ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />
                  ) : (
                    <UnfoldMoreIcon fontSize="inherit" />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPendientes('clasificacion')}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">CLASIFICACIÓN</Typography>
                  {sortPendientes.field === 'clasificacion' ? (
                    sortPendientes.direction === 'asc' ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />
                  ) : (
                    <UnfoldMoreIcon fontSize="inherit" />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPendientes('estado')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                  {sortPendientes.field === 'estado' ? (
                    sortPendientes.direction === 'asc' ? <ArrowUpwardIcon fontSize="inherit" /> : <ArrowDownwardIcon fontSize="inherit" />
                  ) : (
                    <UnfoldMoreIcon fontSize="inherit" />
                  )}
                </Box>
                <Box /> {/* Spacer for end icon */}
              </Box>

              {riesgosPendientesOrdenados.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '48px 100px 1.5fr 200px 120px 120px 48px',
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

                      {/* Columna de Clasificación/Nivel de Riesgo */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {(() => {
                          // Obtener nivel desde evaluación o calcular desde causas
                          let nivelRiesgo = riesgo.evaluacion?.nivelRiesgo || riesgo.nivelRiesgo;
                          
                          // Si no hay nivel, calcular desde causas (calificación inherente global)
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
                          
                          if (!nivelRiesgo) nivelRiesgo = 'Sin Calificar';
                          
                          const nivelNormalizado = nivelRiesgo.toLowerCase();
                          let color = '#666';
                          let bgColor = '#f5f5f5';
                          
                          if (nivelNormalizado.includes('crítico') || nivelNormalizado.includes('critico')) {
                            color = '#fff';
                            bgColor = '#d32f2f';
                          } else if (nivelNormalizado.includes('alto')) {
                            color = '#fff';
                            bgColor = '#f57c00';
                          } else if (nivelNormalizado.includes('medio')) {
                            color = '#fff';
                            bgColor = '#fbc02d';
                          } else if (nivelNormalizado.includes('bajo')) {
                            color = '#fff';
                            bgColor = '#388e3c';
                          }
                          
                          return (
                            <Chip
                              label={nivelRiesgo.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: bgColor,
                                color: color,
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 24,
                                minWidth: 80
                              }}
                            />
                          );
                        })()}
                      </Box>

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
                                
                                // Permitir causas pendientes y AMBOS incompletos
                                if (tipoGestion === 'PENDIENTE') {
                                  // Causa sin clasificar - OK
                                } else if (tipoGestion === 'AMBOS') {
                                  // Verificar si está incompleto
                                  const estadoAmbos = causa.gestion?.estadoAmbos;
                                  const controlActivo = estadoAmbos?.controlActivo ?? true;
                                  const planActivo = estadoAmbos?.planActivo ?? true;
                                  
                                  // Si ambos están activos, no mostrar en clasificación
                                  if (controlActivo && planActivo) return null;
                                } else {
                                  // Otros tipos no se muestran en clasificación
                                  return null;
                                }

                                return (
                                  <Fragment key={causa.id}>
                                    <TableRow>
                                      <TableCell sx={{ maxWidth: 300 }}>{causa.descripcion}</TableCell>
                                      <TableCell align="center">{causa.frecuencia || 1}</TableCell>
                                      <TableCell align="center">{(causa.calificacionGlobalImpacto || 1).toFixed(2)}</TableCell>
                                      <TableCell align="center">
                                        <FormControl size="small" sx={{ minWidth: 200 }}>
                                          <InputLabel>Acción</InputLabel>
                                          <Select
                                            value=""
                                            label="Acción"
                                            onChange={(e) => {
                                              const accion = e.target.value;
                                              if (accion) {
                                                // Primero establecer el tipo de clasificación
                                                setTipoClasificacion(accion as any);
                                                // Usar setTimeout para asegurar que el estado se actualice antes de abrir el diálogo
                                                setTimeout(() => {
                                                  handleEvaluarControl(riesgo.id, causa);
                                                }, 0);
                                              }
                                            }}
                                          >
                                            {(() => {
                                              const tipoGestion = (causa.tipoGestion || '').toUpperCase();
                                              
                                              // Si es AMBOS incompleto
                                              if (tipoGestion === 'AMBOS') {
                                                const estadoAmbos = causa.gestion?.estadoAmbos;
                                                const controlActivo = estadoAmbos?.controlActivo ?? true;
                                                const planActivo = estadoAmbos?.planActivo ?? true;
                                                
                                                // Falta control
                                                if (!controlActivo && planActivo) {
                                                  return [
                                                    <MenuItem key="control" value="CONTROL">
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <ShieldIcon fontSize="small" />
                                                        Control (Re-agregar)
                                                      </Box>
                                                    </MenuItem>,
                                                    <MenuItem key="plan" value="PLAN" disabled>
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                                        <AssignmentIcon fontSize="small" />
                                                        Plan de Acción (Ya aplicado)
                                                      </Box>
                                                    </MenuItem>
                                                  ];
                                                }
                                                
                                                // Falta plan
                                                if (controlActivo && !planActivo) {
                                                  return [
                                                    <MenuItem key="control" value="CONTROL" disabled>
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                                        <ShieldIcon fontSize="small" />
                                                        Control (Ya aplicado)
                                                      </Box>
                                                    </MenuItem>,
                                                    <MenuItem key="plan" value="PLAN">
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AssignmentIcon fontSize="small" />
                                                        Plan de Acción (Re-agregar)
                                                      </Box>
                                                    </MenuItem>
                                                  ];
                                                }
                                                
                                                // Faltan ambos
                                                if (!controlActivo && !planActivo) {
                                                  return [
                                                    <MenuItem key="control" value="CONTROL">
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <ShieldIcon fontSize="small" />
                                                        Control (Re-agregar)
                                                      </Box>
                                                    </MenuItem>,
                                                    <MenuItem key="plan" value="PLAN">
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <AssignmentIcon fontSize="small" />
                                                        Plan de Acción (Re-agregar)
                                                      </Box>
                                                    </MenuItem>,
                                                    <MenuItem key="ambos" value="AMBOS">
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CheckCircleIcon fontSize="small" />
                                                        Ambos (Re-agregar)
                                                      </Box>
                                                    </MenuItem>
                                                  ];
                                                }
                                              }
                                              
                                              // Causa sin clasificar (normal)
                                              return [
                                                <MenuItem key="control" value="CONTROL">
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ShieldIcon fontSize="small" />
                                                    Control
                                                  </Box>
                                                </MenuItem>,
                                                <MenuItem key="plan" value="PLAN">
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AssignmentIcon fontSize="small" />
                                                    Plan de Acción
                                                  </Box>
                                                </MenuItem>,
                                                <MenuItem key="ambos" value="AMBOS">
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircleIcon fontSize="small" />
                                                    Ambos
                                                  </Box>
                                                </MenuItem>
                                              ];
                                            })()}
                                          </Select>
                                        </FormControl>
                                      </TableCell>
                                      <TableCell align="center">
                                        {(() => {
                                          const tipoGestion = (causa.tipoGestion || '').toUpperCase();
                                          
                                          if (tipoGestion === 'AMBOS') {
                                            const estadoAmbos = causa.gestion?.estadoAmbos;
                                            const controlActivo = estadoAmbos?.controlActivo ?? true;
                                            const planActivo = estadoAmbos?.planActivo ?? true;
                                            
                                            if (!controlActivo && planActivo) {
                                              return (
                                                <Chip 
                                                  label="AMBOS - Falta Control" 
                                                  size="small" 
                                                  color="error"
                                                  variant="outlined"
                                                  icon={<WarningIcon />}
                                                  sx={{ fontSize: '0.7rem' }}
                                                />
                                              );
                                            }
                                            
                                            if (controlActivo && !planActivo) {
                                              return (
                                                <Chip 
                                                  label="AMBOS - Falta Plan" 
                                                  size="small" 
                                                  color="error"
                                                  variant="outlined"
                                                  icon={<WarningIcon />}
                                                  sx={{ fontSize: '0.7rem' }}
                                                />
                                              );
                                            }
                                            
                                            if (!controlActivo && !planActivo) {
                                              return (
                                                <Chip 
                                                  label="AMBOS - Incompleto" 
                                                  size="small" 
                                                  color="error"
                                                  variant="filled"
                                                  icon={<WarningIcon />}
                                                  sx={{ fontSize: '0.7rem' }}
                                                />
                                              );
                                            }
                                          }
                                          
                                          return (
                                            <Chip 
                                              label="Pendiente" 
                                              variant="outlined" 
                                              size="small" 
                                            />
                                          );
                                        })()}
                                      </TableCell>
                                    </TableRow>
                                    {
                                      evaluacionExpandida?.riesgoId === riesgo.id && evaluacionExpandida?.causaId === causa.id && (
                                        <TableRow>
                                          <TableCell colSpan={6} sx={{ p: 0 }}>
                                            <Collapse in={true}>
                                              <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                                                  {tipoClasificacion === 'AMBOS' ? 'Evaluar Control y Configurar Plan de Acción' : tipoClasificacion === 'PLAN' ? 'Configurar Plan de Acción' : 'Evaluar Efectividad del Control'}
                                                </Typography>

                                                {(tipoClasificacion === 'CONTROL' || tipoClasificacion === 'control' || tipoClasificacion === 'AMBOS' || (!tipoClasificacion && !causaIdEvaluacion)) && (
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

                                                {(tipoClasificacion === 'PLAN' || tipoClasificacion === 'plan' || tipoClasificacion === 'AMBOS') && (
                                                  <Box sx={{ mt: tipoClasificacion === 'AMBOS' ? 4 : 0 }}>
                                                    {tipoClasificacion === 'AMBOS' && (
                                                      <Divider sx={{ my: 3 }}>
                                                        <Typography variant="h6" color="primary" fontWeight={600}>
                                                          Configurar Plan de Acción
                                                        </Typography>
                                                      </Divider>
                                                    )}
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
                gridTemplateColumns: '45px 90px 1fr 150px 120px 120px 50px',
                gap: 1,
                px: 2,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box />
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortControlesLista('id')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">ID RIESGO</Typography>
                  {sortControles.field === 'id' ? (
                    sortControles.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortControlesLista('descripcion')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">DESCRIPCIÓN DEL RIESGO</Typography>
                  {sortControles.field === 'descripcion' ? (
                    sortControles.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortControlesLista('tipologia')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">TIPOLOGÍA</Typography>
                  {sortControles.field === 'tipologia' ? (
                    sortControles.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortControlesLista('clasificacion')}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" fontSize="0.7rem">CLASIFICACIÓN</Typography>
                  {sortControles.field === 'clasificacion' ? (
                    sortControles.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortControlesLista('estado')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" fontSize="0.7rem">ESTADO</Typography>
                  {sortControles.field === 'estado' ? (
                    sortControles.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box />
              </Box>

              {riesgosConControlesOrdenados.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '45px 90px 1fr 150px 120px 120px 50px',
                        gap: 1,
                        p: 1.5,
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: 'center',
                        width: '100%'
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                          {estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem">
                        {riesgo.numeroIdentificacion || riesgo.numero || 'Sin ID'}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 500,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        fontSize: '0.8rem',
                        color: 'text.primary',
                        wordBreak: 'break-word',
                        pr: 1
                      }}>
                        {riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || 'Sin descripción'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {riesgo.tipologiaNivelI || riesgo.tipologia || '02 Operacional'}
                      </Typography>
                      
                      {/* Columna de Clasificación/Nivel de Riesgo RESIDUAL (en CONTROLES) */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {(() => {
                          // En CONTROLES, calcular la clasificación RESIDUAL del riesgo
                          // Es el MÁXIMO de las clasificaciones residuales de todas sus causas que tengan controles
                          let nivelRiesgo = riesgo.evaluacion?.nivelRiesgoResidual || riesgo.nivelRiesgoResidual || riesgo.riesgoResidual;
                          
                          // Si no hay nivel residual, calcular desde las causas con controles
                          if (!nivelRiesgo && riesgo.causas && riesgo.causas.length > 0) {
                            // Filtrar solo causas que tengan controles (tipoGestion === 'CONTROL' o 'AMBOS')
                            const causasConControles = riesgo.causas.filter((c: any) => {
                              const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                              return tipo === 'CONTROL' || tipo === 'AMBOS';
                            });
                            
                            if (causasConControles.length > 0) {
                              // Obtener las calificaciones residuales de cada causa
                              const calificacionesResiduales = causasConControles
                                .map((c: any) => {
                                  // Priorizar calificacionResidual, luego riesgoResidual, luego calcular desde frecuenciaResidual e impactoResidual
                                  if (c.calificacionResidual !== undefined && c.calificacionResidual !== null) {
                                    return Number(c.calificacionResidual);
                                  }
                                  if (c.riesgoResidual !== undefined && c.riesgoResidual !== null) {
                                    return Number(c.riesgoResidual);
                                  }
                                  // Calcular desde frecuenciaResidual e impactoResidual
                                  const frecuenciaResidual = Number(c.frecuenciaResidual || c.frecuencia || 3);
                                  const impactoResidual = Number(c.impactoResidual || c.calificacionGlobalImpacto || 1);
                                  const cal = frecuenciaResidual === 2 && impactoResidual === 2 ? 3.99 : frecuenciaResidual * impactoResidual;
                                  return cal;
                                })
                                .filter((cal: number) => !isNaN(cal) && cal > 0);
                              
                              if (calificacionesResiduales.length > 0) {
                                // Tomar el MÁXIMO (igual que en inherente)
                                const calificacionMaxResidual = Math.max(...calificacionesResiduales);
                                if (calificacionMaxResidual >= 15 && calificacionMaxResidual <= 25) nivelRiesgo = 'Crítico';
                                else if (calificacionMaxResidual >= 10 && calificacionMaxResidual <= 14) nivelRiesgo = 'Alto';
                                else if (calificacionMaxResidual >= 4 && calificacionMaxResidual <= 9) nivelRiesgo = 'Medio';
                                else if (calificacionMaxResidual >= 1 && calificacionMaxResidual <= 3) nivelRiesgo = 'Bajo';
                                else nivelRiesgo = 'Sin Calificar';
                              }
                            }
                          }
                          
                          if (!nivelRiesgo) nivelRiesgo = 'Sin Calificar';
                          
                          const nivelNormalizado = nivelRiesgo.toLowerCase();
                          let color = '#666';
                          let bgColor = '#f5f5f5';
                          
                          if (nivelNormalizado.includes('crítico') || nivelNormalizado.includes('critico')) {
                            color = '#fff';
                            bgColor = '#d32f2f';
                          } else if (nivelNormalizado.includes('alto')) {
                            color = '#fff';
                            bgColor = '#f57c00';
                          } else if (nivelNormalizado.includes('medio')) {
                            color = '#fff';
                            bgColor = '#fbc02d';
                          } else if (nivelNormalizado.includes('bajo')) {
                            color = '#fff';
                            bgColor = '#388e3c';
                          }
                          
                          return (
                            <Chip
                              label={nivelRiesgo.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: bgColor,
                                color: color,
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 24,
                                minWidth: 80
                              }}
                            />
                          );
                        })()}
                      </Box>
                      
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
                                <TableCell align="center">Efectividad</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => {
                                // Crear objeto detalle con toda la información del control
                                const detalleControl: any = {
                                  ...causa,
                                  descripcion: causa.descripcion,
                                  fuenteCausa: causa.fuenteCausa,
                                  frecuencia: causa.frecuencia,
                                  calificacionGlobalImpacto: causa.calificacionGlobalImpacto,
                                  controlDescripcion: causa.controlDescripcion || causa.gestion?.controlDescripcion,
                                  controlTipo: causa.controlTipo || causa.gestion?.controlTipo,
                                  evaluacionDefinitiva: causa.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva,
                                  puntajeTotal: causa.puntajeTotal || causa.gestion?.puntajeTotal,
                                  porcentajeMitigacion: causa.porcentajeMitigacion || causa.gestion?.porcentajeMitigacion,
                                  frecuenciaResidual: causa.frecuenciaResidual || causa.gestion?.frecuenciaResidual,
                                  impactoResidual: causa.impactoResidual || causa.gestion?.impactoResidual,
                                  riesgoResidual: causa.riesgoResidual || causa.calificacionResidual || causa.gestion?.riesgoResidual || causa.gestion?.calificacionResidual,
                                  nivelRiesgoResidual: causa.nivelRiesgoResidual || causa.gestion?.nivelRiesgoResidual,
                                  impactosResiduales: causa.impactosResiduales || causa.gestion?.impactosResiduales,
                                  tipo: causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')
                                };
                                
                                return (
                                <Fragment key={causa.id}>
                                <TableRow
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                      setItemDetalle(detalleControl);
                                      setCausaDetalleView({ riesgoId: riesgo.id, causa });
                                    setDialogDetailOpen(true);
                                  }}
                                >
                                  <TableCell sx={{ maxWidth: 250 }}>{causa.descripcion}</TableCell>
                                  <TableCell>{causa.controlDescripcion || causa.gestion?.controlDescripcion || 'Sin descripción'}</TableCell>
                                  <TableCell align="center">
                                    {causa.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva || 'Sin evaluar'}
                                  </TableCell>
                                  <TableCell align="center">
                                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                        size="small"
                                          color="primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                            const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')).toUpperCase();
                                            setTipoClasificacion(tipoGestion as any);
                                          handleEvaluarControl(riesgo.id, causa);
                                        }}
                                          title="Editar Control"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEliminarClasificacion(riesgo.id, causa, 'CONTROL');
                                        }}
                                          title="Eliminar Control"
                                      >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        {(causa.tipoGestion || '').toUpperCase() === 'AMBOS' && (
                                          <Chip 
                                            label="También en Planes" 
                                            size="small" 
                                            color="warning" 
                                            variant="outlined"
                                            sx={{ fontSize: '0.65rem', height: 20 }}
                                          />
                                        )}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                                  {evaluacionExpandida?.riesgoId === riesgo.id && evaluacionExpandida?.causaId === causa.id && (
                                    <TableRow>
                                      <TableCell colSpan={4} sx={{ p: 0 }}>
                                        <Collapse in={true}>
                                          <Box sx={{ p: 3, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                                            <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                                              Evaluar Efectividad del Control
                                            </Typography>
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

                                                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
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
                                                      </Box>
                                                    </Collapse>
                                                  )}

                                                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                                    <Button onClick={() => setEvaluacionExpandida(null)}>Cancelar</Button>
                                                    <Button variant="contained" onClick={handleGuardarEvaluacion}>Guardar Control</Button>
                                                  </Box>
                                                </>
                                              );
                                            })()}
                                          </Box>
                                        </Collapse>
                                      </TableCell>
                                    </TableRow>
                                  )}
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
                gridTemplateColumns: '45px 90px 1fr 150px 120px 50px',
                gap: 1,
                px: 2,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box />
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPlanesLista('id')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">ID RIESGO</Typography>
                  {sortPlanes.field === 'id' ? (
                    sortPlanes.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPlanesLista('descripcion')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">DESCRIPCIÓN DEL RIESGO</Typography>
                  {sortPlanes.field === 'descripcion' ? (
                    sortPlanes.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPlanesLista('tipologia')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">TIPOLOGÍA</Typography>
                  {sortPlanes.field === 'tipologia' ? (
                    sortPlanes.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                  onClick={() => handleSortPlanesLista('estado')}
                >
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" fontSize="0.7rem">ESTADO</Typography>
                  {sortPlanes.field === 'estado' ? (
                    sortPlanes.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} /> : <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )}
                </Box>
                <Box />
              </Box>

              {riesgosConPlanesOrdenados.map((riesgo: any) => {
                const estaExpandido = riesgosExpandidosResidual[riesgo.id] || false;
                return (
                  <Card key={riesgo.id} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '45px 90px 1fr 150px 120px 50px',
                        gap: 1,
                        p: 1.5,
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: 'center',
                        width: '100%'
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                          {estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem">
                        {riesgo.numeroIdentificacion || riesgo.id}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 500,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                        fontSize: '0.8rem',
                        color: 'text.primary',
                        wordBreak: 'break-word',
                        pr: 1
                      }}>
                        {riesgo.descripcionRiesgo || riesgo.descripcion || riesgo.nombre || 'Sin descripción'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {riesgo.tipologiaNivelI || riesgo.tipologia || '02 Operacional'}
                      </Typography>
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
                                <TableCell align="center">Fecha Estimada</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => {
                                const detallePlan: any = {
                                  ...causa,
                                  descripcion: causa.descripcion,
                                  fuenteCausa: causa.fuenteCausa,
                                  frecuencia: causa.frecuencia,
                                  planDescripcion: causa.planDescripcion || causa.gestion?.planDescripcion,
                                  planDetalle: causa.planDetalle || causa.gestion?.planDetalle,
                                  planResponsable: causa.planResponsable || causa.gestion?.planResponsable,
                                  planDecision: causa.planDecision || causa.gestion?.planDecision,
                                  planFechaEstimada: causa.planFechaEstimada || causa.gestion?.planFechaEstimada,
                                  planEstado: causa.planEstado || causa.gestion?.planEstado,
                                  tipo: causa.tipoGestion || 'PLAN'
                                };
                                
                                return (
                                <Fragment key={causa.id}>
                                    <TableRow
                                      sx={{ cursor: 'pointer' }}
                                      onClick={() => {
                                        setItemDetalle(detallePlan);
                                        setCausaDetalleView({ riesgoId: riesgo.id, causa });
                                        setDialogDetailOpen(true);
                                      }}
                                    >
                                    <TableCell sx={{ maxWidth: 250 }}>{causa.descripcion}</TableCell>
                                      <TableCell>{causa.planDescripcion || causa.gestion?.planDescripcion || 'Sin descripción'}</TableCell>
                                      <TableCell>{causa.planResponsable || causa.gestion?.planResponsable || 'N/A'}</TableCell>
                                      <TableCell align="center">{causa.planFechaEstimada || causa.gestion?.planFechaEstimada || 'N/A'}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                          <IconButton
                                          size="small"
                                            color="primary"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                              const tipoGestion = (causa.tipoGestion || 'PLAN').toUpperCase();
                                              setTipoClasificacion(tipoGestion as any);
                                            handleEvaluarControl(riesgo.id, causa);
                                          }}
                                            title="Editar Plan"
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                          <IconButton
                                          size="small"
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEliminarClasificacion(riesgo.id, causa, 'PLAN');
                                          }}
                                            title="Eliminar Plan"
                                        >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                          {(causa.tipoGestion || '').toUpperCase() === 'AMBOS' && (
                                            <Chip 
                                              label="También en Controles" 
                                              size="small" 
                                              color="warning" 
                                              variant="outlined"
                                              sx={{ fontSize: '0.65rem', height: 20 }}
                                            />
                                          )}
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

      {/* DIALOG DETALLE CAUSA/CONTROL (Mejorado) */}
      <Dialog open={dialogDetailOpen} onClose={() => { setDialogDetailOpen(false); setCausaDetalleView(null); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {itemDetalle && (((itemDetalle as any).tipo === 'control') || ((itemDetalle as any).tipo === 'CONTROL') || ((itemDetalle as any).tipo === 'AMBOS'))
                ? 'Detalle del Control' 
                : 'Detalle del Plan de Acción'}
            </Typography>
            {itemDetalle && (
              <Chip
                label={((itemDetalle as any).tipo === 'control') || ((itemDetalle as any).tipo === 'CONTROL') ? 'Control' : ((itemDetalle as any).tipo === 'AMBOS') ? 'Control y Plan de Acción' : 'Plan de Acción'}
                color={((itemDetalle as any).tipo === 'control') || ((itemDetalle as any).tipo === 'CONTROL') ? 'primary' : ((itemDetalle as any).tipo === 'AMBOS') ? 'secondary' : 'info'}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {itemDetalle ? (
            <Box>
              {/* Información de la Causa Original */}
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Causa Original
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {(itemDetalle as any).descripcion ?? causaDetalleView?.causa?.descripcion ?? 'Sin descripción'}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fuente</Typography>
                    <Typography variant="body2">
                      {(itemDetalle as any).fuenteCausa ?? causaDetalleView?.causa?.fuenteCausa ?? 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Frecuencia</Typography>
                    <Typography variant="body2">
                      {(itemDetalle as any).frecuencia ?? causaDetalleView?.causa?.frecuencia ?? 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Impacto Global</Typography>
                    <Typography variant="body2">
                      {(itemDetalle as any).calificacionGlobalImpacto ?? causaDetalleView?.causa?.calificacionGlobalImpacto ?? 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Información del Control */}
              {(((itemDetalle as any).tipo === 'control') || ((itemDetalle as any).tipo === 'CONTROL') || ((itemDetalle as any).tipo === 'AMBOS') || (itemDetalle as any).controlDescripcion) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Información del Control
                  </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Descripción del Control</Typography>
                      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {(itemDetalle as any).controlDescripcion || (itemDetalle as any).gestion?.controlDescripcion || causaDetalleView?.causa?.controlDescripcion || 'Sin descripción'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Tipo de Control</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).controlTipo || (itemDetalle as any).gestion?.controlTipo || causaDetalleView?.causa?.controlTipo || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Evaluación del Control
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Efectividad</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {(itemDetalle as any).evaluacionDefinitiva || (itemDetalle as any).gestion?.evaluacionDefinitiva || causaDetalleView?.causa?.evaluacionDefinitiva || 'Sin evaluar'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Puntaje Total</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {(itemDetalle as any).puntajeTotal || (itemDetalle as any).gestion?.puntajeTotal || causaDetalleView?.causa?.puntajeTotal || 'N/A'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">% Mitigación</Typography>
                        <Typography variant="body2" fontWeight={600} color="primary">
                          {(itemDetalle as any).porcentajeMitigacion !== undefined
                            ? `${((itemDetalle as any).porcentajeMitigacion * 100).toFixed(0)}%`
                            : (itemDetalle as any).gestion?.porcentajeMitigacion !== undefined
                            ? `${((itemDetalle as any).gestion.porcentajeMitigacion * 100).toFixed(0)}%`
                            : causaDetalleView?.causa?.porcentajeMitigacion !== undefined
                            ? `${(causaDetalleView.causa.porcentajeMitigacion * 100).toFixed(0)}%`
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Riesgo Residual */}
                  {((itemDetalle as any).frecuenciaResidual || (itemDetalle as any).riesgoResidual) && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffb74d' }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Riesgo Residual
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Frecuencia Residual</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {(itemDetalle as any).frecuenciaResidual || causaDetalleView?.causa?.frecuenciaResidual || 'N/A'}
                          </Typography>
              </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Impacto Residual</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {(itemDetalle as any).impactoResidual || causaDetalleView?.causa?.impactoResidual || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Calificación Residual</Typography>
                          <Typography variant="body2" fontWeight={600} color="error">
                            {(itemDetalle as any).riesgoResidual || (itemDetalle as any).calificacionResidual || causaDetalleView?.causa?.riesgoResidual || causaDetalleView?.causa?.calificacionResidual || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Nivel Residual</Typography>
                          <Chip
                            label={(itemDetalle as any).nivelRiesgoResidual || causaDetalleView?.causa?.nivelRiesgoResidual || 'N/A'}
                            size="small"
                            color={
                              ((itemDetalle as any).nivelRiesgoResidual || causaDetalleView?.causa?.nivelRiesgoResidual || '').toLowerCase().includes('crítico') || 
                              ((itemDetalle as any).nivelRiesgoResidual || causaDetalleView?.causa?.nivelRiesgoResidual || '').toLowerCase().includes('critico')
                                ? 'error'
                                : ((itemDetalle as any).nivelRiesgoResidual || causaDetalleView?.causa?.nivelRiesgoResidual || '').toLowerCase().includes('alto')
                                ? 'warning'
                                : 'default'
                            }
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Información del Plan */}
              {((itemDetalle as any).tipo === 'plan' || (itemDetalle as any).tipo === 'PLAN' || (itemDetalle as any).tipo === 'AMBOS' || (itemDetalle as any).planDescripcion) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Información del Plan de Acción
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Descripción</Typography>
                      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {(itemDetalle as any).planDescripcion || (itemDetalle as any).gestion?.planDescripcion || causaDetalleView?.causa?.planDescripcion || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Detalle</Typography>
                      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {(itemDetalle as any).planDetalle || (itemDetalle as any).gestion?.planDetalle || causaDetalleView?.causa?.planDetalle || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Responsable</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).planResponsable || (itemDetalle as any).gestion?.planResponsable || causaDetalleView?.causa?.planResponsable || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Fecha Estimada</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).planFechaEstimada || (itemDetalle as any).gestion?.planFechaEstimada || causaDetalleView?.causa?.planFechaEstimada || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Decisión</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).planDecision || (itemDetalle as any).gestion?.planDecision || causaDetalleView?.causa?.planDecision || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Estado</Typography>
                      <Chip
                        label={(itemDetalle as any).planEstado || (itemDetalle as any).gestion?.planEstado || causaDetalleView?.causa?.planEstado || 'N/A'}
                        size="small"
                        color={
                          ((itemDetalle as any).planEstado || (itemDetalle as any).gestion?.planEstado || causaDetalleView?.causa?.planEstado || '').toLowerCase() === 'completado'
                            ? 'success'
                            : ((itemDetalle as any).planEstado || (itemDetalle as any).gestion?.planEstado || causaDetalleView?.causa?.planEstado || '').toLowerCase() === 'en_progreso'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Impactos Residuales */}
              {(itemDetalle as any).impactosResiduales && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Impactos Residuales
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {Object.entries((itemDetalle as any).impactosResiduales || {}).map(([k, v]) => (
                      <Box key={k} sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{k}</Typography>
                        <Typography variant="body2" fontWeight={600}>{String(v)}</Typography>
              </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Sin detalle seleccionado.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogDetailOpen(false); setCausaDetalleView(null); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CLASIFICACION CAUSA (Existing) - Solo se abre cuando se hace clic en "Clasificar" o desde el tab CLASIFICACIÓN */}
      <Dialog 
        open={!!causaEnEdicion && !evaluacionExpandida} 
        onClose={() => setCausaEnEdicion(null)} 
        maxWidth="md" 
        fullWidth
      >
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
