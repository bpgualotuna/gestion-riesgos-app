import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader } from '@mui/material';
import { People as PeopleIcon, Business as BusinessIcon, Settings as SettingsIcon, Warning as WarningIcon } from '@mui/icons-material';

interface DashboardPageProps {
  user: any;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const stats = [
    { title: 'Usuarios Activos', value: '0', icon: PeopleIcon, color: '#1976d2' },
    { title: 'Procesos', value: '0', icon: BusinessIcon, color: '#388e3c' },
    { title: 'Riesgos Identificados', value: '0', icon: WarningIcon, color: '#d32f2f' },
    { title: 'Configuraciones', value: '0', icon: SettingsIcon, color: '#f57c00' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dashboard
      </Typography>

      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardHeader
                avatar={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: stat.color,
                      color: '#fff'
                    }}
                  >
                    <stat.icon />
                  </Box>
                }
                title={stat.title}
                subheader={stat.value}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Bienvenido, {user.nombre}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Rol: <strong>{user.rol}</strong>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Email: <strong>{user.email}</strong>
        </Typography>
        {user.permisos && user.permisos.length > 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Permisos: <strong>{user.permisos.join(', ')}</strong>
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
