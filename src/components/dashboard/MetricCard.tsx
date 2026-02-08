import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color = 'primary.main', trend, trendValue, onClick }) => {
    return (
        <Card
            sx={{
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick ? { boxShadow: 4 } : {}
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={700}>
                            {value}
                        </Typography>
                        {trend && (
                            <Typography variant="body2" sx={{
                                color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                mt: 1
                            }}>
                                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '-'} {trendValue}
                            </Typography>
                        )}
                    </Box>
                    {icon && (
                        <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
                            {icon}
                        </Avatar>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default MetricCard;
