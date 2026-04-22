/**
 * Colores de celda del mapa residual (riesgos negativos), alineados a la macro Excel
 * `MapaRiesgoResidual` / `MapaRiesgo` (rangos T15–T19 / F15–F19): prioridad rojo oscuro → rojo → naranja → amarillo → verde.
 *
 * Hexes: `paletaSemafotoCWR` (Anexo 6 §5.7).
 *
 * Ejes: frecuencia residual 1–5 (Muy Bajo…Muy Alta), impacto residual 1–5 (No significativo…Extremo).
 */

import {
  CWR_AMARILLO_EXCEL,
  CWR_NARANJA_EXCEL,
  CWR_ROJO_EXCEL,
  CWR_ROJO_OSCURO_EXCEL,
  CWR_VERDE_EXCEL,
} from './paletaSemafotoCWR';

function etiquetaFrecuenciaResidual(f: number): string {
  const v = Math.round(Math.max(1, Math.min(5, Number(f))));
  const m: Record<number, string> = {
    1: 'Muy Bajo',
    2: 'Bajo',
    3: 'Moderado',
    4: 'Alta',
    5: 'Muy Alta',
  };
  return m[v] ?? '';
}

function etiquetaImpactoResidual(i: number): string {
  const v = Math.round(Math.max(1, Math.min(5, Number(i))));
  const m: Record<number, string> = {
    1: 'No significativo',
    2: 'Leve',
    3: 'Moderado',
    4: 'Grave',
    5: 'Extremo',
  };
  return m[v] ?? '';
}

export type ColorCeldaMapaResidual = { bg: string; color: string; key: string };

export function colorCeldaMapaResidualNegativo(frec: number, imp: number): ColorCeldaMapaResidual {
  const F = etiquetaFrecuenciaResidual(frec);
  const I = etiquetaImpactoResidual(imp);
  if (!F || !I) return { bg: '#e0e0e0', color: '#666', key: 'desconocido' };

  if (F === 'Muy Alta' && I === 'Extremo') {
    return { bg: CWR_ROJO_OSCURO_EXCEL, color: '#fff', key: 'rojo_oscuro' };
  }
  if (
    (F === 'Alta' && I === 'Extremo') ||
    (F === 'Moderado' && I === 'Extremo') ||
    (F === 'Alta' && I === 'Grave') ||
    (F === 'Muy Alta' && I === 'Grave') ||
    (F === 'Muy Alta' && I === 'Moderado')
  ) {
    return { bg: CWR_ROJO_EXCEL, color: '#fff', key: 'rojo' };
  }
  if (
    (F === 'Muy Bajo' && I === 'Extremo') ||
    (F === 'Bajo' && I === 'Extremo') ||
    (F === 'Moderado' && I === 'Grave') ||
    (F === 'Alta' && I === 'Moderado') ||
    (F === 'Muy Alta' && I === 'Leve') ||
    (F === 'Muy Alta' && I === 'No significativo')
  ) {
    return { bg: CWR_NARANJA_EXCEL, color: '#fff', key: 'naranja' };
  }
  if (
    (F === 'Muy Bajo' && I === 'Grave') ||
    (F === 'Bajo' && I === 'Grave') ||
    (F === 'Bajo' && I === 'Moderado') ||
    (F === 'Moderado' && I === 'Moderado') ||
    (F === 'Moderado' && I === 'Leve') ||
    (F === 'Alta' && I === 'No significativo') ||
    (F === 'Alta' && I === 'Leve')
  ) {
    return { bg: CWR_AMARILLO_EXCEL, color: '#000', key: 'amarillo' };
  }
  if (
    (F === 'Muy Bajo' && I === 'Moderado') ||
    (F === 'Muy Bajo' && I === 'Leve') ||
    (F === 'Muy Bajo' && I === 'No significativo') ||
    (F === 'Bajo' && I === 'Leve') ||
    (F === 'Bajo' && I === 'No significativo') ||
    (F === 'Moderado' && I === 'No significativo')
  ) {
    return { bg: CWR_VERDE_EXCEL, color: '#fff', key: 'verde' };
  }
  return { bg: '#e0e0e0', color: '#666', key: 'desconocido' };
}

export function coordsResidualEnRangoMapa(frec: unknown, imp: unknown): boolean {
  const f = Number(frec);
  const i = Number(imp);
  return Number.isFinite(f) && Number.isFinite(i) && f >= 1 && f <= 5 && i >= 1 && i <= 5;
}
