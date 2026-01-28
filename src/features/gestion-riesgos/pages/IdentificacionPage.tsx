/**
 * Identificación Page
 * List and manage risks
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetRiesgosQuery } from '../api/riesgosApi';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo } from '../../../utils/constants';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Riesgo, FiltrosRiesgo } from '../types';

export default function IdentificacionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clasificacion, setClasificacion] = useState<string>('all');
  const [selectedRiesgo, setSelectedRiesgo] = useState<Riesgo | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const filtros: FiltrosRiesgo = {
    busqueda: debouncedSearch,
    clasificacion: clasificacion === 'all' ? undefined : (clasificacion as ClasificacionRiesgo),
  };

  const { data, isLoading } = useGetRiesgosQuery(filtros);

  const columns: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro',
      width: 80,
    },
    {
      field: 'descripcion',
      headerName: 'Descripción del Riesgo',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 200,
      renderCell: (params) => (
        <Chip
          label={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'Positiva' : 'Negativa'}
          size="small"
          color={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'proceso',
      headerName: 'Proceso',
      width: 180,
    },
    {
      field: 'zona',
      headerName: 'Zona',
      width: 150,
    },
    {
      field: 'tipologiaNivelI',
      headerName: 'Tipología I',
      width: 150,
    },
  ];

  const handleRowClick = (params: any) => {
    setSelectedRiesgo(params.row);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRiesgo(null);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Identificación de Riesgos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Catálogo completo de riesgos identificados
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
        >
          Nuevo Riesgo
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px' }}>
          <TextField
            fullWidth
            label="Buscar riesgos"
            placeholder="Buscar por descripción, proceso, zona..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Box sx={{ flex: '0 1 200px', minWidth: 200 }}>
          <TextField
            fullWidth
            select
            label="Clasificación"
            value={clasificacion}
            onChange={(e) => setClasificacion(e.target.value)}
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Positiva</MenuItem>
            <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Negativa</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Data Grid */}
      <AppDataGrid
        rows={data?.data || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={handleRowClick}
      />

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Detalles del Riesgo</DialogTitle>
        <DialogContent>
          {selectedRiesgo && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Descripción
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedRiesgo.descripcion}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: '48%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Clasificación
                  </Typography>
                  <Typography variant="body1">
                    {selectedRiesgo.clasificacion}
                  </Typography>
                </Box>
                <Box sx={{ width: '48%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Proceso
                  </Typography>
                  <Typography variant="body1">{selectedRiesgo.proceso}</Typography>
                </Box>
                <Box sx={{ width: '48%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Zona
                  </Typography>
                  <Typography variant="body1">{selectedRiesgo.zona}</Typography>
                </Box>
                <Box sx={{ width: '48%' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tipología Nivel I
                  </Typography>
                  <Typography variant="body1">
                    {selectedRiesgo.tipologiaNivelI || '-'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Cerrar</Button>
          <Button variant="contained">Evaluar Riesgo</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
