import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface TablaPlanesAccionProps {
    planes: any[];
}

const TablaPlanesAccion: React.FC<TablaPlanesAccionProps> = ({ planes }) => {
    const columns: GridColDef[] = [
        { field: 'nombre', headerName: 'Nombre', flex: 1, minWidth: 200 },
        { field: 'proceso', headerName: 'Proceso', width: 200 },
        { field: 'responsable', headerName: 'Responsable', width: 150 },
        {
            field: 'fechaLimite',
            headerName: 'Fecha Límite',
            width: 120,
            renderCell: (params) => new Date(params.value).toLocaleDateString()
        },
        {
            field: 'estado',
            headerName: 'Estado',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value.replace('_', ' ').toUpperCase()}
                    size="small"
                    color={params.value === 'completado' ? 'success' : params.value === 'en_ejecucion' ? 'info' : 'default'}
                />
            )
        },
        {
            field: 'porcentajeAvance',
            headerName: 'Avance',
            width: 100,
            renderCell: (params) => `${params.value}%`
        }
    ];

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Planes de Acción
                </Typography>
                <Box sx={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={planes}
                        columns={columns}
                        pageSizeOptions={[5, 10]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 5 } },
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default TablaPlanesAccion;
