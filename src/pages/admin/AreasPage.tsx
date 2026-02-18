
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
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import AppPageLayout from '../../components/layout/AppPageLayout';
import AppDataGrid from '../../components/ui/AppDataGrid';
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
    useUpdateResponsablesProcesoMutation
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
    const { esAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const { data: areas = [], isLoading: loadingAreas } = useGetAreasQuery();
    const { data: usuarios = [] } = useGetUsuariosQuery();
    const { data: procesosData = [] } = useGetProcesosQuery();
    const [procesos, setProcesos] = useState<Proceso[]>([]);

    // Estado para rastrear responsables seleccionados localmente (antes de guardar)
    const [responsablesSeleccionados, setResponsablesSeleccionados] = useState<Record<string, number[]>>({});
    
    // Cargar responsables de todos los procesos al inicio
    useEffect(() => {
        if (procesosData.length > 0) {
            setProcesos(procesosData);
            // Inicializar responsablesSeleccionados con los responsables existentes
            const responsablesIniciales: Record<string, number[]> = {};
            procesosData.forEach((p: any) => {
                if (p.responsablesList && p.responsablesList.length > 0) {
                    responsablesIniciales[String(p.id)] = p.responsablesList.map((r: any) => r.id);
                }
            });
            setResponsablesSeleccionados(responsablesIniciales);
        }
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
    const [filtroRol, setFiltroRol] = useState<string>('all');

    // Detectar si el usuario seleccionado es Gerente General
    const esGerenteGeneral = selectedUserForAssignment?.role === 'gerente_general';

    const getGerenteStorageKey = (modo: 'director' | 'proceso') => {
        if (!selectedUserForAssignment) return `gg_${modo}_unknown`;
        return `gg_${modo}_${selectedUserForAssignment.id}`;
    };

    // Filtrar usuarios por rol
    const usuariosFiltrados = useMemo(() => {
        if (filtroRol === 'all') return usuarios;
        return usuarios.filter(u => u.role === filtroRol);
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
            console.error('Error saving area:', error);
            showError('Error al guardar el área');
        }
    };

    const handleDeleteArea = async (areaId: string | number) => {
        if (window.confirm('¿Está seguro de eliminar esta área?')) {
            try {
                await deleteArea(areaId).unwrap();
                showSuccess('Área eliminada correctamente');
            } catch (error) {
                console.error('Error deleting area:', error);
                showError('Error al eliminar el área');
            }
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
                    <IconButton size="small" onClick={() => handleOpenAreaDialog(params.row)} color="primary">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteArea(params.row.id)} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // ==========================================
    // ASSIGNMENT LOGIC - MÚLTIPLES RESPONSABLES
    // ==========================================
    const handleProcessToggle = (procesoId: string | number, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Para Gerente General, guardar asignaciones separadas según el modo (localStorage)
        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const currentAssignments = currentData.procesos || [];

            if (isChecked) {
                if (!currentAssignments.includes(String(procesoId))) {
                    currentAssignments.push(String(procesoId));
                }
            } else {
                const index = currentAssignments.indexOf(String(procesoId));
                if (index > -1) {
                    currentAssignments.splice(index, 1);
                }
            }

            currentData.procesos = currentAssignments;
            localStorage.setItem(storageKey, JSON.stringify(currentData));
            // Force re-render
            setProcesos([...procesos]);
        } else {
            // Usuario normal - usar sistema de múltiples responsables
            const procesoIdStr = String(procesoId);
            const usuarioId = selectedUserForAssignment.id;
            
            // Obtener responsables actuales del proceso (o inicializar)
            const responsablesActuales = responsablesSeleccionados[procesoIdStr] || [];
            
            let nuevosResponsables: number[];
            if (isChecked) {
                // Agregar el usuario si no está ya en la lista
                if (!responsablesActuales.includes(usuarioId)) {
                    nuevosResponsables = [...responsablesActuales, usuarioId];
                } else {
                    nuevosResponsables = responsablesActuales;
                }
            } else {
                // Remover el usuario de la lista
                nuevosResponsables = responsablesActuales.filter(id => id !== usuarioId);
            }
            
            // Actualizar el estado local
            setResponsablesSeleccionados({
                ...responsablesSeleccionados,
                [procesoIdStr]: nuevosResponsables
            });
        }
    };

    const handleAreaToggle = (areaId: string | number, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Para Gerente General, guardar el área directamente
        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const currentAreas = currentData.areas || [];

            if (isChecked) {
                if (!currentAreas.includes(String(areaId))) {
                    currentAreas.push(String(areaId));
                }
            } else {
                const index = currentAreas.indexOf(String(areaId));
                if (index > -1) {
                    currentAreas.splice(index, 1);
                }
            }

            currentData.areas = currentAreas;
            localStorage.setItem(storageKey, JSON.stringify(currentData));
            // Force re-render
            setProcesos([...procesos]);
        } else {
            // Usuario normal - agregar/remover como responsable de todos los procesos del área
            const procesosDelArea = procesos.filter(p => String(p.areaId) === String(areaId));
            const usuarioId = selectedUserForAssignment.id;
            
            const nuevosResponsables = { ...responsablesSeleccionados };
            
            procesosDelArea.forEach(proceso => {
                const procesoIdStr = String(proceso.id);
                const responsablesActuales = nuevosResponsables[procesoIdStr] || [];
                
                if (isChecked) {
                    // Agregar el usuario si no está ya en la lista
                    if (!responsablesActuales.includes(usuarioId)) {
                        nuevosResponsables[procesoIdStr] = [...responsablesActuales, usuarioId];
                    }
                } else {
                    // Remover el usuario de la lista
                    nuevosResponsables[procesoIdStr] = responsablesActuales.filter(id => id !== usuarioId);
                }
            });
            
            setResponsablesSeleccionados(nuevosResponsables);
        }
    };

    const saveAssignments = async () => {
        try {
            // Para Gerente General, las asignaciones ya están en localStorage
            if (esGerenteGeneral) {
                showSuccess('Asignaciones guardadas correctamente (localStorage)');
                return;
            }
            
            // Para usuarios normales, usar el sistema de múltiples responsables
            // Guardar responsables para cada proceso que tenga cambios
            const promesas = Object.entries(responsablesSeleccionados).map(async ([procesoId, responsablesIds]) => {
                await updateResponsables({
                    procesoId,
                    responsablesIds
                }).unwrap();
            });
            
            await Promise.all(promesas);
            
            // Limpiar el estado local después de guardar
            setResponsablesSeleccionados({});
            
            // Refrescar los procesos para obtener los responsables actualizados
            // (esto se hace automáticamente por invalidatesTags)
            
            showSuccess('Asignaciones guardadas correctamente');
        } catch (error) {
            console.error('Error al guardar asignaciones:', error);
            showError('Error al guardar asignaciones');
        }
    };

    // Calculate derived states for checkboxes
    const getAreaState = (areaId: string | number) => {
        if (!selectedUserForAssignment) return { checked: false, indeterminate: false };
        const areaProcesos = procesos.filter(p => String(p.areaId) === String(areaId));
        if (areaProcesos.length === 0) return { checked: false, indeterminate: false };

        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const areasAsignadas = currentData.areas || [];
            const procesosAsignados = currentData.procesos || [];

            // Si el área está asignada directamente, todos los procesos están checked
            if (areasAsignadas.includes(String(areaId))) {
                return { checked: true, indeterminate: false };
            }

            // Si no, verificar procesos individuales
            const allOwned = areaProcesos.every(p => procesosAsignados.includes(String(p.id)));
            const someOwned = areaProcesos.some(p => procesosAsignados.includes(String(p.id)));
            return {
                checked: allOwned,
                indeterminate: someOwned && !allOwned
            };
        }

        // Para usuarios normales, verificar si están en la lista de responsables
        const usuarioId = selectedUserForAssignment.id;
        const allOwned = areaProcesos.every(p => {
            const responsables = responsablesSeleccionados[String(p.id)] || [];
            return responsables.includes(usuarioId);
        });
        const someOwned = areaProcesos.some(p => {
            const responsables = responsablesSeleccionados[String(p.id)] || [];
            return responsables.includes(usuarioId);
        });

        return {
            checked: allOwned,
            indeterminate: someOwned && !allOwned
        };
    };
    
    // Verificar si un proceso tiene a un usuario como responsable
    const isProcesoResponsable = (procesoId: string | number, usuarioId: number) => {
        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const areasAsignadas = currentData.areas || [];
            const procesosAsignados = currentData.procesos || [];
            const proceso = procesos.find(p => String(p.id) === String(procesoId));
            return procesosAsignados.includes(String(procesoId)) || (proceso && areasAsignadas.includes(String(proceso.areaId)));
        }
        
        const responsables = responsablesSeleccionados[String(procesoId)] || [];
        return responsables.includes(usuarioId);
    };
    
    // Obtener todos los responsables de un proceso para mostrarlos
    const getResponsablesProceso = (procesoId: string | number) => {
        const proceso = procesos.find(p => String(p.id) === String(procesoId));
        if (!proceso) return [];
        
        // Obtener responsables desde la API (responsablesList) o desde el estado local
        const responsablesApi = (proceso as any).responsablesList || [];
        const responsablesLocal = responsablesSeleccionados[String(procesoId)] || [];
        
        // Combinar ambos y eliminar duplicados
        const todosResponsables = new Set([...responsablesApi.map((r: any) => r.id), ...responsablesLocal]);
        return Array.from(todosResponsables).map(id => {
            const responsableApi = responsablesApi.find((r: any) => r.id === id);
            if (responsableApi) return responsableApi;
            const usuario = usuarios.find(u => u.id === id);
            return usuario ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email, role: usuario.role } : null;
        }).filter(Boolean);
    };

    return (
        <AppPageLayout
            title="Configuración de Áreas y Responsables"
            description="Gestione las áreas de la organización y asigne responsables a los procesos."
        >
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAreaDialog()}>
                                Nueva Área
                            </Button>
                        </Box>
                        <AppDataGrid rows={filteredAreas} columns={areaColumns} getRowId={(row) => row.id} onRowClick={(params) => handleOpenAreaDetailDialog(params.row)} />
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
                                    <MenuItem value="admin">Administrador</MenuItem>
                                    <MenuItem value="gerente_general">Gerente General</MenuItem>
                                    <MenuItem value="supervisor">Supervisor de Riesgos</MenuItem>
                                    <MenuItem value="dueño_procesos">Dueño de Procesos</MenuItem>
                                </Select>
                            </FormControl>

                            <Autocomplete
                                fullWidth
                                options={usuariosFiltrados}
                                getOptionLabel={(option) => `${option.nombre} (${option.role})`}
                                value={selectedUserForAssignment}
                                onChange={(_e, newValue) => setSelectedUserForAssignment(newValue)}
                                renderInput={(params) => <TextField {...params} label="Seleccione Usuario a Configurar" variant="outlined" />}
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
                                    <Button variant="contained" startIcon={<SaveIcon />} onClick={saveAssignments}>
                                        Guardar Cambios
                                    </Button>
                                </Box>

                                {!esGerenteGeneral && (
                                    <Typography variant="h6" sx={{ mb: 2 }}>Áreas y Procesos</Typography>
                                )}
                                {esGerenteGeneral && assignmentSubTab === 0 && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        <strong>Modo Director:</strong> Procesos visibles cuando el usuario seleccione "Dashboard Gerencial".
                                    </Alert>
                                )}
                                {esGerenteGeneral && assignmentSubTab === 1 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        <strong>Modo Proceso:</strong> Procesos visibles cuando el usuario seleccione "Vista de Procesos".
                                    </Alert>
                                )}

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
                                                                const isOwned = isProcesoResponsable(proceso.id, selectedUserForAssignment.id);
                                                                const responsablesProceso = getResponsablesProceso(proceso.id);
                                                                
                                                                return (
                                                                    <Box key={proceso.id} sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={isOwned}
                                                                                    onChange={(e) => handleProcessToggle(proceso.id, e.target.checked)}
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
                                                                                {responsablesProceso.map((resp: any) => (
                                                                            <Chip
                                                                                        key={resp.id}
                                                                                        label={resp.nombre}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                        color={resp.id === selectedUserForAssignment.id ? "primary" : "default"}
                                                                                        sx={{ fontSize: '0.7rem' }}
                                                                            />
                                                                                ))}
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
            <Dialog open={areaDialogOpen} onClose={handleCloseAreaDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingArea ? 'Editar Área' : 'Nueva Área'}</DialogTitle>
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
                <DialogActions>
                    <Button onClick={handleCloseAreaDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSaveArea} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DEL ÁREA */}
            <Dialog open={areaDetailDialogOpen} onClose={handleCloseAreaDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Área</DialogTitle>
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
                <DialogActions>
                    <Button onClick={handleCloseAreaDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenAreaDialog(selectedAreaDetail!);
                        handleCloseAreaDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </AppPageLayout>
    );
}
