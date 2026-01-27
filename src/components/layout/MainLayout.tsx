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
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';

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
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
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
                  backgroundColor: 'rgba(255, 149, 0, 0.15)',
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
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
              gap: 1.5,
              mr: { xs: 2, md: 4 },
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #b8d432 0%, #7cb342 100%)',
                borderRadius: '8px',
                p: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 40,
                minHeight: 40,
              }}
            >
              <Box
                component="img"
                src="/LogoComware.png"
                alt="COMWARE Logo"
                sx={{
                  height: 28,
                  width: 28,
                  objectFit: 'contain',
                }}
              />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#fff',
                fontSize: { xs: '1rem', md: '1.25rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              COMWARE
            </Typography>
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
                    color: isActive ? '#ff9500' : '#fff',
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
                          background: '#ff9500',
                          borderRadius: '3px 3px 0 0',
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
            }}
          >
            <IconButton
              sx={{
                background: 'linear-gradient(135deg, #b8d432 0%, #7cb342 100%)',
                width: 40,
                height: 40,
                '&:hover': {
                  background: 'linear-gradient(135deg, #a8c422 0%, #6ca332 100%)',
                },
              }}
            >
              <AccountCircleIcon sx={{ color: '#fff', fontSize: 24 }} />
            </IconButton>
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
