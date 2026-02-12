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
import TablaPlanesAccion from '../../components/dashboard/TablaPlanesAccion';
import IncidenciasCard from '../../components/dashboard/IncidenciasCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';
import { useAreasProcesosAsignados, isProcesoAsignadoASupervisor, isAreaAsignadaASupervisor } from '../../hooks/useAsignaciones';

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

  // Obtener datos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000 });
  const { data: procesosData } = useGetProcesosQuery();
  const { data: puntosMapa } = useGetPuntosMapaQuery({});
  const { data: planesApi = [] } = useGetPlanesQuery();
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

    // Para Dueño de Procesos REAL (role === 'dueño_procesos'), filtrar solo sus procesos
    if (user?.role === 'dueño_procesos') {
      return todosLosProcesos.filter((p: any) => p.responsableId === user.id);
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
    if ((!esSupervisorRiesgos && !esDueñoProcesos && !esGerenteGeneralDirector) || !user) return todosLosRiesgos;

    // Para Gerente General, también filtrar por procesos asignados
    if (esGerenteGeneralDirector) {
      const procesosIds = procesos.map((p: any) => p.id);
      return todosLosRiesgos.filter((r: any) => procesosIds.includes(r.procesoId));
    }

    // Filtrar riesgos de procesos asignados (ya filtrados arriba)
    const procesosIds = procesos.map((p: any) => p.id);
    return todosLosRiesgos.filter((r: any) => procesosIds.includes(r.procesoId));
  }, [todosLosRiesgos, procesos, esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, user]);

  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number; tipo: 'inherente' | 'residual' } | null>(null);

  // Filtrar riesgos según filtros (MOVED UP)
  const riesgosFiltrados = useMemo(() => {
    let filtrados = riesgos;

    // Filtrar por área
    if (filtroArea !== 'all') {
      const procesosEnArea = procesos.filter((p: any) => p.areaNombre === filtroArea);
      const procesosIds = procesosEnArea.map((p: any) => p.id);
      filtrados = filtrados.filter((r: any) => procesosIds.includes(r.procesoId));
    }

    if (filtroProceso !== 'all') {
      // Asegurar comparación correcta (puede ser string o number)
      filtrados = filtrados.filter((r: any) => String(r.procesoId) === String(filtroProceso));
    }

    if (filtroOrigen !== 'all') {
      // Filtrar por origen (tipología nivel I o fuente)
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

    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter((r: any) => {
        const codigo = `${r.numero || ''}${r.siglaGerencia || ''}`;
        const proceso = procesos.find((p: any) => p.id === r.procesoId);
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
  const matrizInherente = useMemo(() => {
    const matriz: { [key: string]: any[] } = {};
    // Filtrar puntos que corresponden a riesgos filtrados
    const puntosFiltrados = puntos.filter((p: any) => riesgosFiltrados.some((r: any) => r.id === p.riesgoId));

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
    // Filtrar puntos que corresponden a riesgos filtrados
    const puntosFiltrados = puntos.filter((p: any) => riesgosFiltrados.some((r: any) => r.id === p.riesgoId));

    puntosFiltrados.forEach((punto: any) => {
      // Calcular riesgo residual (aproximación: reducir 20%)
      const factorReduccion = 0.8;
      const probResidual = Math.max(1, Math.round(punto.probabilidad * factorReduccion));
      const impResidual = Math.max(1, Math.round(punto.impacto * factorReduccion));
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
    const riesgosIds = riesgosFiltrados.map((r: any) => r.id);
    const puntosFiltrados = puntos.filter((p: any) => riesgosIds.includes(p.riesgoId));
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
      // Formato de código: R001, R002, etc.
      const codigo = riesgo.numero ? `R${String(riesgo.numero).padStart(3, '0')}` : `${riesgo.numero || ''}${riesgo.siglaGerencia || ''}`;
      const punto = puntos.find((p: any) => p.riesgoId === riesgo.id);

      const riesgoInherente = punto ? punto.probabilidad * punto.impacto : 0;
      const riesgoResidual = riesgoInherente * 0.8; // Aproximación

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

  // Preparar datos para tabla de planes de acción - Usando servicio centralizado
  const planesAccion = useMemo(() => {
    return (planesApi || []).map((plan: any) => ({
      id: plan.id,
      nombre: plan.descripcion || 'Plan de acción',
      proceso: plan.procesoNombre || 'Sin proceso',
      responsable: plan.responsable || 'Sin responsable',
      fechaLimite: plan.fechaFin || plan.fechaProgramada || plan.fechaInicio || new Date().toISOString(),
      estado: (plan.estado || 'pendiente').toString().toLowerCase().replace(' ', '_'),
      porcentajeAvance: plan.estado === 'Completado' ? 100 : plan.estado === 'En ejecución' ? 50 : 0,
    }));
  }, [planesApi]);

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
          ocultarFiltroOrigen={user?.role === 'dueño_procesos'} // Ocultar filtro Origen para Dueño de Procesos
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
                  {kpis.riesgosCriticos > 0
                    ? `Hay ${kpis.riesgosCriticos} riesgos criticos que requieren seguimiento inmediato.`
                    : 'No hay riesgos criticos registrados en el periodo actual.'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Fuera de apetito: ${kpis.fueraApetito}`} color={kpis.fueraApetito > 0 ? 'warning' : 'success'} size="small" />
                  <Chip label={`Procesos: ${kpis.totalProcesos}`} color="primary" size="small" />
                  <Chip label={`Riesgos: ${kpis.totalRiesgos}`} color="secondary" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid2>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Tendencia Mensual (Ultimos 6 meses)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120, mt: 1 }}>
                  {tendenciaMensual.map((item) => (
                    <Box key={item.key} sx={{ flex: 1, textAlign: 'center' }}>
                      <Box
                        sx={{
                          height: `${Math.max(6, item.value * 12)}px`,
                          backgroundColor: item.value > 0 ? 'primary.main' : 'grey.300',
                          borderRadius: 1,
                          transition: 'height 0.2s ease',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>

        {/* Primera Fila: Estadísticas resumidas (sin duplicar información del header) */}
        <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          {/* Card 1: Procesos con Riesgos (dinámico con filtros) */}
          <Grid2 xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <BusinessCenterIcon color="primary" />
                  <Typography variant="subtitle2" fontWeight={600}>Procesos con Riesgos</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {Object.keys(estadisticas.porProceso || {}).length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  En seguimiento (según filtros aplicados)
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Card 2: Riesgos fuera de apetito */}
          <Grid2 xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ReportProblemIcon color="error" />
                  <Typography variant="subtitle2" fontWeight={600}>Riesgos Fuera de Apetito</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700} color="error.main">
                  {kpis.fueraApetito}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Calculados sobre los riesgos filtrados
                </Typography>
              </CardContent>
            </Card>
          </Grid2>

          {/* Card 3: Planes de Acción activos */}
          <Grid2 xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AssignmentIcon color="success" />
                  <Typography variant="subtitle2" fontWeight={600}>Planes de Acción</Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>{planesApi?.length || 0}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total activos
                </Typography>
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
                      console.log('[Dashboard] 📊 Estadísticas por nivel:', estadisticas.porNivelRiesgo);
                      console.log('[Dashboard] 📊 Riesgos filtrados:', riesgosFiltrados.length);
                      console.log('[Dashboard] 📊 Puntos del mapa:', puntos.length);
                      
                      const dataNiveles = Object.entries(estadisticas.porNivelRiesgo || {})
                        .filter(([_, value]) => value > 0)
                        .map(([name, value]) => ({
                          name,
                          value,
                          color: name === 'Crítico' ? '#d32f2f' : 
                                 name === 'Alto' ? '#f57c00' : 
                                 name === 'Medio' ? '#fbc02d' : 
                                 name === 'Bajo' ? '#388e3c' : '#666'
                        }));
                      
                      console.log('[Dashboard] 📊 Datos para gráfico:', dataNiveles);
                      
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
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Riesgos Materializados por Proceso
                </Typography>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; cantidad: number }> = {};
                      incidenciasData.forEach((inc: any) => {
                        const riesgo = riesgosFiltrados.find((r: any) => r.id === inc.riesgoId);
                        if (riesgo) {
                          const procesoNombre = procesos.find((p: any) => p.id === riesgo.procesoId)?.nombre || 'Sin proceso';
                          if (!dataPorProceso[procesoNombre]) {
                            dataPorProceso[procesoNombre] = { nombre: procesoNombre, cantidad: 0 };
                          }
                          dataPorProceso[procesoNombre].cantidad++;
                        }
                      });
                      const chartData = Object.values(dataPorProceso);
                      return chartData.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay riesgos materializados</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cantidad" name="Cantidad" fill="#ff9800" />
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

        {/* Segunda fila de gráficas */}
        <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          <Grid2 xs={12} md={6}>
            <Card sx={{ height: '100%', minHeight: 350 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Planes de Acción por Proceso
                </Typography>
                {riesgosFiltrados.length === 0 || planesApi.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; cantidad: number }> = {};
                      const riesgosIds = riesgosFiltrados.map((r: any) => r.id);
                      planesApi.forEach((p: any) => {
                        if (riesgosIds.includes(p.riesgoId)) {
                          const riesgo = riesgosFiltrados.find((r: any) => r.id === p.riesgoId);
                          const procesoNombre = procesos.find((proc: any) => proc.id === riesgo?.procesoId)?.nombre || 'Sin proceso';
                          if (!dataPorProceso[procesoNombre]) {
                            dataPorProceso[procesoNombre] = { nombre: procesoNombre, cantidad: 0 };
                          }
                          dataPorProceso[procesoNombre].cantidad++;
                        }
                      });
                      const chartData = Object.values(dataPorProceso);
                      return chartData.length === 0 ? (
                        <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography color="text.secondary">No hay planes de acción</Typography>
                        </Box>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cantidad" name="Cantidad" fill="#2196f3" />
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
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Controles por Proceso
                </Typography>
                {riesgosFiltrados.length === 0 ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">No hay datos disponibles</Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300 }}>
                    {(() => {
                      const dataPorProceso: Record<string, { nombre: string; cantidad: number }> = {};
                      riesgosFiltrados.forEach((r: any) => {
                        const procesoNombre = procesos.find((p: any) => p.id === r.procesoId)?.nombre || 'Sin proceso';
                        if (!dataPorProceso[procesoNombre]) {
                          dataPorProceso[procesoNombre] = { nombre: procesoNombre, cantidad: 0 };
                        }
                        if (r.causas && Array.isArray(r.causas)) {
                          r.causas.forEach((causa: any) => {
                            if (causa.controles && Array.isArray(causa.controles)) {
                              dataPorProceso[procesoNombre].cantidad += causa.controles.length;
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
                          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nombre" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="cantidad" name="Cantidad" fill="#4caf50" />
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

        {/* Dialog para Riesgos Fuera del Apetito */}
        <Dialog
          open={riesgosFueraApetitoDialogOpen}
          onClose={() => {
            setRiesgosFueraApetitoDialogOpen(false);
            setCeldaSeleccionada(null);
          }}
          maxWidth="lg"
          fullWidth
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
                const codigo = riesgo?.numero ? `R${String(riesgo.numero).padStart(3, '0')}` : `${riesgo?.numero || ''}${riesgo?.siglaGerencia || ''}`;
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




