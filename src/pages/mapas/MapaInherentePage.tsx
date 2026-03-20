/**
 * Mapa de Riesgo Inherente Page
 * Muestra solo el mapa de riesgo inherente
 */

import MapaPage from './MapaPage';
import { useEffect } from 'react';
import { useCoraIAContext } from '../../contexts/CoraIAContext';
import type { ScreenContext } from '../../types/ia.types';
import { useProceso } from '../../contexts/ProcesoContext';

export default function MapaInherentePage() {
  const { setScreenContext } = useCoraIAContext();
  const { procesoSeleccionado } = useProceso();

  // Contexto de pantalla para CORA IA
  useEffect(() => {
    if (procesoSeleccionado && setScreenContext) {
      const context: ScreenContext = {
        module: 'mapas',
        screen: 'inherente',
        action: 'view',
        processId: procesoSeleccionado.id,
        route: window.location.pathname,
        formData: {
          tipoMapa: 'inherente',
          procesoNombre: procesoSeleccionado.nombre,
        },
      };
      setScreenContext(context);
    }
  }, [procesoSeleccionado, setScreenContext]);

  return <MapaPage />;
}

