/**
 * Medidas de Administración Page
 * Página para gestionar medidas de administración de riesgos estratégicos positivos.
 * Conectado al backend a través de RTK Query.
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Collapse,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import {
  useGetRiesgosQuery,
  useGetMedidasAdministracionQuery,
  useCreateMedidaAdministracionMutation,
  useUpdateMedidaAdministracionMutation,
  useDeleteMedidaAdministracionMutation,
} from '../../api/services/riesgosApi';
import { CLASIFICACION_RIESGO } from '../../utils/constants';

// ============================================================
// Interfaces locales
// ============================================================

interface FormMedida {
  descripcion: string;
  afecta: 'Frecuencia' | 'Impacto' | 'Ambas';
  presupuesto: 'Si' | 'No' | 'Parcial';
  stakeholders: 'Positiva' | 'Neutral' | 'Negativa';
  entrenamiento: 'Si' | 'No' | 'Parcial';
  politicas: 'Si' | 'No' | 'Parcial';
  monitoreo: 'Si' | 'No' | 'Parcial';
  responsable: string;
}

const FORM_DEFAULT: FormMedida = {
  descripcion: '',
  afecta: 'Ambas',
  presupuesto: 'Si',
  stakeholders: 'Positiva',
  entrenamiento: 'Si',
  politicas: 'Si',
  monitoreo: 'Si',
  responsable: '',
};

// ============================================================
// Componente de fila de causa con sus medidas
// ============================================================

function CausaRow({ causa }: { causa: any }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detallesOpen, setDetallesOpen] = useState(false);
  const [medidaSeleccionada, setMedidaSeleccionada] = useState<any>(null);
  const [editingMedida, setEditingMedida] = useState<any>(null);
  const [formData, setFormData] = useState<FormMedida>(FORM_DEFAULT);
  const [error, setError] = useState<string | null>(null);

  const { data: medidas = [], isLoading: loadingMedidas } = useGetMedidasAdministracionQuery(
    { causaRiesgoId: causa.id },
    { skip: !causa.id }
  );

  const [createMedida, { isLoading: creating }] = useCreateMedidaAdministracionMutation();
  const [updateMedida, { isLoading: updating }] = useUpdateMedidaAdministracionMutation();
  const [deleteMedida] = useDeleteMedidaAdministracionMutation();

  const isSaving = creating || updating;

  const handleOpenCreate = () => {
    setEditingMedida(null);
    setFormData(FORM_DEFAULT);
    setError(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (medida: any) => {
    setEditingMedida(medida);
    setFormData({
      descripcion: medida.descripcion ?? '',
      afecta: medida.afecta ?? 'Ambas',
      presupuesto: medida.presupuesto ?? 'Si',
      stakeholders: medida.stakeholders ?? 'Positiva',
      entrenamiento: medida.entrenamiento ?? 'Si',
      politicas: medida.politicas ?? 'Si',
      monitoreo: medida.monitoreo ?? 'Si',
      responsable: medida.responsable ?? '',
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleOpenDetalles = (medida: any) => {
    setMedidaSeleccionada(medida);
    setDetallesOpen(true);
  };

  const handleCloseDetalles = () => {
    setDetallesOpen(false);
    setMedidaSeleccionada(null);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingMedida(null);
    setFormData(FORM_DEFAULT);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.descripcion.trim()) {
      setError('La descripción es requerida.');
      return;
    }
    try {
      const payload = {
        causaRiesgoId: Number(causa.id),
        descripcion: formData.descripcion.trim(),
        afecta: formData.afecta,
        presupuesto: formData.presupuesto,
        stakeholders: formData.stakeholders,
        entrenamiento: formData.entrenamiento,
        politicas: formData.politicas,
        monitoreo: formData.monitoreo,
        responsable: formData.responsable || undefined,
      };
      if (editingMedida) {
        await updateMedida({ id: editingMedida.id, ...payload }).unwrap();
      } else {
        await createMedida(payload).unwrap();
      }
      handleClose();
    } catch (err: any) {
      setError(err?.data?.error ?? 'Error al guardar la medida. Intente de nuevo.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta medida de administración?')) return;
    try {
      await deleteMedida(id).unwrap();
    } catch {
      /* silencio */
    }
  };

  const calcularEvaluacion = (): string => {
    const puntajes: Record<string, Record<string, number>> = {
      presupuesto: { Si: 1.0, Parcial: 0.4, No: 0.0 },
      stakeholders: { Positiva: 1.0, Neutral: 0.8, Negativa: 0.0 },
      entrenamiento: { Si: 1.0, Parcial: 0.4, No: 0.0 },
      politicas: { Si: 1.0, Parcial: 0.4, No: 0.0 },
      monitoreo: { Si: 1.0, Parcial: 0.4, No: 0.0 },
    };
    const AY =
      (puntajes.presupuesto[formData.presupuesto] ?? 0) * 0.2 +
      (puntajes.stakeholders[formData.stakeholders] ?? 0) * 0.2 +
      (puntajes.entrenamiento[formData.entrenamiento] ?? 0) * 0.2 +
      (puntajes.politicas[formData.politicas] ?? 0) * 0.2 +
      (puntajes.monitoreo[formData.monitoreo] ?? 0) * 0.2;

    if (AY >= 0.8) return 'Altamente Efectiva';
    if (AY >= 0.61) return 'Efectiva';
    if (AY >= 0.33) return 'Medianamente Efectiva';
    if (AY >= 0.2) return 'Baja Efectividad';
    return 'Inefectiva';
  };

  const evaluacionColor = (ev: string): 'success' | 'warning' | 'error' | 'default' => {
    if (ev === 'Altamente Efectiva' || ev === 'Efectiva') return 'success';
    if (ev === 'Medianamente Efectiva') return 'warning';
    return 'error';
  };

  return (
    <>
      <TableRow>
        <TableCell sx={{ maxWidth: 400 }}>{causa.descripcion}</TableCell>
        <TableCell align="center">
          {loadingMedidas ? (
            <CircularProgress size={16} />
          ) : medidas.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
              {medidas.map((m: any) => (
                <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip
                    label={m.evaluacion ?? '—'}
                    color={evaluacionColor(m.evaluacion ?? '')}
                    size="small"
                    onClick={() => handleOpenDetalles(m)}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Tooltip title="Editar medida">
                    <IconButton size="small" onClick={() => handleOpenEdit(m)}>
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar medida">
                    <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sin medidas
            </Typography>
          )}
        </TableCell>
        <TableCell align="center">
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Nueva medida
          </Button>
        </TableCell>
      </TableRow>

      {/* Dialog crear/editar medida */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMedida ? 'Editar Medida de Administración' : 'Nueva Medida de Administración'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Descripción de la Medida"
              fullWidth
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Describe la medida de administración vigente..."
              required
            />

            <FormControl fullWidth>
              <InputLabel>Afecta la Frecuencia, el Impacto, o Ambas</InputLabel>
              <Select
                value={formData.afecta}
                label="Afecta la Frecuencia, el Impacto, o Ambas"
                onChange={(e) => setFormData({ ...formData, afecta: e.target.value as any })}
              >
                <MenuItem value="Frecuencia">Frecuencia</MenuItem>
                <MenuItem value="Impacto">Impacto</MenuItem>
                <MenuItem value="Ambas">Ambas</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>¿Cuenta con Presupuesto/Recursos aprobados?</InputLabel>
              <Select
                value={formData.presupuesto}
                label="¿Cuenta con Presupuesto/Recursos aprobados?"
                onChange={(e) => setFormData({ ...formData, presupuesto: e.target.value as any })}
              >
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Parcial">Parcial</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Actitud de los principales Stakeholders</InputLabel>
              <Select
                value={formData.stakeholders}
                label="Actitud de los principales Stakeholders"
                onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value as any })}
              >
                <MenuItem value="Positiva">Positiva</MenuItem>
                <MenuItem value="Neutral">Neutral</MenuItem>
                <MenuItem value="Negativa">Negativa</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>¿Los funcionarios están entrenados?</InputLabel>
              <Select
                value={formData.entrenamiento}
                label="¿Los funcionarios están entrenados?"
                onChange={(e) => setFormData({ ...formData, entrenamiento: e.target.value as any })}
              >
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Parcial">Parcial</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>¿Cuenta con políticas/procedimientos que la soporten?</InputLabel>
              <Select
                value={formData.politicas}
                label="¿Cuenta con políticas/procedimientos que la soporten?"
                onChange={(e) => setFormData({ ...formData, politicas: e.target.value as any })}
              >
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Parcial">Parcial</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>¿Cuenta con mecanismos de monitoreo?</InputLabel>
              <Select
                value={formData.monitoreo}
                label="¿Cuenta con mecanismos de monitoreo?"
                onChange={(e) => setFormData({ ...formData, monitoreo: e.target.value as any })}
              >
                <MenuItem value="Si">Sí</MenuItem>
                <MenuItem value="No">No</MenuItem>
                <MenuItem value="Parcial">Parcial</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Responsable (opcional)"
              fullWidth
              value={formData.responsable}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            />

            <Alert severity="info">
              <Typography variant="body2" fontWeight={600}>
                Evaluación calculada: <strong>{calcularEvaluacion()}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Esta evaluación se recalculará automáticamente al guardar.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} /> : undefined}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalles de la medida */}
      <Dialog open={detallesOpen} onClose={handleCloseDetalles} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalles de la Medida de Administración
        </DialogTitle>
        <DialogContent>
          {medidaSeleccionada && (
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Descripción */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Descripción
                </Typography>
                <Typography variant="body1">
                  {medidaSeleccionada.descripcion}
                </Typography>
              </Box>

              {/* Evaluación y Factor de Reducción */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Evaluación
                  </Typography>
                  <Chip
                    label={medidaSeleccionada.evaluacion ?? '—'}
                    color={evaluacionColor(medidaSeleccionada.evaluacion ?? '')}
                    size="medium"
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Factor de Reducción
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {medidaSeleccionada.factorReduccion 
                      ? `${(medidaSeleccionada.factorReduccion * 100).toFixed(0)}%`
                      : '—'}
                  </Typography>
                </Box>
              </Box>

              {/* Afecta */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Afecta
                </Typography>
                <Chip label={medidaSeleccionada.afecta ?? '—'} size="small" variant="outlined" />
              </Box>

              {/* Criterios de Evaluación */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Criterios de Evaluación
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Presupuesto/Recursos:</Typography>
                    <Chip 
                      label={medidaSeleccionada.presupuesto ?? '—'} 
                      size="small" 
                      color={medidaSeleccionada.presupuesto === 'Si' ? 'success' : medidaSeleccionada.presupuesto === 'Parcial' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Actitud de Stakeholders:</Typography>
                    <Chip 
                      label={medidaSeleccionada.stakeholders ?? '—'} 
                      size="small"
                      color={medidaSeleccionada.stakeholders === 'Positiva' ? 'success' : medidaSeleccionada.stakeholders === 'Neutral' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Entrenamiento:</Typography>
                    <Chip 
                      label={medidaSeleccionada.entrenamiento ?? '—'} 
                      size="small"
                      color={medidaSeleccionada.entrenamiento === 'Si' ? 'success' : medidaSeleccionada.entrenamiento === 'Parcial' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Políticas/Procedimientos:</Typography>
                    <Chip 
                      label={medidaSeleccionada.politicas ?? '—'} 
                      size="small"
                      color={medidaSeleccionada.politicas === 'Si' ? 'success' : medidaSeleccionada.politicas === 'Parcial' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Monitoreo:</Typography>
                    <Chip 
                      label={medidaSeleccionada.monitoreo ?? '—'} 
                      size="small"
                      color={medidaSeleccionada.monitoreo === 'Si' ? 'success' : medidaSeleccionada.monitoreo === 'Parcial' ? 'warning' : 'default'}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Puntaje Total */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Puntaje Total (AY)
                </Typography>
                <Typography variant="h6" color="primary">
                  {medidaSeleccionada.puntajeTotal?.toFixed(2) ?? '—'}
                </Typography>
              </Box>

              {/* Responsable */}
              {medidaSeleccionada.responsable && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Responsable
                  </Typography>
                  <Typography variant="body1">
                    {medidaSeleccionada.responsable}
                  </Typography>
                </Box>
              )}

              {/* Fechas */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body2">
                    {medidaSeleccionada.fechaCreacion 
                      ? new Date(medidaSeleccionada.fechaCreacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '—'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Última Actualización
                  </Typography>
                  <Typography variant="body2">
                    {medidaSeleccionada.fechaActualizacion 
                      ? new Date(medidaSeleccionada.fechaActualizacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetalles}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              handleCloseDetalles();
              handleOpenEdit(medidaSeleccionada);
            }}
            startIcon={<EditIcon />}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ============================================================
// Página Principal
// ============================================================

export default function MedidasAdministracionPage() {
  const { procesoSeleccionado } = useProceso();
  const [expandedRiesgo, setExpandedRiesgo] = useState<number | null>(null);

  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    {
      procesoId: procesoSeleccionado?.id,
      clasificacion: CLASIFICACION_RIESGO.POSITIVA,
      includeCausas: true,
      pageSize: 100,
    },
    { skip: !procesoSeleccionado }
  );

  const riesgos = riesgosData?.data ?? [];

  const handleExpandRiesgo = (riesgoId: number) => {
    setExpandedRiesgo(expandedRiesgo === riesgoId ? null : riesgoId);
  };

  if (!procesoSeleccionado) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Seleccione un proceso para gestionar las medidas de administración.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Medidas de Administración
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Gestión de medidas de administración para riesgos estratégicos positivos del proceso:{' '}
        <strong>{procesoSeleccionado.nombre}</strong>
      </Typography>

      {loadingRiesgos && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loadingRiesgos && riesgos.length === 0 && (
        <Alert severity="info">
          No hay riesgos positivos (oportunidades) registrados para este proceso.
        </Alert>
      )}

      {riesgos.map((riesgo: any) => {
        const causas: any[] = riesgo.causas ?? [];
        return (
          <Card key={riesgo.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton size="small" onClick={() => handleExpandRiesgo(Number(riesgo.id))}>
                    {expandedRiesgo === Number(riesgo.id) ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                  <Typography variant="h6" fontWeight={600}>
                    {riesgo.numeroIdentificacion ?? `R${riesgo.numero}`}
                  </Typography>
                </Box>
                <Chip
                  label={riesgo.evaluacion?.nivelRiesgo ?? 'Sin evaluar'}
                  color={
                    riesgo.evaluacion?.nivelRiesgo === 'Crítico'
                      ? 'error'
                      : riesgo.evaluacion?.nivelRiesgo === 'Alto'
                      ? 'warning'
                      : 'default'
                  }
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, ml: 6 }}>
                {riesgo.descripcion}
              </Typography>

              <Collapse in={expandedRiesgo === Number(riesgo.id)}>
                {causas.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Este riesgo no tiene causas registradas.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                          <TableCell>
                            <strong>Causa del riesgo</strong>
                          </TableCell>
                          <TableCell align="center">
                            <strong>Medidas de Administración</strong>
                          </TableCell>
                          <TableCell align="center">
                            <strong>Acciones</strong>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {causas.map((causa: any) => (
                          <CausaRow key={causa.id} causa={causa} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
