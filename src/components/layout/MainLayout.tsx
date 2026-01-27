/**
 * Main Layout Component
 * Top Navbar + Content
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Divider,
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
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
}

const menuItems: MenuItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: ROUTES.DASHBOARD },
  { text: 'Identificación', icon: <SearchIcon />, path: ROUTES.IDENTIFICACION },
  { text: 'Evaluación', icon: <AssessmentIcon />, path: ROUTES.EVALUACION },
  { text: 'Mapa de Riesgos', icon: <MapIcon />, path: ROUTES.MAPA },
  { text: 'Priorización', icon: <PriorityIcon />, path: ROUTES.PRIORIZACION },
  { text: 'Normatividad', icon: <DescriptionIcon />, path: ROUTES.NORMATIVIDAD },
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

  // Mobile drawer content
  const drawer = (
    <Box sx={{ pt: 2 }}>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleMenuClick(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(200, 217, 0, 0.15)',
                  borderLeft: `4px solid #c8d900`,
                  '&:hover': {
                    backgroundColor: 'rgba(200, 217, 0, 0.25)',
                  },
                },
              }}
            >
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path ? '#c8d900' : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="fixed"
        sx={{
          background: '#2c3e50',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 70 }, px: { xs: 2, md: 3 } }}>
          {/* Logo Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: { xs: 2, md: 4 },
            }}
          >
            <Box
              sx={{
                background: '#1a1a1a',
                borderRadius: '12px',
                px: 1.8,
                py: 1.2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 70,
                minHeight: 60,
                border: '2.5px solid #c8d900',
                boxShadow: '0 0 15px rgba(200, 217, 0, 0.5)',
              }}
            >
              <Box
                component="img"
                src="/LogoComware.png"
                alt="COMWARE Logo"
                sx={{
                  height: 52,
                  width: 52,
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>

          {/* Desktop Navigation Menu */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 0.5,
              flexGrow: 1,
              justifyContent: 'center',
            }}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.text}
                  onClick={() => handleMenuClick(item.path)}
                  sx={{
                    color: isActive ? '#c8d900' : '#fff',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: '0.875rem',
                    px: 2,
                    py: 1,
                    borderRadius: '6px',
                    textTransform: 'none',
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                    '&::after': isActive
                      ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '10%',
                          right: '10%',
                          height: '3px',
                          background: '#c8d900',
                          borderRadius: '3px 3px 0 0',
                          boxShadow: '0 0 8px rgba(200, 217, 0, 0.5)',
                        }
                      : {},
                  }}
                >
                  {item.text}
                </Button>
              );
            })}
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' }, ml: 'auto' }}
          >
            <MenuIcon />
          </IconButton>

          {/* User Avatar */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              ml: 'auto',
              gap: 1.5,
            }}
          >
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#fff' }}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {user?.position}
              </Typography>
            </Box>
            <Tooltip title="Perfil de usuario">
              <IconButton
                onClick={handleUserMenuOpen}
                sx={{
                  background: '#1a1a1a',
                  border: '2px solid #c8d900',
                  width: 44,
                  height: 44,
                  boxShadow: '0 0 10px rgba(200, 217, 0, 0.3)',
                  '&:hover': {
                    background: '#2a2a2a',
                    boxShadow: '0 0 15px rgba(200, 217, 0, 0.5)',
                  },
                }}
              >
                <AccountCircleIcon sx={{ color: '#c8d900', fontSize: 26 }} />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  minWidth: 250,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
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
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 10, md: 11 },
          px: { xs: 2, md: 3 },
          pb: 3,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
