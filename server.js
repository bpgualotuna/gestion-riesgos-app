/**
 * JSON Server con middleware personalizado
 * Compatible con json-server 1.0.0-beta.5
 * Basado en lib/bin.js de json-server
 */

import { existsSync } from 'node:fs';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Low } from 'lowdb';
import { DataFile, JSONFile } from 'lowdb/node';
import { createApp } from 'json-server/lib/app.js';
import { Observer } from 'json-server/lib/observer.js';
import JSON5 from 'json5';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const dbPath = join(__dirname, 'db.json');

// Verificar que existe el archivo
if (!existsSync(dbPath)) {
  console.error(`❌ Error: No se encuentra el archivo ${dbPath}`);
  process.exit(1);
}

// Set up database
let adapter;
if (extname(dbPath) === '.json5') {
  adapter = new DataFile(dbPath, {
    parse: JSON5.parse,
    stringify: JSON5.stringify,
  });
} else {
  adapter = new JSONFile(dbPath);
}

// Usar Observer para watch automático
const observer = new Observer(adapter);
const db = new Low(observer, {});

// Leer base de datos
await db.read();

// Crear aplicación con json-server
const app = createApp(db, { 
  logger: false, 
  static: [] 
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`🚀 JSON Server está corriendo en http://${HOST}:${PORT}`);
  console.log(`📁 Base de datos: ${dbPath}`);
  console.log(`👀 Observando cambios en ${dbPath}...`);
  console.log(`\n📡 Endpoints disponibles:`);
  
  if (db.data && Object.keys(db.data).length > 0) {
    Object.keys(db.data).forEach((key) => {
      console.log(`   GET    /${key}`);
    });
  } else {
    console.log(`   ⚠️  No hay datos en la base de datos`);
  }
  
  console.log(`\n✨ Listo para recibir peticiones!\n`);
});
