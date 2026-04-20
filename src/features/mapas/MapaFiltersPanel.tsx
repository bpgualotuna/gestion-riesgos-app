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

interface ProcesoBasico {
  id: string | number;
  nombre: string;
  areaId?: string | number | null;
  areaNombre?: string | null;
}

interface AreaBasica {
  id: string | number;
  nombre: string;
}

interface Props {
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

  const tabTipoMapa =
    clasificacion === CLASIFICACION_RIESGO.POSITIVA ? 1 : 0;

  const esPositivo = clasificacion === CLASIFICACION_RIESGO.POSITIVA;

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
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Proceso</InputLabel>
                  <Select
                    value={filtroProceso || 'all'}
                    onChange={(e) => setFiltroProceso(String(e.target.value))}
                    label="Proceso"
                  >
                    <MenuItem value="all">Todos los procesos</MenuItem>
                    {procesosFiltradosPorArea.map((proceso) => (
                      <MenuItem
                        key={String(proceso.id)}
                        value={String(proceso.id)}
                      >
                        {proceso.nombre}
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
            value={tabTipoMapa}
            onChange={(_, v) => {
              setClasificacion(
                v === 1
                  ? CLASIFICACION_RIESGO.POSITIVA
                  : CLASIFICACION_RIESGO.NEGATIVA,
              );
            }}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {esPositivo
              ? 'Solo riesgos con consecuencia positiva. La evaluación inherente usa la lógica de oportunidades (no la misma que el Excel de amenazas).'
              : 'Riesgos que ya traían del Excel, migración o marcados como negativos: todo excepto oportunidades explícitas. Misma lógica de mapa y causas que antes.'}
          </Typography>

          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Leyenda de niveles (esta pestaña)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {esPositivo ? (
              <>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#1565c0',
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
                      backgroundColor: '#42a5f5',
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
                      backgroundColor: '#757575',
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
                      backgroundColor: '#bdbdbd',
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
