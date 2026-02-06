/**
 * Componente de Filtros para el Dashboard
 * Extraído para mejorar escalabilidad
 */

import { Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface DashboardFiltrosProps {
  filtroProceso: string;
  filtroNumeroRiesgo: string;
  filtroOrigen: string;
  onFiltroProcesoChange: (value: string) => void;
  onFiltroNumeroRiesgoChange: (value: string) => void;
  onFiltroOrigenChange: (value: string) => void;
  procesos: any[];
  riesgos: any[];
}

export default function DashboardFiltros({
  filtroProceso,
  filtroNumeroRiesgo,
  filtroOrigen,
  onFiltroProcesoChange,
  onFiltroNumeroRiesgoChange,
  onFiltroOrigenChange,
  procesos,
  riesgos,
}: DashboardFiltrosProps) {
  return (
    <Box sx={{ mb: 4, display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
      <FormControl
        size="medium"
        sx={{
          minWidth: 200,
          backgroundColor: 'white',
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <InputLabel sx={{ fontWeight: 600 }}>Proceso</InputLabel>
        <Select value={filtroProceso} onChange={(e) => onFiltroProcesoChange(e.target.value)} label="Proceso">
          <MenuItem value="all">Todas</MenuItem>
          {procesos.map((p: any) => (
            <MenuItem key={p.id} value={p.id}>
              {p.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="medium"
        sx={{
          minWidth: 170,
          backgroundColor: 'white',
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <InputLabel sx={{ fontWeight: 600 }}># Riesgo</InputLabel>
        <Select value={filtroNumeroRiesgo} onChange={(e) => onFiltroNumeroRiesgoChange(e.target.value)} label="# Riesgo">
          <MenuItem value="all">Todas</MenuItem>
          {Array.from(new Set(riesgos.map((r: any) => `R${String(r.numero || 0).padStart(3, '0')}`))).map((codigo) => (
            <MenuItem key={codigo} value={codigo}>
              {codigo}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl
        size="medium"
        sx={{
          minWidth: 170,
          backgroundColor: 'white',
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <InputLabel sx={{ fontWeight: 600 }}>Origen</InputLabel>
        <Select value={filtroOrigen} onChange={(e) => onFiltroOrigenChange(e.target.value)} label="Origen">
          <MenuItem value="all">Todas</MenuItem>
          <MenuItem value="talleres">Talleres internos</MenuItem>
          <MenuItem value="auditoria">Auditoría HHI</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

