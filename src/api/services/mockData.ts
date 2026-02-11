/**
 * Mock Data for Risk Management System
 * Unified from mockData.ts and mockDataCompleto.ts
 */

import {
  Riesgo,
  EvaluacionRiesgo,
  PriorizacionRiesgo,
  Proceso,
  CreateEvaluacionDto,
  EstadoProceso,
  PaginatedResponse,
  EstadisticasRiesgo,
  RiesgoReciente,
  PuntoMapa,
  TipoRiesgo,
  Objetivo,
  Frecuencia,
  Fuente,
  ImpactoDescripcion,
  FiltrosRiesgo,
  Causa,
  RiesgoFormData,
} from '../../types';
import { calcularImpactoGlobal, calcularImpactoMaximo, calcularRiesgoInherente, determinarNivelRiesgo } from "../../utils/calculations";
import { CLASIFICACION_RIESGO, NIVELES_RIESGO, RESPUESTAS_RIESGO } from "../../utils/constants";

// Helper to load from localStorage
function loadFromStorage<T>(key: string, defaultData: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultData;
    const parsed = JSON.parse(stored);
    // If it's an array and it's empty, return default data
    if (Array.isArray(parsed) && parsed.length === 0) {
      return defaultData;
    }
    return parsed;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return defaultData;
  }
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
}

// Ensure default data is persisted at least once
function ensureStorage<T>(key: string, defaultData: T): T {
  const hasKey = localStorage.getItem(key);
  const data = loadFromStorage(key, defaultData);
  if (!hasKey) {
    saveToStorage(key, defaultData);
  }
  return data;
}

// ============================================
// DATOS BASICOS (De mockDataCompleto)
// ============================================

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
];

export const mockParametrosValoracion = [
  { id: '1', nombre: 'Aplicabilidad', peso: 0.25, valores: [{ nombre: 'Automático', peso: 1 }, { nombre: 'Semiautomático', peso: 0.3 }, { nombre: 'Manual', peso: 0 }], activo: true, createdAt: new Date().toISOString() },
  { id: '2', nombre: 'Cobertura', peso: 0.25, valores: [{ nombre: 'Automático', peso: 1 }, { nombre: 'Semiautomático', peso: 0.7 }, { nombre: 'Manual', peso: 0.1 }], activo: true, createdAt: new Date().toISOString() },
  { id: '3', nombre: 'Facilidad de uso', peso: 0.1, valores: [{ nombre: 'Automático', peso: 1 }, { nombre: 'Semiautomático', peso: 0.7 }, { nombre: 'Manual', peso: 0.3 }], activo: true, createdAt: new Date().toISOString() },
  { id: '4', nombre: 'Segregación', peso: 0.2, valores: [{ nombre: 'Automático', peso: 1 }, { nombre: 'Semiautomático', peso: 0 }, { nombre: 'Manual', peso: 1 }], activo: true, createdAt: new Date().toISOString() },
  { id: '5', nombre: 'Naturaleza', peso: 0.2, valores: [{ nombre: 'Automático', peso: 0.8 }, { nombre: 'Semiautomático', peso: 0.6 }, { nombre: 'Manual', peso: 0.4 }], activo: true, createdAt: new Date().toISOString() },
  { id: '6', nombre: 'Desviaciones', peso: 0.8, valores: [{ nombre: 'Sin desviaciones', peso: 1 }, { nombre: 'Con desviaciones', peso: 0.5 }, { nombre: 'Falla frecuente', peso: 0 }], activo: true, createdAt: new Date().toISOString() },
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
];

export const mockFormulas = [
  { id: 'formula-1', nombre: 'Riesgo Inherente', descripcion: 'Cálculo del riesgo inherente', formula: 'IF(AND(impacto=2,probabilidad=2),3.99,impacto*probabilidad)', categoria: 'riesgo', activa: true, variables: ['impacto', 'probabilidad'], createdAt: new Date().toISOString() },
  { id: 'formula-2', nombre: 'Impacto Global', descripcion: 'Cálculo del impacto global ponderado', formula: 'ROUNDUP((economico*0.22+legal*0.22+reputacion*0.22+procesos*0.14+ambiental*0.10+personas*0.10+confidencialidadSGSI*0+disponibilidadSGSI*0+integridadSGSI*0),0)', categoria: 'impacto', activa: true, variables: ['economico', 'legal', 'reputacion', 'procesos', 'ambiental', 'personas', 'confidencialidadSGSI', 'disponibilidadSGSI', 'integridadSGSI'], createdAt: new Date().toISOString() },
];

export const mockConfiguraciones = [
  { id: '1', clave: 'validar_campos_requeridos', valor: 'true', tipo: 'boolean', descripcion: 'Validar campos requeridos antes de guardar' },
  { id: '2', clave: 'editar_procesos_aprobados', valor: 'false', tipo: 'boolean', descripcion: 'Permitir edición de procesos aprobados' },
  { id: '3', clave: 'limite_riesgos_proceso', valor: '100', tipo: 'number', descripcion: 'Límite máximo de riesgos por proceso' },
  { id: '4', clave: 'dias_recordatorio_tareas', valor: '7', tipo: 'number', descripcion: 'Días para recordatorio de tareas pendientes' },
  { id: '5', clave: 'formato_fecha', valor: 'DD/MM/YYYY', tipo: 'string', descripcion: 'Formato de fecha por defecto' },
  { id: '6', clave: 'zona_horaria', valor: 'America/Bogota', tipo: 'string', descripcion: 'Zona horaria' },
];

export const mockObservaciones: any[] = [];
export const mockHistorial: any[] = [];
export const mockTareas: any[] = [];
export const mockNotificaciones: any[] = [];

// ============================================
// CONFIGURACION (Tipos, Objetivos, etc)
// ============================================

let mockTiposRiesgos: TipoRiesgo[] = loadFromStorage('catalog_tipos_riesgo', [
  {
    codigo: '1',
    nombre: 'Estratégico',
    descripcion: 'Son los riesgos de fallar en la implementación del plan estratégico',
    subtipos: [
      { codigo: '1', nombre: 'alianzas', descripcion: 'Alianzas comerciales ineficientes y/o inefectivas y/o no rentables.' },
      { codigo: '2', nombre: 'alineación estratégico', descripcion: 'Inexistencia, desconocimiento y/o falta de alineación entre la misión, visión, estrategias y los objetivos de negocio y proyectos de alto impacto de las unidades de negocio.' },
      { codigo: '3', nombre: 'canales de distribución', descripcion: 'Fallas en los canales de distribución que afectan la capacidad de la compañía de llegar a los clientes.' },
      { codigo: '4', nombre: 'capacidad industrial', descripcion: 'Riesgos de obsolescencia tecnológica y/o ineficiente uso de activos críticos.' },
      { codigo: '5', nombre: 'competencia', descripcion: 'Acciones de competidores o nuevos jugadores en el mercado.' },
      { codigo: '6', nombre: 'continuidad de negocio', descripcion: 'Eventos mayores (natural u ocasionado por el hombre) que afecten o inhabiliten la operación de la compañía.' },
      { codigo: '7', nombre: 'cultura organizacional', descripcion: 'Fallas en la alineación de los funcionarios con la misión, visión y objetivos estrátegicos de la compañía, fallas en la transmisión de conocimiento, y aceptación de cambios en la compañía.' },
      { codigo: '8', nombre: 'emergentes', descripcion: 'Un riesgo emergente es un evento cuya naturaleza y consecuencias no se conocen completamente y que podrían llegar a tener un gran impacto en la compañía. Estos usualmente suceden a gran escala y surgen de tendencias globales.' },
      { codigo: '9', nombre: 'grupo', descripcion: 'Potenciales pérdidas producto de transacciones con empresas del mismo grupo realizadas en condiciones distintas a las dominantes en el mercado, efectos negativos en la compañía producto de problemas reputacionales y/o económicos en otra empresa del grupo, concentración de operaciones con otra empresa del mismo grupo.' },
      { codigo: '10', nombre: 'mercado', descripcion: 'Cambios en las condiciones macroeconómicas y/o sectoriales relevantes para el negocio. Fluctuaciones en precios y/o indisponibilidad de inventario para comercializar' },
      { codigo: '11', nombre: 'político', descripcion: 'Es el riesgo que emerge debido a la exposición de la compañía a situaciones políticas nacionales y/o internacionales adversas, tensiones geopolíticas, o guerra.' },
      { codigo: '12', nombre: 'proyecto estratégico', descripcion: 'Riesgo de fallas en los estándares de gerencia de proyectos, incluidas las actividades de gobierno, actividades de monitoreo y control, manejo de presupuesto. Inhabilidad de mantener el alcance del proyecto y cronograma, así como fallar en la entrega exitosa del proyecto y la asociada gestión del cambio. Esta tipología se debe seleccionar cuando se trata de un proyecto de gran envergadura que afecta directamente el plan estratégico de la compañía.' },
      { codigo: '13', nombre: 'rentabilidad', descripcion: 'Posibilidad de no cumplir con la maximización del ROE presupuestado.' },
      { codigo: '14', nombre: 'satisfacción del cliente', descripcion: 'Fallo en la identificación de preferencias/necesidades de los clientes para la atracción de nuevos clientes y mantenimiento de la lealtad de los existentes, y/o en la ejecución de las estrategias de entrega de soluciones integrales a los clientes.' },
      { codigo: '15', nombre: 'talento humano', descripcion: 'Riesgo asociado con la falta y/o pérdida de funcionarios clave en la compañía, y/o en la atracción, desarrollo y retención de funcionarios competentes.' },
    ],
  },
  {
    codigo: '2',
    nombre: 'Operacional',
    descripcion: 'Son aquellos riesgos relacionados con fallas en procesos, personas y/o tecnología',
    subtipos: [
      { codigo: '1', nombre: 'ambiental', descripcion: 'Riesgos asociados a los daños ocasionados al medio ambiente a causa de la operación de la compañía.' },
      { codigo: '2', nombre: 'físico', descripcion: 'Riesgo de pérdida y/o daño en los activos físicos de la compañía (edificios, espacios de trabajo, almacenamiento y transporte).' },
      { codigo: '3', nombre: 'fraude externo', descripcion: 'Es el riesgo de que una persona natural y/o jurídica, actuando individualmente o en concierto con otros, deshonestamente o engañosamente gane o ayude a otros a ganar alguna ventaja injusta o ilegal sobre la compañía y/o sus partes interesadas (clientes, empleados, accionistas).' },
      { codigo: '4', nombre: 'fraude interno', descripcion: 'Es el riesgo que una persona dentro de la compañía y/o del grupo corporativo, actuando individualmente o en concierto con otros, deshonestamente o engañosamente gane o ayude a otros a ganar alguna ventaja injusta o ilegal sobre la compañía y/o sus partes interesadas (clientes, empleados, accionistas).' },
      { codigo: '5', nombre: 'información', descripcion: 'Brechas en la confidencialidad, integridad y/o disponibilidad de la información confidencial de la compañía. Que resulte en pérdidas de información, uso de la información para fines criminales, o que la información sea usada de tal manera que cause daño reputacional y/o pérdidas financieras.' },
      { codigo: '6', nombre: 'Proceso', descripcion: 'Son los riesgos relacionados con la inexistencia, fallas y/o ineficiencias en la ejecución de los procesos de la compañía.' },
      { codigo: '7', nombre: 'proyecto', descripcion: 'Riesgo de fallas en los estándares de gerencia de proyectos, incluidas las actividades de gobierno, actividades de monitoreo y control, manejo de presupuesto. Inhabilidad de mantener el alcance del proyecto y cronograma, así como fallar en la entrega exitosa del proyecto y la asociada gestión del cambio.' },
      { codigo: '8', nombre: 'seguridad en la cadena de suministro', descripcion: 'Son los riesgos asociados con el daño, pérdida y/o contaminación del producto, a nivel nacional e internacional. Por cadena de suministro se entiende, todas las actividades necesarias para la preparación y distribución de un producto para su venta.' },
      { codigo: '9', nombre: 'sistemas', descripcion: 'Es el riesgo de fallas, u otra deficiencia en las plataformas automáticas que soportan la operación diaria de la compañía (aplicaciones), y en los sistemas de infraestructura en las que ellas residen (date centers, redes, computadores, etc.)' },
      { codigo: '10', nombre: 'social', descripcion: 'Potencial pérdida producto del daño en la calidad de vida de la comunidad aledaña a las operaciones.' },
    ],
  },
  {
    codigo: '3',
    nombre: 'Financiero',
    descripcion: 'Riesgos relacionados con aspectos financieros',
    subtipos: [
      { codigo: '1', nombre: 'contable', descripcion: 'Es el riesgo de que información financiera sea capturada incorrectamente, mal calculada, omitida o mal reportada a usuarios externos como inversionistas o entes reguladores, o como información de gestión interna.' },
      { codigo: '2', nombre: 'crédito', descripcion: 'Posibilidad de que la compañía incurra en pérdidas y/o se disminuya el valor de sus activos, como consecuencia de que un deudor o contraparte incumpla sus obligaciones.' },
      { codigo: '3', nombre: 'impuestos', descripcion: 'Es el riesgo de incremento en las obligaciones tributarias de la compañía, y/o insuficiencias relacionadas con los procesos de impuestos que generen un impacto adverso en las relaciones y/o reputación de la compañía con sus contrapartes.' },
      { codigo: '4', nombre: 'liquidez', descripcion: 'Se define como la contingencia de no poder cumplir plenamente, de manera oportuna y eficiente los flujos de caja esperados, vigentes y futuros, sin afectar el curso de las operaciones diarias o la condición financiera de la compañía.' },
      { codigo: '5', nombre: 'riesgo de mercado', descripcion: 'Posibilidad de que la compañía incurra en pérdidas asociadas a la variación de los precios de mercado de materias primas, productos, inversiones, variación en tasas de interés que afecte sus pasivos y demás factores de mercado.' },
    ],
  },
  {
    codigo: '4',
    nombre: 'Cumplimiento',
    descripcion: 'Riesgos relacionados con el cumplimiento normativo y legal',
    subtipos: [
      { codigo: '1', nombre: 'gobierno corporativo y ética', descripcion: 'Incumplimiento de los principios y normas que regulan el funcionamiento de Gobierno de la Compañía.' },
      { codigo: '2', nombre: 'Legal', descripcion: 'Es el riesgo de que funcionarios de la empresa influencien o sean influenciados por medio del pago de dadivas, regalos y/o favores, ya sea de forma directa o indirecta, con el fin de obtener y/o propiciar un negocio u otra ventaja por parte de un tercero, ya sea público o privado.' },
      { codigo: '3', nombre: 'legal', descripcion: 'Es el riesgo de pérdida financiera, sanciones y/o daño reputacional resultado de que los derechos y/u obligaciones de la compañía en una relación contractual sean defectuosos; que la compañía se encuentre envuelta o tenga potenciales o actuales disputas.' },
      { codigo: '4', nombre: 'protección de datos personales', descripcion: '' },
      { codigo: '5', nombre: 'regulatorio', descripcion: 'Es el riesgo de que la compañía falle en adherirse a las leyes operables en el país o en las jurisdicciones donde tenga relación en el transcurso de sus operaciones.' },
    ],
  },
  {
    codigo: '5',
    nombre: 'Seguridad de la Información',
    descripcion: 'Riesgos relacionados con la seguridad de la información',
    subtipos: [
      { codigo: '1', nombre: 'Información', descripcion: 'Corresponden a este tipo datos e información almacenada o procesada física o electrónicamente tales como: bases y archivos de datos, contratos, documentación del sistema, investigaciones, acuerdos de confidencialidad, manuales de usuario, procedimientos operativos o de soporte, planes para la continuidad del negocio, acuerdos sobre retiro y pruebas de auditoría, entre otros.' },
      { codigo: '2', nombre: 'información', descripcion: 'Corresponden a este tipo datos e información almacenada o procesada física o electrónicamente tales como: bases y archivos de datos, contratos, documentación del sistema, investigaciones, acuerdos de confidencialidad, manuales de usuario, procedimientos operativos o de soporte, planes para la continuidad del negocio, acuerdos sobre retiro y pruebas de auditoría, entre otros.' },
      { codigo: '3', nombre: 'servicio', descripcion: 'Servicios de computación y comunicaciones, tales como Internet, páginas de consulta, directorios compartidos e Intranet.' },
      { codigo: '4', nombre: 'software', descripcion: 'Software de aplicación, interfaces, software del sistema, herramientas de desarrollo y otras utilidades relacionadas.' },
    ],
  },
  {
    codigo: '6',
    nombre: 'Seguridad y Salud en el Trabajo',
    descripcion: 'Riesgos relacionados con la seguridad y salud en el trabajo',
    subtipos: [
      { codigo: '1', nombre: 'caminatas', descripcion: 'Desplazamientos Por Largas Jornadas A Pie..' },
      { codigo: '2', nombre: 'diseño', descripcion: 'Diseño Inadecuado Del Puesto De Trabajo' },
      { codigo: '3', nombre: 'distribución del puesto', descripcion: 'Distribución/Organización Inadecuada Del Puesto De Trabajo' },
      { codigo: '4', nombre: 'hábitos posturales', descripcion: 'Hábitos Posturales Inadecuados Durante…' },
      { codigo: '5', nombre: 'manipulación de cargas', descripcion: 'Manipulación De Cargas Manual Por Encima De 12.5(Mujeres) 25 Kg (Hombres) durante..' },
      { codigo: '6', nombre: 'movimientos repetitivos', descripcion: 'Movimientos Repetitivos Al…' },
      { codigo: '7', nombre: 'otros', descripcion: 'Indique la situación' },
      { codigo: '8', nombre: 'postura de pie', descripcion: 'Posturas Prolongadas O Sostenidas De Pie durante..' },
      { codigo: '9', nombre: 'postura sentado', descripcion: 'Posturas Prolongadas O Sostenidas  Sentado durante..' },
      { codigo: '10', nombre: 'posturas forzadas', descripcion: 'Posturas forzadas o sostenidas o posturas incómodas debido a:' },
    ],
  },
]);



let mockObjetivos: Objetivo[] = loadFromStorage('catalog_objetivos', [
  { id: 1, codigo: '1', descripcion: 'Maximizar la rentabilidad sobre la inversión' },
  { id: 2, codigo: '2', descripcion: 'Ofrecer soluciones de vanguardia para los clientes' },
  { id: 3, codigo: '3', descripcion: 'Lograr que los clientes recomienden los productos y servicios de Comware' },
  { id: 4, codigo: '4', descripcion: 'Enfocarse en clientes objetivo así como en proyectos estratégicos' },
  { id: 5, codigo: '5', descripcion: 'Maximizar el retorno de los recursos invertidos en el proceso comercial y preventa' },
  { id: 6, codigo: '6', descripcion: 'Gestionar la liquidez necesaria para la operación' },
  { id: 7, codigo: '7', descripcion: 'Gestionar los riesgos y establecer normas de control interno' },
  { id: 8, codigo: '8', descripcion: 'Generar EEFF auditados en cumplimiento con las normas aplicables' },
  { id: 9, codigo: '9', descripcion: 'Cumplir las expectativas de alcance, tiempo y recursos de los proyectos' },
  { id: 10, codigo: '10', descripcion: 'Cumplir con los niveles de servicio acordados con el cliente' },
  { id: 11, codigo: '11', descripcion: 'Cumplir con las expectativas sobre colocación de órdenes de compra y entrega de equipos' },
  { id: 12, codigo: '12', descripcion: 'Garantizar la disponibilidad de los recursos de TI para la operación de los procesos de Comware' },
  { id: 14, codigo: '13', descripcion: 'Aplicar estándares de seguridad de la información' },
  { id: 15, codigo: '14', descripcion: 'Reducir los incidentes de Seguridad de la Información' },
  { id: 16, codigo: '15', descripcion: 'Gestionar el desempeño del Personal' },
  { id: 17, codigo: '16', descripcion: 'Asegurar la continuidad operacional mediante personal capacitado' },
  { id: 18, codigo: '17', descripcion: 'Cumplir con todas las normativas laborales vigentes' },
  { id: 19, codigo: '18', descripcion: 'Retener el talento clave mediante planes de desarrollo' },
]);

let mockFrecuencias: Frecuencia[] = loadFromStorage('catalog_frecuencias', [
  { id: 1, label: 'Raro', descripcion: 'mayor a anual' },
  { id: 2, label: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
  { id: 3, label: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
  { id: 4, label: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
  { id: 5, label: 'Esperado', descripcion: 'diaria o varias veces al día' },
]);

let mockFuentes: Fuente[] = loadFromStorage('catalog_fuentes', [
  { id: 1, codigo: '1', nombre: 'Personas' },
  { id: 2, codigo: '2', nombre: 'Proceso' },
  { id: 3, codigo: '3', nombre: 'Legal' },
  { id: 4, codigo: '4', nombre: 'Infraestructura' },
  { id: 5, codigo: '5', nombre: 'Externos' },
]);

let mockOrigenes: any[] = loadFromStorage('catalog_origenes', [
  { id: 1, codigo: '1', nombre: 'Talleres internos' },
  { id: 2, codigo: '2', nombre: 'Auditoría HHI' },
  { id: 3, codigo: '3', nombre: 'Auditorías Externas' },
  { id: 4, codigo: '4', nombre: 'SGSI' },
  { id: 5, codigo: '5', nombre: 'SSO' },
]);

let mockTiposProceso: any[] = loadFromStorage('catalog_tipos_proceso_v2', [
  { id: 1, codigo: '1', nombre: 'Estratégico', descripcion: 'Procesos que definen la estrategia y dirección de la organización' },
  { id: 2, codigo: '2', nombre: 'Operacional', descripcion: 'Procesos relacionados con las operaciones principales del negocio' },
  { id: 3, codigo: '3', nombre: 'Apoyo', descripcion: 'Procesos de soporte que facilitan las operaciones principales' },
  { id: 4, codigo: '4', nombre: 'Cumplimiento', descripcion: 'Procesos orientados a cumplimiento normativo y legal' },
  { id: 5, codigo: '5', nombre: 'Gestión', descripcion: 'Procesos de gestión administrativa y de recursos' },
]);

let mockConsecuencias: any[] = loadFromStorage('catalog_consecuencias', [
  { id: 1, codigo: '1', nombre: 'Negativa' },
  { id: 2, codigo: '2', nombre: 'Positiva' },
]);

let mockImpactos: any[] = loadFromStorage('catalog_impactos_list', [ // Changed type to any temporarily or match Impacto list structure
  { tipo: 'Impacto económico', valor: 4, descripcion: 'Variación (+ ó -) en los recursos financieros de hasta $85,9K USD' },
  { tipo: 'Procesos', valor: 5, descripcion: 'Impacto importante en el tiempo de ejecución del proceso (mayor a 2 días). Mayoría de clientes con Impacto que se van (-) y/o vienen (+) de la competencia.' },
  { tipo: 'Legal', valor: 4, descripcion: 'Junta Directiva y representantes legales resultan con antecedentes judiciales o administrativos que afectan las decisiones de la operación o el negocio. (-)' },
  { tipo: 'Confidencialidad SGSI', valor: 1, descripcion: 'El activo de información no se encuentra expuesto a acceso no autorizado' },
  { tipo: 'Reputación', valor: 3, descripcion: 'El hecho afecta (+ ó -) la confianza y credibilidad de varios grupos de interés clave para la compañía. El hecho es conocido por empresas del sector.' },
  { tipo: 'Disponibilidad SGSI', valor: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a' },
  { tipo: 'Personas', valor: 1, descripcion: '-Lesión Leve (Primeros auxilios dentro de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-)' },
  { tipo: 'Integridad SGSI', valor: 1, descripcion: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a' },
]);

let mockCausas: Causa[] = [
  {
    id: '1',
    descripcion: 'Ataques cibernéticos por hackers que pueden explotar vulnerabilidades en los sistemas para acceder a',
    fuente: 'Personas',
    frecuencia: 'Probable',
  },
  {
    id: '2',
    descripcion: 'Robo, daño, modificación o sustracción de información por accesos no autorizados.',
    fuente: 'Personas',
    frecuencia: 'Esperado',
  },
  {
    id: '3',
    descripcion: 'Por errores humanos al compartir información confidencial a través de correos electrónicos, uso inadecuado',
    fuente: 'Personas',
    frecuencia: 'Esperado',
    seleccionada: true,
  },
  {
    id: '4',
    descripcion: 'Por falta de garantías de seguridades de la información por los proveedores de los sistemas que',
    fuente: 'Externos',
    frecuencia: 'Probable',
  },
  {
    id: '5',
    descripcion: 'Por falta de estrategias de gestión de nuevos proyectos que incluya la seguridad de la información.',
    fuente: 'Externos',
    frecuencia: 'Probable',
  },
];

// ============================================
// RIESGOS Y EVALUACIONES (De anterior mockData.ts)
// ============================================

const defaultRiesgos: Riesgo[] = [
  {
    id: '1',
    procesoId: '1', // Direccionamiento Estratégico
    numero: 1,
    descripcion: 'Probabilidad de afectar la continuidad operacional por falta de personal capacitado en procesos críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Direccionamiento Estratégico',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional', // Compatibility alias
    tipologiaNivelII: 'Falta de actualización o cumplimiento de procedimientos',
    subtipo: 'sistemas', // Compatibility alias - matching hardcoded
    causaRiesgo: 'Personas',
    objetivo: '13 Aplicar estándares de seguridad de la información', // Missing in mock, found in hardcoded
    fuenteCausa: 'Talleres internos',
    origen: 'Talleres internos',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    procesoId: '2', // Planificación Financiera
    numero: 2,
    descripcion: 'Riesgo de incumplimiento normativo en contratación laboral',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Planificación Financiera',
    zona: 'Cumplimiento',
    tipologiaNivelI: '04 Cumplimiento',
    tipoRiesgo: '04 Cumplimiento',
    tipologiaNivelII: 'Cumplimiento regulatorio',
    subtipo: 'legal',
    causaRiesgo: 'Procesos',
    objetivo: '02 Asegurar cumplimiento normativo',
    fuenteCausa: 'Regulación externa',
    origen: 'Regulación externa',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    procesoId: '3', // Compliance
    numero: 3,
    descripcion: 'Riesgo de pérdida de talento clave',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Compliance',
    zona: 'Estratégico',
    tipologiaNivelI: '01 Estratégico',
    tipoRiesgo: '01 Estratégico',
    tipologiaNivelII: 'Retención de talento',
    subtipo: 'personas',
    causaRiesgo: 'Personas',
    objetivo: '01 Retención de talento',
    fuenteCausa: 'Mercado laboral',
    origen: 'Mercado laboral',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '4',
    procesoId: '4',
    numero: 4,
    descripcion: 'Riesgo de fuga de datos confidenciales',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Compras',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Seguridad de información',
    subtipo: 'sistemas',
    causaRiesgo: 'Tecnología',
    objetivo: '13 Aplicar estándares de seguridad',
    fuenteCausa: 'Amenazas externas',
    origen: 'Amenazas externas',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '5',
    procesoId: '5',
    numero: 5,
    descripcion: 'Riesgo de interrupciones en la prestación de servicios',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión Talento Humano',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Continuidad operacional',
    subtipo: 'procesos',
    causaRiesgo: 'Procesos',
    objetivo: '03 Asegurar continuidad',
    fuenteCausa: 'Indisponibilidad',
    origen: 'Indisponibilidad',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '6',
    procesoId: '6',
    numero: 6,
    descripcion: 'Riesgo de ransomware y cifrado masivo de datos críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Ciberseguridad',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Seguridad de información',
    subtipo: 'sistemas',
    causaRiesgo: 'Tecnología',
    objetivo: '13 Aplicar estándares de seguridad',
    fuenteCausa: 'Auditoría HHI',
    origen: 'Auditoría HHI',
    vicepresidenciaGerenciaAlta: 'Tecnología',
    siglaVicepresidencia: 'TI',
    gerencia: 'Gerencia de Ciberseguridad',
    siglaGerencia: 'GCS',
    createdAt: '2023-11-10T09:00:00Z',
    updatedAt: '2023-12-02T11:15:00Z',
  },
  {
    id: '7',
    procesoId: '7',
    numero: 7,
    descripcion: 'Riesgo de incumplimiento de SLA en soporte postventa',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Soporte y Postventa',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Continuidad operacional',
    subtipo: 'procesos',
    causaRiesgo: 'Procesos',
    objetivo: '03 Asegurar continuidad',
    fuenteCausa: 'Talleres internos',
    origen: 'Talleres internos',
    vicepresidenciaGerenciaAlta: 'Operaciones',
    siglaVicepresidencia: 'OPS',
    gerencia: 'Gerencia de Soporte',
    siglaGerencia: 'GSP',
    createdAt: '2023-12-15T13:45:00Z',
    updatedAt: '2024-01-05T08:20:00Z',
  },
  {
    id: '8',
    procesoId: '8',
    numero: 8,
    descripcion: 'Riesgo de rotación alta de personal clave en talento humano',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Talento Humano',
    zona: 'Estratégico',
    tipologiaNivelI: '01 Estratégico',
    tipoRiesgo: '01 Estratégico',
    tipologiaNivelII: 'Retención de talento',
    subtipo: 'personas',
    causaRiesgo: 'Personas',
    objetivo: '01 Retención de talento',
    fuenteCausa: 'Mercado laboral',
    origen: 'Mercado laboral',
    vicepresidenciaGerenciaAlta: 'Talento Humano',
    siglaVicepresidencia: 'TH',
    gerencia: 'Gerencia de Talento Humano',
    siglaGerencia: 'GTH',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-18T10:30:00Z',
    // CAUSAS AGREGADAS PARA INCIDENCIAS
    causas: [
      {
        id: 'causa-th-1',
        descripcion: 'Falta de planes de carrera y desarrollo profesional',
        fuente: 'INTERNA',
        orden: 1,
      },
      {
        id: 'causa-th-2',
        descripcion: 'Competencia agresiva del mercado laboral con mejores ofertas',
        fuente: 'EXTERNA',
        orden: 2,
      },
    ],
  },
  {
    id: '9',
    procesoId: '9',
    numero: 9,
    descripcion: 'Riesgo de desviaciones presupuestales significativas',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Finanzas y Administración',
    zona: 'Financiero',
    tipologiaNivelI: '03 Financiero',
    tipoRiesgo: '03 Financiero',
    tipologiaNivelII: 'Gestión presupuestal',
    subtipo: 'finanzas',
    causaRiesgo: 'Procesos',
    objetivo: '02 Asegurar cumplimiento normativo',
    fuenteCausa: 'Regulación externa',
    origen: 'Regulación externa',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Gerencia de Finanzas',
    siglaGerencia: 'GFN',
    createdAt: '2024-03-01T09:30:00Z',
    updatedAt: '2024-03-12T15:05:00Z',
  },
  {
    id: '10',
    procesoId: '10',
    numero: 10,
    descripcion: 'Riesgo de indisponibilidad de servicios de TI críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de TICS',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Disponibilidad de servicios',
    subtipo: 'infraestructura',
    causaRiesgo: 'Tecnología',
    objetivo: '03 Asegurar continuidad',
    fuenteCausa: 'Externos',
    origen: 'Externos',
    vicepresidenciaGerenciaAlta: 'Tecnología',
    siglaVicepresidencia: 'TI',
    gerencia: 'Gerencia de TICS',
    siglaGerencia: 'TIC',
    createdAt: '2024-03-20T11:20:00Z',
    updatedAt: '2024-03-28T16:40:00Z',
  },
  {
    id: '11',
    procesoId: '11',
    numero: 11,
    descripcion: 'Riesgo de exposición de información sensible por accesos indebidos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Seguridad de la Información',
    zona: 'Cumplimiento',
    tipologiaNivelI: '04 Cumplimiento',
    tipoRiesgo: '04 Cumplimiento',
    tipologiaNivelII: 'Seguridad de información',
    subtipo: 'legal',
    causaRiesgo: 'Procesos',
    objetivo: '13 Aplicar estándares de seguridad',
    fuenteCausa: 'Auditoría HHI',
    origen: 'Auditoría HHI',
    vicepresidenciaGerenciaAlta: 'Tecnología',
    siglaVicepresidencia: 'TI',
    gerencia: 'Gerencia de Seguridad',
    siglaGerencia: 'GSI',
    createdAt: '2024-04-02T08:10:00Z',
    updatedAt: '2024-04-05T12:50:00Z',
  },
  {
    id: '12',
    procesoId: '2',
    numero: 12,
    descripcion: 'Riesgo de errores en consolidación de reportes financieros',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Planificación Financiera',
    zona: 'Financiero',
    tipologiaNivelI: '03 Financiero',
    tipoRiesgo: '03 Financiero',
    tipologiaNivelII: 'Información contable',
    subtipo: 'finanzas',
    causaRiesgo: 'Personas',
    objetivo: '02 Asegurar cumplimiento normativo',
    fuenteCausa: 'Talleres internos',
    origen: 'Talleres internos',
    vicepresidenciaGerenciaAlta: 'Gestión Financiera y Administrativa',
    siglaVicepresidencia: 'GFA',
    gerencia: 'Dirección Financiera Administrativa',
    siglaGerencia: 'GFA',
    createdAt: '2024-04-12T14:00:00Z',
    updatedAt: '2024-04-15T09:10:00Z',
  },
  // RIESGOS DE GESTIÓN DE TALENTO HUMANO CON CAUSAS
  {
    id: 'riesgo-th-1',
    procesoId: '8',
    numero: 101,
    descripcion: 'Probabilidad de afectar la continuidad operacional por falta de personal capacitado en procesos críticos',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Talento Humano',
    zona: 'Operacional',
    tipologiaNivelI: '02 Operacional',
    tipoRiesgo: '02 Operacional',
    tipologiaNivelII: 'Falta de actualización o cumplimiento de procedimientos',
    subtipo: 'personas',
    causaRiesgo: 'Personas',
    objetivo: 'Asegurar la continuidad operacional mediante personal capacitado',
    fuenteCausa: 'Talleres internos',
    origen: 'Talleres internos',
    vicepresidenciaGerenciaAlta: 'Talento Humano',
    siglaVicepresidencia: 'TH',
    gerencia: 'Gerencia de Talento Humano',
    siglaGerencia: 'GTH',
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-04-20T10:00:00Z',
    causas: [
      {
        id: 'causa-th-101-1',
        descripcion: 'Falta de programas de capacitación continua',
        fuente: 'INTERNA',
        orden: 1,
      },
      {
        id: 'causa-th-101-2',
        descripcion: 'Rotación de personal sin transferencia de conocimiento',
        fuente: 'INTERNA',
        orden: 2,
      },
    ],
  } as any,
  {
    id: 'riesgo-th-2',
    procesoId: '8',
    numero: 102,
    descripcion: 'Riesgo de incumplimiento normativo en contratación laboral',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Talento Humano',
    zona: 'Cumplimiento',
    tipologiaNivelI: '04 Cumplimiento',
    tipoRiesgo: '04 Cumplimiento',
    tipologiaNivelII: 'Cumplimiento regulatorio',
    subtipo: 'legal',
    causaRiesgo: 'Legal',
    objetivo: 'Cumplir con todas las normativas laborales vigentes',
    fuenteCausa: 'Auditoría HHI',
    origen: 'Auditoría HHI',
    vicepresidenciaGerenciaAlta: 'Talento Humano',
    siglaVicepresidencia: 'TH',
    gerencia: 'Gerencia de Talento Humano',
    siglaGerencia: 'GTH',
    createdAt: '2024-04-20T11:00:00Z',
    updatedAt: '2024-04-20T11:00:00Z',
    causas: [
      {
        id: 'causa-th-102-1',
        descripcion: 'Desactualización en normativas laborales',
        fuente: 'EXTERNA',
        orden: 1,
      },
    ],
  } as any,
  {
    id: 'riesgo-th-3',
    procesoId: '8',
    numero: 103,
    descripcion: 'Riesgo de pérdida de talento clave por falta de planes de retención',
    clasificacion: CLASIFICACION_RIESGO.NEGATIVA,
    proceso: 'Gestión de Talento Humano',
    zona: 'Estratégico',
    tipologiaNivelI: '01 Estratégico',
    tipoRiesgo: '01 Estratégico',
    tipologiaNivelII: 'Retención de talento',
    subtipo: 'personas',
    causaRiesgo: 'Personas',
    objetivo: 'Retener el talento clave mediante planes de desarrollo',
    fuenteCausa: 'Mercado laboral',
    origen: 'Mercado laboral',
    vicepresidenciaGerenciaAlta: 'Talento Humano',
    siglaVicepresidencia: 'TH',
    gerencia: 'Gerencia de Talento Humano',
    siglaGerencia: 'GTH',
    createdAt: '2024-04-20T12:00:00Z',
    updatedAt: '2024-04-20T12:00:00Z',
    causas: [
      {
        id: 'causa-th-103-1',
        descripcion: 'Falta de planes de carrera y desarrollo',
        fuente: 'INTERNA',
        orden: 1,
      },
      {
        id: 'causa-th-103-2',
        descripcion: 'Competencia del mercado laboral',
        fuente: 'EXTERNA',
        orden: 2,
      },
    ],
  } as any,
];

// Helper to access centralized risks
const getCurrentRiesgos = () => loadFromStorage<Riesgo[]>('riesgos', defaultRiesgos);

export function getAllRiesgos() { return getCurrentRiesgos(); }
export function saveRiesgos(riesgos: Riesgo[]) { saveToStorage('riesgos', riesgos); }

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
    impactoGlobal: calcularImpactoGlobal({ personas: 4, legal: 3, ambiental: 1, procesos: 5, reputacion: 3, economico: 4 }),
    impactoMaximo: 5,
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
    impactoProcesos: 4,
    impactoReputacion: 4,
    impactoEconomico: 3,
    impactoTecnologico: 1,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 2, legal: 5, ambiental: 1, procesos: 4, reputacion: 4, economico: 3 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-20T14:30:00Z',
    evaluadoPor: 'María Auditora',
  },
  {
    id: 'eval-3',
    riesgoId: '3',
    impactoPersonas: 5,
    impactoLegal: 2,
    impactoAmbiental: 0,
    impactoProcesos: 3,
    impactoReputacion: 2,
    impactoEconomico: 5,
    impactoTecnologico: 1,
    probabilidad: 4,
    impactoGlobal: calcularImpactoGlobal({ personas: 5, legal: 2, ambiental: 0, procesos: 3, reputacion: 2, economico: 5 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 4),
    nivelRiesgo: determinarNivelRiesgo(20, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-20T14:30:00Z',
    evaluadoPor: 'Carlos Especialista',
  },
  {
    id: 'eval-4',
    riesgoId: '4',
    impactoPersonas: 3,
    impactoLegal: 4,
    impactoAmbiental: 2,
    impactoProcesos: 5,
    impactoReputacion: 5,
    impactoEconomico: 4,
    impactoTecnologico: 5,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 3, legal: 4, ambiental: 2, procesos: 5, reputacion: 5, economico: 4 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-20T14:30:00Z',
    evaluadoPor: 'Luis Seguridad',
  },
  {
    id: 'eval-5',
    riesgoId: '5',
    impactoPersonas: 4,
    impactoLegal: 1,
    impactoAmbiental: 1,
    impactoProcesos: 5,
    impactoReputacion: 3,
    impactoEconomico: 4,
    impactoTecnologico: 2,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 4, legal: 1, ambiental: 1, procesos: 5, reputacion: 3, economico: 4 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-20T14:30:00Z',
    evaluadoPor: 'Patricia Analista',
  },
  {
    id: 'eval-6',
    riesgoId: '6',
    impactoPersonas: 3,
    impactoLegal: 4,
    impactoAmbiental: 1,
    impactoProcesos: 5,
    impactoReputacion: 5,
    impactoEconomico: 4,
    impactoTecnologico: 5,
    probabilidad: 4,
    impactoGlobal: calcularImpactoGlobal({ personas: 3, legal: 4, ambiental: 1, procesos: 5, reputacion: 5, economico: 4 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 4),
    nivelRiesgo: determinarNivelRiesgo(20, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2023-12-02T11:15:00Z',
    evaluadoPor: 'Equipo TI',
  },
  {
    id: 'eval-7',
    riesgoId: '7',
    impactoPersonas: 3,
    impactoLegal: 2,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 3,
    impactoEconomico: 3,
    impactoTecnologico: 2,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 3, legal: 2, ambiental: 1, procesos: 4, reputacion: 3, economico: 3 }),
    impactoMaximo: 4,
    riesgoInherente: calcularRiesgoInherente(4, 3),
    nivelRiesgo: determinarNivelRiesgo(12, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-01-05T08:20:00Z',
    evaluadoPor: 'Equipo Soporte',
  },
  {
    id: 'eval-8',
    riesgoId: '8',
    impactoPersonas: 5,
    impactoLegal: 2,
    impactoAmbiental: 0,
    impactoProcesos: 3,
    impactoReputacion: 3,
    impactoEconomico: 4,
    impactoTecnologico: 1,
    probabilidad: 4,
    impactoGlobal: calcularImpactoGlobal({ personas: 5, legal: 2, ambiental: 0, procesos: 3, reputacion: 3, economico: 4 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 4),
    nivelRiesgo: determinarNivelRiesgo(20, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-02-18T10:30:00Z',
    evaluadoPor: 'Talento Humano',
  },
  {
    id: 'eval-9',
    riesgoId: '9',
    impactoPersonas: 2,
    impactoLegal: 3,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 3,
    impactoEconomico: 5,
    impactoTecnologico: 1,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 2, legal: 3, ambiental: 1, procesos: 4, reputacion: 3, economico: 5 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-03-12T15:05:00Z',
    evaluadoPor: 'Finanzas',
  },
  {
    id: 'eval-10',
    riesgoId: '10',
    impactoPersonas: 2,
    impactoLegal: 2,
    impactoAmbiental: 1,
    impactoProcesos: 5,
    impactoReputacion: 4,
    impactoEconomico: 4,
    impactoTecnologico: 5,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 2, legal: 2, ambiental: 1, procesos: 5, reputacion: 4, economico: 4 }),
    impactoMaximo: 5,
    riesgoInherente: calcularRiesgoInherente(5, 3),
    nivelRiesgo: determinarNivelRiesgo(15, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-03-28T16:40:00Z',
    evaluadoPor: 'Infraestructura',
  },
  {
    id: 'eval-11',
    riesgoId: '11',
    impactoPersonas: 3,
    impactoLegal: 4,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 4,
    impactoEconomico: 3,
    impactoTecnologico: 4,
    probabilidad: 3,
    impactoGlobal: calcularImpactoGlobal({ personas: 3, legal: 4, ambiental: 1, procesos: 4, reputacion: 4, economico: 3 }),
    impactoMaximo: 4,
    riesgoInherente: calcularRiesgoInherente(4, 3),
    nivelRiesgo: determinarNivelRiesgo(12, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-04-05T12:50:00Z',
    evaluadoPor: 'Seguridad',
  },
  {
    id: 'eval-12',
    riesgoId: '12',
    impactoPersonas: 3,
    impactoLegal: 3,
    impactoAmbiental: 1,
    impactoProcesos: 4,
    impactoReputacion: 3,
    impactoEconomico: 4,
    impactoTecnologico: 2,
    probabilidad: 2,
    impactoGlobal: calcularImpactoGlobal({ personas: 3, legal: 3, ambiental: 1, procesos: 4, reputacion: 3, economico: 4 }),
    impactoMaximo: 4,
    riesgoInherente: calcularRiesgoInherente(4, 2),
    nivelRiesgo: determinarNivelRiesgo(8, CLASIFICACION_RIESGO.NEGATIVA),
    fechaEvaluacion: '2024-04-15T09:10:00Z',
    evaluadoPor: 'Planeacion',
  },
];

const mockPriorizaciones: PriorizacionRiesgo[] = [
  {
    id: 'prior-1',
    riesgoId: '1',
    calificacionFinal: 20,
    respuesta: RESPUESTAS_RIESGO[0], // Aceptar
    responsable: 'María Gerente',
    fechaAsignacion: '2024-01-25',
    puntajePriorizacion: 3.5,
  },
];

import { Usuario, Area } from '../../types';

// ============================================
// DATOS PERSISTENTES ADMIN (Areas, Usuarios, Procesos)
// ============================================

let mockAreas: Area[] = loadFromStorage('catalog_areas', [
  {
    id: '1',
    nombre: 'Gestión Financiera y Administrativa',
    descripcion: 'Área responsable de procesos financieros y administrativos',
    directorId: '2',
    directorNombre: 'Marco Alvarado',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Talento Humano',
    descripcion: 'Área responsable de procesos de recursos humanos',
    directorId: '7',
    directorNombre: 'Katherine Chavez',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    nombre: 'Comercial',
    descripcion: 'Área responsable de procesos comerciales y ventas',
    directorId: '3',
    directorNombre: 'Ulpiano Muñoz',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    nombre: 'Adquisiciones',
    descripcion: 'Área responsable de procesos de compras y adquisiciones',
    directorId: '15',
    directorNombre: 'Gustavo Abad',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    nombre: 'Compliance',
    descripcion: 'Área responsable de cumplimiento normativo y ética',
    directorId: '21',
    directorNombre: 'Daniela Rodriguez',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    nombre: 'Tecnología',
    descripcion: 'Área responsable de tecnología e infraestructura TI',
    directorId: '9',
    directorNombre: 'Luis Terán',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    nombre: 'Dirección',
    descripcion: 'Área de dirección estratégica',
    directorId: '28',
    directorNombre: 'Juan José Maldonado',
    activo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]);

let mockUsuarios: Usuario[] = loadFromStorage('catalog_usuarios', [
  { id: '1', nombre: 'Carlos Ayala', role: 'gerente_general', activo: false, email: 'cayala@comware.com.co', password: 'comware123', cargoNombre: 'Director General' },
  { id: '2', nombre: 'Marco Alvarado', role: 'dueño_procesos', activo: true, email: 'marco@comware.com.co', password: 'comware123', cargoNombre: 'Director Financiero Administrativo' },
  { id: '3', nombre: 'Ulpiano Muñoz', role: 'dueño_procesos', activo: true, email: 'ulpiano@comware.com.co', password: 'comware123', cargoNombre: 'Director Comercial' },
  { id: '4', nombre: 'Jaime Jara', role: 'dueño_procesos', activo: false, email: 'jaime@comware.com.co', password: 'comware123', cargoNombre: 'Director de Soluciones de TI' },
  { id: '5', nombre: 'Marlon Sanchez', role: 'dueño_procesos', activo: false, email: 'marlon@comware.com.co', password: 'comware123', cargoNombre: 'Gerente de Servicios' },
  { id: '6', nombre: 'Lizeth Chicaiza', role: 'dueño_procesos', activo: true, email: 'lizeth@comware.com.co', password: 'comware123', cargoNombre: 'Contadora' },
  { id: '7', nombre: 'Katherine Chavez', role: 'dueño_procesos', activo: true, email: 'katherine@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Talento Humano' },
  { id: '8', nombre: 'Leonel Yepez', role: 'dueño_procesos', activo: false, email: 'leonel@comware.com.co', password: 'comware123', cargoNombre: 'Coordinador de Administrativo' },
  { id: '9', nombre: 'Luis Terán', role: 'dueño_procesos', activo: true, email: 'luis@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Helpdesk' },
  { id: '10', nombre: 'Jessica Guanoluisa', role: 'dueño_procesos', activo: true, email: 'jessica@comware.com.co', password: 'comware123', cargoNombre: 'Ingeniera de Soporte' },
  { id: '11', nombre: 'Ivan Albuja', role: 'dueño_procesos', activo: true, email: 'ivan@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
  { id: '12', nombre: 'Rosa Duque', role: 'dueño_procesos', activo: false, email: 'rosa@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
  { id: '13', nombre: 'Nelson Ávila', role: 'dueño_procesos', activo: true, email: 'nelson@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
  { id: '14', nombre: 'Wladimir Benavides', role: 'dueño_procesos', activo: true, email: 'wladimir@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
  { id: '15', nombre: 'Gustavo Abad', role: 'dueño_procesos', activo: true, email: 'gustavo@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
  { id: '16', nombre: 'Mónica Cabrera', role: 'dueño_procesos', activo: true, email: 'monica@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
  { id: '17', nombre: 'Rodrigo Ochoa', role: 'dueño_procesos', activo: false, email: 'rodrigo@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
  { id: '18', nombre: 'Alexandra Santana', role: 'dueño_procesos', activo: true, email: 'alexandra@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
  { id: '19', nombre: 'Irene Alcívar', role: 'dueño_procesos', activo: true, email: 'irene@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
  { id: '20', nombre: 'Diego Romero', role: 'dueño_procesos', activo: true, email: 'diego@comware.com.co', password: 'comware123', cargoNombre: 'Ejecutivo de Experiencia al Cliente' },
  { id: '21', nombre: 'Daniela Rodriguez', role: 'dueño_procesos', activo: true, email: 'daniela@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Legal' },
  { id: '22', nombre: 'Jeimy Gualoto', role: 'dueño_procesos', activo: false, email: 'jeimy@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Administrativa' },
  { id: '23', nombre: 'Vinicio Barahona', role: 'dueño_procesos', activo: true, email: 'vinicio@comware.com.co', password: 'comware123', cargoNombre: 'Jefe Financiero' },
  { id: '24', nombre: 'Karla Armas', role: 'dueño_procesos', activo: true, email: 'karla@comware.com.co', password: 'comware123', cargoNombre: 'Analista Contable' },
  { id: '25', nombre: 'Gabriela Quiroz', role: 'dueño_procesos', activo: true, email: 'gabriela@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Administrativa' },
  { id: '26', nombre: 'Miguel Peralta', role: 'dueño_procesos', activo: true, email: 'miguel@comware.com.co', password: 'comware123', cargoNombre: 'Lider de Servicios' },
  { id: '27', nombre: 'Nathaly Freire', role: 'dueño_procesos', activo: true, email: 'nathaly@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Ventas' },
  { id: '28', nombre: 'Juan José Maldonado', role: 'gerente_general', activo: true, email: 'juanjose@comware.com.co', password: 'comware123', cargoNombre: 'Director General' },
  { id: '31', nombre: 'Alicia Robayo', role: 'dueño_procesos', activo: true, email: 'alicia@comware.com.co', password: 'comware123', cargoNombre: 'Comité de Etica' },
  { id: '29', nombre: 'Andrés Martínez', role: 'admin', activo: true, email: 'andres@comware.com.co', password: 'comware123', cargoNombre: 'Administrador' },
  { id: '30', nombre: 'Carlos Rodríguez', role: 'supervisor', activo: true, email: 'carlos@comware.com.co', password: 'comware123', cargoNombre: 'Supervisor de Riesgos' },
]);

// MIGRATION / REPAIR: Ensure demo users always have passwords even if loaded from old storage
export const demoCredentials = {
  '1': 'comware123', '2': 'comware123', '3': 'comware123', '4': 'comware123', '5': 'comware123',
  '6': 'comware123', '7': 'comware123', '8': 'comware123', '9': 'comware123', '10': 'comware123',
  '11': 'comware123', '12': 'comware123', '13': 'comware123', '14': 'comware123', '15': 'comware123',
  '16': 'comware123', '17': 'comware123', '18': 'comware123', '19': 'comware123', '20': 'comware123',
  '21': 'comware123', '22': 'comware123', '23': 'comware123', '24': 'comware123', '25': 'comware123',
  '26': 'comware123', '27': 'comware123', '28': 'comware123', '29': 'comware123', '30': 'comware123', '31': 'comware123'
};

// SANITIZATION: Remove any user with an invalid role from localStorage data
const validRoles = ['admin', 'dueño_procesos', 'supervisor', 'gerente_general'];
const hasInvalidRoles = mockUsuarios.some(u => !validRoles.includes(u.role));

if (hasInvalidRoles) {
  console.log('Detected invalid roles in storage. Resetting to default users.');
  mockUsuarios = [
    { id: '1', nombre: 'Carlos Ayala', role: 'gerente_general', activo: false, email: 'cayala@comware.com.co', password: 'comware123', cargoNombre: 'Director General' },
    { id: '2', nombre: 'Marco Alvarado', role: 'dueño_procesos', activo: true, email: 'marco@comware.com.co', password: 'comware123', cargoNombre: 'Director Financiero Administrativo' },
    { id: '3', nombre: 'Ulpiano Muñoz', role: 'dueño_procesos', activo: true, email: 'ulpiano@comware.com.co', password: 'comware123', cargoNombre: 'Director Comercial' },
    { id: '4', nombre: 'Jaime Jara', role: 'dueño_procesos', activo: false, email: 'jaime@comware.com.co', password: 'comware123', cargoNombre: 'Director de Soluciones de TI' },
    { id: '5', nombre: 'Marlon Sanchez', role: 'dueño_procesos', activo: true, email: 'marlon@comware.com.co', password: 'comware123', cargoNombre: 'Gerente de Servicios' },
    { id: '6', nombre: 'Lizeth Chicaiza', role: 'dueño_procesos', activo: true, email: 'lizeth@comware.com.co', password: 'comware123', cargoNombre: 'Contadora' },
    { id: '7', nombre: 'Katherine Chavez', role: 'dueño_procesos', activo: true, email: 'katherine@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Talento Humano' },
    { id: '8', nombre: 'Leonel Yepez', role: 'dueño_procesos', activo: true, email: 'leonel@comware.com.co', password: 'comware123', cargoNombre: 'Coordinador Administrativo' },
    { id: '9', nombre: 'Luis Terán', role: 'dueño_procesos', activo: true, email: 'luis@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Helpdesk' },
    { id: '10', nombre: 'Jessica Guanoluisa', role: 'dueño_procesos', activo: true, email: 'jessica@comware.com.co', password: 'comware123', cargoNombre: 'Ingeniera de Servicios' },
    { id: '11', nombre: 'Ivan Albuja', role: 'dueño_procesos', activo: true, email: 'ivan@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
    { id: '12', nombre: 'Rosa Duque', role: 'dueño_procesos', activo: false, email: 'rosa@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
    { id: '13', nombre: 'Nelson Ávila', role: 'dueño_procesos', activo: true, email: 'nelson@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
    { id: '14', nombre: 'Wladimir Benavides', role: 'dueño_procesos', activo: true, email: 'wladimir@comware.com.co', password: 'comware123', cargoNombre: 'Jefe de Producto' },
    { id: '15', nombre: 'Gustavo Abad', role: 'dueño_procesos', activo: true, email: 'gustavo@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
    { id: '16', nombre: 'Mónica Cabrera', role: 'dueño_procesos', activo: true, email: 'monica@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
    { id: '17', nombre: 'Rodrigo Ochoa', role: 'dueño_procesos', activo: false, email: 'rodrigo@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
    { id: '18', nombre: 'Alexandra Santana', role: 'dueño_procesos', activo: true, email: 'alexandra@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
    { id: '19', nombre: 'Irene Alcívar', role: 'dueño_procesos', activo: true, email: 'irene@comware.com.co', password: 'comware123', cargoNombre: 'Asesor Comercial' },
    { id: '20', nombre: 'Diego Romero', role: 'dueño_procesos', activo: true, email: 'diego@comware.com.co', password: 'comware123', cargoNombre: 'Ejecutivo de Experiencia al Cliente' },
    { id: '21', nombre: 'Daniela Rodriguez', role: 'dueño_procesos', activo: true, email: 'daniela@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Legal' },
    { id: '22', nombre: 'Jeimy Gualoto', role: 'dueño_procesos', activo: false, email: 'jeimy@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Administrativa' },
    { id: '23', nombre: 'Vinicio Barahona', role: 'dueño_procesos', activo: true, email: 'vinicio@comware.com.co', password: 'comware123', cargoNombre: 'Jefe Financiero' },
    { id: '24', nombre: 'Karla Armas', role: 'dueño_procesos', activo: true, email: 'karla@comware.com.co', password: 'comware123', cargoNombre: 'Analista Contable' },
    { id: '25', nombre: 'Gabriela Quiroz', role: 'dueño_procesos', activo: true, email: 'gabriela@comware.com.co', password: 'comware123', cargoNombre: 'Asistente Administrativa' },
    { id: '26', nombre: 'Miguel Peralta', role: 'dueño_procesos', activo: true, email: 'miguel@comware.com.co', password: 'comware123', cargoNombre: 'Coordinador de Proyectos' },
    { id: '27', nombre: 'Nathaly Freire', role: 'dueño_procesos', activo: true, email: 'nathaly@comware.com.co', password: 'comware123', cargoNombre: 'Analista de Ventas' },
    { id: '28', nombre: 'Juan José Maldonado', role: 'gerente_general', activo: true, email: 'juanjose@comware.com.co', password: 'comware123', cargoNombre: 'Director General' },
    { id: '29', nombre: 'Andrés Martínez', role: 'admin', activo: true, email: 'andres@comware.com.co', password: 'comware123', cargoNombre: 'Administrador' },
    { id: '30', nombre: 'Carlos Rodríguez', role: 'supervisor', activo: true, email: 'carlos@comware.com.co', password: 'comware123', cargoNombre: 'Supervisor de Riesgos' },
    { id: '14', nombre: 'Jaime Jara', role: 'dueño_procesos', activo: false, email: 'jaime@comware.com.co', password: 'comware123', cargoNombre: 'Director de Soluciones de TI' },
    { id: '15', nombre: 'Alicia Robayo', role: 'dueño_procesos', activo: true, email: 'alicia@comware.com.co', password: 'comware123', cargoNombre: 'Comité de Etica' },
    { id: '16', nombre: 'Leonel Yepez', role: 'dueño_procesos', activo: false, email: 'leonel@comware.com.co', password: 'comware123', cargoNombre: 'Coordinador de Administrativo' },
  ];
  saveToStorage('catalog_usuarios', mockUsuarios);
}

mockUsuarios = mockUsuarios.map(u => {
  if (demoCredentials[u.id] && !u.password) {
    return { ...u, password: demoCredentials[u.id] };
  }
  return u;
});

let mockProcesos: Proceso[] = loadFromStorage('catalog_procesos', [
  {
    id: '1',
    nombre: 'Direccionamiento Estratégico',
    descripcion: 'Gestión del direccionamiento estratégico de la organización',
    vicepresidencia: '6',  // ID de Vicepresidencia de Dirección
    gerencia: '12',  // ID de Gerencia de Dirección Estratégica
    responsable: 'Marco Alvarado',
    responsableId: '2',
    responsableNombre: 'Marco Alvarado',
    areaId: '1',
    areaNombre: 'Dirección',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Definir y dirigir la estrategia organizacional',
    tipoProceso: '1',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '2',
    nombre: 'Planificación Financiera',
    descripcion: 'Gestión de planificación y presupuesto financiero',
    vicepresidencia: '1',  // ID de Vicepresidencia Financiera
    gerencia: '1',  // ID de Gerencia de Planificación Financiera
    responsable: 'Marco Alvarado',
    responsableId: '2',
    responsableNombre: 'Marco Alvarado',
    areaId: '1',
    areaNombre: 'Gestión Financiera y Administrativa',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Planificar y gestionar los recursos financieros de la organización',
    tipoProceso: '1',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '3',
    nombre: 'Compliance',
    descripcion: 'Gestión de cumplimiento normativo y legal',
    vicepresidencia: '5',  // ID de Vicepresidencia de Compliance
    gerencia: '9',  // ID de Gerencia de Compliance y Legal
    responsable: 'Marco Alvarado',
    responsableId: '2',
    responsableNombre: 'Marco Alvarado',
    areaId: '1',
    areaNombre: 'Compliance',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Garantizar el cumplimiento normativo y legal',
    tipoProceso: '1',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '4',
    nombre: 'Gestión Comercial',
    descripcion: 'Gestión de ventas y actividades comerciales',
    vicepresidencia: '4',  // ID de Vicepresidencia Comercial
    gerencia: '5',  // ID de Gerencia de Ventas
    responsable: 'Ulpiano Muñoz',
    responsableId: '3',
    responsableNombre: 'Ulpiano Muñoz',
    areaId: '2',
    areaNombre: 'Comercial',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar las actividades comerciales y de ventas',
    tipoProceso: '2',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '5',
    nombre: 'Gestión de Proveedores y Adquisiciones',
    descripcion: 'Gestión de proveedores y proceso de adquisiciones',
    vicepresidencia: '3',  // ID de Vicepresidencia de Operaciones
    gerencia: '14',  // ID de Gerencia de Logística
    responsable: 'Karla Armas',
    responsableId: '6',
    responsableNombre: 'Karla Armas',
    areaId: '2',
    areaNombre: 'Adquisiciones',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar la cadena de suministro y adquisiciones',
    tipoProceso: '2',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '6',
    nombre: 'Ciberseguridad',
    descripcion: 'Gestión de ciberseguridad y protección de activos digitales',
    vicepresidencia: '7',  // ID de Vicepresidencia de Tecnología
    gerencia: '15',  // ID de Gerencia de Innovación y Tecnología
    responsable: 'Marlon Sanchez',
    responsableId: '7',
    responsableNombre: 'Marlon Sanchez',
    areaId: '3',
    areaNombre: 'Tecnología',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Proteger los activos digitales y garantizar la ciberseguridad',
    tipoProceso: '2',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '7',
    nombre: 'Gestión de Soporte y Postventa',
    descripcion: 'Gestión de soporte técnico y servicios postventa',
    vicepresidencia: '3',  // ID de Vicepresidencia de Operaciones
    gerencia: '11',  // ID de Gerencia de Soporte Técnico
    responsable: 'Miguel Peralta',
    responsableId: '8',
    responsableNombre: 'Miguel Peralta',
    areaId: '2',
    areaNombre: 'Soporte',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Brindar soporte técnico y servicios postventa de calidad',
    tipoProceso: '2',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-07T00:00:00Z',
    updatedAt: '2024-01-07T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '8',
    nombre: 'Gestión de Talento Humano',
    descripcion: 'Gestión de recursos humanos y talento humano',
    vicepresidencia: 'Vicepresidencia de Talento Humano',
    gerencia: 'Gerencia de Talento Humano',
    responsable: 'Marco Alvarado',
    responsableId: '2',
    responsableNombre: 'Marco Alvarado',
    areaId: '2',
    areaNombre: 'Talento Humano',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar eficientemente el capital humano de la organización',
    tipoProceso: '3',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-08T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '9',
    nombre: 'Gestión de Finanzas y Administración',
    descripcion: 'Gestión financiera y administrativa',
    vicepresidencia: 'Vicepresidencia Financiera',
    gerencia: 'Gerencia de Finanzas',
    responsable: 'Lizeth Chicaiza',
    responsableId: '9',
    responsableNombre: 'Lizeth Chicaiza',
    areaId: '1',
    areaNombre: 'Gestión Financiera y Administrativa',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Administrar los recursos financieros y administrativos',
    tipoProceso: '3',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-09T00:00:00Z',
    updatedAt: '2024-01-09T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '10',
    nombre: 'Gestión de TICS',
    descripcion: 'Gestión de tecnologías de información y comunicaciones',
    vicepresidencia: 'Vicepresidencia de Tecnología',
    gerencia: 'Gerencia de TICS',
    responsable: 'Luis Terán',
    responsableId: '10',
    responsableNombre: 'Luis Terán',
    areaId: '3',
    areaNombre: 'Tecnología',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Gestionar la infraestructura tecnológica',
    tipoProceso: '3',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
    puedeCrear: [],
  },
  {
    id: '11',
    nombre: 'Gestión de Seguridad de la Información',
    descripcion: 'Gestión de seguridad de la información',
    vicepresidencia: 'Vicepresidencia de Tecnología',
    gerencia: 'Gerencia de Seguridad',
    responsable: 'Jessica Guanoluisa',
    responsableId: '11',
    responsableNombre: 'Jessica Guanoluisa',
    areaId: '3',
    areaNombre: 'Seguridad de la Información',
    directorId: '30',
    directorNombre: 'Carlos Rodríguez',
    objetivoProceso: 'Garantizar la seguridad de la información',
    tipoProceso: '3',
    activo: true,
    estado: 'borrador',
    createdAt: '2024-01-11T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
    puedeCrear: [],
  },
]);

// MIGRATION: Ensure demo owner has at least one proceso assigned
const hasMarcoProcesos = mockProcesos.some((p) => p.responsableId === '2');
if (!hasMarcoProcesos && mockProcesos.length > 0) {
  const procesoBase = mockProcesos[0];
  const actualizado = {
    ...procesoBase,
    responsable: 'Marco Alvarado',
    responsableId: '2',
    responsableNombre: 'Marco Alvarado',
    updatedAt: new Date().toISOString(),
  };
  mockProcesos = [actualizado, ...mockProcesos.slice(1)];
  saveToStorage('catalog_procesos', mockProcesos);
}

const defaultAsignaciones = {
  areas: mockAreas.map((a) => String(a.id)),
  procesos: mockProcesos.map((p) => String(p.id)),
};

ensureStorage('gg_director_1', defaultAsignaciones);
ensureStorage('gg_proceso_1', defaultAsignaciones);

// Force supervisor to have all procesos/areas assigned
saveToStorage('gg_director_30', defaultAsignaciones);

// EXPORT FUNCTIONS FOR ADMIN CATALOGS

export function getMockAreas(): Area[] { return mockAreas; }
export function updateMockAreas(data: Area[]): Area[] {
  mockAreas = data;
  saveToStorage('catalog_areas', data);
  return data;
}

export function getMockUsuarios(): Usuario[] { return mockUsuarios; }
export function updateMockUsuarios(data: Usuario[]): Usuario[] {
  mockUsuarios = data;
  saveToStorage('catalog_usuarios', data);
  return data;
}

export function getMockProcesos(): Proceso[] { return mockProcesos; }
export function updateMockProcesos(data: Proceso[]): Proceso[] {
  mockProcesos = data;
  saveToStorage('catalog_procesos', data);
  return data;
}


// ============================================
// EXPORTED FUNCTIONS
// ============================================

export function getMockPasosProceso() { return mockPasosProceso; }
export function createMockPasoProceso(data: any) { const n = { id: `paso-${Date.now()}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; mockPasosProceso.push(n); return n; }
export function updateMockPasoProceso(id: string, data: any) { const i = mockPasosProceso.findIndex(p => p.id === id); if (i === -1) return null; mockPasosProceso[i] = { ...mockPasosProceso[i], ...data, updatedAt: new Date().toISOString() }; return mockPasosProceso[i]; }
export function deleteMockPasoProceso(id: string) { const i = mockPasosProceso.findIndex(p => p.id === id); if (i !== -1) mockPasosProceso.splice(i, 1); }

export function getMockEncuestas() { return mockEncuestas; }
export function getMockEncuestaById(id: string) { return mockEncuestas.find(e => e.id === id); }
export function createMockEncuesta(data: any) { const n = { id: `encuesta-${Date.now()}`, ...data, activa: data.activa !== undefined ? data.activa : true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; mockEncuestas.push(n); return n; }
export function updateMockEncuesta(id: string, data: any) { const i = mockEncuestas.findIndex(e => e.id === id); if (i === -1) return null; mockEncuestas[i] = { ...mockEncuestas[i], ...data, updatedAt: new Date().toISOString() }; return mockEncuestas[i]; }
export function deleteMockEncuesta(id: string) { const i = mockEncuestas.findIndex(e => e.id === id); if (i !== -1) mockEncuestas.splice(i, 1); }

export function getMockPreguntasEncuesta(encuestaId: string) { return mockPreguntasEncuesta.filter(p => p.encuestaId === encuestaId); }
export function createMockPreguntaEncuesta(data: any) { const n = { id: `pregunta-${Date.now()}`, ...data, createdAt: new Date().toISOString() }; mockPreguntasEncuesta.push(n); return n; }
export function updateMockPreguntaEncuesta(id: string, data: any) { const i = mockPreguntasEncuesta.findIndex(p => p.id === id); if (i === -1) return null; mockPreguntasEncuesta[i] = { ...mockPreguntasEncuesta[i], ...data }; return mockPreguntasEncuesta[i]; }
export function deleteMockPreguntaEncuesta(id: string) { const i = mockPreguntasEncuesta.findIndex(p => p.id === id); if (i !== -1) mockPreguntasEncuesta.splice(i, 1); }

export function getMockListasValores() { return mockListasValores; }
export function getMockListaValoresById(id: string) { return mockListasValores.find(l => l.id === id); }
export function updateMockListaValores(id: string, data: any) { const i = mockListasValores.findIndex(l => l.id === id); if (i === -1) return null; mockListasValores[i] = { ...mockListasValores[i], ...data, updatedAt: new Date().toISOString() }; return mockListasValores[i]; }

export function getMockParametrosValoracion() { return mockParametrosValoracion; }
export function getMockParametroValoracionById(id: string) { return mockParametrosValoracion.find(p => p.id === id); }
export function updateMockParametroValoracion(id: string, data: any) { const i = mockParametrosValoracion.findIndex(p => p.id === id); if (i === -1) return null; mockParametrosValoracion[i] = { ...mockParametrosValoracion[i], ...data, updatedAt: new Date().toISOString() }; return mockParametrosValoracion[i]; }

export function getMockTipologias() { return mockTipologias; }
export function getMockTipologiaById(id: string) { return mockTipologias.find(t => t.id === id); }
export function createMockTipologia(data: any) { const n = { id: `tipologia-${Date.now()}`, ...data, activa: data.activa !== undefined ? data.activa : true, createdAt: new Date().toISOString() }; mockTipologias.push(n); return n; }
export function updateMockTipologia(id: string, data: any) { const i = mockTipologias.findIndex(t => t.id === id); if (i === -1) return null; mockTipologias[i] = { ...mockTipologias[i], ...data, updatedAt: new Date().toISOString() }; return mockTipologias[i]; }
export function deleteMockTipologia(id: string) { const i = mockTipologias.findIndex(t => t.id === id); if (i !== -1) mockTipologias.splice(i, 1); }

export function getMockFormulas() { return mockFormulas; }
export function getMockFormulaById(id: string) { return mockFormulas.find(f => f.id === id); }
export function createMockFormula(data: any) { const n = { id: `formula-${Date.now()}`, ...data, activa: data.activa !== undefined ? data.activa : true, createdAt: new Date().toISOString() }; mockFormulas.push(n); return n; }
export function updateMockFormula(id: string, data: any) { const i = mockFormulas.findIndex(f => f.id === id); if (i === -1) return null; mockFormulas[i] = { ...mockFormulas[i], ...data, updatedAt: new Date().toISOString() }; return mockFormulas[i]; }
export function deleteMockFormula(id: string) { const i = mockFormulas.findIndex(f => f.id === id); if (i !== -1) mockFormulas.splice(i, 1); }

export function getMockConfiguraciones() { return mockConfiguraciones; }
export function updateMockConfiguracion(id: string, data: any) { const i = mockConfiguraciones.findIndex(c => c.id === id); if (i === -1) return null; mockConfiguraciones[i] = { ...mockConfiguraciones[i], ...data }; return mockConfiguraciones[i]; }

export function getMockObservaciones(procesoId: string) { return mockObservaciones.filter(o => o.procesoId === procesoId); }
export function createMockObservacion(data: any) { const n = { id: `obs-${Date.now()}`, ...data, createdAt: new Date().toISOString() }; mockObservaciones.push(n); return n; }
export function updateMockObservacion(id: string, data: any) { const i = mockObservaciones.findIndex(o => o.id === id); if (i === -1) return null; mockObservaciones[i] = { ...mockObservaciones[i], ...data, updatedAt: new Date().toISOString() }; return mockObservaciones[i]; }

export function getMockHistorial(procesoId: string) { return mockHistorial.filter(h => h.procesoId === procesoId); }
export function createMockHistorial(data: any) { const n = { id: `hist-${Date.now()}`, ...data, fecha: data.fecha || new Date().toISOString(), createdAt: new Date().toISOString() }; mockHistorial.push(n); return n; }

export function getMockTareas() { return mockTareas; }
export function createMockTarea(data: any) { const n = { id: `tarea-${Date.now()}`, ...data, estado: data.estado || 'pendiente', completada: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; mockTareas.push(n); return n; }
export function updateMockTarea(id: string, data: any) { const i = mockTareas.findIndex(t => t.id === id); if (i === -1) return null; mockTareas[i] = { ...mockTareas[i], ...data, updatedAt: new Date().toISOString() }; return mockTareas[i]; }

export function getMockNotificaciones() { return mockNotificaciones; }
export function createMockNotificacion(data: any) { const n = { id: `notif-${Date.now()}`, ...data, leida: false, createdAt: new Date().toISOString() }; mockNotificaciones.push(n); return n; }
export function updateMockNotificacion(id: string, data: any) { const i = mockNotificaciones.findIndex(n => n.id === id); if (i === -1) return null; mockNotificaciones[i] = { ...mockNotificaciones[i], ...data }; return mockNotificaciones[i]; }

export function getMockTiposRiesgos(): TipoRiesgo[] { return mockTiposRiesgos; }
export function updateMockTiposRiesgos(data: TipoRiesgo[]): TipoRiesgo[] {
  mockTiposRiesgos = data;
  saveToStorage('catalog_tipos_riesgo', data);
  return data;
}

export function getMockObjetivos(): Objetivo[] { return mockObjetivos; }
export function updateMockObjetivos(data: Objetivo[]): Objetivo[] {
  mockObjetivos = data;
  saveToStorage('catalog_objetivos', data);
  return data;
}

export function getMockFrecuencias(): Frecuencia[] { return mockFrecuencias; }
export function updateMockFrecuencias(data: Frecuencia[]): Frecuencia[] {
  mockFrecuencias = data;
  saveToStorage('catalog_frecuencias', data);
  return data;
}

export function getMockFuentes(): Fuente[] { return mockFuentes; }
export function updateMockFuentes(data: Fuente[]): Fuente[] {
  mockFuentes = data;
  saveToStorage('catalog_fuentes', data);
  return data;
}

export function getMockImpactos(): ImpactoDescripcion[] { return mockImpactos; }
export function updateMockImpactos(data: ImpactoDescripcion[]): ImpactoDescripcion[] {
  mockImpactos = data;
  saveToStorage('catalog_impactos_list', data);
  return data;
}

export function getMockOrigenes() { return mockOrigenes; }
export function updateMockOrigenes(data: any[]) {
  mockOrigenes = data;
  saveToStorage('catalog_origenes', data);
  return data;
}

export function getMockTiposProceso() { return mockTiposProceso; }
export function updateMockTiposProceso(data: any[]) {
  mockTiposProceso = data;
  saveToStorage('catalog_tipos_proceso_v2', data);
  return data;
}

export function getMockConsecuencias() { return mockConsecuencias; }
export function updateMockConsecuencias(data: any[]) {
  mockConsecuencias = data;
  saveToStorage('catalog_consecuencias', data);
  return data;
}

// ============================================
// NEW CORPORATE CATALOGS
// ============================================

import { Vicepresidencia, Gerencia } from '../../types';

let mockVicepresidencias: Vicepresidencia[] = loadFromStorage('catalog_vicepresidencias', [
  { id: '1', nombre: 'Vicepresidencia Financiera', sigla: 'VPF' },
  { id: '2', nombre: 'Vicepresidencia de Talento Humano', sigla: 'VPTH' },
  { id: '3', nombre: 'Vicepresidencia de Operaciones', sigla: 'VPO' },
  { id: '4', nombre: 'Vicepresidencia Comercial', sigla: 'VPC' },
  { id: '5', nombre: 'Vicepresidencia de Compliance', sigla: 'VPCO' },
  { id: '6', nombre: 'Vicepresidencia de Dirección', sigla: 'VPD' },
  { id: '7', nombre: 'Vicepresidencia de Tecnología', sigla: 'VPT' },
]);

let mockGerencias: Gerencia[] = loadFromStorage('catalog_gerencias_v2', [
  { id: '1', nombre: 'Gerencia de Planificación Financiera', sigla: 'GPF', subdivision: 'Vicepresidencia Financiera' },
  { id: '2', nombre: 'Gerencia de Contabilidad', sigla: 'GCNT', subdivision: 'Vicepresidencia Financiera' },
  { id: '3', nombre: 'Gerencia de Desarrollo Humano', sigla: 'GDH', subdivision: 'Vicepresidencia de Recursos Humanos' },
  { id: '4', nombre: 'Gerencia de Infraestructura', sigla: 'GI', subdivision: 'Vicepresidencia de Tecnología' },
  { id: '5', nombre: 'Gerencia de Ventas', sigla: 'GV', subdivision: 'Vicepresidencia Comercial' },
  { id: '6', nombre: 'Gerencia de Marketing', sigla: 'GM', subdivision: 'Vicepresidencia Comercial' },
  { id: '7', nombre: 'Gerencia de Operaciones', sigla: 'GO', subdivision: 'Vicepresidencia de Recursos Humanos' },
  { id: '8', nombre: 'Gerencia de Calidad', sigla: 'GC', subdivision: 'Vicepresidencia Financiera' },
  { id: '9', nombre: 'Gerencia de Compliance y Legal', sigla: 'GCL', subdivision: 'Vicepresidencia de Compliance' },
  { id: '10', nombre: 'Gerencia de Seguridad y Protección', sigla: 'GSP', subdivision: 'Vicepresidencia de Compliance' },
  { id: '11', nombre: 'Gerencia de Soporte Técnico', sigla: 'GST', subdivision: 'Vicepresidencia de Tecnología' },
  { id: '12', nombre: 'Gerencia de Dirección Estratégica', sigla: 'GDE', subdivision: 'Vicepresidencia de Dirección' },
  { id: '13', nombre: 'Gerencia de Procesos y Calidad', sigla: 'GPC', subdivision: 'Vicepresidencia de Operaciones' },
  { id: '14', nombre: 'Gerencia de Logística', sigla: 'GL', subdivision: 'Vicepresidencia de Operaciones' },
  { id: '15', nombre: 'Gerencia de Innovación y Tecnología', sigla: 'GIT', subdivision: 'Vicepresidencia de Tecnología' },
  { id: '16', nombre: 'Gerencia de Administración', sigla: 'GA', subdivision: 'Vicepresidencia Financiera' },
]);

export function getMockVicepresidencias(): Vicepresidencia[] { return mockVicepresidencias; }
export function updateMockVicepresidencias(data: Vicepresidencia[]): Vicepresidencia[] {
  mockVicepresidencias = data;
  saveToStorage('catalog_vicepresidencias', data);
  return data;
}

export function getMockGerencias(): Gerencia[] { return mockGerencias; }
export function updateMockGerencias(data: Gerencia[]): Gerencia[] {
  mockGerencias = data;
  saveToStorage('catalog_gerencias_v2', data);
  return data;
}

import { Cargo } from '../../types';

let mockCargos: Cargo[] = loadFromStorage('catalog_cargos', [
  { id: '1', nombre: 'Analista de Riesgos' },
  { id: '2', nombre: 'Gerente de Área' },
  { id: '3', nombre: 'Director de Procesos' },
  { id: '4', nombre: 'Auditor Junior' },
]);

export function getMockCargos(): Cargo[] { return mockCargos; }
export function updateMockCargos(data: Cargo[]): Cargo[] {
  mockCargos = data;
  saveToStorage('catalog_cargos', data);
  return data;
}

export function getMockCausas() { return mockCausas; }

export function getMockRiesgos(filtros?: FiltrosRiesgo): PaginatedResponse<Riesgo> {
  let filtered = [...getCurrentRiesgos()];
  if (filtros?.procesoId) filtered = filtered.filter(r => r.procesoId === filtros.procesoId);
  if (filtros?.busqueda) { const s = filtros.busqueda.toLowerCase(); filtered = filtered.filter(r => r.descripcion.toLowerCase().includes(s) || r.numero.toString().includes(s)); }
  if (filtros?.clasificacion && filtros.clasificacion !== 'all') filtered = filtered.filter(r => r.clasificacion === filtros.clasificacion);
  if (filtros?.proceso) filtered = filtered.filter(r => r.proceso === filtros.proceso);
  if (filtros?.zona) filtered = filtered.filter(r => r.zona === filtros.zona);

  const page = filtros?.page || 1;
  const pageSize = filtros?.pageSize || 10;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { data: paginated, total: filtered.length, page, pageSize, totalPages: Math.ceil(filtered.length / pageSize) };
}

export function getMockEvaluacionesByRiesgo(riesgoId: string): EvaluacionRiesgo[] { return mockEvaluaciones.filter(e => e.riesgoId === riesgoId); }

export function getMockEstadisticas(procesoId?: string): EstadisticasRiesgo {
  let riesgosFiltrados = getCurrentRiesgos();
  if (procesoId) riesgosFiltrados = getCurrentRiesgos().filter(r => r.procesoId === procesoId);
  const evaluados = mockEvaluaciones.filter(e => riesgosFiltrados.find(r => r.id === e.riesgoId)).length;
  const sinEvaluar = riesgosFiltrados.length - evaluados;
  const evaluacionesFiltradas = mockEvaluaciones.filter((e) => riesgosFiltrados.find((r) => r.id === e.riesgoId));
  const niveles = evaluacionesFiltradas.reduce((acc, ev) => {
    if (ev.nivelRiesgo === NIVELES_RIESGO.CRITICO) acc.criticos++;
    else if (ev.nivelRiesgo === NIVELES_RIESGO.ALTO) acc.altos++;
    else if (ev.nivelRiesgo === NIVELES_RIESGO.MEDIO) acc.medios++;
    else acc.bajos++;
    return acc;
  }, { criticos: 0, altos: 0, medios: 0, bajos: 0 });
  const positivos = riesgosFiltrados.filter(r => r.clasificacion === CLASIFICACION_RIESGO.POSITIVA).length;
  return { totalRiesgos: riesgosFiltrados.length, criticos: niveles.criticos, altos: niveles.altos, medios: niveles.medios, bajos: niveles.bajos, positivos, negativos: riesgosFiltrados.length - positivos, evaluados, sinEvaluar };
}

export function getMockRiesgosRecientes(limit: number = 10): RiesgoReciente[] {
  return getCurrentRiesgos().map(r => { const e = mockEvaluaciones.find(ev => ev.riesgoId === r.id); return { ...r, evaluacion: e, fechaUltimaModificacion: r.updatedAt || r.createdAt || '' }; }).sort((a, b) => new Date(b.fechaUltimaModificacion).getTime() - new Date(a.fechaUltimaModificacion).getTime()).slice(0, limit);
}

export function getMockPuntosMapa(filtros?: { clasificacion?: string; procesoId?: string }): PuntoMapa[] {
  return mockEvaluaciones.map(e => {
    const r = getCurrentRiesgos().find(r => r.id === e.riesgoId);
    if (!r) return null;
    if (filtros?.procesoId && r.procesoId !== filtros.procesoId) return null;
    if (filtros?.clasificacion && filtros.clasificacion !== 'all' && r.clasificacion !== filtros.clasificacion) return null;
    return { riesgoId: r.id, descripcion: r.descripcion, probabilidad: e.probabilidad, impacto: e.impactoMaximo, nivelRiesgo: e.nivelRiesgo, clasificacion: r.clasificacion, numero: r.numero, siglaGerencia: r.siglaGerencia };
  }).filter(p => p !== null) as PuntoMapa[];
}

export function getMockPriorizaciones(): PriorizacionRiesgo[] { return mockPriorizaciones.map(p => { const r = getCurrentRiesgos().find(ri => ri.id === p.riesgoId); const e = mockEvaluaciones.find(ev => ev.riesgoId === p.riesgoId); return { ...p, riesgo: r, evaluacion: e }; }); }

export function createMockEvaluacion(data: any): EvaluacionRiesgo {
  const r = getCurrentRiesgos().find(ri => ri.id === data.riesgoId);
  if (!r) throw new Error('Riesgo no encontrado');
  const im = calcularImpactoMaximo({
    personas: data.impactoPersonas,
    legal: data.impactoLegal,
    ambiental: data.impactoAmbiental,
    procesos: data.impactoProcesos,
    reputacion: data.impactoReputacion,
    economico: data.impactoEconomico,
    confidencialidadSGSI: data.impactoConfidencialidadSGSI,
    disponibilidadSGSI: data.impactoDisponibilidadSGSI,
    integridadSGSI: data.impactoIntegridadSGSI
  });
  const ri = calcularRiesgoInherente(im, data.probabilidad);
  const n: EvaluacionRiesgo = { id: `eval-${Date.now()}`, ...data, impactoGlobal: im, impactoMaximo: im, riesgoInherente: ri, nivelRiesgo: determinarNivelRiesgo(ri, r.clasificacion as any), fechaEvaluacion: new Date().toISOString(), evaluadoPor: 'Usuario' };
  mockEvaluaciones.push(n);
  return n;
}

// MOCK DATA FOR DASHBOARD SUPERVISOR
export const mockPlanesAccion = [
  { id: '1', riesgo: 'R001', descripcion: 'Implementar controles de acceso', responsable: 'Juan Perez', fechaInicio: '2024-02-01', fechaFin: '2024-03-01', avance: 50, estado: 'En proceso' },
  { id: '2', riesgo: 'R002', descripcion: 'Capacitación en seguridad', responsable: 'Maria Lopez', fechaInicio: '2024-02-15', fechaFin: '2024-03-15', avance: 20, estado: 'Pendiente' },
  { id: '3', riesgo: 'R003', descripcion: 'Revisión de políticas', responsable: 'Carlos Ruiz', fechaInicio: '2024-01-01', fechaFin: '2024-01-31', avance: 100, estado: 'Completado' },
];

export const mockIncidencias = [
  { id: '1', titulo: 'Fallo en servidor', fecha: '2024-02-05', severidad: 'Alta', estado: 'Abierto' },
  { id: '2', titulo: 'Error en reporte', fecha: '2024-02-04', severidad: 'Media', estado: 'Cerrado' },
];

export function getMockPlanesAccion() { return mockPlanesAccion; }
export function getMockIncidencias() { return mockIncidencias; }

export function createMockPriorizacion(data: any): PriorizacionRiesgo {
  const e = mockEvaluaciones.find(ev => ev.riesgoId === data.riesgoId);
  if (!e) throw new Error('Evaluación no encontrada');
  const n: PriorizacionRiesgo = { id: `prior-${Date.now()}`, ...data, calificacionFinal: e.riesgoInherente, fechaAsignacion: new Date().toISOString().split('T')[0] };
  mockPriorizaciones.push(n);
  return n;
}


export function getMockProcesoById(id: string) { return mockProcesos.find(p => p.id === id); }
export function createMockProceso(data: any) {
  const n = { id: `proc-${Date.now()}`, ...data, activo: true, estado: 'borrador', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), puedeCrear: [] };
  mockProcesos.push(n);
  saveToStorage('catalog_procesos', mockProcesos);
  return n;
}
export function updateMockProceso(id: string, data: any) {
  const i = mockProcesos.findIndex(p => p.id === id);
  if (i === -1) return null;
  mockProcesos[i] = { ...mockProcesos[i], ...data, updatedAt: new Date().toISOString() };
  saveToStorage('catalog_procesos', mockProcesos);
  return mockProcesos[i];
}
export function deleteMockProceso(id: string) {
  const i = mockProcesos.findIndex(p => p.id === id);
  if (i !== -1) {
    mockProcesos.splice(i, 1);
    saveToStorage('catalog_procesos', mockProcesos);
  }
}
export function duplicateMockProceso(id: string) {
  const p = mockProcesos.find(p => p.id === id);
  if (!p) return null;
  const n = { ...p, id: `proc-${Date.now()}`, nombre: `${p.nombre} (Copia)`, createdAt: new Date().toISOString() };
  mockProcesos.push(n);
  saveToStorage('catalog_procesos', mockProcesos);
  return n;
}

// ============================================
// DATOS MOCKEADOS PAGE IDENTIFICACION
// ============================================

export let LABELS_FRECUENCIA: Record<number, { label: string; descripcion: string }> = loadFromStorage('catalog_labels_frecuencia', {
  1: { label: 'Raro', descripcion: 'mayor a anual' },
  2: { label: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
  3: { label: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
  4: { label: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
  5: { label: 'Esperado', descripcion: 'diaria o varias veces al día' },
});

export function getLabelsFrecuencia() { return LABELS_FRECUENCIA; }
export function updateLabelsFrecuencia(data: any) {
  LABELS_FRECUENCIA = data;
  saveToStorage('catalog_labels_frecuencia', data);
  return data;
}

export let FUENTES_CAUSA: Record<number, string> = loadFromStorage('catalog_fuentes_causa', {
  1: 'Personas',
  2: 'Proceso',
  3: 'Legal',
  4: 'Infraestructura',
  5: 'Externos',
});

export function getFuentesCausa() { return FUENTES_CAUSA; }
export function updateFuentesCausa(data: any) {
  FUENTES_CAUSA = data;
  saveToStorage('catalog_fuentes_causa', data);
  return data;
}

export let DESCRIPCIONES_IMPACTO: Record<number | string, Record<number, string>> = loadFromStorage('catalog_descripciones_impacto', {
  '1': { // Ambiental
    1: 'Sin afectación ambiental. Sin modificaciones en el ambiente',
    2: "'- El evento ocasiona (-) ó ayuda a mejorar (+) las emisiones, vertimientos o desechos con afectación ambiental leve. \r\n- Acciones para la corrección ó mejoramiento del ambiente a corto plazo (1 a 29 días).",
    3: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental localizada.\r\n- Acciones para la corrección ó mejoramiento del ambiente a mediano plazo (30 a 90 días)",
    4: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental grave con pérdida de capacidad productiva del ecosistema.\r\n- Acciones para la corrección ó mejoramiento del ambiente en el largo plazo (> 90 días)",
    5: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con daño ambiental irreparable/nocivo a nivel interno y/o externo\r\n- Acciones para la compensación (-) ó mejoramiento (+) a daños irreparables a recursos naturales o ecosistema.",
  },
  '2': { // Confidencialidad
    1: 'El activo de información no se encuentra expuesto a acceso no autorizado',
    2: 'Exposición de información pública interna a externos (Proveedores, clientes, etc.).',
    3: 'Exposición de información confidencial y secreta a personal interno no autorizado (personal a quien no fue dirigida esa información).',
    4: 'Exposición de información confidencial a externos (Proveedores, clientes, etc.)',
    5: 'Exposición de información secreta a externos (Proveedores, clientes, etc.).',
  },
  '3': { // Disponibilidad SGSI
    1: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.',
    2: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.',
    3: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía',
    4: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales',
    5: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes',
  },
  '4': { // Económico
    1: 'Variación (+ ó -) en los recursos financieros de hasta $2K USD',
    2: 'Variación (+ ó -) en los recursos financieros de hasta $14,5K USD',
    3: 'Variación (+ ó -) en los recursos financieros de de hasta $33,8K USD',
    4: 'Variación (+ ó -) en los recursos financieros de hasta $85,9K USD',
    5: 'Variación (+ ó -) en los recursos financieros superior a $85,9K USD',
  },
  '5': { // Integridad SGSI
    1: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.',
    2: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.',
    3: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía',
    4: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales',
    5: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes',
  },
  '6': { // Legal
    1: '- Queja ante autoridad administrativa. (-)\r\n- Sin modificaciones en el ambiente normativo/legal de la compañía. (+)',
    2: '- Observaciones por parte del ente regulador con plazo para cumplimiento de acciones. (-)\r\n- El evento ocasiona cumplimiento total y/o cierre de brechas para el cumplimiento de las normativas legales. (+)',
    3: '- Indemnizaciones, multas o sanciones por incumplimiento normativo. Demandas por parte de clientes y/o proveedores. (-)\r\n- El evento ocasiona mejoras en el cumplimiento de las normativas vigentes/ Mejoras en las condiciones legales de los contratos. (+)',
    4: '- Junta Directiva y representantes legales resultan con antecedentes judiciales o administrativos que afectan las decisiones de la operación o el negocio. (-)\r\n- Optimización en el relacionamiento de los ejecutivos de la compañía con los reguladores claves de la industria. (+)',
    5: '- Intervención por parte del ente regulador (-)\r\n- El evento resulta en acciones proactivas ante proyectos de normativas que tendrán un fuerte impacto en la compañía (+)',
  },
  '7': { // Personas
    1: '-Lesión Leve (Primeros auxilios dentro de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-)\r\n- Eventos que involucran datos personales públicos que no afectan el derecho al habeas data (-).\r\n- Sin modificaciones en el ambiente de seguridad física de las personas. (+)',
    2: '- Lesión Menor (sin incapacidad - primeros auxilios por fuera de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-).\r\n- Eventos que involucran datos personales privados o semiprivados que no afectan el derecho del habeas data (-).\r\n- El evento ocasiona mejoras leves en la salud ocupacional de los colaboradores - previene enfermedades y/o lesiones leves. (+)',
    3: '- Incapacidad Temporal (>1 día): Eventos que afectan el desempeño laboral que requieren algunos días de recuperación. Daños reversibles en la salud (ej.: Irritación de la piel, intoxicaciones alimentarias) (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectan el derecho al habeas data (-).\r\n- El evento ocasiona mejoras moderadas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones reversibles. (+)',
    4: '- Incapacidad permanente (parcial o total): Eventos que producen incapacidad parcial y/o permanente por accidente de trabajo o enfermedad profesional. Daños irreversibles en la salud con inhabilitación seria sin pérdida de vida (ej.: Hipoacusia inducida por ruido, lesiones lumbares crónicas, lesiones por sobreesfuerzos). (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectas derechos fundamentales (-).\r\n- El evento ocasiona mejoras significativas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones irreversibles. (+)',
    5: '- Una o más fatalidades por accidente o enfermedad. (-).\r\n- Eventos que afectan derechos fundamentales y que involucren datos personales sensibles o datos de menores de edad (-).\r\n- El evento tiene un impacto importante en la salud ocupacional de los colaboradores, previniendo fatalidades por accidentes ó enfermedades. (+)',
  },
  '8': { // Procesos
    1: 'Mínima afectación en el tiempo, calidad y/o eficiencia del servicio/producto',
    2: 'Impacto bajo en el tiempo de la ejecución del proceso  (entre 1 y 4 horas seguidas). Pocos clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.',
    3: 'Impacto moderado en el tiempo de ejecución del proceso (entre 4 y 8 horas seguidas).  Moderado número de clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.',
    4: 'Impacto mayor en el tiempo de ejecución del proceso (entre 1 y 2 días seguidos). Varios clientes con impacto que se van (-) y/o vienen (+) de la competencia.',
    5: 'Impacto importante en el tiempo de ejecución del proceso (mayor a 2 días). Mayoría de clientes con impacto que se van (-) y/o vienen (+) de la competencia.',
  },
  '9': { // Reputación
    1: 'No se ve afectada la confianza y credibilidad en ningún grupo de interés ni tiene despliegue por medios de comunicación masiva. El hecho es conocido al interior de la unidad de negocio.',
    2: 'El hecho afecta (+ ó -) la confianza y credibilidad de grupos de interés no claves para la unidad de negocio. El hecho es conocido al interior de la compañía.',
    3: 'El hecho afecta (+ ó -) la confianza y credibilidad de varios grupos de interés clave para la compañía. El hecho es conocido por empresas del sector.',
    4: 'El hecho afecta  (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva informales y/o locales.',
    5: 'El hecho afecta (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva locales, regionales y nacionales.',
  },
});

export function getDescripcionesImpacto(): Record<string, Record<number, string>> {
  return DESCRIPCIONES_IMPACTO;
}

export function updateDescripcionesImpacto(data: Record<string, Record<number, string>>): Record<string, Record<number, string>> {
  DESCRIPCIONES_IMPACTO = data;
  saveToStorage('catalog_descripciones_impacto', data);
  return data;
}

export function getMockRiesgosTalentoHumano(): RiesgoFormData[] {
  return [
    {
      id: 'mock-riesgo-th-1',
      descripcionRiesgo: 'Probabilidad de afectar la continuidad operacional por falta de personal capacitado en procesos críticos',
      numeroIdentificacion: '1GTH',
      origenRiesgo: 'Talleres internos',
      tipoProceso: '02 Operacional',
      consecuencia: '01 Negativa',
      tipoRiesgo: '02 Operacional',
      subtipoRiesgo: 'Falta de actualización o cumplimiento de procedimientos',
      objetivo: '16 Asegurar la continuidad operacional mediante personal capacitado',
      causas: [
        {
          id: 'causa-1',
          descripcion: 'Falta de programas de capacitación continua',
          fuenteCausa: '1',
          frecuencia: 3,
          calificacionGlobalImpacto: 4,
          calificacionInherentePorCausa: 12,
        },
        {
          id: 'causa-2',
          descripcion: 'Rotación de personal sin transferencia de conocimiento',
          fuenteCausa: '1',
          frecuencia: 4,
          calificacionGlobalImpacto: 4,
          calificacionInherentePorCausa: 16,
        },
      ],
      impactos: {
        economico: 3,
        procesos: 5,
        legal: 2,
        confidencialidadSGSI: 2,
        reputacion: 3,
        disponibilidadSGSI: 4,
        personas: 5,
        integridadSGSI: 3,
        ambiental: 1,
      },
    },
    {
      id: 'mock-riesgo-th-2',
      descripcionRiesgo: 'Riesgo de incumplimiento normativo en contratación laboral',
      numeroIdentificacion: '2GTH',
      origenRiesgo: 'Auditoría HHI',
      tipoProceso: '02 Operacional',
      consecuencia: '01 Negativa',
      tipoRiesgo: '04 Cumplimiento',
      subtipoRiesgo: 'Cumplimiento regulatorio',
      objetivo: '17 Cumplir con todas las normativas laborales vigentes',
      causas: [
        {
          id: 'causa-3',
          descripcion: 'Desactualización en normativas laborales',
          fuenteCausa: '3',
          frecuencia: 2,
          calificacionGlobalImpacto: 5,
          calificacionInherentePorCausa: 10,
        },
      ],
      impactos: {
        economico: 4,
        procesos: 3,
        legal: 5,
        confidencialidadSGSI: 1,
        reputacion: 4,
        disponibilidadSGSI: 2,
        personas: 3,
        integridadSGSI: 2,
        ambiental: 1,
      },
    },
    {
      id: 'mock-riesgo-th-3',
      descripcionRiesgo: 'Riesgo de pérdida de talento clave por falta de planes de retención',
      numeroIdentificacion: '3GTH',
      origenRiesgo: 'Talleres internos',
      tipoProceso: '01 Estratégico',
      consecuencia: '01 Negativa',
      tipoRiesgo: '01 Estratégico',
      subtipoRiesgo: 'Retención de talento',
      objetivo: '18 Retener el talento clave mediante planes de desarrollo',
      causas: [
        {
          id: 'causa-4',
          descripcion: 'Falta de planes de carrera y desarrollo',
          fuenteCausa: '2',
          frecuencia: 4,
          calificacionGlobalImpacto: 4,
          calificacionInherentePorCausa: 16,
        },
        {
          id: 'causa-5',
          descripcion: 'Competencia del mercado laboral',
          fuenteCausa: '5',
          frecuencia: 5,
          calificacionGlobalImpacto: 4,
          calificacionInherentePorCausa: 20,
        },
      ],
      impactos: {
        economico: 4,
        procesos: 4,
        legal: 2,
        confidencialidadSGSI: 2,
        reputacion: 5,
        disponibilidadSGSI: 3,
        personas: 5,
        integridadSGSI: 2,
        ambiental: 1,
      },
    },
  ];
}

// ============================================
// STATIC CATALOGS (Centralized)
// ============================================

export const mockClasificacionesRiesgo = [
  { id: '1', nombre: 'Positivo', valor: 'Positivo', descripcion: 'Riesgo con impacto positivo (Oportunidad)' },
  { id: '2', nombre: 'Negativo', valor: 'Negativo', descripcion: 'Riesgo con impacto negativo (Amenaza)' },
];

export const mockNivelesRiesgo = [
  { id: '1', nombre: 'Crítico', valor: 'NIVEL CRÍTICO', color: '#d32f2f' },
  { id: '2', nombre: 'Alto', valor: 'NIVEL ALTO', color: '#f57c00' },
  { id: '3', nombre: 'Medio', valor: 'NIVEL MEDIO', color: '#fbc02d' },
  { id: '4', nombre: 'Bajo', valor: 'NIVEL BAJO', color: '#388e3c' },
];

export const mockRespuestasRiesgo = [
  { id: '1', nombre: 'Aceptar', valor: 'Aceptar', descripcion: 'Aceptar el riesgo sin acciones adicionales' },
  { id: '2', nombre: 'Mitigar', valor: 'Mitigar', descripcion: 'Tomar acciones para reducir probabilidad o impacto' },
  { id: '3', nombre: 'Transferir', valor: 'Transferir', descripcion: 'Tranferir el riesgo a un tercero (ej. seguros)' },
  { id: '4', nombre: 'Evitar', valor: 'Evitar', descripcion: 'Eliminar la actividad que genera el riesgo' },
  { id: '5', nombre: 'Explotar', valor: 'Explotar', descripcion: 'Potenciar la oportunidad (Riesgo Positivo)' },
  { id: '6', nombre: 'Compartir', valor: 'Compartir', descripcion: 'Compartir la oportunidad con un tercero' },
  { id: '7', nombre: 'Mejorar', valor: 'Mejorar', descripcion: 'Aumentar la probabilidad o impacto de la oportunidad' },
];

export function getMockClasificacionesRiesgo() { return mockClasificacionesRiesgo; }
export function getMockNivelesRiesgo() { return mockNivelesRiesgo; }
export function getMockRespuestasRiesgo() { return mockRespuestasRiesgo; }

// Catálogos para Ejes del Mapa (Probabilidad X, Impacto Y)
export const mockEjesProbabilidad = [
  { id: 1, nombre: 'Muy Bajo', valor: 1 },
  { id: 2, nombre: 'Bajo', valor: 2 },
  { id: 3, nombre: 'Moderada', valor: 3 },
  { id: 4, nombre: 'Alta', valor: 4 },
  { id: 5, nombre: 'Muy Alta', valor: 5 },
];

export const mockEjesImpacto = [
  { id: 5, nombre: 'Extremo', valor: 5 },
  { id: 4, nombre: 'Grave', valor: 4 },
  { id: 3, nombre: 'Moderado', valor: 3 },
  { id: 2, nombre: 'Leve', valor: 2 },
  { id: 1, nombre: 'No Significativo', valor: 1 },
];

export function getMockEjesMapa() {
  return {
    probabilidad: mockEjesProbabilidad,
    impacto: mockEjesImpacto
  };
}


// ============================================
// MAP CONFIGURATION CATALOG
// ============================================


export interface MapaConfig {
  inherente: Record<string, string>; // key: "prob-impact" (e.g. "5-5"), value: NivelRiesgoId
  residual: Record<string, string>;
  tolerancia: string[]; // List of cell keys 'P-I' that are WITHIN tolerance (e.g. acceptable zone)
}

// Default configuration based on Excel Macros and current logic
const defaultMapaConfig: MapaConfig = {
  inherente: {
    // Crítico (1) - Red
    '3-5': '1', '4-4': '1', '4-5': '1', '5-3': '1', '5-4': '1', '5-5': '1',

    // Alto (2) - Orange
    '1-5': '2', '2-5': '2', '3-4': '2', '4-3': '2', '5-1': '2', '5-2': '2',

    // Medio (3) - Yellow
    '1-4': '3', '2-3': '3', '2-4': '3', '3-2': '3', '3-3': '3', '4-1': '3', '4-2': '3',

    // Bajo (4) - Green
    '1-1': '4', '1-2': '4', '1-3': '4', '2-1': '4', '2-2': '4', '3-1': '4'
  },
  residual: {
    // Defaulting residual to same as inherent
    '3-5': '1', '4-4': '1', '4-5': '1', '5-3': '1', '5-4': '1', '5-5': '1',
    '1-5': '2', '2-5': '2', '3-4': '2', '4-3': '2', '5-1': '2', '5-2': '2',
    '1-4': '3', '2-3': '3', '2-4': '3', '3-2': '3', '3-3': '3', '4-1': '3', '4-2': '3',
    '1-1': '4', '1-2': '4', '1-3': '4', '2-1': '4', '2-2': '4', '3-1': '4'
  },
  // Default Tolerance Zone (Green + Yellow typically, or manually selected)
  // Based on image: Green and Yellow cells seem to be "below" the line essentially.
  // The line separates Orange/Red from Yellow/Green.
  // So 'tolerancia' will contain keys for Green(4) and Yellow(3) cells by default.
  tolerancia: [
    '1-1', '1-2', '1-3', '2-1', '2-2', '3-1', // Bajo
    '1-4', '2-3', '2-4', '3-2', '3-3', '4-1', '4-2' // Medio
  ],
};

const defaultMapaInherente = {
  // Crítico (1) - Red
  '3-5': '1', '4-4': '1', '4-5': '1', '5-3': '1', '5-4': '1', '5-5': '1',

  // Alto (2) - Orange
  '1-5': '2', '2-5': '2', '3-4': '2', '4-3': '2', '5-1': '2', '5-2': '2',

  // Medio (3) - Yellow
  '1-4': '3', '2-3': '3', '2-4': '3', '3-2': '3', '3-3': '3', '4-1': '3', '4-2': '3',

  // Bajo (4) - Green
  '1-1': '4', '1-2': '4', '1-3': '4', '2-1': '4', '2-2': '4', '3-1': '4'
};

const defaultTolerancia = [
  '1-1', '1-2', '1-3', '2-1', '2-2', '3-1', // Bajo
  '1-4', '2-3', '2-4', '3-2', '3-3', '4-1', '4-2' // Medio
];

let mockMapaConfig: MapaConfig = loadFromStorage('catalog_mapa_config_v3', {
  inherente: defaultMapaInherente,
  residual: defaultMapaInherente, // Inicialmente igual
  tolerancia: defaultTolerancia,
  maxRiesgosVisible: 3, // Default limit per cell
});

export function getMockMapaConfig() { return mockMapaConfig; }

export function updateMockMapaConfig(type: 'inherente' | 'residual' | 'tolerancia' | 'maxRiesgosVisible', data: any) {
  if (type === 'tolerancia') {
    mockMapaConfig = {
      ...mockMapaConfig,
      tolerancia: data as string[]
    };
  } else {
    mockMapaConfig = {
      ...mockMapaConfig,
      [type]: data
    };
  }
  saveToStorage('catalog_mapa_config_v3', mockMapaConfig);
  return mockMapaConfig;
}

// ============================================================================
// CATÁLOGOS CENTRALIZADOS - NO MÁS DATOS QUEMADOS
// ============================================================================

// Estados de Incidencia
export const ESTADOS_INCIDENCIA = [
  { value: 'abierta', label: 'Abierta', color: 'error', icon: 'FlagOutlined' },
  { value: 'en_investigacion', label: 'En Investigación', color: 'warning', icon: 'SearchOutlined' },
  { value: 'resuelta', label: 'Resuelta', color: 'info', icon: 'CheckCircleOutline' },
  { value: 'cerrada', label: 'Cerrada', color: 'success', icon: 'DoneAll' }
] as const;

export function getEstadosIncidencia() {
  return ESTADOS_INCIDENCIA;
}

// Roles del Sistema
export const ROLES_SISTEMA = [
  {
    value: 'admin',
    label: 'Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: ['*']
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    descripcion: 'Supervisa la gestión de riesgos',
    permisos: ['view_dashboard', 'view_riesgos', 'approve_actions']
  },
  {
    value: 'gerente_general',
    label: 'Gerente General',
    descripcion: 'Vista ejecutiva y toma de decisiones',
    permisos: ['view_dashboard', 'view_reports', 'view_riesgos']
  },
  {
    value: 'dueño_procesos',
    label: 'Dueño de Procesos',
    descripcion: 'Gestiona riesgos de sus procesos',
    permisos: ['manage_procesos', 'manage_riesgos', 'create_incidencias']
  },
  {
    value: 'director_procesos',
    label: 'Director de Procesos',
    descripcion: 'Dirige estrategia de procesos',
    permisos: ['view_procesos', 'approve_procesos', 'view_riesgos']
  },
  {
    value: 'manager',
    label: 'Manager',
    descripcion: 'Gestiona equipos y operaciones',
    permisos: ['view_dashboard', 'manage_team', 'view_riesgos']
  },
  {
    value: 'analyst',
    label: 'Analista',
    descripcion: 'Analiza riesgos y genera reportes',
    permisos: ['view_riesgos', 'create_reports', 'view_dashboard']
  }
] as const;

export function getRolesSistema() {
  return ROLES_SISTEMA;
}

// Meses del Año
export const MESES_ABREVIADOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
] as const;

export const MESES_COMPLETOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

export function getMesesAbreviados() {
  return MESES_ABREVIADOS;
}

export function getMesesCompletos() {
  return MESES_COMPLETOS;
}

// Empresas de Benchmarking
export const EMPRESAS_BENCHMARKING = [
  {
    id: '1',
    nombre: 'Empresa Referente Alpha',
    sector: 'Financiero',
    pais: 'Colombia',
    calificacionPromedio: 4.5,
    riesgosGestionados: 127,
    madurezGestion: 'Avanzado'
  },
  {
    id: '2',
    nombre: 'Empresa Referente Beta',
    sector: 'Tecnología',
    pais: 'México',
    calificacionPromedio: 4.2,
    riesgosGestionados: 98,
    madurezGestion: 'Intermedio'
  },
  {
    id: '3',
    nombre: 'Empresa Referente Gamma',
    sector: 'Retail',
    pais: 'Chile',
    calificacionPromedio: 3.8,
    riesgosGestionados: 65,
    madurezGestion: 'Básico'
  }
];

export function getEmpresasBenchmarking() {
  return EMPRESAS_BENCHMARKING;
}

// Colores para Gráficos
export const COLORES_GRAFICOS = {
  primarios: ['#42a5f5', '#1976d2', '#90caf9', '#64b5f6', '#2196f3'],
  riesgos: {
    critico: '#d32f2f',
    alto: '#f57c00',
    moderado: '#fbc02d',
    bajo: '#388e3c',
    muyBajo: '#1976d2'
  },
  estados: {
    activo: '#4caf50',
    inactivo: '#9e9e9e',
    pendiente: '#ff9800',
    completado: '#2196f3'
  },
  categorias: [
    '#e91e63', '#9c27b0', '#3f51b5', '#00bcd4',
    '#4caf50', '#ff9800', '#f44336', '#795548'
  ]
} as const;

export function getColoresGraficos() {
  return COLORES_GRAFICOS;
}

// Estados de Controles
export const ESTADOS_CONTROL = [
  { value: 'activo', label: 'Activo', color: 'success' },
  { value: 'inactivo', label: 'Inactivo', color: 'default' },
  { value: 'en_revision', label: 'En Revisión', color: 'warning' },
  { value: 'obsoleto', label: 'Obsoleto', color: 'error' }
] as const;

export function getEstadosControl() {
  return ESTADOS_CONTROL;
}

// Estados de Tareas/Acciones
export const ESTADOS_TAREA = [
  { value: 'pendiente', label: 'Pendiente', color: 'warning', porcentaje: 0 },
  { value: 'en_progreso', label: 'En Progreso', color: 'info', porcentaje: 50 },
  { value: 'completada', label: 'Completada', color: 'success', porcentaje: 100 },
  { value: 'vencida', label: 'Vencida', color: 'error', porcentaje: 0 },
  { value: 'cancelada', label: 'Cancelada', color: 'default', porcentaje: 0 }
] as const;

export function getEstadosTarea() {
  return ESTADOS_TAREA;
}
