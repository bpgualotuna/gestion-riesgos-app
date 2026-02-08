/**
 * Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './app/theme/variables.css';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Asegurar que el body tenga fondo claro
document.body.style.backgroundColor = '#E8E8E8';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.color = '#000';

// Asegurar que el root tenga fondo claro
rootElement.style.backgroundColor = '#E8E8E8';
rootElement.style.minHeight = '100vh';

// Función para mostrar error en pantalla
function showError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
  const errorStack = error instanceof Error ? error.stack : '';
  
  if (!rootElement) return;
  
  rootElement.innerHTML = `
    <div style="padding: 40px; text-align: center; background: #E8E8E8; min-height: 100vh; color: #000; font-family: Arial, sans-serif;">
      <h1 style="color: #d32f2f; margin-bottom: 20px;">Error al cargar la aplicación</h1>
      <p style="color: #d32f2f; font-size: 18px; margin: 20px 0;">${errorMessage}</p>
      ${errorStack ? `<pre style="text-align: left; background: #fff; padding: 20px; border-radius: 4px; overflow: auto; max-width: 800px; margin: 20px auto; font-size: 12px;">${errorStack}</pre>` : ''}
      <button onclick="window.location.reload()" style="padding: 12px 24px; margin-top: 20px; cursor: pointer; background: #c8d900; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; color: #000;">
        Recargar Página
      </button>
      <p style="margin-top: 20px; color: #666;">Revisa la consola del navegador (F12) para más detalles</p>
    </div>
  `;
}

// Capturar errores globales y promesas rechazadas
window.addEventListener('error', (event) => {
  console.error('❌ Error global:', event.error || event.message);
  showError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesa rechazada:', event.reason);
  showError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

// Deshabilitar service workers problemáticos en desarrollo
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().catch(() => {
        // Ignorar errores al desregistrar
      });
    });
  });
}

console.log('%c🚀 INICIANDO APLICACIÓN', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
console.log('%c📍 URL:', 'color: #2196F3; font-weight: bold;', window.location.href);
console.log('%c🌐 User Agent:', 'color: #9C27B0; font-weight: bold;', navigator.userAgent);

// Renderizar con manejo de errores mejorado
try {
  console.log('%c📦 Cargando módulos...', 'color: #FF9800; font-weight: bold;');
  
  const root = createRoot(rootElement);
  console.log('%c✅ Root creado correctamente', 'color: #4CAF50; font-weight: bold;');

  console.log('%c🎨 Renderizando componente App...', 'color: #E91E63; font-weight: bold;');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('%c✅ Aplicación renderizada correctamente', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
  
  // Timeout de seguridad: si después de 5 segundos no hay contenido, mostrar mensaje
  setTimeout(() => {
    if (rootElement.children.length === 0 || rootElement.textContent?.trim() === '') {
      console.warn('⚠️ La aplicación no ha renderizado contenido después de 5 segundos');
      rootElement.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #E8E8E8; min-height: 100vh; color: #000; font-family: Arial, sans-serif;">
          <h1 style="color: #f57c00;">La aplicación está cargando...</h1>
          <p style="color: #666; margin: 20px 0;">Si esta pantalla persiste, revisa la consola del navegador (F12)</p>
          <div style="margin: 30px auto; width: 50px; height: 50px; border: 4px solid #c8d900; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
          <button onclick="window.location.reload()" style="padding: 12px 24px; margin-top: 20px; cursor: pointer; background: #c8d900; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; color: #000;">
            Recargar Página
          </button>
        </div>
      `;
    }
  }, 5000);
  
} catch (error) {
  console.error('❌ ERROR CRÍTICO al renderizar:', error);
  showError(error);
}
