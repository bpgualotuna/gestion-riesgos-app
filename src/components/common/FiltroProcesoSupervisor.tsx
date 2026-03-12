/**
 * Filtro de Proceso para Supervisores
 * Usa useProcesosFiltradosPorArea para evitar duplicar lógica.
 */

import { useState } from 'react';
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
import { useProcesosFiltradosPorArea } from '../../hooks/useAsignaciones';
import { useNotification } from '../../hooks/useNotification';

interface FiltroProcesoSupervisorProps {
  soloSupervisores?: boolean;
  onProcesoSeleccionado?: (proceso: unknown) => void;
}

export default function FiltroProcesoSupervisor({ soloSupervisores = true, onProcesoSeleccionado }: FiltroProcesoSupervisorProps) {
  const { procesoSeleccionado, setProcesoSeleccionado, iniciarModoVisualizar } = useProceso();
  const { esAdmin, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos } = useAuth();
  const { showSuccess } = useNotification();
  const {
    areasDisponibles,
    procesosFiltradosUnicos,
    filtroArea,
    setFiltroArea,
  } = useProcesosFiltradosPorArea('all');

  const mostrarFiltros =
    !soloSupervisores ||
    esAdmin ||
    ((esSupervisorRiesgos || esGerenteGeneralDirector) && !esGerenteGeneralProceso && !esDueñoProcesos);

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
            <Select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} label="Área">
              <MenuItem value="all">Todas las áreas</MenuItem>
              {areasDisponibles.map((area) => (
                <MenuItem key={area.id} value={area.id}>{area.nombre}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Proceso</InputLabel>
            <Select
              value={procesoSeleccionado?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value as string;
                const p = procesosFiltradosUnicos.find((x) => String(x.id) === String(id));
                if (p) {
                  setProcesoSeleccionado(p);
                  iniciarModoVisualizar();
                  showSuccess(`Proceso "${p.nombre}" seleccionado`);
                  onProcesoSeleccionado?.(p);
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
