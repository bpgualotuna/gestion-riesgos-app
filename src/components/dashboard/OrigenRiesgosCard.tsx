import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrigenRiesgosCardProps {
    datos: Record<string, number>;
    total: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const OrigenRiesgosCard: React.FC<OrigenRiesgosCardProps> = ({ datos, total }) => {
    const data = Object.entries(datos || {}).map(([name, value]) => ({
        name,
        value
    }));

    return (
        <Card sx={{ height: '100%', minHeight: 350 }}>
            <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Origen de Riesgos
                </Typography>
                {data.length === 0 ? (
                    <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="text.secondary">No hay datos disponibles</Typography>
                    </Box>
                ) : (
                <Box sx={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default OrigenRiesgosCard;
