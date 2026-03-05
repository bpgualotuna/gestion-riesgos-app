# 🎯 RESUMEN RÁPIDO - Deployment Seguro

## ✅ RESPUESTAS DIRECTAS

### 1. ¿Los cambios se ejecutarán al subir el commit?

**Frontend:** ✅ SÍ - Automático con GitHub Actions  
**Backend (código):** ✅ SÍ - Automático con GitHub Actions  
**Backend (tabla BD):** ❌ NO - Debes ejecutar manualmente: `npx prisma migrate deploy`

### 2. ¿Afectará la funcionalidad existente?

**NO** ✅ - Por estas razones:
- Tabla nueva sin relaciones con otras tablas
- Middleware no bloqueante (usa `setImmediate`)
- Try-catch para errores de auditoría
- Rutas completamente nuevas (`/api/audit/*`)
- Código en archivos separados

### 3. ¿Puedo hacer pruebas sin afectar producción?

**SÍ** ✅ - Siguiendo este plan de 4 fases:

---

## 🚀 PLAN DE DEPLOYMENT EN 4 FASES

```
┌─────────────────────────────────────────────────────────────┐
│  FASE 1: Frontend (5 min)                                   │
├─────────────────────────────────────────────────────────────┤
│  1. git push origin master                                  │
│  2. GitHub Actions despliega automáticamente                │
│  3. Pestaña "Historial" visible con datos de ejemplo       │
│  ✅ Sin riesgo - Solo UI                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FASE 2: Crear Tabla (2 min)                               │
├─────────────────────────────────────────────────────────────┤
│  1. Agregar modelo AuditLog a schema.prisma                 │
│  2. npx prisma migrate dev --name add_audit_log --create-only│
│  3. Revisar SQL generado (solo CREATE TABLE)               │
│  4. npx prisma migrate deploy (ejecuta en Azure)           │
│  ✅ Sin riesgo - Tabla vacía, sin relaciones                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FASE 3: Backend Inactivo (5 min)                          │
├─────────────────────────────────────────────────────────────┤
│  1. Crear archivos: audit.service.ts, audit.controller.ts  │
│  2. NO integrar en app.ts todavía                          │
│  3. git push origin master                                  │
│  4. Código desplegado pero NO activo                       │
│  ✅ Sin riesgo - Código existe pero no se ejecuta          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FASE 4: Activar Sistema (5 min)                           │
├─────────────────────────────────────────────────────────────┤
│  1. Integrar middleware en app.ts                          │
│  2. git push origin master                                  │
│  3. Sistema comienza a registrar cambios                   │
│  4. Frontend muestra datos reales                          │
│  ✅ Riesgo mínimo - Middleware no bloqueante               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 MODELO PRISMA A AGREGAR

**Archivo:** `gestion_riesgos_backend/prisma/schema.prisma`

```prisma
model AuditLog {
  id              Int      @id @default(autoincrement())
  usuarioId       Int
  usuarioNombre   String
  usuarioEmail    String
  usuarioRole     String
  accion          String   @db.VarChar(20)
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

---

## 🔧 COMANDOS CLAVE

### Crear Migración (Local)
```bash
cd gestion_riesgos_backend
npx prisma migrate dev --name add_audit_log_table --create-only
```

### Ejecutar Migración (Azure)
```bash
cd gestion_riesgos_backend
npx prisma migrate deploy
```

### Verificar Tabla Creada
```sql
-- En pgAdmin conectado a Azure
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'AuditLog';
```

---

## ⚠️ ROLLBACK (Si Algo Sale Mal)

### Desactivar Middleware
```typescript
// En app.ts, comentar:
// app.use(auditMiddleware());
// app.use('/api/audit', auditRoutes);
```

### Eliminar Tabla (Extremo)
```sql
-- En pgAdmin
DROP TABLE "AuditLog";
```

---

## 🎯 VENTAJAS DE ESTE ENFOQUE

| Ventaja | Descripción |
|---------|-------------|
| ✅ **Progresivo** | Puedes avanzar fase por fase |
| ✅ **Reversible** | Puedes desactivar en cualquier momento |
| ✅ **Sin Downtime** | La app sigue funcionando en todo momento |
| ✅ **Testeable** | Puedes probar cada fase antes de continuar |
| ✅ **Seguro** | No modifica funcionalidad existente |

---

## 📊 ESTADO ACTUAL vs DESPUÉS

### ANTES (Ahora)
```
Frontend: Sin pestaña de historial
Backend:  Sin sistema de auditoría
BD:       Sin tabla AuditLog
```

### DESPUÉS DE FASE 1
```
Frontend: ✅ Pestaña visible (datos de ejemplo)
Backend:  Sin sistema de auditoría
BD:       Sin tabla AuditLog
```

### DESPUÉS DE FASE 2
```
Frontend: ✅ Pestaña visible (datos de ejemplo)
Backend:  Sin sistema de auditoría
BD:       ✅ Tabla AuditLog (vacía)
```

### DESPUÉS DE FASE 3
```
Frontend: ✅ Pestaña visible (datos de ejemplo)
Backend:  ✅ Código desplegado (inactivo)
BD:       ✅ Tabla AuditLog (vacía)
```

### DESPUÉS DE FASE 4
```
Frontend: ✅ Pestaña visible (datos reales)
Backend:  ✅ Sistema activo registrando
BD:       ✅ Tabla AuditLog (con registros)
```

---

## 🚦 SEMÁFORO DE RIESGO

| Fase | Riesgo | Reversible | Tiempo |
|------|--------|------------|--------|
| 1. Frontend | 🟢 Ninguno | ✅ Sí | 5 min |
| 2. Migración | 🟢 Ninguno | ✅ Sí | 2 min |
| 3. Backend Inactivo | 🟢 Ninguno | ✅ Sí | 5 min |
| 4. Activación | 🟡 Mínimo | ✅ Sí | 5 min |

**Total:** 🟢 Riesgo Bajo - 17 minutos

---

## ✅ CHECKLIST RÁPIDO

### Antes de Empezar
- [ ] Tengo acceso SSH a Azure
- [ ] Tengo acceso a pgAdmin con Azure PostgreSQL
- [ ] Tengo backup de la BD (opcional pero recomendado)
- [ ] El proyecto funciona correctamente ahora

### Fase 1
- [ ] Push a master
- [ ] GitHub Actions completado
- [ ] Pestaña "Historial" visible en `/admin-panel`

### Fase 2
- [ ] Modelo agregado a schema.prisma
- [ ] Migración creada localmente
- [ ] SQL revisado (solo CREATE TABLE)
- [ ] Migración ejecutada en Azure
- [ ] Tabla verificada en pgAdmin

### Fase 3
- [ ] Archivos del backend creados
- [ ] Push a master
- [ ] App funcionando normalmente
- [ ] No hay errores en logs

### Fase 4
- [ ] Middleware integrado en app.ts
- [ ] Push a master
- [ ] Sistema registrando cambios
- [ ] Frontend mostrando datos reales

---

## 🎓 CONCLUSIÓN

**Puedes implementar el sistema de auditoría de forma segura siguiendo las 4 fases.**

Cada fase es independiente y reversible. Si algo sale mal en cualquier fase, puedes revertir sin afectar la funcionalidad existente.

**Recomendación:** Empieza con la Fase 1 (solo frontend) para verificar que todo funciona correctamente antes de continuar.

---

**¿Necesitas ayuda con alguna fase específica?**

Puedo ayudarte a:
1. Crear los archivos del backend
2. Escribir el código del middleware
3. Implementar los controladores
4. Configurar las rutas
5. Integrar en app.ts

---

**Documento Creado:** 05/03/2026  
**Tiempo de Lectura:** 3 minutos  
**Nivel de Detalle:** Resumen ejecutivo
