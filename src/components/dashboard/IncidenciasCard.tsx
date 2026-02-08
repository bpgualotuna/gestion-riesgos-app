import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { BugReport as BugReportIcon } from '@mui/icons-material';

interface IncidenciasCardProps {
    total: number;
}

const IncidenciasCard: React.FC<IncidenciasCardProps> = ({ total }) => {
    return (
        <Card sx={{ height: '100%', bgcolor: 'error.light', color: 'error.contrastText' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            Incidencias
                        </Typography>
                        <Typography variant="h3" fontWeight={700}>
                            {total}
                        </Typography>
                    </Box>
                    <BugReportIcon sx={{ fontSize: 60, opacity: 0.8 }} />
                </Box>
                <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                    Reportadas este mes
                </Typography>
            </CardContent>
        </Card>
    );
};

export default IncidenciasCard;
