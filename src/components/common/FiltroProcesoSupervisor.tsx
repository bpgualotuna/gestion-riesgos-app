/**
 * Filtro de Proceso para Supervisores
 * Componente reutilizable que permite a supervisores filtrar y seleccionar procesos
 */

import { useMemo, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
} from '@mui/material';
import { useProceso } from '../../contexts/ProcesoContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGetProcesosQuery } from '../../api/services/riesgosApi';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';
import { useNotification } from '../../hooks/useNotification';

interface FiltroProcesoSupervisorProps {
    /** Si se proporciona, muestra solo si el usuario tiene permisos de supervisor */
    soloSupervisores?: boolean;
}

export default function FiltroProcesoSupervisor({ soloSupervisores = true }: FiltroProcesoSupervisorProps) {
    const { procesoSeleccionado, setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
    const { esAdmin, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, user } = useAuth();
    const { data: procesos = [] } = useGetProcesosQuery();
    const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();
    const { showSuccess } = useNotification();

    const [filtroArea, setFiltroArea] = useState<string>('all');

    // Determinar si debe mostrar los filtros
    const mostrarFiltros =
        !soloSupervisores ||
        esSupervisorRiesgos ||
        esGerenteGeneralDirector ||
        user?.role === 'supervisor' ||
        user?.role === 'gerente_general';

    // Obtener procesos disponibles según permisos
    const procesosDisponibles = useMemo(() => {
        if (esAdmin) return procesos;

        // Gerente General Director o Supervisor
        if (esGerenteGeneralDirector || esSupervisorRiesgos) {
            if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
            return procesos.filter((p: any) => {
                if (procesosAsignados.includes(String(p.id))) return true;
                if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
                return false;
            });
        }

        // Gerente General Proceso
        if (esGerenteGeneralProceso) {
            if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
            return procesos.filter((p: any) => {
                if (procesosAsignados.includes(String(p.id))) return true;
                if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
                return false;
            });
        }

        // Dueño de Proceso
        if (user?.role === 'dueño_procesos') {
            return procesos.filter((p: any) => p.responsableId === user.id);
        }

        return procesos;
    }, [procesos, esAdmin, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, areasAsignadas, procesosAsignados, user]);

    // Obtener áreas disponibles
    const areasDisponibles = useMemo(() => {
        const map = new Map<string, string>();
        procesosDisponibles.forEach((p: any) => {
            if (p.areaId) map.set(p.areaId, p.areaNombre || `Área ${p.areaId}`);
        });
        return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [procesosDisponibles]);

    // Filtrar procesos por área
    const procesosFiltrados = useMemo(() => {
        let filtrados = procesosDisponibles;
        if (filtroArea !== 'all') {
            filtrados = filtrados.filter((p: any) => p.areaId === filtroArea);
        }
        return filtrados;
    }, [procesosDisponibles, filtroArea]);

    // Eliminar duplicados
    const procesosFiltradosUnicos = useMemo(() => {
        const map = new Map<string, any>();
        procesosFiltrados.forEach((p: any) => {
            if (!map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values());
    }, [procesosFiltrados]);

    if (!mostrarFiltros) return null;

    return (
        <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 1 }}>
                        Selección de Proceso:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Área</InputLabel>
                        <Select
                            value={filtroArea}
                            onChange={(e) => setFiltroArea(e.target.value)}
                            label="Área"
                        >
                            <MenuItem value="all">Todas las áreas</MenuItem>
                            {areasDisponibles.map((area) => (
                                <MenuItem key={area.id} value={area.id}>{area.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 240 }}>
                        <InputLabel>Proceso</InputLabel>
                        <Select
                            value={procesoSeleccionado?.id || ''}
                            onChange={(e) => {
                                const id = e.target.value as string;
                                const p = procesosFiltrados.find((p) => p.id === id);
                                if (p) {
                                    setProcesoSeleccionado(p);
                                    iniciarModoVisualizar();
                                    showSuccess(`Proceso "${p.nombre}" seleccionado`);
                                }
                            }}
                            label="Proceso"
                        >
                            {procesosFiltradosUnicos.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </CardContent>
        </Card>
    );
}
