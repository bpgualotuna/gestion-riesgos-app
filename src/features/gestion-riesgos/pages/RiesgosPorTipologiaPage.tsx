/**
 * Riesgos por Tipología Page
 * Vista agrupada de riesgos por tipología (Lista Tipologías)
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
import { useGetRiesgosQuery, useGetProcesosQuery } from '../api/riesgosApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useProceso } from '../../../contexts/ProcesoContext';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';

export default function RiesgosPorTipologiaPage() {
  const { esAdmin, esAuditoria } = useAuth();
  const { procesoSeleccionado } = useProceso();
  const [busqueda, setBusqueda] = useState('');
  const [tipologiaExpandida, setTipologiaExpandida] = useState<string | null>(null);
  const [nivelFiltro, setNivelFiltro] = useState<'I' | 'II' | 'III' | 'IV'>('I');

  const puedeVerTodosLosRiesgos = esAdmin || esAuditoria;

  // Obtener procesos
  const { data: procesosData } = useGetProcesosQuery();
  const procesos = procesosData?.data || [];

  // Obtener riesgos
  const { data: riesgosData, isLoading: loadingRiesgos } = useGetRiesgosQuery(
    puedeVerTodosLosRiesgos
      ? { pageSize: 1000 }
      : procesoSeleccionado
      ? { procesoId: procesoSeleccionado.id, pageSize: 1000 }
      : { pageSize: 1000 }
  );

  const riesgos = riesgosData?.data || [];

  // Agrupar riesgos por tipología según el nivel seleccionado
  const riesgosPorTipologia = useMemo(() => {
    const agrupados: Record<string, any[]> = {};

    riesgos.forEach((riesgo: any) => {
      let tipologiaKey = '';
      let tipologiaLabel = '';

      switch (nivelFiltro) {
        case 'I':
          tipologiaKey = riesgo.tipologiaNivelI || 'Sin Tipología Nivel I';
          tipologiaLabel = `Nivel I: ${tipologiaKey}`;
          break;
        case 'II':
          tipologiaKey = riesgo.tipologiaNivelII || 'Sin Tipología Nivel II';
          tipologiaLabel = `Nivel II: ${tipologiaKey}`;
          break;
        case 'III':
          tipologiaKey = riesgo.tipologiaNivelIII || 'Sin Tipología Nivel III';
          tipologiaLabel = `Nivel III: ${tipologiaKey}`;
          break;
        case 'IV':
          tipologiaKey = riesgo.tipologiaNivelIV || 'Sin Tipología Nivel IV';
          tipologiaLabel = `Nivel IV: ${tipologiaKey}`;
          break;
      }

      if (!agrupados[tipologiaKey]) {
        agrupados[tipologiaKey] = [];
      }

      // Filtrar por búsqueda si existe
      if (busqueda.trim()) {
        const busquedaLower = busqueda.toLowerCase();
        const codigo = `${riesgo.numero || ''}${riesgo.siglaGerencia || ''}`;
        const proceso = procesos.find((p: any) => p.id === riesgo.procesoId);
        
        if (
          codigo.toLowerCase().includes(busquedaLower) ||
          riesgo.descripcion?.toLowerCase().includes(busquedaLower) ||
          proceso?.nombre?.toLowerCase().includes(busquedaLower)
        ) {
          agrupados[tipologiaKey].push(riesgo);
        }
      } else {
        agrupados[tipologiaKey].push(riesgo);
      }
    });

    // Eliminar grupos vacíos
    Object.keys(agrupados).forEach((key) => {
      if (agrupados[key].length === 0) {
        delete agrupados[key];
      }
    });

    return agrupados;
  }, [riesgos, nivelFiltro, busqueda, procesos]);

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
    ...(puedeVerTodosLosRiesgos ? [{
      field: 'proceso',
      headerName: 'Proceso',
      width: 200,
      renderCell: (params) => {
        const proceso = procesos.find((p: any) => p.id === params.row.procesoId);
        return proceso?.nombre || 'Sin proceso';
      },
    }] : []),
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
  ];

  const handleChangeTipologia = (tipologiaKey: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setTipologiaExpandida(isExpanded ? tipologiaKey : null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700} sx={{ color: '#1976d2' }}>
          Riesgos por Tipología
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Vista agrupada de riesgos organizados por tipología
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Nivel de Tipología"
              value={nivelFiltro}
              onChange={(e) => setNivelFiltro(e.target.value as 'I' | 'II' | 'III' | 'IV')}
              size="small"
              sx={{ minWidth: 200 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="I">Nivel I</option>
              <option value="II">Nivel II</option>
              <option value="III">Nivel III</option>
              <option value="IV">Nivel IV</option>
            </TextField>
            <TextField
              placeholder="Buscar riesgos..."
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

      {/* Lista de Tipologías con Riesgos */}
      {Object.keys(riesgosPorTipologia).length === 0 && !loadingRiesgos ? (
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
          {Object.entries(riesgosPorTipologia)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([tipologiaKey, riesgosTipologia]) => {
              return (
                <Accordion
                  key={tipologiaKey}
                  expanded={tipologiaExpandida === tipologiaKey}
                  onChange={handleChangeTipologia(tipologiaKey)}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6" fontWeight={600}>
                        {tipologiaKey}
                      </Typography>
                      <Chip
                        label={`${riesgosTipologia.length} riesgo${riesgosTipologia.length !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <AppDataGrid
                      rows={riesgosTipologia.map((r: any) => ({ ...r, id: r.id }))}
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

