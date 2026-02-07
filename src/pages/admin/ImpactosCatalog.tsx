
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
    data: Record<string, Record<number, string>>;
    onSave: (data: Record<string, Record<number, string>>) => void;
}

// Mapeo de IDs a nombres de tipos de impacto
const IMPACT_TYPE_LABELS: Record<string, string> = {
    '1': 'Ambiental',
    '2': 'Confidencialidad',
    '3': 'Disponibilidad SGSI',
    '4': 'Económico',
    '5': 'Integridad SGSI',
    '6': 'Legal/Normativo',
    '7': 'Personas',
    '8': 'Procesos',
    '9': 'Reputacional',
};

export default function ImpactosCatalog({ data, onSave }: ImpactosCatalogProps) {
    const [open, setOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [descriptions, setDescriptions] = useState<Record<number, string>>({});
    const [openNew, setOpenNew] = useState(false);
    const [newImpactType, setNewImpactType] = useState('');
    const [newError, setNewError] = useState('');

    // Convert object to array for DataGrid
    const rows = Object.keys(data).map(key => ({
        id: key,
        nombre: IMPACT_TYPE_LABELS[key] || 'Desconocido',
        key: key
    }));

    const handleOpen = (row: any) => {
        setEditingKey(row.key);
        setDescriptions({ ...data[row.key] });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingKey(null);
    };

    const handleSave = () => {
        if (editingKey) {
            const newData = { ...data };
            newData[editingKey] = descriptions;
            onSave(newData);
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

        if (data.hasOwnProperty(camelCaseKey)) {
            setNewError('Este tipo de impacto ya existe');
            return;
        }

        // Create new impact type with default empty descriptions
        const newData = { ...data };
        newData[camelCaseKey] = {
            1: '',
            2: '',
            3: '',
            4: '',
            5: '',
        };
        onSave(newData);
        handleCloseNew();
    };

    const handleDeleteImpact = (key: string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar el tipo de impacto "${key}"?`)) {
            const newData = { ...data };
            delete newData[key];
            onSave(newData);
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
                    <IconButton size="small" onClick={() => handleOpen(params.row)} color="primary" title="Editar">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={() => handleDeleteImpact(params.row.key)} 
                        color="error"
                        title="Eliminar"
                    >
                        <DeleteIcon fontSize="small" />
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
            />

            {/* Diálogo para editar descripción */}
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Editar Descripciones: {rows.find(r => r.key === editingKey)?.nombre}</DialogTitle>
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
        </Box>
    );
}
