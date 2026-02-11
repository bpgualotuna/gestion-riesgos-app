/**
 * Mapa de Riesgo Residual Page
 * Visualiza el mapa de riesgos después de aplicar controles y planes de acción
 * Lógica adaptada de la macro Excel MapaRiesgoResidual()
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Alert,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import { useProceso } from '../../contexts/ProcesoContext';
import { useNotification } from '../../hooks/useNotification';
import type { RiesgoFormData } from '../../types';
import { useGetPuntosMapaQuery } from '../../api/services/riesgosApi';

interface RiesgoResidual {
  numeroIdentificacion: string;
  descripcion: string;
  frecuenciaResidual: number;
  impactoResidual: number;
  calificacionResidual: number;
  consecuencia: 'Negativa' | 'Positiva';
  nivelFrequencia: string;
  nivelImpacto: string;
  zonaRiesgo: string; // "Crítico" | "Alto" | "Medio" | "Bajo" | "Mínimo"
}

interface ConteoZonasRiesgo {
  critico: number;
  alto: number;
  medio: number;
  bajo: number;
  minimo: number;
}

const FRECUENCIAS = {
  1: 'Muy Bajo',
  2: 'Bajo',
  3: 'Moderado',
  4: 'Alto',
  5: 'Muy Alto',
};

const IMPACTOS = {
  1: 'No significativo',
  2: 'Leve',
  3: 'Moderado',
  4: 'Grave',
  5: 'Extremo',
};

// Matriz de colores según posición en el mapa (frecuencia vs impacto)
const determinarZonaRiesgo = (frecuencia: number, impacto: number): string => {
  if (frecuencia === 5 && impacto === 5) return 'Crítico';
  if ((frecuencia === 4 || frecuencia === 5) && (impacto === 4 || impacto === 5)) return 'Alto';
  if (frecuencia === 3 && impacto === 5) return 'Alto';
  if (frecuencia === 5 && impacto === 3) return 'Alto';
  if ((frecuencia === 2 || frecuencia === 3) && impacto === 5) return 'Medio';
  if (frecuencia === 4 && (impacto === 2 || impacto === 3)) return 'Medio';
  if (frecuencia === 5 && impacto === 2) return 'Medio';
  if ((frecuencia === 1 || frecuencia === 2) && (impacto === 4 || impacto === 5)) return 'Bajo';
  if (frecuencia === 3 && (impacto === 3 || impacto === 4)) return 'Bajo';
  if (frecuencia === 4 && impacto === 1) return 'Bajo';
  return 'Mínimo';
};

// Colores por zona de riesgo
const getColorZona = (zona: string): string => {
  switch (zona) {
    case 'Crítico':
      return '#d32f2f'; // Rojo oscuro
    case 'Alto':
      return '#f57c00'; // Naranja
    case 'Medio':
      return '#ed6c02'; // Naranja más claro
    case 'Bajo':
      return '#fbc02d'; // Amarillo
    case 'Mínimo':
      return '#4caf50'; // Verde
    default:
      return '#999';
  }
};

export default function MapaResidualPage() {
  const { procesoSeleccionado } = useProceso();
  // const { showError } = useNotification();

  const [riesgosResidiales, setRiesgosResidiales] = useState<RiesgoResidual[]>([]);
  const [riesgosOrdenados, setRiesgosOrdenados] = useState<RiesgoResidual[]>([]);
  const [conteoZonas, setConteoZonas] = useState<ConteoZonasRiesgo>({
    critico: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
    minimo: 0,
  });

  const { data: puntosMapa, isLoading } = useGetPuntosMapaQuery(
    { procesoId: procesoSeleccionado?.id },
    { skip: !procesoSeleccionado?.id }
  );

  useEffect(() => {
    if (puntosMapa) {
      const riesgosCalculados: RiesgoResidual[] = puntosMapa
        .filter(p => p.probabilidadResidual !== undefined && p.impactoResidual !== undefined)
        .map(p => {
          const f = p.probabilidadResidual || 1;
          const i = p.impactoResidual || 1;
          const cal = f * i;
          const zona = determinarZonaRiesgo(f, i);

          return {
            numeroIdentificacion: p.numeroIdentificacion || p.numero.toString(),
            descripcion: p.descripcion,
            frecuenciaResidual: f,
            impactoResidual: i,
            calificacionResidual: cal,
            consecuencia: p.clasificacion === 'Positiva' ? 'Positiva' : 'Negativa',
            nivelFrequencia: FRECUENCIAS[f as keyof typeof FRECUENCIAS] || 'N/A',
            nivelImpacto: IMPACTOS[i as keyof typeof IMPACTOS] || 'N/A',
            zonaRiesgo: zona
          };
        });

      setRiesgosResidiales(riesgosCalculados);

      // Ordenar por calificación residual descendente (mayor a menor)
      const ordenados = [...riesgosCalculados].sort((a, b) => b.calificacionResidual - a.calificacionResidual);
      setRiesgosOrdenados(ordenados);

      // Contar por zonas de riesgo
      const conteo: ConteoZonasRiesgo = {
        critico: riesgosCalculados.filter((r) => r.zonaRiesgo === 'Crítico').length,
        alto: riesgosCalculados.filter((r) => r.zonaRiesgo === 'Alto').length,
        medio: riesgosCalculados.filter((r) => r.zonaRiesgo === 'Medio').length,
        bajo: riesgosCalculados.filter((r) => r.zonaRiesgo === 'Bajo').length,
        minimo: riesgosCalculados.filter((r) => r.zonaRiesgo === 'Mínimo').length,
      };
      setConteoZonas(conteo);
    }
  }, [puntosMapa]);

  // Construir matriz 5x5 con riesgos negativos y positivos
  const { matrizNegativa, matrizPositiva } = useMemo(() => {
    const negativos = riesgosResidiales.filter((r) => r.consecuencia === 'Negativa');
    const positivos = riesgosResidiales.filter((r) => r.consecuencia === 'Positiva');

    // Crear matrices 5x5 (filas = impacto 5-1, columnas = frecuencia 1-5)
    const matrizNeg: Map<string, RiesgoResidual[]> = new Map();
    const matrizPos: Map<string, RiesgoResidual[]> = new Map();

    negativos.forEach((r) => {
      const key = `${r.frecuenciaResidual}-${r.impactoResidual}`;
      if (!matrizNeg.has(key)) matrizNeg.set(key, []);
      matrizNeg.get(key)!.push(r);
    });

    positivos.forEach((r) => {
      const key = `${r.frecuenciaResidual}-${r.impactoResidual}`;
      if (!matrizPos.has(key)) matrizPos.set(key, []);
      matrizPos.get(key)!.push(r);
    });

    return { matrizNegativa: matrizNeg, matrizPositiva: matrizPos };
  }, [riesgosResidiales]);

  // Componente para renderizar una celda de la matriz
  const CeldaMatriz = ({ frecuencia, impacto, riesgos }: { frecuencia: number; impacto: number; riesgos?: RiesgoResidual[] }) => {
    const zona = determinarZonaRiesgo(frecuencia, impacto);
    const color = getColorZona(zona);
    const hasRiesgos = riesgos && riesgos.length > 0;

    return (
      <TableCell
        align="center"
        sx={{
          backgroundColor: hasRiesgos ? color : '#f5f5f5',
          border: `1px solid #ddd`,
          padding: 1,
          minHeight: 60,
          cursor: hasRiesgos ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          '&:hover': hasRiesgos ? { backgroundColor: color, opacity: 0.8 } : {},
        }}
      >
        {hasRiesgos && (
          <Box sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
            {riesgos.map((r, idx) => (
              <Box key={idx} sx={{ mb: 0.5 }}>
                {r.numeroIdentificacion}
              </Box>
            ))}
          </Box>
        )}
      </TableCell>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        MAPA DE RIESGOS RESIDUAL
      </Typography>

      {!procesoSeleccionado ? (
        <Alert severity="warning">Selecciona un proceso para visualizar el mapa residual</Alert>
      ) : riesgosResidiales.length === 0 ? (
        <Alert severity="info">
          No hay riesgos con evaluación de controles. Completa primero la calificación RESIDUAL en Identificación y Calificación.
        </Alert>
      ) : (
        <>
          {/* Conteo por zonas */}
          <Grid2 container spacing={2} sx={{ mb: 3 }}>
            <Grid2 xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#d32f2f' }}>
                <CardContent>
                  <Typography color="white" variant="body2" fontWeight={600}>
                    Crítico
                  </Typography>
                  <Typography color="white" variant="h5" fontWeight={700}>
                    {conteoZonas.critico}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#f57c00' }}>
                <CardContent>
                  <Typography color="white" variant="body2" fontWeight={600}>
                    Alto
                  </Typography>
                  <Typography color="white" variant="h5" fontWeight={700}>
                    {conteoZonas.alto}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#ed6c02' }}>
                <CardContent>
                  <Typography color="white" variant="body2" fontWeight={600}>
                    Medio
                  </Typography>
                  <Typography color="white" variant="h5" fontWeight={700}>
                    {conteoZonas.medio}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
            <Grid2 xs={12} sm={6} md={3}>
              <Card sx={{ backgroundColor: '#4caf50' }}>
                <CardContent>
                  <Typography color="white" variant="body2" fontWeight={600}>
                    Bajo + Mínimo
                  </Typography>
                  <Typography color="white" variant="h5" fontWeight={700}>
                    {conteoZonas.bajo + conteoZonas.minimo}
                  </Typography>
                </CardContent>
              </Card>
            </Grid2>
          </Grid2>

          {/* Matriz NEGATIVA */}
          <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
            Riesgos con Consecuencia NEGATIVA
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell align="center" sx={{ fontWeight: 600, width: '12%' }}>
                    IMPACTO →
                  </TableCell>
                  {[1, 2, 3, 4, 5].map((f) => (
                    <TableCell key={f} align="center" sx={{ fontWeight: 600, backgroundColor: '#e8f5e9' }}>
                      {FRECUENCIAS[f as keyof typeof FRECUENCIAS]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[5, 4, 3, 2, 1].map((impacto) => (
                  <TableRow key={impacto}>
                    <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                      {IMPACTOS[impacto as keyof typeof IMPACTOS]}
                    </TableCell>
                    {[1, 2, 3, 4, 5].map((frecuencia) => (
                      <CeldaMatriz
                        key={`${frecuencia}-${impacto}`}
                        frecuencia={frecuencia}
                        impacto={impacto}
                        riesgos={matrizNegativa.get(`${frecuencia}-${impacto}`)}
                      />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Matriz POSITIVA */}
          <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
            Riesgos con Consecuencia POSITIVA
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell align="center" sx={{ fontWeight: 600, width: '12%' }}>
                    IMPACTO →
                  </TableCell>
                  {[1, 2, 3, 4, 5].map((f) => (
                    <TableCell key={f} align="center" sx={{ fontWeight: 600, backgroundColor: '#e3f2fd' }}>
                      {FRECUENCIAS[f as keyof typeof FRECUENCIAS]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[5, 4, 3, 2, 1].map((impacto) => (
                  <TableRow key={impacto}>
                    <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#f5f5f5' }}>
                      {IMPACTOS[impacto as keyof typeof IMPACTOS]}
                    </TableCell>
                    {[1, 2, 3, 4, 5].map((frecuencia) => (
                      <CeldaMatriz
                        key={`${frecuencia}-${impacto}`}
                        frecuencia={frecuencia}
                        impacto={impacto}
                        riesgos={matrizPositiva.get(`${frecuencia}-${impacto}`)}
                      />
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Tabla de Priorización */}
          <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>
            Priorización de Riesgos (Ordenado por Calificación Residual)
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Prioridad
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID Riesgo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Frecuencia
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Impacto
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Calif. Residual
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Zona
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Tipo
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgosOrdenados.map((riesgo, idx) => (
                  <TableRow key={idx}>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{riesgo.numeroIdentificacion}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>{riesgo.descripcion}</TableCell>
                    <TableCell align="center">{riesgo.nivelFrequencia}</TableCell>
                    <TableCell align="center">{riesgo.nivelImpacto}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: getColorZona(riesgo.zonaRiesgo) }}>
                      {riesgo.calificacionResidual.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={riesgo.zonaRiesgo} sx={{ backgroundColor: getColorZona(riesgo.zonaRiesgo), color: '#fff', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={riesgo.consecuencia} variant="outlined" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}

