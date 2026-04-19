/**
 * Confirmaciones de eliminación: delega en `swalConfirmEliminacion` (un solo lugar de verdad).
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { swalConfirmEliminacion } from '../lib/swal';

interface ConfirmContextType {
  confirmDelete: (descripcion?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const confirmDelete = useCallback(
    (descripcion?: string) => swalConfirmEliminacion(descripcion),
    []
  );

  return <ConfirmContext.Provider value={{ confirmDelete }}>{children}</ConfirmContext.Provider>;
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (ctx === undefined) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  }
  return ctx;
}
