import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Alert,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Warning as RiesgoIcon,
    TrendingUp as ImpactIcon,
    AccountBalance as VpIcon,
    Domain as GerenciaIcon,
    LocationOn as ZonaIcon,
    Source as SourceIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import Grid2 from '../../utils/Grid2';
import RiesgosCatalog from './RiesgosCatalog';
import ImpactosCatalog from './ImpactosCatalog';
import SimpleCatalog from './SimpleCatalog';
import { GridColDef } from '@mui/x-data-grid';
import { 
    TipoRiesgo, 
    ImpactoDescripcion,
    Vicepresidencia,
    Gerencia,
    Frecuencia,
    Fuente,
    Objetivo
} from '../../types';
import { useGetTiposRiesgosQuery, useGetImpactosQuery, useGetObjetivosQuery, useGetFrecuenciasQuery, useGetFuentesQuery, useGetOrigenesQuery } from '../../api/services/riesgosApi';
import { getDescripcionesImpacto } from '../../api/catalogHelpers';

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
            id={`catalog-tabpanel-${index}`}
            aria-labelledby={`catalog-tab-${index}`}
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

export default function CatalogosIdentificacion() {
    const [currentTab, setCurrentTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estados para cada catálogo
    const [tiposRiesgo, setTiposRiesgo] = useState<TipoRiesgo[]>([]);
    const [impactos, setImpactos] = useState<Record<string, Record<number, string>>>({});
    const [vicepresidencias, setVicepresidencias] = useState<Vicepresidencia[]>([]);
    const [gerencias, setGerencias] = useState<Gerencia[]>([]);
    const [frecuencias, setFrecuencias] = useState<Frecuencia[]>([]);
    const [fuentes, setFuentes] = useState<Fuente[]>([]);
    const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
    const [zonas, setZonas] = useState<any[]>([]);
    const [origenes, setOrigenes] = useState<any[]>([]);

    const { data: tiposRiesgoData = [] } = useGetTiposRiesgosQuery();
    const { data: impactosData = [] } = useGetImpactosQuery();
    const { data: objetivosData = [] } = useGetObjetivosQuery();
    const { data: frecuenciasData = [] } = useGetFrecuenciasQuery();
    const { data: fuentesData = [] } = useGetFuentesQuery();
    const { data: origenesData = [] } = useGetOrigenesQuery();

    useEffect(() => { setTiposRiesgo((Array.isArray(tiposRiesgoData) ? tiposRiesgoData : []) as TipoRiesgo[]); }, [tiposRiesgoData]);
    useEffect(() => { setImpactos(getDescripcionesImpacto(Array.isArray(impactosData) ? impactosData : [])); }, [impactosData]);
    useEffect(() => { setObjetivos(Array.isArray(objetivosData) ? objetivosData : []); }, [objetivosData]);
    useEffect(() => { setFrecuencias(Array.isArray(frecuenciasData) ? frecuenciasData : []); }, [frecuenciasData]);
    useEffect(() => { setFuentes(Array.isArray(fuentesData) ? fuentesData : []); }, [fuentesData]);
    useEffect(() => { setOrigenes(Array.isArray(origenesData) ? origenesData : []); }, [origenesData]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    // Handlers para guardar cada catálogo
    const handleSaveTiposRiesgo = (items: TipoRiesgo[]) => setTiposRiesgo(items);
    const handleSaveImpactos = (items: Record<string, Record<number, string>>) => setImpactos(items);

    const handleSaveVicepresidencia = (item: Vicepresidencia) => {
        let newData = [...vicepresidencias];
        const index = newData.findIndex(v => v.id === item.id);
        if (index !== -1) {
            newData[index] = item;
        } else {
            item.id = Date.now().toString();
            newData.push(item);
        }
        setVicepresidencias(newData);
    };

    const handleDeleteVicepresidencia = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta vicepresidencia?')) {
            const newData = vicepresidencias.filter(v => v.id !== id);
            setVicepresidencias(newData);
        }
    };

    const handleSaveGerencia = (item: Gerencia) => {
        let newData = [...gerencias];
        const index = newData.findIndex(g => g.id === item.id);
        if (index !== -1) {
            newData[index] = item;
        } else {
            item.id = Date.now().toString();
            newData.push(item);
        }
        setGerencias(newData);
    };

    const handleDeleteGerencia = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta gerencia?')) {
            const newData = gerencias.filter(g => g.id !== id);
            setGerencias(newData);
        }
    };

    const handleSaveZona = (item: any) => {
        let newData = [...zonas];
        const index = newData.findIndex(z => z.id === item.id);
        if (index !== -1) {
            newData[index] = item;
        } else {
            item.id = Date.now().toString();
            newData.push(item);
        }
        setZonas(newData);
    };

    const handleDeleteZona = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta zona?')) {
            const newData = zonas.filter(z => z.id !== id);
            setZonas(newData);
        }
    };

    const handleSaveOrigen = (item: any) => {
        let newData = [...origenes];
        const index = newData.findIndex(o => o.id === item.id);
        if (index !== -1) {
            newData[index] = item;
        } else {
            item.id = Date.now().toString();
            newData.push(item);
        }
        setOrigenes(newData);
    };

    const handleDeleteOrigen = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este origen?')) {
            const newData = origenes.filter(o => o.id !== id);
            setOrigenes(newData);
        }
    };

    // Columnas para catálogos simples
    const vicepresidenciaColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'sigla', headerName: 'Sigla', width: 150 },
    ];

    const gerenciaColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'sigla', headerName: 'Sigla', width: 150 },
        { field: 'subdivision', headerName: 'Subdivisión', flex: 1 },
    ];

    const zonaColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
    ];

    const origenColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h5" gutterBottom fontWeight={600}>
                Catálogos de Identificación de Riesgos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                Configure los catálogos base utilizados en el proceso de identificación de riesgos.
            </Typography>

            <Paper sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden', mt: 3 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        bgcolor: '#f9f9f9',
                        '& .MuiTab-root': {
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            padding: '12px 16px',
                            textTransform: 'none',
                            fontSize: '13px'
                        },
                        '& .MuiTabs-indicator': {
                            height: 3
                        }
                    }}
                >
                    <Tab 
                        icon={<RiesgoIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Tipos de Riesgo" 
                    />
                    <Tab 
                        icon={<ImpactIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Impactos" 
                    />
                    <Tab 
                        icon={<VpIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Vicepresidencias" 
                    />
                    <Tab 
                        icon={<GerenciaIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Gerencias" 
                    />
                    <Tab 
                        icon={<ZonaIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Zonas" 
                    />
                    <Tab 
                        icon={<SourceIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Orígenes" 
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    <TabPanel value={currentTab} index={0}>
                        <RiesgosCatalog 
                            data={tiposRiesgo}
                            onSave={handleSaveTiposRiesgo}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={1}>
                        <ImpactosCatalog 
                            data={impactos}
                            onSave={handleSaveImpactos}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={2}>
                        <SimpleCatalog
                            title="Vicepresidencias"
                            data={vicepresidencias}
                            columns={vicepresidenciaColumns}
                            onSave={handleSaveVicepresidencia}
                            onDelete={handleDeleteVicepresidencia}
                            itemLabel="Vicepresidencia"
                            defaultItem={{ id: '', nombre: '', sigla: '' }}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={3}>
                        <SimpleCatalog
                            title="Gerencias"
                            data={gerencias}
                            columns={gerenciaColumns}
                            onSave={handleSaveGerencia}
                            onDelete={handleDeleteGerencia}
                            itemLabel="Gerencia"
                            defaultItem={{ id: '', nombre: '', sigla: '' }}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={4}>
                        <SimpleCatalog
                            title="Zonas"
                            data={zonas}
                            columns={zonaColumns}
                            onSave={handleSaveZona}
                            onDelete={handleDeleteZona}
                            itemLabel="Zona"
                            defaultItem={{ id: '', nombre: '', descripcion: '' }}
                        />
                    </TabPanel>

                    <TabPanel value={currentTab} index={5}>
                        <SimpleCatalog
                            title="Orígenes de Riesgo"
                            data={origenes}
                            columns={origenColumns}
                            onSave={handleSaveOrigen}
                            onDelete={handleDeleteOrigen}
                            itemLabel="Origen"
                            defaultItem={{ id: '', nombre: '', descripcion: '' }}
                        />
                    </TabPanel>
                </Box>
            </Paper>

            <Alert severity="info" sx={{ mt: 3 }}>
                Los cambios en los catálogos se guardan automáticamente en el navegador. 
                Asegúrese de realizar respaldos periódicos de la información importante.
            </Alert>
        </Box>
    );
}
