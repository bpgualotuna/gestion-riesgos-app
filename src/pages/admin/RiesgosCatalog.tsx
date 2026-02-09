
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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import AppDataGrid from '../../components/ui/AppDataGrid';
import { GridColDef } from '@mui/x-data-grid';
import { TipoRiesgo } from '../../types';

interface RiesgosCatalogProps {
    data: TipoRiesgo[];
    onSave: (items: TipoRiesgo[]) => void;
}

export default function RiesgosCatalog({ data, onSave }: RiesgosCatalogProps) {
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TipoRiesgo | null>(null);
    const [formData, setFormData] = useState<TipoRiesgo>({
        codigo: '',
        nombre: '',
        descripcion: '',
        subtipos: []
    });
    const [isView, setIsView] = useState(false);

    const [newSubtipo, setNewSubtipo] = useState({ codigo: '', descripcion: '' });

    const handleOpen = (item?: TipoRiesgo, mode: 'view' | 'edit' = 'edit') => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item, subtipos: [...item.subtipos] });
            setIsView(mode === 'view');
        } else {
            setEditingItem(null);
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                subtipos: []
            });
            setIsView(false);
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingItem(null);
        setIsView(false);
    };

    const handleSave = () => {
        let newData = [...data];
        if (editingItem) {
            const index = newData.findIndex(d => d.codigo === editingItem.codigo);
            if (index !== -1) newData[index] = formData;
        } else {
            newData.push(formData);
        }
        onSave(newData);
        handleClose();
    };

    const handleDelete = (codigo: string) => {
        if (window.confirm('¿Está seguro de eliminar este tipo de riesgo?')) {
            const newData = data.filter(d => d.codigo !== codigo);
            onSave(newData);
        }
    };

    const handleAddSubtipo = () => {
        if (newSubtipo.codigo && newSubtipo.descripcion) {
            setFormData({
                ...formData,
                subtipos: [...formData.subtipos, newSubtipo]
            });
            setNewSubtipo({ codigo: '', descripcion: '' });
        }
    };

    const handleRemoveSubtipo = (index: number) => {
        const newSubtipos = [...formData.subtipos];
        newSubtipos.splice(index, 1);
        setFormData({ ...formData, subtipos: newSubtipos });
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'codigo', headerName: 'Código', width: 150 },
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'descripcion', headerName: 'Descripción', flex: 2 },
        {
            field: 'subtipos',
            headerName: 'Subtipos',
            width: 100,
            valueGetter: (value, row) => row.subtipos?.length || 0
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            renderCell: (params) => (
                <Box>
                    <IconButton size="small" onClick={() => handleOpen(params.row)} color="primary">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(params.row.codigo)} color="error">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    // Transformar datos para agregar id basado en codigo
    const rowsWithId = data.map(item => ({ ...item, id: item.codigo }));

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Tipos de Riesgo</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(undefined, 'edit')}>
                    Nuevo Tipo
                </Button>
            </Box>

            <AppDataGrid
                rows={rowsWithId}
                columns={columns}
                onRowClick={(params) => handleOpen(params.row, 'view')}
            />

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingItem
                        ? (isView ? 'Ver Tipo de Riesgo' : 'Editar Tipo de Riesgo')
                        : 'Nuevo Tipo de Riesgo'}
                </DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        <Grid2 xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Código"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                disabled={!!editingItem || isView} // Code is ID, usually immutable widely
                                required
                            />
                        </Grid2>
                        <Grid2 xs={12} md={8}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                required
                                disabled={isView}
                            />
                        </Grid2>
                        <Grid2 xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                multiline
                                rows={2}
                                disabled={isView}
                            />
                        </Grid2>

                        <Grid2 xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Subtipos</Typography>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <TextField
                                        label="Código Subtipo"
                                        size="small"
                                        value={newSubtipo.codigo}
                                        onChange={(e) => setNewSubtipo({ ...newSubtipo, codigo: e.target.value })}
                                        disabled={isView}
                                    />
                                    <TextField
                                        label="Descripción Subtipo"
                                        size="small"
                                        fullWidth
                                        value={newSubtipo.descripcion}
                                        onChange={(e) => setNewSubtipo({ ...newSubtipo, descripcion: e.target.value })}
                                        disabled={isView}
                                    />
                                    {!isView && (
                                        <IconButton onClick={handleAddSubtipo} color="primary" disabled={!newSubtipo.codigo || !newSubtipo.descripcion}>
                                            <AddIcon />
                                        </IconButton>
                                    )}
                                </Box>
                                <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                                    {formData.subtipos.map((sub, index) => (
                                        <ListItem key={index}>
                                            <ListItemText primary={sub.codigo} secondary={sub.descripcion} />
                                            {!isView && (
                                                <ListItemSecondaryAction>
                                                    <IconButton edge="end" onClick={() => handleRemoveSubtipo(index)} size="small" color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            )}
                                        </ListItem>
                                    ))}
                                    {formData.subtipos.length === 0 && (
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            No hay subtipos agregados
                                        </Typography>
                                    )}
                                </List>
                            </Paper>
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} startIcon={<CancelIcon />}>
                        {isView ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isView && (
                        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
