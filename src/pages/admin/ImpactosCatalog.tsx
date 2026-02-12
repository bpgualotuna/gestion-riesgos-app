
import { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Alert,
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef } from '@mui/x-data-grid';

interface ImpactosCatalogProps {
    tipos: { id: number; clave: string; nombre: string }[];
    nivelesByTipo: Record<number, Record<number, string>>;
    onSaveNiveles: (tipoId: number, niveles: Record<number, string>) => void;
    onAddTipo: (data: { clave: string; nombre: string }) => void;
    onDeleteTipo: (tipoId: number) => void;
}

export default function ImpactosCatalog({
    tipos,
    nivelesByTipo,
    onSaveNiveles,
    onAddTipo,
    onDeleteTipo,
}: ImpactosCatalogProps) {
    const [open, setOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [descriptions, setDescriptions] = useState<Record<number, string>>({});
    const [openNew, setOpenNew] = useState(false);
    const [newImpactType, setNewImpactType] = useState('');
    const [newError, setNewError] = useState('');
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

    // Convert to array for DataGrid
    const safeTipos = Array.isArray(tipos) ? tipos : [];
    const rows = safeTipos.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        clave: t.clave,
    }));

    const handleOpen = (row: any) => {
        setEditingKey(String(row.id));
        setDescriptions({ ...nivelesByTipo[row.id] });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingKey(null);
    };

    const handleOpenDetailDialog = (row: any) => {
        setSelectedDetailId(row.id);
        setDetailDialogOpen(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedDetailId(null);
    };

    const handleSave = () => {
        if (editingKey) {
            const tipoId = Number(editingKey);
            onSaveNiveles(tipoId, descriptions);
        }
        handleClose();
    };

    const handleOpenNew = () => {
        setNewImpactType('');
        setNewError('');
        setOpenNew(true);
    };

    const handleCloseNew = () => {
        setOpenNew(false);
        setNewImpactType('');
        setNewError('');
    };

    const handleAddNewImpact = () => {
        if (!newImpactType.trim()) {
            setNewError('El nombre del tipo de impacto no puede estar vacío');
            return;
        }

        // Convert to camelCase
        const camelCaseKey = newImpactType
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());

        if (tipos.some((t) => t.clave === camelCaseKey)) {
            setNewError('Este tipo de impacto ya existe');
            return;
        }

        onAddTipo({ clave: camelCaseKey, nombre: newImpactType.trim() });
        handleCloseNew();
    };

    const handleDeleteImpact = (row: any) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el tipo de impacto "${row.nombre}"?`)) {
            onDeleteTipo(row.id);
        }
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'nombre', headerName: 'Tipo de Impacto', flex: 1 },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleOpen(params.row)} title="Editar">
                        <EditIcon fontSize="small" sx={{ color: '#2196f3' }} />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={() => handleDeleteImpact(params.row)} 
                        title="Eliminar"
                    >
                        <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h6">Matriz de Descripción de Impactos</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Edite las descripciones para cada nivel de impacto (1-5) según el tipo.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenNew}
                    size="small"
                >
                    Agregar Tipo
                </Button>
            </Box>

            <AppDataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.id}
                onRowClick={(params) => handleOpenDetailDialog(params.row)}
            />

            {/* Diálogo para editar descripción */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Editar Descripciones: {rows.find(r => String(r.id) === editingKey)?.nombre}</DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        {[1, 2, 3, 4, 5].map((level) => (
                            <Grid2 xs={12} key={level}>
                                <TextField
                                    fullWidth
                                    label={`Nivel ${level}`}
                                    value={descriptions[level] || ''}
                                    onChange={(e) => setDescriptions({ ...descriptions, [level]: e.target.value })}
                                    multiline
                                    rows={2}
                                />
                            </Grid2>
                        ))}
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para agregar nuevo tipo de impacto */}
            <Dialog open={openNew} onClose={handleCloseNew} maxWidth="sm" fullWidth>
                <DialogTitle>Agregar Nuevo Tipo de Impacto</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        {newError && (
                            <Alert severity="error">{newError}</Alert>
                        )}
                        <TextField
                            fullWidth
                            label="Nombre del Tipo de Impacto"
                            placeholder="Ej: Ambiental, Operativo, etc."
                            value={newImpactType}
                            onChange={(e) => {
                                setNewImpactType(e.target.value);
                                setNewError('');
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAddNewImpact();
                                }
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            El nombre se convertirá automáticamente a formato camelCase (ej: "Análisis de Riesgo" → "analisisDeRiesgo")
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseNew} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleAddNewImpact} variant="contained" startIcon={<AddIcon />}>Agregar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del Tipo de Impacto</DialogTitle>
                <DialogContent>
                    {selectedDetailId !== null && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            {(() => {
                                const row = rows.find((r) => r.id === selectedDetailId);
                                if (!row) return null;
                                return (
                                    <>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">ID</Typography>
                                            <Typography variant="body1">{row.id}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Nombre</Typography>
                                            <Typography variant="body1">{row.nombre}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Clave</Typography>
                                            <Typography variant="body1">{row.clave}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Descripciones por Nivel</Typography>
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <Box key={level} sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">Nivel {level}:</Typography>
                                                    <Typography variant="body2">{nivelesByTipo[row.id]?.[level] || '-'}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </>
                                );
                            })()}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        if (selectedDetailId === null) return;
                        const row = rows.find((r) => r.id === selectedDetailId);
                        if (row) {
                            handleOpen(row);
                            handleCloseDetailDialog();
                        }
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
