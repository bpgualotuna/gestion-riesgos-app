
import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    Autocomplete,
    Tabs,
    Tab,
    Paper,
    InputAdornment
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    People as PeopleIcon,
    Badge as BadgeIcon,
    Business as BusinessIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Usuario, Cargo, Gerencia } from '../../types';
import { getMockUsuarios, updateMockUsuarios, getMockCargos, getMockGerencias } from '../../api/services/mockData';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';

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
            id={`usuario-tabpanel-${index}`}
            aria-labelledby={`usuario-tab-${index}`}
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

export default function UsuariosPage() {
    const { esAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [currentTab, setCurrentTab] = useState(0);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [gerencias, setGerencias] = useState<Gerencia[]>([]);
    const [searchUsuarios, setSearchUsuarios] = useState('');
    const [searchCargos, setSearchCargos] = useState('');
    const [searchGerencias, setSearchGerencias] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [isViewUsuario, setIsViewUsuario] = useState(false);
    const [cargoDialogOpen, setCargoDialogOpen] = useState(false);
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
    const [isViewCargo, setIsViewCargo] = useState(false);
    const [gerenciaDialogOpen, setGerenciaDialogOpen] = useState(false);
    const [editingGerencia, setEditingGerencia] = useState<Gerencia | null>(null);
    const [isViewGerencia, setIsViewGerencia] = useState(false);
    const [formData, setFormData] = useState<Partial<Usuario>>({
        nombre: '',
        email: '',
        role: 'analyst',
        activo: true,
        cargoId: '',
    });
    const [cargoFormData, setCargoFormData] = useState<any>({
        nombre: '',
        descripcion: '',
    });
    const [gerenciaFormData, setGerenciaFormData] = useState<any>({
        nombre: '',
        sigla: '',
        subdivision: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setUsuarios(getMockUsuarios());
        setCargos(getMockCargos());
        setGerencias(getMockGerencias());
    };

    // Filtered data
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u =>
            u.nombre.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(searchUsuarios.toLowerCase())) ||
            (u.cargoNombre && u.cargoNombre.toLowerCase().includes(searchUsuarios.toLowerCase()))
        );
    }, [usuarios, searchUsuarios]);

    const filteredCargos = useMemo(() => {
        return cargos.filter(c =>
            c.nombre.toLowerCase().includes(searchCargos.toLowerCase()) ||
            c.descripcion.toLowerCase().includes(searchCargos.toLowerCase())
        );
    }, [cargos, searchCargos]);

    const filteredGerencias = useMemo(() => {
        return gerencias.filter(g =>
            g.nombre.toLowerCase().includes(searchGerencias.toLowerCase()) ||
            g.sigla.toLowerCase().includes(searchGerencias.toLowerCase()) ||
            g.subdivision.toLowerCase().includes(searchGerencias.toLowerCase())
        );
    }, [gerencias, searchGerencias]);

    if (!esAdmin) {
        return (
            <Box>
                <Alert severity="error">
                    No tiene permisos para acceder a esta página.
                </Alert>
            </Box>
        );
    }

    const handleOpenDialog = (usuario?: Usuario, mode: 'view' | 'edit' = 'edit') => {
        if (usuario) {
            setEditingUsuario(usuario);
            setFormData({
                nombre: usuario.nombre,
                email: usuario.email || '',
                role: usuario.role,
                activo: usuario.activo,
                cargoId: usuario.cargoId || '',
            });
            setIsViewUsuario(mode === 'view');
        } else {
            setEditingUsuario(null);
            setIsViewUsuario(false);
            setFormData({
                nombre: '',
                email: '',
                role: 'analyst',
                activo: true,
                cargoId: '',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingUsuario(null);
        setIsViewUsuario(false);
    };

    const handleOpenCargoDialog = (cargo?: Cargo, mode: 'view' | 'edit' = 'edit') => {
        if (cargo) {
            setEditingCargo(cargo);
            setCargoFormData({
                nombre: cargo.nombre,
                descripcion: cargo.descripcion || '',
            });
            setIsViewCargo(mode === 'view');
        } else {
            setEditingCargo(null);
            setIsViewCargo(false);
            setCargoFormData({
                nombre: '',
                descripcion: '',
            });
        }
        setCargoDialogOpen(true);
    };

    const handleCloseCargoDialog = () => {
        setCargoDialogOpen(false);
        setEditingCargo(null);
        setIsViewCargo(false);
    };

    const handleOpenGerenciaDialog = (gerencia?: Gerencia, mode: 'view' | 'edit' = 'edit') => {
        if (gerencia) {
            setEditingGerencia(gerencia);
            setGerenciaFormData({
                nombre: gerencia.nombre,
                sigla: gerencia.sigla || '',
                subdivision: gerencia.subdivision || '',
            });
            setIsViewGerencia(mode === 'view');
        } else {
            setEditingGerencia(null);
            setIsViewGerencia(false);
            setGerenciaFormData({
                nombre: '',
                sigla: '',
                subdivision: '',
            });
        }
        setGerenciaDialogOpen(true);
    };

    const handleCloseGerenciaDialog = () => {
        setGerenciaDialogOpen(false);
        setEditingGerencia(null);
        setIsViewGerencia(false);
    };

    const handleSaveGerencia = () => {
        if (!gerenciaFormData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        let updatedGerencias = [...gerencias];

        if (editingGerencia) {
            updatedGerencias = updatedGerencias.map(g =>
                g.id === editingGerencia.id ? { ...g, ...gerenciaFormData } : g
            );
            showSuccess('Gerencia actualizada correctamente');
        } else {
            const newGerencia: Gerencia = {
                id: `gerencia-${Date.now()}`,
                ...gerenciaFormData,
            };
            updatedGerencias.push(newGerencia);
            showSuccess('Gerencia creada correctamente');
        }

        localStorage.setItem('catalog_gerencias_v2', JSON.stringify(updatedGerencias));
        setGerencias(updatedGerencias);
        handleCloseGerenciaDialog();
    };

    const handleDeleteGerencia = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta gerencia?')) {
            const updatedGerencias = gerencias.filter(g => g.id !== id);
            localStorage.setItem('catalog_gerencias_v2', JSON.stringify(updatedGerencias));
            setGerencias(updatedGerencias);
            showSuccess('Gerencia eliminada correctamente');
        }
    };

    const handleSaveCargo = () => {
        if (!cargoFormData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        let updatedCargos = [...cargos];

        if (editingCargo) {
            updatedCargos = updatedCargos.map(c =>
                c.id === editingCargo.id ? { ...c, ...cargoFormData } : c
            );
            showSuccess('Cargo actualizado correctamente');
        } else {
            const newCargo: Cargo = {
                id: `cargo-${Date.now()}`,
                ...cargoFormData,
            };
            updatedCargos.push(newCargo);
            showSuccess('Cargo creado correctamente');
        }

        localStorage.setItem('catalog_cargos', JSON.stringify(updatedCargos));
        setCargos(updatedCargos);
        handleCloseCargoDialog();
    };

    const handleDeleteCargo = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este cargo?')) {
            const updatedCargos = cargos.filter(c => c.id !== id);
            localStorage.setItem('catalog_cargos', JSON.stringify(updatedCargos));
            setCargos(updatedCargos);
            showSuccess('Cargo eliminado correctamente');
        }
    };

    const handleSave = () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        let updatedUsuarios = [...usuarios];

        // Find cargo name
        const selectedCargo = cargos.find(c => c.id === formData.cargoId);
        const cargoNombre = selectedCargo ? selectedCargo.nombre : undefined;

        if (editingUsuario) {
            updatedUsuarios = updatedUsuarios.map(u =>
                u.id === editingUsuario.id ? {
                    ...u,
                    ...formData,
                    cargoNombre
                } as Usuario : u
            );
            showSuccess('Usuario actualizado correctamente');
        } else {
            const newUsuario: Usuario = {
                id: `user-${Date.now()}`,
                ...(formData as Usuario),
                cargoNombre,
                createdAt: new Date().toISOString(),
            };
            updatedUsuarios.push(newUsuario);
            showSuccess('Usuario creado correctamente');
        }

        updateMockUsuarios(updatedUsuarios);
        setUsuarios(updatedUsuarios);
        handleCloseDialog();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            const updatedUsuarios = usuarios.filter(u => u.id !== id);
            updateMockUsuarios(updatedUsuarios);
            setUsuarios(updatedUsuarios);
            showSuccess('Usuario eliminado correctamente');
        }
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'email', headerName: 'Email', flex: 1 },
        {
            field: 'cargoNombre',
            headerName: 'Cargo',
            flex: 1,
            renderCell: (params) => params.value || <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Sin cargo</Box>
        },
        {
            field: 'role', headerName: 'Rol', flex: 1,
            valueFormatter: (params) => {
                const roles: Record<string, string> = {
                    'admin': 'Administrador',
                    'manager': 'Gerente',
                    'analyst': 'Analista',
                    'dueño_procesos': 'Dueño del Proceso',
                    'director_procesos': 'Director de Procesos'
                };
                return roles[params.value as string] || params.value as string;
            }
        },
        {
            field: 'activo',
            headerName: 'Activo',
            width: 100,
            renderCell: (params) => (
                params.value ? (
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24, title: 'Activo' }} />
                ) : (
                    <CloseIcon sx={{ color: '#f44336', fontSize: 24, title: 'Inactivo' }} />
                )
            )
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Acciones',
            width: 100,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<EditIcon sx={{ color: '#2196f3' }} />}
                    label="Editar"
                    onClick={() => handleOpenDialog(params.row, 'edit')}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                    label="Eliminar"
                    onClick={() => handleDelete(params.row.id)}
                />,
            ],
        },
    ];

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        Gestión de Usuarios
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Administre los usuarios del sistema, sus roles, cargos y estados.
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(e, newValue) => setCurrentTab(newValue)}
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
                        icon={<PeopleIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Usuarios" 
                        id="usuario-tab-0" 
                        aria-controls="usuario-tabpanel-0" 
                    />
                    <Tab 
                        icon={<BadgeIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Cargos" 
                        id="usuario-tab-1" 
                        aria-controls="usuario-tabpanel-1" 
                    />
                    <Tab 
                        icon={<BusinessIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Gerencias" 
                        id="usuario-tab-2" 
                        aria-controls="usuario-tabpanel-2" 
                    />
                </Tabs>

                {/* TAB 0: USUARIOS */}
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar usuarios..."
                                value={searchUsuarios}
                                onChange={(e) => setSearchUsuarios(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(undefined, 'edit')}>
                                Nuevo Usuario
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredUsuarios}
                            columns={columns}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenDialog(params.row, 'view')}
                        />
                    </Box>
                </TabPanel>

                {/* TAB 1: CARGOS */}
                <TabPanel value={currentTab} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar cargos..."
                                value={searchCargos}
                                onChange={(e) => setSearchCargos(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenCargoDialog()}>
                                Nuevo Cargo
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredCargos}
                            columns={[
                                { field: 'id', headerName: 'ID', flex: 0.5 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'descripcion', headerName: 'Descripción', flex: 1.5 },
                                {
                                    field: 'actions',
                                    type: 'actions',
                                    headerName: 'Acciones',
                                    width: 100,
                                    getActions: (params) => [
                                        <GridActionsCellItem
                                            icon={<EditIcon />}
                                            label="Editar"
                                            onClick={() => handleOpenCargoDialog(params.row, 'edit')}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteCargo(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenCargoDialog(params.row, 'view')}
                        />
                    </Box>
                </TabPanel>

                {/* TAB 2: GERENCIAS */}
                <TabPanel value={currentTab} index={2}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar gerencias..."
                                value={searchGerencias}
                                onChange={(e) => setSearchGerencias(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenGerenciaDialog()}>
                                Nueva Gerencia
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredGerencias}
                            columns={[
                                { field: 'id', headerName: 'ID', flex: 0.5 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'sigla', headerName: 'Sigla', flex: 0.75 },
                                { field: 'subdivision', headerName: 'Subdivisión', flex: 1.5 },
                                {
                                    field: 'actions',
                                    type: 'actions',
                                    headerName: 'Acciones',
                                    width: 100,
                                    getActions: (params) => [
                                        <GridActionsCellItem
                                            icon={<EditIcon />}
                                            label="Editar"
                                            onClick={() => handleOpenGerenciaDialog(params.row, 'edit')}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteGerencia(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenGerenciaDialog(params.row, 'view')}
                        />
                    </Box>
                </TabPanel>
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingUsuario
                        ? (isViewUsuario ? 'Ver Usuario' : 'Editar Usuario')
                        : 'Nuevo Usuario'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            disabled={isViewUsuario}
                            required
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isViewUsuario}
                        />
                        <Autocomplete
                            options={cargos}
                            getOptionLabel={(option) => option.nombre}
                            value={cargos.find(c => c.id === formData.cargoId) || null}
                            onChange={(_e, newValue) => setFormData({ ...formData, cargoId: newValue?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Cargo" variant="outlined" />}
                            fullWidth
                            disabled={isViewUsuario}
                        />
                        <Autocomplete
                            options={['admin', 'manager', 'analyst', 'dueño_procesos', 'director_procesos']}
                            getOptionLabel={(option) => {
                                const roles: Record<string, string> = {
                                    'admin': 'Administrador',
                                    'manager': 'Gerente',
                                    'analyst': 'Analista',
                                    'dueño_procesos': 'Dueño del Proceso',
                                    'director_procesos': 'Director de Procesos'
                                };
                                return roles[option] || option;
                            }}
                            value={formData.role || ''}
                            onChange={(_e, newValue) => setFormData({ ...formData, role: newValue as any })}
                            renderInput={(params) => <TextField {...params} label="Rol" variant="outlined" />}
                            fullWidth
                            disabled={isViewUsuario}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    disabled={isViewUsuario}
                                />
                            }
                            label="Activo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
                        {isViewUsuario ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewUsuario && (
                        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={cargoDialogOpen} onClose={handleCloseCargoDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCargo
                        ? (isViewCargo ? 'Ver Cargo' : 'Editar Cargo')
                        : 'Nuevo Cargo'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={cargoFormData.nombre}
                            onChange={(e) => setCargoFormData({ ...cargoFormData, nombre: e.target.value })}
                            disabled={isViewCargo}
                            required
                        />
                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={2}
                            value={cargoFormData.descripcion}
                            onChange={(e) => setCargoFormData({ ...cargoFormData, descripcion: e.target.value })}
                            disabled={isViewCargo}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCargoDialog} startIcon={<CancelIcon />}>
                        {isViewCargo ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewCargo && (
                        <Button onClick={handleSaveCargo} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={gerenciaDialogOpen} onClose={handleCloseGerenciaDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingGerencia
                        ? (isViewGerencia ? 'Ver Gerencia' : 'Editar Gerencia')
                        : 'Nueva Gerencia'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={gerenciaFormData.nombre}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, nombre: e.target.value })}
                            disabled={isViewGerencia}
                            required
                        />
                        <TextField
                            label="Sigla"
                            fullWidth
                            value={gerenciaFormData.sigla}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, sigla: e.target.value })}
                            disabled={isViewGerencia}
                        />
                        <TextField
                            label="Subdivisión"
                            fullWidth
                            value={gerenciaFormData.subdivision}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, subdivision: e.target.value })}
                            disabled={isViewGerencia}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGerenciaDialog} startIcon={<CancelIcon />}>
                        {isViewGerencia ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewGerencia && (
                        <Button onClick={handleSaveGerencia} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
