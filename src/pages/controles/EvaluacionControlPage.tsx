/**
 * Evaluación del Control Page
 * Gestión de controles asociados a los riesgos identificados
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import { useGetRiesgosQuery, useUpdateCausaMutation } from '../../api/services/riesgosApi';
import {
  calcularPuntajeControl,
  determinarEfectividadControl
} from '../../utils/calculations';

// Re-definir constantes si no se importan correctamente de calculations (fallback)
const CRITERIOS_LOCAL = {
  aplicabilidad: [
    { label: 'Cuenta con procedimientos documentados y se deja evidencia de su ejecución', puntaje: 100 },
    { label: 'Cuenta con procedimientos documentados total o parcialmente pero no se deja evidencia de su ejecución', puntaje: 30 },
    { label: 'No se deja evidencia de su ejecución, ni se cuenta con los procedimientos documentados', puntaje: 0 },
  ],
  cobertura: [
    { label: 'La frecuencia del control tiene una periodicidad definida y se realiza sobre la totalidad de la población', puntaje: 100 },
    { label: 'La frecuencia del control tiene una periodicidad definida y se hace sobre una muestra de la población', puntaje: 70 },
    { label: 'La frecuencia del control es eventual o a discreción del funcionario que realiza el control', puntaje: 10 },
  ],
  facilidadUso: [
    { label: 'La complejidad del control es coherente con el riesgo identificado y la actividad realizada', puntaje: 100 },
    { label: 'El control es muy complejo en su ejecución en comparación con el riesgo identificado y la actividad realizada, y requiere simplificación', puntaje: 70 },
    { label: 'El control es muy sencillo en comparación con el riesgo identificado y la actividad realizada, y requiere mayor profundización', puntaje: 30 },
  ],
  segregacion: [
    { label: 'Sí', puntaje: 100 },
    { label: 'NO', puntaje: 0 },
  ],
  naturaleza: [
    { label: 'Automático', puntaje: 100 },
    { label: 'Semiautomático', puntaje: 60 },
    { label: 'Manual', puntaje: 40 },
  ],
  desvaciones: [
    { label: 'No Aplica', puntaje: 0 },
    { label: 'Se han encontrado desviaciones en el desempeño del control', puntaje: 'variable' },
    { label: 'El control falla la mayoría de las veces', puntaje: 'variable' },
    { label: 'El control ha fallado inmediatamente da Inefectivo', puntaje: 'variable' },
  ],
};

const PESOS_LOCAL = {
  aplicabilidad: 0.25,
  cobertura: 0.25,
  facilidadUso: 0.10,
  segregacion: 0.20,
  naturaleza: 0.20,
};

interface EvaluacionControl {
  id: string;
  riesgoId: string;
  causaId: string; // Relación con la causa específica
  descripcionControl: string;
  disminuye: 'Frecuencia' | 'Impacto' | 'Ambas';
  responsable: string;
  aplicabilidad: string;
  puntajeAplicabilidad: number;
  cobertura: string;
  puntajeCobertura: number;
  facilidadUso: string;
  puntajeFacilidad: number;
  segregacion: string;
  puntajeSegregacion: number;
  naturaleza: string;
  puntajeNaturaleza: number;
  desvaciones: string;
  puntajeTotal: number;
  efectividad: string;
}

export default function EvaluacionControlPage() {
  const { procesoSeleccionado } = useProceso();
  const { showSuccess, showError } = useNotification();

  const [evaluaciones, setEvaluaciones] = useState<EvaluacionControl[]>([]);
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado para contexto del formulario (qué riesgo/causa se está evaluando)
  const [contextoFormulario, setContextoFormulario] = useState<{ riesgoId: string, causaId: string } | null>(null);

  const [formData, setFormData] = useState<Partial<EvaluacionControl>>({
    descripcionControl: '',
    disminuye: 'Frecuencia',
    responsable: '',
    aplicabilidad: '',
    puntajeAplicabilidad: 0,
    cobertura: '',
    puntajeCobertura: 0,
    facilidadUso: '',
    puntajeFacilidad: 0,
    segregacion: '',
    puntajeSegregacion: 0,
    naturaleza: '',
    puntajeNaturaleza: 0,
    desvaciones: '',
    puntajeTotal: 0,
  });

  const { data: riesgosApiData } = useGetRiesgosQuery(
    procesoSeleccionado ? { procesoId: String(procesoSeleccionado.id), pageSize: 1000, includeCausas: true } : { pageSize: 0 },
    { skip: !procesoSeleccionado }
  );

  const [updateCausa] = useUpdateCausaMutation();

  const riesgosDelProceso = useMemo(() => {
    if (!procesoSeleccionado?.id) return [];
    const data = ((riesgosApiData as any)?.data || []) as any[];
    return data.map((riesgo) => ({
      ...riesgo,
      causas: (riesgo.causas || []).map((causa: any) => ({
        ...causa,
        ...(causa.gestion || {})
      }))
    }));
  }, [procesoSeleccionado?.id, riesgosApiData]);

  const causasById = useMemo(() => {
    const map = new Map<string, any>();
    riesgosDelProceso.forEach((riesgo: any) => {
      (riesgo.causas || []).forEach((causa: any) => {
        map.set(String(causa.id), causa);
      });
    });
    return map;
  }, [riesgosDelProceso]);

  useEffect(() => {
    const nuevas: EvaluacionControl[] = [];
    riesgosDelProceso.forEach((riesgo: any) => {
      (riesgo.causas || []).forEach((causa: any) => {
        const tipo = (causa.tipoGestion || '').toUpperCase();
        const tieneControl = tipo === 'CONTROL' || causa.puntajeTotal !== undefined || causa.descripcionControl;
        if (tieneControl) {
          nuevas.push({
            id: String(causa.id),
            riesgoId: String(riesgo.id),
            causaId: String(causa.id),
            descripcionControl: causa.descripcionControl || '',
            disminuye: causa.disminuye || 'Frecuencia',
            responsable: causa.responsable || '',
            aplicabilidad: causa.aplicabilidad || '',
            puntajeAplicabilidad: Number(causa.puntajeAplicabilidad || 0),
            cobertura: causa.cobertura || '',
            puntajeCobertura: Number(causa.puntajeCobertura || 0),
            facilidadUso: causa.facilidadUso || '',
            puntajeFacilidad: Number(causa.puntajeFacilidad || 0),
            segregacion: causa.segregacion || '',
            puntajeSegregacion: Number(causa.puntajeSegregacion || 0),
            naturaleza: causa.naturaleza || '',
            puntajeNaturaleza: Number(causa.puntajeNaturaleza || 0),
            desvaciones: causa.desvaciones || '',
            puntajeTotal: Number(causa.puntajeTotal || 0),
            efectividad: causa.efectividad || '',
          });
        }
      });
    });
    setEvaluaciones(nuevas);
  }, [riesgosDelProceso]);

  const handleToggleExpandirRiesgo = (id: string) => {
    setRiesgosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const calcularPuntaje = (data: Partial<EvaluacionControl>): number => {
    // Usar pesos definidos o fallback
    const pesos = PESOS_LOCAL;

    const puntajes = {
      aplicabilidad: (data.puntajeAplicabilidad || 0) * (pesos.aplicabilidad || 0.25),
      cobertura: (data.puntajeCobertura || 0) * (pesos.cobertura || 0.25),
      facilidadUso: (data.puntajeFacilidad || 0) * (pesos.facilidadUso || 0.10),
      segregacion: (data.puntajeSegregacion || 0) * (pesos.segregacion || 0.20),
      naturaleza: (data.puntajeNaturaleza || 0) * (pesos.naturaleza || 0.20),
    };

    return Object.values(puntajes).reduce((a, b) => a + b, 0);
  };

  const handleChangeCriterio = (criterio: keyof typeof CRITERIOS_LOCAL, descSeleccionada: string) => {
    const criterios = CRITERIOS_LOCAL[criterio];
    const criterioObj = criterios.find((c) => c.label === descSeleccionada);

    if (!criterioObj) return;

    const nuevoFormData = { ...formData };

    switch (criterio) {
      case 'aplicabilidad':
        nuevoFormData.aplicabilidad = descSeleccionada;
        nuevoFormData.puntajeAplicabilidad = criterioObj.puntaje as number;
        break;
      case 'cobertura':
        nuevoFormData.cobertura = descSeleccionada;
        nuevoFormData.puntajeCobertura = criterioObj.puntaje as number;
        break;
      case 'facilidadUso':
        nuevoFormData.facilidadUso = descSeleccionada;
        nuevoFormData.puntajeFacilidad = criterioObj.puntaje as number;
        break;
      case 'segregacion':
        nuevoFormData.segregacion = descSeleccionada;
        nuevoFormData.puntajeSegregacion = criterioObj.puntaje as number;
        break;
      case 'naturaleza':
        nuevoFormData.naturaleza = descSeleccionada;
        nuevoFormData.puntajeNaturaleza = criterioObj.puntaje as number;
        break;
    }

    const puntajeTotal = calcularPuntaje(nuevoFormData);
    nuevoFormData.puntajeTotal = puntajeTotal;
    nuevoFormData.efectividad = determinarEfectividadControl ? determinarEfectividadControl(puntajeTotal) : definirEfectividadLocal(puntajeTotal);

    setFormData(nuevoFormData);
  };

  const definirEfectividadLocal = (puntaje: number): string => {
    if (puntaje >= 85) return 'Altamente Efectivo';
    if (puntaje >= 70) return 'Efectivo';
    if (puntaje >= 50) return 'Medianamente Efectivo';
    if (puntaje >= 25) return 'Baja Efectividad';
    return 'Inefectivo';
  };

  const handleAbrirDialog = (riesgoId: string, causaId: string, evaluacion?: EvaluacionControl) => {
    setContextoFormulario({ riesgoId, causaId });
    if (evaluacion) {
      setFormData(evaluacion);
      setEditingId(evaluacion.id);
    } else {
      setFormData({
        descripcionControl: '',
        disminuye: 'Frecuencia',
        responsable: '',
        aplicabilidad: '',
        puntajeAplicabilidad: 0,
        cobertura: '',
        puntajeCobertura: 0,
        facilidadUso: '',
        puntajeFacilidad: 0,
        segregacion: '',
        puntajeSegregacion: 0,
        naturaleza: '',
        puntajeNaturaleza: 0,
        desvaciones: '',
        puntajeTotal: 0,
        efectividad: 'Inefectivo'
      });
      setEditingId(null);
    }
    setDialogOpen(true);
  };

  const handleGuardar = () => {
    if (!formData.descripcionControl?.trim()) {
      showError('La descripción del control es requerida');
      return;
    }
    if (!contextoFormulario) return;

    const controlData = {
      tipoGestion: 'CONTROL',
      gestion: {
        descripcionControl: formData.descripcionControl,
        disminuye: formData.disminuye,
        responsable: formData.responsable,
        aplicabilidad: formData.aplicabilidad,
        puntajeAplicabilidad: formData.puntajeAplicabilidad,
        cobertura: formData.cobertura,
        puntajeCobertura: formData.puntajeCobertura,
        facilidadUso: formData.facilidadUso,
        puntajeFacilidad: formData.puntajeFacilidad,
        segregacion: formData.segregacion,
        puntajeSegregacion: formData.puntajeSegregacion,
        naturaleza: formData.naturaleza,
        puntajeNaturaleza: formData.puntajeNaturaleza,
        desvaciones: formData.desvaciones,
        puntajeTotal: formData.puntajeTotal,
        efectividad: formData.efectividad,
      }
    };

    updateCausa({
      id: contextoFormulario.causaId,
      ...controlData
    })
      .then(() => {
        showSuccess('Control guardado correctamente');
        setDialogOpen(false);
      })
      .catch((error) => {
        console.error('Error saving control:', error);
        showError('Error al guardar el control');
      });
  };

  const handleEliminar = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este control?')) {
      const causaToDelete = causasById.get(id);
      if (causaToDelete) {
        updateCausa({
          id: id,
          tipoGestion: null,
          gestion: null
        })
          .then(() => {
            const nuevasEvaluaciones = evaluaciones.filter(e => e.id !== id);
            setEvaluaciones(nuevasEvaluaciones);
            showSuccess('Control eliminado');
          })
          .catch((error) => {
            console.error('Error deleting control:', error);
            showError('Error al eliminar el control');
          });
      }
    }
  };

  const getColorEfectividad = (efectividad: string): string => {
    switch (efectividad) {
      case 'Altamente Efectivo': return '#4caf50';
      case 'Efectivo': return '#81c784';
      case 'Medianamente Efectivo': return '#ffb74d';
      case 'Baja Efectividad': return '#ff7043';
      case 'Inefectivo': return '#d32f2f';
      default: return '#999';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#1976d2' }}>
          CONTROLES Y PLANES DE ACCIÓN
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Definición y evaluación de controles para causas de riesgos identificadas
        </Typography>
      </Box>

      {!procesoSeleccionado && <Alert severity="warning">Selecciona un proceso</Alert>}

      {procesoSeleccionado && riesgosDelProceso.length === 0 && (
        <Alert severity="info">No hay riesgos identificados para este proceso.</Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {riesgosDelProceso.map((riesgo) => {
          const estaExpandido = riesgosExpandidos[riesgo.id] || false;
          // Filtrar causas de este riesgo
          const causas = riesgo.causas || [];

          return (
            <Card key={riesgo.id} sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
              <Box
                sx={{
                  p: 2,
                  display: 'grid',
                  gridTemplateColumns: '40px 100px 1fr 150px 40px',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: estaExpandido ? '#f5f5f5' : 'white',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f9f9f9' }
                }}
                onClick={() => handleToggleExpandirRiesgo(riesgo.id)}
              >
                <IconButton size="small">
                  {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Chip label={riesgo.numeroIdentificacion || riesgo.id} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{riesgo.descripcionRiesgo || 'Sin descripción'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {riesgo.tipologiaNivelI} • {riesgo.tipologiaNivelII}
                  </Typography>
                </Box>
                <Chip
                  label={riesgo.nivelRiesgo || 'No Evaluado'}
                  size="small"
                  sx={{
                    bgcolor: riesgo.nivelRiesgo === 'Crítico' ? '#ffebee' : riesgo.nivelRiesgo === 'Alto' ? '#fff3e0' : '#e8f5e9',
                    color: riesgo.nivelRiesgo === 'Crítico' ? '#c62828' : riesgo.nivelRiesgo === 'Alto' ? '#ef6c00' : '#2e7d32',
                    fontWeight: 700
                  }}
                />
                <Box />
              </Box>

              <Collapse in={estaExpandido}>
                <Box sx={{ p: 3, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#1976d2', fontWeight: 700 }}>
                    ANÁLISIS DE CAUSAS Y CONTROLES
                  </Typography>

                  {causas.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>No hay causas definidas para este riesgo.</Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {causas.map((causa: any) => {
                        // Filtrar controles para esta causa
                        const controlesDeCausa = evaluaciones.filter(e => e.riesgoId === riesgo.id && e.causaId === causa.id);

                        return (
                          <Paper key={causa.id} elevation={0} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>CAUSA:</Typography>
                                <Typography variant="body2">{causa.descripcion}</Typography>
                              </Box>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleAbrirDialog(riesgo.id, causa.id)}
                              >
                                Agregar Control
                              </Button>
                            </Box>

                            {controlesDeCausa.length > 0 ? (
                              <TableContainer sx={{ border: '1px solid #eee', borderRadius: 1 }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                      <TableCell width="30%">Descripción Control</TableCell>
                                      <TableCell width="15%">Tipo</TableCell>
                                      <TableCell width="15%">Responsable</TableCell>
                                      <TableCell width="10%" align="center">Puntaje</TableCell>
                                      <TableCell width="15%" align="center">Efectividad</TableCell>
                                      <TableCell width="15%" align="center">Acciones</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {controlesDeCausa.map(control => (
                                      <TableRow key={control.id}>
                                        <TableCell>{control.descripcionControl}</TableCell>
                                        <TableCell><Chip label={control.disminuye} size="small" /></TableCell>
                                        <TableCell>{control.responsable}</TableCell>
                                        <TableCell align="center">{(control.puntajeTotal || 0).toFixed(1)}</TableCell>
                                        <TableCell align="center">
                                          <Chip
                                            label={control.efectividad}
                                            size="small"
                                            sx={{
                                              bgcolor: getColorEfectividad(control.efectividad),
                                              color: 'white',
                                              fontWeight: 600,
                                              fontSize: '0.75rem'
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell align="center">
                                          <IconButton size="small" onClick={() => handleAbrirDialog(riesgo.id, causa.id, control)}>
                                            <EditIcon fontSize="small" color="primary" />
                                          </IconButton>
                                          <IconButton size="small" onClick={() => handleEliminar(control.id)}>
                                            <DeleteIcon fontSize="small" color="error" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                                No se han registrado controles para esta causa.
                              </Typography>
                            )}
                          </Paper>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Box>

      {/* Dialog para agregar/editar control */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar Control' : 'Agregar Nuevo Control'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Descripción del Control"
              multiline
              rows={2}
              value={formData.descripcionControl || ''}
              onChange={(e) => setFormData({ ...formData, descripcionControl: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>¿Disminuye frecuencia o impacto?</InputLabel>
                <Select
                  value={formData.disminuye || 'Frecuencia'}
                  onChange={(e) => setFormData({ ...formData, disminuye: e.target.value as any })}
                  label="¿Disminuye frecuencia o impacto?"
                >
                  <MenuItem value="Frecuencia">Frecuencia</MenuItem>
                  <MenuItem value="Impacto">Impacto</MenuItem>
                  <MenuItem value="Ambas">Ambas</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Responsable del Control"
                value={formData.responsable || ''}
                onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
              />
            </Box>

            <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1, color: '#1976d2' }}>
              CALIFICACIÓN DE EFECTIVIDAD
            </Typography>

            {/* Generación dinámica de selectores de criterios */}
            {Object.entries(CRITERIOS_LOCAL).map(([key, opciones]) => {
              if (key === 'desvaciones') return null; // Tratar aparte
              const labels: Record<string, string> = {
                aplicabilidad: 'Aplicabilidad',
                cobertura: 'Cobertura',
                facilidadUso: 'Facilidad de Uso',
                segregacion: 'Segregación de Funciones',
                naturaleza: 'Naturaleza del Control'
              };

              // keyof formData check workaround
              const valorActual = (formData as any)[key] || '';

              return (
                <FormControl fullWidth key={key}>
                  <InputLabel>{labels[key] || key}</InputLabel>
                  <Select
                    value={valorActual}
                    onChange={(e) => handleChangeCriterio(key as any, e.target.value)}
                    label={labels[key] || key}
                  >
                    {opciones.map((op, idx) => (
                      <MenuItem key={idx} value={op.label} sx={{ whiteSpace: 'normal' }}>
                        <Box>
                          <Typography variant="body2">{op.label}</Typography>
                          <Typography variant="caption" color="text.secondary">Puntos: {op.puntaje}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })}

            <TextField
              fullWidth
              label="Desviaciones observadas"
              multiline
              rows={2}
              value={formData.desvaciones || ''}
              onChange={(e) => setFormData({ ...formData, desvaciones: e.target.value })}
            />

            <Alert severity={formData.efectividad === 'Inefectivo' ? 'error' : formData.efectividad === 'Altamente Efectivo' ? 'success' : 'info'}>
              <Typography variant="subtitle1" fontWeight={700}>
                Puntaje Total: {(formData.puntajeTotal || 0).toFixed(1)} — Efectividad: {formData.efectividad}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardar}>
            Guardar Control
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
