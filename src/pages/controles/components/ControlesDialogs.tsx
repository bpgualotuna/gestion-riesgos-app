import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Shield as ShieldIcon,
  Assignment as AssignmentIcon,
  Save as SaveIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';
import { formatDateISO } from '../../../utils/formatters';

interface CausaDetalleDialogProps {
  open: boolean;
  onClose: () => void;
  causaDetalleView: any;
  itemDetalle: any;
  onEdit: (riesgoId: string, causa: any) => void;
  muestraBloqueControlEnDetalle: boolean;
  ctrlDetalleDialog: any;
}

export const CausaDetalleDialog = ({
  open,
  onClose,
  causaDetalleView,
  itemDetalle,
  onEdit,
  muestraBloqueControlEnDetalle,
  ctrlDetalleDialog
}: CausaDetalleDialogProps) => {
  if (!itemDetalle) return null;

  const tu = String(itemDetalle.tipo || '').toUpperCase();
  const isControl = tu === 'CONTROL' || tu === 'AMBOS';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxWidth: 560 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {isControl ? 'Detalle del Control' : 'Detalle del Plan de Acción'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              <Chip
                label={tu === 'CONTROL' ? 'Control' : tu === 'AMBOS' ? 'Control y Plan de Acción' : 'Plan de Acción'}
                color={tu === 'CONTROL' ? 'primary' : tu === 'AMBOS' ? 'secondary' : 'info'}
                size="small"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button variant="contained" color="primary" onClick={() => onEdit(causaDetalleView.riesgoId, causaDetalleView.causa)}>
              Editar
            </Button>
            <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box>
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Causa Original</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>{itemDetalle.descripcion ?? causaDetalleView?.causa?.descripcion ?? 'Sin descripción'}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box><Typography variant="caption" color="text.secondary">Fuente</Typography><Typography variant="body2">{itemDetalle.fuenteCausa ?? causaDetalleView?.causa?.fuenteCausa ?? 'N/A'}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Frecuencia</Typography><Typography variant="body2">{itemDetalle.frecuencia ?? causaDetalleView?.causa?.frecuencia ?? 'N/A'}</Typography></Box>
            </Box>
          </Box>

          {muestraBloqueControlEnDetalle && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Información del Control</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Descripción del Control</Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {repairSpanishDisplayArtifacts(itemDetalle.controlDescripcion || itemDetalle.gestion?.controlDescripcion || ctrlDetalleDialog?.descripcionControl || 'Sin descripción')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Tipo de Control</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>{itemDetalle.controlTipo || ctrlDetalleDialog?.tipoControl || 'N/A'}</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Evaluación del Control</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Efectividad</Typography><Typography variant="body2" fontWeight={600}>{itemDetalle.evaluacionDefinitiva || 'Sin evaluar'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Puntaje Total</Typography><Typography variant="body2" fontWeight={600}>{itemDetalle.puntajeTotal || 'N/A'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">% Mitigación</Typography><Typography variant="body2" fontWeight={600} color="primary">{itemDetalle.porcentajeMitigacion ? `${(itemDetalle.porcentajeMitigacion > 1 ? itemDetalle.porcentajeMitigacion : itemDetalle.porcentajeMitigacion * 100).toFixed(0)}%` : 'N/A'}</Typography></Box>
                </Box>
              </Box>
            </Box>
          )}

          {(tu === 'PLAN' || tu === 'AMBOS' || !!itemDetalle.planDescripcion) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Información del Plan de Acción</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Descripción detallada</Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{itemDetalle.planDetalle || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Responsable</Typography><Typography variant="body2">{itemDetalle.planResponsable || 'N/A'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Fecha Estimada</Typography><Typography variant="body2">{formatDateISO(itemDetalle.planFechaEstimada) || 'N/A'}</Typography></Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

interface GestionFormDialogProps {
  open: boolean;
  onClose: () => void;
  dialogMode: 'view' | 'edit' | 'create';
  tipoClasificacion: string;
  causaEnEdicion: any;
  getRiesgoNombre: (id: string) => string;
  criteriosEvaluacion: any;
  setCriteriosEvaluacion: (val: any) => void;
  formPlan: any;
  setFormPlan: (val: any) => void;
  onSave: () => void;
  calcularPuntajeControl: any;
  getEvaluacionPreliminarFromRangos: any;
  determinarEvaluacionDefinitiva: any;
  configResidual: any;
}

export const GestionFormDialog = ({
  open,
  onClose,
  dialogMode,
  tipoClasificacion,
  causaEnEdicion,
  getRiesgoNombre,
  criteriosEvaluacion,
  setCriteriosEvaluacion,
  formPlan,
  setFormPlan,
  onSave,
  calcularPuntajeControl,
  getEvaluacionPreliminarFromRangos,
  determinarEvaluacionDefinitiva,
  configResidual
}: GestionFormDialogProps) => {
  const isView = dialogMode === 'view';
  const showControl = tipoClasificacion === 'CONTROL' || tipoClasificacion === 'AMBOS';
  const showPlan = tipoClasificacion === 'PLAN' || tipoClasificacion === 'AMBOS';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: '90vh' } }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              {isView ? <VisibilityIcon /> : <EditIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">{isView ? 'Visualizar Gestión' : 'Configurar Gestión'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tipoClasificacion === 'CONTROL' ? 'Calificación de Control' : tipoClasificacion === 'PLAN' ? 'Plan de Acción' : 'Control y Plan de Acción'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #eee' }}>
          <Grid2 container spacing={3}>
            <Grid2 xs={12} md={6}>
              <Typography variant="overline" color="primary" fontWeight={700}>Información del Riesgo</Typography>
              <Box sx={{ mt: 1, p: 2, borderRadius: 1, border: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="subtitle2" fontWeight={700}>{causaEnEdicion?.riesgoId}</Typography>
                <Typography variant="body2" color="text.secondary">{repairSpanishDisplayArtifacts(getRiesgoNombre(causaEnEdicion?.riesgoId || ''))}</Typography>
              </Box>
            </Grid2>
            <Grid2 xs={12} md={6}>
              <Typography variant="overline" color="secondary" fontWeight={700}>Causa Raíz</Typography>
              <Box sx={{ mt: 1, p: 2, borderRadius: 1, border: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{causaEnEdicion?.causa?.descripcion || 'Sin descripción'}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Frecuencia</Typography><Typography variant="subtitle2">{causaEnEdicion?.causa?.frecuencia || 'N/A'}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Impacto</Typography><Typography variant="subtitle2">{(causaEnEdicion?.causa?.calificacionGlobalImpacto || 0).toFixed(2)}</Typography></Box>
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, bgcolor: '#fcfcfc' }}>
          <Grid2 container spacing={4}>
            {showControl && (
              <Grid2 xs={12} lg={tipoClasificacion === 'AMBOS' ? 6 : 12}>
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><ShieldIcon color="primary" /><Typography variant="h6" fontWeight={700}>Evaluación del Control</Typography></Box>
                  <Stack spacing={3}>
                    <TextField label="Descripción del Control" multiline rows={3} fullWidth value={criteriosEvaluacion.descripcionControl} onChange={(e) => setCriteriosEvaluacion({ ...criteriosEvaluacion, descripcionControl: e.target.value })} disabled={isView} />
                    <Grid2 container spacing={2}>
                      <Grid2 xs={12} sm={6}>
                        <FormControl fullWidth disabled={isView}>
                          <InputLabel>Naturaleza</InputLabel>
                          <Select value={criteriosEvaluacion.naturaleza} label="Naturaleza" onChange={(e) => setCriteriosEvaluacion({ ...criteriosEvaluacion, naturaleza: e.target.value })}>
                            <MenuItem value="manual">Manual</MenuItem>
                            <MenuItem value="semiautomatico">Semi-Automático</MenuItem>
                            <MenuItem value="automatico">Automático</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid2>
                      <Grid2 xs={12} sm={6}><TextField label="Responsable del Control" fullWidth value={criteriosEvaluacion.responsable} onChange={(e) => setCriteriosEvaluacion({ ...criteriosEvaluacion, responsable: e.target.value })} disabled={isView} /></Grid2>
                    </Grid2>
                    <Grid2 container spacing={2}>
                      {[
                        { label: 'Aplicabilidad', key: 'aplicabilidad', options: [{ label: 'Totalmente (100%)', val: 'totalmente' }, { label: 'Parcial (30%)', val: 'parcial' }, { label: 'Nula (0%)', val: 'nula' }] },
                        { label: 'Cobertura', key: 'cobertura', options: [{ label: 'Total (100%)', val: 'total' }, { label: 'Parcial (70%)', val: 'parcial' }, { label: 'Eventual (30%)', val: 'eventual' }] },
                        { label: 'Facilidad de Uso', key: 'facilidadUso', options: [{ label: 'Coherente (100%)', val: 'coherente' }, { label: 'Sencillo (70%)', val: 'sencillo' }, { label: 'Complejo (30%)', val: 'complejo' }] },
                        { label: 'Segregación', key: 'segregacion', options: [{ label: 'Sí (100%)', val: 'si' }, { label: 'No (0%)', val: 'no' }, { label: 'N/A (100%)', val: 'na' }] }
                      ].map((attr) => (
                        <Grid2 xs={12} sm={6} key={attr.key}>
                          <FormControl fullWidth disabled={isView} size="small">
                            <InputLabel>{attr.label}</InputLabel>
                            <Select value={(criteriosEvaluacion as any)[attr.key]} label={attr.label} onChange={(e) => setCriteriosEvaluacion({ ...criteriosEvaluacion, [attr.key]: e.target.value })}>
                              {attr.options.map(opt => <MenuItem key={opt.val} value={opt.val}>{opt.label}</MenuItem>)}
                            </Select>
                          </FormControl>
                        </Grid2>
                      ))}
                    </Grid2>
                    <FormControl fullWidth disabled={isView}>
                      <InputLabel>Desviaciones</InputLabel>
                      <Select value={criteriosEvaluacion.desviaciones} label="Desviaciones" onChange={(e) => setCriteriosEvaluacion({ ...criteriosEvaluacion, desviaciones: e.target.value })}>
                        <MenuItem value="A">A - Sin desviaciones</MenuItem>
                        <MenuItem value="B">B - Desviaciones menores</MenuItem>
                        <MenuItem value="C">C - Desviaciones significativas</MenuItem>
                        <MenuItem value="D">D - Fallas críticas</MenuItem>
                      </Select>
                    </FormControl>
                    <Box sx={{ mt: 2, p: 2.5, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid #cce3ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box><Typography variant="subtitle2" fontWeight={700} color="primary.dark">Evaluación Definitiva</Typography></Box>
                      <Chip
                        label={(() => {
                          const pt = calcularPuntajeControl(criteriosEvaluacion.puntajeAplicabilidad, criteriosEvaluacion.puntajeCobertura, criteriosEvaluacion.puntajeFacilidad, criteriosEvaluacion.segregacion === 'si' || criteriosEvaluacion.segregacion === 'na' ? 100 : 0, criteriosEvaluacion.puntajeNaturaleza);
                          const prel = getEvaluacionPreliminarFromRangos(configResidual?.rangosEvaluacion, pt);
                          return determinarEvaluacionDefinitiva(prel, criteriosEvaluacion.desviaciones);
                        })()}
                        color="primary"
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Grid2>
            )}

            {showPlan && (
              <Grid2 xs={12} lg={tipoClasificacion === 'AMBOS' ? 6 : 12}>
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}><AssignmentIcon color="secondary" /><Typography variant="h6" fontWeight={700}>Configuración del Plan de Acción</Typography></Box>
                  <Stack spacing={3}>
                    <TextField label="Descripción del Plan" multiline rows={3} fullWidth value={formPlan.descripcion} onChange={(e) => setFormPlan({ ...formPlan, descripcion: e.target.value })} disabled={isView} />
                    <TextField label="Detalle Adicional" multiline rows={2} fullWidth value={formPlan.detalle} onChange={(e) => setFormPlan({ ...formPlan, detalle: e.target.value })} disabled={isView} />
                    <Grid2 container spacing={2}>
                      <Grid2 xs={12} sm={6}><TextField label="Responsable" fullWidth value={formPlan.responsable} onChange={(e) => setFormPlan({ ...formPlan, responsable: e.target.value })} disabled={isView} /></Grid2>
                      <Grid2 xs={12} sm={6}><TextField label="Fecha Estimada" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formPlan.fechaEstimada} onChange={(e) => setFormPlan({ ...formPlan, fechaEstimada: e.target.value })} disabled={isView} /></Grid2>
                    </Grid2>
                    <Box sx={{ p: 2, bgcolor: '#fff8e1', borderRadius: 1, border: '1px solid #ffe082', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <InfoIcon sx={{ color: '#f57c00', mt: 0.2 }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#e65100">ESTADO: PENDIENTE</Typography>
                        <Typography variant="caption" color="#795548">El seguimiento y cierre se gestionan desde el panel de supervisión.</Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              </Grid2>
            )}
          </Grid2>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0', gap: 1.5 }}>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
        {!isView && <Button onClick={onSave} variant="contained" startIcon={<SaveIcon />}>Guardar Gestión</Button>}
      </DialogActions>
    </Dialog>
  );
};
