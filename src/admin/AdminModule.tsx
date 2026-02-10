import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  Alert
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Inventory as CatalogsIcon
} from '@mui/icons-material';
import UsuariosPage from './pages/UsuariosPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import CatalogosPage from './pages/CatalogosPage';
import DashboardPage from './pages/DashboardPage';

interface AdminProps {
  user: any;
  onLogout: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminModule({ user, onLogout }: AdminProps) {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    onLogout();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <Toolbar>
          {/* Logo COMWARE */}
          <Box
            component="img"
            src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
            alt="COMWARE"
            sx={{
              height: 40,
              marginRight: 2,
              objectFit: 'contain'
            }}
          />
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            COMWARE - Panel Administrativo
          </Typography>
          <Typography variant="body2" sx={{ mr: 3, backgroundColor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: 1 }}>
            {user?.nombre} ({user?.rol})
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 2 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 3 }}>
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Dashboard" icon={<DashboardIcon />} iconPosition="start" />
            <Tab label="Usuarios" icon={<PeopleIcon />} iconPosition="start" />
            <Tab label="Catálogos" icon={<CatalogsIcon />} iconPosition="start" />
            <Tab label="Configuración" icon={<SettingsIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <DashboardPage user={user} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <UsuariosPage user={user} />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <CatalogosPage user={user} />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <ConfiguracionPage user={user} />
          </TabPanel>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 3,
          mt: 'auto',
          backgroundColor: '#f5f5f5',
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="textSecondary">
          © {new Date().getFullYear()} COMWARE - Sistema de Gestión de Riesgos. v1.0.0
        </Typography>
      </Box>
    </Box>
  );
}
