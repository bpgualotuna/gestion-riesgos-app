/**
 * Application Router
 */

import { createBrowserRouter, Navigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Auth Components
// Auth Components
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminRedirect from "../components/auth/AdminRedirect";
import LoginPage from "../pages/auth/LoginPage";

// Error Handling
import RouteErrorElement from "../components/common/RouteErrorElement";

// Pages
// Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import FichaPage from '../pages/ficha/FichaPage';
import IdentificacionCalificacionPage from '../pages/identificacion/IdentificacionCalificacionPage';
import EvaluacionPage from '../pages/evaluacion/EvaluacionPage';
import MapaPage from '../pages/mapas/MapaPage';
import PriorizacionPage from '../pages/riesgos/PriorizacionPage';
import NormatividadPage from '../pages/procesos/NormatividadPage';
import ContextoExternoPage from '../pages/procesos/ContextoExternoPage';
import ContextoInternoPage from '../pages/procesos/ContextoInternoPage';
import DofaPage from '../pages/procesos/DofaPage';
import AnalisisProcesoPage from '../pages/procesos/AnalisisProcesoPage';
import BenchmarkingPage from '../pages/procesos/BenchmarkingPage';
import AyudaPage from '../pages/otros/AyudaPage';
import ProcesosPage from '../pages/procesos/ProcesosPage';
import RiesgosProcesosPage from '../pages/riesgos/RiesgosProcesosPage';

import SupervisionPage from '../pages/supervision/SupervisionPage';
import ResumenDirectorPage from '../pages/dashboard/ResumenDirectorPage';
import DashboardSupervisorPage from '../pages/supervision/DashboardSupervisorPage';
import PlanAccionPage from '../pages/plan-accion/PlanAccionPage';
import ControlesYPlanesAccionPage from '../pages/controles/ControlesYPlanesAccionPage';
import EvaluacionControlPage from '../pages/controles/EvaluacionControlPage';
import TareasPage from '../pages/controles/TareasPage';
import HistorialPage from '../pages/otros/HistorialPage';
import ResumenRiesgosPage from '../pages/dashboard/ResumenRiesgosPage';
import RiesgosPorProcesoPage from '../pages/riesgos/RiesgosPorProcesoPage';
import RiesgosPorTipologiaPage from '../pages/riesgos/RiesgosPorTipologiaPage';
import IncidenciasPage from '../pages/incidencias/IncidenciasPage';
import ModoGerenteGeneralSelector from '../components/auth/ModoGerenteGeneralSelector';
import ProcesosGerenteGeneralPage from '../pages/gerente-general/ProcesosGerenteGeneralPage';
import DashboardGerenteGeneralPage from '../pages/gerente-general/DashboardGerenteGeneralPage';
import UsuariosPage from '../pages/admin/UsuariosPage';
import ProcesosDefinicionPage from '../pages/admin/ProcesosDefinicionPage';
import AreasPage from '../pages/admin/AreasPage';
import ConfiguracionPage from '../pages/admin/ConfiguracionPage';
import ParametrosCalificacionPage from '../pages/admin/ParametrosCalificacionPage';
import MapasConfigPage from '../pages/admin/MapasConfigPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: ROUTES.MODO_GERENTE_GENERAL,
    element: (
      <ProtectedRoute>
        <ModoGerenteGeneralSelector />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorElement />,
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
        path: `${ROUTES.FICHA}/:procesoId`,
        element: <FichaPage />,
      },
      {
        path: ROUTES.IDENTIFICACION,
        element: <IdentificacionCalificacionPage />,
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
        path: '/admin/mapas',
        element: <MapasConfigPage />,
      },
      {
        path: '/admin/parametros-calificacion',
        element: <ParametrosCalificacionPage />,
      },
      {
        path: ROUTES.PRIORIZACION,
        element: <PriorizacionPage />,
      },
      {
        path: ROUTES.PLAN_ACCION,
        element: <ControlesYPlanesAccionPage />,
      },
      {
        path: ROUTES.EVALUACION_CONTROL,
        element: <EvaluacionControlPage />,
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
        element: <Navigate to={ROUTES.ADMIN_USUARIOS} replace />,
      },
      {
        path: ROUTES.ADMIN_USUARIOS,
        element: <UsuariosPage />,
      },
      {
        path: ROUTES.ADMIN_PROCESOS,
        element: <ProcesosDefinicionPage />,
      },
      {
        path: ROUTES.ADMIN_AREAS,
        element: <AreasPage />,
      },
      {
        path: ROUTES.ADMIN_CONFIGURACION,
        element: <ConfiguracionPage />,
      },
      {
        path: ROUTES.ADMIN_MAPA_CONFIG,
        element: <MapasConfigPage />,
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
      {
        path: ROUTES.PROCESOS_GERENTE_GENERAL,
        element: <ProcesosGerenteGeneralPage />,
      },
      {
        path: ROUTES.DASHBOARD_GERENTE_GENERAL,
        element: <DashboardGerenteGeneralPage />,
      },
      {
        path: ROUTES.ASIGNACIONES,
        element: (
          <Navigate
            to={ROUTES.ADMIN_AREAS}
            replace
          />
        ),
      },
    ],
  },
  {
    path: '*',
    element: <RouteErrorElement />,
  },
]);

