/**
 * Mensajes coherentes con multer en gestion_riesgos_backend/src/routes/upload.routes.ts
 */
export const UPLOAD_MAX_FILE_MB = 25;
export const UPLOAD_MAX_FILE_LABEL = `${UPLOAD_MAX_FILE_MB} MB`;

/** Cuando fetch() falla a nivel de red (sin respuesta HTTP legible). */
export function messageForNetworkUploadFailure(err: unknown): string {
  const m = err instanceof Error ? err.message : '';
  if (
    m === 'Failed to fetch' ||
    m === 'Load failed' ||
    m.includes('NetworkError') ||
    err instanceof TypeError
  ) {
    return `No se pudo subir el archivo. Compruebe: (1) que el archivo no supere ${UPLOAD_MAX_FILE_LABEL}; (2) que su sesión siga activa (si venció, cierre sesión e inicie de nuevo); (3) su conexión. Si el error continúa, contacte a soporte.`;
  }
  return m || 'Error al subir el archivo.';
}

export async function getUploadArchivoErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
      code?: string;
    };
    if (data?.code === 'FILE_TOO_LARGE' || response.status === 413) {
      return (
        data.error ||
        `El archivo es demasiado grande. El tamaño máximo permitido es ${UPLOAD_MAX_FILE_LABEL}.`
      );
    }
    if (response.status === 401) {
      return (
        data?.error ||
        data?.message ||
        'Sesión expirada o no autorizado. Inicie sesión de nuevo y vuelva a subir el archivo.'
      );
    }
    return (
      data?.error ||
      data?.message ||
      `No se pudo subir el archivo (${response.status}).`
    );
  } catch {
    if (response.status === 413) {
      return `El archivo es demasiado grande. Máximo ${UPLOAD_MAX_FILE_LABEL}.`;
    }
    if (response.status === 401) {
      return 'Sesión expirada. Inicie sesión de nuevo.';
    }
    return `Error al subir el archivo (${response.status}).`;
  }
}

export async function assertUploadArchivoOk(response: Response): Promise<void> {
  if (!response.ok) {
    const msg = await getUploadArchivoErrorMessage(response);
    throw new Error(msg);
  }
}
