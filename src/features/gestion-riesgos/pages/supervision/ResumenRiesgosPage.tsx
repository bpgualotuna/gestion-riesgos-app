/**
 * Resumen de Riesgos Page
 * Tabla de resumen con Código, Proceso, Descripción, RI (Riesgo Inherente), RR (Riesgo Residual)
 */

import { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery, useGetEvaluacionesByRiesgoQuery } from '../../api/riesgosApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { useProceso } from '../../../../contexts/ProcesoContext';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { colors } from '../../../app/theme/colors';
import { NIVELES_RIESGO } from '../../../../shared/utils/constants';
import { useState } from 'react';

export default function ResumenRiesgosPage() {
  const { esAdmin, esAuditoria, esDueñoProcesos } = useAuth();
  const { procesoSeleccionado } = useProceso();
  const [busqueda, setBusqueda] = useState('');

  // Determinar qué riesgos puede ver el usuario
  const puedeVerTodosLosRiesgos = esAdmin || esAuditoria;

  // Obtener riesgos según permisos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    puedeVerTodosLosRiesgos
      ? { pageSize: 1000 }
      : procesoSeleccionado
      ? { procesoId: procesoSeleccionado.id, pageSize: 1000 }
      : { pageSize: 1000 }
  );

  // Obtener procesos para mostrar nombres
  const { data: procesosData } = useGetProcesosQuery();
  const procesos = procesosData?.data || [];

  const riesgos = riesgosData?.data || [];

  // Función para obtener el nivel de riesgo según el valor
  const obtenerNivelRiesgo = (valor: number): { nivel: string; color: string } => {
    if (valor >= 20) return { nivel: 'CRÍTICO', color: colors.risk.critical.main };
    if (valor >= 15) return { nivel: 'ALTO', color: colors.risk.high.main };
    if (valor >= 10) return { nivel: 'MEDIO', color: colors.risk.medium.main };
    return { nivel: 'BAJO', color: colors.risk.low.main };
  };

  // Filtrar riesgos por búsqueda
  const riesgosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return riesgos;
    const busquedaLower = busqueda.toLowerCase();
    return riesgos.filter((riesgo: any) => {
      const proceso = procesos.find((p: any) => p.id === riesgo.procesoId);
      const codigo = `${riesgo.numero || ''}${riesgo.siglaGerencia || ''}`;
      return (
        codigo.toLowerCase().includes(busquedaLower) ||
        riesgo.descripcion?.toLowerCase().includes(busquedaLower) ||
        proceso?.nombre?.toLowerCase().includes(busquedaLower)
      );
    });
  }, [riesgos, busqueda, procesos]);

  // Preparar datos para la tabla
  const filasTabla = useMemo(() => {
    return riesgosFiltrados.map((riesgo: any) => {
      const proceso = procesos.find((p: any) => p.id === riesgo.procesoId);
      const codigo = `${riesgo.numero || ''}${riesgo.siglaGerencia || ''}`;
      
      // Obtener evaluación para calcular RI y RR
      // En producción, esto vendría de la API
      // Por ahora, usamos valores por defecto o del riesgo si existen
      const riesgoInherente = riesgo.riesgoInherente || 0;
      const riesgoResidual = riesgo.riesgoResidual || 0;

      const nivelRI = obtenerNivelRiesgo(riesgoInherente);
      const nivelRR = obtenerNivelRiesgo(riesgoResidual);

      return {
        id: riesgo.id,
        codigo,
        proceso: proceso?.nombre || 'Sin proceso',
        descripcion: riesgo.descripcion || '',
        riesgoInherente,
        riesgoResidual,
        nivelRI: nivelRI.nivel,
        nivelRR: nivelRR.nivel,
        colorRI: nivelRI.color,
        colorRR: nivelRR.color,
        procesoId: riesgo.procesoId,
        riesgo: riesgo,
      };
    });
  }, [riesgosFiltrados, procesos]);

  const columns: GridColDef[] = [
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value || '-'}
        </Typography>
      ),
    },
    ...(puedeVerTodosLosRiesgos ? [{
      field: 'proceso',
      headerName: 'Proceso',
      width: 200,
      flex: 1,
    }] : []),
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'riesgoInherente',
      headerName: 'RI',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const nivel = params.row.nivelRI;
        const color = params.row.colorRI;
        return (
          <Chip
            label={`${params.value} (${nivel})`}
            size="small"
            sx={{
              backgroundColor: `${color}20`,
              color: color,
              fontWeight: 600,
              border: `1px solid ${color}`,
            }}
          />
        );
      },
    },
    {
      field: 'riesgoResidual',
      headerName: 'RR',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const nivel = params.row.nivelRR;
        const color = params.row.colorRR;
        return (
          <Chip
            label={`${params.value} (${nivel})`}
            size="small"
            sx={{
              backgroundColor: `${color}20`,
              color: color,
              fontWeight: 600,
              border: `1px solid ${color}`,
            }}
          />
        );
      },
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
          Resumen de Riesgos
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista consolidada de todos los riesgos con su Riesgo Inherente (RI) y Riesgo Residual (RR)
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Buscar por código, proceso o descripción..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Información */}
      {!puedeVerTodosLosRiesgos && !procesoSeleccionado && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleccione un proceso desde el Dashboard para ver sus riesgos
        </Alert>
      )}

      {/* Tabla de Resumen */}
      <Card>
        <CardContent>
          <AppDataGrid
            rows={filasTabla}
            columns={columns}
            loading={loadingRiesgos}
            getRowId={(row) => row.id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Leyenda
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip label="RI: Riesgo Inherente" size="small" />
            <Chip label="RR: Riesgo Residual" size="small" />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label="CRÍTICO (≥20)"
                size="small"
                sx={{
                  backgroundColor: `${colors.risk.critical.main}20`,
                  color: colors.risk.critical.main,
                  border: `1px solid ${colors.risk.critical.main}`,
                }}
              />
              <Chip
                label="ALTO (≥15)"
                size="small"
                sx={{
                  backgroundColor: `${colors.risk.high.main}20`,
                  color: colors.risk.high.main,
                  border: `1px solid ${colors.risk.high.main}`,
                }}
              />
              <Chip
                label="MEDIO (≥10)"
                size="small"
                sx={{
                  backgroundColor: `${colors.risk.medium.main}20`,
                  color: colors.risk.medium.main,
                  border: `1px solid ${colors.risk.medium.main}`,
                }}
              />
              <Chip
                label="BAJO (<10)"
                size="small"
                sx={{
                  backgroundColor: `${colors.risk.low.main}20`,
                  color: colors.risk.low.main,
                  border: `1px solid ${colors.risk.low.main}`,
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

