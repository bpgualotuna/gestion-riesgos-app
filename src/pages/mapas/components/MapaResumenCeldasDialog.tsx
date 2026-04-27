import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
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
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { PuntoMapa, Riesgo } from '../../../types';
import { CLASIFICACION_RIESGO, NIVELES_RIESGO } from '../../../utils/constants';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';

interface MapaResumenCeldasDialogProps {
  open: boolean;
  onClose: () => void;
  celda: { probabilidad: number; impacto: number } | null;
  puntos: PuntoMapa[];
  riesgosCompletos: Riesgo[];
  procesos: any[];
  tipoMapa: 'inherente' | 'residual';
  riesgosExpandidos: Record<string, boolean>;
  onToggleExpand: (riesgoId: string) => void;
  generarIdRiesgo: (punto: PuntoMapa) => string;
  getColorByNivelRiesgo: (nivel: string) => string;
  calcularNivelRiesgo: (prob: number, imp: number) => string;
  getDatosEvaluacionControlDesdeCausa: (causa: any) => any;
  calcularResidualPorCausa: (causa: any) => any;
  DescripcionControlCorta: React.FC<{ texto: string }>;
  onVerDetalle: (riesgo: Riesgo, punto: PuntoMapa) => void;
}

const MapaResumenCeldasDialog = memo(({
  open,
  onClose,
  celda,
  puntos,
  riesgosCompletos,
  procesos,
  tipoMapa,
  riesgosExpandidos,
  onToggleExpand,
  generarIdRiesgo,
  getColorByNivelRiesgo,
  calcularNivelRiesgo,
  getDatosEvaluacionControlDesdeCausa,
  calcularResidualPorCausa,
  DescripcionControlCorta,
  onVerDetalle
}: MapaResumenCeldasDialogProps) => {
  if (!celda) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableScrollLock={true}>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Riesgos en Celda: Probabilidad {celda.probabilidad} / Impacto {celda.impacto}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minHeight: 300 }}>
        {puntos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography variant="body1" color="text.secondary">No hay riesgos en esta celda con los filtros actuales.</Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {puntos.map((punto) => {
              const riesgo = riesgosCompletos.find((r) => String(r.id) === String(punto.riesgoId));
              const isExpanded = !!riesgosExpandidos[String(punto.riesgoId)];
              const puntoExtendido = punto as PuntoMapa & {
                descripcionRiesgo?: string;
                updatedAt?: string;
                riesgoInherente?: number;
              };
              
              const descripcion = puntoExtendido.descripcionRiesgo || riesgo?.descripcionRiesgo || riesgo?.descripcion || 'Sin descripción';
              const zona = punto.zona || riesgo?.zona || '';
              const tipologia = punto.tipologiaNivelI || riesgo?.tipologiaNivelI || '';
              const fecha = puntoExtendido.updatedAt || riesgo?.updatedAt || new Date().toISOString();
              const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');

              const probabilidadInherente = punto.probabilidad;
              const impactoInherente = punto.impacto;
              const riesgoInherente = puntoExtendido.riesgoInherente || (probabilidadInherente * impactoInherente === 4 ? 3.99 : probabilidadInherente * impactoInherente);
              const nivelRiesgoInherente = punto.nivelRiesgo || calcularNivelRiesgo(probabilidadInherente, impactoInherente);

              const probabilidadResidual = punto.probabilidadResidual;
              const impactoResidual = punto.impactoResidual;
              const riesgoResidual = punto.riesgoResidual;
              const nivelRiesgoResidual = punto.nivelRiesgoResidual;

              const controlesAplicados = riesgo?.causas?.filter((c: any) => {
                const tipo = (c.tipoGestion || (c.puntajeTotal !== undefined ? 'CONTROL' : '')).toUpperCase();
                return tipo === 'CONTROL' || (tipo === 'AMBOS' && c.gestion?.estadoAmbos?.controlActivo !== false);
              }) || [];
              const tieneControl = controlesAplicados.length > 0;
              
              const planesAccion = riesgo?.causas?.filter((c: any) => {
                const tipo = (c.tipoGestion || '').toUpperCase();
                return tipo === 'PLAN' || (tipo === 'AMBOS' && c.gestion?.estadoAmbos?.planActivo !== false);
              }) || [];
              const tienePlanAccion = planesAccion.length > 0;

              return (
                <Accordion
                  key={punto.riesgoId}
                  expanded={isExpanded}
                  onChange={() => onToggleExpand(String(punto.riesgoId))}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{generarIdRiesgo(punto)}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={nivelRiesgoResidual || nivelRiesgoInherente || 'Sin calificar'}
                            size="small"
                            sx={{ backgroundColor: getColorByNivelRiesgo(nivelRiesgoResidual || nivelRiesgoInherente || 'Sin Calificar'), color: '#fff', height: 20, fontSize: '0.7rem' }}
                          />
                          {!tieneControl && <Chip label="Sin control" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                          <Chip
                            label={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'Oportunidad' : 'Riesgo Negativo'}
                            size="small"
                            color={punto.clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto', mr: 2 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{fechaFormateada}</Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Card sx={{ mb: 2, bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                        <CardContent>
                          <Typography variant="subtitle2" fontWeight={600}>Información del Riesgo</Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>{repairSpanishDisplayArtifacts(String(descripcion))}</Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {zona && <Typography variant="body2"><strong>Zona:</strong> {repairSpanishDisplayArtifacts(String(zona))}</Typography>}
                            {tipologia && <Typography variant="body2"><strong>Tipología:</strong> {repairSpanishDisplayArtifacts(String(tipologia))}</Typography>}
                          </Box>
                        </CardContent>
                      </Card>

                      {!tieneControl && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <strong>Sin controles aplicados.</strong> La calificación residual es igual a la inherente.
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Card sx={{ flex: 1, bgcolor: 'rgba(211, 47, 47, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight={600} color="error">Inherente</Typography>
                            <Typography variant="body2">P: {probabilidadInherente} / I: {impactoInherente}</Typography>
                            <Typography variant="body2">Val: {riesgoInherente}</Typography>
                          </CardContent>
                        </Card>
                        <Card sx={{ flex: 1, bgcolor: 'rgba(46, 125, 50, 0.05)' }}>
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight={600} color="success.main">Residual</Typography>
                            <Typography variant="body2">P: {probabilidadResidual || probabilidadInherente} / I: {impactoResidual || impactoInherente}</Typography>
                            <Typography variant="body2">Val: {riesgoResidual || riesgoInherente}</Typography>
                          </CardContent>
                        </Card>
                      </Box>

                      {tienePlanAccion && (
                        <Card sx={{ mb: 2, bgcolor: 'rgba(255, 152, 0, 0.06)' }}>
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight={600}>Planes de acción ({planesAccion.length})</Typography>
                            <List dense disablePadding>
                              {planesAccion.map((causa: any, idx: number) => {
                                const g = causa.gestion || {};
                                const desc = g.planDescripcion || causa.planDescripcion || causa.descripcion || 'Sin descripción';
                                return (
                                  <ListItem key={causa.id || idx} disableGutters>
                                    <ListItemText primary={repairSpanishDisplayArtifacts(desc)} primaryTypographyProps={{ variant: 'caption' }} />
                                  </ListItem>
                                );
                              })}
                            </List>
                          </CardContent>
                        </Card>
                      )}

                      {controlesAplicados.length > 0 && (
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                          <Table size="small">
                            <TableHead><TableRow sx={{ bgcolor: '#f5f5f5' }}><TableCell>Control</TableCell><TableCell align="center">Efect.</TableCell><TableCell align="center">Resid.</TableCell></TableRow></TableHead>
                            <TableBody>
                              {controlesAplicados.map((causa: any, idx: number) => {
                                const datosCtrl = getDatosEvaluacionControlDesdeCausa(causa);
                                const residualCausa = calcularResidualPorCausa(causa);
                                return (
                                  <TableRow key={causa.id || idx}>
                                    <TableCell><DescripcionControlCorta texto={datosCtrl.descripcionControl} /></TableCell>
                                    <TableCell align="center">{datosCtrl.efectividad}</TableCell>
                                    <TableCell align="center">{residualCausa?.riesgoResidual?.toFixed(2) || 'N/A'}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                      
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          size="small" 
                          onClick={() => riesgo && onVerDetalle(riesgo, punto)}
                          sx={{ borderRadius: 2 }}
                        >
                          Ver Detalle Completo
                        </Button>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
});

export default MapaResumenCeldasDialog;
