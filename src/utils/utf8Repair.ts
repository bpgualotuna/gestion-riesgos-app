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
  [/\binter\uFFFD+\?s\b/gi, 'interés'],
  [/\binter\?s\b/gi, 'interés'],
  [/\binter\uFFFDs\b/gi, 'interés'],
  [/\bGestin\b/gi, 'Gestión'],
  [/\bPosicin\b/gi, 'Posición'],
  /** Tras quitar U+FFFD: "cibernéticos" → "cibernticos" (muy frecuente en nombres de proceso SGSI). */
  [/\bcibernticos\b/gi, 'cibernéticos'],
  [/\bciberntico\b/gi, 'cibernético'],
  [/\bciberntica\b/gi, 'cibernética'],
  [/\bcibernticas\b/gi, 'cibernéticas'],
  [/\bCibernticos\b/g, 'Cibernéticos'],
  [/\bCiberntico\b/g, 'Cibernético'],
  [/\bCiberntica\b/g, 'Cibernética'],
  [/\bcibern\?ticos\b/gi, 'cibernéticos'],
  [/\bcibern\?tico\b/gi, 'cibernético'],
  [/\bcibern\?tica\b/gi, 'cibernética'],
  [/\bCibern\?ticos\b/g, 'Cibernéticos'],
  [/\bsegurdad\b/gi, 'seguridad'],
  [/\bSegurdad\b/g, 'Seguridad'],
  [/\bautomtico\b/gi, 'automático'],
  [/\bautomtica\b/gi, 'automática'],
  [/\belectrnico\b/gi, 'electrónico'],
  [/\belectrnica\b/gi, 'electrónica'],
  [/\bmetdico\b/gi, 'médico'],
  [/\bmetdica\b/gi, 'médica'],
  [/\bpoltico\b/gi, 'político'],
  [/\bpoltica\b/gi, 'política'],
  [/\banlisis\b/gi, 'análisis'],
  [/\bAnlisis\b/g, 'Análisis'],
  [/\bprdico\b/gi, 'periódico'],
  [/\bprdica\b/gi, 'periódica'],
  [/\bnumrico\b/gi, 'numérico'],
  [/\bnumrica\b/gi, 'numérica'],
  [/\bespecfico\b/gi, 'específico'],
  [/\bespecfica\b/gi, 'específica'],
  [/\bgenrico\b/gi, 'genérico'],
  [/\bgenrica\b/gi, 'genérica'],
  [/\bgeomtrico\b/gi, 'geométrico'],
  [/\bgeomtrica\b/gi, 'geométrica'],
  [/\bhistrico\b/gi, 'histórico'],
  [/\bhistrica\b/gi, 'histórica'],
  [/\bprctico\b/gi, 'práctico'],
  [/\bprctica\b/gi, 'práctica'],
  [/\bprtico\b/gi, 'práctico'],
  [/\bprtica\b/gi, 'práctica'],
  [/\bsimbolico\b/gi, 'simbólico'],
  [/\bsimbolica\b/gi, 'simbólica'],
  [/\bsistmico\b/gi, 'sistémico'],
  [/\bsistmica\b/gi, 'sistémica'],
  [/\btecnolgico\b/gi, 'tecnológico'],
  [/\btecnolgica\b/gi, 'tecnológica'],
  [/\bterico\b/gi, 'teórico'],
  [/\bterica\b/gi, 'teórica'],
  [/\btrafico\b/gi, 'tráfico'],
  [/\bunico\b/gi, 'único'],
  [/\bunica\b/gi, 'única'],
  [/\bUnico\b/g, 'Único'],
  [/\bUnica\b/g, 'Única'],
  [/\bbasico\b/gi, 'básico'],
  [/\bbasica\b/gi, 'básica'],
  [/\bBasico\b/g, 'Básico'],
  [/\bBasica\b/g, 'Básica'],
  [/\bpublico\b/gi, 'público'],
  [/\bpublica\b/gi, 'pública'],
  [/\bPblico\b/g, 'Público'],
  [/\bPblica\b/g, 'Pública'],
  [/\bprivado\b/gi, 'privado'],
  [/\blogico\b/gi, 'lógico'],
  [/\blogica\b/gi, 'lógica'],
  [/\bLgico\b/g, 'Lógico'],
  [/\bLgica\b/g, 'Lógica'],
  [/\bmetodo\b/gi, 'método'],
  [/\bMetodo\b/g, 'Método'],
  [/\bregin\b/gi, 'región'],
  [/\bRegin\b/g, 'Región'],
  [/\bversin\b/gi, 'versión'],
  [/\bVersin\b/g, 'Versión'],
  [/\bmisin\b/gi, 'misión'],
  [/\bMisin\b/g, 'Misión'],
  [/\bvisin\b/gi, 'visión'],
  [/\bVisin\b/g, 'Visión'],
  [/\bdecisin\b/gi, 'decisión'],
  [/\bDecisin\b/g, 'Decisión'],
  [/\bdivisin\b/gi, 'división'],
  [/\bDivisin\b/g, 'División'],
  [/\bproteccin\b/gi, 'protección'],
  [/\bProteccin\b/g, 'Protección'],
  [/\bprevencin\b/gi, 'prevención'],
  [/\bPrevencin\b/g, 'Prevención'],
  [/\binformacin\b/gi, 'información'],
  [/\bInformacin\b/g, 'Información'],
  [/\boperacin\b/gi, 'operación'],
  [/\bOperacin\b/g, 'Operación'],
  [/\bvalidacin\b/gi, 'validación'],
  [/\bValidacin\b/g, 'Validación'],
  [/\bclasificacin\b/gi, 'clasificación'],
  [/\bClasificacin\b/g, 'Clasificación'],
  [/\bnotificacin\b/gi, 'notificación'],
  [/\bNotificacin\b/g, 'Notificación'],
  [/\bubicacin\b/gi, 'ubicación'],
  [/\bUbicacin\b/g, 'Ubicación'],
  [/\bubicacin\b/gi, 'ubicación'],
  [/\baplicacin\b/gi, 'aplicación'],
  [/\bAplicacin\b/g, 'Aplicación'],
  [/\bconfiguracin\b/gi, 'configuración'],
  [/\bConfiguracin\b/g, 'Configuración'],
  [/\badministracin\b/gi, 'administración'],
  [/\bAdministracin\b/g, 'Administración'],
  [/\borganizacin\b/gi, 'organización'],
  [/\bOrganizacin\b/g, 'Organización'],
  [/\bautorizacin\b/gi, 'autorización'],
  [/\bAutorizacin\b/g, 'Autorización'],
  [/\bverificacin\b/gi, 'verificación'],
  [/\bVerificacin\b/g, 'Verificación'],
  [/\bidentificacin\b/gi, 'identificación'],
  [/\bIdentificacin\b/g, 'Identificación'],
  [/\bcalificacin\b/gi, 'calificación'],
  [/\bCalificacin\b/g, 'Calificación'],
  [/\bsatisfaccin\b/gi, 'satisfacción'],
  [/\bSatisfaccin\b/g, 'Satisfacción'],
  [/\bretencin\b/gi, 'retención'],
  [/\bRetencin\b/g, 'Retención'],
  [/\bexcepcin\b/gi, 'excepción'],
  [/\bExcepcin\b/g, 'Excepción'],
  [/\brecepcin\b/gi, 'recepción'],
  [/\bRecepcin\b/g, 'Recepción'],
  [/\btransaccin\b/gi, 'transacción'],
  [/\bTransaccin\b/g, 'Transacción'],
  [/\bintervencin\b/gi, 'intervención'],
  [/\bIntervencin\b/g, 'Intervención'],
  [/\bsuscripcin\b/gi, 'suscripción'],
  [/\bSuscripcin\b/g, 'Suscripción'],
  [/\binspeccin\b/gi, 'inspección'],
  [/\bInspeccin\b/g, 'Inspección'],
  [/\bconexin\b/gi, 'conexión'],
  [/\bConexin\b/g, 'Conexión'],
  [/\bseleccin\b/gi, 'selección'],
  [/\bSeleccin\b/g, 'Selección'],
  [/\binstitucin\b/gi, 'institución'],
  [/\bInstitucin\b/g, 'Institución'],
  [/\bconstitucin\b/gi, 'constitución'],
  [/\bConstitucin\b/g, 'Constitución'],
  [/\bsolucin\b/gi, 'solución'],
  [/\bSolucin\b/g, 'Solución'],
  [/\bevolucin\b/gi, 'evolución'],
  [/\bEvolucin\b/g, 'Evolución'],
  [/\brevolucin\b/gi, 'revolución'],
  [/\bRevolucin\b/g, 'Revolución'],
  [/\bdistribucin\b/gi, 'distribución'],
  [/\bDistribucin\b/g, 'Distribución'],
  [/\bcontribucin\b/gi, 'contribución'],
  [/\bContribucin\b/g, 'Contribución'],
  [/\bsubstitucin\b/gi, 'substitución'],
  [/\bSubstitucin\b/g, 'Substitución'],
  [/\binstitucin\b/gi, 'institución'],
  [/\bInstitucin\b/g, 'Institución'],
];

/**
 * Acento e/i/o/u perdido como �, U+FFFD o ? en datos importados / columnas legacy.
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

/** Nombres/apellidos frecuentes que llegan con carácter de reemplazo. */
const PERSON_NAME_GLITCH_FIXES: Array<[RegExp, string]> = [
  [/\bJos[\?\uFFFD]+\b/g, 'José'],
  [/\bJos\uFFFD\b/g, 'José'],
  [/\bJos\?\b/g, 'José'],
  [/\bMar[\?\uFFFD]+a\b/g, 'María'],
  [/\bMar\uFFFDa\b/g, 'María'],
  [/\bMar\?a\b/g, 'María'],
  [/\bGonz[\?\uFFFD]+lez\b/gi, 'González'],
  [/\bGonz\uFFFDlez\b/gi, 'González'],
  [/\bGonz\?lez\b/gi, 'González'],
  [/\bP[\?\uFFFD]+rez\b/gi, 'Pérez'],
  [/\bP\uFFFDrez\b/gi, 'Pérez'],
  [/\bP\?rez\b/gi, 'Pérez'],
  [/\bRodr[\?\uFFFD]+guez\b/gi, 'Rodríguez'],
  [/\bRodr\uFFFDguez\b/gi, 'Rodríguez'],
  [/\bRodr\?guez\b/gi, 'Rodríguez'],
  [/\bMaldonad[\?\uFFFD]+\b/gi, 'Maldonado'],
  [/\bMaldonad\uFFFD\b/gi, 'Maldonado'],
  [/\bMaldonad\?\b/gi, 'Maldonado'],
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
  for (const [re, rep] of PERSON_NAME_GLITCH_FIXES) {
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

export function sanitizeTextTree<T>(value: T): T {
  if (typeof value === 'string') {
    return repairSpanishDisplayArtifacts(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeTextTree(item)) as T;
  }
  if (value && typeof value === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      normalized[k] = sanitizeTextTree(v);
    }
    return normalized as T;
  }
  return value;
}
