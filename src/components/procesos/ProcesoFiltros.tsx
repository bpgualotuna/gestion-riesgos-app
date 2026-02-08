import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useProceso } from '../../contexts/ProcesoContext';
import { useGetProcesosQuery } from '../../api/services/riesgosApi';
import { useAreasProcesosAsignados } from '../../hooks/useAsignaciones';

export default function ProcesoFiltros() {
  const { esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDuenoProcesos, user } = useAuth();
  const { setProcesoSeleccionado, procesoSeleccionado } = useProceso();
  const { data: procesos = [] } = useGetProcesosQuery();
  const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();

  // Solo mostrar filtros para Supervisor y Gerente General Director
  // Gerente General Proceso y Dueño de Proceso NO tienen filtros
  const mostrarFiltrosProceso = esSupervisorRiesgos || esGerenteGeneralDirector;

  const [filtroArea, setFiltroArea] = useState<string>('all');

  const procesosDisponibles = useMemo(() => {
    // Gerente General en modo Director ve todos
    if (esGerenteGeneralDirector) return procesos;
    
    // Gerente General en modo Proceso ve solo procesos asignados
    if (esGerenteGeneralProceso) {
      if (procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => procesosAsignados.includes(String(p.id)));
    }
    
    // Dueño de Procesos ve solo sus procesos asignados como responsable
    if (esDuenoProcesos && user) {
      return procesos.filter((p: any) => p.responsableId === user.id);
    }
    
    // Supervisor ve solo procesos de sus áreas/procesos asignados
    if (esSupervisorRiesgos && user) {
      if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
      return procesos.filter((p: any) => {
        if (procesosAsignados.includes(String(p.id))) return true;
        if (p.areaId && areasAsignadas.includes(p.areaId)) return true;
        return false;
      });
    }
    return procesos;
  }, [procesos, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDuenoProcesos, areasAsignadas, procesosAsignados, user]);

  const areasDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    procesosDisponibles.forEach((p: any) => {
      if (p.areaId) map.set(p.areaId, p.areaNombre || `Área ${p.areaId}`);
    });
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [procesosDisponibles]);

  const procesosFiltrados = useMemo(() => {
    let filtrados = procesosDisponibles;
    if (filtroArea !== 'all') {
      filtrados = filtrados.filter((p: any) => p.areaId === filtroArea);
    }
    return filtrados;
  }, [procesosDisponibles, filtroArea]);

  if (!mostrarFiltrosProceso) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Filtros de Proceso
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Filtrar por Área</InputLabel>
            <Select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              label="Filtrar por Área"
            >
              <MenuItem value="all">Todas las áreas</MenuItem>
              {areasDisponibles.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 260 }}>
            <InputLabel>Seleccionar Proceso</InputLabel>
            <Select
              value={procesoSeleccionado?.id || ''}
              onChange={(e) => {
                const procesoId = e.target.value as string;
                const proceso = procesosFiltrados.find((p: any) => p.id === procesoId);
                if (proceso) {
                  setProcesoSeleccionado(proceso);
                }
              }}
              label="Seleccionar Proceso"
            >
              {procesosFiltrados.map((proceso: any) => (
                <MenuItem key={proceso.id} value={proceso.id}>
                  {proceso.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </CardContent>
    </Card>
  );
}
