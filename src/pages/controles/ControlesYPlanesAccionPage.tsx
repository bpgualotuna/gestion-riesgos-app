/**
 * Controles y Planes de Acción Page - NUEVA VERSIÓN CON 4 TABS
 * Incluye: Clasificación, Controles, Evaluación Residual (Copiada), Planes
 */

import { useState, useMemo, useEffect, Fragment, useRef } from 'react';
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
  Switch
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
  Close as CloseIcon,
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useGetRiesgosQuery, useUpdateCausaMutation, useUpdateRiesgoMutation, useGetConfiguracionResidualQuery, useGetFrecuenciasQuery, riesgosApi } from '../../api/services/riesgosApi';
import { useAppDispatch } from '../../app/hooks';
import { DIMENSIONES_IMPACTO, LABELS_IMPACTO, LABELS_PROBABILIDAD, UMBRALES_RIESGO, NIVELES_RIESGO, AUTH_TOKEN_KEY } from '../../utils/constants';
import { formatDateISO } from '../../utils/formatters';
import {
  calcularRiesgoInherente,
  calcularPuntajeControl,
  determinarEfectividadControl,
  calcularFrecuenciaResidual,
  calcularImpactoResidual,
  calcularCalificacionResidual,
  determinarEvaluacionDefinitiva,
  calcularFrecuenciaResidualAvanzada,
  calcularImpactoResidualAvanzado,
  determinarNivelRiesgo,
  resolverFrecuenciaCausaA1_5,
  type FrecuenciaCatalogItem,
} from '../../utils/calculations';
import { RiesgoFormData } from '../../types';
import { useUnsavedChanges, useFormChanges, useArrayChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';

// Helpers que usan la configuración residual del admin (API), sin datos quemados
function getEvaluacionPreliminarFromRangos(rangos: any[] | undefined, puntajeTotal: number): string {
  if (!rangos?.length) return 'Inefectivo';
  for (const r of rangos) {
    const okMin = r.incluirMinimo ? puntajeTotal >= r.valorMinimo : puntajeTotal > r.valorMinimo;
    const okMax = r.incluirMaximo ? puntajeTotal <= r.valorMaximo : puntajeTotal < r.valorMaximo;
    if (okMin && okMax) return r.nivelNombre;
  }
  return 'Inefectivo';
}
function getPorcentajeFromTabla(tabla: any[] | undefined, evaluacion: string): number {
  if (!tabla?.length) return 0;
  const t = tabla.find((x: any) => x.evaluacion === evaluacion);
  return t != null ? Number(t.porcentaje) : 0;
}
function getNivelResidualFromRangos(rangos: any[] | undefined, calificacion: number): string {
  if (!rangos?.length) return 'Sin Calificar';
  for (const r of rangos) {
    const okMin = r.incluirMinimo ? calificacion >= r.valorMinimo : calificacion > r.valorMinimo;
    const okMax = r.incluirMaximo ? calificacion <= r.valorMaximo : calificacion < r.valorMaximo;
    if (okMin && okMax) return r.nivelNombre;
  }
  return 'Sin Calificar';
}

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
  planEvidencia?: string;
  archivoSeguimiento?: string;
  archivoSeguimientoNombre?: string;
  origenPlanAccion?: 'ninguno' | 'exito' | 'fallo';
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
  // ============ LOGS DE DEBUG CRÍTICOS ============
  console.log('🔴🔴🔴 [COMPONENTE MONTADO] ControlesYPlanesAccionPageNueva - TIMESTAMP:', new Date().toISOString());
  console.log('🔴 [DEBUG] Window location:', window.location.pathname);
  
  const { procesoSeleccionado, isLoading: isLoadingProceso } = useProceso();
  const { user, esDueñoProcesos } = useAuth();
  const { showSuccess, showError } = useNotification();
  const dispatch = useAppDispatch();
  const { setScreenContext } = useCoraIAContext(); // NUEVO: Hook de CORA IA desde contexto global
  
  console.log('🔴 [DEBUG] setScreenContext disponible:', !!setScreenContext);
  console.log('🔴 [DEBUG] procesoSeleccionado:', procesoSeleccionado?.sigla || 'NO HAY');
  
  const [activeTab, setActiveTab] = useState(0);
  const [tabsFloating, setTabsFloating] = useState(false);
  // Flotar la barra de pestañas cuando hay scroll vertical en la ventana
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      setTabsFloating(y > 220);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Estados Clasificación Existente
  const [clasificaciones, setClasificaciones] = useState<ClasificacionCausa[]>([]);
  const [initialClasificaciones, setInitialClasificaciones] = useState<ClasificacionCausa[]>([]);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [causaEnEdicion, setCausaEnEdicion] = useState<{ riesgoId: string; causa: any; clasificacion?: ClasificacionCausa; } | null>(null);
  const [causaDetalleView, setCausaDetalleView] = useState<{ riesgoId: string; causa: any } | null>(null);
  const [dialogDetailOpen, setDialogDetailOpen] = useState(false);
  const [itemDetalle, setItemDetalle] = useState<ClasificacionCausa | null>(null);
  const [tipoClasificacion, setTipoClasificacion] = useState<'seleccion' | 'control' | 'plan' | 'CONTROL' | 'PLAN' | 'AMBOS'>('seleccion');
  const [formControl, setFormControl] = useState({ descripcion: '', tipo: 'prevención' as 'prevención' | 'detección' | 'corrección' });
  const [initialFormControl, setInitialFormControl] = useState({ descripcion: '', tipo: 'prevención' as 'prevención' | 'detección' | 'corrección' });
  const [formPlan, setFormPlan] = useState({ descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completado' | 'cancelado', evidencia: '', archivoSeguimiento: '', archivoSeguimientoNombre: '' });
  const [initialFormPlan, setInitialFormPlan] = useState({ descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' as 'pendiente' | 'en_progreso' | 'completado' | 'cancelado', evidencia: '', archivoSeguimiento: '', archivoSeguimientoNombre: '' });
  const [selectedArchivoSeguimiento, setSelectedArchivoSeguimiento] = useState<File | null>(null);
  const archivoSeguimientoInputRef = useRef<HTMLInputElement>(null);
  const [impactosResiduales, setImpactosResiduales] = useState({ personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 });
  const [initialImpactosResiduales, setInitialImpactosResiduales] = useState({ personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 });
  const [frecuenciaResidual, setFrecuenciaResidual] = useState(1);
  const [initialFrecuenciaResidual, setInitialFrecuenciaResidual] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar cambios en los diferentes formularios
  const hasClasificacionesChanges = useArrayChanges(initialClasificaciones, clasificaciones);
  const hasFormControlChanges = useFormChanges(initialFormControl, formControl);
  const hasFormPlanChanges = useFormChanges(initialFormPlan, formPlan);
  const hasImpactosChanges = useFormChanges(initialImpactosResiduales, impactosResiduales);
  const hasFrecuenciaChanges = initialFrecuenciaResidual !== frecuenciaResidual;

  // Combinar todos los cambios
  const hasAnyChanges = 
    hasClasificacionesChanges || 
    hasFormControlChanges || 
    hasFormPlanChanges || 
    hasImpactosChanges || 
    hasFrecuenciaChanges;

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasAnyChanges,
    message: 'Tiene cambios sin guardar en controles y planes de acción.',
    disabled: false,
  });

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
    tieneControl: true,
    origenPlanAccion: 'ninguno'
  });

  // OPTIMIZADO: Cargar riesgos con paginación razonable
  // Usar pageSize máximo permitido (100) y paginación si es necesario
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100; // Máximo permitido por el backend
  
  // OPTIMIZADO: Caché agresivo para mejor rendimiento
  const { data: riesgosApiData, isLoading: isLoadingRiesgos } = useGetRiesgosQuery(
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
    }
  );

  const [updateCausa] = useUpdateCausaMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();

  // Configuración residual desde admin (todo el cálculo usa esta config, sin datos quemados)
  const { data: configResidual } = useGetConfiguracionResidualQuery();
  const { data: frecuenciasCatalog = [] } = useGetFrecuenciasQuery();

  // Manejo de archivos de seguimiento
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const acceptedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

  const handleArchivoSeguimientoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showError('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      if (!acceptedMimeTypes.includes(file.type)) {
        showError('Formato no permitido. Use PDF, PNG, JPG o DOCX.');
        return;
      }
      setSelectedArchivoSeguimiento(file);
      setFormPlan({ ...formPlan, archivoSeguimientoNombre: file.name });
    }
    event.target.value = '';
  };

  const handleRemoveArchivoSeguimiento = () => {
    setSelectedArchivoSeguimiento(null);
    setFormPlan({ ...formPlan, archivoSeguimiento: '', archivoSeguimientoNombre: '' });
    if (archivoSeguimientoInputRef.current) {
      archivoSeguimientoInputRef.current.value = '';
    }
  };

  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    const data = ((riesgosApiData as any)?.data || []) as any[];
    
    console.log('🔵 [RIESGOS DEL PROCESO] Total riesgos:', data.length);
    console.log('🔵 [RIESGOS DEL PROCESO] Primer riesgo:', data[0]);
    
    const resultado = data.map((riesgo) => {
      const causasConRelaciones = (riesgo.causas || []).map((causa: any) => {
        console.log('🔵 [CAUSA]', {
          causaId: causa.id,
          tipoGestion: causa.tipoGestion,
          tieneControles: !!causa.controles,
          controlesLength: causa.controles?.length,
          tienePlanes: !!causa.planesAccion,
          planesLength: causa.planesAccion?.length,
          puntajeTotal: causa.puntajeTotal
        });
        
        return {
          ...causa,
          ...(causa.gestion || {})
        };
      });
      
      return {
        ...riesgo,
        causas: causasConRelaciones
      };
    });
    
    console.log('🔵 [RIESGOS DEL PROCESO] Resultado procesado:', resultado.length);
    return resultado;
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
    setInitialClasificaciones(nuevas);
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
  // Clasificar: mostrar lo que falta (sin clasificar, AMBOS incompleto, solo CONTROL → falta plan, solo PLAN → falta control).
  // No mostrar cuando ya tiene ambos (AMBOS con control+plan activos).
  const riesgosPendientes = useMemo(() => {
    return riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
        
        // Causas sin clasificar
        if (tipo === 'PENDIENTE' || !tipo) return true;
        
        // Solo CONTROL → falta plan de acción → mostrar en clasificar
        if (tipo === 'CONTROL') return true;
        
        // Solo PLAN → falta control → mostrar en clasificar
        if (tipo === 'PLAN') return true;
        
        // AMBOS incompleto (falta control o plan)
        if (tipo === 'AMBOS') {
          const estadoAmbos = c.gestion?.estadoAmbos;
          const controlActivo = estadoAmbos?.controlActivo ?? true;
          const planActivo = estadoAmbos?.planActivo ?? true;
          return !controlActivo || !planActivo;
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
  }, [riesgosDelProceso]);

  const riesgosConPlanes = useMemo(() => {
    console.log('🔍 [PLANES] Filtrando planes desde riesgosDelProceso:', riesgosDelProceso.length);
    
    const resultado = riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || '').toUpperCase();
        
        console.log('🔍 [CAUSA PLAN]', {
          causaId: c.id,
          tipoGestion: c.tipoGestion,
          tipoCalculado: tipo,
          tienePlanes: !!c.planesAccion,
          planesLength: c.planesAccion?.length
        });
        
        if (tipo === 'PLAN') return true;
        
        if (tipo === 'AMBOS') {
          const planActivo = c.gestion?.estadoAmbos?.planActivo ?? true;
          return planActivo; // ← Solo mostrar si plan está activo
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
    
    console.log('🔍 [PLANES] Resultado final:', resultado.length, 'riesgos con planes');
    return resultado;
  }, [riesgosDelProceso]);

  const riesgosConControles = useMemo(() => {
    console.log('🔍 [CONTROLES] Filtrando controles desde riesgosDelProceso:', riesgosDelProceso.length);
    
    const resultado = riesgosDelProceso.map((r: any) => ({
      ...r,
      causas: (r.causas || []).filter((c: any) => {
        const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
        
        console.log('🔍 [CAUSA]', {
          causaId: c.id,
          tipoGestion: c.tipoGestion,
          puntajeTotal: c.puntajeTotal,
          tipoCalculado: tipo,
          tieneControles: !!c.controles,
          controlesLength: c.controles?.length
        });
        
        if (tipo === 'CONTROL') return true;
        
        if (tipo === 'AMBOS') {
          const controlActivo = c.gestion?.estadoAmbos?.controlActivo ?? true;
          return controlActivo; // ← Solo mostrar si control está activo
        }
        
        return false;
      })
    })).filter((r: any) => r.causas && r.causas.length > 0);
    
    console.log('🔍 [CONTROLES] Resultado final:', resultado.length, 'riesgos con controles');
    return resultado;
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

  // NUEVO: Actualizar contexto de pantalla para CORA IA (después de todos los useMemo)
  useEffect(() => {
    console.log('🟢🟢🟢 [useEffect CONTEXTO] EJECUTANDO - TIMESTAMP:', new Date().toISOString());
    console.log('🟢 [useEffect] procesoSeleccionado:', !!procesoSeleccionado, procesoSeleccionado?.sigla);
    console.log('🟢 [useEffect] setScreenContext:', !!setScreenContext);
    console.log('🟢 [useEffect] activeTab:', activeTab);
    
    if (procesoSeleccionado && setScreenContext) {
      const screenName = activeTab === 2 ? 'planes' : activeTab === 1 ? 'controles' : 'clasificacion';
      
      console.log('🟡 [CONTEXTO] Construyendo contexto para pantalla:', screenName);
      console.log('🟡 [CONTEXTO] causaEnEdicion:', !!causaEnEdicion);
      console.log('🟡 [CONTEXTO] tipoClasificacion:', tipoClasificacion);
      
      const context: ScreenContext = {
        module: 'planes',
        screen: screenName,
        action: causaEnEdicion ? 'edit' : 'view',
        processId: procesoSeleccionado.id,
        route: window.location.pathname,
        formData: {
          activeTab,
          clasificaciones: clasificaciones.length,
          planesActivos: clasificaciones.filter(c => c.tipo === 'plan' || c.tipo === 'PLAN').length,
          controlesActivos: clasificaciones.filter(c => c.tipo === 'control' || c.tipo === 'CONTROL').length,
          // Si estamos en la pestaña de controles sin editar, enviar lista de controles visibles
          ...(screenName === 'controles' && !causaEnEdicion && riesgosConControles.length > 0 && {
            controlesVisibles: riesgosConControles.slice(0, 3).map((r: any) => ({
              riesgoId: r.numeroIdentificacion || r.numero || r.id,
              riesgoDescripcion: r.descripcion || r.descripcionRiesgo || 'Sin descripción',
              controles: (r.causas || []).slice(0, 2).map((c: any) => {
                // Intentar obtener la descripción del control de múltiples fuentes
                const desc = c.controlDescripcion || 
                            c.gestion?.controlDescripcion || 
                            c.descripcion || 
                            'Sin descripción';
                const tipo = c.controlTipo || c.gestion?.controlTipo || 'N/A';
                const efectividad = c.evaluacionPreliminar || 
                                  c.gestion?.evaluacionPreliminar || 
                                  c.efectividad || 
                                  'N/A';
                return { descripcion: desc, tipo, efectividad };
              })
            }))
          }),
          // Datos del formulario actual si está en edición
          ...(causaEnEdicion && {
            causaEnEdicion: {
              riesgoId: causaEnEdicion.riesgoId,
              causaDescripcion: causaEnEdicion.causa?.descripcion,
              tipoClasificacion,
              formControl: tipoClasificacion === 'control' || tipoClasificacion === 'CONTROL' ? formControl : undefined,
              formPlan: tipoClasificacion === 'plan' || tipoClasificacion === 'PLAN' ? formPlan : undefined,
            }
          })
        }
      };
      console.log('✅✅✅ [CORA Context] ENVIANDO CONTEXTO A CORA:', JSON.stringify(context, null, 2));
      setScreenContext(context);
    } else {
      console.log('❌ [CONTEXTO] NO SE PUEDE ACTUALIZAR - Falta:', { 
        procesoSeleccionado: !!procesoSeleccionado, 
        setScreenContext: !!setScreenContext 
      });
    }
  }, [procesoSeleccionado, activeTab, clasificaciones, causaEnEdicion, tipoClasificacion, formControl, formPlan, riesgosConControles, setScreenContext]);

  // Actualizar Riesgo en API (Residual)
  const actualizarRiesgoApi = async (riesgoId: string, updates: Partial<RiesgoFormData>) => {
    await updateRiesgo({ id: String(riesgoId), ...updates } as any).unwrap();
  };

  // Handlers Residual
  const handleToggleExpandirResidual = (id: string) => {
    setRiesgosExpandidosResidual((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEvaluarControl = (riesgoId: string, causa: any) => {
    console.log('🔵🔵🔵 [EDITAR] handleEvaluarControl llamado');
    console.log('🔵 [EDITAR] riesgoId:', riesgoId);
    console.log('🔵 [EDITAR] causa:', causa);
    
    setRiesgoIdEvaluacion(riesgoId);
    setCausaIdEvaluacion(causa.id);

    // Fuente principal de datos guardados: gestion (backend guarda ahí todo lo del control/plan)
    const gestion = causa.gestion || {};
    const fuenteControl = gestion && Object.keys(gestion).length > 0 ? gestion : causa;

    console.log('[DEBUG] gestion:', gestion); // DEBUG
    console.log('[DEBUG] fuenteControl:', fuenteControl); // DEBUG

    // Initial load for Plan si ya existe (en causa o en gestion)
    const tienePlan =
      causa.planDescripcion ||
      gestion.planDescripcion ||
      (causa.tipoGestion && causa.tipoGestion.toUpperCase() === 'PLAN') ||
      (gestion.tipo === 'plan' || gestion.tipo === 'PLAN');

    console.log('[DEBUG] tienePlan:', tienePlan); // DEBUG

    if (tienePlan) {
      const planData = {
        descripcion: causa.planDescripcion || gestion.planDescripcion || '',
        detalle: causa.planDetalle || gestion.planDetalle || '',
        responsable:
          causa.planResponsable ||
          gestion.planResponsable ||
          (user as any)?.fullName ||
          '',
        decision: causa.planDecision || gestion.planDecision || '',
        fechaEstimada: causa.planFechaEstimada || gestion.planFechaEstimada || '',
        estado: causa.planEstado || gestion.planEstado || 'pendiente',
        evidencia: causa.planEvidencia || gestion.planEvidencia || '',
        archivoSeguimiento: causa.archivoSeguimiento || gestion.archivoSeguimiento || '',
        archivoSeguimientoNombre: causa.archivoSeguimientoNombre || gestion.archivoSeguimientoNombre || '',
      };
      console.log('[DEBUG] Cargando plan con datos:', planData); // DEBUG
      setFormPlan(planData);
      setInitialFormPlan(planData); // NUEVO: También actualizar el initial para el tracking de cambios
    } else {
      const emptyPlan = {
        descripcion: '',
        detalle: '',
        responsable: (user as any)?.fullName || '',
        decision: '',
        fechaEstimada: '',
        estado: 'pendiente' as const,
        evidencia: '',
        archivoSeguimiento: '',
        archivoSeguimientoNombre: '',
      };
      console.log('[DEBUG] No hay plan, usando valores vacíos'); // DEBUG
      setFormPlan(emptyPlan);
      setInitialFormPlan(emptyPlan);
    }

    // Cargar criterios del control si ya hubo evaluación previa
    if (fuenteControl.puntajeTotal !== undefined) {
      setCriteriosEvaluacion({
        aplicabilidad: fuenteControl.aplicabilidad || '',
        puntajeAplicabilidad: fuenteControl.puntajeAplicabilidad || 0,
        cobertura: fuenteControl.cobertura || '',
        puntajeCobertura: fuenteControl.puntajeCobertura || 0,
        facilidadUso: fuenteControl.facilidadUso || '',
        puntajeFacilidad: fuenteControl.puntajeFacilidad || 0,
        segregacion: fuenteControl.segregacion || '',
        puntajeSegregacion: fuenteControl.puntajeSegregacion || 0,
        naturaleza: fuenteControl.naturaleza || '',
        puntajeNaturaleza: fuenteControl.puntajeNaturaleza || 0,
        // En versiones nuevas se guarda como controlDesviaciones, en otras como desviaciones
        desviaciones: fuenteControl.desviaciones || fuenteControl.controlDesviaciones || 'A',
        tipoMitigacion: fuenteControl.tipoMitigacion || 'AMBAS',
        recomendacion: fuenteControl.recomendacion || '',
        descripcionControl: fuenteControl.controlDescripcion || '',
        responsable:
          fuenteControl.controlResponsable ||
          fuenteControl.responsable ||
          (user as any)?.fullName ||
          '',
        tieneControl:
          fuenteControl.tieneControl !== undefined ? fuenteControl.tieneControl : true,
        origenPlanAccion: fuenteControl.origenPlanAccion || 'ninguno',
      });
    } else {
      // Valores por defecto cuando aún no hay evaluación
      setCriteriosEvaluacion({
        aplicabilidad: '',
        puntajeAplicabilidad: 0,
        cobertura: '',
        puntajeCobertura: 0,
        facilidadUso: '',
        puntajeFacilidad: 0,
        segregacion: '',
        puntajeSegregacion: 0,
        naturaleza: '',
        puntajeNaturaleza: 0,
        desviaciones: 'A',
        tipoMitigacion: 'AMBAS',
        recomendacion: '',
        descripcionControl: '',
        responsable: (user as any)?.fullName || '',
        tieneControl: true,
        origenPlanAccion: 'ninguno',
      });
    }

    setEvaluacionExpandida({ riesgoId, causaId: causa.id });
    setDialogEvaluacionOpen(false); // Asegurar que el diálogo modal no interfiera
  };

  // Handlers Clasificación
  const handleAbrirClasificacion = (riesgoId: string, causa: any) => {
    const clasificacionExistente = clasificaciones.find(c => c.causaId === causa.id && c.riesgoId === riesgoId);
    setCausaEnEdicion({ riesgoId, causa, clasificacion: clasificacionExistente });
    if (clasificacionExistente) {
      setTipoClasificacion(clasificacionExistente.tipo);
      if (clasificacionExistente.tipo === 'control') {
        const fc = { descripcion: clasificacionExistente.controlDescripcion || '', tipo: clasificacionExistente.controlTipo || 'prevención' };
        const ir = clasificacionExistente.impactosResiduales || { personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 };
        const fr = clasificacionExistente.frecuenciaResidual || 1;
        setFormControl(fc);
        setInitialFormControl(fc);
        setImpactosResiduales(ir);
        setInitialImpactosResiduales(ir);
        setFrecuenciaResidual(fr);
        setInitialFrecuenciaResidual(fr);
        setFormPlan(initialFormPlan);
        setInitialFormPlan(initialFormPlan);
      } else if (clasificacionExistente.tipo === 'plan') {
        const fp = { descripcion: clasificacionExistente.planDescripcion || '', detalle: clasificacionExistente.planDetalle || '', responsable: clasificacionExistente.planResponsable || '', decision: clasificacionExistente.planDecision || '', fechaEstimada: clasificacionExistente.planFechaEstimada || '', estado: clasificacionExistente.planEstado || 'pendiente', evidencia: clasificacionExistente.planEvidencia || '' };
        setFormPlan(fp);
        setInitialFormPlan(fp);
        setFormControl(initialFormControl);
        setInitialFormControl(initialFormControl);
        setImpactosResiduales(initialImpactosResiduales);
        setInitialImpactosResiduales(initialImpactosResiduales);
        setFrecuenciaResidual(initialFrecuenciaResidual);
        setInitialFrecuenciaResidual(initialFrecuenciaResidual);
      } else {
        setFormControl(initialFormControl);
        setFormPlan(initialFormPlan);
        setImpactosResiduales(initialImpactosResiduales);
        setFrecuenciaResidual(initialFrecuenciaResidual);
      }
    } else {
      setTipoClasificacion('seleccion');
      const emptyControl = { descripcion: '', tipo: 'prevención' as const };
      const emptyPlan = { descripcion: '', detalle: '', responsable: (user as any)?.fullName || '', decision: '', fechaEstimada: '', estado: 'pendiente' as const, evidencia: '' };
      const emptyImpactos = { personas: 1, legal: 1, ambiental: 1, procesos: 1, reputacion: 1, economico: 1 };
      setFormControl(emptyControl);
      setInitialFormControl(emptyControl);
      setFormPlan(emptyPlan);
      setInitialFormPlan(emptyPlan);
      setImpactosResiduales(emptyImpactos);
      setInitialImpactosResiduales(emptyImpactos);
      setFrecuenciaResidual(1);
      setInitialFrecuenciaResidual(1);
    }
  };

  const handleGuardarClasificacion = async () => {
    if (!causaEnEdicion) return;
    const { riesgoId, causa, clasificacion } = causaEnEdicion;
    
    // Subir archivo si hay uno seleccionado
    let archivoUrl = formPlan.archivoSeguimiento;
    if (selectedArchivoSeguimiento && tipoClasificacion === 'plan') {
      try {
        const formData = new FormData();
        formData.append('archivo', selectedArchivoSeguimiento);
        
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE_URL}/upload/archivo`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!response.ok) {
          throw new Error('Error al subir el archivo');
        }
        
        const data = await response.json();
        archivoUrl = data.url;
        showSuccess('Archivo subido correctamente');
      } catch (error) {
        showError('Error al subir el archivo');
        return;
      }
    }
    
    // ... Validations simplified for brevity ...
    const nuevaClasificacion: ClasificacionCausa = {
      id: clasificacion?.id || `clas-${Date.now()}-${causa.id}`,
      causaId: causa.id,
      riesgoId,
      tipo: tipoClasificacion as any,
      // Datos de control (modo simple)
      controlDescripcion: tipoClasificacion === 'control' ? formControl.descripcion : undefined,
      controlTipo: tipoClasificacion === 'control' ? formControl.tipo : undefined,
      impactosResiduales: tipoClasificacion === 'control' ? impactosResiduales : undefined,
      frecuenciaResidual: tipoClasificacion === 'control' ? frecuenciaResidual : undefined,
      // Datos de plan (incluye decisión del riesgo)
      planDescripcion: tipoClasificacion === 'plan' ? formPlan.descripcion : undefined,
      planDetalle: tipoClasificacion === 'plan' ? formPlan.detalle : undefined,
      planResponsable: tipoClasificacion === 'plan' ? formPlan.responsable : undefined,
      planDecision: tipoClasificacion === 'plan' ? formPlan.decision : undefined,
      planFechaEstimada: tipoClasificacion === 'plan' ? formPlan.fechaEstimada : undefined,
      planEstado: tipoClasificacion === 'plan' ? formPlan.estado : undefined,
      planEvidencia: tipoClasificacion === 'plan' ? formPlan.evidencia : undefined,
      archivoSeguimiento: tipoClasificacion === 'plan' ? archivoUrl : undefined,
      archivoSeguimientoNombre: tipoClasificacion === 'plan' ? (selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre) : undefined,
      procesoId: String(procesoSeleccionado!.id),
      createdAt: clasificacion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (clasificacion) setClasificaciones(clasificaciones.map(c => c.id === clasificacion.id ? nuevaClasificacion : c));
    else setClasificaciones([...clasificaciones, nuevaClasificacion]);
    try {
      const payloadClasificacion = {
        id: causa.id,
        tipoGestion: tipoClasificacion.toUpperCase(),
        gestion: {
          ...nuevaClasificacion,
          tipoGestion: tipoClasificacion.toUpperCase(),
          archivoSeguimiento: archivoUrl,
          archivoSeguimientoNombre: selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre
        }
      };
      await updateCausa(payloadClasificacion).unwrap();
      showSuccess('Causa clasificada correctamente');
      setCausaEnEdicion(null);
      setSelectedArchivoSeguimiento(null);
      if (archivoSeguimientoInputRef.current) {
        archivoSeguimientoInputRef.current.value = '';
      }
    } catch (e: any) {
      showError(e?.data?.error || e?.message || 'Error al guardar clasificación');
    }
  };

  /**
   * Guarda o actualiza un control en la tabla ControlRiesgo
   */
  const guardarControlEnTabla = async (
    causaId: number,
    controlData: any,
    controlExistente?: any
  ) => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    // Mapear desviaciones de letra a número
    const desviacionesNumero = 
      controlData.desviaciones === 'A' ? 100 :
      controlData.desviaciones === 'B' ? 75 :
      controlData.desviaciones === 'C' ? 50 :
      controlData.desviaciones === 'D' ? 25 : 100;

    const payload = {
      descripcion: controlData.descripcionControl || '',
      tipoControl: 'PREVENTIVO',
      responsable: controlData.responsable,
      aplicabilidad: controlData.puntajeAplicabilidad || 0,
      cobertura: controlData.puntajeCobertura || 0,
      facilidadUso: controlData.puntajeFacilidad || 0,
      segregacion: controlData.puntajeSegregacion || 0,
      naturaleza: controlData.puntajeNaturaleza || 0,
      desviaciones: desviacionesNumero,
      puntajeControl: controlData.puntajeTotal || 0,
      evaluacionPreliminar: controlData.evaluacionPreliminar,
      evaluacionDefinitiva: controlData.evaluacionDefinitiva,
      estandarizacionPorcentajeMitigacion: Math.round((controlData.porcentajeMitigacion || 0) * 100),
      disminuyeFrecuenciaImpactoAmbas: controlData.tipoMitigacion,
      descripcionControl: controlData.descripcionControl,
      recomendacion: controlData.recomendacion || '',
      tipoMitigacion: controlData.tipoMitigacion,
      estadoAmbos: controlData.estadoAmbos
    };

    try {
      if (controlExistente) {
        // Actualizar control existente
        const response = await fetch(`${API_BASE_URL}/controles-riesgo/${controlExistente.id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar control');
        }

        return await response.json();
      } else {
        // Crear nuevo control
        const response = await fetch(`${API_BASE_URL}/controles-riesgo/causa/${causaId}`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear control');
        }

        return await response.json();
      }
    } catch (error) {
      console.error('Error guardando control:', error);
      throw error;
    }
  };

  /**
   * Guarda o actualiza un plan de acción en la tabla PlanAccion
   */
  const guardarPlanEnTabla = async (
    causaId: number,
    planData: any,
    planExistente?: any
  ) => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const payload = {
      causaRiesgoId: causaId,
      descripcion: planData.descripcion || '',
      responsable: planData.responsable,
      fechaInicio: null,
      fechaFin: planData.fechaEstimada || null,
      estado: planData.estado || 'pendiente',
      observaciones: planData.detalle || '',
      tipoGestion: 'PLAN'
    };

    try {
      if (planExistente) {
        // Actualizar plan existente
        const response = await fetch(`${API_BASE_URL}/planes-accion/${planExistente.id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar plan');
        }

        return await response.json();
      } else {
        // Crear nuevo plan
        const response = await fetch(`${API_BASE_URL}/planes-accion/riesgo/${causaId}`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear plan');
        }

        return await response.json();
      }
    } catch (error) {
      console.error('Error guardando plan:', error);
      throw error;
    }
  };

  const getRiesgoNombre = (riesgoId: string) => {
    const r = riesgosDelProceso.find((r: any) => r.id === riesgoId);
    return r?.nombre || r?.descripcionRiesgo || riesgoId;
  };
  const handleGuardarEvaluacion = async () => {
    const riesgo = riesgosDelProceso.find((r: any) => r.id === riesgoIdEvaluacion);
    if (!riesgo || !causaIdEvaluacion) return;

    // Subir archivo si hay uno seleccionado
    let archivoUrl = formPlan.archivoSeguimiento;
    if (selectedArchivoSeguimiento && (tipoClasificacion === 'PLAN' || tipoClasificacion === 'plan' || tipoClasificacion === 'AMBOS')) {
      try {
        const formData = new FormData();
        formData.append('archivo', selectedArchivoSeguimiento);
        
        const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
        const response = await fetch(`${API_BASE_URL}/upload/archivo`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        if (!response.ok) {
          throw new Error('Error al subir el archivo');
        }
        
        const data = await response.json();
        archivoUrl = data.url;
        // Actualizar formPlan con la URL del archivo
        setFormPlan({ ...formPlan, archivoSeguimiento: archivoUrl, archivoSeguimientoNombre: selectedArchivoSeguimiento.name });
        showSuccess('Archivo subido correctamente');
      } catch (error) {
        showError('Error al subir el archivo');
        return;
      }
    }

    let causaActualizada: any = null;
    const causasUpd = riesgo.causas.map((c: any) => {
      if (c.id === causaIdEvaluacion) {
        const tipoActual = (c.tipoGestion || '').toUpperCase();
        // Misma base que el panel azul: frecuencia e impacto inherentes del riesgo/causa
        const freqFromCausa = resolverFrecuenciaCausaA1_5(
          c.frecuencia as string | number | null | undefined,
          (frecuenciasCatalog as FrecuenciaCatalogItem[]) || [],
        );
        const inherentProb = freqFromCausa ?? riesgo.evaluacion?.probabilidad ?? 1;
        const impactoEval =
          riesgo.evaluacion?.impactoGlobal != null
            ? Number(riesgo.evaluacion.impactoGlobal)
            : riesgo.evaluacion?.impactoMaximo;
        const inherentImp = Math.max(
          1,
          Math.min(5, Math.round(impactoEval as number) || 1),
        );

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
              prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
              def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
              mit = getPorcentajeFromTabla(configResidual?.tablaMitigacion, def);
            }

            const fRes = calcularFrecuenciaResidualAvanzada(
              inherentProb,
              inherentImp,
              mit,
              criteriosEvaluacion.tipoMitigacion,
              def,
              (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                configResidual.porcentajeReduccionDimensionCruzada <= 1)
                ? configResidual.porcentajeReduccionDimensionCruzada
                : 0.34,
            );
            const iRes = calcularImpactoResidualAvanzado(
              inherentImp,
              inherentProb,
              mit,
              criteriosEvaluacion.tipoMitigacion,
              def,
              (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                configResidual.porcentajeReduccionDimensionCruzada <= 1)
                ? configResidual.porcentajeReduccionDimensionCruzada
                : 0.34,
            );
            const calRes =
              fRes === 2 && iRes === 2 ? 3.99 : calcularCalificacionResidual(fRes, iRes);
            const nivelResidualCausa = getNivelResidualFromRangos(
              configResidual?.rangosNivelRiesgo,
              calRes,
            );

            causaActualizada = {
              ...c,
              ...criteriosEvaluacion,
              controlDesviaciones: criteriosEvaluacion.desviaciones,
              controlDescripcion: criteriosEvaluacion.descripcionControl,
              controlResponsable: criteriosEvaluacion.responsable,
              tieneControl: criteriosEvaluacion.tieneControl,
              tipoGestion: 'AMBOS',
              puntajeTotal: pt,
              evaluacionPreliminar: prel,
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
              planEvidencia: formPlan.evidencia,
              archivoSeguimiento: archivoUrl,
              archivoSeguimientoNombre: selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre,
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
              prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
              def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
              mit = getPorcentajeFromTabla(configResidual?.tablaMitigacion, def);
            }

            const fRes = calcularFrecuenciaResidualAvanzada(
              inherentProb,
              inherentImp,
              mit,
              criteriosEvaluacion.tipoMitigacion,
              def,
              (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                configResidual.porcentajeReduccionDimensionCruzada <= 1)
                ? configResidual.porcentajeReduccionDimensionCruzada
                : 0.34,
            );
            const iRes = calcularImpactoResidualAvanzado(
              inherentImp,
              inherentProb,
              mit,
              criteriosEvaluacion.tipoMitigacion,
              def,
              (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                configResidual.porcentajeReduccionDimensionCruzada <= 1)
                ? configResidual.porcentajeReduccionDimensionCruzada
                : 0.34,
            );
            const calRes =
              fRes === 2 && iRes === 2 ? 3.99 : calcularCalificacionResidual(fRes, iRes);
            const nivelResidualCausa = getNivelResidualFromRangos(
              configResidual?.rangosNivelRiesgo,
              calRes,
            );

            causaActualizada = {
              ...c,
              ...criteriosEvaluacion,
              controlDesviaciones: criteriosEvaluacion.desviaciones,
              controlDescripcion: criteriosEvaluacion.descripcionControl,
              controlResponsable: criteriosEvaluacion.responsable,
              origenPlanAccion: criteriosEvaluacion.origenPlanAccion,
              tieneControl: criteriosEvaluacion.tieneControl,
              tipoGestion: 'AMBOS', // ← Mantener AMBOS
              puntajeTotal: pt,
              evaluacionPreliminar: prel,
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
              planEvidencia: c.planEvidencia,
              archivoSeguimiento: c.archivoSeguimiento,
              archivoSeguimientoNombre: c.archivoSeguimientoNombre,
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
              planEvidencia: formPlan.evidencia,
              archivoSeguimiento: archivoUrl,
              archivoSeguimientoNombre: selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre,
              // ← PRESERVAR datos del control existente
              ...criteriosEvaluacion,
              controlDesviaciones: c.controlDesviaciones,
              controlDescripcion: c.controlDescripcion,
              controlResponsable: c.controlResponsable,
              origenPlanAccion: c.origenPlanAccion,
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
            prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
            def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
            mit = getPorcentajeFromTabla(configResidual?.tablaMitigacion, def);
          } else {
            pt = 0;
            prel = 'Inefectivo';
            def = 'Inefectivo';
            mit = 0;
          }

          const fRes = calcularFrecuenciaResidualAvanzada(inherentProb, inherentImp, mit, criteriosEvaluacion.tipoMitigacion, def, (configResidual?.porcentajeReduccionDimensionCruzada != null && configResidual.porcentajeReduccionDimensionCruzada >= 0 && configResidual.porcentajeReduccionDimensionCruzada <= 1) ? configResidual.porcentajeReduccionDimensionCruzada : 0.34);
          const iRes = calcularImpactoResidualAvanzado(inherentImp, inherentProb, mit, criteriosEvaluacion.tipoMitigacion, def, (configResidual?.porcentajeReduccionDimensionCruzada != null && configResidual.porcentajeReduccionDimensionCruzada >= 0 && configResidual.porcentajeReduccionDimensionCruzada <= 1) ? configResidual.porcentajeReduccionDimensionCruzada : 0.34);
          const calRes = (fRes === 2 && iRes === 2) ? 3.99 : calcularCalificacionResidual(fRes, iRes);
          const nivelResidualCausa = getNivelResidualFromRangos(configResidual?.rangosNivelRiesgo, calRes);

          causaActualizada = {
            ...c, ...criteriosEvaluacion,
            controlDesviaciones: criteriosEvaluacion.desviaciones,
            controlDescripcion: criteriosEvaluacion.descripcionControl,
            controlResponsable: criteriosEvaluacion.responsable,
            origenPlanAccion: criteriosEvaluacion.origenPlanAccion,
            tieneControl: criteriosEvaluacion.tieneControl,
            tipoGestion: tipoClasificacion === 'AMBOS' ? 'AMBOS' : 'CONTROL',
            puntajeTotal: pt, evaluacionPreliminar: prel, evaluacionDefinitiva: def, porcentajeMitigacion: mit,
            frecuenciaResidual: fRes, impactoResidual: iRes,
            calificacionResidual: calRes,
            nivelRiesgoResidual: nivelResidualCausa,
            ...(tipoClasificacion === 'AMBOS' && {
              planDescripcion: formPlan.descripcion,
              planDetalle: formPlan.detalle,
              planResponsable: formPlan.responsable,
              planFechaEstimada: formPlan.fechaEstimada,
              planEstado: formPlan.estado,
              planEvidencia: formPlan.evidencia,
              archivoSeguimiento: archivoUrl,
              archivoSeguimientoNombre: selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre,
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
            planEvidencia: formPlan.evidencia,
            archivoSeguimiento: archivoUrl,
            archivoSeguimientoNombre: selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre,
            puntajeTotal: undefined,
            porcentajeMitigacion: 0
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

      // NUEVO: Guardar en tablas normalizadas (ControlRiesgo y PlanAccion)
      if (causaActualizada) {
        try {
          // Guardar control si aplica
          if (tipoClasificacion === 'CONTROL' || tipoClasificacion === 'AMBOS') {
            const controlExistente = causaActualizada.controles?.[0];
            
            const controlData = {
              descripcionControl: criteriosEvaluacion.descripcionControl,
              responsable: criteriosEvaluacion.responsable,
              puntajeAplicabilidad: criteriosEvaluacion.puntajeAplicabilidad,
              puntajeCobertura: criteriosEvaluacion.puntajeCobertura,
              puntajeFacilidad: criteriosEvaluacion.puntajeFacilidad,
              puntajeSegregacion: criteriosEvaluacion.puntajeSegregacion,
              puntajeNaturaleza: criteriosEvaluacion.puntajeNaturaleza,
              desviaciones: criteriosEvaluacion.desviaciones,
              puntajeTotal: causaActualizada.puntajeTotal,
              evaluacionPreliminar: causaActualizada.evaluacionPreliminar || 'Inefectivo',
              evaluacionDefinitiva: causaActualizada.evaluacionDefinitiva,
              porcentajeMitigacion: causaActualizada.porcentajeMitigacion,
              tipoMitigacion: criteriosEvaluacion.tipoMitigacion,
              recomendacion: criteriosEvaluacion.recomendacion,
              estadoAmbos: tipoClasificacion === 'AMBOS' ? 'ACTIVO' : null
            };

            await guardarControlEnTabla(causaIdEvaluacion, controlData, controlExistente);
            console.log('✅ Control guardado en ControlRiesgo');
          }

          // Guardar plan si aplica
          if (tipoClasificacion === 'PLAN' || tipoClasificacion === 'AMBOS') {
            const planExistente = causaActualizada.planesAccion?.[0];
            
            const planData = {
              descripcion: formPlan.descripcion,
              responsable: formPlan.responsable,
              fechaEstimada: formPlan.fechaEstimada,
              estado: formPlan.estado,
              detalle: formPlan.detalle
            };

            await guardarPlanEnTabla(causaIdEvaluacion, planData, planExistente);
            console.log('✅ Plan guardado en PlanAccion');
          }
        } catch (error) {
          console.error('❌ Error guardando en tablas normalizadas:', error);
          showError('Error al guardar: ' + (error as Error).message);
          return; // No continuar si falla el guardado
        }
      }

      try {
        if (causaActualizada) {
          const payloadEvaluacion = {
            id: causaActualizada.id,
            tipoGestion: causaActualizada.tipoGestion,
            gestion: causaActualizada
          };
          await updateCausa(payloadEvaluacion).unwrap();
        }

        await actualizarRiesgoApi(riesgoIdEvaluacion, {
          causas: causasUpd,
          evaluacion: {
            riesgoResidual: maxRiesgoResidual,
            probabilidadResidual: mejorProbRes,
            impactoResidual: mejorImpRes,
            nivelRiesgoResidual: nivelRiesgoResidual
          }
        } as any);

        dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion']));
        setEvaluacionExpandida(null);
        setSelectedArchivoSeguimiento(null);
        if (archivoSeguimientoInputRef.current) {
          archivoSeguimientoInputRef.current.value = '';
        }
        showSuccess('Gestión guardada exitosamente y Riesgo Residual Actualizado');
      } catch (e: any) {
        showError(e?.data?.error || e?.message || 'Error al guardar clasificación');
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
      
      // NUEVO: Eliminar de tablas normalizadas primero
      const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      if (tipoActual === 'AMBOS') {
        // Calcular el nuevo estado después de eliminar
        const gestionActual = causa.gestion || {};
        const estadoAmbosActual = gestionActual.estadoAmbos || { controlActivo: true, planActivo: true };
        
        const nuevoEstadoAmbos = {
          controlActivo: contexto === 'CONTROL' ? false : estadoAmbosActual.controlActivo,
          planActivo: contexto === 'PLAN' ? false : estadoAmbosActual.planActivo
        };
        
        // NUEVO: Eliminar de tabla normalizada
        if (contexto === 'CONTROL' && causa.controles?.[0]?.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/controles-riesgo/${causa.controles[0].id}`, {
              method: 'DELETE',
              headers,
              credentials: 'include'
            });
            if (!response.ok) {
              console.error('Error al eliminar control de tabla ControlRiesgo');
            }
          } catch (error) {
            console.error('Error al eliminar control:', error);
          }
        } else if (contexto === 'PLAN' && causa.planesAccion?.[0]?.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/planes-accion/${causa.planesAccion[0].id}`, {
              method: 'DELETE',
              headers,
              credentials: 'include'
            });
            if (!response.ok) {
              console.error('Error al eliminar plan de tabla PlanAccion');
            }
          } catch (error) {
            console.error('Error al eliminar plan:', error);
          }
        }
        
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
          
          // Invalidar caché para refrescar datos
          dispatch(riesgosApi.util.invalidateTags(['Riesgos']));
          
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
            planFechaEstimada: causa.planFechaEstimada,
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
          
          // Invalidar caché para refrescar datos
          dispatch(riesgosApi.util.invalidateTags(['Riesgos']));
          
          showSuccess(
            contexto === 'CONTROL' 
              ? 'Control eliminado. Puede re-agregarlo desde Clasificación.'
              : 'Plan de Acción eliminado. Puede re-agregarlo desde Clasificación.'
          );
        }
      } else {
        // Si NO es AMBOS, eliminar completamente la clasificación
        
        // NUEVO: Eliminar de tabla normalizada
        if (contexto === 'CONTROL' && causa.controles?.[0]?.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/controles-riesgo/${causa.controles[0].id}`, {
              method: 'DELETE',
              headers,
              credentials: 'include'
            });
            if (!response.ok) {
              console.error('Error al eliminar control de tabla ControlRiesgo');
            }
          } catch (error) {
            console.error('Error al eliminar control:', error);
          }
        } else if (contexto === 'PLAN' && causa.planesAccion?.[0]?.id) {
          try {
            const response = await fetch(`${API_BASE_URL}/planes-accion/${causa.planesAccion[0].id}`, {
              method: 'DELETE',
              headers,
              credentials: 'include'
            });
            if (!response.ok) {
              console.error('Error al eliminar plan de tabla PlanAccion');
            }
          } catch (error) {
            console.error('Error al eliminar plan:', error);
          }
        }
        
        await updateCausa({
          id: causa.id,
          tipoGestion: null,
          gestion: null
        }).unwrap();
        
        // Invalidar caché para refrescar datos
        dispatch(riesgosApi.util.invalidateTags(['Riesgos']));
        
        showSuccess('Clasificación eliminada. La causa volverá a aparecer en Clasificación.');
      }
    } catch {
      showError('Error al eliminar clasificación');
    }
  };

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    // Guardar cualquier formulario abierto
    if (causaEnEdicion) {
      await handleGuardarClasificacion();
    }
    
    // Actualizar estados iniciales
    setInitialClasificaciones(clasificaciones);
    setInitialFormControl(formControl);
    setInitialFormPlan(formPlan);
    setInitialImpactosResiduales(impactosResiduales);
    setInitialFrecuenciaResidual(frecuenciaResidual);
    
    markAsSaved();
    if (!isSaving) {
      forceNavigate();
    }
  };

  const handleDiscardChanges = () => {
    // Revertir todos los cambios
    setClasificaciones(initialClasificaciones);
    setFormControl(initialFormControl);
    setFormPlan(initialFormPlan);
    setImpactosResiduales(initialImpactosResiduales);
    setFrecuenciaResidual(initialFrecuenciaResidual);
    setCausaEnEdicion(null);
    forceNavigate();
  };

  if (isLoadingProceso) {
    return (
      <AppPageLayout
        title="Controles y Planes de Acción"
        description="Gestionar controles y planes asociados a los riesgos identificados."
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout
        title="Controles y Planes de Acción"
        description="Gestionar controles y planes asociados a los riesgos identificados."
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
            <Typography variant="body1">
              No hay un proceso seleccionado. Por favor seleccione un proceso de la lista en la parte superior para cargar sus controles y planes de acción.
            </Typography>
          </Alert>
        </Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en controles y planes de acción."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Controles y Planes de Acción"
      description="Gestionar controles y planes asociados a los riesgos identificados."
      topContent={<FiltroProcesoSupervisor />}
    >
      {/* Barra de pestañas: en su sitio; al hacer scroll flota arriba (fixed) */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        {/* En flujo: se oculta cuando la barra flotante está activa para no duplicar */}
        <Box
          sx={{
            visibility: tabsFloating ? 'hidden' : 'visible',
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minHeight: { xs: 60, md: 48 },
                fontSize: { xs: '0.8rem', md: 'inherit' }
              }
            }}
          >
            <Tab icon={<FactCheckIcon />} label="CLASIFICACIÓN" iconPosition="start" sx={{ fontWeight: 600 }} />
            <Tab icon={<ShieldIcon />} label="CONTROLES" iconPosition="start" sx={{ fontWeight: 600, color: '#2e7d32', '&.Mui-selected': { color: '#1b5e20' } }} />
            <Tab icon={<AssignmentIcon />} label="PLANES DE ACCIÓN" iconPosition="start" sx={{ fontWeight: 600, color: '#1976d2', '&.Mui-selected': { color: '#0d47a1' } }} />
          </Tabs>
        </Box>
        {/* Barra flotante: visible solo cuando hiciste scroll */}
        {tabsFloating && (
          <Box
            sx={{
              position: 'fixed',
              top: { xs: 96, sm: 100, md: 70 },
              left: { xs: 0, md: 280 },
              right: 0,
              zIndex: 1100,
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 60, md: 48 },
                  fontSize: { xs: '0.8rem', md: 'inherit' }
                }
              }}
            >
              <Tab icon={<FactCheckIcon />} label="CLASIFICACIÓN" iconPosition="start" sx={{ fontWeight: 600 }} />
              <Tab icon={<ShieldIcon />} label="CONTROLES" iconPosition="start" sx={{ fontWeight: 600, color: '#2e7d32', '&.Mui-selected': { color: '#1b5e20' } }} />
              <Tab icon={<AssignmentIcon />} label="PLANES DE ACCIÓN" iconPosition="start" sx={{ fontWeight: 600, color: '#1976d2', '&.Mui-selected': { color: '#0d47a1' } }} />
            </Tabs>
          </Box>
        )}
      </Box>

      <Box sx={{ pt: 2 }}>
      {/* TAB 0: CLASIFICACIÓN Y GESTIÓN */}
      <TabPanel value={activeTab} index={0}>
        <Box>
          {isLoadingRiesgos ? (
            <PageLoadingSkeleton variant="table" tableRows={6} />
          ) : riesgosPendientes.length === 0 ? (
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
              <Box
                sx={{
                  display: { xs: 'none', md: 'grid' },
                  gridTemplateColumns: '48px 100px 1.5fr 200px 120px 120px 48px',
                  gap: 2,
                  px: 3,
                  py: 1.5,
                  mb: 1,
                  bgcolor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 15,
                }}
              >
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
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">FALTA</Typography>
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
                  <Card key={riesgo.id} sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '48px 100px 1.5fr 200px 120px 120px 48px' },
                        gap: { xs: 1, md: 2 },
                        px: { xs: 2, md: 3 },
                        py: { xs: 2, md: 1.5 },
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                        alignItems: { xs: 'flex-start', md: 'center' },
                        minHeight: 64,
                        position: 'relative',
                      }}
                      onClick={() => handleToggleExpandirResidual(riesgo.id)}
                    >
                      <IconButton size="small" color="primary">
                        {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>

                      <Typography variant="subtitle2" fontWeight={700} color="primary">
                        {riesgo.numeroIdentificacion || riesgo.id}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          lineHeight: 1.4,
                          py: 0.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {riesgo.descripcionRiesgo ||
                          riesgo.descripcion ||
                          riesgo.nombre ||
                          'Sin descripción'}
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
                                <TableCell align="center">Falta</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {riesgo.causas.map((causa: any) => {
                                const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PENDIENTE')).toUpperCase();
                                
                                // Mostrar: pendientes, solo CONTROL (falta plan), solo PLAN (falta control), AMBOS incompletos
                                if (tipoGestion === 'PENDIENTE') {
                                  // Causa sin clasificar - OK
                                } else if (tipoGestion === 'CONTROL') {
                                  // Tiene control, falta plan de acción - OK
                                } else if (tipoGestion === 'PLAN') {
                                  // Tiene plan, falta control - OK
                                } else if (tipoGestion === 'AMBOS') {
                                  const estadoAmbos = causa.gestion?.estadoAmbos;
                                  const controlActivo = estadoAmbos?.controlActivo ?? true;
                                  const planActivo = estadoAmbos?.planActivo ?? true;
                                  if (controlActivo && planActivo) return null;
                                } else {
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
                                              
                                              // Solo CONTROL: tiene control, falta plan → solo ofrecer Plan (no Ambos)
                                              if (tipoGestion === 'CONTROL') {
                                                return [
                                                  <MenuItem key="control" value="CONTROL" disabled>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                                      <ShieldIcon fontSize="small" />
                                                      Control existente
                                                    </Box>
                                                  </MenuItem>,
                                                  <MenuItem key="plan" value="PLAN">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                      <AssignmentIcon fontSize="small" />
                                                      Plan de Acción (agregar)
                                                    </Box>
                                                  </MenuItem>,
                                                ];
                                              }
                                              
                                              // Solo PLAN: tiene plan, falta control → solo ofrecer Control (no Ambos)
                                              if (tipoGestion === 'PLAN') {
                                                return [
                                                  <MenuItem key="control" value="CONTROL">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                      <ShieldIcon fontSize="small" />
                                                      Control (agregar)
                                                    </Box>
                                                  </MenuItem>,
                                                  <MenuItem key="plan" value="PLAN" disabled>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                                      <AssignmentIcon fontSize="small" />
                                                      Plan de acción existente
                                                    </Box>
                                                  </MenuItem>,
                                                ];
                                              }
                                              
                                              // Si es AMBOS incompleto
                                              if (tipoGestion === 'AMBOS') {
                                                const estadoAmbos = causa.gestion?.estadoAmbos;
                                                const controlActivo = estadoAmbos?.controlActivo ?? true;
                                                const planActivo = estadoAmbos?.planActivo ?? true;
                                                
                                                // Falta control (existe solo plan de acción)
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
                                                        Plan de acción existente
                                                      </Box>
                                                    </MenuItem>
                                                  ];
                                                }
                                                
                                                // Falta plan (existe solo control)
                                                if (controlActivo && !planActivo) {
                                                  return [
                                                    <MenuItem key="control" value="CONTROL" disabled>
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                                                        <ShieldIcon fontSize="small" />
                                                        Control existente
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
                                          const verde = { backgroundColor: '#2e7d32', color: '#fff', fontWeight: 600 };
                                          const azul = { backgroundColor: '#1976d2', color: '#fff', fontWeight: 600 };
                                          const faltaTodo = { backgroundColor: '#424242', color: '#fff', fontWeight: 600 };
                                          
                                          // Pendiente: falta todo
                                          if (tipoGestion === 'PENDIENTE' || !tipoGestion) {
                                            return (
                                              <Chip 
                                                label="Control y Planes de acción" 
                                                size="small" 
                                                sx={{ fontSize: '0.75rem', ...faltaTodo }}
                                              />
                                            );
                                          }
                                          // Solo CONTROL: falta plan de acción (azul)
                                          if (tipoGestion === 'CONTROL') {
                                            return (
                                              <Chip 
                                                label="Plan de acción" 
                                                size="small" 
                                                sx={{ fontSize: '0.75rem', ...azul }}
                                              />
                                            );
                                          }
                                          // Solo PLAN: falta control (verde)
                                          if (tipoGestion === 'PLAN') {
                                            return (
                                              <Chip 
                                                label="Control" 
                                                size="small" 
                                                sx={{ fontSize: '0.75rem', ...verde }}
                                              />
                                            );
                                          }
                                          if (tipoGestion === 'AMBOS') {
                                            const estadoAmbos = causa.gestion?.estadoAmbos;
                                            const controlActivo = estadoAmbos?.controlActivo ?? true;
                                            const planActivo = estadoAmbos?.planActivo ?? true;
                                            if (!controlActivo && planActivo) {
                                              return <Chip label="Control" size="small" sx={{ fontSize: '0.75rem', ...verde }} />;
                                            }
                                            if (controlActivo && !planActivo) {
                                              return <Chip label="Plan de acción" size="small" sx={{ fontSize: '0.75rem', ...azul }} />;
                                            }
                                            if (!controlActivo && !planActivo) {
                                              return <Chip label="Control y Planes de acción" size="small" sx={{ fontSize: '0.75rem', ...faltaTodo }} />;
                                            }
                                          }
                                          return null;
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
                                                      const freqFromCausa = resolverFrecuenciaCausaA1_5(
                                                        causa.frecuencia as string | number | null | undefined,
                                                        (frecuenciasCatalog as FrecuenciaCatalogItem[]) || [],
                                                      );
                                                      const inherentProb =
                                                        freqFromCausa ?? (riesgo.evaluacion?.probabilidad ?? 1);
                                                      const impactoEval =
                                                        riesgo.evaluacion?.impactoGlobal != null
                                                          ? Number(riesgo.evaluacion.impactoGlobal)
                                                          : riesgo.evaluacion?.impactoMaximo;
                                                      const inherentImp = Math.max(
                                                        1,
                                                        Math.min(5, Math.round(impactoEval as number) || 1),
                                                      );
                                                      let pt = 0;
                                                      let def = 'Inefectivo';
                                                      let mit = 0;

                                                      if (criteriosEvaluacion.tieneControl) {
                                                        pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
                                                        const prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
                                                        def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
                                                        mit = getPorcentajeFromTabla(configResidual?.tablaMitigacion, def);
                                                      }

                                                      const fRes = calcularFrecuenciaResidualAvanzada(
                                                        inherentProb,
                                                        inherentImp,
                                                        mit,
                                                        criteriosEvaluacion.tipoMitigacion,
                                                        def,
                                                        (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                                                          configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                                                          configResidual.porcentajeReduccionDimensionCruzada <= 1)
                                                          ? configResidual.porcentajeReduccionDimensionCruzada
                                                          : 0.34,
                                                      );
                                                      const iRes = calcularImpactoResidualAvanzado(
                                                        inherentImp,
                                                        inherentProb,
                                                        mit,
                                                        criteriosEvaluacion.tipoMitigacion,
                                                        def,
                                                        (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                                                          configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                                                          configResidual.porcentajeReduccionDimensionCruzada <= 1)
                                                          ? configResidual.porcentajeReduccionDimensionCruzada
                                                          : 0.34,
                                                      );
                                                      const calRes =
                                                        fRes === 2 && iRes === 2 ? 3.99 : calcularCalificacionResidual(fRes, iRes);
                                                      const nivelRes =
                                                        getNivelResidualFromRangos(configResidual?.rangosNivelRiesgo, calRes) ||
                                                        determinarNivelRiesgo(calRes, riesgo.clasificacion as any);

                                                      // Valores a mostrar: priorizar lo guardado en la causa/gestión (BD),
                                                      // y usar el cálculo local solo como fallback previo al guardado.
                                                      const displayDef =
                                                        causa.gestion?.evaluacionDefinitiva ?? def;
                                                      const displayMit =
                                                        causa.gestion?.porcentajeMitigacion ?? mit;

                                                      const displayFrecuenciaResidual =
                                                        causa.frecuenciaResidual ??
                                                        causa.gestion?.frecuenciaResidual ??
                                                        fRes;
                                                      const displayImpactoResidual =
                                                        causa.impactoResidual ??
                                                        causa.gestion?.impactoResidual ??
                                                        iRes;
                                                      const displayCalificacionResidual =
                                                        causa.calificacionResidual ??
                                                        causa.gestion?.calificacionResidual ??
                                                        calRes;
                                                      const displayNivelResidual =
                                                        causa.nivelRiesgoResidual ??
                                                        causa.gestion?.nivelRiesgoResidual ??
                                                        nivelRes;

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

                                                                    <FormControl fullWidth size="small">
                                                                      <InputLabel>Origen del Control</InputLabel>
                                                                      <Select
                                                                        value={criteriosEvaluacion.origenPlanAccion || 'ninguno'}
                                                                        label="Origen del Control"
                                                                        onChange={(e) => {
                                                                          setCriteriosEvaluacion(pr => ({ ...pr, origenPlanAccion: e.target.value as any }));
                                                                        }}
                                                                      >
                                                                        <MenuItem value="ninguno">No aplica / Ninguno</MenuItem>
                                                                        <MenuItem value="exito">Plan de Acción Exitoso</MenuItem>
                                                                        <MenuItem value="fallo">Plan de Acción Fallido</MenuItem>
                                                                      </Select>
                                                                    </FormControl>
                                                                  </Box>
                                                                </Box>
                                                              </Box>
                                                            </Collapse>
                                                          )}

                                                          {/* RESULTADOS CALCULADOS */}
                                                          <Box
                                                            id={`panel-residual-${riesgo.id}-${causa.id}`}
                                                            sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}
                                                          >
                                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                                                              CALIFICACIÓN DEL RIESGO RESIDUAL
                                                            </Typography>
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, textAlign: 'center' }}>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                  Eficacia del Control
                                                                </Typography>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                  {criteriosEvaluacion.tieneControl ? displayDef : 'Inefectivo (Sin Control)'}
                                                                </Typography>
                                                                {criteriosEvaluacion.tieneControl && (
                                                                  <Typography variant="caption">({pt.toFixed(0)} pts)</Typography>
                                                                )}
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                  % Mitigación
                                                                </Typography>
                                                                <Typography variant="h6" color="primary">
                                                                  {(displayMit * 100).toFixed(0)}%
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                  Calificación residual de la frecuencia
                                                                </Typography>
                                                                <Typography variant="h6">
                                                                  {fRes}
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Typography variant="caption" display="block" color="text.secondary">
                                                                  Calificación residual del impacto
                                                                </Typography>
                                                                <Typography variant="h6">
                                                                  {iRes}
                                                                </Typography>
                                                              </Box>
                                                              <Box>
                                                                <Paper
                                                                  elevation={0}
                                                                  sx={{
                                                                    p: 1,
                                                                    bgcolor: getColorNivel(nivelRes),
                                                                    color: ['ALTO', 'CRÍTICO', 'CRITICO'].includes(
                                                                      nivelRes.toUpperCase()
                                                                    )
                                                                      ? 'white'
                                                                      : 'black',
                                                                    borderRadius: 1,
                                                                  }}
                                                                >
                                                                  <Typography variant="caption" display="block" fontWeight="bold">
                                                                    Calificación de la causa residual
                                                                  </Typography>
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
                                                      {/* Solo mostrar archivo de seguimiento si es un plan existente (edición) */}
                                                      {(causa.planDescripcion || causa.tipoGestion === 'PLAN' || causa.tipoGestion === 'AMBOS') && (
                                                        <Box>
                                                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                            Archivo de Seguimiento
                                                          </Typography>
                                                          <input 
                                                            type="file" 
                                                            ref={archivoSeguimientoInputRef} 
                                                            style={{ display: 'none' }} 
                                                            onChange={handleArchivoSeguimientoSelect} 
                                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                                                          />
                                                          {!selectedArchivoSeguimiento && !formPlan.archivoSeguimiento && (
                                                            <Button 
                                                              variant="outlined" 
                                                              onClick={() => archivoSeguimientoInputRef.current?.click()}
                                                              fullWidth
                                                            >
                                                              Seleccionar Archivo
                                                            </Button>
                                                          )}
                                                          {(selectedArchivoSeguimiento || formPlan.archivoSeguimientoNombre) && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                                              <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre}
                                                              </Typography>
                                                              <IconButton size="small" onClick={handleRemoveArchivoSeguimiento}>
                                                                <DeleteIcon fontSize="small" />
                                                              </IconButton>
                                                            </Box>
                                                          )}
                                                        </Box>
                                                      )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                      <TextField label="Descripción Detallada" multiline rows={3} value={formPlan.detalle || ''} onChange={e => setFormPlan({ ...formPlan, detalle: e.target.value })} fullWidth />
                                                      <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <TextField 
                                                          label="Fecha Estimada" 
                                                          type="date" 
                                                          value={formPlan.fechaEstimada} 
                                                          onChange={e => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })} 
                                                          InputLabelProps={{ shrink: true }} 
                                                          disabled={esDueñoProcesos}
                                                          fullWidth 
                                                        />
                                                        <FormControl fullWidth>
                                                          <InputLabel>Estado del Plan</InputLabel>
                                                          <Select value={formPlan.estado || 'pendiente'} label="Estado del Plan" onChange={(e) => setFormPlan({ ...formPlan, estado: e.target.value as any })}>
                                                            <MenuItem value="pendiente">Pendiente</MenuItem>
                                                            <MenuItem value="en_progreso">En Progreso</MenuItem>
                                                            <MenuItem value="completado">Completado</MenuItem>
                                                            <MenuItem value="cancelado">Cancelado</MenuItem>
                                                          </Select>
                                                        </FormControl>
                                                      </Box>
                                                      <TextField label="Evidencia (URL, Comentario o Ref.)" value={formPlan.evidencia || ''} onChange={e => setFormPlan({ ...formPlan, evidencia: e.target.value })} fullWidth />
                                                      {(() => {
                                                         if (formPlan.fechaEstimada && formPlan.estado !== 'completado' && formPlan.estado !== 'cancelado') {
                                                            const todayStr = new Date().toISOString().split('T')[0];
                                                            if (formPlan.fechaEstimada < todayStr) {
                                                               return (
                                                                  <Alert severity="warning">
                                                                     <strong>El plan está VENCIDO.</strong> Se ha notificado al supervisor de área que el plan no ha finalizado a tiempo ni adjuntado evidencia. Puede actualizar el estado a &quot;Completado&quot; y cargar las evidencias para cumplir.
                                                                  </Alert>
                                                               );
                                                            }
                                                         }
                                                         return null;
                                                      })()}
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
          {isLoadingRiesgos ? (
            <PageLoadingSkeleton variant="table" tableRows={6} />
          ) : riesgosConControles.length === 0 ? (
            <Card><CardContent><Typography align="center">No hay controles registrados.</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Column Headers */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'grid' },
                  gridTemplateColumns: '45px 90px 1fr 150px 120px 120px 50px',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  bgcolor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 15,
                }}
              >
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
                  <Card key={riesgo.id} sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '45px 90px 1fr 150px 120px 120px 50px' },
                        gap: { xs: 1, md: 1 },
                        p: { xs: 2, md: 1.5 },
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        width: '100%',
                        minHeight: 64,
                        position: 'relative',
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
                      
                      {/* Columna de Clasificación/Nivel de Riesgo RESIDUAL (en CONTROLES) — misma lógica que Resumen y mapa */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {(() => {
                          // Calcular SIEMPRE desde las causas, igual que el resumen y el valor que va al mapa
                          let nivelRiesgo: string | undefined | null = null;
                          if (riesgo.causas && riesgo.causas.length > 0) {
                            const causasConControles = riesgo.causas.filter((c: any) => {
                              const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                              return tipo === 'CONTROL' || tipo === 'AMBOS';
                            });
                            if (causasConControles.length > 0) {
                              const calificacionesResiduales = causasConControles
                                .map((c: any) => {
                                  if (c.calificacionResidual !== undefined && c.calificacionResidual !== null) return Number(c.calificacionResidual);
                                  if (c.riesgoResidual !== undefined && c.riesgoResidual !== null) return Number(c.riesgoResidual);
                                  const fr = Number(c.frecuenciaResidual || c.gestion?.frecuenciaResidual || c.frecuencia || 3);
                                  const ir = Number(c.impactoResidual || c.gestion?.impactoResidual || c.calificacionGlobalImpacto || 1);
                                  return fr === 2 && ir === 2 ? 3.99 : fr * ir;
                                })
                                .filter((cal: number) => !isNaN(cal) && cal > 0);
                              if (calificacionesResiduales.length > 0) {
                                const calificacionMaxResidual = Math.max(...calificacionesResiduales);
                                // Mismas bandas que "CALIFICACIÓN RESIDUAL FINAL DEL RIESGO" (incluye 3.99 = Bajo)
                                if (calificacionMaxResidual >= 15 && calificacionMaxResidual <= 25) nivelRiesgo = 'Crítico';
                                else if (calificacionMaxResidual >= 10 && calificacionMaxResidual < 15) nivelRiesgo = 'Alto';
                                else if (calificacionMaxResidual >= 4 && calificacionMaxResidual < 10) nivelRiesgo = 'Medio';
                                else if (calificacionMaxResidual >= 1 && calificacionMaxResidual < 4) nivelRiesgo = 'Bajo';
                                else nivelRiesgo = 'Sin Calificar';
                              }
                            }
                          }
                          if (!nivelRiesgo) nivelRiesgo = 'Sin Calificar';
                          const nivelParaLabel = String(nivelRiesgo).replace(/nivel\s*/gi, '').trim() || nivelRiesgo;
                          const nivelNormalizado = nivelParaLabel.toLowerCase();
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
                              label={nivelParaLabel.toUpperCase()}
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
                                // Obtener el control desde la relación controles o desde los campos legacy
                                const control = causa.controles?.[0] || {};
                                // Obtener el plan desde la relación planesAccion o desde los campos legacy
                                const plan = causa.planesAccion?.[0] || {};
                                
                                const detalleControl: any = {
                                  ...causa,
                                  descripcion: causa.descripcion,
                                  fuenteCausa: causa.fuenteCausa,
                                  frecuencia: causa.frecuencia,
                                  calificacionGlobalImpacto: causa.calificacionGlobalImpacto,
                                  // Priorizar datos de la tabla ControlRiesgo
                                  controlDescripcion: control.descripcionControl || control.descripcion || causa.controlDescripcion || causa.gestion?.controlDescripcion,
                                  controlTipo: control.tipoControl || causa.controlTipo || causa.gestion?.controlTipo,
                                  evaluacionDefinitiva: control.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva || causa.evaluacionDefinitiva,
                                  puntajeTotal: control.puntajeControl || causa.puntajeTotal || causa.gestion?.puntajeTotal,
                                  porcentajeMitigacion: control.estandarizacionPorcentajeMitigacion || causa.porcentajeMitigacion || causa.gestion?.porcentajeMitigacion,
                                  frecuenciaResidual: causa.frecuenciaResidual || causa.gestion?.frecuenciaResidual,
                                  impactoResidual: causa.impactoResidual || causa.gestion?.impactoResidual,
                                  riesgoResidual: causa.riesgoResidual || causa.calificacionResidual || causa.gestion?.riesgoResidual || causa.gestion?.calificacionResidual,
                                  nivelRiesgoResidual: causa.nivelRiesgoResidual || causa.gestion?.nivelRiesgoResidual,
                                  impactosResiduales: causa.impactosResiduales || causa.gestion?.impactosResiduales,
                                  // Agregar datos del plan desde la tabla PlanAccion
                                  planDescripcion: plan.descripcion || causa.planDescripcion || causa.gestion?.planDescripcion,
                                  planDetalle: plan.observaciones || causa.planDetalle || causa.gestion?.planDetalle,
                                  planResponsable: plan.responsable || causa.planResponsable || causa.gestion?.planResponsable,
                                  planDecision: causa.planDecision || causa.gestion?.planDecision,
                                  planFechaEstimada: plan.fechaFin || plan.fechaProgramada || causa.planFechaEstimada || causa.gestion?.planFechaEstimada,
                                  planEstado: plan.estado || causa.planEstado || causa.gestion?.planEstado,
                                  planEvidencia: plan.evidencia || causa.planEvidencia || causa.gestion?.planEvidencia,
                                  tipo: causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')
                                };
                                
                                return (
                                <Fragment key={causa.id}>
                                <TableRow
                                  id={`causa-residual-${riesgo.id}-${causa.id}`}
                                  sx={{ cursor: 'pointer' }}
                                  onClick={() => {
                                      setItemDetalle(detalleControl);
                                      setCausaDetalleView({ riesgoId: riesgo.id, causa });
                                    setDialogDetailOpen(true);
                                  }}
                                >
                                  <TableCell sx={{ maxWidth: 250 }}>{causa.descripcion}</TableCell>
                                  <TableCell>{control.descripcionControl || control.descripcion || causa.controlDescripcion || causa.gestion?.controlDescripcion || 'Sin descripción'}</TableCell>
                                  <TableCell align="center">
                                    {control.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva || causa.evaluacionDefinitiva || 'Sin evaluar'}
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
                                        {(causa.tipoGestion || '').toUpperCase() === 'CONTROL' && (
                                          <Chip 
                                            label="Falta plan de acción" 
                                            size="small" 
                                            sx={{ fontSize: '0.65rem', height: 20, backgroundColor: '#1976d2', color: '#fff', fontWeight: 600 }}
                                            title="Esta causa tiene solo control; agregue plan en Clasificación"
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
                                              const freqFromCausa = resolverFrecuenciaCausaA1_5(
                                                causa.frecuencia as string | number | null | undefined,
                                                (frecuenciasCatalog as FrecuenciaCatalogItem[]) || [],
                                              );
                                              const inherentProb =
                                                freqFromCausa ?? (riesgo.evaluacion?.probabilidad ?? 1);
                                              const impactoEval =
                                                riesgo.evaluacion?.impactoGlobal != null
                                                  ? Number(riesgo.evaluacion.impactoGlobal)
                                                  : riesgo.evaluacion?.impactoMaximo;
                                              const inherentImp = Math.max(
                                                1,
                                                Math.min(5, Math.round(impactoEval as number) || 1),
                                              );
                                              let pt = 0;
                                              let def = 'Inefectivo';
                                              let mit = 0;

                                              if (criteriosEvaluacion.tieneControl) {
                                                pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.puntajeSegregacion, criteriosEvaluacion.puntajeNaturaleza);
                                                const prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
                                                def = determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
                                                mit = getPorcentajeFromTabla(configResidual?.tablaMitigacion, def);
                                              }

                                              const fRes = calcularFrecuenciaResidualAvanzada(
                                                inherentProb,
                                                inherentImp,
                                                mit,
                                                criteriosEvaluacion.tipoMitigacion,
                                                def,
                                                (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                                                  configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                                                  configResidual.porcentajeReduccionDimensionCruzada <= 1)
                                                  ? configResidual.porcentajeReduccionDimensionCruzada
                                                  : 0.34,
                                              );
                                              const iRes = calcularImpactoResidualAvanzado(
                                                inherentImp,
                                                inherentProb,
                                                mit,
                                                criteriosEvaluacion.tipoMitigacion,
                                                def,
                                                (configResidual?.porcentajeReduccionDimensionCruzada != null &&
                                                  configResidual.porcentajeReduccionDimensionCruzada >= 0 &&
                                                  configResidual.porcentajeReduccionDimensionCruzada <= 1)
                                                  ? configResidual.porcentajeReduccionDimensionCruzada
                                                  : 0.34,
                                              );
                                              const calRes =
                                                fRes === 2 && iRes === 2 ? 3.99 : calcularCalificacionResidual(fRes, iRes);
                                              const nivelRes =
                                                getNivelResidualFromRangos(configResidual?.rangosNivelRiesgo, calRes) ||
                                                determinarNivelRiesgo(calRes, riesgo.clasificacion as any);

                                              const displayFrecuenciaResidual =
                                                causa.frecuenciaResidual ??
                                                causa.gestion?.frecuenciaResidual ??
                                                fRes;
                                              const displayImpactoResidual =
                                                causa.impactoResidual ??
                                                causa.gestion?.impactoResidual ??
                                                iRes;
                                              const displayCalificacionResidual =
                                                causa.calificacionResidual ??
                                                causa.gestion?.calificacionResidual ??
                                                calRes;
                                              const displayNivelResidual =
                                                causa.nivelRiesgoResidual ??
                                                causa.gestion?.nivelRiesgoResidual ??
                                                nivelRes;

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

                                                        <Box
                                                          id={`panel-residual-${riesgo.id}-${causa.id}`}
                                                          sx={{ mt: 3, p: 2, bgcolor: '#e3f2fd', borderRadius: 2, border: '1px solid #90caf9' }}
                                                        >
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
                                                                bgcolor: getColorNivel(displayNivelResidual),
                                                                color: ['ALTO', 'CRÍTICO', 'CRITICO'].includes(displayNivelResidual.toUpperCase()) ? 'white' : 'black',
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

                        {/* Resumen de calificaciones residuales (por causa y final, como en Identificación) */}
                        {(() => {
                          // Solo trabajar con datos residuales reales (BD). Si una causa no tiene
                          // frecuencia/impacto residual, se omite del resumen.
                          const causasConResidual = (riesgo.causas || [])
                            .map((c: any) => {
                              const frRaw = c.frecuenciaResidual ?? c.gestion?.frecuenciaResidual;
                              const irRaw = c.impactoResidual ?? c.gestion?.impactoResidual;
                              if (frRaw == null || irRaw == null) {
                                return null;
                              }
                              const fr = Number(frRaw);
                              const ir = Number(irRaw);
                              const calRaw =
                                c.calificacionResidual ??
                                c.gestion?.calificacionResidual ??
                                (fr === 2 && ir === 2 ? 3.99 : fr * ir);
                              const calNum = Number(calRaw);
                              let nivel = c.nivelRiesgoResidual ?? c.gestion?.nivelRiesgoResidual;
                              if (!nivel && !isNaN(calNum)) {
                                if (calNum >= 15 && calNum <= 25) nivel = 'Crítico';
                                else if (calNum >= 10 && calNum < 15) nivel = 'Alto';
                                else if (calNum >= 4 && calNum < 10) nivel = 'Medio';
                                else if (calNum >= 1 && calNum < 4) nivel = 'Bajo'; // incluye 3.99 (excepción 2×2)
                                else nivel = 'Sin Calificar';
                              }
                              return {
                                ...c,
                                frecuenciaResidual: fr,
                                impactoResidual: ir,
                                calificacionResidualNum: calNum,
                                nivelRiesgoResidual: nivel || 'Sin Calificar',
                              };
                            })
                            .filter(Boolean);

                          const calificacionesResiduales = (causasConResidual as any[])
                            .map((c: any) => c.calificacionResidualNum)
                            .filter((cal: number) => !isNaN(cal) && cal > 0);
                          const calificacionResidualFinal = calificacionesResiduales.length > 0 ? Math.max(...calificacionesResiduales) : 0;
                          let nivelFinal = 'Sin Calificar';
                          if (calificacionResidualFinal > 0) {
                            if (calificacionResidualFinal >= 15 && calificacionResidualFinal <= 25) nivelFinal = 'Crítico';
                            else if (calificacionResidualFinal >= 10 && calificacionResidualFinal < 15) nivelFinal = 'Alto';
                            else if (calificacionResidualFinal >= 4 && calificacionResidualFinal < 10) nivelFinal = 'Medio';
                            else if (calificacionResidualFinal >= 1 && calificacionResidualFinal < 4) nivelFinal = 'Bajo'; // incluye 3.99 (excepción 2×2)
                          }
                          const getColorNivel = (n: string) => {
                            const nn = String(n).toLowerCase();
                            if (nn.includes('crítico') || nn.includes('critico')) return { color: '#fff', bg: '#d32f2f' };
                            if (nn.includes('alto')) return { color: '#fff', bg: '#f57c00' };
                            if (nn.includes('medio')) return { color: '#000', bg: '#fbc02d' };
                            if (nn.includes('bajo')) return { color: '#fff', bg: '#388e3c' };
                            return { color: '#666', bg: '#f5f5f5' };
                          };
                          return (
                            <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                                Resumen de Calificaciones Residuales del Riesgo
                              </Typography>

                              {causasConResidual.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ bgcolor: '#eee' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Causa</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación residual de la frecuencia</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación residual del impacto</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Calificación residual</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Nivel</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {causasConResidual.map((causa: any, idx: number) => {
                                        const { color, bg } = getColorNivel(causa.nivelRiesgoResidual);
                                        return (
                                          <TableRow
                                            key={causa.id}
                                            sx={{
                                              cursor: 'pointer',
                                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' },
                                            }}
                                            onClick={() => {
                                              const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')).toUpperCase();
                                              setTipoClasificacion(tipoGestion as any);
                                              handleEvaluarControl(riesgo.id, causa);

                                              setTimeout(() => {
                                                const panel = document.getElementById(`panel-residual-${riesgo.id}-${causa.id}`);
                                                if (panel) {
                                                  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                  return;
                                                }
                                                const fila = document.getElementById(`causa-residual-${riesgo.id}-${causa.id}`);
                                                if (fila) fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                              }, 150);
                                            }}
                                            title="Ir directo a CALIFICACIÓN DEL RIESGO RESIDUAL de esta causa"
                                          >
                                            <TableCell sx={{ maxWidth: 280 }}>
                                              <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {causa.descripcion?.length > 80 ? `${causa.descripcion.substring(0, 80)}...` : causa.descripcion || '—'}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Typography variant="body2" fontWeight={600}>{causa.frecuenciaResidual}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Typography variant="body2" fontWeight={600}>{causa.impactoResidual}</Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Typography variant="body2" fontWeight={600}>
                                                {isNaN(causa.calificacionResidualNum) ? '—' : causa.calificacionResidualNum === 3.99 ? '3.99' : causa.calificacionResidualNum.toFixed(2)}
                                              </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                              <Chip
                                                label={String(causa.nivelRiesgoResidual).toUpperCase()}
                                                size="small"
                                                sx={{ fontWeight: 600, fontSize: '0.7rem', backgroundColor: bg, color }}
                                              />
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              ) : null}

                              {(() => {
                                const { color: colorFinal, bg: bgFinal } = getColorNivel(nivelFinal);
                                return (
                                  <Box
                                    sx={{
                                      p: 2,
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: 2,
                                      backgroundColor: bgFinal,
                                      color: colorFinal,
                                    }}
                                  >
                                    <Box>
                                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                        CALIFICACIÓN RESIDUAL FINAL DEL RIESGO
                                      </Typography>
                                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {calificacionResidualFinal > 0 ? (calificacionResidualFinal === 3.99 ? '3.99' : calificacionResidualFinal.toFixed(2)) : 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ opacity: 0.85, display: 'block', mt: 0.5 }}>
                                        (Máximo de las calificaciones residuales de las causas con control. Esta calificación se ubica en el mapa de riesgos residuales.)
                                      </Typography>
                                    </Box>
                                    <Chip
                                      label={nivelFinal.toUpperCase()}
                                      sx={{
                                        backgroundColor: 'rgba(255,255,255,0.25)',
                                        color: colorFinal,
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                      }}
                                    />
                                  </Box>
                                );
                              })()}
                            </Paper>
                          );
                        })()}
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
          {isLoadingRiesgos ? (
            <PageLoadingSkeleton variant="table" tableRows={6} />
          ) : riesgosConPlanes.length === 0 ? (
            <Card><CardContent><Typography align="center">No hay planes de acción registrados.</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Column Headers */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'grid' },
                  gridTemplateColumns: '45px 90px 1fr 150px 120px 50px',
                  gap: 1,
                  px: 2,
                  py: 1.5,
                  mb: 1,
                  bgcolor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  alignItems: 'center',
                  position: 'sticky',
                  top: 0,
                  zIndex: 15,
                }}
              >
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
                  <Card key={riesgo.id} sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '45px 90px 1fr 150px 120px 50px' },
                        gap: { xs: 1, md: 1 },
                        p: { xs: 2, md: 1.5 },
                        cursor: 'pointer',
                        bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        width: '100%',
                        minHeight: 64,
                        position: 'relative',
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
                                // Obtener el plan desde la relación planesAccion o desde los campos legacy
                                const plan = causa.planesAccion?.[0] || {};
                                // Obtener el control desde la relación controles o desde los campos legacy
                                const control = causa.controles?.[0] || {};
                                
                                const detallePlan: any = {
                                  ...causa,
                                  descripcion: causa.descripcion,
                                  fuenteCausa: causa.fuenteCausa,
                                  frecuencia: causa.frecuencia,
                                  calificacionGlobalImpacto: causa.calificacionGlobalImpacto,
                                  // Priorizar datos de la tabla PlanAccion
                                  planDescripcion: plan.descripcion || causa.planDescripcion || causa.gestion?.planDescripcion,
                                  planDetalle: plan.observaciones || causa.planDetalle || causa.gestion?.planDetalle,
                                  planResponsable: plan.responsable || causa.planResponsable || causa.gestion?.planResponsable,
                                  planDecision: plan.decision || causa.planDecision || causa.gestion?.planDecision,
                                  planFechaEstimada: plan.fechaFin || plan.fechaProgramada || causa.planFechaEstimada || causa.gestion?.planFechaEstimada,
                                  planEstado: plan.estado || causa.planEstado || causa.gestion?.planEstado,
                                  planEvidencia: plan.evidencia || causa.planEvidencia || causa.gestion?.planEvidencia,
                                  // Agregar datos del control desde la tabla ControlRiesgo
                                  controlDescripcion: control.descripcionControl || control.descripcion || causa.controlDescripcion || causa.gestion?.controlDescripcion,
                                  controlTipo: control.tipoControl || causa.controlTipo || causa.gestion?.controlTipo,
                                  evaluacionDefinitiva: control.evaluacionDefinitiva || causa.gestion?.evaluacionDefinitiva || causa.evaluacionDefinitiva,
                                  puntajeTotal: control.puntajeControl || causa.puntajeTotal || causa.gestion?.puntajeTotal,
                                  porcentajeMitigacion: control.estandarizacionPorcentajeMitigacion || causa.porcentajeMitigacion || causa.gestion?.porcentajeMitigacion,
                                  frecuenciaResidual: causa.frecuenciaResidual || causa.gestion?.frecuenciaResidual,
                                  impactoResidual: causa.impactoResidual || causa.gestion?.impactoResidual,
                                  riesgoResidual: causa.riesgoResidual || causa.calificacionResidual || causa.gestion?.riesgoResidual || causa.gestion?.calificacionResidual,
                                  nivelRiesgoResidual: causa.nivelRiesgoResidual || causa.gestion?.nivelRiesgoResidual,
                                  impactosResiduales: causa.impactosResiduales || causa.gestion?.impactosResiduales,
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
                                      <TableCell sx={{ maxWidth: 360 }}>{plan.observaciones || plan.descripcion || causa.planDetalle || causa.gestion?.planDetalle || causa.planDescripcion || causa.gestion?.planDescripcion || 'Sin descripción'}</TableCell>
                                      <TableCell>{plan.responsable || causa.planResponsable || causa.gestion?.planResponsable || 'N/A'}</TableCell>
                                      <TableCell align="center">{formatDateISO(plan.fechaFin || plan.fechaProgramada || causa.planFechaEstimada || causa.gestion?.planFechaEstimada) || 'N/A'}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                                          <IconButton
                                          size="small"
                                            color="primary"
                                          onClick={(e) => {
                                            console.log('[CLICK] Botón editar plan clickeado'); // DEBUG MUY VISIBLE
                                            e.stopPropagation();
                                              const tipoGestion = (causa.tipoGestion || 'PLAN').toUpperCase();
                                              setTipoClasificacion(tipoGestion as any);
                                            console.log('[CLICK] Llamando handleEvaluarControl con:', riesgo.id, detallePlan); // DEBUG
                                            handleEvaluarControl(riesgo.id, detallePlan);
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
                                          {(causa.tipoGestion || '').toUpperCase() === 'PLAN' && (
                                            <Chip 
                                              label="Falta control" 
                                              size="small" 
                                              sx={{ fontSize: '0.65rem', height: 20, backgroundColor: '#2e7d32', color: '#fff', fontWeight: 600 }}
                                              title="Esta causa tiene solo plan; agregue control en Clasificación"
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
                                                {/* Solo mostrar archivo de seguimiento si es un plan existente (edición) */}
                                                {(causa.planDescripcion || causa.tipoGestion === 'PLAN' || causa.tipoGestion === 'AMBOS') && (
                                                  <Box>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                                      Archivo de Seguimiento
                                                    </Typography>
                                                    <input 
                                                      type="file" 
                                                      ref={archivoSeguimientoInputRef} 
                                                      style={{ display: 'none' }} 
                                                      onChange={handleArchivoSeguimientoSelect} 
                                                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                                                    />
                                                    {!selectedArchivoSeguimiento && !formPlan.archivoSeguimiento && (
                                                      <Button 
                                                        variant="outlined" 
                                                        onClick={() => archivoSeguimientoInputRef.current?.click()}
                                                        fullWidth
                                                      >
                                                        Seleccionar Archivo
                                                      </Button>
                                                    )}
                                                    {(selectedArchivoSeguimiento || formPlan.archivoSeguimientoNombre) && (
                                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                          {selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre}
                                                        </Typography>
                                                        <IconButton size="small" onClick={handleRemoveArchivoSeguimiento}>
                                                          <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                      </Box>
                                                    )}
                                                  </Box>
                                                )}
                                              </Box>
                                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <TextField label="Descripción Detallada" multiline rows={3} value={formPlan.detalle || ''} onChange={e => setFormPlan({ ...formPlan, detalle: e.target.value })} fullWidth />
                                                <TextField 
                                                  label="Fecha Estimada de Finalización" 
                                                  type="date" 
                                                  value={formPlan.fechaEstimada} 
                                                  onChange={e => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })} 
                                                  InputLabelProps={{ shrink: true }} 
                                                  disabled={esDueñoProcesos}
                                                  fullWidth 
                                                />
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

      </Box>

      {/* DIALOG DETALLE CAUSA/CONTROL (Mejorado) */}
      <Dialog
        open={dialogDetailOpen}
        onClose={() => {
          setDialogDetailOpen(false);
          setCausaDetalleView(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxWidth: 560 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {itemDetalle &&
                (((itemDetalle as any).tipo === 'control') ||
                  ((itemDetalle as any).tipo === 'CONTROL') ||
                  ((itemDetalle as any).tipo === 'AMBOS'))
                  ? 'Detalle del Control'
                  : 'Detalle del Plan de Acción'}
              </Typography>
              {itemDetalle && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                  <Chip
                    label={
                      ((itemDetalle as any).tipo === 'control') ||
                      ((itemDetalle as any).tipo === 'CONTROL')
                        ? 'Control'
                        : (itemDetalle as any).tipo === 'AMBOS'
                        ? 'Control y Plan de Acción'
                        : 'Plan de Acción'
                    }
                    color={
                      ((itemDetalle as any).tipo === 'control') ||
                      ((itemDetalle as any).tipo === 'CONTROL')
                        ? 'primary'
                        : (itemDetalle as any).tipo === 'AMBOS'
                        ? 'secondary'
                        : 'info'
                    }
                    size="small"
                  />
                  {(itemDetalle as any).tipo === 'AMBOS' && (
                    <Typography variant="caption" color="text.secondary">
                      Existe control · Existe plan de acción
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {causaDetalleView && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    const causa = causaDetalleView.causa;
                    const riesgoId = causaDetalleView.riesgoId;
                    const tipoGestion = (causa.tipoGestion || (causa.puntajeTotal !== undefined ? 'CONTROL' : 'PLAN')).toUpperCase();
                    setTipoClasificacion(tipoGestion as any);
                    setDialogDetailOpen(false);
                    setCausaDetalleView(null);

                    handleEvaluarControl(riesgoId, causa);

                    setTimeout(() => {
                      const panel = document.getElementById(`panel-residual-${riesgoId}-${causa.id}`);
                      if (panel) {
                        panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                      }
                      const fila = document.getElementById(`causa-residual-${riesgoId}-${causa.id}`);
                      if (fila) fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 150);
                  }}
                >
                  Editar
                </Button>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  setDialogDetailOpen(false);
                  setCausaDetalleView(null);
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
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
                </Box>
              </Box>

              {/* Información del Control */}
              {(((itemDetalle as any).tipo === 'control') || ((itemDetalle as any).tipo === 'CONTROL') || ((itemDetalle as any).tipo === 'AMBOS') || (itemDetalle as any).controlDescripcion) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Información del Control
                    {(itemDetalle as any).tipo === 'AMBOS' && (
                      <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1, fontWeight: 500 }}>
                        (Control existente)
                      </Typography>
                    )}
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
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Origen del Control</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).origenPlanAccion || (itemDetalle as any).gestion?.origenPlanAccion || causaDetalleView?.causa?.origenPlanAccion || 'N/A'}
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
                    {(itemDetalle as any).tipo === 'AMBOS' && (
                      <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1, fontWeight: 500 }}>
                        (Plan de acción existente)
                      </Typography>
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Descripción detallada</Typography>
                      <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                        {(itemDetalle as any).planDetalle || (itemDetalle as any).gestion?.planDetalle || causaDetalleView?.causa?.planDetalle || 'N/A'}
                      </Typography>
                    </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Responsable
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).planResponsable ||
                          (itemDetalle as any).gestion?.planResponsable ||
                          causaDetalleView?.causa?.planResponsable ||
                          'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Fecha Estimada
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {formatDateISO((itemDetalle as any).planFechaEstimada ||
                          (itemDetalle as any).gestion?.planFechaEstimada ||
                          causaDetalleView?.causa?.planFechaEstimada) ||
                          'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Decisión
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 2,
                          whiteSpace: 'pre-wrap',
                          textAlign: 'justify',
                        }}
                      >
                        {(itemDetalle as any).planDecision ||
                          (itemDetalle as any).gestion?.planDecision ||
                          causaDetalleView?.causa?.planDecision ||
                          'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Estado del Plan
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(() => {
                           const estado = (itemDetalle as any).planEstado || (itemDetalle as any).gestion?.planEstado || causaDetalleView?.causa?.planEstado || 'pendiente';
                           if (estado === 'completado') return <Chip label="Completado" size="small" color="success" />;
                           if (estado === 'en_progreso') return <Chip label="En Progreso" size="small" color="info" />;
                           if (estado === 'cancelado') return <Chip label="Cancelado" size="small" color="error" />;
                           return <Chip label="Pendiente" size="small" color="warning" />;
                        })()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Evidencia
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {(itemDetalle as any).planEvidencia ||
                          (itemDetalle as any).gestion?.planEvidencia ||
                          causaDetalleView?.causa?.planEvidencia ? (
                            <a href={(itemDetalle as any).planEvidencia || (itemDetalle as any).gestion?.planEvidencia || causaDetalleView?.causa?.planEvidencia} target="_blank" rel="noopener noreferrer">
                               Ver Evidencia adjunta
                            </a>
                        ) : 'N/A'}
                      </Typography>
                    </Box>
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
      </Dialog>

      {/* DIALOG CLASIFICACION CAUSA (Existing) - Solo se abre cuando se hace clic en "Clasificar" o desde el tab CLASIFICACIÓN */}
      <Dialog
        open={!!causaEnEdicion && !evaluacionExpandida}
        onClose={() => setCausaEnEdicion(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              Clasificar Causa
            </Typography>
            <IconButton size="small" onClick={() => setCausaEnEdicion(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
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
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Nombre del Plan / Acción"
                value={formPlan.descripcion}
                onChange={e => setFormPlan({ ...formPlan, descripcion: e.target.value })}
              />
              <TextField
                fullWidth
                label="Descripción detallada"
                multiline
                rows={3}
                value={formPlan.detalle || ''}
                onChange={e => setFormPlan({ ...formPlan, detalle: e.target.value })}
              />
              <TextField
                fullWidth
                label="Decisión del riesgo (Aceptar, Mitigar, Transferir, etc.)"
                value={formPlan.decision}
                onChange={e => setFormPlan({ ...formPlan, decision: e.target.value })}
              />
              {/* Solo mostrar archivo de seguimiento si es un plan existente (edición) */}
              {causaEnEdicion?.clasificacion && (
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Archivo de Seguimiento
                  </Typography>
                  <input 
                    type="file" 
                    ref={archivoSeguimientoInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleArchivoSeguimientoSelect} 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                  />
                  {!selectedArchivoSeguimiento && !formPlan.archivoSeguimiento && (
                    <Button 
                      variant="outlined" 
                      onClick={() => archivoSeguimientoInputRef.current?.click()}
                      fullWidth
                    >
                      Seleccionar Archivo
                    </Button>
                  )}
                  {(selectedArchivoSeguimiento || formPlan.archivoSeguimientoNombre) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedArchivoSeguimiento?.name || formPlan.archivoSeguimientoNombre}
                      </Typography>
                      <IconButton size="small" onClick={handleRemoveArchivoSeguimiento}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCausaEnEdicion(null)}>Cancelar</Button>
          <Button onClick={handleGuardarClasificacion} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

    </AppPageLayout>
    </>
  );
}

// Force rebuild: 2026-03-20 07:53:04
