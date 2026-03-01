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
 * Responsive: header stacks on mobile, reduced padding on small screens.
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
        <Container maxWidth={maxWidth} disableGutters={false} sx={{ mt: 1, mb: 4, px: { xs: 1, sm: 2, md: 3 }, width: '100%', minWidth: 0 }}>
            {/* Top Content Section (e.g. Filters) */}
            {topContent && (
                <Box sx={{ mb: 2, overflow: 'hidden' }}>
                    {topContent}
                </Box>
            )}

            {/* Header Section - responsive: stack on mobile */}
            <Box sx={{
                mb: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                gap: 2,
                flexWrap: 'wrap',
            }}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            color: '#1976d2',
                            mb: 0.5,
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                            wordBreak: 'break-word',
                        }}
                    >
                        {title}
                    </Typography>
                    {description && (
                        <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.85, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                            {description}
                        </Typography>
                    )}
                </Box>
                {action && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
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
                    p: { xs: 1.5, sm: 2, md: 4, lg: 5 },
                    borderRadius: { xs: 2, sm: 4 },
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                    minHeight: { xs: '60vh', sm: '70vh' },
                    overflow: 'auto',
                    maxWidth: '100%',
                    minWidth: 0,
                }}
            >
                {children}
            </Paper>
        </Container>
    );
};

export default AppPageLayout;
