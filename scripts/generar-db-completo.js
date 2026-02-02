/**
 * Script para generar db.json completo desde los CSV de análisis
 * Incluye: procesos, riesgos, evaluaciones, priorizaciones, tareas, notificaciones, historial
 * Asigna el proceso de Talento Humano a Katherine Chávez
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const analisisDir = path.join(__dirname, '../../analisis');
const datosTalentoHumanoDir = path.join(analisisDir, 'datos_excel_talento_humano');
const outputFile = path.join(__dirname, '../db.json');

// IDs de usuarios (según AuthContext)
const KATHERINE_CHAVEZ_ID = '1'; // Dueño de Procesos
const MARCO_ALVARADO_ID = '5'; // Director de Procesos

// Leer CSV de Ficha para obtener información del proceso
function leerFicha() {
  try {
    const filePath = path.join(datosTalentoHumanoDir, '1__Ficha.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const ficha = {
      vicepresidencia: '',
      gerencia: '',
      subdivision: '',
      gestorValor: '',
      aprobador: '',
      version: '',
      participantes: [],
    };
    
    lines.forEach(line => {
      const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values[1] && values[1].includes('Vicepresidencia')) {
        ficha.vicepresidencia = values[2] || '';
      } else if (values[1] && values[1].includes('Gerencia:')) {
        ficha.gerencia = values[2] || '';
      } else if (values[1] && values[1].includes('Subdivisión:')) {
        ficha.subdivision = values[2] || '';
      } else if (values[1] && values[1].includes('Gestor de Valor:')) {
        ficha.gestorValor = values[2] || '';
      } else if (values[1] && values[1].includes('aprobador')) {
        ficha.aprobador = values[2] || '';
      } else if (values[1] && values[1].includes('Versión')) {
        ficha.version = values[2] || '';
      } else if (values[0] && values[0].match(/^Katherine|^Marco|^Lizeth/)) {
        ficha.participantes.push({
          nombre: values[0],
          subdivision: values[1] || '',
        });
      }
    });
    
    return ficha;
  } catch (error) {
    console.error('Error leyendo ficha:', error.message);
    return null;
  }
}

// Leer CSV y convertir a JSON (mejorado para manejar filas con solo causas)
function parseCSVIdentificacion(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const riesgos = [];
  let currentRiesgo = null;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\n/g, ' ');
    const values = line.split(';').map(v => v.trim().replace(/^"|"$/g, ''));
    
    // Si la primera columna tiene un número, es un nuevo riesgo
    const numero = parseInt(values[0]);
    if (numero && numero > 0 && values[1] && values[1] !== '0' && values[1].length > 10) {
      // Guardar el riesgo anterior si existe
      if (currentRiesgo && currentRiesgo.descripcion) {
        riesgos.push(currentRiesgo);
      }
      
      // Crear nuevo riesgo
      currentRiesgo = {
        numero: numero,
        descripcion: values[1] || '',
        clasificacion: values[2] || 'Riesgo con consecuencia negativa',
        proceso: values[3] || 'Gestión Talento Humano',
        zona: values[4] || '',
        tipologiaNivelI: values[5] || '',
        tipologiaNivelII: values[6] || '',
        tipologiaNivelIII: values[7] || '',
        tipologiaNivelIV: values[8] || '',
        causas: [],
      };
      
      // Agregar primera causa si existe
      if (values[9] && values[9] !== '0' && values[9].trim().length > 0) {
        currentRiesgo.causas.push({
          causa: values[9],
          fuenteCausa: values[10] || '',
          fuenteCausaHSEQ: values[11] || '',
          fuenteCausaLAFT: values[12] || '',
          areasAfectadas: values[13] || '',
        });
      }
    } else if (currentRiesgo && values[9] && values[9] !== '0' && values[9].trim().length > 0) {
      // Es una causa adicional del riesgo actual (fila con solo causas)
      currentRiesgo.causas.push({
        causa: values[9],
        fuenteCausa: values[10] || '',
        fuenteCausaHSEQ: values[11] || '',
        fuenteCausaLAFT: values[12] || '',
        areasAfectadas: values[13] || '',
      });
    }
  }
  
  // Agregar último riesgo
  if (currentRiesgo && currentRiesgo.descripcion) {
    riesgos.push(currentRiesgo);
  }
  
  return riesgos;
}

// Leer CSV de evaluación
function leerEvaluacionCSV() {
  try {
    const filePath = path.join(datosTalentoHumanoDir, '4__Evaluación.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const evaluaciones = [];
    
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      const idRiesgo = values[1] || values[3];
      
      if (idRiesgo && idRiesgo.match(/^\d+GFA$/)) {
        const numero = parseInt(idRiesgo);
        evaluaciones.push({
          idRiesgo: idRiesgo,
          numero: numero,
        });
      }
    }
    
    return evaluaciones;
  } catch (error) {
    console.error('Error leyendo evaluación:', error.message);
    return [];
  }
}

// Leer CSV de priorización
function leerPriorizacionCSV() {
  try {
    const filePath = path.join(datosTalentoHumanoDir, '6__Priorización_y_Respuesta.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const priorizaciones = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''));
      const idRiesgo = values[1];
      const descripcion = values[2];
      const respuesta = values[3] || values[4] || '';
      
      if (idRiesgo && idRiesgo.match(/^\d+GFA$/) && descripcion && descripcion !== '0') {
        priorizaciones.push({
          idRiesgo: idRiesgo,
          numero: parseInt(idRiesgo),
          descripcion: descripcion,
          respuesta: respuesta,
        });
      }
    }
    
    return priorizaciones;
  } catch (error) {
    console.error('Error leyendo priorización:', error.message);
    return [];
  }
}

// Función principal
function generarDB() {
  console.log('🚀 Generando db.json completo desde CSV de Talento Humano...\n');

  // Leer ficha del proceso
  console.log('📖 Leyendo Ficha del Proceso...');
  const ficha = leerFicha();
  if (ficha) {
    console.log(`   ✓ Vicepresidencia: ${ficha.vicepresidencia}`);
    console.log(`   ✓ Gerencia: ${ficha.gerencia}`);
    console.log(`   ✓ Subdivisión: ${ficha.subdivision}`);
    console.log(`   ✓ Gestor de Valor: ${ficha.gestorValor}`);
    console.log(`   ✓ Aprobador: ${ficha.aprobador}`);
  }

  // Leer datos de CSV
  console.log('\n📖 Leyendo CSV de Identificación...');
  const identificacion = parseCSVIdentificacion(
    fs.readFileSync(path.join(datosTalentoHumanoDir, '3__Identificación.csv'), 'utf-8')
  );
  console.log(`   ✓ ${identificacion.length} riesgos encontrados`);

  console.log('📖 Leyendo CSV de Evaluación...');
  const evaluacionesCSV = leerEvaluacionCSV();
  console.log(`   ✓ ${evaluacionesCSV.length} IDs de evaluación encontrados`);

  console.log('📖 Leyendo CSV de Priorización...');
  const priorizacion = leerPriorizacionCSV();
  console.log(`   ✓ ${priorizacion.length} priorizaciones encontradas`);

  // Proceso de Talento Humano (asignado a Katherine Chávez)
  const procesoTalentoHumano = {
    id: '1',
    nombre: 'Talento Humano',
    descripcion: 'Gestión de recursos humanos y talento humano',
    vicepresidencia: ficha?.vicepresidencia || 'Gestión Financiera y Administrativa',
    gerencia: ficha?.gerencia || 'Dirección Financiera Administrativa',
    subdivision: ficha?.subdivision || 'Talento Humano',
    responsable: 'Katherine Chávez',
    responsableId: KATHERINE_CHAVEZ_ID, // Asignado a Katherine Chávez
    responsableNombre: 'Katherine Chávez',
    areaId: '1',
    areaNombre: 'Talento Humano',
    directorId: MARCO_ALVARADO_ID, // Marco Alvarado como director
    directorNombre: 'Marco Alvarado',
    objetivoProceso: 'Gestionar eficientemente el capital humano de la organización, asegurando la atracción, desarrollo y retención del talento necesario para alcanzar los objetivos estratégicos',
    tipoProceso: 'Talento Humano',
    activo: true,
    estado: 'borrador',
    version: ficha?.version || '1.0',
    aprobador: ficha?.aprobador || 'Marco Alvarado',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  // Convertir riesgos del CSV
  const riesgos = identificacion.map((row) => {
    const numero = row.numero;
    const idRiesgo = `${numero}GFA`;
    const causaPrincipal = row.causas && row.causas.length > 0 ? row.causas[0] : {};
    
    return {
      id: `riesgo-${numero}`,
      procesoId: '1',
      numero: numero,
      descripcion: row.descripcion || '',
      clasificacion: row.clasificacion || 'Riesgo con consecuencia negativa',
      proceso: row.proceso || 'Gestión Talento Humano',
      zona: row.zona || 'Operacional',
      tipologiaNivelI: row.tipologiaNivelI || '',
      tipologiaNivelII: row.tipologiaNivelII || '',
      tipologiaNivelIII: row.tipologiaNivelIII || '',
      tipologiaNivelIV: row.tipologiaNivelIV || '',
      causaRiesgo: causaPrincipal.causa || '',
      fuenteCausa: causaPrincipal.fuenteCausa || '',
      fuenteCausaHSEQ: causaPrincipal.fuenteCausaHSEQ || '',
      fuenteCausaLAFT: causaPrincipal.fuenteCausaLAFT || '',
      vicepresidenciaGerenciaAlta: procesoTalentoHumano.vicepresidencia,
      siglaVicepresidencia: 'GFA',
      gerencia: procesoTalentoHumano.gerencia,
      siglaGerencia: 'GFA',
      subdivision: procesoTalentoHumano.subdivision,
      siglaSubdivision: 'TH',
      macroproceso: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).filter(r => r.descripcion);

  // Crear riesgos adicionales basados en los IDs de evaluación (si hay más de los que tenemos descripción)
  const riesgosExistentes = riesgos.map(r => r.numero);
  const todosLosNumeros = evaluacionesCSV.map(e => e.numero).filter(n => n > 0);
  const numerosFaltantes = todosLosNumeros.filter(n => !riesgosExistentes.includes(n));
  
  if (numerosFaltantes.length > 0) {
    console.log(`   ⚠️  ${numerosFaltantes.length} riesgos adicionales detectados en evaluación sin descripción completa`);
    numerosFaltantes.forEach(numero => {
      riesgos.push({
        id: `riesgo-${numero}`,
        procesoId: '1',
        numero: numero,
        descripcion: `Riesgo ${numero} - Gestión Talento Humano`,
        clasificacion: 'Riesgo con consecuencia negativa',
        proceso: 'Gestión Talento Humano',
        zona: 'Operacional',
        tipologiaNivelI: '',
        tipologiaNivelII: '',
        tipologiaNivelIII: '',
        tipologiaNivelIV: '',
        causaRiesgo: '',
        fuenteCausa: '',
        fuenteCausaHSEQ: '',
        fuenteCausaLAFT: '',
        vicepresidenciaGerenciaAlta: procesoTalentoHumano.vicepresidencia,
        siglaVicepresidencia: 'GFA',
        gerencia: procesoTalentoHumano.gerencia,
        siglaGerencia: 'GFA',
        subdivision: procesoTalentoHumano.subdivision,
        siglaSubdivision: 'TH',
        macroproceso: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  // Evaluaciones
  const evaluaciones = riesgos.map((riesgo) => {
    const evalCSV = evaluacionesCSV.find(e => e.numero === riesgo.numero);
    return {
      id: `eval-${riesgo.id}`,
      riesgoId: riesgo.id,
      procesoId: riesgo.procesoId,
      impactosNegativos: {
        personas: 1,
        legal: 1,
        ambiental: 1,
        procesos: 1,
        reputacion: 1,
        economico: 1,
        tecnologico: 0,
      },
      frecuenciaNegativa: 1,
      impactosPositivos: {
        personas: 1,
        legal: 1,
        ambiental: 1,
        procesos: 1,
        reputacion: 1,
        economico: 1,
        tecnologico: 0,
      },
      frecuenciaPositiva: 1,
      requiereControles: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Priorizaciones
  const priorizaciones = priorizacion.map((row, index) => {
    const numero = row.numero;
    const riesgo = riesgos.find(r => r.numero === numero);
    
    return {
      id: `prior-${index + 1}`,
      riesgoId: riesgo?.id || `riesgo-${numero}`,
      calificacionFinal: 'NIVEL MEDIO',
      respuesta: row.respuesta || 'Mitigar',
      responsable: 'Katherine Chávez',
      responsableId: KATHERINE_CHAVEZ_ID,
      fechaAsignacion: new Date().toISOString().split('T')[0],
      puntajePriorizacion: 50,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Planes de Acción
  const planesAccion = priorizaciones
    .filter(p => p.respuesta && p.respuesta !== '0' && p.respuesta !== 'Mitigar' && p.respuesta.trim().length > 0)
    .map((prior, index) => ({
      id: `plan-${index + 1}`,
      riesgoId: prior.riesgoId,
      procesoId: '1',
      descripcion: `Plan de acción para ${prior.respuesta}`,
      responsableId: KATHERINE_CHAVEZ_ID,
      responsableNombre: 'Katherine Chávez',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaLimite: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'pendiente',
      avance: 0,
      prioridad: 'media',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  // Tareas (vacías por ahora, se generan desde notificaciones)
  const tareas = [];

  // Notificaciones (vacías por ahora)
  const notificaciones = [];

  // Observaciones (vacías por ahora)
  const observaciones = [];

  // Historial - Inicial con creación del proceso
  const historial = [
    {
      id: 'hist-1',
      procesoId: '1',
      usuarioId: KATHERINE_CHAVEZ_ID,
      usuarioNombre: 'Katherine Chávez',
      accion: 'creado',
      descripcion: `Proceso "${procesoTalentoHumano.nombre}" creado y asignado a ${procesoTalentoHumano.responsableNombre}`,
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  // Áreas
  const areas = [
    {
      id: '1',
      nombre: 'Talento Humano',
      descripcion: 'Área de Talento Humano',
      directorId: MARCO_ALVARADO_ID,
      directorNombre: 'Marco Alvarado',
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Construir db.json
  const db = {
    procesos: [procesoTalentoHumano],
    riesgos: riesgos.sort((a, b) => a.numero - b.numero), // Ordenar por número
    evaluaciones: evaluaciones,
    priorizaciones: priorizaciones,
    planesAccion: planesAccion,
    tareas: tareas,
    notificaciones: notificaciones,
    observaciones: observaciones,
    historial: historial,
    areas: areas,
  };

  // Guardar
  fs.writeFileSync(outputFile, JSON.stringify(db, null, 2), 'utf-8');
  
  console.log('\n✅ db.json generado exitosamente!');
  console.log(`\n📊 Resumen:`);
  console.log(`   - Procesos: ${db.procesos.length}`);
  console.log(`   - Riesgos: ${db.riesgos.length}`);
  console.log(`   - Evaluaciones: ${db.evaluaciones.length}`);
  console.log(`   - Priorizaciones: ${db.priorizaciones.length}`);
  console.log(`   - Planes de Acción: ${db.planesAccion.length}`);
  console.log(`   - Tareas: ${db.tareas.length}`);
  console.log(`   - Notificaciones: ${db.notificaciones.length}`);
  console.log(`   - Observaciones: ${db.observaciones.length}`);
  console.log(`   - Historial: ${db.historial.length}`);
  console.log(`   - Áreas: ${db.areas.length}`);
  console.log(`\n👤 Proceso asignado a: ${procesoTalentoHumano.responsableNombre} (ID: ${procesoTalentoHumano.responsableId})`);
  console.log(`👔 Director: ${procesoTalentoHumano.directorNombre} (ID: ${procesoTalentoHumano.directorId})`);
  console.log(`\n📁 Archivo guardado en: ${outputFile}`);
}

// Ejecutar
generarDB();
