import React, { useState } from 'react';
import { Box, Alert, Tabs, Tab, Card, CardContent, Typography, Stack, Button } from '@mui/material';
import {
    Inventory as CatalogsIcon,
    TrendingUp as PositiveConfigIcon,
    Palette as MapIcon,
    Tune as TuneIcon,
    Rule as RuleIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import CatalogosIdentificacion from './CatalogosIdentificacion';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ConfiguracionPage() {
    const { esAdmin } = useAuth();
    const [value, setValue] = useState(0);
    const navigate = useNavigate();

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    if (!esAdmin) {
        return (
            <Box>
                <Alert severity="error">
                    No tiene permisos para acceder a esta página.
                </Alert>
            </Box>
        );
    }

    return (
        <AppPageLayout
            title="Configuración del Sistema"
            description="Gestione catálogos y parámetros de configuración del sistema."
        >
            <Box sx={{ mt: -2 }}>

                <Tabs
                    value={value}
                    onChange={handleChange}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: '#f9f9f9',
                        '& .MuiTab-root': {
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            padding: '12px 16px',
                            flex: 1,
                            textTransform: 'none',
                            fontSize: '14px'
                        },
                        '& .MuiTabs-indicator': {
                            height: 3
                        }
                    }}
                >
                    <Tab
                        icon={<CatalogsIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Catálogos de Identificación"
                    />
                    <Tab
                        icon={<PositiveConfigIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Configuración Positiva"
                    />
                </Tabs>

                <TabPanel value={value} index={0}>
                    <CatalogosIdentificacion embedded={true} />
                </TabPanel>

                <TabPanel value={value} index={1}>
                    <Stack spacing={2}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                    Configuración para Consecuencia Positiva
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Administre los colores del mapa positivo, parámetros de calificación inherente y reglas de residual final para oportunidades.
                                </Typography>
                                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                                    <Button
                                        variant="contained"
                                        startIcon={<MapIcon />}
                                        onClick={() => navigate('/admin/mapas')}
                                    >
                                        Colores de Mapa Positivo
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<TuneIcon />}
                                        onClick={() => navigate('/admin/calificacion-inherente')}
                                    >
                                        Calificación Inherente
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<RuleIcon />}
                                        onClick={() => navigate('/admin/calificacion-residual')}
                                    >
                                        Residual Final Positiva
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </TabPanel>

            </Box>
        </AppPageLayout>
    );
}
