/**
 * Hook para sincronizar el proceso seleccionado con la gestión
 * Cuando se selecciona un proceso, actualiza automáticamente la gestión según el tipo del proceso
 */

import { useEffect } from 'react';
import { useProceso } from '../contexts/ProcesoContext';
import { useGestion, type TipoGestion } from '../contexts/GestionContext';

// Mapeo de tipos de proceso a gestiones
// Los tipos pueden venir como números ('1', '2', '3') o como texto ('Estratégico', 'Operacional')
const TIPO_A_GESTION: Record<string, TipoGestion> = {
  // Tipos numéricos (del backend)
  '1': 'estrategica',
  '01': 'estrategica',
  '2': 'riesgos',
  '02': 'riesgos',
  '3': 'financiera',
  '03': 'financiera',
  '4': 'administrativa',
  '04': 'administrativa',
  
  // Tipos textuales
  'estratégico': 'estrategica',
  'estrategico': 'estrategica',
  'estrategia': 'estrategica',
  'operacional': 'riesgos',
  'operativo': 'riesgos',
  'operacion': 'riesgos',
  'comercial': 'comercial',
  'talento humano': 'talento',
  'talento': 'talento',
  'tesorería': 'tesoreria',
  'tesoreria': 'tesoreria',
  'financiera': 'financiera',
  'financiero': 'financiera',
  'administrativa': 'administrativa',
  'administrativo': 'administrativa',
  'cumplimiento': 'administrativa',
  'nómina': 'nomina',
  'nomina': 'nomina',
};

export function useSyncProcesoToGestion() {
  const { procesoSeleccionado } = useProceso();
  const { setGestionSeleccionada } = useGestion();

  useEffect(() => {
    if (!procesoSeleccionado) {
      return;
    }

    // Obtener el tipo del proceso
    const tipoOriginal = procesoSeleccionado.tipo || '';
    const tipo = String(tipoOriginal).toLowerCase().trim();
    
    // Primero intentar coincidencia exacta (para números como '1', '2', etc.)
    if (TIPO_A_GESTION[tipo]) {
      const gestion = TIPO_A_GESTION[tipo];
      setGestionSeleccionada(gestion);
      return;
    }
    
    // Si no hay coincidencia exacta, buscar con includes (para textos como 'estratégico')
    for (const [tipoKey, gestion] of Object.entries(TIPO_A_GESTION)) {
      if (tipo.includes(tipoKey)) {
        setGestionSeleccionada(gestion);
        return;
      }
    }

    // Si no se encuentra, usar 'riesgos' por defecto
    setGestionSeleccionada('riesgos');
  }, [procesoSeleccionado, setGestionSeleccionada]);
}
