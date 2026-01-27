/**
 * Application Router
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Auth Components
import ProtectedRoute from '../components/auth/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';

// Pages
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import IdentificacionPage from '../features/gestion-riesgos/pages/IdentificacionPage';
import EvaluacionPage from '../features/gestion-riesgos/pages/EvaluacionPage';
import MapaPage from '../features/gestion-riesgos/pages/MapaPage';
import PriorizacionPage from '../features/gestion-riesgos/pages/PriorizacionPage';
import NormatividadPage from '../features/gestion-riesgos/pages/NormatividadPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.IDENTIFICACION,
        element: <IdentificacionPage />,
      },
      {
        path: ROUTES.EVALUACION,
        element: <EvaluacionPage />,
      },
      {
        path: ROUTES.MAPA,
        element: <MapaPage />,
      },
      {
        path: ROUTES.PRIORIZACION,
        element: <PriorizacionPage />,
      },
      {
        path: ROUTES.NORMATIVIDAD,
        element: <NormatividadPage />,
      },
    ],
  },
]);

