# 🚀 GUÍA DE DEPLOYMENT EN AZURE - Sistema de Auditoría

## 📋 RESUMEN DE TU INFRAESTRUCTURA ACTUAL

### Frontend
- **Plataforma**: Azure VM con Docker
- **Deployment**: GitHub Actions (`.github/workflows/deploy.yml`)
- **Trigger**: Push a rama `master`
- **Proceso**: SSH → Git pull → Docker build → Docker compose up

### Backend
- **Base de Datos**: Azure PostgreSQL (`data-base-src.postgres.database.azure.com`)
- **ORM**: Prisma
- **Migraciones**: Carpeta `prisma/migrations/` (existe)

---

## ✅ RESPUESTA A TUS DUDAS

### 1. ¿Los cambios se ejecutarán automáticamente al subir el commit?

**SÍ, PERO CON CONDICIONES:**

#### Frontend ✅
- Al hacer push a `master`, GitHub Actions ejecutará automáticamente:
  1. SSH a tu servidor Azure
  2. Git pull del código nuevo
  3. Docker build (reconstruye la imagen)
  4. Docker compose up (levanta el contenedor)
- **Resultado**: El frontend con la pestaña de Historial estará disponible inmediatamente

#### Backend ⚠️
- **La tabla NO se creará automáticamente**
- Necesitas ejecutar la migración de Prisma manualmente
- El código del backend (servicios, controladores, rutas) SÍ se desplegará

### 2. ¿Cómo crear la tabla sin afectar el resto?

**PROCESO SEGURO EN 3 PASOS:**

---

## 🔧 PLAN DE IMPLEMENTACIÓN SEGURO

### FASE 1: Preparación Local (Sin Riesgo)

#### Paso 1.1: Crear la Migración de Prisma
```bash
cd gestion_riesgos_backend

# Agregar el modelo AuditLog al schema.prisma (ver código abajo)

# Crear la migración (NO la ejecuta, solo la prepara)
npx prisma migrate dev --name add_audit_log_table --create-only
```

**Código a agregar en `schema.prisma`:**
```prisma
model AuditLog {
  id              Int      @id @default(autoincrement())
  usuarioId       Int
  usuarioNombre   String
  usuarioEmail    String
  usuarioRole     String
  accion          String   @db.VarChar(20)  // CREATE, UPDATE, DELETE
  tabla           String   @db.VarChar(100)
  registroId      Int?
  registroDesc    String?
  cambios         Json?
  datosAnteriores Json?
  datosNuevos     Json?
  ipAddress       String?  @db.VarChar(50)
  userAgent       String?
  createdAt       DateTime @default(now())
  
  @@index([usuarioId])
  @@index([tabla])
  @@index([accion])
  @@index([createdAt])
  @@index([tabla, accion])
  @@index([createdAt, tabla])
}
```

#### Paso 1.2: Revisar la Migración Generada
```bash
# Prisma creará un archivo en: prisma/migrations/YYYYMMDDHHMMSS_add_audit_log_table/migration.sql

# Revisar el contenido (debe ser solo CREATE TABLE)
cat prisma/migrations/*/migration.sql
```

**Contenido esperado:**
```sql
-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "usuarioNombre" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "usuarioRole" TEXT NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "tabla" VARCHAR(100) NOT NULL,
    "registroId" INTEGER,
    "registroDesc" TEXT,
    "cambios" JSONB,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "ipAddress" VARCHAR(50),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_usuarioId_idx" ON "AuditLog"("usuarioId");
CREATE INDEX "AuditLog_tabla_idx" ON "AuditLog"("tabla");
CREATE INDEX "AuditLog_accion_idx" ON "AuditLog"("accion");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_tabla_accion_idx" ON "AuditLog"("tabla", "accion");
CREATE INDEX "AuditLog_createdAt_tabla_idx" ON "AuditLog"("createdAt", "tabla");
```

✅ **Verificación**: Solo debe crear la tabla `AuditLog`, sin modificar nada más.

---

### FASE 2: Implementar Backend (Sin Riesgo)

#### Paso 2.1: Crear Archivos del Backend

**Estructura a crear:**
```
gestion_riesgos_backend/src/
├── services/
│   └── audit.service.ts          (NUEVO)
├── middleware/
│   └── audit.middleware.ts       (NUEVO)
├── controllers/
│   └── audit.controller.ts       (NUEVO)
└── routes/
    └── audit.routes.ts            (NUEVO)
```

#### Paso 2.2: Implementar sin Activar

**IMPORTANTE:** Crea todos los archivos pero NO los integres en `app.ts` todavía.

Esto permite:
- ✅ Subir el código al repositorio
- ✅ Que se despliegue en Azure
- ✅ Que NO afecte la funcionalidad actual
- ✅ Activarlo cuando estés listo

---

### FASE 3: Deployment a Azure (Controlado)

#### Paso 3.1: Commit y Push
```bash
# En la raíz del proyecto
git add .
git commit -m "feat: Agregar sistema de auditoría (inactivo)"
git push origin master
```

**Resultado:**
- ✅ GitHub Actions se ejecutará automáticamente
- ✅ Frontend se desplegará con la pestaña de Historial
- ✅ Backend se desplegará con el código nuevo (pero inactivo)
- ✅ La aplicación seguirá funcionando normalmente

#### Paso 3.2: Ejecutar Migración en Azure (Manual)

**Opción A: Desde tu máquina local (Recomendado)**
```bash
cd gestion_riesgos_backend

# Ejecutar migración contra la BD de Azure
npx prisma migrate deploy

# Verificar que se creó la tabla
npx prisma studio
# O usar pgAdmin conectándote a Azure
```

**Opción B: Desde el servidor Azure (SSH)**
```bash
# Conectarte por SSH a tu VM de Azure
ssh azureuser@<tu-ip-azure>

# Navegar al directorio del backend
cd ~/app-backend  # (ajusta la ruta según tu configuración)

# Ejecutar migración
npx prisma migrate deploy
```

**Verificación:**
```sql
-- Conectarte a Azure PostgreSQL con pgAdmin
-- Ejecutar esta consulta:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'AuditLog';

-- Debe retornar: AuditLog
```

---

### FASE 4: Activar el Sistema de Auditoría (Cuando Estés Listo)

#### Paso 4.1: Integrar en app.ts

**Archivo:** `gestion_riesgos_backend/src/app.ts`

```typescript
// Agregar imports
import auditRoutes from './routes/audit.routes';
import { auditMiddleware } from './middleware/audit.middleware';

// Después del middleware de autenticación
app.use(authMiddleware({ required: true }));

// AGREGAR: Middleware de auditoría (captura automática)
app.use(auditMiddleware());  // ← ACTIVAR AQUÍ

// AGREGAR: Rutas de auditoría
app.use('/api/audit', auditRoutes);  // ← ACTIVAR AQUÍ
```

#### Paso 4.2: Commit y Push
```bash
git add src/app.ts
git commit -m "feat: Activar sistema de auditoría"
git push origin master
```

**Resultado:**
- ✅ El sistema de auditoría comenzará a registrar cambios
- ✅ El frontend podrá consultar datos reales
- ✅ La funcionalidad existente NO se verá afectada

---

## 🛡️ GARANTÍAS DE SEGURIDAD

### ¿Por qué NO afectará la funcionalidad existente?

#### 1. **Tabla Independiente**
```sql
-- La tabla AuditLog NO tiene relaciones (foreign keys) con otras tablas
-- Es completamente independiente
CREATE TABLE "AuditLog" (...);  -- Sin FK
```

#### 2. **Middleware No Bloqueante**
```typescript
// El middleware de auditoría usa setImmediate()
// No bloquea la respuesta al cliente
setImmediate(async () => {
  await registrarAuditoria(...);  // Se ejecuta después
});
```

#### 3. **Try-Catch en Auditoría**
```typescript
// Si falla el registro de auditoría, NO afecta la operación principal
try {
  await registrarAuditoria(...);
} catch (error) {
  console.error('Error en auditoría:', error);
  // La operación principal ya se completó
}
```

#### 4. **Rutas Nuevas**
```typescript
// Las rutas de auditoría son nuevas (/api/audit/*)
// No modifican rutas existentes
app.use('/api/audit', auditRoutes);  // Nueva ruta
```

#### 5. **Código Aislado**
```
audit.service.ts      → Nuevo archivo
audit.middleware.ts   → Nuevo archivo
audit.controller.ts   → Nuevo archivo
audit.routes.ts       → Nuevo archivo
```
No se modifican archivos existentes (excepto `app.ts` para activar).

---

## 🧪 PLAN DE PRUEBAS PROGRESIVO

### Fase 1: Verificar Frontend (Sin Backend)
```
1. Hacer push del frontend
2. Abrir http://<tu-dominio-azure>/admin-panel
3. Verificar que la pestaña "Historial" aparece
4. Verificar que muestra los 5 registros de ejemplo
5. Verificar que los filtros funcionan
```

**Resultado Esperado:**
- ✅ Pestaña visible
- ⚠️ Mensaje: "El endpoint de auditoría aún no está implementado"
- ✅ Muestra datos de ejemplo

### Fase 2: Verificar Migración
```
1. Ejecutar: npx prisma migrate deploy
2. Conectar a Azure PostgreSQL con pgAdmin
3. Verificar que existe la tabla AuditLog
4. Verificar que está vacía (0 registros)
```

**Resultado Esperado:**
- ✅ Tabla creada
- ✅ Índices creados
- ✅ 0 registros

### Fase 3: Verificar Backend (Sin Activar)
```
1. Hacer push del backend
2. Verificar que la aplicación sigue funcionando
3. Crear un riesgo, editarlo, eliminarlo
4. Verificar que todo funciona normal
5. Verificar que AuditLog sigue vacía (0 registros)
```

**Resultado Esperado:**
- ✅ Aplicación funciona normal
- ✅ No hay errores en logs
- ✅ AuditLog vacía (middleware no activado)

### Fase 4: Activar y Probar
```
1. Activar middleware en app.ts
2. Hacer push
3. Crear un riesgo
4. Verificar que se registró en AuditLog (1 registro)
5. Abrir pestaña Historial en frontend
6. Verificar que muestra el registro real
```

**Resultado Esperado:**
- ✅ Registro en AuditLog
- ✅ Frontend muestra datos reales
- ✅ Filtros funcionan
- ✅ Detalles se muestran correctamente

---

## 📊 MONITOREO POST-DEPLOYMENT

### Verificar que Todo Funciona

#### 1. Logs del Backend
```bash
# SSH a Azure
ssh azureuser@<tu-ip-azure>

# Ver logs del contenedor
sudo docker logs <nombre-contenedor-backend> --tail 100 -f
```

**Buscar:**
- ✅ "Server running on port 8080"
- ✅ "Database connected"
- ❌ NO debe haber errores de Prisma

#### 2. Consultar Tabla de Auditoría
```sql
-- En pgAdmin conectado a Azure
SELECT COUNT(*) FROM "AuditLog";
-- Debe retornar: 0 (antes de activar) o >0 (después de activar)

-- Ver últimos registros
SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT 10;
```

#### 3. Probar Endpoints
```bash
# Desde tu máquina local
curl -H "Authorization: Bearer <tu-token>" \
  https://<tu-dominio-azure>/api/audit/logs

# Debe retornar:
# {"data": [], "total": 0, "page": 1, "pageSize": 50}
```

---

## ⚠️ ROLLBACK (Si Algo Sale Mal)

### Opción 1: Desactivar Middleware
```typescript
// En app.ts, comentar estas líneas:
// app.use(auditMiddleware());
// app.use('/api/audit', auditRoutes);

// Commit y push
git add src/app.ts
git commit -m "fix: Desactivar auditoría temporalmente"
git push origin master
```

### Opción 2: Revertir Migración (Extremo)
```bash
# Solo si es absolutamente necesario
cd gestion_riesgos_backend

# Revertir última migración
npx prisma migrate resolve --rolled-back <nombre-migracion>

# Eliminar tabla manualmente
# En pgAdmin:
DROP TABLE "AuditLog";
```

---

## 📝 CHECKLIST DE DEPLOYMENT

### Pre-Deployment
- [ ] Código del frontend revisado y probado localmente
- [ ] Migración de Prisma creada y revisada
- [ ] Código del backend implementado (sin activar)
- [ ] Tests locales pasando
- [ ] Backup de la base de datos de Azure (opcional pero recomendado)

### Deployment Fase 1 (Frontend)
- [ ] Push a master
- [ ] GitHub Actions completado exitosamente
- [ ] Frontend desplegado en Azure
- [ ] Pestaña "Historial" visible
- [ ] Datos de ejemplo funcionando

### Deployment Fase 2 (Migración)
- [ ] Migración ejecutada en Azure: `npx prisma migrate deploy`
- [ ] Tabla `AuditLog` creada
- [ ] Índices creados
- [ ] Tabla vacía (0 registros)

### Deployment Fase 3 (Backend)
- [ ] Push del código del backend
- [ ] Backend desplegado en Azure
- [ ] Aplicación funcionando normalmente
- [ ] No hay errores en logs

### Deployment Fase 4 (Activación)
- [ ] Middleware activado en `app.ts`
- [ ] Push a master
- [ ] Sistema de auditoría registrando cambios
- [ ] Frontend mostrando datos reales
- [ ] Filtros funcionando correctamente

---

## 🎯 RESUMEN EJECUTIVO

### ¿Se ejecutará automáticamente?
- **Frontend**: ✅ SÍ (GitHub Actions)
- **Backend (código)**: ✅ SÍ (GitHub Actions)
- **Backend (migración)**: ❌ NO (manual con `npx prisma migrate deploy`)

### ¿Afectará la funcionalidad existente?
- **NO**, porque:
  1. Tabla independiente sin relaciones
  2. Middleware no bloqueante
  3. Try-catch en auditoría
  4. Rutas nuevas
  5. Código aislado

### ¿Puedo hacer pruebas sin afectar producción?
- **SÍ**, siguiendo el plan de 4 fases:
  1. Frontend solo (datos de ejemplo)
  2. Migración (tabla vacía)
  3. Backend sin activar (código desplegado pero inactivo)
  4. Activación controlada (cuando estés listo)

### Tiempo Estimado
- **Fase 1 (Frontend)**: 5 minutos (automático)
- **Fase 2 (Migración)**: 2 minutos (manual)
- **Fase 3 (Backend)**: 5 minutos (automático)
- **Fase 4 (Activación)**: 5 minutos (automático)
- **Total**: ~20 minutos

---

## 🚀 PRÓXIMO PASO RECOMENDADO

1. **Agregar el modelo `AuditLog` al `schema.prisma`**
2. **Crear la migración localmente** (sin ejecutarla)
3. **Revisar el SQL generado** para confirmar que solo crea la tabla
4. **Hacer commit y push** del schema y la migración
5. **Ejecutar la migración en Azure** cuando estés listo

¿Quieres que te ayude a crear los archivos del backend ahora?

---

**Documento Creado:** 05/03/2026  
**Autor:** Kiro AI Assistant  
**Estado:** ✅ Listo para implementación segura
