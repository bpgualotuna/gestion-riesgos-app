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
  Proceso,
  CreateProcesoDto,
  EstadoProceso,
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
    procesoId: '1', // Talento Humano
    numero: 1,
    descripcion: 'Probabilidad de afectar la continuidad operacional por falta de personal capacitado en procesos críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Operacional',
    tipologiaNivelI: 'Procesos',
    tipologiaNivelII: 'Falta de actualización o cumplimiento de procedimientos',
    causaRiesgo: 'Personas',
    fuenteCausa: 'Selección de candidatos que no cumplen con el perfil requerido',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    procesoId: '1', // Talento Humano
    numero: 2,
    descripcion: 'Riesgo de incumplimiento normativo en contratación laboral',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Legal',
    tipologiaNivelI: 'Legal/Normativo',
    tipologiaNivelII: 'Cumplimiento regulatorio',
    causaRiesgo: 'Proceso',
    fuenteCausa: 'Falta de actualización de normativas laborales',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-21T11:00:00Z',
  },
  {
    id: '3',
    procesoId: '1', // Talento Humano
    numero: 3,
    descripcion: 'Oportunidad de mejora en procesos de reclutamiento mediante plataformas digitales',
    clasificacion: CLASIFICACION_RIESGO.POSITIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Tecnológica',
    tipologiaNivelI: 'Tecnológico',
    tipologiaNivelII: 'Innovación tecnológica',
    causaRiesgo: 'Tecnología',
    fuenteCausa: 'Avances en plataformas de reclutamiento',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-17T08:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: '4',
    procesoId: '1', // Talento Humano
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
    procesoId: '1', // Talento Humano
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
    procesoId: '1', // Talento Humano
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
    procesoId: '1', // Talento Humano
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
    procesoId: '1', // Talento Humano
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
    procesoId?: string; // Filtrar por ID de proceso
    busqueda?: string;
    clasificacion?: string;
    proceso?: string;
    zona?: string;
    page?: number;
    pageSize?: number;
  }
): PaginatedResponse<Riesgo> {
  let filtered = [...mockRiesgos];

  // Filtrar por procesoId primero (prioridad)
  if (filtros?.procesoId) {
    filtered = filtered.filter((r) => r.procesoId === filtros.procesoId);
  }

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
export function getMockEstadisticas(procesoId?: string): EstadisticasRiesgo {
  let riesgosFiltrados = mockRiesgos;
  if (procesoId) {
    riesgosFiltrados = mockRiesgos.filter((r) => r.procesoId === procesoId);
  }

  const evaluados = mockEvaluaciones.filter((e) => {
    const riesgo = riesgosFiltrados.find((r) => r.id === e.riesgoId);
    return riesgo !== undefined;
  }).length;
  const sinEvaluar = riesgosFiltrados.length - evaluados;
  
  const evaluacionesFiltradas = mockEvaluaciones.filter((e) => {
    const riesgo = riesgosFiltrados.find((r) => r.id === e.riesgoId);
    return riesgo !== undefined;
  });

  const niveles = evaluacionesFiltradas.reduce(
    (acc, evaluacion) => {
      if (evaluacion.nivelRiesgo === NIVELES_RIESGO.CRITICO) acc.criticos++;
      else if (evaluacion.nivelRiesgo === NIVELES_RIESGO.ALTO) acc.altos++;
      else if (evaluacion.nivelRiesgo === NIVELES_RIESGO.MEDIO) acc.medios++;
      else acc.bajos++;
      return acc;
    },
    { criticos: 0, altos: 0, medios: 0, bajos: 0 }
  );

  const positivos = riesgosFiltrados.filter(
    (r) => r.clasificacion === CLASIFICACION_RIESGO.POSITIVA
  ).length;
  const negativos = riesgosFiltrados.length - positivos;

  return {
    totalRiesgos: riesgosFiltrados.length,
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
        numero: riesgo.numero || 0,
        siglaGerencia: riesgo.siglaGerencia,
      };
    })
    .filter((p): p is PuntoMapa => p !== null && p.numero !== undefined);
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
    ...data,
    riesgoId: data.riesgoId,
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

// ============================================
// MOCK PROCESOS
// ============================================

const mockProcesos: Proceso[] = [
  {
    id: '1',
    nombre: 'Talento Humano',
    descripcion: 'Gestión de recursos humanos y talento humano',
    vicepresidencia: 'Vicepresidencia de Talento Humano',
    gerencia: 'Gerencia de Talento Humano',
    responsable: 'Katherine Chávez',
    responsableId: '1',
    responsableNombre: 'Katherine Chávez',
    areaId: '2',
    areaNombre: 'Talento Humano',
    directorId: '5', // Asignado al director de procesos
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar eficientemente el capital humano de la organización',
    tipoProceso: 'Talento Humano',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Planificación Financiera',
    descripcion: 'Gestión de planificación y presupuesto financiero',
    vicepresidencia: 'Vicepresidencia Financiera',
    gerencia: 'Gerencia de Planificación Financiera',
    responsable: 'María González',
    responsableId: '2',
    responsableNombre: 'María González',
    areaId: '1',
    areaNombre: 'Gestión Financiera y Administrativa',
    directorId: '5', // Asignado al director de procesos
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Planificar y gestionar los recursos financieros de la organización',
    tipoProceso: 'Planificación Financiera',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    nombre: 'Operaciones',
    descripcion: 'Gestión de operaciones y procesos operativos',
    vicepresidencia: 'Vicepresidencia Operativa',
    gerencia: 'Gerencia de Operaciones',
    responsable: 'Juan Pérez',
    responsableId: '3',
    responsableNombre: 'Juan Pérez',
    areaId: '3',
    areaNombre: 'Operaciones',
    directorId: '5', // Asignado al director de procesos
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar eficientemente las operaciones de la organización',
    tipoProceso: 'Otro',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

export function getMockProcesos(): Proceso[] {
  return mockProcesos.filter((p) => p.activo);
}

export function getMockProcesoById(id: string): Proceso | undefined {
  return mockProcesos.find((p) => p.id === id && p.activo);
}

export function createMockProceso(data: CreateProcesoDto): Proceso {
  const nuevoProceso: Proceso = {
    id: `proceso-${Date.now()}`,
    ...data,
    activo: true,
    estado: 'borrador', // Estado inicial por defecto
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockProcesos.push(nuevoProceso);
  return nuevoProceso;
}

export function updateMockProceso(id: string, data: Partial<CreateProcesoDto & { estado?: EstadoProceso; gerenteId?: string; gerenteNombre?: string; fechaEnviadoRevision?: string; fechaAprobado?: string }>): Proceso {
  const index = mockProcesos.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error('Proceso no encontrado');
  }
  mockProcesos[index] = {
    ...mockProcesos[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  return mockProcesos[index];
}

export function deleteMockProceso(id: string): void {
  const index = mockProcesos.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockProcesos[index].activo = false;
    mockProcesos[index].updatedAt = new Date().toISOString();
  }
}

