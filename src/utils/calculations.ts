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
 * Genera ID único para riesgo
 * Fórmula Excel: =+CONCATENATE(C11,E11)
 */
export function generarIdRiesgo(vicepresidencia: string, gerencia: string): string {
  return `${vicepresidencia}-${gerencia}`;
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
