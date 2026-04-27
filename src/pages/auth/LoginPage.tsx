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
    Typography,
    Alert,
    InputAdornment,
    IconButton,
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
import LoadingActionButton from '../../components/ui/LoadingActionButton';

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

        // Si requiere configurar 2FA (primera vez)
        if (result.requiresSetup2FA && result.email) {
            navigate('/setup-2fa-required', { 
                state: { 
                    email: result.email,
                    obligatorio: result.obligatorio 
                } 
            });
            return;
        }

        // Si requiere 2FA, redirigir a página de verificación
        if (result.requires2FA && result.email) {
            navigate('/verify-2fa', { state: { email: result.email } });
            return;
        }

        if (result.success) {
            // Redirigir según ámbito: SISTEMA → administración; OPERATIVO → dashboard/sistema de riesgos
            const userData = result.user || user;
            if (userData?.ambito === 'SISTEMA') {
                navigate(ROUTES.ADMINISTRACION);
                return;
            }
            // Operativo (o sin ámbito): según rol dentro del sistema de riesgos
            if (userData?.role === 'supervisor') {
                navigate(ROUTES.DASHBOARD_SUPERVISOR);
                return;
            }
            if (userData?.role === 'gerente') {
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
                    mx: { xs: 1.5, sm: 2 },
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    borderRadius: 3,
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <CardContent sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
                    {/* Logo Section: logo corporativo COMWARE */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box
                            component="img"
                            src="/Comware.webp"
                            alt="COMWARE Logo"
                            sx={{
                                height: 'auto',
                                width: '100%',
                                maxHeight: { xs: 90, sm: 110, md: 120 },
                                maxWidth: { xs: 240, sm: 280, md: 300 },
                                objectFit: 'contain',
                                mb: 2,
                                mx: 'auto',
                                display: 'block',
                            }}
                        />
                        <Typography variant="h6" color="text.secondary" sx={{ py: 2, fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' } }}>
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

                        <LoadingActionButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            loading={isLoading}
                            loadingText="Iniciando sesión..."
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
                            Iniciar Sesión
                        </LoadingActionButton>
                    </form>



                    {/* Footer */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        display="block"
                        sx={{ mt: 3 }}
                    >
                        © 2026 COMWARE
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
}