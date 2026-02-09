
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
import Grid2 from '../../utils/Grid2';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import type { Proceso, Usuario } from '../../types';
import { useGetUsuariosQuery, useGetProcesosQuery, useUpdateProcesoMutation } from '../../api/services/riesgosApi';

export default function PermisosPage() {
    const { esAdmin } = useAuth();
    const { showSuccess, showError } = useNotification();
    const { data: procesosData = [] } = useGetProcesosQuery(undefined, { skip: !esAdmin });
    const { data: usuariosData = [] } = useGetUsuariosQuery(undefined, { skip: !esAdmin });
    const [updateProceso] = useUpdateProcesoMutation();
    const procesos = Array.isArray(procesosData) ? procesosData : [];
    const usuarios = Array.isArray(usuariosData) ? usuariosData : [];

    const [procesoId, setProcesoId] = useState<string>('');
    const [puedeCrear, setPuedeCrear] = useState<string[]>([]);


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
        try {
            await updateProceso({ id: procesoId, puedeCrear }).unwrap();
            showSuccess('Permisos de creación actualizados correctamente');
        } catch {
            showError('Error al actualizar permisos');
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom fontWeight={700}>
                    Permisos de Creación
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Asigne qué usuarios tienen permiso para registrar riesgos en procesos específicos.
                </Typography>
            </Box>

            <Grid2 container spacing={3} sx={{ maxWidth: 800 }}>
                <Grid2 xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Proceso</InputLabel>
                        <Select
                            value={procesoId}
                            onChange={(e) => setProcesoId(e.target.value)}
                            label="Proceso"
                        >
                            <MenuItem value="">Seleccione un proceso</MenuItem>
                            {procesos.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.nombre}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid2>

                <Grid2 xs={12} md={6}>
                    <Autocomplete
                        multiple
                        options={usuarios}
                        getOptionLabel={(option) => `${option.nombre} (${option.role})`}
                        value={usuarios.filter((u) => puedeCrear.includes(u.id))}
                        onChange={(_event, newValue) => {
                            setPuedeCrear(newValue.map((u) => u.id));
                        }}
                        renderInput={(params) => (
                            <TextField {...params} label="Usuarios autorizados a crear" />
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
                </Grid2>

                <Grid2 xs={12}>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={!procesoId}
                        size="large"
                    >
                        Guardar Permisos
                    </Button>
                </Grid2>
            </Grid2>
        </Box>
    );
}
