
import { useMemo, useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Paper,
    InputAdornment,
    Skeleton,
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    TrendingUp as TrendingUp,
    TrendingUp as ProbabilityIcon,
    Grading as GradingIcon,
    Speed as VelocityIcon,
    Source as SourceIcon,
    Warning as Warning,
    Label as Category,
    Layers as Target,
    Search as SearchIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import SimpleCatalog from './SimpleCatalog';
import ImpactosCatalog from './ImpactosCatalog';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { confirmarEliminar } from '../../utils/constants';
import AppDataGrid from '../../components/ui/AppDataGrid';
import {
    useGetOrigenesQuery,
    useGetConsecuenciasQuery,
    useGetTiposRiesgosQuery,
    useGetObjetivosQuery,
    useGetFuentesQuery,
    useGetFrecuenciasQuery,
    useGetImpactosQuery,
    useCreateTipologiaMutation,
    useUpdateTipologiaMutation,
    useDeleteTipologiaMutation,
    useCreateSubtipoMutation,
    useUpdateSubtipoMutation,
    useDeleteSubtipoMutation,
    useCreateObjetivoMutation,
    useUpdateObjetivoMutation,
    useDeleteObjetivoMutation,
    useUpdateFrecuenciasMutation,
    useUpdateFuentesMutation,
    useUpdateOrigenesMutation,
    useUpdateConsecuenciasMutation,
    useUpdateImpactosMutation,
    useCreateImpactoTipoMutation,
    useDeleteImpactoTipoMutation,
    useGetPesosImpactoQuery,
    useUpdatePesosImpactoMutation,
} from '../../api/services/riesgosApi';
import { TipoRiesgo, SubtipoRiesgo } from '../../types';
import { DIMENSIONES_IMPACTO } from '../../utils/constants';

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function SubtiposCatalog({
    tiposRiesgo,
    onCreateSubtipo,
    onUpdateSubtipo,
    onDeleteSubtipo,
}: {
    tiposRiesgo: TipoRiesgo[];
    onCreateSubtipo: (data: { tipoRiesgoId: number; nombre: string; descripcion?: string; codigo?: string }) => Promise<void>;
    onUpdateSubtipo: (data: { id: number; nombre?: string; descripcion?: string; codigo?: string }) => Promise<void>;
    onDeleteSubtipo: (id: number) => Promise<void>;
}) {
    const [tipoSeleccionado, setTipoSeleccionado] = useState<number | null>(tiposRiesgo[0]?.id ?? null);

    const subtipos = useMemo(() => {
        const tipo = tiposRiesgo.find(t => t.id === tipoSeleccionado);
        return tipo?.subtipos || [];
    }, [tiposRiesgo, tipoSeleccionado]);

    const handleSaveSubtipo = async (item: any) => {
        if (!tipoSeleccionado) return;
        if (item.id) {
            await onUpdateSubtipo({
                id: Number(item.id),
                nombre: item.nombre,
                descripcion: item.descripcion,
                codigo: item.codigo
            });
        } else {
            await onCreateSubtipo({
                tipoRiesgoId: tipoSeleccionado,
                nombre: item.nombre,
                descripcion: item.descripcion,
                codigo: item.codigo
            });
        }
    };

    const handleDeleteSubtipo = async (id: number) => {
        if (!window.confirm('¿Confirma eliminación del subtipo?')) return;
        await onDeleteSubtipo(id);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" sx={{ maxWidth: 320 }}>
                <InputLabel id="tipo-riesgo-select">Tipo de Riesgo</InputLabel>
                <Select
                    labelId="tipo-riesgo-select"
                    label="Tipo de Riesgo"
                    value={tipoSeleccionado ?? ''}
                    onChange={(e) => setTipoSeleccionado(Number(e.target.value))}
                >
                    {tiposRiesgo.map((t) => (
                        <MenuItem key={t.id} value={t.id}>
                            {t.nombre}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <SimpleCatalog
                title="Subtipos de Riesgo"
                itemLabel="Subtipo"
                data={subtipos}
                columns={[
                    { field: 'nombre', headerName: 'Nombre', flex: 1 },
                    { field: 'descripcion', headerName: 'Descripción', flex: 2 },
                    { field: 'codigo', headerName: 'Código', width: 120, editable: false },
                ]}
                defaultItem={{ nombre: '', descripcion: '', codigo: '' }}
                onSave={handleSaveSubtipo}
                onDelete={handleDeleteSubtipo}
            />
        </Box>
    );
}

export default function ParametrosCalificacionPage() {
    const [tabValue, setTabValue] = useState(0);
    const [subTabValue, setSubTabValue] = useState<{ [key: number]: number }>({ 0: 0, 1: 0, 2: 0, 3: 0 });

    // Search states for sub-tabs
    const [searchRiesgos, setSearchRiesgos] = useState({ origenes: '', consecuencias: '', tiposRiesgo: '', objetivos: '' });
    const [searchCausas, setSearchCausas] = useState({ fuentes: '', frecuencias: '' });
    const [searchImpactos, setSearchImpactos] = useState('');
    const [formulas, setFormulas] = useState<any[]>([]);
    const [pesoDialogOpen, setPesoDialogOpen] = useState(false);
    const [pesoEditing, setPesoEditing] = useState<{ key: string; label: string; porcentaje: number } | null>(null);
    const [recalculandoModalOpen, setRecalculandoModalOpen] = useState(false);

    // Estado para pestaña de pruebas de calificación de impacto
    const [testImpactos, setTestImpactos] = useState<Array<{ key: string; label: string; nivel: number }>>([]);
    
    // Obtener pesos de impacto desde la base de datos
    const { data: impactoPesosApi = [], refetch: refetchPesos } = useGetPesosImpactoQuery();
    const [updatePesosImpacto] = useUpdatePesosImpactoMutation();
    
    const [impactoPesos, setImpactoPesos] = useState(() => {
        // Usar datos de la API si están disponibles
        if (impactoPesosApi.length > 0) {
            return impactoPesosApi.map((p: any) => ({
                id: p.key,
                key: p.key,
                label: p.label,
                porcentaje: p.porcentaje,
            }));
        }
        // Fallback a valores por defecto
        return DIMENSIONES_IMPACTO.map((d) => ({
            id: d.key,
            key: d.key,
            label: d.label,
            porcentaje: Math.round(d.peso * 100),
        }));
    });
    
    // Sincronizar con datos de la API cuando cambien
    useEffect(() => {
        if (impactoPesosApi.length > 0) {
            setImpactoPesos(impactoPesosApi.map((p: any) => ({
                id: p.key,
                key: p.key,
                label: p.label,
                porcentaje: p.porcentaje,
            })));
        }
    }, [impactoPesosApi]);

    const totalPeso = impactoPesos.reduce((acc: number, item: any) => acc + (Number(item.porcentaje) || 0), 0);

    // Sincronizar testImpactos cuando cambien los pesos (claves/labels)
    useEffect(() => {
        if (impactoPesos.length > 0) {
            setTestImpactos(impactoPesos.map((p: any) => ({
                key: p.key,
                label: p.label,
                nivel: 1, // nivel por defecto
            })));
        }
    }, [impactoPesos]);

    // Calcular resultado de prueba de impacto global usando mismos pesos que backend
    const testResultadoImpacto = useMemo(() => {
        if (!impactoPesos || impactoPesos.length === 0 || testImpactos.length === 0) return null;

        const pesosMap = new Map<string, number>(
            impactoPesos.map((p: any) => [p.key, (Number(p.porcentaje) || 0) / 100])
        );

        const total = testImpactos.reduce((acc, item) => {
            const peso = pesosMap.get(item.key) ?? 0;
            const nivel = Number(item.nivel) || 1;
            return acc + nivel * peso;
        }, 0);

        // Redondear hacia arriba (como en backend)
        return Math.ceil(total);
    }, [impactoPesos, testImpactos]);

    // Queries - MUST be declared before useMemo that uses them
    const { data: origenesApi = [] } = useGetOrigenesQuery();
    const { data: consecuenciasApi = [] } = useGetConsecuenciasQuery();
    const { data: tiposRiesgoApi = [] } = useGetTiposRiesgosQuery();
    const { data: objetivosApi = [] } = useGetObjetivosQuery();
    const { data: fuentesApi = [] } = useGetFuentesQuery();
    const { data: frecuenciasApi = [] } = useGetFrecuenciasQuery();
    const { data: impactosApi = [] } = useGetImpactosQuery();

    const nivelesByTipo = useMemo(() => {
        const map: Record<number, Record<number, string>> = {};
        (impactosApi || []).forEach((tipo: any) => {
            map[tipo.id] = (tipo.niveles || []).reduce((acc: Record<number, string>, n: any) => {
                acc[n.nivel] = n.descripcion;
                return acc;
            }, {});
        });
        return map;
    }, [impactosApi]);

    // Mutations
    const [createTipologia] = useCreateTipologiaMutation();
    const [updateTipologia] = useUpdateTipologiaMutation();
    const [deleteTipologia] = useDeleteTipologiaMutation();
    const [createSubtipo] = useCreateSubtipoMutation();
    const [updateSubtipo] = useUpdateSubtipoMutation();
    const [deleteSubtipo] = useDeleteSubtipoMutation();
    const [createObjetivo] = useCreateObjetivoMutation();
    const [updateObjetivo] = useUpdateObjetivoMutation();
    const [deleteObjetivo] = useDeleteObjetivoMutation();
    const [updateFrecuencias] = useUpdateFrecuenciasMutation();
    const [updateFuentes] = useUpdateFuentesMutation();
    const [updateOrigenes] = useUpdateOrigenesMutation();
    const [updateConsecuencias] = useUpdateConsecuenciasMutation();
    const [updateImpactos] = useUpdateImpactosMutation();
    const [createImpactoTipo] = useCreateImpactoTipoMutation();
    const [deleteImpactoTipo] = useDeleteImpactoTipoMutation();

    // Use query data directly to avoid infinite render loops from useEffect syncing
    const origenes = origenesApi;
    const consecuencias = consecuenciasApi;
    const tiposRiesgo = tiposRiesgoApi as TipoRiesgo[];
    const objetivos = objetivosApi;
    const fuentes = fuentesApi;
    const frecuencias = frecuenciasApi;

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSubTabChange = (tabIndex: number) => (_event: React.SyntheticEvent, newValue: number) => {
        setSubTabValue(prev => ({ ...prev, [tabIndex]: newValue }));
    };

    // Generic Save Handler for Simple Catalogs - uses mutations without local state
    const createSaveHandler = (
        updateService: (val: any[]) => Promise<any[]>,
        currentList: any[] = []
    ) => {
        return async (item: any) => {
            try {
                let newList = [...currentList];
                if (item.id && newList.some(i => i.id === item.id)) {
                    newList = newList.map(i => i.id === item.id ? item : i);
                } else {
                    newList.push({ ...item });
                }
                await updateService(newList);
            } catch {
            }
        };
    };

    const createDeleteHandler = (
        updateService: (val: any[]) => Promise<any[]>,
        currentList: any[] = []
    ) => {
        return async (id: any) => {
            if (!confirmarEliminar()) return;
                try {
                    const newList = currentList.filter(i => i.id !== id);
                    await updateService(newList);
                } catch {
                }
        };
    };

    const handleSaveTiposRiesgo = async (item: any) => {
        try {
            if (item.id) {
                await updateTipologia({ id: item.id, ...item }).unwrap();
            } else {
                await createTipologia(item).unwrap();
            }
        } catch {
        }
    };

    const handleDeleteTiposRiesgo = async (id: number) => {
        if (!confirmarEliminar('esta tipología')) return;
        try {
            await deleteTipologia(id as any).unwrap();
        } catch {
        }
    };

    // Filtered data for Riesgos sub-tabs
    const filteredOrigenes = useMemo(() =>
        origenes.filter(o => o.nombre.toLowerCase().includes(searchRiesgos.origenes.toLowerCase())),
        [origenes, searchRiesgos.origenes]
    );
    const filteredConsecuencias = useMemo(() =>
        consecuencias.filter(c => c.nombre.toLowerCase().includes(searchRiesgos.consecuencias.toLowerCase())),
        [consecuencias, searchRiesgos.consecuencias]
    );
    const filteredTiposRiesgo = useMemo(() =>
        tiposRiesgo.filter(t => t.nombre.toLowerCase().includes(searchRiesgos.tiposRiesgo.toLowerCase())),
        [tiposRiesgo, searchRiesgos.tiposRiesgo]
    );
    const filteredObjetivos = useMemo(() =>
        objetivos.filter(o => o.descripcion.toLowerCase().includes(searchRiesgos.objetivos.toLowerCase())),
        [objetivos, searchRiesgos.objetivos]
    );

    // Filtered data for Causas sub-tabs
    const filteredFuentes = useMemo(() =>
        fuentes.filter(f => f.nombre.toLowerCase().includes(searchCausas.fuentes.toLowerCase())),
        [fuentes, searchCausas.fuentes]
    );
    const filteredFrecuencias = useMemo(() =>
        frecuencias.filter(f => f.label.toLowerCase().includes(searchCausas.frecuencias.toLowerCase())),
        [frecuencias, searchCausas.frecuencias]
    );

    const impactoPesosColumns = useMemo(() => [
        { field: 'label', headerName: 'Dimensión', flex: 1 },
        { field: 'porcentaje', headerName: 'Porcentaje', width: 140 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 100,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <EditIcon
                        sx={{
                            color: '#2196f3',
                            cursor: 'pointer',
                            fontSize: '20px',
                            '&:hover': { opacity: 0.7 }
                        }}
                        onClick={() => {
                            setPesoEditing({
                                key: params.row.key,
                                label: params.row.label,
                                porcentaje: params.row.porcentaje,
                            });
                            setPesoDialogOpen(true);
                        }}
                    />
                </Box>
            ),
        },
    ], []);

    // Memoized column definitions for all SimpleCatalog instances
    const origenesColumns = useMemo(() => [
        { field: 'codigo', headerName: 'Código', width: 120 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 }
    ], []);

    const consecuenciasColumns = useMemo(() => [
        { field: 'codigo', headerName: 'Código', width: 120 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 }
    ], []);

    const tiposRiesgoColumns = useMemo(() => [
        { field: 'codigo', headerName: 'Código', width: 120 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 }
    ], []);

    const objetivosColumns = useMemo(() => [
        { field: 'codigo', headerName: 'Código', width: 120 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1 }
    ], []);

    const fuentesColumns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 80, editable: false },
        { field: 'nombre', headerName: 'Nombre', flex: 1 }
    ], []);

    const frecuenciasColumns = useMemo(() => [
        { field: 'id', headerName: 'ID', width: 80, editable: false },
        { field: 'label', headerName: 'Frecuencia', width: 160 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1 },
        { field: 'peso', headerName: 'Peso (1-5)', width: 120, type: 'number' }
    ], []);

    return (
        <AppPageLayout
            title="Parámetros de Calificación e Identificación"
            description="Gestión centralizada de los catálogos y parámetros utilizados en la identificación y calificación de riesgos."
        >
            <Box sx={{ mt: -2 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'white',
                        '& .MuiTab-root': {
                            minHeight: 64,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                        },
                    }}
                >
                    <Tab
                        icon={<AssessmentIcon />}
                        iconPosition="start"
                        label="RIESGOS"
                    />
                    <Tab
                        icon={<ProbabilityIcon />}
                        iconPosition="start"
                        label="CAUSAS"
                    />
                    <Tab
                        icon={<TrendingUp />}
                        iconPosition="start"
                        label="IMPACTOS"
                    />
                    <Tab
                        icon={<GradingIcon />}
                        iconPosition="start"
                        label="CALIFICACIÓN"
                    />
                </Tabs>

                {/* 0: Riesgos */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'white' }}>
                            <Tabs
                                value={subTabValue[0]}
                                onChange={handleSubTabChange(0)}
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    bgcolor: 'white',
                                    '& .MuiTab-root': {
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        fontSize: '0.8125rem'
                                    }
                                }}
                            >
                                <Tab label="Orígenes" />
                                <Tab label="Consecuencias" />
                                <Tab label="Tipos de Riesgo" />
                                <Tab label="Subtipos" />
                                <Tab label="Objetivos" />
                            </Tabs>
                        </Box>

                        <TabPanel value={subTabValue[0]} index={0}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    placeholder="Buscar orígenes..."
                                    size="small"
                                    value={searchRiesgos.origenes}
                                    onChange={(e) => setSearchRiesgos({ ...searchRiesgos, origenes: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ maxWidth: '300px' }}
                                />
                            </Box>
                            <SimpleCatalog
                                title="Orígenes de Riesgo"
                                itemLabel="Origen"
                                data={filteredOrigenes}
                                columns={origenesColumns}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(async (data) => {
                                    return await updateOrigenes(data).unwrap();
                                }, origenes)}
                                onDelete={createDeleteHandler(async (data) => {
                                    return await updateOrigenes(data).unwrap();
                                }, origenes)}
                            />
                        </TabPanel>

                        <TabPanel value={subTabValue[0]} index={1}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    placeholder="Buscar consecuencias..."
                                    size="small"
                                    value={searchRiesgos.consecuencias}
                                    onChange={(e) => setSearchRiesgos({ ...searchRiesgos, consecuencias: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ maxWidth: '300px' }}
                                />
                            </Box>
                            <SimpleCatalog
                                title="Consecuencias"
                                itemLabel="Consecuencia"
                                data={filteredConsecuencias}
                                columns={consecuenciasColumns}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(async (data) => {
                                    return await updateConsecuencias(data).unwrap();
                                }, consecuencias)}
                                onDelete={createDeleteHandler(async (data) => {
                                    return await updateConsecuencias(data).unwrap();
                                }, consecuencias)}
                            />
                        </TabPanel>

                        <TabPanel value={subTabValue[0]} index={2}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    placeholder="Buscar tipos de riesgo..."
                                    size="small"
                                    value={searchRiesgos.tiposRiesgo}
                                    onChange={(e) => setSearchRiesgos({ ...searchRiesgos, tiposRiesgo: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ maxWidth: '300px' }}
                                />
                            </Box>
                            <SimpleCatalog
                                title="Tipos de Riesgo"
                                itemLabel="Tipo"
                                data={filteredTiposRiesgo}
                                columns={tiposRiesgoColumns}
                                defaultItem={{ codigo: '', nombre: '', descripcion: '' }}
                                onSave={handleSaveTiposRiesgo}
                                onDelete={handleDeleteTiposRiesgo}
                            />
                        </TabPanel>

                        <TabPanel value={subTabValue[0]} index={3}>
                            <SubtiposCatalog
                                tiposRiesgo={tiposRiesgo}
                                onCreateSubtipo={async (data) => {
                                    await createSubtipo(data).unwrap();
                                }}
                                onUpdateSubtipo={async (data) => {
                                    await updateSubtipo(data).unwrap();
                                }}
                                onDeleteSubtipo={async (id) => {
                                    if (!confirmarEliminar('este subtipo')) return;
                                    await deleteSubtipo(id).unwrap();
                                }}
                            />
                        </TabPanel>

                        <TabPanel value={subTabValue[0]} index={4}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    placeholder="Buscar objetivos..."
                                    size="small"
                                    value={searchRiesgos.objetivos}
                                    onChange={(e) => setSearchRiesgos({ ...searchRiesgos, objetivos: e.target.value })}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{ maxWidth: '300px' }}
                                />
                            </Box>
                            <SimpleCatalog
                                title="Objetivos Estratégicos"
                                itemLabel="Objetivo"
                                data={filteredObjetivos}
                                columns={objetivosColumns}
                                defaultItem={{ codigo: '', descripcion: '' }}
                                onSave={async (item) => {
                                    if (item.id) {
                                        await updateObjetivo({ id: item.id, ...item }).unwrap();
                                    } else {
                                        await createObjetivo(item).unwrap();
                                    }
                                }}
                                onDelete={async (id) => {
                                    if (!confirmarEliminar('este objetivo')) return;
                                    await deleteObjetivo(id).unwrap();
                                }}
                            />
                        </TabPanel>
                    </Box>
                </TabPanel>

                {/* 1: Causas */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'white' }}>
                        <Tabs
                            value={subTabValue[1]}
                            onChange={handleSubTabChange(1)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                bgcolor: 'white',
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    fontSize: '0.8125rem'
                                }
                            }}
                        >
                            <Tab label="Fuentes de Causa" />
                            <Tab label="Niveles de Frecuencia" />
                        </Tabs>
                    </Box>

                    <TabPanel value={subTabValue[1]} index={0}>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                placeholder="Buscar fuentes..."
                                size="small"
                                value={searchCausas.fuentes}
                                onChange={(e) => setSearchCausas({ ...searchCausas, fuentes: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ maxWidth: '300px' }}
                            />
                        </Box>
                        <SimpleCatalog
                            title="Fuentes de Causa"
                            itemLabel="Fuente"
                            data={filteredFuentes}
                            columns={fuentesColumns}
                            defaultItem={{ nombre: '' }}
                            onSave={createSaveHandler(async (data) => {
                                return await updateFuentes(data).unwrap();
                            }, fuentes)}
                            onDelete={createDeleteHandler(async (data) => {
                                return await updateFuentes(data).unwrap();
                            }, fuentes)}
                        />
                    </TabPanel>

                    <TabPanel value={subTabValue[1]} index={1}>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                placeholder="Buscar frecuencias..."
                                size="small"
                                value={searchCausas.frecuencias}
                                onChange={(e) => setSearchCausas({ ...searchCausas, frecuencias: e.target.value })}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'action.active', mr: 1 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ maxWidth: '300px' }}
                            />
                        </Box>
                        <SimpleCatalog
                            title="Niveles de Frecuencia (Probabilidad)"
                            itemLabel="Nivel"
                            data={filteredFrecuencias}
                            columns={frecuenciasColumns}
                            defaultItem={{ label: '', descripcion: '', peso: 3 }}
                            onSave={createSaveHandler(async (data) => {
                                return await updateFrecuencias(data).unwrap();
                            }, frecuencias)}
                            onDelete={createDeleteHandler(async (data) => {
                                return await updateFrecuencias(data).unwrap();
                            }, frecuencias)}
                        />
                    </TabPanel>
                </TabPanel>

                {/* 2: Impactos */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'white' }}>
                        <Tabs
                            value={subTabValue[2]}
                            onChange={handleSubTabChange(2)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                bgcolor: 'white',
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    fontSize: '0.8125rem'
                                }
                            }}
                        >
                            <Tab label="Descripciones de Impacto" />
                        </Tabs>
                    </Box>

                    <TabPanel value={subTabValue[2]} index={0}>
                        <ImpactosCatalog
                            tipos={impactosApi as any[]}
                            nivelesByTipo={nivelesByTipo}
                            onSaveNiveles={async (tipoId, niveles) => {
                                const payload = Object.keys(niveles).map((nivel) => ({
                                    nivel: Number(nivel),
                                    descripcion: niveles[Number(nivel)] || ''
                                }));
                                await updateImpactos({ id: tipoId, niveles: payload }).unwrap();
                            }}
                            onAddTipo={async (data) => {
                                await createImpactoTipo(data).unwrap();
                            }}
                            onDeleteTipo={async (tipoId) => {
                                if (!confirmarEliminar('este tipo de impacto')) return;
                                await deleteImpactoTipo(tipoId).unwrap();
                            }}
                        />
                    </TabPanel>
                </TabPanel>

                {/* 3: Calificación */}
                <TabPanel value={tabValue} index={3}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, bgcolor: 'white' }}>
                        <Tabs
                            value={subTabValue[3]}
                            onChange={handleSubTabChange(3)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                bgcolor: 'white',
                                '& .MuiTab-root': {
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    fontSize: '0.8125rem'
                                }
                            }}
                        >
                            <Tab label="Pesos de Impacto" />
                            <Tab label="Fórmulas" />
                            <Tab label="Pruebas" />
                        </Tabs>
                    </Box>

                    <TabPanel value={subTabValue[3]} index={0}>
                        <Box>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Pesos de Impacto (deben sumar 100%)
                            </Typography>
                            <Box sx={{
                                p: 2,
                                mb: 3,
                                bgcolor: totalPeso === 100 ? '#e8f5e9' : '#ffebee',
                                border: `3px solid ${totalPeso === 100 ? '#4caf50' : '#f44336'}`,
                                borderRadius: 1
                            }}>
                                {totalPeso !== 100 && (
                                    <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold', mb: 1 }}>
                                        ⚠ ALERTA
                                    </Typography>
                                )}
                                <Typography
                                    variant="h4"
                                    sx={{
                                        color: totalPeso === 100 ? '#4caf50' : '#f44336',
                                        fontWeight: 'bold',
                                        mb: 1
                                    }}
                                >
                                    Total actual: {totalPeso}%
                                </Typography>
                                {totalPeso !== 100 && (
                                    <Typography variant="body1" sx={{ color: '#f44336' }}>
                                        {totalPeso > 100 ? `Exceso de ${totalPeso - 100}%` : `Falta ${100 - totalPeso}%`}
                                    </Typography>
                                )}
                                {totalPeso === 100 && (
                                    <Typography variant="body1" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                        ✓ Válido - Suma correcta
                                    </Typography>
                                )}
                            </Box>
                            <AppDataGrid
                                rows={impactoPesos}
                                columns={impactoPesosColumns}
                                getRowId={(row) => row.id}
                            />
                        </Box>
                    </TabPanel>

                    <TabPanel value={subTabValue[3]} index={1}>
                        <SimpleCatalog
                            title="Fórmulas de Calificación"
                            itemLabel="Fórmula"
                            data={formulas}
                            columns={[
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'categoria', headerName: 'Categoría', width: 140 },
                                { field: 'formula', headerName: 'Fórmula', flex: 2 },
                            ]}
                            defaultItem={{ nombre: '', descripcion: '', formula: '', categoria: 'riesgo', activa: true }}
                            onSave={(item) => {
                                if (item.id) {
                                    const updated = mockService.updateMockFormula(item.id, item);
                                    setFormulas((prev) => prev.map((f) => (f.id === item.id ? updated : f)));
                                } else {
                                    const created = mockService.createMockFormula(item);
                                    setFormulas((prev) => [...prev, created]);
                                }
                            }}
                            onDelete={(id) => {
                                if (!confirmarEliminar('esta fórmula')) return;
                                mockService.deleteMockFormula(id);
                                setFormulas((prev) => prev.filter((f) => f.id !== id));
                            }}
                        />
                    </TabPanel>

                    {/* Pestaña de pruebas de calificación de impacto */}
                    <TabPanel value={subTabValue[3]} index={2}>
                        <Box>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                                Pruebas de Calificación de Impacto
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Seleccione un nivel (1 a 5) para cada dimensión de impacto. El sistema multiplica
                                cada nivel por su porcentaje configurado, suma todos los resultados y aplica
                                redondeo hacia arriba para obtener la <strong>Calificación Global de Impacto</strong>,
                                exactamente igual que en el cálculo real.
                            </Typography>

                            <Paper sx={{ p: 2, mb: 3 }}>
                                {testImpactos.map((item) => {
                                    const peso = impactoPesos.find((p: any) => p.key === item.key)?.porcentaje ?? 0;
                                    return (
                                        <Box
                                            key={item.key}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                mb: 1.5,
                                                gap: 2,
                                            }}
                                        >
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {item.label}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Peso configurado: {peso}%
                                                </Typography>
                                            </Box>
                                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                                <InputLabel>Nivel (1-5)</InputLabel>
                                                <Select
                                                    label="Nivel (1-5)"
                                                    value={item.nivel}
                                                    onChange={(e) => {
                                                        const nivel = Number(e.target.value) || 1;
                                                        setTestImpactos((prev) =>
                                                            prev.map((ti) =>
                                                                ti.key === item.key ? { ...ti, nivel } : ti
                                                            )
                                                        );
                                                    }}
                                                >
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <MenuItem key={n} value={n}>
                                                            {n}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    );
                                })}
                            </Paper>

                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: '2px solid #1976d2',
                                    bgcolor: '#e3f2fd',
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    Resultado de la prueba
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                                    {testResultadoImpacto ?? '-'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Este valor debe coincidir con la <strong>Calificación Global de Impacto</strong> que
                                    se ve en las pantallas de Identificación y Evaluación cuando se usan los mismos
                                    niveles de impacto.
                                </Typography>
                            </Box>
                        </Box>
                    </TabPanel>
                </TabPanel>
            </Box>

            <Dialog open={pesoDialogOpen} onClose={() => setPesoDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '20px', fontWeight: 'bold' }}>Editar peso de impacto</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        {pesoEditing?.label}
                    </Typography>
                    <TextField
                        fullWidth
                        label="Porcentaje"
                        type="number"
                        inputProps={{ min: 0, max: 100 }}
                        value={pesoEditing?.porcentaje ?? 0}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setPesoEditing((prev) => (prev ? { ...prev, porcentaje: val } : prev));
                        }}
                        sx={{ mb: 3 }}
                    />
                    {pesoEditing && (
                        <Box>
                            {impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) !== 100 && (
                                <Box sx={{
                                    p: 2,
                                    bgcolor: '#ffebee',
                                    borderRadius: 1,
                                    border: '2px solid #f44336',
                                    mb: 2
                                }}>
                                    <Typography
                                        variant="body1"
                                        sx={{ color: '#f44336', fontWeight: 'bold', mb: 1 }}
                                    >
                                        ⚠ ALERTA
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#d32f2f' }}>
                                        Total actual: {impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0)}%
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#d32f2f', mt: 1 }}>
                                        Los porcentajes deben sumar exactamente 100%
                                    </Typography>
                                </Box>
                            )}
                            <Box sx={{
                                p: 2,
                                bgcolor: impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) === 100 ? '#e8f5e9' : '#fff3e0',
                                borderRadius: 1,
                                border: `2px solid ${impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) === 100 ? '#4caf50' : '#ff9800'}`
                            }}>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Total con este cambio:
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) === 100 ? '#4caf50' : '#ff9800',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0)}%
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) === 100 ? '#4caf50' : '#ff9800',
                                        fontWeight: 'bold',
                                        mt: 1
                                    }}
                                >
                                    {impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0) === 100 ? '✓ Válido - Listo para guardar' : `✗ Falta ${100 - impactoPesos.reduce((acc, p) => acc + (p.key === pesoEditing.key ? pesoEditing.porcentaje : p.porcentaje), 0)}%`}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPesoDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={async () => {
                            if (!pesoEditing) return;
                            const next = impactoPesos.map((p) => (p.key === pesoEditing.key ? { ...p, porcentaje: pesoEditing.porcentaje } : p));
                            setImpactoPesos(next);
                            
                            // Cerrar el diálogo de edición
                            setPesoDialogOpen(false);
                            
                            // Mostrar modal de recálculo
                            setRecalculandoModalOpen(true);
                            
                            // Guardar en base de datos
                            try {
                                await updatePesosImpacto(next.map((p) => ({
                                    key: p.key,
                                    label: p.label,
                                    porcentaje: p.porcentaje,
                                }))).unwrap();
                                
                                // Esperar un poco para que el backend inicie el recálculo
                                // Luego esperar un tiempo razonable para que termine
                                await new Promise(resolve => setTimeout(resolve, 2000));
                                
                                // Refrescar datos
                                refetchPesos();
                                
                                // Cerrar modal después de un tiempo adicional
                                setTimeout(() => {
                                    setRecalculandoModalOpen(false);
                                }, 1000);
                            } catch {
                                setRecalculandoModalOpen(false);
                            }
                        }}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal de recálculo en progreso */}
            <Dialog 
                open={recalculandoModalOpen} 
                onClose={() => {}} // No permitir cerrar mientras recalcula
                maxWidth="sm" 
                fullWidth
                disableEscapeKeyDown
            >
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1, mx: 'auto', mb: 3 }} />
                    <Skeleton variant="text" width="80%" sx={{ mx: 'auto', mb: 1 }} />
                    <Skeleton variant="text" width="100%" />
                </DialogContent>
            </Dialog>

        </AppPageLayout >
    );
}
