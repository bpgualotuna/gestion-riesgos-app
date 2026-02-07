/**
 * Evaluación del Control Page
 * Formulario para evaluar controles con criterios de calificación
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface CriterioControl {
  aplicabilidad: string;
  puntaje: number;
  cobertura: string;
  facilidadUso: string;
  segregacion: string;
  naturaleza: string;
  desvaciones: string;
}

interface Evaluacion {
  id: string;
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
  ind: string;
  puntajeTotal: number;
  efectividad: string; // Altamente Efectivo, Efectivo, Medianamente Efectivo, Baja Efectividad, Inefectivo
}

// Criterios de calificación (de la tabla Excel)
const CRITERIOS_CALIFICACION = {
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

const PESOS_CRITERIOS = {
  aplicabilidad: 0.25,
  cobertura: 0.25,
  facilidadUso: 0.10,
  segregacion: 0.20,
  naturaleza: 0.20,
};

export default function EvaluacionControlPage() {
  const { procesoSeleccionado } = useProceso();
  const { showSuccess, showError } = useNotification();

  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Evaluacion>>({
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
    ind: '',
    puntajeTotal: 0,
  });

  // Cargar evaluaciones del localStorage
  useEffect(() => {
    if (!procesoSeleccionado?.id) return;

    try {
      const stored = localStorage.getItem(`evaluaciones_controles_${procesoSeleccionado.id}`);
      if (stored) {
        setEvaluaciones(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
    }
  }, [procesoSeleccionado?.id]);

  // Calcular puntaje total
  const calcularPuntajeTotal = (data: Partial<Evaluacion>): number => {
    const puntajes = {
      aplicabilidad: (data.puntajeAplicabilidad || 0) * PESOS_CRITERIOS.aplicabilidad,
      cobertura: (data.puntajeCobertura || 0) * PESOS_CRITERIOS.cobertura,
      facilidadUso: (data.puntajeFacilidad || 0) * PESOS_CRITERIOS.facilidadUso,
      segregacion: (data.puntajeSegregacion || 0) * PESOS_CRITERIOS.segregacion,
      naturaleza: (data.puntajeNaturaleza || 0) * PESOS_CRITERIOS.naturaleza,
    };

    return Object.values(puntajes).reduce((a, b) => a + b, 0);
  };

  // Determinar efectividad según puntaje
  const determinarEfectividad = (puntaje: number): string => {
    if (puntaje >= 85) return 'Altamente Efectivo';
    if (puntaje >= 70) return 'Efectivo';
    if (puntaje >= 50) return 'Medianamente Efectivo';
    if (puntaje >= 25) return 'Baja Efectividad';
    return 'Inefectivo';
  };

  const handleChangeCriterio = (criterio: keyof typeof CRITERIOS_CALIFICACION, descSeleccionada: string) => {
    const criterios = CRITERIOS_CALIFICACION[criterio];
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

    const puntajeTotal = calcularPuntajeTotal(nuevoFormData);
    nuevoFormData.puntajeTotal = puntajeTotal;
    nuevoFormData.efectividad = determinarEfectividad(puntajeTotal);

    setFormData(nuevoFormData);
  };

  const handleGuardar = () => {
    if (!formData.descripcionControl?.trim()) {
      showError('La descripción del control es requerida');
      return;
    }

    if (!procesoSeleccionado?.id) {
      showError('Selecciona un proceso');
      return;
    }

    let nuevasEvaluaciones: Evaluacion[];

    if (editingId) {
      nuevasEvaluaciones = evaluaciones.map((e) =>
        e.id === editingId ? ({ ...formData, id: editingId } as Evaluacion) : e
      );
    } else {
      const nuevoId = `eval-${Date.now()}`;
      nuevasEvaluaciones = [
        ...evaluaciones,
        { ...formData, id: nuevoId } as Evaluacion,
      ];
    }

    localStorage.setItem(`evaluaciones_controles_${procesoSeleccionado.id}`, JSON.stringify(nuevasEvaluaciones));
    setEvaluaciones(nuevasEvaluaciones);

    showSuccess(editingId ? 'Evaluación actualizada' : 'Evaluación guardada');
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
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
      ind: '',
      puntajeTotal: 0,
    });
    setEditingId(null);
  };

  const handleEditar = (evaluacion: Evaluacion) => {
    setFormData(evaluacion);
    setEditingId(evaluacion.id);
    setDialogOpen(true);
  };

  const handleEliminar = (id: string) => {
    const nuevasEvaluaciones = evaluaciones.filter((e) => e.id !== id);
    if (!procesoSeleccionado?.id) return;
    localStorage.setItem(`evaluaciones_controles_${procesoSeleccionado.id}`, JSON.stringify(nuevasEvaluaciones));
    setEvaluaciones(nuevasEvaluaciones);
    showSuccess('Evaluación eliminada');
  };

  const getColorEfectividad = (efectividad: string): string => {
    switch (efectividad) {
      case 'Altamente Efectivo':
        return '#4caf50';
      case 'Efectivo':
        return '#81c784';
      case 'Medianamente Efectivo':
        return '#ffb74d';
      case 'Baja Efectividad':
        return '#ff7043';
      case 'Inefectivo':
        return '#d32f2f';
      default:
        return '#999';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          EVALUACIÓN DE CONTROLES
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Agregar Evaluación
        </Button>
      </Box>

      {!procesoSeleccionado && <Alert severity="warning">Selecciona un proceso</Alert>}

      {evaluaciones.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Disminuye
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Responsable
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Puntaje Total
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Efectividad
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evaluaciones.map((evaluacion) => (
                <TableRow key={evaluacion.id}>
                  <TableCell sx={{ maxWidth: 300 }}>{evaluacion.descripcionControl}</TableCell>
                  <TableCell align="center">{evaluacion.disminuye}</TableCell>
                  <TableCell align="center">{evaluacion.responsable}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    {evaluacion.puntajeTotal.toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        backgroundColor: getColorEfectividad(evaluacion.efectividad || ''),
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    >
                      {evaluacion.efectividad}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEditar(evaluacion)}
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleEliminar(evaluacion.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">No hay evaluaciones de controles registradas</Alert>
      )}

      {/* Dialog para agregar/editar evaluación */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? 'Editar Evaluación' : 'Agregar Evaluación'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Descripción */}
            <TextField
              fullWidth
              label="Descripción del Control"
              multiline
              rows={2}
              value={formData.descripcionControl || ''}
              onChange={(e) => setFormData({ ...formData, descripcionControl: e.target.value })}
            />

            {/* Disminuye */}
            <FormControl fullWidth>
              <InputLabel>¿Disminuye la frecuencia, impacto o ambas?</InputLabel>
              <Select
                value={formData.disminuye || 'Frecuencia'}
                onChange={(e) => setFormData({ ...formData, disminuye: e.target.value as any })}
                label="¿Disminuye la frecuencia, impacto o ambas?"
              >
                <MenuItem value="Frecuencia">Frecuencia</MenuItem>
                <MenuItem value="Impacto">Impacto</MenuItem>
                <MenuItem value="Ambas">Ambas</MenuItem>
              </Select>
            </FormControl>

            {/* Responsable */}
            <TextField
              fullWidth
              label="Responsable del Control"
              value={formData.responsable || ''}
              onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
            />

            <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2 }}>
              Criterios de Calificación
            </Typography>

            {/* Aplicabilidad */}
            <FormControl fullWidth>
              <InputLabel>Aplicabilidad</InputLabel>
              <Select
                value={formData.aplicabilidad || ''}
                onChange={(e) => handleChangeCriterio('aplicabilidad', e.target.value)}
                label="Aplicabilidad"
              >
                {CRITERIOS_CALIFICACION.aplicabilidad.map((c, idx) => (
                  <MenuItem key={idx} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.puntajeAplicabilidad !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Puntaje: {formData.puntajeAplicabilidad}
              </Typography>
            )}

            {/* Cobertura */}
            <FormControl fullWidth>
              <InputLabel>Cobertura</InputLabel>
              <Select
                value={formData.cobertura || ''}
                onChange={(e) => handleChangeCriterio('cobertura', e.target.value)}
                label="Cobertura"
              >
                {CRITERIOS_CALIFICACION.cobertura.map((c, idx) => (
                  <MenuItem key={idx} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.puntajeCobertura !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Puntaje: {formData.puntajeCobertura}
              </Typography>
            )}

            {/* Facilidad de Uso */}
            <FormControl fullWidth>
              <InputLabel>Facilidad de Uso</InputLabel>
              <Select
                value={formData.facilidadUso || ''}
                onChange={(e) => handleChangeCriterio('facilidadUso', e.target.value)}
                label="Facilidad de Uso"
              >
                {CRITERIOS_CALIFICACION.facilidadUso.map((c, idx) => (
                  <MenuItem key={idx} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.puntajeFacilidad !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Puntaje: {formData.puntajeFacilidad}
              </Typography>
            )}

            {/* Segregación */}
            <FormControl fullWidth>
              <InputLabel>Segregación</InputLabel>
              <Select
                value={formData.segregacion || ''}
                onChange={(e) => handleChangeCriterio('segregacion', e.target.value)}
                label="Segregación"
              >
                {CRITERIOS_CALIFICACION.segregacion.map((c, idx) => (
                  <MenuItem key={idx} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.puntajeSegregacion !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Puntaje: {formData.puntajeSegregacion}
              </Typography>
            )}

            {/* Naturaleza */}
            <FormControl fullWidth>
              <InputLabel>Naturaleza</InputLabel>
              <Select
                value={formData.naturaleza || ''}
                onChange={(e) => handleChangeCriterio('naturaleza', e.target.value)}
                label="Naturaleza"
              >
                {CRITERIOS_CALIFICACION.naturaleza.map((c, idx) => (
                  <MenuItem key={idx} value={c.label}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.puntajeNaturaleza !== undefined && (
              <Typography variant="caption" color="text.secondary">
                Puntaje: {formData.puntajeNaturaleza}
              </Typography>
            )}

            {/* Desviaciones */}
            <TextField
              fullWidth
              label="Desviaciones"
              multiline
              rows={2}
              value={formData.desvaciones || ''}
              onChange={(e) => setFormData({ ...formData, desvaciones: e.target.value })}
            />

            {/* IND */}
            <TextField
              fullWidth
              label="Indicador (IND)"
              value={formData.ind || ''}
              onChange={(e) => setFormData({ ...formData, ind: e.target.value })}
            />

            {/* Resumen */}
            <Card sx={{ backgroundColor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="body2" fontWeight={600}>
                  Puntaje Total: {(formData.puntajeTotal || 0).toFixed(2)}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: getColorEfectividad(formData.efectividad || ''), mt: 1 }}
                >
                  Efectividad: {formData.efectividad || 'Calculando...'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleGuardar}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
