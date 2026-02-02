/**
 * Hook helper para verificar el modo del proceso
 */
import { useProceso } from '../contexts/ProcesoContext';

export function useModoProceso() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const isReadOnly = modoProceso === 'visualizar';
  const isEditMode = modoProceso === 'editar';
  
  return {
    procesoSeleccionado,
    modoProceso,
    isReadOnly,
    isEditMode,
  };
}

