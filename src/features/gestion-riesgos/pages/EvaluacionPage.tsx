/**
 * Evaluación Page - MOST CRITICAL PAGE
 * Real-time risk evaluation with Excel formula calculations
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Slider,
  Button,
  Autocomplete,
  TextField,
  Chip,
  Alert,
  Paper,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useGetRiesgosQuery, useCreateEvaluacionMutation } from '../api/riesgosApi';
import { useCalculosRiesgo } from '../hooks/useCalculosRiesgo';
import { useNotification } from '../../../hooks/useNotification';
import { DIMENSIONES_IMPACTO, LABELS_PROBABILIDAD, LABELS_IMPACTO } from '../../../utils/constants';
import { getRiskColor } from '../../../app/theme/colors';
import { formatRiskValue } from '../../../utils/formatters';
import type { Riesgo, Impactos } from '../types';

export default function EvaluacionPage() {
  const { data: riesgosData } = useGetRiesgosQuery({});
  const [createEvaluacion, { isLoading: isSaving }] = useCreateEvaluacionMutation();
  const { showSuccess, showError } = useNotification();

  const [selectedRiesgo, setSelectedRiesgo] = useState<Riesgo | null>(null);
  const [impactos, setImpactos] = useState<Impactos>({
    personas: 1,
    legal: 1,
    ambiental: 1,
    procesos: 1,
    reputacion: 1,
    economico: 1,
    tecnologico: 1,
  });
  const [probabilidad, setProbabilidad] = useState<number>(1);

  // CÁLCULOS EN TIEMPO REAL usando las fórmulas Excel traducidas
  const resultados = useCalculosRiesgo({
    impactos,
    probabilidad,
    clasificacion: selectedRiesgo?.clasificacion || 'Riesgo con consecuencia negativa',
  });

  const handleImpactoChange = (dimension: keyof Impactos, value: number) => {
    setImpactos((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleSave = async () => {
    if (!selectedRiesgo) {
      showError('Debe seleccionar un riesgo');
      return;
    }

    try {
      await createEvaluacion({
        riesgoId: selectedRiesgo.id,
        impactoPersonas: impactos.personas,
        impactoLegal: impactos.legal,
        impactoAmbiental: impactos.ambiental,
        impactoProcesos: impactos.procesos,
        impactoReputacion: impactos.reputacion,
        impactoEconomico: impactos.economico,
        impactoTecnologico: impactos.tecnologico,
        probabilidad,
      }).unwrap();

      showSuccess('Evaluación guardada exitosamente');
      
      // Reset form
      setImpactos({
        personas: 1,
        legal: 1,
        ambiental: 1,
        procesos: 1,
        reputacion: 1,
        economico: 1,
        tecnologico: 1,
      });
      setProbabilidad(1);
      setSelectedRiesgo(null);
    } catch (error) {
      showError('Error al guardar la evaluación');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Evaluación de Riesgos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Evalúa el impacto y probabilidad de cada riesgo. Los cálculos se actualizan en tiempo real.
      </Typography>

      {/* Risk Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Autocomplete
            options={riesgosData?.data || []}
            getOptionLabel={(option) => `${option.numero} - ${option.descripcion}`}
            value={selectedRiesgo}
            onChange={(_, newValue) => setSelectedRiesgo(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Riesgo" placeholder="Buscar riesgo..." />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {option.numero} - {option.descripcion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.proceso} | {option.zona}
                  </Typography>
                </Box>
              </li>
            )}
          />

          {selectedRiesgo && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Clasificación:</strong> {selectedRiesgo.clasificacion}
              </Typography>
              {selectedRiesgo.clasificacion === 'Riesgo con consecuencia positiva' && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  ⚠️ Los riesgos positivos (oportunidades) siempre resultan en NIVEL BAJO
                </Typography>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedRiesgo && (
        <>
          {/* Impact Dimensions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Dimensiones de Impacto (1-5)
              </Typography>
              <Typography variant="caption" color="text.secondary" paragraph>
                Cada dimensión tiene un peso específico en el cálculo global
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {DIMENSIONES_IMPACTO.map((dimension) => (
                  <Box sx={{ flex: '1 1 300px', minWidth: 300 }} key={dimension.key}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {dimension.label}
                        </Typography>
                        <Chip
                          label={`${(dimension.peso * 100).toFixed(0)}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Slider
                          value={impactos[dimension.key as keyof Impactos]}
                          onChange={(_, value) =>
                            handleImpactoChange(dimension.key as keyof Impactos, value as number)
                          }
                          min={1}
                          max={5}
                          step={1}
                          marks
                          valueLabelDisplay="auto"
                          sx={{ flexGrow: 1 }}
                        />
                        <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                          {impactos[dimension.key as keyof Impactos]}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {LABELS_IMPACTO[impactos[dimension.key as keyof Impactos] as keyof typeof LABELS_IMPACTO]}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Probability */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Probabilidad (1-5)
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Slider
                  value={probabilidad}
                  onChange={(_, value) => setProbabilidad(value as number)}
                  min={1}
                  max={5}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="h6" fontWeight={700} sx={{ minWidth: 40 }}>
                  {probabilidad}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {LABELS_PROBABILIDAD[probabilidad as keyof typeof LABELS_PROBABILIDAD]}
              </Typography>
            </CardContent>
          </Card>

          {/* RESULTADOS CALCULADOS EN TIEMPO REAL */}
          <Paper
            elevation={4}
            sx={{
              p: 3,
              mb: 3,
              background: `linear-gradient(135deg, ${getRiskColor(resultados.nivelRiesgo)}15 0%, ${getRiskColor(resultados.nivelRiesgo)}05 100%)`,
              border: `2px solid ${getRiskColor(resultados.nivelRiesgo)}`,
            }}
          >
            <Typography variant="h5" gutterBottom fontWeight={700}>
              📊 Resultados Calculados
            </Typography>
            <Typography variant="caption" color="text.secondary" paragraph>
              Los valores se calculan automáticamente usando las fórmulas Excel traducidas
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 200px' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Impacto Global
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {resultados.impactoGlobal}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ponderado por pesos
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 200px' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Impacto Máximo
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {resultados.impactoMaximo}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Mayor valor de impacto
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 200px' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Riesgo Inherente
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {formatRiskValue(resultados.riesgoInherente)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resultados.riesgoInherente === 3.99 && '⚠️ Caso especial (2×2=3.99)'}
                    {resultados.riesgoInherente !== 3.99 && `${resultados.impactoMaximo} × ${probabilidad}`}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: '1 1 200px' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Nivel de Riesgo
                  </Typography>
                  <Chip
                    label={resultados.nivelRiesgo}
                    sx={{
                      backgroundColor: getRiskColor(resultados.nivelRiesgo),
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '1rem',
                      height: 40,
                      mt: 1,
                    }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Explanation */}
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Cálculo:</strong> Riesgo Inherente = Impacto Máximo × Probabilidad
                {resultados.riesgoInherente === 3.99 && (
                  <span>
                    {' '}
                    (Caso especial: cuando ambos son 2, el resultado es 3.99 según la fórmula Excel)
                  </span>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Nivel:</strong>{' '}
                {resultados.riesgoInherente >= 20 && '≥20 = CRÍTICO'}
                {resultados.riesgoInherente >= 15 && resultados.riesgoInherente < 20 && '≥15 = ALTO'}
                {resultados.riesgoInherente >= 10 && resultados.riesgoInherente < 15 && '≥10 = MEDIO'}
                {resultados.riesgoInherente < 10 && '<10 = BAJO'}
              </Typography>
            </Alert>
          </Paper>

          {/* Save Button */}
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSelectedRiesgo(null);
                setImpactos({
                  personas: 1,
                  legal: 1,
                  ambiental: 1,
                  procesos: 1,
                  reputacion: 1,
                  economico: 1,
                  tecnologico: 1,
                });
                setProbabilidad(1);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
            </Button>
          </Box>
        </>
      )}

      {!selectedRiesgo && (
        <Alert severity="info">
          Selecciona un riesgo para comenzar la evaluación
        </Alert>
      )}
    </Box>
  );
}
