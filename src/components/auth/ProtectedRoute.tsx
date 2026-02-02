/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(false);

  // Timeout de seguridad: máximo 500ms de carga
  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout en ProtectedRoute: Forzando fin de carga');
        setShowLoading(false);
      }, 500); // Reducido a 500ms
      return () => clearTimeout(timeout);
    } else {
      setShowLoading(false);
    }
  }, [isLoading]);

  // Si está cargando más de 500ms, mostrar loading
  if (isLoading && showLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#E8E8E8',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#c8d900' }} size={60} />
        <Typography variant="body2" color="text.secondary">
          Cargando...
        </Typography>
      </Box>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    console.log('🔒 Usuario no autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado, mostrar contenido
  console.log('✅ Usuario autenticado, mostrando contenido');
  return <>{children}</>;
}
