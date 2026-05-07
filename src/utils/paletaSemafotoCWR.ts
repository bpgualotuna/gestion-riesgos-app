/**
 * Paleta unificada CWR para semáforos de calificación y niveles de riesgo.
 * Se mantiene el nombre histórico "Semafoto" por compatibilidad con imports existentes.
 */

/** Verde principal (nivel bajo / altamente efectivo). */
export const CWR_VERDE_EXCEL = '#00B050';
/** Verde intermedio (efectivo). */
export const CWR_VERDE_EFECTIVO_INTERMEDIO = '#92D050';
/** Amarillo (nivel medio / medianamente efectivo). */
export const CWR_AMARILLO_EXCEL = '#FFFF00';
/** Naranja (nivel alto / baja efectividad). */
export const CWR_NARANJA_EXCEL = '#ED7D31';
/** Rojo (nivel crítico / inefectivo). */
export const CWR_ROJO_EXCEL = '#FF0000';
/** Rojo oscuro para escenarios residuales máximos (ej. 25). */
export const CWR_ROJO_OSCURO_EXCEL = '#C00000';

/** Alias semánticos para niveles del sistema. */
export const NIVEL_BAJO_BG = CWR_VERDE_EXCEL;
export const NIVEL_MEDIO_BG = CWR_AMARILLO_EXCEL;
export const NIVEL_ALTO_BG = CWR_NARANJA_EXCEL;
export const NIVEL_CRITICO_BG = CWR_ROJO_EXCEL;

