/**
 * Dashboard Page
 * Overview with statistics and recent risks
 */

import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useGetEstadisticasQuery, useGetRiesgosRecientesQuery } from '../../gestion-riesgos/api/riesgosApi';
import { colors, getRiskColor } from '../../../app/theme/colors';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { formatDate } from '../../../utils/formatters';

export default function DashboardPage() {
  const { data: estadisticas } = useGetEstadisticasQuery();
  const { data: riesgosRecientes, isLoading: loadingRecientes } = useGetRiesgosRecientesQuery(10);

  const columns: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro',
      width: 80,
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'nivelRiesgo',
      headerName: 'Nivel',
      width: 150,
      renderCell: (params) => {
        const nivel = params.row.evaluacion?.nivelRiesgo || 'Sin evaluar';
        return (
          <Chip
            label={nivel}
            size="small"
            sx={{
              backgroundColor: nivel !== 'Sin evaluar' ? getRiskColor(nivel) : colors.grey[600],
              color: '#fff',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: 'fechaUltimaModificacion',
      headerName: 'Última Modificación',
      width: 180,
      valueFormatter: (value) => formatDate(value),
    },
  ];

  const stats = [
    {
      title: 'Riesgos Críticos',
      value: estadisticas?.criticos || 0,
      icon: <ErrorIcon sx={{ fontSize: 40 }} />,
      color: colors.risk.critical.main,
      bgColor: 'rgba(211, 47, 47, 0.1)',
    },
    {
      title: 'Riesgos Altos',
      value: estadisticas?.altos || 0,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: colors.risk.high.main,
      bgColor: 'rgba(245, 124, 0, 0.1)',
    },
    {
      title: 'Riesgos Medios',
      value: estadisticas?.medios || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: colors.risk.medium.main,
      bgColor: 'rgba(251, 192, 45, 0.1)',
    },
    {
      title: 'Riesgos Bajos',
      value: estadisticas?.bajos || 0,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: colors.risk.low.main,
      bgColor: 'rgba(56, 142, 60, 0.1)',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Resumen general del sistema de gestión de riesgos
      </Typography>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat, index) => (
          <Card
            key={index}
            sx={{
              background: stat.bgColor,
              border: `2px solid ${stat.color}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" fontWeight={700} color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Additional Stats */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total de Riesgos
            </Typography>
            <Typography variant="h3" fontWeight={700} color="primary">
              {estadisticas?.totalRiesgos || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Riesgos Evaluados
            </Typography>
            <Typography variant="h3" fontWeight={700} color="success.main">
              {estadisticas?.evaluados || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sin Evaluar
            </Typography>
            <Typography variant="h3" fontWeight={700} color="warning.main">
              {estadisticas?.sinEvaluar || 0}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Risks Table */}
      <Box>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Riesgos Recientes
        </Typography>
        <AppDataGrid
          rows={riesgosRecientes || []}
          columns={columns}
          loading={loadingRecientes}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
}
