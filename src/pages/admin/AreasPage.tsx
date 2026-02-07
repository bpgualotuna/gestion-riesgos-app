
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
import AppDataGrid from '../../components/ui/AppDataGrid';
import type { GridColDef } from '@mui/x-data-grid';
import type { Area, CreateAreaDto, Usuario, Proceso } from '../../types';
import {
    getMockAreas, updateMockAreas,
    getMockUsuarios, getMockProcesos
} from '../../api/services/mockData';
import { useBulkUpdateProcesosMutation } from '../../api/services/riesgosApi';
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
    const [tabValue, setTabValue] = useState(0);

    // Data States
    const [areas, setAreas] = useState<Area[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [procesos, setProcesos] = useState<Proceso[]>([]);
    const [searchAreas, setSearchAreas] = useState('');
    const [searchAssignments, setSearchAssignments] = useState('');

    // Area CRUD States
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setAreas(getMockAreas());
        setUsuarios(getMockUsuarios());
        setProcesos(getMockProcesos());
    };

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

    const handleSaveArea = () => {
        if (!areaFormData.nombre.trim()) {
            showError('El nombre del área es requerido');
            return;
        }

        if (editingArea) {
            const updatedList = areas.map((a) =>
                a.id === editingArea.id
                    ? {
                        ...a,
                        ...areaFormData,
                        directorNombre: usuarios.find((u) => u.id === areaFormData.directorId)?.nombre,
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            );
            setAreas(updatedList);
            updateMockAreas(updatedList);
            showSuccess('Área actualizada correctamente');
        } else {
            const newArea: Area = {
                id: `area-${Date.now()}`,
                ...areaFormData,
                directorNombre: usuarios.find((u) => u.id === areaFormData.directorId)?.nombre,
                activo: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const updatedList = [...areas, newArea];
            setAreas(updatedList);
            updateMockAreas(updatedList);
            showSuccess('Área creada correctamente');
        }
        handleCloseAreaDialog();
    };

    const handleDeleteArea = (areaId: string) => {
        if (window.confirm('¿Está seguro de eliminar esta área?')) {
            const updatedAreas = areas.filter((a) => a.id !== areaId);
            setAreas(updatedAreas);
            updateMockAreas(updatedAreas);
            showSuccess('Área eliminada correctamente');
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
    // ASSIGNMENT LOGIC
    // ==========================================
    const handleProcessToggle = (procesoId: string, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Para Gerente General, guardar asignaciones separadas según el modo
        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const currentAssignments = currentData.procesos || [];
            
            if (isChecked) {
                if (!currentAssignments.includes(procesoId)) {
                    currentAssignments.push(procesoId);
                }
            } else {
                const index = currentAssignments.indexOf(procesoId);
                if (index > -1) {
                    currentAssignments.splice(index, 1);
                }
            }
            
            currentData.procesos = currentAssignments;
            localStorage.setItem(storageKey, JSON.stringify(currentData));
            // Force re-render
            setProcesos([...procesos]);
        } else {
            // Usuario normal - actualizar responsableId
            const updatedProcesos = procesos.map(p => {
                if (p.id === procesoId) {
                    return {
                        ...p,
                        responsableId: isChecked ? selectedUserForAssignment.id : '',
                        responsableNombre: isChecked ? selectedUserForAssignment.nombre : ''
                    };
                }
                return p;
            });
            setProcesos(updatedProcesos);
        }
    };

    const handleAreaToggle = (areaId: string, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;

        // Para Gerente General, guardar el área directamente
        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const currentAreas = currentData.areas || [];
            
            if (isChecked) {
                if (!currentAreas.includes(areaId)) {
                    currentAreas.push(areaId);
                }
            } else {
                const index = currentAreas.indexOf(areaId);
                if (index > -1) {
                    currentAreas.splice(index, 1);
                }
            }
            
            currentData.areas = currentAreas;
            localStorage.setItem(storageKey, JSON.stringify(currentData));
            // Force re-render
            setProcesos([...procesos]);
        } else {
            // Usuario normal - actualizar responsableId
            const updatedProcesos = procesos.map(p => {
                if (p.areaId === areaId) {
                    return {
                        ...p,
                        responsableId: isChecked ? selectedUserForAssignment.id : '',
                        responsableNombre: isChecked ? selectedUserForAssignment.nombre : ''
                    };
                }
                return p;
            });
            setProcesos(updatedProcesos);
        }
    };

    const [bulkUpdateProcesos] = useBulkUpdateProcesosMutation();

    const saveAssignments = async () => {
        try {
            // Para Gerente General, las asignaciones ya están en localStorage
            if (!esGerenteGeneral) {
                await bulkUpdateProcesos(procesos).unwrap();
            }
            showSuccess('Asignaciones guardadas correctamente');
        } catch (error) {
            showError('Error al guardar asignaciones');
        }
    };

    // Calculate derived states for checkboxes
    const getAreaState = (areaId: string) => {
        if (!selectedUserForAssignment) return { checked: false, indeterminate: false };
        const areaProcesos = procesos.filter(p => p.areaId === areaId);
        if (areaProcesos.length === 0) return { checked: false, indeterminate: false };

        if (esGerenteGeneral) {
            const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
            const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
            const areasAsignadas = currentData.areas || [];
            const procesosAsignados = currentData.procesos || [];
            
            // Si el área está asignada directamente, todos los procesos están checked
            if (areasAsignadas.includes(areaId)) {
                return { checked: true, indeterminate: false };
            }
            
            // Si no, verificar procesos individuales
            const allOwned = areaProcesos.every(p => procesosAsignados.includes(p.id));
            const someOwned = areaProcesos.some(p => procesosAsignados.includes(p.id));
            return {
                checked: allOwned,
                indeterminate: someOwned && !allOwned
            };
        }

        const allOwned = areaProcesos.every(p => p.responsableId === selectedUserForAssignment.id);
        const someOwned = areaProcesos.some(p => p.responsableId === selectedUserForAssignment.id);

        return {
            checked: allOwned,
            indeterminate: someOwned && !allOwned
        };
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Configuración de Áreas y Responsables
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Gestione las áreas de la organización y asigne responsables a los procesos.
                </Typography>
            </Box>

            <Paper sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
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
                        <AppDataGrid rows={filteredAreas} columns={areaColumns} getRowId={(row) => row.id} />
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
                                                                let isOwned;
                                                                if (esGerenteGeneral) {
                                                                    const storageKey = getGerenteStorageKey(assignmentSubTab === 0 ? 'director' : 'proceso');
                                                                    const currentData = JSON.parse(localStorage.getItem(storageKey) || '{"areas":[], "procesos": []}');
                                                                    const areasAsignadas = currentData.areas || [];
                                                                    const procesosAsignados = currentData.procesos || [];
                                                                    // El proceso está asignado si está en la lista de procesos O si su área está asignada
                                                                    isOwned = procesosAsignados.includes(proceso.id) || areasAsignadas.includes(proceso.areaId);
                                                                } else {
                                                                    isOwned = proceso.responsableId === selectedUserForAssignment.id;
                                                                }
                                                                return (
                                                                    <Box key={proceso.id} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={isOwned}
                                                                                    onChange={(e) => handleProcessToggle(proceso.id, e.target.checked)}
                                                                                />
                                                                            }
                                                                            label={proceso.nombre}
                                                                        />
                                                                        {!isOwned && proceso.responsableNombre && (
                                                                            <Chip
                                                                                label={`Actual: ${proceso.responsableNombre}`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ ml: 2, fontSize: '0.7rem' }}
                                                                            />
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
            </Paper>

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
                            value={usuarios.find(u => u.id === areaFormData.directorId) || null}
                            onChange={(_e, newValue) => setAreaFormData({ ...areaFormData, directorId: newValue?.id || undefined })}
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
        </Box>
    );
}
