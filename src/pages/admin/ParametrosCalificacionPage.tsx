
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
import * as mockService from '../../api/services/mockData';
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
    onSaveTiposRiesgo,
}: {
    tiposRiesgo: TipoRiesgo[];
    onSaveTiposRiesgo: (items: TipoRiesgo[]) => void;
}) {
    const [tipoSeleccionado, setTipoSeleccionado] = useState<string>(tiposRiesgo[0]?.codigo || '');

    const subtipos = useMemo(() => {
        const tipo = tiposRiesgo.find(t => t.codigo === tipoSeleccionado);
        return (tipo?.subtipos || []).map((s) => ({
            id: s.codigo || `temp-${Date.now()}-${Math.random()}`,
            codigo: s.codigo,
            descripcion: s.descripcion
        }));
    }, [tiposRiesgo, tipoSeleccionado]);

    const handleSaveSubtipo = (item: any) => {
        const newTipos = tiposRiesgo.map((t) => {
            if (t.codigo !== tipoSeleccionado) return t;

            let subtiposActuales = t.subtipos || [];
            let itemGuardar = { ...item };

            // Si no tiene código, generar uno nuevo
            if (!itemGuardar.codigo) {
                const maxCod = subtiposActuales.reduce((max, s) => {
                    const cod = parseInt(s.codigo);
                    return isNaN(cod) ? max : Math.max(max, cod);
                }, 0);
                itemGuardar.codigo = String(maxCod + 1);
            }

            const existe = subtiposActuales.some((s) => s.codigo === itemGuardar.codigo);

            const nuevosSubtipos: SubtipoRiesgo[] = existe
                ? subtiposActuales.map((s) => (s.codigo === itemGuardar.codigo ? { codigo: itemGuardar.codigo, descripcion: itemGuardar.descripcion } : s))
                : [...subtiposActuales, { codigo: itemGuardar.codigo, descripcion: itemGuardar.descripcion }];

            return { ...t, subtipos: nuevosSubtipos };
        });
        onSaveTiposRiesgo(newTipos);
    };

    const handleDeleteSubtipo = (codigo: string) => {
        if (!window.confirm('¿Confirma eliminación del subtipo?')) return;
        const newTipos = tiposRiesgo.map((t) => {
            if (t.codigo !== tipoSeleccionado) return t;
            return { ...t, subtipos: (t.subtipos || []).filter((s) => s.codigo !== codigo) };
        });
        onSaveTiposRiesgo(newTipos);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" sx={{ maxWidth: 320 }}>
                <InputLabel id="tipo-riesgo-select">Tipo de Riesgo</InputLabel>
                <Select
                    labelId="tipo-riesgo-select"
                    label="Tipo de Riesgo"
                    value={tipoSeleccionado}
                    onChange={(e) => setTipoSeleccionado(e.target.value as string)}
                >
                    {tiposRiesgo.map((t) => (
                        <MenuItem key={t.codigo} value={t.codigo}>
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
                    { field: 'codigo', headerName: 'ID', width: 120 },
                    { field: 'descripcion', headerName: 'Descripción', flex: 1 },
                ]}
                defaultItem={{ codigo: '', descripcion: '' }}
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
    const [origenes, setOrigenes] = useState(mockService.getMockOrigenes());
    const [tiposRiesgo, setTiposRiesgo] = useState<TipoRiesgo[]>(mockService.getMockTiposRiesgos());
    const [consecuencias, setConsecuencias] = useState(mockService.getMockConsecuencias());
    const [fuentes, setFuentes] = useState(mockService.getMockFuentes());
    const [frecuencias, setFrecuencias] = useState(mockService.getMockFrecuencias());
    const [objetivos, setObjetivos] = useState(mockService.getMockObjetivos());
    const [impactos, setImpactos] = useState(mockService.getDescripcionesImpacto());
    const [formulas, setFormulas] = useState(mockService.getMockFormulas());
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

    // Sync impacts from other pages (e.g., CatalogosIdentificacion)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'catalog_descripciones_impacto' || e.key === 'catalogos_impactos') {
                const newImpactos = mockService.getDescripcionesImpacto();
                setImpactos(newImpactos);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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
        updateService: (val: any[]) => void,
        idField: string = 'id'
    ) => {
        return (item: any) => {
            let newList = [...currentList];
            // Check if item has ID (edit) or needs new ID
            if (item[idField] && newList.some(i => i[idField] === item[idField])) {
                // Edit
                newList = newList.map(i => i[idField] === item[idField] ? item : i);
            } else {
                // New - generate auto-incrementing code and id
                const newId = typeof currentList[0]?.[idField] === 'number'
                    ? Math.max(...currentList.map(i => i[idField] as number)) + 1
                    : `${idField}-${Date.now()}`;

                // Auto-increment codigo if not provided
                let nuevoItem = { ...item, [idField]: newId };
                if (!nuevoItem.codigo || nuevoItem.codigo === '') {
                    const codigosActuales = currentList.map(i => {
                        const cod = i.codigo || i.code || i.label;
                        return parseInt(cod) || 0;
                    });
                    const proximoCodigo = Math.max(...codigosActuales, 0) + 1;
                    nuevoItem.codigo = String(proximoCodigo);
                }
                newList.push(nuevoItem);
            }
            setList(newList);
            updateService(newList);
        };
    };

    const createDeleteHandler = (
        currentList: any[],
        setList: (val: any[]) => void,
        updateService: (val: any[]) => void,
        idField: string = 'id'
    ) => {
        return (id: any) => {
            if (window.confirm('¿Confirma eliminación?')) {
                const newList = currentList.filter(i => i[idField] !== id);
                setList(newList);
                updateService(newList);
            }
        };
    };

    const handleSaveTiposRiesgo = (item: any) => {
        const exists = tiposRiesgo.some((t) => t.codigo === item.codigo);
        let itemGuardar = { ...item };

        // Si es nuevo (no existe) y no tiene código, generar auto-incrementable
        if (!exists && (!item.codigo || item.codigo === '')) {
            const codigosActuales = tiposRiesgo.map(t => parseInt(t.codigo) || 0);
            const proximoCodigo = Math.max(...codigosActuales, 0) + 1;
            itemGuardar.codigo = String(proximoCodigo);
        }

        const newList = exists
            ? tiposRiesgo.map((t) => (t.codigo === item.codigo ? { ...t, ...itemGuardar } : t))
            : [...tiposRiesgo, itemGuardar];
        setTiposRiesgo(newList);
        mockService.updateMockTiposRiesgos(newList);
    };

    const handleDeleteTiposRiesgo = (codigo: string) => {
        if (!window.confirm('¿Confirma eliminación?')) return;
        const newList = tiposRiesgo.filter((t) => t.codigo !== codigo);
        setTiposRiesgo(newList);
        mockService.updateMockTiposRiesgos(newList);
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
                                    { field: 'codigo', headerName: 'ID', width: 100 },
                                    { field: 'nombre', headerName: 'Nombre', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(origenes, setOrigenes, mockService.updateMockOrigenes)}
                                onDelete={createDeleteHandler(origenes, setOrigenes, mockService.updateMockOrigenes)}
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
                                    { field: 'codigo', headerName: 'ID', width: 100 },
                                    { field: 'nombre', headerName: 'Nombre', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', nombre: '' }}
                                onSave={createSaveHandler(consecuencias, setConsecuencias, mockService.updateMockConsecuencias)}
                                onDelete={createDeleteHandler(consecuencias, setConsecuencias, mockService.updateMockConsecuencias)}
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
                                data={filteredTiposRiesgo.map((t) => ({ ...t, id: t.codigo }))}
                                columns={[
                                    { field: 'id', headerName: 'ID', width: 100 },
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
                                onSaveTiposRiesgo={(items) => {
                                    setTiposRiesgo(items);
                                    mockService.updateMockTiposRiesgos(items);
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
                                    { field: 'codigo', headerName: 'ID', width: 100 },
                                    { field: 'descripcion', headerName: 'Descripción', flex: 1 }
                                ]}
                                defaultItem={{ codigo: '', descripcion: '' }}
                                onSave={createSaveHandler(objetivos, setObjetivos, mockService.updateMockObjetivos)}
                                onDelete={createDeleteHandler(objetivos, setObjetivos, mockService.updateMockObjetivos)}
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
                                { field: 'codigo', headerName: 'ID', width: 100 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 }
                            ]}
                            defaultItem={{ codigo: '', nombre: '' }}
                            onSave={createSaveHandler(fuentes, setFuentes, mockService.updateMockFuentes)}
                            onDelete={createDeleteHandler(fuentes, setFuentes, mockService.updateMockFuentes)}
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
                                { field: 'id', headerName: 'ID', width: 80 },
                                { field: 'label', headerName: 'Frecuencia', width: 160 },
                                { field: 'descripcion', headerName: 'Descripción', flex: 1 }
                            ]}
                            defaultItem={{ id: 0, label: '', descripcion: '' }}
                            onSave={createSaveHandler(frecuencias, setFrecuencias as any, mockService.updateMockFrecuencias)}
                            onDelete={createDeleteHandler(frecuencias, setFrecuencias as any, mockService.updateMockFrecuencias)}
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
                            data={impactos}
                            onSave={(data) => {
                                setImpactos(data);
                                mockService.updateDescripcionesImpacto(data);
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
                                columns={[
                                    { field: 'label', headerName: 'Dimensión', flex: 1 },
                                    { field: 'porcentaje', headerName: 'Porcentaje', width: 140 },
                                    {
                                        field: 'actions',
                                        headerName: 'Acciones',
                                        width: 100,
                                        renderCell: (params) => (
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
                                ]}
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
