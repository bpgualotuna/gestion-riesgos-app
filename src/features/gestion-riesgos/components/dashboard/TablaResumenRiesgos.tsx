/**
 * Componente para la tabla de resumen de riesgos
 * Extraído para mejorar escalabilidad
 */

import { Card, CardContent, Typography } from '@mui/material';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import { Chip } from '@mui/material';

interface TablaResumenRiesgosProps {
  filas: any[];
}

export default function TablaResumenRiesgos({ filas }: TablaResumenRiesgosProps) {
  const columnasResumen: GridColDef[] = [
    { field: 'codigo', headerName: 'Código', width: 120 },
    { field: 'proceso', headerName: 'Proceso', width: 200 },
    { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 300 },
    {
      field: 'riesgoInherente',
      headerName: 'RI',
      width: 120,
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRI})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRI}20`,
            color: params.row.colorRI,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRI}`,
          }}
        />
      ),
    },
    {
      field: 'riesgoResidual',
      headerName: 'RR',
      width: 120,
      align: 'center',
      renderCell: (params) => (
        <Chip
          label={`${params.value.toFixed(1)} (${params.row.nivelRR})`}
          size="small"
          sx={{
            backgroundColor: `${params.row.colorRR}20`,
            color: params.row.colorRR,
            fontWeight: 600,
            border: `1px solid ${params.row.colorRR}`,
          }}
        />
      ),
    },
  ];

  return (
    <Card sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
          Resumen de Riesgos
        </Typography>
        <AppDataGrid rows={filas} columns={columnasResumen} pageSize={10} />
      </CardContent>
    </Card>
  );
}

