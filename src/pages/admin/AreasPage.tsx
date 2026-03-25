
import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Alert,
    Tabs,
    Tab,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel,
    Divider,
    Autocomplete,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    Business as BusinessIcon,
    Search as SearchIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { useConfirm } from '../../contexts/ConfirmContext';
import AppPageLayout from '../../components/layout/AppPageLayout';
import AppDataGrid from '../../components/ui/AppDataGrid';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import type { GridColDef } from '@mui/x-data-grid';
import type { Area, CreateAreaDto, Usuario, Proceso } from '../../types';
import {
    useGetAreasQuery,
    useCreateAreaMutation,
    useUpdateAreaMutation,
    useDeleteAreaMutation,
    useGetUsuariosQuery,
    useGetProcesosQuery,
    useBulkUpdateProcesosMutation,
    useGetResponsablesByProcesoQuery,
    useAddResponsableToProcesoMutation,
    useRemoveResponsableFromProcesoMutation,
    useUpdateResponsablesProcesoMutation,
    useGetRolesQuery,
} from '../../api/services/riesgosApi';
import Grid2 from '../../utils/Grid2';

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && (
                <Box sx={{ p: 3 }}>{children}</Box>
            )}
        </div>
    );
}

export default function AreasPage() {
    const { esAdmin, puedeEditar: puedeEditarAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const { confirmDelete } = useConfirm();
    const { data: areas = [], isLoading: loadingAreas } = useGetAreasQuery();
    const { data: usuariosData = [] } = useGetUsuariosQuery();
    const { data: rolesData = [] } = useGetRolesQuery();
    const { data: procesosData = [] } = useGetProcesosQuery();
    const [procesos, setProcesos] = useState<Proceso[]>([]);

    // Mapear usuarios para incluir role como string (codigo) desde el objeto anidado del backend
    const usuarios = useMemo(() => {
        const mapped = (usuariosData as any[]).map((u: any) => ({
            ...u,
            role: u.role?.codigo || u.role || 'sin_rol',
            roleId: u.roleId || u.role?.id || null,
            roleNombre: u.role?.nombre || 'Sin rol asignado'
        }));
        return mapped;
    }, [usuariosData]);

    // Estado para rastrear responsables seleccionados localmente (antes de guardar)
    // Formato: { procesoId: [{ usuarioId, modo }] }
    const [responsablesSeleccionados, setResponsablesSeleccionados] = useState<Record<string, Array<{ usuarioId: number; modo: string }>>>({});
    
    // Cargar procesos cuando cambian los datos de la API
    useEffect(() => {
        // Siempre actualizar procesos, incluso si está vacío (para limpiar estado anterior)
        setProcesos(procesosData || []);
        
        // NO inicializar responsablesSeleccionados aquí
        // Se leerán directamente de procesosData.responsablesList en isProcesoResponsable
    }, [procesosData]);

    const [tabValue, setTabValue] = useState(0);

    const [searchAreas, setSearchAreas] = useState('');
    const [searchAssignments, setSearchAssignments] = useState('');

    // Area CRUD States
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [areaDetailDialogOpen, setAreaDetailDialogOpen] = useState(false);
    const [selectedAreaDetail, setSelectedAreaDetail] = useState<Area | null>(null);
    const [areaFormData, setAreaFormData] = useState<CreateAreaDto>({
        nombre: '',
        descripcion: '',
        directorId: undefined,
    });

    // Assignment States
    const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<Usuario | null>(null);
    const [searchFilterAssignment, setSearchFilterAssignment] = useState('');
    const [assignmentSubTab, setAssignmentSubTab] = useState(0); // 0: Director, 1: Proceso
    
    // Limpiar estado local cuando cambia el usuario seleccionado
    useEffect(() => {
        if (selectedUserForAssignment) {
            // Limpiar el estado local para que se lean los datos frescos de la API
            setResponsablesSeleccionados({});
        }
    }, [selectedUserForAssignment]);
    const [filtroRol, setFiltroRol] = useState<string>('all');

    // Detectar si el usuario seleccionado es Gerente (ya no se usa localStorage, solo para UI)
    const esGerenteGeneral = selectedUserForAssignment?.role === 'gerente';

    // Obtener lista de roles desde la base (tabla Role)
    const rolesUnicos = useMemo(() => {
        const rolesSet = new Set<string>();
        (rolesData as any[]).forEach((r: any) => {
            if (r.codigo) {
                rolesSet.add(r.codigo);
            }
        });
        return Array.from(rolesSet).sort();
    }, [rolesData]);

    // Filtrar usuarios por rol
    const usuariosFiltrados = useMemo(() => {
        let filtered;
        if (filtroRol === 'all') {
            filtered = usuarios;
        } else {
            filtered = usuarios.filter((u: any) => u.role === filtroRol);
        }
        return filtered;
    }, [usuarios, filtroRol]);

    // Mutations
    const [createArea] = useCreateAreaMutation();
    const [updateArea] = useUpdateAreaMutation();
    const [deleteArea] = useDeleteAreaMutation();
    const [bulkUpdateProcesos] = useBulkUpdateProcesosMutation();
    const [addResponsable] = useAddResponsableToProcesoMutation();
    const [removeResponsable] = useRemoveResponsableFromProcesoMutation();
    const [updateResponsables] = useUpdateResponsablesProcesoMutation();

    // Filtered data
    const filteredAreas = useMemo(() => {
        return areas.filter(a =>
            a.nombre.toLowerCase().includes(searchAreas.toLowerCase()) ||
            a.descripcion.toLowerCase().includes(searchAreas.toLowerCase())
        );
    }, [areas, searchAreas]);

    if (!esAdmin) {
        return (
            <Box>
                <Alert severity="error">
                    No tiene permisos para acceder a esta página.
                </Alert>
            </Box>
        );
    }

    // ==========================================
    // AREA CRUD LOGIC
    // ==========================================
    const handleOpenAreaDialog = (area?: Area) => {
        if (area) {
            setEditingArea(area);
            setAreaFormData({
                nombre: area.nombre,
                descripcion: area.descripcion || '',
                directorId: area.directorId,
            });
        } else {
            setEditingArea(null);
            setAreaFormData({
                nombre: '',
                descripcion: '',
                directorId: undefined,
            });
        }
        setAreaDialogOpen(true);
    };

    const handleCloseAreaDialog = () => {
        setAreaDialogOpen(false);
        setEditingArea(null);
    };

    const handleOpenAreaDetailDialog = (area: Area) => {
        setSelectedAreaDetail(area);
        setAreaDetailDialogOpen(true);
    };

    const handleCloseAreaDetailDialog = () => {
        setAreaDetailDialogOpen(false);
        setSelectedAreaDetail(null);
    };

    const handleSaveArea = async () => {
        if (!areaFormData.nombre.trim()) {
            showError('El nombre del área es requerido');
            return;
        }

        try {
            if (editingArea) {
                await updateArea({
                    id: editingArea.id,
                    ...areaFormData
                } as any).unwrap();
                showSuccess('Área actualizada correctamente');
            } else {
                await createArea(areaFormData as any).unwrap();
                showSuccess('Área creada correctamente');
            }
            handleCloseAreaDialog();
        } catch (error) {
            showError('Error al guardar el área');
        }
    };

    const handleDeleteArea = async (areaId: string | number) => {
        if (!(await confirmDelete('esta área'))) return;
        try {
            await deleteArea(areaId).unwrap();
            showSuccess('Área eliminada correctamente');
        } catch (error) {
            showError((error as any)?.data?.error || 'Error al eliminar el área');
        }
    };

    const areaColumns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1 },
        {
            field: 'directorNombre',
            headerName: 'Director Asignado',
            flex: 1,
            renderCell: (params) => (
                <Chip
                    avatar={<PersonIcon />}
                    label={params.value || 'Sin asignar'}
                    color={params.value ? 'primary' : 'default'}
                    variant="outlined"
                    size="small"
                />
            ),
        },
        {
            field: 'acciones',
            headerName: 'Acciones',
            width: 150,
            sortable: false,
            renderCell: (params) => (
                <Box>
                    <IconButton size="small" onClick={() => handleOpenAreaDialog(params.row)} color="primary" disabled={!puedeEditarAdmin}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteArea(params.row.id)} color="error" disabled={!puedeEditarAdmin}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // ==========================================
    // ASSIGNMENT LOGIC - MÚLTIPLES RESPONSABLES
    // ==========================================
    // Lista completa de responsables de un proceso en formato { usuarioId, modo } (para enviar al backend)
    const getResponsablesProcesoRaw = (procesoId: string | number): Array<{ usuarioId: number; modo: string }> => {
        const list = getResponsablesProceso(procesoId);
        return list.map((r: any) => ({ usuarioId: r.id, modo: (r.modo || 'proceso') as string }));
    };

    const handleProcessToggle = (procesoId: string | number, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Determinar el modo según el rol del usuario
        const esGerente = selectedUserForAssignment.role === 'gerente';
        const modoActual = esGerente 
            ? (assignmentSubTab === 0 ? 'director' : 'proceso')
            : 'proceso';
        
        const procesoIdStr = String(procesoId);
        const usuarioId = selectedUserForAssignment.id;
        
        // Usar estado local si existe; si no, cargar lista completa desde API (directores + dueños) para no borrar al guardar
        const responsablesActuales = responsablesSeleccionados[procesoIdStr] ?? getResponsablesProcesoRaw(procesoId);
        
        let nuevosResponsables: Array<{ usuarioId: number; modo: string }>;
        if (isChecked) {
            // Agregar el usuario con el modo de la pestaña actual
            const yaExiste = responsablesActuales.find(
                r => r.usuarioId === usuarioId && r.modo === modoActual
            );
            if (!yaExiste) {
                nuevosResponsables = [
                    ...responsablesActuales,
                    { usuarioId, modo: modoActual }
                ];
            } else {
                nuevosResponsables = responsablesActuales;
            }
        } else {
            // Remover solo del modo actual
            nuevosResponsables = responsablesActuales.filter(
                r => !(r.usuarioId === usuarioId && r.modo === modoActual)
            );
        }
        
        // Actualizar el estado local
        setResponsablesSeleccionados({
            ...responsablesSeleccionados,
            [procesoIdStr]: nuevosResponsables
        });
    };

    const handleAreaToggle = (areaId: string | number, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Determinar el modo según el rol del usuario
        const esGerente = selectedUserForAssignment.role === 'gerente';
        const modoActual = esGerente 
            ? (assignmentSubTab === 0 ? 'director' : 'proceso')
            : 'proceso';
        
        // Agregar/remover como responsable de todos los procesos del área
        const procesosDelArea = procesos.filter(p => String(p.areaId) === String(areaId));
        const usuarioId = selectedUserForAssignment.id;
        
        const nuevosResponsables = { ...responsablesSeleccionados };
        
        procesosDelArea.forEach(proceso => {
            const procesoIdStr = String(proceso.id);
            // Usar estado local si existe; si no, lista completa desde API para no borrar otros modos
            const responsablesActuales = nuevosResponsables[procesoIdStr] ?? getResponsablesProcesoRaw(proceso.id);
            
            if (isChecked) {
                // Agregar con el modo de la pestaña actual
                const yaExiste = responsablesActuales.find(
                    r => r.usuarioId === usuarioId && r.modo === modoActual
                );
                if (!yaExiste) {
                    nuevosResponsables[procesoIdStr] = [
                        ...responsablesActuales,
                        { usuarioId, modo: modoActual }
                    ];
                }
            } else {
                // Remover solo del modo actual
                nuevosResponsables[procesoIdStr] = responsablesActuales.filter(
                    r => !(r.usuarioId === usuarioId && r.modo === modoActual)
                );
            }
        });
        
        setResponsablesSeleccionados(nuevosResponsables);
    };

    const saveAssignments = async () => {
        try {
            const promesas = Object.entries(responsablesSeleccionados).map(async ([procesoId, responsables]) => {
                const responsablesConModo = responsables.map(r => ({
                    usuarioId: r.usuarioId,
                    modo: r.modo
                }));
                await updateResponsables({
                    procesoId,
                    responsables: responsablesConModo
                }).unwrap();
            });
            
            await Promise.all(promesas);
            
            // NO limpiar el estado local - se actualizará automáticamente cuando la API refresque
            // El useEffect recargará los datos desde procesosData cuando se invalide el caché
            // setResponsablesSeleccionados({}); // ← COMENTADO
            
            // Refrescar los procesos para obtener los responsables actualizados
            // (esto se hace automáticamente por invalidatesTags)
            
            showSuccess('Asignaciones guardadas correctamente en la base de datos');
        } catch (error: any) {
            const errorMessage = error?.data?.error || error?.message || 'Error al guardar asignaciones';
            showError(errorMessage);
        }
    };

    // Calculate derived states for checkboxes (desde base de datos)
    const getAreaState = (areaId: string | number) => {
        if (!selectedUserForAssignment) return { checked: false, indeterminate: false };
        const areaProcesos = procesos.filter(p => String(p.areaId) === String(areaId));
        if (areaProcesos.length === 0) return { checked: false, indeterminate: false };

        // Verificar si el usuario es responsable de todos los procesos del área
        // Para gerentes con modo "ambos", aparecen en ambas pestañas
        const usuarioId = selectedUserForAssignment.id;
        const allOwned = areaProcesos.every(p => 
            isProcesoResponsable(p.id, usuarioId)
        );
        const someOwned = areaProcesos.some(p => 
            isProcesoResponsable(p.id, usuarioId)
        );

        return {
            checked: allOwned,
            indeterminate: someOwned && !allOwned
        };
    };
    
    // Verificar si un proceso tiene a un usuario como responsable en el modo actual
    const isProcesoResponsable = (procesoId: string | number, usuarioId: number): boolean => {
        // Determinar el modo según el rol del usuario seleccionado
        // Si NO es gerente, siempre usar modo "proceso"
        // Si es gerente, usar el tab seleccionado
        const esGerente = selectedUserForAssignment?.role === 'gerente';
        const modoActual = esGerente 
            ? (assignmentSubTab === 0 ? 'director' : 'proceso')
            : 'proceso'; // Dueños de proceso siempre usan modo "proceso"
        
        // 1. Buscar en el estado local primero (cambios no guardados)
        const responsablesLocal = responsablesSeleccionados[String(procesoId)];
        
        // Si hay cambios locales (incluso si es array vacío), usar esos
        if (responsablesLocal !== undefined) {
            return responsablesLocal.some(r => r.usuarioId === usuarioId && r.modo === modoActual);
        }
        
        // 2. Si no hay cambios locales, buscar en los datos originales de la API
        const proceso = procesos.find(p => String(p.id) === String(procesoId));
        
        if (proceso && (proceso as any).responsablesList) {
            const responsablesApi = (proceso as any).responsablesList || [];
            return responsablesApi.some((r: any) => r.id === usuarioId && r.modo === modoActual);
        }
        return false;
    };
    
    const getModoProceso = (procesoId: string | number, usuarioId: number): string | null => {
        const responsables = responsablesSeleccionados[String(procesoId)] || [];
        const modoActual = assignmentSubTab === 0 ? 'director' : 'proceso';
        const responsable = responsables.find(r => r.usuarioId === usuarioId && r.modo === modoActual);
        return responsable?.modo || null;
    };
    
    // Obtener todos los responsables de un proceso para mostrarlos
    const getResponsablesProceso = (procesoId: string | number) => {
        const proceso = procesos.find(p => String(p.id) === String(procesoId));
        if (!proceso) return [];
        
        // Obtener responsables desde la API (responsablesList) o desde el estado local
        const responsablesApi = (proceso as any).responsablesList || [];
        const responsablesLocal = responsablesSeleccionados[String(procesoId)] || [];
        
        // Combinar ambos y eliminar duplicados, priorizando el estado local
        const responsablesMap = new Map<number, any>();
        
        // Primero agregar los de la API
        responsablesApi.forEach((r: any) => {
            responsablesMap.set(r.id, { ...r, modo: r.modo || null });
        });
        
        // Luego sobrescribir con los del estado local (que tienen prioridad)
        responsablesLocal.forEach(r => {
            const responsableApi = responsablesMap.get(r.usuarioId);
            responsablesMap.set(r.usuarioId, {
                id: r.usuarioId,
                nombre: responsableApi?.nombre || usuarios.find(u => u.id === r.usuarioId)?.nombre || 'Usuario',
                email: responsableApi?.email || usuarios.find(u => u.id === r.usuarioId)?.email,
                modo: r.modo || responsableApi?.modo || null
            });
        });
        
        return Array.from(responsablesMap.values());
    };

    return (
        <AppPageLayout
            title="Configuración de Áreas y Responsables"
            description="Gestione las áreas de la organización y asigne responsables a los procesos."
        >
            {loadingAreas ? (
                <Box sx={{ py: 2 }}>
                    <PageLoadingSkeleton variant="table" tableRows={8} />
                </Box>
            ) : (
            <>
            <Box sx={{ mt: -2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_e, v) => setTabValue(v)}
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
                        icon={<BusinessIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Gestión de Áreas"
                    />
                    <Tab
                        icon={<PersonIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Asignación de Responsabilidades"
                    />
                </Tabs>

                {/* TAB 0: AREAS CRUD */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar áreas..."
                                value={searchAreas}
                                onChange={(e) => setSearchAreas(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAreaDialog()} disabled={!puedeEditarAdmin}>
                                Nueva Área
                            </Button>
                        </Box>
                        <AppDataGrid rows={filteredAreas} columns={areaColumns} getRowId={(row) => row.id} onRowClick={(params) => handleOpenAreaDetailDialog(params.row)} loading={loadingAreas} />
                    </Box>
                </TabPanel>

                {/* TAB 1: ASSIGNMENTS */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Seleccione un usuario para ver y modificar sus responsabilidades por área y proceso.
                        </Alert>

                        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                            <FormControl sx={{ minWidth: 250 }}>
                                <InputLabel>Filtrar por Rol</InputLabel>
                                <Select
                                    value={filtroRol}
                                    onChange={(e) => {
                                        setFiltroRol(e.target.value);
                                        setSelectedUserForAssignment(null);
                                    }}
                                    label="Filtrar por Rol"
                                >
                                    <MenuItem value="all">Todos los roles</MenuItem>
                                    {rolesUnicos.map((rol) => (
                                        <MenuItem key={rol} value={rol}>
                                            {rol.charAt(0).toUpperCase() + rol.slice(1).replace('_', ' ')}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Autocomplete
                                fullWidth
                                options={usuariosFiltrados}
                                getOptionLabel={(option: any) => {
                                    const roleNombre = option.roleNombre || option.role || 'Sin rol';
                                    return `${option.nombre} (${roleNombre})`;
                                }}
                                value={selectedUserForAssignment}
                                onChange={(_e, newValue) => setSelectedUserForAssignment(newValue)}
                                renderInput={(params) => <TextField {...params} label="Seleccione Usuario a Configurar" variant="outlined" />}
                                isOptionEqualToValue={(option: any, value: any) => option.id === value?.id}
                            />
                        </Box>

                        {selectedUserForAssignment && (
                            <Box>
                                {esGerenteGeneral && (
                                    <Paper sx={{ mb: 3 }}>
                                        <Tabs
                                            value={assignmentSubTab}
                                            onChange={(_e, v) => setAssignmentSubTab(v)}
                                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                                        >
                                            <Tab label="Modo Director" />
                                            <Tab label="Modo Proceso" />
                                        </Tabs>
                                    </Paper>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Buscar áreas o procesos..."
                                            value={searchFilterAssignment}
                                            onChange={(e) => setSearchFilterAssignment(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </Box>
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAssignments} disabled={!puedeEditarAdmin}>
                                        Guardar Cambios
                                    </Button>
                                </Box>

                                {areas
                                    .filter(area => {
                                        if (!searchFilterAssignment) return true;
                                        const areaMatches = area.nombre.toLowerCase().includes(searchFilterAssignment.toLowerCase());
                                        const areasProcesses = procesos.filter(p => p.areaId === area.id);
                                        const processMatches = areasProcesses.some(p =>
                                            p.nombre.toLowerCase().includes(searchFilterAssignment.toLowerCase())
                                        );
                                        return areaMatches || processMatches;
                                    })
                                    .map(area => {
                                        const { checked, indeterminate } = getAreaState(area.id);
                                        const areaProcesses = procesos
                                            .filter(p => p.areaId === area.id)
                                            .filter(p => {
                                                if (!searchFilterAssignment) return true;
                                                return p.nombre.toLowerCase().includes(searchFilterAssignment.toLowerCase());
                                            });

                                        return (
                                            <Accordion key={area.id} defaultExpanded={false}>
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <FormControlLabel
                                                        onClick={(e) => e.stopPropagation()}
                                                        control={
                                                            <Checkbox
                                                                checked={checked}
                                                                indeterminate={indeterminate}
                                                                onChange={(e) => handleAreaToggle(area.id, e.target.checked)}
                                                                disabled={!puedeEditarAdmin}
                                                            />
                                                        }
                                                        label={<Typography fontWeight="bold">{area.nombre}</Typography>}
                                                    />
                                                    <Typography variant="caption" sx={{ ml: 2, alignSelf: 'center', color: 'text.secondary' }}>
                                                        {areaProcesses.length} procesos
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    {areaProcesses.length > 0 ? (
                                                        <Box sx={{ pl: 4 }}>
                                                            {areaProcesses.map(proceso => {
                                                                const esGerente = selectedUserForAssignment.role === 'gerente';
                                                                
                                                                // Verificar si el proceso está asignado
                                                                // Para gerentes con modo "ambos", aparece en ambas pestañas
                                                                const isOwned = isProcesoResponsable(proceso.id, selectedUserForAssignment.id);
                                                                const responsablesProceso = getResponsablesProceso(proceso.id);
                                                                
                                                                return (
                                                                    <Box key={proceso.id} sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={isOwned}
                                                                                    onChange={(e) => handleProcessToggle(proceso.id, e.target.checked)}
                                                                                    disabled={!puedeEditarAdmin}
                                                                                />
                                                                            }
                                                                            label={proceso.nombre}
                                                                        />
                                                                        </Box>
                                                                        {/* Mostrar todos los responsables actuales del proceso */}
                                                                        {responsablesProceso.length > 0 && (
                                                                            <Box sx={{ pl: 4, mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                                                                                    Responsables:
                                                                                </Typography>
                                                                                {responsablesProceso.map((resp: any) => {
                                                                                    const modoLabel = resp.modo ? ` (${resp.modo})` : '';
                                                                                    return (
                                                                                        <Chip
                                                                                            key={`${resp.id}-${resp.modo}`}
                                                                                            label={`${resp.nombre}${modoLabel}`}
                                                                                            size="small"
                                                                                            variant="outlined"
                                                                                            color={resp.id === selectedUserForAssignment.id ? "primary" : "default"}
                                                                                            sx={{ fontSize: '0.7rem' }}
                                                                                        />
                                                                                    );
                                                                                })}
                                                                            </Box>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                    ) : (
                                                        <Typography color="text.secondary" variant="body2" sx={{ pl: 4, py: 1 }}>
                                                            No hay procesos que coincidan con la búsqueda.
                                                        </Typography>
                                                    )}
                                                </AccordionDetails>
                                            </Accordion>
                                        );
                                    })}
                            </Box>
                        )}
                    </Box>
                </TabPanel>
            </Box>

            {/* Dialogo Crea/Edita Area */}
            <Dialog open={areaDialogOpen} onClose={handleCloseAreaDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 540 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {editingArea ? 'Editar Área' : 'Nueva Área'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={handleSaveArea} variant="contained" startIcon={<SaveIcon />} disabled={!puedeEditarAdmin}>Guardar</Button>
                            <IconButton onClick={handleCloseAreaDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Nombre del Área *"
                            value={areaFormData.nombre}
                            onChange={(e) => setAreaFormData({ ...areaFormData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={areaFormData.descripcion}
                            onChange={(e) => setAreaFormData({ ...areaFormData, descripcion: e.target.value })}
                            multiline
                            rows={3}
                        />
                        <Autocomplete
                            options={usuarios}
                            getOptionLabel={(option) => `${option.nombre} - ${option.role}`}
                            value={usuarios.find(u => String(u.id) === String(areaFormData.directorId)) || null}
                            onChange={(_e, newValue) => setAreaFormData({ ...areaFormData, directorId: newValue?.id || undefined } as any)}
                            renderInput={(params) => <TextField {...params} label="Director del Área" />}
                            fullWidth
                        />
                    </Box>
                </DialogContent>
            </Dialog>

            {/* MODAL DE DETALLE DEL ÁREA */}
            <Dialog open={areaDetailDialogOpen} onClose={handleCloseAreaDetailDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 560 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Información del Área
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {puedeEditarAdmin && (
                                <Button onClick={() => {
                                    handleOpenAreaDialog(selectedAreaDetail!);
                                    handleCloseAreaDetailDialog();
                                }} variant="contained" startIcon={<EditIcon />}>
                                    Editar
                                </Button>
                            )}
                            <IconButton onClick={handleCloseAreaDetailDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedAreaDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedAreaDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedAreaDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Descripción</Typography>
                                <Typography variant="body1">{selectedAreaDetail.descripcion || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Director Asignado</Typography>
                                <Typography variant="body1">{selectedAreaDetail.directorNombre || '-'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
            </>
            )}
        </AppPageLayout>
    );
}
