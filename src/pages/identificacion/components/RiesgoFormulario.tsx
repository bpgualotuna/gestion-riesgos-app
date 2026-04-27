import { memo, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Autocomplete,
  Tooltip,
  Divider,
  Skeleton,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { RiesgoFormData, CausaRiesgo } from '../../../types';
import { repairSpanishDisplayArtifacts } from '../../../utils/utf8Repair';

// Helpers que estaban en IdentificacionCalificacionPage
const getSubtipoCodigo = (subtipo: any): string => {
  return (subtipo?.nombre ?? subtipo?.codigo ?? subtipo?.id ?? '').toString();
};

const getFuenteLabel = (fuentes: any, clave: any) => {
  if (!fuentes) return '';
  const keyStr = String(clave ?? '');
  if (Array.isArray(fuentes)) {
    const found = fuentes.find((f: any) => String(f.id ?? f.codigo ?? f.nombre) === keyStr || String(f.id) === keyStr);
    if (found) {
      const nombre = (found?.nombre ?? found?.label ?? found)?.toString?.();
      if (typeof nombre === 'string') return nombre;
      if (typeof found.nombre === 'object') return (found.nombre?.nombre ?? JSON.stringify(found.nombre));
      return String(found);
    }
    return keyStr;
  }
  const val = fuentes[keyStr] ?? fuentes[Number(keyStr)];
  if (val === undefined || val === null) return keyStr;
  if (typeof val === 'object') {
    return (val.nombre ?? val.label ?? val.name ?? JSON.stringify(val)).toString();
  }
  return String(val);
};

interface RiesgoFormularioProps {
  riesgo: RiesgoFormData;
  actualizarRiesgo: (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => void;
  isReadOnly: boolean;
  procesoSeleccionado: any;
  onSave: () => void;
  onAgregarCausa: (riesgoId: string) => void;
  onEditarCausa: (riesgoId: string, causa: CausaRiesgo) => void;
  onEliminarCausa: (riesgoId: string, causaId: string) => void;
  causaEliminando?: string | null;
  onVerDetalleCausa: (causa: CausaRiesgo) => void;
  tiposRiesgos: any[];
  origenes: any[];
  tiposProceso: any[];
  consecuencias: any[];
  objetivos: any[];
  labelsFrecuencia: any;
  fuentesCausa: any;
  descripcionesImpacto: any;
  tipologiasTipo1ParaAutocomplete: any[];
}

export const RiesgoFormulario = memo(function RiesgoFormulario({
  riesgo,
  actualizarRiesgo,
  isReadOnly,
  procesoSeleccionado,
  onSave,
  onAgregarCausa,
  onEditarCausa,
  onEliminarCausa,
  tiposRiesgos,
  origenes,
  tiposProceso,
  consecuencias,
  objetivos,
  labelsFrecuencia,
  fuentesCausa,
  descripcionesImpacto,
  causaEliminando,
  onVerDetalleCausa,
  tipologiasTipo1ParaAutocomplete,
}: RiesgoFormularioProps) {
  const tipoRiesgoSeleccionado = useMemo(() => {
    const tid = (riesgo as any).tipoRiesgoId;
    return (
      (tiposRiesgos || []).find(
        (t: any) =>
          (tid != null && String(t.id) === String(tid)) ||
          t.nombre === riesgo.tipoRiesgo ||
          t.codigo === riesgo.tipoRiesgo ||
          String(t.id) === String(riesgo.tipoRiesgo)
      ) || null
    );
  }, [riesgo.tipoRiesgo, (riesgo as any).tipoRiesgoId, tiposRiesgos]);

  const objetivoSelectValue = useMemo(() => {
    const v = riesgo.objetivo;
    if (v == null || v === '') return '';
    const s = String(v);
    if (objetivos?.some((o: any) => String(o.id) === s)) return s;
    const byCombo = objetivos?.find(
      (o: any) => `${String(o.codigo)} ${o.descripcion}`.trim() === s.trim()
    );
    if (byCombo) return String(byCombo.id);
    return s;
  }, [riesgo.objetivo, objetivos]);

  const etiquetaObjetivoSeleccionado = useCallback(
    (selected: string) => {
      if (!selected) return '';
      const s = String(selected);
      const obj = objetivos?.find((o: any) => String(o.id) === s);
      if (obj?.descripcion) return obj.descripcion;
      const byCombo = objetivos?.find(
        (o: any) => `${String(o.codigo)} ${o.descripcion}`.trim() === s.trim()
      );
      if (byCombo?.descripcion) return byCombo.descripcion;
      const m = s.match(/^\s*\d+\s+(.+)$/);
      return m ? m[1] : s;
    },
    [objetivos]
  );

  const impactos: RiesgoFormData['impactos'] = {
    economico: 1,
    procesos: 1,
    legal: 1,
    confidencialidadSGSI: 1,
    reputacion: 1,
    disponibilidadSGSI: 1,
    personas: 1,
    integridadSGSI: 1,
    ambiental: 1,
    ...(riesgo.impactos || {})
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
      {/* Panel RIESGO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            RIESGO
          </Typography>
        </Box>

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción del Riesgo"
                  value={riesgo.descripcionRiesgo}
                  onChange={(e) => actualizarRiesgo(riesgo.id, { descripcionRiesgo: e.target.value })}
                  disabled={isReadOnly}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.9rem',
                    },
                  }}
                />
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ width: '40%', fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Origen del riesgo
                        </TableCell>
                        <TableCell sx={{ width: '60%' }}>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.origenRiesgo || ''}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { origenRiesgo: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                            >
                              {(!origenes || origenes.length === 0) ? (
                                <MenuItem value={riesgo.origenRiesgo || ''}>{riesgo.origenRiesgo || 'Seleccionar'}</MenuItem>
                              ) : (
                                origenes.map((o) => (
                                  <MenuItem key={o.id} value={o.nombre}>{o.nombre}</MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          # Identificación
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={riesgo.numeroIdentificacion || ''}
                            disabled={true}
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Proceso
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={procesoSeleccionado?.nombre || ''}
                            disabled
                            variant="standard"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Consecuencia
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.consecuencia || ''}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { consecuencia: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                            >
                              {(!consecuencias || consecuencias.length === 0) ? (
                                <MenuItem value={riesgo.consecuencia || ''}>{riesgo.consecuencia || 'Seleccionar'}</MenuItem>
                              ) : (
                                consecuencias.map((c) => (
                                  <MenuItem key={c.id} value={c.nombre}>{c.nombre}</MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>

            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipología tipo I
                        </TableCell>
                        <TableCell>
                          <Autocomplete
                            value={riesgo.tipoRiesgo ? (() => {
                              const tipo = (tiposRiesgos || []).find((t: any) =>
                                String(t.id) === String((riesgo as any).tipoRiesgoId) ||
                                t.nombre === riesgo.tipoRiesgo ||
                                t.codigo === riesgo.tipoRiesgo ||
                                String(t.id) === riesgo.tipoRiesgo
                              );
                              return tipo || null;
                            })() : null}
                            onChange={(_, newValue) => {
                              if (newValue) {
                                actualizarRiesgo(riesgo.id, { tipoRiesgoId: newValue.id, tipoRiesgo: newValue.nombre || newValue.codigo, subtipoRiesgoId: null, subtipoRiesgo: '' });
                              } else {
                                actualizarRiesgo(riesgo.id, { tipoRiesgoId: null, tipoRiesgo: '', subtipoRiesgoId: null, subtipoRiesgo: '' });
                              }
                            }}
                            options={tipologiasTipo1ParaAutocomplete}
                            getOptionLabel={(option) =>
                              repairSpanishDisplayArtifacts(String(option.nombre || option.codigo || ''))
                            }
                            disabled={isReadOnly}
                            size="small"
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="standard"
                                placeholder="Buscar tipología tipo I..."
                                sx={{ fontSize: '0.875rem' }}
                                InputProps={{
                                  ...params.InputProps,
                                  disableUnderline: true,
                                }}
                              />
                            )}
                            sx={{
                              width: '100%',
                              '& .MuiAutocomplete-input': {
                                fontSize: '0.875rem',
                              },
                            }}
                            renderOption={(props, option) => (
                              <Tooltip
                                title={repairSpanishDisplayArtifacts(String(option.descripcion || ''))}
                                placement="right"
                                arrow
                                enterDelay={300}
                              >
                                <Box component="li" {...props} sx={{ py: 0.75 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                    {repairSpanishDisplayArtifacts(String(option.nombre || option.codigo || ''))}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            )}
                          />
                        </TableCell>
                      </TableRow>

                      {riesgo.tipoRiesgo && tipoRiesgoSeleccionado && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                              {repairSpanishDisplayArtifacts(String(tipoRiesgoSeleccionado.descripcion || ''))}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipología tipo II
                        </TableCell>
                        <TableCell>
                          {riesgo.tipoRiesgo && tipoRiesgoSeleccionado ? (
                            <Autocomplete
                              value={riesgo.subtipoRiesgo || (riesgo as any).subtipoRiesgoId ? (() => {
                                const tipoObj = (tiposRiesgos || []).find((t: any) =>
                                  String(t.id) === String((riesgo as any).tipoRiesgoId) ||
                                  t.nombre === riesgo.tipoRiesgo ||
                                  t.codigo === riesgo.tipoRiesgo
                                );
                                if (!tipoObj) return null;
                                return tipoObj.subtipos.find((s: any) =>
                                  String(s.id) === String((riesgo as any).subtipoRiesgoId) ||
                                  s.nombre === riesgo.subtipoRiesgo ||
                                  s.codigo === riesgo.subtipoRiesgo ||
                                  getSubtipoCodigo(s) === riesgo.subtipoRiesgo
                                ) || null;
                              })() : null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgoId: newValue.id, subtipoRiesgo: newValue.nombre || newValue.codigo });
                                } else {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgoId: null, subtipoRiesgo: '' });
                                }
                              }}
                              options={tipoRiesgoSeleccionado.subtipos}
                              getOptionLabel={(option) =>
                                repairSpanishDisplayArtifacts(
                                  String(option.nombre || option.codigo || getSubtipoCodigo(option))
                                )
                              }
                              disabled={isReadOnly}
                              size="small"
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="standard"
                                  placeholder="Buscar tipología tipo II..."
                                  sx={{ fontSize: '0.875rem' }}
                                  InputProps={{
                                    ...params.InputProps,
                                    disableUnderline: true,
                                  }}
                                />
                              )}
                              sx={{
                                width: '100%',
                                '& .MuiAutocomplete-input': {
                                  fontSize: '0.875rem',
                                },
                              }}
                              renderOption={(props, option) => {
                                const desc = repairSpanishDisplayArtifacts(String(option.descripcion ?? '')).trim();
                                const label = repairSpanishDisplayArtifacts(
                                  String(option.nombre || option.codigo || getSubtipoCodigo(option))
                                );
                                const row = (
                                  <Box component="li" {...props} sx={{ py: 0.75 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                      {label}
                                    </Typography>
                                  </Box>
                                );
                                if (!desc) return row;
                                return (
                                  <Tooltip title={desc} placement="right" arrow enterDelay={300}>
                                    {row}
                                  </Tooltip>
                                );
                              }}
                            />
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              value=""
                              disabled
                              placeholder="Seleccione primero tipología tipo I"
                              variant="standard"
                              sx={{ fontSize: '0.875rem' }}
                              InputProps={{ disableUnderline: true }}
                            />
                          )}
                        </TableCell>
                      </TableRow>

                      {riesgo.subtipoRiesgo && tipoRiesgoSeleccionado && (() => {
                        const subtipoObj = tipoRiesgoSeleccionado.subtipos?.find((s: any) =>
                          String(s.id) === String((riesgo as any).subtipoRiesgoId) ||
                          s.nombre === riesgo.subtipoRiesgo ||
                          s.codigo === riesgo.subtipoRiesgo ||
                          getSubtipoCodigo(s) === riesgo.subtipoRiesgo
                        );
                        const texto = repairSpanishDisplayArtifacts(String(subtipoObj?.descripcion ?? '')).trim();
                        return texto ? (
                          <TableRow>
                            <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                {texto}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : null;
                      })()}

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipología tipo III
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={(riesgo as any).tipologiaTipo3 ?? ''}
                            onChange={(e) => actualizarRiesgo(riesgo.id, { tipologiaTipo3: e.target.value })}
                            disabled={isReadOnly}
                            variant="standard"
                            placeholder="Ingrese manualmente"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Tipología tipo IV
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            value={(riesgo as any).tipologiaTipo4 ?? ''}
                            onChange={(e) => actualizarRiesgo(riesgo.id, { tipologiaTipo4: e.target.value })}
                            disabled={isReadOnly}
                            variant="standard"
                            placeholder="Ingrese manualmente"
                            sx={{ fontSize: '0.875rem' }}
                            InputProps={{ disableUnderline: true }}
                          />
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                        <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                          Objetivo
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <InputLabel id="objetivo-label" sx={{ fontSize: '0.875rem' }}>
                              Seleccione un objetivo
                            </InputLabel>
                            <Select
                              labelId="objetivo-label"
                              value={objetivoSelectValue}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { objetivo: e.target.value })}
                              label="Seleccione un objetivo"
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccione un objetivo</span>;
                                }
                                return (
                                  <span style={{
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    display: 'block',
                                    maxWidth: '100%'
                                  }}>
                                    {etiquetaObjetivoSeleccionado(String(selected))}
                                  </span>
                                );
                              }}
                            >
                              {objetivos?.map((obj: any) => (
                                <MenuItem key={obj.id} value={String(obj.id)} sx={{ py: 0.5, fontSize: '0.875rem' }}>
                                  {obj.descripcion}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {/* Panel CAUSAS */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            CAUSAS (FRECUENCIA)
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper', width: '60px' }}>N°</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Causa</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Fuente</TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Frecuencia</TableCell>
                  {!isReadOnly && (
                    <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }} align="right">Acciones</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {riesgo.causas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isReadOnly ? 4 : 5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay causas registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  [...riesgo.causas]
                    .sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0))
                    .map((causa, index) => (
                      <TableRow
                        key={causa.id}
                        onClick={() => onVerDetalleCausa(causa)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            {index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {causa.descripcion.length > 80
                              ? `${causa.descripcion.substring(0, 80)}...`
                              : causa.descripcion}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {getFuenteLabel(fuentesCausa, causa.fuenteCausa) || 'Interna'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {labelsFrecuencia[causa.frecuencia || 3]?.label || ''}
                          </Typography>
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditarCausa(riesgo.id, causa);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEliminarCausa(riesgo.id, causa.id);
                              }}
                              color="error"
                              disabled={causaEliminando === String(causa.id) || !!causaEliminando}
                            >
                              {causaEliminando === String(causa.id) ? (
                                <Skeleton variant="rectangular" width={16} height={16} />
                              ) : (
                                <DeleteIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {!isReadOnly && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                fullWidth
                onClick={() => onAgregarCausa(riesgo.id)}
              >
                Agregar Causa
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Panel IMPACTO */}
      <Card sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            backgroundColor: '#1976d2',
            color: '#fff',
            py: 2,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
            IMPACTO
          </Typography>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Impacto económico */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Impacto económico</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.economico || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, economico: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.economico[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.economico} - {descripcionesImpacto.economico[impactos.economico || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Procesos */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Procesos</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.procesos || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, procesos: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.procesos[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.procesos} - {descripcionesImpacto.procesos[impactos.procesos || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Legal */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Legal</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.legal || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, legal: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.legal[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.legal} - {descripcionesImpacto.legal[impactos.legal || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Confidencialidad */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Confidencialidad SGSI</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.confidencialidadSGSI || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, confidencialidadSGSI: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.confidencialidadSGSI[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.confidencialidadSGSI} - {descripcionesImpacto.confidencialidadSGSI[impactos.confidencialidadSGSI || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Reputación */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Reputación</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.reputacion || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, reputacion: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.reputacion[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.reputacion} - {descripcionesImpacto.reputacion[impactos.reputacion || 1] || ''}
                  </Typography>
                </Box>
              </Box>
            </Grid2>

            <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Disponibilidad */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Disponibilidad SGSI</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.disponibilidadSGSI || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, disponibilidadSGSI: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.disponibilidadSGSI[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.disponibilidadSGSI} - {descripcionesImpacto.disponibilidadSGSI[impactos.disponibilidadSGSI || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Personas */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Personas</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.personas || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, personas: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.personas[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.personas} - {descripcionesImpacto.personas[impactos.personas || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Integridad */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Integridad SGSI</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.integridadSGSI || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, integridadSGSI: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.integridadSGSI[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.integridadSGSI} - {descripcionesImpacto.integridadSGSI[impactos.integridadSGSI || 1] || ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 0.5 }} />
                {/* Ambiental */}
                <Box sx={{ pb: 0.75, minHeight: 52 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body1" fontWeight={600}>Ambiental</Typography>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={impactos.ambiental || 1}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { impactos: { ...impactos, ambiental: Number(e.target.value) } })}
                        disabled={isReadOnly}
                      >
                        {[1, 2, 3, 4, 5].map((val) => (
                          <MenuItem key={val} value={val}>
                            <Tooltip title={descripcionesImpacto.ambiental[val] || ''} arrow placement="left">
                              <Box component="span" sx={{ width: '100%' }}>{val}</Box>
                            </Tooltip>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {impactos.ambiental} - {descripcionesImpacto.ambiental[impactos.ambiental || 1] || ''}
                  </Typography>
                </Box>
              </Box>
            </Grid2>
          </Grid2>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          fullWidth
          sx={{ mt: 3 }}
          onClick={onSave}
        >
          Guardar
        </Button>
      )}
    </Box>
  );
});
