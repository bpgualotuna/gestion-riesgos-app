
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
    Chip,
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
    Security as SecurityIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Usuario, Cargo, Gerencia } from '../../types';
import {
    useGetUsuariosQuery, useCreateUsuarioMutation, useUpdateUsuarioMutation, useDeleteUsuarioMutation,
    useGetRolesQuery, useCreateRoleMutation, useUpdateRoleMutation, useDeleteRoleMutation,
    useGetCargosQuery, useCreateCargoMutation, useUpdateCargoMutation, useDeleteCargoMutation,
    useGetGerenciasQuery, useCreateGerenciaMutation, useUpdateGerenciaMutation, useDeleteGerenciaMutation
} from '../../api/services/riesgosApi';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { CircularProgress, Typography as MuiTypography } from '@mui/material';

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

    // Queries
    const { data: usuariosData = [], isLoading: loadingUsuarios, refetch: refetchUsuarios } = useGetUsuariosQuery();
    const { data: rolesData = [], isLoading: loadingRoles, refetch: refetchRoles } = useGetRolesQuery();
    const { data: cargosData = [], isLoading: loadingCargos, refetch: refetchCargos } = useGetCargosQuery();
    const { data: gerenciasData = [], isLoading: loadingGerencias, refetch: refetchGerencias } = useGetGerenciasQuery();

    // Mutations
    const [createUsuario] = useCreateUsuarioMutation();
    const [updateUsuario] = useUpdateUsuarioMutation();
    const [deleteUsuario] = useDeleteUsuarioMutation();
    const [createRole] = useCreateRoleMutation();
    const [updateRole] = useUpdateRoleMutation();
    const [deleteRole] = useDeleteRoleMutation();
    const [createCargo] = useCreateCargoMutation();
    const [updateCargo] = useUpdateCargoMutation();
    const [deleteCargo] = useDeleteCargoMutation();
    const [createGerencia] = useCreateGerenciaMutation();
    const [updateGerencia] = useUpdateGerenciaMutation();
    const [deleteGerencia] = useDeleteGerenciaMutation();

    const [searchUsuarios, setSearchUsuarios] = useState('');
    const [searchRoles, setSearchRoles] = useState('');
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
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any | null>(null);
    const [roleDetailDialogOpen, setRoleDetailDialogOpen] = useState(false);
    const [selectedRoleDetail, setSelectedRoleDetail] = useState<any | null>(null);
    const [gerenciaDialogOpen, setGerenciaDialogOpen] = useState(false);
    const [editingGerencia, setEditingGerencia] = useState<Gerencia | null>(null);
    const [gerenciaDetailDialogOpen, setGerenciaDetailDialogOpen] = useState(false);
    const [selectedGerenciaDetail, setSelectedGerenciaDetail] = useState<Gerencia | null>(null);
    const [formData, setFormData] = useState<Partial<Usuario & { roleId?: string | number }>>({
        nombre: '',
        email: '',
        roleId: '',
        activo: true,
        cargoId: '',
    });
    const [cargoFormData, setCargoFormData] = useState<any>({
        nombre: '',
        descripcion: '',
    });
    const [roleFormData, setRoleFormData] = useState<any>({
        codigo: '',
        nombre: '',
        descripcion: '',
        permisos: { 
            visualizar: true,
            editar: false
        },
        activo: true
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

    // OPTIMIZADO: Mapear usuarios para incluir cargoNombre y roleCodigo desde objetos anidados del backend
    const usuariosMapeados = useMemo(() => {
        return (usuariosData as any[]).map((u: any) => ({
            ...u,
            cargoNombre: u.cargo?.nombre || u.cargoNombre || null,
            cargoId: u.cargoId || u.cargo?.id || null,
            role: u.role?.codigo || u.role || null,
            roleId: u.roleId || u.role?.id || null,
            roleNombre: u.role?.nombre || null
        }));
    }, [usuariosData]);

    // Filtered data
    const filteredUsuarios = useMemo(() => {
        return usuariosMapeados.filter((u: any) =>
            u.nombre.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(searchUsuarios.toLowerCase())) ||
            (u.cargoNombre && u.cargoNombre.toLowerCase().includes(searchUsuarios.toLowerCase()))
        );
    }, [usuariosMapeados, searchUsuarios]);

    const filteredRoles = useMemo(() => {
        return (rolesData as any[]).filter(r =>
            r.nombre.toLowerCase().includes(searchRoles.toLowerCase()) ||
            (r.codigo && r.codigo.toLowerCase().includes(searchRoles.toLowerCase())) ||
            (r.descripcion && r.descripcion.toLowerCase().includes(searchRoles.toLowerCase()))
        );
    }, [rolesData, searchRoles]);

    const filteredCargos = useMemo(() => {
        return (cargosData as Cargo[]).filter(c =>
            c.nombre.toLowerCase().includes(searchCargos.toLowerCase()) ||
            (c.descripcion && c.descripcion.toLowerCase().includes(searchCargos.toLowerCase()))
        );
    }, [cargosData, searchCargos]);

    const filteredGerencias = useMemo(() => {
        return (gerenciasData as Gerencia[]).filter(g =>
            g.nombre.toLowerCase().includes(searchGerencias.toLowerCase()) ||
            (g.sigla && g.sigla.toLowerCase().includes(searchGerencias.toLowerCase())) ||
            (g.subdivision && g.subdivision.toLowerCase().includes(searchGerencias.toLowerCase()))
        );
    }, [gerenciasData, searchGerencias]);

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
            const usuarioMapeado = usuariosMapeados.find((u: any) => u.id === usuario.id);
            setFormData({
                nombre: usuario.nombre,
                email: usuario.email || '',
                roleId: (usuarioMapeado as any)?.roleId || (usuario as any).roleId || '',
                activo: usuario.activo,
                cargoId: usuario.cargoId || '',
                password: usuario.password || '',
            });
        } else {
            setEditingUsuario(null);
            // Obtener el primer rol disponible como default (o supervisor si existe)
            const defaultRole = rolesData.find((r: any) => r.codigo === 'supervisor') || rolesData[0];
            setFormData({
                nombre: '',
                email: '',
                roleId: defaultRole?.id || '',
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

    const handleOpenRoleDialog = (role?: any) => {
        if (role) {
            setEditingRole(role);
            const permisosExistentes = role.permisos || {};
            setRoleFormData({
                codigo: role.codigo || '',
                nombre: role.nombre || '',
                descripcion: role.descripcion || '',
                permisos: {
                    visualizar: permisosExistentes.visualizar !== false,
                    editar: permisosExistentes.editar || false
                },
                activo: role.activo !== undefined ? role.activo : true
            });
        } else {
            setEditingRole(null);
            setRoleFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                permisos: { 
                    visualizar: true,
                    editar: false
                },
                activo: true
            });
        }
        setRoleDialogOpen(true);
    };

    const handleCloseRoleDialog = () => {
        setRoleDialogOpen(false);
        setEditingRole(null);
    };

    const handleOpenRoleDetailDialog = (role: any) => {
        setSelectedRoleDetail(role);
        setRoleDetailDialogOpen(true);
    };

    const handleCloseRoleDetailDialog = () => {
        setRoleDetailDialogOpen(false);
        setSelectedRoleDetail(null);
    };

    const handleSaveRole = async () => {
        if (!roleFormData.codigo || !roleFormData.nombre) {
            showError('El código y nombre son requeridos');
            return;
        }

        try {
            // Si tiene permiso de editar, automáticamente incluir crear y eliminar
            const permisosParaGuardar = {
                visualizar: roleFormData.permisos?.visualizar !== false,
                editar: roleFormData.permisos?.editar || false,
                crear: roleFormData.permisos?.editar || false, // Si puede editar, puede crear
                eliminar: roleFormData.permisos?.editar || false // Si puede editar, puede eliminar
            };

            const roleDataToSave = {
                ...roleFormData,
                permisos: permisosParaGuardar
            };

            if (editingRole) {
                await updateRole({ id: editingRole.id, ...roleDataToSave }).unwrap();
                showSuccess('Rol actualizado correctamente');
            } else {
                await createRole(roleDataToSave).unwrap();
                showSuccess('Rol creado correctamente');
            }
            handleCloseRoleDialog();
        } catch (error) {
            console.error('Error saving role:', error);
            showError('Error al guardar el rol');
        }
    };

    const handleDeleteRole = async (id: string | number) => {
        if (window.confirm('¿Está seguro de eliminar este rol?')) {
            try {
                await deleteRole(id as any).unwrap();
                showSuccess('Rol eliminado correctamente');
            } catch (error: any) {
                const errorMsg = error?.data?.error || 'Error al eliminar el rol';
                showError(errorMsg);
            }
        }
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

    const handleSaveGerencia = async () => {
        if (!gerenciaFormData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        try {
            if (editingGerencia) {
                await updateGerencia({ id: editingGerencia.id, ...gerenciaFormData }).unwrap();
                showSuccess('Gerencia actualizada correctamente');
            } else {
                await createGerencia(gerenciaFormData).unwrap();
                showSuccess('Gerencia creada correctamente');
            }
            handleCloseGerenciaDialog();
        } catch (error) {
            console.error('Error saving gerencia:', error);
            showError('Error al guardar la gerencia');
        }
    };

    const handleDeleteGerencia = async (id: string | number) => {
        if (window.confirm('¿Está seguro de eliminar esta gerencia?')) {
            try {
                await deleteGerencia(id as any).unwrap();
                showSuccess('Gerencia eliminada correctamente');
            } catch (error) {
                showError('Error al eliminar la gerencia');
            }
        }
    };

    const handleSaveCargo = async () => {
        if (!cargoFormData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        try {
            if (editingCargo) {
                await updateCargo({ id: editingCargo.id, ...cargoFormData }).unwrap();
                showSuccess('Cargo actualizado correctamente');
            } else {
                await createCargo(cargoFormData).unwrap();
                showSuccess('Cargo creado correctamente');
            }
            handleCloseCargoDialog();
        } catch (error) {
            showError('Error al guardar el cargo');
        }
    };

    const handleDeleteCargo = async (id: string | number) => {
        if (window.confirm('¿Está seguro de eliminar este cargo?')) {
            try {
                await deleteCargo(id as any).unwrap();
                showSuccess('Cargo eliminado correctamente');
            } catch (error) {
                showError('Error al eliminar el cargo');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        try {
            if (editingUsuario) {
                await updateUsuario({ id: editingUsuario.id as any, ...formData }).unwrap();
                showSuccess('Usuario actualizado correctamente');
            } else {
                await createUsuario(formData).unwrap();
                showSuccess('Usuario creado correctamente');
            }
            handleCloseDialog();
        } catch (error) {
            showError('Error al guardar el usuario');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            try {
                await deleteUsuario(id as any).unwrap();
                showSuccess('Usuario eliminado correctamente');
            } catch (error) {
                showError('Error al eliminar el usuario');
            }
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
                return roles[(params as any).value as string] || (params as any).value as string;
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
                    <Tab
                        icon={<SecurityIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Roles y Permisos"
                        id="usuario-tab-3"
                        aria-controls="usuario-tabpanel-3"
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

                {/* TAB 3: ROLES Y PERMISOS */}
                <TabPanel value={currentTab} index={3}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar roles..."
                                value={searchRoles}
                                onChange={(e) => setSearchRoles(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRoleDialog()}>
                                Nuevo Rol
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredRoles}
                            columns={[
                                { field: 'id', headerName: 'ID', width: 80 },
                                { field: 'codigo', headerName: 'Código', flex: 0.8 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'descripcion', headerName: 'Descripción', flex: 1.5 },
                                {
                                    field: 'permisos',
                                    headerName: 'Permisos',
                                    flex: 1.2,
                                    renderCell: (params) => {
                                        const permisos = params.value || {};
                                        const permisosList = [];
                                        if (permisos.visualizar) permisosList.push('Visualizar');
                                        if (permisos.editar) permisosList.push('Editar');
                                        return (
                                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {permisosList.length > 0 ? (
                                                    permisosList.map((p, idx) => (
                                                        <Chip 
                                                            key={idx} 
                                                            label={p} 
                                                            size="small" 
                                                            sx={{ 
                                                                fontSize: '0.7rem', 
                                                                height: 20,
                                                                bgcolor: p === 'Editar' ? '#e3f2fd' : '#f5f5f5'
                                                            }} 
                                                        />
                                                    ))
                                                ) : (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                        Sin permisos
                                                    </Typography>
                                                )}
                                            </Box>
                                        );
                                    }
                                },
                                {
                                    field: 'activo',
                                    headerName: 'Activo',
                                    width: 100,
                                    renderCell: (params) => (
                                        params.value ? (
                                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                                        ) : (
                                            <CloseIcon sx={{ color: '#f44336', fontSize: 24 }} />
                                        )
                                    )
                                },
                                {
                                    field: 'actions',
                                    type: 'actions',
                                    headerName: 'Acciones',
                                    width: 150,
                                    getActions: (params) => [
                                        <GridActionsCellItem
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenRoleDialog(params.row)}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteRole(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenRoleDetailDialog(params.row)}
                            loading={loadingRoles}
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
                            options={cargosData}
                            getOptionLabel={(option) => option.nombre}
                            value={cargosData.find(c => String(c.id) === String(formData.cargoId)) || null}
                            onChange={(_e, newValue) => setFormData({ ...formData, cargoId: newValue?.id.toString() || '' })}
                            renderInput={(params) => <TextField {...params} label="Cargo" variant="outlined" />}
                            fullWidth
                        />
                        <Autocomplete
                            options={rolesData}
                            getOptionLabel={(option: any) => option.nombre || option.codigo || ''}
                            value={rolesData.find((r: any) => String(r.id) === String(formData.roleId)) || null}
                            onChange={(_e, newValue) => setFormData({ ...formData, roleId: newValue?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Rol" variant="outlined" required />}
                            fullWidth
                            loading={loadingRoles}
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

            <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Código"
                            fullWidth
                            value={roleFormData.codigo}
                            onChange={(e) => setRoleFormData({ ...roleFormData, codigo: e.target.value.toLowerCase().trim() })}
                            required
                            helperText="Código único del rol (ej: 'admin', 'gerente', 'supervisor', 'dueño_procesos')"
                            inputProps={{ maxLength: 50 }}
                        />
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={roleFormData.nombre}
                            onChange={(e) => setRoleFormData({ ...roleFormData, nombre: e.target.value })}
                            required
                            helperText="Nombre descriptivo del rol (ej: 'Administrador', 'Gerente', 'Supervisor de Riesgos')"
                        />
                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={2}
                            value={roleFormData.descripcion}
                            onChange={(e) => setRoleFormData({ ...roleFormData, descripcion: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Permisos del Rol</Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={roleFormData.permisos?.visualizar !== false}
                                            onChange={(e) => setRoleFormData({
                                                ...roleFormData,
                                                permisos: { ...roleFormData.permisos, visualizar: e.target.checked }
                                            })}
                                        />
                                    }
                                    label="Visualizar"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={roleFormData.permisos?.editar || false}
                                            onChange={(e) => {
                                                const editar = e.target.checked;
                                                setRoleFormData({
                                                    ...roleFormData,
                                                    permisos: { 
                                                        visualizar: true, // Si puede editar, también puede visualizar
                                                        editar: editar
                                                    }
                                                });
                                            }}
                                        />
                                    }
                                    label="Editar (incluye crear y eliminar)"
                                />
                            </Box>
                            
                            {roleFormData.permisos?.editar && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    El permiso "Editar" incluye automáticamente las capacidades de crear y eliminar registros.
                                </Alert>
                            )}
                            
                            {roleFormData.codigo === 'gerente' && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    El rol "Gerente" puede seleccionar entre dos perfiles: "Dueño de Procesos" o "Supervisor" al iniciar sesión.
                                </Alert>
                            )}
                        </Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={roleFormData.activo}
                                    onChange={(e) => setRoleFormData({ ...roleFormData, activo: e.target.checked })}
                                />
                            }
                            label="Activo"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRoleDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSaveRole} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
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

            {/* MODAL DE DETALLE DEL ROL */}
            <Dialog open={roleDetailDialogOpen} onClose={handleCloseRoleDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Rol</DialogTitle>
                <DialogContent>
                    {selectedRoleDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedRoleDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Código</Typography>
                                <Typography variant="body1">{selectedRoleDetail.codigo}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedRoleDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Descripción</Typography>
                                <Typography variant="body1">{selectedRoleDetail.descripcion || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Permisos</Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                                    {selectedRoleDetail.permisos?.visualizar && (
                                        <Chip label="Visualizar" size="small" sx={{ bgcolor: '#f5f5f5' }} />
                                    )}
                                    {selectedRoleDetail.permisos?.editar && (
                                        <Chip label="Editar (incluye crear y eliminar)" size="small" sx={{ bgcolor: '#e3f2fd' }} />
                                    )}
                                    {!selectedRoleDetail.permisos?.visualizar && !selectedRoleDetail.permisos?.editar && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                            Sin permisos
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Estado</Typography>
                                <Typography variant="body1">{selectedRoleDetail.activo ? 'Activo' : 'Inactivo'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseRoleDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenRoleDialog(selectedRoleDetail);
                        handleCloseRoleDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </AppPageLayout>
    );
}
