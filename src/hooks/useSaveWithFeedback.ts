import { useState, useCallback } from 'react';
import { useNotification } from './useNotification';

/**
 * Hook reutilizable para guardar con estado de carga y mensajes de éxito/error.
 * Escalable: todas las pantallas pueden usarlo para un comportamiento consistente.
 */
export function useSaveWithFeedback(options?: {
  successMessage?: string;
  errorMessage?: string;
}) {
  const { showSuccess, showError } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  const successMessage = options?.successMessage ?? 'Guardado correctamente';
  const errorMessage = options?.errorMessage ?? 'Error al guardar. Intenta de nuevo.';

  const save = useCallback(
    async <T>(fn: () => Promise<T>, onSuccess?: (data: T) => void): Promise<T | null> => {
      setIsSaving(true);
      try {
        const data = await fn();
        showSuccess(successMessage);
        onSuccess?.(data);
        return data;
      } catch (error: unknown) {
        const err = error as { data?: { error?: string }; message?: string };
        const message = err?.data?.error ?? err?.message ?? errorMessage;
        if (showError) showError(message);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [showSuccess, showError, successMessage, errorMessage]
  );

  return { save, isSaving };
}
