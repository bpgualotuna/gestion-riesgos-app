/**
 * Application Router
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Auth Components
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import AdminRedirect from '../features/auth/components/AdminRedirect';
import LoginPage from '../features/auth/pages/LoginPage';

// Pages
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import FichaPage from '../features/gestion-riesgos/pages/FichaPage';
import IdentificacionPage from '../features/gestion-riesgos/pages/IdentificacionPage';
import EvaluacionPage from '../features/gestion-riesgos/pages/EvaluacionPage';
import MapaPage from '../features/gestion-riesgos/pages/MapaPage';
import PriorizacionPage from '../features/gestion-riesgos/pages/riesgos/PriorizacionPage';
import NormatividadPage from '../features/gestion-riesgos/pages/procesos/NormatividadPage';
import ContextoExternoPage from '../features/gestion-riesgos/pages/procesos/ContextoExternoPage';
import ContextoInternoPage from '../features/gestion-riesgos/pages/procesos/ContextoInternoPage';
import DofaPage from '../features/gestion-riesgos/pages/procesos/DofaPage';
import AnalisisProcesoPage from '../features/gestion-riesgos/pages/procesos/AnalisisProcesoPage';
import BenchmarkingPage from '../features/gestion-riesgos/pages/procesos/BenchmarkingPage';
import AyudaPage from '../features/gestion-riesgos/pages/otros/AyudaPage';
import ProcesosPage from '../features/gestion-riesgos/pages/ProcesosPage';
import RiesgosProcesosPage from '../features/gestion-riesgos/pages/RiesgosProcesosPage';
import AdminPage from '../features/admin/pages/AdminPage';
import SupervisionPage from '../features/gestion-riesgos/pages/SupervisionPage';
import ResumenDirectorPage from '../features/gestion-riesgos/pages/ResumenDirectorPage';
import DashboardSupervisorPage from '../features/gestion-riesgos/pages/DashboardSupervisorPage';
import PlanAccionPage from '../features/gestion-riesgos/pages/PlanAccionPage';
import TareasPage from '../features/gestion-riesgos/pages/controles/TareasPage';
import HistorialPage from '../features/gestion-riesgos/pages/otros/HistorialPage';
import ResumenRiesgosPage from '../features/gestion-riesgos/pages/ResumenRiesgosPage';
import RiesgosPorProcesoPage from '../features/gestion-riesgos/pages/RiesgosPorProcesoPage';
import RiesgosPorTipologiaPage from '../features/gestion-riesgos/pages/RiesgosPorTipologiaPage';
import IncidenciasPage from '../features/gestion-riesgos/pages/IncidenciasPage';

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
        element: <AdminRedirect />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.RIESGOS_PROCESOS,
        element: <RiesgosProcesosPage />,
      },
      {
        path: ROUTES.FICHA,
        element: <FichaPage />,
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
        path: ROUTES.PLAN_ACCION,
        element: <PlanAccionPage />,
      },
      {
        path: ROUTES.TAREAS,
        element: <TareasPage />,
      },
      {
        path: ROUTES.HISTORIAL,
        element: <HistorialPage />,
      },
      {
        path: ROUTES.NORMATIVIDAD,
        element: <NormatividadPage />,
      },
      {
        path: ROUTES.CONTEXTO_EXTERNO,
        element: <ContextoExternoPage />,
      },
      {
        path: ROUTES.CONTEXTO_INTERNO,
        element: <ContextoInternoPage />,
      },
      {
        path: ROUTES.DOFA,
        element: <DofaPage />,
      },
      {
        path: ROUTES.ANALISIS_PROCESO,
        element: <AnalisisProcesoPage />,
      },
      {
        path: ROUTES.BENCHMARKING,
        element: <BenchmarkingPage />,
      },
      {
        path: ROUTES.AYUDA,
        element: <AyudaPage />,
      },
      {
        path: ROUTES.PROCESOS,
        element: <ProcesosPage />,
      },
      {
        path: ROUTES.PROCESOS_NUEVO,
        element: <ProcesosPage />,
      },
      {
        path: ROUTES.ADMINISTRACION,
        element: <AdminPage />,
      },
      {
        path: ROUTES.SUPERVISION,
        element: <SupervisionPage />,
      },
      {
        path: ROUTES.RESUMEN_DIRECTOR,
        element: <ResumenDirectorPage />,
      },
      {
        path: ROUTES.DASHBOARD_SUPERVISOR,
        element: <DashboardSupervisorPage />,
      },
      {
        path: ROUTES.RESUMEN_RIESGOS,
        element: <ResumenRiesgosPage />,
      },
      {
        path: ROUTES.RIESGOS_POR_PROCESO,
        element: <RiesgosPorProcesoPage />,
      },
      {
        path: ROUTES.RIESGOS_POR_TIPOLOGIA,
        element: <RiesgosPorTipologiaPage />,
      },
      {
        path: ROUTES.INCIDENCIAS,
        element: <IncidenciasPage />,
      },
    ],
  },
]);

