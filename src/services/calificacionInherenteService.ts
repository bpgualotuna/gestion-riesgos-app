/**
 * Servicio Centralizado de Calificación Inherente
 * Usa la configuración de la base de datos para calcular calificaciones
 */

import { API_BASE_URL, AUTH_TOKEN_KEY } from '../utils/constants';

export interface CalificacionInherenteConfig {
  id: number;
  nombre: string;
  activa: boolean;
  formulaBase?: {
    tipoOperacion: string;
    campos: Array<{ tabla: string; campo: string; tipo: string }>;
  };
  excepciones: Array<{
    condiciones: Record<string, number>;
    resultado: number;
    prioridad: number;
    activa: boolean;
  }>;
  rangos: Array<{
    nivelNombre: string;
    valorMinimo: number;
    valorMaximo: number;
    incluirMinimo: boolean;
    incluirMaximo: boolean;
    orden: number;
  }>;
  reglaAgregacion?: {
    tipoAgregacion: string;
    tablaOrigen: string;
    campoOrigen: string;
  };
}

let configCache: CalificacionInherenteConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Obtiene la configuración del cache (síncrono)
 * Retorna null si no hay cache válido
 */
export function getConfigCache(): CalificacionInherenteConfig | null {
  const now = Date.now();
  if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache;
  }
  return null;
}

/**
 * Obtiene la configuración activa (con cache)
 */
export async function getConfigActiva(): Promise<CalificacionInherenteConfig> {
  const now = Date.now();
  
  // Si hay cache válido, retornarlo
  if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return configCache;
  }

  try {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(AUTH_TOKEN_KEY) : null;
    const headers: HeadersInit = {};
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/calificacion-inherente/activa`, { headers });
    if (!response.ok) {
      throw new Error('Error fetching config');
    }
    const config = await response.json();
    
    // Actualizar cache
    configCache = config;
    cacheTimestamp = now;
    
    return config;
  } catch {
    return getConfigPorDefecto();
  }
}

/**
 * Configuración por defecto (fallback)
 */
function getConfigPorDefecto(): CalificacionInherenteConfig {
  return {
    id: 0,
    nombre: 'Configuración por Defecto',
    activa: true,
    formulaBase: {
      tipoOperacion: 'multiplicacion',
      campos: [
        { tabla: 'CausaRiesgo', campo: 'calificacionGlobalImpacto', tipo: 'number', descripcion: 'Calificación Global Impacto (calculada con pesos y porcentajes, redondeada a entero)' },
        { tabla: 'CausaRiesgo', campo: 'frecuencia', tipo: 'number', descripcion: 'Frecuencia con peso (1-5)' }
      ]
    },
    excepciones: [
      {
        condiciones: { frecuencia: 2, calificacionGlobalImpacto: 2 },
        resultado: 3.99,
        prioridad: 1,
        activa: true
      }
    ],
    rangos: [
      { nivelNombre: 'Crítico', valorMinimo: 15, valorMaximo: 25, incluirMinimo: true, incluirMaximo: true, orden: 1 },
      { nivelNombre: 'Alto', valorMinimo: 10, valorMaximo: 14, incluirMinimo: true, incluirMaximo: true, orden: 2 },
      { nivelNombre: 'Medio', valorMinimo: 4, valorMaximo: 9, incluirMinimo: true, incluirMaximo: true, orden: 3 },
      { nivelNombre: 'Bajo', valorMinimo: 1, valorMaximo: 3, incluirMinimo: true, incluirMaximo: true, orden: 4 }
    ],
    reglaAgregacion: {
      tipoAgregacion: 'maximo',
      tablaOrigen: 'CausaRiesgo',
      campoOrigen: 'calificacionInherente'
    }
  };
}

/**
 * Calcula la calificación inherente para una causa (versión síncrona usando cache)
 */
export function calcularCalificacionInherentePorCausaSync(
  frecuencia: number,
  calificacionGlobalImpacto: number
): { resultado: number; excepcionAplicada: boolean } {
  const config = getConfigCache() || getConfigPorDefecto();
  
  if (!config.formulaBase) {
    // Fallback: lógica hardcodeada
    if (frecuencia === 2 && calificacionGlobalImpacto === 2) {
      return { resultado: 3.99, excepcionAplicada: true };
    }
    return { resultado: frecuencia * calificacionGlobalImpacto, excepcionAplicada: false };
  }

  // 1. Verificar excepciones primero
  for (const excepcion of config.excepciones.filter(e => e.activa).sort((a, b) => a.prioridad - b.prioridad)) {
    const condiciones = excepcion.condiciones;
    let cumpleCondicion = true;
    
    for (const [key, value] of Object.entries(condiciones)) {
      if (key === 'frecuencia' && frecuencia !== value) {
        cumpleCondicion = false;
        break;
      }
      if (key === 'calificacionGlobalImpacto' && calificacionGlobalImpacto !== value) {
        cumpleCondicion = false;
        break;
      }
    }
    
    if (cumpleCondicion) {
      return {
        resultado: excepcion.resultado,
        excepcionAplicada: true
      };
    }
  }

  // 2. Aplicar fórmula base
  let resultado = 0;
  if (config.formulaBase.tipoOperacion === 'multiplicacion') {
    resultado = frecuencia * calificacionGlobalImpacto;
  } else if (config.formulaBase.tipoOperacion === 'suma') {
    resultado = frecuencia + calificacionGlobalImpacto;
  } else if (config.formulaBase.tipoOperacion === 'promedio') {
    resultado = (frecuencia + calificacionGlobalImpacto) / 2;
  }

  return {
    resultado,
    excepcionAplicada: false
  };
}

/**
 * Calcula la calificación inherente para una causa (versión asíncrona)
 */
export async function calcularCalificacionInherentePorCausa(
  frecuencia: number,
  calificacionGlobalImpacto: number
): Promise<{ resultado: number; excepcionAplicada: boolean }> {
  const config = await getConfigActiva();
  
  if (!config.formulaBase) {
    throw new Error('No hay fórmula base configurada');
  }

  // 1. Verificar excepciones primero
  for (const excepcion of config.excepciones.filter(e => e.activa).sort((a, b) => a.prioridad - b.prioridad)) {
    const condiciones = excepcion.condiciones;
    let cumpleCondicion = true;
    
    for (const [key, value] of Object.entries(condiciones)) {
      if (key === 'frecuencia' && frecuencia !== value) {
        cumpleCondicion = false;
        break;
      }
      if (key === 'calificacionGlobalImpacto' && calificacionGlobalImpacto !== value) {
        cumpleCondicion = false;
        break;
      }
    }
    
    if (cumpleCondicion) {
      return {
        resultado: excepcion.resultado,
        excepcionAplicada: true
      };
    }
  }

  // 2. Aplicar fórmula base
  let resultado = 0;
  if (config.formulaBase.tipoOperacion === 'multiplicacion') {
    resultado = frecuencia * calificacionGlobalImpacto;
  } else if (config.formulaBase.tipoOperacion === 'suma') {
    resultado = frecuencia + calificacionGlobalImpacto;
  } else if (config.formulaBase.tipoOperacion === 'promedio') {
    resultado = (frecuencia + calificacionGlobalImpacto) / 2;
  }

  return {
    resultado,
    excepcionAplicada: false
  };
}

/**
 * Determina el nivel de riesgo según el valor calculado (versión síncrona usando cache)
 */
export function determinarNivelRiesgoSync(valor: number): string {
  const config = getConfigCache() || getConfigPorDefecto();
  
  // Ordenar rangos por orden (de menor a mayor, para evaluar primero los rangos más altos)
  // El orden 1 es el más alto (Crítico), orden 4 es el más bajo (Bajo)
  const rangosOrdenados = [...config.rangos]
    .filter(r => r.activo !== false)
    .sort((a, b) => a.orden - b.orden);

  for (const rango of rangosOrdenados) {
    const cumpleMinimo = rango.incluirMinimo 
      ? valor >= rango.valorMinimo 
      : valor > rango.valorMinimo;
    const cumpleMaximo = rango.incluirMaximo 
      ? valor <= rango.valorMaximo 
      : valor < rango.valorMaximo;
    if (cumpleMinimo && cumpleMaximo) return rango.nivelNombre;
  }
  // Si hay valor positivo pero la config (p. ej. API) no tiene rango que lo cubra, usar rangos por defecto
  if (valor > 0 && config !== getConfigPorDefecto()) {
    const defaultRangos = getConfigPorDefecto().rangos
      .filter((r: any) => r.activo !== false)
      .sort((a: any, b: any) => a.orden - b.orden);
    for (const rango of defaultRangos) {
      const cumpleMinimo = rango.incluirMinimo ? valor >= rango.valorMinimo : valor > rango.valorMinimo;
      const cumpleMaximo = rango.incluirMaximo ? valor <= rango.valorMaximo : valor < rango.valorMaximo;
      if (cumpleMinimo && cumpleMaximo) return rango.nivelNombre;
    }
  }
  return 'Sin Calificar';
}

/**
 * Determina el nivel de riesgo según el valor calculado (versión asíncrona)
 */
export async function determinarNivelRiesgo(valor: number): Promise<string> {
  const config = await getConfigActiva();
  
  // Ordenar rangos por orden (de mayor a menor)
  const rangosOrdenados = [...config.rangos]
    .filter(r => r.activo)
    .sort((a, b) => a.orden - b.orden);

  for (const rango of rangosOrdenados) {
    const cumpleMinimo = rango.incluirMinimo 
      ? valor >= rango.valorMinimo 
      : valor > rango.valorMinimo;
    const cumpleMaximo = rango.incluirMaximo 
      ? valor <= rango.valorMaximo 
      : valor < rango.valorMaximo;
    
    if (cumpleMinimo && cumpleMaximo) {
      return rango.nivelNombre;
    }
  }

  return 'Sin Calificar';
}

/**
 * Agrega calificaciones por causa según la regla de la config (versión síncrona con cache).
 * Coherencia con Admin > Calificación Inherente (Máximo, Promedio, Suma, Mínimo).
 */
export function agregarCalificacionInherenteGlobalSync(calificacionesPorCausa: number[]): number {
  const config = getConfigCache() || getConfigPorDefecto();
  const tipo = config.reglaAgregacion?.tipoAgregacion?.toLowerCase();
  if (!calificacionesPorCausa.length) return 0;
  if (tipo === 'promedio') {
    return calificacionesPorCausa.reduce((a, b) => a + b, 0) / calificacionesPorCausa.length;
  }
  if (tipo === 'suma') {
    return calificacionesPorCausa.reduce((a, b) => a + b, 0);
  }
  if (tipo === 'minimo') {
    return Math.min(...calificacionesPorCausa);
  }
  return Math.max(...calificacionesPorCausa);
}

/**
 * Calcula la calificación inherente global de un riesgo (versión async)
 */
export async function calcularCalificacionInherenteGlobal(
  calificacionesPorCausa: number[]
): Promise<number> {
  const config = await getConfigActiva();
  if (!config.reglaAgregacion) return Math.max(...calificacionesPorCausa, 0);
  const tipo = config.reglaAgregacion.tipoAgregacion?.toLowerCase();
  if (!calificacionesPorCausa.length) return 0;
  if (tipo === 'promedio') {
    return calificacionesPorCausa.reduce((a, b) => a + b, 0) / calificacionesPorCausa.length;
  }
  if (tipo === 'suma') return calificacionesPorCausa.reduce((a, b) => a + b, 0);
  if (tipo === 'minimo') return Math.min(...calificacionesPorCausa, 0);
  return Math.max(...calificacionesPorCausa, 0);
}

/**
 * Invalida el cache (llamar después de actualizar configuración)
 */
export function invalidarCache(): void {
  configCache = null;
  cacheTimestamp = 0;
}

