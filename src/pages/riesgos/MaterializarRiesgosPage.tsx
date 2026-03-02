/**
 * Materializar Riesgos Page
 * Gestión de eventos/materialización de riesgos
 */

import { useState, useMemo, useEffect, useRef, useCallback, startTransition } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Autocomplete,
  Tooltip,
  Slider,
  Divider,
  Tabs,
  Tab,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Link as LinkIcon,
  ExpandMore,
  ExpandLess,
  Assignment,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { useRiesgo } from '../../contexts/RiesgoContext';
// OPTIMIZADO: Removido useRiesgos no usado para reducir imports
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetImpactosQuery, useGetRiesgosQuery, useGetIncidenciasQuery, useCreateIncidenciaMutation, useDeleteIncidenciaMutation } from '../../api/services/riesgosApi';
import { LABELS_IMPACTO } from '../../utils/constants';
import { useConfirm } from '../../contexts/ConfirmContext';
import Grid2 from '../../utils/Grid2';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';

// Opciones de impacto desde constants (no quemadas)
const OPCIONES_IMPACTO = Object.entries(LABELS_IMPACTO).map(([valor, label]) => ({
  valor: Number(valor),
  label: `${valor} - ${label}`
}));

const ESTADOS_INCIDENCIA = ['abierta', 'en_investigacion', 'resuelta', 'cerrada'] as const;
type EstadoIncidencia = typeof ESTADOS_INCIDENCIA[number];


// Tipo de incidencia - Materialización de riesgos residuales
interface ImpactoMaterializacion {
  economico: number;
  reputacional: number;
  legal: number;
  operacional: number;
  personas: number;
  ambiental: number;
  disponibilidadSGSI: number;
  integridadSGSI: number;
  confidencialidadSGSI: number;
  tecnologico: number;
  cumplimiento: number;
}

interface Incidencia {
  id: string;
  codigo: string;
  riesgoId?: string;
  riesgoNombre?: string;
  causaId?: string;
  causaNombre?: string;
  procesoId?: string;
  procesoNombre?: string;
  titulo: string;
  descripcion: string;
  estado: EstadoIncidencia;
  fechaOcurrencia: string;
  fechaReporte: string;
  fechaResolucion?: string;
  reportadoPor: string;
  responsableId?: string;
  responsableNombre?: string;
  planAccionId?: string; // Auto-generado al registrar incidencia
  accionesCorrectivas?: string; // Descripción de las acciones
  planNombre?: string;
  planObjetivo?: string;
  planFechaInicio?: string;
  planFechaLimite?: string;
  planAvance?: number;
  planEstado?: 'borrador' | 'en_ejecucion' | 'completado' | 'atrasado';

  impactosMaterializacion?: ImpactoMaterializacion; // Impactos reales de la materialización
  createdAt: string;
  updatedAt: string;
}

export default function MaterializarRiesgosPage() {
  const { esAdmin, esDueñoProcesos, esSupervisorRiesgos } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirm();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [incidenciasLocal, setIncidenciasLocal] = useState<Incidencia[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [formularioExpandido, setFormularioExpandido] = useState<{ riesgoId: string; causaId?: string } | null>(null);
  // OPTIMIZADO: Removido datosFormulario no usado
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);
  // Proceso usado para consultas en esta página (evita usar selecciones previas)
  const [procesoFiltroId, setProcesoFiltroId] = useState<string | null>(null);
  // Deferir la carga de datos hasta después del primer render para que la navegación sea instantánea
  const [deferLoad, setDeferLoad] = useState(false);
  // Mostrar pocos riesgos al inicio para no colgar la página; el usuario puede cargar más
  const [visibleRiesgosCount, setVisibleRiesgosCount] = useState(15);

  useEffect(() => {
    setDeferLoad(true);
  }, []);

  // Dueño de Proceso: si no tiene proceso seleccionado en el header, mostrar solo mensaje
  if (esDueñoProcesos && !procesoSeleccionado?.id) {
    return (
      <AppPageLayout
        title="Materialización de Riesgos"
        description="Gestión y registro de eventos donde los riesgos se han materializado."
        topContent={null}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info">Por favor selecciona un proceso en el encabezado para ver sus eventos.</Alert>
        </Box>
      </AppPageLayout>
    );
  }

  // Determinar proceso a usar para las consultas
  // - Dueño de Proceso: siempre usa el proceso del header (no ve filtro)
  // - Supervisor/Admin: usan solo el proceso seleccionado en el filtro local
  const procesoIdConsulta =
    esDueñoProcesos && procesoSeleccionado?.id
      ? String(procesoSeleccionado.id)
      : (esAdmin || esSupervisorRiesgos)
        ? procesoFiltroId
        : null;

  useEffect(() => {
    setVisibleRiesgosCount(15);
  }, [procesoIdConsulta]);

  // OPTIMIZADO: Agregar caché para incidencias
  const { data: incidenciasApi = [], isLoading: isLoadingIncidencias } = useGetIncidenciasQuery(
    {
      procesoId: procesoIdConsulta || undefined,
    },
    {
      // No hacer petición hasta que:
      // 1) Hay procesoIdConsulta, y
      // 2) Hay pasado al menos un render (deferLoad)
      skip: !deferLoad || !procesoIdConsulta,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      keepUnusedDataFor: 300 // 5 minutos de caché
    }
  );
  const [createIncidencia] = useCreateIncidenciaMutation();
  const [deleteIncidencia] = useDeleteIncidenciaMutation();

  // OPTIMIZADO: Evitar loops infinitos usando useRef para comparar
  const prevIncidenciasRef = useRef<Incidencia[]>([]);
  
  useEffect(() => {
    if (!incidenciasApi) return;
    const apiData = (incidenciasApi as any[]).map((inc: any) => ({
      ...inc,
      causaId: inc.causaRiesgoId ?? inc.causaId,
      causaNombre: inc.causaRiesgo?.descripcion ?? inc.causaNombre,
    })) as Incidencia[];
    const prevData = prevIncidenciasRef.current;
    const apiIds = apiData.map(inc => inc.id).sort().join(',');
    const prevIds = prevData.map(inc => inc.id).sort().join(',');
    if (apiIds === prevIds) return;
    const rafId = requestAnimationFrame(() => {
      setIncidenciasLocal(apiData);
      prevIncidenciasRef.current = apiData;
    });
    return () => cancelAnimationFrame(rafId);
  }, [incidenciasApi]);
  
  // OPTIMIZADO: Caché agresivo para impactos (cambian muy poco)
  const { data: impactosApi = [] } = useGetImpactosQuery(undefined, {
    keepUnusedDataFor: 1800, // 30 minutos
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });
  const descripcionesImpacto = useMemo(() => {
    const base: Record<string, Record<number, string>> = {
      economico: {},
      procesos: {},
      legal: {},
      confidencialidadSGSI: {},
      reputacional: {},
      disponibilidadSGSI: {},
      integridadSGSI: {},
      ambiental: {},
      personas: {},
    };

    impactosApi.forEach((tipo: any) => {
      const key = tipo.clave === 'reputacion' ? 'reputacional' : tipo.clave;
      if (!base[key]) return;
      base[key] = (tipo.niveles || []).reduce((acc: Record<number, string>, nivel: any) => {
        acc[nivel.nivel] = nivel.descripcion;
        return acc;
      }, {});
    });

    return base;
  }, [impactosApi]);
  
  // OPTIMIZADO: Agregar caché y optimizaciones
  const { data: riesgosResponse, isLoading: isLoadingRiesgos, refetch: refetchRiesgos } = useGetRiesgosQuery(
    {
      procesoId: procesoIdConsulta || undefined,
      includeCausas: true,
      pageSize: 20 // Limitar a 20 riesgos por proceso para evitar bloqueos
    },
    {
      // Igual que incidencias: solo cargar cuando ya estemos dentro de la página
      skip: !deferLoad || !procesoIdConsulta,
      refetchOnMountOrArgChange: false, // No refetch si ya está en caché
      refetchOnFocus: false,
      refetchOnReconnect: false,
      keepUnusedDataFor: 600 // 10 minutos de caché
    }
  );
  const riesgosData = riesgosResponse?.data || [];
  
  // OPTIMIZADO: Eliminado auto-refetch que causaba loops infinitos y bloqueos
  // El refetch se hará solo cuando sea necesario (al guardar/eliminar)

  // Obtener riesgos del proceso seleccionado
  const { riesgoSeleccionado } = useRiesgo();

  const riesgosDelProceso = useMemo(() => {
    if (!procesoIdConsulta) return [];
    // Limitar cantidad de riesgos mostrados para que la UI se mantenga fluida
    return (riesgosData || []).slice(0, 20);
  }, [riesgosData, procesoIdConsulta]);

  // Estado de carga combinado (solo cuando hay proceso seleccionado)
  const isLoadingData =
    !!procesoIdConsulta && (isLoadingIncidencias || isLoadingRiesgos);

  // OPTIMIZADO: Usar startTransition y evitar ejecuciones innecesarias
  const prevRiesgoSeleccionadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!riesgoSeleccionado || String(riesgoSeleccionado.procesoId) !== String(procesoSeleccionado?.id)) {
      prevRiesgoSeleccionadoRef.current = null;
      return;
    }
    
    const riesgoId = String(riesgoSeleccionado.id);
    // Solo ejecutar si cambió el riesgo seleccionado
    if (prevRiesgoSeleccionadoRef.current === riesgoId) return;
    prevRiesgoSeleccionadoRef.current = riesgoId;
    
    startTransition(() => {
      setRiesgoExpandido(riesgoId);
      // Preseleccionar en el formulario inline
      setFormData((prev) => ({ ...prev, riesgoId: riesgoId, titulo: prev.titulo || `Incidencia - ${riesgoSeleccionado.numeroIdentificacion || riesgoSeleccionado.numero || ''}` }));
    });
  }, [riesgoSeleccionado, procesoSeleccionado?.id]);

  // OPTIMIZADO: Filtrar incidencias por proceso y crear Maps para búsquedas O(1)
  const incidenciasFiltradas = useMemo(() => {
    if (!procesoIdConsulta) return [];
    return incidenciasLocal.filter((inc) => String(inc.procesoId) === String(procesoIdConsulta));
  }, [incidenciasLocal, procesoIdConsulta]);

  // OPTIMIZADO: Crear Map de incidencias por riesgoId para búsquedas O(1)
  const incidenciasPorRiesgo = useMemo(() => {
    const map = new Map<string, Incidencia[]>();
    incidenciasFiltradas.forEach(inc => {
      if (inc.riesgoId) {
        const riesgoId = String(inc.riesgoId);
        if (!map.has(riesgoId)) {
          map.set(riesgoId, []);
        }
        map.get(riesgoId)!.push(inc);
      }
    });
    return map;
  }, [incidenciasFiltradas]);

  // OPTIMIZADO: Crear Map de incidencias por riesgoId+causaId para búsquedas O(1)
  const incidenciasPorRiesgoYCausa = useMemo(() => {
    const map = new Map<string, Incidencia>();
    incidenciasFiltradas.forEach(inc => {
      if (inc.riesgoId && inc.causaId) {
        const key = `${inc.riesgoId}-${inc.causaId}`;
        map.set(key, inc);
      }
    });
    return map;
  }, [incidenciasFiltradas]);

  // Formulario inline
  const [formData, setFormData] = useState<Partial<Incidencia>>({
    titulo: '',
    descripcion: '',
    estado: 'abierta',
    fechaOcurrencia: new Date().toISOString().split('T')[0],
    fechaReporte: new Date().toISOString().split('T')[0],
    impactosMaterializacion: {
      economico: 1,
      reputacional: 1,
      legal: 1,
      operacional: 1,
      personas: 1,
      ambiental: 1,
      disponibilidadSGSI: 1,
      integridadSGSI: 1,
      confidencialidadSGSI: 1,
      tecnologico: 1,
      cumplimiento: 1,
    },
  });

  // OPTIMIZADO: useCallback para evitar re-crear función en cada render
  const handleGuardar = useCallback(async () => {
    if (!formData.titulo || !formData.descripcion) {
      showError('Por favor complete todos los campos requeridos');
      return;
    }

    if (!procesoSeleccionado?.id) {
      showError('Debe seleccionar un proceso');
      return;
    }

    if (!formData.riesgoId) {
      showError('Debe seleccionar el riesgo que se materializó');
      return;
    }

    // Validar que al menos un impacto esté completado
    const impactos = formData.impactosMaterializacion || {
      economico: 1, reputacional: 1, legal: 1, operacional: 1, personas: 1, ambiental: 1, tecnologico: 1, cumplimiento: 1
    };


    // OPTIMIZADO: Usar búsqueda directa en array (ya está filtrado por proceso)
    const riesgoSeleccionado = riesgosDelProceso.find((r: any) => String(r.id) === String(formData.riesgoId));

    try {
      await createIncidencia({
        codigo: `INC-${Date.now()}`,
        riesgoId: formData.riesgoId,
        causaRiesgoId: formData.causaId || undefined,
        procesoId: procesoSeleccionado.id,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        estado: formData.estado,
        fechaOcurrencia: formData.fechaOcurrencia,
        fechaReporte: formData.fechaReporte || new Date().toISOString().split('T')[0],
        reportadoPor: 'Usuario Actual',
        impactosMaterializacion: impactos,
      }).unwrap();
      showSuccess('Incidencia creada exitosamente');
    } catch (e: any) {
      showError(e?.data?.error || e?.message || 'Error al crear la incidencia');
    }
  }, [formData, procesoSeleccionado, riesgosDelProceso, createIncidencia, showError, showSuccess]);

  // OPTIMIZADO: useCallback para evitar re-crear función en cada render
  const handleEliminar = useCallback(async (id: string) => {
    if (!(await confirmDelete('esta incidencia'))) return;
    try {
      await deleteIncidencia(id).unwrap();
      showSuccess('Incidencia eliminada exitosamente');
    } catch (error) {
      showError((error as any)?.data?.error || 'Error al eliminar la incidencia');
    }
  }, [deleteIncidencia, showSuccess, showError, confirmDelete]);

  // OPTIMIZADO: useMemo para función que no cambia
  const obtenerColorEstado = useCallback((estado: string) => {
    switch (estado) {
      case 'abierta':
        return 'error';
      case 'en_investigacion':
        return 'warning';
      case 'resuelta':
        return 'success';
      case 'cerrada':
        return 'default';
      default:
        return 'default';
    }
  }, []);
  
  // OPTIMIZADO: Handler memoizado para expandir/colapsar riesgo
  const handleToggleRiesgo = useCallback((riesgoId: string) => {
    startTransition(() => {
      setRiesgoExpandido(prev => prev === riesgoId ? null : riesgoId);
    });
  }, []);
  
  // OPTIMIZADO: Handler memoizado para expandir formulario
  const handleToggleFormulario = useCallback((riesgoId: string, causaId: string, causaDescripcion: string, incidenteExistente?: Incidencia) => {
    startTransition(() => {
      const isExpanded = formularioExpandido?.causaId === causaId && formularioExpandido?.riesgoId === riesgoId;
      if (isExpanded) {
        setFormularioExpandido(null);
      } else {
        setFormularioExpandido({ riesgoId, causaId });
        if (incidenteExistente) {
          setFormData({ ...incidenteExistente });
        } else {
          const riesgo = riesgosDelProceso.find((r: any) => String(r.id) === String(riesgoId));
          setFormData({
            titulo: `Materialización: ${causaDescripcion.substring(0, 50)}...`,
            riesgoId: riesgoId,
            riesgoNombre: riesgo?.nombre,
            causaId: causaId,
            causaNombre: causaDescripcion,
            descripcion: '',
            estado: 'abierta',
            fechaOcurrencia: new Date().toISOString().split('T')[0],
            fechaReporte: new Date().toISOString().split('T')[0],
            accionesCorrectivas: '',
            planNombre: '',
            planObjetivo: '',
            planFechaInicio: new Date().toISOString().split('T')[0],
            planFechaLimite: '',
            planAvance: 0,
            planEstado: 'borrador',
            impactosMaterializacion: {
              economico: 1,
              reputacional: 1,
              legal: 1,
              operacional: 1,
              personas: 1,
              ambiental: 1,
              disponibilidadSGSI: 1,
              integridadSGSI: 1,
              confidencialidadSGSI: 1,
              tecnologico: 1,
              cumplimiento: 1,
            },
          });
        }
      }
    });
  }, [formularioExpandido, riesgosDelProceso]);

  // OPTIMIZADO: Memoizar columns para evitar recreación en cada render
  // OPTIMIZADO: Memoizar columns para evitar recreación en cada render
  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 110,
    },
    {
      field: 'titulo',
      headerName: 'Título',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'riesgoNombre',
      headerName: 'Riesgo Residual',
      width: 180,
      renderCell: (params) =>
        params.value ? (
          <Chip label={params.value} size="small" variant="outlined" />
        ) : (
          <Typography variant="caption" color="textSecondary">
            -
          </Typography>
        ),
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          size="small"
          color={obtenerColorEstado(params.value) as any}
        />
      ),
    },
    {
      field: 'fechaOcurrencia',
      headerName: 'Fecha Ocurrencia',
      width: 140,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
  ], [obtenerColorEstado]);

  return (
    <AppPageLayout
      title="Materialización de Riesgos"
      description="Gestión y registro de eventos donde los riesgos se han materializado."
      topContent={
        // Solo mostrar filtro de proceso para Supervisor/Admin.
        // Dueño de Proceso usa exclusivamente el proceso del header.
        (esAdmin || esSupervisorRiesgos) ? (
          <FiltroProcesoSupervisor
            soloSupervisores={false}
            onProcesoSeleccionado={(proceso) => setProcesoFiltroId(String(proceso.id))}
          />
        ) : null
      }
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Está en modo visualización. Solo puede ver la información. Para editar, seleccione el proceso en modo "Editar" desde el Dashboard.
          </Alert>
        )
      }
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => startTransition(() => setTabValue(v))}>
          <Tab
            icon={<WarningIcon />}
            iconPosition="start"
            label="RIESGOS"
            sx={{ fontWeight: 600 }}
          />
          <Tab
            icon={<Assignment />}
            iconPosition="start"
            label="PLANES DE ACCIÓN"
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Box>

      {/* TAB 0: REGISTRO / MATERIALIZACIÓN DE RIESGOS */}
      {/* OPTIMIZADO: Solo renderizar cuando el tab está activo */}
      {tabValue === 0 && (
        <Box>
          {isLoadingData ? (
            <PageLoadingSkeleton variant="table" tableRows={6} />
          ) : riesgosDelProceso.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>No hay riesgos asociados a este proceso.</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Column Headers */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '48px 100px 1.5fr 150px 150px 100px 48px',
                gap: 2,
                px: 3,
                py: 1.5,
                mb: 1,
                bgcolor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                alignItems: 'center'
              }}>
                <Box />
                <Typography variant="caption" fontWeight={700} color="text.secondary">ID RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">DESCRIPCIÓN DEL RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPO RIESGO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">SUBTIPO</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                <Box />
              </Box>
              {/* OPTIMIZADO: Renderizar solo N riesgos visibles para no colgar; "Ver más" carga el resto */}
              {riesgosDelProceso.slice(0, visibleRiesgosCount).map((riesgo: any) => (
                <Card key={riesgo.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '48px 100px 1.5fr 150px 150px 100px 48px',
                      gap: 2,
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: riesgoExpandido === riesgo.id ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                      alignItems: 'center'
                    }}
                    onClick={() => handleToggleRiesgo(riesgo.id)}
                  >
                    <IconButton size="small" color="primary">
                      {riesgoExpandido === riesgo.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>

                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      {riesgo.numeroIdentificacion || riesgo.numero || 'Sin ID'}
                    </Typography>

                    <Typography variant="body2" sx={{
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.2
                    }}>
                      {riesgo.descripcion || riesgo.descripcionRiesgo || 'Sin descripción'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {riesgo.tipologiaNivelI || riesgo.tipoRiesgo || '02 Operacional'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {riesgo.tipologiaNivelII || riesgo.subtipoRiesgo || 'Sin subtipo'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Chip
                        label={`${incidenciasPorRiesgo.get(String(riesgo.id))?.length || 0} MATERIALIZADOS`}
                        size="small"
                        color={(incidenciasPorRiesgo.get(String(riesgo.id))?.length || 0) > 0 ? 'error' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Box />
                  </Box>
                  <Collapse in={riesgoExpandido === riesgo.id} mountOnEnter unmountOnExit>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle2" gutterBottom>Causas Asociadas:</Typography>
                      {/* OPTIMIZADO: Limitar causas a 3 por riesgo para mejor rendimiento */}
                      {(riesgo.causas || []).slice(0, 3).map((causa: any) => {
                        // OPTIMIZADO: Usar Map para búsqueda O(1) en lugar de O(n)
                        const key = `${riesgo.id}-${causa.id}`;
                        const incidenteExistente = incidenciasPorRiesgoYCausa.get(key);
                        const isExpanded = formularioExpandido?.causaId === causa.id && formularioExpandido?.riesgoId === riesgo.id;

                        return (
                          <Box key={causa.id} sx={{ mb: 1, border: '1px solid #eee', borderRadius: 1, bgcolor: 'white' }}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">{causa.descripcion}</Typography>
                                <Chip
                                  label={incidenteExistente ? 'Materializado' : 'No Materializado'}
                                  color={incidenteExistente ? 'error' : 'success'}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                              <Button size="small" variant="outlined" color="warning" startIcon={<WarningIcon />} onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFormulario(riesgo.id, causa.id, causa.descripcion, incidenteExistente);
                              }}>
                                {isExpanded ? 'Cerrar' : (incidenteExistente ? 'Ver / Editar' : 'Reportar')}
                              </Button>
                            </Box>
                            <Collapse in={isExpanded} mountOnEnter unmountOnExit>
                              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderTop: '1px solid #ffe0b2' }}>
                                <Typography variant="subtitle2" color="warning.main" gutterBottom>
                                  {incidenteExistente ? 'Editar Incidencia' : 'Registrar Materialización'}
                                </Typography>

                                <Grid2 container spacing={2}>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Fecha del Incidente" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.fechaOcurrencia || ''} onChange={e => setFormData({ ...formData, fechaOcurrencia: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Fecha del Reporte" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.fechaReporte || ''} onChange={e => setFormData({ ...formData, fechaReporte: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12}>
                                    <TextField label="Descripción del Evento" multiline rows={2} fullWidth value={formData.descripcion || ''} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Describa el incidente" />
                                  </Grid2>


                                  {/* HEADER AZUL - IMPACTO */}
                                  <Grid2 xs={12}>
                                    <Box
                                      sx={{
                                        backgroundColor: '#1976d2',
                                        color: '#fff',
                                        py: 2,
                                        px: 3,
                                        textAlign: 'center',
                                        borderRadius: 1,
                                        mb: 2
                                      }}
                                    >
                                      <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                                        IMPACTO
                                      </Typography>
                                    </Box>
                                  </Grid2>

                                  {/* Impacto económico */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Impacto económico
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.economico || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                economico: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.economico} - {descripcionesImpacto.economico?.[formData.impactosMaterializacion?.economico || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Disponibilidad SGSI */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Disponibilidad SGSI
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.disponibilidadSGSI || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                disponibilidadSGSI: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.disponibilidadSGSI || 1} - {descripcionesImpacto.disponibilidadSGSI?.[formData.impactosMaterializacion?.disponibilidadSGSI || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Procesos */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Procesos
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.operacional || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                operacional: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.operacional || 1} - {descripcionesImpacto.procesos?.[formData.impactosMaterializacion?.operacional || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Personas */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Personas
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.personas || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                personas: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.personas || 1} - {descripcionesImpacto.personas?.[formData.impactosMaterializacion?.personas || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Legal */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Legal
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.legal || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                legal: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.legal || 1} - {descripcionesImpacto.legal?.[formData.impactosMaterializacion?.legal || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Integridad SGSI */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Integridad SGSI
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.integridadSGSI || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                integridadSGSI: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.integridadSGSI || 1} - {descripcionesImpacto.integridadSGSI?.[formData.impactosMaterializacion?.integridadSGSI || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Confidencialidad SGSI */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Confidencialidad SGSI
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.confidencialidadSGSI || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                confidencialidadSGSI: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.confidencialidadSGSI || 1} - {descripcionesImpacto.confidencialidadSGSI?.[formData.impactosMaterializacion?.confidencialidadSGSI || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Reputacional */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Reputación
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.reputacional || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                reputacional: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.reputacional || 1} - {descripcionesImpacto.reputacional?.[formData.impactosMaterializacion?.reputacional || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  {/* Ambiental */}
                                  <Grid2 xs={12} md={6}>
                                    <Box sx={{ pb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                        <Typography variant="body1" fontWeight={600}>
                                          Ambiental
                                        </Typography>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                          <Select
                                            value={formData.impactosMaterializacion?.ambiental || 1}
                                            onChange={(e) => setFormData({
                                              ...formData,
                                              impactosMaterializacion: {
                                                ...formData.impactosMaterializacion,
                                                ambiental: Number(e.target.value),
                                              } as ImpactoMaterializacion
                                            })}
                                          >
                                            {OPCIONES_IMPACTO.map(opcion => (
                                              <MenuItem key={opcion.valor} value={opcion.valor}>{opcion.valor}</MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                                        {formData.impactosMaterializacion?.ambiental || 1} - {descripcionesImpacto.ambiental?.[formData.impactosMaterializacion?.ambiental || 1] || ''}
                                      </Typography>
                                    </Box>
                                    <Divider sx={{ my: 1 }} />
                                  </Grid2>

                                  <Grid2 xs={12}>
                                    <Divider><Chip label="Plan de Acción Correctivo" size="small" /></Divider>
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Nombre del Plan" fullWidth size="small" value={formData.planNombre || ''} onChange={e => setFormData({ ...formData, planNombre: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Objetivo" fullWidth size="small" value={formData.planObjetivo || ''} onChange={e => setFormData({ ...formData, planObjetivo: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12}>
                                    <TextField label="Descripción de Acciones" multiline rows={2} fullWidth size="small" value={formData.accionesCorrectivas || ''} onChange={e => setFormData({ ...formData, accionesCorrectivas: e.target.value })} placeholder="Acciones detalladas a tomar" />
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Fecha Inicio" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={formData.planFechaInicio || ''} onChange={e => setFormData({ ...formData, planFechaInicio: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Fecha Límite" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={formData.planFechaLimite || ''} onChange={e => setFormData({ ...formData, planFechaLimite: e.target.value })} />
                                  </Grid2>
                                  <Grid2 xs={12} sm={6}>
                                    <TextField label="Responsable del Plan" fullWidth size="small" value={formData.responsableNombre || ''} onChange={e => setFormData({ ...formData, responsableNombre: e.target.value })} />
                                  </Grid2>

                                  <Grid2 xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button onClick={() => setFormularioExpandido(null)}>Cancelar</Button>
                                    <Button variant="contained" color="warning" onClick={() => {
                                      if (!formData.descripcion) { showError('La descripción es obligatoria'); return; }
                                      handleGuardar();
                                      setFormularioExpandido(null);
                                    }}>Guardar Reporte</Button>
                                  </Grid2>
                                </Grid2>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                      {(!riesgo.causas || riesgo.causas.length === 0) && <Typography variant="caption" color="text.secondary">No hay causas registradas.</Typography>}
                    </Box>
                  </Collapse>
                </Card>
              ))}
              {riesgosDelProceso.length > visibleRiesgosCount && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => startTransition(() => setVisibleRiesgosCount((n) => Math.min(n + 15, riesgosDelProceso.length)))}
                  >
                    Ver más riesgos ({visibleRiesgosCount} de {riesgosDelProceso.length})
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: PLANES DE ACCIÓN DE RIESGOS MATERIALIZADOS */}
      {tabValue === 1 && (
        <Card variant="outlined">
          <CardContent>
            {procesoIdConsulta && isLoadingIncidencias ? (
              <PageLoadingSkeleton variant="table" tableRows={4} />
            ) : incidenciasFiltradas.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No hay planes de acción registrados.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600, overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#eee' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Incidencia</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Plan de Acción</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Responsable</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* OPTIMIZADO: Limitar a 50 incidencias para mejor rendimiento */}
                    {incidenciasFiltradas.slice(0, 50).map((inc) => (
                      <TableRow
                        key={inc.id}
                        hover
                        onClick={() => { setIncidenciaSeleccionada(inc); setDetalleDialogOpen(true); }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">{inc.planNombre || inc.titulo}</Typography>
                          <Typography variant="caption" color="text.secondary">ID: {inc.codigo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {inc.accionesCorrectivas
                              ? (inc.accionesCorrectivas.length > 60 ? `${inc.accionesCorrectivas.substring(0, 60)}...` : inc.accionesCorrectivas)
                              : 'Sin plan definido'}
                          </Typography>
                        </TableCell>
                        <TableCell>{inc.responsableNombre || '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              size="small"
                              label={inc.estado.replace('_', ' ').toUpperCase()}
                              color={obtenerColorEstado(inc.estado) as any}
                            />
                            {inc.planFechaLimite && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Límite: {inc.planFechaLimite}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}


      {/* DIALOG DETALLE INCIDENCIA */}
      <Dialog open={detalleDialogOpen} onClose={() => setDetalleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>Detalle de Incidencia / Materialización</DialogTitle>
        <DialogContent dividers>
          {incidenciaSeleccionada && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Título</Typography>
                <Typography variant="h6">{incidenciaSeleccionada.titulo}</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Descripción</Typography>
                  <Typography variant="body1">{incidenciaSeleccionada.descripcion}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Código</Typography>
                  <Typography variant="body1" fontWeight="bold">{incidenciaSeleccionada.codigo}</Typography>
                </Box>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="overline" color="text.secondary">Riesgo Asociado</Typography>
                  <Typography variant="body1">{incidenciaSeleccionada.riesgoNombre || 'N/A'}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Fecha Ocurrencia</Typography>
                  <Typography variant="body1">{new Date(incidenciaSeleccionada.fechaOcurrencia).toLocaleDateString()}</Typography>
                </Box>
                <Box>
                  <Typography variant="overline" color="text.secondary">Estado</Typography>
                  <Chip label={incidenciaSeleccionada.estado.toUpperCase()} color={obtenerColorEstado(incidenciaSeleccionada.estado) as any} size="small" />
                </Box>
              </Box>

              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Impactos Reales</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 1 }}>
                  {incidenciaSeleccionada.impactosMaterializacion && Object.entries(incidenciaSeleccionada.impactosMaterializacion).map(([key, value]) => (
                    <Card key={key} variant="outlined" sx={{ p: 1, bgcolor: '#fcfcfc' }}>
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{key}</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary">{value}</Typography>
                    </Card>
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box sx={{ bgcolor: '#fffde7', p: 3, borderRadius: 2, border: '1px solid #ffe0b2' }}>
                <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 800, textTransform: 'uppercase', mb: 2 }}>
                  PLAN DE ACCIÓN CORRECTIVO
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nombre del Plan</Typography>
                    <Typography variant="body2" fontWeight="bold">{incidenciaSeleccionada.planNombre || 'Sin nombre'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Objetivo</Typography>
                    <Typography variant="body2" fontWeight="bold">{incidenciaSeleccionada.planObjetivo || 'Sin objetivo'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="caption" color="text.secondary">Descripción de Acciones</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{incidenciaSeleccionada.accionesCorrectivas || 'No definida'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha Inicio</Typography>
                    <Typography variant="body2">{incidenciaSeleccionada.planFechaInicio || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha Límite</Typography>
                    <Typography variant="body2">{incidenciaSeleccionada.planFechaLimite || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Responsable</Typography>
                    <Typography variant="body2" fontWeight="bold">{incidenciaSeleccionada.responsableNombre || 'No asignado'}</Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleDialogOpen(false)} variant="contained" color="warning">Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AppPageLayout>
  );
}
