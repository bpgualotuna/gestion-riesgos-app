/**
 * Contexto global para el diálogo de confirmación (cuadro blanco).
 * Reemplaza window.confirm en todo el sistema para eliminar, etc.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmDialog } from '../components/admin/AdminTableUtils';

const CONFIRM_ELIMINAR = '¿Está seguro que desea eliminar? Esta acción no se puede deshacer.';

type Resolver = (value: boolean) => void;

interface ConfirmContextType {
  /** Muestra el diálogo blanco de confirmación y devuelve true si confirma, false si cancela */
  confirmDelete: (descripcion?: string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Confirmar eliminación');
  const [message, setMessage] = useState(CONFIRM_ELIMINAR);
  const resolveRef = React.useRef<Resolver | null>(null);

  const confirmDelete = useCallback((descripcion?: string) => {
    const msg = descripcion
      ? `¿Está seguro que desea eliminar ${descripcion}? Esta acción no se puede deshacer.`
      : CONFIRM_ELIMINAR;
    setTitle('Confirmar eliminación');
    setMessage(msg);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirmDelete }}>
      {children}
      <ConfirmDialog
        open={open}
        title={title}
        message={message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="delete"
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (ctx === undefined) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  }
  return ctx;
}
