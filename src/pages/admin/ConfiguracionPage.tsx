import React, { useState } from 'react';
import { Box, Typography, Alert, Tabs, Tab, Paper } from '@mui/material';
import {
    Inventory as CatalogsIcon,
    Settings as ConfigIcon,
} from '@mui/icons-material';
import CatalogosIdentificacion from './CatalogosIdentificacion';
import MapasConfigPage from './MapasConfigPage';
import { useAuth } from '../../contexts/AuthContext';

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
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Typography variant="h4" gutterBottom fontWeight={700}>
                Configuración del Sistema
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Gestione los catálogos base y la configuración de los mapas de riesgo.
            </Typography>

            <Paper sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
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
                </Tabs>

                <TabPanel value={value} index={0}>
                    <Box sx={{ p: 3 }}>
                        <CatalogosIdentificacion />
                    </Box>
                </TabPanel>

                <TabPanel value={value} index={1}>
                    <Box sx={{ p: 3 }}>
                        <MapasConfigPage />
                    </Box>
                </TabPanel>
            </Paper>
        </Box>
    );
}
