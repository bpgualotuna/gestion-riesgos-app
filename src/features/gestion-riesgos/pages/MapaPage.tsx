/**
 * Mapa de Riesgos Page
 * Interactive 5x5 risk matrix visualization
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useGetPuntosMapaQuery, useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery } from '../api/riesgosApi';
import { colors } from '../../../app/theme/colors';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, ROUTES, NIVELES_RIESGO } from '../../../utils/constants';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useRiesgo } from '../../../contexts/RiesgoContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { FiltrosRiesgo, PuntoMapa, Riesgo } from '../types';
import { Alert } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

// Función para generar ID del riesgo (número + sigla)
const generarIdRiesgo = (punto: PuntoMapa): string => {
  const numero = punto.numero || 0;
  const sigla = punto.siglaGerencia || '';
  return `${numero}${sigla}`;
};

export default function MapaPage() {
  const navigate = useNavigate();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { iniciarVer } = useRiesgo();
  const { esDirectorProcesos, user } = useAuth();
  const { data: procesos = [] } = useGetProcesosQuery();
  const [clasificacion, setClasificacion] = useState<string>('all');
  const [filtroArea, setFiltroArea] = useState<string>('all');
  const [filtroProceso, setFiltroProceso] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{ probabilidad: number; impacto: number } | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [detalleRiesgoDialogOpen, setDetalleRiesgoDialogOpen] = useState(false);
  const [riesgoSeleccionadoDetalle, setRiesgoSeleccionadoDetalle] = useState<Riesgo | null>(null);
  const [puntoSeleccionadoDetalle, setPuntoSeleccionadoDetalle] = useState<PuntoMapa | null>(null);

  // Si es director, obtener todos los procesos asignados
  const procesosDirector = useMemo(() => {
    if (esDirectorProcesos && user) {
      return procesos.filter((p) => p.directorId === user.id);
    }
    return [];
  }, [procesos, esDirectorProcesos, user]);

  // Si es director, aplicar filtros de área y proceso si están seleccionados
  const procesoIdFiltrado = useMemo(() => {
    if (esDirectorProcesos) {
      if (filtroProceso && filtroProceso !== 'all') {
        return filtroProceso;
      }
      // Si hay filtro de área pero no de proceso, mostrar todos los procesos de esa área
      if (filtroArea && filtroArea !== 'all') {
        // Devolver undefined para que se filtren después por área
        return undefined;
      }
      return undefined; // Mostrar todos los procesos del director
    }
    return procesoSeleccionado?.id;
  }, [esDirectorProcesos, filtroProceso, filtroArea, procesoSeleccionado]);

  const filtros: FiltrosRiesgo = {
    procesoId: procesoIdFiltrado,
    clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
  };

  const { data: puntos } = useGetPuntosMapaQuery(filtros);
  const { data: riesgosData } = useGetRiesgosQuery(filtros);
  
  // Obtener riesgos completos para el diálogo
  const riesgosCompletos = riesgosData?.data || [];
  
  // Si es director, filtrar puntos y riesgos para mostrar solo los de sus procesos (aplicando filtros de área)
  const puntosFiltrados = useMemo(() => {
    if (esDirectorProcesos && procesosDirector.length > 0) {
      let procesosIds = procesosDirector.map((p) => p.id);
      
      // Aplicar filtro de área si está seleccionado
      if (filtroArea && filtroArea !== 'all') {
        procesosIds = procesosDirector
          .filter(p => p.areaId === filtroArea)
          .map(p => p.id);
      }
      
      // Aplicar filtro de proceso si está seleccionado
      if (filtroProceso && filtroProceso !== 'all') {
        procesosIds = [filtroProceso];
      }
      
      return puntos?.filter((p) => {
        const riesgo = riesgosCompletos.find((r) => r.id === p.riesgoId);
        return riesgo && procesosIds.includes(riesgo.procesoId);
      }) || [];
    }
    return puntos || [];
  }, [puntos, esDirectorProcesos, procesosDirector, riesgosCompletos, filtroArea, filtroProceso]);

  // Create 5x5 matrix usando puntos filtrados
  const matriz: { [key: string]: PuntoMapa[] } = {};
  puntosFiltrados.forEach((punto) => {
    const key = `${punto.probabilidad}-${punto.impacto}`;
    if (!matriz[key]) {
      matriz[key] = [];
    }
    matriz[key].push(punto);
  });

  // Calcular estadísticas usando puntos filtrados
  const estadisticas = useMemo(() => {
    if (!puntosFiltrados || puntosFiltrados.length === 0) return null;

    const total = puntosFiltrados.length;
    const porNivel = {
      critico: puntosFiltrados.filter((p) => p.nivelRiesgo === NIVELES_RIESGO.CRITICO).length,
      alto: puntosFiltrados.filter((p) => p.nivelRiesgo === NIVELES_RIESGO.ALTO).length,
      medio: puntosFiltrados.filter((p) => p.nivelRiesgo === NIVELES_RIESGO.MEDIO).length,
      bajo: puntosFiltrados.filter((p) => p.nivelRiesgo === NIVELES_RIESGO.BAJO).length,
    };
    const porClasificacion = {
      positiva: puntosFiltrados.filter((p) => p.clasificacion === CLASIFICACION_RIESGO.POSITIVA).length,
      negativa: puntosFiltrados.filter((p) => p.clasificacion === CLASIFICACION_RIESGO.NEGATIVA).length,
    };

    return {
      total,
      porNivel,
      porClasificacion,
    };
  }, [puntosFiltrados]);

  // Obtener riesgos de la celda seleccionada usando puntos filtrados
  const riesgosCeldaSeleccionada = useMemo(() => {
    if (!selectedCell) return [];
    const key = `${selectedCell.probabilidad}-${selectedCell.impacto}`;
    return matriz[key] || [];
  }, [selectedCell, matriz]);
  
  // Si es director, mostrar solo procesos que supervisa
  if (esDirectorProcesos && procesosDirector.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No tiene procesos asignados para supervisar.
        </Alert>
      </Box>
    );
  }
  
  // Si es director y tiene proceso seleccionado, verificar que sea uno de sus procesos
  if (esDirectorProcesos && procesoSeleccionado && !procesosDirector.find(p => p.id === procesoSeleccionado.id)) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Este proceso no está asignado a su supervisión. Por favor seleccione uno de sus procesos desde el Dashboard.
        </Alert>
      </Box>
    );
  }

  const getCellColor = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return colors.risk.critical.main;
    if (riesgo >= 15) return colors.risk.high.main;
    if (riesgo >= 10) return colors.risk.medium.main;
    return colors.risk.low.main;
  };

  const getCellLabel = (probabilidad: number, impacto: number): string => {
    const riesgo = probabilidad * impacto;
    if (riesgo >= 20) return 'CRÍTICO';
    if (riesgo >= 15) return 'ALTO';
    if (riesgo >= 10) return 'MEDIO';
    return 'BAJO';
  };

  const handleCellClick = (probabilidad: number, impacto: number) => {
    const key = `${probabilidad}-${impacto}`;
    const cellRiesgos = matriz[key] || [];
    if (cellRiesgos.length > 0) {
      setSelectedCell({ probabilidad, impacto });
      setSummaryDialogOpen(true);
    }
  };

  const handleVerEvaluacion = (punto: PuntoMapa) => {
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (riesgo) {
      iniciarVer(riesgo);
      navigate(ROUTES.EVALUACION);
      setSummaryDialogOpen(false);
      setDetalleRiesgoDialogOpen(false);
    }
  };

  // Manejar clic en ID del riesgo individual
  const handleIdRiesgoClick = (e: React.MouseEvent, punto: PuntoMapa) => {
    e.stopPropagation(); // Evitar que se active el click de la celda
    const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
    if (riesgo) {
      setRiesgoSeleccionadoDetalle(riesgo);
      setPuntoSeleccionadoDetalle(punto);
      setDetalleRiesgoDialogOpen(true);
    }
  };

  // Obtener evaluación del riesgo seleccionado para el diálogo de detalles
  const { data: evaluacionesRiesgo = [] } = useGetEvaluacionesByRiesgoQuery(
    riesgoSeleccionadoDetalle?.id || '',
    { skip: !riesgoSeleccionadoDetalle }
  );
  const evaluacionRiesgo = evaluacionesRiesgo[0] || null;

  // Director puede ver el mapa sin seleccionar proceso específico
  if (!esDirectorProcesos && !procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Mapa de Riesgos
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Matriz 5x5 de Probabilidad vs Impacto
      </Typography>

      <Grid container spacing={3}>
        {/* Columna principal: Filtros, Leyenda y Matriz */}
        <Grid item xs={12} md={8}>
          {/* Filter */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {esDirectorProcesos && procesosDirector.length > 0 && (
                  <>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Área</InputLabel>
                      <Select
                        value={filtroArea || 'all'}
                        onChange={(e) => {
                          setFiltroArea(e.target.value);
                          setFiltroProceso('all');
                        }}
                        label="Filtrar por Área"
                      >
                        <MenuItem value="all">Todas las áreas</MenuItem>
                        {Array.from(new Set(procesosDirector.map(p => p.areaId).filter(Boolean))).map(areaId => {
                          const proceso = procesosDirector.find(p => p.areaId === areaId);
                          return (
                            <MenuItem key={areaId} value={areaId}>
                              {proceso?.areaNombre || `Área ${areaId}`}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Proceso</InputLabel>
                      <Select
                        value={filtroProceso || 'all'}
                        onChange={(e) => setFiltroProceso(e.target.value)}
                        label="Filtrar por Proceso"
                      >
                        <MenuItem value="all">Todos los procesos</MenuItem>
                        {procesosDirector
                          .filter(p => !filtroArea || filtroArea === 'all' || p.areaId === filtroArea)
                          .map((proceso) => (
                            <MenuItem key={proceso.id} value={proceso.id}>
                              {proceso.nombre}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </>
                )}
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Clasificación</InputLabel>
                  <Select
                    value={clasificacion}
                    onChange={(e) => setClasificacion(e.target.value)}
                    label="Clasificación"
                    disabled={modoProceso === 'visualizar'}
                  >
                    <MenuItem value="all">Todas</MenuItem>
                    <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
                    <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Leyenda
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.critical.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Crítico (≥20)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.high.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Alto (≥15)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.medium.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Medio (≥10)</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.low.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Bajo (&lt;10)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Matrix */}
          <Paper elevation={3} sx={{ p: 2, overflowX: 'auto' }}>
            <Box sx={{ minWidth: 600 }}>
              {/* Y-axis label */}
              <Box display="flex" alignItems="center" mb={2}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    mr: 2,
                  }}
                >
                  IMPACTO
                </Typography>

                <Box flexGrow={1}>
                  {/* Matrix Grid */}
                  <Box>
                    {[5, 4, 3, 2, 1].map((impacto) => (
                      <Box key={impacto} display="flex" mb={1}>
                        {/* Y-axis value */}
                        <Box
                          sx={{
                            width: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                          }}
                        >
                          {impacto}
                        </Box>

                        {/* Cells */}
                        {[1, 2, 3, 4, 5].map((probabilidad) => {
                          const key = `${probabilidad}-${impacto}`;
                          const cellRiesgos = matriz[key] || [];
                          const cellColor = getCellColor(probabilidad, impacto);
                          const cellLabel = getCellLabel(probabilidad, impacto);

                          return (
                            <Box
                              key={probabilidad}
                              onClick={() => handleCellClick(probabilidad, impacto)}
                              sx={{
                                width: 120,
                                minHeight: 120,
                                border: '2px solid',
                                borderColor: colors.divider,
                                backgroundColor: `${cellColor}20`,
                                borderLeftColor: cellColor,
                                borderLeftWidth: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                cursor: cellRiesgos.length > 0 ? 'pointer' : 'default',
                                transition: 'all 0.2s',
                                p: 1,
                                '&:hover': {
                                  backgroundColor: `${cellColor}40`,
                                  transform: cellRiesgos.length > 0 ? 'scale(1.05)' : 'none',
                                },
                                ml: 0.5,
                              }}
                            >
                              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 0.5 }}>
                                {cellLabel}
                              </Typography>
                              <Chip
                                label={cellRiesgos.length}
                                size="small"
                                sx={{
                                  mb: 0.5,
                                  backgroundColor: cellColor,
                                  color: '#fff',
                                  fontWeight: 700,
                                }}
                              />
                              {/* IDs de riesgos */}
                              {cellRiesgos.length > 0 && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0.25,
                                    width: '100%',
                                    maxHeight: 60,
                                    overflowY: 'auto',
                                    mt: 0.5,
                                  }}
                                >
                                  {cellRiesgos.map((punto) => (
                                    <Chip
                                      key={punto.riesgoId}
                                      label={generarIdRiesgo(punto)}
                                      size="small"
                                      onClick={(e) => handleIdRiesgoClick(e, punto)}
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        backgroundColor: '#fff',
                                        border: `1px solid ${cellColor}`,
                                        color: cellColor,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: `${cellColor}15`,
                                          transform: 'scale(1.05)',
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    ))}

                    {/* X-axis values */}
                    <Box display="flex" mt={1}>
                      <Box sx={{ width: 40 }} />
                      {[1, 2, 3, 4, 5].map((prob) => (
                        <Box
                          key={prob}
                          sx={{
                            width: 120,
                            display: 'flex',
                            justifyContent: 'center',
                            fontWeight: 600,
                            ml: 0.5,
                          }}
                        >
                          {prob}
                        </Box>
                      ))}
                    </Box>

                    {/* X-axis label */}
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Typography variant="h6" fontWeight={600}>
                        PROBABILIDAD
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Panel lateral: Estadísticas */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 100 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Resumen de Riesgos
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {estadisticas ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Total de Riesgos
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="primary">
                      {estadisticas.total}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Por Nivel de Riesgo
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Crítico"
                          secondary={estadisticas.porNivel.critico}
                        />
                        <Chip
                          label={estadisticas.porNivel.critico}
                          size="small"
                          sx={{
                            backgroundColor: colors.risk.critical.main,
                            color: '#fff',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Alto"
                          secondary={estadisticas.porNivel.alto}
                        />
                        <Chip
                          label={estadisticas.porNivel.alto}
                          size="small"
                          sx={{
                            backgroundColor: colors.risk.high.main,
                            color: '#fff',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Medio"
                          secondary={estadisticas.porNivel.medio}
                        />
                        <Chip
                          label={estadisticas.porNivel.medio}
                          size="small"
                          sx={{
                            backgroundColor: colors.risk.medium.main,
                            color: '#fff',
                          }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Bajo"
                          secondary={estadisticas.porNivel.bajo}
                        />
                        <Chip
                          label={estadisticas.porNivel.bajo}
                          size="small"
                          sx={{
                            backgroundColor: colors.risk.low.main,
                            color: '#fff',
                          }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Por Clasificación
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Riesgos Negativos"
                          secondary={estadisticas.porClasificacion.negativa}
                        />
                        <Chip
                          label={estadisticas.porClasificacion.negativa}
                          size="small"
                          color="warning"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Oportunidades (Positivos)"
                          secondary={estadisticas.porClasificacion.positiva}
                        />
                        <Chip
                          label={estadisticas.porClasificacion.positiva}
                          size="small"
                          color="success"
                        />
                      </ListItem>
                    </List>
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Cargando estadísticas...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogo de Resumen */}
      <Dialog
        open={summaryDialogOpen}
        onClose={() => setSummaryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Riesgos en la Celda ({selectedCell?.probabilidad}, {selectedCell?.impacto})
        </DialogTitle>
        <DialogContent>
          {riesgosCeldaSeleccionada.length === 0 ? (
            <Alert severity="info">No hay riesgos en esta celda.</Alert>
          ) : (
            <List>
              {riesgosCeldaSeleccionada.map((punto) => {
                const riesgo = riesgosCompletos.find((r) => r.id === punto.riesgoId);
                return (
                  <Card key={punto.riesgoId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            ID: {generarIdRiesgo(punto)}
                          </Typography>
                          <Chip
                            label={punto.nivelRiesgo}
                            size="small"
                            sx={{
                              backgroundColor: getCellColor(punto.probabilidad, punto.impacto),
                              color: '#fff',
                              mr: 1,
                            }}
                          />
                          <Chip
                            label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                            size="small"
                            color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleVerEvaluacion(punto)}
                        >
                          Ver Evaluación
                        </Button>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        <strong>Descripción:</strong> {punto.descripcion}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Probabilidad:</strong> {punto.probabilidad}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Impacto:</strong> {punto.impacto}
                        </Typography>
                        {riesgo && (
                          <>
                            <Typography variant="body2">
                              <strong>Zona:</strong> {riesgo.zona}
                            </Typography>
                            {riesgo.tipologiaNivelI && (
                              <Typography variant="body2">
                                <strong>Tipología:</strong> {riesgo.tipologiaNivelI}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Detalles del Riesgo Individual */}
      <Dialog
        open={detalleRiesgoDialogOpen}
        onClose={() => setDetalleRiesgoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              Resumen del Riesgo
            </Typography>
            {riesgoSeleccionadoDetalle && (
              <Chip
                label={generarIdRiesgo(puntoSeleccionadoDetalle!)}
                size="small"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {riesgoSeleccionadoDetalle && puntoSeleccionadoDetalle ? (
            <Box>
              {/* Información del Riesgo */}
              <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Información del Riesgo
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={puntoSeleccionadoDetalle.nivelRiesgo}
                      size="small"
                      sx={{
                        backgroundColor: getCellColor(puntoSeleccionadoDetalle.probabilidad, puntoSeleccionadoDetalle.impacto),
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                      size="small"
                      color={puntoSeleccionadoDetalle.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                    />
                    <Chip
                      label={`Zona: ${riesgoSeleccionadoDetalle.zona}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Descripción:</strong> {riesgoSeleccionadoDetalle.descripcion}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Probabilidad:</strong> {puntoSeleccionadoDetalle.probabilidad}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Impacto:</strong> {puntoSeleccionadoDetalle.impacto}
                    </Typography>
                    {riesgoSeleccionadoDetalle.tipologiaNivelI && (
                      <Typography variant="body2">
                        <strong>Tipología:</strong> {riesgoSeleccionadoDetalle.tipologiaNivelI}
                      </Typography>
                    )}
                  </Box>
                  
                  {/* Información del Proceso y Responsable */}
                  {riesgoSeleccionadoDetalle.procesoId && (() => {
                    const procesoRiesgo = procesos.find(p => p.id === riesgoSeleccionadoDetalle.procesoId);
                    return procesoRiesgo ? (
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                          Información del Proceso
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="body2">
                            <strong>Proceso:</strong> {procesoRiesgo.nombre}
                          </Typography>
                          {procesoRiesgo.responsableNombre && (
                            <Typography variant="body2">
                              <strong>Responsable (Dueño del Proceso):</strong>{' '}
                              <Chip 
                                label={procesoRiesgo.responsableNombre} 
                                size="small" 
                                color="primary"
                                sx={{ ml: 0.5 }}
                              />
                            </Typography>
                          )}
                          {procesoRiesgo.areaNombre && (
                            <Typography variant="body2">
                              <strong>Área:</strong> {procesoRiesgo.areaNombre}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : null;
                  })()}
                </CardContent>
              </Card>

              {/* Evaluación del Riesgo */}
              {evaluacionRiesgo ? (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      Evaluación del Riesgo
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Probabilidad</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {evaluacionRiesgo.probabilidad}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Impacto Global</Typography>
                        <Typography variant="h6" fontWeight={600}>
                          {evaluacionRiesgo.impactoGlobal}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Riesgo Inherente</Typography>
                        <Typography variant="h6" fontWeight={600} color="error">
                          {evaluacionRiesgo.riesgoInherente}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Nivel de Riesgo</Typography>
                        <Chip
                          label={evaluacionRiesgo.nivelRiesgo}
                          size="small"
                          sx={{
                            backgroundColor: getCellColor(evaluacionRiesgo.probabilidad, evaluacionRiesgo.impactoMaximo),
                            color: '#fff',
                            fontWeight: 600,
                            mt: 0.5,
                          }}
                        />
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                      Impactos por Dimensión
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mt: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Personas</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoPersonas}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Legal</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoLegal}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Ambiental</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoAmbiental}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Procesos</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoProcesos}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Reputación</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoReputacion}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Económico</Typography>
                        <Typography variant="body2" fontWeight={600}>{evaluacionRiesgo.impactoEconomico}</Typography>
                      </Box>
                    </Box>
                    {evaluacionRiesgo.evaluadoPor && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Evaluado por: <strong>{evaluacionRiesgo.evaluadoPor}</strong>
                        </Typography>
                        {evaluacionRiesgo.fechaEvaluacion && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Fecha: {new Date(evaluacionRiesgo.fechaEvaluacion).toLocaleDateString('es-ES')}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Este riesgo aún no tiene evaluación registrada.
                </Alert>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleRiesgoDialogOpen(false)}>
            Cerrar
          </Button>
          {puntoSeleccionadoDetalle && (
            <Button
              variant="contained"
              startIcon={<VisibilityIcon />}
              onClick={() => handleVerEvaluacion(puntoSeleccionadoDetalle)}
            >
              Más Detalles
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
