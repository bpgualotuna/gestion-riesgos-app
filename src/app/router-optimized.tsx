/**
 * Application Router - OPTIMIZED
 * Lazy loading and route protection
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { Box, CircularProgress } from '@mui/material';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import RoleGuard from '../components/auth/RoleGuard';
import AdminRedirect from '../components/auth/AdminRedirect';
import RouteErrorElement from '../components/common/RouteErrorElement';

// Auth Pages - Load immediately (critical)
import LoginPage from '../pages/auth/LoginPage';
import ModoGerenteGeneralSelector from '../components/auth/ModoGerenteGeneralSelector';

// Loading Component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const FichaPage = lazy(() => import('../pages/ficha/FichaPage'));
const IdentificacionCalificacionPage = lazy(() => import('../pages/identificacion/IdentificacionCalificacionPage'));
const EvaluacionPage = lazy(() => import('../pages/evaluacion/EvaluacionPage'));
const MapaPage = lazy(() => import('../pages/mapas/MapaPage'));
const PriorizacionPage = lazy(() => import('../pages/riesgos/PriorizacionPage'));
const NormatividadPage = lazy(() => import('../pages/procesos/NormatividadPage'));
const ContextoExternoPage = lazy(() => import('../pages/procesos/ContextoExternoPage'));
const ContextoInternoPage = lazy(() => import('../pages/procesos/ContextoInternoPage'));
const DofaPage = lazy(() => import('../pages/procesos/DofaPage'));
const AnalisisProcesoPage = lazy(() => import('../pages/procesos/AnalisisProcesoPage'));
const BenchmarkingPage = lazy(() => import('../pages/procesos/BenchmarkingPage'));
const AyudaPage = lazy(() => import('../pages/otros/AyudaPage'));
const ProcesosPage = lazy(() => import('../pages/procesos/ProcesosPage'));
const RiesgosProcesosPage = lazy(() => import('../pages/riesgos/RiesgosProcesosPage'));
const SupervisionPage = lazy(() => import('../pages/supervision/SupervisionPage'));
const ResumenDirectorPage = lazy(() => import('../pages/dashboard/ResumenDirectorPage'));
const DashboardSupervisorPage = lazy(() => import('../pages/supervision/DashboardSupervisorPage'));
const ControlesYPlanesAccionPage = lazy(() => import('../pages/controles/ControlesYPlanesAccionPage'));
const EvaluacionControlPage = lazy(() => import('../pages/controles/EvaluacionControlPage'));
const TareasPage = lazy(() => import('../pages/controles/TareasPage'));
const HistorialPage = lazy(() => import('../pages/otros/HistorialPage'));
const ResumenRiesgosPage = lazy(() => import('../pages/dashboard/ResumenRiesgosPage'));
const RiesgosPorProcesoPage = lazy(() => import('../pages/riesgos/RiesgosPorProcesoPage'));
const RiesgosPorTipologiaPage = lazy(() => import('../pages/riesgos/RiesgosPorTipologiaPage'));
const MaterializarRiesgosPage = lazy(() => import('../pages/riesgos/MaterializarRiesgosPage'));
const ProcesosGerenteGeneralPage = lazy(() => import('../pages/gerente-general/ProcesosGerenteGeneralPage'));
const DashboardGerenteGeneralPage = lazy(() => import('../pages/gerente-general/DashboardGerenteGeneralPage'));
const UsuariosPage = lazy(() => import('../pages/admin/UsuariosPage'));
const ProcesosDefinicionPage = lazy(() => import('../pages/admin/ProcesosDefinicionPage'));
const AreasPage = lazy(() => import('../pages/admin/AreasPage'));
const ConfiguracionPage = lazy(() => import('../pages/admin/ConfiguracionPage'));
const ParametrosCalificacionPage = lazy(() => import('../pages/admin/ParametrosCalificacionPage'));
const MapasConfigPage = lazy(() => import('../pages/admin/MapasConfigPage'));
const CalificacionInherentePage = lazy(() => import('../pages/admin/CalificacionInherentePage'));
const AdminPanelPage = lazy(() => import('../pages/admin/AdminPanelPage'));

// Wrapper for lazy loaded components with Suspense
const LazyRoute = ({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType<any>> }) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: ROUTES.MODO_GERENTE_GENERAL,
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['gerente_general']}>
          <ModoGerenteGeneralSelector />
        </RoleGuard>
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
        element: <LazyRoute component={DashboardPage} />,
      },
      {
        path: ROUTES.RIESGOS_PROCESOS,
        element: <LazyRoute component={RiesgosProcesosPage} />,
      },
      {
        path: ROUTES.FICHA,
        element: <LazyRoute component={FichaPage} />,
      },
      {
        path: `${ROUTES.FICHA}/:procesoId`,
        element: <LazyRoute component={FichaPage} />,
      },
      {
        path: ROUTES.IDENTIFICACION,
        element: (
          <RoleGuard allowedRoles={['dueño_procesos', 'gerente_general']}>
            <LazyRoute component={IdentificacionCalificacionPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.EVALUACION,
        element: <LazyRoute component={EvaluacionPage} />,
      },
      {
        path: ROUTES.MAPA,
        element: <LazyRoute component={MapaPage} />,
      },
      {
        path: '/admin/mapas',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={MapasConfigPage} />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/parametros-calificacion',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={ParametrosCalificacionPage} />
          </RoleGuard>
        ),
      },
      {
        path: '/admin/calificacion-inherente',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={CalificacionInherentePage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.PRIORIZACION,
        element: <LazyRoute component={PriorizacionPage} />,
      },
      {
        path: ROUTES.PLAN_ACCION,
        element: <LazyRoute component={ControlesYPlanesAccionPage} />,
      },
      {
        path: ROUTES.EVALUACION_CONTROL,
        element: <LazyRoute component={EvaluacionControlPage} />,
      },
      {
        path: ROUTES.TAREAS,
        element: <LazyRoute component={TareasPage} />,
      },
      {
        path: ROUTES.HISTORIAL,
        element: <LazyRoute component={HistorialPage} />,
      },
      {
        path: ROUTES.NORMATIVIDAD,
        element: <LazyRoute component={NormatividadPage} />,
      },
      {
        path: ROUTES.CONTEXTO_EXTERNO,
        element: <LazyRoute component={ContextoExternoPage} />,
      },
      {
        path: ROUTES.CONTEXTO_INTERNO,
        element: <LazyRoute component={ContextoInternoPage} />,
      },
      {
        path: ROUTES.DOFA,
        element: <LazyRoute component={DofaPage} />,
      },
      {
        path: ROUTES.ANALISIS_PROCESO,
        element: <LazyRoute component={AnalisisProcesoPage} />,
      },
      {
        path: ROUTES.BENCHMARKING,
        element: <LazyRoute component={BenchmarkingPage} />,
      },
      {
        path: ROUTES.AYUDA,
        element: <LazyRoute component={AyudaPage} />,
      },
      {
        path: ROUTES.PROCESOS,
        element: <LazyRoute component={ProcesosPage} />,
      },
      {
        path: ROUTES.PROCESOS_NUEVO,
        element: <LazyRoute component={ProcesosPage} />,
      },
      {
        path: ROUTES.ADMINISTRACION,
        element: <Navigate to={ROUTES.ADMIN_USUARIOS} replace />,
      },
      {
        path: ROUTES.ADMIN_USUARIOS,
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={UsuariosPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ADMIN_PROCESOS,
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={ProcesosDefinicionPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ADMIN_AREAS,
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={AreasPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ADMIN_CONFIGURACION,
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={ConfiguracionPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ADMIN_MAPA_CONFIG,
        element: (
          <RoleGuard allowedRoles={['admin']}>
            <LazyRoute component={MapasConfigPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.SUPERVISION,
        element: (
          <RoleGuard allowedRoles={['supervisor', 'gerente_general']}>
            <LazyRoute component={SupervisionPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.RESUMEN_DIRECTOR,
        element: (
          <RoleGuard allowedRoles={['supervisor', 'gerente_general']}>
            <LazyRoute component={ResumenDirectorPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.DASHBOARD_SUPERVISOR,
        element: (
          <RoleGuard allowedRoles={['supervisor', 'gerente_general']}>
            <LazyRoute component={DashboardSupervisorPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.RESUMEN_RIESGOS,
        element: <LazyRoute component={ResumenRiesgosPage} />,
      },
      {
        path: ROUTES.RIESGOS_POR_PROCESO,
        element: <LazyRoute component={RiesgosPorProcesoPage} />,
      },
      {
        path: ROUTES.RIESGOS_POR_TIPOLOGIA,
        element: <LazyRoute component={RiesgosPorTipologiaPage} />,
      },
      {
        path: ROUTES.INCIDENCIAS,
        element: <LazyRoute component={MaterializarRiesgosPage} />,
      },
      {
        path: ROUTES.PROCESOS_GERENTE_GENERAL,
        element: (
          <RoleGuard allowedRoles={['gerente_general']}>
            <LazyRoute component={ProcesosGerenteGeneralPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.DASHBOARD_GERENTE_GENERAL,
        element: (
          <RoleGuard allowedRoles={['gerente_general']}>
            <LazyRoute component={DashboardGerenteGeneralPage} />
          </RoleGuard>
        ),
      },
      {
        path: ROUTES.ASIGNACIONES,
        element: <Navigate to={ROUTES.ADMIN_AREAS} replace />,
      },
    ],
  },
  {
    path: '/admin-panel',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['admin']}>
          <LazyRoute component={AdminPanelPage} />
        </RoleGuard>
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorElement />,
  },
  {
    path: '*',
    element: <RouteErrorElement />,
  },
]);

