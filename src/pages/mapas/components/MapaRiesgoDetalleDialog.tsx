import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Riesgo, PuntoMapa } from '../../../types';
import { CLASIFICACION_RIESGO, NIVELES_RIESGO } from '../../../utils/constants';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';

interface MapaRiesgoDetalleDialogProps {
  open: boolean;
  onClose: () => void;
  riesgo: Riesgo | null;
  punto: PuntoMapa | null;
  evaluacion: any | null;
  procesos: any[];
  tipoMapa: 'inherente' | 'residual';
  seccionesExpandidas: { causas: boolean; residual: boolean; controles: boolean };
  onToggleSeccion: (seccion: 'causas' | 'residual' | 'controles') => void;
  getColorByNivelRiesgo: (nivel: string) => string;
  generarIdRiesgo: (punto: PuntoMapa) => string;
  getDatosEvaluacionControlDesdeCausa: (causa: any) => any;
  calcularResidualPorCausa: (causa: any) => any;
  calcularNivelRiesgo: (prob: number, imp: number) => string;
  DescripcionControlCorta: React.FC<{ texto: string }>;
}

const MapaRiesgoDetalleDialog = memo(({
  open,
  onClose,
  riesgo,
  punto,
  evaluacion,
  procesos,
  tipoMapa,
  seccionesExpandidas,
  onToggleSeccion,
  getColorByNivelRiesgo,
  generarIdRiesgo,
  getDatosEvaluacionControlDesdeCausa,
  calcularResidualPorCausa,
  calcularNivelRiesgo,
  DescripcionControlCorta
}: MapaRiesgoDetalleDialogProps) => {
  if (!riesgo || !punto) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { maxWidth: 560 } }}
      disableScrollLock={true}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Resumen del Riesgo
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={generarIdRiesgo(punto)}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box>
          {tipoMapa === 'residual' && (() => {
            const causas = (riesgo.causas as any) || [];
            const tieneControlDetalle = causas.some((c: any) => {
              const t = (c.tipoGestion || '').toUpperCase();
              if (t === 'CONTROL') return true;
              if (t === 'AMBOS') return (c.gestion?.estadoAmbos?.controlActivo !== false);
              return false;
            });
            if (!tieneControlDetalle) {
              return (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Sin controles aplicados.</strong> La calificación residual es igual a la inherente.
                </Alert>
              );
            }
            return null;
          })()}

          <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={punto.nivelRiesgo}
                  size="small"
                  sx={{
                    backgroundColor: getColorByNivelRiesgo(punto.nivelRiesgo),
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
                <Chip
                  label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                  size="small"
                  color={(punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA) ? 'success' : 'warning'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Descripción:</strong>{' '}
                {repairSpanishDisplayArtifacts(String(riesgo.descripcion ?? ''))}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
                {(() => {
                  const zonaRaw = punto.zona || riesgo.zona;
                  const zona = zonaRaw && zonaRaw.trim() && !zonaRaw.toLowerCase().includes('rural') ? zonaRaw : null;
                  return zona ? (
                    <Typography variant="body2">
                      <strong>Zona:</strong> {repairSpanishDisplayArtifacts(String(zona))}
                    </Typography>
                  ) : null;
                })()}
                {(punto.tipologiaNivelI || riesgo.tipologiaNivelI) && (
                  <Typography variant="body2">
                    <strong>Tipología:</strong>{' '}
                    {repairSpanishDisplayArtifacts(
                      String(
                        punto.tipologiaNivelI ||
                        riesgo.tipologiaNivelI ||
                        ''
                      )
                    )}
                  </Typography>
                )}
              </Box>

              {(() => {
                const procesoId = riesgo.procesoId || punto.procesoId;
                const procesoRiesgo = procesos.find(p => String(p.id) === String(procesoId));
                const procesoNombre = punto.procesoNombre || procesoRiesgo?.nombre || 'Proceso desconocido';

                if (procesoId) {
                  return (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Información del Proceso
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2">
                          <strong>Proceso:</strong> {procesoNombre}
                        </Typography>
                        {procesoRiesgo?.responsableNombre && (
                          <Typography variant="body2">
                            <strong>Responsable (Dueño del Proceso):</strong>{' '}
                            <Chip label={procesoRiesgo.responsableNombre} size="small" color="primary" sx={{ ml: 0.5 }} />
                          </Typography>
                        )}
                        {procesoRiesgo?.areaNombre && (
                          <Typography variant="body2">
                            <strong>Área:</strong> {procesoRiesgo.areaNombre}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>

          {evaluacion ? (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  Evaluación del Riesgo
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Probabilidad</Typography>
                    <Typography variant="h6" fontWeight={600}>{evaluacion.probabilidad}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Impacto Global</Typography>
                    <Typography variant="h6" fontWeight={600}>{evaluacion.impactoGlobal}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Riesgo Inherente</Typography>
                    <Typography variant="h6" fontWeight={600} color="error">{evaluacion.riesgoInherente}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nivel de Riesgo</Typography>
                    <Chip
                      label={evaluacion.nivelRiesgo}
                      size="small"
                      sx={{
                        backgroundColor: getColorByNivelRiesgo(evaluacion.nivelRiesgo),
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
                  <Box><Typography variant="caption" color="text.secondary">Personas</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoPersonas}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Legal</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoLegal}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Ambiental</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoAmbiental}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Procesos</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoProcesos}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Reputación</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoReputacion}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Económico</Typography><Typography variant="body2" fontWeight={600}>{evaluacion.impactoEconomico}</Typography></Box>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>Este riesgo aún no tiene evaluación registrada.</Alert>
          )}

          {riesgo.causas && (riesgo.causas as any).length > 0 && (
            <Accordion expanded={seccionesExpandidas.causas} onChange={() => onToggleSeccion('causas')} sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>Causas Identificadas ({(riesgo.causas as any).length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Descripción</strong></TableCell>
                        <TableCell align="center"><strong>Frecuencia</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {((riesgo.causas as any) || []).map((causa: any, idx: number) => (
                        <TableRow key={causa.id || idx}>
                          <TableCell>{repairSpanishDisplayArtifacts(String(causa.descripcion || 'Sin descripción'))}</TableCell>
                          <TableCell align="center">{causa.frecuencia || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}

          {evaluacion && tipoMapa === 'residual' && (
            <Accordion expanded={seccionesExpandidas.residual} onChange={() => onToggleSeccion('residual')} sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>Evaluación Residual</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Probabilidad Residual</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {evaluacion.probabilidadResidual ?? punto.probabilidadResidual ?? evaluacion.probabilidad ?? 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Impacto Residual</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {evaluacion.impactoResidual ?? punto.impactoResidual ?? evaluacion.impactoGlobal ?? 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Riesgo Residual</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {evaluacion.riesgoResidual ?? evaluacion.riesgoInherente ?? 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Nivel Riesgo Residual</Typography>
                    <Chip
                      label={evaluacion.nivelRiesgoResidual || evaluacion.nivelRiesgo || 'N/A'}
                      size="small"
                      sx={{
                        backgroundColor: getColorByNivelRiesgo(evaluacion.nivelRiesgoResidual || evaluacion.nivelRiesgo),
                        color: '#fff',
                        fontWeight: 600,
                        mt: 0.5,
                      }}
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {tipoMapa === 'residual' && riesgo.causas && (riesgo.causas as any).length > 0 && (
            <Accordion expanded={seccionesExpandidas.controles} onChange={() => onToggleSeccion('controles')} sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                  Controles Aplicados ({(riesgo.causas as any).filter((c: any) => {
                    const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                    return tipo === 'CONTROL' || tipo === 'AMBOS';
                  }).length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Control</strong></TableCell>
                        <TableCell align="center"><strong>Efectividad</strong></TableCell>
                        <TableCell align="center"><strong>Calif. Residual</strong></TableCell>
                        <TableCell align="center"><strong>Nivel Residual</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {((riesgo.causas as any) || [])
                        .filter((c: any) => {
                          const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                          return tipo === 'CONTROL' || tipo === 'AMBOS';
                        })
                        .map((causa: any, idx: number) => {
                          const datosCtrl = getDatosEvaluacionControlDesdeCausa(causa);
                          const residualCausa = calcularResidualPorCausa(causa);
                          let calificacionResidual = residualCausa?.riesgoResidual ?? causa.calificacionResidual ?? 'N/A';
                          let nivelRiesgoResidual = residualCausa?.nivelRiesgoResidual || causa.nivelRiesgoResidual || 'N/A';

                          if (nivelRiesgoResidual === 'N/A' && typeof calificacionResidual === 'number') {
                            nivelRiesgoResidual = calcularNivelRiesgo(residualCausa?.probabilidadResidual || 1, residualCausa?.impactoResidual || 1);
                          }

                          return (
                            <TableRow key={causa.id || idx}>
                              <TableCell sx={{ maxWidth: 220 }}><DescripcionControlCorta texto={datosCtrl.descripcionControl} /></TableCell>
                              <TableCell align="center">{datosCtrl.efectividad}</TableCell>
                              <TableCell align="center">{typeof calificacionResidual === 'number' ? calificacionResidual.toFixed(2) : calificacionResidual}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={nivelRiesgoResidual}
                                  size="small"
                                  sx={{
                                    backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual),
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
});

export default MapaRiesgoDetalleDialog;
