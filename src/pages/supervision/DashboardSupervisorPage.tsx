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
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery, useGetPuntosMapaQuery, useGetEjesMapaQuery } from '../../api/services/riesgosApi';
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
import RiesgosPorTipologiaCard from '../../components/dashboard/RiesgosPorTipologiaCard';
import OrigenRiesgosCard from '../../components/dashboard/OrigenRiesgosCard';
import TablaResumenRiesgos from '../../components/dashboard/TablaResumenRiesgos';
import TablaPlanesAccion from '../../components/dashboard/TablaPlanesAccion';
import IncidenciasCard from '../../components/dashboard/IncidenciasCard';
import { useGetPlanesAccionQuery, useGetIncidenciasQuery } from '../../api/services/riesgosApi';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';
import { useAreasProcesosAsignados, isProcesoAsignadoASupervisor, isAreaAsignadaASupervisor } from '../../hooks/useAsignaciones';

export default function DashboardSupervisorPage() {
  const { esSupervisorRiesgos, esDueñoProcesos, esGerenteGeneralDirector, esGerenteGeneralProceso, user } = useAuth();
  const navigate = useNavigate();
  const { areas: areasAsignadasIds, procesos: procesosAsignadosIds } = useAreasProcesosAsignados();

  // Filtros
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroNumeroRiesgo, setFiltroNumeroRiesgo] = useState<string>('all');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);

  // Obtener datos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000 });
  const { data: procesosData } = useGetProcesosQuery();
  const { data: puntosMapa } = useGetPuntosMapaQuery({});
  const { data: planesAccion = [] } = useGetPlanesAccionQuery();
  const { data: incidencias = [] } = useGetIncidenciasQuery();

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
      filtrados = filtrados.filter((r: any) => r.procesoId === filtroProceso);
    }

    if (filtroNumeroRiesgo !== 'all') {
      filtrados = filtrados.filter((r: any) => {
        const codigo = `R${String(r.numero || 0).padStart(3, '0')}`;
        return codigo === filtroNumeroRiesgo;
      });
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
  }, [riesgos, filtroArea, filtroProceso, filtroNumeroRiesgo, filtroOrigen, busqueda, procesos]);

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

  const planesParaTabla = Array.isArray(planesAccion) ? planesAccion : [];
  const incidenciasParaCard = Array.isArray(incidencias) ? incidencias : [];

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
        filtroNumeroRiesgo={filtroNumeroRiesgo}
        filtroOrigen={filtroOrigen}
        onFiltroAreaChange={setFiltroArea}
        onFiltroProcesoChange={setFiltroProceso}
        onFiltroNumeroRiesgoChange={setFiltroNumeroRiesgo}
        onFiltroOrigenChange={setFiltroOrigen}
        procesos={procesos}
        riesgos={riesgos}
      />

      {/* Primera Fila: Estadísticas */}
      <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
          {/* Card 1: Total de Riesgos - Usando componente */}
          <Grid2 xs={12} sm={6} md={4}>
            <TotalRiesgosCard
              total={estadisticas.total}
              criticos={estadisticas.porTipologia['01 Estratégico'] || 0}
              altos={estadisticas.porTipologia['02 Operacional'] || 0}
            />
          </Grid2>

          {/* Card 2: Treemap - Riesgos por tipo - Usando componente */}
          <Grid2 xs={12} sm={6} md={4}>
            <RiesgosPorTipologiaCard datos={estadisticas.porTipologia} />
          </Grid2>

          {/* Card 3: Donut - Origen - Usando componente */}
          <Grid2 xs={12} sm={12} md={4}>
            <OrigenRiesgosCard datos={estadisticas.origen} total={estadisticas.total} />
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
      </>) }
    </Box>
  );
}




