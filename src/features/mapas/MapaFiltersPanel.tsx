import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { CLASIFICACION_RIESGO } from '../../utils/constants';
import { colors } from '../../app/theme/colors';
import { MAPA_POSITIVO_COLORES } from '../../utils/mapaPositivoPalette';

interface ProcesoBasico {
  id: string | number;
  nombre: string;
  /** Sigla del proceso (ej. mapa de calor / códigos de riesgo). */
  sigla?: string | null;
  areaId?: string | number | null;
  areaNombre?: string | null;
}

function etiquetaProcesoConSigla(p: ProcesoBasico): string {
  const s = p.sigla != null && String(p.sigla).trim() !== '' ? String(p.sigla).trim() : '';
  return s ? `${p.nombre} (${s})` : p.nombre;
}

interface AreaBasica {
  id: string | number;
  nombre: string;
}

interface Props {
  /** 0 = consecuencias negativas, 1 = positivas */
  vistaMapaTab: number;
  setVistaMapaTab: (value: number) => void;
  clasificacion: string;
  setClasificacion: (value: string) => void;
  filtroArea: string;
  filtroProceso: string;
  setFiltroArea: (value: string) => void;
  setFiltroProceso: (value: string) => void;
  esSupervisorRiesgos: boolean;
  esDueñoProcesos: boolean;
  esGerenteGeneralDirector: boolean;
  esGerenteGeneralProceso: boolean;
  procesosPropios: ProcesoBasico[];
  areas: AreaBasica[];
}

const MapaFiltersPanel: React.FC<Props> = ({
  vistaMapaTab,
  setVistaMapaTab,
  clasificacion,
  setClasificacion,
  filtroArea,
  filtroProceso,
  setFiltroArea,
  setFiltroProceso,
  esSupervisorRiesgos,
  esDueñoProcesos,
  esGerenteGeneralDirector,
  esGerenteGeneralProceso,
  procesosPropios,
  areas,
}) => {
  const mostrarFiltrosProceso =
    (esSupervisorRiesgos ||
      esDueñoProcesos ||
      esGerenteGeneralDirector ||
      esGerenteGeneralProceso) &&
    procesosPropios.length > 0;

  const areaIdsUnicos = Array.from(
    new Set(procesosPropios.map((p) => p.areaId).filter(Boolean)),
  );

  const procesosFiltradosPorArea = procesosPropios.filter(
    (p) =>
      !filtroArea ||
      filtroArea === 'all' ||
      String(p.areaId) === String(filtroArea),
  );

  const esPositivo = vistaMapaTab === 1;

  return (
    <>
      {/* 1. Filtros arriba */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Filtros
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {mostrarFiltrosProceso ? (
              <>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Área</InputLabel>
                  <Select
                    value={filtroArea || 'all'}
                    onChange={(e) => {
                      const value = String(e.target.value || 'all');
                      setFiltroArea(value);
                      setFiltroProceso('all');
                    }}
                    label="Área"
                  >
                    <MenuItem value="all">Todas las áreas</MenuItem>
                    {areaIdsUnicos.map((areaId) => {
                      const proceso = procesosPropios.find(
                        (p) => p.areaId === areaId,
                      );
                      const area = areas.find((a) => a.id === areaId);
                      return (
                        <MenuItem key={String(areaId)} value={String(areaId)}>
                          {area?.nombre ||
                            proceso?.areaNombre ||
                            `Área ${String(areaId)}`}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 280, maxWidth: '100%' }}>
                  <InputLabel>Proceso</InputLabel>
                  <Select
                    value={filtroProceso || 'all'}
                    onChange={(e) => setFiltroProceso(String(e.target.value))}
                    label="Proceso"
                    renderValue={(value) => {
                      if (value === 'all' || value == null || value === '') {
                        return 'Todos los procesos';
                      }
                      const p = procesosFiltradosPorArea.find((x) => String(x.id) === String(value));
                      return p ? etiquetaProcesoConSigla(p) : String(value);
                    }}
                  >
                    <MenuItem value="all">Todos los procesos</MenuItem>
                    {procesosFiltradosPorArea.map((proceso) => (
                      <MenuItem
                        key={String(proceso.id)}
                        value={String(proceso.id)}
                      >
                        {etiquetaProcesoConSigla(proceso)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Sin filtro por área/proceso en este rol; se muestran los riesgos
                según sus permisos.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 2. Pestañas: dos mapas distintos (colores distintos) */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pt: 2, pb: 2 }}>
          <Tabs
            value={vistaMapaTab}
            onChange={(_, v) => {
              const n = Number(v);
              setVistaMapaTab(n);
              if (n === 0) {
                setClasificacion(CLASIFICACION_RIESGO.NEGATIVA);
              } else if (n === 1) {
                setClasificacion(CLASIFICACION_RIESGO.POSITIVA);
              }
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              mb: 2,
              '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' },
            }}
          >
            <Tab label="Consecuencias Negativas" />
            <Tab label="Consecuencias Positivas" />
          </Tabs>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {esPositivo ? (
              <>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: MAPA_POSITIVO_COLORES.extremo,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Extremo</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: MAPA_POSITIVO_COLORES.alto,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Alto</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: MAPA_POSITIVO_COLORES.medio,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Medio</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: MAPA_POSITIVO_COLORES.bajo,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Bajo</Typography>
                </Box>
              </>
            ) : (
              <>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: colors.risk.critical.main,
                      borderRadius: 1,
                    }}
                  />
                  <Typography variant="body2">Crítico</Typography>
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
                  <Typography variant="body2">Alto</Typography>
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
                  <Typography variant="body2">Medio</Typography>
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
                  <Typography variant="body2">Bajo</Typography>
                </Box>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

export default MapaFiltersPanel;
