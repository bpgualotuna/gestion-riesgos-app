/**
 * Priorización Page
 * Prioritize and assign responses to risks
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';
import { useGetPriorizacionesQuery, useCreatePriorizacionMutation } from '../../api/riesgosApi';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import { getRiskColor } from '../../../../app/theme/colors';
import { RESPUESTAS_RIESGO, type RespuestaRiesgo } from '../../../../shared/utils/constants';
import { formatDate } from '../../../../shared/utils/formatters';
import { useNotification } from '../../../../shared/hooks/useNotification';
import { useProceso } from '../../../../contexts/ProcesoContext';
import type { PriorizacionRiesgo } from '../types';
import { Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';

export default function PriorizacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const { data: priorizaciones, isLoading } = useGetPriorizacionesQuery();
  const [createPriorizacion, { isLoading: isSaving }] = useCreatePriorizacionMutation();
  const { showSuccess, showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPriorizacion, setSelectedPriorizacion] = useState<PriorizacionRiesgo | null>(null);
  const [respuesta, setRespuesta] = useState<RespuestaRiesgo>('Aceptar');
  const [responsable, setResponsable] = useState('');

  const columns: GridColDef[] = [
    {
      field: 'riesgo.numero',
      headerName: 'Nro',
      width: 80,
      valueGetter: (_value, row) => row.riesgo?.numero || '-',
    },
    {
      field: 'riesgo.descripcion',
      headerName: 'Descripción del Riesgo',
      flex: 1,
      minWidth: 300,
      valueGetter: (_value, row) => row.riesgo?.descripcion || '-',
    },
    {
      field: 'evaluacion.nivelRiesgo',
      headerName: 'Nivel',
      width: 150,
      renderCell: (params) => {
        const nivel = params.row.evaluacion?.nivelRiesgo || 'Sin evaluar';
        return (
          <Chip
            label={nivel}
            size="small"
            sx={{
              backgroundColor: nivel !== 'Sin evaluar' ? getRiskColor(nivel) : '#666',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      field: 'calificacionFinal',
      headerName: 'Calificación',
      width: 120,
      valueGetter: (_value, row) => row.calificacionFinal ?? null,
      renderCell: (params) => {
        const value = params.value ?? params.row.calificacionFinal;
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        return (
          <Typography variant="body2" fontWeight={600}>
            {!isNaN(numValue) ? numValue.toFixed(2) : '-'}
          </Typography>
        );
      },
    },
    {
      field: 'respuesta',
      headerName: 'Respuesta',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'Evitar'
              ? 'error'
              : params.value === 'Reducir'
              ? 'warning'
              : params.value === 'Compartir'
              ? 'info'
              : 'default'
          }
        />
      ),
    },
    {
      field: 'responsable',
      headerName: 'Responsable',
      width: 180,
    },
    {
      field: 'fechaAsignacion',
      headerName: 'Fecha Asignación',
      width: 150,
      valueFormatter: (value) => formatDate(value),
    },
  ];

  const handleSave = async () => {
    if (!selectedPriorizacion?.riesgoId) {
      showError('Error: No se pudo identificar el riesgo');
      return;
    }

    try {
      await createPriorizacion({
        riesgoId: selectedPriorizacion.riesgoId,
        respuesta,
        responsable: responsable || undefined,
      }).unwrap();

      showSuccess('Priorización guardada exitosamente');
      setDialogOpen(false);
      setSelectedPriorizacion(null);
      setRespuesta('Aceptar');
      setResponsable('');
    } catch (error) {
      showError('Error al guardar la priorización');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">
          Por favor seleccione un proceso desde el Dashboard
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Priorización y Respuesta
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Asigna respuestas y responsables a los riesgos evaluados
          </Typography>
        </Box>
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
      </Box>
      {isReadOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Está en modo visualización. Solo puede ver la información.
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Priorizados
              </Typography>
              <Typography variant="h3" fontWeight={700} color="primary">
                {priorizaciones?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Evitar
              </Typography>
              <Typography variant="h3" fontWeight={700} color="error.main">
                {priorizaciones?.filter((p) => p.respuesta === 'Evitar').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reducir
              </Typography>
              <Typography variant="h3" fontWeight={700} color="warning.main">
                {priorizaciones?.filter((p) => p.respuesta === 'Reducir').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aceptar
              </Typography>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {priorizaciones?.filter((p) => p.respuesta === 'Aceptar').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Data Grid */}
      <AppDataGrid
        rows={priorizaciones || []}
        columns={columns}
        loading={isLoading}
        getRowId={(row) => row.id}
        onRowClick={isReadOnly ? undefined : (params) => {
          setSelectedPriorizacion(params.row);
          setRespuesta(params.row.respuesta || 'Aceptar');
          setResponsable(params.row.responsable || '');
          setDialogOpen(true);
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asignar Respuesta al Riesgo</DialogTitle>
        <DialogContent>
          {selectedPriorizacion && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Riesgo
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedPriorizacion.riesgo?.descripcion}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Respuesta al Riesgo"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value as RespuestaRiesgo)}
                  disabled={isReadOnly}
                >
                  {RESPUESTAS_RIESGO.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Responsable"
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Nombre del responsable"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cerrar</Button>
          {!isReadOnly && (
            <Button variant="contained" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
