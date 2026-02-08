import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RiesgosPorTipologiaCardProps {
    datos: Record<string, number>;
}

const RiesgosPorTipologiaCard: React.FC<RiesgosPorTipologiaCardProps> = ({ datos }) => {
    const data = Object.entries(datos || {}).map(([name, value]) => ({
        name: name.split(' ')[1] || name, // Simplificar nombre si tiene número (e.g. "01 Estratégico")
        fullName: name,
        value
    }));

    return (
        <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Riesgos por Tipología
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                    </Box>
                ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return payload[0].payload.fullName;
                                }
                                return label;
                            }} />
                            <Legend />
                            <Bar dataKey="value" name="Cantidad" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RiesgosPorTipologiaCard;
