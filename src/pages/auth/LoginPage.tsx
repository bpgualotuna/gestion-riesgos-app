/**
* Login Page
* Modern login interface with COMWARE branding
*/

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress,
    Divider,
    Chip,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person as PersonIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

// Usuarios de prueba predefinidos (coinciden con la base de datos)
const USUARIOS_PRUEBA = [
    { nombre: 'Andrés Martínez', role: 'admin', username: 'admin', password: 'admin123' },
    { nombre: 'Carlos Rodríguez', role: 'supervisor', username: 'supervisor', password: 'supervisor123' },
    { nombre: 'Juan José Maldonado', role: 'gerente_general', username: 'gerente_general', password: 'gerente123' },
    { nombre: 'Marco Alvarado', role: 'dueño_procesos', username: 'dueno_procesos', password: 'dueno123' },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        setIsLoading(false);

        if (result.success) {
            // Redirigir según el rol del usuario
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    if (userData.role === 'admin') {
                        navigate(ROUTES.ADMINISTRACION);
                        return;
                    }
                    if (userData.role === 'supervisor_riesgos') {
                        navigate(ROUTES.DASHBOARD_SUPERVISOR);
                        return;
                    }
                    if (userData.role === 'gerente_general') {
                        navigate(ROUTES.MODO_GERENTE_GENERAL);
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
            navigate(ROUTES.DASHBOARD);
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }
    };

    const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
        setUsername(demoUsername);
        setPassword(demoPassword);
        setError('');
        setIsLoading(true);

        const result = await login(demoUsername, demoPassword);

        setIsLoading(false);

        if (result.success) {
            // Redirigir según el rol del usuario
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    if (userData.role === 'admin') {
                        navigate(ROUTES.ADMINISTRACION);
                        return;
                    }
                    if (userData.role === 'supervisor_riesgos') {
                        navigate(ROUTES.DASHBOARD_SUPERVISOR);
                        return;
                    }
                    if (userData.role === 'gerente_general') {
                        navigate(ROUTES.MODO_GERENTE_GENERAL);
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }
            navigate(ROUTES.DASHBOARD);
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#E8E8E8',
                position: 'relative',
            }}
        >
            <Card
                sx={{
                    maxWidth: 480,
                    width: '100%',
                    mx: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    borderRadius: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <CardContent sx={{ p: 4 }}>
                    {/* Logo Section */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            component="img"
                            src="https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp"
                            alt="COMWARE Logo"
                            sx={{
                                height: 'auto',
                                width: 'auto',
                                maxHeight: 120,
                                maxWidth: 300,
                                objectFit: 'contain',
                                mb: 2,
                                mx: 'auto',
                                display: 'block',
                            }}
                        />
                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            COMWARE
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sistema de Gestión de Riesgos
                        </Typography>
                    </Box>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                            disabled={isLoading}
                            autoComplete="username"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={isLoading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                background: '#1976d2',
                                color: '#fff',
                                fontWeight: 600,
                                '&:hover': {
                                    background: '#1565c0',
                                },
                                '&:disabled': {
                                    background: '#ccc',
                                },
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} sx={{ color: '#1a1a1a' }} />
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </form>

                    {/* Demo User Section */}
                    <Divider sx={{ my: 3 }}>
                        <Chip label="Usuario de Prueba" size="small" />
                    </Divider>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {USUARIOS_PRUEBA.map((usuario) => (
                            <Button
                                key={usuario.role}
                                variant="outlined"
                                size="small"
                                onClick={() => handleDemoLogin(usuario.username, usuario.password)}
                                disabled={isLoading}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    borderColor:
                                        usuario.role === 'admin' ? '#d32f2f' :
                                            usuario.role === 'supervisor' ? '#1976d2' :
                                                usuario.role === 'gerente_general' ? '#9c27b0' :
                                                    '#c8d900',
                                    color:
                                        usuario.role === 'admin' ? '#d32f2f' :
                                            usuario.role === 'supervisor' ? '#1976d2' :
                                                usuario.role === 'gerente_general' ? '#9c27b0' :
                                                    '#c8d900',
                                    '&:hover': {
                                        borderColor:
                                            usuario.role === 'admin' ? '#c62828' :
                                                usuario.role === 'supervisor' ? '#1565c0' :
                                                    usuario.role === 'gerente_general' ? '#7b1fa2' :
                                                        '#b8c900',
                                        backgroundColor:
                                            usuario.role === 'admin' ? 'rgba(211, 47, 47, 0.08)' :
                                                usuario.role === 'supervisor' ? 'rgba(25, 118, 210, 0.08)' :
                                                    usuario.role === 'gerente_general' ? 'rgba(156, 39, 176, 0.08)' :
                                                        'rgba(200, 217, 0, 0.08)',
                                    },
                                }}
                            >
                                <Box sx={{ textAlign: 'left', width: '100%' }}>
                                    <Typography variant="body2" fontWeight={600}>
                                        {usuario.nombre} - {usuario.role}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {usuario.username} / {usuario.password}
                                    </Typography>
                                </Box>
                            </Button>
                        ))}
                    </Box>

                    {/* Footer */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        display="block"
                        sx={{ mt: 3 }}
                    >
                        © 2026 COMWARE - Talento Humano v1.0
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}