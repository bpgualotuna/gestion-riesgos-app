/**
 * Cambios sin guardar al navegar: delega en `swalUnsavedChangesNavigate`.
 */

import { useEffect, useRef } from 'react';
import { swalClose, swalUnsavedChangesNavigate, swalWhileSaving } from '../../lib/swal';

export interface UnsavedChangesDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  description?: string;
  onSave?: () => void | Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
  saveButtonText?: string;
  discardButtonText?: string;
  cancelButtonText?: string;
  isSaving?: boolean;
  hideSaveButton?: boolean;
}

export default function UnsavedChangesDialog({
  open,
  title = 'Cambios sin guardar',
  message = 'Tiene cambios sin guardar en esta página.',
  description = '¿Qué desea hacer con los cambios realizados?',
  onSave,
  onDiscard,
  onCancel,
  saveButtonText = 'Guardar cambios',
  discardButtonText = 'Descartar cambios',
  cancelButtonText = 'Cancelar',
  hideSaveButton = false,
}: UnsavedChangesDialogProps) {
  const propsRef = useRef({
    title,
    message,
    description,
    onSave,
    onDiscard,
    onCancel,
    saveButtonText,
    discardButtonText,
    cancelButtonText,
    hideSaveButton,
  });
  propsRef.current = {
    title,
    message,
    description,
    onSave,
    onDiscard,
    onCancel,
    saveButtonText,
    discardButtonText,
    cancelButtonText,
    hideSaveButton,
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const run = async () => {
      const p = propsRef.current;
      const result = await swalUnsavedChangesNavigate({
        title: p.title,
        message: p.message,
        description: p.description,
        hideSaveButton: p.hideSaveButton,
        saveButtonText: p.saveButtonText,
        discardButtonText: p.discardButtonText,
        cancelButtonText: p.cancelButtonText,
      });
      if (cancelled) return;

      if (result === 'save' && p.onSave) {
        swalWhileSaving();
        try {
          await p.onSave();
        } finally {
          swalClose();
        }
      } else if (result === 'discard') {
        p.onDiscard();
      } else {
        p.onCancel();
      }
    };

    void run();

    return () => {
      cancelled = true;
      swalClose();
    };
  }, [open]);

  return null;
}
