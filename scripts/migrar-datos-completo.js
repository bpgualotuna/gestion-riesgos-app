/**
 * Script completo para migrar TODOS los datos de CSV a db.json
 * Incluye: procesos, personas, riesgos, tipos, causas, normatividad, catálogos, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para leer CSV
function csvToJson(csvPath, separator = ';') {
  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(separator).map(h => h.trim().replace(/\n/g, ' '));
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim());
      if (values.length === 0 || values[0] === '') continue;
      
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index] || '';
        value = value.replace(/^"|"$/g, '');
        if (value && !isNaN(value) && value !== '') {
          obj[header] = Number(value);
        } else if (value === 'True' || value === 'true' || value === 'X') {
          obj[header] = true;
        } else if (value === 'False' || value === 'false') {
          obj[header] = false;
        } else {
          obj[header] = value || null;
        }
      });
      
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

function migrarDatosCompleto() {
  const basePath = path.join(__dirname, '../../analisis/datos_exportados');
  const talentoHumanoPath = path.join(__dirname, '../../analisis/datos_excel_talento_humano');
  const dbPath = path.join(__dirname, '../db.json');
  
  console.log('🚀 Iniciando migración COMPLETA de datos...\n');
  
  let db = {};
  try {
    const dbContent = fs.readFileSync(dbPath, 'utf-8');
    db = JSON.parse(dbContent);
  } catch {
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
      usuarios: [],
      normatividad: [],
      frecuencia: [],
      objetivos: [],
      aplicabilidad: [],
      cobertura: [],
      facilidadUso: [],
      segregacion: [],
      naturaleza: [],
      desviaciones: [],
      impactoPersonas: [],
      impactoLegal: [],
      impactoAmbiental: [],
      impactoProcesos: [],
      impactoReputacion: [],
      impactoEconomico: [],
      impactoTecnologico: [],
      impactoConfidencialidad: [],
      impactoDisponibilidad: [],
      impactoIntegridad: [],
    };
  }
  
  // 1. PROCESOS
  console.log('📋 Migrando Procesos...');
  const procesosCsv = csvToJson(path.join(basePath, '01_Procesos.csv'));
  db.procesos = procesosCsv.map((row, idx) => ({
    id: String(row['ID Proceso'] || idx + 1),
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
  })).filter(p => p.nombre);
  console.log(`   ✅ ${db.procesos.length} procesos`);
  
  // 2. PERSONAS
  console.log('👥 Migrando Personas...');
  const personasCsv = csvToJson(path.join(basePath, '02_Personas.csv'));
  db.personas = personasCsv.map((row, idx) => ({
    id: String(row.Id || idx + 1),
    nombre: row.Nombre || '',
    cargo: row.Cargo || '',
    activo: row.Activo === true || row.Activo === 'True',
    email: `${(row.Nombre || 'usuario').toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@ejemplo.com`,
    role: row.Cargo?.includes('Director') ? 'manager' : 'owner',
  })).filter(p => p.nombre);
  console.log(`   ✅ ${db.personas.length} personas`);
  
  // 3. RIESGOS
  console.log('⚠️  Migrando Riesgos...');
  const riesgosCsv = csvToJson(path.join(basePath, '03_Riesgos.csv'));
  db.riesgos = riesgosCsv.map((row, idx) => ({
    id: String(row.Id || `riesgo-${idx + 1}`),
    procesoId: String(row.Proceso || '1'),
    numero: idx + 1,
    descripcion: row['Descripción Riesgo'] || '',
    nombreRiesgo: row['Nombre Riesgo'] || '',
    clasificacion: row.Consecuencia || '01 Negativa',
    tipoRiesgo: row['Tipo de Riesgo'] || '',
    origenRiesgo: String(row['Origen del riesgo'] || ''),
    impactoPersonas: Number(row['Impacto personas'] || 1),
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
  })).filter(r => r.descripcion);
  console.log(`   ✅ ${db.riesgos.length} riesgos`);
  
  // 4. TIPOS DE RIESGO
  console.log('📊 Migrando Tipos de Riesgo...');
  const tiposCsv = csvToJson(path.join(basePath, '04_Tipo_de_Riesgo.csv'));
  db.tiposRiesgo = tiposCsv.map((row, idx) => ({
    id: String(row.Id || idx + 1),
    tipo: row.Tipo || '',
    subtipo: row.Subtipo || '',
    descripcionSubtipo: row['Descripción subtipo'] || '',
    descripcionTipo: row['Descripción tipo'] || '',
  })).filter(t => t.tipo);
  console.log(`   ✅ ${db.tiposRiesgo.length} tipos`);
  
  // 5. CAUSAS
  console.log('🔗 Migrando Causas...');
  const causasCsv = csvToJson(path.join(basePath, '05_Causas.csv'));
  db.causas = causasCsv.map((row, idx) => ({
    id: String(row.Id || idx + 1),
    riesgoId: String(row.Riesgo || '1'),
    causa: row.Causa || '',
    frecuencia: Number(row.Frecuencia || 1),
    fuente: String(row.Fuente || '1'),
    requiereControl: row['Requiere control'] === true || row['Requiere control'] === 'Si',
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
  console.log(`   ✅ ${db.causas.length} causas`);
  
  // 6. FRECUENCIA
  console.log('⏱️  Migrando Frecuencia...');
  const frecuenciaCsv = csvToJson(path.join(basePath, '06_Frecuencia.csv'));
  db.frecuencia = frecuenciaCsv.map((row, idx) => ({
    id: String(row.Id || idx + 1),
    frecuencia: row.Frecuencia || '',
    descripcion: row.Descripción || '',
  })).filter(f => f.frecuencia);
  console.log(`   ✅ ${db.frecuencia.length} frecuencias`);
  
  // 7. OBJETIVOS
  console.log('🎯 Migrando Objetivos...');
  const objetivosCsv = csvToJson(path.join(basePath, '08_Objetivos.csv'));
  db.objetivos = objetivosCsv.map((row, idx) => ({
    id: String(row.Id || idx + 1),
    objetivo: row.Objetivo || '',
  })).filter(o => o.objetivo);
  console.log(`   ✅ ${db.objetivos.length} objetivos`);
  
  // 8. CATÁLOGOS DE IMPACTO
  console.log('📈 Migrando Catálogos de Impacto...');
  const impactos = [
    { file: '07_Impacto_personas.csv', key: 'impactoPersonas', colName: 'Impacto personas' },
    { file: '07_impacto_legal.csv', key: 'impactoLegal', colName: 'Impacto legal' },
    { file: '07_impacto_ambiental.csv', key: 'impactoAmbiental', colName: 'Impacto ambiental' },
    { file: '07_impacto_procesos.csv', key: 'impactoProcesos', colName: 'Impacto procesos' },
    { file: '07_impacto_reputación.csv', key: 'impactoReputacion', colName: 'Impacto reputación' },
    { file: '07_impacto_económico.csv', key: 'impactoEconomico', colName: 'Impacto económico' },
    { file: '07_impacto_tecnológico.csv', key: 'impactoTecnologico', colName: 'Impacto tecnológico' },
    { file: '07_impacto_SGSI_confidencialidad.csv', key: 'impactoConfidencialidad', colName: 'Impacto confidencialidad' },
    { file: '07_impacto_SGSI_disponibilidad.csv', key: 'impactoDisponibilidad', colName: 'Impacto disponibilidad' },
    { file: '07_impacto_SGSI_integridad.csv', key: 'impactoIntegridad', colName: 'Impacto integridad' },
  ];
  
  impactos.forEach(({ file, key, colName }) => {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      const csv = csvToJson(filePath);
      db[key] = csv.map((row, idx) => ({
        id: String(row.Id || idx + 1),
        valor: idx + 1,
        descripcion: row[colName] || row['Impacto personas'] || row['Impacto legal'] || row['Impacto ambiental'] || row['Impacto procesos'] || row['Impacto reputación'] || row['Impacto económico'] || row['Impacto tecnológico'] || row['Impacto confidencialidad'] || row['Impacto disponibilidad'] || row['Impacto integridad'] || '',
      })).filter(i => i.descripcion);
      console.log(`   ✅ ${db[key].length} registros de ${key}`);
    }
  });
  
  // 9. CATÁLOGOS DE CONTROL
  console.log('🔧 Migrando Catálogos de Control...');
  const controles = [
    { file: '09_Aplicabilidad.csv', key: 'aplicabilidad', colName: 'Aplicabilidad' },
    { file: '09_Cobertura.csv', key: 'cobertura', colName: 'Cobertura' },
    { file: '09_Facilidad_de_uso.csv', key: 'facilidadUso', colName: 'Facilidad de uso' },
    { file: '09_Segregación.csv', key: 'segregacion', colName: 'Segregación' },
    { file: '09_Naturaleza.csv', key: 'naturaleza', colName: 'Naturaleza' },
    { file: '09_Desviaciones.csv', key: 'desviaciones', colName: 'Desviaciones' },
  ];
  
  controles.forEach(({ file, key, colName }) => {
    const filePath = path.join(basePath, file);
    if (fs.existsSync(filePath)) {
      const csv = csvToJson(filePath);
      db[key] = csv.map((row, idx) => ({
        id: String(row.Id || idx + 1),
        valor: row[colName] || '',
        peso: row.Peso ? Number(row.Peso) : null,
        descripcion: row.Descripción || row.Descripcion || row[colName] || '',
      })).filter(c => c.valor || c.descripcion);
      console.log(`   ✅ ${db[key].length} registros de ${key}`);
    }
  });
  
  // 10. NORMATIVIDAD (de Talento Humano)
  console.log('📜 Migrando Normatividad...');
  const normatividadPath = path.join(talentoHumanoPath, '2__Inventario_de_Normatividad.csv');
  if (fs.existsSync(normatividadPath)) {
    const normatividadCsv = csvToJson(normatividadPath);
    db.normatividad = normatividadCsv
      .map((row, idx) => {
        const nro = row.Nro || row['Nro.'] || idx + 1;
        const nombreReg = row['Nombre de la regulación aplicable'] || '';
        const tipo = row['Proyecto, Requerida, Existente'] || '';
        
        // Solo procesar si tiene nombre de regulación válido
        if (!nombreReg || nombreReg.trim() === '' || nombreReg === 'N/A') {
          return null;
        }
        
        return {
          id: String(nro),
          numero: Number(nro) || idx + 1,
          nombreRegulacion: nombreReg,
          tipo: tipo,
          regulador: row.Regulador || '',
          sanciones: row['Sanciones Penales/Civiles/Económicas por Incumplimiento'] || '',
          plazoImplementacion: row['Plazo para implementación \n(En caso de ser proyecto/requerida)'] || row['Plazo para implementación (En caso de ser proyecto/requerida)'] || null,
          cumplimientoTotal: row['Cumplimiento Total'] === true || row['Cumplimiento Total'] === 'X' || row['Cumplimiento Total'] === 'x',
          cumplimientoParcial: row['Cumplimiento Parcial'] === true || row['Cumplimiento Parcial'] === 'X' || row['Cumplimiento Parcial'] === 'x',
          noCumple: row['No cumple'] === true || row['No cumple'] === 'X' || row['No cumple'] === 'x',
          detalleIncumplimiento: row['Detalle del incumplimiento'] || '',
          riesgoIdentificado: row['Riesgo Identificado'] || '',
          clasificacion: row['Clasificación \nRiesgo con consecuencia positiva (Oportunidad)/Riesgo con consecuencia Negativa'] || row['Clasificación Riesgo con consecuencia positiva (Oportunidad)/Riesgo con consecuencia Negativa'] || '',
          comentarios: row['Comentarios Adicionales'] || '',
          procesoId: '8', // Talento Humano
        };
      })
      .filter(n => n && n.nombreRegulacion && n.nombreRegulacion.trim() !== '');
    console.log(`   ✅ ${db.normatividad.length} normatividades`);
  }
  
  // 11. USUARIOS (mantener si existen)
  if (!db.usuarios || db.usuarios.length === 0) {
    db.usuarios = [
      { id: "1", email: "admin@ejemplo.com", password: "password123", fullName: "Administrador", role: "admin", position: "Administrador del Sistema" },
      { id: "2", email: "owner@ejemplo.com", password: "password123", fullName: "Katherine Chavez", role: "owner", position: "Dueño de Procesos" },
      { id: "3", email: "manager@ejemplo.com", password: "password123", fullName: "Marco Alvarado", role: "manager", position: "Gerente" },
      { id: "4", email: "director@ejemplo.com", password: "password123", fullName: "Carlos Rodríguez", role: "director", position: "Director de Procesos" }
    ];
  }
  
  // Arrays dinámicos
  if (!db.evaluaciones) db.evaluaciones = [];
  if (!db.observaciones) db.observaciones = [];
  if (!db.historial) db.historial = [];
  if (!db.notificaciones) db.notificaciones = [];
  if (!db.tareas) db.tareas = [];
  if (!db.planesAccion) db.planesAccion = [];
  
  // Guardar
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  
  console.log('\n✅ Migración COMPLETA finalizada!');
  console.log(`\n📊 Resumen Final:`);
  console.log(`   - Procesos: ${db.procesos.length}`);
  console.log(`   - Personas: ${db.personas.length}`);
  console.log(`   - Riesgos: ${db.riesgos.length}`);
  console.log(`   - Tipos de Riesgo: ${db.tiposRiesgo.length}`);
  console.log(`   - Causas: ${db.causas.length}`);
  console.log(`   - Frecuencia: ${db.frecuencia?.length || 0}`);
  console.log(`   - Objetivos: ${db.objetivos?.length || 0}`);
  console.log(`   - Normatividad: ${db.normatividad?.length || 0}`);
  console.log(`   - Catálogos de Impacto: ${Object.keys(db).filter(k => k.startsWith('impacto')).length}`);
  console.log(`   - Catálogos de Control: ${Object.keys(db).filter(k => ['aplicabilidad', 'cobertura', 'facilidaduso', 'segregacion', 'naturaleza', 'desviaciones'].includes(k)).length}`);
  console.log(`\n💾 Datos guardados en: ${dbPath}`);
}

migrarDatosCompleto();

