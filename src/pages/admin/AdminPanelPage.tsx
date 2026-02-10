import { useAuth } from '../../contexts/AuthContext';
import AdminModule from '../../admin/AdminModule';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

export default function AdminPanelPage() {
  const { user, esAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!esAdmin || !user) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2 }}>
          <Typography variant="h5">Acceso Denegado</Typography>
          <Typography variant="body1">No tienes permisos para acceder al panel administrativo</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Volver al Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  const adminUser = {
    id: user.id,
    nombre: user.fullName,
    email: user.email,
    rol: user.role,
    permisos: []
  };

  return (
    <AdminModule 
      user={adminUser} 
      onLogout={() => {
        logout();
        navigate('/login');
      }}
    />
  );
}
