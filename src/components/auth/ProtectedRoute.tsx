/**
 * ProtectedRoute Component
 * Enhanced route protection with loading states and error handling
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, Skeleton, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requireAuth?: boolean; // Por defecto true
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <Box sx={{ p: 4, maxWidth: 400, mx: 'auto', minHeight: '100vh' }}>
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="50%" />
            </Box>
        );
    }

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
