/**
 * Incidencias Page
 * Gestión de incidencias relacionadas con riesgos
 */

import { useState, useMemo, useEffect } from 'react';
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
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetImpactosQuery } from '../../api/services/riesgosApi';
import { useGetIncidenciasQuery, useCreateIncidenciaMutation, useDeleteIncidenciaMutation, useGetRiesgosQuery } from '../../api/services/riesgosApi';
import { LABELS_IMPACTO } from '../../utils/constants';
import { useConfirm } from '../../contexts/ConfirmContext';
import Grid2 from '../../utils/Grid2';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { useUnsavedChanges, useFormChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import { repairSpanishDisplayArtifacts } from '../../utils/utf8Repair';
import { addDaysISO, todayISO } from '../../utils/formatters';

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

export default function IncidenciasPage() {
  const { esAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirm();
  const { procesoSeleccionado } = useProceso();
  const [incidenciasLocal, setIncidenciasLocal] = useState<Incidencia[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [formularioExpandido, setFormularioExpandido] = useState<{ riesgoId: string; causaId?: string } | null>(null);
  const [datosFormulario, setDatosFormulario] = useState<Partial<Incidencia>>({});
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);

  const { data: incidenciasApi = [], isLoading: isLoadingIncidencias } = useGetIncidenciasQuery({
    procesoId: procesoSeleccionado?.id ? String(procesoSeleccionado.id) : undefined,
  }, { skip: !procesoSeleccionado?.id });
  const [createIncidencia] = useCreateIncidenciaMutation();
  const [deleteIncidencia] = useDeleteIncidenciaMutation();

  useEffect(() => {
    setIncidenciasLocal(incidenciasApi as Incidencia[]);
  }, [incidenciasApi]);
  const { data: impactosApi = [] } = useGetImpactosQuery();
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
        acc[nivel.nivel] = repairSpanishDisplayArtifacts(String(nivel.descripcion ?? ''));
        return acc;
      }, {});
    });

    return base;
  }, [impactosApi]);
  const { data: riesgosResponse, isLoading: isLoadingRiesgos } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: procesoSeleccionado.id, pageSize: 100 } : { pageSize: 100 },
    { skip: !procesoSeleccionado?.id, refetchOnMountOrArgChange: false }
  );
  const isLoadingData = !!procesoSeleccionado?.id && (isLoadingRiesgos || isLoadingIncidencias);
  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    return (riesgosResponse?.data || []);
  }, [riesgosResponse?.data, procesoSeleccionado?.id]);

  // Filtrar incidencias por proceso
  const incidenciasFiltradas = useMemo(() => {
    return (incidenciasLocal.filter((inc) => String(inc.procesoId) === String(procesoSeleccionado.id))) || [];
  }, [incidenciasLocal, procesoSeleccionado?.id]);

  // Formulario inline
  const [formData, setFormData] = useState<Partial<Incidencia>>({
    titulo: '',
    descripcion: '',
    estado: 'abierta',
    fechaOcurrencia: todayISO(),
    fechaReporte: todayISO(),
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

  const [initialFormData, setInitialFormData] = useState<Partial<Incidencia>>(formData);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar cambios en el formulario
  const hasFormChanges = useFormChanges(initialFormData, formData, {
    deepCompare: true,
  });

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasFormChanges && formularioExpandido !== null,
    message: 'Tiene cambios sin guardar en el formulario de incidencia.',
    disabled: formularioExpandido === null,
  });

  const handleGuardar = async () => {
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
      economico: 0, reputacional: 0, legal: 0, operacional: 0, personas: 0, ambiental: 0, tecnologico: 0, cumplimiento: 0
    };
    /* Relax validation for inline quick report 
    const algunImpactoCompletado = Object.values(impactos).some((valor) => valor > 0);
    if (!algunImpactoCompletado) {
      showError('Debe completar al menos un impacto de materialización');
      return;
    }
    */


    try {
      setIsSaving(true);
      await createIncidencia({
        codigo: `INC-${Date.now()}`,
        riesgoId: formData.riesgoId,
        procesoId: procesoSeleccionado.id,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        estado: formData.estado,
        fechaOcurrencia: formData.fechaOcurrencia,
        fechaReporte: formData.fechaReporte || todayISO(),
        reportadoPor: 'Usuario Actual',
        impactosMaterializacion: impactos,
      }).unwrap();
      setInitialFormData(formData);
      markAsSaved();
      showSuccess('Incidencia creada exitosamente');
    } catch (e: any) {
      showError(e?.data?.error || e?.message || 'Error al crear la incidencia');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    await handleGuardar();
    if (!isSaving) {
      forceNavigate();
    }
  };

  const handleDiscardChanges = () => {
    setFormData(initialFormData);
    forceNavigate();
  };

  const handleEliminar = async (id: string) => {
    if (!(await confirmDelete('esta incidencia'))) return;
    try {
      await deleteIncidencia(id).unwrap();
      showSuccess('Incidencia eliminada exitosamente');
    } catch (error) {
      showError((error as any)?.data?.error || 'Error al eliminar la incidencia');
    }
  };

  const obtenerColorEstado = (estado: string) => {
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
  };

  const columns: GridColDef[] = [
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
  ];

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en el formulario de incidencia."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Materializar Riesgos"
      description={`Gestión de eventos y materialización de riesgos residuales para el proceso: ${repairSpanishDisplayArtifacts(String(procesoSeleccionado?.nombre || 'No seleccionado'))}`}
      alert={
        !procesoSeleccionado?.id ? (
          <Alert severity="warning">
            Selecciona un proceso en la barra de navegación para gestionar incidencias
          </Alert>
        ) : undefined
      }
    >

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
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
                gridTemplateColumns: '48px 100px 1fr 180px 220px 100px 48px',
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
                <Typography variant="caption" fontWeight={700} color="text.secondary">TIPOLOGÍA TIPO I</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary">CAUSAS</Typography>
                <Typography variant="caption" fontWeight={700} color="text.secondary" align="center">ESTADO</Typography>
                <Box />
              </Box>
              {riesgosDelProceso.map((riesgo: any) => (
                <Card key={riesgo.id} variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '48px 100px 1fr 180px 220px 100px 48px',
                      gap: 2,
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: riesgoExpandido === riesgo.id ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' },
                      alignItems: 'center'
                    }}
                    onClick={() => setRiesgoExpandido(riesgoExpandido === riesgo.id ? null : riesgo.id)}
                  >
                    <IconButton size="small" color="primary">
                      {riesgoExpandido === riesgo.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>

                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      {riesgo.numeroIdentificacion || 'Sin ID'}
                    </Typography>

                    <Typography variant="body2" sx={{
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.2
                    }}>
                      {repairSpanishDisplayArtifacts(
                        String(riesgo.nombre || riesgo.descripcionRiesgo || 'Sin descripción')
                      )}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {repairSpanishDisplayArtifacts(String(riesgo.tipoRiesgo || '02 Operacional'))}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {riesgo.causas?.length || 0} causas
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Chip
                        label={`${incidenciasFiltradas.filter(inc => inc.riesgoId === riesgo.id).length} MATERIALIZADOS`}
                        size="small"
                        color={incidenciasFiltradas.some(inc => inc.riesgoId === riesgo.id) ? 'error' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                    <Box />
                  </Box>
                  <Collapse in={riesgoExpandido === riesgo.id}>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                      <Typography variant="subtitle2" gutterBottom>Causas Asociadas:</Typography>
                      {(riesgo.causas || []).map((causa: any) => {
                        const incidenteExistente = incidenciasFiltradas.find((i) => i.riesgoId === riesgo.id && i.causaId === causa.id);
                        const isExpanded = formularioExpandido?.causaId === causa.id;

                        return (
                          <Box key={causa.id} sx={{ mb: 1, border: '1px solid #eee', borderRadius: 1, bgcolor: 'white' }}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {repairSpanishDisplayArtifacts(String(causa.descripcion ?? ''))}
                                </Typography>
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
                                if (isExpanded) {
                                  setFormularioExpandido(null);
                                } else {
                                  setFormularioExpandido({ riesgoId: riesgo.id, causaId: causa.id });
                                  if (incidenteExistente) {
                                    setFormData({ ...incidenteExistente });
                                  } else {
                                    setFormData({
                                      titulo: `Materialización: ${repairSpanishDisplayArtifacts(String(causa.descripcion ?? '')).substring(0, 50)}...`,
                                      riesgoId: riesgo.id,
                                      riesgoNombre: repairSpanishDisplayArtifacts(String(riesgo.nombre ?? '')),
                                      causaId: causa.id,
                                      causaNombre: repairSpanishDisplayArtifacts(String(causa.descripcion ?? '')),
                                      descripcion: '',
                                      fechaOcurrencia: todayISO(),
                                      fechaReporte: todayISO(),
                                      accionesCorrectivas: '',
                                      planNombre: '',
                                      planObjetivo: '',
                                      planFechaInicio: todayISO(),
                                      planFechaLimite: addDaysISO(30),
                                      responsableNombre: '',
                                      estado: 'abierta'
                                    });
                                  }
                                }
                              }}>
                                {isExpanded ? 'Cerrar' : (incidenteExistente ? 'Ver / Editar' : 'Reportar')}
                              </Button>
                            </Box>
                            <Collapse in={isExpanded}>
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
            </Box>
          )}
        </Box>
      )}

      {/* TAB 1: PLANES DE ACCIÓN DE RIESGOS MATERIALIZADOS */}
      {tabValue === 1 && (
        <Card variant="outlined">
          <CardContent>
            {isLoadingData ? (
              <PageLoadingSkeleton variant="table" tableRows={4} />
            ) : incidenciasFiltradas.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>No hay planes de acción registrados.</Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#eee' }}>
                      <TableCell>Incidencia</TableCell>
                      <TableCell>Plan de Acción</TableCell>
                      <TableCell>Responsable</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidenciasFiltradas.map((inc) => (
                      <TableRow
                        key={inc.id}
                        hover
                        onClick={() => { setIncidenciaSeleccionada(inc); setDetalleDialogOpen(true); }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {repairSpanishDisplayArtifacts(String(inc.planNombre || inc.titulo || ''))}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">ID: {inc.codigo}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {inc.accionesCorrectivas
                              ? (() => {
                                  const t = repairSpanishDisplayArtifacts(String(inc.accionesCorrectivas));
                                  return t.length > 60 ? `${t.substring(0, 60)}...` : t;
                                })()
                              : 'Sin plan definido'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {repairSpanishDisplayArtifacts(String(inc.responsableNombre || '-'))}
                        </TableCell>
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
      <Dialog open={detalleDialogOpen} onClose={() => setDetalleDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 640 } }}>
        <DialogTitle sx={{ bgcolor: 'warning.main', color: 'white' }}>Detalle de Incidencia / Materialización</DialogTitle>
        <DialogContent dividers>
          {incidenciaSeleccionada && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="overline" color="text.secondary">Título</Typography>
                <Typography variant="h6">
                  {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.titulo ?? ''))}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">Descripción</Typography>
                  <Typography variant="body1">
                    {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.descripcion ?? ''))}
                  </Typography>
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
                  <Typography variant="body1">
                    {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.riesgoNombre || 'N/A'))}
                  </Typography>
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
                    <Typography variant="body2" fontWeight="bold">
                      {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.planNombre || 'Sin nombre'))}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Objetivo</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.planObjetivo || 'Sin objetivo'))}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="caption" color="text.secondary">Descripción de Acciones</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.accionesCorrectivas || 'No definida'))}
                    </Typography>
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
                    <Typography variant="body2" fontWeight="bold">
                      {repairSpanishDisplayArtifacts(String(incidenciaSeleccionada.responsableNombre || 'No asignado'))}
                    </Typography>
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
    </>
  );
}
