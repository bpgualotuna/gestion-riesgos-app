import React from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';

interface AppPageLayoutProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    alert?: React.ReactNode;
    topContent?: React.ReactNode;
    children: React.ReactNode;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

/**
 * Standard layout for all pages in the application.
 * Follows the "contained" look: light gray background outside, white container inside.
 */
const AppPageLayout: React.FC<AppPageLayoutProps> = ({
    title,
    description,
    action,
    alert,
    topContent,
    children,
    maxWidth = 'xl',
}) => {
    return (
        <Container maxWidth={maxWidth} sx={{ mt: 1, mb: 4, px: { xs: 2, md: 3 } }}>
            {/* Top Content Section (e.g. Filters) */}
            {topContent && (
                <Box sx={{ mb: 3 }}>
                    {topContent}
                </Box>
            )}

            {/* Header Section */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#1976d2', mb: 0.5, letterSpacing: '-0.02em' }}>
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85 }}>
                            {description}
                        </Typography>
                    )}
                </Box>
                {action && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {action}
                    </Box>
                )}
            </Box>

            {/* Optional Alert Section (outside white container) */}
            {alert && (
                <Box sx={{ mb: 3 }}>
                    {alert}
                </Box>
            )}

            {/* Main Content Container - White elevation box */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 4, lg: 5 },
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                    minHeight: '70vh',
                }}
            >
                {children}
            </Paper>
        </Container>
    );
};

export default AppPageLayout;
