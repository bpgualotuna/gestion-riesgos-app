/**
 * Componente para la tabla de planes de acción
 * Extraído para mejorar escalabilidad
 */

import { Card, CardContent, Typography, Chip } from '@mui/material';
import AppDataGrid from '../../../../shared/components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';

interface TablaPlanesAccionProps {
  planes: any[];
}

export default function TablaPlanesAccion({ planes }: TablaPlanesAccionProps) {
  const columnasPlanes: GridColDef[] = [
    { field: 'nombre', headerName: 'Nombre', flex: 1 },
    { field: 'proceso', headerName: 'Proceso', width: 200 },
    {
      field: 'fechaInicio',
      headerName: 'Fecha Inicio',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    {
      field: 'fechaLimite',
      headerName: 'Fecha Límite',
      width: 120,
      renderCell: (params) => new Date(params.value).toLocaleDateString('es-ES'),
    },
    { field: 'responsable', headerName: 'Responsable', width: 150 },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value.replace('_', ' ').toUpperCase()}
          size="small"
          color={params.value === 'completado' ? 'success' : params.value === 'en_ejecucion' ? 'info' : 'warning'}
        />
      ),
    },
  ];

  return (
    <Card sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 2 }}>
          Planes de Acción con Fechas
        </Typography>
        <AppDataGrid rows={planes} columns={columnasPlanes} pageSize={10} />
      </CardContent>
    </Card>
  );
}

