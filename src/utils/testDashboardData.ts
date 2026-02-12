/**
 * Utilidad para testear datos del dashboard
 * Ejecutar en la consola del navegador para ver qué datos están llegando
 */

export const testDashboardData = () => {
  console.log('🧪 TEST: Verificando datos del dashboard');
  
  // Este archivo se puede importar en el dashboard para hacer tests
  return {
    test: 'Dashboard Data Test',
    timestamp: new Date().toISOString()
  };
};

// Función para ejecutar en la consola del navegador
(window as any).testDashboard = () => {
  console.log('🧪 TEST: Dashboard Data');
  console.log('Ejecuta esto en la consola del navegador para ver los datos');
};

