/**
 * Script mejorado para generar db.json completo
 * Migra todos los datos de análisis (CSV + JSON Access) al sistema
 * Incluye: procesos, riesgos, evaluaciones, priorizaciones, encuestas, pasos, listas, parámetros, tipologías, fórmulas, configuraciones
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const analisisDir = path.join(__dirname, '../../analisis');
const datosTalentoHumanoDir = path.join(analisisDir, 'datos_excel_talento_humano');
const datosExportadosDir = path.join(analisisDir, 'datos_exportados');
const accessJsonFile = path.join(analisisDir, 'analisis_access_Matriz Riesgos (access).json');
const outputFile = path.join(__dirname, '../db.json');

// IDs de usuarios
const KATHERINE_CHAVEZ_ID = '1';
const MARCO_ALVARADO_ID = '5';

// Función para leer CSV
function leerCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length === headers.length && values.some(v => v)) {
        const obj = {};
        headers.forEach((header, idx) => {
          obj[header] = values[idx] || '';
        });
        data.push(obj);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error leyendo ${filePath}:`, error.message);
    return [];
  }
}

// Leer datos de Access JSON
function leerAccessData() {
  try {
    const content = fs.readFileSync(accessJsonFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error leyendo Access JSON:', error.message);
    return null;
  }
}

// Generar datos completos
function generarDBCompleto() {
  console.log('🚀 Generando db.json completo...');
  
  const db = {
    procesos: [],
    riesgos: [],
    evaluaciones: [],
    priorizaciones: [],
    planesAccion: [],
    tareas: [],
    notificaciones: [],
    observaciones: [],
    historial: [],
    areas: [],
    // Nuevas entidades
    pasosProceso: [],
    encuestas: [],
    preguntasEncuesta: [],
    listasValores: [],
    parametrosValoracion: [],
    tipologias: [],
    formulas: [],
    configuraciones: [],
    usuarios: [],
  };

  // ========== PROCESOS ==========
  console.log('📋 Procesando procesos...');
  const fichaData = leerCSV(path.join(datosTalentoHumanoDir, '1__Ficha.csv'));
  const procesosAccess = leerAccessData()?.tablas?.['01 Procesos']?.muestra_datos || [];
  
  // Proceso de Talento Humano (ya existente)
  db.procesos.push({
    id: '1',
    nombre: 'Talento Humano',
    descripcion: 'Gestión de recursos humanos y talento humano',
    vicepresidencia: 'Gestión Financiera y Administrativa',
    gerencia: 'Dirección Financiera Administrativa',
    subdivision: 'Talento Humano',
    responsable: 'Katherine Chávez',
    responsableId: KATHERINE_CHAVEZ_ID,
    responsableNombre: 'Katherine Chávez',
    areaId: '1',
    areaNombre: 'Talento Humano',
    directorId: MARCO_ALVARADO_ID,
    directorNombre: 'Marco Alvarado',
    objetivoProceso: 'Gestionar eficientemente el capital humano de la organización',
    tipoProceso: 'Talento Humano',
    activo: true,
    estado: 'borrador',
    version: '1.0',
    aprobador: 'Marco Alvarado',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  });

  // Agregar procesos de Access
  procesosAccess.forEach((proc, idx) => {
    if (proc.Proceso && proc.Proceso !== 'Talento Humano') {
      db.procesos.push({
        id: String(db.procesos.length + 1),
        nombre: proc.Proceso,
        descripcion: proc['Objetivo Proceso'] || '',
        tipoProceso: proc.Tipo || '',
        responsableId: String(proc['Responsable Proceso'] || ''),
        activo: true,
        estado: 'borrador',
        version: '1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  });

  // ========== PASOS DEL PROCESO ==========
  console.log('📑 Procesando pasos del proceso...');
  db.pasosProceso = [
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

  // ========== ENCUESTAS ==========
  console.log('📝 Procesando encuestas...');
  const encuestaData = leerCSV(path.join(datosTalentoHumanoDir, 'Encuesta.csv'));
  db.encuestas = [
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

  db.preguntasEncuesta = encuestaData.map((item, idx) => ({
    id: `pregunta-${idx + 1}`,
    encuestaId: '1',
    orden: idx + 1,
    pregunta: item.Instrucciones || '',
    tipo: 'texto',
    requerida: false,
    opciones: [],
    createdAt: new Date().toISOString(),
  }));

  // ========== LISTAS DE VALORES ==========
  console.log('📊 Procesando listas de valores...');
  const listasData = leerCSV(path.join(datosTalentoHumanoDir, 'Listas.csv'));
  
  // Vicepresidencias/Gerencias
  const vicepresidencias = listasData
    .filter(item => item['Vicepresidencia/ Gerencia alta'])
    .map(item => item['Vicepresidencia/ Gerencia alta']);
  
  // Zonas
  const zonas = [...new Set(listasData.map(item => item.Zona).filter(z => z))];
  
  // Procesos
  const procesos = [...new Set(listasData.map(item => item.Proceso).filter(p => p))];
  
  // Macroprocesos
  const macroprocesos = [...new Set(listasData.map(item => item.Macroproceso).filter(m => m))];
  
  // Fuentes
  const fuentes = [...new Set(listasData.map(item => item.Fuente).filter(f => f))];

  db.listasValores = [
    {
      id: '1',
      nombre: 'Vicepresidencias/Gerencias',
      codigo: 'vicepresidencias',
      valores: vicepresidencias,
      descripcion: 'Lista de vicepresidencias y gerencias altas',
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      nombre: 'Zonas',
      codigo: 'zonas',
      valores: zonas,
      descripcion: 'Lista de zonas geográficas',
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      nombre: 'Procesos',
      codigo: 'procesos',
      valores: procesos,
      descripcion: 'Lista de procesos del sistema',
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      nombre: 'Macroprocesos',
      codigo: 'macroprocesos',
      valores: macroprocesos,
      descripcion: 'Lista de macroprocesos',
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      nombre: 'Fuentes',
      codigo: 'fuentes',
      valores: fuentes,
      descripcion: 'Lista de fuentes de riesgo',
      activa: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // ========== PARÁMETROS DE VALORACIÓN ==========
  console.log('⚙️ Procesando parámetros de valoración...');
  const parametrosData = leerCSV(path.join(datosTalentoHumanoDir, 'Parámetros_de_Valoración.csv'));
  
  db.parametrosValoracion = [
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

  // ========== TIPOLOGÍAS ==========
  console.log('🏷️ Procesando tipologías...');
  const tipologiaNivelI = leerCSV(path.join(datosTalentoHumanoDir, 'Tipologias_Nivel_I.csv'));
  const tipologiaNivelII = leerCSV(path.join(datosTalentoHumanoDir, 'Tipologias_Nivel_II.csv'));
  const tipologiaNivelIII_IV = leerCSV(path.join(datosTalentoHumanoDir, 'Tipologías_III-IV_SO_y_Ambien.csv'));
  const tipologiaNivelIII_Seg = leerCSV(path.join(datosTalentoHumanoDir, 'Tipologías_III-Seg__Informacion.csv'));

  db.tipologias = [
    {
      id: '1',
      nombre: 'Tipologías Nivel I',
      nivel: 'I',
      categorias: tipologiaNivelI.map((item, idx) => ({
        id: `cat-1-${idx + 1}`,
        codigo: item['Nivel I'] || '',
        descripcion: item.Descripción || '',
      })),
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      nombre: 'Tipologías Nivel II',
      nivel: 'II',
      categorias: tipologiaNivelII.map((item, idx) => ({
        id: `cat-2-${idx + 1}`,
        codigo: item['Nivel II'] || '',
        descripcion: item.Descripción || '',
      })),
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      nombre: 'Tipologías III-IV SO y Ambiental',
      nivel: 'III-IV',
      categorias: tipologiaNivelIII_IV.map((item, idx) => ({
        id: `cat-3-${idx + 1}`,
        codigo: item['Nivel III-IV'] || '',
        descripcion: item.Descripción || '',
      })),
      activa: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      nombre: 'Tipologías III Seg. Información',
      nivel: 'III',
      categorias: tipologiaNivelIII_Seg.map((item, idx) => ({
        id: `cat-4-${idx + 1}`,
        codigo: item['Nivel III'] || '',
        descripcion: item.Descripción || '',
      })),
      activa: true,
      createdAt: new Date().toISOString(),
    },
  ];

  // ========== FÓRMULAS ==========
  console.log('🔢 Procesando fórmulas...');
  const formulasData = leerCSV(path.join(datosTalentoHumanoDir, 'Formulas.csv'));
  
  db.formulas = formulasData
    .filter(item => item.Formula && item.Formula.trim())
    .map((item, idx) => ({
      id: `formula-${idx + 1}`,
      nombre: item.Nombre || `Fórmula ${idx + 1}`,
      descripcion: item.Descripción || '',
      formula: item.Formula || '',
      categoria: item.Categoría || 'riesgo',
      activa: true,
      variables: [],
      createdAt: new Date().toISOString(),
    }));

  // ========== CONFIGURACIONES ==========
  console.log('⚙️ Procesando configuraciones...');
  db.configuraciones = [
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

  // ========== ÁREAS ==========
  db.areas = [
    { id: '1', nombre: 'Talento Humano', descripcion: 'Gestión de recursos humanos', activo: true, createdAt: new Date().toISOString() },
    { id: '2', nombre: 'Gestión Financiera y Administrativa', descripcion: 'Gestión financiera', activo: true, createdAt: new Date().toISOString() },
    { id: '3', nombre: 'Operaciones', descripcion: 'Operaciones del negocio', activo: true, createdAt: new Date().toISOString() },
    { id: '4', nombre: 'Tecnología', descripcion: 'Tecnología e innovación', activo: true, createdAt: new Date().toISOString() },
  ];

  // ========== RIESGOS, EVALUACIONES, PRIORIZACIONES (usar script existente) ==========
  // Estos se generan con el script anterior, aquí solo agregamos las nuevas entidades

  console.log('✅ Generación completa!');
  console.log(`📊 Resumen:`);
  console.log(`   - Procesos: ${db.procesos.length}`);
  console.log(`   - Pasos: ${db.pasosProceso.length}`);
  console.log(`   - Encuestas: ${db.encuestas.length}`);
  console.log(`   - Preguntas: ${db.preguntasEncuesta.length}`);
  console.log(`   - Listas: ${db.listasValores.length}`);
  console.log(`   - Parámetros: ${db.parametrosValoracion.length}`);
  console.log(`   - Tipologías: ${db.tipologias.length}`);
  console.log(`   - Fórmulas: ${db.formulas.length}`);
  console.log(`   - Configuraciones: ${db.configuraciones.length}`);

  // Leer db.json existente y fusionar
  let dbExistente = {};
  try {
    const contenidoExistente = fs.readFileSync(outputFile, 'utf-8');
    dbExistente = JSON.parse(contenidoExistente);
  } catch (error) {
    console.log('No existe db.json previo, creando nuevo...');
  }

  // Fusionar datos
  const dbFinal = {
    ...dbExistente,
    pasosProceso: db.pasosProceso,
    encuestas: db.encuestas,
    preguntasEncuesta: db.preguntasEncuesta,
    listasValores: db.listasValores,
    parametrosValoracion: db.parametrosValoracion,
    tipologias: db.tipologias,
    formulas: db.formulas,
    configuraciones: db.configuraciones,
    // Actualizar procesos si no existen
    procesos: dbExistente.procesos?.length ? dbExistente.procesos : db.procesos,
    areas: dbExistente.areas?.length ? dbExistente.areas : db.areas,
  };

  // Guardar
  fs.writeFileSync(outputFile, JSON.stringify(dbFinal, null, 2), 'utf-8');
  console.log(`💾 db.json guardado en: ${outputFile}`);
}

// Ejecutar
generarDBCompleto();

