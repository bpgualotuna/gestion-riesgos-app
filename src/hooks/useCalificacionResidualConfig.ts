import { useGetConfiguracionResidualQuery } from '../api/services/riesgosApi';

/**
 * Precarga la configuración activa de calificación residual (controles → efectividad → riesgo residual).
 * Usar en layout o en páginas que necesiten la config.
 */
export function useCalificacionResidualConfig() {
  const { data, isLoading, error } = useGetConfiguracionResidualQuery(undefined, {
    skip: false,
  });
  return { config: data, isLoading, error };
}
