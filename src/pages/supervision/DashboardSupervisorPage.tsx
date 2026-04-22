/**
 * Dashboard Supervisor de Riesgos Page
 * Dashboard completo con gráficos y tablas para análisis de riesgos
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  LinearProgress,
  Collapse,
  TablePagination,
  Tooltip as MuiTooltip,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  BusinessCenter as BusinessCenterIcon,
  Category as CategoryIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  ReportProblem as ReportProblemIcon,
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
  Shield as ShieldIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery, useGetPuntosMapaQuery, useGetEjesMapaQuery, useGetPlanesQuery, useGetIncidenciasEstadisticasQuery, useGetIncidenciasQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../app/theme/colors';
import { UMBRALES_RIESGO } from '../../utils/constants';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import TotalRiesgosCard from '../../components/dashboard/TotalRiesgosCard';
import RiesgosPorProcesoCard from '../../components/dashboard/RiesgosPorProcesoCard';
import MetricCard from '../../components/dashboard/MetricCard';
import DashboardFiltros from '../../components/dashboard/DashboardFiltros';
import TablaResumenRiesgos from '../../components/dashboard/TablaResumenRiesgos';
import { repairSpanishDisplayArtifacts } from '../../utils/utf8Repair';
import TablaPlanesAccion from '../../components/dashboard/TablaPlanesAccion';
import IncidenciasCard from '../../components/dashboard/IncidenciasCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';
import { useAreasProcesosAsignados, isProcesoAsignadoASupervisor, isAreaAsignadaASupervisor, esUsuarioResponsableProceso } from '../../hooks/useAsignaciones';

export default function DashboardSupervisorPage() {
  const { esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user } = useAuth();
  const navigate = useNavigate();
  const { areas: areasAsignadasIds, procesos: procesosAsignadosIds } = useAreasProcesosAsignados();

  // Filtros
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);
  const [expandidosProcesos, setExpandidosProcesos] = useState<Record<string, boolean>>({});
  const [pageDetalleProcesos, setPageDetalleProcesos] = useState(1);
  const [rowsPerPageDetalleProcesos, setRowsPerPageDetalleProcesos] = useState(5);
  const [chartExpandido, setChartExpandido] = useState<Record<string, boolean>>({});

  // Consultas filtradas en backend: solo traer riesgos/incidencias del proceso cuando hay filtro (app más rápida)
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    {
      procesoId: filtroProceso !== 'all' ? filtroProceso : undefined,
      pageSize: filtroProceso !== 'all' ? 200 : 200,
      includeCausas: true,
    },
    { refetchOnMountOrArgChange: false }
  );
  const { data: procesosData } = useGetProcesosQuery();
  const { data: puntosMapa } = useGetPuntosMapaQuery(
    filtroProceso !== 'all' ? { procesoId: filtroProceso } : {},
    { refetchOnMountOrArgChange: false }
  );
  const { data: planesResponse } = useGetPlanesQuery({ page: 1, pageSize: 50 });
  const planesApi = planesResponse?.data ?? [];
  const { data: incidenciasStats } = useGetIncidenciasEstadisticasQuery({
    procesoId: filtroProceso !== 'all' ? filtroProceso : undefined
  });
  const { data: incidenciasData = [] } = useGetIncidenciasQuery({
    procesoId: filtroProceso !== 'all' ? filtroProceso : undefined
  });

  const todosLosRiesgos = riesgosData?.data || [];
  const todosLosProcesos = procesosData || [];
  const puntos = puntosMapa || [];

  // Filtrar procesos y riesgos según asignaciones del supervisor
  const procesos = useMemo(() => {
    if ((!esSupervisorRiesgos && !esDueñoProcesos && !esGerenteGeneralDirector) || !user) return todosLosProcesos;

    // Para Gerente General (Director), filtrar por asignaciones
    if (esGerenteGeneralDirector) {
      if (areasAsignadasIds.length === 0 && procesosAsignadosIds.length === 0) {
        return [];
      }
      return todosLosProcesos.filter((p: any) => {
        if (procesosAsignadosIds.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadasIds.includes(p.areaId)) return true;
        return false;
      });
    }

    // Para Gerente General Proceso, usar asignaciones (mismo que Supervisor)
    if (esGerenteGeneralProceso) {
      if (areasAsignadasIds.length === 0 && procesosAsignadosIds.length === 0) {
        return [];
      }
      return todosLosProcesos.filter((p: any) => {
        if (procesosAsignadosIds.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadasIds.includes(p.areaId)) return true;
        return false;
      });
    }

    // Para Dueño de Procesos (incluye Gerente General en modo Dueño)
    // Usar esDueñoProcesos en lugar de verificar role directamente
    // Esto cubre tanto role='dueño_procesos' como Gerente General con gerenteMode='dueño'
    if (esDueñoProcesos) {
      return todosLosProcesos.filter((p: any) => esUsuarioResponsableProceso(p, user.id));
    }

    // Para Supervisor (lógica existente)
    // Si no tiene asignaciones, no ve nada (o ver todos si es admin)
    if (areasAsignadasIds.length === 0 && procesosAsignadosIds.length === 0) {
      return [];
    }

    return todosLosProcesos.filter((p: any) => {
      // Si está asignado directamente al proceso
      if (procesosAsignadosIds.includes(String(p.id))) {
        return true;
      }
      // Si está asignado al área del proceso
      if (p.areaId && areasAsignadasIds.includes(p.areaId)) {
        return true;
      }
      return false;
    });
  }, [todosLosProcesos, areasAsignadasIds, procesosAsignadosIds, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user]);
  // Obtener nombres de áreas y procesos asignados
  const areasAsignadas = useMemo(() => {
    const areasUnicas = new Set<string>();
    procesos.forEach((p: any) => {
      if (p.areaNombre) areasUnicas.add(p.areaNombre);
    });
    return Array.from(areasUnicas);
  }, [procesos]);

  const procesosAsignados = useMemo(() => {
    return procesos.map((p: any) => p.nombre).filter(Boolean);
  }, [procesos]);
  const riesgos = useMemo(() => {
    // Si no es supervisor, dueño o gerente, mostrar todos (solo admin)
    if ((!esSupervisorRiesgos && !esDueñoProcesos && !esGerenteGeneralDirector && !esGerenteGeneralProceso) || !user) {
      return todosLosRiesgos;
    }

    // Obtener IDs de procesos asignados (asegurar comparación correcta string/number)
    const procesosIds = procesos.map((p: any) => String(p.id));
    
    // Filtrar riesgos que pertenecen a los procesos asignados
    // Asegurar que los riesgos tengan causas cargadas para contar controles
    return todosLosRiesgos.filter((r: any) => {
      const procesoIdRiesgo = String(r.procesoId);
      return procesosIds.includes(procesoIdRiesgo);
    }).map((r: any) => {
      // Asegurar que el riesgo tenga causas (si no las tiene, intentar obtenerlas del riesgo completo)
      if (!r.causas && todosLosRiesgos.find((tr: any) => tr.id === r.id)?.causas) {
        return { ...r, causas: todosLosRiesgos.find((tr: any) => tr.id === r.id)?.causas };
      }
      return r;
    });
  }, [todosLosRiesgos, procesos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user]);

  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number; tipo: 'inherente' | 'residual' } | null>(null);

  // Filtrar riesgos según filtros
  // IMPORTANTE: Siempre partir de riesgos ya filtrados por asignaciones
  const riesgosFiltrados = useMemo(() => {
    let filtrados = [...riesgos]; // Copiar array para no mutar el original

    // Filtrar por área
    if (filtroArea !== 'all') {
      const procesosEnArea = procesos.filter((p: any) => p.areaNombre === filtroArea);
      const procesosIds = procesosEnArea.map((p: any) => String(p.id));
      filtrados = filtrados.filter((r: any) => procesosIds.includes(String(r.procesoId)));
    }

    // Filtrar por proceso específico
    if (filtroProceso !== 'all') {
      filtrados = filtrados.filter((r: any) => String(r.procesoId) === String(filtroProceso));
    }

    // Filtrar por origen
    if (filtroOrigen !== 'all') {
      filtrados = filtrados.filter((r: any) => {
        if (filtroOrigen === 'talleres') {
          return r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller');
        }
        if (filtroOrigen === 'auditoria') {
          return r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría');
        }
        return true;
      });
    }

    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter((r: any) => {
        const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
        const sigla = proceso?.sigla || r.siglaGerencia || '';
        const codigo = r.numeroIdentificacion || `${r.numero || ''}${sigla}`;
        return (
          codigo.toLowerCase().includes(busquedaLower) ||
          r.descripcion?.toLowerCase().includes(busquedaLower) ||
          proceso?.nombre?.toLowerCase().includes(busquedaLower)
        );
      });
    }

    return filtrados;
  }, [riesgos, filtroArea, filtroProceso, filtroOrigen, busqueda, procesos]);

  // Crear matrices de riesgo inherente y residual
  // IMPORTANTE: Filtrar puntos según riesgos filtrados (que ya respetan asignaciones)
  const matrizInherente = useMemo(() => {
    const matriz: { [key: string]: any[] } = {};
    // Obtener IDs de riesgos filtrados para comparación eficiente
    const riesgosIds = new Set(riesgosFiltrados.map((r: any) => String(r.id)));
    // Filtrar puntos que corresponden a riesgos filtrados
    const puntosFiltrados = puntos.filter((p: any) => riesgosIds.has(String(p.riesgoId)));

    puntosFiltrados.forEach((punto: any) => {
      const key = `${punto.probabilidad}-${punto.impacto}`;
      if (!matriz[key]) {
        matriz[key] = [];
      }
      matriz[key].push(punto);
    });
    return matriz;
  }, [puntos, riesgosFiltrados]);

  const matrizResidual = useMemo(() => {
    const matriz: { [key: string]: any[] } = {};
    // Obtener IDs de riesgos filtrados para comparación eficiente
    const riesgosIds = new Set(riesgosFiltrados.map((r: any) => String(r.id)));
    // Filtrar puntos que corresponden a riesgos filtrados
    const puntosFiltrados = puntos.filter((p: any) => riesgosIds.has(String(p.riesgoId)));

    puntosFiltrados.forEach((punto: any) => {
      // Usar valores residuales del backend si están disponibles
      const probResidual = punto.probabilidadResidual || Math.max(1, Math.round(punto.probabilidad * 0.8));
      const impResidual = punto.impactoResidual || Math.max(1, Math.round(punto.impacto * 0.8));
      const key = `${probResidual}-${impResidual}`;
      if (!matriz[key]) {
        matriz[key] = [];
      }
      matriz[key].push({
        ...punto,
        probabilidad: probResidual,
        impacto: impResidual,
      });
    });
    return matriz;
  }, [puntos, riesgosFiltrados]);





  // Estadísticas - Usando hook personalizado
  const estadisticas = useDashboardEstadisticas({ riesgosFiltrados, procesos, puntos });

  // Procesos filtrados por área (para KPIs dinámicos)
  const procesosFiltradosPorArea = useMemo(() => {
    if (filtroArea === 'all') return procesos;
    return procesos.filter((p: any) => p.areaNombre === filtroArea);
  }, [procesos, filtroArea]);

  const kpis = useMemo(() => {
    const totalRiesgos = riesgosFiltrados.length;
    const totalProcesos = procesosFiltradosPorArea.length;
    
    // Filtrar puntos que corresponden a riesgos filtrados
    const riesgosIds = new Set(riesgosFiltrados.map((r: any) => String(r.id)));
    const puntosFiltrados = puntos.filter((p: any) => riesgosIds.has(String(p.riesgoId)));
    const riesgosCriticos = puntosFiltrados.filter((p: any) => (p.probabilidad * p.impacto) >= UMBRALES_RIESGO.CRITICO).length;
    
    return {
      totalRiesgos,
      totalProcesos,
      riesgosCriticos,
      fueraApetito: estadisticas.fueraApetito || 0,
    };
  }, [riesgosFiltrados, procesosFiltradosPorArea, puntos, estadisticas.fueraApetito]);

  const topProcesos = useMemo(() => {
    // Usar procesos filtrados por área si hay filtro de área
    const procesosParaContar = filtroArea !== 'all' 
      ? procesos.filter((p: any) => p.areaNombre === filtroArea)
      : procesos;
    
    const counts = procesosParaContar.map((p: any) => {
      const total = riesgosFiltrados.filter((r: any) => String(r.procesoId) === String(p.id)).length;
      return { id: p.id, nombre: p.nombre || 'Sin nombre', total };
    }).filter((p: any) => p.total > 0);

    // Mostrar todos los procesos con riesgos, no solo top 5
    return counts.sort((a: any, b: any) => b.total - a.total);
  }, [procesos, riesgosFiltrados, filtroArea]);

  const riesgosPorTipoProceso = useMemo(() => {
    return Object.entries(estadisticas.porTipoProceso || {}).map(([name, value]) => ({
      name: name.split(' ')[1] || name,
      fullName: name,
      value,
    }));
  }, [estadisticas.porTipoProceso]);

  const tendenciaMensual = useMemo(() => {
    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const months: { key: string; label: string; value: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthLabels[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
      months.push({ key, label, value: 0 });
    }

    riesgosFiltrados.forEach((r: any) => {
      const fecha = r.createdAt || r.updatedAt;
      if (!fecha) return;
      const key = String(fecha).slice(0, 7);
      const item = months.find((m) => m.key === key);
      if (item) item.value += 1;
    });

    return months;
  }, [riesgosFiltrados]);

  // Preparar datos para tabla de resumen
  const filasTablaResumen = useMemo(() => {
    return riesgosFiltrados.map((riesgo: any) => {
      const proceso = procesos.find((p: any) => p.id === riesgo.procesoId);
      // Usar numeroIdentificacion si existe, sino generar desde número y sigla del proceso
      const sigla = proceso?.sigla || riesgo.siglaGerencia || '';
      const codigo = riesgo.numeroIdentificacion || (riesgo.numero ? `${riesgo.numero}${sigla}` : `R${String(riesgo.numero || 0).padStart(3, '0')}`);
      const punto = puntos.find((p: any) => String(p.riesgoId) === String(riesgo.id));

      const riesgoInherente = punto ? punto.probabilidad * punto.impacto : (riesgo.evaluacion?.riesgoInherente || 0);
      const riesgoResidual = riesgo.evaluacion?.riesgoResidual ?? Math.round(riesgoInherente * 0.8);

      const obtenerNivelRiesgo = (valor: number) => {
        if (valor >= 20) return { nivel: 'CRÍTICO', color: colors.risk.critical.main };
        if (valor >= 15) return { nivel: 'ALTO', color: colors.risk.high.main };
        if (valor >= 10) return { nivel: 'MEDIO', color: colors.risk.medium.main };
        return { nivel: 'BAJO', color: colors.risk.low.main };
      };

      const nivelRI = obtenerNivelRiesgo(riesgoInherente);
      const nivelRR = obtenerNivelRiesgo(riesgoResidual);

      return {
        id: riesgo.id,
        codigo,
        proceso: proceso?.nombre || 'Sin proceso',
        descripcion: riesgo.descripcion || '',
        riesgoInherente,
        riesgoResidual,
        nivelRI: nivelRI.nivel,
        nivelRR: nivelRR.nivel,
        colorRI: nivelRI.color,
        colorRR: nivelRR.color,
      };
    });
  }, [riesgosFiltrados, procesos, puntos]);

  // Filtrar planes de acción según riesgos filtrados (que ya respetan asignaciones)
  // Incluye tanto planes preventivos (con riesgoId) como reactivos (con incidenciaId/procesoId)
  const planesFiltrados = useMemo(() => {
    if (!planesApi || planesApi.length === 0) {
      return [];
    }
    
    if (riesgosFiltrados.length === 0 && procesos.length === 0) {
      return [];
    }
    
    const riesgosIds = new Set(riesgosFiltrados.map((r: any) => String(r.id)));
    const procesosIds = new Set(procesos.map((p: any) => String(p.id)));
    
    const filtrados = (planesApi || []).filter((plan: any) => {
      // Planes preventivos: filtrar por riesgoId
      if (plan.riesgoId) {
        return riesgosIds.has(String(plan.riesgoId));
      }
      // Planes reactivos (sin riesgoId): filtrar por procesoId del plan
      // El backend ahora incluye procesoId desde la incidencia para planes reactivos
      if (plan.procesoId) {
        return procesosIds.has(String(plan.procesoId));
      }
      return false;
    });
    
    return filtrados;
  }, [planesApi, riesgosFiltrados, procesos]);

  // Preparar datos para tabla de planes de acción - Usando servicio centralizado
  const planesAccion = useMemo(() => {
    return planesFiltrados.map((plan: any) => ({
      id: plan.id,
      nombre: plan.descripcion || 'Plan de acción',
      proceso: plan.procesoNombre || 'Sin proceso',
      responsable: plan.responsable || 'Sin responsable',
      fechaLimite: plan.fechaFin || plan.fechaProgramada || plan.fechaInicio || new Date().toISOString(),
      estado: (plan.estado || 'pendiente').toString().toLowerCase().replace(' ', '_'),
      porcentajeAvance: plan.estado === 'Completado' ? 100 : plan.estado === 'En ejecución' ? 50 : 0,
    }));
  }, [planesFiltrados]);

  const totalIncidencias = incidenciasStats?.total || 0;

  // Solo supervisor de riesgos y dueño de procesos pueden acceder
  if (!esSupervisorRiesgos && !esDueñoProcesos) {
    return (
      <Box>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo el Supervisor de Riesgos y el Dueño del Proceso pueden ver este dashboard.
        </Alert>
      </Box>
    );
  }

  // Mostrar información de asignaciones - aplica para supervisor Y dueño de procesos
  const tieneAsignaciones = (esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesos.length > 0;
  const sinAsignaciones = (esSupervisorRiesgos || esDueñoProcesos || esGerenteGeneralDirector) && procesos.length === 0;

  // Columnas movidas a componentes TablaResumenRiesgos y TablaPlanesAccion

  // Función para obtener color de celda
  const getCellColor = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    const cellKey = `${probabilidad}-${impacto}`;
    const cellColorMap: { [key: string]: string } = {
      '1-5': colors.risk.high.main,
      '2-5': colors.risk.high.main,
      '3-5': colors.risk.critical.main,
      '4-5': colors.risk.critical.main,
      '5-5': colors.risk.critical.main,
      '1-4': colors.risk.medium.main,
      '2-4': colors.risk.medium.main,
      '3-4': colors.risk.high.main,
      '4-4': colors.risk.critical.main,
      '5-4': colors.risk.critical.main,
      '1-3': colors.risk.low.main,
      '2-3': colors.risk.medium.main,
      '3-3': colors.risk.medium.main,
      '4-3': colors.risk.high.main,
      '5-3': colors.risk.critical.main,
      '1-2': colors.risk.low.main,
      '2-2': colors.risk.low.main,
      '3-2': colors.risk.medium.main,
      '4-2': colors.risk.medium.main,
      '5-2': colors.risk.high.main,
      '1-1': colors.risk.low.main,
      '2-1': colors.risk.low.main,
      '3-1': colors.risk.low.main,
      '4-1': colors.risk.medium.main,
      '5-1': colors.risk.high.main,
    };
    if (cellColorMap[cellKey]) {
      return cellColorMap[cellKey];
    }
    if (riesgo >= 25) return colors.risk.critical.main;
    if (riesgo >= 17) return '#d32f2f';
    if (riesgo >= 10) return colors.risk.high.main;
    if (riesgo >= 4) return colors.risk.medium.main;
    return colors.risk.low.main;
  };

  const getCellLabel = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return 'CRÍTICO';
    if (riesgo >= 15) return 'ALTO';
    if (riesgo >= 10) return 'MEDIO';
    return 'BAJO';
  };

  // Función para renderizar mapa de calor
  const { data: ejes } = useGetEjesMapaQuery();

  const renderMapaCalor = (tipo: 'inherente' | 'residual') => {
    const matriz = tipo === 'inherente' ? matrizInherente : matrizResidual;
    const esFueraApetito = (prob: number, imp: number) => {
      const valor = prob * imp;
      return valor >= UMBRALES_RIESGO.ALTO;
    };

    // Prepare dynamic axes
    const impactos = ejes?.impacto.map(i => i.valor).sort((a, b) => b - a) || [5, 4, 3, 2, 1];
    const probabilidades = ejes?.probabilidad.map(p => p.valor).sort((a, b) => a - b) || [1, 2, 3, 4, 5];

    return (
      <Box sx={{ minWidth: 400, position: 'relative' }}>
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
                        width: 60,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                        {impacto}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.1, fontSize: '0.6rem' }}>
                        {etiquetaImpacto}
                      </Typography>
                    </Box>
                    {probabilidades.map((probabilidad) => {
                      const key = `${probabilidad}-${impacto}`;
                      const cellRiesgos = matriz[key] || [];
                      const cellColor = getCellColor(probabilidad, impacto);
                      const cellLabel = getCellLabel(probabilidad, impacto);
                      const fueraApetito = esFueraApetito(probabilidad, impacto);

                      return (
                        <Box
                          key={probabilidad}
                          onClick={() => {
                            if (cellRiesgos.length > 0) {
                              setCeldaSeleccionada({ probabilidad, impacto, tipo });
                              setRiesgosFueraApetitoDialogOpen(true);
                            }
                          }}
                          sx={{
                            width: 70,
                            minHeight: 70,
                            border: fueraApetito ? '3px solid #d32f2f' : '2px solid #000',
                            backgroundColor: `${cellColor}20`,
                            borderLeftColor: cellColor,
                            borderLeftWidth: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            cursor: cellRiesgos.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            p: 0.5,
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: `${cellColor}40`,
                              transform: cellRiesgos.length > 0 ? 'scale(1.05)' : 'none',
                            },
                            ml: 0.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, fontSize: '0.65rem' }}>
                            {cellLabel}
                          </Typography>
                          <Chip
                            label={cellRiesgos.length}
                            size="small"
                            sx={{
                              mb: 0.5,
                              backgroundColor: cellColor,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              height: 18,
                              '& .MuiChip-label': {
                                px: 0.5,
                              },
                            }}
                          />
                          {fueraApetito && (
                            <WarningIcon
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                fontSize: '0.9rem',
                                color: '#d32f2f',
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
              <Box display="flex" mt={0.5}>
                <Box sx={{ width: 60 }} />
                {probabilidades.map((prob) => {
                  const etiquetaProb = ejes?.probabilidad.find(p => p.valor === prob)?.nombre || '';

                  return (
                    <Box
                      key={prob}
                      sx={{
                        width: 70,
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
                      <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                        {prob}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.6rem', lineHeight: 1.1 }}>
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

  return (
    <Box>
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
              <WarningIcon
                sx={{ fontSize: 80, color: 'warning.main', mb: 2 }}
              />
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Aún no tiene procesos asignados
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Para acceder a las estadísticas y funcionalidades del dashboard, necesita que el administrador le asigne áreas o procesos para supervisar.
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

      {/* Contenido del dashboard - solo visible si tiene asignaciones */}
      {!sinAsignaciones && (<>

        {/* Tarjetas de Asignaciones */}
        {tieneAsignaciones && (
          <Grid2 container spacing={2} sx={{ mb: 3 }}>
            <Grid2 xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Áreas Asignadas ({areasAsignadas.length})
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                    {areasAsignadas.length > 0 ? (
                      <List dense>
                        {areasAsignadas.map((area, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                            <Chip
                              label={area}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay áreas asignadas
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountTreeIcon sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Procesos Asignados ({procesosAsignados.length})
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: 150, overflowY: 'auto', pr: 1 }}>
                    {procesosAsignados.length > 0 ? (
                      <List dense>
                        {procesosAsignados.map((proceso, idx) => (
                          <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                            <Chip
                              label={proceso}
                              size="small"
                              variant="outlined"
                              color="secondary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No hay procesos asignados
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>
        )}

        {/* Filtros - Usando componente */}
        <DashboardFiltros
          filtroArea={filtroArea}
          filtroProceso={filtroProceso}
          filtroOrigen={filtroOrigen}
          onFiltroAreaChange={setFiltroArea}
          onFiltroProcesoChange={setFiltroProceso}
          onFiltroOrigenChange={setFiltroOrigen}
          procesos={procesos}
          riesgos={riesgos}
          ocultarFiltroOrigen={esDueñoProcesos} // Ocultar filtro Origen para Dueño de Procesos (incluye Gerente General en modo Dueño)
        />

        {/* Resumen Ejecutivo y Tendencia (con KPIs combinados) */}
        <Grid2 container spacing={2.5} sx={{ mb: 3 }}>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Resumen Ejecutivo
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Vista rápida de los principales indicadores del proceso seleccionado.
                </Typography>
                {/* Tarjetas compactas de KPIs dentro del resumen ejecutivo */}
                <Grid2 container spacing={1.5}>
                  {(() => {
                    // Calcular conteos desde causas.tipoGestion
                    let totalControles = 0;
                    let totalPlanes = 0;
                    let riesgosCriticos = 0;
                    let riesgosAltos = 0;
                    let riesgosMedios = 0;
                    let riesgosBajos = 0;

                    riesgosFiltrados.forEach((r: any) => {
                      // Conteo de controles y planes desde causas
                      if (r.causas && Array.isArray(r.causas)) {
                        r.causas.forEach((causa: any) => {
                          const tipo = String(causa.tipoGestion || '').toUpperCase();
                          if (tipo === 'CONTROL' || tipo === 'AMBOS') totalControles++;
                          if (tipo === 'PLAN' || tipo === 'AMBOS') totalPlanes++;
                        });
                      }
                    });

                    const metrics = [
                      { label: 'Procesos', value: procesos.length, icon: <AccountTreeIcon sx={{ fontSize: 20 }} />, color: '#1565c0', bg: '#e3f2fd' },
                      { label: 'Riesgos', value: riesgosFiltrados.length, icon: <WarningIcon sx={{ fontSize: 20 }} />, color: '#7b1fa2', bg: '#f3e5f5' },
                      { label: 'Controles', value: totalControles, icon: <ShieldIcon sx={{ fontSize: 20 }} />, color: '#0277bd', bg: '#e1f5fe' },
                      { label: 'Planes', value: totalPlanes, icon: <PlaylistAddCheckIcon sx={{ fontSize: 20 }} />, color: '#e65100', bg: '#fff3e0' },
                    ];

                    return metrics.map((m) => (
                      <Grid2 key={m.label} xs={6} sm={3}>
                        <Card
                          sx={{
                            height: '100%',
                            borderLeft: `4px solid ${m.color}`,
                            transition: 'all 0.15s',
                            '&:hover': { boxShadow: `0 2px 12px ${m.color}20`, transform: 'translateY(-1px)' },
                          }}
                        >
                          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography variant="h5" fontWeight={800} sx={{ color: m.color, lineHeight: 1.2 }}>
                                  {m.value}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.7rem', lineHeight: 1 }}>
                                  {m.label}
                                </Typography>
                              </Box>
                              {m.icon && (
                                <Box sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '8px',
                                  backgroundColor: m.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: m.color,
                                }}
                                >
                                  {m.icon}
                                </Box>
                              )}
                              {!m.icon && (
                                <Box sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  backgroundColor: m.color,
                                }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid2>
                    ));
                  })()}
                </Grid2>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }} noWrap title="Tendencia mensual (últimos 6 meses)">
                  Tendencia mensual (últimos 6 meses)
                </Typography>
                {(() => {
                  const maxVal = Math.max(1, ...tendenciaMensual.map((m) => m.value));
                  const barAreaPx = 96;
                  return (
                    <Box sx={{ mt: 1, height: 132, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flex: 1, minHeight: 0, maxHeight: barAreaPx }}>
                        {tendenciaMensual.map((item) => {
                          const h = item.value <= 0 ? 4 : Math.max(8, Math.round((item.value / maxVal) * barAreaPx));
                          return (
                            <Box key={item.key} sx={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  maxWidth: 48,
                                  height: h,
                                  backgroundColor: item.value > 0 ? 'primary.main' : 'grey.300',
                                  borderRadius: 1,
                                  transition: 'height 0.2s ease',
                                }}
                              />
                            </Box>
                          );
                        })}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
                        {tendenciaMensual.map((item) => (
                          <Box key={`${item.key}-lbl`} sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                              {item.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Graficas adicionales */}
        <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          <Grid2 xs={12} md={6}>
            <RiesgosPorProcesoCard datosReales={estadisticas.porProceso} />
          </Grid2>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Calificaciones por Nivel de Riesgo
                </Typography>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    {(() => {
                      // Asegurar que todos los niveles aparezcan, incluso con 0
                      const nivelesCompletos = {
                        'Crítico': estadisticas.porNivelRiesgo?.['Crítico'] || 0,
                        'Alto': estadisticas.porNivelRiesgo?.['Alto'] || 0,
                        'Medio': estadisticas.porNivelRiesgo?.['Medio'] || 0,
                        'Bajo': estadisticas.porNivelRiesgo?.['Bajo'] || 0,
                      };
                      
                      const dataNiveles = Object.entries(nivelesCompletos)
                        .map(([name, value]) => ({
                          name,
                          value,
                          color: name === 'Crítico' ? '#d32f2f' : 
                                 name === 'Alto' ? '#f57c00' : 
                                 name === 'Medio' ? '#fbc02d' : 
                                 name === 'Bajo' ? '#388e3c' : '#666'
                        }));
                      
                      const COLORS = dataNiveles.map(d => d.color);
                      
                      return dataNiveles.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay riesgos calificados</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dataNiveles} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Cantidad">
                              {dataNiveles.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Tercera fila de gráficas */}
        <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350 }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Riesgo Inherente vs Residual por Proceso
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Efectividad de controles" size="small" sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.7rem' }} />
                    {riesgosFiltrados.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={chartExpandido['inh-res'] ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                        onClick={() => setChartExpandido((p) => ({ ...p, 'inh-res': !p['inh-res'] }))}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        {chartExpandido['inh-res'] ? 'Colapsar' : 'Expandir gráfico'}
                      </Button>
                    )}
                  </Box>
                </Box>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: chartExpandido['inh-res'] ? Math.max(300, Object.keys((() => { const d: Record<string,number> = {}; procesos.forEach((p: any) => { d[p.nombre || ''] = 1; }); return d; })()).length * 50) : 320, transition: 'height 0.25s ease', overflow: 'hidden' }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; promedioInherente: number; promedioResidual: number; totalRiesgos: number }> = {};
                      // Inicializar TODOS los procesos asignados con 0
                      procesos.forEach((p: any) => {
                        const nombre = p.nombre || 'Sin nombre';
                        dataPorProceso[nombre] = { nombre, promedioInherente: 0, promedioResidual: 0, totalRiesgos: 0 };
                      });
                      riesgosFiltrados.forEach((r: any) => {
                        const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
                        const procesoNombre = proceso?.nombre || 'Sin proceso';
                        if (!dataPorProceso[procesoNombre]) {
                          dataPorProceso[procesoNombre] = { nombre: procesoNombre, promedioInherente: 0, promedioResidual: 0, totalRiesgos: 0 };
                        }
                        const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
                        const inherente = punto ? punto.probabilidad * punto.impacto : (r.evaluacion?.riesgoInherente || 0);
                        const residual = r.evaluacion?.riesgoResidual ?? (punto ? (punto.probabilidadResidual || punto.probabilidad) * (punto.impactoResidual || punto.impacto) : Math.round(inherente * 0.8));
                        dataPorProceso[procesoNombre].promedioInherente += inherente;
                        dataPorProceso[procesoNombre].promedioResidual += residual;
                        dataPorProceso[procesoNombre].totalRiesgos++;
                      });
                      const chartData = Object.values(dataPorProceso).map(d => ({
                        nombre: d.nombre,
                        nombreCompleto: d.nombre,
                        'R. Inherente': d.totalRiesgos > 0 ? Number((d.promedioInherente / d.totalRiesgos).toFixed(1)) : 0,
                        'R. Residual': d.totalRiesgos > 0 ? Number((d.promedioResidual / d.totalRiesgos).toFixed(1)) : 0,
                        totalRiesgos: d.totalRiesgos,
                      })).sort((a, b) => b['R. Inherente'] - a['R. Inherente']);
                      return chartData.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay riesgos evaluados</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={160} interval={0} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <Tooltip content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0]?.payload;
                                const reduccion = data?.['R. Inherente'] > 0 ? ((1 - data?.['R. Residual'] / data?.['R. Inherente']) * 100).toFixed(0) : '0';
                                return (
                                  <Box sx={{ backgroundColor: 'white', p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                    <Typography variant="subtitle2" fontWeight={700}>{data?.nombreCompleto || label}</Typography>
                                    <Typography variant="body2" sx={{ color: '#d32f2f' }}>Inherente: {data?.['R. Inherente']}</Typography>
                                    <Typography variant="body2" sx={{ color: '#2e7d32' }}>Residual: {data?.['R. Residual']}</Typography>
                                    <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>Reducción: {reduccion}%</Typography>
                                    <Typography variant="caption" color="text.secondary">{data?.totalRiesgos} riesgos</Typography>
                                  </Box>
                                );
                              }
                              return null;
                            }} />
                            <Legend />
                            <Bar dataKey="R. Inherente" fill="#d32f2f" radius={[0, 4, 4, 0]} barSize={18} />
                            <Bar dataKey="R. Residual" fill="#4caf50" radius={[0, 4, 4, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid2>

          {/* Top 5 Riesgos Más Críticos */}
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350, maxHeight: 420 }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Top Riesgos Más Críticos
                  </Typography>
                  <Chip
                    label="Atención prioritaria"
                    size="small"
                    sx={{ backgroundColor: '#fce4ec', color: '#c62828', fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay riesgos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pr: 0.5 }}>
                    {(() => {
                      // Calcular puntaje inherente para cada riesgo y rankear
                      const riesgosConPuntaje = riesgosFiltrados.map((r: any) => {
                        const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
                        const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
                        const inherente = punto
                          ? punto.probabilidad * punto.impacto
                          : (r.evaluacion?.riesgoInherente || 0);
                        const residual = r.evaluacion?.riesgoResidual ?? (punto
                          ? (punto.probabilidadResidual || punto.probabilidad) * (punto.impactoResidual || punto.impacto)
                          : inherente);
                        const reduccion = inherente > 0 ? Math.round((1 - residual / inherente) * 100) : 0;

                        // Contar causas gestionadas
                        let causasTotales = 0;
                        let causasGestionadas = 0;
                        if (r.causas && Array.isArray(r.causas)) {
                          causasTotales = r.causas.length;
                          r.causas.forEach((causa: any) => {
                            const tipo = String(causa.tipoGestion || '').toUpperCase();
                            if (tipo === 'CONTROL' || tipo === 'PLAN' || tipo === 'AMBOS') causasGestionadas++;
                          });
                        }

                        // Determinar nivel
                        const getNivel = (val: number) => {
                          if (val >= 15) return { label: 'Crítico', color: '#c62828', bg: '#ffebee' };
                          if (val >= 10) return { label: 'Alto', color: '#e65100', bg: '#fff3e0' };
                          if (val >= 5) return { label: 'Medio', color: '#f9a825', bg: '#fffde7' };
                          if (val >= 1) return { label: 'Bajo', color: '#2e7d32', bg: '#e8f5e9' };
                          return { label: 'N/A', color: '#9e9e9e', bg: '#f5f5f5' };
                        };

                        return {
                          id: r.id,
                          codigo: r.numeroIdentificacion || r.numero || `R-${r.id}`,
                          descripcion: r.descripcion || 'Sin descripción',
                          proceso: proceso?.nombre || 'Sin proceso',
                          inherente,
                          residual: Number(residual) || 0,
                          reduccion,
                          nivelInherente: getNivel(inherente),
                          nivelResidual: getNivel(Number(residual) || 0),
                          causasTotales,
                          causasGestionadas,
                        };
                      })
                      .filter(r => r.inherente > 0)
                      .sort((a, b) => b.inherente - a.inherente)
                      .slice(0, 5);

                      if (riesgosConPuntaje.length === 0) {
                        return (
                          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">No hay riesgos evaluados</Typography>
                          </Box>
                        );
                      }

                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                          {riesgosConPuntaje.map((riesgo, idx) => (
                            <Box
                              key={riesgo.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'stretch',
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: idx === 0 ? '#ef535040' : '#e0e0e0',
                                overflow: 'hidden',
                                transition: 'all 0.15s',
                                '&:hover': { borderColor: '#1976d2', boxShadow: '0 2px 8px rgba(25,118,210,0.1)' },
                              }}
                            >
                              {/* Severity bar lateral */}
                              <Box sx={{
                                width: 5,
                                minHeight: '100%',
                                backgroundColor: riesgo.nivelInherente.color,
                                flexShrink: 0,
                              }} />

                              <Box sx={{ flex: 1, px: 2, py: 1.2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {/* Fila 1: Ranking + código + proceso */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography
                                    sx={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: '50%',
                                      backgroundColor: idx === 0 ? '#c62828' : idx === 1 ? '#e65100' : '#757575',
                                      color: 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.7rem',
                                      fontWeight: 800,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {idx + 1}
                                  </Typography>
                                  <Chip
                                    label={riesgo.codigo}
                                    size="small"
                                    sx={{ fontWeight: 700, fontSize: '0.72rem', backgroundColor: '#e3f2fd', color: '#1565c0', height: 22 }}
                                  />
                                  <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, minWidth: 0 }}>
                                    {riesgo.proceso}
                                  </Typography>
                                </Box>

                                {/* Fila 2: Descripción (máx 2 líneas, sin cortar bruscamente) */}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.78rem',
                                    color: '#444',
                                    lineHeight: 1.3,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                  title={repairSpanishDisplayArtifacts(String(riesgo.descripcion ?? ''))}
                                >
                                  {repairSpanishDisplayArtifacts(String(riesgo.descripcion ?? ''))}
                                </Typography>

                                {/* Fila 3: Niveles + reducción */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    mt: 0.3,
                                  }}
                                >
                                  <Chip
                                    label={`Inh: ${riesgo.nivelInherente.label} (${riesgo.inherente})`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      backgroundColor: riesgo.nivelInherente.bg,
                                      color: riesgo.nivelInherente.color,
                                      '.MuiChip-label': { px: 0.8 },
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">→</Typography>
                                  <Chip
                                    label={`Res: ${riesgo.nivelResidual.label} (${riesgo.residual})`}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      backgroundColor: riesgo.nivelResidual.bg,
                                      color: riesgo.nivelResidual.color,
                                      '.MuiChip-label': { px: 0.8 },
                                    }}
                                  />

                                  {/* Barra de reducción */}
                                  <MuiTooltip
                                    title={`Este riesgo disminuyó aproximadamente un ${Math.max(
                                      Math.min(riesgo.reduccion, 100),
                                      0
                                    )}% gracias a los controles y planes implementados.`}
                                    arrow
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                      <Box sx={{ width: 56, height: 6, borderRadius: 3, backgroundColor: '#f0f0f0', overflow: 'hidden', flexShrink: 0 }}>
                                        <Box sx={{
                                          width: `${Math.max(riesgo.reduccion, 0)}%`,
                                          height: '100%',
                                          backgroundColor: riesgo.reduccion >= 50 ? '#4caf50' : riesgo.reduccion >= 25 ? '#ff9800' : '#f44336',
                                          borderRadius: 3,
                                          transition: 'width 0.4s ease',
                                        }} />
                                      </Box>
                                      <Typography
                                        variant="caption"
                                        fontWeight={700}
                                        sx={{
                                          fontSize: '0.7rem',
                                          color: riesgo.reduccion >= 50 ? '#2e7d32' : riesgo.reduccion >= 25 ? '#e65100' : '#c62828',
                                        }}
                                      >
                                        -{riesgo.reduccion}%
                                      </Typography>
                                    </Box>
                                  </MuiTooltip>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Segunda fila de gráficas */}
        <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350 }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Cobertura de Controles por Proceso
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="Gestión de causas" size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: '0.7rem' }} />
                    {riesgosFiltrados.length > 0 && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={chartExpandido['causas'] ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                        onClick={() => setChartExpandido((p) => ({ ...p, causas: !p.causas }))}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        {chartExpandido['causas'] ? 'Colapsar' : 'Expandir gráfico'}
                      </Button>
                    )}
                  </Box>
                </Box>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: chartExpandido['causas'] ? Math.max(300, Object.keys((() => { const d: Record<string,number> = {}; procesos.forEach((p: any) => { d[p.nombre || ''] = 1; }); return d; })()).length * 50) : 320, transition: 'height 0.25s ease', overflow: 'hidden' }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; conGestion: number; sinGestion: number; totalCausas: number }> = {};
                      // Inicializar TODOS los procesos asignados con 0
                      procesos.forEach((p: any) => {
                        const nombre = p.nombre || 'Sin nombre';
                        dataPorProceso[nombre] = { nombre, conGestion: 0, sinGestion: 0, totalCausas: 0 };
                      });
                      riesgosFiltrados.forEach((r: any) => {
                        const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
                        const procesoNombre = proceso?.nombre || 'Sin proceso';
                        if (!dataPorProceso[procesoNombre]) {
                          dataPorProceso[procesoNombre] = { nombre: procesoNombre, conGestion: 0, sinGestion: 0, totalCausas: 0 };
                        }
                        if (r.causas && Array.isArray(r.causas)) {
                          r.causas.forEach((causa: any) => {
                            dataPorProceso[procesoNombre].totalCausas++;
                            const tipoGestion = String(causa.tipoGestion || '').toUpperCase();
                            if (tipoGestion === 'CONTROL' || tipoGestion === 'PLAN' || tipoGestion === 'AMBOS') {
                              dataPorProceso[procesoNombre].conGestion++;
                            } else {
                              dataPorProceso[procesoNombre].sinGestion++;
                            }
                          });
                        }
                      });
                      const chartData = Object.values(dataPorProceso)
                        .map(d => ({
                          nombre: d.nombre,
                          nombreCompleto: d.nombre,
                          'Con gestión': d.conGestion,
                          'Sin gestión': d.sinGestion,
                          totalCausas: d.totalCausas,
                          porcentaje: d.totalCausas > 0 ? Math.round((d.conGestion / d.totalCausas) * 100) : 0,
                        }))
                        .sort((a, b) => b.totalCausas - a.totalCausas);
                      return chartData.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay causas registradas</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={160} interval={0} />
                            <XAxis type="number" tick={{ fontSize: 11 }} />
                            <Tooltip content={({ active, payload, label }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0]?.payload;
                                return (
                                  <Box sx={{ backgroundColor: 'white', p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                    <Typography variant="subtitle2" fontWeight={700}>{data?.nombreCompleto || label}</Typography>
                                    <Typography variant="body2" sx={{ color: '#1976d2' }}>Con gestión: {data?.['Con gestión']}</Typography>
                                    <Typography variant="body2" sx={{ color: '#ff9800' }}>Sin gestión: {data?.['Sin gestión']}</Typography>
                                    <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>Cobertura: {data?.porcentaje}%</Typography>
                                    <Typography variant="caption" color="text.secondary">{data?.totalCausas} causas totales</Typography>
                                  </Box>
                                );
                              }
                              return null;
                            }} />
                            <Legend />
                            <Bar dataKey="Con gestión" stackId="a" fill="#1976d2" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Sin gestión" stackId="a" fill="#ffb74d" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350 }}>
              <CardContent sx={{ height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Controles por Proceso
                  </Typography>
                  {riesgosFiltrados.length > 0 && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={chartExpandido['controles'] ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                      onClick={() => setChartExpandido((p) => ({ ...p, controles: !p.controles }))}
                      sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      {chartExpandido['controles'] ? 'Colapsar' : 'Expandir gráfico'}
                    </Button>
                  )}
                </Box>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: chartExpandido['controles'] ? Math.max(300, Object.keys((() => { const d: Record<string,number> = {}; procesos.forEach((p: any) => { d[p.nombre || ''] = 1; }); return d; })()).length * 50) : 320, transition: 'height 0.25s ease', overflow: 'hidden' }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; cantidad: number }> = {};
                      // Inicializar TODOS los procesos asignados con 0
                      procesos.forEach((p: any) => {
                        const nombre = p.nombre || 'Sin nombre';
                        dataPorProceso[nombre] = { nombre, cantidad: 0 };
                      });
                      riesgosFiltrados.forEach((r: any) => {
                        const procesoNombre = procesos.find((p: any) => String(p.id) === String(r.procesoId))?.nombre || 'Sin proceso';
                        if (!dataPorProceso[procesoNombre]) {
                          dataPorProceso[procesoNombre] = { nombre: procesoNombre, cantidad: 0 };
                        }
                        // Contar controles desde las causas
                        // Los controles son causas con tipoGestion === 'CONTROL' o 'AMBOS'
                        if (r.causas && Array.isArray(r.causas)) {
                          r.causas.forEach((causa: any) => {
                            const tipoGestion = String(causa.tipoGestion || '').toUpperCase();
                            if (tipoGestion === 'CONTROL' || tipoGestion === 'AMBOS') {
                              dataPorProceso[procesoNombre].cantidad++;
                            }
                          });
                        }
                      });
                      const chartData = Object.values(dataPorProceso);
                      return chartData.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay controles</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={160} interval={0} />
                            <XAxis type="number" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cantidad" name="Cantidad" fill="#4caf50" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Detalle de Riesgos por Proceso — Acordeones con Controles y Planes */}
        {(() => {
          // Agrupar riesgos por proceso con totales
          const riesgosPorProcesoDetalle: Array<{
            procesoNombre: string;
            riesgos: any[];
            totalControles: number;
            totalPlanes: number;
            totalCausas: number;
          }> = [];

          const riesgosAgrupadosMap: Record<string, any[]> = {};
          procesos.forEach((p: any) => {
            riesgosAgrupadosMap[p.nombre || 'Sin nombre'] = [];
          });
          riesgosFiltrados.forEach((r: any) => {
            const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
            const procesoNombre = proceso?.nombre || 'Sin proceso';
            if (!riesgosAgrupadosMap[procesoNombre]) {
              riesgosAgrupadosMap[procesoNombre] = [];
            }
            riesgosAgrupadosMap[procesoNombre].push(r);
          });

          Object.entries(riesgosAgrupadosMap).forEach(([procesoNombre, riesgosDelProc]) => {
            let totalControles = 0;
            let totalPlanes = 0;
            let totalCausas = 0;
            riesgosDelProc.forEach((r: any) => {
              if (r.causas && Array.isArray(r.causas)) {
                totalCausas += r.causas.length;
                r.causas.forEach((causa: any) => {
                  const tipoGestion = String(causa.tipoGestion || '').toUpperCase();
                  if (tipoGestion === 'CONTROL' || tipoGestion === 'AMBOS') totalControles++;
                  if (tipoGestion === 'PLAN' || tipoGestion === 'AMBOS') totalPlanes++;
                });
              }
            });
            riesgosPorProcesoDetalle.push({ procesoNombre, riesgos: riesgosDelProc, totalControles, totalPlanes, totalCausas });
          });

          // Estado para acordeones expandidos
          const expandidos = expandidosProcesos;
          const setExpandidos = setExpandidosProcesos;
          const todosExpandidos = riesgosPorProcesoDetalle.length > 0 && riesgosPorProcesoDetalle.every(p => expandidos[p.procesoNombre]);

          const toggleExpandirTodos = () => {
            if (todosExpandidos) {
              setExpandidos({});
            } else {
              const nuevos: Record<string, boolean> = {};
              riesgosPorProcesoDetalle.forEach(p => { nuevos[p.procesoNombre] = true; });
              setExpandidos(nuevos);
            }
          };

          const totalGlobalControles = riesgosPorProcesoDetalle.reduce((acc, p) => acc + p.totalControles, 0);
          const totalGlobalPlanes = riesgosPorProcesoDetalle.reduce((acc, p) => acc + p.totalPlanes, 0);
          const totalGlobalRiesgos = riesgosPorProcesoDetalle.reduce((acc, p) => acc + p.riesgos.length, 0);

          const totalProcesos = riesgosPorProcesoDetalle.length;
          const fromPage = (pageDetalleProcesos - 1) * rowsPerPageDetalleProcesos;
          const toPage = Math.min(fromPage + rowsPerPageDetalleProcesos, totalProcesos);
          const riesgosPorProcesoPaginado = riesgosPorProcesoDetalle.slice(fromPage, toPage);

          return (
            <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
              <Grid2 xs={12}>
                <Card sx={{ height: '100%', overflow: 'visible' }}>
                  <CardContent sx={{ overflow: 'visible', width: '100%', minWidth: 0 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word' }}>
                          Detalle de Riesgos por Proceso — Controles y Planes de Acción
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Haz clic en un proceso para ver el detalle de cada riesgo
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Chip
                          icon={<ShieldIcon sx={{ fontSize: 16 }} />}
                          label={`${totalGlobalControles} Controles`}
                          size="small"
                          sx={{ backgroundColor: '#1565c015', color: '#1565c0', fontWeight: 600, fontSize: '0.8rem', border: '1px solid #1565c030' }}
                        />
                        <Chip
                          icon={<PlaylistAddCheckIcon sx={{ fontSize: 16 }} />}
                          label={`${totalGlobalPlanes} Planes`}
                          size="small"
                          sx={{ backgroundColor: '#e6510015', color: '#e65100', fontWeight: 600, fontSize: '0.8rem', border: '1px solid #e6510030' }}
                        />
                        <Chip
                          label={`${totalGlobalRiesgos} Riesgos`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.8rem' }}
                        />
                      </Box>
                    </Box>

                    {/* Toolbar: expandir/colapsar + paginación */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Box />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={todosExpandidos ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                          onClick={toggleExpandirTodos}
                          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                        >
                          {todosExpandidos ? 'Colapsar todos' : 'Expandir todos'}
                        </Button>
                        {totalProcesos > 5 && (
                          <TablePagination
                            component="div"
                            count={totalProcesos}
                            page={pageDetalleProcesos - 1}
                            onPageChange={(_, newPage) => setPageDetalleProcesos(newPage + 1)}
                            rowsPerPage={rowsPerPageDetalleProcesos}
                            onRowsPerPageChange={(e) => {
                              setRowsPerPageDetalleProcesos(Number(e.target.value));
                              setPageDetalleProcesos(1);
                            }}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            labelRowsPerPage="Mostrar"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            sx={{ border: 'none', '.MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 } }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Acordeones por proceso (paginados) */}
                    {riesgosPorProcesoDetalle.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No hay procesos disponibles</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'visible' }}>
                        {riesgosPorProcesoPaginado.map((procesoData) => {
                          const procesoMeta = procesos.find(
                            (p: { nombre?: string }) => (p.nombre || 'Sin nombre') === procesoData.procesoNombre
                          ) as { residualModo?: string } | undefined;
                          const residualEstrategico = procesoMeta?.residualModo === 'ESTRATEGICO';
                          const isExpanded = expandidos[procesoData.procesoNombre] || false;
                          const maxVal = Math.max(
                            ...procesoData.riesgos.map((r: any) => {
                              let c = 0, p = 0;
                              (r.causas || []).forEach((causa: any) => {
                                const t = String(causa.tipoGestion || '').toUpperCase();
                                if (t === 'CONTROL' || t === 'AMBOS') c++;
                                if (t === 'PLAN' || t === 'AMBOS') p++;
                              });
                              return Math.max(c, p);
                            }),
                            1
                          );

                          return (
                            <Accordion
                              key={procesoData.procesoNombre}
                              expanded={isExpanded}
                              onChange={() => setExpandidos(prev => ({ ...prev, [procesoData.procesoNombre]: !prev[procesoData.procesoNombre] }))}
                              sx={{
                                border: '1px solid',
                                borderColor: isExpanded ? '#1565c040' : '#e0e0e0',
                                borderRadius: '12px !important',
                                '&:before': { display: 'none' },
                                boxShadow: isExpanded ? '0 2px 12px rgba(21, 101, 192, 0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                                transition: 'all 0.2s ease',
                                overflow: 'hidden',
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                  px: { xs: 1.5, sm: 2.5 },
                                  py: 0.5,
                                  backgroundColor: isExpanded ? '#f8faff' : 'transparent',
                                  '&:hover': { backgroundColor: '#f5f8ff' },
                                  minHeight: 56,
                                  '& .MuiAccordionSummary-content': { minWidth: 0, margin: '12px 0' },
                                }}
                              >
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: { xs: 1, sm: 2 }, width: '100%', pr: 1, minWidth: 0 }}>
                                  {/* Nombre proceso + riesgos count */}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: '1 1 180px', minWidth: 0 }}>
                                    <AccountTreeIcon sx={{ color: '#1565c0', fontSize: 22, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, wordBreak: 'break-word' }}>
                                        {procesoData.procesoNombre}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {procesoData.riesgos.length} riesgo{procesoData.riesgos.length !== 1 ? 's' : ''}
                                        {procesoData.totalCausas > 0 && ` · ${procesoData.totalCausas} causas`}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {residualEstrategico && (
                                    <MuiTooltip title="Proceso en modo residual estratégico. Mapa y cálculos siguen la metodología configurada para este modo.">
                                      <Chip
                                        label="Residual estratégico"
                                        size="small"
                                        color="secondary"
                                        sx={{ fontWeight: 700, flexShrink: 0 }}
                                      />
                                    </MuiTooltip>
                                  )}

                                  {/* Chips resumen compactos */}
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                                    <Chip
                                      icon={<ShieldIcon sx={{ fontSize: 14, color: '#1565c0 !important' }} />}
                                      label={procesoData.totalControles}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#1565c012',
                                        color: '#1565c0',
                                        fontWeight: 700,
                                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                        height: 28,
                                        minWidth: 44,
                                        '.MuiChip-label': { px: 0.6 },
                                      }}
                                    />
                                    <Chip
                                      icon={<PlaylistAddCheckIcon sx={{ fontSize: 14, color: '#e65100 !important' }} />}
                                      label={procesoData.totalPlanes}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#e6510012',
                                        color: '#e65100',
                                        fontWeight: 700,
                                        fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                        height: 28,
                                        minWidth: 44,
                                        '.MuiChip-label': { px: 0.6 },
                                      }}
                                    />
                                  </Box>

                                  {/* Mini barra de progreso visual - solo desktop */}
                                  <Box sx={{ width: 120, flexShrink: 0, display: { xs: 'none', md: 'block' } }}>
                                    <Box sx={{ display: 'flex', gap: 0.3, height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                      <Box sx={{
                                        width: `${procesoData.totalCausas > 0 ? (procesoData.totalControles / procesoData.totalCausas) * 100 : 0}%`,
                                        backgroundColor: '#1976d2',
                                        borderRadius: '4px 0 0 4px',
                                        transition: 'width 0.3s ease',
                                      }} />
                                      <Box sx={{
                                        width: `${procesoData.totalCausas > 0 ? (procesoData.totalPlanes / procesoData.totalCausas) * 100 : 0}%`,
                                        backgroundColor: '#e65100',
                                        borderRadius: '0 4px 4px 0',
                                        transition: 'width 0.3s ease',
                                      }} />
                                    </Box>
                                  </Box>
                                </Box>
                              </AccordionSummary>

                              <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2 }}>
                                {procesoData.riesgos.length === 0 ? (
                                  <Box sx={{ py: 2, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                      Sin riesgos identificados en este proceso
                                    </Typography>
                                  </Box>
                                ) : (
                                  <Box>
                                    {/* Leyenda en el detalle */}
                                    <Box sx={{ display: 'flex', gap: 2, mb: 1.5, px: 1 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#1976d2' }} />
                                        <Typography variant="caption" color="text.secondary">Controles</Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#e65100' }} />
                                        <Typography variant="caption" color="text.secondary">Planes de Acción</Typography>
                                      </Box>
                                    </Box>

                                    {/* Riesgos individuales como filas con barras */}
                                    {procesoData.riesgos.map((r: any, idx: number) => {
                                      let controlesCount = 0;
                                      let planesCount = 0;
                                      (r.causas || []).forEach((causa: any) => {
                                        const tipoGestion = String(causa.tipoGestion || '').toUpperCase();
                                        if (tipoGestion === 'CONTROL' || tipoGestion === 'AMBOS') controlesCount++;
                                        if (tipoGestion === 'PLAN' || tipoGestion === 'AMBOS') planesCount++;
                                      });
                                      const codigo = r.numeroIdentificacion || r.numero || `R-${r.id}`;
                                      const descripcionCorta = r.descripcion
                                        ? (r.descripcion.length > 60 ? r.descripcion.substring(0, 58) + '...' : r.descripcion)
                                        : 'Sin descripción';

                                      return (
                                        <Box
                                          key={r.id}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            py: 1.2,
                                            px: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: idx % 2 === 0 ? '#fafbfc' : 'transparent',
                                            '&:hover': { backgroundColor: '#f0f4ff' },
                                            transition: 'background 0.15s',
                                          }}
                                        >
                                          {/* Código del riesgo */}
                                          <Chip
                                            label={codigo}
                                            size="small"
                                            sx={{
                                              fontWeight: 700,
                                              fontSize: '0.75rem',
                                              backgroundColor: '#e3f2fd',
                                              color: '#1565c0',
                                              minWidth: 60,
                                              height: 26,
                                            }}
                                          />

                                          {/* Descripción */}
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              flex: 1,
                                              minWidth: 0,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              color: '#333',
                                              fontSize: '0.82rem',
                                            }}
                                            title={r.descripcion || ''}
                                          >
                                            {descripcionCorta}
                                          </Typography>

                                          {/* Barras visuales de Controles y Planes */}
                                          <Box sx={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                                            {/* Barra controles */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                              <Box sx={{
                                                height: 10,
                                                width: `${maxVal > 0 ? Math.max((controlesCount / maxVal) * 100, controlesCount > 0 ? 8 : 0) : 0}%`,
                                                backgroundColor: '#1976d2',
                                                borderRadius: '0 5px 5px 0',
                                                transition: 'width 0.4s cubic-bezier(.4,0,.2,1)',
                                                minWidth: controlesCount > 0 ? 8 : 0,
                                                maxWidth: '80%',
                                              }} />
                                              <Typography variant="caption" fontWeight={700} sx={{ color: '#1565c0', fontSize: '0.75rem', minWidth: 14 }}>
                                                {controlesCount}
                                              </Typography>
                                            </Box>
                                            {/* Barra planes */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                              <Box sx={{
                                                height: 10,
                                                width: `${maxVal > 0 ? Math.max((planesCount / maxVal) * 100, planesCount > 0 ? 8 : 0) : 0}%`,
                                                backgroundColor: '#e65100',
                                                borderRadius: '0 5px 5px 0',
                                                transition: 'width 0.4s cubic-bezier(.4,0,.2,1)',
                                                minWidth: planesCount > 0 ? 8 : 0,
                                                maxWidth: '80%',
                                              }} />
                                              <Typography variant="caption" fontWeight={700} sx={{ color: '#e65100', fontSize: '0.75rem', minWidth: 14 }}>
                                                {planesCount}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                      );
                                    })}
                                  </Box>
                                )}
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid2>
            </Grid2>
          );
        })()}

        {/* Dialog para Riesgos Fuera del Apetito */}
        <Dialog
          open={riesgosFueraApetitoDialogOpen}
          onClose={() => {
            setRiesgosFueraApetitoDialogOpen(false);
            setCeldaSeleccionada(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { maxWidth: 900 } }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600} color={celdaSeleccionada ? "primary" : "error"}>
                {celdaSeleccionada
                  ? `Riesgos en Celda (${celdaSeleccionada.probabilidad}, ${celdaSeleccionada.impacto}) - ${celdaSeleccionada.tipo === 'inherente' ? 'Inherente' : 'Residual'}`
                  : 'Riesgos Fuera del Apetito'}
              </Typography>
              <Chip
                label={celdaSeleccionada
                  ? `${(() => {
                    const key = `${celdaSeleccionada.probabilidad}-${celdaSeleccionada.impacto}`;
                    const matriz = celdaSeleccionada.tipo === 'inherente' ? matrizInherente : matrizResidual;
                    return matriz[key]?.length || 0;
                  })()} riesgo${(() => {
                    const key = `${celdaSeleccionada.probabilidad}-${celdaSeleccionada.impacto}`;
                    const matriz = celdaSeleccionada.tipo === 'inherente' ? matrizInherente : matrizResidual;
                    return matriz[key]?.length || 0;
                  })() !== 1 ? 's' : ''}`
                  : `${estadisticas.fueraApetito} riesgo${estadisticas.fueraApetito !== 1 ? 's' : ''}`}
                color={celdaSeleccionada ? "primary" : "error"}
                size="small"
              />
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity={celdaSeleccionada ? "info" : "warning"} sx={{ mb: 2 }}>
              {celdaSeleccionada
                ? `Riesgos en la celda seleccionada del mapa de ${celdaSeleccionada.tipo === 'inherente' ? 'riesgo inherente' : 'riesgo residual'}.`
                : `Los siguientes riesgos tienen un valor de riesgo = ${UMBRALES_RIESGO.ALTO} y requieren atención inmediata.`}
            </Alert>
            {!celdaSeleccionada && (
              <Button
                variant="contained"
                startIcon={<MapIcon />}
                onClick={() => {
                  navigate(ROUTES.MAPA);
                  setRiesgosFueraApetitoDialogOpen(false);
                }}
                sx={{ mb: 2 }}
              >
                Ver en Mapa de Calor
              </Button>
            )}
            <List>
              {(celdaSeleccionada
                ? (() => {
                  const key = `${celdaSeleccionada.probabilidad}-${celdaSeleccionada.impacto}`;
                  const matriz = celdaSeleccionada.tipo === 'inherente' ? matrizInherente : matrizResidual;
                  return matriz[key] || [];
                })()
                : puntos.filter((p: any) => {
                  const valorRiesgo = p.probabilidad * p.impacto;
                  return valorRiesgo >= UMBRALES_RIESGO.ALTO;
                })
              ).map((punto: any) => {
                const riesgo = riesgos.find((r: any) => r.id === punto.riesgoId);
                const proceso = procesos.find((p: any) => p.id === riesgo?.procesoId);
                const valorRiesgo = punto.probabilidad * punto.impacto;
                const sigla = proceso?.sigla || riesgo?.siglaGerencia || '';
                const codigo = riesgo?.numeroIdentificacion || (riesgo?.numero ? `${riesgo.numero}${sigla}` : `R${String(riesgo?.numero || 0).padStart(3, '0')}`);
                return (
                  <Card key={punto.riesgoId} sx={{ mb: 2, border: '2px solid', borderColor: colors.risk.critical.main }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {codigo}
                          </Typography>
                          <Chip
                            label={`Valor: ${valorRiesgo} (Prob: ${punto.probabilidad}, Imp: ${punto.impacto})`}
                            size="small"
                            color="error"
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {riesgo?.descripcion || punto.descripcion}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Proceso:</strong> {proceso?.nombre || 'Sin proceso'}
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            navigate(ROUTES.RESUMEN_RIESGOS);
                            setRiesgosFueraApetitoDialogOpen(false);
                          }}
                        >
                          Ver Detalle
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setRiesgosFueraApetitoDialogOpen(false);
              setCeldaSeleccionada(null);
            }}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </>)}
    </Box>
  );
}




