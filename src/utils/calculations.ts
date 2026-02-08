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
  tecnologico?: number;
}

/**
 * Calcula el impacto global ponderado
 * Fórmula Excel: =+ROUNDUP((X11*14%+Y11*22%+Z11*22%+AA11*10%+AB11*10%+AC11*22%),0)
 */
export function calcularImpactoGlobal(impactos: Impactos): number {
  const impactoGlobal =
    (impactos.personas || 0) * PESOS_IMPACTO.personas +
    (impactos.legal || 0) * PESOS_IMPACTO.legal +
    (impactos.ambiental || 0) * PESOS_IMPACTO.ambiental +
    (impactos.procesos || 0) * PESOS_IMPACTO.procesos +
    (impactos.reputacion || 0) * PESOS_IMPACTO.reputacion +
    (impactos.economico || 0) * PESOS_IMPACTO.economico;

  return Math.ceil(impactoGlobal);
}

/**
 * Calcula el impacto máximo entre todas las dimensiones
 */
export function calcularImpactoMaximo(impactos: Impactos): number {
  return Math.max(
    impactos.personas || 0,
    impactos.legal || 0,
    impactos.ambiental || 0,
    impactos.procesos || 0,
    impactos.reputacion || 0,
    impactos.economico || 0,
    impactos.tecnologico || 0
  );
}

/**
 * Calcula el riesgo inherente
 * Fórmula Excel: =+IF(AND(AD11=2,W11=2),3.99,AD11*W11)
 * 
 * CASO ESPECIAL: Si impactoMaximo = 2 Y probabilidad = 2, resultado = 3.99
 */
export function calcularRiesgoInherente(impactoMaximo: number, probabilidad: number): number {
  // Caso especial documentado en Excel
  if (impactoMaximo === 2 && probabilidad === 2) {
    return 3.99;
  }

  return impactoMaximo * probabilidad;
}

/**
 * Determina el nivel de riesgo según el valor calculado
 * Fórmula Excel: =IF(OR(AF11=3,AF11=2,AF11=1,AF11=3.99,N11="Riesgo con consecuencia positiva"),"NIVEL BAJO",...)
 */
export function determinarNivelRiesgo(
  riesgoInherente: number,
  clasificacion: ClasificacionRiesgo
): NivelRiesgo {
  // Si es riesgo positivo (oportunidad), siempre es NIVEL BAJO
  if (clasificacion === CLASIFICACION_RIESGO.POSITIVA) {
    return NIVELES_RIESGO.BAJO;
  }

  // Para riesgos negativos, aplicar umbrales
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
export function generarIdRiesgoAutomatico(vicepresidenciaNombre: string): string {
  if (!vicepresidenciaNombre || !vicepresidenciaNombre.trim()) {
    console.warn('No se proporcionó vicepresidencia para generar ID');
    return '';
  }

  // Obtener siglas desde configuración
  const storedSiglas = localStorage.getItem('config_siglas');
  if (!storedSiglas) {
    console.warn('No hay siglas configuradas en localStorage');
    // Si no hay configuración, usar sigla por defecto basada en las iniciales
    const siglaDefault = vicepresidenciaNombre
      .split(' ')
      .filter(p => p.length > 0)
      .map(palabra => palabra.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    return generarIdConContador(siglaDefault);
  }

  const siglas: Array<{ nombre: string; sigla: string }> = JSON.parse(storedSiglas);
  
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
    console.warn(`No se encontró sigla para vicepresidencia: "${vicepresidenciaNombre}". Siglas disponibles:`, siglas.map(s => s.nombre));
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
function generarIdConContador(sigla: string): string {
  const key = `contador_riesgos_${sigla}`;
  const contadorActual = parseInt(localStorage.getItem(key) || '0', 10);
  const nuevoContador = contadorActual + 1;
  localStorage.setItem(key, nuevoContador.toString());
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
    umbral2: 50,
    umbral3: 70,
    umbral4: 85,
  }
): string {
  if (puntajeTotal < rangos.umbral1) return 'Inefectivo';
  if (puntajeTotal >= rangos.umbral1 && puntajeTotal < rangos.umbral2) return 'Baja Efectividad';
  if (puntajeTotal >= rangos.umbral2 && puntajeTotal < rangos.umbral3) return 'Medianamente Efectivo';
  if (puntajeTotal >= rangos.umbral3 && puntajeTotal < rangos.umbral4) return 'Efectivo';
  if (puntajeTotal >= rangos.umbral4) return 'Altamente Efectivo';
  return 'ERROR';
}

/**
 * EVALUACIÓN DEFINITIVA - Ajusta la evaluación preliminar según condiciones adicionales
 * Fórmula Excel: SI.ERROR(SI(BT11=$BW$5;Formulas!$B$13;SI(Y(BT11=$BW$4;BV11="Altamente Efectivo");"Efectivo";BV11));"No Aplica")
 * 
 * Lógica:
 * - Si recomendación = X (condición especial) → valor especial (ej: "Efectivo")
 * - Si recomendación = Y Y evaluación preliminar = "Altamente Efectivo" → "Efectivo"
 * - Si recomendación = Z → mantener evaluación preliminar
 * - Si hay error → "No Aplica"
 */
export function determinarEvaluacionDefinitiva(
  evaluacionPreliminar: string,
  recomendacion: string | undefined,
  condicionEspecial1?: { valor: string; resultado: string },
  condicionEspecial2?: { valor: string; resultado: string }
): string {
  try {
    // Condición especial 1
    if (condicionEspecial1 && recomendacion === condicionEspecial1.valor) {
      return condicionEspecial1.resultado;
    }

    // Condición especial 2 (ajustar "Altamente Efectivo" a "Efectivo" si hay cierta recomendación)
    if (
      condicionEspecial2 &&
      recomendacion === condicionEspecial2.valor &&
      evaluacionPreliminar === 'Altamente Efectivo'
    ) {
      return 'Efectivo';
    }

    // Mantener evaluación preliminar por defecto
    return evaluacionPreliminar;
  } catch (error) {
    return 'No Aplica';
  }
}

/**
 * TABLA DE BÚSQUEDA - % MITIGACIÓN según evaluación definitiva
 * Fórmula Excel: BUSCARV(BW11;Formulas!$B$9:$F$13;5;0)
 * 
 * Tabla de referencia:
 * | Evaluación | % Mitigación |
 * | Altamente Efectivo | 34% |
 * | Efectivo | 34% |
 * | Medianamente Efectivo | 20% |
 * | Baja Efectividad | 10% |
 * | Inefectivo | 0% |
 */
export function obtenerPorcentajeMitigacionAvanzado(evaluacionDefinitiva: string): number {
  const tablaMitigacion: Record<string, number> = {
    'Altamente Efectivo': 0.34,
    'Efectivo': 0.34,
    'Medianamente Efectivo': 0.20,
    'Baja Efectividad': 0.10,
    'Inefectivo': 0.0,
    'No Aplica': 0.0,
  };

  return tablaMitigacion[evaluacionDefinitiva] || 0;
}

/**
 * CÁLCULO RESIDUAL AVANZADO - Frecuencia
 * Fórmula Excel: SI.ERROR(REDONDEAR.MAS(SI(BH11="FRECUENCIA";W11-(BX11*W11);SI(BH11="AMBAS";W11-(BX11*W11);...));0);W11)
 * 
 * Lógica:
 * - Si tipoMitigacion = "FRECUENCIA" o "AMBAS" → aplicar mitigación a frecuencia
 * - Si tipoMitigacion = "IMPACTO" → mantener frecuencia igual
 * - Si error → devolver frecuencia inherente
 */
export function calcularFrecuenciaResidualAvanzada(
  frecuenciaInherente: number,
  impactoInherente: number,
  porcentajeMitigacion: number,
  tipoMitigacion: 'FRECUENCIA' | 'IMPACTO' | 'AMBAS' = 'AMBAS'
): number {
  try {
    if (tipoMitigacion === 'FRECUENCIA' || tipoMitigacion === 'AMBAS') {
      // Aplicar mitigación a frecuencia
      const residual = frecuenciaInherente - frecuenciaInherente * porcentajeMitigacion;
      return Math.max(1, Math.ceil(residual));
    } else if (tipoMitigacion === 'IMPACTO') {
      // Si es solo IMPACTO, mantener frecuencia igual
      return frecuenciaInherente;
    }

    return frecuenciaInherente;
  } catch (error) {
    return frecuenciaInherente;
  }
}

/**
 * CÁLCULO RESIDUAL AVANZADO - Impacto
 * Fórmula Excel: SI.ERROR(REDONDEAR.MAS(SI(BH11="IMPACTO";AD11-(AD11*BX11);SI(BH11="AMBAS";AD11-(AD11*BX11);...));0);AD11)
 * 
 * Lógica:
 * - Si tipoMitigacion = "IMPACTO" o "AMBAS" → aplicar mitigación a impacto
 * - Si tipoMitigacion = "FRECUENCIA" → mantener impacto igual
 * - Si error → devolver impacto inherente
 */
export function calcularImpactoResidualAvanzado(
  impactoInherente: number,
  frecuenciaInherente: number,
  porcentajeMitigacion: number,
  tipoMitigacion: 'FRECUENCIA' | 'IMPACTO' | 'AMBAS' = 'AMBAS'
): number {
  try {
    if (tipoMitigacion === 'IMPACTO' || tipoMitigacion === 'AMBAS') {
      // Aplicar mitigación a impacto
      const residual = impactoInherente - impactoInherente * porcentajeMitigacion;
      return Math.max(1, Math.ceil(residual));
    } else if (tipoMitigacion === 'FRECUENCIA') {
      // Si es solo FRECUENCIA, mantener impacto igual
      return impactoInherente;
    }

    return impactoInherente;
  } catch (error) {
    return impactoInherente;
  }
}
