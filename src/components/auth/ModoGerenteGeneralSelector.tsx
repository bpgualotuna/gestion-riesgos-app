
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { Box, Typography, Card, CardContent, CardActionArea } from '@mui/material';
import { Dashboard as DashboardIcon, AccountTree as ProcessIcon } from '@mui/icons-material';

const ModoGerenteGeneralSelector = () => {
    const { user, esGerenteGeneral, setGerenteGeneralMode } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!esGerenteGeneral) {
            navigate(ROUTES.DASHBOARD);
        }
    }, [esGerenteGeneral, navigate]);

    if (!esGerenteGeneral) return null;

    return (
        <Box 
            sx={{ 
                minHeight: '100vh',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3
            }}
        >
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography 
                    variant="h3" 
                    sx={{ 
                        color: 'white', 
                        fontWeight: 700,
                        mb: 2,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    Bienvenido, {user?.fullName}
                </Typography>
                <Typography 
                    variant="h6" 
                    sx={{ 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 400
                    }}
                >
                    Seleccione el modo de visualización:
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Card 
                    sx={{ 
                        width: 320, 
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <CardActionArea
                        onClick={() => {
                            setGerenteGeneralMode('director');
                            navigate(ROUTES.DASHBOARD_SUPERVISOR);
                        }}
                    >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                                }}
                            >
                                <DashboardIcon sx={{ fontSize: 40, color: 'white' }} />
                            </Box>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    fontWeight: 600,
                                    mb: 1.5,
                                    color: '#2c3e50'
                                }}
                            >
                                Dashboard Gerencial
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: 'text.secondary',
                                    lineHeight: 1.6
                                }}
                            >
                                Vista completa de estadísticas, métricas y análisis de riesgos de toda la organización
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>

                <Card 
                    sx={{ 
                        width: 320, 
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': { 
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.2)'
                        }
                    }}
                >
                    <CardActionArea
                        onClick={() => {
                            setGerenteGeneralMode('proceso');
                            navigate(ROUTES.PROCESOS);
                        }}
                    >
                        <CardContent sx={{ p: 4, textAlign: 'center' }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)'
                                }}
                            >
                                <ProcessIcon sx={{ fontSize: 40, color: 'white' }} />
                            </Box>
                            <Typography 
                                variant="h5" 
                                sx={{ 
                                    fontWeight: 600,
                                    mb: 1.5,
                                    color: '#2c3e50'
                                }}
                            >
                                Vista de Procesos
                            </Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: 'text.secondary',
                                    lineHeight: 1.6
                                }}
                            >
                                Gestión detallada de procesos estratégicos y análisis específico por áreas
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Box>
        </Box>
    );
};

export default ModoGerenteGeneralSelector;
