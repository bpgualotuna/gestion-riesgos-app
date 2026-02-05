/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import { useGetPuntosMapaQuery, useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery } from '../api/riesgosApi';
import { colors } from '../../../app/theme/colors';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, ROUTES, NIVELES_RIESGO } from '../../../utils/constants';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useRiesgo } from '../../../shared/contexts/RiesgoContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { FiltrosRiesgo, PuntoMapa, Riesgo } from '../types';
import { Alert } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

// Función para generar ID del riesgo (número + sigla)
const generarIdRiesgo = (punto: PuntoMapa): string => {
  const numero = punto.numero || 0;
  const sigla = punto.siglaGerencia || '';
  return `${numero}${sigla}`;
};

export default function MapaPage() {
  const navigate = useNavigate();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { iniciarVer } = useRiesgo();
  const { esSupervisorRiesgos, user } = useAuth();
  const { data: procesos = [] } = useGetProcesosQuery();
  const [clasificacion, setClasificacion] = useState<string>('all');
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [mostrarFueraApetito, setMostrarFueraApetito] = useState(false);
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<{ probabilidad: number; impacto: number } | null>(null);
  const [dialogoResumenAbierto, setDialogoResumenAbierto] = useState(false);
  const [dialogoDetalleRiesgoAbierto, setDialogoDetalleRiesgoAbierto] = useState(false);
  const [riesgoSeleccionadoDetalle, setRiesgoSeleccionadoDetalle] = useState<Riesgo | null>(null);
  const [puntoSeleccionadoDetalle, setPuntoSeleccionadoDetalle] = useState<PuntoMapa | null>(null);
  const [dialogoRiesgosFueraApetitoAbierto, setDialogoRiesgosFueraApetitoAbierto] = useState(false);

  // Si es supervisor, obtener todos los procesos asignados
  const procesosSupervisor = useMemo(() => {
    if (esSupervisorRiesgos && user) {
      return procesos.filter((p) => p.directorId === user.id);
    }
    return [];
  }, [procesos, esSupervisorRiesgos, user]);

  // Si es supervisor, aplicar filtros de área y proceso si están seleccionados
  const procesoIdFiltrado = useMemo(() => {
    if (esSupervisorRiesgos) {
      if (filtroProceso && filtroProceso !== 'all') {
        return filtroProceso;
      }
      // Si hay filtro de área pero no de proceso, mostrar todos los procesos de esa área
      if (filtroArea && filtroArea !== 'all') {
        // Devolver undefined para que se filtren después por área
        return undefined;
      }
      return undefined; // Mostrar todos los procesos del supervisor
    }
    return procesoSeleccionado?.id;
  }, [esSupervisorRiesgos, filtroProceso, filtroArea, procesoSeleccionado]);

  const filtros: FiltrosRiesgo = {
    procesoId: procesoIdFiltrado,
    clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
  };

  const { data: puntos } = useGetPuntosMapaQuery(filtros);
  const { data: riesgosData } = useGetRiesgosQuery(filtros);
  
  // Obtener riesgos completos para el diálogo
  const riesgosCompletos = riesgosData?.data || [];
  
  // Si es supervisor, filtrar puntos y riesgos para mostrar solo los de sus procesos (aplicando filtros de área)
  const puntosFiltrados = useMemo(() => {
    if (esSupervisorRiesgos && procesosSupervisor.length > 0) {
      let procesosIds = procesosSupervisor.map((p) => p.id);
      
      // Aplicar filtro de área si está seleccionado
      if (filtroArea && filtroArea !== 'all') {
        procesosIds = procesosSupervisor
          .filter(p => p.areaId === filtroArea)
          .map(p => p.id);
      }
      
      // Aplicar filtro de proceso si está seleccionado
      if (filtroProceso && filtroProceso !== 'all') {
        procesosIds = [filtroProceso];
      }
      
      return puntos?.filter((p) => {
        const riesgo = riesgosCompletos.find((r) => r.id === p.riesgoId);
        return riesgo && procesosIds.includes(riesgo.procesoId);
      }) || [];
    }
    return puntos || [];
  }, [puntos, esSupervisorRiesgos, procesosSupervisor, riesgosCompletos, filtroArea, filtroProceso]);

  // Crear matriz 5x5 para riesgo inherente usando puntos filtrados
  const matrizInherente: { [key: string]: PuntoMapa[] } = {};
  puntosFiltrados.forEach((punto) => {
    const clave = `${punto.probabilidad}-${punto.impacto}`;
    if (!matrizInherente[clave]) {
      matrizInherente[clave] = [];
    }
    matrizInherente[clave].push(punto);
  });

  // Crear matriz 5x5 para riesgo residual
  // Calcular riesgo residual basado en evaluaciones (aproximación: reducir probabilidad/impacto según efectividad de controles)
  const matrizResidual: { [key: string]: PuntoMapa[] } = {};
  puntosFiltrados.forEach((punto) => {
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (!riesgo) return;
    
    // Aproximación: reducir probabilidad e impacto en un 20% para riesgo residual
    // En producción, esto vendría de las evaluaciones residuales reales
    const factorReduccion = 0.8; // 20% de reducción
    const probabilidadResidual = Math.max(1, Math.round(punto.probabilidad * factorReduccion));
    const impactoResidual = Math.max(1, Math.round(punto.impacto * factorReduccion));
    
    const clave = `${probabilidadResidual}-${impactoResidual}`;
    if (!matrizResidual[clave]) {
      matrizResidual[clave] = [];
    }
    // Crear un punto residual basado en el inherente
    matrizResidual[clave].push({
      ...punto,
      probabilidad: probabilidadResidual,
      impacto: impactoResidual,
    });
  });

  // Calcular nivel de riesgo basado en probabilidad e impacto
  const calcularNivelRiesgo = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return NIVELES_RIESGO.CRITICO;
    if (riesgo >= 15) return NIVELES_RIESGO.ALTO;
    if (riesgo >= 10) return NIVELES_RIESGO.ALTO;
    if (riesgo >= 5) return NIVELES_RIESGO.MEDIO;
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
      
      // Calcular residual (aproximación: reducir 20%)
      const factorReduccion = 0.8;
      const probabilidadResidual = Math.max(1, Math.round(punto.probabilidad * factorReduccion));
      const impactoResidual = Math.max(1, Math.round(punto.impacto * factorReduccion));
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
  }, [puntosFiltrados, riesgosCompletos]);

  // Identificar riesgos fuera del apetito (>= 15 para riesgo alto/crítico)
  const riesgosFueraApetito = useMemo(() => {
    const umbralApetito = 15; // Riesgos >= 15 están fuera del apetito
    return puntosFiltrados.filter((punto) => {
      const valorRiesgo = punto.probabilidad * punto.impacto;
      return valorRiesgo >= umbralApetito && punto.clasificacion === CLASIFICACION_RIESGO.NEGATIVA;
    }).map((punto) => {
      const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
      return { punto, riesgo, valorRiesgo: punto.probabilidad * punto.impacto };
    });
  }, [puntosFiltrados, riesgosCompletos]);

  // Obtener riesgos de la celda seleccionada usando puntos filtrados
  const [tipoMapaSeleccionado, setTipoMapaSeleccionado] = useState<'inherente' | 'residual'>('inherente');
  const matrizActual = tipoMapaSeleccionado === 'inherente' ? matrizInherente : matrizResidual;
  
  const riesgosCeldaSeleccionada = useMemo(() => {
    if (!celdaSeleccionada) return [];
    const clave = `${celdaSeleccionada.probabilidad}-${celdaSeleccionada.impacto}`;
    return matrizActual[clave] || [];
  }, [celdaSeleccionada, matrizActual]);
  
  // Si es supervisor, mostrar solo procesos que supervisa
  if (esSupervisorRiesgos && procesosSupervisor.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No tiene procesos asignados para supervisar.
        </Alert>
      </Box>
    );
  }
  
  // Si es supervisor y tiene proceso seleccionado, verificar que sea uno de sus procesos
  if (esSupervisorRiesgos && procesoSeleccionado && !procesosSupervisor.find(p => p.id === procesoSeleccionado.id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Este proceso no está asignado a su supervisión. Por favor seleccione uno de sus procesos desde el Dashboard.
        </Alert>
      </Box>
    );
  }

  const getCellColor = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    // Ajustado exactamente según la matriz de la imagen:
    // Verde (Bajo): valores 1, 2, 3, 4 (celdas: (1,1), (1,2), (1,3), (2,1), (2,2), (3,1))
    // Amarillo (Medio): valores 4, 6, 8, 9, 12 (celdas: (1,4), (2,3), (2,4), (3,2), (3,3), (4,1), (4,2), (4,3))
    // Naranja (Alto): valores 5, 10, 12, 16 (celdas: (1,5), (2,5), (3,4), (4,4), (5,1), (5,2))
    // Rojo (Muy Alto): valores 15, 20 (celdas: (4,5), (5,3), (5,4))
    // Rojo Oscuro (Crítico): valor 25 (celda: (5,5))
    
    // Mapeo específico por celda para coincidir exactamente con la imagen
    const claveCelda = `${probabilidad}-${impacto}`;
    const mapaColorCelda: { [key: string]: string } = {
      // Verde (Bajo)
      '1-1': colors.risk.low.main,
      '1-2': colors.risk.low.main,
      '1-3': colors.risk.low.main,
      '2-1': colors.risk.low.main,
      '2-2': colors.risk.low.main,
      '3-1': colors.risk.low.main,
      // Amarillo (Medio) - según especificación del usuario
      '1-4': colors.risk.medium.main,
      '2-3': colors.risk.medium.main,
      '2-4': colors.risk.medium.main,
      '3-2': colors.risk.medium.main,
      '3-3': colors.risk.medium.main, // Moderado y Moderada - amarillo
      '4-1': colors.risk.medium.main,
      '4-2': colors.risk.medium.main,
      // Naranja/Tomate (Alto)
      '3-4': colors.risk.high.main, // Moderado y Alta - tomate/naranja
      '4-3': colors.risk.high.main, // Grave y Moderada - tomate/naranja
      '1-5': colors.risk.high.main,
      '2-5': colors.risk.high.main,
      '5-1': colors.risk.high.main,
      '5-2': colors.risk.high.main,
      // Rojo (Muy Alto) - (4,4) Grave y Alta debe ser rojo
      '4-4': '#d32f2f', // Cambiado a rojo (Grave y Alta)
      // Rojo (Muy Alto)
      '4-5': '#d32f2f',
      '5-3': '#d32f2f',
      '5-4': '#d32f2f',
      '3-5': '#d32f2f',
      // Rojo Oscuro (Crítico)
      '5-5': colors.risk.critical.main,
    };
    
    // Si hay un mapeo específico, usarlo; si no, usar lógica por defecto
    if (mapaColorCelda[claveCelda]) {
      return mapaColorCelda[claveCelda];
    }
    
    // Lógica por defecto basada en el valor del riesgo
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

  const handleCellClick = (probabilidad: number, impacto: number, tipo: 'inherente' | 'residual') => {
    setTipoMapaSeleccionado(tipo);
    const clave = `${probabilidad}-${impacto}`;
    const matrizActual = tipo === 'inherente' ? matrizInherente : matrizResidual;
    const riesgosCelda = matrizActual[clave] || [];
    if (riesgosCelda.length > 0) {
      setCeldaSeleccionada({ probabilidad, impacto });
      setDialogoResumenAbierto(true);
    }
  };

  // Función para obtener los bordes rojos de una celda de límite
  const getBordesLimite = (probabilidad: number, impacto: number): { top?: boolean; right?: boolean } => {
    const claveCelda = `${probabilidad}-${impacto}`;
    // Según la especificación del usuario:
    // Formato: (probabilidad, impacto) donde impacto 5 es la fila de arriba
    // (4,1): SOLO línea derecha roja (NO superior) - "No Significativo" (impacto 1) y "Alta" (probabilidad 4)
    // (4,2): línea superior y derecha roja
    // (3,3): línea superior y derecha roja
    // (2,4): línea superior y derecha roja
    // (1,4): línea superior roja (fila 4, primera columna - línea roja en el lado superior)
    const bordesLimite: { [key: string]: { top?: boolean; right?: boolean } } = {
      '4-1': { top: false, right: true }, // Solo derecha (No Significativo y Alta)
      '4-2': { top: true, right: true },
      '3-3': { top: true, right: true },
      '2-4': { top: true, right: true },
      '1-4': { top: true, right: false }, // Solo superior (fila 4, primera columna)
    };
    return bordesLimite[claveCelda] || {};
  };

  // Función para renderizar una matriz
  const renderMatrix = (matriz: { [key: string]: PuntoMapa[] }, tipo: 'inherente' | 'residual') => {
    return (
      <Box sx={{ minWidth: 500, position: 'relative' }}>
        {/* Y-axis label */}
        <Box display="flex" alignItems="center" mb={1.5}>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              mr: 2,
              fontSize: '0.85rem',
            }}
          >
            IMPACTO
          </Typography>

          <Box flexGrow={1}>
            {/* Matrix Grid */}
            <Box>
              {[5, 4, 3, 2, 1].map((impacto) => {
                // Obtener etiqueta de impacto
                const etiquetasImpacto: Record<number, string> = {
                  5: 'Extremo',
                  4: 'Grave',
                  3: 'Moderado',
                  2: 'Leve',
                  1: 'No Significativo',
                };
                const etiquetaImpacto = etiquetasImpacto[impacto] || '';

                return (
                  <Box key={impacto} display="flex" mb={0.75}>
                    {/* Y-axis value con etiqueta */}
                    <Box
                      sx={{
                        width: 75,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #e0e0e0',
                        p: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                        {impacto}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', lineHeight: 1.2, fontSize: '0.65rem' }}>
                        {etiquetaImpacto}
                      </Typography>
                    </Box>

                    {/* Cells */}
                    {[1, 2, 3, 4, 5].map((probabilidad) => {
                      const clave = `${probabilidad}-${impacto}`;
                      const riesgosCelda = matriz[clave] || [];
                      const colorCelda = getCellColor(probabilidad, impacto);
                      const etiquetaCelda = getCellLabel(probabilidad, impacto);
                      const bordesLimite = getBordesLimite(probabilidad, impacto);

                      return (
                        <Box
                          key={probabilidad}
                          onClick={() => handleCellClick(probabilidad, impacto, tipo)}
                          sx={{
                            width: 85,
                            minHeight: 85,
                            border: '2px solid',
                            borderColor: '#000',
                            backgroundColor: `${colorCelda}20`,
                            borderLeftColor: colorCelda,
                            borderLeftWidth: 3,
                            // Bordes rojos muy gruesos y entrecortados para celdas de límite (muy notorios)
                            ...(bordesLimite.top && {
                              borderTopColor: '#d32f2f',
                              borderTopWidth: '10px',
                              borderTopStyle: 'dashed',
                            }),
                            // Solo aplicar borde derecho rojo si explícitamente es true
                            ...(bordesLimite.right === true ? {
                              borderRightColor: '#d32f2f',
                              borderRightWidth: '10px',
                              borderRightStyle: 'dashed',
                            } : {
                              // Mantener borde derecho normal (negro) si no es una celda de límite derecha
                              borderRightColor: '#000',
                              borderRightWidth: '2px',
                              borderRightStyle: 'solid',
                            }),
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            cursor: riesgosCelda.length > 0 ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            p: 0.75,
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: `${colorCelda}40`,
                              transform: riesgosCelda.length > 0 ? 'scale(1.05)' : 'none',
                            },
                            ml: 0.5,
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                            {etiquetaCelda}
                          </Typography>
                          <Chip
                            label={riesgosCelda.length}
                            size="small"
                            sx={{
                              mb: 0.5,
                              backgroundColor: colorCelda,
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              height: 20,
                              '& .MuiChip-label': {
                                px: 0.75,
                              },
                            }}
                          />
                          {/* IDs de riesgos */}
                          {riesgosCelda.length > 0 && (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.25,
                                width: '100%',
                                maxHeight: 45,
                                overflowY: 'auto',
                                mt: 0.5,
                              }}
                            >
                              {riesgosCelda.map((punto: PuntoMapa) => (
                                <Chip
                                  key={punto.riesgoId}
                                  label={generarIdRiesgo(punto)}
                                  size="small"
                                  onClick={(e) => handleIdRiesgoClick(e, punto)}
                                  sx={{
                                    fontSize: '0.65rem',
                                    height: 18,
                                    backgroundColor: '#fff',
                                    border: `1px solid ${colorCelda}`,
                                    color: colorCelda,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: `${colorCelda}15`,
                                      transform: 'scale(1.05)',
                                    },
                                    '& .MuiChip-label': {
                                      px: 0.5,
                                    },
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}

              {/* X-axis values con etiquetas */}
              <Box display="flex" mt={0.75}>
                <Box sx={{ width: 75 }} />
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
                        width: 85,
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
                      <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                        {prob}
                      </Typography>
                      <Typography variant="caption" sx={{ textAlign: 'center', fontSize: '0.65rem', lineHeight: 1.2 }}>
                        {etiquetaProb}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* X-axis label */}
              <Box display="flex" justifyContent="center" mt={1.5}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: '0.85rem' }}>
                  FRECUENCIA/PROBABILIDAD
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  const handleVerEvaluacion = (punto: PuntoMapa) => {
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (riesgo) {
      iniciarVer(riesgo);
      navigate(ROUTES.EVALUACION);
      setDialogoResumenAbierto(false);
      setDialogoDetalleRiesgoAbierto(false);
    }
  };

  // Manejar clic en ID del riesgo individual
  const handleIdRiesgoClick = (e: React.MouseEvent, punto: PuntoMapa) => {
    e.stopPropagation(); // Evitar que se active el click de la celda
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (riesgo) {
      setRiesgoSeleccionadoDetalle(riesgo);
      setPuntoSeleccionadoDetalle(punto);
      setDialogoDetalleRiesgoAbierto(true);
    }
  };

  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles
  const { data: evaluacionesRiesgo = [] } = useGetEvaluacionesByRiesgoQuery(
    riesgoSeleccionadoDetalle?.id || '',
    { skip: !riesgoSeleccionadoDetalle }
  );
  const evaluacionRiesgo = evaluacionesRiesgo[0] || null;

  // Supervisor puede ver el mapa sin seleccionar proceso específico
  if (!esSupervisorRiesgos && !procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
            Mapas de Calor de Riesgos
      </Typography>
          <Typography variant="body1" color="text.secondary">
            Matriz 5x5 de Probabilidad vs Impacto - Consecuencias Negativas
      </Typography>
        </Box>
        <Button
          variant={mostrarFueraApetito ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setDialogoRiesgosFueraApetitoAbierto(true)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Riesgos Fuera del Apetito
        </Button>
      </Box>

      <Grid2 container spacing={3}>
        {/* Columna principal: Filtros y Leyenda */}
        <Grid2 xs={12}>
          {/* Filter */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {esSupervisorRiesgos && procesosSupervisor.length > 0 && (
                  <>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Área</InputLabel>
                      <Select
                        value={filtroArea || 'all'}
                        onChange={(e) => {
                          setFiltroArea(e.target.value);
                          setFiltroProceso('all');
                        }}
                        label="Filtrar por Área"
                      >
                        <MenuItem value="all">Todas las áreas</MenuItem>
                        {Array.from(new Set(procesosSupervisor.map(p => p.areaId).filter(Boolean))).map(areaId => {
                          const proceso = procesosSupervisor.find(p => p.areaId === areaId);
                          return (
                            <MenuItem key={areaId} value={areaId}>
                              {proceso?.areaNombre || `Área ${areaId}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Proceso</InputLabel>
                      <Select
                        value={filtroProceso || 'all'}
                        onChange={(e) => setFiltroProceso(e.target.value)}
                        label="Filtrar por Proceso"
                      >
                        <MenuItem value="all">Todos los procesos</MenuItem>
                        {procesosSupervisor
                          .filter(p => !filtroArea || filtroArea === 'all' || p.areaId === filtroArea)
                          .map((proceso) => (
                            <MenuItem key={proceso.id} value={proceso.id}>
                              {proceso.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                )}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Clasificación</InputLabel>
                  <Select
                    value={clasificacion}
                    onChange={(e) => setClasificacion(e.target.value)}
                    label="Clasificación"
                    disabled={modoProceso === 'visualizar'}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
                    <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Leyenda
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.critical.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Crítico (≥20)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#d32f2f',
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Muy Alto (15-19)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.high.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Alto (10-14)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.medium.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Medio (5-9)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.low.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Bajo (≤4)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Matrices lado a lado */}
          <Grid2 container spacing={2} sx={{ mb: 3 }}>
            {/* Mapa de Riesgo Inherente */}
            <Grid2 xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2, textAlign: 'center' }}>
                    MAPA DE RIESGOS INHERENTE
                </Typography>
                  <Paper elevation={2} sx={{ p: 2, overflowX: 'auto' }}>
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
                  <Paper elevation={2} sx={{ p: 2, overflowX: 'auto' }}>
                    {renderMatrix(matrizResidual, 'residual')}
                  </Paper>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>

          {/* Resumen Comparativo Horizontal */}
          {estadisticasComparativas && (
            <Grid2 xs={12} sx={{ mb: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                  Resumen Comparativo: Riesgo Inherente vs Residual
                </Typography>
                
                <Grid2 container spacing={2}>
                  {/* Columna: Inherente */}
                  <Grid2 xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(25, 118, 210, 0.08)', borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                        RIESGO INHERENTE
                              </Typography>
                      <Typography variant="h4" fontWeight={700} color="primary">
                        {estadisticasComparativas.inherente.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Sin evaluar)
                      </Typography>
                                </Box>
                    
                    <Grid2 container spacing={1}>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.critical.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Crítico</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.critical.main }}>
                            {estadisticasComparativas.inherente.porNivel.critico}
                          </Typography>
                            </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.high.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Alto</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.high.main }}>
                            {estadisticasComparativas.inherente.porNivel.alto}
                          </Typography>
                      </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.medium.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Medio</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.medium.main }}>
                            {estadisticasComparativas.inherente.porNivel.medio}
                          </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.low.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Bajo</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.low.main }}>
                            {estadisticasComparativas.inherente.porNivel.bajo}
                          </Typography>
                    </Box>
                      </Grid2>
                    </Grid2>
                  </Grid2>

                  {/* Columna: Residual */}
                  <Grid2 xs={12} md={3}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(156, 39, 176, 0.08)', borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#9c27b0' }} gutterBottom>
                        RIESGO RESIDUAL
                      </Typography>
                      <Typography variant="h4" fontWeight={700} sx={{ color: '#9c27b0' }}>
                        {estadisticasComparativas.residual.total}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        (Con evaluación)
                      </Typography>
                    </Box>
                    
                    <Grid2 container spacing={1}>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.critical.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Crítico</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.critical.main }}>
                            {estadisticasComparativas.residual.porNivel.critico}
                          </Typography>
                  </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.high.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Alto</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.high.main }}>
                            {estadisticasComparativas.residual.porNivel.alto}
                          </Typography>
                </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.medium.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Medio</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.medium.main }}>
                            {estadisticasComparativas.residual.porNivel.medio}
                          </Typography>
              </Box>
                      </Grid2>
                      <Grid2 xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: colors.risk.low.main + '15', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">Bajo</Typography>
                          <Typography variant="h6" fontWeight={700} sx={{ color: colors.risk.low.main }}>
                            {estadisticasComparativas.residual.porNivel.bajo}
                          </Typography>
            </Box>
                      </Grid2>
                    </Grid2>
            </Grid2>

                  {/* Columna: Cambios */}
                  <Grid2 xs={12} md={6}>
                    <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.08)', borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600} color="success.main" gutterBottom>
                        CAMBIOS ENTRE NIVELES
              </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Riesgos que cambiaron de nivel
                      </Typography>
                    </Box>
                    
                    <Grid2 container spacing={1}>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(211, 47, 47, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Crítico → Alto</Typography>
                          <Typography variant="h6" fontWeight={700} color="error.main">
                            {estadisticasComparativas.cambios['critico-alto'] || 0}
                    </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Crítico → Medio</Typography>
                          <Typography variant="h6" fontWeight={700} color="warning.main">
                            {estadisticasComparativas.cambios['critico-medio'] || 0}
                    </Typography>
                  </Box>
                      </Grid2>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Crítico → Bajo</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {estadisticasComparativas.cambios['critico-bajo'] || 0}
                    </Typography>
                  </Box>
                      </Grid2>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(255, 152, 0, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Alto → Medio</Typography>
                          <Typography variant="h6" fontWeight={700} color="warning.main">
                            {estadisticasComparativas.cambios['alto-medio'] || 0}
                    </Typography>
                  </Box>
                      </Grid2>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Alto → Bajo</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {estadisticasComparativas.cambios['alto-bajo'] || 0}
                </Typography>
                        </Box>
                      </Grid2>
                      <Grid2 xs={6} md={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" display="block">Medio → Bajo</Typography>
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {estadisticasComparativas.cambios['medio-bajo'] || 0}
                          </Typography>
                        </Box>
                      </Grid2>
                    </Grid2>
                  </Grid2>
                </Grid2>
            </CardContent>
          </Card>
          </Grid2>
          )}
            </Grid2>
            </Grid2>

      {/* Diálogo de Resumen */}
      <Dialog
        open={dialogoResumenAbierto}
        onClose={() => setDialogoResumenAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Riesgos en la Celda ({celdaSeleccionada?.probabilidad}, {celdaSeleccionada?.impacto})
        </DialogTitle>
        <DialogContent>
          {riesgosCeldaSeleccionada.length === 0 ? (
            <Alert severity="info">No hay riesgos en esta celda.</Alert>
          ) : (
            <List>
              {riesgosCeldaSeleccionada.map((punto) => {
                const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                return (
                  <Card key={punto.riesgoId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            ID: {generarIdRiesgo(punto)}
                          </Typography>
                          <Chip
                            label={punto.nivelRiesgo}
                            size="small"
                            sx={{
                              backgroundColor: getCellColor(punto.probabilidad, punto.impacto),
                              color: '#fff',
                              mr: 1,
                            }}
                          />
                          <Chip
                            label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                            size="small"
                            color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleVerEvaluacion(punto)}
                        >
                          Ver Evaluación
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Descripción:</strong> {punto.descripcion}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Probabilidad:</strong> {punto.probabilidad}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Impacto:</strong> {punto.impacto}
                        </Typography>
                        {riesgo && (
                          <>
                            <Typography variant="body2">
                              <strong>Zona:</strong> {riesgo.zona}
                            </Typography>
                            {riesgo.tipologiaNivelI && (
                              <Typography variant="body2">
                                <strong>Tipología:</strong> {riesgo.tipologiaNivelI}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoResumenAbierto(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Detalles del Riesgo Individual */}
      <Dialog
        open={dialogoDetalleRiesgoAbierto}
        onClose={() => setDialogoDetalleRiesgoAbierto(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Resumen del Riesgo
            </Typography>
            {riesgoSeleccionadoDetalle && (
              <Chip
                label={generarIdRiesgo(puntoSeleccionadoDetalle!)}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {riesgoSeleccionadoDetalle && puntoSeleccionadoDetalle ? (
            <Box>
              {/* Información del Riesgo */}
              <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Información del Riesgo
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={puntoSeleccionadoDetalle.nivelRiesgo}
                      size="small"
                      sx={{
                        backgroundColor: getCellColor(puntoSeleccionadoDetalle.probabilidad, puntoSeleccionadoDetalle.impacto),
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                      size="small"
                      color={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                    />
                    <Chip
                      label={`Zona: ${riesgoSeleccionadoDetalle.zona}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Descripción:</strong> {riesgoSeleccionadoDetalle.descripcion}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Probabilidad:</strong> {puntoSeleccionadoDetalle.probabilidad}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Impacto:</strong> {puntoSeleccionadoDetalle.impacto}
                    </Typography>
                    {riesgoSeleccionadoDetalle.tipologiaNivelI && (
                      <Typography variant="body2">
                        <strong>Tipología:</strong> {riesgoSeleccionadoDetalle.tipologiaNivelI}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Información del Proceso y Responsable */}
                  {riesgoSeleccionadoDetalle.procesoId && (() => {
                    const procesoRiesgo = procesos.find(p => p.id === riesgoSeleccionadoDetalle.procesoId);
                    return procesoRiesgo ? (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Información del Proceso
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Proceso:</strong> {procesoRiesgo.nombre}
                          </Typography>
                          {procesoRiesgo.responsableNombre && (
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
                          {procesoRiesgo.areaNombre && (
                            <Typography variant="body2">
                              <strong>Área:</strong> {procesoRiesgo.areaNombre}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : null;
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
                            backgroundColor: getCellColor(evaluacionRiesgo.probabilidad, evaluacionRiesgo.impactoMaximo),
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
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoDetalleRiesgoAbierto(false)}>
            Cerrar
          </Button>
          {puntoSeleccionadoDetalle && (
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => handleVerEvaluacion(puntoSeleccionadoDetalle)}
            >
              Más Detalles
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo de Riesgos Fuera del Apetito */}
      <Dialog
        open={dialogoRiesgosFueraApetitoAbierto}
        onClose={() => setDialogoRiesgosFueraApetitoAbierto(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} color="error">
              Riesgos Fuera del Apetito
            </Typography>
            <Chip
              label={`${riesgosFueraApetito.length} riesgo${riesgosFueraApetito.length !== 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Los siguientes riesgos tienen un valor de riesgo ≥ 15 y requieren atención inmediata.
          </Alert>
          {riesgosFueraApetito.length === 0 ? (
            <Alert severity="success">
              No hay riesgos fuera del apetito. Todos los riesgos están dentro del nivel aceptable.
            </Alert>
          ) : (
            <List>
              {riesgosFueraApetito.map(({ punto, riesgo, valorRiesgo }) => (
                <Card key={punto.riesgoId} sx={{ mb: 2, border: '2px solid', borderColor: getCellColor(punto.probabilidad, punto.impacto) }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          ID: {generarIdRiesgo(punto)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={punto.nivelRiesgo}
                            size="small"
                            sx={{
                              backgroundColor: getCellColor(punto.probabilidad, punto.impacto),
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                          <Chip
                            label={`Valor: ${valorRiesgo}`}
                            size="small"
                            color="error"
                          />
                          {riesgo?.procesoId && (
                            <Chip
                              label={procesos.find((p) => p.id === riesgo.procesoId)?.nombre || 'Sin proceso'}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => {
                          if (riesgo) {
                            setRiesgoSeleccionadoDetalle(riesgo);
                            setPuntoSeleccionadoDetalle(punto);
                            setDialogoDetalleRiesgoAbierto(true);
                            setDialogoRiesgosFueraApetitoAbierto(false);
                          }
                        }}
                      >
                        Ver Detalle
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      <strong>Descripción:</strong> {punto.descripcion || riesgo?.descripcion || 'Sin descripción'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Probabilidad:</strong> {punto.probabilidad}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Impacto:</strong> {punto.impacto}
                      </Typography>
                      {riesgo?.zona && (
                        <Typography variant="body2">
                          <strong>Zona:</strong> {riesgo.zona}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoRiesgosFueraApetitoAbierto(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
