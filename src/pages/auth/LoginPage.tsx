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
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Person as PersonIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, user } = useAuth();

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
            const userData = result.user || user;
            if (userData?.role === 'admin') {
                navigate(ROUTES.ADMINISTRACION);
                return;
            }
            if (userData?.role === 'supervisor_riesgos') {
                navigate(ROUTES.DASHBOARD_SUPERVISOR);
                return;
            }
            if (userData?.role === 'gerente_general') {
                navigate(ROUTES.MODO_GERENTE_GENERAL);
                return;
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