/**
 * MainLayout Wrapper
 * Envuelve MainLayout con los providers necesarios
 * Nota: AuthProvider debe estar en un nivel superior (en App.tsx)
 */

import { ProcesoProvider } from '../../contexts/ProcesoContext';
import { RiesgoProvider } from '../contexts/RiesgoContext';
import MainLayout from './MainLayout';

export default function MainLayoutWrapper() {
  // Los providers deben estar aquí porque el router se crea estáticamente
  // y los providers de App.tsx no están disponibles cuando se renderiza el router
  // Sin embargo, cuando React Router renderiza, debería estar dentro de AuthProvider
  return (
    <ProcesoProvider>
      <RiesgoProvider>
        <MainLayout />
      </RiesgoProvider>
    </ProcesoProvider>
  );
}

