import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiesgosPorProcesoCardProps {
    datosReales: Record<string, number>;
}

const RiesgosPorProcesoCard: React.FC<RiesgosPorProcesoCardProps> = ({ datosReales }) => {
    // Mostrar TODOS los procesos, incluyendo los que tienen 0 riesgos
    const data = Object.entries(datosReales || {})
        .map(([name, value]) => ({
            name,
            value
        }))
        .sort((a, b) => b.value - a.value); // Ordenar por mayor cantidad de riesgos

    const chartHeight = Math.max(280, Math.min(560, 40 + data.length * 32));

    return (
        <Card sx={{ height: '100%', minHeight: 360 }}>
            <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Riesgos por Proceso
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                    </Box>
                ) : (
                <Box sx={{ width: '100%', height: chartHeight }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" allowDecimals={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={Math.min(280, 140 + Math.max(0, ...data.map((d) => d.name.length)) * 5)}
                                interval={0}
                                tick={{ fontSize: 11 }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Cantidad" fill="#82ca9d" barSize={18} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RiesgosPorProcesoCard;
