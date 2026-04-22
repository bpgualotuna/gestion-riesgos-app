/**
 * Semáforo CWR v1 — Anexo 6 §5.7 (formato condicional sobre CALIFICACIÓN DEL RIESGO RESIDUAL).
 * Valores exactos del libro; otros números (p. ej. 7, 14) no tienen regla en plantilla → null.
 *
 * @see otros/analisis/2/Anexo6_CWR_calificacion_mapas_y_macros.md
 */

import {
  CWR_AMARILLO_EXCEL,
  CWR_NARANJA_EXCEL,
  CWR_ROJO_EXCEL,
  CWR_ROJO_OSCURO_EXCEL,
  CWR_VERDE_EXCEL,
} from './paletaSemafotoCWR';

/** Tolerancia para regla 3,99 y redondeos Excel/JSON. */
const EPS_399 = 0.06;
/** Cerca del entero del libro (evita null por float; no asignar 4 si el valor es ~3,7). */
const EPS_ENTEROCWR = 0.15;
/**
 * Tope exclusivo para la regla 3,99: 4−ε en IEEE (p. ej. 3.9999999999999996) se muestra como "4,00"
 * pero |n−3,99| &lt; EPS_399; sin este tope se pintaría verde (3,99) en vez de amarillo (4). Anexo 6 §5.7.
 */
const MAX_VALOR_REGLA_399 = 3.995;

const V = CWR_VERDE_EXCEL;
const A = CWR_AMARILLO_EXCEL;
const N = CWR_NARANJA_EXCEL;
const R = CWR_ROJO_EXCEL;
const RO = CWR_ROJO_OSCURO_EXCEL;

/** Valor entero → relleno / texto (paleta unificada `paletaSemafotoCWR`, ámbar legible) */
const CWR_RESIDUAL_BY_INT = new Map<number, { bg: string; color: string }>([
  [1, { bg: V, color: '#fff' }],
  [2, { bg: V, color: '#fff' }],
  [3, { bg: V, color: '#fff' }],
  [4, { bg: A, color: '#000' }],
  [5, { bg: N, color: '#fff' }],
  [6, { bg: A, color: '#000' }],
  [8, { bg: A, color: '#000' }],
  [9, { bg: A, color: '#000' }],
  [10, { bg: N, color: '#fff' }],
  [12, { bg: N, color: '#fff' }],
  [15, { bg: R, color: '#fff' }],
  [16, { bg: R, color: '#fff' }],
  [20, { bg: R, color: '#fff' }],
  [25, { bg: RO, color: '#fff' }],
]);

function casiIgual(a: number, b: number, eps: number): boolean {
  return Math.abs(a - b) <= eps + Number.EPSILON * 10;
}

/**
 * Convierte calificación residual desde API/UI (número, string "4.00" o "4,00") a número finito.
 * Incluye objetos con valueOf/toString (p. ej. Decimal) y el primer número legible en strings sucios.
 */
export function normalizarCalificacionResidualNumero(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'bigint') {
    const b = Number(v);
    return Number.isFinite(b) ? b : null;
  }
  if (typeof v === 'object' && v !== null) {
    try {
      const coerced = Number(v as object);
      if (Number.isFinite(coerced)) return coerced;
    } catch {
      /* ignore */
    }
    const toStr = (v as { toString?: () => unknown }).toString;
    if (typeof toStr === 'function') {
      try {
        const ts = toStr.call(v);
        if (typeof ts === 'string' && ts !== '' && ts !== '[object Object]') {
          const nested = normalizarCalificacionResidualNumero(ts);
          if (nested != null) return nested;
        }
      } catch {
        /* ignore */
      }
    }
    return null;
  }
  let s = String(v)
    .trim()
    .replace(/\u00a0/g, '')
    .replace(/\u2007/g, '')
    .replace(/\s/g, '');
  if (s === '') return null;
  s = s.replace(/,/g, '.');
  let n = parseFloat(s);
  if (!Number.isFinite(n)) {
    const m = s.match(/-?\d+(?:\.\d+)?/);
    if (m) n = parseFloat(m[0]);
  }
  return Number.isFinite(n) ? n : null;
}

/**
 * Devuelve estilo de celda como Excel Anexo 6, o null si el valor no tiene regla "igual a".
 */
export function estiloSemafotoCalificacionResidualCWR(
  valor: number | string | null | undefined
): { bg: string; color: string } | null {
  const n = normalizarCalificacionResidualNumero(valor);
  if (n == null || n <= 0) return null;

  // Excepción 2×2 → 3,99: solo por debajo del tope (no absorbe 4−ε que redondea a "4,00").
  if (n < MAX_VALOR_REGLA_399 && casiIgual(n, 3.99, EPS_399)) {
    return { bg: V, color: '#fff' };
  }

  const r = Math.round(n);
  if (casiIgual(n, r, EPS_ENTEROCWR)) {
    return CWR_RESIDUAL_BY_INT.get(r) ?? null;
  }

  return null;
}

/**
 * Prueba varias fuentes (pantalla vs cálculo en vivo) hasta obtener semáforo CWR.
 */
export function estiloSemafotoResidualCWRConFallback(
  ...valores: Array<number | string | null | undefined>
): { bg: string; color: string } | null {
  for (const v of valores) {
    const st = estiloSemafotoCalificacionResidualCWR(v);
    if (st) return st;
  }
  return null;
}
