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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetProcesosQuery, useGetRiesgosQuery, useGetPuntosMapaQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import TotalRiesgosCard from '../../components/dashboard/TotalRiesgosCard';
import RiesgosPorProcesoCard from '../../components/dashboard/RiesgosPorProcesoCard';
import { useDashboardEstadisticas } from '../../hooks/useDashboardEstadisticas';

export default function DashboardGerenteGeneralPage() {
  const navigate = useNavigate();
  const { esGerenteGeneral } = useAuth();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery({ pageSize: 1000, includeCausas: true });
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
          <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Riesgo Inherente vs Residual por Proceso
                </Typography>
                <Chip label="Efectividad de controles" size="small" sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
              {riesgos.length === 0 ? (
                <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No hay datos disponibles</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                  {(() => {
                    const dataPorProceso: Record<string, { nombre: string; promedioInherente: number; promedioResidual: number; totalRiesgos: number }> = {};
                    riesgos.forEach((r: any) => {
                      const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
                      const procesoNombre = proceso?.nombre || 'Sin proceso';
                      if (!dataPorProceso[procesoNombre]) {
                        dataPorProceso[procesoNombre] = { nombre: procesoNombre, promedioInherente: 0, promedioResidual: 0, totalRiesgos: 0 };
                      }
                      const punto = puntos.find((p: any) => String(p.riesgoId) === String(r.id));
                      const inherente = punto ? punto.probabilidad * punto.impacto : (r.evaluacion?.riesgoInherente || 0);
                      const residual = r.evaluacion?.riesgoResidual ?? (punto ? (punto.probabilidadResidual || punto.probabilidad) * (punto.impactoResidual || punto.impacto) : Math.round(inherente * 0.8));
                      dataPorProceso[procesoNombre].promedioInherente += inherente;
                      dataPorProceso[procesoNombre].promedioResidual += residual;
                      dataPorProceso[procesoNombre].totalRiesgos++;
                    });
                    const chartData = Object.values(dataPorProceso).map(d => ({
                      nombre: d.nombre.length > 18 ? d.nombre.substring(0, 16) + '...' : d.nombre,
                      nombreCompleto: d.nombre,
                      'R. Inherente': Number((d.promedioInherente / d.totalRiesgos).toFixed(1)),
                      'R. Residual': Number((d.promedioResidual / d.totalRiesgos).toFixed(1)),
                      totalRiesgos: d.totalRiesgos,
                    })).sort((a, b) => b['R. Inherente'] - a['R. Inherente']);
                    return chartData.length === 0 ? (
                      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay riesgos evaluados</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              const reduccion = data?.['R. Inherente'] > 0 ? ((1 - data?.['R. Residual'] / data?.['R. Inherente']) * 100).toFixed(0) : '0';
                              return (
                                <Box sx={{ backgroundColor: 'white', p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                  <Typography variant="subtitle2" fontWeight={700}>{data?.nombreCompleto || label}</Typography>
                                  <Typography variant="body2" sx={{ color: '#d32f2f' }}>Inherente: {data?.['R. Inherente']}</Typography>
                                  <Typography variant="body2" sx={{ color: '#2e7d32' }}>Residual: {data?.['R. Residual']}</Typography>
                                  <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>Reducción: {reduccion}%</Typography>
                                  <Typography variant="caption" color="text.secondary">{data?.totalRiesgos} riesgos</Typography>
                                </Box>
                              );
                            }
                            return null;
                          }} />
                          <Legend />
                          <Bar dataKey="R. Inherente" fill="#d32f2f" radius={[4, 4, 0, 0]} barSize={24} />
                          <Bar dataKey="R. Residual" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 xs={12} md={6}>
          <RiesgosPorProcesoCard datosReales={estadisticas.porProceso} />
        </Grid2>
        <Grid2 xs={12} md={6}>
          <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Cobertura de Controles por Proceso
                </Typography>
                <Chip label="Gestión de causas" size="small" sx={{ backgroundColor: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: '0.7rem' }} />
              </Box>
              {riesgos.length === 0 ? (
                <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No hay datos disponibles</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                  {(() => {
                    const dataPorProceso: Record<string, { nombre: string; conGestion: number; sinGestion: number; totalCausas: number }> = {};
                    riesgos.forEach((r: any) => {
                      const proceso = procesos.find((p: any) => String(p.id) === String(r.procesoId));
                      const procesoNombre = proceso?.nombre || 'Sin proceso';
                      if (!dataPorProceso[procesoNombre]) {
                        dataPorProceso[procesoNombre] = { nombre: procesoNombre, conGestion: 0, sinGestion: 0, totalCausas: 0 };
                      }
                      if (r.causas && Array.isArray(r.causas)) {
                        r.causas.forEach((causa: any) => {
                          dataPorProceso[procesoNombre].totalCausas++;
                          const tipoGestion = String(causa.tipoGestion || '').toUpperCase();
                          if (tipoGestion === 'CONTROL' || tipoGestion === 'PLAN' || tipoGestion === 'AMBOS') {
                            dataPorProceso[procesoNombre].conGestion++;
                          } else {
                            dataPorProceso[procesoNombre].sinGestion++;
                          }
                        });
                      }
                    });
                    const chartData = Object.values(dataPorProceso)
                      .filter(d => d.totalCausas > 0)
                      .map(d => ({
                        nombre: d.nombre.length > 18 ? d.nombre.substring(0, 16) + '...' : d.nombre,
                        nombreCompleto: d.nombre,
                        'Con gestión': d.conGestion,
                        'Sin gestión': d.sinGestion,
                        totalCausas: d.totalCausas,
                        porcentaje: d.totalCausas > 0 ? Math.round((d.conGestion / d.totalCausas) * 100) : 0,
                      }))
                      .sort((a, b) => b.totalCausas - a.totalCausas);
                    return chartData.length === 0 ? (
                      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay causas registradas</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip content={({ active, payload, label }: any) => {
                            if (active && payload && payload.length) {
                              const data = payload[0]?.payload;
                              return (
                                <Box sx={{ backgroundColor: 'white', p: 1.5, border: '1px solid #e0e0e0', borderRadius: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                                  <Typography variant="subtitle2" fontWeight={700}>{data?.nombreCompleto || label}</Typography>
                                  <Typography variant="body2" sx={{ color: '#1976d2' }}>Con gestión: {data?.['Con gestión']}</Typography>
                                  <Typography variant="body2" sx={{ color: '#ff9800' }}>Sin gestión: {data?.['Sin gestión']}</Typography>
                                  <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>Cobertura: {data?.porcentaje}%</Typography>
                                  <Typography variant="caption" color="text.secondary">{data?.totalCausas} causas totales</Typography>
                                </Box>
                              );
                            }
                            return null;
                          }} />
                          <Legend />
                          <Bar dataKey="Con gestión" stackId="a" fill="#1976d2" radius={[0, 0, 0, 0]} />
                          <Bar dataKey="Sin gestión" stackId="a" fill="#ffb74d" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>

      {/* Segunda fila de gráficas */}
      <Grid2 container spacing={2.5} sx={{ mb: 4 }}>
        <Grid2 xs={12}>
          <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Controles por Proceso
              </Typography>
              {riesgos.length === 0 ? (
                <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No hay datos disponibles</Typography>
                </Box>
              ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                  {(() => {
                    const dataPorProceso: Record<string, { nombre: string; cantidad: number }> = {};
                    riesgos.forEach((r: any) => {
                      const procesoNombre = procesos.find((p: any) => p.id === r.procesoId)?.nombre || 'Sin proceso';
                      if (!dataPorProceso[procesoNombre]) {
                        dataPorProceso[procesoNombre] = { nombre: procesoNombre, cantidad: 0 };
                      }
                      if (r.causas && Array.isArray(r.causas)) {
                        r.causas.forEach((causa: any) => {
                          if (causa.controles && Array.isArray(causa.controles)) {
                            dataPorProceso[procesoNombre].cantidad += causa.controles.length;
                          }
                        });
                      }
                    });
                    const chartData = Object.values(dataPorProceso);
                    return chartData.length === 0 ? (
                      <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay controles</Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="nombre" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="cantidad" name="Cantidad" fill="#4caf50" />
                        </BarChart>
                      </ResponsiveContainer>
                    );
                  })()}
                </Box>
              )}
            </CardContent>
          </Card>
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



