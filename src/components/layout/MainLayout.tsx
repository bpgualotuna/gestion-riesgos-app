/**
 * Main Layout Component
 * Sidebar Navigation + Top Bar
 */

import { useState, useEffect, useMemo, useRef } from 'react';
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
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Divider,
  Drawer,
  useTheme,
  useMediaQuery,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Autocomplete,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
} from '@mui/material';
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
  Send as SendIcon,
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
import { useRiesgo } from '../../shared/contexts/RiesgoContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useGetProcesosQuery } from '../../features/gestion-riesgos/api/riesgosApi';
import NotificacionesMenu from '../../features/gestion-riesgos/components/notificaciones/NotificacionesMenu';
import { useNotification } from '../../shared/hooks/useNotification';
import { useRevisionProceso } from '../../features/gestion-riesgos/hooks/useRevisionProceso';

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
      { text: 'Mapa de Riesgo', icon: <MapIcon />, path: ROUTES.MAPA },
      { text: 'Indicadores', icon: <BarChartIcon />, path: ROUTES.DASHBOARD },
      { text: 'Estadísticas', icon: <TrendingUpIcon />, path: ROUTES.DASHBOARD_SUPERVISOR },
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
    text: 'Controles',
    icon: <SecurityIcon />,
    children: [
  { text: 'Plan de Acción', icon: <AssignmentIcon />, path: ROUTES.PLAN_ACCION },
      { text: 'Clasificación', icon: <LabelIcon />, path: ROUTES.PRIORIZACION },
    ],
  },
  {
    text: 'Eventos',
    icon: <EventIcon />,
    children: [
      { text: 'Materializar Riesgos', icon: <WarningIcon />, path: ROUTES.INCIDENCIAS },
    ],
  },
  {
    text: 'Indicadores',
    icon: <BarChartIcon />,
    children: [
      { text: 'Resumen de Riesgos', icon: <AssessmentIcon />, path: ROUTES.RESUMEN_RIESGOS },
      { text: 'Riesgos por Proceso', icon: <BusinessCenterIcon />, path: ROUTES.RIESGOS_POR_PROCESO },
      { text: 'Riesgos por Tipología', icon: <CategoryIcon />, path: ROUTES.RIESGOS_POR_TIPOLOGIA },
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
  const { user, logout, esAdmin, esDueñoProcesos, esSupervisorRiesgos } = useAuth();

  // Función para obtener el nombre del rol en español
  const getNombreRol = (): string => {
    if (esAdmin) return 'Administrador';
    if (esDueñoProcesos) return 'Dueño del Proceso';
    if (esSupervisorRiesgos) return 'Supervisor de Riesgos';
    if (user?.role === 'manager') return 'Gerente';
    if (user?.role === 'analyst') return 'Analista';
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
  const { data: procesos = [] } = useGetProcesosQuery();
  const { showSuccess, showError } = useNotification();
  const { enviarARevision } = useRevisionProceso();

  // Filtrar procesos según el rol del usuario
  const procesosDisponibles = useMemo(() => {
    if (esAdmin) {
      return procesos;
    } else if (esSupervisorRiesgos && user) {
      // Director solo ve procesos de sus áreas asignadas
      return procesos.filter((p) => p.directorId === user.id);
    } else if (esDueñoProcesos && user) {
      // Dueño del proceso solo ve sus procesos
      return procesos.filter((p) => p.responsableId === user.id);
    }
    return procesos;
  }, [procesos, esAdmin, esSupervisorRiesgos, esDueñoProcesos, user]);

  // Estados para diálogo de enviar a revisión
  const [openEnviarRevisionDialog, setOpenEnviarRevisionDialog] = useState(false);
  const [selectedGerenteId, setSelectedGerenteId] = useState<string>('');
  const [selectedGerenteNombre, setSelectedGerenteNombre] = useState<string>('');

  // Obtener gerentes disponibles
  const gerentesDisponibles = useMemo(() => {
    return procesos
      .filter(p => p.gerenteId && p.gerenteNombre)
      .map(p => ({ id: p.gerenteId!, nombre: p.gerenteNombre! }))
      .filter((gerente, index, self) => 
        index === self.findIndex(g => g.id === gerente.id)
      );
  }, [procesos]);

  const handleEnviarARevision = () => {
    if (!procesoSeleccionado) {
      showError('Debe seleccionar un proceso');
      return;
    }
    if (procesoSeleccionado.estado === 'aprobado') {
      showError('No se puede enviar a revisión un proceso ya aprobado');
      return;
    }
    if (procesoSeleccionado.estado === 'en_revision') {
      showError('El proceso ya está en revisión');
      return;
    }
    setOpenEnviarRevisionDialog(true);
  };

  const handleConfirmarEnviarARevision = async () => {
    if (!procesoSeleccionado || !selectedGerenteId || !selectedGerenteNombre) {
      showError('Debe seleccionar un gerente');
      return;
    }
    try {
      const procesoActualizado = await enviarARevision(
        procesoSeleccionado,
        selectedGerenteId,
        selectedGerenteNombre
      );
      if (procesoActualizado) {
        setProcesoSeleccionado(procesoActualizado);
        showSuccess('Proceso enviado a revisión exitosamente');
        setOpenEnviarRevisionDialog(false);
        setSelectedGerenteId('');
        setSelectedGerenteNombre('');
      }
    } catch (error) {
      showError('Error al enviar el proceso a revisión');
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
      const shouldShowText = !sidebarCollapsed;
      
      return (
        <Box key={item.text}>
          <Tooltip title={sidebarCollapsed ? item.text : ''} placement="right" arrow>
            <ListItem disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={(e) => {
                  // Si tiene path, navegar primero
                  if (item.path) {
                    handleMenuClick(item.path);
                  } else if (item.children && item.children.length > 0) {
                    // Si no tiene path pero tiene hijos, navegar al primer hijo que tenga path
                    const firstChildWithPath = item.children.find(child => child.path);
                    if (firstChildWithPath && firstChildWithPath.path) {
                      handleMenuClick(firstChildWithPath.path);
                    }
                  }
                  // Luego abrir/cerrar el submenú
                  handleToggleMenu(item.text);
                }}
                sx={{
                  borderRadius: 1.5,
                  py: 1,
                  px: sidebarCollapsed ? 1.5 : 2,
                  pl: sidebarCollapsed ? 1.5 : (2 + level * 1.5),
                  justifyContent: shouldShowText ? 'flex-start' : 'center',
                  backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent',
                  minHeight: 40,
                  '&:hover': {
                    backgroundColor: isSelected ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: sidebarCollapsed ? 24 : 36,
                    color: isSelected ? '#1976d2' : 'rgba(0, 0, 0, 0.7)',
                    justifyContent: 'center',
                    fontSize: sidebarCollapsed ? '1.2rem' : '1.25rem',
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
                        color: isSelected ? '#1976d2' : 'rgba(0, 0, 0, 0.87)',
                      }}
                    />
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      {isOpen ? <ExpandLess sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.54)' }} /> : <ExpandMore sx={{ fontSize: '1.2rem', color: 'rgba(0, 0, 0, 0.54)' }} />}
                    </Box>
                  </>
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          {isOpen && (
            <Box 
              sx={{ 
                pl: sidebarCollapsed ? 1.5 : 2, 
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
                  return (
                    <Tooltip key={child.text} title={sidebarCollapsed ? child.text : ''} placement="right" arrow>
                      <ListItem disablePadding sx={{ mb: 0.25 }}>
                        <ListItemButton
                          selected={isChildActive}
                          onClick={() => {
                            if (child.path) {
                              handleMenuClick(child.path);
                              if (sidebarCollapsed) {
                                setOpenMenus({}); // Cerrar el submenú al hacer clic en un elemento hijo
                              }
                            }
                          }}
                          sx={(theme) => ({
                            borderRadius: 1,
                            py: 0.75,
                            px: sidebarCollapsed ? 1.5 : 2,
                            pl: sidebarCollapsed ? 2.5 : (2 + (level + 1) * 1.5),
                            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            minHeight: 36,
                            position: 'relative',
                            backgroundColor: isChildActive ? theme.palette.warning.main + '1F' : 'transparent',
                            '&.Mui-selected': {
                              backgroundColor: theme.palette.warning.main + '1F',
                              borderLeft: sidebarCollapsed ? 'none' : `3px solid ${theme.palette.warning.main}`,
                              '&:hover': {
                                backgroundColor: theme.palette.warning.main + '29',
                              },
                              '& .MuiListItemIcon-root': {
                                color: theme.palette.warning.main,
                              },
                            },
                            '&:hover': {
                              backgroundColor: isChildActive ? theme.palette.warning.main + '29' : theme.palette.action.hover,
                            },
                          })}
                        >
                          <ListItemIcon
                            sx={(theme) => ({
                              minWidth: sidebarCollapsed ? 36 : 40,
                              color: isChildActive ? theme.palette.warning.main : theme.palette.text.secondary,
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                            })}
                          >
                            {child.icon}
                          </ListItemIcon>
                          {!sidebarCollapsed && (
                            <ListItemText
                              primary={child.text}
                              primaryTypographyProps={{
                                fontSize: '0.8125rem',
                                fontWeight: isChildActive ? 600 : 400,
                              }}
                              sx={(theme) => ({
                                color: isChildActive ? theme.palette.warning.main : theme.palette.text.primary,
                              })}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    </Tooltip>
                  );
                })}
              </List>
            </Box>
          )}
        </Box>
      );
    }

    const isDisabled = !item.path || (!item.path.includes(ROUTES.DASHBOARD) && !procesoSeleccionado);

    // Si es un item hijo, solo mostrar texto si el sidebar no está colapsado
    const shouldShowText = !sidebarCollapsed;
    
    return (
      <Tooltip title={sidebarCollapsed ? item.text : ''} placement="right" arrow>
        <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
          <ListItemButton
            selected={isActive}
            disabled={isDisabled}
            onClick={() => !isDisabled && handleMenuClick(item.path)}
            sx={{
              borderRadius: 1.5,
              py: 0.875,
              px: sidebarCollapsed ? 1.5 : 2,
              pl: sidebarCollapsed ? 1.5 : (2 + level * 1.5),
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
      <IconButton
        onClick={handleSidebarCollapse}
        sx={{
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
                { text: 'Usuarios', icon: <PeopleIcon />, section: 'usuarios' },
                { text: 'Roles y Permisos', icon: <SecurityIcon />, section: 'roles' },
                { text: 'Áreas y Gerentes', icon: <BusinessCenterIcon />, section: 'areas-gerentes' },
                { text: 'Asignaciones', icon: <AssignmentIcon />, section: 'asignaciones' },
                { text: 'Pasos del Proceso', icon: <ViewListIcon />, section: 'pasos-proceso' },
                { text: 'Encuestas', icon: <DescriptionIcon />, section: 'encuestas' },
                { text: 'Listas de Valores', icon: <ViewListIcon />, section: 'listas-valores' },
                { text: 'Parámetros', icon: <SettingsIcon />, section: 'parametros' },
                { text: 'Tipologías', icon: <CategoryIcon />, section: 'tipologias' },
                { text: 'Fórmulas', icon: <FunctionsIcon />, section: 'formulas' },
                { text: 'Config. Tareas', icon: <TaskIcon />, section: 'tareas' },
                { text: 'Config. Notificaciones', icon: <NotificationsIcon />, section: 'notificaciones' },
                { text: 'Config. Sistema', icon: <SettingsIcon />, section: 'config-sistema' },
              ].map((item) => {
                const isActive = adminSection === item.section;
            return (
                  <ListItem key={item.section} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  selected={isActive}
                      onClick={() => {
                        localStorage.setItem('adminSection', item.section);
                        setAdminSection(item.section);
                        window.dispatchEvent(new Event('adminSectionChange'));
                        // Navegar a administración si no está ahí
                        if (location.pathname !== ROUTES.ADMINISTRACION) {
                          navigate(ROUTES.ADMINISTRACION);
                        }
                      }}
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
                  // Supervisor puede ver Dashboard, Procesos, Identificación y Calificación, Controles, Eventos, Indicadores
                  const allowedMenus = ['Dashboard', 'Procesos', 'Identificación y Calificación', 'Controles', 'Eventos', 'Indicadores'];
                  return allowedMenus.includes(item.text);
                }
                return true;
              })
              .map((item) => renderMenuItem(item))
          )}
          
          {/* Menú de Administración (solo para admin, cuando NO está en la página de administración) */}
          {esAdmin && location.pathname !== ROUTES.ADMINISTRACION && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={location.pathname === ROUTES.ADMINISTRACION}
                  onClick={() => handleMenuClick(ROUTES.ADMINISTRACION)}
                  sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      borderLeft: '4px solid #1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.15)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#1976d2',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemIcon
        sx={{
                      minWidth: 40,
                      color: location.pathname === ROUTES.ADMINISTRACION ? '#1976d2' : 'rgba(0, 0, 0, 0.6)',
        }}
      >
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Administración"
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: location.pathname === ROUTES.ADMINISTRACION ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}
          
          {/* Menú de Supervisión (solo para director de procesos) */}
          {esSupervisorRiesgos && (
            <>
              <Divider sx={{ my: 2, mx: 2 }} />
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={location.pathname === ROUTES.SUPERVISION}
                  onClick={() => handleMenuClick(ROUTES.SUPERVISION)}
            sx={{
                    borderRadius: 2,
                    py: 1.25,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      borderLeft: '4px solid #1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.15)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#1976d2',
                      },
                    },
              '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
                  <ListItemIcon
              sx={{
                      minWidth: 40,
                      color: location.pathname === ROUTES.SUPERVISION ? '#1976d2' : 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <SupervisorAccountIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Supervisión"
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: location.pathname === ROUTES.SUPERVISION ? 600 : 400,
              }}
                  />
                </ListItemButton>
              </ListItem>
            </>
          )}

        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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

            {/* Selector de Proceso y Modo - En AppBar (no mostrar para admin ni director) */}
            {procesoSeleccionado && !esAdmin && !esSupervisorRiesgos && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mr: 2,
                  flexWrap: 'wrap',
                }}
              >
                {/* Selector de Proceso */}
                <Autocomplete
                  value={procesoSeleccionado}
                  onChange={(_, newValue) => {
                    if (newValue) {
                      setProcesoSeleccionado(newValue);
                      // Si el proceso está aprobado, forzar modo visualización
                      if (newValue.estado === 'aprobado') {
                        setModoProceso('visualizar');
                      }
                      showSuccess(`Proceso "${newValue.nombre}" seleccionado`);
                    }
                  }}
                  options={procesosDisponibles}
                  getOptionLabel={(option) => option.nombre}
                  filterOptions={(options, { inputValue }) => {
                    return options.filter((option) =>
                      option.nombre.toLowerCase().includes(inputValue.toLowerCase()) ||
                      (option.areaNombre && option.areaNombre.toLowerCase().includes(inputValue.toLowerCase())) ||
                      (option.descripcion && option.descripcion.toLowerCase().includes(inputValue.toLowerCase()))
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      placeholder="Buscar proceso..."
                      sx={{
                        minWidth: 250,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: modoProceso === 'editar' ? '#ff9800' : modoProceso === 'visualizar' ? '#2196f3' : '#1976d2',
                          color: '#fff',
                          '& fieldset': {
                            borderColor: 'transparent',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#fff',
                          },
                          '& input': {
                            color: '#fff',
                            '&::placeholder': {
                              color: 'rgba(255, 255, 255, 0.7)',
                            },
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(255, 255, 255, 0.7)',
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#fff',
                        },
                        '& .MuiAutocomplete-endAdornment': {
                          '& .MuiIconButton-root': {
                            color: '#fff',
                          },
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const getEstadoColor = (estado?: string) => {
                      switch (estado) {
                        case 'aprobado': return '#4caf50';
                        case 'en_revision': return '#ff9800';
                        case 'con_observaciones': return '#f44336';
                        default: return '#9e9e9e';
                      }
                    };
                    const getEstadoLabel = (estado?: string) => {
                      switch (estado) {
                        case 'aprobado': return 'Aprobado';
                        case 'en_revision': return 'En Revisión';
                        case 'con_observaciones': return 'Con Observaciones';
                        default: return 'Borrador';
                      }
                    };
                    return (
                      <Box component="li" {...props} sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                          <BusinessCenterIcon sx={{ fontSize: 24, color: '#1976d2', mt: 0.5 }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                              {option.nombre}
                            </Typography>
                            {option.areaNombre && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                                Área: {option.areaNombre}
                              </Typography>
                            )}
                            {option.descripcion && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0.5
                              }}>
                                {option.descripcion}
                              </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={getEstadoLabel(option.estado)}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.65rem',
                                  backgroundColor: getEstadoColor(option.estado),
                                  color: '#fff',
                                  fontWeight: 600,
                                }}
                              />
                              {option.responsableNombre && (
                                <Typography variant="caption" color="text.secondary">
                                  Responsable: {option.responsableNombre}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    );
                  }}
                  sx={{ minWidth: 250 }}
                  noOptionsText="No se encontraron procesos"
                  loadingText="Cargando procesos..."
                />

                {/* Selector de Modo */}
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select
                    value={modoProceso || ''}
                    onChange={(e) => {
                      const nuevoModo = e.target.value as 'editar' | 'visualizar' | '';
                      // Si el proceso está aprobado, solo permitir visualizar
                      if (procesoSeleccionado?.estado === 'aprobado' && nuevoModo === 'editar') {
                        showError('Los procesos aprobados no se pueden editar');
                        return;
                      }
                      if (nuevoModo === '') {
                        setModoProceso(null);
                      } else {
                        setModoProceso(nuevoModo);
                        showSuccess(`Modo cambiado a ${nuevoModo === 'editar' ? 'Edición' : 'Visualización'}`);
                      }
                    }}
                    displayEmpty
                    disabled={procesoSeleccionado?.estado === 'aprobado'}
                    sx={{
                      backgroundColor: procesoSeleccionado?.estado === 'aprobado' 
                        ? '#4caf50' 
                        : modoProceso === 'editar' 
                        ? '#ff9800' 
                        : modoProceso === 'visualizar' 
                        ? '#2196f3' 
                        : '#1976d2',
                      color: '#fff',
                      fontWeight: 600,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'transparent',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#fff',
                      },
                      '& .MuiSelect-icon': {
                        color: '#fff',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Sin modo</em>
                    </MenuItem>
                    <MenuItem value="visualizar">Visualización</MenuItem>
                    {procesoSeleccionado?.estado !== 'aprobado' && (
                      <MenuItem value="editar">Edición</MenuItem>
                    )}
                  </Select>
                  {procesoSeleccionado?.estado === 'aprobado' && (
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#fff', fontSize: '0.65rem', textAlign: 'center' }}>
                      Solo lectura
                    </Typography>
                  )}
                </FormControl>
              </Box>
            )}

            {/* Para director: solo mostrar chip de "Visualización" */}
            {esSupervisorRiesgos && (
              <Chip
                label="Visualización"
                size="small"
                sx={{
                  mr: 2,
                  height: 32,
                  fontWeight: 600,
                  backgroundColor: '#2196f3',
                  color: '#fff',
                  '& .MuiChip-label': {
                    px: 2,
                  },
                }}
              />
            )}

            {/* Botón "Enviar a Revisión" - Solo para dueño del proceso en modo visualización */}
            {esDueñoProcesos && procesoSeleccionado && modoProceso === 'visualizar' && 
             (procesoSeleccionado.estado === 'borrador' || procesoSeleccionado.estado === 'con_observaciones') && (
              <Box sx={{ mr: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleEnviarARevision}
                  sx={{
                    background: '#C8D900',
                    color: '#000',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    textTransform: 'none',
                    '&:hover': {
                      background: '#B8C800',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(200, 217, 0, 0.4)',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  Enviar a Revisión
                </Button>
              </Box>
            )}

            {/* Riesgo Seleccionado - Oculto del AppBar, solo se muestra en las páginas internas como Plan de Acción */}

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Notificaciones */}
            <NotificacionesMenu />

            {/* User Info - Desktop - Siempre visible */}
            {user && (
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.5,
                  mr: 2,
              }}
            >
              <Box sx={{ textAlign: 'right' }}>
                  <Typography 
                    variant="body2" 
                    fontWeight={600} 
                    sx={{ 
                      color: 'rgba(0, 0, 0, 0.87)',
                      lineHeight: 1.2,
                    }}
                  >
                    {user.fullName}
                </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'rgba(0, 0, 0, 0.60)',
                      display: 'block',
                      lineHeight: 1.2,
                    }}
                  >
                    {getNombreRol()}
                </Typography>
              </Box>
                <Tooltip title={`${user.fullName} - ${getNombreRol()}`}>
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{
                    background: '#F0F0F0',
                    border: '2px solid #1976d2',
                    width: 44,
                    height: 44,
                      boxShadow: '0 0 10px rgba(25, 118, 210, 0.2)',
                    '&:hover': {
                      background: '#E8E8E8',
                        boxShadow: '0 0 15px rgba(25, 118, 210, 0.4)',
                    },
                  }}
                >
                  <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 26 }} />
                </IconButton>
              </Tooltip>
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
              <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
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
            background: '#E8E8E8',
          }}
        >
          <Outlet />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
