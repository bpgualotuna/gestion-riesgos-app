/**
 * Script para migrar datos de CSV a db.json
 * Lee los archivos CSV de la carpeta analisis y los convierte al formato JSON Server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para leer CSV y convertirlo a JSON
function csvToJson(csvPath, separator = ';') {
  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(separator).map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim());
      if (values.length === 0 || values[0] === '') continue;
      
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        // Limpiar comillas
        value = value.replace(/^"|"$/g, '');
        // Convertir a número si es posible
        if (value && !isNaN(value) && value !== '') {
          obj[header] = Number(value);
        } else if (value === 'True' || value === 'true') {
          obj[header] = true;
        } else if (value === 'False' || value === 'false') {
          obj[header] = false;
        } else {
          obj[header] = value || null;
        }
      });
      
      // Solo agregar si tiene al menos un campo con valor
      if (Object.values(obj).some(v => v !== null && v !== '')) {
        data.push(obj);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Error leyendo ${csvPath}:`, error.message);
    return [];
  }
}

// Función para mapear procesos desde CSV
function mapearProcesos(csvData) {
  return csvData.map((row, index) => {
    const procesoId = row['ID Proceso'] || String(index + 1);
    return {
      id: procesoId,
      nombre: row.Proceso || '',
      descripcion: `Proceso: ${row.Proceso || ''}`,
      vicepresidencia: 'Dirección General',
      gerencia: 'Dirección General',
      responsable: 'Usuario',
      responsableId: String(row['Responsable Proceso'] || '1'),
      area: row.Tipo?.includes('Estratégico') ? 'Estratégica' : row.Tipo?.includes('Operacional') ? 'Operacional' : 'Apoyo',
      objetivoProceso: row['Objetivo Proceso'] || '',
      tipoProceso: row.Tipo || '',
      activo: true,
      estado: 'borrador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).filter(p => p.nombre);
}

// Función para mapear personas desde CSV
function mapearPersonas(csvData) {
  return csvData.map((row, index) => {
    const personaId = String(row.Id || index + 1);
    return {
      id: personaId,
      nombre: row.Nombre || '',
      cargo: row.Cargo || '',
      activo: row.Activo === true || row.Activo === 'True' || row.Activo === 'true',
      email: `${(row.Nombre || 'usuario').toLowerCase().replace(/\s+/g, '.')}@comware.com`,
      role: row.Cargo?.includes('Director') ? 'manager' : 'owner',
    };
  }).filter(p => p.nombre);
}

// Función para mapear riesgos desde CSV
function mapearRiesgos(csvData) {
  return csvData.map((row, index) => {
    const riesgoId = String(row.Id || `riesgo-${index + 1}`);
    return {
      id: riesgoId,
      procesoId: String(row.Proceso || '1'),
      numero: index + 1,
      descripcion: row['Descripción Riesgo'] || row['Descripción del Riesgo'] || '',
      nombreRiesgo: row['Nombre Riesgo'] || '',
      clasificacion: row.Consecuencia || row['CLASIFICACIÓN\nRIESGO CON CONSECUENCIA POSITIVA (OPORTUNIDAD)/RIESGO CON CONSECUENCIA NEGATIVA'] || '01 Negativa',
      tipoRiesgo: row['Tipo de Riesgo'] || '',
      origenRiesgo: String(row['Origen del riesgo'] || ''),
      impactoPersonas: Number(row['Impacto personas'] || row['Impacto personas'] || 1),
      impactoLegal: Number(row['Impacto legal'] || 1),
      impactoAmbiental: Number(row['Impacto ambiental'] || 1),
      impactoProcesos: Number(row['Impacto procesos'] || 1),
      impactoReputacion: Number(row['Impacto reputación'] || 1),
      impactoEconomico: Number(row['Impacto económico'] || 1),
      impactoTecnologico: Number(row['Impacto tecnológico'] || 1),
      objetivo: Number(row.Objetivo || 1),
      impactoConfidencialidad: Number(row['Impacto confidencialidad'] || 1),
      impactoDisponibilidad: Number(row['Impacto disponibilidad'] || 1),
      impactoIntegridad: Number(row['Impacto integridad'] || 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).filter(r => r.descripcion);
}

// Función para mapear tipos de riesgo
function mapearTiposRiesgo(csvData) {
  return csvData.map((row, index) => ({
    id: String(row.Id || index + 1),
    tipo: row.Tipo || '',
    subtipo: row.Subtipo || '',
    descripcionSubtipo: row['Descripción subtipo'] || '',
    descripcionTipo: row['Descripción tipo'] || '',
  })).filter(t => t.tipo);
}

// Función para mapear causas
function mapearCausas(csvData) {
  return csvData.map((row, index) => ({
    id: String(row.Id || index + 1),
    riesgoId: String(row.Riesgo || '1'),
    causa: row.Causa || '',
    frecuencia: Number(row.Frecuencia || 1),
    fuente: String(row.Fuente || '1'),
    requiereControl: row['Requiere control'] === true || row['Requiere control'] === 'Si' || row['Requiere control'] === 'si',
    descripcionControl: row['Descripción del control'] || null,
    disminuye: row.Disminuye || null,
    responsableControl: row['Responsable control'] || null,
    aplicabilidad: row.Aplicabilidad ? Number(row.Aplicabilidad) : null,
    cobertura: row.Cobertura ? Number(row.Cobertura) : null,
    facilidadUso: row['Facilidad de uso'] ? Number(row['Facilidad de uso']) : null,
    segregacion: row.Segregación ? Number(row.Segregación) : null,
    naturaleza: row.Naturaleza ? Number(row.Naturaleza) : null,
    desviaciones: row.Desviaciones ? Number(row.Desviaciones) : null,
  })).filter(c => c.causa);
}

// Función principal
function migrarDatos() {
  const basePath = path.join(__dirname, '../../analisis/datos_exportados');
  const dbPath = path.join(__dirname, '../db.json');
  
  console.log('🚀 Iniciando migración de datos...\n');
  
  // Leer db.json actual
  let db = {};
  try {
    const dbContent = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(dbContent);
  } catch (error) {
    console.log('⚠️  db.json no existe o está vacío, creando nuevo...');
    db = {
      procesos: [],
      personas: [],
      riesgos: [],
      tiposRiesgo: [],
      causas: [],
      evaluaciones: [],
      observaciones: [],
      historial: [],
      notificaciones: [],
      tareas: [],
      planesAccion: [],
      usuarios: db.usuarios || [],
    };
  }
  
  // Migrar Procesos
  console.log('📋 Migrando Procesos...');
  const procesosCsv = csvToJson(path.join(basePath, '01_Procesos.csv'));
  const procesos = mapearProcesos(procesosCsv);
  db.procesos = procesos;
  console.log(`   ✅ ${procesos.length} procesos migrados`);
  
  // Migrar Personas
  console.log('👥 Migrando Personas...');
  const personasCsv = csvToJson(path.join(basePath, '02_Personas.csv'));
  const personas = mapearPersonas(personasCsv);
  db.personas = personas;
  console.log(`   ✅ ${personas.length} personas migradas`);
  
  // Migrar Riesgos
  console.log('⚠️  Migrando Riesgos...');
  const riesgosCsv = csvToJson(path.join(basePath, '03_Riesgos.csv'));
  const riesgos = mapearRiesgos(riesgosCsv);
  db.riesgos = riesgos;
  console.log(`   ✅ ${riesgos.length} riesgos migrados`);
  
  // Migrar Tipos de Riesgo
  console.log('📊 Migrando Tipos de Riesgo...');
  const tiposCsv = csvToJson(path.join(basePath, '04_Tipo_de_Riesgo.csv'));
  const tiposRiesgo = mapearTiposRiesgo(tiposCsv);
  db.tiposRiesgo = tiposRiesgo;
  console.log(`   ✅ ${tiposRiesgo.length} tipos de riesgo migrados`);
  
  // Migrar Causas
  console.log('🔗 Migrando Causas...');
  const causasCsv = csvToJson(path.join(basePath, '05_Causas.csv'));
  const causas = mapearCausas(causasCsv);
  db.causas = causas;
  console.log(`   ✅ ${causas.length} causas migradas`);
  
  // Mantener arrays vacíos para datos dinámicos
  if (!db.evaluaciones) db.evaluaciones = [];
  if (!db.observaciones) db.observaciones = [];
  if (!db.historial) db.historial = [];
  if (!db.notificaciones) db.notificaciones = [];
  if (!db.tareas) db.tareas = [];
  if (!db.planesAccion) db.planesAccion = [];
  
  // Mantener usuarios si existen
  if (!db.usuarios || db.usuarios.length === 0) {
    db.usuarios = [
      {
        id: "1",
        email: "admin@comware.com",
        password: "admin123",
        fullName: "Administrador",
        role: "admin",
        position: "Administrador del Sistema"
      },
      {
        id: "2",
        email: "owner@comware.com",
        password: "owner123",
        fullName: "Katherine Chavez",
        role: "owner",
        position: "Dueño de Procesos"
      },
      {
        id: "3",
        email: "manager@comware.com",
        password: "manager123",
        fullName: "Marco Alvarado",
        role: "manager",
        position: "Gerente"
      },
      {
        id: "4",
        email: "director@comware.com",
        password: "director123",
        fullName: "Carlos Rodríguez",
        role: "director",
        position: "Director de Procesos"
      }
    ];
  }
  
  // Guardar db.json
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  
  console.log('\n✅ Migración completada!');
  console.log(`\n📊 Resumen:`);
  console.log(`   - Procesos: ${db.procesos.length}`);
  console.log(`   - Personas: ${db.personas.length}`);
  console.log(`   - Riesgos: ${db.riesgos.length}`);
  console.log(`   - Tipos de Riesgo: ${db.tiposRiesgo.length}`);
  console.log(`   - Causas: ${db.causas.length}`);
  console.log(`\n💾 Datos guardados en: ${dbPath}`);
}

// Ejecutar migración
migrarDatos();

