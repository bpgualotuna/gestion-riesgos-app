import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiesgosPorProcesoCardProps {
    datosReales: Record<string, number>;
}

const RiesgosPorProcesoCard: React.FC<RiesgosPorProcesoCardProps> = ({ datosReales }) => {
    // Mostrar TODOS los procesos con riesgos, no solo top 10
    const data = Object.entries(datosReales || {})
        .map(([name, value]) => ({
            name,
            value
        }))
        .filter(item => item.value > 0) // Solo procesos con riesgos
        .sort((a, b) => b.value - a.value); // Ordenar por mayor cantidad de riesgos

    return (
        <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Riesgos por Proceso
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                    </Box>
                ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Cantidad" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RiesgosPorProcesoCard;
