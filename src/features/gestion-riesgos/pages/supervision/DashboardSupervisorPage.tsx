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
import Grid2 from '../../../../utils/Grid2';
import {
  Search as SearchIcon,
  Warning as WarningIcon,
  Assessment as AssessmentIcon,
  BusinessCenter as BusinessCenterIcon,
  Category as CategoryIcon,
  Map as MapIcon,
  Assignment as AssignmentIcon,
  ReportProblem as ReportProblemIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery, useGetPuntosMapaQuery } from '../../api/riesgosApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { colors } from '../../../../app/theme/colors';
import { UMBRALES_RIESGO } from '../../../../shared/utils/constants';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../shared/utils/constants';
import TotalRiesgosCard from '../../components/dashboard/TotalRiesgosCard';
import RiesgosPorProcesoCard from '../../components/dashboard/RiesgosPorProcesoCard';
import MetricCard from '../../components/dashboard/MetricCard';
import DashboardFiltros from '../../components/dashboard/DashboardFiltros';
import RiesgosPorTipologiaCard from '../../components/dashboard/RiesgosPorTipologiaCard';
import OrigenRiesgosCard from '../../components/dashboard/OrigenRiesgosCard';
import TablaResumenRiesgos from '../../components/dashboard/TablaResumenRiesgos';
import TablaPlanesAccion from '../../components/dashboard/TablaPlanesAccion';
import IncidenciasCard from '../../components/dashboard/IncidenciasCard';
import { getMockPlanesAccion, getMockIncidencias, getMockRiesgosResumen } from '../../../../data/mockDataService';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';
import { useAreasProcesosAsignados, isProcesoAsignadoASupervisor, isAreaAsignadaASupervisor } from '../../hooks/useAsignaciones';

export default function DashboardSupervisorPage() {
  const { esSupervisorRiesgos, esDueñoProcesos, user } = useAuth();
  const navigate = useNavigate();
  const { areasAsignadas, procesosAsignados } = useAreasProcesosAsignados();
  
  // Filtros
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [filtroNumeroRiesgo, setFiltroNumeroRiesgo] = useState<string>('all');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);

  // Obtener datos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000 });
  const { data: procesosData } = useGetProcesosQuery();
  const { data: puntosMapa } = useGetPuntosMapaQuery({});

  const todosLosRiesgos = riesgosData?.data || [];
  const todosLosProcesos = procesosData || [];
  const puntos = puntosMapa || [];

  // Filtrar procesos y riesgos según asignaciones del supervisor
  const procesos = useMemo(() => {
    if (!esSupervisorRiesgos || !user) return todosLosProcesos;
    
    // Si no tiene asignaciones, no ve nada (o ver todos si es admin)
    if (areasAsignadas.length === 0 && procesosAsignados.length === 0) {
      return [];
    }

    return todosLosProcesos.filter((p: any) => {
      // Si está asignado directamente al proceso
      if (procesosAsignados.includes(p.id)) {
        return true;
      }
      // Si está asignado al área del proceso
      if (p.areaId && areasAsignadas.includes(p.areaId)) {
        return true;
      }
      return false;
    });
  }, [todosLosProcesos, areasAsignadas, procesosAsignados, esSupervisorRiesgos, user]);

  const riesgos = useMemo(() => {
    if (!esSupervisorRiesgos || !user) return todosLosRiesgos;
    
    // Filtrar riesgos de procesos asignados
    return todosLosRiesgos.filter((r: any) => {
      const proceso = todosLosProcesos.find((p: any) => p.id === r.procesoId);
      if (!proceso) return false;
      
      // Si el proceso está asignado directamente
      if (procesosAsignados.includes(proceso.id)) {
        return true;
      }
      // Si el proceso pertenece a un área asignada
      if (proceso.areaId && areasAsignadas.includes(proceso.areaId)) {
        return true;
      }
      return false;
    });
  }, [todosLosRiesgos, todosLosProcesos, areasAsignadas, procesosAsignados, esSupervisorRiesgos, user]);

  // Crear matrices de riesgo inherente y residual
  const matrizInherente = useMemo(() => {
    const matriz: { [key: string]: any[] } = {};
    puntos.forEach((punto: any) => {
      const key = `${punto.probabilidad}-${punto.impacto}`;
      if (!matriz[key]) {
        matriz[key] = [];
      }
      matriz[key].push(punto);
    });
    return matriz;
  }, [puntos]);

  const matrizResidual = useMemo(() => {
    const matriz: { [key: string]: any[] } = {};
    puntos.forEach((punto: any) => {
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
  }, [puntos]);

  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number; tipo: 'inherente' | 'residual' } | null>(null);

  // Filtrar riesgos según filtros
  const riesgosFiltrados = useMemo(() => {
    let filtrados = riesgos;

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
  }, [riesgos, filtroProceso, filtroNumeroRiesgo, filtroOrigen, busqueda, procesos]);

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

  // Preparar datos para tabla de planes de acción - Usando servicio centralizado
  const planesAccion = useMemo(() => {
    return getMockPlanesAccion();
  }, []);

  // Preparar datos para incidencias - Usando servicio centralizado
  const incidencias = useMemo(() => {
    return getMockIncidencias();
  }, []);

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

  // Mostrar información de asignaciones si es supervisor
  const tieneAsignaciones = esSupervisorRiesgos && (areasAsignadas.length > 0 || procesosAsignados.length > 0);
  const sinAsignaciones = esSupervisorRiesgos && areasAsignadas.length === 0 && procesosAsignados.length === 0;

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
  const renderMapaCalor = (tipo: 'inherente' | 'residual') => {
    const matriz = tipo === 'inherente' ? matrizInherente : matrizResidual;
    const esFueraApetito = (prob: number, imp: number) => {
      const valor = prob * imp;
      return valor >= UMBRALES_RIESGO.ALTO;
    };

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
              {[5, 4, 3, 2, 1].map((impacto) => {
                const etiquetasImpacto: Record<number, string> = {
                  5: 'Extremo',
                  4: 'Grave',
                  3: 'Moderado',
                  2: 'Leve',
                  1: 'No Significativo',
                };
                const etiquetaImpacto = etiquetasImpacto[impacto] || '';

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
                    {[1, 2, 3, 4, 5].map((probabilidad) => {
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
                {[1, 2, 3, 4, 5].map((prob) => {
                  const etiquetasProbabilidad: Record<number, string> = {
                    1: 'Muy Bajo',
                    2: 'Bajo',
                    3: 'Moderada',
                    4: 'Alta',
                    5: 'Muy Alta',
                  };
                  const etiquetaProb = etiquetasProbabilidad[prob] || '';

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
      {/* Alerta si no tiene asignaciones */}
      {sinAsignaciones && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            No tiene áreas o procesos asignados
          </Typography>
          <Typography variant="body2">
            Contacte al administrador para que le asigne áreas o procesos a supervisar. 
            Mientras tanto, no podrá ver datos en este dashboard.
          </Typography>
        </Alert>
      )}

      {/* Información de asignaciones */}
      {tieneAsignaciones && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Áreas/Procesos Asignados:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
            {areasAsignadas.length > 0 && (
              <Chip
                label={`${areasAsignadas.length} Área(s)`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {procesosAsignados.length > 0 && (
              <Chip
                label={`${procesosAsignados.length} Proceso(s) específico(s)`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        </Alert>
      )}

      {/* Filtros - Usando componente */}
      <DashboardFiltros
        filtroProceso={filtroProceso}
        filtroNumeroRiesgo={filtroNumeroRiesgo}
        filtroOrigen={filtroOrigen}
        onFiltroProcesoChange={setFiltroProceso}
        onFiltroNumeroRiesgoChange={setFiltroNumeroRiesgo}
        onFiltroOrigenChange={setFiltroOrigen}
        procesos={procesos}
        riesgos={riesgos}
      />


      {/* Primera Fila: Estadísticas - Solo visible para Supervisor de Riesgos */}
      {esSupervisorRiesgos && (
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
      )}

      {/* Segunda Fila: Gráfico de Riesgos por Proceso - Usando componente */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        <Grid2 xs={12} md={6}>
          <RiesgosPorProcesoCard datosReales={estadisticas.porProceso} />
        </Grid2>

        {/* Tabla: Resumen de Riesgos - Usando componente */}
        <Grid2 xs={12}>
          <TablaResumenRiesgos filas={filasTablaResumen} />
        </Grid2>
      </Grid2>

      {/* Tercera Fila: Mapa de Calor */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Mapa de Calor: Riesgo Inherente y Residual */}
        <Grid2 xs={12}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Mapa de Calor de Riesgo Inherente y Riesgo Residual
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<WarningIcon />}
                  onClick={() => setRiesgosFueraApetitoDialogOpen(true)}
                  sx={{ minWidth: 200 }}
                >
                  Riesgos Fuera del Apetito ({estadisticas.fueraApetito})
                </Button>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Haga clic en una celda para ver los riesgos en esa posición. Los riesgos fuera del apetito (≥ {UMBRALES_RIESGO.ALTO}) están marcados con borde rojo.
              </Alert>
              <Grid2 container spacing={3}>
                <Grid2 xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, textAlign: 'center' }}>
                    Riesgo Inherente
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                    {renderMapaCalor('inherente')}
                  </Box>
                </Grid2>
                <Grid2 xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, textAlign: 'center' }}>
                    Riesgo Residual
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                    {renderMapaCalor('residual')}
                  </Box>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Cuarta Fila: Tabla Resumen, Planes de Acción e Incidencias */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>

        {/* Tabla: Planes de Acción con Fechas - Usando componente */}
        <Grid2 xs={12} md={8}>
          <TablaPlanesAccion planes={planesAccion} />
        </Grid2>

        {/* Contador de Incidencias - Usando componente */}
        <Grid2 xs={12} md={4}>
          <IncidenciasCard total={incidencias.length} />
        </Grid2>

      </Grid2>

      {/* Diálogo: Riesgos Fuera del Apetito */}
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
              : `Los siguientes riesgos tienen un valor de riesgo ≥ ${UMBRALES_RIESGO.ALTO} y requieren atención inmediata.`}
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
    </Box>
  );
}

