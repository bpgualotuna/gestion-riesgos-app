import { repairSpanishDisplayArtifacts } from './utf8Repair';

/** Compara cadenas ignorando mayúsculas y diacríticos (útil con datos legacy). */
export function foldAscii(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * Heurística: tipología tipo I de nivel estratégico (aunque falten tildes en BD, ej. "Estratgico").
 */
export function esTipologiaNombreNivelEstrategico(nombre?: string | null, codigo?: string | null): boolean {
  const n = repairSpanishDisplayArtifacts(String(nombre ?? '').trim());
  const c = repairSpanishDisplayArtifacts(String(codigo ?? '').trim());
  const f = foldAscii(`${n} ${c}`);
  if (f.includes('estrateg')) return true;
  // "01 Estratgico", "01 Estratégico", etc.
  if (/\b\d+\s*estr/.test(f)) return true;
  return false;
}

export type OpcionesTipologiaTipo1Opts = {
  residualModoEstrategico: boolean;
  /** Si no vacío, solo esos IDs en procesos estratégicos (config admin). */
  idsEstrategiaConfig: number[];
};

/**
 * Opciones del Autocomplete "Tipología tipo I" según proceso y configuración admin.
 */
export function opcionesTipologiaTipo1ParaProceso(
  tipos: Array<{ id?: number | string; nombre?: string; codigo?: string }>,
  opts: OpcionesTipologiaTipo1Opts
): typeof tipos {
  const list = Array.isArray(tipos) ? tipos : [];
  const idsCfg = (opts.idsEstrategiaConfig || []).map(Number).filter((x) => Number.isFinite(x) && x > 0);
  if (opts.residualModoEstrategico) {
    if (idsCfg.length > 0) {
      const set = new Set(idsCfg);
      const byId = list.filter((t) => set.has(Number(t.id)));
      // Si los IDs del admin no coinciden con el catálogo (cambio de BD), no dejar el desplegable vacío.
      if (byId.length > 0) return byId;
      return list.filter((t) => esTipologiaNombreNivelEstrategico(t.nombre, t.codigo));
    }
    return list.filter((t) => esTipologiaNombreNivelEstrategico(t.nombre, t.codigo));
  }
  const setIds = idsCfg.length > 0 ? new Set(idsCfg) : null;
  return list.filter((t) => {
    if (setIds?.has(Number(t.id))) return false;
    return !esTipologiaNombreNivelEstrategico(t.nombre, t.codigo);
  });
}

/** Etiqueta de tipología para tablas (API: tipoRiesgo / relaciones legacy). */
export function etiquetaTipologiaRiesgoTabla(r: {
  tipoRiesgo?: string | null;
  tipologiaNivelI?: string | null;
  tipologia?: { nombre?: string } | string | null;
}): string {
  const raw =
    r?.tipoRiesgo ||
    r?.tipologiaNivelI ||
    (typeof r?.tipologia === 'object' && r?.tipologia && 'nombre' in r.tipologia
      ? (r.tipologia as { nombre?: string }).nombre
      : null) ||
    (typeof r?.tipologia === 'string' ? r.tipologia : null) ||
    '';
  const s = repairSpanishDisplayArtifacts(String(raw).trim());
  return s || '—';
}
