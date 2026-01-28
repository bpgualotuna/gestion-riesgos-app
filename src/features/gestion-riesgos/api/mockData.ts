/**
 * Mock Data for Risk Management System
 * Based on analysis from Excel file
 */

import type {
  Riesgo,
  EvaluacionRiesgo,
  PriorizacionRiesgo,
  EstadisticasRiesgo,
  RiesgoReciente,
  PuntoMapa,
  PaginatedResponse,
} from '../types';
import {
  calcularImpactoGlobal,
  calcularImpactoMaximo,
  calcularRiesgoInherente,
  determinarNivelRiesgo,
} from '../../../utils/calculations';
import { CLASIFICACION_RIESGO, NIVELES_RIESGO, RESPUESTAS_RIESGO } from '../../../utils/constants';

// Mock Riesgos basados en el análisis del Excel
const mockRiesgos: Riesgo[] = [
  {
    id: '1',
    numero: 1,
    descripcion: 'Probabilidad de afectar la continuidad operacional por falta de personal capacitado en procesos críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Operacional',
    tipologiaNivelI: 'Procesos',
    tipologiaNivelII: 'Falta de actualización o cumplimiento de procedimientos',
    causaRiesgo: 'Personas',
    fuenteCausa: 'Selección de candidatos que no cumplen con el perfil requerido',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    numero: 2,
    descripcion: 'Riesgo de incumplimiento normativo en contratación laboral',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Legal',
    tipologiaNivelI: 'Legal/Normativo',
    tipologiaNivelII: 'Cumplimiento regulatorio',
    causaRiesgo: 'Proceso',
    fuenteCausa: 'Falta de actualización de normativas laborales',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-21T11:00:00Z',
  },
  {
    id: '3',
    numero: 3,
    descripcion: 'Oportunidad de mejora en procesos de reclutamiento mediante plataformas digitales',
    clasificacion: CLASIFICACION_RIESGO.POSITIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Tecnológica',
    tipologiaNivelI: 'Tecnológico',
    tipologiaNivelII: 'Innovación tecnológica',
    causaRiesgo: 'Tecnología',
    fuenteCausa: 'Avances en plataformas de reclutamiento',
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: '4',
    numero: 4,
    descripcion: 'Riesgo de pérdida de talento clave por falta de planes de retención',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Estratégica',
    tipologiaNivelI: 'Recurso Humano',
    tipologiaNivelII: 'Retención de talento',
    causaRiesgo: 'Personas',
    fuenteCausa: 'Falta de políticas de retención',
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-23T15:00:00Z',
  },
  {
    id: '5',
    numero: 5,
    descripcion: 'Riesgo de afectación reputacional por manejo inadecuado de conflictos laborales',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Reputacional',
    tipologiaNivelI: 'Reputacional',
    tipologiaNivelII: 'Gestión de conflictos',
    causaRiesgo: 'Proceso',
    fuenteCausa: 'Falta de protocolos de resolución de conflictos',
    createdAt: '2024-01-19T11:00:00Z',
    updatedAt: '2024-01-24T09:00:00Z',
  },
  {
    id: '6',
    numero: 6,
    descripcion: 'Riesgo económico por costos elevados en procesos de contratación',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Económica',
    tipologiaNivelI: 'Económico',
    tipologiaNivelII: 'Gestión de costos',
    causaRiesgo: 'Proceso',
    fuenteCausa: 'Ineficiencia en procesos de selección',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-25T13:00:00Z',
  },
  {
    id: '7',
    numero: 7,
    descripcion: 'Riesgo de afectación a la salud ocupacional por falta de programas de bienestar',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Salud Ocupacional',
    tipologiaNivelI: 'Personas',
    tipologiaNivelII: 'Salud y seguridad',
    causaRiesgo: 'Personas',
    fuenteCausa: 'Ausencia de programas de bienestar',
    createdAt: '2024-01-21T10:00:00Z',
    updatedAt: '2024-01-26T14:00:00Z',
  },
  {
    id: '8',
    numero: 8,
    descripcion: 'Oportunidad de implementar modalidades de trabajo flexibles',
    clasificacion: CLASIFICACION_RIESGO.POSITIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Estratégica',
    tipologiaNivelI: 'Procesos',
    tipologiaNivelII: 'Innovación organizacional',
    causaRiesgo: 'Proceso',
    fuenteCausa: 'Tendencia del mercado hacia trabajo flexible',
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-27T11:00:00Z',
  },
];

// Mock Evaluaciones
const mockEvaluaciones: EvaluacionRiesgo[] = [
  {
    id: 'eval-1',
    riesgoId: '1',
    impactoPersonas: 4,
    impactoLegal: 3,
    impactoAmbiental: 1,
    impactoProcesos: 5,
    impactoReputacion: 3,
    impactoEconomico: 4,
    impactoTecnologico: 2,
    probabilidad: 4,
    impactoGlobal: calcularImpactoGlobal({
      personas: 4,
      legal: 3,
      ambiental: 1,
      procesos: 5,
      reputacion: 3,
      economico: 4,
    }),
    impactoMaximo: calcularImpactoMaximo({
      personas: 4,
      legal: 3,
      ambiental: 1,
      procesos: 5,
      reputacion: 3,
      economico: 4,
      tecnologico: 2,
    }),
    riesgoInherente: calcularRiesgoInherente(5, 4),
    nivelRiesgo: determinarNivelRiesgo(20, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-20T14:30:00Z',
    evaluadoPor: 'Juan Analista',
  },
  {
    id: 'eval-2',
    riesgoId: '2',
    impactoPersonas: 2,
    impactoLegal: 5,
    impactoAmbiental: 1,
    impactoProcesos: 3,
    impactoReputacion: 4,
    impactoEconomico: 3,
    impactoTecnologico: 1,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({
      personas: 2,
      legal: 5,
      ambiental: 1,
      procesos: 3,
      reputacion: 4,
      economico: 3,
    }),
    impactoMaximo: calcularImpactoMaximo({
      personas: 2,
      legal: 5,
      ambiental: 1,
      procesos: 3,
      reputacion: 4,
      economico: 3,
      tecnologico: 1,
    }),
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-21T11:00:00Z',
    evaluadoPor: 'María Gerente',
  },
  {
    id: 'eval-3',
    riesgoId: '3',
    impactoPersonas: 3,
    impactoLegal: 2,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 3,
    impactoEconomico: 4,
    impactoTecnologico: 5,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({
      personas: 3,
      legal: 2,
      ambiental: 1,
      procesos: 4,
      reputacion: 3,
      economico: 4,
    }),
    impactoMaximo: calcularImpactoMaximo({
      personas: 3,
      legal: 2,
      ambiental: 1,
      procesos: 4,
      reputacion: 3,
      economico: 4,
      tecnologico: 5,
    }),
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.POSITIVA),
    fechaEvaluacion: '2024-01-22T10:00:00Z',
    evaluadoPor: 'Juan Analista',
  },
  {
    id: 'eval-4',
    riesgoId: '4',
    impactoPersonas: 5,
    impactoLegal: 2,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 4,
    impactoEconomico: 5,
    impactoTecnologico: 2,
    probabilidad: 4,
    impactoGlobal: calcularImpactoGlobal({
      personas: 5,
      legal: 2,
      ambiental: 1,
      procesos: 4,
      reputacion: 4,
      economico: 5,
    }),
    impactoMaximo: calcularImpactoMaximo({
      personas: 5,
      legal: 2,
      ambiental: 1,
      procesos: 4,
      reputacion: 4,
      economico: 5,
      tecnologico: 2,
    }),
    riesgoInherente: calcularRiesgoInherente(5, 4),
    nivelRiesgo: determinarNivelRiesgo(20, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-23T15:00:00Z',
    evaluadoPor: 'María Gerente',
  },
  {
    id: 'eval-5',
    riesgoId: '5',
    impactoPersonas: 3,
    impactoLegal: 3,
    impactoAmbiental: 1,
    impactoProcesos: 2,
    impactoReputacion: 5,
    impactoEconomico: 3,
    impactoTecnologico: 1,
    probabilidad: 2,
    impactoGlobal: calcularImpactoGlobal({
      personas: 3,
      legal: 3,
      ambiental: 1,
      procesos: 2,
      reputacion: 5,
      economico: 3,
    }),
    impactoMaximo: calcularImpactoMaximo({
      personas: 3,
      legal: 3,
      ambiental: 1,
      procesos: 2,
      reputacion: 5,
      economico: 3,
      tecnologico: 1,
    }),
    riesgoInherente: calcularRiesgoInherente(5, 2),
    nivelRiesgo: determinarNivelRiesgo(10, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-24T09:00:00Z',
    evaluadoPor: 'Juan Analista',
  },
];

// Mock Priorizaciones
const mockPriorizaciones: PriorizacionRiesgo[] = [
  {
    id: 'prior-1',
    riesgoId: '1',
    calificacionFinal: 20,
    respuesta: RESPUESTAS_RIESGO[2], // Reducir
    responsable: 'María Gerente',
    fechaAsignacion: '2024-01-25',
    puntajePriorizacion: 3.5,
  },
  {
    id: 'prior-2',
    riesgoId: '2',
    calificacionFinal: 15,
    respuesta: RESPUESTAS_RIESGO[1], // Evitar
    responsable: 'Carlos Administrador',
    fechaAsignacion: '2024-01-26',
    puntajePriorizacion: 4.2,
  },
  {
    id: 'prior-3',
    riesgoId: '3',
    calificacionFinal: 15,
    respuesta: RESPUESTAS_RIESGO[0], // Aceptar
    responsable: 'Juan Analista',
    fechaAsignacion: '2024-01-27',
    puntajePriorizacion: 2.8,
  },
  {
    id: 'prior-4',
    riesgoId: '4',
    calificacionFinal: 20,
    respuesta: RESPUESTAS_RIESGO[2], // Reducir
    responsable: 'María Gerente',
    fechaAsignacion: '2024-01-28',
    puntajePriorizacion: 4.5,
  },
  {
    id: 'prior-5',
    riesgoId: '5',
    calificacionFinal: 10,
    respuesta: RESPUESTAS_RIESGO[0], // Aceptar
    responsable: 'Juan Analista',
    fechaAsignacion: '2024-01-29',
    puntajePriorizacion: 2.0,
  },
];

// Función para obtener riesgos con paginación y filtros
export function getMockRiesgos(
  filtros?: {
    busqueda?: string;
    clasificacion?: string;
    proceso?: string;
    zona?: string;
    page?: number;
    pageSize?: number;
  }
): PaginatedResponse<Riesgo> {
  let filtered = [...mockRiesgos];

  // Aplicar filtros
  if (filtros?.busqueda) {
    const search = filtros.busqueda.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.descripcion.toLowerCase().includes(search) ||
        r.numero.toString().includes(search)
    );
  }

  if (filtros?.clasificacion && filtros.clasificacion !== 'all') {
    filtered = filtered.filter((r) => r.clasificacion === filtros.clasificacion);
  }

  if (filtros?.proceso) {
    filtered = filtered.filter((r) => r.proceso === filtros.proceso);
  }

  if (filtros?.zona) {
    filtered = filtered.filter((r) => r.zona === filtros.zona);
  }

  // Paginación
  const page = filtros?.page || 1;
  const pageSize = filtros?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  return {
    data: paginated,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

// Función para obtener evaluaciones por riesgo
export function getMockEvaluacionesByRiesgo(riesgoId: string): EvaluacionRiesgo[] {
  return mockEvaluaciones.filter((e) => e.riesgoId === riesgoId);
}

// Función para obtener estadísticas
export function getMockEstadisticas(): EstadisticasRiesgo {
  const evaluados = mockEvaluaciones.length;
  const sinEvaluar = mockRiesgos.length - evaluados;
  
  const niveles = mockEvaluaciones.reduce(
    (acc, evaluacion) => {
      if (evaluacion.nivelRiesgo === NIVELES_RIESGO.CRITICO) acc.criticos++;
      else if (evaluacion.nivelRiesgo === NIVELES_RIESGO.ALTO) acc.altos++;
      else if (evaluacion.nivelRiesgo === NIVELES_RIESGO.MEDIO) acc.medios++;
      else acc.bajos++;
      return acc;
    },
    { criticos: 0, altos: 0, medios: 0, bajos: 0 }
  );

  const positivos = mockRiesgos.filter(
    (r) => r.clasificacion === CLASIFICACION_RIESGO.POSITIVA
  ).length;
  const negativos = mockRiesgos.length - positivos;

  return {
    totalRiesgos: mockRiesgos.length,
    criticos: niveles.criticos,
    altos: niveles.altos,
    medios: niveles.medios,
    bajos: niveles.bajos,
    positivos,
    negativos,
    evaluados,
    sinEvaluar,
  };
}

// Función para obtener riesgos recientes
export function getMockRiesgosRecientes(limit: number = 10): RiesgoReciente[] {
  return mockRiesgos
    .map((riesgo) => {
      const evaluacion = mockEvaluaciones.find((e) => e.riesgoId === riesgo.id);
      return {
        ...riesgo,
        evaluacion,
        fechaUltimaModificacion: riesgo.updatedAt || riesgo.createdAt || '',
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.fechaUltimaModificacion).getTime();
      const dateB = new Date(b.fechaUltimaModificacion).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

// Función para obtener puntos del mapa
export function getMockPuntosMapa(filtros?: {
  clasificacion?: string;
}): PuntoMapa[] {
  return mockEvaluaciones
    .map((evaluacion) => {
      const riesgo = mockRiesgos.find((r) => r.id === evaluacion.riesgoId);
      if (!riesgo) return null;

      if (filtros?.clasificacion && filtros.clasificacion !== 'all') {
        if (riesgo.clasificacion !== filtros.clasificacion) return null;
      }

      return {
        riesgoId: riesgo.id,
        descripcion: riesgo.descripcion,
        probabilidad: evaluacion.probabilidad,
        impacto: evaluacion.impactoMaximo,
        nivelRiesgo: evaluacion.nivelRiesgo,
        clasificacion: riesgo.clasificacion,
      };
    })
    .filter((p): p is PuntoMapa => p !== null);
}

// Función para obtener priorizaciones
export function getMockPriorizaciones(): PriorizacionRiesgo[] {
  return mockPriorizaciones.map((prior) => {
    const riesgo = mockRiesgos.find((r) => r.id === prior.riesgoId);
    const evaluacion = mockEvaluaciones.find((e) => e.riesgoId === prior.riesgoId);
    return {
      ...prior,
      riesgo,
      evaluacion,
    };
  });
}

// Función para crear evaluación mock
export function createMockEvaluacion(data: {
  riesgoId: string;
  impactoPersonas: number;
  impactoLegal: number;
  impactoAmbiental: number;
  impactoProcesos: number;
  impactoReputacion: number;
  impactoEconomico: number;
  impactoTecnologico: number;
  probabilidad: number;
}): EvaluacionRiesgo {
  const riesgo = mockRiesgos.find((r) => r.id === data.riesgoId);
  if (!riesgo) throw new Error('Riesgo no encontrado');

  const impactos = {
    personas: data.impactoPersonas,
    legal: data.impactoLegal,
    ambiental: data.impactoAmbiental,
    procesos: data.impactoProcesos,
    reputacion: data.impactoReputacion,
    economico: data.impactoEconomico,
    tecnologico: data.impactoTecnologico,
  };

  const impactoMaximo = calcularImpactoMaximo(impactos);
  const riesgoInherente = calcularRiesgoInherente(impactoMaximo, data.probabilidad);

  const nuevaEvaluacion: EvaluacionRiesgo = {
    id: `eval-${Date.now()}`,
    riesgoId: data.riesgoId,
    ...data,
    impactoGlobal: calcularImpactoGlobal(impactos),
    impactoMaximo,
    riesgoInherente,
    nivelRiesgo: determinarNivelRiesgo(riesgoInherente, riesgo.clasificacion),
    fechaEvaluacion: new Date().toISOString(),
    evaluadoPor: 'Usuario Actual',
  };

  mockEvaluaciones.push(nuevaEvaluacion);
  return nuevaEvaluacion;
}

// Función para crear priorización mock
export function createMockPriorizacion(data: {
  riesgoId: string;
  respuesta: string;
  responsable?: string;
  puntajePriorizacion?: number;
}): PriorizacionRiesgo {
  const evaluacion = mockEvaluaciones.find((e) => e.riesgoId === data.riesgoId);
  if (!evaluacion) throw new Error('Evaluación no encontrada');

  const nuevaPriorizacion: PriorizacionRiesgo = {
    id: `prior-${Date.now()}`,
    riesgoId: data.riesgoId,
    calificacionFinal: evaluacion.riesgoInherente,
    respuesta: data.respuesta as any,
    responsable: data.responsable,
    fechaAsignacion: new Date().toISOString().split('T')[0],
    puntajePriorizacion: data.puntajePriorizacion,
  };

  mockPriorizaciones.push(nuevaPriorizacion);
  return nuevaPriorizacion;
}

