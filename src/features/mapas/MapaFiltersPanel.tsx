import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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

  return (
    <>
      {/* Filtros de Área / Proceso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {mostrarFiltrosProceso && (
              <>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filtrar por Área</InputLabel>
                  <Select
                    value={filtroArea || 'all'}
                    onChange={(e) => {
                      const value = String(e.target.value || 'all');
                      setFiltroArea(value);
                      setFiltroProceso('all'); // Reset proceso cuando cambia área
                    }}
                    label="Filtrar por Área"
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
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Filtrar por Proceso</InputLabel>
                  <Select
                    value={filtroProceso || 'all'}
                    onChange={(e) => setFiltroProceso(String(e.target.value))}
                    label="Filtrar por Proceso"
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
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Leyenda
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {clasificacion === CLASIFICACION_RIESGO.POSITIVA ? (
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

