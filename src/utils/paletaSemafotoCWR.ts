/** Hex por defecto; el color del nivel en Admin → Niveles de riesgo tiene prioridad cuando existe. */

/** Verde bajo / tramos verdes del semáforo. */
export const RIESGO_VERDE = '#388e3c';
/** Ámbar medio. */
export const RIESGO_AMBAR = '#fbc02d';
/** Naranja (nivel alto / alerta). */
export const RIESGO_NARANJA = '#ff9800';
export const RIESGO_ROJO = '#d32f2f';
export const RIESGO_ROJO_OSCURO = '#c62828';

/** Verde claro (efectividad intermedia). */
export const RIESGO_VERDE_EFECTIVO_INTERMEDIO = '#81c784';

// Alias CWR / mapa residual
export const CWR_VERDE_EXCEL = RIESGO_VERDE;
export const CWR_VERDE_EFECTIVO_INTERMEDIO = RIESGO_VERDE_EFECTIVO_INTERMEDIO;
export const CWR_AMARILLO_EXCEL = RIESGO_AMBAR;
export const CWR_NARANJA_EXCEL = RIESGO_NARANJA;
export const CWR_ROJO_EXCEL = RIESGO_ROJO;
export const CWR_ROJO_OSCURO_EXCEL = RIESGO_ROJO_OSCURO;

/** Fallback por nombre de nivel si no hay color en catálogo. */
export const NIVEL_CRITICO_BG = RIESGO_ROJO;
export const NIVEL_ALTO_BG = RIESGO_NARANJA;
export const NIVEL_MEDIO_BG = RIESGO_AMBAR;
export const NIVEL_BAJO_BG = RIESGO_VERDE;
