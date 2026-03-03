
import { useState, useMemo, useCallback } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';

interface SimpleCatalogProps {
    title: string;
    data: any[];
    columns: GridColDef[];
    onSave: (item: any) => void;
    onDelete: (id: any) => void;
    itemLabel: string;
    defaultItem: any;
    initialPageSize?: number;
    canEdit?: boolean;
}

export default function SimpleCatalog({
    title,
    data,
    columns,
    onSave,
    onDelete,
    itemLabel,
    defaultItem,
    initialPageSize,
    canEdit: canEditProp
}: SimpleCatalogProps) {
    const { puedeEditar } = useAuth();
    const canEdit = canEditProp !== false && puedeEditar !== false;
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>(defaultItem);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

    const handleOpen = useCallback((item?: any) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({ ...defaultItem });
        }
        setOpen(true);
    }, [defaultItem]);

    const handleClose = () => {
        setOpen(false);
        setEditingItem(null);
    };

    const handleOpenDetailDialog = useCallback((item: any) => {
        setSelectedDetail(item);
        setDetailDialogOpen(true);
    }, []);

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
                <IconButton size="small" onClick={() => handleOpen(params.row)} disabled={!canEdit}>
                    <EditIcon fontSize="small" sx={{ color: '#2196f3' }} />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(params.row.id)} disabled={!canEdit}>
                    <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />
                </IconButton>
            </Box>
        ),
    }), [handleOpen, onDelete, canEdit]);

    const allColumns = useMemo(() => [...columns, actionColumn], [columns, actionColumn]);

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{title}</Typography>
                {canEdit && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                        Nuevo {itemLabel}
                    </Button>
                )}
            </Box>

            <AppDataGrid
                rows={data}
                columns={allColumns}
                getRowId={(row) => row.id}
                onRowClick={(params) => handleOpenDetailDialog(params.row)}
                initialState={initialPageSize != null ? { pagination: { paginationModel: { pageSize: initialPageSize } } } : undefined}
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
                                        type={col.type === 'number' ? 'number' : 'text'}
                                        inputProps={col.type === 'number' ? { min: 1, max: 5 } : undefined}
                                        value={formData[col.field] ?? (col.type === 'number' ? 0 : '')}
                                        onChange={(e) => {
                                            const value = col.type === 'number' 
                                                ? (e.target.value === '' ? null : Number(e.target.value))
                                                : e.target.value;
                                            setFormData({ ...formData, [col.field]: value });
                                        }}
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
                    <Button onClick={handleSave} variant="contained" startIcon={<SaveIcon />} disabled={!canEdit}>Guardar</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DE DETALLE */}
            <Dialog open={detailDialogOpen} onClose={handleCloseDetailDialog} maxWidth="sm" PaperProps={{ sx: { maxWidth: 520 } }}>
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
                    }} variant="contained" startIcon={<EditIcon />} disabled={!canEdit}>
                        Editar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
