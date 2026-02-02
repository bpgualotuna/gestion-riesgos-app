/**
 * Datos Mock Completos para el Sistema
 * Todos los datos están quemados en el frontend
 */

// Datos mock para todas las entidades nuevas
export const mockPasosProceso = [
  { id: '1', nombre: 'Ficha del Proceso', ruta: '/ficha', icono: 'Description', orden: 1, visible: true, requerido: true },
  { id: '2', nombre: 'Análisis de Proceso', ruta: '/analisis-proceso', icono: 'AccountTree', orden: 2, visible: true, requerido: false },
  { id: '3', nombre: 'Normatividad', ruta: '/normatividad', icono: 'Description', orden: 3, visible: true, requerido: false },
  { id: '4', nombre: 'Contexto Externo', ruta: '/contexto-externo', icono: 'Public', orden: 4, visible: true, requerido: false },
  { id: '5', nombre: 'Contexto Interno', ruta: '/contexto-interno', icono: 'Business', orden: 5, visible: true, requerido: false },
  { id: '6', nombre: 'DOFA', ruta: '/dofa', icono: 'Analytics', orden: 6, visible: true, requerido: false },
  { id: '7', nombre: 'Benchmarking', ruta: '/benchmarking', icono: 'CompareArrows', orden: 7, visible: true, requerido: false },
  { id: '8', nombre: 'Identificación', ruta: '/identificacion', icono: 'Search', orden: 8, visible: true, requerido: true },
  { id: '9', nombre: 'Evaluación', ruta: '/evaluacion', icono: 'Assessment', orden: 9, visible: true, requerido: true },
  { id: '10', nombre: 'Mapa de Riesgos', ruta: '/mapa', icono: 'Map', orden: 10, visible: true, requerido: true },
  { id: '11', nombre: 'Priorización', ruta: '/priorizacion', icono: 'PriorityHigh', orden: 11, visible: true, requerido: true },
  { id: '12', nombre: 'Plan de Acción', ruta: '/plan-accion', icono: 'Task', orden: 12, visible: true, requerido: true },
];

export const mockEncuestas = [
  {
    id: '1',
    nombre: 'Encuesta de Identificación de Riesgos',
    descripcion: 'Encuesta estándar para identificar riesgos operacionales, financieros y de cumplimiento',
    activa: true,
    procesoId: '1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockPreguntasEncuesta = [
  {
    id: 'pregunta-1',
    encuestaId: '1',
    orden: 1,
    pregunta: 'Diseñar la encuesta a realizar a los colaboradores de la subdivisión para la identificación de riesgos Operacionales, Financieros y de Cumplimiento.',
    tipo: 'texto',
    requerida: false,
    opciones: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pregunta-2',
    encuestaId: '1',
    orden: 2,
    pregunta: 'Tabular los resultados de la encuesta y documentar las principales conclusiones en este espacio.',
    tipo: 'texto',
    requerida: false,
    opciones: [],
    createdAt: new Date().toISOString(),
  },
];

export const mockListasValores = [
  {
    id: '1',
    nombre: 'Vicepresidencias/Gerencias',
    codigo: 'vicepresidencias',
    valores: ['Abastecimiento', 'Gestión de proveedores y adquisiciones', 'Gestión de proyectos e implementación', 'Gestión de Soporte y Post Venta', 'Gestión Financiera y Administrativa', 'Gestión de TIC\'S', 'Seguridad de la información', 'Gestión Talento Humano'],
    descripcion: 'Lista de vicepresidencias y gerencias altas',
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Zonas',
    codigo: 'zonas',
    valores: ['Nacional', 'Sur', 'Oriente', 'Occidente', 'Norte', 'Central'],
    descripcion: 'Lista de zonas geográficas',
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    nombre: 'Procesos',
    codigo: 'procesos',
    valores: ['Talento Humano', 'Planificación Financiera', 'Operaciones'],
    descripcion: 'Lista de procesos del sistema',
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    nombre: 'Macroprocesos',
    codigo: 'macroprocesos',
    valores: [],
    descripcion: 'Lista de macroprocesos',
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    nombre: 'Fuentes',
    codigo: 'fuentes',
    valores: [],
    descripcion: 'Lista de fuentes de riesgo',
    activa: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockParametrosValoracion = [
  {
    id: '1',
    nombre: 'Aplicabilidad',
    peso: 0.25,
    valores: [
      { nombre: 'Automático', peso: 1 },
      { nombre: 'Semiautomático', peso: 0.3 },
      { nombre: 'Manual', peso: 0 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Cobertura',
    peso: 0.25,
    valores: [
      { nombre: 'Automático', peso: 1 },
      { nombre: 'Semiautomático', peso: 0.7 },
      { nombre: 'Manual', peso: 0.1 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    nombre: 'Facilidad de uso',
    peso: 0.1,
    valores: [
      { nombre: 'Automático', peso: 1 },
      { nombre: 'Semiautomático', peso: 0.7 },
      { nombre: 'Manual', peso: 0.3 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    nombre: 'Segregación',
    peso: 0.2,
    valores: [
      { nombre: 'Automático', peso: 1 },
      { nombre: 'Semiautomático', peso: 0 },
      { nombre: 'Manual', peso: 1 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    nombre: 'Naturaleza',
    peso: 0.2,
    valores: [
      { nombre: 'Automático', peso: 0.8 },
      { nombre: 'Semiautomático', peso: 0.6 },
      { nombre: 'Manual', peso: 0.4 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    nombre: 'Desviaciones',
    peso: 0.8,
    valores: [
      { nombre: 'Sin desviaciones', peso: 1 },
      { nombre: 'Con desviaciones', peso: 0.5 },
      { nombre: 'Falla frecuente', peso: 0 },
    ],
    activo: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockTipologias = [
  {
    id: '1',
    nombre: 'Tipologías Nivel I',
    nivel: 'I',
    categorias: [
      { id: 'cat-1-1', codigo: 'Estratégico', descripcion: 'Son los riesgos de fallar en la implementación del plan estratégico' },
      { id: 'cat-1-2', codigo: 'Operacional', descripcion: 'Son aquellos riesgos relacionados con fallas en procesos, personas y/o tecnología' },
      { id: 'cat-1-3', codigo: 'Cumplimiento', descripcion: 'Son los riesgos que surgen por fallas en el cumplimiento de regulaciones relevantes' },
      { id: 'cat-1-4', codigo: 'Financiero', descripcion: 'Son los riesgos relacionados con efectos económicos o pérdidas financieras' },
    ],
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    nombre: 'Tipologías Nivel II',
    nivel: 'II',
    categorias: [],
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    nombre: 'Tipologías III-IV SO y Ambiental',
    nivel: 'III-IV',
    categorias: [],
    activa: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    nombre: 'Tipologías III Seg. Información',
    nivel: 'III',
    categorias: [],
    activa: true,
    createdAt: new Date().toISOString(),
  },
];

export const mockFormulas = [
  {
    id: 'formula-1',
    nombre: 'Riesgo Inherente',
    descripcion: 'Cálculo del riesgo inherente',
    formula: 'IF(AND(impacto=2,probabilidad=2),3.99,impacto*probabilidad)',
    categoria: 'riesgo',
    activa: true,
    variables: ['impacto', 'probabilidad'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'formula-2',
    nombre: 'Impacto Global',
    descripcion: 'Cálculo del impacto global ponderado',
    formula: 'ROUNDUP((personas*0.14+legal*0.22+ambiental*0.22+procesos*0.10+reputacion*0.10+economico*0.22),0)',
    categoria: 'impacto',
    activa: true,
    variables: ['personas', 'legal', 'ambiental', 'procesos', 'reputacion', 'economico'],
    createdAt: new Date().toISOString(),
  },
];

export const mockConfiguraciones = [
  {
    id: '1',
    clave: 'validar_campos_requeridos',
    valor: 'true',
    tipo: 'boolean',
    descripcion: 'Validar campos requeridos antes de guardar',
  },
  {
    id: '2',
    clave: 'editar_procesos_aprobados',
    valor: 'false',
    tipo: 'boolean',
    descripcion: 'Permitir edición de procesos aprobados',
  },
  {
    id: '3',
    clave: 'limite_riesgos_proceso',
    valor: '100',
    tipo: 'number',
    descripcion: 'Límite máximo de riesgos por proceso',
  },
  {
    id: '4',
    clave: 'dias_recordatorio_tareas',
    valor: '7',
    tipo: 'number',
    descripcion: 'Días para recordatorio de tareas pendientes',
  },
  {
    id: '5',
    clave: 'formato_fecha',
    valor: 'DD/MM/YYYY',
    tipo: 'string',
    descripcion: 'Formato de fecha por defecto',
  },
  {
    id: '6',
    clave: 'zona_horaria',
    valor: 'America/Bogota',
    tipo: 'string',
    descripcion: 'Zona horaria',
  },
];

export const mockObservaciones: any[] = [];
export const mockHistorial: any[] = [];
export const mockTareas: any[] = [];
export const mockNotificaciones: any[] = [];

// Funciones helper para gestionar datos mock
export function getMockPasosProceso() {
  return mockPasosProceso;
}

export function createMockPasoProceso(data: any) {
  const nuevo = {
    id: `paso-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockPasosProceso.push(nuevo);
  return nuevo;
}

export function updateMockPasoProceso(id: string, data: any) {
  const index = mockPasosProceso.findIndex(p => p.id === id);
  if (index === -1) return null;
  mockPasosProceso[index] = { ...mockPasosProceso[index], ...data, updatedAt: new Date().toISOString() };
  return mockPasosProceso[index];
}

export function deleteMockPasoProceso(id: string) {
  const index = mockPasosProceso.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPasosProceso.splice(index, 1);
  }
}

export function getMockEncuestas() {
  return mockEncuestas;
}

export function getMockEncuestaById(id: string) {
  return mockEncuestas.find(e => e.id === id);
}

export function createMockEncuesta(data: any) {
  const nueva = {
    id: `encuesta-${Date.now()}`,
    ...data,
    activa: data.activa !== undefined ? data.activa : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockEncuestas.push(nueva);
  return nueva;
}

export function updateMockEncuesta(id: string, data: any) {
  const index = mockEncuestas.findIndex(e => e.id === id);
  if (index === -1) return null;
  mockEncuestas[index] = { ...mockEncuestas[index], ...data, updatedAt: new Date().toISOString() };
  return mockEncuestas[index];
}

export function deleteMockEncuesta(id: string) {
  const index = mockEncuestas.findIndex(e => e.id === id);
  if (index !== -1) {
    mockEncuestas.splice(index, 1);
  }
}

export function getMockPreguntasEncuesta(encuestaId: string) {
  return mockPreguntasEncuesta.filter(p => p.encuestaId === encuestaId);
}

export function createMockPreguntaEncuesta(data: any) {
  const nueva = {
    id: `pregunta-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  mockPreguntasEncuesta.push(nueva);
  return nueva;
}

export function updateMockPreguntaEncuesta(id: string, data: any) {
  const index = mockPreguntasEncuesta.findIndex(p => p.id === id);
  if (index === -1) return null;
  mockPreguntasEncuesta[index] = { ...mockPreguntasEncuesta[index], ...data };
  return mockPreguntasEncuesta[index];
}

export function deleteMockPreguntaEncuesta(id: string) {
  const index = mockPreguntasEncuesta.findIndex(p => p.id === id);
  if (index !== -1) {
    mockPreguntasEncuesta.splice(index, 1);
  }
}

export function getMockListasValores() {
  return mockListasValores;
}

export function getMockListaValoresById(id: string) {
  return mockListasValores.find(l => l.id === id);
}

export function updateMockListaValores(id: string, data: any) {
  const index = mockListasValores.findIndex(l => l.id === id);
  if (index === -1) return null;
  mockListasValores[index] = { ...mockListasValores[index], ...data, updatedAt: new Date().toISOString() };
  return mockListasValores[index];
}

export function getMockParametrosValoracion() {
  return mockParametrosValoracion;
}

export function getMockParametroValoracionById(id: string) {
  return mockParametrosValoracion.find(p => p.id === id);
}

export function updateMockParametroValoracion(id: string, data: any) {
  const index = mockParametrosValoracion.findIndex(p => p.id === id);
  if (index === -1) return null;
  mockParametrosValoracion[index] = { ...mockParametrosValoracion[index], ...data, updatedAt: new Date().toISOString() };
  return mockParametrosValoracion[index];
}

export function getMockTipologias() {
  return mockTipologias;
}

export function getMockTipologiaById(id: string) {
  return mockTipologias.find(t => t.id === id);
}

export function createMockTipologia(data: any) {
  const nueva = {
    id: `tipologia-${Date.now()}`,
    ...data,
    activa: data.activa !== undefined ? data.activa : true,
    createdAt: new Date().toISOString(),
  };
  mockTipologias.push(nueva);
  return nueva;
}

export function updateMockTipologia(id: string, data: any) {
  const index = mockTipologias.findIndex(t => t.id === id);
  if (index === -1) return null;
  mockTipologias[index] = { ...mockTipologias[index], ...data, updatedAt: new Date().toISOString() };
  return mockTipologias[index];
}

export function deleteMockTipologia(id: string) {
  const index = mockTipologias.findIndex(t => t.id === id);
  if (index !== -1) {
    mockTipologias.splice(index, 1);
  }
}

export function getMockFormulas() {
  return mockFormulas;
}

export function getMockFormulaById(id: string) {
  return mockFormulas.find(f => f.id === id);
}

export function createMockFormula(data: any) {
  const nueva = {
    id: `formula-${Date.now()}`,
    ...data,
    activa: data.activa !== undefined ? data.activa : true,
    createdAt: new Date().toISOString(),
  };
  mockFormulas.push(nueva);
  return nueva;
}

export function updateMockFormula(id: string, data: any) {
  const index = mockFormulas.findIndex(f => f.id === id);
  if (index === -1) return null;
  mockFormulas[index] = { ...mockFormulas[index], ...data, updatedAt: new Date().toISOString() };
  return mockFormulas[index];
}

export function deleteMockFormula(id: string) {
  const index = mockFormulas.findIndex(f => f.id === id);
  if (index !== -1) {
    mockFormulas.splice(index, 1);
  }
}

export function getMockConfiguraciones() {
  return mockConfiguraciones;
}

export function updateMockConfiguracion(id: string, data: any) {
  const index = mockConfiguraciones.findIndex(c => c.id === id);
  if (index === -1) return null;
  mockConfiguraciones[index] = { ...mockConfiguraciones[index], ...data };
  return mockConfiguraciones[index];
}

export function getMockObservaciones(procesoId: string) {
  return mockObservaciones.filter(o => o.procesoId === procesoId);
}

export function createMockObservacion(data: any) {
  const nueva = {
    id: `obs-${Date.now()}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  mockObservaciones.push(nueva);
  return nueva;
}

export function updateMockObservacion(id: string, data: any) {
  const index = mockObservaciones.findIndex(o => o.id === id);
  if (index === -1) return null;
  mockObservaciones[index] = { ...mockObservaciones[index], ...data, updatedAt: new Date().toISOString() };
  return mockObservaciones[index];
}

export function getMockHistorial(procesoId: string) {
  return mockHistorial.filter(h => h.procesoId === procesoId);
}

export function createMockHistorial(data: any) {
  const nuevo = {
    id: `hist-${Date.now()}`,
    ...data,
    fecha: data.fecha || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  mockHistorial.push(nuevo);
  return nuevo;
}

export function getMockTareas() {
  return mockTareas;
}

export function createMockTarea(data: any) {
  const nueva = {
    id: `tarea-${Date.now()}`,
    ...data,
    estado: data.estado || 'pendiente',
    completada: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockTareas.push(nueva);
  return nueva;
}

export function updateMockTarea(id: string, data: any) {
  const index = mockTareas.findIndex(t => t.id === id);
  if (index === -1) return null;
  mockTareas[index] = { ...mockTareas[index], ...data, updatedAt: new Date().toISOString() };
  return mockTareas[index];
}

export function getMockNotificaciones() {
  return mockNotificaciones;
}

export function createMockNotificacion(data: any) {
  const nueva = {
    id: `notif-${Date.now()}`,
    ...data,
    leida: false,
    createdAt: new Date().toISOString(),
  };
  mockNotificaciones.push(nueva);
  return nueva;
}

export function updateMockNotificacion(id: string, data: any) {
  const index = mockNotificaciones.findIndex(n => n.id === id);
  if (index === -1) return null;
  mockNotificaciones[index] = { ...mockNotificaciones[index], ...data };
  return mockNotificaciones[index];
}

