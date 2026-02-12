
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
    FormControlLabel,
    Switch,
    Alert,
    Autocomplete,
    Tabs,
    Tab,
    InputAdornment,
    CircularProgress
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
import {
    useGetProcesosQuery,
    useCreateProcesoMutation,
    useUpdateProcesoMutation,
    useDeleteProcesoMutation,
    useGetTiposProcesoQuery,
    useGetGerenciasQuery,
    useGetAreasQuery,
    useGetUsuariosQuery
} from '../../api/services/riesgosApi';
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

    // RTK Query Hooks
    const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
    const { data: tiposProceso = [], isLoading: loadingTipos } = useGetTiposProcesoQuery();
    const { data: gerencias = [], isLoading: loadingGerencias } = useGetGerenciasQuery();
    const { data: areas = [], isLoading: loadingAreas } = useGetAreasQuery();
    const { data: usuarios = [], isLoading: loadingUsuarios } = useGetUsuariosQuery();

    // Mutations
    const [createProceso] = useCreateProcesoMutation();
    const [updateProceso] = useUpdateProcesoMutation();
    const [deleteProceso] = useDeleteProcesoMutation();

    // Vicepresidencias (derived from gerencias unique subdivisions or fixed list)
    const vicepresidencias = useMemo(() => {
        const uniqueSub = Array.from(new Set(gerencias.map(g => g.subdivision).filter(Boolean)));
        return uniqueSub.map((sub, index) => ({ id: sub as string, nombre: sub as string }));
    }, [gerencias]);

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
        areaId: '',
        areaNombre: '',
        responsableId: '',
        activo: true,
    });
    const [tipoFormData, setTipoFormData] = useState<any>({
        nombre: '',
        descripcion: '',
    });

    // Filtered data
    const filteredProcesos = useMemo(() => {
        return procesos.filter(p =>
            p.nombre.toLowerCase().includes(searchProcesos.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(searchProcesos.toLowerCase())
        );
    }, [procesos, searchProcesos]);

    const filteredTipos = useMemo(() => {
        return tiposProceso.filter((t: any) =>
            t.nombre.toLowerCase().includes(searchTipos.toLowerCase()) ||
            (t.descripcion && t.descripcion.toLowerCase().includes(searchTipos.toLowerCase()))
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
                tipoProceso: proceso.tipoProceso || (proceso as any).tipo,
                areaId: proceso.areaId,
                areaNombre: proceso.areaNombre,
                responsableId: proceso.responsableId || (proceso as any).responsable?.id,
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
                areaId: '',
                areaNombre: '',
                responsableId: '',
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

    // Tipos de Proceso are read-only from API for now
    const handleSaveTipo = () => {
        showError('Edición de tipos de proceso no soportada vía API aún.');
        handleCloseTipoDialog();
    };

    const handleDeleteTipo = (id: string | number) => {
        showError('Eliminación de tipos de proceso no soportada vía API aún.');
    };

    const handleSave = async () => {
        if (!formData.nombre) {
            showError('El nombre es requerido');
            return;
        }

        const payload = {
            ...formData,
            objetivo: formData.objetivoProceso,
            tipo: formData.tipoProceso,
        };
        // Eliminar campos que no existen en el esquema o son redundantes
        delete (payload as any).objetivoProceso;
        delete (payload as any).tipoProceso;
        delete (payload as any).areaNombre;

        try {
            if (editingProceso) {
                await updateProceso({ id: editingProceso.id, ...payload } as any).unwrap();
                showSuccess('Proceso actualizado correctamente');
            } else {
                await createProceso(payload as any).unwrap();
                showSuccess('Proceso creado correctamente');
            }
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving proceso:', error);
            showError('Error al guardar el proceso');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm('¿Está seguro de eliminar este proceso?')) {
            try {
                await deleteProceso(id).unwrap();
                showSuccess('Proceso eliminado correctamente');
            } catch (error) {
                console.error('Error deleting proceso:', error);
                showError('Error al eliminar el proceso');
            }
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
            valueGetter: (value: any, row: any) => {
                // Safe access for both v5 (params.row) and v6+ (row argument)
                const data = row || value?.row || value;
                if (!data) return '';
                return data.tipoProceso || data.tipo || data.tipo_proceso || data.tipoProcesoId || '';
            },
            renderCell: (params) => {
                const val = params.value;
                if (!val) return '-';

                // Robust matching: ID string, ID number, or Name string
                const tipo = tiposProceso.find(tp =>
                    String(tp.id) === String(val) ||
                    (tp.nombre && String(tp.nombre).toLowerCase() === String(val).toLowerCase())
                );
                return tipo ? tipo.nombre : val;
            }
        },
        {
            field: 'vicepresidencia',
            headerName: 'Subdivisión',
            width: 150,
            valueGetter: (value: any, row: any) => {
                const data = row || value?.row || value;
                if (!data) return '';
                return data.vicepresidencia || data.vicepresidenciaId || data.subdivision || '';
            },
            renderCell: (params) => {
                const val = params.value;
                if (!val) return '-';

                // Robust matching for VP
                const vp = vicepresidencias.find(v =>
                    String(v.id) === String(val) ||
                    (v.nombre && String(v.nombre).toLowerCase() === String(val).toLowerCase())
                );
                // Also check if it matches a gerencia ID acting as VP
                if (!vp) {
                    const ger = gerencias.find(g => String(g.id) === String(val));
                    if (ger) return ger.subdivision || ger.nombre; // Try to show Subdivision name or Gerencia name
                }

                return vp ? vp.nombre : val;
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
                            loading={loadingProcesos}
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
                            loading={loadingTipos}
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
                                value={tiposProceso.find(tp => String(tp.id) === String(formData.tipoProceso)) || null}
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
                                value={gerencias.find(g => String(g.id) === String(formData.gerencia)) || null}
                                onChange={(_e, newValue) => setFormData({ ...formData, gerencia: newValue?.id.toString() || '' })}
                                renderInput={(params) => <TextField {...params} label="Gerencia" />}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <Autocomplete
                                options={areas}
                                getOptionLabel={(option) => option.nombre || ''}
                                value={areas.find(a => String(a.id) === String(formData.areaId)) || null}
                                onChange={(_e, newValue) => setFormData({
                                    ...formData,
                                    areaId: newValue?.id || '',
                                    areaNombre: newValue?.nombre || ''
                                })}
                                renderInput={(params) => <TextField {...params} label="Área de Asignación" />}
                                fullWidth
                            />
                        </Grid2>
                        <Grid2 xs={12} md={6}>
                            <Autocomplete
                                options={usuarios}
                                getOptionLabel={(option) => option.nombre || ''}
                                value={usuarios.find(u => String(u.id) === String(formData.responsableId)) || null}
                                onChange={(_e, newValue) => setFormData({
                                    ...formData,
                                    responsableId: newValue?.id || ''
                                })}
                                renderInput={(params) => <TextField {...params} label="Responsable del Proceso" />}
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
                                    {tiposProceso.find(t => String(t.id) === String(selectedProcessDetail.tipoProceso || selectedProcessDetail.tipo))?.nombre || selectedProcessDetail.tipoProceso || selectedProcessDetail.tipo || '-'}
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
                                <Typography variant="body2" color="text.secondary">Área</Typography>
                                <Typography variant="body1">
                                    {selectedProcessDetail.areaNombre || areas.find(a => a.id === selectedProcessDetail.areaId)?.nombre || '-'}
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
        </AppPageLayout >
    );
}
