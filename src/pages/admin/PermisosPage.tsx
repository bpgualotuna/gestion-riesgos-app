
import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Chip,
    Autocomplete,
    Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save as SaveIcon } from '@mui/icons-material';
import AppPageLayout from '../../components/layout/AppPageLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import type { Proceso, Usuario } from '../../types';
import {
    getMockUsuarios,
    getMockProcesos, updateMockProceso
} from '../../api/services/mockData';

export default function PermisosPage() {
    const { esAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();

    const [procesos, setProcesos] = useState<Proceso[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    const [procesoId, setProcesoId] = useState<string>('');
    const [puedeCrear, setPuedeCrear] = useState<string[]>([]);

    useEffect(() => {
        setProcesos(getMockProcesos());
        setUsuarios(getMockUsuarios());
    }, []);

    // Update selection when process changes
    useEffect(() => {
        if (procesoId) {
            const proceso = procesos.find(p => p.id === procesoId);
            if (proceso) {
                setPuedeCrear(proceso.puedeCrear || []);
            }
        } else {
            setPuedeCrear([]);
        }
    }, [procesoId, procesos]);

    if (!esAdmin) {
        return (
            <Box>
                <Alert severity="error">
                    No tiene permisos para acceder a esta página.
                </Alert>
            </Box>
        );
    }

    const handleSave = async () => {
        if (!procesoId) {
            showError('Debe seleccionar un proceso');
            return;
        }

        const procesoToUpdate = procesos.find(p => p.id === procesoId);
        if (procesoToUpdate) {
            // Mock update
            const updatedProceso = { ...procesoToUpdate, puedeCrear };
            // In a real app we would call API
            // await updateProceso(updatedProceso);

            showSuccess('Permisos de creación actualizados correctamente');
        }
    };

    return (
        <AppPageLayout
            title="Permisos de Creación"
            description="Asigne qué usuarios tienen permiso para registrar riesgos en procesos específicos."
        >
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControl fullWidth>
                    <InputLabel>Proceso</InputLabel>
                    <Select
                        value={procesoId}
                        onChange={(e) => setProcesoId(e.target.value)}
                        label="Proceso"
                    >
                        <MenuItem value=""><em>Seleccione un proceso</em></MenuItem>
                        {procesos.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                                {p.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Autocomplete
                    multiple
                    options={usuarios}
                    getOptionLabel={(option) => `${option.nombre} (${option.role})`}
                    value={usuarios.filter((u) => puedeCrear.includes(u.id))}
                    onChange={(_event, newValue) => {
                        setPuedeCrear(newValue.map((u) => u.id));
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Usuarios autorizados a crear" placeholder="Seleccionar usuarios" />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                label={`${option.nombre} (${option.role})`}
                                {...getTagProps({ index })}
                                key={option.id}
                            />
                        ))
                    }
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!procesoId}
                        size="large"
                    >
                        Guardar Permisos
                    </Button>
                </Box>
            </Box>
        </AppPageLayout>
    );
}
