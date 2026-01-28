/**
 * Benchmarking Page
 * Comparación de riesgos con otras empresas según análisis Excel
 */

import { useState } from 'react';
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
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNotification } from '../../../hooks/useNotification';
import { CLASIFICACION_RIESGO } from '../../../utils/constants';

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
  const [empresas] = useState(['Empresa 1', 'Empresa 2', 'Empresa 3']);
  const [benchmarking, setBenchmarking] = useState<BenchmarkingItem[]>([]);

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

  const handleSave = () => {
    localStorage.setItem('benchmarking', JSON.stringify(benchmarking));
    showSuccess('Datos de benchmarking guardados exitosamente');
  };

  const empresasData = empresas.map((empresa) => ({
    nombre: empresa,
    items: benchmarking.filter((b) => b.empresa === empresa),
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Benchmarking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comparación de riesgos identificados con otras empresas del sector
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            background: '#1976d2',
            color: '#fff',
          }}
        >
          Guardar Benchmarking
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {empresasData.map((empresaData) => (
          <Card key={empresaData.nombre}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  {empresaData.nombre}
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => handleAdd(empresaData.nombre)}
                  sx={{
                    background: '#1976d2',
                    color: '#fff',
                  }}
                >
                  Agregar
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nro.</TableCell>
                      <TableCell>Riesgo</TableCell>
                      <TableCell>Acción</TableCell>
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
                            placeholder="Descripción del riesgo"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {empresaData.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay riesgos registrados. Haz clic en "Agregar" para comenzar.
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
    </Box>
  );
}
