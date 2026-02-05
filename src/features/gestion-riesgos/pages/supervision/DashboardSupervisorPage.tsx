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

export default function DashboardSupervisorPage() {
  const { esSupervisorRiesgos, esDueñoProcesos } = useAuth();
  const navigate = useNavigate();
  
  // Filtros
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [filtroNumeroRiesgo, setFiltroNumeroRiesgo] = useState<string>('all');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);

  // Obtener datos - Supervisor ve TODOS los riesgos a nivel compañía
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000 });
  const { data: procesosData } = useGetProcesosQuery();
  // Obtener todos los puntos del mapa sin filtros para el supervisor
  const { data: puntosMapa } = useGetPuntosMapaQuery({});

  const riesgos = riesgosData?.data || [];
  const procesos = procesosData || [];
  const puntos = puntosMapa || [];

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

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = riesgosFiltrados.length;
    
    // Riesgos por tipo de proceso - Mapear a tipos estándar
    const porTipoProceso: Record<string, number> = {
      '01 Estratégico': 0,
      '02 Operacional': 0,
      '03 Apoyo': 0,
    };
    riesgosFiltrados.forEach((r: any) => {
      const proceso = procesos.find((p: any) => p.id === r.procesoId);
      const tipoProceso = (proceso?.tipoProceso || '').toLowerCase();
      // Mapear tipos de proceso
      if (tipoProceso.includes('estratégico') || tipoProceso.includes('estrategico') || tipoProceso.includes('estrategia')) {
        porTipoProceso['01 Estratégico']++;
      } else if (tipoProceso.includes('operacional') || tipoProceso.includes('operativo') || tipoProceso.includes('operacion')) {
        porTipoProceso['02 Operacional']++;
      } else {
        porTipoProceso['03 Apoyo']++;
      }
    });
    // Eliminar tipos con 0
    Object.keys(porTipoProceso).forEach(key => {
      if (porTipoProceso[key] === 0) {
        delete porTipoProceso[key];
      }
    });

    // Riesgos por proceso
    const porProceso: Record<string, { nombre: string; count: number }> = {};
    riesgosFiltrados.forEach((r: any) => {
      const proceso = procesos.find((p: any) => p.id === r.procesoId);
      if (proceso) {
        if (!porProceso[proceso.id]) {
          porProceso[proceso.id] = { nombre: proceso.nombre, count: 0 };
        }
        porProceso[proceso.id].count++;
      }
    });

    // Riesgos por tipología - Mapear a tipos estándar como en la imagen
    const porTipologia: Record<string, number> = {
      '01 Estratégico': 0,
      '02 Operacional': 0,
      '03 Financiero': 0,
      '04 Cumplimiento': 0,
    };
    riesgosFiltrados.forEach((r: any) => {
      const tipologiaNivelI = (r.tipologiaNivelI || '').toLowerCase();
      // Mapear tipologías a los tipos estándar
      if (tipologiaNivelI.includes('estratégico') || tipologiaNivelI.includes('estrategico') || tipologiaNivelI.includes('estrategia')) {
        porTipologia['01 Estratégico']++;
      } else if (tipologiaNivelI.includes('operacional') || tipologiaNivelI.includes('operativo') || tipologiaNivelI.includes('operacion')) {
        porTipologia['02 Operacional']++;
      } else if (tipologiaNivelI.includes('financiero') || tipologiaNivelI.includes('finanza')) {
        porTipologia['03 Financiero']++;
      } else if (tipologiaNivelI.includes('cumplimiento') || tipologiaNivelI.includes('compliance')) {
        porTipologia['04 Cumplimiento']++;
      } else {
        // Si no coincide, asignar a "02 Operacional" por defecto (el más común)
        porTipologia['02 Operacional']++;
      }
    });
    // Eliminar tipos con 0
    Object.keys(porTipologia).forEach(key => {
      if (porTipologia[key] === 0) {
        delete porTipologia[key];
      }
    });

    // Origen de riesgos - Solo mostrar los dos principales según la imagen
    const origen: Record<string, number> = {
      'Talleres internos': 0,
      'Auditoría HHI': 0,
    };
    riesgosFiltrados.forEach((r: any) => {
      if (r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller') || r.origen?.includes('Taller')) {
        origen['Talleres internos']++;
      } else if (r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría') || r.origen?.includes('Auditoría')) {
        origen['Auditoría HHI']++;
      } else {
        // Si no coincide con ninguno, asignar a "Talleres internos" por defecto
        origen['Talleres internos']++;
      }
    });

    // Riesgos fuera del apetito (>= 15)
    const fueraApetito = puntos.filter((p: any) => {
      const valorRiesgo = p.probabilidad * p.impacto;
      return valorRiesgo >= UMBRALES_RIESGO.ALTO;
    });

    return {
      total,
      porTipoProceso,
      porProceso,
      porTipologia,
      origen,
      fueraApetito: fueraApetito.length,
    };
  }, [riesgosFiltrados, procesos, puntos]);

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

  // Preparar datos para tabla de planes de acción
  const planesAccion = useMemo(() => {
    // Mock de planes de acción - En producción vendría de la API
    return [
      {
        id: '1',
        nombre: 'Plan de Mitigación R001',
        proceso: 'Direccionamiento Estratégico',
        fechaInicio: '2024-01-15',
        fechaLimite: '2024-03-15',
        estado: 'en_ejecucion',
        responsable: 'Juan Pérez',
      },
      {
        id: '2',
        nombre: 'Plan de Control R002',
        proceso: 'Direccionamiento Estratégico',
        fechaInicio: '2024-02-01',
        fechaLimite: '2024-04-01',
        estado: 'en_ejecucion',
        responsable: 'María González',
      },
    ];
  }, []);

  // Preparar datos para incidencias
  const incidencias = useMemo(() => {
    // Mock de incidencias - En producción vendría de la API
    return [
      {
        id: '1',
        codigo: 'INC-001',
        titulo: 'Incidente de seguridad',
        fecha: '2024-01-20',
        severidad: 'alta',
        estado: 'abierta',
      },
      {
        id: '2',
        codigo: 'INC-002',
        titulo: 'Casi incidente operacional',
        fecha: '2024-01-22',
        severidad: 'media',
        estado: 'en_investigacion',
      },
    ];
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

  const columnasResumen: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'proceso', headerName: 'Proceso', width: 200 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 300 },
    {
      field: 'riesgoInherente',
      headerName: 'RI',
      width: 120,
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRI})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRI}20`,
            color: params.row.colorRI,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRI}`,
          }}
        />
      ),
    },
    {
      field: 'riesgoResidual',
      headerName: 'RR',
      width: 120,
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRR})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRR}20`,
            color: params.row.colorRR,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRR}`,
          }}
        />
      ),
    },
  ];

  const columnasPlanes: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'proceso', headerName: 'Proceso', width: 200 },
    {
      field: 'fechaInicio',
      headerName: 'Fecha Inicio',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'fechaLimite',
      headerName: 'Fecha Límite',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    { field: 'responsable', headerName: 'Responsable', width: 150 },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          size="small"
          color={params.value === 'completado' ? 'success' : params.value === 'en_ejecucion' ? 'info' : 'warning'}
        />
      ),
    },
  ];

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
      {/* Filtros */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl 
          size="medium" 
          sx={{ 
            minWidth: 200, 
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            },
          }}
        >
          <InputLabel sx={{ fontWeight: 600 }}>Proceso</InputLabel>
          <Select
            value={filtroProceso}
            onChange={(e) => setFiltroProceso(e.target.value)}
            label="Proceso"
          >
            <MenuItem value="all">Todas</MenuItem>
            {procesos.map((p: any) => (
              <MenuItem key={p.id} value={p.id}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl 
          size="medium" 
          sx={{ 
            minWidth: 170, 
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            },
          }}
        >
          <InputLabel sx={{ fontWeight: 600 }}># Riesgo</InputLabel>
          <Select
            value={filtroNumeroRiesgo}
            onChange={(e) => setFiltroNumeroRiesgo(e.target.value)}
            label="# Riesgo"
          >
            <MenuItem value="all">Todas</MenuItem>
            {Array.from(new Set(riesgos.map((r: any) => `R${String(r.numero || 0).padStart(3, '0')}`))).map((codigo) => (
              <MenuItem key={codigo} value={codigo}>
                {codigo}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl 
          size="medium" 
          sx={{ 
            minWidth: 170, 
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            },
          }}
        >
          <InputLabel sx={{ fontWeight: 600 }}>Origen</InputLabel>
          <Select
            value={filtroOrigen}
            onChange={(e) => setFiltroOrigen(e.target.value)}
            label="Origen"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="talleres">Talleres internos</MenuItem>
            <MenuItem value="auditoria">Auditoría HHI</MenuItem>
          </Select>
        </FormControl>
      </Box>


      {/* Primera Fila: Estadísticas - Solo visible para Supervisor de Riesgos */}
      {esSupervisorRiesgos && (
      <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: Total de Riesgos */}
        <Grid2 xs={12} sm={6} md={4}>
          <Card sx={{ 
            background: 'white', 
            height: '100%', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: 2,
            minHeight: 200,
          }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem', fontWeight: 500 }}>
                # de riesgos
              </Typography>
              <Typography variant="h2" fontWeight={700} sx={{ color: '#1976d2', fontSize: '3.5rem', lineHeight: 1.2 }}>
                {estadisticas.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid2>

        {/* Card 2: Treemap - Riesgos por tipo */}
        <Grid2 xs={12} sm={6} md={4}>
          <Card sx={{ 
            height: '100%', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: 2,
            background: 'white',
            minHeight: 200,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" gutterBottom fontWeight={600} sx={{ mb: 2, fontSize: '0.875rem', color: '#424242' }}>
                Riesgos por tipo
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, height: 150, alignItems: 'flex-start' }}>
                {(() => {
                  const sortedEntries = Object.entries(estadisticas.porTipologia).sort(([, a], [, b]) => b - a);
                  const colores: Record<string, string> = {
                    '01 Estratégico': '#ed6c02',
                    '02 Operacional': '#1976d2',
                    '03 Financiero': '#1565c0',
                    '04 Cumplimiento': '#9c27b0',
                  };
                  
                  const mayor = sortedEntries[0];
                  const menores = sortedEntries.slice(1);
                  
                  return (
                    <>
                      {mayor && (
                        <Box
                          sx={{
                            backgroundColor: colores[mayor[0]] || '#1976d2',
                            color: 'white',
                            p: 2,
                            borderRadius: 1,
                            width: '65%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '60px',
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, textAlign: 'center', fontSize: '0.75rem' }}>
                            {mayor[0]}
                          </Typography>
                          <Typography variant="h4" fontWeight={700} sx={{ fontSize: '2rem' }}>
                            {mayor[1]}
                          </Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '32%', height: '100%' }}>
                        {menores.map(([tipologia, count]) => (
                          <Box
                            key={tipologia}
                            sx={{
                              backgroundColor: colores[tipologia] || '#1976d2',
                              color: 'white',
                              p: 1.5,
                              borderRadius: 1,
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              minHeight: '45px',
                            }}
                          >
                            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.25, textAlign: 'center', fontSize: '0.7rem' }}>
                              {tipologia}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.25rem' }}>
                              {count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Card 3: Donut - Origen */}
        <Grid2 xs={12} sm={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: 2,
            background: 'white',
            minHeight: 200,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" gutterBottom fontWeight={600} sx={{ mb: 2, fontSize: '0.875rem', color: '#424242' }}>
                Origen
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Gráfico de arco (donut parcial) */}
                <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                  <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                    {Object.entries(estadisticas.origen).map(([origen, count], index) => {
                      const porcentaje = estadisticas.total > 0 ? (count / estadisticas.total) * 100 : 0;
                      const colores = ['#42a5f5', '#1976d2', '#90caf9'];
                      const color = colores[index % colores.length];
                      const radio = 50;
                      const circunferencia = 2 * Math.PI * radio;
                      
                      let offsetAcumulado = 0;
                      for (let i = 0; i < index; i++) {
                        const prevCount = Object.values(estadisticas.origen)[i];
                        const prevPorcentaje = estadisticas.total > 0 ? (prevCount / estadisticas.total) * 100 : 0;
                        offsetAcumulado += (prevPorcentaje / 100) * circunferencia;
                      }
                      
                      const dashOffset = circunferencia - offsetAcumulado;
                      const dashLength = (porcentaje / 100) * circunferencia;
                      
                      return (
                        <circle
                          key={origen}
                          cx={70}
                          cy={70}
                          r={radio}
                          fill="none"
                          stroke={color}
                          strokeWidth={28}
                          strokeDasharray={`${dashLength} ${circunferencia}`}
                          strokeDashoffset={dashOffset}
                          style={{
                            strokeLinecap: 'round',
                          }}
                        />
                      );
                    })}
                  </svg>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1976d2', fontSize: '1.5rem' }}>
                      {estadisticas.total}
                    </Typography>
                  </Box>
                </Box>
                {/* Leyenda */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {Object.entries(estadisticas.origen).map(([origen, count], index) => {
                    const porcentaje = estadisticas.total > 0 ? ((count / estadisticas.total) * 100).toFixed(1) : '0.0';
                    const colores = ['#42a5f5', '#1976d2', '#90caf9'];
                    const color = colores[index % colores.length];
                    return (
                      <Box key={origen} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#424242' }}>
                            {index + 1} {origen}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#757575' }}>
                          {porcentaje}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
      )}

      {/* Segunda Fila: Gráfico de Riesgos por Proceso (Ranking con barras llenas) */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico: Riesgos por Proceso (Ranking con barras horizontales) */}
        <Grid2 xs={12}>
          <Card
            sx={{
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 2.5, height: 420, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '1rem', mb: 0 }}>
                  # de riesgos por proceso (Top 10)
                </Typography>
                <Chip
                  label="Top 10"
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, mt: 1 }}>
                {(() => {
                  let datosGrafico = Object.entries(estadisticas.porProceso)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 10)
                    .map(([id, data]) => ({
                      id,
                      nombre: data.nombre,
                      nombreCompleto: data.nombre,
                      count: data.count,
                    }));

                  // Completar hasta Top 10 con procesos de ejemplo si faltan
                  if (datosGrafico.length < 10) {
                    const procesosMock = [
                      { id: 'mock-1', nombre: 'Gestión de Procesos', nombreCompleto: 'Gestión de Procesos', count: 22 },
                      { id: 'mock-2', nombre: 'Gestión de Talento Humano', nombreCompleto: 'Gestión de Talento Humano', count: 19 },
                      { id: 'mock-3', nombre: 'Gestión de Finanzas', nombreCompleto: 'Gestión de Finanzas', count: 13 },
                      { id: 'mock-4', nombre: 'Ciberseguridad', nombreCompleto: 'Ciberseguridad', count: 12 },
                      { id: 'mock-5', nombre: 'Direccionamiento Estratégico', nombreCompleto: 'Direccionamiento Estratégico', count: 12 },
                      { id: 'mock-6', nombre: 'Gestión de TI', nombreCompleto: 'Gestión de TI', count: 11 },
                      { id: 'mock-7', nombre: 'Planificación Estratégica', nombreCompleto: 'Planificación Estratégica', count: 10 },
                      { id: 'mock-8', nombre: 'Gestión Comercial', nombreCompleto: 'Gestión Comercial', count: 8 },
                      { id: 'mock-9', nombre: 'Compliance', nombreCompleto: 'Compliance', count: 5 },
                      { id: 'mock-10', nombre: 'Gestión de Servicios', nombreCompleto: 'Gestión de Servicios', count: 3 },
                    ];

                    const faltan = 10 - datosGrafico.length;
                    datosGrafico = [
                      ...datosGrafico,
                      ...procesosMock
                        .filter((mock) => !datosGrafico.some((d) => d.nombre === mock.nombre))
                        .slice(0, faltan),
                    ];
                  }

                  if (datosGrafico.length === 0) {
                    return (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#757575' }}>
                          No hay datos disponibles para mostrar
                        </Typography>
                      </Box>
                    );
                  }

                  const maxCount = Math.max(...datosGrafico.map((d) => d.count));
                  const total = datosGrafico.reduce((sum, d) => sum + d.count, 0);

                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {datosGrafico.map((item) => {
                        const ancho = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        const porcentajeTotal = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0';

                        return (
                          <Box
                            key={item.id}
                            sx={{
                              p: 1.25,
                              borderRadius: 1.5,
                              backgroundColor: 'rgba(25,118,210,0.02)',
                              border: '1px solid rgba(25,118,210,0.06)',
                              transition: 'all 0.25s ease',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                transform: 'translateY(-2px)',
                                backgroundColor: 'rgba(25,118,210,0.04)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 0.75,
                                gap: 1,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    maxWidth: { xs: '55vw', md: '65vw' },
                                  }}
                                  title={item.nombreCompleto}
                                >
                                  {item.nombre}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#757575' }}>
                                  {porcentajeTotal}%
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ color: '#1976d2', minWidth: 28, textAlign: 'right' }}
                                >
                                  {item.count}
                                </Typography>
                              </Box>
                            </Box>
                            <Box
                              sx={{
                                height: 20,
                                borderRadius: 999,
                                backgroundColor: '#f5f5f5',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'absolute',
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: `${Math.max(ancho, 8)}%`,
                                  background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)',
                                  boxShadow: '0 3px 10px rgba(25,118,210,0.4)',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 2,
                          mt: 1,
                          pt: 1.5,
                          borderTop: '1px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          Total procesos: <strong>{datosGrafico.length}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          Total riesgos (Top 10): <strong>{total}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Tabla: Detalle de Riesgos (Id, Proceso, Descripción Riesgo) */}
        <Grid2 xs={12}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                Detalle
              </Typography>
              <AppDataGrid
                rows={filasTablaResumen}
                columns={[
                  { field: 'codigo', headerName: 'Id', width: 100 },
                  { field: 'proceso', headerName: 'Proceso', width: 250 },
                  { field: 'descripcion', headerName: 'Descripción Riesgo', flex: 1, minWidth: 400 },
                ]}
                loading={loadingRiesgos}
                getRowId={(row) => row.id}
                pageSizeOptions={[10, 25, 50, 100]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                }}
              />
            </CardContent>
          </Card>
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

        {/* Tabla: Planes de Acción con Fechas */}
        <Grid2 xs={12} md={8}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
                Planes de Acción
              </Typography>
              <AppDataGrid
                rows={planesAccion}
                columns={columnasPlanes}
                getRowId={(row) => row.id}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #e0e0e0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid2>

        {/* Contador de Incidencias */}
        <Grid2 xs={12} md={4}>
          <Card sx={{ background: '#f5f5f5', height: '100%', border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReportProblemIcon color="error" />
                <Typography variant="body2" color="text.secondary">
                  # Incidencias
                </Typography>
              </Box>
              <Typography variant="h2" fontWeight={700} sx={{ color: '#d32f2f', mb: 1 }}>
                {incidencias.length}
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={() => navigate(ROUTES.INCIDENCIAS)}
                sx={{ mt: 1 }}
              >
                Ver todas
              </Button>
            </CardContent>
          </Card>
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

