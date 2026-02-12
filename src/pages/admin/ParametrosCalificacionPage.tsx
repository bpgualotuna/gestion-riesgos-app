
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

    // States
    const [origenes, setOrigenes] = useState<any[]>([]);
    const [tiposRiesgo, setTiposRiesgo] = useState<TipoRiesgo[]>([]);
    const [consecuencias, setConsecuencias] = useState<any[]>([]);
    const [fuentes, setFuentes] = useState<any[]>([]);
    const [frecuencias, setFrecuencias] = useState<any[]>([]);
    const [objetivos, setObjetivos] = useState<any[]>([]);
    const [formulas, setFormulas] = useState<any[]>([]);
    const [pesoDialogOpen, setPesoDialogOpen] = useState(false);
    const [pesoEditing, setPesoEditing] = useState<{ key: string; label: string; porcentaje: number } | null>(null);
    const [impactoPesos, setImpactoPesos] = useState(() => {
        const stored = localStorage.getItem('config_pesos_impacto');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // fall through to defaults
            }
        }
        return DIMENSIONES_IMPACTO.map((d) => ({
            id: d.key,
            key: d.key,
            label: d.label,
            porcentaje: Math.round(d.peso * 100),
        }));
    });

    const totalPeso = impactoPesos.reduce((acc: number, item: any) => acc + (Number(item.porcentaje) || 0), 0);

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

    useEffect(() => setOrigenes(origenesApi), [origenesApi]);
    useEffect(() => setConsecuencias(consecuenciasApi), [consecuenciasApi]);
    useEffect(() => setTiposRiesgo(tiposRiesgoApi as TipoRiesgo[]), [tiposRiesgoApi]);
    useEffect(() => setObjetivos(objetivosApi), [objetivosApi]);
    useEffect(() => setFuentes(fuentesApi), [fuentesApi]);
    useEffect(() => setFrecuencias(frecuenciasApi), [frecuenciasApi]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleSubTabChange = (tabIndex: number) => (_event: React.SyntheticEvent, newValue: number) => {
        setSubTabValue(prev => ({ ...prev, [tabIndex]: newValue }));
    };

    // Generic Save Handler for Simple Catalogs
    const createSaveHandler = (
        currentList: any[],
        setList: (val: any[]) => void,
        updateService: (val: any[]) => Promise<any[]>,
        idField: string = 'id'
    ) => {
        return async (item: any) => {
            let newList = [...currentList];
            // Check if item has ID (edit) or needs new ID
            if (item[idField] && newList.some(i => i[idField] === item[idField])) {
                // Edit
                newList = newList.map(i => i[idField] === item[idField] ? item : i);
            } else {
                // New - omit id to allow DB autoincrement
                newList.push({ ...item });
            }
            setList(newList);
            const updated = await updateService(newList);
            if (updated) setList(updated);
        };
    };

    const createDeleteHandler = (
        currentList: any[],
        setList: (val: any[]) => void,
        updateService: (val: any[]) => Promise<any[]>,
        idField: string = 'id'
    ) => {
        return async (id: any) => {
            if (window.confirm('¿Confirma eliminación?')) {
                const newList = currentList.filter(i => i[idField] !== id);
                setList(newList);
                const updated = await updateService(newList);
                if (updated) setList(updated);
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
        } catch (error) {
            console.error('Error guardando tipologia:', error);
        }
    };

    const handleDeleteTiposRiesgo = async (id: number) => {
        if (!window.confirm('¿Confirma eliminación?')) return;
        try {
            await deleteTipologia(id as any).unwrap();
        } catch (error) {
            console.error('Error eliminando tipologia:', error);
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
                                columns={[
                                    { field: 'codigo', headerName: 'Código', width: 120 },
                                    { field: 'nombre', headerName: 'Nombre', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(origenes, setOrigenes, async (data) => {
                                    return await updateOrigenes(data).unwrap();
                                })}
                                onDelete={createDeleteHandler(origenes, setOrigenes, async (data) => {
                                    return await updateOrigenes(data).unwrap();
                                })}
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
                                columns={[
                                    { field: 'codigo', headerName: 'Código', width: 120 },
                                    { field: 'nombre', headerName: 'Nombre', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(consecuencias, setConsecuencias, async (data) => {
                                    return await updateConsecuencias(data).unwrap();
                                })}
                                onDelete={createDeleteHandler(consecuencias, setConsecuencias, async (data) => {
                                    return await updateConsecuencias(data).unwrap();
                                })}
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
                                columns={[
                                    { field: 'codigo', headerName: 'Código', width: 120 },
                                    { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                    { field: 'descripcion', headerName: 'Descripción', flex: 2 }
                                ]}
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
                                columns={[
                                    { field: 'codigo', headerName: 'Código', width: 120 },
                                    { field: 'descripcion', headerName: 'Descripción', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', descripcion: '' }}
                                onSave={async (item) => {
                                    if (item.id) {
                                        await updateObjetivo({ id: item.id, ...item }).unwrap();
                                    } else {
                                        await createObjetivo(item).unwrap();
                                    }
                                }}
                                onDelete={async (id) => {
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
                            columns={[
                                { field: 'id', headerName: 'ID', width: 80, editable: false },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 }
                            ]}
                            defaultItem={{ nombre: '' }}
                            onSave={createSaveHandler(fuentes, setFuentes, async (data) => {
                                return await updateFuentes(data).unwrap();
                            })}
                            onDelete={createDeleteHandler(fuentes, setFuentes, async (data) => {
                                return await updateFuentes(data).unwrap();
                            })}
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
                            columns={[
                                { field: 'id', headerName: 'ID', width: 80, editable: false },
                                { field: 'label', headerName: 'Frecuencia', width: 160 },
                                { field: 'descripcion', headerName: 'Descripción', flex: 1 }
                            ]}
                            defaultItem={{ label: '', descripcion: '' }}
                            onSave={createSaveHandler(frecuencias, setFrecuencias as any, async (data) => {
                                return await updateFrecuencias(data).unwrap();
                            })}
                            onDelete={createDeleteHandler(frecuencias, setFrecuencias as any, async (data) => {
                                return await updateFrecuencias(data).unwrap();
                            })}
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
                                if (!window.confirm('¿Confirma eliminación de la fórmula?')) return;
                                mockService.deleteMockFormula(id);
                                setFormulas((prev) => prev.filter((f) => f.id !== id));
                            }}
                        />
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
                        onClick={() => {
                            if (!pesoEditing) return;
                            const next = impactoPesos.map((p) => (p.key === pesoEditing.key ? { ...p, porcentaje: pesoEditing.porcentaje } : p));
                            setImpactoPesos(next);
                            localStorage.setItem('config_pesos_impacto', JSON.stringify(next));
                            setPesoDialogOpen(false);
                        }}
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

        </AppPageLayout >
    );
}
