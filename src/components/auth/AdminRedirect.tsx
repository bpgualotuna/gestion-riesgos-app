/**
 * Componente que redirige automáticamente a los admins a la página de administración
 */

import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export default function AdminRedirect() {
  const { esAdmin } = useAuth();

  useEffect(() => {
    // Si es admin y está en dashboard, redirigir a administración
    if (esAdmin && window.location.pathname === ROUTES.DASHBOARD) {
      window.location.href = ROUTES.ADMINISTRACION;
    }
  }, [esAdmin]);

  if (esAdmin) {
    return <Navigate to={ROUTES.ADMINISTRACION} replace />;
  }

  return <Navigate to={ROUTES.DASHBOARD} replace />;
}

