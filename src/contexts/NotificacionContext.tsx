/**
 * Notificación Context
 * Todas las notificaciones UI se unifican con SweetAlert2.
 */

import { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Swal, swalClose, swalShowLoading, swalExitoEliminacion } from '../lib/swal';

interface NotificacionContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  /** Tras eliminar registros: mismo estilo que CORA (`Eliminación exitosa`). */
  showEliminacionExitosa: (detalle?: string, timerMs?: number) => void;
  /** Modal bloqueante mientras suben archivos (cerrar con hideLoading o al mostrar éxito/error). */
  showLoading: (message: string) => void;
  hideLoading: () => void;
}

export const NotificacionContext = createContext<NotificacionContextType | undefined>(undefined);

export function NotificacionProvider({ children }: { children: ReactNode }) {
  const hideLoading = useCallback(() => {
    swalClose();
  }, []);

  const showLoading = useCallback((message: string) => {
    swalShowLoading(message);
  }, []);

  const showSuccess = useCallback((message: string) => {
    hideLoading();
    void Swal.fire({
      icon: 'success',
      title: 'Operación exitosa',
      text: message,
      timer: 1700,
      showConfirmButton: false,
    });
  }, [hideLoading]);

  const showError = useCallback((message: string) => {
    hideLoading();
    void Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'Aceptar',
    });
  }, [hideLoading]);

  const showEliminacionExitosa = useCallback(
    (detalle?: string, timerMs?: number) => {
      hideLoading();
      void swalExitoEliminacion(detalle, timerMs);
    },
    [hideLoading]
  );

  return (
    <NotificacionContext.Provider
      value={{ showSuccess, showError, showEliminacionExitosa, showLoading, hideLoading }}
    >
      {children}
    </NotificacionContext.Provider>
  );
}

export function useNotificacion() {
  const context = useContext(NotificacionContext);
  if (context === undefined) {
    throw new Error('useNotificacion must be used within a NotificacionProvider');
  }
  return context;
}
