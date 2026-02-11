import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import AppPageLayout from '../../components/layout/AppPageLayout';

const FRECUENCIAS = [1, 2, 3, 4, 5];
const IMPACTOS = [5, 4, 3, 2, 1];

export default function ConfEvaluacionPage() {
  const [frecuencia, setFrecuencia] = useState(3);
  const [impacto, setImpacto] = useState(3);

  const selectedKey = useMemo(() => `${frecuencia}-${impacto}`, [frecuencia, impacto]);

  return (
    <AppPageLayout
      title="Calificación Inherente Global"
      description="Ubica el riesgo en la matriz 5x5 usando Frecuencia (X) e Impacto (Y)."
    >
      <Box sx={{ mt: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Coordenadas
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Frecuencia (X)</InputLabel>
              <Select
                label="Frecuencia (X)"
                value={frecuencia}
                onChange={(e) => setFrecuencia(Number(e.target.value))}
              >
                {FRECUENCIAS.map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Impacto (Y)</InputLabel>
              <Select
                label="Impacto (Y)"
                value={impacto}
                onChange={(e) => setImpacto(Number(e.target.value))}
              >
                {IMPACTOS.map((i) => (
                  <MenuItem key={i} value={i}>{i}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Matriz Inherente (Frecuencia X, Impacto Y)
          </Typography>

          <Box sx={{ display: 'flex', mt: 2 }}>
            {/* Y axis labels */}
            <Box sx={{ display: 'grid', gridTemplateRows: 'repeat(5, 56px)', mr: 1 }}>
              {IMPACTOS.map((imp) => (
                <Box
                  key={`y-${imp}`}
                  sx={{
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#546e7a',
                  }}
                >
                  {imp}
                </Box>
              ))}
            </Box>

            {/* Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 80px)',
                gridTemplateRows: 'repeat(5, 56px)',
                gap: '2px',
              }}
            >
              {IMPACTOS.map((imp) =>
                FRECUENCIAS.map((freq) => {
                  const key = `${freq}-${imp}`;
                  const isSelected = key === selectedKey;
                  return (
                    <Box
                      key={key}
                      sx={{
                        width: 80,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                        backgroundColor: isSelected ? '#e3f2fd' : '#fafafa',
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? '#0d47a1' : '#455a64',
                        borderRadius: 1,
                      }}
                    >
                      {freq}-{imp}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* X axis labels */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 80px)', ml: 7, mt: 1 }}>
            {FRECUENCIAS.map((f) => (
              <Box
                key={`x-${f}`}
                sx={{ textAlign: 'center', fontWeight: 600, color: '#546e7a' }}
              >
                {f}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </AppPageLayout>
  );
}
