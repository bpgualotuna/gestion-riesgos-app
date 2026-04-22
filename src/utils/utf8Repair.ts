/**
 * Repara texto donde UTF-8 válido fue interpretado como Latin-1/Windows-1252
 * (p. ej. "pÃ©rdida" → "pérdida"). No altera cadenas ya correctas.
 */
const LOOKS_LIKE_UTF8_MOJIBAKE = /Ã.|Â.|â€|Â¿|Â¡|\uFFFD/;

export function repairUtf8Mojibake(input: string | null | undefined): string {
  if (input == null) return '';
  if (typeof input !== 'string' || input.length === 0) return input;
  if (!LOOKS_LIKE_UTF8_MOJIBAKE.test(input)) return input;
  try {
    const bytes = Uint8Array.from(input, (c) => c.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (decoded && decoded !== input && !decoded.includes('\uFFFD')) return decoded;
  } catch {
    /* ignore */
  }
  return input;
}

/** Tipología / subtipología y etiquetas de catálogo (muy frecuente en procesos estratégicos y listas). */
const TIPOLOGY_AND_LABEL_FIXES: Array<[RegExp, string]> = [
  [/Tipolog\uFFFDa/gi, 'Tipología'],
  [/tipolog\uFFFDa/gi, 'tipología'],
  [/Tipolog\?a/gi, 'Tipología'],
  [/tipolog\?a/gi, 'tipología'],
  [/\bTipologa\b/g, 'Tipología'],
  [/\btipologa\b/g, 'tipología'],
  [/Subtipolog\uFFFDa/gi, 'Subtipología'],
  [/subtipolog\uFFFDa/gi, 'subtipología'],
  [/Subtipolog\?a/gi, 'Subtipología'],
  [/\bSubtipologa\b/g, 'Subtipología'],
  [/\bsubtipologa\b/g, 'subtipología'],
  [/Identificaci\uFFFDn/gi, 'Identificación'],
  [/Identificaci\?n/gi, 'Identificación'],
  [/Calificaci\uFFFDn/gi, 'Calificación'],
  [/Calificaci\?n/gi, 'Calificación'],
  [/Administraci\uFFFDn/gi, 'Administración'],
  [/Administraci\?n/gi, 'Administración'],
];

const ENCODING_GLITCH_FIXES: Array<[RegExp, string]> = [
  [/Comit\uFFFD\?\s+Comercial/gi, 'Comité Comercial'],
  [/Comit\uFFFD\s+Comercial/gi, 'Comité Comercial'],
  [/Comit\?\s+Comercial/gi, 'Comité Comercial'],
  [/\bComite\s+Comercial\b/gi, 'Comité Comercial'],
  [/\bComitee\b/gi, 'Comité'],
  [/Pol\uFFFDtica/gi, 'Política'],
  [/Pol\?tica/gi, 'Política'],
  [/\bPoltica\b/gi, 'Política'],
  [/metodolog\uFFFDa/gi, 'metodología'],
  [/metodolog\?a/gi, 'metodología'],
  [/\bmetodologa\b/gi, 'metodología'],
  [/m\uFFFDdulo/gi, 'módulo'],
  [/\bmdulo\b/gi, 'módulo'],
  [/Direcci\uFFFDn/gi, 'Dirección'],
  [/\bDireccin\b/gi, 'Dirección'],
  [/\bcon los establecido\b/gi, 'con lo establecido'],
  [/seguimient\uFFFD/gi, 'seguimiento'],
  [/seguimient\?/gi, 'seguimiento'],
];

/** Patrones típicos de texto truncado o mal decodificado en catálogos legacy (UTF-8 / acentos). */
const SPANISH_DISPLAY_FIXES: Array<[RegExp, string]> = [
  [/\bEstrat\?gico\b/gi, 'Estratégico'],
  [/\bEstrat\uFFFDgico\b/gi, 'Estratégico'],
  [/\bEstratgico\b/gi, 'Estratégico'],
  [/(\d+\s*)Estratgico\b/gi, '$1Estratégico'],
  [/\bprdidas\b/gi, 'pérdidas'],
  [/\bprdida\b/gi, 'pérdida'],
  /** p + U+FFFD + ? + rdida (acento perdido en BD/export). */
  [/\bp\uFFFD+\?rdidas\b/gi, 'pérdidas'],
  [/\bP\uFFFD+\?rdidas\b/g, 'Pérdidas'],
  [/\bp\uFFFD+\?rdida\b/gi, 'pérdida'],
  [/\bP\uFFFD+\?rdida\b/g, 'Pérdida'],
  [/\bp\?\uFFFD+rdidas\b/gi, 'pérdidas'],
  [/\bp\?\uFFFD+rdida\b/gi, 'pérdida'],
  [/\bp\?\?rdidas\b/gi, 'pérdidas'],
  [/\bp\?\?rdida\b/gi, 'pérdida'],
  [/[Pp]\?rdidas\b/g, 'pérdidas'],
  [/[Pp]\?rdida\b/g, 'pérdida'],
  [/[Pp]\uFFFDrdidas\b/g, 'pérdidas'],
  [/[Pp]\uFFFDrdida\b/g, 'pérdida'],
  [/\bGestin\b/gi, 'Gestión'],
  [/\bPosicin\b/gi, 'Posición'],
];

/**
 * Acento «é/í/ó/ú» perdido como �, U+FFFD o ? en datos importados / columnas legacy.
 */
const SPANISH_ACCENT_GLITCHES: Array<[RegExp, string]> = [
  [/\binter\uFFFD*\?ses\b/gi, 'intereses'],
  [/\binter\uFFFD*\?s\b/gi, 'interés'],
  [/\bInter\uFFFD*\?ses\b/g, 'Intereses'],
  [/\bInter\uFFFD*\?s\b/g, 'Interés'],
  [/\binter\?ses\b/gi, 'intereses'],
  [/\binter\?s\b/gi, 'interés'],
  [/\binter\uFFFDses\b/gi, 'intereses'],
  [/\binter\uFFFDs\b/gi, 'interés'],
  [/\bpropuest\uFFFD*\?as\b/gi, 'propuestas'],
  [/\bpropuest\uFFFD*\?a\b/gi, 'propuesta'],
  [/\bpropuest\?as\b/gi, 'propuestas'],
  [/\bpropuest\?a\b/gi, 'propuesta'],
  [/\bpropuest\uFFFDas\b/gi, 'propuestas'],
  [/\bpropuest\uFFFDa\b/gi, 'propuesta'],
  [/\bnumer\uFFFD*\?o\b/gi, 'número'],
  [/\bnumer\?o\b/gi, 'número'],
  [/\bnumer\uFFFDo\b/gi, 'número'],
  [/\bfunci\uFFFD*\?n\b/gi, 'función'],
  [/\bfunci\?n\b/gi, 'función'],
  [/\bfunci\uFFFDn\b/gi, 'función'],
  [/\btambi\uFFFD*\?n\b/gi, 'también'],
  [/\btambi\?n\b/gi, 'también'],
  [/\btambi\uFFFDn\b/gi, 'también'],
  [/\bdespu\uFFFD*\?s\b/gi, 'después'],
  [/\bdespu\?s\b/gi, 'después'],
  [/\bdespu\uFFFDs\b/gi, 'después'],
  [/\bcomerci\uFFFD*\?l\b/gi, 'comercial'],
  [/\bcomerci\?l\b/gi, 'comercial'],
  [/\bcomerci\uFFFDl\b/gi, 'comercial'],
  [/\bopci\uFFFD*\?n\b/gi, 'opción'],
  [/\bopci\?n\b/gi, 'opción'],
  [/\bopci\uFFFDn\b/gi, 'opción'],
  [/\brelaci\uFFFD*\?n\b/gi, 'relación'],
  [/\brelaci\?n\b/gi, 'relación'],
  [/\brelaci\uFFFDn\b/gi, 'relación'],
  [/\bcondici\uFFFD*\?n\b/gi, 'condición'],
  [/\bcondici\?n\b/gi, 'condición'],
  [/\bcondici\uFFFDn\b/gi, 'condición'],
];

function applyArtifactFixes(s: string): string {
  let t = s;
  for (const [re, rep] of ENCODING_GLITCH_FIXES) {
    t = t.replace(re, rep);
  }
  for (const [re, rep] of TIPOLOGY_AND_LABEL_FIXES) {
    t = t.replace(re, rep);
  }
  for (const [re, rep] of SPANISH_DISPLAY_FIXES) {
    t = t.replace(re, rep);
  }
  for (const [re, rep] of SPANISH_ACCENT_GLITCHES) {
    t = t.replace(re, rep);
  }
  return t;
}

/**
 * Mojibake UTF-8/Latin-1, patrones de catálogo y eliminación de U+FFFD / espacios invisibles.
 * Doble pasada: muchos datos llegan como "Tipolog�a" y tras quitar el carácter de reemplazo queda "Tipologa".
 */
export function repairSpanishDisplayArtifacts(input: string | null | undefined): string {
  let s = repairUtf8Mojibake(String(input ?? ''));
  if (!s) return s;
  s = applyArtifactFixes(s);
  s = s.replace(/\uFFFD/g, '');
  s = s.replace(/[\u200B\uFEFF\u200E\u200F]/g, '');
  s = applyArtifactFixes(s);
  return s;
}
