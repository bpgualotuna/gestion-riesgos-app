
import { useState, useMemo } from 'react';
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
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

    const handleOpen = (item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({ ...defaultItem });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingItem(null);
    };

    const handleOpenDetailDialog = (item: any) => {
        setSelectedDetail(item);
        setDetailDialogOpen(true);
    };

    const handleCloseDetailDialog = () => {
        setDetailDialogOpen(false);
        setSelectedDetail(null);
    };

    const handleSave = () => {
        onSave(formData);
        handleClose();
    };

    const actionColumn: GridColDef = useMemo(() => ({
        field: 'actions',
        headerName: 'Acciones',
        width: 120,
        renderCell: (params) => (
            <Box>
                <IconButton size="small" onClick={() => handleOpen(params.row)}>
                    <EditIcon fontSize="small" sx={{ color: '#2196f3' }} />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(params.row.id)}>
                    <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                </IconButton>
            </Box>
        ),
    }), []);

    const allColumns = useMemo(() => [...columns, actionColumn], [columns, actionColumn]);

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                    Nuevo {itemLabel}
                </Button>
            </Box>

            <AppDataGrid
                rows={data}
                columns={allColumns}
                getRowId={(row) => row.id}
                onRowClick={(params) => handleOpenDetailDialog(params.row)}
            />

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>{editingItem ? `Editar ${itemLabel}` : `Nuevo ${itemLabel}`}</DialogTitle>
                <DialogContent>
                    <Grid2 container spacing={2} sx={{ mt: 1 }}>
                        {columns.map((col) => {
                            if (col.field === 'actions') return null;
                            if (col.field === 'id') return null;
                            if (col.field === 'codigo' && col.editable === false) return null;
                            const isEditable = col.editable !== false;
                            return (
                                <Grid2 xs={12} key={col.field}>
                                    <TextField
                                        fullWidth
                                        label={col.headerName || col.field}
                                        value={formData[col.field] || ''}
                                        onChange={(e) => setFormData({ ...formData, [col.field]: e.target.value })}
                                        disabled={!isEditable && !!editingItem} // Disable only if editing existing
                                        required={isEditable}
                                    />
                                </Grid2>
                            );
                        })}
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} startIcon={<CancelIcon />}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Información del {itemLabel}</DialogTitle>
                <DialogContent>
                    {selectedDetail && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            {Object.keys(defaultItem).map((key) => (
                                <Box key={key}>
                                    <Typography variant="body2" color="text.secondary">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </Typography>
                                    <Typography variant="body1">{selectedDetail[key] || '-'}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailDialog}>Cerrar</Button>
                    <Button onClick={() => {
                        handleOpen(selectedDetail!);
                        handleCloseDetailDialog();
                    }} variant="contained" startIcon={<EditIcon />}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
