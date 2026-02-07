/**
 * Componente para mostrar origen de riesgos (Donut Chart)
 * Extraído para mejorar escalabilidad
 */

import { Box, Typography, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface OrigenRiesgosCardProps {
  datos: Record<string, number>;
  total: number;
}

export default function OrigenRiesgosCard({ datos, total }: OrigenRiesgosCardProps) {
  const data = Object.entries(datos).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#42a5f5', '#1976d2', '#90caf9'];

  return (
    <Card
      sx={{
        height: '100%',
        border: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        borderRadius: 2,
        background: 'white',
        minHeight: 200,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom fontWeight={600} sx={{ mb: 2, fontSize: '0.875rem', color: '#424242' }}>
          Origen de riesgos
        </Typography>
        <Box sx={{ height: 200, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}

