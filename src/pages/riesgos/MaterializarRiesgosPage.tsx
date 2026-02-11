/**
 * Materializar Riesgos Page
 * Gestión de eventos/materialización de riesgos
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
import { useGetRiesgosQuery } from '../../api/services/riesgosApi';
import { getMockRiesgos, getDescripcionesImpacto, getEstadosIncidencia } from '../../api/services/mockData';
import { LABELS_IMPACTO } from '../../utils/constants';
import Grid2 from '../../utils/Grid2';
import AppPageLayout from '../../components/layout/AppPageLayout';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';

// Opciones de impacto desde constants (no quemadas)
const OPCIONES_IMPACTO = Object.entries(LABELS_IMPACTO).map(([valor, label]) => ({
  valor: Number(valor),
  label: `${valor} - ${label}`
}));

// Normalizar descripciones de impacto desde formato numérico a nombres
const normalizarDescripcionesImpacto = (data?: Record<string, Record<number, string>>) => ({
  economico: data?.economico ?? data?.['4'] ?? {},
  procesos: data?.procesos ?? data?.['8'] ?? {},
  legal: data?.legal ?? data?.['6'] ?? {},
  confidencialidadSGSI: data?.confidencialidadSGSI ?? data?.['2'] ?? {},
  reputacional: data?.reputacional ?? data?.['9'] ?? {},
  disponibilidadSGSI: data?.disponibilidadSGSI ?? data?.['3'] ?? {},
  integridadSGSI: data?.integridadSGSI ?? data?.['5'] ?? {},
  ambiental: data?.ambiental ?? data?.['1'] ?? {},
  personas: data?.personas ?? data?.['7'] ?? {},
});

// Tipo derivado del catálogo centralizado
type EstadoIncidencia = typeof getEstadosIncidencia extends () => readonly { value: infer T }[] ? T : never;


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
  const { esAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [riesgoExpandido, setRiesgoExpandido] = useState<string | null>(null);
  const [formularioExpandido, setFormularioExpandido] = useState<{ riesgoId: string; causaId?: string } | null>(null);
  const [datosFormulario, setDatosFormulario] = useState<Partial<Incidencia>>({});
  const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState<Incidencia | null>(null);
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false);

  // Persistence
  useEffect(() => {
    const stored = localStorage.getItem('incidencias_db');
    if (stored) {
      setIncidencias(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (incidencias.length > 0) {
      localStorage.setItem('incidencias_db', JSON.stringify(incidencias));
    }
  }, [incidencias]);
  const descripcionesImpacto = useMemo(() => {
    const storedImpactos = localStorage.getItem('catalogos_impactos');
    const impactosData = storedImpactos ? JSON.parse(storedImpactos) : getDescripcionesImpacto();
    return normalizarDescripcionesImpacto(impactosData);
  }, []);
  const { data: riesgosResponse } = useGetRiesgosQuery({ procesoId: procesoSeleccionado?.id });
  const riesgosData = riesgosResponse?.data || [];

  // Obtener riesgos del proceso seleccionado
  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    return riesgosData;
  }, [riesgosData, procesoSeleccionado?.id]);

  // Filtrar incidencias por proceso
  const incidenciasFiltradas = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    return incidencias.filter((inc) => inc.procesoId === procesoSeleccionado.id);
  }, [incidencias, procesoSeleccionado?.id]);

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

  const handleGuardar = () => {
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


    // Solo crear nueva incidencia (el formulario inline no soporta edición)
    const riesgoSeleccionado = riesgosDelProceso.find((r: any) => r.id === formData.riesgoId);

    const nuevaIncidencia: Incidencia = {
      id: `incidencia-${Date.now()}`,
      codigo: `INC-${Date.now()}`,
      ...formData,
      procesoId: procesoSeleccionado.id,
      procesoNombre: procesoSeleccionado.nombre,
      riesgoNombre: (riesgoSeleccionado as any)?.descripcion || (riesgoSeleccionado as any)?.nombre,
      impactosMaterializacion: impactos, // Ensure impacts object exists
      fechaReporte: formData.fechaReporte || new Date().toISOString().split('T')[0],
      reportadoPor: 'Usuario Actual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Incidencia;

    setIncidencias((prev) => [...prev, nuevaIncidencia]);
    showSuccess('Incidencia creada exitosamente');
  };

  const handleEliminar = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta incidencia?')) {
      setIncidencias((prev) => prev.filter((inc) => inc.id !== id));
      showSuccess('Incidencia eliminada exitosamente');
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
    <AppPageLayout
      title="Materialización de Riesgos"
      description="Gestión y registro de eventos donde los riesgos se han materializado."
      topContent={<FiltroProcesoSupervisor />}
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Está en modo visualización. Solo puede ver la información. Para editar, seleccione el proceso en modo "Editar" desde el Dashboard.
          </Alert>
        )
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
          {riesgosDelProceso.length === 0 ? (
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
              {riesgosDelProceso.map((riesgo: any) => (
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
                    onClick={() => setRiesgoExpandido(riesgoExpandido === riesgo.id ? null : riesgo.id)}
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
                        label={`${incidencias.filter(inc => inc.riesgoId === riesgo.id).length} MATERIALIZADOS`}
                        size="small"
                        color={incidencias.some(inc => inc.riesgoId === riesgo.id) ? 'error' : 'success'}
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
                        const incidenteExistente = incidencias.find((i) => i.riesgoId === riesgo.id && i.causaId === causa.id);
                        const isExpanded = formularioExpandido?.causaId === causa.id;

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
                                if (isExpanded) {
                                  setFormularioExpandido(null);
                                } else {
                                  setFormularioExpandido({ riesgoId: riesgo.id, causaId: causa.id });
                                  if (incidenteExistente) {
                                    setFormData({ ...incidenteExistente });
                                  } else {
                                    setFormData({
                                      titulo: `Materialización: ${causa.descripcion.substring(0, 50)}...`,
                                      riesgoId: riesgo.id,
                                      riesgoNombre: riesgo.nombre,
                                      causaId: causa.id,
                                      causaNombre: causa.descripcion,
                                      descripcion: '',
                                      fechaOcurrencia: new Date().toISOString().split('T')[0],
                                      fechaReporte: new Date().toISOString().split('T')[0],
                                      accionesCorrectivas: '',
                                      planNombre: '',
                                      planObjetivo: '',
                                      planFechaInicio: new Date().toISOString().split('T')[0],
                                      planFechaLimite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
            {incidenciasFiltradas.length === 0 ? (
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
