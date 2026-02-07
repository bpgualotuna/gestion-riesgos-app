import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';

interface TotalRiesgosCardProps {
    total: number;
    criticos: number;
    altos: number;
}

const TotalRiesgosCard: React.FC<TotalRiesgosCardProps> = ({ total, criticos, altos }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Total Riesgos
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h2" fontWeight={700} color="primary">
                        {total}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<ErrorIcon />}
                        label={`${criticos} Críticos`}
                        color="error"
                        variant={criticos > 0 ? 'filled' : 'outlined'}
                    />
                    <Chip
                        icon={<WarningIcon />}
                        label={`${altos} Altos`}
                        color="warning"
                        variant={altos > 0 ? 'filled' : 'outlined'}
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default TotalRiesgosCard;
