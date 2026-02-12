import { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Warning as RiesgoIcon,
    TrendingUp as ImpactIcon,
    AccountBalance as VpIcon,
    Domain as GerenciaIcon,
    LocationOn as ZonaIcon,
    Source as SourceIcon,
    FactCheck as ObjetivoIcon,
} from '@mui/icons-material';
import SimpleCatalog from './SimpleCatalog';
import AppPageLayout from '../../components/layout/AppPageLayout';
import {
    useGetTiposRiesgosQuery,
    useUpdateTipologiaMutation,
    useDeleteTipologiaMutation,
    useGetObjetivosQuery,
    useCreateObjetivoMutation,
    useUpdateObjetivoMutation,
    useDeleteObjetivoMutation,
    useGetVicepresidenciasQuery,
    useGetOrigenesQuery,
    useGetImpactosQuery,
    useGetGerenciasQuery,
} from '../../api/services/riesgosApi';
import { useNotification } from '../../hooks/useNotification';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div hidden={value !== index} {...other}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

export default function CatalogosIdentificacion({ embedded = false }: { embedded?: boolean }) {
    const [currentTab, setCurrentTab] = useState(0);
    const { showSuccess, showError } = useNotification();

    // Queries
    const { data: tiposRiesgo = [], isLoading: loadingTipos } = useGetTiposRiesgosQuery();
    const { data: objetivos = [], isLoading: loadingObjetivos } = useGetObjetivosQuery();
    const { data: vicepresidencias = [], isLoading: loadingVice } = useGetVicepresidenciasQuery();
    const { data: origenes = [], isLoading: loadingOrigenes } = useGetOrigenesQuery();
    const { data: impactos = [], isLoading: loadingImpactos } = useGetImpactosQuery();
    const { data: gerencias = [], isLoading: loadingGerencias } = useGetGerenciasQuery();

    // Mutations
    const [updateTipologia] = useUpdateTipologiaMutation();
    const [deleteTipologia] = useDeleteTipologiaMutation();
    const [createObjetivo] = useCreateObjetivoMutation();
    const [updateObjetivo] = useUpdateObjetivoMutation();
    const [deleteObjetivo] = useDeleteObjetivoMutation();

    const handleTabChange = (_: any, newValue: number) => {
        setCurrentTab(newValue);
    };

    if (loadingTipos || loadingObjetivos) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    const content = (
        <Box sx={{ mt: embedded ? 0 : -2 }}>
            <Paper sx={{ mb: 2 }}>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': { minHeight: 64, fontWeight: 600 }
                    }}
                >
                    <Tab icon={<RiesgoIcon />} iconPosition="start" label="Tipos de Riesgo" />
                    <Tab icon={<ObjetivoIcon />} iconPosition="start" label="Objetivos" />
                    <Tab icon={<ImpactIcon />} iconPosition="start" label="Impactos" />
                    <Tab icon={<VpIcon />} iconPosition="start" label="Vicepresidencias" />
                    <Tab icon={<GerenciaIcon />} iconPosition="start" label="Gerencias" />
                    <Tab icon={<SourceIcon />} iconPosition="start" label="Orígenes" />
                </Tabs>
            </Paper>

            <TabPanel value={currentTab} index={0}>
                <SimpleCatalog
                    title="Tipologías de Riesgo"
                    data={tiposRiesgo}
                    columns={[
                        { field: 'codigo', headerName: 'Código', width: 100, editable: false },
                        { field: 'nombre', headerName: 'Nombre', flex: 1 },
                        { field: 'descripcion', headerName: 'Descripción', flex: 2 }
                    ]}
                    onSave={async (item) => {
                        try {
                            if (item.id) {
                                await updateTipologia({ id: item.id, ...item }).unwrap();
                                showSuccess('Tipología actualizada correctamente');
                            }
                        } catch (e) {
                            showError('Error al guardar tipología');
                        }
                    }}
                    onDelete={async (id) => {
                        try {
                            await deleteTipologia(id).unwrap();
                            showSuccess('Tipología eliminada');
                        } catch (e) {
                            showError('Error al eliminar tipología');
                        }
                    }}
                    itemLabel="Tipología"
                    defaultItem={{ id: null, codigo: '', nombre: '', descripcion: '' }}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <SimpleCatalog
                    title="Objetivos Estratégicos"
                    data={objetivos}
                    columns={[
                        { field: 'codigo', headerName: 'Código', width: 100, editable: false },
                        { field: 'descripcion', headerName: 'Descripción', flex: 1 }
                    ]}
                    onSave={async (item) => {
                        try {
                            if (item.id) {
                                await updateObjetivo({ id: item.id, ...item }).unwrap();
                                showSuccess('Objetivo actualizado');
                            } else {
                                await createObjetivo(item).unwrap();
                                showSuccess('Objetivo creado');
                            }
                        } catch (e) {
                            showError('Error al guardar objetivo');
                        }
                    }}
                    onDelete={async (id) => {
                        try {
                            await deleteObjetivo(id).unwrap();
                            showSuccess('Objetivo eliminado');
                        } catch (e) {
                            showError('Error al eliminar objetivo');
                        }
                    }}
                    itemLabel="Objetivo"
                    defaultItem={{ id: null, codigo: '', descripcion: '' }}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <SimpleCatalog
                    title="Impactos"
                    data={impactos}
                    columns={[{ field: 'tipo', headerName: 'Tipo', flex: 1 }]}
                    onSave={() => { }} // Read-only for now
                    onDelete={() => { }}
                    itemLabel="Impacto"
                    defaultItem={{ id: null, tipo: '' }}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
                <SimpleCatalog
                    title="Vicepresidencias"
                    data={vicepresidencias}
                    columns={[{ field: 'nombre', headerName: 'Nombre', flex: 1 }]}
                    onSave={() => { }}
                    onDelete={() => { }}
                    itemLabel="Vicepresidencia"
                    defaultItem={{ id: null, nombre: '' }}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={4}>
                <SimpleCatalog
                    title="Gerencias"
                    data={gerencias}
                    columns={[{ field: 'nombre', headerName: 'Nombre', flex: 1 }]}
                    onSave={() => { }}
                    onDelete={() => { }}
                    itemLabel="Gerencia"
                    defaultItem={{ id: null, nombre: '' }}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={5}>
                <SimpleCatalog
                    title="Orígenes de Riesgo"
                    data={origenes}
                    columns={[{ field: 'nombre', headerName: 'Nombre', flex: 1 }]}
                    onSave={() => { }}
                    onDelete={() => { }}
                    itemLabel="Origen"
                    defaultItem={{ id: null, nombre: '' }}
                />
            </TabPanel>

            {!embedded && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                    Toda la información de catálogos se guarda ahora directamente en la base de datos centralizada.
                </Alert>
            )}
        </Box>
    );

    if (embedded) return content;

    return (
        <AppPageLayout
            title="Parámetros del Sistema"
            description="Gestione los catálogos y parámetros maestros del sistema de gestión de riesgos."
        >
            {content}
        </AppPageLayout>
    );
}
