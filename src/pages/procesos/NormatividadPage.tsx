/**
 * Normatividad Page
 * Inventario de Normatividad según análisis Excel
 */

import { useState, useEffect } from 'react';
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
  Alert,
} from '@mui/material';
import { Add as AddIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { useNotification } from '../../hooks/useNotification';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useProceso } from '../../contexts/ProcesoContext';
import { useGetProcesoByIdQuery, useUpdateProcesoMutation } from '../../api/services/riesgosApi';
import { ESTADOS_NORMATIVIDAD, NIVELES_CUMPLIMIENTO, CLASIFICACION_RIESGO } from "../../utils/constants";
import { formatDate } from '../../utils/formatters';

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



import AppPageLayout from '../../components/layout/AppPageLayout';

export default function NormatividadPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';

  const { data: procesoData } = useGetProcesoByIdQuery(procesoSeleccionado?.id || '', {
    skip: !procesoSeleccionado?.id
  });
  const [updateProceso] = useUpdateProcesoMutation();

  const [normatividades, setNormatividades] = useState<Normatividad[]>([]);

  useEffect(() => {
    if (procesoData && procesoData.normatividades) {
      setNormatividades(procesoData.normatividades);
    }
  }, [procesoData]);

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
    <AppPageLayout
      title="Inventario de Normatividad"
      description="Catálogo de normativas aplicables al proceso"
      topContent={<FiltroProcesoSupervisor />}
      action={
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isReadOnly && (
            <Chip
              icon={<VisibilityIcon />}
              label="Modo Visualización"
              color="info"
              sx={{ fontWeight: 600 }}
            />
          )}
          {modoProceso === 'editar' && (
            <Chip
              icon={<EditIcon />}
              label="Modo Edición"
              color="warning"
              sx={{ fontWeight: 600 }}
            />
          )}
          {!isReadOnly && (
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
          )}
        </Box>
      }
      alert={
        isReadOnly && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Está en modo visualización. Solo puede ver la información.
          </Alert>
        )
      }
    >
      <AppDataGrid
        rows={normatividades}
        columns={columns}
        pageSizeOptions={[5, 10, 25, 50]}
        onRowClick={(params) => {
          setSelectedNormatividad(params.row as Normatividad);
          setDialogOpen(true);
        }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!procesoSeleccionado) return;
          const formData = new FormData(e.currentTarget);
          const newItem: any = {
            id: selectedNormatividad?.id || `temp-${Date.now()}`,
            numero: normatividades.length + 1, // Simple auto-increment for new
            ...selectedNormatividad, // Keep existing ID if editing
            nombre: formData.get('nombre'),
            estado: formData.get('estado'),
            regulador: formData.get('regulador'),
            sanciones: formData.get('sanciones'),
            plazoImplementacion: formData.get('plazoImplementacion'),
            cumplimiento: formData.get('cumplimiento'),
            detalleIncumplimiento: formData.get('detalleIncumplimiento'),
            riesgoIdentificado: formData.get('riesgoIdentificado'),
            clasificacion: formData.get('clasificacion'),
            comentarios: formData.get('comentarios'),
          };

          const updatedList = selectedNormatividad
            ? normatividades.map(n => n.id === newItem.id ? newItem : n)
            : [...normatividades, newItem];

          try {
            // Optimistic update
            setNormatividades(updatedList);
            await updateProceso({
              id: procesoSeleccionado.id,
              normatividades: updatedList
            }).unwrap();
            showSuccess('Normatividad guardada exitosamente');
            setDialogOpen(false);
          } catch (error) {
            console.error(error);
            showError('Error al guardar normatividad');
          }
        }}>
          <DialogTitle>
            {selectedNormatividad ? 'Editar Normatividad' : 'Nueva Normatividad'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2, mt: 1 }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  name="nombre"
                  label="Nombre de la Regulación Aplicable"
                  defaultValue={selectedNormatividad?.nombre || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="estado"
                  label="Estado"
                  defaultValue={selectedNormatividad?.estado || 'Existente'}
                  disabled={isReadOnly}
                  variant="outlined"
                >
                  {ESTADOS_NORMATIVIDAD.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <TextField
                  fullWidth
                  name="regulador"
                  label="Regulador"
                  defaultValue={selectedNormatividad?.regulador || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Sanciones Penales/Civiles/Económicas"
                  name="sanciones"
                  multiline
                  rows={3}
                  defaultValue={selectedNormatividad?.sanciones || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  name="plazoImplementacion"
                  label="Plazo para Implementación"
                  defaultValue={selectedNormatividad?.plazoImplementacion || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="cumplimiento"
                  label="Cumplimiento"
                  defaultValue={selectedNormatividad?.cumplimiento || 'Total'}
                  disabled={isReadOnly}
                  variant="outlined"
                >
                  {NIVELES_CUMPLIMIENTO.map((nivel) => (
                    <MenuItem key={nivel} value={nivel}>
                      {nivel}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Detalle del Incumplimiento"
                  name="detalleIncumplimiento"
                  multiline
                  rows={3}
                  defaultValue={selectedNormatividad?.detalleIncumplimiento || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Riesgo Identificado"
                  name="riesgoIdentificado"
                  multiline
                  rows={2}
                  defaultValue={selectedNormatividad?.riesgoIdentificado || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  select
                  name="clasificacion"
                  label="Clasificación"
                  defaultValue={selectedNormatividad?.clasificacion || CLASIFICACION_RIESGO.NEGATIVA}
                  disabled={isReadOnly}
                  variant="outlined"
                >
                  <MenuItem value={CLASIFICACION_RIESGO.POSITIVA}>Riesgo Positivo</MenuItem>
                  <MenuItem value={CLASIFICACION_RIESGO.NEGATIVA}>Riesgo Negativo</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Comentarios Adicionales"
                  name="comentarios"
                  multiline
                  rows={2}
                  defaultValue={selectedNormatividad?.comentarios || ''}
                  disabled={isReadOnly}
                  variant="outlined"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
            {!isReadOnly && (
              <Button
                variant="contained"
                type="submit"
                sx={{
                  background: '#1976d2',
                  color: '#fff',
                }}
              >
                Guardar
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </AppPageLayout>
  );
}


