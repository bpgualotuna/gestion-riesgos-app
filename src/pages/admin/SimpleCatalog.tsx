
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

interface SimpleCatalogProps {
    title: string;
    data: any[];
    columns: GridColDef[];
    onSave: (item: any) => void;
    onDelete: (id: any) => void;
    itemLabel: string;
    defaultItem: any;
}

export default function SimpleCatalog({
    title,
    data,
    columns,
    onSave,
    onDelete,
    itemLabel,
    defaultItem
}: SimpleCatalogProps) {
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>(defaultItem);
    const [isView, setIsView] = useState(false);

    const handleOpen = (item?: any, mode: 'view' | 'edit' = 'edit') => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
            setIsView(mode === 'view');
        } else {
            setEditingItem(null);
            setFormData({ ...defaultItem });
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
        onSave(formData);
        handleClose();
    };

    const actionColumn: GridColDef = {
        field: 'actions',
        headerName: 'Acciones',
        width: 120,
        renderCell: (params) => (
            <Box>
                <IconButton size="small" onClick={() => handleOpen(params.row)} color="primary">
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(params.row.id)} color="error">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
        ),
    };

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen(undefined, 'edit')}>
                    Nuevo {itemLabel}
                </Button>
            </Box>

            <AppDataGrid
                rows={data}
                columns={[...columns, actionColumn]}
                getRowId={(row) => row.id}
                onRowClick={(params) => handleOpen(params.row, 'view')}
            />

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingItem
                        ? (isView ? `Ver ${itemLabel}` : `Editar ${itemLabel}`)
                        : `Nuevo ${itemLabel}`}
                </DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        {Object.keys(defaultItem).filter(k => k !== 'id').map((key) => (
                            <Grid2 xs={12} key={key}>
                                <TextField
                                    fullWidth
                                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                                    value={formData[key] || ''}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    required
                                    disabled={isView}
                                />
                            </Grid2>
                        ))}
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} startIcon={<CancelIcon />}>
                        {isView ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {!isView && (
                        <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>
                            Guardar
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
