
import { useState, useMemo } from 'react';
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
import { useConfirm } from '../../contexts/ConfirmContext';
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
import { isValidEmail } from '../../utils/validation';
import AppPageLayout from '../../components/layout/AppPageLayout';
import PageLoadingSkeleton from '../../components/ui/PageLoadingSkeleton';
import { Typography as MuiTypography } from '@mui/material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

/** Códigos de roles del sistema: no se pueden eliminar; el código no es editable al editar */
const ROLES_SISTEMA_CODIGOS = ['admin', 'dueño_procesos', 'gerente', 'supervisor'];

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
    const { esAdmin, puedeEditar: puedeEditarAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const { confirmDelete } = useConfirm();
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
        ambito: 'OPERATIVO',
        permisos: { 
            visualizar: true,
            editar: false
        },
        activo: true
    });
    const [gerenciaFormData, setGerenciaFormData] = useState<any>({
        nombre: '',
        subdivision: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=';
        const length = 12;
        let result = '';
        for (let i = 0; i < length; i++) {
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
            role: u.roleRelacion?.codigo || u.role?.codigo || u.role || null,
            roleId: u.roleId || u.roleRelacion?.id || u.role?.id || null,
            roleNombre: u.roleRelacion?.nombre || u.role?.nombre || null
        }));
    }, [usuariosData]);

    // Filtered data
    const filteredUsuarios = useMemo(() => {
        const search = searchUsuarios.trim().toLowerCase();
        if (!search) return usuariosMapeados;
        return usuariosMapeados.filter((u: any) =>
            u.nombre.toLowerCase().includes(search) ||
            (u.email && u.email.toLowerCase().includes(search)) ||
            (u.cargoNombre && u.cargoNombre.toLowerCase().includes(search))
        );
    }, [usuariosMapeados, searchUsuarios]);

    const filteredRoles = useMemo(() => {
        const search = searchRoles.trim().toLowerCase();
        if (!search) return rolesData as any[];
        return (rolesData as any[]).filter(r =>
            r.nombre.toLowerCase().includes(search) ||
            (r.codigo && r.codigo.toLowerCase().includes(search)) ||
            (r.descripcion && r.descripcion.toLowerCase().includes(search))
        );
    }, [rolesData, searchRoles]);

    const filteredCargos = useMemo(() => {
        const search = searchCargos.trim().toLowerCase();
        if (!search) return cargosData as Cargo[];
        return (cargosData as Cargo[]).filter(c =>
            c.nombre.toLowerCase().includes(search) ||
            (c.descripcion && c.descripcion.toLowerCase().includes(search))
        );
    }, [cargosData, searchCargos]);

    const filteredGerencias = useMemo(() => {
        const search = searchGerencias.trim().toLowerCase();
        if (!search) return gerenciasData as Gerencia[];
        return (gerenciasData as Gerencia[]).filter(g =>
            g.nombre.toLowerCase().includes(search) ||
            (g.subdivision && g.subdivision.toLowerCase().includes(search))
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
                ambito: role.ambito === 'SISTEMA' || role.ambito === 'OPERATIVO' ? role.ambito : 'OPERATIVO',
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
                ambito: 'OPERATIVO',
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
        } catch {
            showError('Error al guardar el rol');
        }
    };

    const handleDeleteRole = async (id: string | number) => {
        if (await confirmDelete('este rol')) {
            try {
                await deleteRole(id as any).unwrap();
                showSuccess('Rol eliminado correctamente');
            } catch (error: any) {
                const errorMsg = (error as any)?.data?.error || 'Error al eliminar el rol';
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
                subdivision: gerencia.subdivision || '',
            });
        } else {
            setEditingGerencia(null);
            setGerenciaFormData({
                nombre: '',
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
        } catch {
            showError('Error al guardar la gerencia');
        }
    };

    const handleDeleteGerencia = async (id: string | number) => {
        if (await confirmDelete('esta gerencia')) {
            try {
                await deleteGerencia(id as any).unwrap();
                showSuccess('Gerencia eliminada correctamente');
            } catch (error) {
                showError((error as any)?.data?.error || 'Error al eliminar la gerencia');
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
        if (await confirmDelete('este cargo')) {
            try {
                await deleteCargo(id as any).unwrap();
                showSuccess('Cargo eliminado correctamente');
            } catch (error) {
                showError((error as any)?.data?.error || 'Error al eliminar el cargo');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }
        if (!formData.email?.trim()) {
            showError('El correo es requerido');
            return;
        }
        if (!isValidEmail(formData.email.trim())) {
            showError('El correo no tiene un formato válido. Debe contener @ y un dominio válido.');
            return;
        }

        try {
            const payload = { ...formData, email: formData.email.trim() };
            if (editingUsuario) {
                await updateUsuario({ id: editingUsuario.id as any, ...payload }).unwrap();
                showSuccess('Usuario actualizado correctamente');
            } else {
                await createUsuario(payload).unwrap();
                showSuccess('Usuario creado correctamente');
            }
            handleCloseDialog();
        } catch (error) {
            showError('Error al guardar el usuario');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (await confirmDelete('este usuario')) {
            try {
                await deleteUsuario(id as any).unwrap();
                showSuccess('Usuario eliminado correctamente');
            } catch (error) {
                showError((error as any)?.data?.error || 'Error al eliminar el usuario');
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
            field: 'role', 
            headerName: 'Rol', 
            flex: 1,
            renderCell: (params) => {
                const roles: Record<string, string> = {
                    'admin': 'Administrador',
                    'manager': 'Gerente',
                    'analyst': 'Analista',
                    'dueño_procesos': 'Dueño del Proceso',
                    'director_procesos': 'Director de Procesos'
                };
                const roleValue = params.value as string;
                return roles[roleValue] || roleValue || 'Sin rol';
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
                    key="edit"
                    icon={<EditIcon sx={{ color: '#2196f3' }} />}
                    label="Editar"
                    onClick={() => handleOpenDialog(params.row)}
                    disabled={!puedeEditarAdmin}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                    label="Eliminar"
                    onClick={() => handleDelete(params.row.id)}
                    disabled={!puedeEditarAdmin}
                />,
            ],
        },
    ];

    const loadingActual = currentTab === 0 ? loadingUsuarios : currentTab === 1 ? loadingCargos : currentTab === 2 ? loadingGerencias : loadingRoles;

    return (
        <AppPageLayout
            title="Gestión de Usuarios"
            description="Administre los usuarios del sistema, sus roles, cargos y estados."
        >
            {loadingActual ? (
                <Box sx={{ py: 2 }}>
                    <PageLoadingSkeleton variant="table" tableRows={8} />
                </Box>
            ) : (
            <>
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
                    <Tab
                        icon={<SecurityIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Autenticación 2FA"
                        id="usuario-tab-4"
                        aria-controls="usuario-tabpanel-4"
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()} disabled={!puedeEditarAdmin}>
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRoleDialog()} disabled={!puedeEditarAdmin}>
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
                                    getActions: (params) => {
                                        const esRolSistema = ROLES_SISTEMA_CODIGOS.includes(params.row.codigo);
                                        return [
                                            <GridActionsCellItem
                                                key="edit"
                                                icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                                label="Editar"
                                                onClick={() => handleOpenRoleDialog(params.row)}
                                                disabled={!puedeEditarAdmin}
                                            />,
                                            <GridActionsCellItem
                                                key="delete"
                                                icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                                label="Eliminar"
                                                onClick={() => handleDeleteRole(params.row.id)}
                                                disabled={!puedeEditarAdmin || esRolSistema}
                                            />,
                                        ];
                                    },
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenCargoDialog()} disabled={!puedeEditarAdmin}>
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
                                            key="edit"
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenCargoDialog(params.row)}
                                            disabled={!puedeEditarAdmin}
                                        />,
                                        <GridActionsCellItem
                                            key="delete"
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteCargo(params.row.id)}
                                            disabled={!puedeEditarAdmin}
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenGerenciaDialog()} disabled={!puedeEditarAdmin}>
                                Nueva Gerencia
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredGerencias}
                            columns={[
                                { field: 'id', headerName: 'ID', flex: 0.5 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'subdivision', headerName: 'Subdivisión', flex: 1.5 },
                                {
                                    field: 'actions',
                                    type: 'actions',
                                    headerName: 'Acciones',
                                    width: 100,
                                    getActions: (params) => [
                                        <GridActionsCellItem
                                            key="edit"
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenGerenciaDialog(params.row)}
                                            disabled={!puedeEditarAdmin}
                                        />,
                                        <GridActionsCellItem
                                            key="delete"
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteGerencia(params.row.id)}
                                            disabled={!puedeEditarAdmin}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenGerenciaDetailDialog(params.row)}
                        />
                    </Box>
                </TabPanel>

                {/* TAB 4: AUTENTICACIÓN 2FA */}
                <TabPanel value={currentTab} index={4}>
                    <Box sx={{ p: 3 }}>
                        <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <SecurityIcon sx={{ fontSize: 48, color: '#1976d2' }} />
                                <Box>
                                    <Typography variant="h5" fontWeight={600} gutterBottom>
                                        Autenticación de Dos Factores (2FA)
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Configure la autenticación de dos factores para todos los usuarios del sistema
                                    </Typography>
                                </Box>
                            </Box>

                            <Alert severity="info" sx={{ mb: 3 }}>
                                La autenticación de dos factores agrega una capa adicional de seguridad requiriendo un código de verificación además de la contraseña.
                            </Alert>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Activar 2FA Global */}
                                <Paper variant="outlined" sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                Activar 2FA para Todos los Usuarios
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Cuando está activado, todos los usuarios deberán configurar la autenticación de dos factores en su próximo inicio de sesión
                                            </Typography>
                                        </Box>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={false}
                                                    disabled
                                                    color="primary"
                                                />
                                            }
                                            label=""
                                        />
                                    </Box>
                                </Paper>

                                {/* Método de Autenticación */}
                                <Paper variant="outlined" sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Método de Autenticación
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Seleccione el método de autenticación de dos factores
                                    </Typography>
                                    <FormControl fullWidth disabled>
                                        <InputLabel>Método 2FA</InputLabel>
                                        <Select
                                            value="google_authenticator"
                                            label="Método 2FA"
                                        >
                                            <MenuItem value="google_authenticator">Google Authenticator</MenuItem>
                                            <MenuItem value="sms">SMS</MenuItem>
                                            <MenuItem value="email">Correo Electrónico</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Paper>

                                {/* Configuración Avanzada */}
                                <Paper variant="outlined" sx={{ p: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Configuración Avanzada
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                                        <FormControlLabel
                                            control={<Switch checked={true} disabled />}
                                            label="Permitir códigos de respaldo"
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={false} disabled />}
                                            label="Requerir 2FA para administradores únicamente"
                                        />
                                        <FormControlLabel
                                            control={<Switch checked={true} disabled />}
                                            label="Recordar dispositivo por 30 días"
                                        />
                                    </Box>
                                </Paper>

                                {/* Estadísticas */}
                                <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                        Estadísticas de 2FA
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary" fontWeight={600}>
                                                0
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Usuarios con 2FA activo
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="text.secondary" fontWeight={600}>
                                                {usuariosMapeados.length}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Total de usuarios
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="warning.main" fontWeight={600}>
                                                0%
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Tasa de adopción
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>

                                {/* Botones de Acción */}
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                    <Button variant="outlined" disabled>
                                        Restablecer Configuración
                                    </Button>
                                    <Button variant="contained" disabled startIcon={<SaveIcon />}>
                                        Guardar Cambios
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </TabPanel>
            </Box>

            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { width: 720, maxWidth: '90vw' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                            <IconButton onClick={handleCloseDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
            </Dialog>

            <Dialog open={roleDialogOpen} onClose={handleCloseRoleDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { maxWidth: 460 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={handleSaveRole} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                            <IconButton onClick={handleCloseRoleDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Código"
                            fullWidth
                            value={roleFormData.codigo}
                            onChange={(e) => setRoleFormData({ ...roleFormData, codigo: e.target.value.toLowerCase().trim() })}
                            required
                            disabled={!!editingRole}
                            helperText={editingRole ? 'El código no se puede modificar al editar.' : "Código único del rol (ej: 'admin', 'gerente', 'supervisor'). Los roles del sistema (admin, dueño_procesos, gerente, supervisor) no se pueden eliminar."}
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
                        <FormControl fullWidth>
                            <InputLabel id="role-ambito-label">Ámbito</InputLabel>
                            <Select
                                labelId="role-ambito-label"
                                label="Ámbito"
                                value={roleFormData.ambito || 'OPERATIVO'}
                                onChange={(e) => setRoleFormData({ ...roleFormData, ambito: e.target.value })}
                            >
                                <MenuItem value="OPERATIVO">Operativo (riesgos, controles, planes)</MenuItem>
                                <MenuItem value="SISTEMA">Sistema (administración y configuración)</MenuItem>
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Operativo: acceso al sistema de riesgos. Sistema: acceso al panel de Administración.
                            </Typography>
                        </FormControl>
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
            </Dialog>

            <Dialog open={cargoDialogOpen} onClose={handleCloseCargoDialog} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {editingCargo ? 'Editar Cargo' : 'Nuevo Cargo'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={handleSaveCargo} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                            <IconButton onClick={handleCloseCargoDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
            </Dialog>

            <Dialog open={gerenciaDialogOpen} onClose={handleCloseGerenciaDialog} maxWidth="xs" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            {editingGerencia ? 'Editar Gerencia' : 'Nueva Gerencia'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={handleSaveGerencia} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                            <IconButton onClick={handleCloseGerenciaDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
                            label="Subdivisión"
                            fullWidth
                            value={gerenciaFormData.subdivision}
                            onChange={(e) => setGerenciaFormData({ ...gerenciaFormData, subdivision: e.target.value })}
                        />
                    </Box>
                </DialogContent>
            </Dialog>

            {/* MODAL DE DETALLE DEL USUARIO */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseUserDetailDialog}
                fullWidth
                maxWidth="md"
                PaperProps={{ sx: { width: 620, maxWidth: '90vw' } }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Información del Usuario
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {puedeEditarAdmin && (
                                <Button onClick={() => {
                                    handleOpenDialog(selectedUserDetail!);
                                    handleCloseUserDetailDialog();
                                }} variant="contained" startIcon={<EditIcon />}>
                                    Editar
                                </Button>
                            )}
                            <IconButton onClick={handleCloseUserDetailDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
                                        {showPassword ? (selectedUserDetail.password || '(sin contraseña)') : '********'}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => setShowPassword(!showPassword)}
                                        sx={{ ml: 1 }}
                                    >
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
                            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <SecurityIcon sx={{ color: '#1976d2' }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                Autenticación de Dos Factores (2FA)
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Protege tu cuenta con un código de verificación adicional
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={false}
                                                disabled
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Typography variant="caption" color="text.secondary">
                                                Desactivado
                                            </Typography>
                                        }
                                        labelPlacement="start"
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    La autenticación de dos factores agrega una capa adicional de seguridad a tu cuenta.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL DE DETALLE DEL CARGO */}
            <Dialog open={cargoDetailDialogOpen} onClose={handleCloseCargoDetailDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 560 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Información del Cargo
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {puedeEditarAdmin && (
                                <Button onClick={() => {
                                    handleOpenCargoDialog(selectedCargoDetail!);
                                    handleCloseCargoDetailDialog();
                                }} variant="contained" startIcon={<EditIcon />}>
                                    Editar
                                </Button>
                            )}
                            <IconButton onClick={handleCloseCargoDetailDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
            </Dialog>

            {/* MODAL DE DETALLE DE LA GERENCIA */}
            <Dialog open={gerenciaDetailDialogOpen} onClose={handleCloseGerenciaDetailDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 560 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Información de la Gerencia
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {puedeEditarAdmin && (
                                <Button onClick={() => {
                                    handleOpenGerenciaDialog(selectedGerenciaDetail!);
                                    handleCloseGerenciaDetailDialog();
                                }} variant="contained" startIcon={<EditIcon />}>
                                    Editar
                                </Button>
                            )}
                            <IconButton onClick={handleCloseGerenciaDetailDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
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
                                <Typography variant="body2" color="text.secondary">Subdivisión</Typography>
                                <Typography variant="body1">{selectedGerenciaDetail.subdivision || '-'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL DE DETALLE DEL ROL */}
            <Dialog open={roleDetailDialogOpen} onClose={handleCloseRoleDetailDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 560 } }}>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={600}>
                            Información del Rol
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {puedeEditarAdmin && (
                                <Button onClick={() => {
                                    handleOpenRoleDialog(selectedRoleDetail);
                                    handleCloseRoleDetailDialog();
                                }} variant="contained" startIcon={<EditIcon />}>
                                    Editar
                                </Button>
                            )}
                            <IconButton onClick={handleCloseRoleDetailDialog} size="small" sx={{ ml: 1 }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedRoleDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedRoleDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Código</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body1">{selectedRoleDetail.codigo}</Typography>
                                    {ROLES_SISTEMA_CODIGOS.includes(selectedRoleDetail.codigo) && (
                                        <Chip label="Rol del sistema (no eliminable)" size="small" color="primary" variant="outlined" />
                                    )}
                                </Box>
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
                                <Typography variant="body2" color="text.secondary">Ámbito</Typography>
                                <Typography variant="body1">{selectedRoleDetail.ambito === 'SISTEMA' ? 'Sistema (administración)' : 'Operativo (riesgos, controles, planes)'}</Typography>
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
            </Dialog>
            </>
            )}
        </AppPageLayout>
    );
}
