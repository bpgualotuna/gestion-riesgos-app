/**
 * Main Layout Component
 * Sidebar Navigation + Top Bar
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Divider,
  Drawer,
  useTheme,
  useMediaQuery,
  Typography,
  Tooltip,
  Menu,
  Select,
  FormControl,
  MenuItem,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Collapse,
} from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  Map as MapIcon,
  PriorityHigh as PriorityIcon,
  Description as DescriptionIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  BusinessCenter as BusinessCenterIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  Analytics as AnalyticsIcon,
  Help as HelpIcon,
  CompareArrows as CompareArrowsIcon,
  AccountTree as AccountTreeIcon,
  Settings as SettingsIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Assignment as AssignmentIcon,
  Task as TaskIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Functions as FunctionsIcon,
  ViewList as ViewListIcon,

  ExpandLess,
  ExpandMore,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  Label as LabelIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useRiesgo } from "../../contexts/RiesgoContext";
import { useProceso } from "../../contexts/ProcesoContext";
import { useGetProcesosQuery } from "../../api/services/riesgosApi";
import NotificacionesMenu from "../notificaciones/NotificacionesMenu";
import { useNotification } from "../../hooks/useNotification";
import { useAreasProcesosAsignados, esUsuarioResponsableProceso } from "../../hooks/useAsignaciones";


const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 70;

interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItemType[];
}

const menuItems: MenuItemType[] = [
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
      { text: 'Benchmarking', icon: <CompareArrowsIcon />, path: ROUTES.BENCHMARKING },
    ],
  },
  {
    text: 'Identificación y Calificación',
    icon: <AssessmentIcon />,
    path: ROUTES.IDENTIFICACION,
  },
  {
    text: 'Controles y Planes de Acción',
    icon: <SecurityIcon />,
    children: [
      { text: 'Controles y Planes de Acción', icon: <AssignmentIcon />, path: ROUTES.PLAN_ACCION },
    ],
  },
  {
    text: 'Eventos',
    icon: <EventIcon />,
    children: [
      { text: 'Materializar Riesgos', icon: <WarningIcon />, path: ROUTES.INCIDENCIAS },
    ],
  },
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [adminSection, setAdminSection] = useState<string>(() => {
    return localStorage.getItem('adminSection') || 'usuarios';
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Cerrar submenús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarCollapsed) {
        const target = event.target as HTMLElement;
        // Si el clic no es dentro del sidebar o del panel flotante, cerrar todos los submenús
        if (!target.closest('.MuiDrawer-root') && !target.closest('[data-submenu]')) {
          setOpenMenus({});
        }
      }
    };

    if (sidebarCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarCollapsed]); // Menú que está expandido temporalmente
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout,
    esAdmin,
    esDueñoProcesos,
    esSupervisorRiesgos,
    gerenteGeneralMode,
    setGerenteGeneralMode,
    esGerenteGeneral,
    esGerenteGeneralDirector,
    esGerenteGeneralProceso,
  } = useAuth();
  const [modoGerenteDialogOpen, setModoGerenteDialogOpen] = useState(false);

  // Obtener asignaciones del supervisor/dueño de procesos
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();
  const tieneAsignaciones = areasAsignadas.length > 0 || procesosAsignados.length > 0;

  // Función para obtener el nombre del rol en español
  const getNombreRol = (): string => {
    if (esAdmin) return 'Administrador';
    if (user?.role === 'gerente_general') {
      if (gerenteGeneralMode === 'director') return 'Gerente General (Director)';
      if (gerenteGeneralMode === 'proceso') return 'Gerente General (Proceso)';
      return 'Gerente General';
    }
    if (esDueñoProcesos) return 'Dueño del Proceso';
    if (esSupervisorRiesgos) return 'Supervisor de Riesgos';
    return user?.position || 'Usuario';
  };
  const { riesgoSeleccionado, modo, limpiar } = useRiesgo();
  const { procesoSeleccionado, modoProceso, setProcesoSeleccionado, setModoProceso } = useProceso();

  // Para director, siempre forzar modo visualización
  useEffect(() => {
    if (esSupervisorRiesgos && modoProceso !== 'visualizar') {
      setModoProceso('visualizar');
    }
  }, [esSupervisorRiesgos, modoProceso, setModoProceso]);

  useEffect(() => {
    if (esGerenteGeneral && !gerenteGeneralMode) {
      setModoGerenteDialogOpen(true);
    } else {
      setModoGerenteDialogOpen(false);
    }
  }, [esGerenteGeneral, gerenteGeneralMode]);
  const { data: procesos = [] } = useGetProcesosQuery();
  const { showSuccess, showError } = useNotification();

  // Filtrar procesos según el rol del usuario
  const procesosDisponibles = useMemo(() => {
    if (esAdmin) {
      return procesos;
    } else if (esSupervisorRiesgos && user && !esGerenteGeneral) {
      // Director solo ve procesos de sus áreas asignadas
      return procesos.filter((p) => p.directorId === user.id);
    } else if (esGerenteGeneralProceso) {
      // Gerente General Proceso ve procesos asignados desde AreasPage
      return procesos.filter((p) => procesosAsignados.includes(String(p.id)));
    } else if (user?.role === 'dueño_procesos') {
      // Dueño del proceso REAL solo ve sus procesos (considerando responsablesList)
      return procesos.filter((p) => esUsuarioResponsableProceso(p, user.id));
    }
    return procesos;
  }, [procesos, esAdmin, esSupervisorRiesgos, esGerenteGeneralProceso, procesosAsignados, esGerenteGeneral, user]);

  const handleSelectGerenteMode = (mode: 'director' | 'proceso') => {
    setGerenteGeneralMode(mode);
    setModoGerenteDialogOpen(false);
    if (mode === 'director') {
      navigate(ROUTES.DASHBOARD_SUPERVISOR);
    } else {
      navigate(ROUTES.PROCESOS);
    }
  };



  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    // Cerrar todos los submenús cuando se colapsa
    if (newState) {
      setOpenMenus({});
    }
  };

  const handleMenuClick = (path?: string) => {
    if (path) {
      navigate(path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const handleToggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => {
      const isCurrentlyOpen = prev[menuKey];
      // Si el menú está abierto, cerrarlo. Si está cerrado, cerrar todos los demás y abrir solo este
      if (isCurrentlyOpen) {
        // Cerrar este menú
        const newState = { ...prev };
        delete newState[menuKey];
        return newState;
      } else {
        // Cerrar todos los demás y abrir solo este
        return { [menuKey]: true };
      }
    });
  };

  // Abrir automáticamente los menús que tienen hijos activos
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(child => {
          if (child.path) {
            const basePath = child.path.split('?')[0];
            return location.pathname === basePath || location.pathname === child.path;
          }
          return false;
        });
        if (isChildActive && !openMenus[item.text]) {
          setOpenMenus((prev) => ({ ...prev, [item.text]: true }));
        }
      }
    });
  }, [location.pathname]);

  const renderMenuItem = (item: MenuItemType, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isChildActive = hasChildren && item.children?.some(child => {
      if (child.path) {
        // Manejar rutas con query params
        const basePath = child.path.split('?')[0];
        return location.pathname === basePath || location.pathname === child.path;
      }
      return false;
    });

    const isOpen = openMenus[item.text] || false;
    const isActive = item.path ? (location.pathname === item.path || location.pathname === item.path.split('?')[0]) : false;
    const isSelected = isActive || isChildActive;

    // Verificar si el item debe mostrarse según el rol
    if (esAdmin && item.path && item.path !== ROUTES.DASHBOARD && item.path !== ROUTES.ADMINISTRACION) {
      return null;
    }

    if (hasChildren) {
      const shouldShowText = !sidebarCollapsed || isMobile;

      const isDisabledParent = false;

      return (
        <Box key={item.text}>
          <Tooltip title={(!shouldShowText) ? item.text : ''} placement="right" arrow>
            <ListItem disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                disabled={isDisabledParent}
                onClick={(e) => {
                  if (isDisabledParent) return;
                  // If collapsed on desktop, expand first
                  if (sidebarCollapsed && !isMobile) {
                    setSidebarCollapsed(false);
                    localStorage.setItem('sidebarCollapsed', 'false');
                    // Continue to toggle menu
                  }

                  // Si tiene path, navegar primero
                  if (item.path) {
                    handleMenuClick(item.path);
                  }

                  // Luego abrir/cerrar el submenú
                  handleToggleMenu(item.text);
                }}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                  pl: sidebarCollapsed && !isMobile ? 1.5 : (2 + level * 1.5),
                  justifyContent: shouldShowText ? 'flex-start' : 'center',
                  backgroundColor: isDisabledParent ? 'rgba(0, 0, 0, 0.02)' : (isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent'),
                  borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                  minHeight: 40,
                  opacity: isDisabledParent ? 0.3 : 1,
                  pointerEvents: isDisabledParent ? 'none' : 'auto',
                  '&:hover': {
                    backgroundColor: isDisabledParent ? 'rgba(0, 0, 0, 0.02)' : (isSelected ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'),
                  },
                  '&.Mui-disabled': {
                    cursor: 'not-allowed',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed && !isMobile ? 24 : 36,
                    color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : (isSelected ? '#1976d2' : 'rgba(0, 0, 0, 0.7)'),
                    justifyContent: 'center',
                    fontSize: sidebarCollapsed && !isMobile ? '1.2rem' : '1.25rem',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {shouldShowText && (
                  <>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isSelected ? 600 : 500,
                        color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : (isSelected ? '#1976d2' : 'rgba(0, 0, 0, 0.87)'),
                      }}
                    />
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      {isOpen ? <ExpandLess sx={{ fontSize: '1.2rem', color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.54)' }} /> : <ExpandMore sx={{ fontSize: '1.2rem', color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.54)' }} />}
                    </Box>
                  </>
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box
              sx={{
                pl: sidebarCollapsed && !isMobile ? 1.5 : 2,
                pr: 1,
                position: 'relative',
                ...(sidebarCollapsed && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: (theme) => theme.palette.warning.main,
                    opacity: 0.5,
                  },
                }),
              }}
            >
              <List component="div" disablePadding>
                {item.children?.map((child) => {
                  const isChildActive = child.path ? (location.pathname === child.path || location.pathname === child.path.split('?')[0]) : false;

                  const isChildDisabled = false;

                  return (
                    <React.Fragment key={child.text}>
                      <Tooltip title={sidebarCollapsed ? child.text : ''} placement="right" arrow>
                        <ListItem disablePadding sx={{ mb: 0.25 }}>
                          <ListItemButton
                            selected={isChildActive}
                            disabled={isChildDisabled}
                            onClick={() => {
                              if (child.path && !isChildDisabled) {
                                handleMenuClick(child.path);
                                if (sidebarCollapsed) {
                                  setOpenMenus({}); // Cerrar el submenú al hacer clic en un elemento hijo
                                }
                              }
                            }}
                            sx={(theme) => ({
                              borderRadius: 1,
                              py: 0.75,
                              px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                              pl: sidebarCollapsed && !isMobile ? 2.5 : (2 + (level + 1) * 1.5),
                              justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                              minHeight: 36,
                              position: 'relative',
                              opacity: isChildDisabled ? 0.3 : 1,
                              pointerEvents: isChildDisabled ? 'none' : 'auto',
                              backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : (isChildActive ? theme.palette.warning.main + '1F' : 'transparent'),
                              '&.Mui-selected': {
                                backgroundColor: theme.palette.warning.main + '1F',
                                borderLeft: sidebarCollapsed ? 'none' : `3px solid ${theme.palette.warning.main}`,
                                '&:hover': {
                                  backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : theme.palette.warning.main + '29',
                                },
                                '& .MuiListItemIcon-root': {
                                  color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : theme.palette.warning.main,
                                },
                              },
                              '&:hover': {
                                backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : (isChildActive ? theme.palette.warning.main + '29' : theme.palette.action.hover),
                              },
                            })}
                          >
                            <ListItemIcon
                              sx={(theme) => ({
                                minWidth: sidebarCollapsed && !isMobile ? 36 : 40,
                                color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : (isChildActive ? theme.palette.warning.main : theme.palette.text.secondary),
                                justifyContent: 'center',
                                fontSize: '1.1rem',
                              })}
                            >
                              {child.icon}
                            </ListItemIcon>
                            {(!sidebarCollapsed || isMobile) && (
                              <ListItemText
                                primary={child.text}
                                primaryTypographyProps={{
                                  fontSize: '0.8125rem',
                                  fontWeight: isChildActive ? 600 : 400,
                                }}
                                sx={(theme) => ({
                                  color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : (isChildActive ? theme.palette.warning.main : theme.palette.text.primary),
                                })}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      </Tooltip>
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          </Collapse>
        </Box>
      );
    }

    const isDisabled = !item.path ? true : false;

    // Si es un item hijo, solo mostrar texto si el sidebar no está colapsado o es móvil
    const shouldShowText = !sidebarCollapsed || isMobile;

    return (
      <Tooltip key={item.text} title={(!shouldShowText) ? item.text : ''} placement="right" arrow>
        <ListItem disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            selected={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && handleMenuClick(item.path)}
            sx={{
              borderRadius: 1.5,
              py: 0.875,
              px: sidebarCollapsed && !isMobile ? 1.5 : 2,
              pl: sidebarCollapsed && !isMobile ? 1.5 : (2 + level * 1.5),
              justifyContent: shouldShowText ? 'flex-start' : 'center',
              opacity: isDisabled ? 0.5 : 1,
              minHeight: 36,
              '&.Mui-selected': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderLeft: '3px solid #1976d2',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
                '& .MuiListItemIcon-root': {
                  color: '#1976d2',
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: '#1976d2',
                },
              },
              '&:hover': {
                backgroundColor: isDisabled ? 'transparent' : (isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'),
              },
              '&.Mui-disabled': {
                cursor: 'not-allowed',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: sidebarCollapsed ? 24 : 36,
                color: isActive ? '#1976d2' : isDisabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                fontSize: sidebarCollapsed ? '1.1rem' : '1.2rem',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {shouldShowText && (
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isDisabled ? 'text.disabled' : (isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.87)'),
                }}
              />
            )}
          </ListItemButton>
        </ListItem>
      </Tooltip>
    );
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };

  // Escuchar cambios en la sección de admin
  useEffect(() => {
    const handleSectionChange = () => {
      const section = localStorage.getItem('adminSection') || 'usuarios';
      setAdminSection(section);
    };

    window.addEventListener('adminSectionChange', handleSectionChange);
    return () => {
      window.removeEventListener('adminSectionChange', handleSectionChange);
    };
  }, []);


  // Sidebar content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Botón para colapsar/expandir sidebar */}
      {/* Botón para colapsar/expandir sidebar - Solo desktop */}
      <IconButton
        onClick={handleSidebarCollapse}
        sx={{
          display: { xs: 'none', md: 'flex' }, // Ocultar en móvil
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          backgroundColor: 'background.paper',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        size="small"
      >
        {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </IconButton>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1.5, pt: 2 }}>
        <List sx={{ px: sidebarCollapsed ? 0.5 : 1 }}>
          {/* Si es admin, siempre mostrar opciones de admin en el sidebar (no Dashboard ni Ayuda) */}
          {esAdmin ? (
            <>
              <Typography variant="overline" sx={{ px: 2, py: 1, color: 'text.secondary', fontWeight: 600 }}>
                Administración
              </Typography>
              {[
                { text: 'Usuarios', icon: <PeopleIcon />, path: ROUTES.ADMIN_USUARIOS },
                { text: 'Procesos', icon: <AccountTreeIcon />, path: ROUTES.ADMIN_PROCESOS },
                { text: 'Áreas y Asignaciones', icon: <BusinessIcon />, path: ROUTES.ADMIN_AREAS },
                { text: 'Conf. Mapa Riesgos', icon: <MapIcon />, path: ROUTES.ADMIN_MAPA_CONFIG },
                { text: 'Parámetros de Calificación', icon: <SettingsIcon />, path: '/admin/parametros-calificacion' },
              ].map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleMenuClick(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        py: 0.875,
                        px: sidebarCollapsed ? 1.5 : 2,
                        minHeight: 36,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(25, 118, 210, 0.08)',
                          borderLeft: '3px solid #1976d2',
                          '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                          },
                          '& .MuiListItemIcon-root': {
                            color: '#1976d2',
                          },
                          '& .MuiListItemText-primary': {
                            fontWeight: 600,
                            color: '#1976d2',
                          },
                        },
                        '&:hover': {
                          backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: sidebarCollapsed ? 24 : 36,
                          color: isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.7)',
                          justifyContent: 'center',
                          fontSize: sidebarCollapsed ? '1.1rem' : '1.2rem',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!sidebarCollapsed && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.87)',
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </>
          ) : (
            menuItems
              .filter((item) => {
                // Filtrar items según el rol
                if (esSupervisorRiesgos) {
                  // Supervisor puede ver Dashboard, Procesos, Identificación y Calificación, Controles, Eventos
                  const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles y Planes de Acción', 'Eventos'];
                  return allowedMenus.includes(item.text);
                }
                if (esDueñoProcesos) {
                  // Dueño de Proceso puede ver Dashboard, Procesos, Identificación y Calificación, Controles, Eventos
                  const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles y Planes de Acción', 'Eventos'];
                  return allowedMenus.includes(item.text);
                }
                if (esGerenteGeneral && !gerenteGeneralMode) {
                  const allowedMenus = ['Dashboard', 'Procesos'];
                  return allowedMenus.includes(item.text);
                }
                return true;
              })
              .map((item) => (
                <React.Fragment key={item.text}>{renderMenuItem(item)}</React.Fragment>
              ))

          )}

        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Dialog open={modoGerenteDialogOpen} maxWidth="xs" fullWidth>
        <DialogTitle>Selecciona tu modo de acceso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Puedes entrar como Director (ver todo en modo visualización) o como Usuario de Proceso
            (editar y gestionar procesos asignados).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => handleSelectGerenteMode('director')}>
            Entrar como Director
          </Button>
          <Button variant="contained" onClick={() => handleSelectGerenteMode('proceso')}>
            Entrar como Usuario de Proceso
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top AppBar - Full Width - Fixed */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          width: '100%',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          top: 0,
          left: 0,
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 70 },
            px: 0,
            pl: 2,
            pr: { xs: 2, md: 3 },
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
          }}
        >
          {/* Logo COMWARE - Al borde izquierdo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, md: 2 },
              cursor: 'pointer',
              mr: { xs: 1, md: 2 },
            }}
            onClick={() => navigate(ROUTES.DASHBOARD)}
          >
            <Box
              component="img"
              src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
              alt="COMWARE Logo"
              sx={{
                height: { xs: 35, md: 45 },
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                display: { xs: 'none', md: 'block' },
                fontWeight: 700,
                color: '#1976d2',
                fontSize: '1.1rem',
              }}
            >
              Gestión de Riesgos
            </Typography>
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              display: { md: 'none' },
              mr: 2,
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Selector de Proceso y Modo - En AppBar (no mostrar para admin ni supervisor) */}
          {!esAdmin && !esSupervisorRiesgos && (!esGerenteGeneral || gerenteGeneralMode === 'proceso') && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mr: 2,
              }}
            >
              {/* Selector de Proceso */}
              <Autocomplete
                value={procesoSeleccionado || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setProcesoSeleccionado(newValue);
                    if (newValue.estado === 'aprobado') {
                      setModoProceso('visualizar');
                    } else {
                      setModoProceso('editar');
                    }
                    showSuccess(`Proceso "${newValue.nombre}" seleccionado`);
                  } else {
                    setProcesoSeleccionado(null);
                    setModoProceso(null);
                  }
                }}
                options={procesosDisponibles}
                getOptionDisabled={(option) => !option.activo}
                getOptionLabel={(option) => option.nombre}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Seleccionar Proceso..."
                    sx={{
                      width: 320,
                      '& .MuiOutlinedInput-root': {
                        height: 40,
                        backgroundColor: '#fff',
                        borderRadius: '20px',
                        pl: '12px !important',
                        pr: '40px !important',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        border: '1.5px solid',
                        borderColor: '#e0e0e0',
                        transition: 'all 0.2s',
                        '& fieldset': { border: 'none' },
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.12)',
                        },
                        '&.Mui-focused': {
                          borderColor: '#1976d2',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                        },
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                      <BusinessIcon sx={{ color: '#1976d2', fontSize: 20 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{option.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">{(option as any).area?.nombre || option.areaNombre || 'Sin área'}</Typography>
                      </Box>
                      <Chip
                        label={option.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={option.activo ? 'success' : 'error'}
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          opacity: option.activo ? 1 : 0.7
                        }}
                      />
                    </Box>
                  </Box>
                )}
                noOptionsText="No hay procesos"
              />

              {/* Selector de Modo */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small">
                  <Select
                    value={modoProceso || ''}
                    onChange={(e) => {
                      const nuevoModo = e.target.value as 'editar' | 'visualizar' | '';
                      if (procesoSeleccionado?.estado === 'aprobado' && nuevoModo === 'editar' && !esDueñoProcesos) {
                        showError('Los procesos aprobados solo pueden ser editados por el Dueño del Proceso');
                        return;
                      }
                      setModoProceso(nuevoModo === '' ? null : nuevoModo);
                    }}
                    displayEmpty
                    disabled={!procesoSeleccionado}
                    sx={{
                      height: 40,
                      minWidth: 140,
                      borderRadius: '20px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      backgroundColor: modoProceso === 'editar' ? '#ff9800' : modoProceso === 'visualizar' ? '#2196f3' : '#f5f5f5',
                      color: !modoProceso ? '#666' : '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      '& .MuiSelect-icon': { color: !modoProceso ? '#666' : '#fff' },
                      '&:hover': {
                        filter: 'brightness(1.05)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <MenuItem value=""><em>Modo</em></MenuItem>
                    <MenuItem value="visualizar">Visualizar</MenuItem>
                    {(procesoSeleccionado?.estado !== 'aprobado' || esDueñoProcesos) && <MenuItem value="editar">Editar</MenuItem>}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* Riesgo Seleccionado - Oculto del AppBar, solo se muestra en las páginas internas como Plan de Acción */}

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Notificaciones */}
          <NotificacionesMenu />

          {user && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                mr: 2,
                cursor: 'pointer',
                p: 0.5,
                px: 1,
                borderRadius: '30px',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.03)',
                }
              }}
              onClick={handleUserMenuOpen}
            >
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.1 }}>
                  {user.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {getNombreRol()}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: '#1976d2',
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                }}
              >
                {user.fullName.charAt(0)}
              </Avatar>
            </Box>
          )}

          {/* User Menu - Mobile */}
          {user && (
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.87)' }}>
                  {user.fullName}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(0, 0, 0, 0.60)' }}>
                  {getNombreRol()}
                </Typography>
              </Box>
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  background: '#F0F0F0',
                  border: '2px solid #1976d2',
                  width: 40,
                  height: 40,
                  boxShadow: '0 0 10px rgba(25, 118, 210, 0.2)',
                  '&:hover': {
                    background: '#E8E8E8',
                    boxShadow: '0 0 15px rgba(25, 118, 210, 0.4)',
                  },
                }}
              >
                <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 24 }} />
              </IconButton>
            </Box>
          )}

          {/* User Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 250,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {user?.email}
              </Typography>
              {esDueñoProcesos && (
                <Chip
                  label="Dueño del Proceso"
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              )}
              {esSupervisorRiesgos && (
                <Chip
                  label="Supervisor de Riesgos"
                  size="small"
                  color="info"
                  sx={{ mt: 1 }}
                />
              )}
              {esAdmin && (
                <Chip
                  label="Administrador"
                  size="small"
                  color="error"
                  sx={{ mt: 1 }}
                />
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                {user?.department}
              </Typography>
            </Box>
            <Divider />
            {esAdmin && (
              <MenuItem
                key="admin-panel"
                onClick={() => {
                  handleUserMenuClose();
                  navigate('/admin-panel');
                }}
                sx={{ py: 1.5, color: '#1976d2' }}
              >
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} />
                Panel Administrativo
              </MenuItem>
            )}
            {esAdmin && <Divider key="admin-divider" />}
            <MenuItem key="logout" onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Container - Contenedor principal con margen superior para AppBar fijo */}
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          minHeight: 0,
          mt: { xs: '64px', md: '70px' }, // Margen superior para compensar AppBar fijo
        }}
      >
        {/* Sidebar Container - Contenedor del sidebar */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            width: sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
            flexShrink: 0,
          }}
        >
          {/* Desktop Permanent Drawer - Fixed */}
          <Drawer
            variant="permanent"
            sx={{
              width: sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH,
                overflowX: 'hidden',
                boxSizing: 'border-box',
                borderRight: '1px solid',
                borderColor: 'divider',
                background: '#FFFFFF',
                position: 'fixed',
                top: { xs: 64, md: 70 },
                left: 0,
                height: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 70px)' },
                overflowY: 'auto',
                zIndex: 1200,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              background: '#FFFFFF',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main Content Container - Contenedor del contenido principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH}px)` },
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            overflow: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Content Wrapper - Contenedor interno para fácil configuración */}
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Page Content Container - Contenedor del contenido de la página */}
            <Box
              sx={{
                flexGrow: 1,
                p: { xs: 2, md: 3 },
                background: (theme) => theme.palette.background.default,
              }}
            >
              {/* Mostrar alerta solo si NO estamos en dashboard o mapa (tienen sus propios filtros) */}
              {esDueñoProcesos && tieneAsignaciones && !procesoSeleccionado?.id && 
               location.pathname !== ROUTES.DASHBOARD_SUPERVISOR && 
               location.pathname !== ROUTES.MAPA && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Seleccione un proceso para habilitar el resto del menú.
                </Alert>
              )}
              <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
