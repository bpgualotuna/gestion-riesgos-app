/**
 * Resuelve etiquetas del menú lateral y metadatos para CORA IA (alineado con menuConfig).
 */

import { menuItems } from '../components/layout/menuConfig';
import { ROUTES } from './constants';
import type { ScreenContext } from '../types/ia.types';

export interface CoraNavHints {
  route: string;
  menuPath: string | null;
  pantallaEtiqueta: string | null;
  moduleDefault: string;
  screenDefault: string;
}

function normalizePathname(pathname: string): string {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** Mapa ruta normalizada → ruta en menú lateral (texto literal del sidebar). */
function construirMapaMenuLateral(): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const item of menuItems) {
    if (item.children?.length) {
      const padre = item.text;
      for (const hijo of item.children) {
        if (hijo.path) {
          mapa.set(normalizePathname(hijo.path), `${padre} › ${hijo.text}`);
        }
      }
    }
    if (item.path && !item.children?.length) {
      mapa.set(normalizePathname(item.path), item.text);
    }
  }
  return mapa;
}

const MENU_PATH_POR_RUTA = construirMapaMenuLateral();

/** Defaults de módulo/pantalla por ruta exacta del menú lateral (coherentes con páginas que envían contexto). */
const DEFAULTS_POR_RUTA_MENU: Record<
  string,
  { moduleDefault: string; screenDefault: string; pantallaEtiqueta?: string }
> = {
  [normalizePathname(ROUTES.FICHA)]: { moduleDefault: 'procesos', screenDefault: 'ficha', pantallaEtiqueta: 'Ficha del proceso' },
  [normalizePathname(ROUTES.ANALISIS_PROCESO)]: { moduleDefault: 'procesos', screenDefault: 'analisis', pantallaEtiqueta: 'Análisis de proceso' },
  [normalizePathname(ROUTES.NORMATIVIDAD)]: { moduleDefault: 'procesos', screenDefault: 'normatividad' },
  [normalizePathname(ROUTES.CONTEXTO_INTERNO)]: { moduleDefault: 'procesos', screenDefault: 'contexto-interno' },
  [normalizePathname(ROUTES.CONTEXTO_EXTERNO)]: { moduleDefault: 'procesos', screenDefault: 'contexto-externo' },
  [normalizePathname(ROUTES.DOFA)]: { moduleDefault: 'procesos', screenDefault: 'dofa' },
  [normalizePathname(ROUTES.IDENTIFICACION)]: { moduleDefault: 'riesgos', screenDefault: 'identificacion' },
  [normalizePathname(ROUTES.PLAN_ACCION)]: { moduleDefault: 'planes', screenDefault: 'controles-planes' },
  [normalizePathname(ROUTES.PLANES_ACCION_GESTION)]: { moduleDefault: 'planes', screenDefault: 'gestion-planes' },
  [normalizePathname(ROUTES.INCIDENCIAS)]: { moduleDefault: 'incidencias', screenDefault: 'materializar' },
  [normalizePathname(ROUTES.HISTORIAL)]: { moduleDefault: 'app', screenDefault: 'historial' },
  [normalizePathname(ROUTES.MAPA)]: { moduleDefault: 'mapa', screenDefault: 'mapa' },
  [normalizePathname(ROUTES.DASHBOARD_SUPERVISOR)]: {
    moduleDefault: 'dashboard',
    screenDefault: 'estadisticas',
    pantallaEtiqueta: 'Estadísticas (supervisor/gerente)',
  },
};

/** Rutas conocidas que no salen del árbol del menú (o necesitan aclaración para CORA). */
const METADATA_RUTA_EXTRA: Record<
  string,
  Pick<CoraNavHints, 'menuPath' | 'pantallaEtiqueta' | 'moduleDefault' | 'screenDefault'>
> = {
  [normalizePathname(ROUTES.DASHBOARD)]: {
    menuPath: 'Dashboard (resumen principal)',
    pantallaEtiqueta: 'Dashboard',
    moduleDefault: 'dashboard',
    screenDefault: 'principal',
  },
  [normalizePathname(ROUTES.RIESGOS_PROCESOS)]: {
    menuPath: '(Acceso interno o URL directa; no es ítem fijo del menú lateral)',
    pantallaEtiqueta: 'Riesgos por proceso',
    moduleDefault: 'riesgos',
    screenDefault: 'riesgos-procesos',
  },
  [normalizePathname(ROUTES.EVALUACION)]: {
    menuPath:
      'No figura como ítem fijo del menú lateral; URL `/evaluacion` (acceso por flujo de riesgos o bookmark)',
    pantallaEtiqueta: 'Evaluación de riesgos',
    moduleDefault: 'riesgos',
    screenDefault: 'evaluacion',
  },
  [normalizePathname(ROUTES.PRIORIZACION)]: {
    menuPath:
      'No figura como ítem fijo del menú lateral; URL `/priorizacion`',
    pantallaEtiqueta: 'Priorización de riesgos',
    moduleDefault: 'riesgos',
    screenDefault: 'priorizacion',
  },
  [normalizePathname(ROUTES.EVALUACION_CONTROL)]: {
    menuPath:
      'No figura como ítem fijo del menú lateral; URL `/evaluacion-control`',
    pantallaEtiqueta: 'Evaluación de controles',
    moduleDefault: 'controles',
    screenDefault: 'evaluacion-control',
  },
  [normalizePathname(ROUTES.PROCESOS)]: {
    menuPath: '(Gestión de procesos — pantalla de listado / modo creación admin)',
    pantallaEtiqueta: 'Procesos',
    moduleDefault: 'procesos',
    screenDefault: 'listado',
  },
  [normalizePathname(ROUTES.PROCESOS_NUEVO)]: {
    menuPath: '(Alta de proceso — suele requerir rol administrador)',
    pantallaEtiqueta: 'Nuevo proceso',
    moduleDefault: 'procesos',
    screenDefault: 'nuevo',
  },
  [normalizePathname(ROUTES.AYUDA)]: {
    menuPath: '(Ayuda — suele abrirse desde el ícono de ayuda / URL `/ayuda`)',
    pantallaEtiqueta: 'Ayuda',
    moduleDefault: 'app',
    screenDefault: 'ayuda',
  },
  [normalizePathname(ROUTES.SUPERVISION)]: {
    menuPath: '(Supervisión — rol supervisor/gerente)',
    pantallaEtiqueta: 'Supervisión',
    moduleDefault: 'supervision',
    screenDefault: 'supervision',
  },
  [normalizePathname(ROUTES.RESUMEN_DIRECTOR)]: {
    menuPath: '(Resumen director — rol supervisor/gerente)',
    pantallaEtiqueta: 'Resumen director',
    moduleDefault: 'supervision',
    screenDefault: 'resumen-director',
  },
  [normalizePathname(ROUTES.RESUMEN_RIESGOS)]: {
    menuPath: '(Resumen de riesgos — URL directa)',
    pantallaEtiqueta: 'Resumen de riesgos',
    moduleDefault: 'riesgos',
    screenDefault: 'resumen',
  },
  [normalizePathname(ROUTES.RIESGOS_POR_PROCESO)]: {
    menuPath: '(Riesgos por proceso — URL directa)',
    pantallaEtiqueta: 'Riesgos por proceso',
    moduleDefault: 'riesgos',
    screenDefault: 'por-proceso',
  },
  [normalizePathname(ROUTES.RIESGOS_POR_TIPOLOGIA)]: {
    menuPath: '(Riesgos por tipología — URL directa)',
    pantallaEtiqueta: 'Riesgos por tipología',
    moduleDefault: 'riesgos',
    screenDefault: 'por-tipologia',
  },
  [normalizePathname(ROUTES.PROCESOS_GERENTE_GENERAL)]: {
    menuPath: '(Gerente general — procesos)',
    pantallaEtiqueta: 'Procesos gerente general',
    moduleDefault: 'gerente',
    screenDefault: 'procesos-gg',
  },
  [normalizePathname(ROUTES.DASHBOARD_GERENTE_GENERAL)]: {
    menuPath: '(Gerente general — dashboard)',
    pantallaEtiqueta: 'Dashboard gerente general',
    moduleDefault: 'gerente',
    screenDefault: 'dashboard-gg',
  },
  [normalizePathname(ROUTES.ADMIN_USUARIOS)]: {
    menuPath: 'Administración › Usuarios',
    pantallaEtiqueta: 'Administración — usuarios',
    moduleDefault: 'admin',
    screenDefault: 'usuarios',
  },
  [normalizePathname(ROUTES.ADMIN_PROCESOS)]: {
    menuPath: 'Administración › Definición de procesos',
    pantallaEtiqueta: 'Administración — procesos',
    moduleDefault: 'admin',
    screenDefault: 'procesos-definicion',
  },
  [normalizePathname(ROUTES.ADMIN_AREAS)]: {
    menuPath: 'Administración › Áreas',
    pantallaEtiqueta: 'Administración — áreas',
    moduleDefault: 'admin',
    screenDefault: 'areas',
  },
  [normalizePathname(ROUTES.ADMIN_ASIGNACIONES)]: {
    menuPath: 'Administración › Asignaciones',
    pantallaEtiqueta: 'Administración — asignaciones',
    moduleDefault: 'admin',
    screenDefault: 'asignaciones',
  },
  [normalizePathname(ROUTES.ADMIN_PERMISOS)]: {
    menuPath: 'Administración › Permisos',
    pantallaEtiqueta: 'Administración — permisos',
    moduleDefault: 'admin',
    screenDefault: 'permisos',
  },
  [normalizePathname(ROUTES.ADMIN_CONFIGURACION)]: {
    menuPath: 'Administración › Configuración',
    pantallaEtiqueta: 'Administración — configuración',
    moduleDefault: 'admin',
    screenDefault: 'configuracion',
  },
  [normalizePathname(ROUTES.ADMIN_MAPA_CONFIG)]: {
    menuPath: 'Administración › Configuración de mapa',
    pantallaEtiqueta: 'Configuración de mapa de riesgos',
    moduleDefault: 'admin',
    screenDefault: 'mapa-config',
  },
  [normalizePathname(ROUTES.ADMIN_CALIFICACION_RESIDUAL)]: {
    menuPath: 'Administración › Calificación residual',
    pantallaEtiqueta: 'Calificación residual',
    moduleDefault: 'admin',
    screenDefault: 'calificacion-residual',
  },
  [normalizePathname(ROUTES.ADMIN_RESIDUAL_ESTRATEGICO_CWR)]: {
    menuPath: 'Administración › Residual estratégico (CWR)',
    pantallaEtiqueta: 'Residual estratégico',
    moduleDefault: 'admin',
    screenDefault: 'residual-estrategico',
  },
  [normalizePathname(ROUTES.ADMIN_2FA)]: {
    menuPath: 'Administración › 2FA',
    pantallaEtiqueta: 'Administración — autenticación 2FA',
    moduleDefault: 'admin',
    screenDefault: '2fa',
  },
  '/admin/mapas': {
    menuPath: 'Administración › Configuración de mapa (`/admin/mapas`)',
    pantallaEtiqueta: 'Configuración de mapas',
    moduleDefault: 'admin',
    screenDefault: 'mapas',
  },
  '/admin/parametros-calificacion': {
    menuPath: 'Administración › Parámetros de calificación',
    pantallaEtiqueta: 'Parámetros de calificación e identificación',
    moduleDefault: 'admin',
    screenDefault: 'parametros-calificacion',
  },
  '/admin/calificacion-inherente': {
    menuPath: 'Administración › Calificación inherente',
    pantallaEtiqueta: 'Calificación inherente',
    moduleDefault: 'admin',
    screenDefault: 'calificacion-inherente',
  },
  '/admin-panel': {
    menuPath: 'Panel administrativo (`/admin-panel`)',
    pantallaEtiqueta: 'Panel admin',
    moduleDefault: 'admin',
    screenDefault: 'admin-panel',
  },
  [normalizePathname(ROUTES.MODO_GERENTE_GENERAL)]: {
    menuPath: '(Selección de modo — gerente general)',
    pantallaEtiqueta: 'Modo gerente general',
    moduleDefault: 'gerente',
    screenDefault: 'modo-selector',
  },
};

function slugDesdePath(pathNormalizado: string): string {
  const slug = pathNormalizado.replace(/^\//, '').replace(/\//g, '-') || 'inicio';
  return slug || 'inicio';
}

function pantallaAdministracion(pathNormalizado: string): string {
  if (pathNormalizado.includes('/usuarios')) return 'Usuarios';
  if (pathNormalizado.includes('/procesos')) return 'Definición de procesos';
  if (pathNormalizado.includes('/areas')) return 'Áreas';
  if (pathNormalizado.includes('/configuracion')) return 'Configuración';
  if (pathNormalizado.includes('/permisos')) return 'Permisos';
  if (pathNormalizado.includes('/asignaciones')) return 'Asignaciones';
  return 'Administración';
}

function pantallaAdminRaiz(pathNormalizado: string): string {
  if (pathNormalizado.includes('parametros-calificacion')) return 'Parámetros de calificación';
  if (pathNormalizado.includes('calificacion-inherente')) return 'Calificación inherente';
  if (pathNormalizado.includes('mapas')) return 'Mapas';
  if (pathNormalizado.includes('calificacion-residual')) return 'Calificación residual';
  if (pathNormalizado.includes('residual-estrategico')) return 'Residual estratégico';
  return 'Configuración admin';
}

/** Ubicación legible y defaults de módulo/pantalla para la URL actual. */
export function getCoraNavigationHints(pathname: string): CoraNavHints {
  const route = pathname || '/';
  const n = normalizePathname(route);

  const extra = METADATA_RUTA_EXTRA[n];
  if (extra) {
    return {
      route,
      menuPath: extra.menuPath,
      pantallaEtiqueta: extra.pantallaEtiqueta,
      moduleDefault: extra.moduleDefault,
      screenDefault: extra.screenDefault,
    };
  }

  const menuPath = MENU_PATH_POR_RUTA.get(n);
  if (menuPath) {
    const defs = DEFAULTS_POR_RUTA_MENU[n];
    const etiqueta =
      defs?.pantallaEtiqueta ?? menuPath.split('›').pop()?.trim() ?? n;
    return {
      route,
      menuPath,
      pantallaEtiqueta: etiqueta,
      moduleDefault: defs?.moduleDefault ?? 'app',
      screenDefault: defs?.screenDefault ?? slugDesdePath(n),
    };
  }

  if (n === '/' ) {
    return {
      route,
      menuPath: 'Inicio (redirección según rol)',
      pantallaEtiqueta: 'Inicio',
      moduleDefault: 'app',
      screenDefault: 'inicio',
    };
  }

  const baseFicha = normalizePathname(ROUTES.FICHA);
  if (n === baseFicha || n.startsWith(`${baseFicha}/`)) {
    const mp = MENU_PATH_POR_RUTA.get(baseFicha) ?? 'Procesos › Ficha del Proceso';
    return {
      route,
      menuPath: mp,
      pantallaEtiqueta: 'Ficha del proceso',
      moduleDefault: 'procesos',
      screenDefault: 'ficha',
    };
  }

  if (n.startsWith('/administracion')) {
    return {
      route,
      menuPath: 'Administración',
      pantallaEtiqueta: pantallaAdministracion(n),
      moduleDefault: 'admin',
      screenDefault: 'administracion',
    };
  }

  if (n.startsWith('/admin')) {
    return {
      route,
      menuPath: 'Administración › Configuración (`/admin/...`)',
      pantallaEtiqueta: pantallaAdminRaiz(n),
      moduleDefault: 'admin',
      screenDefault: 'admin-config',
    };
  }

  return {
    route,
    menuPath: null,
    pantallaEtiqueta: null,
    moduleDefault: 'app',
    screenDefault: 'general',
  };
}

/**
 * Combina el contexto que arma cada página con la ruta actual (menú lateral + URL).
 * Si no hay contexto de página (null), envía al menos ruta y equivalencia en menú.
 */
export function mergeCoraScreenContext(pathname: string, pageContext: ScreenContext | null): ScreenContext {
  const hints = getCoraNavigationHints(pathname);

  if (!pageContext) {
    return {
      module: hints.moduleDefault,
      screen: hints.screenDefault,
      action: 'view',
      route: hints.route,
      menuPath: hints.menuPath ?? undefined,
      pantallaEtiqueta: hints.pantallaEtiqueta ?? undefined,
    };
  }

  return {
    ...pageContext,
    route: hints.route,
    menuPath: hints.menuPath ?? pageContext.menuPath,
    pantallaEtiqueta: hints.pantallaEtiqueta ?? pageContext.pantallaEtiqueta,
  };
}
