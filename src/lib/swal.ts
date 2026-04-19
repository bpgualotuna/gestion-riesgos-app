/**
 * Todas las confirmaciones SweetAlert2 del proyecto deben pasar por aquí.
 *
 * - Eliminaciones genéricas: usar `useConfirm().confirmDelete()` (internamente llama a swalConfirmEliminacion).
 * - Otros casos: importar solo las funciones de este archivo, no repetir `Swal.fire` en páginas.
 */
import Swal from 'sweetalert2';

const ELIMINAR_COMUN = {
  icon: 'warning' as const,
  showCancelButton: true,
  confirmButtonText: 'Eliminar',
  cancelButtonText: 'Cancelar',
  confirmButtonColor: '#d32f2f',
};

export function initSwalTheme(): void {
  Swal.mixin({
    confirmButtonColor: '#1976d2',
    cancelButtonColor: '#616161',
    denyButtonColor: '#d32f2f',
    reverseButtons: true,
    buttonsStyling: true,
  });
}

/** Loader modal (cerrar con swalClose o al terminar la operación). */
export function swalShowLoading(title: string): void {
  Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
}

export function swalClose(): void {
  Swal.close();
}

export async function swalRunWithLoading<T>(loadingTitle: string, fn: () => Promise<T>): Promise<T> {
  swalShowLoading(loadingTitle);
  try {
    return await fn();
  } finally {
    swalClose();
  }
}

/** Misma semántica que `useConfirm().confirmDelete(descripcion?)`. */
export async function swalConfirmEliminacion(descripcion?: string): Promise<boolean> {
  const text = descripcion
    ? `¿Está seguro que desea eliminar ${descripcion}? Esta acción no se puede deshacer.`
    : '¿Está seguro que desea eliminar? Esta acción no se puede deshacer.';
  const r = await Swal.fire({
    title: 'Confirmar eliminación',
    text,
    ...ELIMINAR_COMUN,
  });
  return r.isConfirmed === true;
}

export async function swalConfirmEliminarCausa(): Promise<boolean> {
  const r = await Swal.fire({
    title: 'Eliminar causa',
    text: '¿Seguro que desea eliminar esta causa? Esta acción no se puede deshacer.',
    ...ELIMINAR_COMUN,
  });
  return r.isConfirmed === true;
}

export async function swalConfirmEliminarArchivo(): Promise<boolean> {
  const r = await Swal.fire({
    title: 'Confirmar eliminación',
    text: '¿Está seguro de que desea eliminar este archivo? Esta acción no se puede deshacer.',
    ...ELIMINAR_COMUN,
  });
  return r.isConfirmed === true;
}

export async function swalConfirmEliminarItemDofa(): Promise<boolean> {
  const r = await Swal.fire({
    title: 'Confirmar eliminación',
    text: '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.',
    ...ELIMINAR_COMUN,
  });
  return r.isConfirmed === true;
}

/** Textarea para rechazar proceso; devuelve texto o null si canceló. */
export async function swalPromptRechazoProceso(): Promise<string | null> {
  const { value: texto, isConfirmed } = await Swal.fire({
    title: 'Rechazar proceso con observaciones',
    html: '<p style="text-align:left;margin:0 0 12px">Indique las observaciones o razones por las que se rechaza este proceso:</p>',
    input: 'textarea',
    inputPlaceholder: 'Ingrese las observaciones...',
    showCancelButton: true,
    confirmButtonText: 'Rechazar con observaciones',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d32f2f',
    width: 560,
    preConfirm: (value) => {
      if (!String(value || '').trim()) {
        Swal.showValidationMessage('Por favor ingrese una observación');
        return false;
      }
      return value;
    },
  });
  if (!isConfirmed || texto == null) return null;
  return String(texto).trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SwalUnsavedResult = 'save' | 'discard' | 'cancel';

/** Navegación bloqueada por cambios sin guardar. */
export async function swalUnsavedChangesNavigate(options: {
  title?: string;
  message: string;
  description: string;
  hideSaveButton?: boolean;
  saveButtonText?: string;
  discardButtonText?: string;
  cancelButtonText?: string;
}): Promise<SwalUnsavedResult> {
  const {
    title = 'Cambios sin guardar',
    message,
    description,
    hideSaveButton = false,
    saveButtonText = 'Guardar cambios',
    discardButtonText = 'Descartar cambios',
    cancelButtonText = 'Cancelar',
  } = options;

  const html = `<div style="text-align:left"><p><strong>${escapeHtml(message)}</strong></p><p>${escapeHtml(description)}</p></div>`;

  if (hideSaveButton) {
    const result = await Swal.fire({
      title,
      html,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: discardButtonText,
      cancelButtonText: cancelButtonText,
      focusCancel: true,
      allowOutsideClick: false,
    });
    if (result.isConfirmed) return 'discard';
    return 'cancel';
  }

  const result = await Swal.fire({
    title,
    html,
    icon: 'warning',
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: saveButtonText,
    denyButtonText: discardButtonText,
    cancelButtonText: cancelButtonText,
    focusCancel: true,
    allowOutsideClick: false,
  });

  if (result.isConfirmed) return 'save';
  if (result.isDenied) return 'discard';
  return 'cancel';
}

export async function swalWhileSaving(): Promise<void> {
  Swal.fire({
    title: 'Guardando…',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });
}

/** Confirmación eliminar control (HTML enriquecido). */
export async function swalConfirmEliminarControl(options: {
  controlId: number;
  planAccionOrigen?: { id: number; descripcion: string };
}): Promise<boolean> {
  const { controlId, planAccionOrigen } = options;
  const tieneVinculo = !!planAccionOrigen;

  const html = tieneVinculo
    ? `<p>Este control está vinculado a un plan de acción.</p>
<p>El control <strong>#${controlId}</strong> fue creado a partir del plan:</p>
<p style="background:#f5f5f5;padding:12px;border-radius:8px;margin:12px 0">
<strong>Plan #${planAccionOrigen!.id}</strong><br/>
<span style="color:#666">${escapeHtml(planAccionOrigen!.descripcion)}</span>
</p>
<p style="font-size:0.9em;color:#666">Si elimina este control, el plan original se mantiene; se perderá la relación entre ambos.</p>
<p><strong>¿Desea continuar con la eliminación?</strong></p>`
    : `<p>¿Está seguro que desea eliminar el control <strong>#${controlId}</strong>?</p>`;

  const r = await Swal.fire({
    title: tieneVinculo ? 'Confirmar eliminación de control' : 'Confirmar eliminación',
    html,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar control',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d32f2f',
    width: tieneVinculo ? 520 : 400,
  });
  return r.isConfirmed === true;
}

/** Solo si hace falta un caso muy específico; preferir helpers anteriores. */
export { Swal };
