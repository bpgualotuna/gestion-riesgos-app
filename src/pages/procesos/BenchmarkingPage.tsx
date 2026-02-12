/**
 * Benchmarking Page
 * Comparación de riesgos con otras empresas según análisis Excel
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useProceso } from '../../contexts/ProcesoContext';
import { CLASIFICACION_RIESGO } from '../../utils/constants';
import { Alert, Chip } from '@mui/material';
import FiltroProcesoSupervisor from '../../components/common/FiltroProcesoSupervisor';
import { useGetBenchmarkingByProcesoQuery, useSetBenchmarkingByProcesoMutation } from '../../api/services/riesgosApi';

import AppPageLayout from '../../components/layout/AppPageLayout';

interface BenchmarkingItem {
  id: string;
  empresa: string;
  numero: number;
  riesgo: string;
  clasificacion?: string;
  calificacion?: number;
}

export default function BenchmarkingPage() {
  const { showSuccess, showError } = useNotification();
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const [empresas] = useState(['Empresa 1', 'Empresa 2', 'Empresa 3']);
  const [benchmarking, setBenchmarking] = useState<BenchmarkingItem[]>([]);
  const { data: benchmarkingApi = [] } = useGetBenchmarkingByProcesoQuery(
    procesoSeleccionado?.id ? String(procesoSeleccionado.id) : '',
    { skip: !procesoSeleccionado?.id }
  );
  const [setBenchmarkingByProceso] = useSetBenchmarkingByProcesoMutation();

  useEffect(() => {
    if (benchmarkingApi && Array.isArray(benchmarkingApi)) {
      const mapped = benchmarkingApi.map((item: any) => ({
        id: String(item.id),
        empresa: item.empresa || item.entidad || 'Empresa',
        numero: item.numero || 1,
        riesgo: item.riesgo || item.indicador || '',
        clasificacion: item.clasificacion,
        calificacion: item.calificacion,
      }));
      setBenchmarking(mapped);
    }
  }, [benchmarkingApi]);

  const handleAdd = (empresa: string) => {
    const newItem: BenchmarkingItem = {
      id: `${empresa}-${Date.now()}`,
      empresa,
      numero: benchmarking.filter((b) => b.empresa === empresa).length + 1,
      riesgo: '',
    };
    setBenchmarking([...benchmarking, newItem]);
  };

  const handleDelete = (id: string) => {
    setBenchmarking(benchmarking.filter((b) => b.id !== id));
  };

  const handleChange = (id: string, field: keyof BenchmarkingItem, value: any) => {
    setBenchmarking(
      benchmarking.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    if (!procesoSeleccionado?.id) {
      showError('Seleccione un proceso');
      return;
    }
    await setBenchmarkingByProceso({ procesoId: procesoSeleccionado.id, items: benchmarking }).unwrap();
    showSuccess('Datos de benchmarking guardados exitosamente');
  };

  const empresasData = empresas.map((empresa) => ({
    nombre: empresa,
    items: benchmarking.filter((b) => b.empresa === empresa),
  }));

  return (
    <AppPageLayout
      title="Benchmarking"
      description="Comparación de riesgos identificados con otras empresas del sector"
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
              onClick={handleSave}
              sx={{
                background: '#1976d2',
                color: '#fff',
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
              }}
            >
              Guardar Benchmarking
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
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {empresasData.map((empresaData) => (
          <Card key={empresaData.nombre} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700} color="primary">
                  {empresaData.nombre}
                </Typography>
                {!isReadOnly && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleAdd(empresaData.nombre)}
                    sx={{
                      background: '#1976d2',
                      color: '#fff',
                      '&:hover': { background: '#1565c0' }
                    }}
                  >
                    Agregar
                  </Button>
                )}
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nro.</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Riesgo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {empresaData.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.numero}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={item.riesgo}
                            onChange={(e) => handleChange(item.id, 'riesgo', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Descripción"
                            variant="standard"
                          />
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(item.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                        {isReadOnly && <TableCell />}
                      </TableRow>
                    ))}
                    {empresaData.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            Sin riesgos registrados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
      </Box>
    </AppPageLayout>
  );
}


