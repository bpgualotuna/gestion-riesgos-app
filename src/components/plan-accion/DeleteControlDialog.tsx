import { swalConfirmEliminarControl } from '../../lib/swal';

export interface DeleteControlDialogOptions {
  controlId: number;
  planAccionOrigen?: {
    id: number;
    descripcion: string;
  };
}

/** Confirmación de eliminación de control (SweetAlert2 centralizado en lib/swal). */
export function confirmDeleteControl(options: DeleteControlDialogOptions): Promise<boolean> {
  return swalConfirmEliminarControl(options);
}

/** @deprecated Usar confirmDeleteControl(). */
export const DeleteControlDialog = (): null => null;
