/**
 * Main Layout Component
 * Sidebar Navigation + Top Bar
 */

import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
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
  Badge,
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
  Person as PersonIcon,
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
import PerfilDialog from '../profile/PerfilDialog';
import { useRiesgo } from "../../contexts/RiesgoContext";
import { useProceso } from "../../contexts/ProcesoContext";
import { useNotification } from "../../hooks/useNotification";
import { useAreasProcesosAsignados, useProcesosVisibles } from "../../hooks/useAsignaciones";
const VirtualAssistantDemo = lazy(() => import("../common/VirtualAssistantDemo"));
import NotificationsMenu from "../common/NotificationsMenu";
import AlertasNotificationsMenu from "../common/AlertasNotificationsMenu";
import { useAuditNotifications } from "../../hooks/useAuditNotifications";
import { useCalificacionInherenteConfig } from '../../hooks/useCalificacionInherenteConfig';
import { useObtenerAlertasQuery } from "../../api/services/planTrazabilidadApi";
import {
  DRAWER_WIDTH,
  DRAWER_WIDTH_COLLAPSED,
  menuItems,
  MAIN_MENU_KEYS,
  DEFAULT_MENU_COLOR,
  type MenuItemType,
} from './menuConfig';

export default function MainLayout() {
  // Inicializar cache de configuración de calificación inherente
  useCalificacionInherenteConfig();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getIconColor = (itemText: string) => {
    const key = MAIN_MENU_KEYS[itemText];
    const mainMenu = (theme.palette as any).sidebar?.mainMenu;
    return (mainMenu && key && mainMenu[key]) ? mainMenu[key] : DEFAULT_MENU_COLOR;
  };
  const getSubmenuColor = (childIndex: number) => {
    const submenu = (theme.palette as any).sidebar?.submenu;
    if (!submenu || !submenu.length) return DEFAULT_MENU_COLOR;
    return submenu[childIndex % submenu.length];
  };

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
    ambito,
    gerenteGeneralMode,
    setGerenteGeneralMode,
    esGerenteGeneral,
    esGerenteGeneralDirector,
    esGerenteGeneralProceso,
    managerMode,
    setManagerMode,
    esManager,
    esManagerDueño,
    esManagerSupervisor,
    refreshUser,
    isLoading,
  } = useAuth();
  const [modoGerenteDialogOpen, setModoGerenteDialogOpen] = useState(false);
  const [modoManagerDialogOpen, setModoManagerDialogOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [profileImgError, setProfileImgError] = useState(false);
  const [profilePhotoVersion, setProfilePhotoVersion] = useState(0);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [alertasAnchorEl, setAlertasAnchorEl] = useState<null | HTMLElement>(null);

  // Hook de notificaciones solo para administradores
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
  } = useAuditNotifications(esAdmin);

  // Hook de alertas de vencimiento para usuarios operativos (no admin)
  const { data: alertasData } = useObtenerAlertasQuery(
    { soloNoLeidas: true },
    { 
      skip: esAdmin || !user || isLoading, // Skip si es admin, no hay usuario, o está cargando
      pollingInterval: 60000 // Actualizar cada minuto
    }
  );
  const alertasNoLeidas = alertasData?.noLeidas || 0;

  useEffect(() => {
    setProfileImgError(false);
  }, [user?.id, user?.fotoPerfil]);

  // Obtener asignaciones del supervisor/dueño de procesos (misma lógica que el selector de proceso)
  const { areas: areasAsignadas, procesos: procesosAsignados, loading: loadingAsignaciones } = useAreasProcesosAsignados();
  const tieneAsignaciones = areasAsignadas.length > 0 || procesosAsignados.length > 0;

  // Cualquier usuario operativo (no admin, ámbito OPERATIVO) requiere asignaciones
  const esOperativoSinAdmin = !esAdmin && ambito === 'OPERATIVO';
  const debeBloquearPanelPorSinAsignaciones =
    esOperativoSinAdmin && !loadingAsignaciones && !tieneAsignaciones;

  // Función para obtener el nombre del rol en español
  const getNombreRol = (): string => {
    if (esAdmin) return 'Administrador';
    if (user?.role === 'gerente_general') {
      if (gerenteGeneralMode === 'director') return 'Gerente General (Director)';
      if (gerenteGeneralMode === 'proceso') return 'Gerente General (Proceso)';
      return 'Gerente General';
    }
    if (user?.role === 'manager') {
      if (managerMode === 'dueño') return 'Gerente (Dueño)';
      if (managerMode === 'supervisor') return 'Gerente (Supervisor)';
      return 'Gerente';
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

  useEffect(() => {
    if (esManager && !managerMode) {
      setModoManagerDialogOpen(true);
    } else {
      setModoManagerDialogOpen(false);
    }
  }, [esManager, managerMode]);
  const { procesosVisibles: procesosDisponibles } = useProcesosVisibles();
  const { showSuccess, showError } = useNotification();

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
      // CRÍTICO: Si estamos en la página de MAPA, usar window.location para forzar navegación
      if (location.pathname === ROUTES.MAPA) {
        window.location.href = path;
        return;
      }
      
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
                  // Sidebar colapsado: no expandir, solo abrir/cerrar submenú hacia abajo
                  // Si tiene path, navegar primero
                  if (item.path) {
                    handleMenuClick(item.path);
                  }
                  handleToggleMenu(item.text);
                }}
                sx={(theme) => {
                  const segColor = getIconColor(item.text);
                  const bgSelected = `${segColor}14`;
                  const bgHover = `${segColor}0a`;
                  return {
                    borderRadius: 1.5,
                    py: 1,
                    px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                    pl: sidebarCollapsed && !isMobile ? 1.5 : (2 + level * 1.5),
                    justifyContent: shouldShowText ? 'flex-start' : 'center',
                    backgroundColor: isDisabledParent ? 'rgba(0, 0, 0, 0.02)' : (isSelected ? bgSelected : 'transparent'),
                    borderLeft: isSelected ? `3px solid ${segColor}` : '3px solid transparent',
                    minHeight: 40,
                    opacity: isDisabledParent ? 0.3 : 1,
                    pointerEvents: isDisabledParent ? 'none' : 'auto',
                    '&:hover': {
                      backgroundColor: isDisabledParent ? 'rgba(0, 0, 0, 0.02)' : (isSelected ? bgHover : 'rgba(0, 0, 0, 0.04)'),
                    },
                    '&.Mui-disabled': {
                      cursor: 'not-allowed',
                    },
                  };
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed && !isMobile ? 24 : 36,
                    color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : getIconColor(item.text),
                    justifyContent: 'center',
                    fontSize: sidebarCollapsed && !isMobile ? '1.2rem' : '1.25rem',
                    pointerEvents: 'none', // CRÍTICO: Permitir que clicks pasen al botón padre
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
                        color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : (isSelected ? getIconColor(item.text) : 'rgba(0, 0, 0, 0.87)'),
                      }}
                      sx={{ pointerEvents: 'none' }} // CRÍTICO: Permitir que clicks pasen al botón padre
                    />
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      {isOpen ? <ExpandLess sx={{ fontSize: '1.2rem', color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : getIconColor(item.text) }} /> : <ExpandMore sx={{ fontSize: '1.2rem', color: isDisabledParent ? 'rgba(0, 0, 0, 0.2)' : getIconColor(item.text) }} />}
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
                ...(sidebarCollapsed && !isMobile && {
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: getIconColor(item.text),
                    opacity: 0.6,
                  },
                }),
              }}
            >
              <List component="div" disablePadding>
                {item.children?.map((child, childIndex) => {
                  const isChildActive = child.path ? (location.pathname === child.path || location.pathname === child.path.split('?')[0]) : false;

                  const isChildDisabled = false;
                  const subColor = getSubmenuColor(childIndex);

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
                                // No cerrar los menús al navegar: evita que el menú se encoja y vuelva a abrir
                              }
                            }}
                            sx={() => {
                              const segColor = subColor;
                              const bgSelected = `${segColor}1F`;
                              const bgHover = `${segColor}29`;
                              return {
                                borderRadius: 1,
                                py: 0.75,
                                px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                                pl: sidebarCollapsed && !isMobile ? 2.5 : (2 + (level + 1) * 1.5),
                                justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                                minHeight: 36,
                                position: 'relative',
                                opacity: isChildDisabled ? 0.3 : 1,
                                pointerEvents: isChildDisabled ? 'none' : 'auto',
                                backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : (isChildActive ? bgSelected : 'transparent'),
                                '&.Mui-selected': {
                                  backgroundColor: bgSelected,
                                  borderLeft: sidebarCollapsed ? 'none' : `3px solid ${segColor}`,
                                  '&:hover': {
                                    backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : bgHover,
                                  },
                                  '& .MuiListItemIcon-root': {
                                    color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : segColor,
                                  },
                                },
                                '&:hover': {
                                  backgroundColor: isChildDisabled ? 'rgba(0, 0, 0, 0.02)' : (isChildActive ? bgHover : 'rgba(0, 0, 0, 0.04)'),
                                },
                              };
                            }}
                          >
                            <ListItemIcon
                              sx={() => ({
                                minWidth: sidebarCollapsed && !isMobile ? 36 : 40,
                                color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : subColor,
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
                                sx={() => ({
                                  color: isChildDisabled ? 'rgba(0, 0, 0, 0.2)' : (isChildActive ? subColor : 'rgba(0, 0, 0, 0.87)'),
                                  pointerEvents: 'none', // CRÍTICO: Permitir que clicks pasen al botón padre
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
            sx={() => {
              const segColor = getIconColor(item.text);
              const bgSelected = `${segColor}14`;
              const bgHover = `${segColor}1F`;
              return {
                borderRadius: 1.5,
                py: 0.875,
                px: sidebarCollapsed && !isMobile ? 1.5 : 2,
                pl: sidebarCollapsed && !isMobile ? 1.5 : (2 + level * 1.5),
                justifyContent: shouldShowText ? 'flex-start' : 'center',
                opacity: isDisabled ? 0.5 : 1,
                minHeight: 36,
                '&.Mui-selected': {
                  backgroundColor: bgSelected,
                  borderLeft: `3px solid ${segColor}`,
                  '&:hover': { backgroundColor: bgHover },
                  '& .MuiListItemIcon-root': { color: segColor },
                  '& .MuiListItemText-primary': { fontWeight: 600, color: segColor },
                },
                '&:hover': {
                  backgroundColor: isDisabled ? 'transparent' : (isActive ? bgHover : 'rgba(0, 0, 0, 0.04)'),
                },
                '&.Mui-disabled': { cursor: 'not-allowed' },
              };
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: sidebarCollapsed ? 24 : 36,
                color: isDisabled ? 'rgba(0, 0, 0, 0.3)' : getIconColor(item.text),
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
                  color: isDisabled ? 'text.disabled' : (isActive ? getIconColor(item.text) : 'rgba(0, 0, 0, 0.87)'),
                }}
                sx={{ pointerEvents: 'none' }} // CRÍTICO: Permitir que clicks pasen al botón padre
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

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
    markAsRead(); // Marcar como leídas al abrir
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleAlertasOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAlertasAnchorEl(event.currentTarget);
  };

  const handleAlertasClose = () => {
    setAlertasAnchorEl(null);
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


  // Sidebar content (bloqueado si Dueño/Supervisor sin procesos asignados)
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {debeBloquearPanelPorSinAsignaciones ? (
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No tiene procesos asignados. Contacte al administrador.
          </Typography>
        </Box>
      ) : (
        <>
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

          {/* Navigation Menu: pt mayor para no solaparse con el botón desplegar/ocultar (móvil y web) */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1.5, pt: { xs: 5, sm: 6, md: 6 } }}>
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
                { text: 'Calificación Inherente', icon: <SettingsIcon />, path: '/admin/calificacion-inherente' },
                { text: 'Calificación Residual', icon: <SettingsIcon />, path: ROUTES.ADMIN_CALIFICACION_RESIDUAL },
                { text: 'Historial', icon: <HistoryIcon />, path: ROUTES.HISTORIAL },
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
                          color: getIconColor(item.text),
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
                            color: isActive ? getIconColor(item.text) : 'rgba(0, 0, 0, 0.87)',
                          }}
                          sx={{ pointerEvents: 'none' }} // CRÍTICO: Permitir que clicks pasen al botón padre
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
                  // Supervisor puede ver Dashboard, Procesos, Identificación y Calificación, Controles, Gestión de Planes, Materializar Riesgos, Historial
                  const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles y Planes de Acción', 'Gestión de Planes', 'Materializar Riesgos', 'Historial'];
                  return allowedMenus.includes(item.text);
                }
                if (esDueñoProcesos) {
                  // Dueño de Proceso puede ver Dashboard, Procesos, Identificación y Calificación, Controles, Materializar Riesgos, Historial
                  const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles y Planes de Acción', 'Materializar Riesgos', 'Historial'];
                  return allowedMenus.includes(item.text);
                }
                if (esGerenteGeneral && !gerenteGeneralMode) {
                  const allowedMenus = ['Dashboard', 'Procesos'];
                  return allowedMenus.includes(item.text);
                }
                if (esManager && !managerMode) {
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
        </>
      )}
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

      <Dialog open={modoManagerDialogOpen} maxWidth="xs" fullWidth>
        <DialogTitle>Selecciona tu perfil de acceso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Puedes entrar como Dueño del Proceso (gestionar procesos y riesgos asignados) o como Supervisor de Riesgos
            (revisar y validar procesos y riesgos).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={() => {
            setManagerMode('supervisor');
            setModoManagerDialogOpen(false);
            navigate(ROUTES.DASHBOARD_SUPERVISOR);
          }}>
            Entrar como Supervisor
          </Button>
          <Button variant="contained" onClick={() => {
            setManagerMode('dueño');
            setModoManagerDialogOpen(false);
            navigate(ROUTES.DASHBOARD);
          }}>
            Entrar como Dueño
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
            minHeight: { xs: 96, sm: 100, md: 70 },
            py: { xs: 1, md: 0 },
            px: 0,
            pl: { xs: 1.5, sm: 2 },
            pr: { xs: 1.5, sm: 2, md: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            flexWrap: 'wrap',
            gap: { xs: 0.75, sm: 1 },
            minWidth: 0,
            width: '100%',
          }}
        >
          {/* Móvil: 2 líneas. Línea 1: hamburger → logo → modo. Línea 2: lista proceso → perfil */}
          {isMobile ? (
            <>
              {/* Línea 1: Hamburguesa, Logo, Modo */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  gap: 1,
                  minHeight: 44,
                }}
              >
                <IconButton
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ color: 'rgba(0, 0, 0, 0.87)', flexShrink: 0 }}
                  aria-label="Abrir menú"
                >
                  <MenuIcon />
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: 0,
                    justifyContent: 'center',
                  }}
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                >
                  <Box
                    component="img"
                    src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
                    alt="COMWARE Logo"
                    sx={{
                      height: 32,
                      width: 'auto',
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                    }}
                  />
                </Box>
                {!esAdmin && !esSupervisorRiesgos && (!esGerenteGeneral || gerenteGeneralMode === 'proceso') && (
                  <FormControl size="small" sx={{ flexShrink: 0 }}>
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
                        height: 36,
                        minWidth: 100,
                        borderRadius: '18px',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        backgroundColor: modoProceso === 'editar' ? '#ff9800' : modoProceso === 'visualizar' ? '#2196f3' : '#f5f5f5',
                        color: !modoProceso ? '#666' : '#fff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-icon': { color: !modoProceso ? '#666' : '#fff' },
                      }}
                    >
                      <MenuItem value=""><em>Modo</em></MenuItem>
                      <MenuItem value="visualizar">Ver</MenuItem>
                      {(procesoSeleccionado?.estado !== 'aprobado' || esDueñoProcesos) && <MenuItem value="editar">Editar</MenuItem>}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {/* Línea 2: Lista de proceso + Perfil */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  width: '100%',
                  minWidth: 0,
                }}
              >
                {!esAdmin && !esSupervisorRiesgos && (!esGerenteGeneral || gerenteGeneralMode === 'proceso') && (
                  <Autocomplete
                    value={procesoSeleccionado || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setProcesoSeleccionado(newValue);
                        if (newValue.estado === 'aprobado') setModoProceso('visualizar');
                        else setModoProceso('editar');
                        showSuccess(`Proceso "${newValue.nombre}" seleccionado`);
                      } else {
                        setProcesoSeleccionado(null);
                        setModoProceso(null);
                      }
                    }}
                    options={procesosDisponibles}
                    getOptionDisabled={(option) => !option.activo}
                    getOptionLabel={(option) => option.nombre}
                    ListboxProps={{ style: { maxHeight: 'min(70vh, 400px)' }, sx: { py: 0 } }}
                    slotProps={{
                      paper: { sx: { maxHeight: 'min(70vh, 400px)', minWidth: 280, mt: 0.5 } },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Proceso..."
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          '& .MuiOutlinedInput-root': {
                            height: 38,
                            borderRadius: '19px',
                            backgroundColor: '#fff',
                            '& fieldset': { border: '1.5px solid #e0e0e0' },
                          },
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
                          <Chip label={option.activo ? 'Activo' : 'Inactivo'} size="small" color={option.activo ? 'success' : 'error'} sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                      </Box>
                    )}
                    noOptionsText="No hay procesos"
                  />
                )}
                <Box sx={{ flexGrow: 1, minWidth: 8 }} />
                {/* Notificaciones - Solo para administradores */}
                {esAdmin && (
                  <IconButton
                    onClick={handleNotificationsOpen}
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                    }}
                    aria-label="Notificaciones"
                  >
                    <Badge badgeContent={unreadCount} color="error" max={99}>
                      <NotificationsIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                    </Badge>
                  </IconButton>
                )}
                {/* Alertas de Vencimiento - Para usuarios operativos */}
                {!esAdmin && (
                  <IconButton
                    onClick={handleAlertasOpen}
                    sx={{
                      flexShrink: 0,
                      mr: 1,
                    }}
                    aria-label="Alertas de Vencimiento"
                  >
                    <Badge badgeContent={alertasNoLeidas} color="warning" max={99}>
                      <NotificationsIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                    </Badge>
                  </IconButton>
                )}
                {user && (
                  <IconButton
                    onClick={handleUserMenuOpen}
                    sx={{
                      flexShrink: 0,
                      p: 0,
                      width: 40,
                      height: 40,
                      '&:hover': { opacity: 0.9 },
                    }}
                    aria-label="Menú de usuario"
                  >
                    {(user.fotoPerfil && !profileImgError) ? (
                      <Avatar
                        src={`${user.fotoPerfil}${user.fotoPerfil.includes('?') ? '&' : '?'}v=${profilePhotoVersion}`}
                        onError={() => setProfileImgError(true)}
                        sx={{ width: 40, height: 40, border: '2px solid #1976d2', objectFit: 'cover' }}
                      >
                        {user.fullName?.charAt(0)}
                      </Avatar>
                    ) : (
                      <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                    )}
                  </IconButton>
                )}
              </Box>
            </>
          ) : (
            <>
              {/* Desktop: Logo a la izquierda */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  mr: 2,
                }}
                onClick={() => navigate(ROUTES.DASHBOARD)}
              >
                <Box
                  component="img"
                  src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
                  alt="COMWARE Logo"
                  sx={{
                    height: 45,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1.1rem' }}>
                  Gestión de Riesgos
                </Typography>
              </Box>

              {/* Selector de Proceso y Modo - Desktop */}
              {!esAdmin && !esSupervisorRiesgos && (!esGerenteGeneral || gerenteGeneralMode === 'proceso') && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2, flex: '0 0 auto', minWidth: 0, maxWidth: 400 }}>
                  <Autocomplete
                    value={procesoSeleccionado || null}
                    onChange={(_, newValue) => {
                      if (newValue) {
                        setProcesoSeleccionado(newValue);
                        if (newValue.estado === 'aprobado') setModoProceso('visualizar');
                        else setModoProceso('editar');
                        showSuccess(`Proceso "${newValue.nombre}" seleccionado`);
                      } else {
                        setProcesoSeleccionado(null);
                        setModoProceso(null);
                      }
                    }}
                    options={procesosDisponibles}
                    getOptionDisabled={(option) => !option.activo}
                    getOptionLabel={(option) => option.nombre}
                    ListboxProps={{ style: { maxHeight: 'min(70vh, 400px)' }, sx: { py: 0 } }}
                    slotProps={{
                      paper: { sx: { maxHeight: 'min(70vh, 400px)', minWidth: 280, mt: 0.5 } },
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Seleccionar Proceso..."
                        sx={{
                          width: '100%',
                          minWidth: 320,
                          '& .MuiOutlinedInput-root': {
                            height: 40,
                            backgroundColor: '#fff',
                            borderRadius: '20px',
                            pl: '12px !important',
                            pr: '40px !important',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            border: '1.5px solid',
                            borderColor: '#e0e0e0',
                            '& fieldset': { border: 'none' },
                            '&:hover': { borderColor: '#1976d2', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.12)' },
                            '&.Mui-focused': { borderColor: '#1976d2', boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)' },
                          },
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
                          <Chip label={option.activo ? 'Activo' : 'Inactivo'} size="small" color={option.activo ? 'success' : 'error'} sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                      </Box>
                    )}
                    noOptionsText="No hay procesos"
                  />
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
                        '&:hover': { filter: 'brightness(1.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
                      }}
                    >
                      <MenuItem value=""><em>Modo</em></MenuItem>
                      <MenuItem value="visualizar">Visualizar</MenuItem>
                      {(procesoSeleccionado?.estado !== 'aprobado' || esDueñoProcesos) && <MenuItem value="editar">Editar</MenuItem>}
                    </Select>
                  </FormControl>
                </Box>
              )}

              <Box sx={{ flexGrow: 1 }} />

              {/* Notificaciones - Solo para administradores */}
              {esAdmin && (
                <IconButton
                  onClick={handleNotificationsOpen}
                  sx={{
                    mr: 1,
                  }}
                  aria-label="Notificaciones"
                >
                  <Badge badgeContent={unreadCount} color="error" max={99}>
                    <NotificationsIcon sx={{ color: '#1976d2', fontSize: 26 }} />
                  </Badge>
                </IconButton>
              )}

              {/* Alertas de Vencimiento - Para usuarios operativos */}
              {!esAdmin && (
                <IconButton
                  onClick={handleAlertasOpen}
                  sx={{
                    mr: 1,
                  }}
                  aria-label="Alertas de Vencimiento"
                >
                  <Badge badgeContent={alertasNoLeidas} color="warning" max={99}>
                    <NotificationsIcon sx={{ color: '#ff9800', fontSize: 26 }} />
                  </Badge>
                </IconButton>
              )}

              {user && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mr: 2,
                    cursor: 'pointer',
                    p: 0.5,
                    px: 1,
                    borderRadius: '30px',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.03)' },
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
                    src={profileImgError ? undefined : (user.fotoPerfil ? `${user.fotoPerfil}${user.fotoPerfil.includes('?') ? '&' : '?'}v=${profilePhotoVersion}` : undefined)}
                    onError={() => setProfileImgError(true)}
                    sx={{
                      width: 38,
                      height: 38,
                      bgcolor: '#1976d2',
                      border: '2px solid #fff',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.2)',
                      objectFit: 'cover',
                    }}
                  >
                    {(!user.fotoPerfil || profileImgError) && user.fullName?.charAt(0)}
                  </Avatar>
                </Box>
              )}
            </>
          )}

          {/* User Dropdown Menu - solo se monta cuando hay ancla para evitar getBoundingClientRect(null) */}
          {anchorEl != null && (
          <Menu
            anchorEl={anchorEl}
            open
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
            <MenuItem
              key="ver-perfil"
              onClick={() => {
                handleUserMenuClose();
                setPerfilOpen(true);
              }}
              sx={{ py: 1.5, color: '#1976d2' }}
            >
              <PersonIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Ver perfil
            </MenuItem>
            {esGerenteGeneral && (
              <>
                <Divider />
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Cambiar modo
                  </Typography>
                </Box>
                <MenuItem
                  onClick={() => {
                    setGerenteGeneralMode('director');
                    handleUserMenuClose();
                    navigate(ROUTES.DASHBOARD_SUPERVISOR);
                  }}
                  sx={{ py: 1.25 }}
                >
                  <BarChartIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Usar como Supervisor
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setGerenteGeneralMode('proceso');
                    handleUserMenuClose();
                    navigate(ROUTES.PROCESOS);
                  }}
                  sx={{ py: 1.25 }}
                >
                  <AccountTreeIcon sx={{ mr: 1.5, fontSize: 20 }} />
                  Usar como Dueño de proceso
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem key="logout" onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
          )}

          <PerfilDialog
            open={perfilOpen}
            onClose={() => setPerfilOpen(false)}
            user={user}
            onSaved={(data) => {
              setProfileImgError(false);
              setProfilePhotoVersion((v) => v + 1);
              refreshUser(data ?? undefined);
            }}
          />

          {/* Menú de Notificaciones - Solo para administradores */}
          {esAdmin && (
            <NotificationsMenu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              notifications={notifications}
              onClear={clearNotifications}
            />
          )}

          {/* Menú de Alertas de Vencimiento - Para usuarios operativos */}
          {!esAdmin && (
            <AlertasNotificationsMenu
              anchorEl={alertasAnchorEl}
              open={Boolean(alertasAnchorEl)}
              onClose={handleAlertasClose}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Main Container - Contenedor principal con margen superior para AppBar fijo */}
      <Box
        sx={{
          display: 'flex',
          flexGrow: 1,
          minHeight: 0,
          mt: { xs: '96px', sm: '100px', md: '70px' }, // Margen superior para compensar AppBar fijo (móvil 2 líneas)
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
                top: { xs: 56, sm: 64, md: 70 },
                left: 0,
                height: { xs: 'calc(100vh - 56px)', sm: 'calc(100vh - 64px)', md: 'calc(100vh - 70px)' },
                overflowY: 'auto',
                zIndex: 1200,
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </Box>

        {/* Mobile Temporary Drawer: z-index alto para que no lo tape el contenido */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            zIndex: 1300,
            '& .MuiBackdrop-root': {
              top: { xs: 96, sm: 100 },
              zIndex: 1299,
            },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
              background: '#FFFFFF',
              top: { xs: 96, sm: 100 },
              height: { xs: 'calc(100vh - 96px)', sm: 'calc(100vh - 100px)' },
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              pt: 0.5,
              zIndex: 1300,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Main Content Container - en móvil z-index bajo para que el drawer quede encima */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { md: `calc(100% - ${sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH}px)` },
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            overflow: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: { xs: 0, md: 1 },
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
                minWidth: 0,
                p: { xs: 1.5, sm: 2, md: 3 },
                background: (theme) => theme.palette.background.default,
              }}
            >
              {/* Sin procesos asignados: mensaje único y no mostrar contenido */}
              {debeBloquearPanelPorSinAsignaciones ? (
                <Alert severity="warning" sx={{ maxWidth: 480 }}>
                  No tiene procesos asignados. Contacte al administrador para que le asigne procesos.
                </Alert>
              ) : (
                <>
                  {/* Mostrar alerta solo cuando SÍ hay asignaciones y aún no ha elegido proceso */}
                  {(esDueñoProcesos || esSupervisorRiesgos) && tieneAsignaciones && !procesoSeleccionado?.id &&
                   location.pathname !== ROUTES.DASHBOARD_SUPERVISOR &&
                   location.pathname !== ROUTES.MAPA && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Seleccione un proceso para habilitar el resto del menú.
                    </Alert>
                  )}
                  <Outlet />
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <Suspense fallback={null}>
        <VirtualAssistantDemo />
      </Suspense>
    </Box>
  );
}
