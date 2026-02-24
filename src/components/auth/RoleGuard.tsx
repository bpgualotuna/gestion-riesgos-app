/**
 * RoleGuard Component
 * Protects routes based on user roles
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ROUTES } from '../../utils/constants';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAll?: boolean; // Si true, requiere todos los roles; si false, requiere al menos uno
  fallbackPath?: string;
  showLoading?: boolean;
}

export default function RoleGuard({
  children,
  allowedRoles = [],
  requireAll = false,
  fallbackPath = '/',
  showLoading = true,
}: RoleGuardProps) {
  const { user, isLoading, esAdmin, esDueñoProcesos, esSupervisorRiesgos, esGerente } = useAuth();
  const location = useLocation();

  if (isLoading && showLoading) {
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
          Verificando permisos...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no se especifican roles, permitir acceso a todos los usuarios autenticados
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Mapear helpers a roles
  const userRoleMap: Record<string, UserRole> = {
    admin: 'admin',
    dueño_procesos: 'dueño_procesos',
    supervisor: 'supervisor',
    gerente: 'gerente',
  };

  const userRole = user.role;

  // Verificar permisos
  let hasAccess = false;

  if (requireAll) {
    // Requiere todos los roles especificados
    hasAccess = allowedRoles.every((role) => {
      switch (role) {
        case 'admin':
          return esAdmin;
        case 'dueño_procesos':
          return esDueñoProcesos;
        case 'supervisor':
          return esSupervisorRiesgos;
        case 'gerente':
          return esGerente;
        default:
          return userRole === role;
      }
    });
  } else {
    // Requiere al menos uno de los roles especificados
    hasAccess = allowedRoles.some((role) => {
      switch (role) {
        case 'admin':
          return esAdmin;
        case 'dueño_procesos':
          return esDueñoProcesos;
        case 'supervisor':
          return esSupervisorRiesgos;
        case 'gerente':
          return esGerente;
        default:
          return userRole === role;
      }
    });
  }

  if (!hasAccess) {
    // Prevenir bucles de redirección: solo redirigir si no estamos ya en la ruta de destino
    let redirectPath = fallbackPath;
    
    if (user) {
      if (esAdmin) {
        redirectPath = ROUTES.ADMIN_USUARIOS;
      } else if (esDueñoProcesos) {
        redirectPath = ROUTES.DASHBOARD;
      } else if (esSupervisorRiesgos) {
        redirectPath = ROUTES.DASHBOARD_SUPERVISOR;
      } else if (esGerente) {
        redirectPath = ROUTES.DASHBOARD_GERENTE_GENERAL;
      }
    }
    
    // Solo redirigir si no estamos ya en esa ruta (evitar bucles infinitos)
    if (location.pathname !== redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
    
    // Si ya estamos en la ruta de destino, mostrar mensaje de acceso denegado
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          p: 3,
        }}
      >
        <Typography variant="h5" color="error" fontWeight="bold">
          Acceso Denegado
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          No tienes permisos para acceder a esta página.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}

