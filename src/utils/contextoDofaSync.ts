/** Reglas: D/F desde contexto interno; O/A desde contexto externo. */

export type DofaTipoCuadrante = 'FORTALEZA' | 'OPORTUNIDAD' | 'DEBILIDAD' | 'AMENAZA';

/** Normaliza texto para comparar contexto ↔ DOFA (espacios, caracteres invisibles). */
export function normDesc(s: string): string {
  return String(s ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Unifica cómo viene `tipo` desde API/BD (mayúsculas, variaciones). */
export function normalizeDofaTipoToCanonical(
  raw: string | undefined
): DofaTipoCuadrante | null {
  const t = String(raw ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!t) return null;
  if (t.startsWith('FORTAL')) return 'FORTALEZA';
  if (t.startsWith('DEBIL')) return 'DEBILIDAD';
  if (t.startsWith('OPORT')) return 'OPORTUNIDAD';
  if (t.startsWith('AMENAZ')) return 'AMENAZA';
  return null;
}

/** ¿Está esta descripción en el cuadrante DOFA que corresponde al signo y origen? */
export function encuentraEnDofaCuadrante(
  dofaItems: Array<{ tipo: string; descripcion: string }> | undefined,
  descripcion: string,
  signo: 'POSITIVO' | 'NEGATIVO',
  origen: 'INTERNO' | 'EXTERNO'
): { dimension: DofaTipoCuadrante } | null {
  if (!dofaItems?.length || !String(descripcion).trim()) return null;
  const expected =
    origen === 'INTERNO'
      ? dofaTipoDesdeContextoInterno(signo)
      : dofaTipoDesdeContextoExterno(signo);
  const text = normDesc(descripcion);
  const found = dofaItems.find((d) => {
    const tipoC = normalizeDofaTipoToCanonical(d.tipo);
    return tipoC === expected && normDesc(d.descripcion) === text;
  });
  return found ? { dimension: normalizeDofaTipoToCanonical(found.tipo) || expected } : null;
}

/**
 * En BD `enviarADofa` puede ser null (datos viejos). Eso NO es “excluido”: solo `false` lo es.
 * `undefined` en UI = sincronizar con DOFA por defecto al guardar.
 */
export function enviarADofaDesdeApi(v: boolean | null | undefined): boolean | undefined {
  if (v === true) return true;
  // `false` en BD no significa "usuario excluyó de DOFA": antes `aplicarSincronizacionDofaAContextoItems`
  // guardaba false cuando el texto aún no estaba en la matriz, y eso bloqueaba el merge al guardar contexto.
  return undefined;
}

export function dofaTipoDesdeContextoInterno(signo: 'POSITIVO' | 'NEGATIVO'): 'FORTALEZA' | 'DEBILIDAD' {
  return signo === 'POSITIVO' ? 'FORTALEZA' : 'DEBILIDAD';
}

export function dofaTipoDesdeContextoExterno(signo: 'POSITIVO' | 'NEGATIVO'): 'OPORTUNIDAD' | 'AMENAZA' {
  return signo === 'POSITIVO' ? 'OPORTUNIDAD' : 'AMENAZA';
}

export function dofaTipoDesdeContextoItem(tipo: string, signo: string): DofaTipoCuadrante | null {
  const t = String(tipo)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const s = String(signo).toUpperCase();
  if (s !== 'POSITIVO' && s !== 'NEGATIVO') return null;
  if (t.startsWith('INTERNO_')) return s === 'POSITIVO' ? 'FORTALEZA' : 'DEBILIDAD';
  if (t.startsWith('EXTERNO_')) return s === 'POSITIVO' ? 'OPORTUNIDAD' : 'AMENAZA';
  /** Datos viejos sin prefijo INTERNO_/EXTERNO_ */
  const internoSolo = new Set([
    'FINANCIEROS',
    'GENTE',
    'PROCESOS',
    'ACTIVOSFISICOS',
    'CADENASUMINISTRO',
    'INFORMACION',
    'SISTEMAS',
    'PROYECTOS',
    'IMPUESTOS',
    'GRUPOSINTERESINTERNOS',
  ]);
  const externoSolo = new Set([
    'ECONOMICO',
    'CULTURALSOCIAL',
    'LEGALREGULATORIO',
    'TECNOLOGICO',
    'AMBIENTAL',
    'GRUPOSINTERESEXTERNOS',
    'POLITICO',
    'MEGATENDENCIAS',
    'OTROSFACTORES',
  ]);
  if (internoSolo.has(t)) return s === 'POSITIVO' ? 'FORTALEZA' : 'DEBILIDAD';
  if (externoSolo.has(t)) return s === 'POSITIVO' ? 'OPORTUNIDAD' : 'AMENAZA';
  return null;
}

/** Etiqueta legible para categorías INTERNO_* / EXTERNO_* (alineado con pantallas de contexto). */
const TIPO_CONTEXTO_LABEL: Record<string, string> = {
  INTERNO_FINANCIEROS: 'Financieros',
  INTERNO_GENTE: 'Gente',
  INTERNO_PROCESOS: 'Procesos',
  INTERNO_ACTIVOSFISICOS: 'Activos físicos',
  INTERNO_CADENASUMINISTRO: 'Cadena de suministro',
  INTERNO_INFORMACION: 'Información',
  INTERNO_SISTEMAS: 'Sistemas/Tecnología',
  INTERNO_PROYECTOS: 'Proyectos',
  INTERNO_IMPUESTOS: 'Impuestos',
  INTERNO_GRUPOSINTERESINTERNOS: 'Grupos de interés internos',
  EXTERNO_ECONOMICO: 'Económico',
  EXTERNO_CULTURALSOCIAL: 'Cultural y social',
  EXTERNO_LEGALREGULATORIO: 'Legal/regulatorio',
  EXTERNO_TECNOLOGICO: 'Tecnológico',
  EXTERNO_AMBIENTAL: 'Ambiental',
  EXTERNO_GRUPOSINTERESEXTERNOS: 'Grupos de interés externos',
  EXTERNO_POLITICO: 'Político',
  EXTERNO_MEGATENDENCIAS: 'Megatendencias',
  EXTERNO_OTROSFACTORES: 'Otros factores externos',
};

export function labelTipoContexto(tipo: string): string {
  const key = String(tipo ?? '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (TIPO_CONTEXTO_LABEL[key]) return TIPO_CONTEXTO_LABEL[key];
  if (!key) return '—';
  return key
    .replace(/^INTERNO_|^EXTERNO_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Texto para tooltip en matriz DOFA: de dónde viene el ítem (contexto interno vs externo y categoría). */
export function describeOrigenItemDofaMatriz(
  descripcion: string,
  cuadrante: DofaTipoCuadrante,
  contextoItems: ContextoItemLike[] | undefined
): string {
  const n = normDesc(descripcion);
  if (!n) return 'Sin descripción.';
  const match = contextoItems?.find((ci) => {
    const dt = dofaTipoDesdeContextoItem(ci.tipo, ci.signo);
    return dt === cuadrante && normDesc(ci.descripcion) === n;
  });
  const donde = cuadrante === 'FORTALEZA' || cuadrante === 'DEBILIDAD' ? 'Contexto interno' : 'Contexto externo';
  const pestaña = cuadrante === 'FORTALEZA' || cuadrante === 'OPORTUNIDAD' ? 'Positivo' : 'Negativo';
  if (match) {
    const cat = labelTipoContexto(match.tipo);
    const syncNote =
      match.enviarADofa === false
        ? ' En contexto está marcado como no enviar a DOFA; el texto coincide igualmente.'
        : '';
    return `Origen: ${donde} (pestaña ${pestaña}). Categoría: ${cat}.${syncNote}`;
  }
  return `No hay una fila en ${donde} con este mismo texto. El ítem solo está en la matriz DOFA o quedó desincronizado. Edítalo en la pantalla de contexto o elimínalo aquí.`;
}

export interface ContextoItemLike {
  tipo: string;
  signo: string;
  descripcion: string;
  enviarADofa?: boolean;
}

export interface DofaItemLike {
  tipo: string;
  descripcion: string;
}

/**
 * DOFA final al guardar desde contexto: todas las filas de contexto con texto y tipo válido
 * (no se omite por `enviarADofa`: en BD muchas filas antiguas quedaron en false por defecto
 * y eso dejaba fuera de la matriz solo a los ítems viejos).
 * Más ítems que solo existen en DOFA (no hay fila de contexto con la misma descripción).
 */
export function mergeDofaItemsWithContext(
  existingDofa: DofaItemLike[],
  contextoItems: ContextoItemLike[]
): DofaItemLike[] {
  const synced: DofaItemLike[] = [];
  const seen = new Set<string>();

  for (const ci of contextoItems) {
    const desc = String(ci.descripcion ?? '').trim();
    if (!desc) continue;
    const dt = dofaTipoDesdeContextoItem(ci.tipo, ci.signo);
    if (!dt) continue;
    const k = `${dt}:${normDesc(desc)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    synced.push({ tipo: dt, descripcion: desc });
  }

  const contextNorms = new Set(contextoItems.map((c) => normDesc(c.descripcion)).filter(Boolean));

  const manual = existingDofa.filter((d) => {
    const n = normDesc(d.descripcion);
    if (!n) return false;
    if (contextNorms.has(n)) return false;
    return true;
  });

  const syncedNorms = new Set(synced.map((s) => `${s.tipo}:${normDesc(s.descripcion)}`));

  const manualDeduped = manual.filter((m) => {
    const k = `${String(m.tipo).toUpperCase()}:${normDesc(m.descripcion)}`;
    return !syncedNorms.has(k);
  });

  /** Primero ítems del contexto (synced), luego solo-DOFA; deduplica por cuadrante + texto para no duplicar filas. */
  return dedupeDofaItemsPorTipoYTexto([...synced, ...manualDeduped]);
}

/** Una sola fila por (tipo DOFA, texto normalizado). Conserva el primero (synced antes que manual). */
export function dedupeDofaItemsPorTipoYTexto(items: DofaItemLike[]): DofaItemLike[] {
  const seen = new Set<string>();
  const out: DofaItemLike[] = [];
  for (const d of items) {
    const tc = normalizeDofaTipoToCanonical(d.tipo);
    if (!tc) continue;
    const k = `${tc}:${normDesc(d.descripcion)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ tipo: tc, descripcion: String(d.descripcion ?? '').trim() });
  }
  return out;
}

/**
 * Tras guardar en la pantalla DOFA: refleja si el texto está en el cuadrante.
 * Si aún no está en la matriz, deja `enviarADofa` en `undefined` (no `false`): solo `false` debe
 * significar exclusión explícita; `false` aquí rompía `mergeDofaItemsWithContext` al guardar desde contexto.
 */
export function aplicarSincronizacionDofaAContextoItems<T extends ContextoItemLike>(
  contextoItems: T[],
  quadrants: Record<DofaTipoCuadrante, { descripcion: string }[]>
): Array<T & { enviarADofa: boolean | undefined; dofaDimension?: DofaTipoCuadrante }> {
  return contextoItems.map((ci) => {
    const expected = dofaTipoDesdeContextoItem(ci.tipo, ci.signo);
    const desc = String(ci.descripcion ?? '').trim();
    if (!expected || !desc) {
      return { ...ci, enviarADofa: false, dofaDimension: undefined };
    }
    const lista = quadrants[expected] ?? [];
    const inDofa = lista.some((row) => normDesc(row.descripcion) === normDesc(desc));
    return {
      ...ci,
      enviarADofa: inDofa ? true : undefined,
      dofaDimension: inDofa ? expected : undefined,
    };
  });
}
