/**
 * Identificación Page
 * List and manage risks - Completa según Excel
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Grid2,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIconSmall,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetRiesgosQuery, useCreateRiesgoMutation, useUpdateRiesgoMutation } from '../api/riesgosApi';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo } from '../../../utils/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useNotification } from '../../../hooks/useNotification';
import type { Riesgo, FiltrosRiesgo, CreateRiesgoDto, CausaRiesgo } from '../types';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';

export default function IdentificacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess, showError } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [clasificacion, setClasificacion] = useState<string>('all');
  const [selectedRiesgo, setSelectedRiesgo] = useState<Riesgo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Causas del Riesgo
  const [causas, setCausas] = useState<CausaRiesgo[]>([]);
  const [causaDialogOpen, setCausaDialogOpen] = useState(false);
  const [causaEditando, setCausaEditando] = useState<CausaRiesgo | null>(null);
  const [nuevaCausa, setNuevaCausa] = useState({
    descripcion: '',
    fuenteCausa: '',
    fuenteCausaHSEQ: '',
    fuenteCausaLAFT: '',
    areasAfectadasHSEQ: '',
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filtros: FiltrosRiesgo = {
    procesoId: procesoSeleccionado?.id,
    busqueda: debouncedSearch,
    clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
  };

  const { data, isLoading } = useGetRiesgosQuery(filtros);
  const [createRiesgo, { isLoading: isCreating }] = useCreateRiesgoMutation();
  const [updateRiesgo, { isLoading: isUpdating }] = useUpdateRiesgoMutation();

  // Form state
  const [formData, setFormData] = useState<CreateRiesgoDto>({
    procesoId: procesoSeleccionado?.id || '',
    descripcion: '',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: procesoSeleccionado?.nombre || '',
    zona: '',
    vicepresidenciaGerenciaAlta: '',
    siglaVicepresidencia: '',
    gerencia: '',
    siglaGerencia: '',
    subdivision: '',
    siglaSubdivision: '',
    macroproceso: '',
    tipologiaNivelI: '',
    tipologiaNivelII: '',
    tipologiaNivelIII: '',
    tipologiaNivelIV: '',
    causaRiesgo: '',
    fuenteCausa: '',
    fuenteCausaHSEQ: '',
    fuenteCausaLAFT: '',
  });

  const columns: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro',
      width: 80,
    },
    {
      field: 'descripcion',
      headerName: 'Descripción del Riesgo',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 200,
      renderCell: (params) => (
        <Chip
          label={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'Positiva' : 'Negativa'}
          size="small"
          color={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'proceso',
      headerName: 'Proceso',
      width: 180,
    },
    {
      field: 'zona',
      headerName: 'Zona',
      width: 150,
    },
    {
      field: 'tipologiaNivelI',
      headerName: 'Tipología I',
      width: 150,
    },
  ];

  const handleRowClick = (params: any) => {
    setSelectedRiesgo(params.row);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRiesgo(null);
  };

  const handleOpenForm = (riesgo?: Riesgo) => {
    if (riesgo) {
      setIsEditing(true);
      setFormData({
        procesoId: riesgo.procesoId,
        descripcion: riesgo.descripcion,
        clasificacion: riesgo.clasificacion,
        proceso: riesgo.proceso,
        zona: riesgo.zona,
        vicepresidenciaGerenciaAlta: riesgo.vicepresidenciaGerenciaAlta || '',
        siglaVicepresidencia: riesgo.siglaVicepresidencia || '',
        gerencia: riesgo.gerencia || '',
        siglaGerencia: riesgo.siglaGerencia || '',
        subdivision: riesgo.subdivision || '',
        siglaSubdivision: riesgo.siglaSubdivision || '',
        macroproceso: riesgo.macroproceso || '',
        tipologiaNivelI: riesgo.tipologiaNivelI || '',
        tipologiaNivelII: riesgo.tipologiaNivelII || '',
        tipologiaNivelIII: riesgo.tipologiaNivelIII || '',
        tipologiaNivelIV: riesgo.tipologiaNivelIV || '',
        causaRiesgo: riesgo.causaRiesgo || '',
        fuenteCausa: riesgo.fuenteCausa || '',
        fuenteCausaHSEQ: riesgo.fuenteCausaHSEQ || '',
        fuenteCausaLAFT: riesgo.fuenteCausaLAFT || '',
      });
      setSelectedRiesgo(riesgo);
      // TODO: Cargar causas desde API cuando esté disponible
      setCausas([]);
    } else {
      setIsEditing(false);
      setFormData({
        procesoId: procesoSeleccionado?.id || '',
        descripcion: '',
        clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
        proceso: procesoSeleccionado?.nombre || '',
        zona: '',
        vicepresidenciaGerenciaAlta: '',
        siglaVicepresidencia: '',
        gerencia: '',
        siglaGerencia: '',
        subdivision: '',
        siglaSubdivision: '',
        macroproceso: '',
        tipologiaNivelI: '',
        tipologiaNivelII: '',
        tipologiaNivelIII: '',
        tipologiaNivelIV: '',
        causaRiesgo: '',
        fuenteCausa: '',
        fuenteCausaHSEQ: '',
        fuenteCausaLAFT: '',
      });
      setSelectedRiesgo(null);
      setCausas([]);
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedRiesgo(null);
    setIsEditing(false);
    setCausas([]);
  };

  const handleAgregarCausa = () => {
    if (!nuevaCausa.descripcion.trim()) {
      showError('La descripción de la causa es requerida');
      return;
    }

    const causa: CausaRiesgo = {
      id: `causa-${Date.now()}`,
      riesgoId: selectedRiesgo?.id || formData.procesoId,
      descripcion: nuevaCausa.descripcion,
      fuenteCausa: nuevaCausa.fuenteCausa || undefined,
      fuenteCausaHSEQ: nuevaCausa.fuenteCausaHSEQ || undefined,
      fuenteCausaLAFT: nuevaCausa.fuenteCausaLAFT || undefined,
      areasAfectadasHSEQ: nuevaCausa.areasAfectadasHSEQ || undefined,
    };

    if (causaEditando) {
      setCausas(causas.map((c) => (c.id === causaEditando.id ? { ...causa, id: causaEditando.id } : c)));
      showSuccess('Causa actualizada exitosamente');
    } else {
      setCausas([...causas, causa]);
      showSuccess('Causa agregada exitosamente');
    }

    setCausaDialogOpen(false);
    setCausaEditando(null);
    setNuevaCausa({
      descripcion: '',
      fuenteCausa: '',
      fuenteCausaHSEQ: '',
      fuenteCausaLAFT: '',
      areasAfectadasHSEQ: '',
    });
  };

  const handleEditarCausa = (causa: CausaRiesgo) => {
    setCausaEditando(causa);
    setNuevaCausa({
      descripcion: causa.descripcion,
      fuenteCausa: causa.fuenteCausa || '',
      fuenteCausaHSEQ: causa.fuenteCausaHSEQ || '',
      fuenteCausaLAFT: causa.fuenteCausaLAFT || '',
      areasAfectadasHSEQ: causa.areasAfectadasHSEQ || '',
    });
    setCausaDialogOpen(true);
  };

  const handleEliminarCausa = (causaId: string) => {
    setCausas(causas.filter((c) => c.id !== causaId));
    showSuccess('Causa eliminada exitosamente');
  };

  const handleSave = async () => {
    if (!formData.descripcion.trim()) {
      showError('La descripción del riesgo es requerida');
      return;
    }
    if (!formData.zona.trim()) {
      showError('La zona es requerida');
      return;
    }

    try {
      if (isEditing && selectedRiesgo) {
        await updateRiesgo({
          id: selectedRiesgo.id,
          ...formData,
        }).unwrap();
        showSuccess('Riesgo actualizado exitosamente');
      } else {
        await createRiesgo(formData).unwrap();
        showSuccess('Riesgo creado exitosamente');
      }
      handleCloseForm();
    } catch (error) {
      showError(isEditing ? 'Error al actualizar el riesgo' : 'Error al crear el riesgo');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">Por favor seleccione un proceso desde el Dashboard</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Identificación de Riesgos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Catálogo completo de riesgos identificados - Estructura según Excel
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip icon={<EditIcon />} label="Modo Edición" color="warning" sx={{ fontWeight: 600 }} />
          )}
          {!isReadOnly && (
            <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => handleOpenForm()}>
          Nuevo Riesgo
        </Button>
          )}
        </Box>
      </Box>
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Está en modo visualización. Solo puede ver la información.
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <TextField
            fullWidth
            label="Buscar riesgos"
            placeholder="Buscar por descripción, proceso, zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isReadOnly}
          />
        </Box>
        <Box sx={{ flex: '0 1 200px', minWidth: 200 }}>
          <TextField
            fullWidth
            select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value)}
            disabled={isReadOnly}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
            <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Data Grid */}
      <AppDataGrid
        rows={data?.data || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detalles del Riesgo</Typography>
            {!isReadOnly && selectedRiesgo && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleCloseDetails();
                  handleOpenForm(selectedRiesgo);
                }}
              >
                Editar
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRiesgo && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    IDENTIFICACIÓN DEL RIESGO
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid2 container spacing={2}>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        ID RIESGO
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedRiesgo.numero}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Nro.
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.numero}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Vicepresidencia/Gerencia Alta
                      </Typography>
                      <Typography variant="body1">
                        {selectedRiesgo.vicepresidenciaGerenciaAlta || '-'}
                      </Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Sigla (Vicepresidencia)
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.siglaVicepresidencia || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Gerencia
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.gerencia || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Sigla (Gerencia)
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.siglaGerencia || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Subdivisión
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.subdivision || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Sigla (Subdivisión)
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.siglaSubdivision || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Zona
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.zona}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Proceso
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.proceso}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">
                        Macroproceso
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.macroproceso || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Descripción del Riesgo
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRiesgo.descripcion}
              </Typography>
                    </Grid2>
                    <Grid2 xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Causas del Riesgo
                      </Typography>
                      {/* TODO: Cargar causas desde API cuando esté disponible */}
                      {selectedRiesgo.causaRiesgo ? (
                        <Box>
                          <Typography variant="body2" paragraph>
                            <strong>Causa:</strong> {selectedRiesgo.causaRiesgo}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Fuente:</strong> {selectedRiesgo.fuenteCausa || '-'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Fuente HSEQ:</strong> {selectedRiesgo.fuenteCausaHSEQ || '-'}
                          </Typography>
                          <Typography variant="body2" paragraph>
                            <strong>Fuente LAFT:</strong> {selectedRiesgo.fuenteCausaLAFT || '-'}
                          </Typography>
                        </Box>
                      ) : (
                        <Alert severity="info">No hay causas registradas para este riesgo.</Alert>
                      )}
                    </Grid2>
                    <Grid2 xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Clasificación
                  </Typography>
                      <Chip
                        label={selectedRiesgo.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Positiva' : 'Negativa'}
                        size="small"
                        color={selectedRiesgo.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                      />
                    </Grid2>
                    <Grid2 xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                    Tipología Nivel I
                  </Typography>
                      <Typography variant="body1">{selectedRiesgo.tipologiaNivelI || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tipología Nivel II
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.tipologiaNivelII || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tipología Nivel III
                      </Typography>
                      <Typography variant="body1">{selectedRiesgo.tipologiaNivelIII || '-'}</Typography>
                    </Grid2>
                    <Grid2 xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Tipología Nivel IV
                  </Typography>
                      <Typography variant="body1">{selectedRiesgo.tipologiaNivelIV || '-'}</Typography>
                    </Grid2>
                  </Grid2>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Editar Riesgo' : 'Nuevo Riesgo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              IDENTIFICACIÓN DEL RIESGO
            </Typography>
            <Divider />

            {/* Estructura Organizacional */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Estructura Organizacional
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Vicepresidencia/Gerencia Alta"
                  value={formData.vicepresidenciaGerenciaAlta}
                  onChange={(e) => setFormData({ ...formData, vicepresidenciaGerenciaAlta: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Sigla (Vicepresidencia)"
                  value={formData.siglaVicepresidencia}
                  onChange={(e) => setFormData({ ...formData, siglaVicepresidencia: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Gerencia"
                  value={formData.gerencia}
                  onChange={(e) => setFormData({ ...formData, gerencia: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Sigla (Gerencia)"
                  value={formData.siglaGerencia}
                  onChange={(e) => setFormData({ ...formData, siglaGerencia: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Subdivisión"
                  value={formData.subdivision}
                  onChange={(e) => setFormData({ ...formData, subdivision: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Sigla (Subdivisión)"
                  value={formData.siglaSubdivision}
                  onChange={(e) => setFormData({ ...formData, siglaSubdivision: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Zona *"
                  value={formData.zona}
                  onChange={(e) => setFormData({ ...formData, zona: e.target.value })}
                  required
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Proceso"
                  value={formData.proceso}
                  disabled
                  helperText="Se asigna automáticamente desde el proceso seleccionado"
                />
                <TextField
                  fullWidth
                  label="Macroproceso"
                  value={formData.macroproceso}
                  onChange={(e) => setFormData({ ...formData, macroproceso: e.target.value })}
                  disabled={isReadOnly}
                />
              </Box>
            </Box>

            <Divider />

            {/* Información del Riesgo */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Información del Riesgo
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Descripción del Riesgo *"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  multiline
                  rows={4}
                  required
                  disabled={isReadOnly}
                />
                <FormControl fullWidth required disabled={isReadOnly}>
                  <InputLabel>Clasificación *</InputLabel>
                  <Select
                    value={formData.clasificacion}
                    onChange={(e) =>
                      setFormData({ ...formData, clasificacion: e.target.value as ClasificacionRiesgo })
                    }
                    label="Clasificación *"
                  >
                    <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Riesgo con consecuencia negativa</MenuItem>
                    <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Riesgo con consecuencia positiva (Oportunidad)</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Tipología Nivel I"
                  value={formData.tipologiaNivelI}
                  onChange={(e) => setFormData({ ...formData, tipologiaNivelI: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Tipología Nivel II"
                  value={formData.tipologiaNivelII}
                  onChange={(e) => setFormData({ ...formData, tipologiaNivelII: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Tipología Nivel III"
                  value={formData.tipologiaNivelIII}
                  onChange={(e) => setFormData({ ...formData, tipologiaNivelIII: e.target.value })}
                  disabled={isReadOnly}
                />
                <TextField
                  fullWidth
                  label="Tipología Nivel IV"
                  value={formData.tipologiaNivelIV}
                  onChange={(e) => setFormData({ ...formData, tipologiaNivelIV: e.target.value })}
                  disabled={isReadOnly}
                />
              </Box>
            </Box>

            <Divider />

            {/* Causas del Riesgo */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Causas del Riesgo
                </Typography>
                {!isReadOnly && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCausaEditando(null);
                      setNuevaCausa({
                        descripcion: '',
                        fuenteCausa: '',
                        fuenteCausaHSEQ: '',
                        fuenteCausaLAFT: '',
                        areasAfectadasHSEQ: '',
                      });
                      setCausaDialogOpen(true);
                    }}
                  >
                    Agregar Causa
                  </Button>
                )}
              </Box>
              {causas.length === 0 ? (
                <Alert severity="info">
                  No hay causas registradas. Agregue una causa para comenzar.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Fuente de Causa</TableCell>
                        <TableCell>Fuente HSEQ</TableCell>
                        <TableCell>Fuente LAFT</TableCell>
                        <TableCell>Áreas Afectadas HSEQ</TableCell>
                        {!isReadOnly && (
                          <TableCell align="right" width={100}>
                            Acciones
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {causas.map((causa) => (
                        <TableRow key={causa.id}>
                          <TableCell>{causa.descripcion}</TableCell>
                          <TableCell>{causa.fuenteCausa || '-'}</TableCell>
                          <TableCell>{causa.fuenteCausaHSEQ || '-'}</TableCell>
                          <TableCell>{causa.fuenteCausaLAFT || '-'}</TableCell>
                          <TableCell>{causa.areasAfectadasHSEQ || '-'}</TableCell>
                          {!isReadOnly && (
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleEditarCausa(causa)}
                                color="primary"
                              >
                                <EditIconSmall fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEliminarCausa(causa.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Cancelar</Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para Agregar/Editar Causa */}
      <Dialog open={causaDialogOpen} onClose={() => setCausaDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa del Riesgo' : 'Agregar Causa del Riesgo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Descripción de la Causa *"
              value={nuevaCausa.descripcion}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, descripcion: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
              disabled={isReadOnly}
            />
            <FormControl fullWidth disabled={isReadOnly}>
              <InputLabel>Fuente de Causa de Riesgo</InputLabel>
              <Select
                value={nuevaCausa.fuenteCausa}
                onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausa: e.target.value })}
                label="Fuente de Causa de Riesgo"
              >
                <MenuItem value="">-</MenuItem>
                <MenuItem value="Personas">Personas</MenuItem>
                <MenuItem value="Proceso">Proceso</MenuItem>
                <MenuItem value="Tecnología">Tecnología</MenuItem>
                <MenuItem value="Externo">Externo</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fuente de Causa de Riesgo (Salud Ocupacional/Ambiental)"
              value={nuevaCausa.fuenteCausaHSEQ}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausaHSEQ: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />
            <TextField
              label="Fuente de Causa de Riesgo LAFT"
              value={nuevaCausa.fuenteCausaLAFT}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, fuenteCausaLAFT: e.target.value })}
              fullWidth
              disabled={isReadOnly}
            />
            <TextField
              label="Áreas a las que Afecta el Riesgo (Salud Ocupacional/Ambiental)"
              value={nuevaCausa.areasAfectadasHSEQ}
              onChange={(e) => setNuevaCausa({ ...nuevaCausa, areasAfectadasHSEQ: e.target.value })}
              fullWidth
              multiline
              rows={2}
              disabled={isReadOnly}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCausaDialogOpen(false)}>Cancelar</Button>
          {!isReadOnly && (
            <Button onClick={handleAgregarCausa} variant="contained" startIcon={<SaveIcon />}>
              {causaEditando ? 'Actualizar' : 'Agregar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
