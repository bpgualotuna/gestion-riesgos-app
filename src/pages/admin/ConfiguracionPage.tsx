import React, { useState } from 'react';
import { Box, Typography, Alert, Tabs, Tab, Paper, FormControlLabel, Switch, CircularProgress } from '@mui/material';
import {
    Inventory as CatalogsIcon,
    Settings as ConfigIcon,
    Gavel as GavelIcon,
} from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import CatalogosIdentificacion from './CatalogosIdentificacion';
import MapasConfigPage from './MapasConfigPage';
import { useAuth } from '../../contexts/AuthContext';
import {
    useGetReglaResidualPlanCausaQuery,
    useUpdateReglaResidualPlanCausaMutation,
} from '../../api/services/riesgosApi';

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
    const { data: reglaPlanCausa, isLoading: cargandoRegla } = useGetReglaResidualPlanCausaQuery(undefined, {
        skip: !esAdmin,
    });
    const [actualizarReglaPlanCausa, { isLoading: guardandoRegla }] = useUpdateReglaResidualPlanCausaMutation();

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
            description="Gestione los catálogos base, la configuración de los mapas y las normas de calificación residual."
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
                        icon={<ConfigIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Configuración de Mapas"
                    />
                    <Tab
                        icon={<GavelIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Normas de negocio (residual)"
                    />
                </Tabs>

                <TabPanel value={value} index={0}>
                    <CatalogosIdentificacion embedded={true} />
                </TabPanel>

                <TabPanel value={value} index={1}>
                    <MapasConfigPage embedded={true} />
                </TabPanel>

                <TabPanel value={value} index={2}>
                    <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Plan de acción en causa e igualdad residual / inherente
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Si está activada: cuando un riesgo tiene al menos un plan de acción asociado a una de sus
                            causas, la calificación residual se iguala a la inherente y no se aplica la mitigación por
                            controles para ese residual (modo estándar y estratégico en servidor). Si está desactivada,
                            se mantiene el comportamiento anterior (se califican controles para el residual salvo otras
                            reglas del sistema).
                        </Typography>
                        {cargandoRegla ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={Boolean(reglaPlanCausa?.activa)}
                                        disabled={guardandoRegla}
                                        onChange={(_, checked) => {
                                            void actualizarReglaPlanCausa({ activa: checked });
                                        }}
                                    />
                                }
                                label={reglaPlanCausa?.activa ? 'Regla activa' : 'Regla desactivada'}
                            />
                        )}
                    </Paper>
                </TabPanel>
            </Box>
        </AppPageLayout>
    );
}
