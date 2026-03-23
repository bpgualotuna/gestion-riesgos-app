import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { EstadoPlan, EstadoPlanSelectorProps } from '../../types/planAccion.types';

// Transiciones válidas de estado
const VALID_TRANSITIONS: Record<EstadoPlan, EstadoPlan[]> = {
  pendiente: ['en_revision'],
  en_revision: ['revisado', 'pendiente'],
  revisado: ['en_revision'],
};

// Descripciones de cada estado
const ESTADO_DESCRIPTIONS: Record<EstadoPlan, string> = {
  pendiente: 'El plan está pendiente de revisión',
  en_revision: 'El plan está siendo revisado',
  revisado: 'El plan ha sido revisado y aprobado',
};

// Etiquetas amigables para cada estado
const ESTADO_LABELS: Record<EstadoPlan, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  revisado: 'Revisado',
};

export const EstadoPlanSelector: React.FC<EstadoPlanSelectorProps> = ({
  estadoActual,
  onChange,
  disabled = false,
}) => {
  const estadosValidos = VALID_TRANSITIONS[estadoActual] || [];
  const todosLosEstados: EstadoPlan[] = [
    'pendiente',
    'en_revision',
    'revisado',
  ];

  const handleChange = (event: SelectChangeEvent<EstadoPlan>) => {
    const nuevoEstado = event.target.value as EstadoPlan;
    console.log('🎯 EstadoPlanSelector - handleChange:', {
      estadoActual,
      nuevoEstado,
      esIgual: estadoActual === nuevoEstado
    });
    onChange(nuevoEstado);
  };

  const isEstadoDisponible = (estado: EstadoPlan): boolean => {
    // El estado actual siempre está disponible (para mostrar)
    if (estado === estadoActual) return true;
    // Los estados válidos para transición están disponibles
    return estadosValidos.includes(estado);
  };

  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <InputLabel id="estado-plan-label">Estado</InputLabel>
      <Select
        labelId="estado-plan-label"
        id="estado-plan-select"
        value={estadoActual}
        label="Estado"
        onChange={handleChange}
      >
        {todosLosEstados.map((estado) => {
          const disponible = isEstadoDisponible(estado);
          
          return (
            <MenuItem
              key={estado}
              value={estado}
              disabled={!disponible}
              title={disponible ? ESTADO_DESCRIPTIONS[estado] : 'Transición no permitida desde el estado actual'}
            >
              {ESTADO_LABELS[estado]}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
