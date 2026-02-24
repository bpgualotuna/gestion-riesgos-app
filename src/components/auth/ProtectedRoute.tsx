/**
 * ProtectedRoute Component
 * Enhanced route protection with loading states and error handling
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAuth?: boolean; // Por defecto true
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Verificando autenticación...
                </Typography>
            </Box>
        );
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
