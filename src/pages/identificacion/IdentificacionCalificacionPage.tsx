/**
 * Identificación y Calificación Page
 * Diseño de tres paneles: RIESGO, CAUSAS, IMPACTO
 */

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Autocomplete,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Tabs,
  Tab,
  CircularProgress,
  Pagination,
  Stack,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon,
  VerifiedUser as VerifiedIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  UnfoldMore as UnfoldMoreIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import api from '../../services/api';

import { useCreateEvaluacionMutation, useUpdateRiesgoMutation, useCreateRiesgoMutation, riesgosApi, useGetRiesgosQuery } from '../../api/services/riesgosApi';
  import { useAppDispatch } from '../../app/hooks';
  // fuentes de causa: default vacío (backend/seed debe proveer en futuro)

// NOTE: `mockData` module was removed from the project. Replace missing helpers
// with safe defaults and use `procesoSeleccionado` information when available.
const DEFAULT_LABELS_FRECUENCIA: Record<number, { label: string; descripcion?: string }> = {
  1: { label: 'Muy baja', descripcion: '' },
  2: { label: 'Baja', descripcion: '' },
  3: { label: 'Media', descripcion: '' },
  4: { label: 'Alta', descripcion: '' },
  5: { label: 'Muy alta', descripcion: '' },
};

const DEFAULT_TIPOS_RIESGO: any[] = [
  {
    id: 1,
    codigo: 'Estratégico',
    nombre: 'Estratégico',
    descripcion: 'Riesgos relacionados con la estrategia y objetivos corporativos',
    subtipos: [
      { id: 1, tipoRiesgoId: 1, codigo: 'Estratégico - Competencia', nombre: 'Competencia', descripcion: 'Riesgo por cambios en el mercado o competidores' },
      { id: 2, tipoRiesgoId: 1, codigo: 'Estratégico - Regulatorio', nombre: 'Regulatorio', descripcion: 'Cambios en regulaciones que afectan el negocio' }
    ]
  },
  {
    id: 2,
    codigo: 'Operacional',
    nombre: 'Operacional',
    descripcion: 'Riesgos relacionados con los procesos internos',
    subtipos: [
      { id: 3, tipoRiesgoId: 2, codigo: 'Operacional - Procesos', nombre: 'Procesos', descripcion: 'Fallas en procesos operativos' },
      { id: 4, tipoRiesgoId: 2, codigo: 'Operacional - Sistemas', nombre: 'Sistemas', descripcion: 'Fallas en sistemas tecnológicos' }
    ]
  },
  {
    id: 3,
    codigo: 'Financiero',
    nombre: 'Financiero',
    descripcion: 'Riesgos financieros y de mercado',
    subtipos: [
      { id: 5, tipoRiesgoId: 3, codigo: 'Financiero - Liquidez', nombre: 'Liquidez', descripcion: 'Problemas de liquidez' },
      { id: 6, tipoRiesgoId: 3, codigo: 'Financiero - Crédito', nombre: 'Crédito', descripcion: 'Riesgo de crédito' }
    ]
  },
  {
    id: 4,
    codigo: 'Cumplimiento',
    nombre: 'Cumplimiento',
    descripcion: 'Riesgos de cumplimiento legal y normativo',
    subtipos: [
      { id: 7, tipoRiesgoId: 4, codigo: 'Cumplimiento - Legal', nombre: 'Legal', descripcion: 'Incumplimiento de leyes' },
      { id: 8, tipoRiesgoId: 4, codigo: 'Cumplimiento - Normativo', nombre: 'Normativo', descripcion: 'Incumplimiento de normas' }
    ]
  },
  {
    id: 5,
    codigo: 'Reputacional',
    nombre: 'Reputacional',
    descripcion: 'Riesgos que afectan la reputación',
    subtipos: [
      { id: 9, tipoRiesgoId: 5, codigo: 'Reputacional - Imagen', nombre: 'Imagen', descripcion: 'Daño a la imagen corporativa' }
    ]
  }
];
const DEFAULT_IMPACTOS: Record<string, Record<number, string>> = {};
const DEFAULT_OBJETIVOS: any[] = [];
const DEFAULT_ORIGENES: any[] = [];
const DEFAULT_TIPOS_PROCESO: any[] = [];
const DEFAULT_CONSECUENCIAS: any[] = [];
const DEFAULT_NIVELES_RIESGO: any[] = [];
const DEFAULT_CLASIFICACIONES_RIESGO: any[] = [];
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, DIMENSIONES_IMPACTO, LABELS_IMPACTO } from '../../utils/constants';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useRiesgo } from '../../contexts/RiesgoContext';
import { useRiesgos } from '../../contexts/RiesgosContext-NUEVO';
import type { Riesgo, FiltrosRiesgo, CausaRiesgo, RiesgoFormData } from '../../types';
import { generarIdRiesgoAutomatico, calcularImpactoGlobal, calcularRiesgoInherente, determinarNivelRiesgo, generarIdConContador, setSiglasConfig } from '../../utils/calculations';
import { determinarNivelRiesgoSync, calcularCalificacionInherentePorCausaSync } from '../../services/calificacionInherenteService';
import {
  obtenerPorcentajeMitigacion,
  calcularFrecuenciaResidual,
  calcularImpactoResidual,
  calcularCalificacionResidual,
  calcularPuntajeControl,
  determinarEfectividadControl,
  determinarEvaluacionPreliminar,
  determinarEvaluacionDefinitiva,
  obtenerPorcentajeMitigacionAvanzado,
  calcularFrecuenciaResidualAvanzada,
  calcularImpactoResidualAvanzado
} from '../../utils/calculations';
import {
  useGetTiposRiesgosQuery,
  useGetObjetivosQuery,
  useGetFrecuenciasQuery,
  useGetFuentesQuery,
  useGetImpactosQuery,
  useGetOrigenesQuery,
  useGetTiposProcesoQuery,
  useGetConsecuenciasQuery,
  useGetNivelesRiesgoQuery,
  useGetClasificacionesRiesgoQuery,
  useGetGerenciasQuery,
  useGetVicepresidenciasQuery,
  useGetConfiguracionesQuery,
  useGetPesosImpactoQuery,
} from '../../api/services/riesgosApi';


// Consumed inside component via state

const normalizarDescripcionesImpacto = (data?: Record<string, Record<number, string>>) => ({
  economico: data?.economico ?? data?.['4'] ?? {},
  procesos: data?.procesos ?? data?.['8'] ?? {},
  legal: data?.legal ?? data?.['6'] ?? {},
  confidencialidadSGSI: data?.confidencialidadSGSI ?? data?.['2'] ?? {},
  reputacion: data?.reputacion ?? data?.['9'] ?? {},
  disponibilidadSGSI: data?.disponibilidadSGSI ?? data?.['3'] ?? {},
  integridadSGSI: data?.integridadSGSI ?? data?.['5'] ?? {},
  ambiental: data?.ambiental ?? data?.['1'] ?? {},
  personas: data?.personas ?? data?.['7'] ?? {},
});

// Convierte el array retornado por la API de impactos a un objeto { clave: { nivel: descripcion } }
const mapImpactosArrayToObject = (impactosArray?: any[]) => {
  if (!Array.isArray(impactosArray)) return {} as Record<string, Record<number, string>>;
  const result: Record<string, Record<number, string>> = {};
  impactosArray.forEach((it: any) => {
    // Usar String(...) y nullish coalescing para evitar ambigüedades
    const clave = String(it.clave ?? it.nombre ?? it.tipo ?? it.id ?? '');
    result[clave] = {};
    const niveles = Array.isArray(it.niveles) ? it.niveles : (it.niveles ?? []);
    (niveles as any[]).forEach((n: any) => {
      const nivelNum = (Number(n.nivel ?? n.valor ?? n.id)) || 0;
      result[clave][nivelNum] = n.descripcion ?? '';
    });
  });
  return result;
};

const getSubtipoCodigo = (subtipo: any): string => {
  // Usar nombre como codigo si existe, ya que es lo que se muestra en admin
  return (subtipo?.codigo ?? subtipo?.nombre ?? subtipo?.id ?? '').toString();
};

const normalizarTiposRiesgos = (data?: any[]) => {
  return (data || []).map((tipo) => ({
    ...tipo,
    codigo: (tipo?.codigo ?? tipo?.id ?? tipo?.nombre ?? '').toString(),
    subtipos: (tipo?.subtipos || []).map((subtipo: any) => ({
      ...subtipo,
      codigo: getSubtipoCodigo(subtipo),
    })),
  }));
};

// Helper para obtener etiqueta de fuente a partir del catálogo que puede ser array u objeto
function getFuenteLabel(fuentes: any, clave: any) {
  if (!fuentes) return '';
  const keyStr = String(clave ?? '');
  if (Array.isArray(fuentes)) {
    const found = fuentes.find((f: any) => String(f.id ?? f.codigo ?? f.nombre) === keyStr || String(f.id) === keyStr);
    if (found) {
      const nombre = (found?.nombre ?? found?.label ?? found)?.toString?.();
      if (typeof nombre === 'string') return nombre;
      if (typeof found.nombre === 'object') return (found.nombre?.nombre ?? JSON.stringify(found.nombre));
      return String(found);
    }
    return keyStr;
  }
  const val = fuentes[keyStr] ?? fuentes[Number(keyStr)];
  if (val === undefined || val === null) return keyStr;
  if (typeof val === 'object') {
    return (val.nombre ?? val.label ?? val.name ?? JSON.stringify(val)).toString();
  }
  return String(val);
}


export default function IdentificacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { esDueñoProcesos, esSupervisorRiesgos } = useAuth();
  const { riesgos: riesgosApiData, cargarRiesgos, actualizarRiesgo: actualizarRiesgoApi, eliminarRiesgo: eliminarRiesgoApi } = useRiesgos();
  
  // OPTIMIZADO: Usar mutación de RTK Query para crear riesgos
  const [createRiesgoMutation] = useCreateRiesgoMutation();
  
  // OPTIMIZADO: Paginación - Estado para controlar página actual
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; // Tamaño de página optimizado (50 items)
  
  // OPTIMIZADO: Usar RTK Query con paginación real y caché agresivo
  // IMPORTANTE: Las causas son necesarias para calcular la clasificación, así que siempre las incluimos
  const { data: riesgosRTKData, isLoading: isLoadingRiesgosRTK, refetch: refetchRiesgosRTK } = useGetRiesgosQuery(
    {
      // Para Dueño de Proceso y Supervisor, filtrar SIEMPRE por proceso seleccionado
      procesoId:
        procesoSeleccionado?.id && (esDueñoProcesos || esSupervisorRiesgos)
          ? procesoSeleccionado.id
          : undefined,
      includeCausas: true, // Necesario para calcular clasificación inherente global
      page: currentPage,
      pageSize: pageSize
    },
    {
      // Skip la consulta si el rol requiere proceso y aún no se ha seleccionado
      skip: (esDueñoProcesos || esSupervisorRiesgos) && !procesoSeleccionado?.id,
      refetchOnMountOrArgChange: false, // OPTIMIZADO: No refetch si ya está en caché
      refetchOnFocus: false, // OPTIMIZADO: No refetch al enfocar ventana
      refetchOnReconnect: false, // OPTIMIZADO: No refetch al reconectar
      // OPTIMIZADO: Caché más agresivo (10 minutos) para mejor rendimiento
      keepUnusedDataFor: 600
    }
  );
  
  // Resetear a página 1 cuando cambia el proceso
  useEffect(() => {
    setCurrentPage(1);
  }, [procesoSeleccionado?.id]);
  
  // OPTIMIZADO: Usar datos de RTK Query si están disponibles, sino usar del contexto
  const riesgosApiDataOptimizado = riesgosRTKData?.data || riesgosRTKData || riesgosApiData || [];
  const totalRiesgos = riesgosRTKData?.total || riesgosApiDataOptimizado.length;
  const totalPages = riesgosRTKData?.totalPages || Math.ceil(totalRiesgos / pageSize);
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess, showError } = useNotification();
  const dispatch = useAppDispatch();

  // Backend catalog hooks - OPTIMIZADO: skip si no hay proceso seleccionado (para dueños de proceso)
  // Esto evita cargar datos innecesarios si el usuario no ha seleccionado un proceso
  const shouldSkipQueries = esDueñoProcesos && !procesoSeleccionado?.id;
  
  // OPTIMIZADO: Agregar isLoading para cada query para mostrar loading states
  // OPTIMIZADO: Caché muy agresivo para catálogos que no cambian frecuentemente
  const catalogQueryOptions = { 
    skip: shouldSkipQueries,
    keepUnusedDataFor: 1800, // 30 minutos de caché para catálogos (cambian muy poco)
    refetchOnMountOrArgChange: false, // No refetch si ya están en caché
    refetchOnFocus: false, // No refetch al enfocar ventana
    refetchOnReconnect: false // No refetch al reconectar
  };
  
  const { data: tiposRiesgosApi, isLoading: isLoadingTipos } = useGetTiposRiesgosQuery(undefined, catalogQueryOptions);
  const { data: objetivosApi, isLoading: isLoadingObjetivos } = useGetObjetivosQuery(undefined, catalogQueryOptions);
  const { data: frecuenciasApi, isLoading: isLoadingFrecuencias } = useGetFrecuenciasQuery(undefined, catalogQueryOptions);
  const { data: fuentesApi, isLoading: isLoadingFuentes } = useGetFuentesQuery(undefined, catalogQueryOptions);
  const { data: impactosApi, isLoading: isLoadingImpactos } = useGetImpactosQuery(undefined, catalogQueryOptions);
  const { data: origenesApi, isLoading: isLoadingOrigenes } = useGetOrigenesQuery(undefined, catalogQueryOptions);
  const { data: tiposProcesoApi, isLoading: isLoadingTiposProceso } = useGetTiposProcesoQuery(undefined, catalogQueryOptions);
  const { data: consecuenciasApi, isLoading: isLoadingConsecuencias } = useGetConsecuenciasQuery(undefined, catalogQueryOptions);
  const { data: nivelesRiesgoApi, isLoading: isLoadingNiveles } = useGetNivelesRiesgoQuery(undefined, catalogQueryOptions);
  const { data: clasificacionesApi, isLoading: isLoadingClasificaciones } = useGetClasificacionesRiesgoQuery(undefined, catalogQueryOptions);
  const { data: gerenciasApi, isLoading: isLoadingGerencias } = useGetGerenciasQuery(undefined, catalogQueryOptions);
  const { data: vicepresidenciasApi, isLoading: isLoadingVicepresidencias } = useGetVicepresidenciasQuery(undefined, catalogQueryOptions);
  const { data: configuracionesApi, isLoading: isLoadingConfiguraciones } = useGetConfiguracionesQuery(undefined, catalogQueryOptions);
  const { data: pesosImpactoApi = [] } = useGetPesosImpactoQuery(undefined, catalogQueryOptions);

  // Determinar si alguna query crítica está cargando (solo las esenciales para mostrar la UI)
  const isLoadingCatalogos = isLoadingTipos || isLoadingFrecuencias || isLoadingImpactos || isLoadingNiveles;
  const isLoadingData = isLoadingRiesgosRTK || (isLoadingCatalogos && !tiposRiesgosApi && !frecuenciasApi && !impactosApi && !nivelesRiesgoApi);
  const requiereProcesoYNoSeleccionado = esDueñoProcesos && !procesoSeleccionado?.id;

  // Helper para normalizar riesgos cargados - asegurar que causas tengan calificaciones
  // Función para calcular calificación global impacto (memoizada)
  // Usa los pesos configurados en la BD: nivel * porcentaje_decimal, sumar todos, redondear
  const calcularCalificacionGlobalImpacto = useCallback((impactos: RiesgoFormData['impactos']): number => {
    return calcularImpactoGlobal({
      personas: impactos.personas || 1,
      legal: impactos.legal || 1,
      ambiental: impactos.ambiental || 1,
      procesos: impactos.procesos || 1,
      reputacion: impactos.reputacion || 1,
      economico: impactos.economico || 1,
      confidencialidadSGSI: impactos.confidencialidadSGSI || 1,
      disponibilidadSGSI: impactos.disponibilidadSGSI || 1,
      integridadSGSI: impactos.integridadSGSI || 1,
    }, pesosImpactoApi);
  }, [pesosImpactoApi]);

  // Helper para obtener etiqueta de fuente a partir del catálogo que puede ser array u objeto
  const getFuenteLabel = (fuentes: any, clave: any) => {
    if (!fuentes) return '';
    const keyStr = String(clave ?? '');
    if (Array.isArray(fuentes)) {
      const found = fuentes.find((f: any) => String(f.id ?? f.codigo ?? f.nombre) === keyStr || String(f.id) === keyStr);
      if (found) {
        const nombre = (found?.nombre ?? found?.label ?? found)?.toString?.();
        if (typeof nombre === 'string') return nombre;
        // If nombre is an object, try common fields or stringify safely
        if (typeof found.nombre === 'object') return (found.nombre?.nombre ?? JSON.stringify(found.nombre));
        return String(found);
      }
      return keyStr;
    }
    // Map-like
    const val = fuentes[keyStr] ?? fuentes[Number(keyStr)];
    if (val === undefined || val === null) return keyStr;
    if (typeof val === 'object') {
      // Prefer common name fields
      return (val.nombre ?? val.label ?? val.name ?? JSON.stringify(val)).toString();
    }
    return String(val);
  };

  // Función para calcular calificación inherente por causa (usa configuración desde API, memoizada)
  const valorEspecialMemo = useMemo(() => {
    let valor = 3.99;
    try {
      const cfg = Array.isArray(configuracionesApi) ? configuracionesApi.find((c: any) => c?.clave === 'formula_especial') : null;
      if (cfg && cfg.valor) {
        const parsed = typeof cfg.valor === 'string' ? JSON.parse(cfg.valor) : cfg.valor;
        valor = parsed?.valorEspecial ?? valor;
      }
    } catch (e) {
      // usar fallback
    }
    return valor;
  }, [configuracionesApi]);

  const calcularCalificacionInherentePorCausa = useCallback((
    calificacionGlobalImpacto: number,
    frecuencia: number
  ): number => {
    // Usar servicio centralizado para calcular
    try {
      const resultado = calcularCalificacionInherentePorCausaSync(frecuencia, calificacionGlobalImpacto);
      return resultado.resultado;
    } catch (error) {
      console.error('Error al calcular calificación inherente por causa:', error);
      // Fallback: lógica hardcodeada
      if (calificacionGlobalImpacto === 2 && frecuencia === 2) {
        return valorEspecialMemo || 3.99;
      }
      return calificacionGlobalImpacto * frecuencia;
    }
  }, [valorEspecialMemo]);

  // Función para recalcular y guardar la calificación inherente global
  // NOTA: Esta función se llama SOLO cuando se guarda, no durante la edición
  // OPTIMIZADO: Acepta riesgo actualizado opcional para evitar llamada API adicional
  const recalcularYGuardarCalificacionInherenteGlobal = useCallback(async (riesgoId: number, riesgoActualizado?: RiesgoFormData) => {
    try {
      // Si se proporciona el riesgo actualizado, usarlo; si no, obtenerlo de la API
      let riesgo: any;
      if (riesgoActualizado) {
        // Usar el riesgo actualizado pero obtener las causas desde la API
        const riesgoCompleto = await api.riesgos.getById(riesgoId);
        riesgo = {
          ...riesgoCompleto,
          // Usar los impactos actualizados del riesgo que se acaba de guardar
          impactos: riesgoActualizado.impactos || riesgoCompleto.impactos,
          // Mantener las causas del riesgo completo
          causas: riesgoCompleto.causas || []
        };
      } else {
        // Obtener el riesgo completo con todas sus causas
        riesgo = await api.riesgos.getById(riesgoId);
      }
      
      if (!riesgo || !riesgo.causas || riesgo.causas.length === 0) {
        // Si no hay causas, establecer calificación inherente global a 0
        const evaluacionUpdate: any = {
          riesgoInherente: 0,
          nivelRiesgo: 'SIN CALIFICAR'
        };
        await actualizarRiesgoApi(riesgoId, { evaluacion: evaluacionUpdate });
        return;
      }

      // Calcular calificación global impacto del riesgo (ya redondeado a entero por calcularImpactoGlobal)
      const calificacionGlobalImpacto = calcularCalificacionGlobalImpacto(riesgo.impactos || {
        personas: 1, legal: 1, ambiental: 1, procesos: 1,
        reputacion: 1, economico: 1
      });

      // Usar frecuenciasApi del hook en lugar de hacer llamada API adicional
      const frecuenciasCatalog = frecuenciasApi || [];

      // Calcular calificación inherente por cada causa usando servicio centralizado
      const calificacionesInherentes = riesgo.causas
        .map(causa => {
          // SIEMPRE usar el calificacionGlobalImpacto del riesgo
          const impacto = calificacionGlobalImpacto;
          
          // Obtener el peso de la frecuencia desde el catálogo
          let pesoFrecuencia = 3; // Default
          if (causa.frecuencia) {
            if (typeof causa.frecuencia === 'number' || /^\d+$/.test(String(causa.frecuencia))) {
              const freqId = typeof causa.frecuencia === 'number' ? causa.frecuencia : parseInt(String(causa.frecuencia));
              const freqCatalog = frecuenciasCatalog?.find((f: any) => f.id === freqId);
              pesoFrecuencia = freqCatalog?.peso || freqId;
            } else if (typeof causa.frecuencia === 'string') {
              const freqCatalog = frecuenciasCatalog?.find((f: any) => 
                f.label?.toLowerCase() === causa.frecuencia.toLowerCase() ||
                f.nombre?.toLowerCase() === causa.frecuencia.toLowerCase()
              );
              pesoFrecuencia = freqCatalog?.peso || 3;
            }
          }
          
          // Usar servicio centralizado para calcular
          const resultado = calcularCalificacionInherentePorCausaSync(pesoFrecuencia, impacto);
          return resultado.resultado;
        })
        .filter(cal => cal !== undefined && cal !== null && !isNaN(cal)) as number[];

      // Calcular calificación inherente global (máximo de todas las causas)
      const calificacionInherenteGlobal = calificacionesInherentes.length > 0
        ? Math.max(...calificacionesInherentes)
        : 0;

      // Determinar nivel de riesgo usando servicio centralizado
      const nivelRiesgo = determinarNivelRiesgoSync(calificacionInherenteGlobal);

      // Convertir calificación inherente global a probabilidad e impacto para el mapa
      // Buscar la mejor combinación de probabilidad e impacto que dé el valor más cercano
      // Priorizar combinaciones que den exactamente el valor o el más cercano por encima
      let mejorProb = 1;
      let mejorImp = 1;
      let menorDiferencia = Math.abs(calificacionInherenteGlobal - (mejorProb * mejorImp));
      let encontradoExacto = false;
      
      // Primero buscar coincidencia exacta
      // IMPORTANTE: Priorizar combinaciones balanceadas (prob == imp)
      // Para calificacionInherenteGlobal = 16, preferir 4×4 sobre otras combinaciones
      // Para calificacionInherenteGlobal = 4, preferir 2×2 sobre 1×4 o 4×1
      // Buscar primero combinaciones balanceadas (prob == imp), luego otras
      for (let prob = 5; prob >= 1; prob--) {
        const imp = prob;
        const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
        if (Math.abs(valor - calificacionInherenteGlobal) < 0.01) {
          mejorProb = prob;
          mejorImp = imp;
          encontradoExacto = true;
          break;
        }
      }
      
      // Si no encontramos balanceada, buscar cualquier coincidencia exacta
      if (!encontradoExacto) {
        for (let imp = 5; imp >= 1; imp--) {
          for (let prob = 1; prob <= 5; prob++) {
            const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
            if (Math.abs(valor - calificacionInherenteGlobal) < 0.01) {
              mejorProb = prob;
              mejorImp = imp;
              encontradoExacto = true;
              break;
            }
          }
          if (encontradoExacto) break;
        }
      }
      
      // Si no hay coincidencia exacta, buscar el más cercano >= calificacionInherenteGlobal
      if (!encontradoExacto) {
        menorDiferencia = Infinity;
        for (let prob = 1; prob <= 5; prob++) {
          for (let imp = 1; imp <= 5; imp++) {
            const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
            
            // Priorizar valores que sean >= calificacionInherenteGlobal (no menores)
            if (valor >= calificacionInherenteGlobal) {
              const diferencia = valor - calificacionInherenteGlobal;
              if (diferencia < menorDiferencia) {
                menorDiferencia = diferencia;
                mejorProb = prob;
                mejorImp = imp;
              }
            }
          }
        }
        
        // Si aún no hay valor >=, usar el más cercano (menor)
        if (menorDiferencia === Infinity) {
          menorDiferencia = Infinity;
          for (let prob = 1; prob <= 5; prob++) {
            for (let imp = 1; imp <= 5; imp++) {
              const valor = prob === 2 && imp === 2 ? 3.99 : prob * imp;
              const diferencia = Math.abs(calificacionInherenteGlobal - valor);
              if (diferencia < menorDiferencia) {
                menorDiferencia = diferencia;
                mejorProb = prob;
                mejorImp = imp;
              }
            }
          }
        }
      }

      // Actualizar la evaluación con la calificación inherente global y los valores para el mapa
      // IMPORTANTE: El backend espera Int para riesgoInherente, así que redondeamos
      const evaluacionUpdate: any = {
        riesgoInherente: Math.round(calificacionInherenteGlobal), // Redondear a entero para el backend
        nivelRiesgo: nivelRiesgo || 'SIN CALIFICAR',
        probabilidad: mejorProb,
        impactoGlobal: mejorImp
      };

      console.log(`[IdentificacionPage] 💾 Guardando evaluación para riesgo ${riesgoId}:`, {
        riesgoInherente: evaluacionUpdate.riesgoInherente,
        nivelRiesgo: evaluacionUpdate.nivelRiesgo,
        probabilidad: evaluacionUpdate.probabilidad,
        impactoGlobal: evaluacionUpdate.impactoGlobal
      });

      await actualizarRiesgoApi(riesgoId, { evaluacion: evaluacionUpdate });
      
      // Invalidar caché del mapa para que se actualice automáticamente
      // Esto fuerza que el mapa recargue los puntos con las nuevas posiciones
      dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
      
      // Disparar evento para que el mapa se actualice inmediatamente
      window.dispatchEvent(new CustomEvent('riesgo-actualizado', { detail: { riesgoId } }));
    } catch (error) {
      console.error(`[IdentificacionPage] ❌ Error al recalcular calificación inherente para riesgo ${riesgoId}:`, error);
      // No mostrar error al usuario, pero loguear para debugging
    }
  }, [frecuenciasApi, actualizarRiesgoApi]);


  // Estado para múltiples riesgos
  const [riesgos, setRiesgos] = useState<RiesgoFormData[]>([]);
  
  // Estado para forzar recálculo cuando cambia la configuración
  const [configVersion, setConfigVersion] = useState(0);
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});

  // Catalog States (declare before effects that reference them)
  const [tiposRiesgos, setTiposRiesgos] = useState(normalizarTiposRiesgos(DEFAULT_TIPOS_RIESGO));
  const [objetivos, setObjetivos] = useState(DEFAULT_OBJETIVOS);
  const [labelsFrecuencia, setLabelsFrecuencia] = useState(DEFAULT_LABELS_FRECUENCIA);
  const [fuentesCausa, setFuentesCausa] = useState<any[]>([]);
  const [origenes, setOrigenes] = useState(DEFAULT_ORIGENES);
  const [tiposProceso, setTiposProceso] = useState(DEFAULT_TIPOS_PROCESO);
  const [consecuencias, setConsecuencias] = useState(DEFAULT_CONSECUENCIAS);
  const [descripcionesImpacto, setDescripcionesImpacto] = useState(normalizarDescripcionesImpacto(DEFAULT_IMPACTOS));
  const [nivelesRiesgo, setNivelesRiesgo] = useState(DEFAULT_NIVELES_RIESGO);
  const [clasificacionesRiesgo, setClasificacionesRiesgo] = useState(DEFAULT_CLASIFICACIONES_RIESGO);

  // Ordenamiento de la tabla de identificación y calificación
  type RiesgoSortField = 'id' | 'descripcion' | 'tipo' | 'subtipo' | 'clasificacion' | 'estado';

  const [sortConfigRiesgos, setSortConfigRiesgos] = useState<{
    field: RiesgoSortField;
    direction: 'asc' | 'desc';
  }>({
    field: 'id',
    direction: 'asc',
  });

  const getCalificacionInherenteGlobal = (riesgo: any): number => {
    const causasOrdenadas = [...(riesgo.causas || [])].sort((a: any, b: any) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idA - idB;
    });

    const calificacionesInherentes = causasOrdenadas
      .map((causa: any) => causa.calificacionInherentePorCausa)
      .filter((cal: any) => cal !== undefined && cal !== null) as number[];

    return calificacionesInherentes.length > 0 ? Math.max(...calificacionesInherentes) : 0;
  };

  const getRiesgoSortValue = (riesgo: any, field: RiesgoSortField) => {
    switch (field) {
      case 'id':
        return riesgo.numeroIdentificacion || '';
      case 'descripcion':
        return riesgo.descripcionRiesgo || '';
      case 'tipo': {
        const tipoRiesgoObj = (tiposRiesgos || []).find((t: any) =>
          t.nombre === riesgo.tipoRiesgo ||
          t.codigo === riesgo.tipoRiesgo ||
          String(t.id) === String(riesgo.tipoRiesgo)
        );
        return (tipoRiesgoObj?.nombre || tipoRiesgoObj?.codigo || riesgo.tipoRiesgo || '') as string;
      }
      case 'subtipo': {
        const tipoRiesgoObj = (tiposRiesgos || []).find((t: any) =>
          t.nombre === riesgo.tipoRiesgo ||
          t.codigo === riesgo.tipoRiesgo ||
          String(t.id) === String(riesgo.tipoRiesgo)
        );
        const subtipoObj = tipoRiesgoObj?.subtipos.find((s: any) =>
          s.nombre === riesgo.subtipoRiesgo ||
          s.codigo === riesgo.subtipoRiesgo ||
          String(s.id) === String(riesgo.subtipoRiesgo)
        );
        return (subtipoObj?.nombre || subtipoObj?.codigo || riesgo.subtipoRiesgo || '') as string;
      }
      case 'clasificacion':
        return getCalificacionInherenteGlobal(riesgo);
      case 'estado':
        return (riesgo.causas && riesgo.causas.length) || 0;
      default:
        return '';
    }
  };

  const riesgosOrdenados = useMemo(() => {
    const data = [...riesgos];

    data.sort((a, b) => {
      const aVal = getRiesgoSortValue(a, sortConfigRiesgos.field);
      const bVal = getRiesgoSortValue(b, sortConfigRiesgos.field);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfigRiesgos.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comp = aStr.localeCompare(bStr, 'es');
      return sortConfigRiesgos.direction === 'asc' ? comp : -comp;
    });

    return data;
  }, [riesgos, tiposRiesgos, sortConfigRiesgos]);

  const handleSortRiesgos = (field: RiesgoSortField) => {
    setSortConfigRiesgos((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { field, direction: 'asc' };
    });
  };

  // Memoizar función de carga de riesgos para evitar re-renders
  // OPTIMIZADO: Usar RTK Query que ya filtra desde el backend
  const cargarRiesgosMemo = useCallback((procesoId?: number | string) => {
    // RTK Query se actualiza automáticamente cuando cambia procesoId
    // Solo invalidar caché para forzar refetch si es necesario
    if (procesoId) {
      dispatch(riesgosApi.util.invalidateTags(['Riesgo']));
      refetchRiesgosRTK();
    } else {
      dispatch(riesgosApi.util.invalidateTags(['Riesgo']));
      refetchRiesgosRTK();
    }
  }, [dispatch, refetchRiesgosRTK]);

  // Recargar configuración de calificación inherente cuando se monta el componente
  // OPTIMIZADO: Cargar en paralelo sin bloquear la UI
  useEffect(() => {
    // Cargar configuración en background sin bloquear
    const recargarConfig = async () => {
      try {
        const { invalidarCache, getConfigActiva } = await import('../../services/calificacionInherenteService');
        // Invalidar cache para forzar recarga
        invalidarCache();
        // Recargar configuración (no esperar, hacer en background)
        getConfigActiva().then(() => {
          // Solo incrementar versión cuando termine, sin bloquear
          setConfigVersion(prev => prev + 1);
          console.log('[IdentificacionPage] ✅ Configuración recargada en background');
        }).catch((error) => {
          console.error('Error al recargar configuración:', error);
        });
      } catch (error) {
        console.error('Error al importar servicio:', error);
      }
    };
    
    // Ejecutar en background sin bloquear
    recargarConfig();
    
    // También escuchar eventos de actualización de configuración
    const handleConfigUpdate = () => {
      console.log('[IdentificacionPage] 🔔 Evento de actualización de configuración recibido');
      recargarConfig();
    };
    
    window.addEventListener('calificacion-inherente-updated', handleConfigUpdate);
    
    return () => {
      window.removeEventListener('calificacion-inherente-updated', handleConfigUpdate);
    };
  }, []);

  // OPTIMIZADO: RTK Query ya maneja el filtrado automáticamente cuando cambia procesoSeleccionado?.id
  // No necesitamos useEffect adicional - RTK Query se actualiza automáticamente
  // Solo invalidar caché cuando cambia el proceso para asegurar datos frescos
  useEffect(() => {
    if (procesoSeleccionado?.id) {
      // Invalidar caché para forzar refetch con el nuevo procesoId
      dispatch(riesgosApi.util.invalidateTags(['Riesgo']));
    }
  }, [procesoSeleccionado?.id, dispatch]);

  // Memoizar función de mapeo de riesgos
  const mapearRiesgos = useCallback((riesgosData: any[], objetivosList: any[], procesoSel: any) => {
    return riesgosData.map((r: any) => {
      // Mapear objetivoId a texto objetivo
      let objetivoTexto = '';
      if (r.objetivoId && objetivosList.length > 0) {
        const obj = objetivosList.find((o: any) => o.id === r.objetivoId);
        if (obj) {
          objetivoTexto = `${obj.codigo} ${obj.descripcion}`;
        }
      } else if (r.objetivo) {
        objetivoTexto = `${r.objetivo.codigo || ''} ${r.objetivo.descripcion || ''}`.trim();
      }

      // Recalcular numeroIdentificacion usando la sigla del proceso
      let numeroIdentificacion = r.numeroIdentificacion || '';
      const procesoDelRiesgo = r.proceso || procesoSel;
      if (procesoDelRiesgo) {
        const procesoSigla = (procesoDelRiesgo as any).sigla || 
          (procesoDelRiesgo.nombre 
            ? procesoDelRiesgo.nombre
                .split(' ')
                .filter((p: string) => p.length > 0 && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'].includes(p.toLowerCase()))
                .map((palabra: string) => palabra.charAt(0).toUpperCase())
                .join('')
                .substring(0, 4)
            : 'GEN');
        
        const numeroRiesgo = r.numero || 0;
        if (numeroRiesgo > 0) {
          numeroIdentificacion = `${numeroRiesgo}${procesoSigla.toUpperCase()}`;
        } else if (r.numeroIdentificacion) {
          // Intentar extraer el número del numeroIdentificacion actual
          const match = String(r.numeroIdentificacion).match(/^(\d+)/);
          if (match) {
            numeroIdentificacion = `${match[1]}${procesoSigla.toUpperCase()}`;
          }
        }
      }

      return {
        ...r,
        id: r.id,
        descripcionRiesgo: r.descripcion || '',
        numeroIdentificacion: numeroIdentificacion || r.numero || '',
        origenRiesgo: r.origen || 'Interno',
        consecuencia: r.clasificacion || 'Negativa',
        objetivo: objetivoTexto || '',
        tipoRiesgo: r.tipoRiesgo || '',
        subtipoRiesgo: r.subtipoRiesgo || '',
        tipoProceso: r.proceso?.tipo || procesoSel?.tipo || 'Operacional',
        impactos: r.evaluacion ? {
          economico: r.evaluacion.impactoEconomico || 1,
          procesos: r.evaluacion.impactoProcesos || 1,
          legal: r.evaluacion.impactoLegal || 1,
          confidencialidadSGSI: r.evaluacion.confidencialidadSGSI || 1,
          reputacion: r.evaluacion.impactoReputacion || 1,
          disponibilidadSGSI: r.evaluacion.disponibilidadSGSI || 1,
          personas: r.evaluacion.impactoPersonas || 1,
          integridadSGSI: r.evaluacion.integridadSGSI || 1,
          ambiental: r.evaluacion.impactoAmbiental || 1,
        } : {
          economico: 1, procesos: 1, legal: 1, confidencialidadSGSI: 1,
          reputacion: 1, disponibilidadSGSI: 1, personas: 1, integridadSGSI: 1, ambiental: 1
        },
        causas: r.causas || [],
        proceso: r.proceso
      };
    });
  }, []);

  // Helper para obtener el peso de la frecuencia desde el catálogo
  const obtenerPesoFrecuencia = useCallback((frecuencia: any, frecuenciasApi: any[]): number => {
    if (!frecuencia) return 3; // Default
    
    // Si es un número, intentar buscar en el catálogo por ID
    if (typeof frecuencia === 'number' || /^\d+$/.test(String(frecuencia))) {
      const freqId = typeof frecuencia === 'number' ? frecuencia : parseInt(String(frecuencia));
      const freqCatalog = frecuenciasApi?.find((f: any) => f.id === freqId);
      if (freqCatalog?.peso) {
        return freqCatalog.peso;
      }
      // Si no tiene peso en el catálogo, usar el ID como peso (fallback)
      return freqId;
    }
    
    // Si es un string (label), buscar por label
    if (typeof frecuencia === 'string') {
      const freqCatalog = frecuenciasApi?.find((f: any) => 
        f.label?.toLowerCase() === frecuencia.toLowerCase() ||
        f.nombre?.toLowerCase() === frecuencia.toLowerCase()
      );
      if (freqCatalog?.peso) {
        return freqCatalog.peso;
      }
    }
    
    // Fallback: intentar parsear como número
    const parsed = parseInt(String(frecuencia));
    return isNaN(parsed) ? 3 : parsed;
  }, []);

  // Memoizar normalización de riesgos (OPTIMIZADO: cachear cálculos por riesgo)
  const normalizarRiesgosMemo = useCallback((riesgosData: RiesgoFormData[]) => {
    if (!riesgosData || riesgosData.length === 0) return [];
    
    // Crear un mapa de frecuencias para búsqueda rápida (O(1) en lugar de O(n))
    const frecuenciasMap = new Map<number | string, number>();
    if (frecuenciasApi && Array.isArray(frecuenciasApi)) {
      frecuenciasApi.forEach((f: any) => {
        if (f.id) frecuenciasMap.set(f.id, f.peso || f.id);
        if (f.label) frecuenciasMap.set(f.label.toLowerCase(), f.peso || 3);
      });
    }
    
    return riesgosData.map(riesgo => {
      // SIEMPRE calcular el calificacionGlobalImpacto del riesgo (ya redondeado a entero por calcularImpactoGlobal)
      const calificacionGlobal = calcularCalificacionGlobalImpacto(riesgo.impactos || {
        economico: 1, procesos: 1, legal: 1, confidencialidadSGSI: 1,
        reputacion: 1, disponibilidadSGSI: 1, personas: 1, integridadSGSI: 1, ambiental: 1,
      });

      // OPTIMIZADO: Pre-calcular peso de frecuencia usando Map
      const causasNormalizadas = (riesgo.causas || []).map(causa => {
        // Obtener el peso de la frecuencia desde el mapa (más rápido)
        let pesoFrecuencia = 3; // Default
        if (causa.frecuencia) {
          if (typeof causa.frecuencia === 'number') {
            pesoFrecuencia = frecuenciasMap.get(causa.frecuencia) || causa.frecuencia;
          } else if (typeof causa.frecuencia === 'string') {
            pesoFrecuencia = frecuenciasMap.get(causa.frecuencia.toLowerCase()) || 
                           (parseInt(causa.frecuencia) || 3);
          }
        }
        
        // SIEMPRE usar el calificacionGlobalImpacto del riesgo, no de la causa
        const calificacionInherentePorCausa = calcularCalificacionInherentePorCausa(
          calificacionGlobal, // Usar siempre el del riesgo
          pesoFrecuencia // Usar el peso de la frecuencia
        );

        return {
          ...causa,
          calificacionGlobalImpacto: calificacionGlobal, // SIEMPRE usar el del riesgo
          calificacionInherentePorCausa: calificacionInherentePorCausa, // Recalcular siempre
        };
      });

      return { ...riesgo, causas: causasNormalizadas };
    });
  }, [calcularCalificacionGlobalImpacto, calcularCalificacionInherentePorCausa, frecuenciasApi]);

  // Función helper para extraer el procesoId de un riesgo (memoizada fuera del useMemo)
  const obtenerProcesoId = useCallback((r: any): number | null => {
    // Intentar múltiples formas de obtener el procesoId
    // 1. Campo directo procesoId
    if (r.procesoId !== undefined && r.procesoId !== null) {
      const id = Number(r.procesoId);
      if (!isNaN(id) && id > 0) return id;
    }
    // 2. Objeto proceso con id
    if (r.proceso) {
      if (typeof r.proceso === 'number') {
        const id = Number(r.proceso);
        if (!isNaN(id) && id > 0) return id;
      } else if (typeof r.proceso === 'object' && r.proceso !== null) {
        if (r.proceso.id !== undefined && r.proceso.id !== null) {
          const id = Number(r.proceso.id);
          if (!isNaN(id) && id > 0) return id;
        }
      }
    }
    return null;
  }, []);

  // OPTIMIZADO: Usar datos de RTK Query que ya vienen filtrados desde el backend
  // No necesitamos filtrar en el frontend si el backend ya lo hizo
  const riesgosFiltrados = useMemo(() => {
    // Usar datos optimizados de RTK Query
    const datos = riesgosApiDataOptimizado;
    
    if (!datos || !Array.isArray(datos) || datos.length === 0) {
      return [];
    }
    
    // Si es dueño de procesos y hay proceso seleccionado, el backend ya filtró
    // Solo verificar si el backend filtró correctamente (optimización: solo verificar los primeros 3)
    if (procesoSeleccionado?.id && esDueñoProcesos) {
      const procesoIdSeleccionado = Number(procesoSeleccionado.id);
      const primerosRiesgos = datos.slice(0, Math.min(3, datos.length));
      const todosDelProceso = primerosRiesgos.every((r: any) => {
        const procesoIdRiesgo = obtenerProcesoId(r);
        return procesoIdRiesgo !== null && procesoIdRiesgo === procesoIdSeleccionado;
      });
      
      if (todosDelProceso) {
        // El backend ya filtró correctamente
        return datos;
      }
      
      // Si el backend no filtró, aplicar filtro frontend como fallback
      const riesgosDelProceso = datos.filter((r: any) => {
        const procesoIdRiesgo = obtenerProcesoId(r);
        return procesoIdRiesgo !== null && procesoIdRiesgo === procesoIdSeleccionado;
      });
      
      return riesgosDelProceso.length > 0 ? riesgosDelProceso : datos;
    }
    
    // Para supervisores, mostrar todos los riesgos
    return datos;
  }, [riesgosApiDataOptimizado, procesoSeleccionado?.id, esDueñoProcesos, obtenerProcesoId]);

  // Memoizar mapeo de riesgos (separado para mejor rendimiento)
  const riesgosMapeados = useMemo(() => {
    if (riesgosFiltrados.length === 0) return [];
    return mapearRiesgos(riesgosFiltrados, objetivos, procesoSeleccionado);
  }, [riesgosFiltrados, objetivos, procesoSeleccionado, mapearRiesgos]);

  // Memoizar riesgos procesados con normalización (solo recalcular cuando cambien los datos)
  // OPTIMIZADO: Usar React.startTransition para operaciones no críticas
  const riesgosProcesados = useMemo(() => {
    if (riesgosMapeados.length === 0) return [];
    // Solo normalizar si hay datos nuevos o si cambió la configuración
    return normalizarRiesgosMemo(riesgosMapeados);
  }, [riesgosMapeados, normalizarRiesgosMemo, configVersion]);

  // Actualizar estado local cuando cambian los riesgos procesados
  // OPTIMIZADO: Usar startTransition para actualizaciones no críticas
  useEffect(() => {
    // Usar startTransition para que la actualización no bloquee la UI
    if (typeof window !== 'undefined' && (window as any).React?.startTransition) {
      (window as any).React.startTransition(() => {
        setRiesgos(riesgosProcesados);
      });
    } else {
      // Fallback si startTransition no está disponible
      setRiesgos(riesgosProcesados);
    }
  }, [riesgosProcesados]);

  // Refresh catalogs on mount - listen for changes from admin


  // Populate catalogs from backend when available (OPTIMIZADO: solo actualizar si realmente cambió)
  useEffect(() => {
    if (tiposRiesgosApi && tiposRiesgosApi.length > 0) {
      setTiposRiesgos(prev => {
        // Solo actualizar si la longitud cambió o si es la primera vez
        if (prev.length === 0 || prev.length !== tiposRiesgosApi.length) {
          return normalizarTiposRiesgos(tiposRiesgosApi);
        }
        return prev;
      });
    }
  }, [tiposRiesgosApi?.length]); // Solo depender de la longitud, no del objeto completo

  useEffect(() => {
    if (objetivosApi && objetivosApi.length > 0) {
      // Solo actualizar si la longitud cambió o si es la primera vez
      if (objetivos.length === 0 || objetivos.length !== objetivosApi.length) {
        setObjetivos(objetivosApi);
      }
    }
  }, [objetivosApi, objetivos.length]);

  // OPTIMIZADO: Eliminar JSON.stringify costoso, usar comparación por referencia o longitud
  useEffect(() => {
    if (frecuenciasApi) {
      try {
        let mapped: Record<number, { label: string; descripcion?: string }> = {};
        if (Array.isArray(frecuenciasApi)) {
          frecuenciasApi.forEach((f: any, idx: number) => {
            const key = idx + 1;
            mapped[key] = { label: f.label ?? f.nombre ?? String(f), descripcion: f.descripcion ?? '' };
          });
        } else {
          mapped = frecuenciasApi as any;
        }
        setLabelsFrecuencia(mapped as any);
      } catch (err) {
        // Silently fail
      }
    }
  }, [frecuenciasApi]);

  useEffect(() => {
    if (fuentesApi && (fuentesCausa.length === 0 || fuentesCausa.length !== fuentesApi.length)) {
      setFuentesCausa(fuentesApi as any[]);
    }
  }, [fuentesApi, fuentesCausa.length]);

  useEffect(() => {
    if (impactosApi) {
      const normalized = Array.isArray(impactosApi) 
        ? normalizarDescripcionesImpacto(mapImpactosArrayToObject(impactosApi as any[]))
        : normalizarDescripcionesImpacto(impactosApi as any);
      setDescripcionesImpacto(normalized);
    }
  }, [impactosApi]);

  useEffect(() => {
    if (origenesApi && (origenes.length === 0 || origenes.length !== origenesApi.length)) {
      setOrigenes(origenesApi as any[]);
    }
  }, [origenesApi, origenes.length]);

  useEffect(() => {
    if (tiposProcesoApi && (tiposProceso.length === 0 || tiposProceso.length !== tiposProcesoApi.length)) {
      setTiposProceso(tiposProcesoApi as any[]);
    }
  }, [tiposProcesoApi, tiposProceso.length]);

  useEffect(() => {
    if (consecuenciasApi && (consecuencias.length === 0 || consecuencias.length !== consecuenciasApi.length)) {
      setConsecuencias(consecuenciasApi as any[]);
    }
  }, [consecuenciasApi, consecuencias.length]);

  useEffect(() => {
    if (nivelesRiesgoApi && (nivelesRiesgo.length === 0 || nivelesRiesgo.length !== nivelesRiesgoApi.length)) {
      setNivelesRiesgo(nivelesRiesgoApi as any[]);
    }
  }, [nivelesRiesgoApi, nivelesRiesgo.length]);

  useEffect(() => {
    if (clasificacionesApi && (clasificacionesRiesgo.length === 0 || clasificacionesRiesgo.length !== clasificacionesApi.length)) {
      setClasificacionesRiesgo(clasificacionesApi as any[]);
    }
  }, [clasificacionesApi, clasificacionesRiesgo.length]);

  // Registrar siglas para generación de IDs usando la configuración desde backend
  useEffect(() => {
    const siglas: Array<{ nombre: string; sigla: string }> = [];
    if (Array.isArray(gerenciasApi)) {
      gerenciasApi.forEach((g: any) => {
        if (g && (g.nombre || g.sigla)) {
          siglas.push({ nombre: g.nombre ?? String(g), sigla: (g.sigla ?? '') });
        }
      });
    }
    // vicepresidenciasApi puede ser un array de strings o de objetos
    if (Array.isArray(vicepresidenciasApi)) {
      vicepresidenciasApi.forEach((v: any) => {
        if (typeof v === 'string') {
          const nombre = v;
          const sigla = v.split(' ').map((p: string) => p[0]?.toUpperCase()).join('').substring(0, 3);
          siglas.push({ nombre, sigla });
        } else if (v && (v.nombre || v.sigla)) {
          siglas.push({ nombre: v.nombre ?? String(v), sigla: v.sigla ?? '' });
        }
      });
    }

    if (siglas.length > 0) {
      setSiglasConfig(siglas);
    }
  }, [gerenciasApi, vicepresidenciasApi]);

  // Actualizar numeroIdentificacion de todos los riesgos cuando cambie el proceso
  useEffect(() => {
    if (!procesoSeleccionado || riesgos.length === 0) return;

    // Obtener la sigla del proceso (prioridad: proceso.sigla > generar desde nombre)
    const procesoSigla = (procesoSeleccionado as any).sigla || 
      (procesoSeleccionado.nombre 
        ? procesoSeleccionado.nombre
            .split(' ')
            .filter((p: string) => p.length > 0 && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'].includes(p.toLowerCase()))
            .map((palabra: string) => palabra.charAt(0).toUpperCase())
            .join('')
            .substring(0, 4)
        : 'GEN');

    const sigla = procesoSigla.toUpperCase();

    // Recalcular el numeroIdentificacion para cada riesgo basado en procesoSeleccionado.sigla
    const riesgosActualizados = riesgos.map(riesgo => {
      // Extraer el número del riesgo (del numeroIdentificacion actual o del campo numero)
      let numeroRiesgo = riesgo.numero || 0;
      if (!numeroRiesgo && riesgo.numeroIdentificacion) {
        const match = String(riesgo.numeroIdentificacion).match(/^(\d+)/);
        if (match) {
          numeroRiesgo = parseInt(match[1], 10);
        }
      }
      if (!numeroRiesgo) {
        numeroRiesgo = 1; // Fallback
      }

      // Generar nuevo numeroIdentificacion: número + sigla del proceso
      const nuevoNumeroIdentificacion = `${numeroRiesgo}${sigla}`;

      return {
        ...riesgo,
        numeroIdentificacion: nuevoNumeroIdentificacion
      };
    });

    // Actualizar estado solo si hay cambios
    const haycambios = riesgosActualizados.some((r, idx) => r.numeroIdentificacion !== riesgos[idx]?.numeroIdentificacion);
    if (haycambios) {
      setRiesgos(riesgosActualizados);
    }
  }, [procesoSeleccionado]);

  // Función para crear un nuevo riesgo vacío
  const crearNuevoRiesgo = (): RiesgoFormData => {
    const nuevoId = `riesgo-${Date.now()}`;

    // Generar ID automático: siguiente número según riesgos existentes del mismo proceso (no reiniciar contador)
    let numeroIdentificacion = '';

    if (procesoSeleccionado) {
      // Obtener la sigla del proceso (prioridad: proceso.sigla > generar desde nombre)
      const procesoSigla = (procesoSeleccionado as any).sigla || 
        (procesoSeleccionado.nombre 
          ? procesoSeleccionado.nombre
              .split(' ')
              .filter((p: string) => p.length > 0)
              .map((palabra: string) => palabra.charAt(0).toUpperCase())
              .join('')
              .substring(0, 4)
          : 'GEN');

      const sigla = procesoSigla.toUpperCase();

      // Calcular el siguiente número a partir de los riesgos ya existentes del mismo proceso (no reiniciar)
      const riesgosDelProceso = riesgos.filter(
        (r: any) => String((r as any).procesoId ?? procesoSeleccionado?.id) === String(procesoSeleccionado?.id)
      );
      const numerosExistentes = riesgosDelProceso
        .map((r: any) => {
          const id = r.numeroIdentificacion || r.numero || '';
          const match = String(id).match(/^(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => n > 0);
      const maxNumero = numerosExistentes.length > 0 ? Math.max(...numerosExistentes) : 0;
      const siguienteNumero = maxNumero + 1;
      numeroIdentificacion = `${siguienteNumero}${sigla}`;
    }

    return {
      id: nuevoId,
      descripcionRiesgo: '',
      numeroIdentificacion: numeroIdentificacion,
      origenRiesgo: 'Interno',
      tipoProceso: procesoSeleccionado?.tipo || 'Operacional',
      consecuencia: 'Negativa',
      tipoRiesgo: '',
      subtipoRiesgo: '',
      objetivo: procesoSeleccionado?.objetivos?.[0] || '',
      causas: [],
      impactos: {
        economico: 1,
        procesos: 1,
        legal: 1,
        confidencialidadSGSI: 1,
        reputacion: 1,
        disponibilidadSGSI: 1,
        personas: 1,
        integridadSGSI: 1,
        ambiental: 1,
      },
    };
  };

  // Añadir nuevo riesgo
  const handleAgregarRiesgo = async () => {
    const nuevoRiesgo = crearNuevoRiesgo();
    try {
      if (!procesoSeleccionado || !procesoSeleccionado.id) {
        showError('Seleccione un proceso antes de crear un riesgo');
        return;
      }
      // Calcular el siguiente número de riesgo disponible para este proceso
      // para evitar colisiones con la restricción única (procesoId, numero) en backend.
      const numerosExistentes = riesgos
        .filter((r: any) => String((r as any).procesoId ?? procesoSeleccionado.id) === String(procesoSeleccionado.id))
        .map((r: any) => Number(r.numero ?? 0) || 0);
      const maxNumeroExistente = numerosExistentes.length > 0 ? Math.max(...numerosExistentes) : 0;
      const siguienteNumero = maxNumeroExistente + 1;
      // Obtener datos de gerencia del proceso seleccionado
      let gerenciaNombre = '';
      let gerenciaSigla = '';
      let vicepresidenciaNombre = '';
      let vicepresidenciaSigla = '';
      
      if (procesoSeleccionado) {
        const gerenciaId = (procesoSeleccionado as any).gerencia;
        if (gerenciaId && gerenciasApi && Array.isArray(gerenciasApi)) {
          const gerenciaEnCatalogo = gerenciasApi.find((g: any) => 
            String(g.id) === String(gerenciaId) || String(g.nombre) === String(gerenciaId)
          );
          if (gerenciaEnCatalogo) {
            gerenciaNombre = gerenciaEnCatalogo.nombre || '';
            gerenciaSigla = gerenciaEnCatalogo.sigla || '';
            vicepresidenciaNombre = gerenciaEnCatalogo.subdivision || '';
            // Generar sigla de vicepresidencia si no existe
            if (vicepresidenciaNombre && !vicepresidenciaSigla) {
              vicepresidenciaSigla = vicepresidenciaNombre.toUpperCase().split(' ').map((s: string) => s[0]).join('').slice(0, 4);
            }
          }
        }
      }
      
      // Crear en Backend - valores iniciales mínimos
      const impactosIniciales = {
        personas: 1, legal: 1, ambiental: 1, procesos: 1,
        reputacion: 1, economico: 1
      };
      const impactoGlobal = calcularImpactoGlobal(impactosIniciales, pesosImpactoApi);
      const impactoMaximo = 1; 
      const probabilidad = 1; 
      const riesgoInherente = calcularRiesgoInherente(impactoMaximo, probabilidad);
      const nivelRiesgo = determinarNivelRiesgo(riesgoInherente, 'Negativa');
      
      // Obtener la sigla del proceso para el numeroIdentificacion
      const procesoSigla = (procesoSeleccionado as any).sigla || 
        (procesoSeleccionado.nombre 
          ? procesoSeleccionado.nombre
              .split(' ')
              .filter((p: string) => p.length > 0 && !['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e'].includes(p.toLowerCase()))
              .map((palabra: string) => palabra.charAt(0).toUpperCase())
              .join('')
              .substring(0, 4)
          : 'GEN');
      const numeroIdentificacionFinal = `${siguienteNumero}${procesoSigla.toUpperCase()}`;
      
      const payload = {
        procesoId: procesoSeleccionado?.id,
        // Usar siempre un número secuencial garantizado para evitar duplicados
        numero: siguienteNumero,
        numeroIdentificacion: numeroIdentificacionFinal, // ID completo con sigla del proceso (ej: "1PF")
        descripcion: nuevoRiesgo.descripcionRiesgo || 'Nuevo Riesgo',
        clasificacion: 'Negativa',
        origen: 'Interno',
        zona: 'Rural',
        tipologiaNivelI: '',
        tipologiaNivelII: '',
        causaRiesgo: '',
        fuenteCausa: '',
        vicepresidenciaGerenciaAlta: vicepresidenciaNombre,
        siglaVicepresidencia: vicepresidenciaSigla,
        gerencia: gerenciaNombre,
        siglaGerencia: gerenciaSigla,
        objetivoId: procesoSeleccionado?.objetivos?.[0] ? Number(procesoSeleccionado.objetivos[0]) : null,
        evaluacion: {
          impactoPersonas: 1, 
          impactoLegal: 1, 
          impactoAmbiental: 1, 
          impactoProcesos: 1,
          impactoReputacion: 1, 
          impactoEconomico: 1, 
          impactoTecnologico: 1, 
          probabilidad,
          impactoGlobal,
          impactoMaximo,
          riesgoInherente,
          nivelRiesgo
        }
      };
      

      // OPTIMIZADO: Usar mutación de RTK Query para crear el riesgo
      const creado = await createRiesgoMutation(payload).unwrap();
      showSuccess('Riesgo creado exitosamente');
      
      // OPTIMIZADO: Forzar refetch inmediato de la lista de riesgos para que aparezca el nuevo riesgo
      await refetchRiesgosRTK();
      
      // También recargar del contexto para sincronizar con otras páginas
      await cargarRiesgos({ procesoId: procesoSeleccionado.id, includeCausas: true });
      
      // Seleccionar el riesgo recién creado para que otras páginas (Controles / Planes / Materializar) se sincronicen
      try { iniciarVer(creado as any); } catch (err) { /* noop */ }
    } catch (e) {
      console.error(e);
      showError('Error al crear riesgo');
    }
  };

  // Eliminar riesgo
  const handleEliminarRiesgo = async (riesgoId: string | number) => {
    try {
      await eliminarRiesgoApi(Number(riesgoId));
      showSuccess('Riesgo eliminado');
    } catch (e) {
      showError('Error al eliminar riesgo');
    }
  };

  // Toggle expandir/colapsar riesgo
  const { iniciarVer } = useRiesgo();

  const handleToggleExpandir = (riesgoId: string) => {
    const nuevo = !riesgosExpandidos[riesgoId];
    setRiesgosExpandidos({
      ...riesgosExpandidos,
      [riesgoId]: nuevo,
    });
    // Si se está abriendo, marcar como riesgo seleccionado globalmente
    if (nuevo) {
      const seleccionado = riesgos.find(r => String(r.id) === String(riesgoId));
      if (seleccionado) iniciarVer(seleccionado as any);
    }
  };

  // Estado para cambios pendientes (solo en memoria, no se guarda hasta que el usuario presione Guardar)
  const [cambiosPendientes, setCambiosPendientes] = useState<Record<string, Partial<RiesgoFormData>>>({});

  // Actualizar riesgo SOLO en estado local (sin guardar en backend)
  // Esto permite editar sin recálculos costosos hasta que se guarde
  const actualizarRiesgo = useCallback((riesgoId: string, actualizacion: Partial<RiesgoFormData>) => {
    // Solo actualizar estado local, sin guardar en backend
    setCambiosPendientes(prev => ({
      ...prev,
      [riesgoId]: {
        ...prev[riesgoId],
        ...actualizacion,
        // Merge de impactos si existen
        impactos: actualizacion.impactos 
          ? { ...prev[riesgoId]?.impactos, ...actualizacion.impactos }
          : prev[riesgoId]?.impactos
      }
    }));

    // Actualizar estado local de riesgos para mostrar cambios inmediatamente (solo UI)
    setRiesgos(prevRiesgos => prevRiesgos.map(r => {
      if (String(r.id) === String(riesgoId)) {
        return {
          ...r,
          ...actualizacion,
          impactos: actualizacion.impactos ? { ...r.impactos, ...actualizacion.impactos } : r.impactos
        };
      }
      return r;
    }));
  }, []);

  // Guardar riesgo en backend y recalcular (solo cuando el usuario presiona Guardar)
  const guardarRiesgo = useCallback(async (riesgoId: string) => {
    try {
      const riesgoActual = riesgos.find(r => r.id === riesgoId);
      if (!riesgoActual) {
        showError('Riesgo no encontrado');
        return;
      }

      // Obtener todos los cambios pendientes para este riesgo
      const cambios = cambiosPendientes[riesgoId] || {};
      
      // Si no hay cambios, no hacer nada
      if (Object.keys(cambios).length === 0) {
        showSuccess('No hay cambios para guardar');
        return;
      }

      const payload: any = {};

      // Mapear actualizaciones a estructura de Backend
      if (cambios.descripcionRiesgo !== undefined) payload.descripcion = cambios.descripcionRiesgo;
      if (cambios.tipoRiesgo !== undefined) payload.tipoRiesgo = cambios.tipoRiesgo;
      if (cambios.subtipoRiesgo !== undefined) payload.subtipoRiesgo = cambios.subtipoRiesgo;
      if (cambios.origenRiesgo !== undefined) payload.origen = cambios.origenRiesgo;
      if (cambios.consecuencia !== undefined) payload.clasificacion = cambios.consecuencia;
      
      // Objetivo: guardar como texto completo (código + descripción)
      if (cambios.objetivo !== undefined) {
        const objetivoTexto = cambios.objetivo;
        const objetivoEncontrado = objetivos?.find((obj: any) => 
          `${obj.codigo} ${obj.descripcion}` === objetivoTexto
        );
        if (objetivoEncontrado) {
          payload.objetivoId = objetivoEncontrado.id;
        }
      }
      
      // Construir el riesgo actualizado con los cambios para pasarlo al recálculo
      const riesgoActualizado = {
        ...riesgoActual,
        ...cambios,
        impactos: cambios.impactos 
          ? { ...riesgoActual.impactos, ...cambios.impactos }
          : riesgoActual.impactos
      };
      
      if (cambios.impactos) {
        payload.evaluacion = {
          ...(riesgoActual as any).evaluacion,
          impactoEconomico: cambios.impactos.economico,
          impactoProcesos: cambios.impactos.procesos,
          impactoLegal: cambios.impactos.legal,
          impactoReputacion: cambios.impactos.reputacion,
          impactoPersonas: cambios.impactos.personas,
          impactoAmbiental: cambios.impactos.ambiental,
          confidencialidadSGSI: cambios.impactos.confidencialidadSGSI,
          disponibilidadSGSI: cambios.impactos.disponibilidadSGSI,
          integridadSGSI: cambios.impactos.integridadSGSI
        };
      }

      // 1. Guardar cambios en el backend
      await actualizarRiesgoApi(Number(riesgoId), payload);
      
      // 2. SIEMPRE recalcular calificaciones después de guardar
      // IMPORTANTE: Pasar el riesgo actualizado para que use los cambios recién guardados
      try {
        await recalcularYGuardarCalificacionInherenteGlobal(Number(riesgoId), riesgoActualizado);
      } catch (error) {
        console.error('Error al recalcular calificación inherente:', error);
      }
      
      // 3. Limpiar cambios pendientes para este riesgo
      setCambiosPendientes(prev => {
        const nuevo = { ...prev };
        delete nuevo[riesgoId];
        return nuevo;
      });
      
      // 4. Invalidar caché del mapa
      dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
      
      // 5. Recargar riesgos con los datos actualizados
      if (procesoSeleccionado?.id) {
        await cargarRiesgosMemo(procesoSeleccionado.id);
      } else {
        await cargarRiesgosMemo();
      }
      
      // 6. Disparar evento para que el mapa se actualice
      window.dispatchEvent(new CustomEvent('riesgo-actualizado', { detail: { riesgoId: Number(riesgoId) } }));
      
      showSuccess('Riesgo guardado exitosamente');
    } catch (e) {
      console.error(e);
      showError('Error al guardar riesgo');
    }
  }, [riesgos, cambiosPendientes, objetivos, procesoSeleccionado, actualizarRiesgoApi, recalcularYGuardarCalificacionInherenteGlobal, cargarRiesgosMemo, dispatch, showSuccess, showError]);

  const [createEvaluacion] = useCreateEvaluacionMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();

  // Estados locales para el diálogo de causa (compartido)
  const [dialogCausaOpen, setDialogCausaOpen] = useState<boolean>(false);
  const [causaEditando, setCausaEditando] = useState<CausaRiesgo | null>(null);
  const [riesgoIdParaCausa, setRiesgoIdParaCausa] = useState<string>('');
  const [nuevaCausaDescripcion, setNuevaCausaDescripcion] = useState<string>('');
  const [nuevaCausaFuente, setNuevaCausaFuente] = useState<string>('');
  const [nuevaCausaFrecuencia, setNuevaCausaFrecuencia] = useState<number>(3);
  const [causaDetalleOpen, setCausaDetalleOpen] = useState(false);
  const [causaSeleccionadaDetalle, setCausaSeleccionadaDetalle] = useState<CausaRiesgo | null>(null);
  const [causaEliminando, setCausaEliminando] = useState<string | null>(null); // ID de la causa que se está eliminando
  // Estado para confirmación de eliminación (modal bonito)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [causaPendienteEliminar, setCausaPendienteEliminar] = useState<{ riesgoId: string; causaId: string } | null>(null);

  // Si el catálogo de fuentes cambia, elegir un valor por defecto válido
  useEffect(() => {
    if (!fuentesCausa || nuevaCausaFuente) return; // Solo establecer si está vacío
    try {
      if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
        const f = fuentesCausa[0];
        const fuenteId = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
        if (fuenteId) setNuevaCausaFuente(fuenteId);
      } else if (typeof fuentesCausa === 'object') {
        const keys = Object.keys(fuentesCausa || {});
        if (keys.length > 0) setNuevaCausaFuente(keys[0]);
      }
    } catch (e) {
      // ignore
    }
  }, [fuentesCausa]);



  // Estado para diálogo de evaluación de criterios de control
  const [dialogEvaluacionOpen, setDialogEvaluacionOpen] = useState<boolean>(false);
  const [riesgoIdEvaluacion, setRiesgoIdEvaluacion] = useState<string>('');
  const [causaIdEvaluacion, setCausaIdEvaluacion] = useState<string>('');
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState({
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
    tipoMitigacion: 'AMBAS' as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
    recomendacion: '',
  });

  // handleSave ahora usa guardarRiesgo que sí guarda y recalcula
  const handleSave = useCallback(async (riesgoId: string) => {
    await guardarRiesgo(riesgoId);
  }, [guardarRiesgo]);

  return (
    <AppPageLayout
      title="IDENTIFICACIÓN Y CALIFICACIÓN INHERENTE"
      description="Identifique y califique el riesgo inherente de su proceso basándose en su frecuencia e impacto."
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleAgregarRiesgo}
          disabled={isReadOnly || isLoadingData}
          sx={{
            borderRadius: 2,
            px: 3,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
          }}
        >
          Añadir Riesgo
        </Button>
      }
    >
      {/* Mensaje para dueño de proceso sin proceso seleccionado */}
      {requiereProcesoYNoSeleccionado && (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            Por favor selecciona un proceso en el encabezado para gestionar sus riesgos.
          </Alert>
        </Box>
      )}

      {/* Contenido del Tab INHERENTE */}

      <>
        {/* Lista de riesgos */}
        {isLoadingData ? (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={50} thickness={4} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  Cargando riesgos y datos...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : riesgos.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No hay riesgos registrados. Haga clic en "Añadir Riesgo" para comenzar.
              </Typography>
              {riesgosApiData && riesgosApiData.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  ⚠️ Hay {riesgosApiData.length} riesgos en la API pero no se están mostrando. Revisa la consola para más detalles.
                </Alert>
              )}
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2,
            width: '100%'
          }}>
            {/* Column Headers */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '45px 90px 1fr 120px 120px 120px 100px 50px',
              gap: 1,
              px: 2,
              py: 1.5,
              mb: 1,
              bgcolor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              alignItems: 'center',
              width: '100%'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }} />
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('id')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">
                  ID RIESGO
                </Typography>
                {sortConfigRiesgos.field === 'id' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('descripcion')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">
                  DESCRIPCIÓN DEL RIESGO
                </Typography>
                {sortConfigRiesgos.field === 'descripcion' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('tipo')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">
                  TIPO RIESGO
                </Typography>
                {sortConfigRiesgos.field === 'tipo' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('subtipo')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" fontSize="0.7rem">
                  SUBTIPO
                </Typography>
                {sortConfigRiesgos.field === 'subtipo' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('clasificacion')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" fontSize="0.7rem">
                  CLASIFICACIÓN
                </Typography>
                {sortConfigRiesgos.field === 'clasificacion' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, cursor: 'pointer' }}
                onClick={() => handleSortRiesgos('estado')}
              >
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center" fontSize="0.7rem">
                  CAUSAS
                </Typography>
                {sortConfigRiesgos.field === 'estado' ? (
                  sortConfigRiesgos.direction === 'asc' ? (
                    <ArrowUpwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  ) : (
                    <ArrowDownwardIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                  )
                ) : (
                  <UnfoldMoreIcon fontSize="small" sx={{ fontSize: '0.85rem' }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Sin encabezado, solo espacio para el ícono de eliminar */}
              </Box>
            </Box>
            {riesgosOrdenados.map((riesgo) => {
              const estaExpandido = riesgosExpandidos[riesgo.id] || false;
              const tipoRiesgoObj = (tiposRiesgos || []).find(t => 
                t.nombre === riesgo.tipoRiesgo || 
                t.codigo === riesgo.tipoRiesgo ||
                String(t.id) === String(riesgo.tipoRiesgo)
              );
              const subtipoObj = tipoRiesgoObj?.subtipos.find((s: any) => 
                s.nombre === riesgo.subtipoRiesgo ||
                s.codigo === riesgo.subtipoRiesgo ||
                String(s.id) === String(riesgo.subtipoRiesgo)
              );

              return (
                <Card key={riesgo.id} sx={{ mb: 2 }}>
                  {/* Header colapsable */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '45px 90px 1fr 120px 120px 120px 100px 50px',
                      gap: 1,
                      p: 1.5,
                      cursor: 'pointer',
                      bgcolor: estaExpandido ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      alignItems: 'center',
                      width: '100%'
                    }}
                    onClick={() => handleToggleExpandir(riesgo.id)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" color="primary" sx={{ p: 0.5 }}>
                        {estaExpandido ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    </Box>

                    <Typography variant="subtitle2" fontWeight={700} color="primary" fontSize="0.8rem">
                      {riesgo.numeroIdentificacion || 'Sin ID'}
                    </Typography>

                    <Typography variant="body2" sx={{
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                      fontSize: '0.8rem',
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      pr: 1
                    }}>
                      {riesgo.descripcionRiesgo || 'Sin descripción'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tipoRiesgoObj ? (tipoRiesgoObj.nombre || tipoRiesgoObj.codigo) : (riesgo.tipoRiesgo || 'Sin tipo')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subtipoObj ? (subtipoObj.nombre || subtipoObj.codigo) : (riesgo.subtipoRiesgo || 'Sin subtipo')}
                    </Typography>

                    {/* Columna de Clasificación/Nivel de Riesgo */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      {(() => {
                        // Calcular calificación inherente global
                        const causasOrdenadas = [...(riesgo.causas || [])].sort((a, b) => {
                          const idA = Number(a.id) || 0;
                          const idB = Number(b.id) || 0;
                          return idA - idB;
                        });
                        
                        // Calcular calificación inherente para cada causa si no existe
                        const calificacionesInherentes = causasOrdenadas.map(causa => {
                          // Si ya tiene calificación calculada, usarla
                          if (causa.calificacionInherentePorCausa !== undefined && causa.calificacionInherentePorCausa !== null) {
                            return causa.calificacionInherentePorCausa;
                          }
                          
                          // Si no, calcularla usando el servicio
                          try {
                            // Obtener frecuencia (puede ser ID o valor)
                            const frecuencia = causa.frecuencia;
                            // frecuenciasApi está disponible en el scope del componente
                            const pesoFrecuencia = obtenerPesoFrecuencia(frecuencia, frecuenciasApi || []);
                            
                            // Calcular impacto global desde los impactos del riesgo
                            const impactos = riesgo.impactos || {};
                            const calificacionGlobalImpacto = calcularImpactoGlobal(impactos, pesosImpactoApi);
                            
                            // Calcular calificación inherente por causa
                            const calificacion = calcularCalificacionInherentePorCausaSync(
                              pesoFrecuencia,
                              calificacionGlobalImpacto
                            );
                            
                            return calificacion;
                          } catch (error) {
                            console.error('Error al calcular calificación inherente para causa:', error);
                            return 0;
                          }
                        }).filter(cal => cal !== undefined && cal !== null && cal > 0) as number[];
                        
                        let calificacionInherenteGlobal = calificacionesInherentes.length > 0
                          ? Math.max(...calificacionesInherentes)
                          : 0;
                        
                        // Intentar recalcular si hay causas pero calificación es 0
                        if (calificacionInherenteGlobal === 0 && riesgo.causas && riesgo.causas.length > 0) {
                          try {
                            const causasRecalculadas = riesgo.causas.map(causa => {
                              if (causa.calificacionInherentePorCausa !== undefined && causa.calificacionInherentePorCausa !== null && causa.calificacionInherentePorCausa > 0) {
                                return causa.calificacionInherentePorCausa;
                              }
                              
                              // Calcular si no existe
                              const pesoFrecuencia = obtenerPesoFrecuencia(causa.frecuencia, frecuenciasApi || []);
                              const impactos = riesgo.impactos || {};
                              const calificacionGlobalImpacto = calcularImpactoGlobal(impactos, pesosImpactoApi);
                              return calcularCalificacionInherentePorCausaSync(pesoFrecuencia, calificacionGlobalImpacto);
                            }).filter(cal => cal !== undefined && cal !== null && cal > 0) as number[];
                            
                            if (causasRecalculadas.length > 0) {
                              calificacionInherenteGlobal = Math.max(...causasRecalculadas);
                            }
                          } catch (error) {
                            console.error(`[IdentificacionPage] Error al recalcular calificación para riesgo ${riesgo.id}:`, error);
                          }
                        }
                        
                        // Determinar nivel y color usando servicio centralizado
                        let nivel = 'SIN CALIFICAR';
                        let color = '#ffffff'; // Texto blanco para mejor visibilidad
                        let bgColor = '#9e9e9e'; // Fondo gris oscuro para contraste
                        
                        if (calificacionInherenteGlobal > 0) {
                          try {
                            const nivelNombre = determinarNivelRiesgoSync(calificacionInherenteGlobal);
                            nivel = nivelNombre.toUpperCase();
                            
                            // Obtener color desde niveles de riesgo de la configuración del mapa
                            const nivelesRiesgo = nivelesRiesgoApi || [];
                            const nivelConfig = nivelesRiesgo.find((n: any) => 
                              n.nombre?.toUpperCase() === nivelNombre.toUpperCase() ||
                              (n.nombre?.toUpperCase().includes('CRITICO') && nivelNombre.toUpperCase().includes('CRITICO')) ||
                              (n.nombre?.toUpperCase().includes('ALTO') && nivelNombre.toUpperCase().includes('ALTO')) ||
                              (n.nombre?.toUpperCase().includes('MEDIO') && nivelNombre.toUpperCase().includes('MEDIO')) ||
                              (n.nombre?.toUpperCase().includes('BAJO') && nivelNombre.toUpperCase().includes('BAJO'))
                            );
                            
                            if (nivelConfig?.color) {
                              bgColor = nivelConfig.color;
                              color = '#fff';
                            } else {
                              // Fallback si no se encuentra el color
                              if (nivelNombre.toUpperCase().includes('CRITICO')) {
                                bgColor = '#d32f2f';
                              } else if (nivelNombre.toUpperCase().includes('ALTO')) {
                                bgColor = '#f57c00';
                              } else if (nivelNombre.toUpperCase().includes('MEDIO')) {
                                bgColor = '#fbc02d';
                              } else if (nivelNombre.toUpperCase().includes('BAJO')) {
                                bgColor = '#388e3c';
                              }
                              color = '#fff';
                            }
                          } catch (error) {
                            console.error('Error al determinar nivel de riesgo:', error);
                            // Mantener valores por defecto para "SIN CALIFICAR"
                          }
                        } else if (riesgo.causas && riesgo.causas.length > 0) {
                          // Si hay causas pero calificación es 0, loggear advertencia
                          console.warn(`[IdentificacionPage] ⚠️ Riesgo ${riesgo.id} tiene ${riesgo.causas.length} causas pero calificación es 0`);
                        }
                        
                        return (
                          <Chip
                            label={nivel}
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
                          handleEliminarRiesgo(riesgo.id);
                        }}
                        disabled={isReadOnly}
                        color="error"
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'error.light',
                            color: 'error.contrastText'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Contenido expandible */}
                  <Collapse in={estaExpandido}>
                    <Box sx={{ p: 0 }}>
                      <RiesgoFormularioMemo
                        riesgo={{
                          ...riesgo,
                          // Aplicar cambios pendientes si existen
                          ...(cambiosPendientes[riesgo.id] || {}),
                          // Merge de impactos si hay cambios pendientes
                          impactos: cambiosPendientes[riesgo.id]?.impactos 
                            ? { ...riesgo.impactos, ...cambiosPendientes[riesgo.id].impactos }
                            : riesgo.impactos
                        }}
                        actualizarRiesgo={actualizarRiesgo}
                        isReadOnly={isReadOnly}
                        procesoSeleccionado={procesoSeleccionado}
                        onSave={() => handleSave(riesgo.id)}
                        onAgregarCausa={(riesgoId) => {
                          setRiesgoIdParaCausa(riesgoId);
                          setCausaEditando(null);
                          setNuevaCausaDescripcion('');
                          // Establecer primera fuente disponible
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
                          
                          // Buscar el ID de la fuente correspondiente al nombre
                          let fuenteId = ''; // Default vacío
                          if (causa.fuenteCausa) {
                            if (Array.isArray(fuentesCausa)) {
                              const fuenteObj = fuentesCausa.find((f: any) => 
                                f.nombre === causa.fuenteCausa || 
                                String(f.id) === String(causa.fuenteCausa) ||
                                String(f.codigo) === String(causa.fuenteCausa)
                              );
                              if (fuenteObj) {
                                fuenteId = String(fuenteObj.id ?? fuenteObj.codigo ?? fuenteObj.nombre ?? '');
                              }
                            } else if (typeof fuentesCausa === 'object') {
                              // Buscar en el objeto por nombre o clave
                              const found = Object.entries(fuentesCausa).find(([key, value]: [string, any]) => 
                                value?.nombre === causa.fuenteCausa || 
                                key === String(causa.fuenteCausa)
                              );
                              if (found) {
                                fuenteId = found[0];
                              }
                            }
                          }
                          
                          // Si no se encontró, usar la primera fuente disponible
                          if (!fuenteId) {
                            if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
                              const f = fuentesCausa[0];
                              fuenteId = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
                            } else if (typeof fuentesCausa === 'object' && Object.keys(fuentesCausa).length > 0) {
                              fuenteId = Object.keys(fuentesCausa)[0];
                            }
                          }
                          
                          setNuevaCausaFuente(fuenteId);
                          // Convertir frecuencia de string a number si es necesario
                          const frecuenciaNum = typeof causa.frecuencia === 'string' 
                            ? parseInt(causa.frecuencia) || 3 
                            : (causa.frecuencia || 3);
                          setNuevaCausaFrecuencia(frecuenciaNum);
                          setDialogCausaOpen(true);
                        }}
                        onEliminarCausa={(riesgoId, causaId) => {
                          // Abrir modal de confirmación en lugar de eliminar directamente
                          setCausaPendienteEliminar({
                            riesgoId: String(riesgoId),
                            causaId: String(causaId),
                          });
                          setConfirmDeleteOpen(true);
                        }}
                        causaEliminando={causaEliminando}
                        tiposRiesgos={tiposRiesgos}
                        origenes={origenes}
                        tiposProceso={tiposProceso}
                        consecuencias={consecuencias}
                        objetivos={objetivos}
                        labelsFrecuencia={labelsFrecuencia}
                        fuentesCausa={fuentesCausa}
                        descripcionesImpacto={descripcionesImpacto}
                      />

                      {/* Resumen de Calificaciones */}
                      {(() => {
                        // Ordenar causas por ID ascendente para numeración consistente
                        const causasOrdenadas = [...(riesgo.causas || [])].sort((a, b) => {
                          const idA = Number(a.id) || 0;
                          const idB = Number(b.id) || 0;
                          return idA - idB;
                        });

                        // Calcular la calificación inherente global (máximo de todas las causas)
                        const calificacionesInherentes = causasOrdenadas
                          .map(causa => causa.calificacionInherentePorCausa)
                          .filter(cal => cal !== undefined && cal !== null) as number[];

                        const calificacionInherenteGlobal = calificacionesInherentes.length > 0
                          ? Math.max(...calificacionesInherentes)
                          : 0;

                        // Determinar el nivel de riesgo según la calificación
                        // Determinar el nivel de riesgo usando el catálogo dinámico (cargado en hook o contexto idealmente, aquí simulado acceso directo o props)
                        // Nota: En una refactorización completa, estos niveles deberían venir de props o context.
                        // Por ahora, usaremos los valores hardcoded PERO alineados con lo que el usuario pidió centralizar,
                        // o mejor, usaremos una función helper que busque en el catálogo si estuviéramos pasando el catálogo.
                        // Dado que no tengo el catálogo en el scope de este map, lo haré hardcoded pero referenciando la estructura centralizada si es posible,
                        // o mejor, moveré esta lógica a una utilidad centralizada que use la configuración.

                        // SIN EMBARGO, para cumplir con el requerimiento de "traer del mock data",
                        // Deberíamos haber cargado los niveles en el estado del componente.
                        // Como este es un bloque de renderizado dentro de un map, no puedo llamar hooks aquí.
                        // Asumiré que los niveles siguen la lógica estándar por ahora, pero lo ideal es pasar 'nivelesRiesgo' como prop si fuera un componente separado.

                        // VOY A CAMBIAR ESTO para usar una función de utilidad importada que actúe sobre los datos centralizados,
                        // O mejor, definiré los niveles fuera del renderizado si son estáticos por ahora, o los leeré de props.

                        // Usar servicio centralizado y colores de la configuración del mapa
                        const getNivelRiesgoSync = (calificacion: number): { nivel: string; color: string; bgColor: string } => {
                          if (calificacion === 0) return { nivel: 'Sin Calificar', color: '#666', bgColor: '#f5f5f5' };
                          
                          try {
                            const nivelNombre = determinarNivelRiesgoSync(calificacion);
                            
                            // Obtener color desde niveles de riesgo de la configuración del mapa
                            const nivelesRiesgo = nivelesRiesgoApi || [];
                            const nivel = nivelesRiesgo.find((n: any) => 
                              n.nombre?.toUpperCase() === nivelNombre.toUpperCase() ||
                              (n.nombre?.toUpperCase().includes('CRITICO') && nivelNombre.toUpperCase().includes('CRITICO')) ||
                              (n.nombre?.toUpperCase().includes('ALTO') && nivelNombre.toUpperCase().includes('ALTO')) ||
                              (n.nombre?.toUpperCase().includes('MEDIO') && nivelNombre.toUpperCase().includes('MEDIO')) ||
                              (n.nombre?.toUpperCase().includes('BAJO') && nivelNombre.toUpperCase().includes('BAJO'))
                            );
                            
                            const bgColor = nivel?.color || '#666';
                            return { 
                              nivel: nivelNombre.toUpperCase(), 
                              color: '#fff', 
                              bgColor 
                            };
                          } catch (error) {
                            console.error('Error al determinar nivel de riesgo:', error);
                            // Último fallback: usar configuración por defecto
                            return { nivel: 'SIN CALIFICAR', color: '#ffffff', bgColor: '#9e9e9e' };
                          }
                        };

                        // Solo calcular nivel si hay una calificación válida (> 0)
                        const nivelInfo = calificacionInherenteGlobal > 0 
                          ? getNivelRiesgoSync(calificacionInherenteGlobal)
                          : { nivel: 'SIN CALIFICAR', color: '#ffffff', bgColor: '#9e9e9e' };
                        
                        // Solo loggear si hay una calificación válida para evitar spam en consola
                        if (calificacionInherenteGlobal > 0) {
                          console.log(`[IdentificacionPage] Nivel de riesgo calculado para ${calificacionInherenteGlobal}:`, nivelInfo);
                        }

                        return (
                          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                              Resumen de Calificaciones del Riesgo Inherente
                            </Typography>

                            {/* Tabla de calificaciones por causa */}
                            {causasOrdenadas.length > 0 ? (
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
                                    {causasOrdenadas.map((causa, index) => (
                                      <TableRow key={causa.id}>
                                        <TableCell>
                                          <Typography variant="body2">
                                            Causa {index + 1}: {causa.descripcion.length > 60
                                              ? `${causa.descripcion.substring(0, 60)}...`
                                              : causa.descripcion}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Chip
                                            label={labelsFrecuencia[causa.frecuencia || 3]?.label || 'N/A'}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2" fontWeight={600}>
                                            {causa.calificacionGlobalImpacto !== undefined
                                              ? causa.calificacionGlobalImpacto.toFixed(2)
                                              : 'N/A'}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2" fontWeight={600}>
                                            {causa.calificacionInherentePorCausa !== undefined
                                              ? causa.calificacionInherentePorCausa.toFixed(2)
                                              : 'N/A'}
                                          </Typography>
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

                            {/* Calificación Inherente Global del Riesgo */}
                            <Box
                              sx={{
                                p: 2,
                                backgroundColor: nivelInfo.bgColor,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box>
                                <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.9 }}>
                                  CALIFICACIÓN DEL RIESGO INHERENTE GLOBAL
                                </Typography>
                                <Typography variant="h5" sx={{ color: nivelInfo.color, fontWeight: 700, mt: 0.5 }}>
                                  {calificacionInherenteGlobal > 0 ? calificacionInherenteGlobal.toFixed(2) : 'N/A'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: nivelInfo.color, opacity: 0.8, mt: 0.5, display: 'block' }}>
                                  (Máximo de todas las calificaciones inherentes por causa)
                                </Typography>
                              </Box>
                              <Chip
                                label={nivelInfo.nivel}
                                sx={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  color: nivelInfo.color,
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
            
            {/* Paginación */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                <Stack spacing={2}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => {
                      setCurrentPage(value);
                      // Scroll al inicio de la lista
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalRiesgos)} de {totalRiesgos} riesgos
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </>


      {/* Contenido del Tab RESIDUAL */}

      {/* Diálogo para agregar/editar causa */}
      <Dialog open={dialogCausaOpen} onClose={() => {
        setDialogCausaOpen(false);
        setCausaEditando(null);
        setNuevaCausaDescripcion('');
        // Resetear a primera fuente disponible
        let primeraFuente = '';
        if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
          const f = fuentesCausa[0];
          primeraFuente = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
        } else if (typeof fuentesCausa === 'object' && Object.keys(fuentesCausa).length > 0) {
          primeraFuente = Object.keys(fuentesCausa)[0];
        }
        setNuevaCausaFuente(primeraFuente);
        setNuevaCausaFrecuencia(3);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa' : 'Agregar Causa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Descripción de la Causa"
              multiline
              rows={3}
              value={nuevaCausaDescripcion}
              onChange={(e) => setNuevaCausaDescripcion(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Fuente</InputLabel>
              <Select
                value={nuevaCausaFuente}
                onChange={(e) => setNuevaCausaFuente(e.target.value)}
                label="Fuente"
              >
                {/* Soportar fuentes como array de objetos o como mapa {id: nombre} */}
                {Array.isArray(fuentesCausa)
                  ? fuentesCausa.map((f: any) => (
                    <MenuItem key={f.id ?? f.nombre ?? f} value={String(f.id ?? f.nombre ?? f)}>
                      {f.nombre ?? String(f)}
                    </MenuItem>
                  ))
                  : Object.entries(fuentesCausa).map(([key, value]) => (
                    <MenuItem key={key} value={key}>{(value as any)?.nombre ?? String(value)}</MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frecuencia</InputLabel>
              <Select
                value={nuevaCausaFrecuencia}
                onChange={(e) => setNuevaCausaFrecuencia(Number(e.target.value))}
                label="Frecuencia"
              >
                {(Object.entries(labelsFrecuencia) as [string, { label: string; descripcion: string }][]).map(([key, value]) => (
                  <MenuItem key={key} value={Number(key)}>
                    {value.label} - {value.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCausaOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              try {
                // Calcular calificaciones para la nueva causa
                const riesgo = riesgos.find(r => r.id === riesgoIdParaCausa);
                if (!riesgo) {
                  showError('No se encontró el riesgo');
                  return;
                }

                const calificacionGlobalImpacto = calcularCalificacionGlobalImpacto(riesgo.impactos);
                const calificacionInherente = calcularCalificacionInherentePorCausa(
                  calificacionGlobalImpacto,
                  nuevaCausaFrecuencia
                );

                // Obtener el nombre de la fuente desde el catálogo
                let fuenteNombre = '';
                if (Array.isArray(fuentesCausa)) {
                  const fuenteObj = fuentesCausa.find((f: any) => String(f.id ?? f.nombre ?? f) === nuevaCausaFuente);
                  fuenteNombre = fuenteObj?.nombre ?? nuevaCausaFuente;
                } else if (typeof fuentesCausa === 'object') {
                  fuenteNombre = (fuentesCausa as any)[nuevaCausaFuente]?.nombre ?? nuevaCausaFuente;
                } else {
                  fuenteNombre = nuevaCausaFuente;
                }

                if (causaEditando) {
                  // ACTUALIZAR causa existente
                  const causaData = {
                    descripcion: nuevaCausaDescripcion,
                    fuenteCausa: fuenteNombre,
                    frecuencia: nuevaCausaFrecuencia,
                  };

                  const riesgoIdNumUpdate = Number(riesgoIdParaCausa);
                  await api.riesgos.causas.update(Number(causaEditando.id), causaData);
                  
                  // Recalcular y guardar calificación inherente global después de actualizar causa
                  if (riesgoIdNumUpdate && !isNaN(riesgoIdNumUpdate)) {
                    await recalcularYGuardarCalificacionInherenteGlobal(riesgoIdNumUpdate);
                  }
                  
                  // Recargar solo los riesgos del proceso seleccionado
                  if (procesoSeleccionado?.id) {
                    await cargarRiesgos({ procesoId: procesoSeleccionado.id, includeCausas: true });
                  } else {
                    await cargarRiesgos({ includeCausas: true });
                  }
                  // Invalidar caché del mapa para forzar actualización inmediata
                  dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
                  // Disparar evento para que el mapa se actualice
                  window.dispatchEvent(new CustomEvent('riesgo-actualizado', { detail: { riesgoId: riesgoIdNumUpdate } }));
                  showSuccess('Causa actualizada correctamente');
                } else {
                  // CREAR nueva causa
                  if (!nuevaCausaDescripcion.trim()) {
                    showError('La descripción de la causa es requerida');
                    return;
                  }
                  
                  const riesgoIdNum = Number(riesgoIdParaCausa);
                  if (!riesgoIdNum || isNaN(riesgoIdNum)) {
                    showError('ID de riesgo inválido');
                    return;
                  }

                  const causaData = {
                    riesgoId: riesgoIdNum,
                    descripcion: nuevaCausaDescripcion.trim(),
                    fuenteCausa: fuenteNombre || null,
                    frecuencia: nuevaCausaFrecuencia,
                    seleccionada: true
                  };

                  await api.riesgos.causas.create(causaData);

                  // Recalcular y guardar calificación inherente global después de crear causa
                  await recalcularYGuardarCalificacionInherenteGlobal(riesgoIdNum);

                  // Recargar solo los riesgos del proceso seleccionado
                  if (procesoSeleccionado?.id) {
                    await cargarRiesgos({ procesoId: procesoSeleccionado.id, includeCausas: true });
                  } else {
                    await cargarRiesgos({ includeCausas: true });
                  }
                  // Invalidar caché del mapa para forzar actualización inmediata
                  dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
                  // Disparar evento para que el mapa se actualice
                  window.dispatchEvent(new CustomEvent('riesgo-actualizado', { detail: { riesgoId: riesgoIdNum } }));
                  showSuccess('Causa agregada correctamente');
                }
                
                // Limpiar formulario y cerrar diálogo
                setDialogCausaOpen(false);
                setCausaEditando(null);
                setNuevaCausaDescripcion('');
                // Resetear a primera fuente disponible
                let primeraFuente = '';
                if (Array.isArray(fuentesCausa) && fuentesCausa.length > 0) {
                  const f = fuentesCausa[0];
                  primeraFuente = String(f?.id ?? f?.codigo ?? f?.nombre ?? '');
                } else if (typeof fuentesCausa === 'object' && Object.keys(fuentesCausa).length > 0) {
                  primeraFuente = Object.keys(fuentesCausa)[0];
                }
                setNuevaCausaFuente(primeraFuente);
                setNuevaCausaFrecuencia(3);
              } catch (error) {
                console.error('Error al guardar causa:', error);
                showError(causaEditando ? 'Error al actualizar causa' : 'Error al agregar causa');
              }
            }}
          >
            {causaEditando ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Evaluación de Control por Causa */}
      <Dialog open={dialogEvaluacionOpen} onClose={() => setDialogEvaluacionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Evaluación de Control - Causa
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Aplicabilidad */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Aplicabilidad</InputLabel>
                <Select
                  value={criteriosEvaluacion.aplicabilidad}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'totalmente') puntaje = 100;
                    else if (val === 'parcial') puntaje = 30;
                    else if (val === 'nula') puntaje = 0;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      aplicabilidad: val,
                      puntajeAplicabilidad: puntaje,
                    }));
                  }}
                  label="Aplicabilidad"
                >
                  <MenuItem value="totalmente">Totalmente Aplicable (100)</MenuItem>
                  <MenuItem value="parcial">Parcialmente Aplicable (30)</MenuItem>
                  <MenuItem value="nula">No Aplicable (0)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeAplicabilidad}
              </Typography>
            </Box>

            {/* Cobertura */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Cobertura</InputLabel>
                <Select
                  value={criteriosEvaluacion.cobertura}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'total') puntaje = 100;
                    else if (val === 'significativa') puntaje = 70;
                    else if (val === 'minima') puntaje = 10;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      cobertura: val,
                      puntajeCobertura: puntaje,
                    }));
                  }}
                  label="Cobertura"
                >
                  <MenuItem value="total">Cobertura Total (100)</MenuItem>
                  <MenuItem value="significativa">Cobertura Significativa (70)</MenuItem>
                  <MenuItem value="minima">Cobertura Mínima (10)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeCobertura}
              </Typography>
            </Box>

            {/* Facilidad de Uso */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Facilidad de Uso</InputLabel>
                <Select
                  value={criteriosEvaluacion.facilidadUso}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'facil') puntaje = 100;
                    else if (val === 'moderada') puntaje = 70;
                    else if (val === 'dificil') puntaje = 30;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      facilidadUso: val,
                      puntajeFacilidad: puntaje,
                    }));
                  }}
                  label="Facilidad de Uso"
                >
                  <MenuItem value="facil">Fácil de Usar (100)</MenuItem>
                  <MenuItem value="moderada">Facilidad Moderada (70)</MenuItem>
                  <MenuItem value="dificil">Difícil de Usar (30)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeFacilidad}
              </Typography>
            </Box>

            {/* Segregación */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Segregación</InputLabel>
                <Select
                  value={criteriosEvaluacion.segregacion}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'si') puntaje = 100;
                    else if (val === 'no') puntaje = 0;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      segregacion: val,
                      puntajeSegregacion: puntaje,
                    }));
                  }}
                  label="Segregación"
                >
                  <MenuItem value="si">Sí Segregado (100)</MenuItem>
                  <MenuItem value="no">No Segregado (0)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeSegregacion}
              </Typography>
            </Box>

            {/* Naturaleza del Control */}
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Naturaleza del Control</InputLabel>
                <Select
                  value={criteriosEvaluacion.naturaleza}
                  onChange={(e) => {
                    const val = e.target.value;
                    let puntaje = 0;
                    if (val === 'preventivo') puntaje = 100;
                    else if (val === 'detective') puntaje = 60;
                    else if (val === 'correctivo') puntaje = 40;

                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      naturaleza: val,
                      puntajeNaturaleza: puntaje,
                    }));
                  }}
                  label="Naturaleza"
                >
                  <MenuItem value="preventivo">Preventivo (100)</MenuItem>
                  <MenuItem value="detective">Detective (60)</MenuItem>
                  <MenuItem value="correctivo">Correctivo (40)</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Puntaje: {criteriosEvaluacion.puntajeNaturaleza}
              </Typography>
            </Box>

            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de Mitigación</InputLabel>
                <Select
                  value={criteriosEvaluacion.tipoMitigacion}
                  onChange={(e) => {
                    setCriteriosEvaluacion(prev => ({
                      ...prev,
                      tipoMitigacion: e.target.value as 'FRECUENCIA' | 'IMPACTO' | 'AMBAS',
                    }));
                  }}
                  label="Tipo de Mitigación"
                >
                  <MenuItem value="FRECUENCIA">Mitigación de Frecuencia</MenuItem>
                  <MenuItem value="IMPACTO">Mitigación de Impacto</MenuItem>
                  <MenuItem value="AMBAS">Mitigación de Ambas</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Recomendación"
                multiline
                rows={2}
                size="small"
                value={criteriosEvaluacion.recomendacion || ''}
                onChange={(e) => {
                  setCriteriosEvaluacion(prev => ({
                    ...prev,
                    recomendacion: e.target.value,
                  }));
                }}
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Cálculo de Puntaje Total y Evaluaciones */}
            {(() => {
              const puntajeTotal = calcularPuntajeControl(
                criteriosEvaluacion.puntajeAplicabilidad,
                criteriosEvaluacion.puntajeCobertura,
                criteriosEvaluacion.puntajeFacilidad,
                criteriosEvaluacion.puntajeSegregacion,
                criteriosEvaluacion.puntajeNaturaleza
              );

              // Evaluación preliminar (basada en puntaje)
              const evaluacionPreliminar = determinarEvaluacionPreliminar(puntajeTotal);

              // Evaluación definitiva (puede ajustarse por recomendación)
              const evaluacionDefinitiva = determinarEvaluacionDefinitiva(
                evaluacionPreliminar,
                criteriosEvaluacion.recomendacion
              );

              // % Mitigación según evaluación definitiva
              const porcentajeMitigacion = obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva);

              const getEfectividadColor = (efectividad: string) => {
                if (efectividad === 'Altamente Efectivo') return '#4caf50';
                if (efectividad === 'Efectivo') return '#8bc34a';
                if (efectividad === 'Medianamente Efectivo') return '#fbc02d';
                if (efectividad === 'Baja Efectividad') return '#ff9800';
                return '#f44336';
              };

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Card sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                      PUNTAJE Y EVALUACIÓN
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Puntaje Total
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {puntajeTotal.toFixed(0)} / 100
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Eval. Preliminar
                        </Typography>
                        <Chip
                          label={evaluacionPreliminar}
                          size="small"
                          sx={{
                            backgroundColor: getEfectividadColor(evaluacionPreliminar),
                            color: '#fff',
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Eval. Definitiva
                        </Typography>
                        <Chip
                          label={evaluacionDefinitiva}
                          size="small"
                          sx={{
                            backgroundColor: getEfectividadColor(evaluacionDefinitiva),
                            color: '#fff',
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          % Mitigación
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {(porcentajeMitigacion * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              );
            })()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEvaluacionOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const riesgo = riesgos.find(r => r.id === riesgoIdEvaluacion);
              if (riesgo) {
                const causasActualizadas = riesgo.causas.map(c => {
                  if (c.id === causaIdEvaluacion) {
                    const puntajeTotal = calcularPuntajeControl(
                      criteriosEvaluacion.puntajeAplicabilidad,
                      criteriosEvaluacion.puntajeCobertura,
                      criteriosEvaluacion.puntajeFacilidad,
                      criteriosEvaluacion.puntajeSegregacion,
                      criteriosEvaluacion.puntajeNaturaleza
                    );

                    const evaluacionPreliminar = determinarEvaluacionPreliminar(puntajeTotal);
                    const evaluacionDefinitiva = determinarEvaluacionDefinitiva(
                      evaluacionPreliminar,
                      criteriosEvaluacion.recomendacion
                    );
                    const porcentajeMitigacion = obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva);

                    // Calcular residuales usando el tipo de mitigación
                    const frecuenciaInherente = c.frecuencia || 1;
                    const impactoInherente = c.calificacionGlobalImpacto || 1;

                    const frecuenciaResidual = calcularFrecuenciaResidualAvanzada(
                      frecuenciaInherente,
                      impactoInherente,
                      porcentajeMitigacion,
                      criteriosEvaluacion.tipoMitigacion
                    );

                    const impactoResidual = calcularImpactoResidualAvanzado(
                      impactoInherente,
                      frecuenciaInherente,
                      porcentajeMitigacion,
                      criteriosEvaluacion.tipoMitigacion
                    );

                    const calificacionResidual = calcularCalificacionResidual(
                      frecuenciaResidual,
                      impactoResidual
                    );

                    return {
                      ...c,
                      ...criteriosEvaluacion,
                      puntajeTotal,
                      evaluacionPreliminar,
                      evaluacionDefinitiva,
                      efectividadControl: evaluacionDefinitiva,
                      frecuenciaResidual,
                      impactoResidual,
                      calificacionResidual,
                      porcentajeMitigacion,
                    };
                  }
                  return c;
                });

                actualizarRiesgo(riesgoIdEvaluacion, { causas: causasActualizadas });
                setDialogEvaluacionOpen(false);
              }
            }}
          >
            Guardar Evaluación
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG DETALLE CAUSA */}
      <Dialog open={causaDetalleOpen} onClose={() => setCausaDetalleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>Detalle de la Causa</DialogTitle>
        <DialogContent dividers>
          {causaSeleccionadaDetalle && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Descripción</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{causaSeleccionadaDetalle.descripcion}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Fuente</Typography>
                  <Typography variant="body2">{getFuenteLabel(fuentesCausa, causaSeleccionadaDetalle.fuenteCausa) || 'Interna'}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Frecuencia</Typography>
                  <Typography variant="body2">{labelsFrecuencia[causaSeleccionadaDetalle.frecuencia || 3]?.label || 'Media'}</Typography>
                </Box>
              </Box>
              <Divider />
              <Typography variant="subtitle2" color="primary">Calificación Inherente</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block' }}>Impacto Global</Typography>
                  <Typography variant="h6">{causaSeleccionadaDetalle.calificacionGlobalImpacto?.toFixed(2) || '1.00'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>Calif. Inherente</Typography>
                  <Typography variant="h6" color="error">{causaSeleccionadaDetalle.calificacionInherentePorCausa?.toFixed(2) || '0.00'}</Typography>
                </Box>
              </Box>

              {causaSeleccionadaDetalle.puntajeTotal !== undefined && (
                <>
                  <Divider />
                  <Typography variant="subtitle2" color="primary">Evaluación de Control</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="caption">Efectividad:</Typography>
                    <Typography variant="body2" fontWeight="bold">{causaSeleccionadaDetalle.evaluacionDefinitiva}</Typography>
                    <Typography variant="caption">Mitigación:</Typography>
                    <Typography variant="body2" fontWeight="bold">{(causaSeleccionadaDetalle.porcentajeMitigacion || 0) * 100}%</Typography>
                    <Typography variant="caption">Calif. Residual:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">{causaSeleccionadaDetalle.calificacionResidual?.toFixed(2)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCausaDetalleOpen(false)} variant="contained" color="secondary">Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación para eliminar causa */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => {
          if (causaEliminando) return; // mientras está eliminando, no cerrar manual
          setConfirmDeleteOpen(false);
          setCausaPendienteEliminar(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eliminar causa</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            ¿Seguro que desea eliminar esta causa? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              if (causaEliminando) return;
              setConfirmDeleteOpen(false);
              setCausaPendienteEliminar(null);
            }}
            disabled={!!causaEliminando}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!causaPendienteEliminar || causaEliminando) return;
              const { causaId } = causaPendienteEliminar;
              setCausaEliminando(causaId);
              try {
                const riesgoIdNum = causaPendienteEliminar ? Number(causaPendienteEliminar.riesgoId) : null;
                await api.riesgos.causas.delete(Number(causaId));
                
                // Recalcular y guardar calificación inherente global después de eliminar causa
                if (riesgoIdNum) {
                  await recalcularYGuardarCalificacionInherenteGlobal(riesgoIdNum);
                }
                
                // Recargar solo los riesgos del proceso seleccionado
                if (procesoSeleccionado?.id) {
                  await cargarRiesgos({ procesoId: procesoSeleccionado.id, includeCausas: true });
                } else {
                  await cargarRiesgos({ includeCausas: true });
                }
                // Invalidar caché del mapa para forzar actualización inmediata
                dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
                // Disparar evento para que el mapa se actualice
                if (riesgoIdNum) {
                  window.dispatchEvent(new CustomEvent('riesgo-actualizado', { detail: { riesgoId: riesgoIdNum } }));
                }
                showSuccess('Causa eliminada correctamente');
              } catch (error) {
                console.error('Error al eliminar causa:', error);
                showError('Error al eliminar causa');
              } finally {
                setCausaEliminando(null);
                setConfirmDeleteOpen(false);
                setCausaPendienteEliminar(null);
              }
            }}
          >
            {causaEliminando ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </AppPageLayout>
  );
}

// Componente para el formulario de un riesgo individual
// OPTIMIZADO: Memoizado para evitar re-renders innecesarios
const RiesgoFormularioMemo = memo(function RiesgoFormulario({
  riesgo,
  actualizarRiesgo,
  isReadOnly,
  procesoSeleccionado,
  onSave,
  onAgregarCausa,
  onEditarCausa,
  onEliminarCausa,
  tiposRiesgos,
  origenes,
  tiposProceso,
  consecuencias,
  objetivos,
  labelsFrecuencia,
  fuentesCausa,
  descripcionesImpacto,
  causaEliminando,
}: {
  riesgo: RiesgoFormData;
  actualizarRiesgo: (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => void;
  isReadOnly: boolean;
  procesoSeleccionado: any;
  onSave: () => void;
  onAgregarCausa: (riesgoId: string) => void;
  onEditarCausa: (riesgoId: string, causa: CausaRiesgo) => void;
  onEliminarCausa: (riesgoId: string, causaId: string) => void;
  causaEliminando?: string | null;
  // Dynamic props
  tiposRiesgos: any[];
  origenes: any[];
  tiposProceso: any[];
  consecuencias: any[];
  objetivos: any[];
  labelsFrecuencia: any;
  fuentesCausa: any;
  descripcionesImpacto: any;
}) {
  const tipoRiesgoSeleccionado = useMemo(() => {
    return (tiposRiesgos || []).find(t => 
      t.nombre === riesgo.tipoRiesgo || 
      t.codigo === riesgo.tipoRiesgo ||
      String(t.id) === String(riesgo.tipoRiesgo)
    ) || null;
  }, [riesgo.tipoRiesgo, tiposRiesgos]);

  const impactos: RiesgoFormData['impactos'] = {
    economico: 1,
    procesos: 1,
    legal: 1,
    confidencialidadSGSI: 1,
    reputacion: 1,
    disponibilidadSGSI: 1,
    personas: 1,
    integridadSGSI: 1,
    ambiental: 1,
    ...(riesgo.impactos || {})
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Panel RIESGO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "RIESGO" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            RIESGO
          </Typography>
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
          {/* Campos del riesgo en dos columnas */}
          <Grid2 container spacing={2}>
            {/* Columna izquierda - incluye descripción */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Descripción del riesgo - Campo más pequeño */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción del Riesgo"
                  value={riesgo.descripcionRiesgo}
                  onChange={(e) => actualizarRiesgo(riesgo.id, { descripcionRiesgo: e.target.value })}
                  disabled={isReadOnly}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.9rem',
                    },
                  }}
                />
                {/* Origen del riesgo */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ width: '40%', fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Origen del riesgo
                        </TableCell>
                        <TableCell sx={{ width: '60%' }}>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.origenRiesgo || ''}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { origenRiesgo: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                            >
                              {(!origenes || origenes.length === 0) ? (
                                <MenuItem value={riesgo.origenRiesgo || ''}>{riesgo.origenRiesgo || 'Seleccionar'}</MenuItem>
                              ) : (
                                origenes.map((o) => (
                                  <MenuItem key={o.id} value={o.nombre}>{o.nombre}</MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          # Identificación
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={riesgo.numeroIdentificacion || ''}
                            disabled={true}
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipo de Proceso
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={riesgo.proceso?.tipo || procesoSeleccionado?.tipo || 'Operacional'}
                            disabled={true}
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Proceso
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={procesoSeleccionado?.nombre || ''}
                            disabled
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Consecuencia
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.consecuencia || ''}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { consecuencia: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                            >
                              {(!consecuencias || consecuencias.length === 0) ? (
                                <MenuItem value={riesgo.consecuencia || ''}>{riesgo.consecuencia || 'Seleccionar'}</MenuItem>
                              ) : (
                                consecuencias.map((c) => (
                                  <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>

            {/* Columna derecha */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {/* Tipo de Riesgo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipo de Riesgo
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            value={riesgo.tipoRiesgo ? (() => {
                              // Buscar por codigo (texto) o por id (número) para compatibilidad
                              const tipo = (tiposRiesgos ||  []).find(t => 
                                t.codigo === riesgo.tipoRiesgo || 
                                t.nombre === riesgo.tipoRiesgo ||
                                String(t.id) === riesgo.tipoRiesgo
                              );
                              return tipo || null;
                            })() : null}
                            onChange={(_, newValue) => {
                              if (newValue) {
                                // Guardar el nombre (texto) en lugar del ID
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: newValue.nombre || newValue.codigo, subtipoRiesgo: '' });
                              } else {
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: '', subtipoRiesgo: '' });
                              }
                            }}
                            options={tiposRiesgos || []}
                            getOptionLabel={(option) => option.nombre || option.codigo}
                            disabled={isReadOnly}
                            size="small"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="standard"
                                placeholder="Buscar tipo de riesgo..."
                                sx={{ fontSize: '0.875rem' }}
                                InputProps={{
                                  ...params.InputProps,
                                  disableUnderline: true,
                                }}
                              />
                            )}
                            sx={{
                              width: '100%',
                              '& .MuiAutocomplete-input': {
                                fontSize: '0.875rem',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-inputRoot': {
                                flexWrap: 'wrap',
                              },
                              '& .MuiAutocomplete-tag': {
                                maxWidth: '100%',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-popper': {
                                '& .MuiAutocomplete-paper': {
                                  width: '100%',
                                  minWidth: '100%',
                                  maxHeight: '400px',
                                },
                              },
                            }}
                            ListboxProps={{
                              sx: {
                                maxHeight: '400px',
                              },
                            }}
                            renderOption={(props, option) => (
                              <Tooltip
                                title={option.descripcion || ''}
                                placement="right"
                                arrow
                                enterDelay={300}
                              >
                                <Box component="li" {...props} sx={{ py: 0.75 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                    {option.nombre || option.codigo}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            )}
                            filterOptions={(options, { inputValue }) => {
                              const searchTerm = (inputValue ?? '').toLowerCase();
                              return options.filter((option) => {
                                const codigo = (option.codigo ?? '').toLowerCase();
                                const nombre = (option.nombre ?? '').toLowerCase();
                                const descripcion = (option.descripcion ?? '').toLowerCase();
                                return codigo.includes(searchTerm) || nombre.includes(searchTerm) || descripcion.includes(searchTerm);
                              });
                            }}
                          />
                        </TableCell>
                      </TableRow>

                      {/* Descripción del Tipo de Riesgo */}
                      {riesgo.tipoRiesgo && tipoRiesgoSeleccionado && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                              {tipoRiesgoSeleccionado.descripcion}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Subtipo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Subtipo
                        </TableCell>
                        <TableCell>
                          {riesgo.tipoRiesgo && tipoRiesgoSeleccionado ? (
                            <Autocomplete
                              value={riesgo.subtipoRiesgo ? (()  => {
                                const tipoObj = (tiposRiesgos || []).find(t => 
                                  t.nombre === riesgo.tipoRiesgo || 
                                  t.codigo === riesgo.tipoRiesgo ||
                                  String(t.id) === String(riesgo.tipoRiesgo)
                                );
                                if (!tipoObj) return null;
                                // Buscar subtipo por nombre, codigo o id
                                return tipoObj.subtipos.find((s: any) => 
                                  s.nombre === riesgo.subtipoRiesgo ||
                                  s.codigo === riesgo.subtipoRiesgo ||
                                  getSubtipoCodigo(s) === riesgo.subtipoRiesgo ||
                                  String(s.id) === String(riesgo.subtipoRiesgo)
                                ) || null;
                              })() : null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  // Guardar el nombre (texto) en lugar del ID
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: newValue.nombre || newValue.codigo });
                                } else {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: '' });
                                }
                              }}
                              options={tipoRiesgoSeleccionado.subtipos}
                              getOptionLabel={(option) => option.nombre || option.codigo || getSubtipoCodigo(option)}
                              disabled={isReadOnly}
                              size="small"
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="standard"
                                  placeholder="Buscar subtipo..."
                                  sx={{ fontSize: '0.875rem' }}
                                  InputProps={{
                                    ...params.InputProps,
                                    disableUnderline: true,
                                  }}
                                />
                              )}
                              sx={{
                                width: '100%',
                                '& .MuiAutocomplete-input': {
                                  fontSize: '0.875rem',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-inputRoot': {
                                  flexWrap: 'wrap',
                                },
                                '& .MuiAutocomplete-tag': {
                                  maxWidth: '100%',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-popper': {
                                  '& .MuiAutocomplete-paper': {
                                    width: '100%',
                                    minWidth: '100%',
                                    maxHeight: '400px',
                                  },
                                },
                              }}
                              ListboxProps={{
                                sx: {
                                  maxHeight: '400px',
                                },
                              }}
                              renderOption={(props, option) => (
                                <Tooltip
                                  title={option.descripcion || ''}
                                  placement="right"
                                  arrow
                                  enterDelay={300}
                                >
                                  <Box component="li" {...props} sx={{ py: 0.75 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                      {option.nombre || option.codigo || getSubtipoCodigo(option)}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                              filterOptions={(options, { inputValue }) => {
                                const searchTerm = (inputValue ?? '').toLowerCase();
                                return options.filter((option) => {
                                  const codigo = (option.codigo ?? '').toLowerCase();
                                  const descripcion = (option.descripcion ?? '').toLowerCase();
                                  return codigo.includes(searchTerm) || descripcion.includes(searchTerm);
                                });
                              }}
                            />
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              value=""
                              disabled
                              placeholder="Seleccione primero un tipo de riesgo"
                              variant="standard"
                              sx={{ fontSize: '0.875rem' }}
                              InputProps={{ disableUnderline: true }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Descripción del Subtipo */}
                      {riesgo.subtipoRiesgo && riesgo.tipoRiesgo && (() => {
                        const tipoObj = (tiposRiesgos || []).find(t => t.codigo === riesgo.tipoRiesgo);
                        const subtipoObj = tipoObj?.subtipos.find((s: any) => getSubtipoCodigo(s) === riesgo.subtipoRiesgo);
                        return subtipoObj ? (
                          <TableRow>
                            <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                {subtipoObj.descripcion}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : null;
                      })()}

                      {/* Objetivo */}
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Objetivo
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <InputLabel id="objetivo-label" sx={{ fontSize: '0.875rem' }}>
                              Seleccione un objetivo
                            </InputLabel>
                            <Select
                              labelId="objetivo-label"
                              value={riesgo.objetivo || ''}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { objetivo: e.target.value })}
                              label="Seleccione un objetivo"
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccione un objetivo</span>;
                                }
                                return (
                                  <span style={{
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    display: 'block',
                                    maxWidth: '100%'
                                  }}>
                                    {selected}
                                  </span>
                                );
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    maxHeight: '250px',
                                  },
                                },
                              }}
                            >
                              {objetivos?.map((obj: any) => (
                                <MenuItem key={obj.id} value={`${obj.codigo} ${obj.descripcion}`} sx={{ py: 0.5, fontSize: '0.875rem' }}>
                                  {obj.codigo} {obj.descripcion}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {/* Panel CAUSAS */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "CAUSAS" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            CAUSAS
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '60px' }}>N°</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Causa</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Fuente</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Frecuencia</TableCell>
                  {!isReadOnly && (
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }} align="right">Acciones</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgo.causas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 4 : 5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay causas registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Mostrar causas en orden por ID y numeradas desde 1
                  [...riesgo.causas]
                    .sort((a: CausaRiesgo, b: CausaRiesgo) => {
                      const idA = Number(a.id) || 0;
                      const idB = Number(b.id) || 0;
                      return idA - idB;
                    })
                    .map((causa: CausaRiesgo, index: number) => (
                    <TableRow
                      key={causa.id}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="text.secondary">
                          {index + 1}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {causa.descripcion.length > 80
                            ? `${causa.descripcion.substring(0, 80)}...`
                            : causa.descripcion}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getFuenteLabel(fuentesCausa, causa.fuenteCausa) || 'Interna'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {labelsFrecuencia[causa.frecuencia || 3]?.label || ''}
                        </Typography>
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditarCausa(riesgo.id, causa);
                            }}
                            title="Editar causa"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEliminarCausa(riesgo.id, causa.id);
                            }}
                            color="error"
                            title="Eliminar causa"
                            disabled={causaEliminando === String(causa.id) || !!causaEliminando}
                            sx={{ position: 'relative' }}
                          >
                            {causaEliminando === String(causa.id) ? (
                              <CircularProgress size={16} color="error" />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!isReadOnly && (
            <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                size="medium"
                onClick={() => onAgregarCausa(riesgo.id)}
              >
                Agregar Causa
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Panel IMPACTO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header azul con "IMPACTO" */}
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            IMPACTO
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Grid2 container spacing={2}>
            {/* Columna izquierda de impactos */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Impacto económico */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Impacto económico
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.economico || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, economico: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.economico[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.economico && !isNaN(Number(impactos.economico)) ? Number(impactos.economico) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.economico[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Procesos */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Procesos
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.procesos || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, procesos: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.procesos[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.procesos && !isNaN(Number(impactos.procesos)) ? Number(impactos.procesos) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.procesos[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Legal */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Legal
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.legal || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, legal: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.legal[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.legal && !isNaN(Number(impactos.legal)) ? Number(impactos.legal) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.legal[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Confidencialidad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Confidencialidad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.confidencialidadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, confidencialidadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.confidencialidadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.confidencialidadSGSI && !isNaN(Number(impactos.confidencialidadSGSI)) ? Number(impactos.confidencialidadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.confidencialidadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Reputación */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Reputación
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.reputacion || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, reputacion: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.reputacion[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.reputacion && !isNaN(Number(impactos.reputacion)) ? Number(impactos.reputacion) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.reputacion[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

              </Box>
            </Grid2>

            {/* Columna derecha de impactos */}
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Disponibilidad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Disponibilidad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.disponibilidadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, disponibilidadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.disponibilidadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.disponibilidadSGSI && !isNaN(Number(impactos.disponibilidadSGSI)) ? Number(impactos.disponibilidadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.disponibilidadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Personas */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Personas
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.personas || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, personas: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.personas[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.personas && !isNaN(Number(impactos.personas)) ? Number(impactos.personas) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.personas[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Integridad SGSI */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Integridad SGSI
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.integridadSGSI || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, integridadSGSI: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.integridadSGSI[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.integridadSGSI && !isNaN(Number(impactos.integridadSGSI)) ? Number(impactos.integridadSGSI) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.integridadSGSI[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Ambiental */}
                <Box sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="body1" fontWeight={600}>
                      Ambiental
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.ambiental || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 5) {
                            actualizarRiesgo(riesgo.id, {
                              impactos: { ...impactos, ambiental: val }
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip
                              title={descripcionesImpacto.ambiental[val] || ''}
                              arrow
                              placement="left"
                            >
                              <Box component="span" sx={{ width: '100%' }}>
                                {val}
                              </Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  {(() => {
                    const valor = impactos.ambiental && !isNaN(Number(impactos.ambiental)) ? Number(impactos.ambiental) : 1;
                    return (
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                        {valor} - {descripcionesImpacto.ambiental[valor] || ''}
                      </Typography>
                    );
                  })()}
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          fullWidth
          sx={{ mt: 3 }}
          onClick={onSave}
        >
          Guardar
        </Button>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  // OPTIMIZADO: Comparación rápida sin JSON.stringify
  if (prevProps.riesgo.id !== nextProps.riesgo.id) return false;
  if (prevProps.riesgo.descripcionRiesgo !== nextProps.riesgo.descripcionRiesgo) return false;
  if (prevProps.riesgo.tipoRiesgo !== nextProps.riesgo.tipoRiesgo) return false;
  if (prevProps.riesgo.subtipoRiesgo !== nextProps.riesgo.subtipoRiesgo) return false;
  if (prevProps.riesgo.origenRiesgo !== nextProps.riesgo.origenRiesgo) return false;
  if (prevProps.riesgo.consecuencia !== nextProps.riesgo.consecuencia) return false;
  if (prevProps.riesgo.objetivo !== nextProps.riesgo.objetivo) return false;
  
  // Comparar impactos de forma eficiente
  const prevImp = prevProps.riesgo.impactos;
  const nextImp = nextProps.riesgo.impactos;
  if (prevImp?.economico !== nextImp?.economico ||
      prevImp?.procesos !== nextImp?.procesos ||
      prevImp?.legal !== nextImp?.legal ||
      prevImp?.reputacion !== nextImp?.reputacion ||
      prevImp?.personas !== nextImp?.personas ||
      prevImp?.ambiental !== nextImp?.ambiental ||
      prevImp?.confidencialidadSGSI !== nextImp?.confidencialidadSGSI ||
      prevImp?.disponibilidadSGSI !== nextImp?.disponibilidadSGSI ||
      prevImp?.integridadSGSI !== nextImp?.integridadSGSI) {
    return false;
  }
  
  if (prevProps.riesgo.causas?.length !== nextProps.riesgo.causas?.length) return false;
  if (prevProps.isReadOnly !== nextProps.isReadOnly) return false;
  if (prevProps.procesoSeleccionado?.id !== nextProps.procesoSeleccionado?.id) return false;
  if (prevProps.causaEliminando !== nextProps.causaEliminando) return false;
  
  // Si llegamos aquí, las props son iguales, no re-renderizar
  return true;
});