/**
 * Main Layout Component
 * Sidebar Navigation + Top Bar
 */

import { useState } from 'react';
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
  Analytics as AnalyticsIcon,
  Help as HelpIcon,
  CompareArrows as CompareArrowsIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 280;

interface MenuItemType {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const menuItems: MenuItemType[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: ROUTES.DASHBOARD },
  { text: 'Ficha del Proceso', icon: <DescriptionIcon />, path: ROUTES.FICHA },
  { text: 'Análisis de Proceso', icon: <AccountTreeIcon />, path: ROUTES.ANALISIS_PROCESO },
  { text: 'Normatividad', icon: <DescriptionIcon />, path: ROUTES.NORMATIVIDAD },
  { text: 'Contexto Externo', icon: <PublicIcon />, path: ROUTES.CONTEXTO_EXTERNO },
  { text: 'Contexto Interno', icon: <BusinessIcon />, path: ROUTES.CONTEXTO_INTERNO },
  { text: 'DOFA', icon: <AnalyticsIcon />, path: ROUTES.DOFA },
  { text: 'Benchmarking', icon: <CompareArrowsIcon />, path: ROUTES.BENCHMARKING },
  { text: 'Identificación', icon: <SearchIcon />, path: ROUTES.IDENTIFICACION },
  { text: 'Evaluación', icon: <AssessmentIcon />, path: ROUTES.EVALUACION },
  { text: 'Mapa de Riesgos', icon: <MapIcon />, path: ROUTES.MAPA },
  { text: 'Priorización', icon: <PriorityIcon />, path: ROUTES.PRIORIZACION },
  { text: 'Ayuda', icon: <HelpIcon />, path: ROUTES.AYUDA },
];

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
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

  // Sidebar content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section - Large and Modern */}
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F5F5',
          borderBottom: '2px solid #1976d2',
        }}
      >
        <Box
          component="img"
          src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
          alt="COMWARE Logo"
          sx={{
            width: '100%',
            maxWidth: { xs: 180, md: 220 },
            height: 'auto',
            objectFit: 'contain',
            mb: 1,
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#1976d2',
            fontSize: { xs: '1rem', md: '1.1rem' },
            mt: 0.5,
          }}
        >
          Gestión de Riesgos
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 2 }}>
        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleMenuClick(item.path)}
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
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
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
                      color: isActive ? '#1976d2' : 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* User Section at Bottom */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          background: 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={handleUserMenuOpen}
            sx={{
              background: '#F0F0F0',
              border: '2px solid #C8D900',
              width: 40,
              height: 40,
              boxShadow: '0 0 10px rgba(200, 217, 0, 0.2)',
              '&:hover': {
                background: '#E8E8E8',
                boxShadow: '0 0 15px rgba(200, 217, 0, 0.4)',
              },
            }}
          >
                <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 24 }} />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName || 'Usuario'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(0, 0, 0, 0.60)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user?.position || 'Cargo'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
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

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: '#FFFFFF',
            borderBottom: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, px: { xs: 2, md: 3 } }}>
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

            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />

            {/* User Menu - Desktop */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(0, 0, 0, 0.87)' }}>
                  {user?.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.60)' }}>
                  {user?.position}
                </Typography>
              </Box>
              <Tooltip title="Perfil de usuario">
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{
                    background: '#F0F0F0',
                    border: '2px solid #1976d2',
                    width: 44,
                    height: 44,
                    boxShadow: '0 0 10px rgba(200, 217, 0, 0.2)',
                    '&:hover': {
                      background: '#E8E8E8',
                      boxShadow: '0 0 15px rgba(200, 217, 0, 0.4)',
                    },
                  }}
                >
                  <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 26 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {/* User Menu - Mobile */}
            <IconButton
              onClick={handleUserMenuOpen}
              sx={{
                display: { xs: 'flex', md: 'none' },
                background: '#F0F0F0',
                border: '2px solid #C8D900',
                width: 40,
                height: 40,
                boxShadow: '0 0 10px rgba(200, 217, 0, 0.2)',
                '&:hover': {
                  background: '#E8E8E8',
                  boxShadow: '0 0 15px rgba(200, 217, 0, 0.4)',
                },
              }}
            >
                <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 24 }} />
            </IconButton>

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

        {/* Page Content */}
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
  );
}
