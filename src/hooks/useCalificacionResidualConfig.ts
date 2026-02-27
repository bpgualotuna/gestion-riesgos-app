import { useGetCalificacionResidualActivaQuery } from '../api/services/riesgosApi';

/**
 * Precarga la configuración activa de calificación residual (controles → efectividad → riesgo residual).
 * Usar en layout o en páginas que necesiten la config.
 */
export function useCalificacionResidualConfig() {
  const { data, isLoading, error } = useGetCalificacionResidualActivaQuery(undefined, {
    skip: false,
  });
  if (error) {
    console.warn('[useCalificacionResidualConfig] Error al precargar configuración:', error);
  }
  return { config: data, isLoading, error };
}
