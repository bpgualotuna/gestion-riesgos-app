import {
  estiloNivelResidualDesdeNombre,
} from '../../../utils/residualNivelColor';
import {
  estiloSemafotoResidualCWRConFallback,
  normalizarCalificacionResidualNumero,
} from '../../../utils/cwrCalificacionResidualColors';
import {
  coordsResidualEnRangoMapa,
  colorCeldaMapaResidualNegativo
} from '../../../utils/mapaResidualExcelColors';

/** Texto para chips/etiquetas: no todo en mayúsculas; primera letra de cada palabra en mayúscula. */
export function etiquetaNivelMostrar(raw: string | null | undefined): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Misma prioridad que el resumen inferior: semáforo Anexo 6 §5.7 por número; si no aplica, mapa f×i o banda por nombre. */
export function estiloCajaPorCalificacionCWR(
  calNum: unknown,
  nivelStr: string,
  fCoord: unknown,
  iCoord: unknown,
  nivelesRiesgoCatalog: any
): { color: string; bg: string } {
  const getColorNivelObj = (n: string) => estiloNivelResidualDesdeNombre(n, nivelesRiesgoCatalog);
  const coloresPorNivelOMapa = (
    nivelStr2: string,
    fCoord2?: unknown,
    iCoord2?: unknown
  ): { color: string; bg: string } => {
    const porNivel = getColorNivelObj(nivelStr2);
    if (coordsResidualEnRangoMapa(fCoord2, iCoord2)) {
      const c = colorCeldaMapaResidualNegativo(Number(fCoord2), Number(iCoord2));
      return { color: c.color, bg: c.bg };
    }
    return porNivel;
  };
  const calNorm = normalizarCalificacionResidualNumero(calNum);
  if (calNorm !== null && calNorm > 0) {
    const prodFi =
      fCoord != null &&
        iCoord != null &&
        Number.isFinite(Number(fCoord)) &&
        Number.isFinite(Number(iCoord))
        ? Number(fCoord) === 2 && Number(iCoord) === 2
          ? 3.99
          : Number(fCoord) * Number(iCoord)
        : null;
    const cwr = estiloSemafotoResidualCWRConFallback(calNorm, Math.round(calNorm), prodFi);
    if (cwr) return { color: cwr.color, bg: cwr.bg };
  }
  return coloresPorNivelOMapa(nivelStr, fCoord, iCoord);
}

export { normalizarCalificacionResidualNumero };

export function getEvaluacionPreliminarFromRangos(rangos: any[] | undefined, puntajeTotal: number): string {
  if (!rangos?.length) return 'Inefectivo';
  for (const r of rangos) {
    const okMin = r.incluirMinimo ? puntajeTotal >= r.valorMinimo : puntajeTotal > r.valorMinimo;
    const okMax = r.incluirMaximo ? puntajeTotal <= r.valorMaximo : puntajeTotal < r.valorMaximo;
    if (okMin && okMax) return r.nivelNombre;
  }
  return 'Inefectivo';
}

export function getPorcentajeFromTabla(tabla: any[] | undefined, evaluacion: string): number {
  if (!tabla?.length) return 0;
  const t = tabla.find((x: any) => x.evaluacion === evaluacion);
  return t != null ? Number(t.porcentaje) : 0;
}
