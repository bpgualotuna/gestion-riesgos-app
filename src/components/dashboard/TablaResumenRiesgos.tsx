import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import AppDataGrid from '../ui/AppDataGrid';
import { GridColDef } from '@mui/x-data-grid';

interface TablaResumenRiesgosProps {
    filas: any[];
}

const TablaResumenRiesgos: React.FC<TablaResumenRiesgosProps> = ({ filas }) => {

    const columns: GridColDef[] = [
        {
            field: 'codigo',
            headerName: 'Código',
            width: 100,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight="bold">
                    {params.value}
                </Typography>
            )
        },
        { field: 'proceso', headerName: 'Proceso', width: 200 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1, minWidth: 300 },
        {
            field: 'nivelRI',
            headerName: 'Riesgo Inherente',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: params.row.colorRI,
                        color: '#fff',
                        fontWeight: 'bold',
                        minWidth: 80
                    }}
                />
            )
        },
        {
            field: 'nivelRR',
            headerName: 'Riesgo Residual',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    sx={{
                        bgcolor: params.row.colorRR,
                        color: '#fff',
                        fontWeight: 'bold',
                        minWidth: 80
                    }}
                />
            )
        },
    ];

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                        Resumen de Riesgos
                    </Typography>
                    <Chip label={`${filas.length} Registros`} size="small" color="primary" variant="outlined" />
                </Box>
                <div style={{ height: 400, width: '100%' }}>
                    <AppDataGrid
                        rows={filas}
                        columns={columns}
                        pageSize={5}
                    />
                </div>
            </CardContent>
        </Card>
    );
};

export default TablaResumenRiesgos;
