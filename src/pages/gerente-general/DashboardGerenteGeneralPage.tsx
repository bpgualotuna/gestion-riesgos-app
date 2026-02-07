/**
 * Dashboard Gerencial para Gerente General
 * Resumen ejecutivo de todos los procesos y áreas
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
  BusinessCenter as BusinessCenterIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useGetProcesosQuery, useGetRiesgosQuery, useGetPuntosMapaQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import TotalRiesgosCard from '../../components/dashboard/TotalRiesgosCard';
import RiesgosPorProcesoCard from '../../components/dashboard/RiesgosPorProcesoCard';
import RiesgosPorTipologiaCard from '../../components/dashboard/RiesgosPorTipologiaCard';
import OrigenRiesgosCard from '../../components/dashboard/OrigenRiesgosCard';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';

export default function DashboardGerenteGeneralPage() {
  const navigate = useNavigate();
  const { esGerenteGeneral } = useAuth();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000 });
  const { data: puntosMapa } = useGetPuntosMapaQuery({});

  const riesgos = riesgosData?.data || [];
  const puntos = puntosMapa || [];

  // Estadísticas generales - todos los procesos y riesgos
  const estadisticas = useDashboardEstadisticas({ riesgosFiltrados: riesgos, procesos, puntos });

  // Agrupar procesos por área/departamento
  const procesosPorArea = useMemo(() => {
    const agrupados: Record<string, { procesos: any[]; total: number }> = {};
    procesos.forEach((p: any) => {
      const area = p.areaNombre || p.department || 'Sin área';
      if (!agrupados[area]) {
        agrupados[area] = { procesos: [], total: 0 };
      }
      agrupados[area].procesos.push(p);
      agrupados[area].total++;
    });
    return agrupados;
  }, [procesos]);

  // Procesos por estado
  const procesosPorEstado = useMemo(() => {
    const estados: Record<string, number> = {};
    procesos.forEach((p: any) => {
      const estado = p.estado || 'borrador';
      estados[estado] = (estados[estado] || 0) + 1;
    });
    return estados;
  }, [procesos]);

  if (!esGerenteGeneral) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">No tiene permisos para acceder a esta página.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Resumen Gerencial
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vista ejecutiva de todos los procesos y riesgos de la organización
        </Typography>
      </Box>

      {/* KPIs Principales */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        <Grid2 xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Procesos
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {procesos.length}
                  </Typography>
                </Box>
                <BusinessCenterIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Riesgos
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {estadisticas.total}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Áreas
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {Object.keys(procesosPorArea).length}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Riesgos Críticos
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {estadisticas.porTipologia['01 Estratégico'] || 0}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 48, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Gráficos de Riesgos */}
      <Grid2 container spacing={3} sx={{ mb: 4 }}>
        <Grid2 xs={12} md={6}>
          <TotalRiesgosCard
            total={estadisticas.total}
            criticos={estadisticas.porTipologia['01 Estratégico'] || 0}
            altos={estadisticas.porTipologia['02 Operacional'] || 0}
          />
        </Grid2>
        <Grid2 xs={12} md={6}>
          <RiesgosPorTipologiaCard datos={estadisticas.porTipologia} />
        </Grid2>
        <Grid2 xs={12} md={6}>
          <RiesgosPorProcesoCard datosReales={estadisticas.porProceso} />
        </Grid2>
        <Grid2 xs={12} md={6}>
          <OrigenRiesgosCard datos={estadisticas.origen} total={estadisticas.total} />
        </Grid2>
      </Grid2>

      {/* Procesos por Área */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Procesos por Área
          </Typography>
          <Grid2 container spacing={2}>
            {Object.entries(procesosPorArea).map(([area, data]) => (
              <Grid2 xs={12} sm={6} md={4} key={area}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                    {area}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {data.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    procesos
                  </Typography>
                </Card>
              </Grid2>
            ))}
          </Grid2>
        </CardContent>
      </Card>

      {/* Procesos por Estado */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Procesos por Estado
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(procesosPorEstado).map(([estado, count]) => (
              <Chip
                key={estado}
                label={`${estado}: ${count}`}
                color={
                  estado === 'aprobado'
                    ? 'success'
                    : estado === 'en_revision'
                    ? 'warning'
                    : 'default'
                }
                sx={{ fontSize: '1rem', p: 2, height: 'auto' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}



