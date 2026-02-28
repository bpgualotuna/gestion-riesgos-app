/**
 * AdminRedirect Component
 * Redirects users to their appropriate dashboard based on role
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { Box, Skeleton } from '@mui/material';

const AdminRedirect = () => {
    const { user, isLoading, esAdmin, esDueñoProcesos, esSupervisorRiesgos, esGerente, gerenteMode } = useAuth();

    if (isLoading) {
        return (
            <Box sx={{ p: 4, maxWidth: 400, mx: 'auto', minHeight: '100vh' }}>
                <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1, mb: 2 }} />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="50%" />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirigir según el rol del usuario
    if (esAdmin) {
        return <Navigate to={ROUTES.ADMINISTRACION} replace />;
    }

    // Si es gerente y no ha seleccionado modo, redirigir a selección de modo
    if (esGerente && !gerenteMode) {
        return <Navigate to={ROUTES.MODO_GERENTE_GENERAL} replace />;
    }
    
    // Si es gerente y ya tiene modo seleccionado, redirigir según el modo
    if (esGerente && gerenteMode === 'supervisor') {
        return <Navigate to={ROUTES.DASHBOARD_SUPERVISOR} replace />;
    }
    
    if (esGerente && gerenteMode === 'dueño') {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    if (esSupervisorRiesgos) {
        return <Navigate to={ROUTES.DASHBOARD_SUPERVISOR} replace />;
    }

    if (esDueñoProcesos) {
        return <Navigate to={ROUTES.DASHBOARD} replace />;
    }

    // Fallback: ir al dashboard principal
    return <Navigate to={ROUTES.DASHBOARD} replace />;
};

export default AdminRedirect;
