/**
 * AdminRedirect Component
 * Redirects users to their appropriate dashboard based on role
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { Box, CircularProgress, Typography } from '@mui/material';

const AdminRedirect = () => {
    const { user, isLoading, esAdmin, esDueñoProcesos, esSupervisorRiesgos, esGerente, gerenteMode } = useAuth();

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
                    Cargando...
                </Typography>
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
