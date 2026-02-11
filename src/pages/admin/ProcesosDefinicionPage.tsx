
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
import AppPageLayout from '../../components/layout/AppPageLayout';
import { GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { Proceso } from '../../types';
import { getMockProcesos, updateMockProcesos, getMockTiposProceso, getMockGerencias, getMockVicepresidencias } from '../../api/services/mockData';
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
    const [currentTab, setCurrentTab] = useState(0);
    const [procesos, setProcesos] = useState<Proceso[]>([]);
    const [tiposProceso, setTiposProceso] = useState<any[]>([]);
    const [gerencias, setGerencias] = useState<any[]>([]);
    const [vicepresidencias, setVicepresidencias] = useState<any[]>([]);
    const [searchProcesos, setSearchProcesos] = useState('');
    const [searchTipos, setSearchTipos] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProceso, setEditingProceso] = useState<Proceso | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedProcessDetail, setSelectedProcessDetail] = useState<Proceso | null>(null);
    const [tipoDialogOpen, setTipoDialogOpen] = useState(false);
    const [editingTipo, setEditingTipo] = useState<any | null>(null);
    const [tipoDetailDialogOpen, setTipoDetailDialogOpen] = useState(false);
    const [selectedTipoDetail, setSelectedTipoDetail] = useState<any | null>(null);
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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setProcesos(getMockProcesos());
        setTiposProceso(getMockTiposProceso());
        setGerencias(getMockGerencias());
        setVicepresidencias(getMockVicepresidencias());
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

    const handleOpenDialog = (proceso?: Proceso) => {
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
        } else {
            setEditingProceso(null);
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
    };

    const handleOpenDetailDialog = (proceso: Proceso) => {
        setSelectedProcessDetail(proceso);
        setDetailDialogOpen(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedProcessDetail(null);
    };

    const handleOpenTipoDialog = (tipo?: any) => {
        if (tipo) {
            setEditingTipo(tipo);
            setTipoFormData({
                nombre: tipo.nombre,
                descripcion: tipo.descripcion || '',
            });
        } else {
            setEditingTipo(null);
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
    };

    const handleOpenTipoDetailDialog = (tipo: any) => {
        setSelectedTipoDetail(tipo);
        setTipoDetailDialogOpen(true);
    };

    const handleCloseTipoDetailDialog = () => {
        setTipoDetailDialogOpen(false);
        setSelectedTipoDetail(null);
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
        } else {
            const newTipo = {
                id: Math.max(...tiposProceso.map(t => t.id || 0), 0) + 1,
                ...tipoFormData,
            };
            updatedTipos.push(newTipo);
            showSuccess('Tipo de Proceso creado correctamente');
        }

        localStorage.setItem('catalog_tiposProceso', JSON.stringify(updatedTipos));
        setTiposProceso(updatedTipos);
        handleCloseTipoDialog();
    };

    const handleDeleteTipo = (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este Tipo de Proceso?')) {
            const updatedTipos = tiposProceso.filter(t => t.id !== id);
            localStorage.setItem('catalog_tiposProceso', JSON.stringify(updatedTipos));
            setTiposProceso(updatedTipos);
            showSuccess('Tipo de Proceso eliminado correctamente');
        }
    };

    const handleSave = () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        let updatedProcesos = [...procesos];

        if (editingProceso) {
            updatedProcesos = updatedProcesos.map(p =>
                p.id === editingProceso.id ? { ...p, ...formData } as Proceso : p
            );
            showSuccess('Proceso actualizado correctamente');
        } else {
            const newProceso: Proceso = {
                id: `proc-${Date.now()}`,
                ...(formData as Proceso),
                estado: 'borrador', // Default state
                puedeCrear: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                responsableId: '',
                responsableNombre: '',
                areaId: '',
                areaNombre: '',
                directorId: '',
                directorNombre: '',
            } as Proceso;
            updatedProcesos.push(newProceso);
            showSuccess('Proceso creado correctamente');
        }

        updateMockProcesos(updatedProcesos);
        setProcesos(updatedProcesos);
        handleCloseDialog();
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este proceso?')) {
            const updatedProcesos = procesos.filter(p => p.id !== id);
            updateMockProcesos(updatedProcesos);
            setProcesos(updatedProcesos);
            showSuccess('Proceso eliminado correctamente');
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
        {
            field: 'vicepresidencia',
            headerName: 'Subdivisión',
            width: 150,
            renderCell: (params) => {
                const vp = vicepresidencias.find(v => v.id === params.value);
                return vp?.nombre || '-';
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
            width: 120,
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
            title="Gestión de Procesos"
            description="Administre procesos y sus tipos."
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                                Nuevo Proceso
                            </Button>
                        </Box>
                        <AppDataGrid
                            rows={filteredProcesos}
                            columns={columns}
                            getRowId={(row) => row.id}
                            onRowClick={(params) => handleOpenDetailDialog(params.row)}
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
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenTipoDialog()}>
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
                                            onClick={() => handleOpenTipoDialog(params.row)}
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
                            onRowClick={(params) => handleOpenTipoDetailDialog(params.row)}
                        />
                    </Box>
                </TabPanel>
            </Box>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingProceso ? 'Editar Proceso' : 'Nuevo Proceso'}</DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        <Grid2 xs={12} md={6}>
                            <TextField
                                label="Nombre del Proceso"
                                fullWidth
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <Autocomplete
                                options={vicepresidencias}
                                getOptionLabel={(option) => option.nombre || ''}
                                value={vicepresidencias.find(v => v.id === formData.vicepresidencia) || null}
                                onChange={(_e, newValue) => setFormData({ ...formData, vicepresidencia: newValue?.id || '' })}
                                renderInput={(params) => <TextField {...params} label="Subdivisión (Vicepresidencia)" />}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <Autocomplete
                                options={gerencias}
                                getOptionLabel={(option) => option.nombre || ''}
                                value={gerencias.find(g => g.id === formData.gerencia) || null}
                                onChange={(_e, newValue) => setFormData({ ...formData, gerencia: newValue?.id || '' })}
                                renderInput={(params) => <TextField {...params} label="Gerencia" />}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.activo}
                                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    />
                                }
                                label="Activo"
                            />
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={tipoDialogOpen} onClose={handleCloseTipoDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingTipo ? 'Editar Tipo de Proceso' : 'Nuevo Tipo de Proceso'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                        <TextField
                            label="Nombre"
                            fullWidth
                            value={tipoFormData.nombre}
                            onChange={(e) => setTipoFormData({ ...tipoFormData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            label="Descripción"
                            fullWidth
                            multiline
                            rows={2}
                            value={tipoFormData.descripcion}
                            onChange={(e) => setTipoFormData({ ...tipoFormData, descripcion: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTipoDialog} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSaveTipo} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DEL PROCESO */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Proceso</DialogTitle>
                <DialogContent>
                    {selectedProcessDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedProcessDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedProcessDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Descripción</Typography>
                                <Typography variant="body1">{selectedProcessDetail.descripcion || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Tipo de Proceso</Typography>
                                <Typography variant="body1">
                                    {tiposProceso.find(t => t.id === parseInt(selectedProcessDetail.tipoProceso) || t.id === selectedProcessDetail.tipoProceso)?.nombre || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Subdivisión</Typography>
                                <Typography variant="body1">
                                    {vicepresidencias.find(v => v.id === selectedProcessDetail.vicepresidencia)?.nombre || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Gerencia</Typography>
                                <Typography variant="body1">
                                    {gerencias.find(g => g.id === selectedProcessDetail.gerencia)?.nombre || '-'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Objetivo del Proceso</Typography>
                                <Typography variant="body1">{selectedProcessDetail.objetivoProceso || '-'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Estado</Typography>
                                <Typography variant="body1">{selectedProcessDetail.activo ? 'Activo' : 'Inactivo'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDetailDialog()}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenDialog(selectedProcessDetail!);
                        handleCloseDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE DEL TIPO DE PROCESO */}
            <Dialog open={tipoDetailDialogOpen} onClose={handleCloseTipoDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Tipo de Proceso</DialogTitle>
                <DialogContent>
                    {selectedTipoDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">ID</Typography>
                                <Typography variant="body1">{selectedTipoDetail.id}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                <Typography variant="body1">{selectedTipoDetail.nombre}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">Descripción</Typography>
                                <Typography variant="body1">{selectedTipoDetail.descripcion || '-'}</Typography>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTipoDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpenTipoDialog(selectedTipoDetail!);
                        handleCloseTipoDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </AppPageLayout>
    );
}
