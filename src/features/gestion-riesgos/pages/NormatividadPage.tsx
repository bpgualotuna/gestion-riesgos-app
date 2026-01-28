/**
 * Normatividad Page
 * Inventario de Normatividad según análisis Excel
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import AppDataGrid from '../../../components/ui/AppDataGrid';
import { useNotification } from '../../../hooks/useNotification';
import { ESTADOS_NORMATIVIDAD, NIVELES_CUMPLIMIENTO, CLASIFICACION_RIESGO } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatters';

interface Normatividad {
  id: string;
  numero: number;
  nombre: string;
  estado: string;
  regulador: string;
  sanciones: string;
  plazoImplementacion: string;
  cumplimiento: string;
  detalleIncumplimiento: string;
  riesgoIdentificado: string;
  clasificacion: string;
  comentarios: string;
}

const mockNormatividades: Normatividad[] = [
  {
    id: '1',
    numero: 1,
    nombre: 'Código del Trabajo Art. 2 - Obligatoriedad del trabajo',
    estado: 'Existente',
    regulador: 'Ministerio de Trabajo',
    sanciones: 'Art. 326 Constitución Ecuatoriana, indemnización',
    plazoImplementacion: 'N/A',
    cumplimiento: 'Total',
    detalleIncumplimiento: '',
    riesgoIdentificado: 'Demandas por parte de colaboradores',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    comentarios: '',
  },
  {
    id: '2',
    numero: 2,
    nombre: 'Ley Orgánica de Servicio Público',
    estado: 'Existente',
    regulador: 'Consejo de Participación Ciudadana',
    sanciones: 'Sanciones administrativas',
    plazoImplementacion: 'N/A',
    cumplimiento: 'Total',
    detalleIncumplimiento: '',
    riesgoIdentificado: 'Sanciones administrativas',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    comentarios: '',
  },
];

export default function NormatividadPage() {
  const { showSuccess, showError } = useNotification();
  const [normatividades] = useState<Normatividad[]>(mockNormatividades);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNormatividad, setSelectedNormatividad] = useState<Normatividad | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'numero',
      headerName: 'Nro.',
      width: 80,
    },
    {
      field: 'nombre',
      headerName: 'Nombre de la Regulación',
      flex: 1,
      minWidth: 300,
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'Existente'
              ? 'success'
              : params.value === 'Requerida'
              ? 'warning'
              : 'info'
          }
        />
      ),
    },
    {
      field: 'regulador',
      headerName: 'Regulador',
      width: 200,
    },
    {
      field: 'cumplimiento',
      headerName: 'Cumplimiento',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'Total'
              ? 'success'
              : params.value === 'Parcial'
              ? 'warning'
              : 'error'
          }
        />
      ),
    },
    {
      field: 'clasificacion',
      headerName: 'Clasificación',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'Positivo' : 'Negativo'}
          size="small"
          color={params.value === CLASIFICACION_RIESGO.POSITIVA ? 'success' : 'error'}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Inventario de Normatividad
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Catálogo de normativas aplicables al proceso de Talento Humano
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedNormatividad(null);
            setDialogOpen(true);
          }}
          sx={{
            background: '#1976d2',
            color: '#fff',
            '&:hover': {
              background: '#1565c0',
            },
          }}
        >
          Nueva Normatividad
        </Button>
      </Box>

      <Card>
        <CardContent>
          <AppDataGrid
            rows={normatividades}
            columns={columns}
            pageSizeOptions={[5, 10, 25, 50]}
            onRowClick={(params) => {
              setSelectedNormatividad(params.row as Normatividad);
              setDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedNormatividad ? 'Editar Normatividad' : 'Nueva Normatividad'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Regulación Aplicable"
                defaultValue={selectedNormatividad?.nombre || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Estado"
                defaultValue={selectedNormatividad?.estado || 'Existente'}
                variant="outlined"
              >
                {ESTADOS_NORMATIVIDAD.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {estado}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Regulador"
                defaultValue={selectedNormatividad?.regulador || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Sanciones Penales/Civiles/Económicas"
                multiline
                rows={3}
                defaultValue={selectedNormatividad?.sanciones || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Plazo para Implementación"
                defaultValue={selectedNormatividad?.plazoImplementacion || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Cumplimiento"
                defaultValue={selectedNormatividad?.cumplimiento || 'Total'}
                variant="outlined"
              >
                {NIVELES_CUMPLIMIENTO.map((nivel) => (
                  <MenuItem key={nivel} value={nivel}>
                    {nivel}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Detalle del Incumplimiento"
                multiline
                rows={3}
                defaultValue={selectedNormatividad?.detalleIncumplimiento || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Riesgo Identificado"
                multiline
                rows={2}
                defaultValue={selectedNormatividad?.riesgoIdentificado || ''}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Clasificación"
                defaultValue={selectedNormatividad?.clasificacion || CLASIFICACION_RIESGO.NEGATIVA}
                variant="outlined"
              >
                <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Riesgo Positivo</MenuItem>
                <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Riesgo Negativo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentarios Adicionales"
                multiline
                rows={2}
                defaultValue={selectedNormatividad?.comentarios || ''}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              showSuccess('Normatividad guardada exitosamente');
              setDialogOpen(false);
            }}
            sx={{
              background: '#1976d2',
              color: '#fff',
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
