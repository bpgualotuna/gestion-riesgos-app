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

// ============================================
// DATOS DE CONFIGURACIÓN PARA IDENTIFICACIÓN Y CALIFICACIÓN
// ============================================

// Tipos y Subtipos de Riesgos
export interface SubtipoRiesgo {
  codigo: string;
  descripcion: string;
}

export interface TipoRiesgo {
  codigo: string;
  nombre: string;
  descripcion: string;
  subtipos: SubtipoRiesgo[];
}

// Datos iniciales desde IdentificacionPage.tsx
let mockTiposRiesgos: TipoRiesgo[] = [
  {
    codigo: '01 Estratégico',
    nombre: 'Estratégico',
    descripcion: 'Son los riesgos de fallar en la implementación del plan estratégico',
    subtipos: [
      { codigo: 'alianzas', descripcion: 'Alianzas comerciales ineficientes y/o inefectivas y/o no rentables.' },
      { codigo: 'alineación estratégico', descripcion: 'Inexistencia, desconocimiento y/o falta de alineación entre la misión, visión, estrategias y los objetivos de negocio y proyectos de alto impacto de las unidades de negocio.' },
      { codigo: 'canales de distribución', descripcion: 'Fallas en los canales de distribución que afectan la capacidad de la compañía de llegar a los clientes.' },
      { codigo: 'capacidad industrial', descripcion: 'Riesgos de obsolescencia tecnológica y/o ineficiente uso de activos críticos.' },
      { codigo: 'competencia', descripcion: 'Acciones de competidores o nuevos jugadores en el mercado.' },
      { codigo: 'continuidad de negocio', descripcion: 'Eventos mayores (natural u ocasionado por el hombre) que afecten o inhabiliten la operación de la compañía.' },
      { codigo: 'cultura organizacional', descripcion: 'Fallas en la alineación de los funcionarios con la misión, visión y objetivos estrátegicos de la compañía, fallas en la transmisión de conocimiento, y aceptación de cambios en la compañía.' },
      { codigo: 'emergentes', descripcion: 'Un riesgo emergente es un evento cuya naturaleza y consecuencias no se conocen completamente y que podrían llegar a tener un gran impacto en la compañía. Estos usualmente suceden a gran escala y surgen de tendencias globales.' },
      { codigo: 'grupo', descripcion: 'Potenciales pérdidas producto de transacciones con empresas del mismo grupo realizadas en condiciones distintas a las dominantes en el mercado, efectos negativos en la compañía producto de problemas reputacionales y/o económicos en otra empresa del grupo, concentración de operaciones con otra empresa del mismo grupo.' },
      { codigo: 'mercado', descripcion: 'Cambios en las condiciones macroeconómicas y/o sectoriales relevantes para el negocio. Fluctuaciones en precios y/o indisponibilidad de inventario para comercializar' },
      { codigo: 'político', descripcion: 'Es el riesgo que emerge debido a la exposición de la compañía a situaciones políticas nacionales y/o internacionales adversas, tensiones geopolíticas, o guerra.' },
      { codigo: 'proyecto estratégico', descripcion: 'Riesgo de fallas en los estándares de gerencia de proyectos, incluidas las actividades de gobierno, actividades de monitoreo y control, manejo de presupuesto. Inhabilidad de mantener el alcance del proyecto y cronograma, así como fallar en la entrega exitosa del proyecto y la asociada gestión del cambio. Esta tipología se debe seleccionar cuando se trata de un proyecto de gran envergadura que afecta directamente el plan estratégico de la compañía.' },
      { codigo: 'rentabilidad', descripcion: 'Posibilidad de no cumplir con la maximización del ROE presupuestado.' },
      { codigo: 'satisfacción del cliente', descripcion: 'Fallo en la identificación de preferencias/necesidades de los clientes para la atracción de nuevos clientes y mantenimiento de la lealtad de los existentes, y/o en la ejecución de las estrategias de entrega de soluciones integrales a los clientes.' },
      { codigo: 'talento humano', descripcion: 'Riesgo asociado con la falta y/o pérdida de funcionarios clave en la compañía, y/o en la atracción, desarrollo y retención de funcionarios competentes.' },
    ],
  },
  {
    codigo: '02 Operacional',
    nombre: 'Operacional',
    descripcion: 'Son aquellos riesgos relacionados con fallas en procesos, personas y/o tecnología',
    subtipos: [
      { codigo: 'ambiental', descripcion: 'Riesgos asociados a los daños ocasionados al medio ambiente a causa de la operación de la compañía.' },
      { codigo: 'físico', descripcion: 'Riesgo de pérdida y/o daño en los activos físicos de la compañía (edificios, espacios de trabajo, almacenamiento y transporte).' },
      { codigo: 'fraude externo', descripcion: 'Es el riesgo de que una persona natural y/o jurídica, actuando individualmente o en concierto con otros, deshonestamente o engañosamente gane o ayude a otros a ganar alguna ventaja injusta o ilegal sobre la compañía y/o sus partes interesadas (clientes, empleados, accionistas).' },
      { codigo: 'fraude interno', descripcion: 'Es el riesgo que una persona dentro de la compañía y/o del grupo corporativo, actuando individualmente o en concierto con otros, deshonestamente o engañosamente gane o ayude a otros a ganar alguna ventaja injusta o ilegal sobre la compañía y/o sus partes interesadas (clientes, empleados, accionistas).' },
      { codigo: 'información', descripcion: 'Brechas en la confidencialidad, integridad y/o disponibilidad de la información confidencial de la compañía. Que resulte en pérdidas de información, uso de la información para fines criminales, o que la información sea usada de tal manera que cause daño reputacional y/o pérdidas financieras.' },
      { codigo: 'Proceso', descripcion: 'Son los riesgos relacionados con la inexistencia, fallas y/o ineficiencias en la ejecución de los procesos de la compañía.' },
      { codigo: 'proyecto', descripcion: 'Riesgo de fallas en los estándares de gerencia de proyectos, incluidas las actividades de gobierno, actividades de monitoreo y control, manejo de presupuesto. Inhabilidad de mantener el alcance del proyecto y cronograma, así como fallar en la entrega exitosa del proyecto y la asociada gestión del cambio.' },
      { codigo: 'seguridad en la cadena de suministro', descripcion: 'Son los riesgos asociados con el daño, pérdida y/o contaminación del producto, a nivel nacional e internacional. Por cadena de suministro se entiende, todas las actividades necesarias para la preparación y distribución de un producto para su venta.' },
      { codigo: 'sistemas', descripcion: 'Es el riesgo de fallas, u otra deficiencia en las plataformas automáticas que soportan la operación diaria de la compañía (aplicaciones), y en los sistemas de infraestructura en las que ellas residen (date centers, redes, computadores, etc.)' },
      { codigo: 'social', descripcion: 'Potencial pérdida producto del daño en la calidad de vida de la comunidad aledaña a las operaciones.' },
    ],
  },
  {
    codigo: '03 Financiero',
    nombre: 'Financiero',
    descripcion: 'Riesgos relacionados con aspectos financieros',
    subtipos: [
      { codigo: 'contable', descripcion: 'Es el riesgo de que información financiera sea capturada incorrectamente, mal calculada, omitida o mal reportada a usuarios externos como inversionistas o entes reguladores, o como información de gestión interna.' },
      { codigo: 'crédito', descripcion: 'Posibilidad de que la compañía incurra en pérdidas y/o se disminuya el valor de sus activos, como consecuencia de que un deudor o contraparte incumpla sus obligaciones.' },
      { codigo: 'impuestos', descripcion: 'Es el riesgo de incremento en las obligaciones tributarias de la compañía, y/o insuficiencias relacionadas con los procesos de impuestos que generen un impacto adverso en las relaciones y/o reputación de la compañía con sus contrapartes.' },
      { codigo: 'liquidez', descripcion: 'Se define como la contingencia de no poder cumplir plenamente, de manera oportuna y eficiente los flujos de caja esperados, vigentes y futuros, sin afectar el curso de las operaciones diarias o la condición financiera de la compañía.' },
      { codigo: 'riesgo de mercado', descripcion: 'Posibilidad de que la compañía incurra en pérdidas asociadas a la variación de los precios de mercado de materias primas, productos, inversiones, variación en tasas de interés que afecte sus pasivos y demás factores de mercado.' },
    ],
  },
  {
    codigo: '04 Cumplimiento',
    nombre: 'Cumplimiento',
    descripcion: 'Riesgos relacionados con el cumplimiento normativo y legal',
    subtipos: [
      { codigo: 'gobierno corporativo y ética', descripcion: 'Incumplimiento de los principios y normas que regulan el funcionamiento de Gobierno de la Compañía.' },
      { codigo: 'Legal', descripcion: 'Es el riesgo de que funcionarios de la empresa influencien o sean influenciados por medio del pago de dadivas, regalos y/o favores, ya sea de forma directa o indirecta, con el fin de obtener y/o propiciar un negocio u otra ventaja por parte de un tercero, ya sea público o privado.' },
      { codigo: 'legal', descripcion: 'Es el riesgo de pérdida financiera, sanciones y/o daño reputacional resultado de que los derechos y/u obligaciones de la compañía en una relación contractual sean defectuosos; que la compañía se encuentre envuelta o tenga potenciales o actuales disputas.' },
      { codigo: 'protección de datos personales', descripcion: '' },
      { codigo: 'regulatorio', descripcion: 'Es el riesgo de que la compañía falle en adherirse a las leyes operables en el país o en las jurisdicciones donde tenga relación en el transcurso de sus operaciones.' },
    ],
  },
  {
    codigo: '05 Seguridad de la Información',
    nombre: 'Seguridad de la Información',
    descripcion: 'Riesgos relacionados con la seguridad de la información',
    subtipos: [
      { codigo: 'Información', descripcion: 'Corresponden a este tipo datos e información almacenada o procesada física o electrónicamente tales como: bases y archivos de datos, contratos, documentación del sistema, investigaciones, acuerdos de confidencialidad, manuales de usuario, procedimientos operativos o de soporte, planes para la continuidad del negocio, acuerdos sobre retiro y pruebas de auditoría, entre otros.' },
      { codigo: 'información', descripcion: 'Corresponden a este tipo datos e información almacenada o procesada física o electrónicamente tales como: bases y archivos de datos, contratos, documentación del sistema, investigaciones, acuerdos de confidencialidad, manuales de usuario, procedimientos operativos o de soporte, planes para la continuidad del negocio, acuerdos sobre retiro y pruebas de auditoría, entre otros.' },
      { codigo: 'servicio', descripcion: 'Servicios de computación y comunicaciones, tales como Internet, páginas de consulta, directorios compartidos e Intranet.' },
      { codigo: 'software', descripcion: 'Software de aplicación, interfaces, software del sistema, herramientas de desarrollo y otras utilidades relacionadas.' },
    ],
  },
  {
    codigo: '06 Seguridad y Salud en el Trabajo',
    nombre: 'Seguridad y Salud en el Trabajo',
    descripcion: 'Riesgos relacionados con la seguridad y salud en el trabajo',
    subtipos: [
      { codigo: 'caminatas', descripcion: 'Desplazamientos Por Largas Jornadas A Pie..' },
      { codigo: 'diseño', descripcion: 'Diseño Inadecuado Del Puesto De Trabajo' },
      { codigo: 'distribución del puesto', descripcion: 'Distribución/Organización Inadecuada Del Puesto De Trabajo' },
      { codigo: 'hábitos posturales', descripcion: 'Hábitos Posturales Inadecuados Durante…' },
      { codigo: 'manipulación de cargas', descripcion: 'Manipulación De Cargas Manual Por Encima De 12.5(Mujeres) 25 Kg (Hombres) durante..' },
      { codigo: 'movimientos repetitivos', descripcion: 'Movimientos Repetitivos Al…' },
      { codigo: 'otros', descripcion: 'Indique la situación' },
      { codigo: 'postura de pie', descripcion: 'Posturas Prolongadas O Sostenidas De Pie durante..' },
      { codigo: 'postura sentado', descripcion: 'Posturas Prolongadas O Sostenidas  Sentado durante..' },
      { codigo: 'posturas forzadas', descripcion: 'Posturas forzadas o sostenidas o posturas incómodas debido a:' },
    ],
  },
];

// Objetivos
export interface Objetivo {
  id: number;
  codigo: string;
  descripcion: string;
}

let mockObjetivos: Objetivo[] = [
  { id: 1, codigo: '01', descripcion: 'Maximizar la rentabilidad sobre la inversión' },
  { id: 2, codigo: '02', descripcion: 'Ofrecer soluciones de vanguardia para los clientes' },
  { id: 3, codigo: '03', descripcion: 'Lograr que los clientes recomienden los productos y servicios de Comware' },
  { id: 4, codigo: '04', descripcion: 'Enfocarse en clientes objetivo así como en proyectos estratégicos' },
  { id: 5, codigo: '05', descripcion: 'Maximizar el retorno de los recursos invertidos en el proceso comercial y preventa' },
  { id: 6, codigo: '06', descripcion: 'Gestionar la liquidez necesaria para la operación' },
  { id: 7, codigo: '07', descripcion: 'Gestionar los riesgos y establecer normas de control interno' },
  { id: 8, codigo: '08', descripcion: 'Generar EEFF auditados en cumplimiento con las normas aplicables' },
  { id: 9, codigo: '09', descripcion: 'Cumplir las expectativas de alcance, tiempo y recursos de los proyectos' },
  { id: 10, codigo: '10', descripcion: 'Cumplir con los niveles de servicio acordados con el cliente' },
  { id: 11, codigo: '11', descripcion: 'Cumplir con las expectativas sobre colocación de órdenes de compra y entrega de equipos' },
  { id: 12, codigo: '12', descripcion: 'Garantizar la disponibilidad de los recursos de TI para la operación de los procesos de Comware' },
  { id: 13, codigo: '13', descripcion: 'Aplicar estándares de seguridad de la información' },
  { id: 14, codigo: '14', descripcion: 'Reducir los incidentes de Seguridad de la Información' },
  { id: 15, codigo: '15', descripcion: 'Gestionar el desempeño del Personal' },
];

// Frecuencias
export interface Frecuencia {
  id: number;
  label: string;
  descripcion: string;
}

let mockFrecuencias: Frecuencia[] = [
  { id: 1, label: 'Raro', descripcion: 'mayor a anual' },
  { id: 2, label: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
  { id: 3, label: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
  { id: 4, label: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
  { id: 5, label: 'Esperado', descripcion: 'diaria o varias veces al día' },
];

// Fuentes
export interface Fuente {
  id: number;
  nombre: string;
}

let mockFuentes: Fuente[] = [
  { id: 1, nombre: 'Personas' },
  { id: 2, nombre: 'Proceso' },
  { id: 3, nombre: 'Legal' },
  { id: 4, nombre: 'Infraestructura' },
  { id: 5, nombre: 'Externos' },
];

// Impactos
export interface ImpactoDescripcion {
  categoria: string;
  nivel: number;
  descripcion: string;
}

let mockImpactos: ImpactoDescripcion[] = [
  // Económico
  { categoria: 'economico', nivel: 1, descripcion: 'Variación (+ ó -) en los recursos financieros de hasta $2K USD' },
  { categoria: 'economico', nivel: 2, descripcion: 'Variación (+ ó -) en los recursos financieros de hasta $14,5K USD' },
  { categoria: 'economico', nivel: 3, descripcion: 'Variación (+ ó -) en los recursos financieros de de hasta $33,8K USD' },
  { categoria: 'economico', nivel: 4, descripcion: 'Variación (+ ó -) en los recursos financieros de hasta $85,9K USD' },
  { categoria: 'economico', nivel: 5, descripcion: 'Variación (+ ó -) en los recursos financieros superior a $85,9K USD' },
  // Procesos
  { categoria: 'procesos', nivel: 1, descripcion: 'Mínima afectación en el tiempo, calidad y/o eficiencia del servicio/producto' },
  { categoria: 'procesos', nivel: 2, descripcion: 'Impacto bajo en el tiempo de la ejecución del proceso  (entre 1 y 4 horas seguidas). Pocos clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.' },
  { categoria: 'procesos', nivel: 3, descripcion: 'Impacto moderado en el tiempo de ejecución del proceso (entre 4 y 8 horas seguidas).  Moderado número de clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.' },
  { categoria: 'procesos', nivel: 4, descripcion: 'Impacto mayor en el tiempo de ejecución del proceso (entre 1 y 2 días seguidos). Varios clientes con impacto que se van (-) y/o vienen (+) de la competencia.' },
  { categoria: 'procesos', nivel: 5, descripcion: 'Impacto importante en el tiempo de ejecución del proceso (mayor a 2 días). Mayoría de clientes con impacto que se van (-) y/o vienen (+) de la competencia.' },
  // Legal
  { categoria: 'legal', nivel: 1, descripcion: '- Queja ante autoridad administrativa. (-)\r\n- Sin modificaciones en el ambiente normativo/legal de la compañía. (+)' },
  { categoria: 'legal', nivel: 2, descripcion: '- Observaciones por parte del ente regulador con plazo para cumplimiento de acciones. (-)\r\n- El evento ocasiona cumplimiento total y/o cierre de brechas para el cumplimiento de las normativas legales. (+)' },
  { categoria: 'legal', nivel: 3, descripcion: '- Indemnizaciones, multas o sanciones por incumplimiento normativo. Demandas por parte de clientes y/o proveedores. (-)\r\n- El evento ocasiona mejoras en el cumplimiento de las normativas vigentes/ Mejoras en las condiciones legales de los contratos. (+)' },
  { categoria: 'legal', nivel: 4, descripcion: '- Junta Directiva y representantes legales resultan con antecedentes judiciales o administrativos que afectan las decisiones de la operación o el negocio. (-)\r\n- Optimización en el relacionamiento de los ejecutivos de la compañía con los reguladores claves de la industria. (+)' },
  { categoria: 'legal', nivel: 5, descripcion: '- Intervención por parte del ente regulador (-)\r\n- El evento resulta en acciones proactivas ante proyectos de normativas que tendrán un fuerte impacto en la compañía (+)' },
  // Confidencialidad SGSI
  { categoria: 'confidencialidadSGSI', nivel: 1, descripcion: 'El activo de información no se encuentra expuesto a acceso no autorizado' },
  { categoria: 'confidencialidadSGSI', nivel: 2, descripcion: 'Exposición de información pública interna a externos (Proveedores, clientes, etc.).' },
  { categoria: 'confidencialidadSGSI', nivel: 3, descripcion: 'Exposición de información confidencial y secreta a personal interno no autorizado (personal a quien no fue dirigida esa información).' },
  { categoria: 'confidencialidadSGSI', nivel: 4, descripcion: 'Exposición de información confidencial a externos (Proveedores, clientes, etc.)' },
  { categoria: 'confidencialidadSGSI', nivel: 5, descripcion: 'Exposición de información secreta a externos (Proveedores, clientes, etc.).' },
  // Reputación
  { categoria: 'reputacion', nivel: 1, descripcion: 'No se ve afectada la confianza y credibilidad en ningún grupo de interés ni tiene despliegue por medios de comunicación masiva. El hecho es conocido al interior de la unidad de negocio.' },
  { categoria: 'reputacion', nivel: 2, descripcion: 'El hecho afecta (+ ó -) la confianza y credibilidad de grupos de interés no claves para la unidad de negocio. El hecho es conocido al interior de la compañía.' },
  { categoria: 'reputacion', nivel: 3, descripcion: 'El hecho afecta (+ ó -) la confianza y credibilidad de varios grupos de interés clave para la compañía. El hecho es conocido por empresas del sector.' },
  { categoria: 'reputacion', nivel: 4, descripcion: 'El hecho afecta  (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva informales y/o locales.' },
  { categoria: 'reputacion', nivel: 5, descripcion: 'El hecho afecta (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva locales, regionales y nacionales.' },
  // Disponibilidad SGSI
  { categoria: 'disponibilidadSGSI', nivel: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.' },
  { categoria: 'disponibilidadSGSI', nivel: 2, descripcion: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.' },
  { categoria: 'disponibilidadSGSI', nivel: 3, descripcion: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía' },
  { categoria: 'disponibilidadSGSI', nivel: 4, descripcion: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales' },
  { categoria: 'disponibilidadSGSI', nivel: 5, descripcion: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes' },
  // Personas
  { categoria: 'personas', nivel: 1, descripcion: '-Lesión Leve (Primeros auxilios dentro de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-)\r\n- Eventos que involucran datos personales públicos que no afectan el derecho al habeas data (-).\r\n- Sin modificaciones en el ambiente de seguridad física de las personas. (+)' },
  { categoria: 'personas', nivel: 2, descripcion: '- Lesión Menor (sin incapacidad - primeros auxilios por fuera de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-).\r\n- Eventos que involucran datos personales privados o semiprivados que no afectan el derecho del habeas data (-).\r\n- El evento ocasiona mejoras leves en la salud ocupacional de los colaboradores - previene enfermedades y/o lesiones leves. (+)' },
  { categoria: 'personas', nivel: 3, descripcion: '- Incapacidad Temporal (>1 día): Eventos que afectan el desempeño laboral que requieren algunos días de recuperación. Daños reversibles en la salud (ej.: Irritación de la piel, intoxicaciones alimentarias) (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectan el derecho al habeas data (-).\r\n- El evento ocasiona mejoras moderadas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones reversibles. (+)' },
  { categoria: 'personas', nivel: 4, descripcion: '- Incapacidad permanente (parcial o total): Eventos que producen incapacidad parcial y/o permanente por accidente de trabajo o enfermedad profesional. Daños irreversibles en la salud con inhabilitación seria sin pérdida de vida (ej.: Hipoacusia inducida por ruido, lesiones lumbares crónicas, lesiones por sobreesfuerzos). (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectas derechos fundamentales (-).\r\n- El evento ocasiona mejoras significativas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones irreversibles. (+)' },
  { categoria: 'personas', nivel: 5, descripcion: '- Una o más fatalidades por accidente o enfermedad. (-).\r\n- Eventos que afectan derechos fundamentales y que involucren datos personales sensibles o datos de menores de edad (-).\r\n- El evento tiene un impacto importante en la salud ocupacional de los colaboradores, previniendo fatalidades por accidentes ó enfermedades. (+)' },
  // Integridad SGSI
  { categoria: 'integridadSGSI', nivel: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.' },
  { categoria: 'integridadSGSI', nivel: 2, descripcion: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.' },
  { categoria: 'integridadSGSI', nivel: 3, descripcion: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía' },
  { categoria: 'integridadSGSI', nivel: 4, descripcion: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales' },
  { categoria: 'integridadSGSI', nivel: 5, descripcion: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes' },
  // Ambiental
  { categoria: 'ambiental', nivel: 1, descripcion: 'Sin afectación ambiental. Sin modificaciones en el ambiente' },
  { categoria: 'ambiental', nivel: 2, descripcion: "'- El evento ocasiona (-) ó ayuda a mejorar (+) las emisiones, vertimientos o desechos con afectación ambiental leve. \r\n- Acciones para la corrección ó mejoramiento del ambiente a corto plazo (1 a 29 días)." },
  { categoria: 'ambiental', nivel: 3, descripcion: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental localizada.\r\n- Acciones para la corrección ó mejoramiento del ambiente a mediano plazo (30 a 90 días)" },
  { categoria: 'ambiental', nivel: 4, descripcion: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental grave con pérdida de capacidad productiva del ecosistema.\r\n- Acciones para la corrección ó mejoramiento del ambiente en el largo plazo (> 90 días)" },
  { categoria: 'ambiental', nivel: 5, descripcion: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con daño ambiental irreparable/nocivo a nivel interno y/o externo\r\n- Acciones para la compensación (-) ó mejoramiento (+) a daños irreparables a recursos naturales o ecosistema." },
];

// Funciones para obtener datos
export function getMockTiposRiesgos(): TipoRiesgo[] {
  const stored = localStorage.getItem('config_tipos_riesgos');
  if (stored) {
    return JSON.parse(stored);
  }
  return mockTiposRiesgos;
}

export function updateMockTiposRiesgos(data: TipoRiesgo[]): TipoRiesgo[] {
  mockTiposRiesgos = data;
  localStorage.setItem('config_tipos_riesgos', JSON.stringify(data));
  return data;
}

export function getMockObjetivos(): Objetivo[] {
  const stored = localStorage.getItem('config_objetivos');
  if (stored) {
    return JSON.parse(stored);
  }
  return mockObjetivos;
}

export function updateMockObjetivos(data: Objetivo[]): Objetivo[] {
  mockObjetivos = data;
  localStorage.setItem('config_objetivos', JSON.stringify(data));
  return data;
}

export function getMockFrecuencias(): Frecuencia[] {
  const stored = localStorage.getItem('config_frecuencias');
  if (stored) {
    return JSON.parse(stored);
  }
  return mockFrecuencias;
}

export function updateMockFrecuencias(data: Frecuencia[]): Frecuencia[] {
  mockFrecuencias = data;
  localStorage.setItem('config_frecuencias', JSON.stringify(data));
  return data;
}

export function getMockFuentes(): Fuente[] {
  const stored = localStorage.getItem('config_fuentes');
  if (stored) {
    return JSON.parse(stored);
  }
  return mockFuentes;
}

export function updateMockFuentes(data: Fuente[]): Fuente[] {
  mockFuentes = data;
  localStorage.setItem('config_fuentes', JSON.stringify(data));
  return data;
}

export function getMockImpactos(): ImpactoDescripcion[] {
  const stored = localStorage.getItem('config_impactos');
  if (stored) {
    return JSON.parse(stored);
  }
  return mockImpactos;
}

export function updateMockImpactos(data: ImpactoDescripcion[]): ImpactoDescripcion[] {
  mockImpactos = data;
  localStorage.setItem('config_impactos', JSON.stringify(data));
  return data;
}

