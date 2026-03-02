/**
 * Risk Calculation Functions
 * Translated from Excel formulas to TypeScript
 */

import { PESOS_IMPACTO, UMBRALES_RIESGO, NIVELES_RIESGO, CLASIFICACION_RIESGO } from './constants';
import type { NivelRiesgo, ClasificacionRiesgo } from './constants';

export interface Impactos {
  personas: number;
  legal: number;
  ambiental: number;
  procesos: number;
  reputacion: number;
  economico: number;
  confidencialidadSGSI?: number;
  disponibilidadSGSI?: number;
  integridadSGSI?: number;
}

/**
 * Calcula el impacto global ponderado
 * Fórmula: nivel * porcentaje (en decimal), sumar todos, redondear a entero
 * 
 * @param impactos - Niveles de impacto (1-5) para cada dimensión
 * @param pesos - Porcentajes configurados (opcional, si no se proporciona usa PESOS_IMPACTO por defecto)
 *                Formato: { key: string, porcentaje: number }[] donde porcentaje está en formato 0-100
 */
export function calcularImpactoGlobal(
  impactos: Impactos,
  pesos?: Array<{ key: string; porcentaje: number }>
): number {
  // Si se proporcionan pesos desde la BD, usarlos; sino usar los hardcodeados
  let pesosUsar: Record<string, number>;
  
  if (pesos && pesos.length > 0) {
    // Convertir porcentajes (0-100) a decimales (0-1)
    pesosUsar = {};
    pesos.forEach(p => {
      pesosUsar[p.key] = p.porcentaje / 100;
    });
  } else {
    // Usar pesos hardcodeados como fallback
    pesosUsar = PESOS_IMPACTO as Record<string, number>;
  }
  
  // Calcular: nivel * porcentaje_decimal para cada impacto, luego sumar
  const impactoGlobal =
    (impactos.personas || 1) * (pesosUsar.personas || 0) +
    (impactos.legal || 1) * (pesosUsar.legal || 0) +
    (impactos.ambiental || 1) * (pesosUsar.ambiental || 0) +
    (impactos.procesos || 1) * (pesosUsar.procesos || 0) +
    (impactos.reputacion || 1) * (pesosUsar.reputacion || 0) +
    (impactos.economico || 1) * (pesosUsar.economico || 0) +
    (impactos.confidencialidadSGSI || 1) * (pesosUsar.confidencialidadSGSI || 0) +
    (impactos.disponibilidadSGSI || 1) * (pesosUsar.disponibilidadSGSI || 0) +
    (impactos.integridadSGSI || 1) * (pesosUsar.integridadSGSI || 0);

  // Redondear hacia arriba (Math.ceil) - igual que en el backend
  return Math.ceil(impactoGlobal);
}

/**
 * Calcula el impacto máximo entre todas las dimensiones
 */
export function calcularImpactoMaximo(impactos: Impactos): number {
  return Math.max(
    impactos.personas || 1,
    impactos.legal || 1,
    impactos.ambiental || 1,
    impactos.procesos || 1,
    impactos.reputacion || 1,
    impactos.economico || 1,
    impactos.confidencialidadSGSI || 1,
    impactos.disponibilidadSGSI || 1,
    impactos.integridadSGSI || 1
  );
}

/**
 * Calcula el riesgo inherente
 * Fórmula Excel: =+IF(AND(AD11=2,W11=2),3.99,AD11*W11)
 * 
 * CASO ESPECIAL: Si impactoMaximo = 2 Y probabilidad = 2, resultado = 3.99
 * 
 * NOTA: Esta función ahora usa el servicio centralizado cuando está disponible,
 * pero mantiene compatibilidad con la lógica hardcodeada como fallback.
 */
export function calcularRiesgoInherente(impactoMaximo: number, probabilidad: number): number {
  // Intentar usar servicio centralizado (síncrono con cache)
  try {
    const { calcularCalificacionInherentePorCausaSync } = require('../services/calificacionInherenteService');
    const resultado = calcularCalificacionInherentePorCausaSync(probabilidad, impactoMaximo);
    return resultado.resultado;
  } catch (error) {
    // Fallback: Lógica hardcodeada
    if (impactoMaximo === 2 && probabilidad === 2) {
      return 3.99;
    }
    return impactoMaximo * probabilidad;
  }
}

/**
 * Determina el nivel de riesgo según el valor calculado
 * Fórmula Excel: =IF(OR(AF11=3,AF11=2,AF11=1,AF11=3.99,N11="Riesgo con consecuencia positiva"),"NIVEL BAJO",...)
 * 
 * NOTA: Esta función ahora usa el servicio centralizado cuando está disponible,
 * pero mantiene compatibilidad con la lógica hardcodeada como fallback.
 */
export function determinarNivelRiesgo(
  riesgoInherente: number,
  clasificacion: ClasificacionRiesgo
): NivelRiesgo {
  // Si es riesgo positivo (oportunidad), siempre es NIVEL BAJO
  if (clasificacion === CLASIFICACION_RIESGO.POSITIVA) {
    return NIVELES_RIESGO.BAJO;
  }

  // Intentar usar servicio centralizado (síncrono con cache)
  try {
    const { determinarNivelRiesgoSync } = require('../services/calificacionInherenteService');
    const nivel = determinarNivelRiesgoSync(riesgoInherente);
    // Mapear nombres de nivel a constantes
    const nivelUpper = nivel.toUpperCase();
    if (nivelUpper.includes('CRITICO') || nivelUpper.includes('CRÍTICO')) return NIVELES_RIESGO.CRITICO;
    if (nivelUpper.includes('ALTO')) return NIVELES_RIESGO.ALTO;
    if (nivelUpper.includes('MEDIO')) return NIVELES_RIESGO.MEDIO;
    if (nivelUpper.includes('BAJO')) return NIVELES_RIESGO.BAJO;
    return NIVELES_RIESGO.BAJO;
  } catch (error) {
    // Fallback: Lógica hardcodeada
    if (riesgoInherente >= UMBRALES_RIESGO.CRITICO) {
      return NIVELES_RIESGO.CRITICO;
    }
    if (riesgoInherente >= UMBRALES_RIESGO.ALTO) {
      return NIVELES_RIESGO.ALTO;
    }
    if (riesgoInherente >= UMBRALES_RIESGO.MEDIO) {
      return NIVELES_RIESGO.MEDIO;
    }
    return NIVELES_RIESGO.BAJO;
  }
}

/**
 * Calcula el riesgo residual después de aplicar controles
 * Similar al riesgo inherente pero con ajuste por efectividad de controles
 */
export function calcularRiesgoResidual(
  riesgoInherente: number,
  efectividadControles: number
): number {
  // Reducir riesgo según efectividad de controles (0-1)
  const riesgoAjustado = riesgoInherente * (1 - efectividadControles);

  // Aplicar misma lógica especial que riesgo inherente
  const impactoResidual = Math.ceil(riesgoAjustado / 5);
  const probabilidadResidual = Math.ceil(riesgoAjustado % 5) || 1;

  if (impactoResidual === 2 && probabilidadResidual === 2) {
    return 3.99;
  }

  return impactoResidual * probabilidadResidual;
}

/**
 * Calcula la efectividad de un control
 * Basado en la hoja "Formulas" del Excel
 */
export interface Control {
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
}

export interface PesosControl {
  aplicabilidad?: number;
  cobertura?: number;
  facilidadUso?: number;
  segregacion?: number;
  naturaleza?: number;
  desviaciones?: number;
}

export function calcularEfectividadControl(
  control: Control,
  pesos: PesosControl = {
    aplicabilidad: 0.25,
    cobertura: 0.25,
    facilidadUso: 0.10,
    segregacion: 0.20,
    naturaleza: 0.20,
    desviaciones: 0.20,
  }
): number {
  const efectividad =
    (control.aplicabilidad || 0) * (pesos.aplicabilidad || 0) +
    (control.cobertura || 0) * (pesos.cobertura || 0) +
    (control.facilidadUso || 0) * (pesos.facilidadUso || 0) +
    (control.segregacion || 0) * (pesos.segregacion || 0) +
    (control.naturaleza || 0) * (pesos.naturaleza || 0) -
    (control.desviaciones || 0) * (pesos.desviaciones || 0);

  // Normalizar entre 0 y 1
  return Math.max(0, Math.min(1, efectividad));
}

/**
 * Clasifica la efectividad de un control
 */
export function clasificarEfectividad(efectividad: number): string {
  const porcentaje = efectividad * 100;

  if (porcentaje >= 85 && porcentaje <= 96) {
    return 'Altamente Efectivo';
  }
  if (porcentaje >= 66 && porcentaje <= 84) {
    return 'Efectivo';
  }
  if (porcentaje >= 46 && porcentaje <= 65) {
    return 'Medianamente Efectivo';
  }
  if (porcentaje >= 26 && porcentaje <= 45) {
    return 'Baja Efectividad';
  }
  return 'Inefectivo';
}

/**
 * Calcula el puntaje de priorización
 * Fórmula Excel: =+IFERROR(Formulas!$C$20*K11+M11*Formulas!$E$20+O11*Formulas!$G$20+Q11*Formulas!$I$20,0)
 */
export interface VariablesPriorizacion {
  capacidad?: number;
  complejidad?: number;
  velocidad?: number;
  otraVariable?: number;
}

export interface PesosPriorizacion {
  capacidad?: number;
  complejidad?: number;
  velocidad?: number;
  otraVariable?: number;
}

export function calcularPuntajePriorizacion(
  variables: VariablesPriorizacion,
  pesos: PesosPriorizacion = {
    capacidad: 0.25,
    complejidad: 0.25,
    velocidad: 0.25,
    otraVariable: 0.25,
  }
): number {
  try {
    return (
      (variables.capacidad || 0) * (pesos.capacidad || 0) +
      (variables.complejidad || 0) * (pesos.complejidad || 0) +
      (variables.velocidad || 0) * (pesos.velocidad || 0) +
      (variables.otraVariable || 0) * (pesos.otraVariable || 0)
    );
  } catch (error) {
    return 0;
  }
}

/**
 * Genera ID automático para riesgo
 * Formato: número secuencial + sigla de Vicepresidencia/Gerencia Alta
 * Ejemplo: "1GFA" para Gestión Financiera y Administrativa
 */
const siglasCache: Array<{ nombre: string; sigla: string }> = [];
const contadorRiesgos = new Map<string, number>();

export function setSiglasConfig(siglas: Array<{ nombre: string; sigla: string }>) {
  siglasCache.splice(0, siglasCache.length, ...siglas);
}

export function generarIdRiesgoAutomatico(vicepresidenciaNombre: string): string {
  if (!vicepresidenciaNombre || !vicepresidenciaNombre.trim()) {
    return '';
  }

  const siglas: Array<{ nombre: string; sigla: string }> = siglasCache;
  if (siglas.length === 0) {
    const siglaDefault = vicepresidenciaNombre
      .split(' ')
      .filter(p => p.length > 0)
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    return generarIdConContador(siglaDefault);
  }

  // Normalizar la vicepresidencia para búsqueda (remover palabras comunes como "Vicepresidencia de", "Gerencia de", etc.)
  const normalizarNombre = (nombre: string): string => {
    return nombre
      .toLowerCase()
      .replace(/^(vicepresidencia\s+de|gerencia\s+de|dirección\s+de|gestión\s+de)\s+/i, '')
      .trim();
  };

  const vicepresidenciaNormalizada = normalizarNombre(vicepresidenciaNombre);

  // Buscar coincidencia exacta primero
  let siglaEncontrada = siglas.find(
    (s) => s.nombre.trim().toLowerCase() === vicepresidenciaNombre.trim().toLowerCase()
  );

  // Si no hay coincidencia exacta, buscar por nombre normalizado
  if (!siglaEncontrada) {
    siglaEncontrada = siglas.find(
      (s) => normalizarNombre(s.nombre) === vicepresidenciaNormalizada
    );
  }

  // Si aún no hay coincidencia, buscar si el nombre contiene palabras clave
  if (!siglaEncontrada) {
    const palabrasClave = vicepresidenciaNormalizada.split(/\s+/).filter(p => p.length > 2);
    siglaEncontrada = siglas.find((s) => {
      const nombreNormalizado = normalizarNombre(s.nombre);
      return palabrasClave.some(palabra => nombreNormalizado.includes(palabra));
    });
  }

  if (!siglaEncontrada) {
    // Si no se encuentra, generar sigla por defecto
    const siglaDefault = vicepresidenciaNombre
      .split(' ')
      .filter(p => p.length > 0 && !['de', 'del', 'la', 'las', 'el', 'los', 'vicepresidencia', 'gerencia', 'dirección', 'gestión'].includes(p.toLowerCase()))
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    return generarIdConContador(siglaDefault);
  }

  return generarIdConContador(siglaEncontrada.sigla);
}

/**
 * Genera ID con contador secuencial por sigla
 */
export function generarIdConContador(sigla: string): string {
  const contadorActual = contadorRiesgos.get(sigla) || 0;
  const nuevoContador = contadorActual + 1;
  contadorRiesgos.set(sigla, nuevoContador);
  return `${nuevoContador}${sigla}`;
}

/**
 * Simula VLOOKUP de Excel
 */
export function vlookup<T, K extends keyof T>(
  valor: T[K],
  tabla: T[],
  columnaBusqueda: K,
  columnaResultado: keyof T,
  valorPorDefecto: T[keyof T] | null = null
): T[keyof T] | null {
  const fila = tabla.find((fila) => fila[columnaBusqueda] === valor);
  return fila ? fila[columnaResultado] : valorPorDefecto;
}

/**
 * Obtiene el porcentaje de mitigación basado en la efectividad del control
 * Fórmula: Altamente Efectivo/Efectivo = 34%, Medianamente Efectivo = 20%, Baja = 10%, Inefectivo = 0%
 */
export function obtenerPorcentajeMitigacion(efectividad: string): number {
  switch (efectividad) {
    case 'Altamente Efectivo':
    case 'Efectivo':
      return 0.34;
    case 'Medianamente Efectivo':
      return 0.20;
    case 'Baja Efectividad':
      return 0.10;
    case 'Inefectivo':
    case 'No Aplica':
    default:
      return 0;
  }
}

/**
 * Calcula la frecuencia residual después de aplicar mitigación
 * Fórmula: Frecuencia Residual = Frecuencia Inherente - (Frecuencia Inherente * % Mitigación)
 */
export function calcularFrecuenciaResidual(
  frecuenciaInherente: number,
  porcentajeMitigacion: number
): number {
  const residual = frecuenciaInherente - (frecuenciaInherente * porcentajeMitigacion);
  return Math.max(1, Math.ceil(residual));
}

/**
 * Calcula el impacto residual después de aplicar mitigación
 * Fórmula: Impacto Residual = Impacto Inherente - (Impacto Inherente * % Mitigación)
 */
export function calcularImpactoResidual(
  impactoInherente: number,
  porcentajeMitigacion: number
): number {
  const residual = impactoInherente - (impactoInherente * porcentajeMitigacion);
  return Math.max(1, Math.ceil(residual));
}

/**
 * Calcula la calificación residual de una causa
 * Fórmula: Calificación Residual = Frecuencia Residual * Impacto Residual
 */
export function calcularCalificacionResidual(
  frecuenciaResidual: number,
  impactoResidual: number
): number {
  return frecuenciaResidual * impactoResidual;
}

/**
 * Calcula el puntaje total de la evaluación del control
 * Fórmula: Suma ponderada de criterios
 */
export function calcularPuntajeControl(
  puntajeAplicabilidad: number = 0,
  puntajeCobertura: number = 0,
  puntajeFacilidad: number = 0,
  puntajeSegregacion: number = 0,
  puntajeNaturaleza: number = 0
): number {
  const PESOS = {
    aplicabilidad: 0.25,
    cobertura: 0.25,
    facilidad: 0.10,
    segregacion: 0.20,
    naturaleza: 0.20,
  };

  return (
    puntajeAplicabilidad * PESOS.aplicabilidad +
    puntajeCobertura * PESOS.cobertura +
    puntajeFacilidad * PESOS.facilidad +
    puntajeSegregacion * PESOS.segregacion +
    puntajeNaturaleza * PESOS.naturaleza
  );
}

/**
 * Determina la efectividad del control según el puntaje total
 */
export function determinarEfectividadControl(puntajeTotal: number): string {
  if (puntajeTotal >= 85) return 'Altamente Efectivo';
  if (puntajeTotal >= 70) return 'Efectivo';
  if (puntajeTotal >= 50) return 'Medianamente Efectivo';
  if (puntajeTotal >= 25) return 'Baja Efectividad';
  return 'Inefectivo';
}

/**
 * EVALUACIÓN PRELIMINAR - Determina efectividad basada en rangos de puntaje
 * Fórmula Excel: SI(BU11<Formulas!$E$12;"Inefectivo";SI(Y(BU11>=Formulas!$E$12;BU11<Formulas!$E$11);"Baja Efectividad";...
 * 
 * Rangos configurables (por defecto):
 * - E12 (Umbral 1): 25
 * - E11 (Umbral 2): 50
 * - E10 (Umbral 3): 70
 * - E9 (Umbral 4): 85
 */
export function determinarEvaluacionPreliminar(
  puntajeTotal: number,
  rangos: { umbral1: number; umbral2: number; umbral3: number; umbral4: number } = {
    umbral1: 25,
    umbral2: 46,
    umbral3: 65,
    umbral4: 85,
  }
): string {
  if (puntajeTotal < rangos.umbral1) return 'Inefectivo';
  if (puntajeTotal >= rangos.umbral1 && puntajeTotal < rangos.umbral2) return 'Baja Efectividad';
  if (puntajeTotal >= rangos.umbral2 && puntajeTotal < rangos.umbral3) return 'Medianamente Efectivo';
  if (puntajeTotal >= rangos.umbral3 && puntajeTotal < rangos.umbral4) return 'Efectivo';
  if (puntajeTotal >= rangos.umbral4) return 'Altamente Efectivo';
  return 'Inefectivo';
}

/**
 * EVALUACIÓN DEFINITIVA - Ajusta la evaluación preliminar según condiciones adicionales (Desviaciones)
 * Lógica:
 * - Si Desviaciones = 'C' (Falla mayoría) → "Inefectivo"
 * - Si Desviaciones = 'B' (Se han encontrado desviaciones) Y Preliminar = "Altamente Efectivo" → "Efectivo"
 * - En cualquier otro caso, mantiene la Preliminar
 */
export function determinarEvaluacionDefinitiva(
  evaluacionPreliminar: string,
  desviaciones: string = 'A' // A: Sin fallos, B: Con desviaciones, C: Falla mayoría
): string {
  if (desviaciones === 'C') {
    return 'Inefectivo';
  }

  if (desviaciones === 'B' && evaluacionPreliminar === 'Altamente Efectivo') {
    return 'Efectivo';
  }

  return evaluacionPreliminar;
}


/**
 * TABLA DE BÚSQUEDA - % MITIGACIÓN según evaluación definitiva
 * Fórmula Excel: BUSCARV(BW11;Formulas!$B$9:$F$13;5;0)
 * 
 * Tabla de referencia:
 * | Evaluación | % Mitigación |
 * | Altamente Efectivo | 81% |
 * | Efectivo | 61% |
 * | Medianamente Efectivo | 33% |
 * | Baja Efectividad | 20% |
 * | Inefectivo | 0% |
 */
export function obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva: string): number {
  const tablaMitigacion: Record<string, number> = {
    'Altamente Efectivo': 0.81,
    'Efectivo': 0.61,
    'Medianamente Efectivo': 0.33,
    'Baja Efectividad': 0.20,
    'Inefectivo': 0.0,
    'No Aplica': 0.0,
  };

  return tablaMitigacion[evaluacionDefinitiva] || 0;
}

/**
 * CÁLCULO RESIDUAL AVANZADO - Frecuencia (BY). Alineado con Excel.
 * Fórmula Excel: SI(BH="FRECUENCIA", W-(BX*W), SI(BH="AMBAS", W-(BX*W), SI(Y(BH="IMPACTO", BW="Efectivo"/"Altamente Efectivo"), W-(W*0,34), W)))); REDONDEAR.MAS(...,0)
 * - Si tipoMitigacion = "FRECUENCIA" o "AMBAS" → reducir por porcentajeMitigacion.
 * - Si tipoMitigacion = "IMPACTO" y evaluación Efectivo/Altamente Efectivo → reducción por porcentajeDimensionCruzada (admin, ej. 0.34).
 * - Si no → mantener frecuencia inherente. Resultado entero 1..5.
 */
export function calcularFrecuenciaResidualAvanzada(
  frecuenciaInherente: number,
  _impactoInherente: number,
  porcentajeMitigacion: number,
  tipoMitigacion: 'FRECUENCIA' | 'IMPACTO' | 'AMBAS' = 'AMBAS',
  evaluacionDefinitiva?: string,
  porcentajeDimensionCruzada: number = 0.34
): number {
  try {
    if (tipoMitigacion === 'FRECUENCIA' || tipoMitigacion === 'AMBAS') {
      const residual = frecuenciaInherente - frecuenciaInherente * porcentajeMitigacion;
      return Math.max(1, Math.min(5, Math.ceil(residual)));
    }
    if (tipoMitigacion === 'IMPACTO' && (evaluacionDefinitiva === 'Efectivo' || evaluacionDefinitiva === 'Altamente Efectivo')) {
      const residual = frecuenciaInherente - frecuenciaInherente * porcentajeDimensionCruzada;
      return Math.max(1, Math.min(5, Math.ceil(residual)));
    }
    return Math.max(1, Math.min(5, Math.ceil(frecuenciaInherente)));
  } catch {
    return Math.max(1, Math.min(5, Math.ceil(frecuenciaInherente)));
  }
}

/**
 * CÁLCULO RESIDUAL AVANZADO - Impacto (BZ). Alineado con Excel.
 * Fórmula Excel: SI(BH="IMPACTO", AD-(AD*BX), SI(BH="AMBAS", AD-(AD*BX), SI(Y(BH="FRECUENCIA", BW="Efectivo"/"Altamente Efectivo"), AD-(AD*0,34), AD)))); REDONDEAR.MAS(...,0)
 * - Si tipoMitigacion = "IMPACTO" o "AMBAS" → reducir por porcentajeMitigacion.
 * - Si tipoMitigacion = "FRECUENCIA" y evaluación Efectivo/Altamente Efectivo → reducción por porcentajeDimensionCruzada (admin, ej. 0.34).
 * - Si no → mantener impacto inherente. Resultado entero 1..5.
 */
export function calcularImpactoResidualAvanzado(
  impactoInherente: number,
  _frecuenciaInherente: number,
  porcentajeMitigacion: number,
  tipoMitigacion: 'FRECUENCIA' | 'IMPACTO' | 'AMBAS' = 'AMBAS',
  evaluacionDefinitiva?: string,
  porcentajeDimensionCruzada: number = 0.34
): number {
  try {
    if (tipoMitigacion === 'IMPACTO' || tipoMitigacion === 'AMBAS') {
      const residual = impactoInherente - impactoInherente * porcentajeMitigacion;
      return Math.max(1, Math.min(5, Math.ceil(residual)));
    }
    if (tipoMitigacion === 'FRECUENCIA' && (evaluacionDefinitiva === 'Efectivo' || evaluacionDefinitiva === 'Altamente Efectivo')) {
      const residual = impactoInherente - impactoInherente * porcentajeDimensionCruzada;
      return Math.max(1, Math.min(5, Math.ceil(residual)));
    }
    return Math.max(1, Math.min(5, Math.ceil(impactoInherente)));
  } catch {
    return Math.max(1, Math.min(5, Math.ceil(impactoInherente)));
  }
}

/**
 * Resuelve la frecuencia de la causa (catálogo) a un valor 1-5 para usar como frecuencia inherente (BY).
 * Versión frontend alineada con backend (recalculoResidual.service.ts).
 */
export type FrecuenciaCatalogItem = { id: number; label?: string | null; peso?: number | null };

export function resolverFrecuenciaCausaA1_5(
  causaFrecuencia: string | number | null | undefined,
  frecuenciasCatalog: FrecuenciaCatalogItem[]
): number | null {
  if (causaFrecuencia == null || String(causaFrecuencia).trim() === '') return null;
  const s = String(causaFrecuencia).trim();
  if (/^\d+$/.test(s)) {
    const freqId = parseInt(s, 10);
    const f = frecuenciasCatalog.find((fc) => fc.id === freqId);
    const p = (f?.peso ?? f?.id ?? freqId) as number;
    return Math.max(1, Math.min(5, Math.round(Number(p))));
  }
  const f = frecuenciasCatalog.find(
    (fc) => fc.label && fc.label.toLowerCase() === s.toLowerCase()
  );
  const p = (f?.peso ?? f?.id ?? 3) as number;
  return Math.max(1, Math.min(5, Math.round(Number(p))));
}
