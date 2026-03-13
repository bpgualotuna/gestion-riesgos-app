/**
 * Normatividad Page
 * Inventario de Normatividad seg?n an?lisis Excel
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
import { Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '56px 1fr 100px 120px 100px 90px auto' }, gap: 1.5, alignItems: 'center' }}>
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

  // Handlers para el di?logo de cambios no guardados
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
          <Alert severity="info" variant="outlined">No hay un proceso seleccionado. Por favor selecciona un proceso de la lista en la parte superior para cargar el inventario de normatividad.</Alert>
        </Box>
      </AppPageLayout>
    );
  }

  return (
    <>
      {/* Di\u00e1logo de cambios no guardados */}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardChanges}
        onCancel={() => blocker.reset?.()}
        isSaving={isSaving}
        message="Tiene cambios sin guardar en el inventario de normatividad."
        description={"\u00bfDesea guardar los cambios antes de salir?"}
      />

      <AppPageLayout
      title="Inventario de Normatividad"
      description={"Cat\u00e1logo de normativas aplicables al proceso"}
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label={"Modo Visualizaci\u00f3n"}
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip
              icon={<EditIcon />}
              label={"Modo Edici\u00f3n"}
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedNormatividad(null);
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
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Est? en modo visualizaci?n. Solo puede ver la informaci?n.
          </Alert>
        )
      }
    >
      {/* Lista con encabezados, ordenaci?n y paginaci?n */}
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {/* Encabezados con ordenaci?n */}
        {normatividades.length > 0 && (
          <Box
            sx={{
              display: { xs: 'none', sm: 'grid' },
              gridTemplateColumns: '56px 1fr 100px 120px 100px 90px auto',
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
              <Typography variant="caption" fontWeight={700} color="text.secondary" noWrap>Nombre regulaci{"\u00f3"}n</Typography>
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
            <Box component="button" onClick={() => handleSort('cumplimiento')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Cumplimiento</Typography>
              {sortField === 'cumplimiento' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box component="button" onClick={() => handleSort('clasificacion')} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: 0, background: 'none', cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">Clasificaci{"\u00f3"}n</Typography>
              {sortField === 'clasificacion' ? (sortDir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />) : null}
            </Box>
            <Box />
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
            <Alert severity="info">No hay normatividades registradas. Agregue una con el bot{"\u00f3"}n &quot;Nueva Normatividad&quot;.</Alert>
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

      {/* Di\u00e1logo de Detalle (Solo lectura) */}
      <Dialog open={dialogDetalleOpen} onClose={() => setDialogDetalleOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 640 } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Detalle de Normatividad
            </Typography>
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
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNormatividad && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Nombre de la Regulaci?n Aplicable
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
                  Sanciones Penales/Civiles/Econ?micas
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedNormatividad.sanciones || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Plazo para Implementaci?n
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
                  Clasificaci{"\u00f3"}n
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
        <DialogActions>
          <Button onClick={() => setDialogDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Di\u00e1logo de Edici\u00f3n/Creaci\u00f3n */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 640 } }}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!procesoSeleccionado) return;
          const formData = new FormData(e.currentTarget);
          const newItem: any = {
            id: selectedNormatividad?.id || `temp-${Date.now()}`,
            numero: normatividades.length + 1, // Simple auto-increment for new
            ...selectedNormatividad, // Keep existing ID if editing
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
            {selectedNormatividad ? 'Editar Normatividad' : 'Nueva Normatividad'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  name="nombre"
                  label="Nombre de la Regulaci?n Aplicable"
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
                  label="Sanciones Penales/Civiles/Econ?micas"
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
                  name="plazoImplementacion"
                  label="Plazo para Implementaci?n"
                  defaultValue={selectedNormatividad?.plazoImplementacion || ''}
                  disabled={isReadOnly}
                  variant="outlined"
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
                />
              </Box>
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
                  label={"Clasificaci\u00f3n"}
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
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
            {!isReadOnly && (
              <Button
                variant="contained"
                type="submit"
                sx={{
                  background: '#1976d2',
                  color: '#fff',
                }}
              >
                Guardar
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </AppPageLayout>
    </>
  );
}


