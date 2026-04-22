/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Grid2 from '../../utils/Grid2';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useGetPuntosMapaQuery, useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery, useGetMapaConfigQuery, useGetNivelesRiesgoQuery, useGetEjesMapaQuery, useGetAreasQuery, riesgosApi } from '../../api/services/riesgosApi';
import { useAppDispatch } from '../../app/hooks';
import { colors } from '../../app/theme/colors';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, ROUTES, NIVELES_RIESGO } from '../../utils/constants';
import { useProceso } from '../../contexts/ProcesoContext';
import { useRiesgo } from '../../contexts/RiesgoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAreasProcesosAsignados, esUsuarioResponsableProceso } from '../../hooks/useAsignaciones';
import type { FiltrosRiesgo, PuntoMapa, Riesgo } from '../../types';
import { Alert } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import ResumenEstadisticasMapas from '../../components/mapas/ResumenEstadisticasMapas';
import MapaFiltersPanel from '../../features/mapas/MapaFiltersPanel';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';
import {
  calcularResidualDesdeCausas,
  calcularResidualPorCausa,
  getDatosEvaluacionControlDesdeCausa,
} from '../../utils/residualDesdeCausas';
import { resolverCoordsResidualMapa } from '../../utils/mapaResidualCoords';
import { repairSpanishDisplayArtifacts } from '../../utils/utf8Repair';

// Función para generar ID del riesgo (número + sigla)
// Prioriza numeroIdentificacion del backend si existe, sino genera desde número
const generarIdRiesgo = (punto: PuntoMapa): string => {
  // Si el backend ya tiene numeroIdentificacion, usarlo directamente
  if (punto.numeroIdentificacion && punto.numeroIdentificacion.trim()) {
    return punto.numeroIdentificacion;
  }
  // Fallback: usar solo el número (la sigla ya está en numeroIdentificacion)
  const numero = punto.numero || 0;
  return `${numero}`;
};

/** Vista corta de la descripción del control en tablas del mapa (texto completo en tooltip). */
const MAX_DESCRIPCION_CONTROL_VISIBLE = 100;

function DescripcionControlCorta({ texto }: { texto: string }) {
  const full = repairSpanishDisplayArtifacts(String(texto ?? '').trim());
  if (!full) {
    return (
      <Typography variant="body2" component="span" color="text.secondary">
        —
      </Typography>
    );
  }
  const largo = full.length > MAX_DESCRIPCION_CONTROL_VISIBLE;
  const visible = largo
    ? `${full.slice(0, MAX_DESCRIPCION_CONTROL_VISIBLE).trimEnd()}…`
    : full;
  const body = (
    <Typography
      variant="body2"
      component="span"
      sx={{
        display: 'block',
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {visible}
    </Typography>
  );
  if (largo) {
    return (
      <Tooltip title={full} placement="top-start" enterDelay={400}>
        <Box component="span" sx={{ cursor: 'help' }}>
          {body}
        </Box>
      </Tooltip>
    );
  }
  return body;
}

export default function MapaPage() {
  const location = useLocation(); // CRÍTICO: Mover al inicio para cumplir con las reglas de hooks
  const { procesoSeleccionado } = useProceso();
  const { iniciarVer } = useRiesgo();
  const { esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user } = useAuth();
  const { areas: areasAsignadas, procesos: procesosAsignados, loading: isLoadingAsignaciones } = useAreasProcesosAsignados();
  const { setScreenContext } = useCoraIAContext(); // NUEVO: Hook de CORA IA
  const { data: mapaConfig } = useGetMapaConfigQuery(); // Moved here to avoid initialization error
  const { data: procesos = [] } = useGetProcesosQuery();
  const { data: areas = [] } = useGetAreasQuery(); // Obtener todas las áreas del sistema
  const { data: niveles = [] } = useGetNivelesRiesgoQuery();
  const { data: ejes } = useGetEjesMapaQuery();
  const [clasificacion, setClasificacion] = useState<string>(CLASIFICACION_RIESGO.NEGATIVA);
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number } | null>(null);
  const [dialogoResumenAbierto, setDialogoResumenAbierto] = useState(false);
  const [dialogoDetalleRiesgoAbierto, setDialogoDetalleRiesgoAbierto] = useState(false);
  const [riesgoSeleccionadoDetalle, setRiesgoSeleccionadoDetalle] = useState<Riesgo | null>(null);
  const [puntoSeleccionadoDetalle, setPuntoSeleccionadoDetalle] = useState<PuntoMapa | null>(null);
  const [tipoMapaDetalle, setTipoMapaDetalle] = useState<'inherente' | 'residual'>('inherente');
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});
  const [tipoMapaSeleccionado, setTipoMapaSeleccionado] = useState<'inherente' | 'residual'>('inherente');
  const [seccionesExpandidas, setSeccionesExpandidas] = useState<{
    causas: boolean;
    residual: boolean;
    controles: boolean;
  }>({
    causas: false,
    residual: false,
    controles: false,
  });

  // Limpiar estados de diálogos al desmontar el componente para evitar bloqueos de navegación
  useEffect(() => {
    return () => {
      setDialogoResumenAbierto(false);
      setDialogoDetalleRiesgoAbierto(false);
      setCeldaSeleccionada(null);
      setRiesgoSeleccionadoDetalle(null);
      setPuntoSeleccionadoDetalle(null);
      setRiesgosExpandidos({});
    };
  }, []);

  // Cerrar diálogos cuando cambian los filtros para evitar estados inconsistentes
  useEffect(() => {
    setDialogoResumenAbierto(false);
    setDialogoDetalleRiesgoAbierto(false);
    setCeldaSeleccionada(null);
    setRiesgoSeleccionadoDetalle(null);
    setPuntoSeleccionadoDetalle(null);
    setRiesgosExpandidos({});
  }, [filtroArea, filtroProceso, clasificacion]);

  // CRÍTICO: Cerrar todos los diálogos cuando cambia la ruta (navegación)
  // Esto previene que los diálogos abiertos bloqueen la navegación
  useEffect(() => {
    setDialogoResumenAbierto(false);
    setDialogoDetalleRiesgoAbierto(false);
    setCeldaSeleccionada(null);
    setRiesgoSeleccionadoDetalle(null);
    setPuntoSeleccionadoDetalle(null);
    setRiesgosExpandidos({});
  }, [location.pathname]);

  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles
  const { data: evaluacionesRiesgo = [] } = useGetEvaluacionesByRiesgoQuery(
    String(riesgoSeleccionadoDetalle?.id || ''),
    { skip: !riesgoSeleccionadoDetalle }
  );
  const evaluacionRiesgo = evaluacionesRiesgo[0] || null;

  // Obtener procesos visibles (supervisor por asignación, dueño por responsable, gerente director por asignación)
  const procesosPropios = useMemo(() => {
    if (!user) return [];
    if (esGerenteGeneralDirector) {
      // Gerente General también debe filtrar por asignaciones
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    if (esGerenteGeneralProceso) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    if (esSupervisorRiesgos) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    // Gerente General Proceso
    if (esGerenteGeneralProceso) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(String(p.areaId))) return true;
        return false;
      });
    }
    // Dueño de Proceso (incluye Gerente General en modo Dueño)
    if (esDueñoProcesos) {
      return procesos.filter((p) => esUsuarioResponsableProceso(p, user.id));
    }
    return [];
  }, [procesos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, areasAsignadas, procesosAsignados, user]);

  // Aplicar filtros de área y proceso si están seleccionados
  // IMPORTANTE: Esta página tiene sus propios filtros, NO usa el filtro del header (procesoSeleccionado)
  const procesoIdFiltrado = useMemo(() => {
    // Si hay filtro de proceso local, usarlo
      if (filtroProceso && filtroProceso !== 'all') {
      return String(filtroProceso);
      }
    // Si hay filtro de área pero no de proceso, no filtrar por procesoId aquí
    // (se filtrará después en puntosFiltrados por área)
      if (filtroArea && filtroArea !== 'all') {
      return undefined; // Devolver undefined para filtrar después por área
    }
    // Si no hay filtros locales, mostrar todos los procesos disponibles del usuario
    // (NO usar procesoSeleccionado del header)
    return undefined;
  }, [filtroProceso, filtroArea]);

  // Cuando los filtros están en "all", NO enviar filtros al backend para obtener TODOS los riesgos
  const filtros: FiltrosRiesgo = {
    procesoId: (filtroProceso && filtroProceso !== 'all') ? procesoIdFiltrado : undefined,
    clasificacion: clasificacion as ClasificacionRiesgo,
  };

  const dispatch = useAppDispatch();
  
  // Obtener TODOS los puntos del mapa (sin filtros de proceso si está en "all")
  const { data: puntos, isLoading: isLoadingPuntos, error: errorPuntos, refetch: refetchPuntos } = useGetPuntosMapaQuery(filtros, {
    // Forzar refetch cuando cambien los filtros
    refetchOnMountOrArgChange: true,
  });
  
  // Riesgos filtrados en backend por proceso/clasificación; pageSize acotado para no colgar la app
  const { data: riesgosData, isLoading: isLoadingRiesgos, error: errorRiesgos, refetch: refetchRiesgos } = useGetRiesgosQuery({
    procesoId: (filtroProceso && filtroProceso !== 'all') ? procesoIdFiltrado : undefined,
    clasificacion: clasificacion as ClasificacionRiesgo,
    includeCausas: true,
    pageSize: 200,
  }, {
    refetchOnMountOrArgChange: true,
  });

  // Forzar invalidación de caché cuando cambien los filtros (optimizado - solo cuando realmente cambian)
  useEffect(() => {
    dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
    refetchPuntos();
    refetchRiesgos();
  }, [filtros.procesoId, filtros.clasificacion, filtroArea, filtroProceso, clasificacion, dispatch, refetchPuntos, refetchRiesgos]);

  // Escuchar eventos de actualización de riesgos para refrescar el mapa en tiempo real
  useEffect(() => {
    const handleRiesgoActualizado = () => {
      // Invalidar caché y forzar refetch
      dispatch(riesgosApi.util.invalidateTags(['Riesgo', 'Evaluacion', 'PuntosMapa']));
      refetchPuntos();
      refetchRiesgos();
    };

    window.addEventListener('riesgo-actualizado', handleRiesgoActualizado);
    window.addEventListener('calificacion-residual-updated', handleRiesgoActualizado);

    return () => {
      window.removeEventListener('riesgo-actualizado', handleRiesgoActualizado);
      window.removeEventListener('calificacion-residual-updated', handleRiesgoActualizado);
    };
  }, [dispatch, refetchPuntos, refetchRiesgos]);

  // Obtener riesgos completos para el diálogo
  const riesgosCompletos = riesgosData?.data || [];

  const residualModoPorProcesoId = useMemo(() => {
    const m = new Map<string, 'ESTANDAR' | 'ESTRATEGICO'>();
    for (const p of procesos) {
      m.set(String(p.id), p.residualModo === 'ESTRATEGICO' ? 'ESTRATEGICO' : 'ESTANDAR');
    }
    return m;
  }, [procesos]);

  // Filtrar puntos y riesgos aplicando filtros de área, proceso y clasificación
  // IMPORTANTE: Siempre respetar las asignaciones del usuario (procesosPropios)
  const puntosFiltrados = useMemo(() => {
    if (!puntos || puntos.length === 0) return [];
    
    // Aplicar filtros de área y proceso
    let procesosIds: string[] = [];
    
    // Si hay filtro de proceso específico, usarlo (sobrescribe todo)
    if (filtroProceso && filtroProceso !== 'all') {
      // Verificar que el proceso filtrado esté en los procesos asignados del usuario
      const procesoFiltrado = procesosPropios.find(p => String(p.id) === String(filtroProceso));
      if (procesoFiltrado) {
        procesosIds = [String(filtroProceso)];
      } else {
        // Si el proceso filtrado no está asignado al usuario, no mostrar nada
        return [];
      }
    } 
    // Si hay filtro de área, filtrar procesos por área (pero solo de los asignados)
    else if (filtroArea && filtroArea !== 'all') {
        procesosIds = procesosPropios
        .filter(p => String(p.areaId) === String(filtroArea))
        .map(p => String(p.id));
    }
    // Si no hay filtros de área ni proceso, usar procesos asignados del usuario
    else {
      procesosIds = procesosPropios.map((p) => String(p.id));
    }

    // Filtrar puntos aplicando todos los filtros
    const filtrados = puntos.filter((p) => {
      // Buscar el riesgo correspondiente
      const riesgo = riesgosCompletos.find((r) => String(r.id) === String(p.riesgoId));
      if (!riesgo) {
        return false; // Riesgo no encontrado, excluir
      }
      
      // SIEMPRE aplicar filtro de proceso (respetar asignaciones del usuario)
      if (procesosIds.length > 0) {
        const procesoIdRiesgo = String(riesgo.procesoId);
        if (!procesosIds.includes(procesoIdRiesgo)) {
          return false; // No pertenece a los procesos asignados/filtrados
        }
      } else {
        // Si no hay procesos asignados, no mostrar nada
        return false;
      }
      
      // Negativos/heredados: todo lo que no es oportunidad explícita (null, Excel, negativa). Positivos: solo consecuencia positiva.
      if (clasificacion === CLASIFICACION_RIESGO.NEGATIVA) {
        if (riesgo.clasificacion === CLASIFICACION_RIESGO.POSITIVA) {
          return false;
        }
      } else if (riesgo.clasificacion !== CLASIFICACION_RIESGO.POSITIVA) {
        return false;
      }

      return true;
    });
    
    return filtrados;
  }, [puntos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, procesosPropios, riesgosCompletos, procesos, filtroArea, filtroProceso, clasificacion]);

  // Crear matriz 5x5 para riesgo inherente usando puntos filtrados
  // IMPORTANTE: Cada riesgo debe aparecer SOLO UNA VEZ en la celda correcta según su clasificación
  const matrizInherente = useMemo(() => {
    const matriz: { [key: string]: PuntoMapa[] } = {};
    const riesgosAgregados = new Set<number>(); // Track de riesgos ya agregados para evitar duplicados
    
    // Incluir TODOS los puntos filtrados, incluso si no tienen valores perfectos
    // Usar valores por defecto si faltan
    puntosFiltrados.forEach((punto) => {
      // Evitar duplicados: si este riesgo ya fue agregado, saltarlo
      if (riesgosAgregados.has(Number(punto.riesgoId))) {
        return; // Ya agregado, saltar
      }
      
      // Asegurar que probabilidad e impacto sean números enteros válidos
      // Si no hay valores, usar valores por defecto (1,1) para que aparezca en el mapa
      let probabilidad = Math.round(Number(punto.probabilidad)) || 1;
      let impacto = Math.round(Number(punto.impacto)) || 1;
      
      // Validar y ajustar al rango correcto (1-5)
      probabilidad = Math.max(1, Math.min(5, probabilidad));
      impacto = Math.max(1, Math.min(5, impacto));
      
      const clave = `${probabilidad}-${impacto}`;
      
      if (!matriz[clave]) {
        matriz[clave] = [];
      }
      
      // Guardar el punto con valores validados
      matriz[clave].push({
        ...punto,
        probabilidad,
        impacto,
      });
      
      // Marcar este riesgo como agregado
      riesgosAgregados.add(Number(punto.riesgoId));
    });
    
    return matriz;
  }, [puntosFiltrados]);

  // Crear matriz 5x5 para riesgo residual. Ejes: X = Frecuencia (probabilidad), Y = Impacto.
  // Sin control: calificación y ubicación = misma que inherente (misma celda).
  // Estándar: causa dominante; estratégico: coordenadas desde evaluación persistida.
  const matrizResidual = useMemo(() => {
    const matriz: { [key: string]: PuntoMapa[] } = {};
    const riesgosAgregados = new Set<number>(); // Track de riesgos ya agregados para evitar duplicados
    
    // Incluir TODOS los puntos filtrados (los mismos del inherente)
    puntosFiltrados.forEach((punto) => {
      // Evitar duplicados: si este riesgo ya fue agregado, saltarlo
      if (riesgosAgregados.has(Number(punto.riesgoId))) {
        return; // Ya agregado, saltar
      }
      
      const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
      const procesoIdStr =
        punto.procesoId != null ? String(punto.procesoId) : riesgo?.procesoId != null ? String(riesgo.procesoId) : '';
      const modo = procesoIdStr ? (residualModoPorProcesoId.get(procesoIdStr) ?? 'ESTANDAR') : 'ESTANDAR';
      const { probabilidadResidual, impactoResidual } = resolverCoordsResidualMapa(punto, riesgo ?? undefined, modo);

      const clave = `${probabilidadResidual}-${impactoResidual}`;
      if (!matriz[clave]) {
        matriz[clave] = [];
      }
      
      // Crear un punto residual basado en el inherente, pero con valores residuales
      matriz[clave].push({
        ...punto,
        probabilidad: probabilidadResidual,
        impacto: impactoResidual,
        probabilidadResidual,
        impactoResidual,
      });
      
      // Marcar este riesgo como agregado
      riesgosAgregados.add(Number(punto.riesgoId));
    });
    
    return matriz;
  }, [puntosFiltrados, riesgosCompletos, residualModoPorProcesoId]);

  // Calcular nivel de riesgo basado en probabilidad e impacto (Usando Configuración o Fallback)
  const calcularNivelRiesgo = (probabilidad: number, impacto: number): string => {
    // Si existe configuración dinámica, usarla
    if (mapaConfig && mapaConfig.inherente) {
      const clave = `${probabilidad}-${impacto}`;
      const nivelId = mapaConfig.inherente[clave];
      if (nivelId) {
        // Mapear ID de nivel a NIVELES_RIESGO constant
        const nivel = niveles?.find(n => n.id === nivelId);
        if (nivel && nivel.nombre) {
          // Aquí idealmente NIVELES_RIESGO debería coincidir con los IDs o nombres de la config.
          // Si nivel.nombre es "Crítico", return NIVELES_RIESGO.CRITICO
          // Simplificación: Retornamos el nombre en mayúsculas si coincide, o una lógica de mapeo.
          // Dado que NIVELES_RIESGO es CRITICO, ALTO, MEDIO, BAJO.
          const nombreUpper = nivel.nombre.toUpperCase();
          if (nombreUpper.includes('CRITICO') || nombreUpper.includes('CRÍTICO')) return NIVELES_RIESGO.CRITICO;
          if (nombreUpper.includes('ALTO')) return NIVELES_RIESGO.ALTO;
          if (nombreUpper.includes('MEDIO')) return NIVELES_RIESGO.MEDIO;
          if (nombreUpper.includes('BAJO')) return NIVELES_RIESGO.BAJO;
        }
      }
    }

    // Fallback: Lógica matemática según documento Proceso_Calificacion_Inherente_Global.md
    // Zonas: 15-25 Crítico, 10-14 Alto, 4-9 Medio, 1-3 Bajo
    // Excepción: 2x2 = 3.99 (cae en zona baja)
    let riesgo = probabilidad * impacto;
    if (probabilidad === 2 && impacto === 2) {
      riesgo = 3.99; // Excepción documentada
    }
    
    if (riesgo >= 15 && riesgo <= 25) return NIVELES_RIESGO.CRITICO;
    if (riesgo >= 10 && riesgo <= 14) return NIVELES_RIESGO.ALTO;
    if (riesgo >= 4 && riesgo <= 9) return NIVELES_RIESGO.MEDIO;
    return NIVELES_RIESGO.BAJO;
  };

  // Calcular estadísticas comparativas: Inherente vs Residual
  const estadisticasComparativas = useMemo(() => {
    if (!puntosFiltrados || puntosFiltrados.length === 0) return null;

    // Estadísticas de riesgo inherente
    const inherente = {
      total: puntosFiltrados.length,
      porNivel: {
        critico: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.CRITICO).length,
        alto: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.ALTO).length,
        medio: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.MEDIO).length,
        bajo: puntosFiltrados.filter((p) => calcularNivelRiesgo(p.probabilidad, p.impacto) === NIVELES_RIESGO.BAJO).length,
      },
    };

    // Estadísticas de riesgo residual
    const residual = {
      total: puntosFiltrados.length,
      porNivel: {
        critico: 0,
        alto: 0,
        medio: 0,
        bajo: 0,
      },
    };

    // Calcular residual y comparar cambios
    const cambios: { [key: string]: number } = {
      'critico-critico': 0,
      'critico-alto': 0,
      'critico-medio': 0,
      'critico-bajo': 0,
      'alto-alto': 0,
      'alto-medio': 0,
      'alto-bajo': 0,
      'medio-medio': 0,
      'medio-bajo': 0,
      'bajo-bajo': 0,
    };

    puntosFiltrados.forEach((punto) => {
      const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
      if (!riesgo) return;

      const nivelInherente = calcularNivelRiesgo(punto.probabilidad, punto.impacto);

      const procesoIdStr =
        punto.procesoId != null ? String(punto.procesoId) : riesgo.procesoId != null ? String(riesgo.procesoId) : '';
      const modo = procesoIdStr ? (residualModoPorProcesoId.get(procesoIdStr) ?? 'ESTANDAR') : 'ESTANDAR';
      const { probabilidadResidual, impactoResidual } = resolverCoordsResidualMapa(punto, riesgo, modo);
      const nivelResidual = calcularNivelRiesgo(probabilidadResidual, impactoResidual);

      // Contar por nivel residual
      if (nivelResidual === NIVELES_RIESGO.CRITICO) residual.porNivel.critico++;
      else if (nivelResidual === NIVELES_RIESGO.ALTO) residual.porNivel.alto++;
      else if (nivelResidual === NIVELES_RIESGO.MEDIO) residual.porNivel.medio++;
      else residual.porNivel.bajo++;

      // Contar cambios
      const claveCambio = `${nivelInherente}-${nivelResidual}`;
      if (cambios[claveCambio] !== undefined) {
        cambios[claveCambio]++;
      }
    });

    return {
      inherente,
      residual,
      cambios,
    };
  }, [puntosFiltrados, riesgosCompletos, residualModoPorProcesoId, mapaConfig, niveles]);

  // Análisis de Mitigación (Insights)
  const riskInsights = useMemo(() => {
    if (!puntosFiltrados || puntosFiltrados.length === 0) return null;

    // 1. Top Mitigaciones (Mayor reducción de puntaje)
    const mitigaciones = puntosFiltrados.map(punto => {
      const riesgo = riesgosCompletos.find(r => r.id === punto.riesgoId);
      if (!riesgo) return null;

      const scoreInherente = punto.probabilidad * punto.impacto;
      const procesoIdStr =
        punto.procesoId != null ? String(punto.procesoId) : riesgo.procesoId != null ? String(riesgo.procesoId) : '';
      const modo = procesoIdStr ? (residualModoPorProcesoId.get(procesoIdStr) ?? 'ESTANDAR') : 'ESTANDAR';
      const { probabilidadResidual: probRes, impactoResidual: impRes } = resolverCoordsResidualMapa(
        punto,
        riesgo,
        modo
      );
      const scoreResidual = probRes === 2 && impRes === 2 ? 3.99 : probRes * impRes;

      const reduccion = scoreInherente - scoreResidual;

      return {
        id: generarIdRiesgo(punto),
        nombre: riesgo.descripcion || punto.descripcion, // Usar descripción del riesgo
        scoreInherente,
        scoreResidual,
        reduccion,
        nivelResidual: calcularNivelRiesgo(probRes, impRes)
      };
    }).filter(Boolean).sort((a, b) => (b?.reduccion || 0) - (a?.reduccion || 0));

    const topMitigaciones = mitigaciones.slice(0, 3);

    // 2. Riesgos Críticos Persistentes
    const criticosPersistentes = mitigaciones.filter(m => m && m.nivelResidual === NIVELES_RIESGO.CRITICO);

    // 3. Eficacia Global (% de riesgos que bajaron de nivel o puntaje)
    const totalMejorados = mitigaciones.filter(m => (m?.reduccion || 0) > 0).length;
    const eficacia = Math.round((totalMejorados / puntosFiltrados.length) * 100);

    return {
      topMitigaciones,
      criticosPersistentes,
      eficacia
    };
  }, [puntosFiltrados, riesgosCompletos, residualModoPorProcesoId, mapaConfig, niveles]);

  // Obtener riesgos de la celda seleccionada usando puntos filtrados
  const matrizActual = tipoMapaSeleccionado === 'inherente' ? matrizInherente : matrizResidual;

  const riesgosCeldaSeleccionada = useMemo(() => {
    if (!celdaSeleccionada) return [];
    
    // Asegurar que sean números enteros
    const prob = Math.round(Number(celdaSeleccionada.probabilidad)) || 1;
    const imp = Math.round(Number(celdaSeleccionada.impacto)) || 1;
    const clave = `${prob}-${imp}`;
    
    const riesgos = matrizActual[clave] || [];
    
    // Validar que los riesgos realmente pertenezcan a esta celda
    const riesgosValidos = riesgos.filter(p => {
      const pProb = Math.round(Number(p.probabilidad));
      const pImp = Math.round(Number(p.impacto));
      return pProb === prob && pImp === imp;
    });
    
    return riesgosValidos;
  }, [celdaSeleccionada, matrizActual]);

  // NUEVO: useEffect para capturar contexto de pantalla para CORA IA (DESPUÉS de todos los useMemo)
  useEffect(() => {
    if (setScreenContext && puntosFiltrados) {
      const context: ScreenContext = {
        module: 'mapas',
        screen: tipoMapaSeleccionado === 'inherente' ? 'mapa-inherente' : 'mapa-residual',
        action: 'view',
        route: window.location.pathname,
        formData: {
          tipoMapa: tipoMapaSeleccionado,
          filtros: {
            clasificacion:
              clasificacion === CLASIFICACION_RIESGO.POSITIVA
                ? 'Oportunidades (positivos)'
                : 'Riesgos negativos',
            area: filtroArea === 'all' ? 'Todas' : areas.find(a => String(a.id) === filtroArea)?.nombre || 'N/A',
            proceso: filtroProceso === 'all' ? 'Todos' : procesos.find(p => String(p.id) === filtroProceso)?.nombre || 'N/A',
          },
          totalRiesgos: puntosFiltrados.length,
          estadisticas: estadisticasComparativas ? {
            inherente: {
              total: estadisticasComparativas.inherente.total,
              criticos: estadisticasComparativas.inherente.porNivel.critico,
              altos: estadisticasComparativas.inherente.porNivel.alto,
              medios: estadisticasComparativas.inherente.porNivel.medio,
              bajos: estadisticasComparativas.inherente.porNivel.bajo,
            },
            residual: {
              total: estadisticasComparativas.residual.total,
              criticos: estadisticasComparativas.residual.porNivel.critico,
              altos: estadisticasComparativas.residual.porNivel.alto,
              medios: estadisticasComparativas.residual.porNivel.medio,
              bajos: estadisticasComparativas.residual.porNivel.bajo,
            },
          } : undefined,
          topMitigaciones: riskInsights?.topMitigaciones?.slice(0, 3).map(m => ({
            id: m?.id,
            reduccion: m?.reduccion,
            nivelResidual: m?.nivelResidual,
          })) || [],
          criticosPersistentes: riskInsights?.criticosPersistentes?.length || 0,
          eficaciaGlobal: riskInsights?.eficacia || 0,
        }
      };
      setScreenContext(context);
    }
  }, [
    puntosFiltrados,
    tipoMapaSeleccionado,
    clasificacion,
    filtroArea,
    filtroProceso,
    estadisticasComparativas,
    riskInsights,
    areas,
    procesos,
    setScreenContext
  ]);

  // isLoading state para la página completa
  const isPageLoading = isLoadingAsignaciones || isLoadingPuntos || isLoadingRiesgos;

  if (isPageLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <PageLoadingSkeleton variant="table" tableRows={6} />
      </Box>
    );
  }

  // Si es supervisor, dueño o gerente general, mostrar solo procesos que tiene asignados
  if ((esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesosPropios.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" variant="outlined">
          No tiene procesos asignados para visualizar el mapa de riesgos.
        </Alert>
      </Box>
    );
  }

  // NOTA: Esta página NO usa procesoSeleccionado del header
  // Tiene sus propios filtros (filtroArea, filtroProceso) que son independientes


  /* Hook moved to top */
  const getCellColor = (probabilidad: number, impacto: number): string => {
    const prob = Number(probabilidad) || 1;
    const imp = Number(impacto) || 1;
    const cellKey = `${prob}-${imp}`;
    const esOportunidades =
      clasificacion === CLASIFICACION_RIESGO.POSITIVA;

    // Mapa negativo: configuración admin + escala cálida (rojo/naranja/amarillo/verde)
    if (!esOportunidades && mapaConfig && mapaConfig.inherente) {
      const nivelId = mapaConfig.inherente[cellKey];
      if (nivelId) {
        const nivel = niveles?.find(n => n.id === nivelId);
        if (nivel && nivel.color) {
          return nivel.color;
        }
      }
    }

    let riesgo = prob * imp;
    if (prob === 2 && imp === 2) {
      riesgo = 3.99;
    }

    // Mapa positivo (oportunidades): escala fría distinta — no usa la config del mapa de amenazas
    if (esOportunidades) {
      if (riesgo >= 15 && riesgo <= 25) return '#1565c0';
      if (riesgo >= 10 && riesgo <= 14) return '#42a5f5';
      if (riesgo >= 4 && riesgo <= 9) return '#757575';
      return '#bdbdbd';
    }

    if (riesgo >= 15 && riesgo <= 25) return colors.risk.critical.main;
    if (riesgo >= 10 && riesgo <= 14) return colors.risk.high.main;
    if (riesgo >= 4 && riesgo <= 9) return colors.risk.medium.main;
    return colors.risk.low.main;
  };

  // Función para obtener el color basado en el nivel de riesgo (string)
  const getColorByNivelRiesgo = (nivelRiesgo: string | null | undefined): string => {
    const nivelUpper = (nivelRiesgo || '').toUpperCase();
    const esOportunidades =
      clasificacion === CLASIFICACION_RIESGO.POSITIVA;

    if (esOportunidades) {
      if (
        nivelUpper.includes('CRÍTICO') ||
        nivelUpper.includes('CRITICO') ||
        nivelUpper.includes('EXTREMO')
      ) {
        return '#1565c0';
      }
      if (nivelUpper.includes('ALTO')) return '#42a5f5';
      if (nivelUpper.includes('MEDIO')) return '#757575';
      return '#bdbdbd';
    }

    if (!nivelRiesgo) return colors.risk.low.main;
    if (nivelUpper.includes('CRÍTICO') || nivelUpper.includes('CRITICO')) {
      return colors.risk.critical.main;
    }
    if (nivelUpper.includes('ALTO')) {
      return colors.risk.high.main;
    }
    if (nivelUpper.includes('MEDIO')) {
      return colors.risk.medium.main;
    }
    return colors.risk.low.main;
  };
  
  // Función auxiliar para convertir color hex a rgba con opacidad
  const hexToRgba = (hex: string, opacity: number): string => {
    // Si el color ya tiene formato rgba, devolverlo
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    
    // Remover # si existe
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getCellLabel = (probabilidad: number, impacto: number): string => {
    let riesgo = probabilidad * impacto;
    if (probabilidad === 2 && impacto === 2) {
      riesgo = 3.99;
    }
    const esOportunidades =
      clasificacion === CLASIFICACION_RIESGO.POSITIVA;
    if (esOportunidades) {
      if (riesgo >= 15 && riesgo <= 25) return 'EXTREMO';
      if (riesgo >= 10 && riesgo <= 14) return 'ALTO';
      if (riesgo >= 4 && riesgo <= 9) return 'MEDIO';
      return 'BAJO';
    }
    if (riesgo >= 15 && riesgo <= 25) return 'CRÍTICO';
    if (riesgo >= 10 && riesgo <= 14) return 'ALTO';
    if (riesgo >= 4 && riesgo <= 9) return 'MEDIO';
    return 'BAJO';
  };

  const handleCellClick = (e: React.MouseEvent, probabilidad: number, impacto: number, tipo: 'inherente' | 'residual') => {
    // No prevenir la propagación del evento para permitir navegación
    // e.stopPropagation(); // NO hacer esto
    
    // Debug: verificar si este handler se está ejecutando
    // debugger; // Descomentar para debug
    
    // Asegurar que sean números enteros
    const prob = Math.round(Number(probabilidad)) || 1;
    const imp = Math.round(Number(impacto)) || 1;
    const clave = `${prob}-${imp}`;
    
    setTipoMapaSeleccionado(tipo);
    const matrizActual = tipo === 'inherente' ? matrizInherente : matrizResidual;
    const riesgosCelda = matrizActual[clave] || [];
    
    // Para ambos mapas (inherente y residual): siempre abrir diálogo de resumen con acordeones
    if (riesgosCelda.length > 0) {
      setCeldaSeleccionada({ probabilidad: prob, impacto: imp });
      setDialogoResumenAbierto(true);
    }
  };

  // Función para obtener los bordes rojos de una celda de límite (Tolerancia)
  const getBordesLimite = (probabilidad: number, impacto: number): { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } => {
    if (!mapaConfig || !mapaConfig.tolerancia) return {};

    const claveCelda = `${probabilidad}-${impacto}`;
    const tolerada = mapaConfig.tolerancia.includes(claveCelda);
    const bordes: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean } = {};

    const checkVecino = (p: number, i: number) => {
      const key = `${p}-${i}`;
      return mapaConfig.tolerancia.includes(key);
    };

    // Lógica simétrica al Admin: Dibujar borde si el estado de tolerancia es diferente al del vecino,
    // pero respetando los límites de la matriz (no dibujar borde en el extremo exterior).

    // Arriba (Impacto + 1)
    if (impacto < 5 && tolerada !== checkVecino(probabilidad, impacto + 1)) bordes.top = true;

    // Derecha (Probabilidad + 1)
    if (probabilidad < 5 && tolerada !== checkVecino(probabilidad + 1, impacto)) bordes.right = true;

    // Abajo (Impacto - 1)
    if (impacto > 1 && tolerada !== checkVecino(probabilidad, impacto - 1)) bordes.bottom = true;

    // Izquierda (Probabilidad - 1)
    if (probabilidad > 1 && tolerada !== checkVecino(probabilidad - 1, impacto)) bordes.left = true;

    return bordes;
  };

  // Matriz: X = Frecuencia/Probabilidad (columnas), Y = Impacto (filas). Clave celda = `${prob}-${imp}`.
  const renderMatrix = (matriz: { [key: string]: PuntoMapa[] }, tipo: 'inherente' | 'residual') => {
    const esMapaOportunidades =
      clasificacion === CLASIFICACION_RIESGO.POSITIVA;
    const colorZonaAlta = esMapaOportunidades ? '#0d47a1' : '#d32f2f';

    const probabilidades = ejes?.probabilidad.map(p => p.valor) || [1, 2, 3, 4, 5];
    const impactos = ejes?.impacto.map(i => i.valor).sort((a, b) => b - a) || [5, 4, 3, 2, 1];

    const esFueraApetito = (prob: number, imp: number) => {
      const valor = prob * imp;
      return valor >= 15; // Hardcoded threshold based on constants
    };

    return (
      <Box sx={{ minWidth: 350, position: 'relative' }}>
        <Box display="flex" alignItems="center" mb={1.5}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              mr: 2,
              fontSize: '0.75rem',
            }}
          >
            IMPACTO
          </Typography>
          <Box flexGrow={1}>
            <Box>
              {impactos.map((impacto) => {
                const etiquetaImpacto = ejes?.impacto.find(i => i.valor === impacto)?.nombre || '';

                return (
                  <Box key={impacto} display="flex" mb={0.5}>
                    <Box
                      sx={{
                        width: 50, // Reduced from 60
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.65rem', // Reduced font
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                        {impacto}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, fontSize: '0.55rem' }}>
                        {etiquetaImpacto}
                      </Typography>
                    </Box>
                    {probabilidades.map((probabilidad) => {
                      // Asegurar que sean números enteros para la clave
                      const prob = Math.round(Number(probabilidad)) || 1;
                      const imp = Math.round(Number(impacto)) || 1;
                      const key = `${prob}-${imp}`;
                      const riesgosCelda = matriz[key] || [];
                      const cellColor = getCellColor(prob, imp);
                      const fuerApetito = esFueraApetito(prob, imp);
                      const bordesLimite = getBordesLimite(prob, imp);
                      
                      // Validar que los riesgos en esta celda realmente pertenezcan aquí
                      const riesgosValidosEnCelda = riesgosCelda.filter(p => {
                        const pProb = Math.round(Number(p.probabilidad));
                        const pImp = Math.round(Number(p.impacto));
                        return pProb === prob && pImp === imp;
                      });

                      // Determine visible IDs (max 3 or 4 to keep it small)
                      const maxVisible = 4;
                      const visibleRiesgos = riesgosValidosEnCelda.slice(0, maxVisible);
                      const remaining = riesgosValidosEnCelda.length - maxVisible;

                      return (
                        <Box
                          key={probabilidad}
                          onClick={(e) => handleCellClick(e, prob, imp, tipo)}
                          sx={{
                            width: 60, // Reduced from 70
                            minHeight: 60, // Reduced from 70

                            // Borders logic
                            borderTop: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.top ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                            borderRight: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.right ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                            borderBottom: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.bottom ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),
                            borderLeft: fuerApetito ? `3px solid ${colorZonaAlta}` : (bordesLimite.left ? `3px dashed ${colorZonaAlta}` : '1px solid #000'),

                            ...(fuerApetito && { border: `3px solid ${colorZonaAlta}` }),

                            backgroundColor: hexToRgba(cellColor, 0.3), // 30% de opacidad para mejor visibilidad
                            // Thicker left border indicator
                            borderLeftWidth: fuerApetito ? 3 : (bordesLimite.left ? 3 : 4),
                            borderLeftColor: fuerApetito ? colorZonaAlta : (bordesLimite.left ? colorZonaAlta : cellColor),

                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            cursor: riesgosValidosEnCelda.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            p: 0.25,
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: hexToRgba(cellColor, 0.5), // 50% de opacidad al hover
                              transform: riesgosValidosEnCelda.length > 0 ? 'scale(1.05)' : 'none',
                              zIndex: 10,
                            },
                            ml: 0.5,
                            overflow: 'hidden',
                          }}
                        >
                          <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.15,
                            alignItems: 'center',
                            width: '100%',
                            maxHeight: '100%',
                            overflow: 'auto'
                          }}>
                            {visibleRiesgos.map((punto) => (
                              <Typography
                                key={punto.riesgoId}
                                variant="caption"
                                sx={{
                                  fontSize: '0.55rem',
                                  lineHeight: 1.2,
                                  fontWeight: 700,
                                  backgroundColor: 'rgba(255,255,255,0.8)',
                                  borderRadius: '2px',
                                  px: 0.25,
                                  py: 0.1,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  color: '#000',
                                  width: 'fit-content',
                                  textAlign: 'center'
                                }}
                              >
                                {generarIdRiesgo(punto)}
                              </Typography>
                            ))}
                            {remaining > 0 && (
                              <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 600, color: '#000' }}>
                                +{remaining}
                              </Typography>
                            )}
                          </Box>

                          {fuerApetito && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 1,
                                right: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: '#d32f2f',
                                zIndex: 5,
                              }}
                            >
                              <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#fff', fontWeight: 'bold' }}>!</Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
              <Box display="flex" mt={0.5}>
                <Box sx={{ width: 50 }} />
                {probabilidades.map((prob) => {
                  const etiquetaProb = ejes?.probabilidad.find(p => p.valor === prob)?.nombre || '';

                  return (
                    <Box
                      key={prob}
                      sx={{
                        width: 60, // Reduced from 70
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        ml: 0.5,
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                        {prob}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.55rem', lineHeight: 1.1 }}>
                        {etiquetaProb}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              <Box display="flex" justifyContent="center" mt={1}>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                  FRECUENCIA/PROBABILIDAD
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };




  // Handlers y lógica para el diálogo de detalle de riesgo


  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles

  // Validación removida - permite cargar sin proceso seleccionado
  // (Supervisor/Dueño puede ver el mapa sin seleccionar proceso específico - usa filtros locales)

  // Verificar si tiene asignaciones
  const sinAsignaciones = (esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesosPropios.length === 0;

  return (
    <Box
      style={{
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: 0, // Asegurar que no esté por encima del sidebar
      }}
      sx={{
        // Asegurar que el contenedor no bloquee eventos de navegación
        pointerEvents: 'auto',
        position: 'relative',
      }}
    >
      {/* Modal bloqueante si no tiene asignaciones */}
      {sinAsignaciones && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <VisibilityIcon
                sx={{ fontSize: 80, color: 'warning.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Aún no tiene procesos asignados
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Para acceder al mapa de riesgos, necesita que el administrador le asigne áreas o procesos para supervisar.
              </Typography>
              <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                  ¿Qué debe hacer?
                </Typography>
                <Typography variant="body2">
                  Contacte al administrador del sistema para que le asigne las áreas y procesos correspondientes a su rol.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Contenido del mapa - solo visible si tiene asignaciones */}
      {!sinAsignaciones && (
        (isLoadingPuntos || isLoadingRiesgos) && !errorPuntos && !errorRiesgos ? (
          /* Skeleton para toda la página mientras carga */
          <Box sx={{ minHeight: '75vh', width: '100%', py: 2 }}>
            <PageLoadingSkeleton variant="text" lines={3} />
            <Box sx={{ mt: 3 }}>
              <PageLoadingSkeleton variant="table" tableRows={14} />
            </Box>
          </Box>
        ) : (
        <>
        {/* Mostrar errores si existen */}
        {(errorPuntos || errorRiesgos) ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error al cargar los datos del mapa. Por favor, intente nuevamente.
          </Alert>
        ) : null}

        {/* Mostrar mensaje si no hay datos pero no está cargando */}
        {!isLoadingPuntos && !isLoadingRiesgos && !errorPuntos && !errorRiesgos && puntosFiltrados.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            No hay riesgos disponibles con los filtros seleccionados.
          </Alert>
        ) : null}

        <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
              Mapas de Calor de Riesgos
            </Typography>
        </Box>

        <Grid2 container spacing={3}>
          {/* Columna principal: Filtros y Leyenda */}
          <Grid2 xs={12}>
            <MapaFiltersPanel
              clasificacion={clasificacion}
              setClasificacion={setClasificacion}
              filtroArea={filtroArea}
              filtroProceso={filtroProceso}
              setFiltroArea={(v) => setFiltroArea(v)}
              setFiltroProceso={(v) => setFiltroProceso(v)}
              esSupervisorRiesgos={!!esSupervisorRiesgos}
              esDueñoProcesos={!!esDueñoProcesos}
              esGerenteGeneralDirector={!!esGerenteGeneralDirector}
              esGerenteGeneralProceso={!!esGerenteGeneralProceso}
              procesosPropios={procesosPropios as any}
              areas={areas as any}
            />

            {/* Matrices lado a lado */}
            <Grid2 container spacing={2} sx={{ mb: 3 }}>
              {/* Mapa de Riesgo Inherente */}
              <Grid2 xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
                      MAPA DE RIESGOS INHERENTE
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, overflowX: 'auto', pointerEvents: 'auto' }}>
                      {renderMatrix(matrizInherente, 'inherente')}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid2>

              {/* Mapa de Riesgo Residual */}
              <Grid2 xs={12} md={6}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
                      MAPA DE RIESGOS RESIDUAL
                    </Typography>
                    <Paper elevation={2} sx={{ p: 2, overflowX: 'auto', pointerEvents: 'auto' }}>
                      {renderMatrix(matrizResidual, 'residual')}
                    </Paper>
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>

          </Grid2>
        </Grid2>

        {/* Diálogo de Resumen */}
        <Dialog
          open={dialogoResumenAbierto}
          onClose={() => {
            setDialogoResumenAbierto(false);
            setCeldaSeleccionada(null);
            setRiesgosExpandidos({});
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { maxWidth: 560 } }}
          disableEscapeKeyDown={false}
          disablePortal={false}
          keepMounted={false}
          disableScrollLock={true}
          BackdropProps={{
            sx: {
              pointerEvents: 'auto', // Asegurar que el backdrop capture clicks para cerrar
            },
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Riesgos en la Celda ({celdaSeleccionada?.probabilidad}, {celdaSeleccionada?.impacto})
              </Typography>
              <IconButton
                onClick={() => {
                  setDialogoResumenAbierto(false);
                  setCeldaSeleccionada(null);
                  setRiesgosExpandidos({});
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {riesgosCeldaSeleccionada.length === 0 ? (
              <Alert severity="info">No hay riesgos en esta celda.</Alert>
            ) : tipoMapaSeleccionado === 'inherente' ? (
              // Para mapa inherente: usar Accordion con fecha a la derecha
              <Box>
                {riesgosCeldaSeleccionada.map((punto) => {
                  const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                  const riesgoId = String(punto.riesgoId);
                  const isExpanded = riesgosExpandidos[riesgoId] || false;
                  
                  // Usar información del punto (que viene del backend) o del riesgo completo como fallback
                  const descripcion = punto.descripcion || riesgo?.descripcion || 'Sin descripción';
                  const zonaRaw = punto.zona || riesgo?.zona || null;
                  const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                  const tipologia = punto.tipologiaNivelI || riesgo?.tipologiaNivelI || null;
                  
                  // Obtener fecha del riesgo (createdAt o updatedAt)
                  const fechaRiesgo = riesgo?.createdAt || riesgo?.updatedAt;
                  const fechaFormateada = fechaRiesgo ? new Date(fechaRiesgo).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Sin fecha';
                  
                  const handleToggleExpand = () => {
                    setRiesgosExpandidos(prev => ({
                      ...prev,
                      [riesgoId]: !prev[riesgoId]
                    }));
                  };
                  
                  return (
                    <Accordion
                      key={punto.riesgoId}
                      expanded={isExpanded}
                      onChange={handleToggleExpand}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          '& .MuiAccordionSummary-content': {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            mr: 2,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {generarIdRiesgo(punto)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                                label={punto.nivelRiesgo || 'Sin calificar'}
                              size="small"
                              sx={{
                                  backgroundColor: getColorByNivelRiesgo(punto.nivelRiesgo),
                                color: '#fff',
                                  height: 20,
                                  fontSize: '0.7rem',
                              }}
                            />
                            <Chip
                              label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                              size="small"
                              color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {fechaFormateada}
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                            <strong>Descripción:</strong>{' '}
                            {repairSpanishDisplayArtifacts(String(descripcion))}
                          </Typography>

                          {/* Información del Proceso */}
                          {riesgo && riesgo.procesoId && (() => {
                            const procesoRiesgo = procesos.find(p => String(p.id) === String(riesgo.procesoId));
                            const procesoNombre = procesoRiesgo?.nombre || punto.procesoNombre || 'Proceso desconocido';
                            
                            return (
                              <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                                <CardContent>
                                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                    Información del Proceso
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2">
                                      <strong>Proceso:</strong> {procesoNombre}
                                    </Typography>
                                    {procesoRiesgo?.areaNombre && (
                                      <Typography variant="body2">
                                        <strong>Área:</strong> {procesoRiesgo.areaNombre}
                                      </Typography>
                                    )}
                                    {procesoRiesgo?.responsableNombre && (
                                      <Typography variant="body2">
                                        <strong>Responsable (Dueño del Proceso):</strong>{' '}
                                        <Chip
                                          label={procesoRiesgo.responsableNombre}
                                          size="small"
                                          color="primary"
                                          sx={{ ml: 0.5 }}
                                        />
                                      </Typography>
                                    )}
                        </Box>
                                </CardContent>
                              </Card>
                            );
                          })()}

                          {/* Evaluación del Riesgo */}
                          {riesgo && riesgo.evaluacion && (
                            <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                  Evaluación del Riesgo
                        </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="body2">
                                    <strong>Probabilidad:</strong> {punto.probabilidad || riesgo.evaluacion.probabilidad || 1}
                          </Typography>
                                  {riesgo.evaluacion.riesgoInherente && (
                                    <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                                      <strong>Riesgo Inherente:</strong> {riesgo.evaluacion.riesgoInherente}
                                    </Typography>
                                  )}
                          <Typography variant="body2">
                                    <strong>Impacto Global:</strong> {punto.impacto || riesgo.evaluacion.impactoGlobal || 1}
                          </Typography>
                                  {riesgo.evaluacion.nivelRiesgo && (
                                    <Chip
                                      label={riesgo.evaluacion.nivelRiesgo}
                                      size="small"
                                      sx={{
                                        backgroundColor: getColorByNivelRiesgo(riesgo.evaluacion.nivelRiesgo),
                                        color: '#fff',
                                        fontWeight: 600,
                                      }}
                                    />
                                  )}
                                </Box>
                              </CardContent>
                            </Card>
                          )}

                          {/* Causas */}
                          {riesgo && riesgo.causas && riesgo.causas.length > 0 && (
                            <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                  Causas ({riesgo.causas.length})
                                </Typography>
                                <List dense>
                                  {riesgo.causas.slice(0, 5).map((causa: any, idx: number) => (
                                    <ListItem key={causa.id || idx} sx={{ py: 0.5 }}>
                                      <ListItemText
                                        primary={repairSpanishDisplayArtifacts(
                                          String(causa.descripcion || 'Sin descripción')
                                        )}
                                        secondary={`Frecuencia: ${causa.frecuencia || 'N/A'}${causa.fuenteCausa ? ` | Fuente: ${repairSpanishDisplayArtifacts(String(causa.fuenteCausa))}` : ''}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                      />
                                    </ListItem>
                                  ))}
                                  {riesgo.causas.length > 5 && (
                                    <ListItem>
                                      <Typography variant="caption" color="text.secondary">
                                        ... y {riesgo.causas.length - 5} más
                                      </Typography>
                                    </ListItem>
                                  )}
                                </List>
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            ) : (
              // Para mapa residual: usar acordeones con información inherente, residual y controles
              <Box>
                {riesgosCeldaSeleccionada.map((punto) => {
                  const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                  const riesgoId = String(punto.riesgoId);
                  const isExpanded = riesgosExpandidos[riesgoId] || false;
                  
                  const descripcion = punto.descripcion || riesgo?.descripcion || 'Sin descripción';
                  const zonaRaw = punto.zona || riesgo?.zona || null;
                  const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                  const tipologia = punto.tipologiaNivelI || riesgo?.tipologiaNivelI || null;
                  
                  // Obtener fecha del riesgo
                  const fechaRiesgo = riesgo?.createdAt || riesgo?.updatedAt;
                  const fechaFormateada = fechaRiesgo ? new Date(fechaRiesgo).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Sin fecha';
                  
                  const handleToggleExpand = () => {
                    setRiesgosExpandidos(prev => ({
                      ...prev,
                      [riesgoId]: !prev[riesgoId]
                    }));
                  };
                  
                  // Obtener información de evaluación
                  const evaluacion = riesgo?.evaluacion;

                  // Valores inherentes (desde punto o evaluación)
                  const probabilidadInherente = punto.probabilidad || evaluacion?.probabilidad || 1;
                  const impactoInherente = punto.impacto || evaluacion?.impactoGlobal || 1;
                  const riesgoInherente = evaluacion?.riesgoInherente;
                  const nivelRiesgoInherente = evaluacion?.nivelRiesgo;

                  const procesoIdRes =
                    punto.procesoId != null ? String(punto.procesoId) : riesgo?.procesoId != null ? String(riesgo.procesoId) : '';
                  const modoResidualUi = procesoIdRes
                    ? (residualModoPorProcesoId.get(procesoIdRes) ?? 'ESTANDAR')
                    : 'ESTANDAR';

                  // Estándar: causa dominante; estratégico: usar evaluación persistida, no recálculo por causas en cliente.
                  const residualDesdeCausas =
                    modoResidualUi === 'ESTRATEGICO' ? null : calcularResidualDesdeCausas(riesgo);

                  const probabilidadResidual =
                    modoResidualUi === 'ESTRATEGICO'
                      ? (evaluacion?.probabilidadResidual ?? punto.probabilidadResidual ?? null)
                      : (residualDesdeCausas?.probabilidadResidual ??
                        punto.probabilidadResidual ??
                        evaluacion?.probabilidadResidual ??
                        null);

                  const impactoResidual =
                    modoResidualUi === 'ESTRATEGICO'
                      ? (evaluacion?.impactoResidual ?? punto.impactoResidual ?? null)
                      : (residualDesdeCausas?.impactoResidual ??
                        punto.impactoResidual ??
                        evaluacion?.impactoResidual ??
                        null);

                  const riesgoResidual =
                    modoResidualUi === 'ESTRATEGICO'
                      ? (evaluacion?.riesgoResidual ?? null)
                      : (residualDesdeCausas?.riesgoResidual ?? evaluacion?.riesgoResidual ?? null);

                  // Calcular nivelRiesgoResidual siguiendo mismas bandas que Controles/Resumen
                  let nivelRiesgoResidual: string | null = residualDesdeCausas?.nivelRiesgoResidual ?? null;

                  // Prioridad 2: si aún no hay nivel, intentar desde riesgoResidual numérico
                  if (!nivelRiesgoResidual && riesgoResidual !== undefined && riesgoResidual !== null) {
                    const riesgoResNum = Number(riesgoResidual);
                    if (!isNaN(riesgoResNum) && riesgoResNum > 0) {
                      if (riesgoResNum >= 15 && riesgoResNum <= 25) {
                        nivelRiesgoResidual = NIVELES_RIESGO.CRITICO;
                      } else if (riesgoResNum >= 10 && riesgoResNum < 15) {
                        nivelRiesgoResidual = NIVELES_RIESGO.ALTO;
                      } else if (riesgoResNum >= 4 && riesgoResNum < 10) {
                        nivelRiesgoResidual = NIVELES_RIESGO.MEDIO;
                      } else if (riesgoResNum >= 1 && riesgoResNum < 4) {
                        nivelRiesgoResidual = NIVELES_RIESGO.BAJO;
                      } else {
                        nivelRiesgoResidual = 'Sin Calificar';
                      }
                    }
                  }

                  // Prioridad 3: Si todavía no hay nivel, calcular desde probabilidadResidual e impactoResidual
                  if (!nivelRiesgoResidual && probabilidadResidual && impactoResidual) {
                    const probResNum = Number(probabilidadResidual);
                    const impResNum = Number(impactoResidual);
                    if (!isNaN(probResNum) && !isNaN(impResNum) &&
                        probResNum >= 1 && probResNum <= 5 &&
                        impResNum >= 1 && impResNum <= 5) {
                      nivelRiesgoResidual = calcularNivelRiesgo(probResNum, impResNum);
                    }
                  }

                  // Prioridad 4: Fallback al valor guardado solo si no se pudo calcular
                  if (!nivelRiesgoResidual) {
                    nivelRiesgoResidual = evaluacion?.nivelRiesgoResidual || null;
                  }
                  
                  // Riesgo tiene control si alguna causa tiene CONTROL o AMBOS (con control activo)
                  const controlesAplicados = riesgo?.causas?.filter((c: any) => {
                    const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                    if (tipo === 'CONTROL') return true;
                    if (tipo === 'AMBOS') {
                      const controlActivo = (c.gestion && typeof c.gestion === 'object' && c.gestion.estadoAmbos)
                        ? c.gestion.estadoAmbos.controlActivo !== false
                        : true;
                      return controlActivo;
                    }
                    return false;
                  }) || [];
                  const tieneControl = controlesAplicados.length > 0;
                  // Plan(es) de acción: causas con PLAN o AMBOS (con plan activo)
                  const planesAccion = riesgo?.causas?.filter((c: any) => {
                    const tipo = (c.tipoGestion || '').toUpperCase();
                    if (tipo === 'PLAN') return true;
                    if (tipo === 'AMBOS') {
                      const planActivo = (c.gestion && typeof c.gestion === 'object' && c.gestion.estadoAmbos)
                        ? c.gestion.estadoAmbos.planActivo !== false
                        : true;
                      return planActivo;
                    }
                    return false;
                  }) || [];
                  const tienePlanAccion = planesAccion.length > 0;
                  
                  return (
                    <Accordion
                      key={punto.riesgoId}
                      expanded={isExpanded}
                      onChange={handleToggleExpand}
                      sx={{ mb: 1 }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          '& .MuiAccordionSummary-content': {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            mr: 2,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {generarIdRiesgo(punto)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={nivelRiesgoResidual || nivelRiesgoInherente || 'Sin calificar'}
                                size="small"
                                sx={{
                                  backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual || nivelRiesgoInherente || 'Sin Calificar'),
                                  color: '#fff',
                                  height: 20,
                                  fontSize: '0.7rem',
                                }}
                              />
                              {!tieneControl && (
                                <Chip label="Sin control" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                              <Chip
                                label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                                size="small"
                                color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {fechaFormateada}
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {/* Información del Riesgo */}
                          <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                Información del Riesgo
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                                <strong>Descripción:</strong>{' '}
                                {repairSpanishDisplayArtifacts(String(descripcion))}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                {zona && (
                              <Typography variant="body2">
                                    <strong>Zona:</strong> {repairSpanishDisplayArtifacts(String(zona))}
                              </Typography>
                                )}
                                {tipologia && (
                                <Typography variant="body2">
                                    <strong>Tipología:</strong> {repairSpanishDisplayArtifacts(String(tipologia))}
                                </Typography>
                              )}
                              </Box>
                            </CardContent>
                          </Card>

                          {/* Sin controles: aviso y explicación */}
                          {!tieneControl && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              <strong>Sin controles aplicados.</strong> La calificación residual es igual a la inherente. Este riesgo se muestra en la misma posición en ambos mapas hasta que se apliquen controles.
                            </Alert>
                          )}

                          {/* Calificación Inherente */}
                          <Card sx={{ mb: 2, bgcolor: 'rgba(211, 47, 47, 0.05)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                Calificación Inherente
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Typography variant="body2">
                                  <strong>Probabilidad:</strong> {probabilidadInherente}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Impacto Global:</strong> {impactoInherente}
                                </Typography>
                                {riesgoInherente != null && (
                                  <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                                    <strong>Riesgo Inherente:</strong> {riesgoInherente}
                                  </Typography>
                                )}
                                {nivelRiesgoInherente && (
                                  <Chip
                                    label={nivelRiesgoInherente}
                                    size="small"
                                    sx={{
                                      backgroundColor: getColorByNivelRiesgo(nivelRiesgoInherente),
                                      color: '#fff',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                            </CardContent>
                          </Card>

                          {/* Calificación Residual: siempre visible en mapa residual. Sin control = igual a inherente */}
                          <Card sx={{ mb: 2, bgcolor: 'rgba(46, 125, 50, 0.05)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                Calificación Residual
                              </Typography>
                              {!tieneControl ? (
                                <>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Al no tener controles, la calificación residual coincide con la inherente.
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Typography variant="body2"><strong>Probabilidad:</strong> {probabilidadInherente}</Typography>
                                    <Typography variant="body2"><strong>Impacto:</strong> {impactoInherente}</Typography>
                                    {riesgoInherente != null && (
                                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                        <strong>Riesgo Residual:</strong> {riesgoInherente}
                                      </Typography>
                                    )}
                                    {nivelRiesgoInherente && (
                                      <Chip label={nivelRiesgoInherente} size="small" sx={{ backgroundColor: getColorByNivelRiesgo(nivelRiesgoInherente), color: '#fff', fontWeight: 600 }} />
                                    )}
                                  </Box>
                                </>
                              ) : (
                                <>
                                  {(probabilidadResidual != null || impactoResidual != null || riesgoResidual != null) && (
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                                      {probabilidadResidual != null && <Typography variant="body2"><strong>Probabilidad Residual:</strong> {probabilidadResidual}</Typography>}
                                      {impactoResidual != null && <Typography variant="body2"><strong>Impacto Residual:</strong> {impactoResidual}</Typography>}
                                      {riesgoResidual != null && (
                                        <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                          <strong>Riesgo Residual:</strong> {riesgoResidual}
                                        </Typography>
                                      )}
                                      {nivelRiesgoResidual && (
                                        <Chip label={nivelRiesgoResidual} size="small" sx={{ backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual), color: '#fff', fontWeight: 600 }} />
                          )}
                        </Box>
                                  )}
                                  {nivelRiesgoInherente && nivelRiesgoResidual && nivelRiesgoInherente !== nivelRiesgoResidual && (
                                    <Typography variant="body2" color="success.dark" sx={{ mt: 1 }}>
                                      Reducción: de {nivelRiesgoInherente} a {nivelRiesgoResidual}.
                                    </Typography>
                                  )}
                                </>
                              )}
                      </CardContent>
                    </Card>

                          {/* Plan(es) de acción: cuando tiene plan y no control, o siempre que tenga plan */}
                          {tienePlanAccion && (
                            <Card sx={{ mb: 2, bgcolor: 'rgba(255, 152, 0, 0.06)' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                  Plan(es) de acción ({planesAccion.length})
                                </Typography>
                                <List dense disablePadding>
                                  {planesAccion.map((causa: any, idx: number) => {
                                    const g = causa.gestion && typeof causa.gestion === 'object' ? causa.gestion : {};
                                    const desc = repairSpanishDisplayArtifacts(
                                      String(
                                        g.planDescripcion ||
                                          causa.planDescripcion ||
                                          causa.descripcion ||
                                          'Sin descripción'
                                      )
                                    );
                                    const resp = g.planResponsable || causa.planResponsable || '—';
                                    const fecha = g.planFechaEstimada || causa.planFechaEstimada || '—';
                                    return (
                                      <ListItem key={causa.id || idx} sx={{ flexDirection: 'column', alignItems: 'stretch', py: 1 }}>
                                        <ListItemText primary={desc} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }} component="span">
                                          <Typography variant="caption" color="text.secondary">
                                            Responsable: {repairSpanishDisplayArtifacts(String(resp))}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">Fecha est.: {typeof fecha === 'string' && fecha !== '—' ? new Date(fecha).toLocaleDateString('es-ES') : fecha}</Typography>
                                        </Box>
                                      </ListItem>
                  );
                })}
              </List>
                              </CardContent>
                            </Card>
                          )}

                          {/* Controles Aplicados */}
                          {controlesAplicados.length > 0 && (
                            <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                  Controles Aplicados ({controlesAplicados.length})
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                                  <Table size="small">
                                    <TableHead>
                                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableCell><strong>Descripción del Control</strong></TableCell>
                                    <TableCell align="center"><strong>Efectividad</strong></TableCell>
                                    <TableCell align="center"><strong>% Mitigación</strong></TableCell>
                                    <TableCell align="center"><strong>Calificación Residual</strong></TableCell>
                                    <TableCell align="center"><strong>Nivel Residual</strong></TableCell>
                                  </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {controlesAplicados.map((causa: any, idx: number) => {
                                        const datosCtrl = getDatosEvaluacionControlDesdeCausa(causa);
                                        const residualCausa = calcularResidualPorCausa(causa);

                                        let calificacionResidual: number | null = residualCausa?.riesgoResidual ?? null;
                                        let nivelRiesgoResidual: string | null = residualCausa?.nivelRiesgoResidual ?? null;

                                        if (calificacionResidual == null && causa.calificacionResidual != null) {
                                          const n = Number(causa.calificacionResidual);
                                          if (!isNaN(n) && n > 0) calificacionResidual = n;
                                        }
                                        if (!nivelRiesgoResidual && calificacionResidual != null) {
                                          const calResNum = Number(calificacionResidual);
                                          if (!isNaN(calResNum) && calResNum > 0) {
                                            if (calResNum >= 15 && calResNum <= 25) nivelRiesgoResidual = NIVELES_RIESGO.CRITICO;
                                            else if (calResNum >= 10 && calResNum < 15) nivelRiesgoResidual = NIVELES_RIESGO.ALTO;
                                            else if (calResNum >= 4 && calResNum < 10) nivelRiesgoResidual = NIVELES_RIESGO.MEDIO;
                                            else if (calResNum >= 1 && calResNum < 4) nivelRiesgoResidual = NIVELES_RIESGO.BAJO;
                                            else nivelRiesgoResidual = 'Sin Calificar';
                                          }
                                        }
                                        if (
                                          (!nivelRiesgoResidual || nivelRiesgoResidual === 'Sin Calificar') &&
                                          causa.frecuenciaResidual != null &&
                                          causa.impactoResidual != null
                                        ) {
                                          const freqResNum = Number(causa.frecuenciaResidual);
                                          const impResNum = Number(causa.impactoResidual);
                                          if (
                                            !isNaN(freqResNum) &&
                                            !isNaN(impResNum) &&
                                            freqResNum >= 1 &&
                                            freqResNum <= 5 &&
                                            impResNum >= 1 &&
                                            impResNum <= 5
                                          ) {
                                            nivelRiesgoResidual = calcularNivelRiesgo(freqResNum, impResNum);
                                          }
                                        }

                                        return (
                                          <TableRow key={causa.id || idx}>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                              <DescripcionControlCorta texto={datosCtrl.descripcionControl} />
                                            </TableCell>
                                            <TableCell align="center">{datosCtrl.efectividad}</TableCell>
                                            <TableCell align="center">{datosCtrl.porcentajeMitigacionEntero}%</TableCell>
                                            <TableCell align="center">
                                              {calificacionResidual != null
                                                ? calificacionResidual.toFixed(2)
                                                : 'N/A'}
                                            </TableCell>
                                            <TableCell align="center">
                                              {nivelRiesgoResidual && nivelRiesgoResidual !== 'Sin Calificar' ? (
                                                <Chip
                                                  label={nivelRiesgoResidual}
                                                  size="small"
                                                  sx={{
                                                    backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual),
                                                    color: '#fff',
                                                    fontSize: '0.7rem',
                                                  }}
                                                />
                                              ) : (
                                                'N/A'
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </CardContent>
                            </Card>
                          )}

                          {/* Información del Proceso */}
                          {riesgo && riesgo.procesoId && (() => {
                            const procesoRiesgo = procesos.find(p => String(p.id) === String(riesgo.procesoId));
                            const procesoNombre = procesoRiesgo?.nombre || punto.procesoNombre || 'Proceso desconocido';
                            
                            return (
                              <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                                <CardContent>
                                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem' }}>
                                    Información del Proceso
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body2">
                                      <strong>Proceso:</strong> {procesoNombre}
                                    </Typography>
                                    {procesoRiesgo?.areaNombre && (
                                      <Typography variant="body2">
                                        <strong>Área:</strong> {procesoRiesgo.areaNombre}
                                      </Typography>
                                    )}
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })()}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Diálogo de Detalles del Riesgo Individual */}
        <Dialog
          open={dialogoDetalleRiesgoAbierto}
          onClose={() => {
            setDialogoDetalleRiesgoAbierto(false);
            setRiesgoSeleccionadoDetalle(null);
            setPuntoSeleccionadoDetalle(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { maxWidth: 560 } }}
          disableEscapeKeyDown={false}
          disablePortal={false}
          keepMounted={false}
          disableScrollLock={true}
          BackdropProps={{
            sx: {
              pointerEvents: 'auto', // Asegurar que el backdrop capture clicks para cerrar
            },
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Resumen del Riesgo
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {riesgoSeleccionadoDetalle && (
                  <Chip
                    label={generarIdRiesgo(puntoSeleccionadoDetalle!)}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <IconButton
                  onClick={() => {
                    setDialogoDetalleRiesgoAbierto(false);
                    setRiesgoSeleccionadoDetalle(null);
                    setPuntoSeleccionadoDetalle(null);
                  }}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            {riesgoSeleccionadoDetalle && puntoSeleccionadoDetalle ? (
              <Box>
                {/* Para mapa residual: saber si tiene control o solo plan */}
                {tipoMapaDetalle === 'residual' && (() => {
                  const causas = (riesgoSeleccionadoDetalle.causas as any) || [];
                  const tieneControlDetalle = causas.some((c: any) => {
                    const t = (c.tipoGestion || '').toUpperCase();
                    if (t === 'CONTROL') return true;
                    if (t === 'AMBOS') return (c.gestion?.estadoAmbos?.controlActivo !== false);
                    return false;
                  });
                  if (!tieneControlDetalle) {
                    return (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>Sin controles aplicados.</strong> La calificación residual es igual a la inherente.
                      </Alert>
                    );
                  }
                  return null;
                })()}
                {/* Nivel y descripción (clasificación correcta en Evaluación del Riesgo más abajo) */}
                <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={puntoSeleccionadoDetalle.nivelRiesgo}
                        size="small"
                        sx={{
                          backgroundColor: getColorByNivelRiesgo(puntoSeleccionadoDetalle.nivelRiesgo),
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={puntoSeleccionadoDetalle?.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                        size="small"
                        color={(puntoSeleccionadoDetalle?.clasificacion === CLASIFICACION_RIESGO.POSITIVA) ? 'success' : 'warning'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Descripción:</strong>{' '}
                      {repairSpanishDisplayArtifacts(String(riesgoSeleccionadoDetalle.descripcion ?? ''))}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                      {(() => {
                        const zonaRaw = puntoSeleccionadoDetalle?.zona || riesgoSeleccionadoDetalle.zona;
                        const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                        return zona ? (
                      <Typography variant="body2">
                            <strong>Zona:</strong> {repairSpanishDisplayArtifacts(String(zona))}
                      </Typography>
                        ) : null;
                      })()}
                      {(puntoSeleccionadoDetalle?.tipologiaNivelI || riesgoSeleccionadoDetalle.tipologiaNivelI) && (
                      <Typography variant="body2">
                          <strong>Tipología:</strong>{' '}
                          {repairSpanishDisplayArtifacts(
                            String(
                              puntoSeleccionadoDetalle?.tipologiaNivelI ||
                                riesgoSeleccionadoDetalle.tipologiaNivelI ||
                                ''
                            )
                          )}
                        </Typography>
                      )}
                    </Box>

                    {/* Información del Proceso y Responsable */}
                    {(() => {
                      const procesoId = riesgoSeleccionadoDetalle.procesoId || puntoSeleccionadoDetalle?.procesoId;
                      const procesoNombre = puntoSeleccionadoDetalle?.procesoNombre || 
                        (procesoId ? procesos.find(p => String(p.id) === String(procesoId))?.nombre : null) ||
                        riesgoSeleccionadoDetalle.procesoNombre ||
                        'Proceso desconocido';
                      
                      if (procesoId) {
                        const procesoRiesgo = procesos.find(p => String(p.id) === String(procesoId));
                        return (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            Información del Proceso
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                                <strong>Proceso:</strong> {procesoNombre}
                            </Typography>
                              {procesoRiesgo?.responsableNombre && (
                              <Typography variant="body2">
                                <strong>Responsable (Dueño del Proceso):</strong>{' '}
                                <Chip
                                  label={procesoRiesgo.responsableNombre}
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 0.5 }}
                                />
                              </Typography>
                            )}
                              {procesoRiesgo?.areaNombre && (
                              <Typography variant="body2">
                                <strong>Área:</strong> {procesoRiesgo.areaNombre}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Card>

                {/* Evaluación del Riesgo */}
                {evaluacionRiesgo ? (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom fontWeight={600}>
                        Evaluación del Riesgo
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Probabilidad</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {evaluacionRiesgo.probabilidad}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Impacto Global</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {evaluacionRiesgo.impactoGlobal}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Riesgo Inherente</Typography>
                          <Typography variant="h6" fontWeight={600} color="error">
                            {evaluacionRiesgo.riesgoInherente}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Nivel de Riesgo</Typography>
                          <Chip
                            label={evaluacionRiesgo.nivelRiesgo}
                            size="small"
                            sx={{
                              backgroundColor: getColorByNivelRiesgo(evaluacionRiesgo.nivelRiesgo),
                              color: '#fff',
                              fontWeight: 600,
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                        Impactos por Dimensión
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mt: 1 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Personas</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoPersonas}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Legal</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoLegal}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Ambiental</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoAmbiental}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Procesos</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoProcesos}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Reputación</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoReputacion}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Económico</Typography>
                          <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoEconomico}</Typography>
                        </Box>
                      </Box>
                      {evaluacionRiesgo.evaluadoPor && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Evaluado por: <strong>{evaluacionRiesgo.evaluadoPor}</strong>
                          </Typography>
                          {evaluacionRiesgo.fechaEvaluacion && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Fecha: {new Date(evaluacionRiesgo.fechaEvaluacion).toLocaleDateString('es-ES')}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Este riesgo aún no tiene evaluación registrada.
                  </Alert>
                )}

                {/* Causas del Riesgo - Expandible */}
                {riesgoSeleccionadoDetalle && (riesgoSeleccionadoDetalle.causas as any) && (riesgoSeleccionadoDetalle.causas as any).length > 0 && (
                  <Accordion 
                    expanded={seccionesExpandidas.causas}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, causas: !prev.causas }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Causas Identificadas ({(riesgoSeleccionadoDetalle.causas as any)?.length || 0})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell><strong>Descripción</strong></TableCell>
                              <TableCell><strong>Fuente</strong></TableCell>
                              <TableCell align="center"><strong>Frecuencia</strong></TableCell>
                              <TableCell align="center"><strong>Calificación Inherente</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {((riesgoSeleccionadoDetalle.causas as any) || []).map((causa: any, idx: number) => (
                              <TableRow key={causa.id || idx}>
                                <TableCell>
                                  {repairSpanishDisplayArtifacts(String(causa.descripcion || 'Sin descripción'))}
                                </TableCell>
                                <TableCell>
                                  {repairSpanishDisplayArtifacts(String(causa.fuenteCausa || 'N/A'))}
                                </TableCell>
                                <TableCell align="center">{causa.frecuencia || 'N/A'}</TableCell>
                                <TableCell align="center">
                                  {causa.calificacionInherentePorCausa !== undefined && causa.calificacionInherentePorCausa !== null
                                    ? causa.calificacionInherentePorCausa.toFixed(2)
                                    : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Información Residual - Expandible (siempre en mapa residual; si no hay control, valores = inherentes) */}
                {evaluacionRiesgo && tipoMapaDetalle === 'residual' && (
                  <Accordion 
                    expanded={seccionesExpandidas.residual}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, residual: !prev.residual }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Evaluación Residual
              </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Probabilidad Residual</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {(evaluacionRiesgo as any).probabilidadResidual ?? puntoSeleccionadoDetalle?.probabilidadResidual ?? evaluacionRiesgo.probabilidad ?? 'N/A'}
                          </Typography>
            </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Impacto Residual</Typography>
                          <Typography variant="h6" fontWeight={600}>
                            {(evaluacionRiesgo as any).impactoResidual ?? puntoSeleccionadoDetalle?.impactoResidual ?? evaluacionRiesgo.impactoGlobal ?? 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Riesgo Residual</Typography>
                          <Typography variant="h6" fontWeight={600} color="success.main">
                            {(evaluacionRiesgo as any).riesgoResidual ?? evaluacionRiesgo.riesgoInherente ?? 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Nivel Riesgo Residual</Typography>
                            <Chip
                            label={(evaluacionRiesgo as any).nivelRiesgoResidual || evaluacionRiesgo.nivelRiesgo || 'N/A'}
                              size="small"
                              sx={{
                              backgroundColor: getColorByNivelRiesgo((evaluacionRiesgo as any).nivelRiesgoResidual || evaluacionRiesgo.nivelRiesgo),
                                color: '#fff',
                                fontWeight: 600,
                              mt: 0.5,
                            }}
                          />
                          </Box>
                        </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Controles Aplicados - Solo mostrar si es mapa residual */}
                {tipoMapaDetalle === 'residual' && riesgoSeleccionadoDetalle && (riesgoSeleccionadoDetalle.causas as any) && (riesgoSeleccionadoDetalle.causas as any).length > 0 && (
                  <Accordion 
                    expanded={seccionesExpandidas.controles}
                    onChange={() => setSeccionesExpandidas(prev => ({ ...prev, controles: !prev.controles }))}
                    sx={{ mt: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6" fontWeight={600}>
                        Controles Aplicados ({(riesgoSeleccionadoDetalle.causas as any).filter((c: any) => {
                          const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                          return tipo === 'CONTROL';
                        }).length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell><strong>Causa Original</strong></TableCell>
                              <TableCell><strong>Control</strong></TableCell>
                              <TableCell align="center"><strong>Efectividad</strong></TableCell>
                              <TableCell align="center"><strong>% Mitigación</strong></TableCell>
                              <TableCell align="center"><strong>Frec. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Imp. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Calif. Residual</strong></TableCell>
                              <TableCell align="center"><strong>Nivel Residual</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {((riesgoSeleccionadoDetalle.causas as any) || [])
                              .filter((c: any) => {
                                const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                                return tipo === 'CONTROL';
                              })
                              .map((causa: any, idx: number) => {
                                const datosCtrl = getDatosEvaluacionControlDesdeCausa(causa);
                                const residualCausa = calcularResidualPorCausa(causa);

                                let frecuenciaResidual: number | string =
                                  residualCausa?.probabilidadResidual ?? causa.frecuenciaResidual ?? 'N/A';
                                let impactoResidual: number | string =
                                  residualCausa?.impactoResidual ?? causa.impactoResidual ?? 'N/A';

                                let calificacionResidual: number | string | null =
                                  residualCausa?.riesgoResidual ?? causa.calificacionResidual ?? causa.riesgoResidual ?? null;
                                let nivelRiesgoResidual: string =
                                  residualCausa?.nivelRiesgoResidual || causa.nivelRiesgoResidual || 'N/A';

                                if (
                                  (nivelRiesgoResidual === 'N/A' || !nivelRiesgoResidual) &&
                                  typeof calificacionResidual === 'number'
                                ) {
                                  const calResNum = calificacionResidual;
                                  if (calResNum >= 15 && calResNum <= 25) nivelRiesgoResidual = NIVELES_RIESGO.CRITICO;
                                  else if (calResNum >= 10 && calResNum < 15) nivelRiesgoResidual = NIVELES_RIESGO.ALTO;
                                  else if (calResNum >= 4 && calResNum < 10) nivelRiesgoResidual = NIVELES_RIESGO.MEDIO;
                                  else if (calResNum >= 1 && calResNum < 4) nivelRiesgoResidual = NIVELES_RIESGO.BAJO;
                                }

                                return (
                                  <TableRow key={causa.id || idx}>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                      {repairSpanishDisplayArtifacts(String(causa.descripcion || 'Sin descripción'))}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 220 }}>
                                      <DescripcionControlCorta texto={datosCtrl.descripcionControl} />
                                    </TableCell>
                                    <TableCell align="center">{datosCtrl.efectividad}</TableCell>
                                    <TableCell align="center">
                                      {datosCtrl.porcentajeMitigacionEntero > 0
                                        ? `${datosCtrl.porcentajeMitigacionEntero}%`
                                        : 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">{frecuenciaResidual}</TableCell>
                                    <TableCell align="center">{impactoResidual}</TableCell>
                                    <TableCell align="center">
                                      {typeof calificacionResidual === 'number'
                                        ? calificacionResidual.toFixed(2)
                                        : calificacionResidual ?? 'N/A'}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={nivelRiesgoResidual}
                                        size="small"
                                        sx={{
                                          backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual),
                                          color: '#fff',
                                          fontWeight: 600,
                                          fontSize: '0.65rem',
                                          height: 20,
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                        )}
                      </Box>
            ) : null}
          </DialogContent>
        </Dialog>


        {/* Resumen de Estadísticas: Comparativa Inherente vs Residual */}
        <ResumenEstadisticasMapas
          matrizInherente={matrizInherente}
          matrizResidual={matrizResidual}
          procesos={procesos}
          filtroArea={filtroArea}
          filtroProceso={filtroProceso}
          puntosFiltrados={puntosFiltrados}
          riesgosCompletos={riesgosCompletos}
        />
      </>
        )
      )}
    </Box>
  );
}


