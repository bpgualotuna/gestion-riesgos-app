import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Stack,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { axiosClient } from '../../app/axiosClient';
import { useAuth } from '../../contexts/AuthContext';

// Nombres legibles para campos del historial de cambios
const NOMBRE_CAMPO: Record<string, string> = {
  contextos: 'Contextos',
  dofaItems: 'Ítems DOFA',
  participantes: 'Participantes',
  normatividades: 'Normatividades',
};

// Mapeo de tablas de BD a nombres de páginas/módulos
const TABLA_A_PAGINA: Record<string, string> = {
  'Riesgo': 'Riesgos',
  'Proceso': 'Procesos',
  'Usuario': 'Usuarios',
  'Incidencia': 'Incidencias',
  'PlanAccion': 'Planes de Acción',
  'EvaluacionRiesgo': 'Evaluación de Riesgos',
  'PriorizacionRiesgo': 'Priorización',
  'CausaRiesgo': 'Causas de Riesgo',
  'ControlRiesgo': 'Controles',
  'Control': 'Controles',
  'Area': 'Áreas y Asignaciones',
  'Role': 'Roles y Permisos',
  'Cargo': 'Cargos',
  'ProcesoResponsable': 'Responsables de Proceso',
  'DofaItem': 'Análisis DOFA',
  'Normatividad': 'Normatividad',
  'Contexto': 'Contexto',
  'Gerencia': 'Gerencias',
  'Observacion': 'Observaciones',
  'CalificacionInherenteConfig': 'Calificación Inherente',
  'ConfiguracionResidual': 'Configuración Residual',
};

// Helper para formatear fechas sin dependencias externas
const formatearFecha = (fecha: string | Date, incluirHora: boolean = true): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  
  if (!incluirHora) {
    return `${dia}/${mes}/${anio}`;
  }
  
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  
  return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
};

const formatearFechaDetallada = (fecha: string | Date): string => {
  const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');
  
  return `${dia}/${mes}/${anio} a las ${horas}:${minutos}:${segundos}`;
};

/** Formatea el valor para "Detalles del Cambio": resumen para listas/objetos grandes, sin volcar JSON completo */
const formatearValorParaDetalle = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '—';
  if (Array.isArray(valor)) {
    if (valor.length === 0) return 'Lista vacía';
    return `Lista de ${valor.length} elemento${valor.length === 1 ? '' : 's'}`;
  }
  if (typeof valor === 'object') {
    const keys = Object.keys(valor as object);
    const str = JSON.stringify(valor);
    if (str.length > 400 || keys.length > 5) {
      return `Objeto (${keys.length} propiedad${keys.length === 1 ? '' : 'es'})`;
    }
  }
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  const str = String(valor);
  return str.length > 400 ? `${str.slice(0, 397)}…` : str;
};

/** Campos que se ignoran al mostrar cambios en ítems (ids, timestamps) */
const CAMPOS_IGNORADOS_ITEM = ['id', 'procesoId', 'createdAt', 'updatedAt', '$type'];

/** Calcula el diff entre dos arrays de objetos con id; devuelve solo lo que realmente cambió */
function diffArraysById(
  anterior: unknown,
  nuevo: unknown
): { added: number; removed: number; modified: { id: number | string; campos: { campo: string; anterior: string; nuevo: string }[] }[] } | null {
  if (!Array.isArray(anterior) || !Array.isArray(nuevo)) return null;
  const getId = (o: any) => o?.id;
  const toMap = (arr: any[]) => {
    const m = new Map<string, any>();
    arr.forEach((item) => {
      const id = getId(item);
      if (id != null) m.set(String(id), item);
    });
    return m;
  };
  const mapA = toMap(anterior);
  const mapN = toMap(nuevo);
  const idsA = new Set(mapA.keys());
  const idsN = new Set(mapN.keys());
  const added = [...idsN].filter((id) => !idsA.has(id)).length;
  const removed = [...idsA].filter((id) => !idsN.has(id)).length;
  const modified: { id: number | string; campos: { campo: string; anterior: string; nuevo: string }[] }[] = [];
  for (const id of idsA) {
    if (!idsN.has(id)) continue;
    const a = mapA.get(id);
    const n = mapN.get(id);
    const allKeys = new Set([...Object.keys(a || {}), ...Object.keys(n || {})]);
    const campos: { campo: string; anterior: string; nuevo: string }[] = [];
    for (const key of allKeys) {
      if (CAMPOS_IGNORADOS_ITEM.includes(key)) continue;
      const va = a?.[key];
      const vn = n?.[key];
      const sa = typeof va === 'object' ? JSON.stringify(va) : String(va ?? '');
      const sn = typeof vn === 'object' ? JSON.stringify(vn) : String(vn ?? '');
      if (sa !== sn) {
        const trunc = (s: string) => (s.length > 120 ? s.slice(0, 117) + '…' : s);
        campos.push({ campo: key, anterior: trunc(sa), nuevo: trunc(sn) });
      }
    }
    if (campos.length > 0) modified.push({ id, campos });
  }
  if (added === 0 && removed === 0 && modified.length === 0) return null;
  return { added, removed, modified };
}

interface AuditLog {
  id: number;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRole: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  tabla: string;
  registroId?: number;
  registroDesc?: string;
  cambios?: Record<string, { anterior: any; nuevo: any }>;
  datosAnteriores?: any;
  datosNuevos?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface HistorialPageProps {
  user?: any;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const HistorialLogCard = memo(function HistorialLogCard({
  log,
  onVerDetalle,
  formatearFechaFn,
  tablaLabel,
}: {
  log: AuditLog;
  onVerDetalle: (log: AuditLog) => void;
  formatearFechaFn: (fecha: string | Date, incluirHora?: boolean) => string;
  tablaLabel: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: 2,
        '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)', boxShadow: 1 },
      }}
      onClick={() => onVerDetalle(log)}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.9rem' }} noWrap>{tablaLabel}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{formatearFechaFn(log.createdAt)}</Typography>
          </Box>
          <Box onClick={(e) => e.stopPropagation()}>
            <Button size="small" variant="outlined" startIcon={<InfoIcon />} onClick={() => onVerDetalle(log)}>Ver</Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          <Chip label={`${log.usuarioNombre}${log.usuarioEmail ? ` (${log.usuarioEmail})` : ''}`} size="small" variant="outlined" />
          <Chip label={log.usuarioRole} size="small" color="primary" variant="outlined" />
          <Chip
            label={log.accion === 'CREATE' ? 'CREAR' : log.accion === 'DELETE' ? 'ELIMINAR' : 'ACTUALIZAR'}
            size="small"
            color={log.accion === 'CREATE' ? 'success' : log.accion === 'DELETE' ? 'error' : 'warning'}
          />
          <Chip
            label={log.cambios ? `${Object.keys(log.cambios).length} campo${Object.keys(log.cambios).length > 1 ? 's' : ''}` : 'Sin cambios'}
            size="small"
            variant="outlined"
            color={log.cambios ? 'info' : 'default'}
          />
        </Box>
        <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
          <b>Registro:</b> {log.registroDesc || '-'}
        </Typography>
      </CardContent>
    </Card>
  );
});

export default function HistorialPage() {
  const { user, esAdmin, esGerenteGeneral } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(true); // Expandido por defecto
  const [filtros, setFiltros] = useState({
    usuarioId: '',
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });
  type SortFieldHistorial = 'createdAt' | 'usuarioNombre' | 'usuarioRole' | 'accion' | 'tabla' | 'registroDesc' | 'cambiosCount';
  const [sortField, setSortField] = useState<SortFieldHistorial>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterApplyKey, setFilterApplyKey] = useState(0);


  // Admin y Gerente General pueden ver todos los usuarios
  const puedeVerTodos = esAdmin || esGerenteGeneral;

  // Si no es admin ni gerente general, filtrar automáticamente por el usuario actual
  const usuarioIdFiltro = puedeVerTodos ? filtros.usuarioId : (user?.id ? String(user.id) : '');

  useEffect(() => {
    if (puedeVerTodos) {
      cargarUsuarios();
    }
    cargarHistorial();
  }, [paginacion.page, paginacion.pageSize, puedeVerTodos, usuarioIdFiltro, filterApplyKey]);

  const cargarUsuarios = async () => {
    try {
      const response = await axiosClient.get('/usuarios');
      setUsuarios(response.data || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const cargarHistorial = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (usuarioIdFiltro) params.append('usuarioId', usuarioIdFiltro);
      params.append('page', String(paginacion.page));
      params.append('pageSize', String(paginacion.pageSize));

      const response = await axiosClient.get(`/audit/logs?${params}`);

      const body = response.data;
      const lista = Array.isArray(body) ? body : (body?.data ?? []);
      const total = typeof body?.total === 'number' ? body.total : lista.length;

      setLogs(lista);
      setPaginacion((prev) => ({
        ...prev,
        total,
      }));
    } catch (err: any) {
      console.error('Error cargando historial:', err);
      
      // Si es error 401 o 403, mostrar mensaje de autorización
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('No autorizado para ver el historial de auditoría.');
        setLogs([]);
      } 
      // Si es error de red o el endpoint no existe
      else if (!err.response || err.response?.status === 404) {
        setError('El sistema de auditoría no está disponible. Contacta al administrador.');
        setLogs([]);
      }
      // Otros errores
      else {
        setError(err.response?.data?.error || 'Error al cargar el historial.');
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedLog(null);
  }, []);

  const handleLimpiarFiltros = () => {
    setFiltros({
      usuarioId: '',
    });
  };

  const totalPages = Math.max(1, Math.ceil((paginacion.total || 0) / paginacion.pageSize));
  const from = (paginacion.page - 1) * paginacion.pageSize + 1;
  const to = Math.min(paginacion.page * paginacion.pageSize, paginacion.total || 0);

  const sortedLogs = useMemo(() => {
    const list = [...logs];
    list.sort((a, b) => {
      let va: number | string = '';
      let vb: number | string = '';
      if (sortField === 'createdAt') {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
        return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
      }
      if (sortField === 'cambiosCount') {
        va = Object.keys(a.cambios || {}).length;
        vb = Object.keys(b.cambios || {}).length;
        return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
      }
      va = (a as any)[sortField] ?? '';
      vb = (b as any)[sortField] ?? '';
      const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [logs, sortField, sortDir]);

  const handleSortHistorial = (field: SortFieldHistorial) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const applyFiltersAndReload = () => {
    setPaginacion((p) => ({ ...p, page: 1 }));
    setFilterApplyKey((k) => k + 1);
  };

  return (
    <AppPageLayout title="Historial de Cambios" description="Registro de auditoría de todas las operaciones realizadas en el sistema">
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Historial de Cambios
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Registro de auditoría de todas las operaciones realizadas en el sistema
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarHistorial}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {/* Alert de error o info */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas rápidas */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Total de Registros
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {paginacion.total || logs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Creaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {logs.filter((l) => l.accion === 'CREATE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Actualizaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                {logs.filter((l) => l.accion === 'UPDATE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="textSecondary">
                Eliminaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {logs.filter((l) => l.accion === 'DELETE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mensaje informativo para usuarios no admin ni gerente general */}
      {!puedeVerTodos && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Mostrando únicamente su historial de cambios. Solo los administradores y gerentes generales pueden ver el historial de todos los usuarios.
        </Alert>
      )}

      {/* Filtros - Solo visible para administradores y gerentes generales */}
      {puedeVerTodos && (
        <Accordion 
          expanded={filtrosExpandidos}
          onChange={(e, isExpanded) => setFiltrosExpandidos(isExpanded)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography fontWeight={500}>Filtros de Búsqueda</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Filtrar por Usuario"
                  value={filtros.usuarioId}
                  onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}
                  size="small"
                  slotProps={{
                    select: {
                      displayEmpty: true,
                    },
                  }}
                >
                  <MenuItem value="">Todos los usuarios</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={String(usuario.id)}>
                      {usuario.nombre} ({usuario.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={applyFiltersAndReload}
                    fullWidth
                    disabled={loading}
                  >
                    Aplicar Filtros
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleLimpiarFiltros}
                    fullWidth
                  >
                    Limpiar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Lista de ítems (lista moderna + paginación arriba + ordenación) */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {/* Barra superior: ordenación + paginación (arriba) */}
        {(paginacion.total || 0) > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                Mostrando {from} - {to} de {paginacion.total}
              </Typography>
              <TextField
                select
                size="small"
                label="Filas por página"
                value={paginacion.pageSize}
                onChange={(e) => {
                  setPaginacion((p) => ({ ...p, pageSize: Number(e.target.value), page: 1 }));
                }}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Ordenar por"
                value={`${sortField}:${sortDir}`}
                onChange={(e) => {
                  const [f, d] = String(e.target.value).split(':') as [any, any];
                  setSortField(f);
                  setSortDir(d);
                }}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="createdAt:desc">Fecha/Hora (reciente)</MenuItem>
                <MenuItem value="createdAt:asc">Fecha/Hora (antiguo)</MenuItem>
                <MenuItem value="usuarioNombre:asc">Usuario (A-Z)</MenuItem>
                <MenuItem value="usuarioNombre:desc">Usuario (Z-A)</MenuItem>
                <MenuItem value="accion:asc">Acción (A-Z)</MenuItem>
                <MenuItem value="accion:desc">Acción (Z-A)</MenuItem>
                <MenuItem value="tabla:asc">Página/Módulo (A-Z)</MenuItem>
                <MenuItem value="tabla:desc">Página/Módulo (Z-A)</MenuItem>
                <MenuItem value="cambiosCount:desc">Cambios (mayor)</MenuItem>
                <MenuItem value="cambiosCount:asc">Cambios (menor)</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                disabled={paginacion.page <= 1}
                onClick={() => setPaginacion((p) => ({ ...p, page: p.page - 1 }))}
                aria-label="Página anterior"
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 90, textAlign: 'center' }}>
                Pág. {paginacion.page} de {totalPages}
              </Typography>
              <IconButton
                size="small"
                disabled={paginacion.page >= totalPages}
                onClick={() => setPaginacion((p) => ({ ...p, page: p.page + 1 }))}
                aria-label="Página siguiente"
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Lista de cards */}
        {loading ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Cargando historial...</Typography>
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay registros en el historial.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
            {sortedLogs.map((log) => (
              <HistorialLogCard
                key={log.id}
                log={log}
                onVerDetalle={handleVerDetalles}
                formatearFechaFn={formatearFecha}
                tablaLabel={TABLA_A_PAGINA[log.tabla] || log.tabla}
              />
            ))}
          </Box>
        )}

      </Paper>

      {/* Dialog de Detalles - ancho limitado para no tapar el panel de IA */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { maxWidth: 640 } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Detalles del Cambio
            </Typography>
            <Button
              onClick={handleCloseDialog}
              size="small"
              startIcon={<CloseIcon />}
            >
              Cerrar
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={3}>
              {/* Información General */}
              <Box>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  INFORMACIÓN GENERAL
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Fecha y Hora
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatearFechaDetallada(selectedLog.createdAt)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Acción
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={
                          selectedLog.accion === 'CREATE'
                            ? 'CREAR'
                            : selectedLog.accion === 'DELETE'
                            ? 'ELIMINAR'
                            : 'ACTUALIZAR'
                        }
                        size="small"
                        color={
                          selectedLog.accion === 'CREATE'
                            ? 'success'
                            : selectedLog.accion === 'DELETE'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Usuario
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.usuarioNombre}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedLog.usuarioEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Rol
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedLog.usuarioRole}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      Página/Módulo
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {TABLA_A_PAGINA[selectedLog.tabla] || selectedLog.tabla}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">
                      ID del Registro
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.registroId || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Descripción del Registro
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedLog.registroDesc || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Cambios Realizados */}
              {selectedLog.cambios && Object.keys(selectedLog.cambios).length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    CAMBIOS REALIZADOS
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {Object.entries(selectedLog.cambios).map(([campo, valores]) => {
                      const diff = diffArraysById(valores.anterior, valores.nuevo);
                      const nombreCampo = NOMBRE_CAMPO[campo] ?? campo;
                      return (
                        <Paper key={campo} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            {nombreCampo}
                          </Typography>
                          {diff ? (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {diff.added > 0 && `${diff.added} agregado${diff.added === 1 ? '' : 's'}`}
                                {diff.added > 0 && (diff.removed > 0 || diff.modified.length > 0) && ', '}
                                {diff.removed > 0 && `${diff.removed} eliminado${diff.removed === 1 ? '' : 's'}`}
                                {diff.removed > 0 && diff.modified.length > 0 && ', '}
                                {diff.modified.length > 0 && `${diff.modified.length} modificado${diff.modified.length === 1 ? '' : 's'}`}
                              </Typography>
                              {diff.modified.map(({ id, campos: camposItem }) => (
                                <Box key={String(id)} sx={{ mt: 1, pl: 1, borderLeft: 2, borderColor: 'primary.light' }}>
                                  <Typography variant="caption" fontWeight={600}>Ítem {id}</Typography>
                                  {camposItem.map((c) => (
                                    <Box key={c.campo} sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary">{c.campo}:</Typography>
                                      <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>{c.anterior}</Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ mx: 0.5 }}>→</Typography>
                                      <Typography variant="body2" component="span">{c.nuevo}</Typography>
                                    </Box>
                                  ))}
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Valor Anterior</Typography>
                                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'error.lighter', borderColor: 'error.light' }}>
                                  <Typography variant="body2" fontFamily="monospace">
                                    {formatearValorParaDetalle(valores.anterior)}
                                  </Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="textSecondary">Valor Nuevo</Typography>
                                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'success.lighter', borderColor: 'success.light' }}>
                                  <Typography variant="body2" fontFamily="monospace">
                                    {formatearValorParaDetalle(valores.nuevo)}
                                  </Typography>
                                </Paper>
                              </Grid>
                            </Grid>
                          )}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* Para CREATE: Mostrar solo datos nuevos */}
              {selectedLog.accion === 'CREATE' && selectedLog.datosNuevos && !selectedLog.cambios && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    DATOS DEL REGISTRO CREADO
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {Object.entries(selectedLog.datosNuevos).map(([campo, valor]) => (
                      <Paper key={campo} variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {campo}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Para DELETE: Mostrar solo datos anteriores */}
              {selectedLog.accion === 'DELETE' && selectedLog.datosAnteriores && !selectedLog.cambios && (
                <Box>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    DATOS DEL REGISTRO ELIMINADO
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    {Object.entries(selectedLog.datosAnteriores).map(([campo, valor]) => (
                      <Paper key={campo} variant="outlined" sx={{ p: 1.5, bgcolor: 'error.lighter' }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {campo}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </AppPageLayout>
  );
}
