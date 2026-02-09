
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
import { useGetAreasQuery, useGetUsuariosQuery, useGetProcesosQuery, useBulkUpdateProcesosMutation, useGetAsignacionesGerenteQuery, useSaveAsignacionesGerenteMutation } from '../../api/services/riesgosApi';
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
    const { data: areasData = [] } = useGetAreasQuery(undefined, { skip: !esAdmin });
    const { data: usuariosData = [] } = useGetUsuariosQuery(undefined, { skip: !esAdmin });
    const { data: procesosData = [] } = useGetProcesosQuery(undefined, { skip: !esAdmin });
    const [tabValue, setTabValue] = useState(0);

    const [bulkUpdateProcesos] = useBulkUpdateProcesosMutation();
    const [saveAsignacionesGerente] = useSaveAsignacionesGerenteMutation();
    const areas = Array.isArray(areasData) ? areasData : [];
    const usuarios = Array.isArray(usuariosData) ? usuariosData : [];
    const procesos = Array.isArray(procesosData) ? procesosData : [];
    const [searchAreas, setSearchAreas] = useState('');
    const [searchAssignments, setSearchAssignments] = useState('');

    // Area CRUD States
    const [areaDialogOpen, setAreaDialogOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [isViewArea, setIsViewArea] = useState(false);
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
    const modoGerente = assignmentSubTab === 0 ? 'director' : 'proceso';
    const { data: asignacionesGerente } = useGetAsignacionesGerenteQuery(
        { usuarioId: selectedUserForAssignment?.id ?? '', modo: modoGerente },
        { skip: !selectedUserForAssignment?.id || !esGerenteGeneral }
    );

    // Asignaciones Gerente General: estado local sincronizado con API
    const [pendingGerenteDirector, setPendingGerenteDirector] = useState<{ areaIds: string[]; procesoIds: string[] }>({ areaIds: [], procesoIds: [] });
    const [pendingGerenteProceso, setPendingGerenteProceso] = useState<{ areaIds: string[]; procesoIds: string[] }>({ areaIds: [], procesoIds: [] });
    const pendingGerente = assignmentSubTab === 0 ? pendingGerenteDirector : pendingGerenteProceso;
    const setPendingGerente = assignmentSubTab === 0 ? setPendingGerenteDirector : setPendingGerenteProceso;

    useEffect(() => {
        if (esGerenteGeneral && asignacionesGerente) {
            const areaIds = (asignacionesGerente.areaIds ?? []).map(String).filter(Boolean);
            const procesoIds = (asignacionesGerente.procesoIds ?? []).map(String).filter(Boolean);
            const data = { areaIds, procesoIds };
            if (assignmentSubTab === 0) setPendingGerenteDirector(data);
            else setPendingGerenteProceso(data);
        }
    }, [esGerenteGeneral, asignacionesGerente, assignmentSubTab]);
    
    // Filtrar usuarios por rol (incluir dueno_procesos cuando se busca dueño_procesos)
    const usuariosFiltrados = useMemo(() => {
        if (filtroRol === 'all') return usuarios;
        return usuarios.filter(u => u.role === filtroRol || (filtroRol === 'dueño_procesos' && u.role === 'dueno_procesos'));
    }, [usuarios, filtroRol]);


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
    const handleOpenAreaDialog = (area?: Area, mode: 'view' | 'edit' = 'edit') => {
        if (area) {
            setEditingArea(area);
            setAreaFormData({
                nombre: area.nombre,
                descripcion: area.descripcion || '',
                directorId: area.directorId,
            });
            setIsViewArea(mode === 'view');
        } else {
            setEditingArea(null);
            setIsViewArea(false);
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
        setIsViewArea(false);
    };

    const handleSaveArea = () => {
        showError('La gestión de áreas (crear/editar) no está disponible en la API actual.');
    };

    const handleDeleteArea = () => {
        showError('La eliminación de áreas no está disponible en la API actual.');
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
    // ASSIGNMENT LOGIC (sin localStorage - datos desde API)
    // ==========================================
    const [pendingProcesos, setPendingProcesos] = useState<Proceso[]>([]);
    useEffect(() => { setPendingProcesos(procesos); }, [procesos]);

    const procesosParaAsignacion = pendingProcesos.length ? pendingProcesos : procesos;

    const handleProcessToggle = (procesoId: string, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;
        if (esGerenteGeneral) {
            const id = String(procesoId);
            setPendingGerente(prev => ({
                ...prev,
                procesoIds: isChecked ? [...prev.procesoIds, id] : prev.procesoIds.filter(x => x !== id),
            }));
            return;
        }
        const updated = procesosParaAsignacion.map(p =>
            p.id === procesoId
                ? { ...p, responsableId: isChecked ? selectedUserForAssignment.id : '', responsableNombre: isChecked ? selectedUserForAssignment.nombre : '' }
                : p
        );
        setPendingProcesos(updated);
    };

    const handleAreaToggle = (areaId: string, isChecked: boolean) => {
        if (!selectedUserForAssignment) return;
        if (esGerenteGeneral) {
            const id = String(areaId);
            setPendingGerente(prev => ({
                ...prev,
                areaIds: isChecked ? [...prev.areaIds, id] : prev.areaIds.filter(x => x !== id),
            }));
            return;
        }
        const updated = procesosParaAsignacion.map(p =>
            p.areaId === areaId
                ? { ...p, responsableId: isChecked ? selectedUserForAssignment.id : '', responsableNombre: isChecked ? selectedUserForAssignment.nombre : '' }
                : p
        );
        setPendingProcesos(updated);
    };

    const saveAssignments = async () => {
        if (esGerenteGeneral && selectedUserForAssignment) {
            try {
                await saveAsignacionesGerente({
                    usuarioId: String(selectedUserForAssignment.id),
                    modo: modoGerente,
                    areaIds: pendingGerente.areaIds.map(String),
                    procesoIds: pendingGerente.procesoIds.map(String),
                }).unwrap();
                showSuccess('Asignaciones de Gerente General guardadas correctamente');
            } catch {
                showError('Error al guardar asignaciones');
            }
            return;
        }
        try {
            await bulkUpdateProcesos(procesosParaAsignacion).unwrap();
            showSuccess('Asignaciones guardadas correctamente');
        } catch {
            showError('Error al guardar asignaciones');
        }
    };

    const getAreaState = (areaId: string) => {
        if (!selectedUserForAssignment) return { checked: false, indeterminate: false };
        if (esGerenteGeneral) {
            const areaProcesos = procesos.filter(p => String(p.areaId) === String(areaId));
            const checked = pendingGerente.areaIds.includes(String(areaId));
            const someProcesosOwned = areaProcesos.some(p => pendingGerente.procesoIds.includes(String(p.id)));
            const indeterminate = someProcesosOwned && !checked;
            return { checked, indeterminate };
        }
        const areaProcesos = procesosParaAsignacion.filter(p => p.areaId === areaId);
        if (areaProcesos.length === 0) return { checked: false, indeterminate: false };
        const allOwned = areaProcesos.every(p => p.responsableId === selectedUserForAssignment.id);
        const someOwned = areaProcesos.some(p => p.responsableId === selectedUserForAssignment.id);
        return { checked: allOwned, indeterminate: someOwned && !allOwned };
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenAreaDialog(undefined, 'edit')}>
                                Nueva Área
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredAreas}
                            columns={areaColumns}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenAreaDialog(params.row, 'view')}
                        />
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
                                        const areasProcesses = procesosParaAsignacion.filter(p => p.areaId === area.id);
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
                                                                const isOwned = esGerenteGeneral
                                                                    ? pendingGerente.procesoIds.includes(String(proceso.id)) || pendingGerente.areaIds.includes(String(proceso.areaId))
                                                                    : proceso.responsableId === selectedUserForAssignment.id;
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
                <DialogTitle>
                    {editingArea
                        ? (isViewArea ? 'Ver Área' : 'Editar Área')
                        : 'Nueva Área'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Nombre del Área *"
                            value={areaFormData.nombre}
                            onChange={(e) => setAreaFormData({ ...areaFormData, nombre: e.target.value })}
                            disabled={isViewArea}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Descripción"
                            value={areaFormData.descripcion}
                            onChange={(e) => setAreaFormData({ ...areaFormData, descripcion: e.target.value })}
                            multiline
                            rows={3}
                            disabled={isViewArea}
                        />
                        <Autocomplete
                            options={usuarios}
                            getOptionLabel={(option) => `${option.nombre} - ${option.role}`}
                            value={usuarios.find(u => u.id === areaFormData.directorId) || null}
                            onChange={(_e, newValue) => setAreaFormData({ ...areaFormData, directorId: newValue?.id || undefined })}
                            renderInput={(params) => <TextField {...params} label="Director del Área" />}
                            fullWidth
                            disabled={isViewArea}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAreaDialog} startIcon={<CancelIcon />}>
                        {isViewArea ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewArea && (
                        <Button onClick={handleSaveArea} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
