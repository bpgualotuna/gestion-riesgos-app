/**
 * Riesgos por Proceso Page
 * Vista agrupada de riesgos por proceso
 */

import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Search as SearchIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useGetRiesgosQuery, useGetProcesosQuery } from '../../api/services/riesgosApi';
import { useAuth } from '../../contexts/AuthContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { colors } from '../../app/theme/colors';
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';

export default function RiesgosPorProcesoPage() {
  const { esAdmin, esAuditoria, esDueñoProcesos, esGerenteGeneralProceso } = useAuth();
  const { procesoSeleccionado } = useProceso();
  const [busqueda, setBusqueda] = useState('');
  const [procesoExpandido, setProcesoExpandido] = useState<string | null>(null);

  const puedeVerTodosLosRiesgos = esAdmin || esAuditoria;

  // Obtener todos los procesos
  const { data: procesosData } = useGetProcesosQuery();
  const procesos = procesosData?.data || [];

  // Obtener todos los riesgos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    puedeVerTodosLosRiesgos
      ? { pageSize: 1000 }
      : procesoSeleccionado
      ? { procesoId: procesoSeleccionado.id, pageSize: 1000 }
      : { pageSize: 1000 }
  );

  const riesgos = riesgosData?.data || [];

  // Filtrar procesos según permisos
  const procesosFiltrados = useMemo(() => {
    if (puedeVerTodosLosRiesgos) {
      return procesos;
    }
    if (procesoSeleccionado) {
      return procesos.filter((p: any) => p.id === procesoSeleccionado.id);
    }
    return [];
  }, [procesos, puedeVerTodosLosRiesgos, procesoSeleccionado]);

  // Agrupar riesgos por proceso
  const riesgosPorProceso = useMemo(() => {
    const agrupados: Record<string, any[]> = {};
    
    procesosFiltrados.forEach((proceso: any) => {
      const riesgosDelProceso = riesgos.filter((r: any) => r.procesoId === proceso.id);
      
      // Filtrar por búsqueda si existe
      const riesgosFiltrados = busqueda.trim()
        ? riesgosDelProceso.filter((r: any) => {
            const busquedaLower = busqueda.toLowerCase();
            const codigo = `${r.numero || ''}${r.siglaGerencia || ''}`;
            return (
              codigo.toLowerCase().includes(busquedaLower) ||
              r.descripcion?.toLowerCase().includes(busquedaLower)
            );
          })
        : riesgosDelProceso;

      if (riesgosFiltrados.length > 0) {
        agrupados[proceso.id] = {
          proceso,
          riesgos: riesgosFiltrados,
        };
      }
    });

    return agrupados;
  }, [riesgos, procesosFiltrados, busqueda]);

  const columnasRiesgo: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro',
      width: 80,
    },
    {
      field: 'codigo',
      headerName: 'Código',
      width: 120,
      renderCell: (params) => {
        const riesgo = params.row;
        const codigo = `${riesgo.numero || ''}${riesgo.siglaGerencia || ''}`;
        return <Typography variant="body2" fontWeight={600}>{codigo}</Typography>;
      },
    },
    {
      field: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value === 'Riesgo con consecuencia positiva' ? 'Positiva' : 'Negativa'}
          size="small"
          color={params.value === 'Riesgo con consecuencia positiva' ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'zona',
      headerName: 'Zona',
      width: 150,
    },
  ];

  const handleChangeProceso = (procesoId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setProcesoExpandido(isExpanded ? procesoId : null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
          Riesgos por Proceso
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista agrupada de riesgos organizados por proceso
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            placeholder="Buscar riesgos por código o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Información */}
      {!puedeVerTodosLosRiesgos && !procesoSeleccionado && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Seleccione un proceso desde el Dashboard para ver sus riesgos
        </Alert>
      )}

      {/* Lista de Procesos con Riesgos */}
      {Object.keys(riesgosPorProceso).length === 0 && !loadingRiesgos ? (
        <Card>
          <CardContent>
            <Alert severity="info">
              {busqueda.trim()
                ? 'No se encontraron riesgos que coincidan con la búsqueda'
                : 'No hay riesgos disponibles para mostrar'}
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Object.entries(riesgosPorProceso).map(([procesoId, data]) => {
            const { proceso, riesgos: riesgosProceso } = data;
            return (
              <Accordion
                key={procesoId}
                expanded={procesoExpandido === procesoId}
                onChange={handleChangeProceso(procesoId)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {proceso.nombre}
                    </Typography>
                    <Chip
                      label={`${riesgosProceso.length} riesgo${riesgosProceso.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                    />
                    {proceso.areaNombre && (
                      <Chip
                        label={proceso.areaNombre}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <AppDataGrid
                    rows={riesgosProceso.map((r: any) => ({ ...r, id: r.id }))}
                    columns={columnasRiesgo}
                    loading={false}
                    getRowId={(row) => row.id}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10 },
                      },
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
}



