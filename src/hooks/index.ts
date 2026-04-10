/**
 * Punto de entrada de hooks reutilizables.
 * Importar desde aquí para mantener el código escalable y consistente.
 */

export {
  useAreasProcesosAsignados,
  useProcesosVisibles,
  useProcesosFiltradosPorArea,
  useProcesosGerenciales,
  useIsReadOnlyProceso,
  esUsuarioResponsableProceso,
  isProcesoGerencial,
} from './useAsignaciones';
export type { AreaOption } from './useAsignaciones';
export { useSaveWithFeedback } from './useSaveWithFeedback';
export { useNotification } from './useNotification';
export { useUnsavedChanges, useFormChanges, useArrayChanges } from './useUnsavedChanges';
export { useSafeProcesoById } from './useSafeProcesoById';
export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';
export { useCampoEditable } from './useCampoEditable';
