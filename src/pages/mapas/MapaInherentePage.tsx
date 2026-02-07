/**
 * Mapa de Riesgo Inherente Page
 * Muestra solo el mapa de riesgo inherente
 */

import MapaPage from './MapaPage';
import { useEffect } from 'react';

export default function MapaInherentePage() {
  // Esta página simplemente redirige a MapaPage con tipo inherente
  // En una implementación más completa, podríamos pasar props a MapaPage
  return <MapaPage />;
}

