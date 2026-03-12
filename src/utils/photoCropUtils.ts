/**
 * Utilidades de recorte circular de imagen para avatar/perfil.
 * Reutilizables y testeables sin UI.
 */

export const MAX_FILE_SIZE_MB = 2;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
export const CROP_OUTPUT_PX = 400;
export const CROP_PREVIEW_PX = 280;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Dibuja en un canvas la zona circular recortada (centro en %, zoom).
 */
export function drawCropCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  centerXPercent: number,
  centerYPercent: number,
  zoom: number,
  outputSize: number
): void {
  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const cx = (centerXPercent / 100) * w;
  const cy = (centerYPercent / 100) * h;
  const r = Math.max(1, (Math.min(w, h) / 2) / Math.max(0.5, zoom));
  const scale = outputSize / (2 * r);
  const drawW = w * scale;
  const drawH = h * scale;
  const dx = outputSize / 2 - cx * scale;
  const dy = outputSize / 2 - cy * scale;
  ctx.beginPath();
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, w, h, dx, dy, drawW, drawH);
}

/**
 * Genera un Blob JPEG del recorte circular.
 */
export function cropCircleBlob(
  imageSrc: string,
  centerXPercent: number,
  centerYPercent: number,
  zoom: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CROP_OUTPUT_PX;
      canvas.height = CROP_OUTPUT_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas no disponible'));
        return;
      }
      drawCropCircle(ctx, img, centerXPercent, centerYPercent, zoom, CROP_OUTPUT_PX);
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob falló'))), 'image/jpeg', 0.9);
    };
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = imageSrc;
  });
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato no permitido. Use JPEG, PNG, GIF o WebP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `La imagen no debe superar ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
}
