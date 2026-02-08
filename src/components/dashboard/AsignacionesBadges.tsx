import React, { useMemo } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  Domain as DomainIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';
import { colors } from '../../app/theme/colors';

interface AsignacionesBadgesProps {
  procesos?: any[];
}

/**
 * Componente que muestra tarjetas de áreas asignadas y procesos asignados
 * Respeta los roles y mostrará:
 * - Supervisor: Solo sus áreas y procesos asignados
 * - Gerente General: Todas las áreas y procesos
 */
const AsignacionesBadges: React.FC<AsignacionesBadgesProps> = ({
  procesos = [],
}) => {
  const { esSupervisorRiesgos, esGerenteGeneralDirector } = useAuth();
  const { areas: areaIds, procesos: procesoIds } = useAreasProcesosAsignados();

  // Calcular las áreas y procesos a mostrar según el rol
  const { areasAMostrar, procesosAMostrar, cantidadAreas, cantidadProcesos } =
    useMemo(() => {
      if (esGerenteGeneralDirector) {
        // Gerente general: Todas las áreas y procesos de la empresa
        const todasLasAreas = [
          ...new Set(procesos.map((p: any) => p.areaNombre || p.area).filter(Boolean)),
        ].sort() as string[];
        const todosProcesos = procesos.map((p: any) => p.nombre).sort();

        return {
          areasAMostrar: todasLasAreas.slice(0, 5),
          procesosAMostrar: todosProcesos.slice(0, 5),
          cantidadAreas: todasLasAreas.length,
          cantidadProcesos: todosProcesos.length,
        };
      } else if (esSupervisorRiesgos) {
        // Supervisor: Solo sus procesos asignados + sus áreas derivadas
        const procesosAsignados = procesos.filter((p: any) => procesoIds.includes(p.id));
        
        // Obtener áreas únicas de los procesos asignados
        const areasDeProesos = [
          ...new Set(
            procesosAsignados
              .map((p: any) => p.areaNombre || p.area)
              .filter(Boolean)
          ),
        ].sort() as string[];

        const procesosUnicos = procesosAsignados.map((p: any) => p.nombre).sort();

        return {
          areasAMostrar: areasDeProesos.slice(0, 5),
          procesosAMostrar: procesosUnicos.slice(0, 5),
          cantidadAreas: areasDeProesos.length,
          cantidadProcesos: procesosUnicos.length,
        };
      }

      return {
        areasAMostrar: [],
        procesosAMostrar: [],
        cantidadAreas: 0,
        cantidadProcesos: 0,
      };
    }, [esSupervisorRiesgos, esGerenteGeneralDirector, procesos, procesoIds]);

  if (cantidadAreas === 0 && cantidadProcesos === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Grid2 container spacing={2}>
        {/* Tarjeta de Áreas Asignadas */}
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <Paper
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${colors.risk.high.main}15 0%, ${colors.risk.high.main}05 100%)`,
              borderLeft: `4px solid ${colors.risk.high.main}`,
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <DomainIcon
                sx={{
                  mr: 1,
                  color: colors.risk.high.main,
                  fontSize: 22,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: colors.risk.high.main }}
              >
                Áreas Asignadas
              </Typography>
              <Box
                sx={{
                  ml: 'auto',
                  backgroundColor: colors.risk.high.main,
                  color: '#fff',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {cantidadAreas}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {areasAMostrar.length > 0 ? (
                <>
                  {areasAMostrar.map((area) => (
                    <Chip
                      key={area}
                      label={area}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: colors.risk.high.main,
                        color: colors.risk.high.main,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                  {cantidadAreas > 5 && (
                    <Chip
                      label={`+${cantidadAreas - 5}`}
                      size="small"
                      sx={{
                        backgroundColor: colors.risk.high.main,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </>
              ) : (
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Sin áreas asignadas
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid2>

        {/* Tarjeta de Procesos Asignados */}
        <Grid2 size={{ xs: 12, sm: 6 }}>
          <Paper
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${colors.risk.critical.main}15 0%, ${colors.risk.critical.main}05 100%)`,
              borderLeft: `4px solid ${colors.risk.critical.main}`,
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <FolderIcon
                sx={{
                  mr: 1,
                  color: colors.risk.critical.main,
                  fontSize: 22,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: colors.risk.critical.main }}
              >
                Procesos Asignados
              </Typography>
              <Box
                sx={{
                  ml: 'auto',
                  backgroundColor: colors.risk.critical.main,
                  color: '#fff',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {cantidadProcesos}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {procesosAMostrar.length > 0 ? (
                <>
                  {procesosAMostrar.map((proceso) => (
                    <Chip
                      key={proceso}
                      label={proceso}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: colors.risk.critical.main,
                        color: colors.risk.critical.main,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                  {cantidadProcesos > 5 && (
                    <Chip
                      label={`+${cantidadProcesos - 5}`}
                      size="small"
                      sx={{
                        backgroundColor: colors.risk.critical.main,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}
                </>
              ) : (
                <Typography variant="caption" sx={{ color: '#999' }}>
                  Sin procesos asignados
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default AsignacionesBadges;
