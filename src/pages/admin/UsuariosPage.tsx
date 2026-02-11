
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
    InputAdornment,
    IconButton,
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
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Usuario, Cargo, Gerencia } from '../../types';
import { getMockUsuarios, updateMockUsuarios, getMockCargos, getMockGerencias } from '../../api/services/mockData';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import AppPageLayout from '../../components/layout/AppPageLayout';

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
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState<Usuario | null>(null);
    const [cargoDialogOpen, setCargoDialogOpen] = useState(false);
    const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
    const [cargoDetailDialogOpen, setCargoDetailDialogOpen] = useState(false);
    const [selectedCargoDetail, setSelectedCargoDetail] = useState<Cargo | null>(null);
    const [gerenciaDialogOpen, setGerenciaDialogOpen] = useState(false);
    const [editingGerencia, setEditingGerencia] = useState<Gerencia | null>(null);
    const [gerenciaDetailDialogOpen, setGerenciaDetailDialogOpen] = useState(false);
    const [selectedGerenciaDetail, setSelectedGerenciaDetail] = useState<Gerencia | null>(null);
    const [formData, setFormData] = useState<Partial<Usuario>>({
        nombre: '',
        email: '',
        role: 'supervisor',
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
    const [showPassword, setShowPassword] = useState(false);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

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

    const handleOpenDialog = (usuario?: Usuario) => {
        if (usuario) {
            setEditingUsuario(usuario);
            setFormData({
                nombre: usuario.nombre,
                email: usuario.email || '',
                role: usuario.role,
                activo: usuario.activo,
                cargoId: usuario.cargoId || '',
                password: usuario.password || '',
            });
        } else {
            setEditingUsuario(null);
            setFormData({
                nombre: '',
                email: '',
                role: 'supervisor',
                activo: true,
                cargoId: '',
                password: '',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingUsuario(null);
        setShowPassword(false);
    };

    const handleOpenUserDetailDialog = (usuario: Usuario) => {
        setSelectedUserDetail(usuario);
        setDetailDialogOpen(true);
    };

    const handleCloseUserDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedUserDetail(null);
        setShowPassword(false);
    };

    const handleOpenCargoDialog = (cargo?: Cargo) => {
        if (cargo) {
            setEditingCargo(cargo);
            setCargoFormData({
                nombre: cargo.nombre,
                descripcion: cargo.descripcion || '',
            });
        } else {
            setEditingCargo(null);
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
    };

    const handleOpenCargoDetailDialog = (cargo: Cargo) => {
        setSelectedCargoDetail(cargo);
        setCargoDetailDialogOpen(true);
    };

    const handleCloseCargoDetailDialog = () => {
        setCargoDetailDialogOpen(false);
        setSelectedCargoDetail(null);
    };

    const handleOpenGerenciaDialog = (gerencia?: Gerencia) => {
        if (gerencia) {
            setEditingGerencia(gerencia);
            setGerenciaFormData({
                nombre: gerencia.nombre,
                sigla: gerencia.sigla || '',
                subdivision: gerencia.subdivision || '',
            });
        } else {
            setEditingGerencia(null);
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
    };

    const handleOpenGerenciaDetailDialog = (gerencia: Gerencia) => {
        setSelectedGerenciaDetail(gerencia);
        setGerenciaDetailDialogOpen(true);
    };

    const handleCloseGerenciaDetailDialog = () => {
        setGerenciaDetailDialogOpen(false);
        setSelectedGerenciaDetail(null);
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
                    onClick={() => handleOpenDialog(params.row)}
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
        <AppPageLayout
            title="Gestión de Usuarios"
            description="Administre los usuarios del sistema, sus roles, cargos y estados."
        >
            <Box sx={{ mt: -2 }}>
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                                Nuevo Usuario
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredUsuarios}
                            columns={columns}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenUserDetailDialog(params.row)}
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
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenCargoDialog(params.row)}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteCargo(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenCargoDetailDialog(params.row)}
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
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenGerenciaDialog(params.row)}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteGerencia(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenGerenciaDetailDialog(params.row)}
                        />
                    </Box>
                </TabPanel>
            </Box>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Box>
                            <TextField
                                label="Contraseña"
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password || ''}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-end' }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setFormData({ ...formData, password: 'comware123' })}
                                >
                                    Contraseña por defecto
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                                >
                                    Aleatoria
                                </Button>
                            </Box>
                        </Box>
                        <Autocomplete
                            options={cargos}
                            getOptionLabel={(option) => option.nombre}
                            value={cargos.find(c => c.id === formData.cargoId) || null}
                            onChange={(_e, newValue) => setFormData({ ...formData, cargoId: newValue?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Cargo" variant="outlined" />}
                            fullWidth
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
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                />
                            }
                            label="Activo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={cargoDialogOpen} onClose={handleCloseCargoDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingCargo ? 'Editar Cargo' : 'Nuevo Cargo'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={cargoFormData.nombre}
                            onChange={(e) => setCargoFormData({ ...cargoFormData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={2}
                            value={cargoFormData.descripcion}
                            onChange={(e) => setCargoFormData({ ...cargoFormData, descripcion: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCargoDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSaveCargo} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={gerenciaDialogOpen} onClose={handleCloseGerenciaDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingGerencia ? 'Editar Gerencia' : 'Nueva Gerencia'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={gerenciaFormData.nombre}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            label="Sigla"
                            fullWidth
                            value={gerenciaFormData.sigla}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, sigla: e.target.value })}
                        />
                        <TextField
                            label="Subdivisión"
                            fullWidth
                            value={gerenciaFormData.subdivision}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, subdivision: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGerenciaDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSaveGerencia} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DEL USUARIO */}
            <Dialog open={detailDialogOpen} onClose={handleCloseUserDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Usuario</DialogTitle>
                <DialogContent>
                    {selectedUserDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedUserDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedUserDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{selectedUserDetail.email || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Contraseña</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1">
                                        {showPassword ? (selectedUserDetail.password || '********') : '********'}
                                    </Typography>
                                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Cargo</Typography>
                                <Typography variant="body1">{selectedUserDetail.cargoNombre || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Rol</Typography>
                                <Typography variant="body1">
                                    {selectedUserDetail.role === 'admin' ? 'Administrador' :
                                        selectedUserDetail.role === 'manager' ? 'Gerente' :
                                            selectedUserDetail.role === 'analyst' ? 'Analista' :
                                                selectedUserDetail.role === 'dueño_procesos' ? 'Dueño del Proceso' :
                                                    selectedUserDetail.role === 'director_procesos' ? 'Director de Procesos' :
                                                        selectedUserDetail.role}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Estado</Typography>
                                <Typography variant="body1">{selectedUserDetail.activo ? 'Activo' : 'Inactivo'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseUserDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenDialog(selectedUserDetail!);
                        handleCloseUserDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DEL CARGO */}
            <Dialog open={cargoDetailDialogOpen} onClose={handleCloseCargoDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Cargo</DialogTitle>
                <DialogContent>
                    {selectedCargoDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedCargoDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedCargoDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Descripción</Typography>
                                <Typography variant="body1">{selectedCargoDetail.descripcion || '-'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCargoDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenCargoDialog(selectedCargoDetail!);
                        handleCloseCargoDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DE LA GERENCIA */}
            <Dialog open={gerenciaDetailDialogOpen} onClose={handleCloseGerenciaDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información de la Gerencia</DialogTitle>
                <DialogContent>
                    {selectedGerenciaDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedGerenciaDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedGerenciaDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Sigla</Typography>
                                <Typography variant="body1">{selectedGerenciaDetail.sigla || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Subdivisión</Typography>
                                <Typography variant="body1">{selectedGerenciaDetail.subdivision || '-'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseGerenciaDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenGerenciaDialog(selectedGerenciaDetail!);
                        handleCloseGerenciaDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </AppPageLayout>
    );
}
