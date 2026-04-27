/**
 * Normatividad Page
 * Inventario de Normatividad según análisis Excel
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  IconButton,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useProceso } from '../../contexts/ProcesoContext';
import { useSafeProcesoById } from '../../hooks/useSafeProcesoById';
import { useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { ESTADOS_NORMATIVIDAD, NIVELES_CUMPLIMIENTO, CLASIFICACION_RIESGO } from "../../utils/constants";
import { useConfirm } from '../../contexts/ConfirmContext';
import { formatDate } from '../../utils/formatters';
import { useUnsavedChanges, useArrayChanges } from '../../hooks/useUnsavedChanges';
import UnsavedChangesDialog from '../../components/common/UnsavedChangesDialog';
import PaginationBar from '../../components/ui/PaginationBar';
import LoadingActionButton from '../../components/ui/LoadingActionButton';

interface Normatividad {
  id: string;
  numero: number;
  nombre: string;
  estado: string;
  regulador: string;
  sanciones: string;
  plazoImplementacion: string;
  cumplimiento: string;
  detalleIncumplimiento: string;
  riesgoIdentificado: string;
  clasificacion: string;
  comentarios: string;
  responsable?: string;
}



import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import AppPageLayout from '../../components/layout/AppPageLayout';

const NormatividadCard = memo(function NormatividadCard({
  item,
  isReadOnly,
  onVerDetalle,
  onEditar,
  onEliminar,
  renderChipEstado,
  renderChipCumplimiento,
  renderChipClasificacion,
}: {
  item: Normatividad;
  isReadOnly: boolean;
  onVerDetalle: (item: Normatividad) => void;
  onEditar: (e: React.MouseEvent, item: Normatividad) => void;
  onEliminar: (e: React.MouseEvent, item: Normatividad) => void;
  renderChipEstado: (estado: string) => React.ReactNode;
  renderChipCumplimiento: (c: string) => React.ReactNode;
  renderChipClasificacion: (c: string) => React.ReactNode;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)', boxShadow: 1 },
      }}
      onClick={() => onVerDetalle(item)}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '56px 2.5fr 110px 200px 110px 120px 120px' }, gap: 1.5, alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ fontSize: '0.85rem' }}>{item.numero}</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minWidth: 0 }}>{item.nombre || 'Sin nombre'}</Typography>
          <Box>{renderChipEstado(item.estado)}</Box>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0 }}>{item.regulador || '-'}</Typography>
          <Box>{renderChipCumplimiento(item.cumplimiento)}</Box>
          <Box>{renderChipClasificacion(item.clasificacion)}</Box>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
            {!isReadOnly && (
              <>
                <IconButton size="small" color="primary" onClick={(e) => onEditar(e, item)} title="Editar"><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={(e) => onEliminar(e, item)} title="Eliminar"><DeleteIcon fontSize="small" /></IconButton>
              </>
            )}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onVerDetalle(item); }} title="Ver detalle"><VisibilityIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

export default function NormatividadPage() {
  const { showSuccess, showError } = useNotification();
  const { confirmDelete } = useConfirm();
  const { procesoSeleccionado, modoProceso, isLoading: isLoadingProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useSafeProcesoById(procesoSeleccionado?.id);
  const [updateProceso] = useUpdateProcesoMutation();

  const [normatividades, setNormatividades] = useState<Normatividad[]>([]);
  const [initialNormatividades, setInitialNormatividades] = useState<Normatividad[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Detectar cambios en el array
  const hasArrayChanges = useArrayChanges(initialNormatividades, normatividades);

  // Sistema de cambios no guardados
  const { blocker, markAsSaved, forceNavigate } = useUnsavedChanges({
    hasUnsavedChanges: hasArrayChanges && !isReadOnly,
    message: 'Tiene cambios sin guardar en el inventario de normatividad.',
    disabled: isReadOnly,
  });

  useEffect(() => {
    if (procesoData && procesoData.normatividades) {
      const data = procesoData.normatividades;
      setNormatividades(data);
      setInitialNormatividades(data);
    }
  }, [procesoData]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false);
  const [selectedNormatividad, setSelectedNormatividad] = useState<Normatividad | null>(null);
  const [cumplimientoSeleccionado, setCumplimientoSeleccionado] = useState<string>('Total');

  // Sincronizar cumplimientoSeleccionado cuando se abre el diálogo de edición
  useEffect(() => {
    if (dialogOpen && selectedNormatividad) {
      setCumplimientoSeleccionado(selectedNormatividad.cumplimiento || 'Total');
    } else if (dialogOpen && !selectedNormatividad) {
      setCumplimientoSeleccionado('Total');
    }
  }, [dialogOpen, selectedNormatividad]);

  const plazoImplementacionActual = selectedNormatividad?.plazoImplementacion || '';
  const plazoImplementacionEsFecha = /^\d{4}-\d{2}-\d{2}$/.test(plazoImplementacionActual);
  const usarInputFechaPlazo = !selectedNormatividad || !plazoImplementacionActual || plazoImplementacionEsFecha;

  const [sortField, setSortField] = useState<'numero' | 'nombre' | 'estado' | 'regulador' | 'cumplimiento' | 'clasificacion'>('numero');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const sortedNormatividades = useMemo(() => {
    const list = [...normatividades];
    list.sort((a, b) => {
      let va: number | string = (a as any)[sortField] ?? '';
      let vb: number | string = (b as any)[sortField] ?? '';
      if (sortField === 'numero') {
        va = Number(va);
        vb = Number(vb);
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      const cmp = va.localeCompare(vb, 'es');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [normatividades, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedNormatividades.length / pageSize));
  const paginatedNormatividades = useMemo(
    () => sortedNormatividades.slice((page - 1) * pageSize, page * pageSize),
    [sortedNormatividades, page, pageSize]
  );

  const handleSort = (field: typeof sortField) => {
    setSortField(field);
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  const handleEditar = useCallback((e: React.MouseEvent, row: Normatividad) => {
    e.stopPropagation();
    setSelectedNormatividad(row);
    setCumplimientoSeleccionado(row.cumplimiento || 'Total');
    setDialogOpen(true);
  }, []);

  const handleEliminar = useCallback(async (e: React.MouseEvent, row: Normatividad) => {
    e.stopPropagation();
    if (!procesoSeleccionado) return;
    if (!(await confirmDelete('esta normatividad'))) return;
    const updatedList = normatividades.filter(n => n.id !== row.id).map((n, idx) => ({ ...n, numero: idx + 1 }));
    try {
      setIsSaving(true);
      setNormatividades(updatedList);
      await updateProceso({ id: String(procesoSeleccionado.id), normatividades: updatedList }).unwrap();
      setInitialNormatividades(updatedList);
      markAsSaved();
      showSuccess('Normatividad eliminada correctamente');
    } catch {
      setNormatividades(normatividades);
      showError('Error al eliminar normatividad');
    } finally {
      setIsSaving(false);
    }
  }, [procesoSeleccionado, normatividades, confirmDelete, updateProceso, markAsSaved, showSuccess, showError]);

  // Handlers para el diálogo de cambios no guardados
  const handleSaveFromDialog = async () => {
    if (!procesoSeleccionado) return;
    try {
      setIsSaving(true);
      await updateProceso({
        id: String(procesoSeleccionado.id),
        normatividades: normatividades
      }).unwrap();
      setInitialNormatividades(normatividades);
      markAsSaved();
      showSuccess('Cambios guardados exitosamente');
      forceNavigate();
    } catch {
      showError('Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setNormatividades(initialNormatividades);
    forceNavigate();
  };

  const renderChipEstado = useCallback((estado: string) => (
    <Chip label={estado} size="small" color={estado === 'Existente' ? 'success' : estado === 'Requerida' ? 'warning' : 'info'} />
  ), []);
  const renderChipCumplimiento = useCallback((cumplimiento: string) => (
    <Chip label={cumplimiento} size="small" color={cumplimiento === 'Total' ? 'success' : cumplimiento === 'Parcial' ? 'warning' : 'error'} />
  ), []);
  const renderChipClasificacion = useCallback((clasificacion: string) => (
    <Chip label={clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Positivo' : 'Negativo'} size="small" color={clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'error'} />
  ), []);

  const openDetalle = useCallback((it: Normatividad) => {
    setSelectedNormatividad(it);
    setDialogDetalleOpen(true);
  }, []);

  if (isLoadingProceso) {
    return (
      <AppPageLayout
        title="Inventario de Normatividad"
        description={"Cat\u00e1logo de normativas aplicables al proceso"}
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <PageLoadingSkeleton variant="table" tableRows={6} />
        </Box>
      </AppPageLayout>
    );
  }

  if (!procesoSeleccionado) {
    return (
      <AppPageLayout
        title="Inventario de Normatividad"
        description={"Cat\u00e1logo de normativas aplicables al proceso"}
        topContent={<FiltroProcesoSupervisor />}
      >
        <Box sx={{ p: 3 }}>
          <Alert severity="info" variant="outlined">No hay proceso seleccionado.</Alert>
        </Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      {/* Diálogo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en el inventario de normatividad."
        description="¿Desea guardar los cambios antes de salir?"
      />

      <AppPageLayout
      title="Inventario de Normatividad"
      description="Catálogo de normativas aplicables al proceso"
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedNormatividad(null);
                setCumplimientoSeleccionado('Total');
                setDialogOpen(true);
              }}
              sx={{
                background: '#1976d2',
                color: '#fff',
                '&:hover': {
                  background: '#1565c0',
                },
              }}
            >
              Nueva Normatividad
            </Button>
          )}
        </Box>
      }
    >
      {/* Lista con encabezados, ordenación y paginación */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {/* Encabezados con ordenación */}
        {normatividades.length > 0 && (
          <Box
            sx={{
              display: { xs: 'none', sm: 'grid' },
              gridTemplateColumns: { xs: '1fr', sm: '56px 2.5fr 110px 200px 110px 120px 120px' },
              gap: 1.5,
              px: 2,
              py: 1.25,
              bgcolor: 'grey.100',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box component="button" onClick={() => handleSort('numero')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Nro.</Typography>
              {sortField === 'numero' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('nombre')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit', minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" noWrap>Nombre regulación</Typography>
              {sortField === 'nombre' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('estado')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Estado</Typography>
              {sortField === 'estado' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('regulador')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Regulador</Typography>
              {sortField === 'regulador' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('cumplimiento')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit', ml: -2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Cumplimiento</Typography>
              {sortField === 'cumplimiento' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('clasificacion')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Clasificación</Typography>
              {sortField === 'clasificacion' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', pl: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Acciones</Typography>
            </Box>
          </Box>
        )}

        {sortedNormatividades.length > 0 && (
          <PaginationBar
            variant="top"
            from={(page - 1) * pageSize + 1}
            to={Math.min(page * pageSize, sortedNormatividades.length)}
            total={sortedNormatividades.length}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: normatividades.length > 0 ? 2 : 0, py: normatividades.length > 0 ? 2 : 0 }}>
          {normatividades.length === 0 && (
            <Alert severity="info">No hay normatividades registradas. Agregue una con el botón &quot;Nueva Normatividad&quot;.</Alert>
          )}
          {paginatedNormatividades.map((item) => (
            <NormatividadCard
              key={item.id}
              item={item}
              isReadOnly={isReadOnly}
              onVerDetalle={openDetalle}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              renderChipEstado={renderChipEstado}
              renderChipCumplimiento={renderChipCumplimiento}
              renderChipClasificacion={renderChipClasificacion}
            />
          ))}
        </Box>
      </Paper>

      {/* Diálogo de Detalle (Solo lectura) */}
      <Dialog open={dialogDetalleOpen} onClose={() => setDialogDetalleOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 640 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Detalle de Normatividad
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!isReadOnly && (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setDialogDetalleOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  Editar
                </Button>
              )}
              <IconButton
                onClick={() => setDialogDetalleOpen(false)}
                size="small"
                sx={{ ml: 1 }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNormatividad && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Nombre de la Regulación Aplicable
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedNormatividad.nombre || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  label={selectedNormatividad.estado}
                  size="small"
                  color={
                    selectedNormatividad.estado === 'Existente'
                      ? 'success'
                      : selectedNormatividad.estado === 'Requerida'
                        ? 'warning'
                        : 'info'
                  }
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Regulador
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedNormatividad.regulador || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Sanciones Penales/Civiles/Económicas
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedNormatividad.sanciones || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Plazo para Implementación
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedNormatividad.plazoImplementacion || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Cumplimiento
                </Typography>
                <Chip
                  label={selectedNormatividad.cumplimiento}
                  size="small"
                  color={
                    selectedNormatividad.cumplimiento === 'Total'
                      ? 'success'
                      : selectedNormatividad.cumplimiento === 'Parcial'
                        ? 'warning'
                        : 'error'
                  }
                  sx={{ mb: 2 }}
                />
              </Box>
              {selectedNormatividad.cumplimiento === 'Parcial' && selectedNormatividad.responsable && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responsable
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedNormatividad.responsable}
                  </Typography>
                </Box>
              )}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Detalle del Incumplimiento
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedNormatividad.detalleIncumplimiento || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Riesgo Identificado
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedNormatividad.riesgoIdentificado || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Clasificación
                </Typography>
                <Chip
                  label={selectedNormatividad.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Riesgo Positivo' : 'Riesgo Negativo'}
                  size="small"
                  color={selectedNormatividad.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Comentarios Adicionales
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedNormatividad.comentarios || 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edición/Creación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 640 } }}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!procesoSeleccionado) return;
          const formData = new FormData(e.currentTarget);
          
          const cumplimiento = formData.get('cumplimiento') as string;
          
          // Validación: si cumplimiento es "Parcial", plazoImplementacion, detalleIncumplimiento y responsable son obligatorios
          if (cumplimiento === 'Parcial') {
            const plazo = formData.get('plazoImplementacion') as string;
            const detalle = formData.get('detalleIncumplimiento') as string;
            const responsable = formData.get('responsable') as string;
            
            if (!plazo || plazo.trim() === '') {
              showError('El campo "Plazo para Implementación" es obligatorio cuando el cumplimiento es Parcial');
              return;
            }
            if (!detalle || detalle.trim() === '') {
              showError('El campo "Detalle del Incumplimiento" es obligatorio cuando el cumplimiento es Parcial');
              return;
            }
            if (!responsable || responsable.trim() === '') {
              showError('El campo "Responsable" es obligatorio cuando el cumplimiento es Parcial');
              return;
            }
          }
          
          const newItem: any = {
            id: selectedNormatividad?.id || `temp-${Date.now()}`,
            numero: selectedNormatividad?.numero || normatividades.length + 1,
            nombre: formData.get('nombre'),
            estado: formData.get('estado'),
            regulador: formData.get('regulador'),
            sanciones: formData.get('sanciones'),
            plazoImplementacion: formData.get('plazoImplementacion'),
            cumplimiento: formData.get('cumplimiento'),
            detalleIncumplimiento: formData.get('detalleIncumplimiento'),
            riesgoIdentificado: formData.get('riesgoIdentificado'),
            clasificacion: formData.get('clasificacion'),
            comentarios: formData.get('comentarios'),
            responsable: formData.get('responsable') || '',
          };

          const updatedList = selectedNormatividad
            ? normatividades.map(n => n.id === newItem.id ? newItem : n)
            : [...normatividades, newItem];

          try {
            setIsSaving(true);
            // Optimistic update
            setNormatividades(updatedList);
            await updateProceso({
              id: String(procesoSeleccionado.id),
              normatividades: updatedList
            }).unwrap();
            setInitialNormatividades(updatedList);
            markAsSaved();
            showSuccess('Normatividad guardada exitosamente');
            setDialogOpen(false);
          } catch {
            showError('Error al guardar normatividad');
          } finally {
            setIsSaving(false);
          }
        }}>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                {selectedNormatividad ? 'Editar Normatividad' : 'Nueva Normatividad'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  onClick={() => {
                    if (isSaving) return;
                    setDialogOpen(false);
                    setCumplimientoSeleccionado('Total');
                  }}
                  size="small"
                  sx={{ ml: 1 }}
                  disabled={isSaving}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  name="nombre"
                  label="Nombre de la Regulación Aplicable"
                  defaultValue={selectedNormatividad?.nombre || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="estado"
                  label="Estado"
                  defaultValue={selectedNormatividad?.estado || 'Existente'}
                  disabled={isReadOnly}
                  variant="outlined"
                >
                  {ESTADOS_NORMATIVIDAD.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <TextField
                  fullWidth
                  name="regulador"
                  label="Regulador"
                  defaultValue={selectedNormatividad?.regulador || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Sanciones Penales/Civiles/Económicas"
                  name="sanciones"
                  multiline
                  rows={3}
                  defaultValue={selectedNormatividad?.sanciones || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  type={usarInputFechaPlazo ? 'date' : 'text'}
                  name="plazoImplementacion"
                  label="Plazo para Implementación"
                  defaultValue={selectedNormatividad?.plazoImplementacion || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                  required={cumplimientoSeleccionado === 'Parcial'}
                  slotProps={usarInputFechaPlazo ? { inputLabel: { shrink: true } } : undefined}
                  helperText={
                    cumplimientoSeleccionado === 'Parcial'
                      ? 'Obligatorio para cumplimiento Parcial'
                      : !usarInputFechaPlazo
                        ? 'Valor heredado en texto. Puede mantenerlo o cambiarlo a fecha.'
                        : ''
                  }
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="cumplimiento"
                  label="Cumplimiento"
                  defaultValue={selectedNormatividad?.cumplimiento || 'Total'}
                  disabled={isReadOnly}
                  variant="outlined"
                  onChange={(e) => setCumplimientoSeleccionado(e.target.value)}
                >
                  {NIVELES_CUMPLIMIENTO.map((nivel) => (
                    <MenuItem key={nivel} value={nivel}>
                      {nivel}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Detalle del Incumplimiento"
                  name="detalleIncumplimiento"
                  multiline
                  rows={3}
                  defaultValue={selectedNormatividad?.detalleIncumplimiento || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                  required={cumplimientoSeleccionado === 'Parcial'}
                  helperText={cumplimientoSeleccionado === 'Parcial' ? 'Obligatorio para cumplimiento Parcial' : ''}
                />
              </Box>
              {cumplimientoSeleccionado === 'Parcial' && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    fullWidth
                    label="Responsable"
                    name="responsable"
                    defaultValue={selectedNormatividad?.responsable || ''}
                    disabled={isReadOnly}
                    variant="outlined"
                    required
                    helperText="Obligatorio para cumplimiento Parcial"
                  />
                </Box>
              )}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Riesgo Identificado"
                  name="riesgoIdentificado"
                  multiline
                  rows={2}
                  defaultValue={selectedNormatividad?.riesgoIdentificado || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="clasificacion"
                  label="Clasificación"
                  defaultValue={selectedNormatividad?.clasificacion || CLASIFICACION_RIESGO.NEGATIVA}
                  disabled={isReadOnly}
                  variant="outlined"
                >
                  <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Riesgo Positivo</MenuItem>
                  <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Riesgo Negativo</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Comentarios Adicionales"
                  name="comentarios"
                  multiline
                  rows={2}
                  defaultValue={selectedNormatividad?.comentarios || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
            </Box>
          </DialogContent>

          {!isReadOnly && (
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => {
                  if (isSaving) return;
                  setDialogOpen(false);
                  setCumplimientoSeleccionado('Total');
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <LoadingActionButton
                variant="contained"
                type="submit"
                loading={isSaving}
                loadingText="Guardando..."
                sx={{
                  background: '#1976d2',
                  color: '#fff',
                  '&:hover': {
                    background: '#1565c0',
                  },
                }}
              >
                Guardar
              </LoadingActionButton>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </AppPageLayout>
    </>
  );
}


