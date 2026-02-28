import { useEffect } from 'react';
import { getConfigActiva } from '../services/calificacionInherenteService';

/**
 * Hook para inicializar y mantener el cache de configuración de calificación inherente
 * Se ejecuta automáticamente cuando el componente se monta
 */
export function useCalificacionInherenteConfig() {
  useEffect(() => {
    // Precargar la configuración al montar el componente
    getConfigActiva().catch(() => {});
  }, []);
}

