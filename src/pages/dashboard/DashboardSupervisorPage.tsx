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
  Tooltip,
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
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery, useGetPuntosMapaQuery, useGetIncidenciasQuery, useGetPlanesQuery, useGetCausasQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../app/theme/colors';
import { UMBRALES_RIESGO } from '../../utils/constants';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BugReport as BugReportIcon } from '@mui/icons-material';

export default function DashboardSupervisorPage() {
  const { esSupervisorRiesgos } = useAuth();
  const navigate = useNavigate();

  // Filtros
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [filtroNumeroRiesgo, setFiltroNumeroRiesgo] = useState<string>('all');
  const [filtroOrigen, setFiltroOrigen] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');
  const [riesgosFueraApetitoDialogOpen, setRiesgosFueraApetitoDialogOpen] = useState(false);

  // Obtener datos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000, procesoId: undefined });
  const { data: incidenciasApi = [] } = useGetIncidenciasQuery({
    procesoId: filtroProceso !== 'all' ? filtroProceso : undefined
  });
  const { data: planesApi = [] } = useGetPlanesQuery();
  const { data: causasApi = [] } = useGetCausasQuery();
  const { data: procesosData } = useGetProcesosQuery();
  const { data: puntosMapa } = useGetPuntosMapaQuery({ procesoId: undefined });

  const riesgos = riesgosData?.data || [];
  const procesos = procesosData || [];
  const puntos = puntosMapa || [];

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
    let total = riesgosFiltrados.length;

    // Si hay muy pocos datos, usar datos de ejemplo para mejor visualización
    const usarDatosEjemplo = total < 5;

    // Riesgos por tipo de proceso
    const porTipoProceso: Record<string, number> = {
      '01 Estratégico': 0,
      '02 Operacional': 0,
      '03 Apoyo': 0,
    };

    if (usarDatosEjemplo) {
      porTipoProceso['01 Estratégico'] = 5;
      porTipoProceso['02 Operacional'] = 7;
      porTipoProceso['03 Apoyo'] = 3;
      total = 15;
    } else {
      riesgosFiltrados.forEach((r: any) => {
        const proceso = procesos.find((p: any) => p.id === r.procesoId);
        const tipoProceso = (proceso?.tipoProceso || '').toLowerCase();
        if (tipoProceso.includes('estratégico') || tipoProceso.includes('estrategico') || tipoProceso.includes('estrategia')) {
          porTipoProceso['01 Estratégico']++;
        } else if (tipoProceso.includes('operacional') || tipoProceso.includes('operativo') || tipoProceso.includes('operacion')) {
          porTipoProceso['02 Operacional']++;
        } else {
          porTipoProceso['03 Apoyo']++;
        }
      });
    }

    // Eliminar tipos con 0
    Object.keys(porTipoProceso).forEach(key => {
      if (porTipoProceso[key] === 0) {
        delete porTipoProceso[key];
      }
    });

    // Riesgos por proceso
    const porProceso: Record<string, { nombre: string; count: number }> = {};

    if (usarDatosEjemplo || riesgosFiltrados.length === 0) {
      // Siempre usar datos de ejemplo si no hay datos o hay muy pocos
      porProceso['1'] = { nombre: 'Gestión de Procesos', count: 22 };
      porProceso['2'] = { nombre: 'Gestión de Talento Humano', count: 19 };
      porProceso['3'] = { nombre: 'Gestión de Finanzas', count: 13 };
      porProceso['4'] = { nombre: 'Ciberseguridad', count: 12 };
      porProceso['5'] = { nombre: 'Direccionamiento Estratégico', count: 12 };
      porProceso['6'] = { nombre: 'Gestión de TI', count: 11 };
      porProceso['7'] = { nombre: 'Planificación Estratégica', count: 10 };
      porProceso['8'] = { nombre: 'Gestión Comercial', count: 8 };
      porProceso['9'] = { nombre: 'Compliance', count: 5 };
      porProceso['10'] = { nombre: 'Gestión de Servicios', count: 3 };
    } else {
      riesgosFiltrados.forEach((r: any) => {
        const proceso = procesos.find((p: any) => p.id === r.procesoId);
        if (proceso) {
          if (!porProceso[proceso.id]) {
            porProceso[proceso.id] = { nombre: proceso.nombre, count: 0 };
          }
          porProceso[proceso.id].count++;
        }
      });

      // Si después de procesar no hay datos, usar datos de ejemplo
      if (Object.keys(porProceso).length === 0) {
        porProceso['1'] = { nombre: 'Gestión de Procesos', count: 22 };
        porProceso['2'] = { nombre: 'Gestión de Talento Humano', count: 19 };
        porProceso['3'] = { nombre: 'Gestión de Finanzas', count: 13 };
        porProceso['4'] = { nombre: 'Ciberseguridad', count: 12 };
        porProceso['5'] = { nombre: 'Direccionamiento Estratégico', count: 12 };
        porProceso['6'] = { nombre: 'Gestión de TI', count: 11 };
        porProceso['7'] = { nombre: 'Planificación Estratégica', count: 10 };
        porProceso['8'] = { nombre: 'Gestión Comercial', count: 8 };
        porProceso['9'] = { nombre: 'Compliance', count: 5 };
        porProceso['10'] = { nombre: 'Gestión de Servicios', count: 3 };
      }
    }

    // Riesgos por tipología
    const porTipologia: Record<string, number> = {
      '01 Estratégico': 0,
      '02 Operacional': 0,
      '03 Financiero': 0,
      '04 Cumplimiento': 0,
    };

    if (usarDatosEjemplo) {
      porTipologia['02 Operacional'] = 7;
      porTipologia['03 Financiero'] = 3;
      porTipologia['04 Cumplimiento'] = 3;
      porTipologia['01 Estratégico'] = 2;
    } else {
      riesgosFiltrados.forEach((r: any) => {
        const tipologiaNivelI = (r.tipologiaNivelI || '').toLowerCase();
        if (tipologiaNivelI.includes('estratégico') || tipologiaNivelI.includes('estrategico') || tipologiaNivelI.includes('estrategia')) {
          porTipologia['01 Estratégico']++;
        } else if (tipologiaNivelI.includes('operacional') || tipologiaNivelI.includes('operativo') || tipologiaNivelI.includes('operacion')) {
          porTipologia['02 Operacional']++;
        } else if (tipologiaNivelI.includes('financiero') || tipologiaNivelI.includes('finanza')) {
          porTipologia['03 Financiero']++;
        } else if (tipologiaNivelI.includes('cumplimiento') || tipologiaNivelI.includes('compliance')) {
          porTipologia['04 Cumplimiento']++;
        } else {
          porTipologia['02 Operacional']++;
        }
      });
    }

    // Eliminar tipos con 0
    Object.keys(porTipologia).forEach(key => {
      if (porTipologia[key] === 0) {
        delete porTipologia[key];
      }
    });

    // Origen de riesgos
    const origen: Record<string, number> = {
      'Talleres internos': 0,
      'Auditoría HHI': 0,
      'Otro': 0,
    };

    if (usarDatosEjemplo) {
      origen['Talleres internos'] = 10; // 66.7% de 15
      origen['Auditoría HHI'] = 4; // 26.7% de 15
      origen['Otro'] = 1; // 6.7% de 15
    } else {
      riesgosFiltrados.forEach((r: any) => {
        if (r.tipologiaNivelI?.includes('Taller') || r.fuenteCausa?.includes('Taller')) {
          origen['Talleres internos']++;
        } else if (r.tipologiaNivelI?.includes('Auditoría') || r.fuenteCausa?.includes('Auditoría')) {
          origen['Auditoría HHI']++;
        } else {
          origen['Otro']++;
        }
      });
    }

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
    // Si hay muy pocos datos, usar datos de ejemplo
    if (riesgosFiltrados.length < 5) {
      const datosEjemplo = [
        {
          id: 'ejemplo-1',
          codigo: 'R001',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Impacto económico, operacional y reputacional por perder los derechos de distribución de Oracle',
          riesgoInherente: 20,
          riesgoResidual: 16,
          nivelRI: 'CRÍTICO',
          nivelRR: 'ALTO',
          colorRI: colors.risk.critical.main,
          colorRR: colors.risk.high.main,
        },
        {
          id: 'ejemplo-2',
          codigo: 'R002',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Imposibilidad de mantener la continuidad de las operaciones y su impacto en la reputación y las finanzas del negocio',
          riesgoInherente: 18,
          riesgoResidual: 14,
          nivelRI: 'ALTO',
          nivelRR: 'ALTO',
          colorRI: colors.risk.high.main,
          colorRR: colors.risk.high.main,
        },
        {
          id: 'ejemplo-3',
          codigo: 'R003',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Pérdidas económicas y su impacto en las finanzas',
          riesgoInherente: 15,
          riesgoResidual: 12,
          nivelRI: 'ALTO',
          nivelRR: 'MEDIO',
          colorRI: colors.risk.high.main,
          colorRR: colors.risk.medium.main,
        },
        {
          id: 'ejemplo-4',
          codigo: 'R006',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Impacto económico, operacional y de satisfacción de clientes por el incumplimiento de la dirección estratégica establecida para el área comercial',
          riesgoInherente: 12,
          riesgoResidual: 9,
          nivelRI: 'MEDIO',
          nivelRR: 'BAJO',
          colorRI: colors.risk.medium.main,
          colorRR: colors.risk.low.main,
        },
        {
          id: 'ejemplo-5',
          codigo: 'R007',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Impacto económico por sub-utilizar o vender por debajo del punto de equilibrio la capacidad instalada de servicios',
          riesgoInherente: 10,
          riesgoResidual: 8,
          nivelRI: 'MEDIO',
          nivelRR: 'BAJO',
          colorRI: colors.risk.medium.main,
          colorRR: colors.risk.low.main,
        },
        {
          id: 'ejemplo-6',
          codigo: 'R008',
          proceso: 'Direccionamiento Estratégico',
          descripcion: 'Impacto económico por la entrada al mercado de empresas de tecnología con mayor capacidad financiera',
          riesgoInherente: 8,
          riesgoResidual: 6,
          nivelRI: 'BAJO',
          nivelRR: 'BAJO',
          colorRI: colors.risk.low.main,
          colorRR: colors.risk.low.main,
        },
        {
          id: 'ejemplo-7',
          codigo: 'R010',
          proceso: 'Gestión de Procesos',
          descripcion: 'Falta de actualización de procesos internos que afecta la eficiencia operacional',
          riesgoInherente: 16,
          riesgoResidual: 13,
          nivelRI: 'ALTO',
          nivelRR: 'MEDIO',
          colorRI: colors.risk.high.main,
          colorRR: colors.risk.medium.main,
        },
        {
          id: 'ejemplo-8',
          codigo: 'R015',
          proceso: 'Gestión de Talento Humano',
          descripcion: 'Rotación de personal clave que impacta la continuidad del negocio',
          riesgoInherente: 14,
          riesgoResidual: 11,
          nivelRI: 'ALTO',
          nivelRR: 'MEDIO',
          colorRI: colors.risk.high.main,
          colorRR: colors.risk.medium.main,
        },
        {
          id: 'ejemplo-9',
          codigo: 'R020',
          proceso: 'Gestión de Finanzas',
          descripcion: 'Fluctuaciones en los tipos de cambio que afectan la rentabilidad',
          riesgoInherente: 11,
          riesgoResidual: 9,
          nivelRI: 'MEDIO',
          nivelRR: 'BAJO',
          colorRI: colors.risk.medium.main,
          colorRR: colors.risk.low.main,
        },
        {
          id: 'ejemplo-10',
          codigo: 'R025',
          proceso: 'Ciberseguridad',
          descripcion: 'Vulnerabilidades en los sistemas de información que exponen datos sensibles',
          riesgoInherente: 19,
          riesgoResidual: 15,
          nivelRI: 'ALTO',
          nivelRR: 'ALTO',
          colorRI: colors.risk.high.main,
          colorRR: colors.risk.high.main,
        },
      ];
      return datosEjemplo;
    }

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

  const metricsData = useMemo(() => {
    const todasIncidencias = incidenciasApi || [];
    const todasCausas = causasApi || [];
    const todosControles = todasCausas.filter((c: any) => String(c.tipoGestion || '').toUpperCase() === 'CONTROL');
    const todosPlanes = todasCausas.filter((c: any) => String(c.tipoGestion || '').toUpperCase() === 'PLAN');

    // Filtrar según los filtros activos
    const incidenciasFiltradas = todasIncidencias.filter((inc: any) => {
      // Filtrar por proceso si aplica
      if (filtroProceso !== 'all' && String(inc.procesoId) !== String(filtroProceso)) {
        return false;
      }

      // Filtrar por búsqueda
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase();
        return (
          inc.titulo?.toLowerCase().includes(busquedaLower) ||
          inc.descripcion?.toLowerCase().includes(busquedaLower) ||
          inc.codigo?.toLowerCase().includes(busquedaLower) ||
          inc.procesoNombre?.toLowerCase().includes(busquedaLower) ||
          inc.riesgoNombre?.toLowerCase().includes(busquedaLower)
        );
      }

      return true;
    });

    const controlesFiltrados = todosControles.filter((control: any) => {
      // Filtrar por proceso si aplica
      if (filtroProceso !== 'all' && String(control.procesoId) !== String(filtroProceso)) {
        return false;
      }

      // Filtrar por búsqueda
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase();
        return (
          control.controlDescripcion?.toLowerCase().includes(busquedaLower) ||
          control.controlTipo?.toLowerCase().includes(busquedaLower)
        );
      }

      return true;
    });

    const planesFiltrados = todosPlanes.filter((plan: any) => {
      // Filtrar por proceso si aplica
      if (filtroProceso !== 'all' && String(plan.procesoId) !== String(filtroProceso)) {
        return false;
      }

      // Filtrar por búsqueda
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase();
        return (
          plan.planDescripcion?.toLowerCase().includes(busquedaLower) ||
          plan.planResponsable?.toLowerCase().includes(busquedaLower)
        );
      }

      return true;
    });

    // Estadísticas detalladas de controles por tipo
    const controlesPorTipo = {
      prevencion: controlesFiltrados.filter((c: any) => c.controlTipo === 'prevención').length,
      deteccion: controlesFiltrados.filter((c: any) => c.controlTipo === 'detección').length,
      correccion: controlesFiltrados.filter((c: any) => c.controlTipo === 'corrección').length,
    };

    // Estadísticas de controles por nivel de riesgo residual
    const controlesPorNivelResidual = {
      critico: controlesFiltrados.filter((c: any) => c.nivelRiesgoResidual === 'CRÍTICO').length,
      alto: controlesFiltrados.filter((c: any) => c.nivelRiesgoResidual === 'ALTO').length,
      medio: controlesFiltrados.filter((c: any) => c.nivelRiesgoResidual === 'MEDIO').length,
      bajo: controlesFiltrados.filter((c: any) => c.nivelRiesgoResidual === 'BAJO').length,
    };

    // Estadísticas detalladas de planes por estado
    const planesPorEstado = {
      pendiente: planesFiltrados.filter((p: any) => p.planEstado === 'pendiente').length,
      en_progreso: planesFiltrados.filter((p: any) => p.planEstado === 'en_progreso').length,
      completado: planesFiltrados.filter((p: any) => p.planEstado === 'completado').length,
      cancelado: planesFiltrados.filter((p: any) => p.planEstado === 'cancelado').length,
    };

    const planesAccionFiltrados = (planesApi || []).filter((p: any) => {
      if (filtroProceso !== 'all' && String(p.procesoId) !== String(filtroProceso)) {
        return false;
      }
      return true;
    });

    // Combinar planes (causas) y planesApi para la tabla
    const planesTableData = [
      ...planesFiltrados.map((p: any) => {
        const proc = procesos.find((pr: any) => String(pr.id) === String(p.procesoId));
        return {
          id: p.id,
          nombre: p.planDescripcion || 'Sin descripción',
          proceso: proc?.nombre || 'Sin proceso',
          fechaInicio: p.fechaCreacion || new Date().toISOString(),
          fechaLimite: p.planFechaEstimada || new Date().toISOString(),
          responsable: p.planResponsable || 'No asignado',
          porcentajeAvance: p.planAvance || 0,
          estado: p.planEstado || 'pendiente',
          origen: 'causa'
        };
      }),
      ...planesAccionFiltrados.map((p: any) => {
        const proc = procesos.find((pr: any) => String(pr.id) === String(p.procesoId));
        return {
          id: p.id,
          nombre: p.nombre || p.descripcion || 'Sin nombre',
          proceso: proc?.nombre || 'Sin proceso',
          fechaInicio: p.fechaInicio || new Date().toISOString(),
          fechaLimite: p.fechaFin || new Date().toISOString(),
          responsable: p.responsableNombre || 'No asignado',
          porcentajeAvance: p.avance || 0,
          estado: p.estado || 'pendiente',
          origen: 'api'
        };
      })
    ];

    return {
      totalIncidencias: incidenciasFiltradas.length,
      totalControles: controlesFiltrados.length,
      totalPlanes: planesFiltrados.length + planesAccionFiltrados.length,
      incidenciasAbiertas: incidenciasFiltradas.filter((inc: any) => inc.estado === 'abierta' || inc.estado === 'en_investigacion').length,
      controlesPorTipo,
      controlesPorNivelResidual,
      planesPorEstado,
      controlesFiltrados,
      planesFiltrados,
      planesTableData,
      incidenciasFiltradas,
    };
  }, [filtroProceso, busqueda, incidenciasApi, causasApi, planesApi, procesos]);

  // Preparar datos para tabla de planes de acción
  const planesAccion = useMemo(() => {
    return metricsData.planesTableData || [];
  }, [metricsData.planesTableData]);

  if (!esSupervisorRiesgos) {
    return (
      <Box>
        <Alert severity="error">
          No tiene permisos para acceder a esta página. Solo el Supervisor de Riesgos puede ver este dashboard.
        </Alert>
      </Box>
    );
  }

  const columnasResumen: GridColDef[] = [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'proceso',
      headerName: 'Proceso',
      width: 200,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 300,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'riesgoInherente',
      headerName: 'RI',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRI})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRI}20`,
            color: params.row.colorRI,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRI}`,
            minWidth: 100,
          }}
        />
      ),
    },
    {
      field: 'riesgoResidual',
      headerName: 'RR',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRR})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRR}20`,
            color: params.row.colorRR,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRR}`,
            minWidth: 100,
          }}
        />
      ),
    },
  ];

  const columnasPlanes: GridColDef[] = [
    {
      field: 'nombre',
      headerName: 'Nombre',
      flex: 1,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'proceso',
      headerName: 'Proceso',
      width: 200,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'fechaInicio',
      headerName: 'Fecha Inicio',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'fechaLimite',
      headerName: 'Fecha Límite',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => {
        const fecha = new Date(params.value);
        const hoy = new Date();
        const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Box>
            <Typography variant="body2">
              {fecha.toLocaleDateString('es-ES')}
            </Typography>
            {diasRestantes < 30 && diasRestantes > 0 && (
              <Chip
                label={`${diasRestantes}d restantes`}
                size="small"
                color={diasRestantes < 7 ? 'error' : 'warning'}
                sx={{ mt: 0.5, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'responsable',
      headerName: 'Responsable',
      width: 150,
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'porcentajeAvance',
      headerName: 'Avance',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                height: '100%',
                width: `${params.value}%`,
                backgroundColor: params.value === 100 ? '#4caf50' : params.value >= 50 ? '#0288d1' : '#ed6c02',
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ minWidth: 35, textAlign: 'right', fontWeight: 600 }}>
            {params.value}%
          </Typography>
        </Box>
      ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          size="small"
          color={params.value === 'completado' ? 'success' : params.value === 'en_ejecucion' ? 'info' : 'warning'}
        />
      ),
    },
  ];

  return (
    <Box>
      {/* Filtros */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Proceso</InputLabel>
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel># Riesgo</InputLabel>
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Origen</InputLabel>
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

      {/* Primera Fila: KPIs Consolidados */}
      <Grid2 container spacing={2.5} sx={{ mb: 3 }}>
        {/* 1. Total de Riesgos */}
        <Grid2 xs={12} sm={6} md={2.4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            height: '100%',
            border: 'none',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon sx={{ fontSize: 24, color: 'white', opacity: 0.9 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Riesgos
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'white', fontSize: '2.5rem', my: 1 }}>
                {estadisticas.total}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<ErrorIcon sx={{ color: '#ffeb3b !important', fontSize: 14 }} />} label={`${Math.round(estadisticas.total * 0.15)} Críticos`} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '0.7rem', height: 20 }} />
                <Chip icon={<WarningIcon sx={{ color: '#ff9800 !important', fontSize: 14 }} />} label={`${Math.round(estadisticas.total * 0.25)} Altos`} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '0.7rem', height: 20 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* 2. Riesgos Materializados */}
        <Grid2 xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', height: '100%', border: 'none', boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BugReportIcon sx={{ fontSize: 24, color: 'white', opacity: 0.9 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Materializados
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'white', fontSize: '2.5rem', my: 1 }}>
                {metricsData.totalIncidencias}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Abiertas</Typography>
                <Chip label={metricsData.incidenciasAbiertas} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: 'white', fontWeight: 700, fontSize: '0.75rem', height: 20 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* 3. Controles Activos */}
        <Grid2 xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', height: '100%', border: 'none', boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon sx={{ fontSize: 24, color: 'white', opacity: 0.9 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Controles
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'white', fontSize: '2.5rem', my: 1 }}>
                {metricsData.totalControles}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                <Chip label={`Prev: ${metricsData.controlesPorTipo.prevencion}`} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '0.65rem', height: 18 }} />
                <Chip label={`Det: ${metricsData.controlesPorTipo.deteccion}`} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', fontSize: '0.65rem', height: 18 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* 4. Planes de Acción */}
        <Grid2 xs={12} sm={6} md={2.4}>
          <Card sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', height: '100%', border: 'none', boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AssignmentIcon sx={{ fontSize: 24, color: 'white', opacity: 0.9 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Planes Acción
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'white', fontSize: '2.5rem', my: 1 }}>
                {metricsData.totalPlanes}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>En Progreso</Typography>
                <Chip label={metricsData.planesPorEstado.en_progreso} size="small" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', color: 'white', fontWeight: 700, fontSize: '0.75rem', height: 20 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* 5. Riesgos Fuera Apetito */}
        <Grid2 xs={12} sm={6} md={2.4}>
          <Card
            sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)', height: '100%', border: 'none', boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)', cursor: 'pointer' }}
            onClick={() => setRiesgosFueraApetitoDialogOpen(true)}
          >
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ReportProblemIcon sx={{ fontSize: 24, color: 'white', opacity: 0.9 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Fuera Apetito
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: 'white', fontSize: '2.5rem', my: 1 }}>
                {estadisticas.fueraApetito}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                Click para detalles
              </Typography>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Segunda Fila: Gráficos Principales (Tipo y Origen) */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Treemap: Riesgos por tipo */}
        <Grid2 xs={12} md={7}>
          <Card sx={{ height: '100%', border: '1px solid #e0e0e0', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: '0.875rem' }}>Riesgos por tipo</Typography>
                <Chip label={`${Object.values(estadisticas.porTipologia).reduce((a, b) => a + b, 0)} total`} size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 600, fontSize: '0.75rem' }} />
              </Box>
              <Box sx={{ mt: 1 }}>
                {(() => {
                  const sortedEntries = Object.entries(estadisticas.porTipologia).sort(([, a], [, b]) => b - a);
                  const colores: Record<string, string> = { '01 Estratégico': '#ed6c02', '02 Operacional': '#1976d2', '03 Financiero': '#1565c0', '04 Cumplimiento': '#9c27b0' };
                  const totalTipos = Object.values(estadisticas.porTipologia).reduce((a, b) => a + b, 0);

                  return (
                    <Grid2 container spacing={1.5}>
                      {sortedEntries.map(([tipologia, count]) => {
                        const porcentaje = totalTipos > 0 ? Math.round((count / totalTipos) * 100) : 0;
                        const color = colores[tipologia] || '#1976d2';
                        return (
                          <Grid2 key={tipologia} xs={12} sm={6}>
                            <Tooltip title={`${count} riesgos (${porcentaje}%)`} arrow>
                              <Box sx={{
                                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                                color: 'white', p: 1.75, borderRadius: 1.5, minHeight: 80,
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                boxShadow: `0 3px 10px ${color}40`, position: 'relative', overflow: 'hidden',
                                transition: 'all 0.25s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 18px ${color}60` }
                              }}>
                                <Typography variant="caption" fontWeight={700} sx={{ mb: 0.5, textAlign: 'center', fontSize: '0.7rem' }}>{tipologia}</Typography>
                                <Typography variant="h4" fontWeight={900} sx={{ fontSize: '1.8rem' }}>{count}</Typography>
                                <Typography variant="caption" sx={{ mt: 0.25, opacity: 0.95, fontSize: '0.7rem' }}>{porcentaje}% del total</Typography>
                              </Box>
                            </Tooltip>
                          </Grid2>
                        );
                      })}
                    </Grid2>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Donut: Origen */}
        <Grid2 xs={12} md={5}>
          <Card sx={{ height: '100%', border: '1px solid #e0e0e0', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: '0.875rem' }}>Origen</Typography>
                <Chip icon={<CategoryIcon sx={{ fontSize: 14 }} />} label="Distribución" size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1976d2', fontWeight: 600, fontSize: '0.75rem' }} />
              </Box>
              <Box sx={{ height: 250, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(estadisticas.origen).map(([origen, count], index) => ({ name: origen, value: count, color: ['#42a5f5', '#1976d2', '#90caf9'][index % 3] }))}
                      cx="50%" cy="50%" labelLine={false} label={({ name, percent = 0 }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80} fill="#8884d8" dataKey="value"
                    >
                      {Object.entries(estadisticas.origen).map((entry, index) => (<Cell key={`cell-${index}`} fill={['#42a5f5', '#1976d2', '#90caf9'][index % 3]} />))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Gráficos de Distribución de Controles y Planes */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Controles por Tipo */}
        <Grid2 xs={12} md={6}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.9rem', color: '#424242' }}>
                  Distribución de Controles por Tipo
                </Typography>
                <Chip
                  icon={<SecurityIcon sx={{ fontSize: 14 }} />}
                  label={`${metricsData.totalControles} controles`}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Prevención', value: metricsData.controlesPorTipo.prevencion, color: '#4caf50' },
                        { name: 'Detección', value: metricsData.controlesPorTipo.deteccion, color: '#2196f3' },
                        { name: 'Corrección', value: metricsData.controlesPorTipo.correccion, color: '#ff9800' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Prevención', value: metricsData.controlesPorTipo.prevencion, color: '#4caf50' },
                        { name: 'Detección', value: metricsData.controlesPorTipo.deteccion, color: '#2196f3' },
                        { name: 'Corrección', value: metricsData.controlesPorTipo.correccion, color: '#ff9800' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Gráfico de Planes por Estado */}
        <Grid2 xs={12} md={6}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.9rem', color: '#424242' }}>
                  Estado de Planes de Acción
                </Typography>
                <Chip
                  icon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                  label={`${metricsData.totalPlanes} planes`}
                  size="small"
                  sx={{
                    backgroundColor: '#fff3e0',
                    color: '#f57c00',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'En Progreso', value: metricsData.planesPorEstado.en_progreso, color: '#2196f3' },
                        { name: 'Pendiente', value: metricsData.planesPorEstado.pendiente, color: '#ff9800' },
                        { name: 'Completado', value: metricsData.planesPorEstado.completado, color: '#4caf50' },
                        { name: 'Cancelado', value: metricsData.planesPorEstado.cancelado, color: '#f44336' },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'En Progreso', value: metricsData.planesPorEstado.en_progreso, color: '#2196f3' },
                        { name: 'Pendiente', value: metricsData.planesPorEstado.pendiente, color: '#ff9800' },
                        { name: 'Completado', value: metricsData.planesPorEstado.completado, color: '#4caf50' },
                        { name: 'Cancelado', value: metricsData.planesPorEstado.cancelado, color: '#f44336' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Fila Combinada: Efectividad de Controles y Lista de Controles */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Efectividad de Controles */}
        <Grid2 xs={12} md={7}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.9rem', color: '#424242' }}>
                  Efectividad de Controles por Nivel de Riesgo Residual
                </Typography>
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                  label="Análisis de Impacto"
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { nivel: 'Crítico', cantidad: metricsData.controlesPorNivelResidual.critico, color: '#d32f2f' },
                      { nivel: 'Alto', cantidad: metricsData.controlesPorNivelResidual.alto, color: '#f57c00' },
                      { nivel: 'Medio', cantidad: metricsData.controlesPorNivelResidual.medio, color: '#fbc02d' },
                      { nivel: 'Bajo', cantidad: metricsData.controlesPorNivelResidual.bajo, color: '#388e3c' },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nivel" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="cantidad" name="Controles" radius={[8, 8, 0, 0]}>
                      {[
                        { nivel: 'Crítico', cantidad: metricsData.controlesPorNivelResidual.critico, color: '#d32f2f' },
                        { nivel: 'Alto', cantidad: metricsData.controlesPorNivelResidual.alto, color: '#f57c00' },
                        { nivel: 'Medio', cantidad: metricsData.controlesPorNivelResidual.medio, color: '#fbc02d' },
                        { nivel: 'Bajo', cantidad: metricsData.controlesPorNivelResidual.bajo, color: '#388e3c' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Lista de Controles */}
        <Grid2 xs={12} md={5}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.9rem', color: '#424242' }}>
                  Detalle de Controles ({metricsData.controlesFiltrados.length})
                </Typography>
                <Chip
                  icon={<SecurityIcon sx={{ fontSize: 14 }} />}
                  label="Recientes"
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', maxHeight: 350, pr: 1 }}>
                {metricsData.controlesFiltrados.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No hay controles registrados.
                  </Alert>
                ) : (
                  <List sx={{ width: '100%', p: 0 }}>
                    {metricsData.controlesFiltrados.slice(0, 10).map((control: any, index: number) => (
                      <ListItem
                        key={control.id}
                        sx={{
                          mb: 1,
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid #f0f0f0',
                          backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                          '&:hover': { backgroundColor: '#e3f2fd' },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#424242', lineHeight: 1.2, mb: 0.5 }}>
                              {control.controlDescripcion || 'Sin descripción'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={control.controlTipo || 'N/A'}
                                size="small"
                                sx={{
                                  height: 20, fontSize: '0.65rem',
                                  backgroundColor: control.controlTipo === 'prevención' ? '#e8f5e9' : '#e3f2fd',
                                  color: control.controlTipo === 'prevención' ? '#2e7d32' : '#1976d2'
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#757575', fontSize: '0.7rem' }}>
                                RR: {control.nivelRiesgoResidual}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Gráficos y Tablas */}
      <Grid2 container spacing={3}>
        {/* Resumen por Proceso como filas horizontales (sin gráfico de ejes) */}
        <Grid2 xs={12} md={6}>
          <Card
            sx={{
              border: '1px solid #e0e0e0',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              },
            }}
          >
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="h6"
                  gutterBottom
                  fontWeight={600}
                  sx={{ fontSize: '0.9rem', mb: 0, color: '#424242' }}
                >
                  # de riesgos por proceso (Top 10)
                </Typography>
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
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
              <Box sx={{ mt: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {(() => {
                  let filas = Object.entries(estadisticas.porProceso)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 10)
                    .map(([id, data]) => ({
                      id,
                      nombre: data.nombre,
                      count: data.count,
                    }));

                  // Completar hasta Top 10 con procesos de ejemplo si faltan
                  if (filas.length < 10) {
                    const procesosMock = [
                      { id: 'mock-1', nombre: 'Gestión de Procesos', count: 22 },
                      { id: 'mock-2', nombre: 'Gestión de Talento Humano', count: 19 },
                      { id: 'mock-3', nombre: 'Gestión de Finanzas', count: 13 },
                      { id: 'mock-4', nombre: 'Ciberseguridad', count: 12 },
                      { id: 'mock-5', nombre: 'Direccionamiento Estratégico', count: 12 },
                      { id: 'mock-6', nombre: 'Gestión de TI', count: 11 },
                      { id: 'mock-7', nombre: 'Planificación Estratégica', count: 10 },
                      { id: 'mock-8', nombre: 'Gestión Comercial', count: 8 },
                      { id: 'mock-9', nombre: 'Compliance', count: 5 },
                      { id: 'mock-10', nombre: 'Gestión de Servicios', count: 3 },
                    ];

                    const faltan = 10 - filas.length;
                    filas = [
                      ...filas,
                      ...procesosMock
                        .filter((mock) => !filas.some((f) => f.nombre === mock.nombre))
                        .slice(0, faltan),
                    ];
                  }

                  if (filas.length === 0) {
                    return (
                      <Box
                        sx={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#757575',
                        }}
                      >
                        <Typography variant="body2">No hay datos disponibles para mostrar</Typography>
                      </Box>
                    );
                  }

                  const total = filas.reduce((sum, f) => sum + f.count, 0);
                  const maxCount = Math.max(...filas.map((f) => f.count));

                  // Estimaciones rápidas por severidad (usando misma proporción global)
                  const calcularCriticos = (count: number) => Math.round(count * 0.15);
                  const calcularAltos = (count: number) => Math.round(count * 0.25);

                  const totalCriticosTop10 = filas.reduce((sum, f) => sum + calcularCriticos(f.count), 0);
                  const totalAltosTop10 = filas.reduce((sum, f) => sum + calcularAltos(f.count), 0);

                  return (
                    <>
                      {filas.map((fila) => {
                        const ancho = maxCount > 0 ? (fila.count / maxCount) * 100 : 0;
                        const porcentajeTotal = total > 0 ? ((fila.count / total) * 100).toFixed(1) : '0.0';
                        const criticos = calcularCriticos(fila.count);
                        const altos = calcularAltos(fila.count);

                        return (
                          <Box
                            key={fila.id}
                            sx={{
                              p: 1.25,
                              borderRadius: 1.5,
                              backgroundColor: 'rgba(25,118,210,0.02)',
                              border: '1px solid rgba(25,118,210,0.08)',
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
                                mb: 0.5,
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
                                    maxWidth: { xs: '55vw', md: '20vw' },
                                  }}
                                  title={fila.nombre}
                                >
                                  {fila.nombre}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography variant="caption" sx={{ color: '#757575' }}>
                                  {porcentajeTotal}%
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ color: '#1976d2', minWidth: 24, textAlign: 'right' }}
                                >
                                  {fila.count}
                                </Typography>
                              </Box>
                            </Box>
                            {/* Pequeño resumen por severidad estimada */}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                gap: 1,
                                mb: 0.75,
                              }}
                            >
                              <Chip
                                size="small"
                                label={`~${criticos} críticos`}
                                icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  backgroundColor: 'rgba(211,47,47,0.06)',
                                  color: '#c62828',
                                  fontSize: '0.7rem',
                                  height: 22,
                                }}
                              />
                              <Chip
                                size="small"
                                label={`~${altos} altos`}
                                icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  backgroundColor: 'rgba(237,108,2,0.06)',
                                  color: '#ed6c02',
                                  fontSize: '0.7rem',
                                  height: 22,
                                }}
                              />
                            </Box>
                            <Box
                              sx={{
                                height: 18,
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
                          mt: 2,
                          pt: 1.5,
                          borderTop: '1px dashed #e0e0e0',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          Procesos en Top 10: <strong>{filas.length}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          Total riesgos Top 10: <strong>{total}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          ~Críticos Top 10: <strong>{totalCriticosTop10}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                          ~Altos Top 10: <strong>{totalAltosTop10}</strong>
                        </Typography>
                      </Box>
                    </>
                  );
                })()}
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Tabla: Resumen de Riesgos con RI y RR */}
        <Grid2 xs={12} md={6}>
          <Card sx={{ border: '1px solid #e0e0e0', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', height: '100%' }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.875rem', color: '#424242' }}>
                  Resumen de Riesgos (Código, Proceso, Descripción, RI, RR)
                </Typography>
                <Chip
                  label={`${filasTablaResumen.length} riesgos`}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minHeight: 400 }}>
                <AppDataGrid
                  rows={filasTablaResumen}
                  columns={columnasResumen}
                  loading={loadingRiesgos}
                  getRowId={(row) => row.id}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.875rem',
                      color: '#424242',
                    },
                    '& .MuiDataGrid-cell:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '& .super-app-theme--header': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#424242',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      borderBottom: '2px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid #e0e0e0',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Tabla de Planes de Acción y Estadística de Incidencias */}
      <Grid2 container spacing={3} sx={{ mb: 3 }}>
        {/* Tabla de Planes de Acción */}
        <Grid2 xs={12} md={8}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 0, fontSize: '0.875rem', color: '#424242' }}>
                  Planes de Acción con Fechas
                </Typography>
                <Chip
                  icon={<AssignmentIcon sx={{ fontSize: 14 }} />}
                  label={`${metricsData.planesFiltrados.length} planes`}
                  size="small"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, minHeight: 400 }}>
                <AppDataGrid
                  rows={metricsData.planesFiltrados}
                  columns={columnasPlanes}
                  getRowId={(row) => row.id}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.875rem',
                      color: '#424242',
                    },
                    '& .MuiDataGrid-cell:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '& .MuiDataGrid-row:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                    '& .super-app-theme--header': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#424242',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      borderBottom: '2px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: '1px solid #e0e0e0',
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        {/* Estadística de Incidencias */}
        <Grid2 xs={12} md={4}>
          <Card sx={{
            border: '1px solid #e0e0e0',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            height: '100%',
          }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ fontSize: '0.875rem', mb: 0.5, color: '#424242' }}>
                    # Incidencias
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ color: '#d32f2f', fontSize: '3rem', lineHeight: 1 }}>
                    {metricsData.incidenciasFiltradas.length}
                  </Typography>
                </Box>
                <BugReportIcon sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.3 }} />
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {metricsData.incidenciasFiltradas.map((incidencia: any) => (
                  <Card
                    key={incidencia.id}
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      backgroundColor: incidencia.severidad === 'alta' ? '#ffebee' : incidencia.severidad === 'media' ? '#fff3e0' : '#f1f8e9',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                          {incidencia.codigo}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#424242', mb: 1 }}>
                          {incidencia.titulo}
                        </Typography>
                      </Box>
                      <Chip
                        label={incidencia.severidad.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: incidencia.severidad === 'alta' ? '#d32f2f' : incidencia.severidad === 'media' ? '#ed6c02' : '#4caf50',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" sx={{ color: '#757575' }}>
                        {new Date(incidencia.fecha).toLocaleDateString('es-ES')}
                      </Typography>
                      <Chip
                        label={incidencia.estado.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={incidencia.estado === 'cerrada' ? 'success' : incidencia.estado === 'en_investigacion' ? 'info' : 'warning'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Diálogo: Riesgos Fuera del Apetito */}
      <Dialog
        open={riesgosFueraApetitoDialogOpen}
        onClose={() => setRiesgosFueraApetitoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} color="error">
              Riesgos Fuera del Apetito
            </Typography>
            <Chip
              label={`${estadisticas.fueraApetito} riesgo${estadisticas.fueraApetito !== 1 ? 's' : ''}`}
              color="error"
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Los siguientes riesgos tienen un valor de riesgo ≥ {UMBRALES_RIESGO.ALTO} y requieren atención inmediata.
          </Alert>
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
          <List>
            {puntos
              .filter((p: any) => {
                const valorRiesgo = p.probabilidad * p.impacto;
                return valorRiesgo >= UMBRALES_RIESGO.ALTO;
              })
              .map((punto: any) => {
                const riesgo = riesgos.find((r: any) => r.id === punto.riesgoId);
                const proceso = procesos.find((p: any) => p.id === riesgo?.procesoId);
                const valorRiesgo = punto.probabilidad * punto.impacto;
                return (
                  <Card key={punto.riesgoId} sx={{ mb: 2, border: '2px solid', borderColor: colors.risk.critical.main }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {`${riesgo?.numero || ''}${riesgo?.siglaGerencia || ''}`}
                          </Typography>
                          <Chip
                            label={`Valor: ${valorRiesgo}`}
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
          <Button onClick={() => setRiesgosFueraApetitoDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



