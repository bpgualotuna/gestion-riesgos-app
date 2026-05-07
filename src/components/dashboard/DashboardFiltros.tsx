import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItemButton,
    ListItemText,
    ListSubheader,
    InputAdornment,
    Divider,
    Stack,
    IconButton,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
    FilterList as FilterIcon,
    Clear as ClearIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Search as SearchIcon,
    Close as CloseIcon,
} from '@mui/icons-material';

interface ProcesoRow {
    id: string | number;
    nombre?: string;
    sigla?: string | null;
    areaNombre?: string;
}

interface OpcionProceso {
    id: string;
    label: string;
    areaNombre?: string;
}

interface DashboardFiltrosProps {
    /** Nombres de área seleccionados. Vacío = todas las áreas. */
    filtroAreaNombres: string[];
    onFiltroAreaNombresChange: (nombres: string[]) => void;
    /** IDs de proceso seleccionados. Vacío = todos los procesos (respetando áreas si hay alguna elegida). */
    filtroProcesoIds: string[];
    onFiltroProcesoIdsChange: (ids: string[]) => void;
    filtroOrigen: string;
    onFiltroOrigenChange: (value: string) => void;
    procesos: ProcesoRow[];
    ocultarFiltroOrigen?: boolean;
}

const etiquetaProcesoConSigla = (p: ProcesoRow): string => {
    const nombre = p.nombre || '';
    const s = p.sigla != null && String(p.sigla).trim() !== '' ? String(p.sigla).trim() : '';
    return s ? `${nombre} (${s})` : nombre;
};

function textoResumenAreas(seleccion: string[], totalDisponibles: number): string {
    if (seleccion.length === 0) {
        return totalDisponibles > 0 ? `Todas las áreas (${totalDisponibles})` : 'Sin áreas';
    }
    if (seleccion.length === 1) {
        return seleccion[0];
    }
    return `${seleccion.length} áreas seleccionadas`;
}

function textoResumenProcesos(seleccionIds: string[], opciones: OpcionProceso[]): string {
    if (seleccionIds.length === 0) {
        const n = opciones.length;
        return n > 0 ? `Todos los procesos (${n})` : 'Sin procesos';
    }
    const map = new Map(opciones.map((o) => [o.id, o]));
    const primera = map.get(seleccionIds[0]);
    if (seleccionIds.length === 1) {
        return primera?.label ?? seleccionIds[0];
    }
    const etiqueta = primera?.label ?? `ID ${seleccionIds[0]}`;
    return `${etiqueta} · +${seleccionIds.length - 1} más`;
}

const DashboardFiltros: React.FC<DashboardFiltrosProps> = ({
    filtroAreaNombres,
    onFiltroAreaNombresChange,
    filtroProcesoIds,
    onFiltroProcesoIdsChange,
    filtroOrigen,
    onFiltroOrigenChange,
    procesos,
    ocultarFiltroOrigen = false,
}) => {
    const opcionesArea = React.useMemo(() => {
        const areasUnicas = [...new Set(procesos.map((p) => p.areaNombre).filter(Boolean))] as string[];
        return areasUnicas.sort((a, b) => a.localeCompare(b, 'es'));
    }, [procesos]);

    const procesosEnScope = React.useMemo(() => {
        if (filtroAreaNombres.length === 0) return procesos;
        const set = new Set(filtroAreaNombres);
        return procesos.filter((p) => p.areaNombre != null && set.has(String(p.areaNombre)));
    }, [procesos, filtroAreaNombres]);

    const opcionesProceso = React.useMemo((): OpcionProceso[] => {
        const rows: OpcionProceso[] = procesosEnScope.map((p) => ({
            id: String(p.id),
            label: etiquetaProcesoConSigla(p),
            areaNombre: p.areaNombre,
        }));
        if (filtroAreaNombres.length === 0) {
            return [...rows].sort((a, b) => {
                const ga = a.areaNombre || 'Sin área';
                const gb = b.areaNombre || 'Sin área';
                const cmp = ga.localeCompare(gb, 'es');
                return cmp !== 0 ? cmp : a.label.localeCompare(b.label, 'es');
            });
        }
        return [...rows].sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [procesosEnScope, filtroAreaNombres.length]);

    const [modalAreasAbierto, setModalAreasAbierto] = React.useState(false);
    const [modalProcesosAbierto, setModalProcesosAbierto] = React.useState(false);
    const [borradorAreas, setBorradorAreas] = React.useState<string[]>([]);
    const [borradorProcesoIds, setBorradorProcesoIds] = React.useState<string[]>([]);
    const [buscarAreas, setBuscarAreas] = React.useState('');
    const [buscarProcesos, setBuscarProcesos] = React.useState('');

    const abrirModalAreas = () => {
        setBorradorAreas([...filtroAreaNombres]);
        setBuscarAreas('');
        setModalAreasAbierto(true);
    };

    const abrirModalProcesos = () => {
        setBorradorProcesoIds([...filtroProcesoIds]);
        setBuscarProcesos('');
        setModalProcesosAbierto(true);
    };

    const aplicarAreas = () => {
        onFiltroAreaNombresChange(borradorAreas);
        const pool =
            borradorAreas.length === 0
                ? procesos
                : procesos.filter((p) => p.areaNombre != null && borradorAreas.includes(String(p.areaNombre)));
        const permitidos = new Set(pool.map((p) => String(p.id)));
        onFiltroProcesoIdsChange(filtroProcesoIds.filter((id) => permitidos.has(id)));
        setModalAreasAbierto(false);
    };

    const aplicarProcesos = () => {
        onFiltroProcesoIdsChange(borradorProcesoIds);
        setModalProcesosAbierto(false);
    };

    const areasFiltradasBusqueda = React.useMemo(() => {
        const q = buscarAreas.trim().toLowerCase();
        if (!q) return opcionesArea;
        return opcionesArea.filter((a) => a.toLowerCase().includes(q));
    }, [opcionesArea, buscarAreas]);

    const procesosFiltradosBusqueda = React.useMemo(() => {
        const q = buscarProcesos.trim().toLowerCase();
        if (!q) return opcionesProceso;
        return opcionesProceso.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                (o.areaNombre != null && String(o.areaNombre).toLowerCase().includes(q))
        );
    }, [opcionesProceso, buscarProcesos]);

    const toggleArea = (nombre: string) => {
        setBorradorAreas((prev) =>
            prev.includes(nombre) ? prev.filter((x) => x !== nombre) : [...prev, nombre]
        );
    };

    const toggleProcesoId = (id: string) => {
        setBorradorProcesoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const marcarTodosAreasVisibles = () => {
        const visibles = areasFiltradasBusqueda;
        setBorradorAreas((prev) => Array.from(new Set([...prev, ...visibles])));
    };

    const quitarTodasAreasVisibles = () => {
        const quitar = new Set(areasFiltradasBusqueda);
        setBorradorAreas((prev) => prev.filter((a) => !quitar.has(a)));
    };

    const marcarTodosProcesosVisibles = () => {
        const ids = procesosFiltradosBusqueda.map((o) => o.id);
        setBorradorProcesoIds((prev) => Array.from(new Set([...prev, ...ids])));
    };

    const quitarTodosProcesosVisibles = () => {
        const quitar = new Set(procesosFiltradosBusqueda.map((o) => o.id));
        setBorradorProcesoIds((prev) => prev.filter((id) => !quitar.has(id)));
    };

    const handleClearFilters = () => {
        onFiltroAreaNombresChange([]);
        onFiltroProcesoIdsChange([]);
        onFiltroOrigenChange('all');
    };

    const hayFiltrosActivos =
        filtroAreaNombres.length > 0 || filtroProcesoIds.length > 0 || filtroOrigen !== 'all';

    /** Botones compactos sobre la lista del modal */
    const btnAccionListaSx = {
        fontSize: '0.6875rem',
        py: 0.35,
        px: 1,
        minWidth: 0,
        lineHeight: 1.2,
        textTransform: 'none' as const,
    };

    const botonSelectorSx = {
        justifyContent: 'space-between',
        textTransform: 'none' as const,
        py: 1,
        px: 1.5,
        borderRadius: 1,
        bgcolor: 'background.paper',
        borderColor: 'divider',
        '& .MuiButton-endIcon': { ml: 1, flexShrink: 0 },
    };

    const agruparProcesosPorArea = filtroAreaNombres.length === 0;

    const renderListaProcesosModal = () => {
        const items: React.ReactNode[] = [];
        let grupoActual = '';
        procesosFiltradosBusqueda.forEach((opt) => {
            if (agruparProcesosPorArea) {
                const g = opt.areaNombre || 'Sin área';
                if (g !== grupoActual) {
                    grupoActual = g;
                    items.push(
                        <ListSubheader
                            key={`sub-${g}-${items.length}`}
                            sx={{ bgcolor: 'background.paper', lineHeight: '32px', py: 0 }}
                        >
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                                {g}
                            </Typography>
                        </ListSubheader>
                    );
                }
            }
            const marcado = borradorProcesoIds.includes(opt.id);
            items.push(
                <ListItemButton
                    key={opt.id}
                    dense
                    onClick={() => toggleProcesoId(opt.id)}
                    sx={{
                        py: 0.5,
                        alignItems: 'flex-start',
                        ...(marcado && { bgcolor: 'action.selected' }),
                    }}
                >
                    <Checkbox
                        edge="start"
                        tabIndex={-1}
                        checked={marcado}
                        size="small"
                        disableRipple
                        icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        sx={{ pt: 0.25 }}
                    />
                    <ListItemText
                        primary={opt.label}
                        secondary={agruparProcesosPorArea ? undefined : opt.areaNombre}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </ListItemButton>
            );
        });
        return items;
    };

    return (
        <Card
            variant="outlined"
            sx={{
                mb: 3,
                borderColor: 'divider',
                boxShadow: 'none',
                bgcolor: 'action.hover',
            }}
        >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 2,
                        justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} component="div">
                                Filtros
                            </Typography>
                        </Box>
                    </Box>
                    {hayFiltrosActivos && (
                        <Button
                            startIcon={<ClearIcon />}
                            size="small"
                            onClick={handleClearFilters}
                            variant="text"
                            color="inherit"
                            sx={{ fontWeight: 500 }}
                        >
                            Restablecer
                        </Button>
                    )}
                </Box>

                <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: ocultarFiltroOrigen ? 6 : 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Área
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={abrirModalAreas}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={botonSelectorSx}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                    textAlign: 'left',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {textoResumenAreas(filtroAreaNombres, opcionesArea.length)}
                            </Typography>
                        </Button>
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: ocultarFiltroOrigen ? 6 : 5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                            Proceso
                        </Typography>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="medium"
                            onClick={abrirModalProcesos}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={botonSelectorSx}
                        >
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                    textAlign: 'left',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                {textoResumenProcesos(filtroProcesoIds, opcionesProceso)}
                            </Typography>
                        </Button>
                    </Grid2>
                    {!ocultarFiltroOrigen && (
                        <Grid2 size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="filtro-origen-label">Origen del riesgo</InputLabel>
                                <Select
                                    labelId="filtro-origen-label"
                                    value={filtroOrigen}
                                    label="Origen del riesgo"
                                    onChange={(e) => onFiltroOrigenChange(e.target.value)}
                                    sx={{ borderRadius: 1, bgcolor: 'background.paper' }}
                                >
                                    <MenuItem value="all">Todos</MenuItem>
                                    <MenuItem value="talleres">Talleres</MenuItem>
                                    <MenuItem value="auditoria">Auditoría</MenuItem>
                                    <MenuItem value="otros">Otros</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                    )}
                </Grid2>

                {/* Modal áreas */}
                <Dialog
                    open={modalAreasAbierto}
                    onClose={() => setModalAreasAbierto(false)}
                    fullWidth
                    maxWidth="xs"
                    scroll="paper"
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: { xs: 'calc(100vw - 24px)', sm: 380 },
                            m: { xs: 1.5, sm: 2 },
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            pr: 1,
                            py: 1.5,
                        }}
                    >
                        <Typography component="span" variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            Seleccionar áreas
                        </Typography>
                        <IconButton
                            aria-label="Cerrar"
                            size="small"
                            onClick={() => setModalAreasAbierto(false)}
                            edge="end"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar área…"
                            value={buscarAreas}
                            onChange={(e) => setBuscarAreas(e.target.value)}
                            sx={{ mb: 1.5 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap sx={{ mb: 0.75 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={btnAccionListaSx}
                                onClick={marcarTodosAreasVisibles}
                                disabled={areasFiltradasBusqueda.length === 0}
                                title="Marca todas las filas de la lista (respeta el texto de búsqueda si hay)"
                            >
                                Seleccionar todos
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={btnAccionListaSx}
                                onClick={quitarTodasAreasVisibles}
                                disabled={areasFiltradasBusqueda.length === 0}
                                title="Desmarca las filas visibles que estuvieran seleccionadas"
                            >
                                Quitar seleccionados
                            </Button>
                        </Stack>
                        <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto' }}>
                            {areasFiltradasBusqueda.map((area) => {
                                const marcado = borradorAreas.includes(area);
                                return (
                                    <ListItemButton
                                        key={area}
                                        dense
                                        onClick={() => toggleArea(area)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 0.25,
                                            ...(marcado && { bgcolor: 'action.selected' }),
                                        }}
                                    >
                                        <Checkbox
                                            edge="start"
                                            tabIndex={-1}
                                            checked={marcado}
                                            size="small"
                                            disableRipple
                                            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                            checkedIcon={<CheckBoxIcon fontSize="small" />}
                                        />
                                        <ListItemText primary={area} primaryTypographyProps={{ variant: 'body2' }} />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" onClick={aplicarAreas} sx={{ fontSize: '0.8125rem' }}>
                            Usar selección
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Modal procesos */}
                <Dialog
                    open={modalProcesosAbierto}
                    onClose={() => setModalProcesosAbierto(false)}
                    fullWidth
                    maxWidth="sm"
                    scroll="paper"
                    PaperProps={{
                        sx: {
                            width: '100%',
                            maxWidth: { xs: 'calc(100vw - 24px)', sm: 480 },
                            m: { xs: 1.5, sm: 2 },
                        },
                    }}
                >
                    <DialogTitle
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                            pr: 1,
                            py: 1.5,
                        }}
                    >
                        <Typography component="span" variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            Seleccionar procesos
                        </Typography>
                        <IconButton
                            aria-label="Cerrar"
                            size="small"
                            onClick={() => setModalProcesosAbierto(false)}
                            edge="end"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar proceso o área…"
                            value={buscarProcesos}
                            onChange={(e) => setBuscarProcesos(e.target.value)}
                            sx={{ mb: 1.5 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Stack direction="row" flexWrap="wrap" spacing={0.75} useFlexGap sx={{ mb: 0.75 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={btnAccionListaSx}
                                onClick={marcarTodosProcesosVisibles}
                                disabled={procesosFiltradosBusqueda.length === 0}
                                title="Marca todos los procesos de la lista (respeta el texto de búsqueda si hay)"
                            >
                                Seleccionar todos
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={btnAccionListaSx}
                                onClick={quitarTodosProcesosVisibles}
                                disabled={procesosFiltradosBusqueda.length === 0}
                                title="Desmarca las filas visibles que estuvieran seleccionadas"
                            >
                                Quitar seleccionados
                            </Button>
                        </Stack>
                        <Divider sx={{ mb: 1 }} />
                        <List dense disablePadding sx={{ maxHeight: 380, overflow: 'auto' }}>
                            {renderListaProcesosModal()}
                            {procesosFiltradosBusqueda.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, px: 1 }}>
                                    No hay resultados para la búsqueda.
                                </Typography>
                            )}
                        </List>
                    </DialogContent>
                    <DialogActions sx={{ px: 2, pb: 1.5, pt: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" onClick={aplicarProcesos} sx={{ fontSize: '0.8125rem' }}>
                            Usar selección
                        </Button>
                    </DialogActions>
                </Dialog>
            </CardContent>
        </Card>
    );
};

export default DashboardFiltros;
