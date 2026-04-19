import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { EstadoPlan, EstadoPlanSelectorProps } from '../../types/planAccion.types';
import { useAuth } from '../../contexts/AuthContext';

// Transiciones válidas de estado
const VALID_TRANSITIONS: Record<EstadoPlan, EstadoPlan[]> = {
  pendiente: ['en_revision'],
  en_revision: ['revisado', 'pendiente'],
  revisado: ['en_revision'],
  en_ejecucion: [],
  completado: [],
  convertido_a_control: [],
};

// Descripciones de cada estado
const ESTADO_DESCRIPTIONS: Record<EstadoPlan, string> = {
  pendiente: 'El plan está pendiente de revisión',
  en_revision: 'El plan ha sido revisado',
  revisado: 'El plan ha sido aprobado',
  en_ejecucion: 'Plan en ejecución',
  completado: 'Plan completado',
  convertido_a_control: 'Convertido a control',
};

// Etiquetas amigables para cada estado
const ESTADO_LABELS: Record<EstadoPlan, string> = {
  pendiente: 'Pendiente',
  en_revision: 'Revisado',
  revisado: 'Aprobado',
  en_ejecucion: 'En ejecución',
  completado: 'Completado',
  convertido_a_control: 'Convertido a control',
};

export const EstadoPlanSelector: React.FC<EstadoPlanSelectorProps> = ({
  estadoActual,
  onChange,
  disabled = false,
}) => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase() || '';

  const estadosValidos = VALID_TRANSITIONS[estadoActual] || [];
  const todosLosEstados: EstadoPlan[] = [
    'pendiente',
    'en_revision',
    'revisado',
    'en_ejecucion',
    'completado',
    'convertido_a_control',
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
    
    // Verificar si la transición es válida según el flujo
    if (!estadosValidos.includes(estado)) return false;

    // RESTRICCIÓN 1: Solo SUPERVISOR puede cambiar de "pendiente" a "en_revision"
    if (estadoActual === 'pendiente' && estado === 'en_revision') {
      return userRole === 'supervisor';
    }

    // RESTRICCIÓN 2: Solo GERENTE puede cambiar de "en_revision" a "revisado"
    if (estadoActual === 'en_revision' && estado === 'revisado') {
      return userRole === 'gerente' || userRole === 'gerente_general' || userRole === 'manager';
    }

    // RESTRICCIÓN 3: GERENTE NO puede volver a "pendiente" desde "en_revision"
    if (estadoActual === 'en_revision' && estado === 'pendiente') {
      if (userRole === 'gerente' || userRole === 'gerente_general' || userRole === 'manager') {
        return false;
      }
    }

    // Otras transiciones permitidas
    return true;
  };

  const getDisabledReason = (estado: EstadoPlan): string => {
    if (estado === estadoActual) return ESTADO_DESCRIPTIONS[estado];
    if (!estadosValidos.includes(estado)) return 'Transición no permitida desde el estado actual';

    // Mensajes específicos para restricciones de roles
    if (estadoActual === 'pendiente' && estado === 'en_revision') {
      if (userRole !== 'supervisor') {
        return 'Solo el Supervisor puede cambiar de Pendiente a Revisado';
      }
    }

    if (estadoActual === 'en_revision' && estado === 'revisado') {
      if (userRole !== 'gerente' && userRole !== 'gerente_general' && userRole !== 'manager') {
        return 'Solo el Gerente puede cambiar de Revisado a Aprobado';
      }
    }

    if (estadoActual === 'en_revision' && estado === 'pendiente') {
      if (userRole === 'gerente' || userRole === 'gerente_general' || userRole === 'manager') {
        return 'El Gerente no puede devolver planes a estado Pendiente';
      }
    }

    return ESTADO_DESCRIPTIONS[estado];
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
              title={getDisabledReason(estado)}
            >
              {ESTADO_LABELS[estado]}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
