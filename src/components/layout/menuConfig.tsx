/**
 * Configuración del menú lateral.
 * Centralizada para mantener una sola fuente de verdad y facilitar cambios.
 */

import React from 'react';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';

export const DRAWER_WIDTH = 280;
export const DRAWER_WIDTH_COLLAPSED = 70;

export interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItemType[];
}

/** Mapeo texto menú → clave en theme.palette.sidebar.mainMenu */
export const MAIN_MENU_KEYS: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Procesos': 'procesos',
  'Identificación y Calificación': 'identificacion',
  'Controles y Planes de Acción': 'controles',
  'Materializar Riesgos': 'materializarRiesgos',
  'Historial': 'historial',
};

export const DEFAULT_MENU_COLOR = '#1976d2';

export const menuItems: MenuItemType[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    children: [
      { text: 'Estadísticas', icon: <TrendingUpIcon />, path: ROUTES.DASHBOARD_SUPERVISOR },
      { text: 'Mapa de Riesgo', icon: <MapIcon />, path: ROUTES.MAPA },
    ],
  },
  {
    text: 'Procesos',
    icon: <AccountTreeIcon />,
    children: [
      { text: 'Ficha del Proceso', icon: <DescriptionIcon />, path: ROUTES.FICHA },
      { text: 'Análisis de Proceso', icon: <AccountTreeIcon />, path: ROUTES.ANALISIS_PROCESO },
      { text: 'Normatividad', icon: <DescriptionIcon />, path: ROUTES.NORMATIVIDAD },
      { text: 'Contexto Interno', icon: <BusinessIcon />, path: ROUTES.CONTEXTO_INTERNO },
      { text: 'Contexto Externo', icon: <PublicIcon />, path: ROUTES.CONTEXTO_EXTERNO },
      { text: 'DOFA', icon: <AnalyticsIcon />, path: ROUTES.DOFA },
    ],
  },
  { text: 'Identificación y Calificación', icon: <AssessmentIcon />, path: ROUTES.IDENTIFICACION },
  { text: 'Controles y Planes de Acción', icon: <SecurityIcon />, path: ROUTES.PLAN_ACCION },
  { text: 'Materializar Riesgos', icon: <WarningIcon />, path: ROUTES.INCIDENCIAS },
  { text: 'Historial', icon: <HistoryIcon />, path: ROUTES.HISTORIAL },
];
