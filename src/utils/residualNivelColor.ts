/**
 * Color de chip/caja por nombre de nivel residual: catálogo admin (niveles-riesgo) o paleta CWR por defecto.
 */
import {
  NIVEL_ALTO_BG,
  NIVEL_BAJO_BG,
  NIVEL_CRITICO_BG,
  NIVEL_MEDIO_BG,
} from './paletaSemafotoCWR';

export type NivelRiesgoCatalogItem = { nombre?: string; color?: string };

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Contraste legible sobre fondo arbitrario (p. ej. color editado en admin). */
export function colorTextoContrasteSobreFondo(hexBg: string): '#fff' | '#000' {
  const rgb = hexToRgb(hexBg);
  if (!rgb) return '#000';
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? '#000' : '#fff';
}

function estiloPorNombreNormalizado(nn: string): { bg: string; color: string } | null {
  if (nn.includes('crítico') || nn.includes('critico')) {
    return { bg: NIVEL_CRITICO_BG, color: '#fff' };
  }
  if (nn.includes('alto')) {
    return { bg: NIVEL_ALTO_BG, color: '#fff' };
  }
  if (nn.includes('medio')) {
    return { bg: NIVEL_MEDIO_BG, color: '#000' };
  }
  if (nn.includes('bajo')) {
    return { bg: NIVEL_BAJO_BG, color: '#fff' };
  }
  return null;
}

/**
 * @param nivelStr Texto del nivel (ej. "Bajo", "MEDIO")
 * @param catalog Opcional: filas de GET catalogos/niveles-riesgo con `nombre` y `color`
 */
export function estiloNivelResidualDesdeNombre(
  nivelStr: string,
  catalog?: ReadonlyArray<NivelRiesgoCatalogItem> | null
): { bg: string; color: string } {
  const raw = String(nivelStr ?? '').trim();
  if (!raw || raw === 'Sin Calificar') {
    return { bg: '#f5f5f5', color: '#666' };
  }
  if (catalog?.length) {
    const up = raw.toUpperCase();
    const hit = catalog.find((x) => {
      const xn = (x.nombre ?? '').toUpperCase();
      if (!xn) return false;
      return xn === up || up.includes(xn) || xn.includes(up);
    });
    if (hit?.color && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hit.color.trim())) {
      const bg = hit.color.trim();
      return { bg, color: colorTextoContrasteSobreFondo(bg) };
    }
  }
  const porNombre = estiloPorNombreNormalizado(raw.toLowerCase());
  if (porNombre) return porNombre;
  return { bg: '#f5f5f5', color: '#666' };
}

/** Solo fondo (compat con código legacy que usaba getColorNivel → string). */
export function fondoNivelResidualDesdeNombre(
  nivelStr: string,
  catalog?: ReadonlyArray<NivelRiesgoCatalogItem> | null
): string {
  return estiloNivelResidualDesdeNombre(nivelStr, catalog).bg;
}
