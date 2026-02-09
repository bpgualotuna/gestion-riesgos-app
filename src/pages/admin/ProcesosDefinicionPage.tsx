
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
    AutoFixHigh as ProcessIcon,
    Category as TypeIcon,
    Search as SearchIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Proceso } from '../../types';
import { useGetProcesosQuery, useGetTiposProcesoQuery, useCreateProcesoMutation, useUpdateProcesoMutation, useDeleteProcesoMutation } from '../../api/services/riesgosApi';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../contexts/AuthContext';
import Grid2 from '../../utils/Grid2';

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
            id={`proceso-tabpanel-${index}`}
            aria-labelledby={`proceso-tab-${index}`}
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

export default function ProcesosDefinicionPage() {
    const { esAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const { data: procesosData = [], refetch: refetchProcesos } = useGetProcesosQuery(undefined, { skip: !esAdmin });
    const { data: tiposProcesoData = [] } = useGetTiposProcesoQuery(undefined, { skip: !esAdmin });
    const [createProceso] = useCreateProcesoMutation();
    const [updateProceso] = useUpdateProcesoMutation();
    const [deleteProceso] = useDeleteProcesoMutation();
    const [currentTab, setCurrentTab] = useState(0);
    const procesos = Array.isArray(procesosData) ? procesosData : [];
    const tiposProceso = Array.isArray(tiposProcesoData) ? tiposProcesoData : [];
    const [searchProcesos, setSearchProcesos] = useState('');
    const [searchTipos, setSearchTipos] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProceso, setEditingProceso] = useState<Proceso | null>(null);
    const [isViewProceso, setIsViewProceso] = useState(false);
    const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
    const [editingTipo, setEditingTipo] = useState<any | null>(null);
    const [isViewTipo, setIsViewTipo] = useState(false);
    const [formData, setFormData] = useState<Partial<Proceso>>({
        nombre: '',
        descripcion: '',
        vicepresidencia: '',
        gerencia: '',
        objetivoProceso: '',
        tipoProceso: '',
        activo: true,
    });
    const [tipoFormData, setTipoFormData] = useState<any>({
        nombre: '',
        descripcion: '',
    });

    const loadData = () => {
        refetchProcesos();
    };

    // Filtered data
    const filteredProcesos = useMemo(() => {
        return procesos.filter(p =>
            p.nombre.toLowerCase().includes(searchProcesos.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(searchProcesos.toLowerCase())
        );
    }, [procesos, searchProcesos]);

    const filteredTipos = useMemo(() => {
        return tiposProceso.filter(t =>
            t.nombre.toLowerCase().includes(searchTipos.toLowerCase()) ||
            t.descripcion.toLowerCase().includes(searchTipos.toLowerCase())
        );
    }, [tiposProceso, searchTipos]);

    if (!esAdmin) {
        return (
            <Box>
                <Alert severity="error">
                    No tiene permisos para acceder a esta página.
                </Alert>
            </Box>
        );
    }

    const handleOpenDialog = (proceso?: Proceso, mode: 'view' | 'edit' = 'edit') => {
        if (proceso) {
            setEditingProceso(proceso);
            setFormData({
                nombre: proceso.nombre,
                descripcion: proceso.descripcion,
                vicepresidencia: proceso.vicepresidencia,
                gerencia: proceso.gerencia,
                objetivoProceso: proceso.objetivoProceso,
                tipoProceso: proceso.tipoProceso,
                activo: proceso.activo,
            });
            setIsViewProceso(mode === 'view');
        } else {
            setEditingProceso(null);
            setIsViewProceso(false);
            setFormData({
                nombre: '',
                descripcion: '',
                vicepresidencia: '',
                gerencia: '',
                objetivoProceso: '',
                tipoProceso: '',
                activo: true,
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingProceso(null);
        setIsViewProceso(false);
    };

    const handleOpenTipoDialog = (tipo?: any, mode: 'view' | 'edit' = 'edit') => {
        if (tipo) {
            setEditingTipo(tipo);
            setTipoFormData({
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || '',
            });
            setIsViewTipo(mode === 'view');
        } else {
            setEditingTipo(null);
            setIsViewTipo(false);
            setTipoFormData({
                nombre: '',
                descripcion: '',
            });
        }
        setTipoDialogOpen(true);
    };

    const handleCloseTipoDialog = () => {
        setTipoDialogOpen(false);
        setEditingTipo(null);
        setIsViewTipo(false);
    };

    const handleSaveTipo = () => {
        if (!tipoFormData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        let updatedTipos = [...tiposProceso];

        if (editingTipo) {
            updatedTipos = updatedTipos.map(t =>
                t.id === editingTipo.id ? { ...t, ...tipoFormData } : t
            );
            showSuccess('Tipo de Proceso actualizado correctamente');
        }
        // Tipos de proceso: catálogo de solo lectura desde API
        showSuccess('Los tipos de proceso se gestionan desde la API. Los cambios locales no se persisten.');
        handleCloseTipoDialog();
    };

    const handleDeleteTipo = (id: number) => {
        showError('Los tipos de proceso son de solo lectura. No se pueden eliminar desde esta interfaz.');
    };

    const handleSave = async () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }
        try {
            if (editingProceso) {
                await updateProceso({ id: editingProceso.id, ...formData }).unwrap();
                showSuccess('Proceso actualizado correctamente');
            } else {
                await createProceso(formData as Parameters<typeof createProceso>[0]).unwrap();
                showSuccess('Proceso creado correctamente');
            }
            refetchProcesos();
            handleCloseDialog();
        } catch (err: any) {
            showError(err?.data?.message || err?.message || 'Error al guardar proceso');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Está seguro de eliminar este proceso?')) return;
        try {
            await deleteProceso(id).unwrap();
            showSuccess('Proceso eliminado correctamente');
            refetchProcesos();
        } catch (err: any) {
            showError(err?.data?.message || err?.message || 'Error al eliminar proceso');
        }
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 1.5 },
        { 
            field: 'tipoProceso', 
            headerName: 'Tipo', 
            width: 150,
            renderCell: (params) => {
                const tipo = tiposProceso.find(tp => tp.id === parseInt(params.value) || tp.id === params.value);
                return tipo?.nombre || params.value || '-';
            }
        },
        { field: 'vicepresidencia', headerName: 'Vicepresidencia', width: 150 },
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
            width: 120,
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
                        Gestión de Procesos
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Administre procesos y sus tipos.
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
                        icon={<ProcessIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Procesos" 
                        id="proceso-tab-0" 
                        aria-controls="proceso-tabpanel-0" 
                    />
                    <Tab 
                        icon={<TypeIcon sx={{ fontSize: 24 }} />}
                        iconPosition="top"
                        label="Tipo de Procesos" 
                        id="proceso-tab-1" 
                        aria-controls="proceso-tabpanel-1" 
                    />
                </Tabs>

                {/* TAB 0: PROCESOS */}
                <TabPanel value={currentTab} index={0}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar procesos..."
                                value={searchProcesos}
                                onChange={(e) => setSearchProcesos(e.target.value)}
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
                                Nuevo Proceso
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredProcesos}
                            columns={columns}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenDialog(params.row, 'view')}
                        />
                    </Box>
                </TabPanel>

                {/* TAB 1: TIPOS DE PROCESOS */}
                <TabPanel value={currentTab} index={1}>
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                            <TextField
                                size="small"
                                placeholder="Buscar tipos..."
                                value={searchTipos}
                                onChange={(e) => setSearchTipos(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1, maxWidth: '300px' }}
                            />
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenTipoDialog(undefined, 'edit')}>
                                Nuevo Tipo de Proceso
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredTipos}
                            columns={[
                                { field: 'id', headerName: 'ID', width: 80 },
                                { field: 'nombre', headerName: 'Nombre', flex: 1 },
                                { field: 'descripcion', headerName: 'Descripción', flex: 1.5 },
                                {
                                    field: 'actions',
                                    type: 'actions',
                                    headerName: 'Acciones',
                                    width: 120,
                                    getActions: (params) => [
                                        <GridActionsCellItem
                                            icon={<EditIcon sx={{ color: '#2196f3' }} />}
                                            label="Editar"
                                            onClick={() => handleOpenTipoDialog(params.row, 'edit')}
                                        />,
                                        <GridActionsCellItem
                                            icon={<DeleteIcon sx={{ color: '#f44336' }} />}
                                            label="Eliminar"
                                            onClick={() => handleDeleteTipo(params.row.id)}
                                        />,
                                    ],
                                },
                            ]}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenTipoDialog(params.row, 'view')}
                        />
                    </Box>
                </TabPanel>
            </Paper>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingProceso
                        ? (isViewProceso ? 'Ver Proceso' : 'Editar Proceso')
                        : 'Nuevo Proceso'}
                </DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        <Grid2 xs={12} md={6}>
                            <TextField
                                label="Nombre del Proceso"
                                fullWidth
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                disabled={isViewProceso}
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <Autocomplete
                                options={tiposProceso}
                                getOptionLabel={(option) => option.nombre}
                                value={tiposProceso.find(tp => tp.id === parseInt(formData.tipoProceso || '0')) || null}
                                onChange={(_e, newValue) => setFormData({ ...formData, tipoProceso: newValue?.id.toString() || '' })}
                                renderInput={(params) => <TextField {...params} label="Tipo de Proceso" />}
                                fullWidth
                                disabled={isViewProceso}
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                label="Descripción"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                disabled={isViewProceso}
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                label="Objetivo del Proceso"
                                fullWidth
                                multiline
                                rows={2}
                                value={formData.objetivoProceso}
                                onChange={(e) => setFormData({ ...formData, objetivoProceso: e.target.value })}
                                disabled={isViewProceso}
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <TextField
                                label="Nombre de la Subdivisión"
                                fullWidth
                                value={formData.vicepresidencia}
                                onChange={(e) => setFormData({ ...formData, vicepresidencia: e.target.value })}
                                disabled={isViewProceso}
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <TextField
                                label="Gerencia"
                                fullWidth
                                value={formData.gerencia}
                                onChange={(e) => setFormData({ ...formData, gerencia: e.target.value })}
                                disabled={isViewProceso}
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                        disabled={isViewProceso}
                                    />
                                }
                                label="Activo"
                            />
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>
                        {isViewProceso ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewProceso && (
                        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            <Dialog open={tipoDialogOpen} onClose={handleCloseTipoDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingTipo
                        ? (isViewTipo ? 'Ver Tipo de Proceso' : 'Editar Tipo de Proceso')
                        : 'Nuevo Tipo de Proceso'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={tipoFormData.nombre}
                            onChange={(e) => setTipoFormData({ ...tipoFormData, nombre: e.target.value })}
                            disabled={isViewTipo}
                            required
                        />
                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={2}
                            value={tipoFormData.descripcion}
                            onChange={(e) => setTipoFormData({ ...tipoFormData, descripcion: e.target.value })}
                            disabled={isViewTipo}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTipoDialog} startIcon={<CancelIcon />}>
                        {isViewTipo ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isViewTipo && (
                        <Button onClick={handleSaveTipo} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
