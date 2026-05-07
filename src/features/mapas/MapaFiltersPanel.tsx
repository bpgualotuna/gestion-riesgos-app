import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { CLASIFICACION_RIESGO } from '../../utils/constants';
import { colors } from '../../app/theme/colors';
import { MAPA_POSITIVO_COLORES } from '../../utils/mapaPositivoPalette';
import DashboardFiltros from '../../components/dashboard/DashboardFiltros';

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
  filtroAreaNombres: string[];
  filtroProcesoIds: string[];
  setFiltroAreaNombres: (value: string[]) => void;
  setFiltroProcesoIds: (value: string[]) => void;
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
  filtroAreaNombres,
  filtroProcesoIds,
  setFiltroAreaNombres,
  setFiltroProcesoIds,
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

  const esPositivo = vistaMapaTab === 1;
  const procesosParaFiltro = React.useMemo(() => {
    return procesosPropios.map((p) => {
      const areaNombre =
        p.areaNombre ??
        areas.find((a) => String(a.id) === String(p.areaId))?.nombre ??
        'Sin área';
      return {
        id: p.id,
        nombre: etiquetaProcesoConSigla(p),
        sigla: p.sigla ?? null,
        areaNombre,
      };
    });
  }, [areas, procesosPropios]);

  return (
    <>
      {/* 1. Filtros arriba */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          {mostrarFiltrosProceso ? (
            <DashboardFiltros
              filtroAreaNombres={filtroAreaNombres}
              onFiltroAreaNombresChange={setFiltroAreaNombres}
              filtroProcesoIds={filtroProcesoIds}
              onFiltroProcesoIdsChange={setFiltroProcesoIds}
              filtroOrigen="all"
              onFiltroOrigenChange={() => {}}
              procesos={procesosParaFiltro}
              ocultarFiltroOrigen
            />
          ) : (
            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Sin filtro por área/proceso en este rol; se muestran los riesgos
                según sus permisos.
              </Typography>
            </Box>
          )}
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
