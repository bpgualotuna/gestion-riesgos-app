/**
 * Application Entry Point
 */

// TEMPORALMENTE DESHABILITADO PARA DEBUG
// Sin logs en consola en todo el sistema
/*
if (typeof console !== 'undefined') {
  ['log', 'info', 'debug', 'warn', 'error'].forEach((m) => {
    const key = m as keyof Console;
    const orig = console[key];
    if (typeof orig === 'function') {
      Object.defineProperty(console, key, {
        value: () => {},
        writable: true,
        configurable: true,
      });
    }
  });
}
*/

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'sweetalert2/dist/sweetalert2.min.css';
import './app/theme/variables.css';
import './index.css';
import { initSwalTheme } from './lib/swal';

initSwalTheme();

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
  
  if (!rootElement) return;

  rootElement.replaceChildren();
  const container = document.createElement('div');
  container.style.cssText = 'padding: 40px; text-align: center; background: #E8E8E8; min-height: 100vh; color: #000; font-family: Arial, sans-serif;';

  const title = document.createElement('h1');
  title.textContent = 'Error al cargar la aplicación';
  title.style.cssText = 'color: #d32f2f; margin-bottom: 20px;';

  const message = document.createElement('p');
  message.textContent = errorMessage;
  message.style.cssText = 'color: #d32f2f; font-size: 18px; margin: 20px 0;';

  const button = document.createElement('button');
  button.textContent = 'Recargar Página';
  button.style.cssText = 'padding: 12px 24px; margin-top: 20px; cursor: pointer; background: #c8d900; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; color: #000;';
  button.addEventListener('click', () => window.location.reload());

  const help = document.createElement('p');
  help.textContent = 'Revisa la consola del navegador (F12) para más detalles';
  help.style.cssText = 'margin-top: 20px; color: #666;';

  container.append(title, message, button, help);
  rootElement.appendChild(container);
}

// Capturar errores globales y promesas rechazadas
window.addEventListener('error', (event) => {
  showError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
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

// Renderizar con manejo de errores mejorado
try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Timeout de seguridad: si después de 5 segundos no hay contenido, mostrar mensaje
  setTimeout(() => {
    if (rootElement.children.length === 0 || rootElement.textContent?.trim() === '') {
      rootElement.replaceChildren();

      const container = document.createElement('div');
      container.style.cssText = 'padding: 40px; text-align: center; background: #E8E8E8; min-height: 100vh; color: #000; font-family: Arial, sans-serif;';

      const title = document.createElement('h1');
      title.textContent = 'La aplicación está cargando...';
      title.style.cssText = 'color: #f57c00;';

      const description = document.createElement('p');
      description.textContent = 'Si esta pantalla persiste, revisa la consola del navegador (F12)';
      description.style.cssText = 'color: #666; margin: 20px 0;';

      const spinner = document.createElement('div');
      spinner.style.cssText = 'margin: 30px auto; width: 50px; height: 50px; border: 4px solid #c8d900; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;';

      const style = document.createElement('style');
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';

      const button = document.createElement('button');
      button.textContent = 'Recargar Página';
      button.style.cssText = 'padding: 12px 24px; margin-top: 20px; cursor: pointer; background: #c8d900; border: none; border-radius: 4px; font-size: 16px; font-weight: bold; color: #000;';
      button.addEventListener('click', () => window.location.reload());

      container.append(title, description, spinner, style, button);
      rootElement.appendChild(container);
    }
  }, 5000);
  
} catch (error) {
  showError(error);
}
