/**
 * Identificación y Calificación Page
 * Diseño de tres paneles: RIESGO, CAUSAS, IMPACTO
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  ListSubheader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Autocomplete,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from '@mui/material';
import Grid2 from '../../../utils/Grid2';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useCreateEvaluacionMutation, useUpdateRiesgoMutation } from '../api/riesgosApi';
import { CLASIFICACION_RIESGO, type ClasificacionRiesgo, DIMENSIONES_IMPACTO, LABELS_IMPACTO } from '../../../utils/constants';
import { useProceso } from '../../../contexts/ProcesoContext';
import { useNotification } from '../../../shared/hooks/useNotification';
import { useRiesgo } from '../../../shared/contexts/RiesgoContext';
import type { Riesgo, FiltrosRiesgo, CausaRiesgo, EvaluacionInherenteNegativa } from '../types';
import { useCalculosRiesgo } from '../hooks/useCalculosRiesgo';

// Etiquetas de frecuencia según la imagen
const LABELS_FRECUENCIA: Record<number, { label: string; descripcion: string }> = {
  1: { label: 'Raro', descripcion: 'mayor a anual' },
  2: { label: 'Improbable', descripcion: 'mayor a trimestral y hasta anual' },
  3: { label: 'Posible', descripcion: 'mayor a mensual y hasta trimestral' },
  4: { label: 'Probable', descripcion: 'mayor a diaria y hasta mensual' },
  5: { label: 'Esperado', descripcion: 'diaria o varias veces al día' },
};

// Fuentes de causa
const FUENTES_CAUSA: Record<number, string> = {
  1: 'Personas',
  2: 'Proceso',
  3: 'Legal',
  4: 'Infraestructura',
  5: 'Externos',
};

// Estructura de Tipos y Subtipos de Riesgos
interface SubtipoRiesgo {
  codigo: string;
  descripcion: string;
}

interface TipoRiesgo {
  codigo: string;
  nombre: string;
  descripcion: string;
  subtipos: SubtipoRiesgo[];
}

const TIPOS_RIESGOS: TipoRiesgo[] = [
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

// Descripciones de impacto según la imagen (simplificadas)
// Descripciones de impacto desde el JSON
const DESCRIPCIONES_IMPACTO: Record<string, Record<number, string>> = {
  economico: {
    1: 'Variación (+ ó -) en los recursos financieros de hasta $2K USD',
    2: 'Variación (+ ó -) en los recursos financieros de hasta $14,5K USD',
    3: 'Variación (+ ó -) en los recursos financieros de de hasta $33,8K USD',
    4: 'Variación (+ ó -) en los recursos financieros de hasta $85,9K USD',
    5: 'Variación (+ ó -) en los recursos financieros superior a $85,9K USD',
  },
  procesos: {
    1: 'Mínima afectación en el tiempo, calidad y/o eficiencia del servicio/producto',
    2: 'Impacto bajo en el tiempo de la ejecución del proceso  (entre 1 y 4 horas seguidas). Pocos clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.',
    3: 'Impacto moderado en el tiempo de ejecución del proceso (entre 4 y 8 horas seguidas).  Moderado número de clientes se ven afectados (+ ó -) respecto a tiempos de entrega y/o estándares de calidad del producto/servicio.',
    4: 'Impacto mayor en el tiempo de ejecución del proceso (entre 1 y 2 días seguidos). Varios clientes con impacto que se van (-) y/o vienen (+) de la competencia.',
    5: 'Impacto importante en el tiempo de ejecución del proceso (mayor a 2 días). Mayoría de clientes con impacto que se van (-) y/o vienen (+) de la competencia.',
  },
  legal: {
    1: '- Queja ante autoridad administrativa. (-)\r\n- Sin modificaciones en el ambiente normativo/legal de la compañía. (+)',
    2: '- Observaciones por parte del ente regulador con plazo para cumplimiento de acciones. (-)\r\n- El evento ocasiona cumplimiento total y/o cierre de brechas para el cumplimiento de las normativas legales. (+)',
    3: '- Indemnizaciones, multas o sanciones por incumplimiento normativo. Demandas por parte de clientes y/o proveedores. (-)\r\n- El evento ocasiona mejoras en el cumplimiento de las normativas vigentes/ Mejoras en las condiciones legales de los contratos. (+)',
    4: '- Junta Directiva y representantes legales resultan con antecedentes judiciales o administrativos que afectan las decisiones de la operación o el negocio. (-)\r\n- Optimización en el relacionamiento de los ejecutivos de la compañía con los reguladores claves de la industria. (+)',
    5: '- Intervención por parte del ente regulador (-)\r\n- El evento resulta en acciones proactivas ante proyectos de normativas que tendrán un fuerte impacto en la compañía (+)',
  },
  confidencialidadSGSI: {
    1: 'El activo de información no se encuentra expuesto a acceso no autorizado',
    2: 'Exposición de información pública interna a externos (Proveedores, clientes, etc.).',
    3: 'Exposición de información confidencial y secreta a personal interno no autorizado (personal a quien no fue dirigida esa información).',
    4: 'Exposición de información confidencial a externos (Proveedores, clientes, etc.)',
    5: 'Exposición de información secreta a externos (Proveedores, clientes, etc.).',
  },
  reputacion: {
    1: 'No se ve afectada la confianza y credibilidad en ningún grupo de interés ni tiene despliegue por medios de comunicación masiva. El hecho es conocido al interior de la unidad de negocio.',
    2: 'El hecho afecta (+ ó -) la confianza y credibilidad de grupos de interés no claves para la unidad de negocio. El hecho es conocido al interior de la compañía.',
    3: 'El hecho afecta (+ ó -) la confianza y credibilidad de varios grupos de interés clave para la compañía. El hecho es conocido por empresas del sector.',
    4: 'El hecho afecta  (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva informales y/o locales.',
    5: 'El hecho afecta (+ ó -) la confianza y credibilidad de todos los grupos de interés. El hecho tiene despliegue por medios de comunicación masiva locales, regionales y nacionales.',
  },
  disponibilidadSGSI: {
    1: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.',
    2: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.',
    3: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía',
    4: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales',
    5: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes',
  },
  personas: {
    1: '-Lesión Leve (Primeros auxilios dentro de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-)\r\n- Eventos que involucran datos personales públicos que no afectan el derecho al habeas data (-).\r\n- Sin modificaciones en el ambiente de seguridad física de las personas. (+)',
    2: '- Lesión Menor (sin incapacidad - primeros auxilios por fuera de la empresa), no afectan el desempeño laboral ni causan incapacidad. (-).\r\n- Eventos que involucran datos personales privados o semiprivados que no afectan el derecho del habeas data (-).\r\n- El evento ocasiona mejoras leves en la salud ocupacional de los colaboradores - previene enfermedades y/o lesiones leves. (+)',
    3: '- Incapacidad Temporal (>1 día): Eventos que afectan el desempeño laboral que requieren algunos días de recuperación. Daños reversibles en la salud (ej.: Irritación de la piel, intoxicaciones alimentarias) (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectan el derecho al habeas data (-).\r\n- El evento ocasiona mejoras moderadas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones reversibles. (+)',
    4: '- Incapacidad permanente (parcial o total): Eventos que producen incapacidad parcial y/o permanente por accidente de trabajo o enfermedad profesional. Daños irreversibles en la salud con inhabilitación seria sin pérdida de vida (ej.: Hipoacusia inducida por ruido, lesiones lumbares crónicas, lesiones por sobreesfuerzos). (-).\r\n- Eventos que involucran datos personales (distintos de datos sensibles o de menores de edad) y afectas derechos fundamentales (-).\r\n- El evento ocasiona mejoras significativas en la salud ocupacional de los colaboradores. Previene enfermedades y/o lesiones irreversibles. (+)',
    5: '- Una o más fatalidades por accidente o enfermedad. (-).\r\n- Eventos que afectan derechos fundamentales y que involucren datos personales sensibles o datos de menores de edad (-).\r\n- El evento tiene un impacto importante en la salud ocupacional de los colaboradores, previniendo fatalidades por accidentes ó enfermedades. (+)',
  },
  integridadSGSI: {
    1: 'Los objetivos de la Empresa no se ven afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de regional o local de acceso a servicios internos de la compañía sin afectación a la operación.',
    2: 'Es probable que los objetivos de la Empresa se vean afectados en caso de que el activo sea comprometido o no se encuentre disponible. Indisponibilidad de acceso a servicios internos de la compañía y se continúa con la operación.',
    3: 'Si se compromete el activo o no se encuentra disponible, se retrasará el cumplimiento de los objetivos de la Empresa. Indisponibilidad de acceso a servicios financieros y operacionales de la compañía',
    4: 'Si se compromete el activo o no se encuentra disponible no se cumplirá con los objetivos de la Empresa. Indisponibilidad de servicios transaccionales',
    5: 'Si se compromete el activo o no se encuentra disponible, se perderá la confianza de los inversionistas, proveedores y/o clientes. Indisponibilidad total del servicio de los clientes',
  },
  ambiental: {
    1: 'Sin afectación ambiental. Sin modificaciones en el ambiente',
    2: "'- El evento ocasiona (-) ó ayuda a mejorar (+) las emisiones, vertimientos o desechos con afectación ambiental leve. \r\n- Acciones para la corrección ó mejoramiento del ambiente a corto plazo (1 a 29 días).",
    3: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental localizada.\r\n- Acciones para la corrección ó mejoramiento del ambiente a mediano plazo (30 a 90 días)",
    4: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con afectación ambiental grave con pérdida de capacidad productiva del ecosistema.\r\n- Acciones para la corrección ó mejoramiento del ambiente en el largo plazo (> 90 días)",
    5: "'- El evento ocasiona (-) ó ayuda a mejorar (+) emisiones, vertimientos o desechos con daño ambiental irreparable/nocivo a nivel interno y/o externo\r\n- Acciones para la compensación (-) ó mejoramiento (+) a daños irreparables a recursos naturales o ecosistema.",
  },
};

// Objetivos disponibles
const OBJETIVOS = [
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
  { id: 14, codigo: '13', descripcion: 'Aplicar estándares de seguridad de la información' },
  { id: 15, codigo: '14', descripcion: 'Reducir los incidentes de Seguridad de la Información' },
  { id: 16, codigo: '15', descripcion: 'Gestionar el desempeño del Personal' },
];

// Interfaz para un riesgo en el formulario
interface RiesgoFormData {
  id: string;
  descripcionRiesgo: string;
  numeroIdentificacion: string;
  origenRiesgo: string;
  tipoProceso: string;
  consecuencia: string;
  tipoRiesgo: string;
  subtipoRiesgo: string;
  objetivo: string;
  causas: CausaRiesgo[];
  impactos: {
    economico: number;
    procesos: number;
    legal: number;
    confidencialidadSGSI: number;
    reputacion: number;
    disponibilidadSGSI: number;
    personas: number;
    integridadSGSI: number;
    ambiental: number;
  };
}

export default function IdentificacionPage() {
  const { procesoSeleccionado, modoProceso } = useProceso();
  const { riesgoSeleccionado, iniciarEditar, iniciarVer } = useRiesgo();
  const isReadOnly = modoProceso === 'visualizar';
  const { showSuccess, showError } = useNotification();

  // Estado para múltiples riesgos
  const [riesgos, setRiesgos] = useState<RiesgoFormData[]>([]);
  const [riesgosExpandidos, setRiesgosExpandidos] = useState<Record<string, boolean>>({});

  // Función para crear un nuevo riesgo vacío
  const crearNuevoRiesgo = (): RiesgoFormData => {
    const nuevoId = `riesgo-${Date.now()}`;
    return {
      id: nuevoId,
      descripcionRiesgo: '',
      numeroIdentificacion: '',
      origenRiesgo: '',
      tipoProceso: '02 Operacional',
      consecuencia: '01 Negativa',
      tipoRiesgo: '',
      subtipoRiesgo: '',
      objetivo: '',
      causas: [],
      impactos: {
        economico: 1,
        procesos: 1,
        legal: 1,
        confidencialidadSGSI: 1,
        reputacion: 1,
        disponibilidadSGSI: 1,
        personas: 1,
        integridadSGSI: 1,
        ambiental: 1,
      },
    };
  };

  // Añadir nuevo riesgo
  const handleAgregarRiesgo = () => {
    const nuevoRiesgo = crearNuevoRiesgo();
    setRiesgos([...riesgos, nuevoRiesgo]);
    setRiesgosExpandidos({ ...riesgosExpandidos, [nuevoRiesgo.id]: true });
  };

  // Eliminar riesgo
  const handleEliminarRiesgo = (riesgoId: string) => {
    setRiesgos(riesgos.filter(r => r.id !== riesgoId));
    const nuevosExpandidos = { ...riesgosExpandidos };
    delete nuevosExpandidos[riesgoId];
    setRiesgosExpandidos(nuevosExpandidos);
  };

  // Toggle expandir/colapsar riesgo
  const handleToggleExpandir = (riesgoId: string) => {
    setRiesgosExpandidos({
      ...riesgosExpandidos,
      [riesgoId]: !riesgosExpandidos[riesgoId],
    });
  };

  // Actualizar un riesgo específico
  const actualizarRiesgo = (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => {
    setRiesgos(riesgos.map(r => r.id === riesgoId ? { ...r, ...actualizacion } : r));
  };

  const [createEvaluacion] = useCreateEvaluacionMutation();
  const [updateRiesgo] = useUpdateRiesgoMutation();

  // Estados locales para el diálogo de causa (compartido)
  const [dialogCausaOpen, setDialogCausaOpen] = useState<boolean>(false);
  const [causaEditando, setCausaEditando] = useState<CausaRiesgo | null>(null);
  const [riesgoIdParaCausa, setRiesgoIdParaCausa] = useState<string>('');
  const [nuevaCausaDescripcion, setNuevaCausaDescripcion] = useState<string>('');
  const [nuevaCausaFuente, setNuevaCausaFuente] = useState<string>('1');
  const [nuevaCausaFrecuencia, setNuevaCausaFrecuencia] = useState<number>(3);

  const handleSave = async (riesgoId: string) => {
    try {
      const riesgo = riesgos.find(r => r.id === riesgoId);
      if (!riesgo) return;
      
      // TODO: Guardar el riesgo y evaluación
      showSuccess('Riesgo guardado exitosamente');
    } catch (error) {
      showError('Error al guardar el riesgo');
    }
  };

  if (!procesoSeleccionado) {
    return (
      <Box>
        <Alert severity="warning">Por favor seleccione un proceso desde el Dashboard</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header con título */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          IDENTIFICACIÓN Y CALIFICACIÓN
          </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAgregarRiesgo}
            disabled={isReadOnly}
          >
          Añadir Riesgo
        </Button>
      </Box>

      {/* Lista de riesgos */}
      {riesgos.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No hay riesgos registrados. Haga clic en "Añadir Riesgo" para comenzar.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {riesgos.map((riesgo) => {
            const estaExpandido = riesgosExpandidos[riesgo.id] || false;
            const tipoRiesgoObj = TIPOS_RIESGOS.find(t => t.codigo === riesgo.tipoRiesgo);
            const subtipoObj = tipoRiesgoObj?.subtipos.find(s => s.codigo === riesgo.subtipoRiesgo);

            return (
              <Card key={riesgo.id} sx={{ mb: 2 }}>
                {/* Header colapsable */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    cursor: 'pointer',
                    backgroundColor: estaExpandido ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                    },
                  }}
                  onClick={() => handleToggleExpandir(riesgo.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <IconButton size="small">
                      {estaExpandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                    <Box sx={{ flex: 1, display: 'flex', gap: 3, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 100 }}>
                        {riesgo.numeroIdentificacion || 'Sin ID'}
                  </Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {riesgo.descripcionRiesgo || 'Sin descripción'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                        {riesgo.tipoRiesgo || 'Sin tipo'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                        {riesgo.subtipoRiesgo || 'Sin subtipo'}
                          </Typography>
                        </Box>
                  </Box>
                  <IconButton
                        size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminarRiesgo(riesgo.id);
                    }}
                    disabled={isReadOnly}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Contenido expandible */}
                <Collapse in={estaExpandido}>
                  <Box sx={{ p: 0 }}>
                    <RiesgoFormulario
                      riesgo={riesgo}
                      actualizarRiesgo={actualizarRiesgo}
                      isReadOnly={isReadOnly}
                      procesoSeleccionado={procesoSeleccionado}
                      onSave={() => handleSave(riesgo.id)}
                      onAgregarCausa={(riesgoId) => {
                        setRiesgoIdParaCausa(riesgoId);
                        setCausaEditando(null);
                        setNuevaCausaDescripcion('');
                        setNuevaCausaFuente('1');
                        setNuevaCausaFrecuencia(3);
                        setDialogCausaOpen(true);
                      }}
                    />
                  </Box>
                </Collapse>
              </Card>
            );
          })}
            </Box>
          )}

      {/* Diálogo para agregar/editar causa */}
      <Dialog open={dialogCausaOpen} onClose={() => setDialogCausaOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{causaEditando ? 'Editar Causa' : 'Agregar Causa'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Descripción de la Causa"
              multiline
              rows={3}
              value={nuevaCausaDescripcion}
              onChange={(e) => setNuevaCausaDescripcion(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Fuente</InputLabel>
              <Select
                value={nuevaCausaFuente}
                onChange={(e) => setNuevaCausaFuente(e.target.value)}
                label="Fuente"
              >
                {Object.entries(FUENTES_CAUSA).map(([key, value]) => (
                  <MenuItem key={key} value={key}>{value}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Frecuencia</InputLabel>
              <Select
                value={nuevaCausaFrecuencia}
                onChange={(e) => setNuevaCausaFrecuencia(Number(e.target.value))}
                label="Frecuencia"
              >
                {Object.entries(LABELS_FRECUENCIA).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    {value.label} - {value.descripcion}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCausaOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => {
              const riesgo = riesgos.find(r => r.id === riesgoIdParaCausa);
              if (riesgo) {
                const nuevaCausa: CausaRiesgo = {
                  id: causaEditando?.id || `causa-${Date.now()}`,
                  riesgoId: riesgoIdParaCausa,
                  descripcion: nuevaCausaDescripcion,
                  fuenteCausa: nuevaCausaFuente,
                  frecuencia: nuevaCausaFrecuencia,
                };
                const nuevasCausas = causaEditando
                  ? riesgo.causas.map(c => c.id === causaEditando.id ? nuevaCausa : c)
                  : [...riesgo.causas, nuevaCausa];
                actualizarRiesgo(riesgoIdParaCausa, { causas: nuevasCausas });
                setDialogCausaOpen(false);
              }
            }}
          >
            {causaEditando ? 'Guardar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Componente para el formulario de un riesgo individual
function RiesgoFormulario({
  riesgo,
  actualizarRiesgo,
  isReadOnly,
  procesoSeleccionado,
  onSave,
  onAgregarCausa,
}: {
  riesgo: RiesgoFormData;
  actualizarRiesgo: (riesgoId: string, actualizacion: Partial<RiesgoFormData>) => void;
  isReadOnly: boolean;
  procesoSeleccionado: any;
  onSave: () => void;
  onAgregarCausa: (riesgoId: string) => void;
}) {
  const tipoRiesgoSeleccionado = useMemo(() => {
    return TIPOS_RIESGOS.find(t => t.codigo === riesgo.tipoRiesgo) || null;
  }, [riesgo.tipoRiesgo]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
          {/* Panel RIESGO */}
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header azul con "RIESGO" */}
            <Box
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                py: 2,
                px: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                RIESGO
              </Typography>
      </Box>

            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
                {/* Campos del riesgo en dos columnas */}
                <Grid2 container spacing={2}>
                  {/* Columna izquierda - incluye descripción */}
                  <Grid2 xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Descripción del riesgo - Campo más pequeño */}
                <TextField
                  fullWidth
                        multiline
                        rows={3}
                        label="Descripción del Riesgo"
                        value={riesgo.descripcionRiesgo}
                        onChange={(e) => actualizarRiesgo(riesgo.id, { descripcionRiesgo: e.target.value })}
                  disabled={isReadOnly}
                        sx={{ 
                          '& .MuiInputBase-root': {
                            fontSize: '0.9rem',
                          },
                        }}
                      />
                      {/* Origen del riesgo */}
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableBody>
                            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                              <TableCell sx={{ width: '40%', fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                Origen del riesgo
                              </TableCell>
                              <TableCell sx={{ width: '60%' }}>
                          <FormControl fullWidth size="small" variant="standard">
                            <Select
                              value={riesgo.origenRiesgo}
                  disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { origenRiesgo: e.target.value })}
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                            >
                              <MenuItem value="1 Talleres internos">1 Talleres internos</MenuItem>
                              <MenuItem value="2 Auditoría HHI">2 Auditoría HHI</MenuItem>
                              <MenuItem value="3 Auditorías Externas">3 Auditorías Externas</MenuItem>
                              <MenuItem value="4 SGSI">4 SGSI</MenuItem>
                              <MenuItem value="5 SSO">5 SSO</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>

                            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                # Identificación
                              </TableCell>
                              <TableCell>
                <TextField
                  fullWidth
                              size="small"
                              value={riesgo.numeroIdentificacion}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { numeroIdentificacion: e.target.value })}
                  disabled={isReadOnly}
                              placeholder="Ej: R172"
                              variant="standard"
                              sx={{ fontSize: '0.875rem' }}
                              InputProps={{ disableUnderline: true }}
                            />
                          </TableCell>
                        </TableRow>

                            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                Tipo de Proceso
                              </TableCell>
                              <TableCell>
                            <FormControl fullWidth size="small" variant="standard">
                              <Select
                                value={riesgo.tipoProceso}
                  disabled={isReadOnly}
                                onChange={(e) => actualizarRiesgo(riesgo.id, { tipoProceso: e.target.value })}
                                sx={{ fontSize: '0.875rem' }}
                                disableUnderline
                              >
                                <MenuItem value="01 Estratégico">01 Estratégico</MenuItem>
                                <MenuItem value="02 Operacional">02 Operacional</MenuItem>
                                <MenuItem value="03 Apoyo">03 Apoyo</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>

                            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                Proceso
                              </TableCell>
                              <TableCell>
                <TextField
                  fullWidth
                              size="small"
                              value={procesoSeleccionado?.nombre || ''}
                              disabled
                              variant="standard"
                              sx={{ fontSize: '0.875rem' }}
                              InputProps={{ disableUnderline: true }}
                            />
                          </TableCell>
                        </TableRow>

                            <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                              <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                                Consecuencia
                              </TableCell>
                              <TableCell>
                            <FormControl fullWidth size="small" variant="standard">
                              <Select
                                value={riesgo.consecuencia}
                  disabled={isReadOnly}
                                onChange={(e) => actualizarRiesgo(riesgo.id, { consecuencia: e.target.value })}
                                sx={{ fontSize: '0.875rem' }}
                                disableUnderline
                              >
                                <MenuItem value="01 Negativa">01 Negativa</MenuItem>
                                <MenuItem value="02 Positiva">02 Positiva</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                    </Box>
                </Grid2>

                {/* Columna derecha */}
                <Grid2 xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          {/* Tipo de Riesgo */}
                          <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                          <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                            Tipo de Riesgo
                          </TableCell>
                          <TableCell>
                          <Autocomplete
                            value={riesgo.tipoRiesgo ? TIPOS_RIESGOS.find(t => t.codigo === riesgo.tipoRiesgo) || null : null}
                            onChange={(_, newValue) => {
                              if (newValue) {
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: newValue.codigo, subtipoRiesgo: '' });
                              } else {
                                actualizarRiesgo(riesgo.id, { tipoRiesgo: '', subtipoRiesgo: '' });
                              }
                            }}
                            options={TIPOS_RIESGOS}
                            getOptionLabel={(option) => {
                              // Si el código ya incluye el nombre, solo mostrar el código
                              if (option.codigo.includes(option.nombre)) {
                                return option.codigo;
                              }
                              return `${option.codigo} ${option.nombre}`;
                            }}
                  disabled={isReadOnly}
                size="small"
                            renderInput={(params) => (
                <TextField
                                {...params}
                                variant="standard"
                                placeholder="Buscar tipo de riesgo..."
                                sx={{ fontSize: '0.875rem' }}
                                InputProps={{
                                  ...params.InputProps,
                                  disableUnderline: true,
                                }}
                              />
                            )}
                            sx={{ 
                              width: '100%',
                              '& .MuiAutocomplete-input': {
                                fontSize: '0.875rem',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-inputRoot': {
                                flexWrap: 'wrap',
                              },
                              '& .MuiAutocomplete-tag': {
                                maxWidth: '100%',
                                whiteSpace: 'normal',
                                wordWrap: 'break-word',
                              },
                              '& .MuiAutocomplete-popper': {
                                '& .MuiAutocomplete-paper': {
                                  width: '100%',
                                  minWidth: '100%',
                                  maxHeight: '400px',
                                },
                              },
                            }}
                            ListboxProps={{
                              sx: {
                                maxHeight: '400px',
                              },
                            }}
                            renderOption={(props, option) => (
                              <Tooltip 
                                title={option.descripcion || ''} 
                                placement="right"
                                arrow
                                enterDelay={300}
                              >
                                <Box component="li" {...props} sx={{ py: 0.75 }}>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                                    {option.codigo.includes(option.nombre) ? option.codigo : `${option.codigo} ${option.nombre}`}
                          </Typography>
              </Box>
                              </Tooltip>
                            )}
                            filterOptions={(options, { inputValue }) => {
                              const searchTerm = inputValue.toLowerCase();
                              return options.filter((option) => {
                                return option.codigo.toLowerCase().includes(searchTerm) ||
                                       option.nombre.toLowerCase().includes(searchTerm) ||
                                       option.descripcion.toLowerCase().includes(searchTerm);
                              });
                            }}
                          />
                          </TableCell>
                        </TableRow>

                      {/* Descripción del Tipo de Riesgo */}
                      {riesgo.tipoRiesgo && tipoRiesgoSeleccionado && (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                              {tipoRiesgoSeleccionado.descripcion}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}

                          {/* Subtipo */}
                          <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                            <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                              Subtipo
                            </TableCell>
                            <TableCell>
                          {riesgo.tipoRiesgo && tipoRiesgoSeleccionado ? (
                            <Autocomplete
                              value={riesgo.subtipoRiesgo ? (() => {
                                const tipoObj = TIPOS_RIESGOS.find(t => t.codigo === riesgo.tipoRiesgo);
                                return tipoObj?.subtipos.find(s => s.codigo === riesgo.subtipoRiesgo) || null;
                              })() : null}
                              onChange={(_, newValue) => {
                                if (newValue) {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: newValue.codigo });
                                } else {
                                  actualizarRiesgo(riesgo.id, { subtipoRiesgo: '' });
                                }
                              }}
                              options={tipoRiesgoSeleccionado.subtipos}
                              getOptionLabel={(option) => option.codigo}
                  disabled={isReadOnly}
                              size="small"
                              renderInput={(params) => (
                <TextField
                                  {...params}
                                  variant="standard"
                                  placeholder="Buscar subtipo..."
                                  sx={{ fontSize: '0.875rem' }}
                                  InputProps={{
                                    ...params.InputProps,
                                    disableUnderline: true,
                                  }}
                                />
                              )}
                              sx={{ 
                                width: '100%',
                                '& .MuiAutocomplete-input': {
                                  fontSize: '0.875rem',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                  overflowWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-inputRoot': {
                                  flexWrap: 'wrap',
                                },
                                '& .MuiAutocomplete-tag': {
                                  maxWidth: '100%',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                },
                                '& .MuiAutocomplete-popper': {
                                  '& .MuiAutocomplete-paper': {
                                    width: '100%',
                                    minWidth: '100%',
                                    maxHeight: '400px',
                                  },
                                },
                              }}
                              ListboxProps={{
                                sx: {
                                  maxHeight: '400px',
                                },
                              }}
                              renderOption={(props, option) => (
                                <Tooltip 
                                  title={option.descripcion || ''} 
                                  placement="right"
                                  arrow
                                  enterDelay={300}
                                >
                                  <Box component="li" {...props} sx={{ py: 0.75 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.875rem' }}>
                                      {option.codigo}
              </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                              filterOptions={(options, { inputValue }) => {
                                const searchTerm = inputValue.toLowerCase();
                                return options.filter((option) => {
                                  return option.codigo.toLowerCase().includes(searchTerm) ||
                                         option.descripcion.toLowerCase().includes(searchTerm);
                                });
                              }}
                            />
                            ) : (
                <TextField
                  fullWidth
                                size="small"
                                value=""
                                disabled
                                placeholder="Seleccione primero un tipo de riesgo"
                                variant="standard"
                                sx={{ fontSize: '0.875rem' }}
                                InputProps={{ disableUnderline: true }}
                              />
                            )}
                          </TableCell>
                        </TableRow>

                      {/* Descripción del Subtipo */}
                      {riesgo.subtipoRiesgo && riesgo.tipoRiesgo && (() => {
                        const tipoObj = TIPOS_RIESGOS.find(t => t.codigo === riesgo.tipoRiesgo);
                        const subtipoObj = tipoObj?.subtipos.find(s => s.codigo === riesgo.subtipoRiesgo);
                          return subtipoObj ? (
                            <TableRow>
                              <TableCell colSpan={2} sx={{ pt: 0, pb: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                                  {subtipoObj.descripcion}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : null;
                        })()}

                          {/* Objetivo */}
                          <TableRow sx={{ '& .MuiTableCell-root': { py: 1.2 } }}>
                            <TableCell sx={{ fontWeight: 500, borderRight: '1px solid rgba(0, 0, 0, 0.12)' }}>
                              Objetivo
                            </TableCell>
                            <TableCell>
                          <FormControl fullWidth size="small" variant="standard">
                            <InputLabel id="objetivo-label" sx={{ fontSize: '0.875rem' }}>
                              Seleccione un objetivo
                            </InputLabel>
                  <Select
                              labelId="objetivo-label"
                              value={riesgo.objetivo}
                              disabled={isReadOnly}
                              onChange={(e) => actualizarRiesgo(riesgo.id, { objetivo: e.target.value })}
                              label="Seleccione un objetivo"
                              sx={{ fontSize: '0.875rem' }}
                              disableUnderline
                              displayEmpty
                              renderValue={(selected) => {
                                if (!selected) {
                                  return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Seleccione un objetivo</span>;
                                }
                                return (
                                  <span style={{ 
                                    whiteSpace: 'normal', 
                                    wordWrap: 'break-word', 
                                    overflowWrap: 'break-word',
                                    display: 'block',
                                    maxWidth: '100%'
                                  }}>
                                    {selected}
                                  </span>
                                );
                              }}
                              MenuProps={{
                                PaperProps: {
                                  sx: {
                                    maxHeight: '250px',
                                  },
                                },
                              }}
                            >
                              {OBJETIVOS.map((obj) => (
                                <MenuItem key={obj.id} value={`${obj.codigo} ${obj.descripcion}`} sx={{ py: 0.5, fontSize: '0.875rem' }}>
                                  {obj.codigo} {obj.descripcion}
                                </MenuItem>
                              ))}
                  </Select>
                </FormControl>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
              </Box>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>

          {/* Panel CAUSAS */}
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header azul con "CAUSAS" */}
            <Box
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                py: 2,
                px: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                CAUSAS
              </Typography>
              </Box>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Causa</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Fuente</TableCell>
                        <TableCell sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}>Frecuencia</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {riesgo.causas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No hay causas registradas
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        riesgo.causas.map((causa: CausaRiesgo) => (
                          <TableRow
                            key={causa.id}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2">
                                {causa.descripcion.length > 80 
                                  ? `${causa.descripcion.substring(0, 80)}...`
                                  : causa.descripcion}
                      </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {FUENTES_CAUSA[Number(causa.fuenteCausa) as keyof typeof FUENTES_CAUSA] || FUENTES_CAUSA[1]}
                      </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {LABELS_FRECUENCIA[causa.frecuencia || 3]?.label || ''}
                      </Typography>
                            </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

          {!isReadOnly && (
                  <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                      fullWidth
                      size="medium"
                      onClick={() => onAgregarCausa(riesgo.id)}
                  >
                    Agregar Causa
            </Button>
                  </Box>
                )}
            </CardContent>
          </Card>

          {/* Panel IMPACTO */}
          <Card sx={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header azul con "IMPACTO" */}
            <Box
              sx={{
                backgroundColor: '#1976d2',
                color: '#fff',
                py: 2,
                px: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                IMPACTO
              </Typography>
            </Box>
            <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Grid2 container spacing={2}>
                  {/* Columna izquierda de impactos */}
                  <Grid2 xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Impacto económico */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Impacto económico
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.economico || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, economico: val }
                              });
                            }
                          }}
              disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.economico[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.economico && !isNaN(Number(riesgo.impactos.economico)) ? Number(riesgo.impactos.economico) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.economico[valor] || ''}
                      </Typography>
                      );
                    })()}
                  </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Procesos */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Procesos
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                          value={riesgo.impactos.procesos || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, procesos: val }
                              });
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.procesos[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
              </Select>
            </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.procesos && !isNaN(Number(riesgo.impactos.procesos)) ? Number(riesgo.impactos.procesos) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.procesos[valor] || ''}
              </Typography>
                      );
                    })()}
                  </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Legal */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Legal
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.legal || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, legal: val }
                              });
                            }
                          }}
              disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.legal[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.legal && !isNaN(Number(riesgo.impactos.legal)) ? Number(riesgo.impactos.legal) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.legal[valor] || ''}
                      </Typography>
                      );
                    })()}
                  </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Confidencialidad SGSI */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Confidencialidad SGSI
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.confidencialidadSGSI || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, confidencialidadSGSI: val }
                              });
                            }
                          }}
              disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.confidencialidadSGSI[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.confidencialidadSGSI && !isNaN(Number(riesgo.impactos.confidencialidadSGSI)) ? Number(riesgo.impactos.confidencialidadSGSI) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.confidencialidadSGSI[valor] || ''}
                          </Typography>
                      );
                    })()}
                  </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Reputación */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Reputación
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.reputacion || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, reputacion: val }
                              });
                            }
                          }}
              disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.reputacion[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
          </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
          </Box>
                    {(() => {
                      const valor = riesgo.impactos.reputacion && !isNaN(Number(riesgo.impactos.reputacion)) ? Number(riesgo.impactos.reputacion) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.reputacion[valor] || ''}
                          </Typography>
                      );
                    })()}
                        </Box>

                    </Box>
                  </Grid2>

                  {/* Columna derecha de impactos */}
                  <Grid2 xs={12} md={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Disponibilidad SGSI */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Disponibilidad SGSI
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.disponibilidadSGSI || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, disponibilidadSGSI: val }
                              });
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.disponibilidadSGSI[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.disponibilidadSGSI && !isNaN(Number(riesgo.impactos.disponibilidadSGSI)) ? Number(riesgo.impactos.disponibilidadSGSI) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.disponibilidadSGSI[valor] || ''}
                  </Typography>
                      );
                    })()}
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Personas */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Personas
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.personas || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, personas: val }
                              });
                            }
                          }}
                  disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.personas[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
              </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {(() => {
                      const valor = riesgo.impactos.personas && !isNaN(Number(riesgo.impactos.personas)) ? Number(riesgo.impactos.personas) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.personas[valor] || ''}
                        </Typography>
                      );
                    })()}
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Integridad SGSI */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Integridad SGSI
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                          value={riesgo.impactos.integridadSGSI || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, integridadSGSI: val }
                              });
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.integridadSGSI[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                  </Select>
                </FormControl>
              </Box>
                    {(() => {
                      const valor = riesgo.impactos.integridadSGSI && !isNaN(Number(riesgo.impactos.integridadSGSI)) ? Number(riesgo.impactos.integridadSGSI) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.integridadSGSI[valor] || ''}
                        </Typography>
                      );
                    })()}
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      {/* Ambiental */}
                      <Box sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body1" fontWeight={600}>
                        Ambiental
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value={riesgo.impactos.ambiental || 1}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 5) {
                              actualizarRiesgo(riesgo.id, {
                                impactos: { ...riesgo.impactos, ambiental: val }
                              });
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <MenuItem key={val} value={val}>
                              <Tooltip 
                                title={DESCRIPCIONES_IMPACTO.ambiental[val] || ''}
                                arrow
                                placement="left"
                              >
                                <Box component="span" sx={{ width: '100%' }}>
                                  {val}
                                </Box>
                              </Tooltip>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
            </Box>
                    {(() => {
                      const valor = riesgo.impactos.ambiental && !isNaN(Number(riesgo.impactos.ambiental)) ? Number(riesgo.impactos.ambiental) : 1;
                      return (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                          {valor} - {DESCRIPCIONES_IMPACTO.ambiental[valor] || ''}
                        </Typography>
                      );
                      })()}
                    </Box>
                  </Box>
                </Grid2>
              </Grid2>
            </CardContent>
          </Card>

          {!isReadOnly && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              fullWidth
              sx={{ mt: 3 }}
              onClick={onSave}
            >
              Guardar
            </Button>
          )}
    </Box>
  );
}
