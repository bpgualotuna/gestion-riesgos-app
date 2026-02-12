import React from 'react';
import {
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Box,
    Button
} from '@mui/material';
import Grid2 from '../../utils/Grid2';
import { FilterList as FilterIcon, Clear as ClearIcon } from '@mui/icons-material';

interface DashboardFiltrosProps {
    filtroArea?: string;
    filtroProceso: string;
    filtroOrigen: string;
    onFiltroAreaChange?: (value: string) => void;
    onFiltroProcesoChange: (value: string) => void;
    onFiltroOrigenChange: (value: string) => void;
    procesos: any[];
    riesgos: any[];
    ocultarFiltroOrigen?: boolean; // Nueva prop para ocultar filtro Origen
}

const DashboardFiltros: React.FC<DashboardFiltrosProps> = ({
    filtroArea,
    filtroProceso,
    filtroOrigen,
    onFiltroAreaChange,
    onFiltroProcesoChange,
    onFiltroOrigenChange,
    procesos,
    riesgos,
    ocultarFiltroOrigen = false // Default false para mantener comportamiento existente
}) => {
    // Obtener lista única de áreas desde areaNombre de procesos
    const areas = React.useMemo(() => {
        const areasUnicas = [...new Set(procesos.map(p => p.areaNombre).filter(Boolean))];
        return areasUnicas.sort();
    }, [procesos]);

    // Filtrar procesos por área si se selecciona
    const procesosFiltradosPorArea = React.useMemo(() => {
        if (!filtroArea || filtroArea === 'all') return procesos;
        return procesos.filter(p => p.areaNombre === filtroArea);
    }, [procesos, filtroArea]);

    const handleClearFilters = () => {
        if (onFiltroAreaChange) onFiltroAreaChange('all');
        onFiltroProcesoChange('all');
        onFiltroOrigenChange('all');
    };

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight="bold">
                            Filtros del Dashboard
                        </Typography>
                    </Box>
                    {((filtroArea && filtroArea !== 'all') || filtroProceso !== 'all' || filtroOrigen !== 'all') && (
                        <Button
                            startIcon={<ClearIcon />}
                            size="small"
                            onClick={handleClearFilters}
                            variant="outlined"
                        >
                            Limpiar Filtros
                        </Button>
                    )}
                </Box>

                <Grid2 container spacing={2}>
                    {onFiltroAreaChange && (
                        <Grid2 size={{ xs: 12, md: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="filtro-area-label">Área</InputLabel>
                                <Select
                                    labelId="filtro-area-label"
                                    value={filtroArea || 'all'}
                                    label="Área"
                                    onChange={(e) => {
                                        onFiltroAreaChange(e.target.value);
                                        // Resetear filtro de proceso al cambiar área
                                        onFiltroProcesoChange('all');
                                    }}
                                >
                                    <MenuItem value="all">
                                        <em>Todas las Áreas</em>
                                    </MenuItem>
                                    {areas.map((area) => (
                                        <MenuItem key={area} value={area}>
                                            {area}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                    )}
                    <Grid2 size={{ xs: 12, md: onFiltroAreaChange ? 3 : 4 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="filtro-proceso-label">Proceso</InputLabel>
                            <Select
                                labelId="filtro-proceso-label"
                                value={filtroProceso}
                                label="Proceso"
                                onChange={(e) => {
                                        onFiltroProcesoChange(e.target.value);
                                }}
                            >
                                <MenuItem value="all">
                                    <em>Todos los Procesos</em>
                                </MenuItem>
                                {procesosFiltradosPorArea.map((proceso) => (
                                    <MenuItem key={proceso.id} value={proceso.id}>
                                        {proceso.nombre}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid2>

                    {!ocultarFiltroOrigen && (
                        <Grid2 size={{ xs: 12, md: onFiltroAreaChange ? 3 : 4 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="filtro-origen-label">Origen</InputLabel>
                                <Select
                                    labelId="filtro-origen-label"
                                    value={filtroOrigen}
                                    label="Origen"
                                    onChange={(e) => onFiltroOrigenChange(e.target.value)}
                                >
                                    <MenuItem value="all">
                                        <em>Todos los Orígenes</em>
                                    </MenuItem>
                                    <MenuItem value="talleres">Talleres</MenuItem>
                                    <MenuItem value="auditoria">Auditoría</MenuItem>
                                    <MenuItem value="otros">Otros</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid2>
                    )}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default DashboardFiltros;
