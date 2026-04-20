# Análisis Completo del Backend - Gestion de Riesgos

## 1. ESTRUCTURA DE ROLES Y PERMISOS

### 1.1 Tabla: Role
```sql
model Role {
  id          Int       @id @default(autoincrement())
  codigo      String    @unique  -- 'admin', 'dueño_procesos', 'supervisor', 'gerente', etc.
  nombre      String
  descripcion String?
  permisos    Json?     -- { visualizar: boolean, editar: boolean }
  activo      Boolean?  @default(true)
  ambito      String    @default("OPERATIVO")  -- 'SISTEMA' o 'OPERATIVO'
  usuarios    Usuario[]
}
```

### 1.2 Roles Existentes (Inferidos del Código)
- **admin**: ambito = 'SISTEMA', acceso total
- **dueño_procesos**: ambito = 'OPERATIVO', gestiona procesos asignados
- **supervisor**: ambito = 'OPERATIVO', supervisa riesgos
- **gerente**: ambito = 'OPERATIVO', puede tener 2 modos (dueño/supervisor)
- **usuario**: ambito = 'OPERATIVO', usuario genérico

### 1.3 Permisos
```json
{
  "visualizar": boolean,  // Por defecto: true
  "editar": boolean       // Por defecto: false
}
```

**Lógica en Backend**:
```typescript
const permisos = user.roleRelacion?.permisos || {};
const puedeVisualizar = permisos.visualizar !== false;  // true por defecto
const puedeEditar = permisos.editar === true;           // false por defecto
```

## 2. ESTRUCTURA DE PROCESOS

### 2.1 Tabla: Proceso
```sql
model Proceso {
  id                             Int
  nombre                         String    @unique
  descripcion                    String?
  objetivo                       String?
  tipo                           String?   -- CAMPO CLAVE: "estratégico", "comercial", etc.
  responsableId                  Int?      -- Legacy: un responsable
  areaId                         Int?
  vicepresidencia                String?
  estado                         String    @default("borrador")  -- 'borrador', 'en_revision', 'aprobado'
  activo                         Boolean   @default(true)
  sigla                          String?   -- Sigla del proceso (ej: "PF" para Planificación Financiera)
  gerenciaId                     Int?
  
  -- Relaciones
  responsable                    Usuario?  @relation("ResponsableProceso")
  responsables                   ProcesoResponsable[]  -- Múltiples responsables con modo
  area                           Area?
  gerencia                       Gerencia?
  participantes                  Usuario[]
  riesgos                        Riesgo[]
  dofaItems                      DofaItem[]
  normatividades                 Normatividad[]
  contextos                      Contexto[]
  contextoItems                  ContextoItem[]
}
```

### 2.2 Campo `tipo` - VALORES POSIBLES
Basado en el código del frontend, los valores son:
- "estratégico" / "estrategia" / "01 estratégico"
- "operacional" / "operativo" / "operacion"
- "comercial"
- "talento humano"
- "tesorería"
- "financiera"
- "administrativa"
- "nómina"
- etc.

**Nota**: El campo `tipo` es un String libre, no hay restricción en la BD.

### 2.3 Tabla: ProcesoResponsable (Modelo Nuevo)
```sql
model ProcesoResponsable {
  id        Int      @id
  procesoId Int
  usuarioId Int
  modo      String   @db.VarChar(20)  -- 'proceso' o 'director'
  createdAt DateTime @default(now())
  
  @@unique([procesoId, usuarioId, modo])
}
```

**Significado de `modo`**:
- `'proceso'`: Usuario es dueño del proceso (puede editar)
- `'director'`: Usuario es director/supervisor (solo lectura)

## 3. FLUJO DE AUTENTICACIÓN

### 3.1 Login (`POST /auth/login`)
```typescript
// 1. Buscar usuario por email
const user = await prisma.usuario.findFirst({
  where: {
    OR: [
      { email: username },
      { email: `${username}@comware.com.co` }
    ]
  }
});

// 2. Verificar contraseña
if (!verifyPassword(password, user.password)) {
  return 401; // Credenciales inválidas
}

// 3. Obtener rol y permisos
const roleCodigo = user.roleRelacion?.codigo || 'usuario';
const roleAmbito = user.roleRelacion?.ambito || 'OPERATIVO';
const permisos = user.roleRelacion?.permisos || {};
const puedeVisualizar = permisos.visualizar !== false;
const puedeEditar = permisos.editar === true;

// 4. Verificar 2FA (si está habilitado y no es admin)
const esAdmin = roleCodigo === 'admin' || roleAmbito === 'SISTEMA';
if (!esAdmin && user.twoFactorEnabled) {
  // Verificar dispositivo confiable
  // Si no es confiable: requiere 2FA
}

// 5. Generar token JWT
const token = signToken({
  userId: user.id,
  email: user.email,
  role: roleCodigo
});

// 6. Retornar usuario con permisos
return {
  success: true,
  token,
  user: {
    id, username, email, fullName, role,
    department, position, esDuenoProcesos,
    fotoPerfil, ambito, puedeVisualizar, puedeEditar
  }
};
```

### 3.2 Get Me (`GET /auth/me`)
- Restaura sesión desde JWT
- Cachea resultado en Redis por 60 segundos
- Retorna mismo payload que login

## 4. OBTENCIÓN DE PROCESOS

### 4.1 GET `/procesos` - Todos los Procesos
```typescript
export const getProcesos = async (req: Request, res: Response) => {
  // 1. Cachear en Redis por 5 minutos
  const cached = await redisGet('procesos:all');
  if (cached) return res.json(cached);

  // 2. Obtener procesos (máximo 2000)
  const procesos = await prisma.proceso.findMany({
    take: 2000,
    orderBy: { createdAt: 'desc' },
    select: {
      id, nombre, descripcion, objetivo, tipo,
      responsableId, areaId, vicepresidencia, gerenciaId,
      estado, activo, analisis, documentoUrl, sigla,
      responsable: { select: { id, nombre, email } },
      gerencia: { select: { id, nombre } },
      responsables: {  // Múltiples responsables
        select: {
          modo,
          usuario: {
            select: {
              id, nombre, email,
              roleRelacion: { select: { codigo, nombre } }
            }
          }
        }
      },
      area: {
        select: {
          id, nombre,
          director: { select: { id, nombre, email } }
        }
      },
      participantes: { select: { id, nombre, email } }
    }
  });

  // 3. Mapear responsablesList
  const procesosConAreaNombre = procesos.map((p: any) => {
    const responsablesList = (p.responsables || []).map((r: any) => ({
      id: r.usuario.id,
      nombre: r.usuario.nombre,
      email: r.usuario.email,
      role: r.usuario.roleRelacion?.codigo || null,
      modo: r.modo !== undefined ? r.modo : null
    }));
    
    return {
      ...p,
      areaNombre: p.area?.nombre || null,
      gerenciaNombre: p.gerencia?.nombre || null,
      responsablesList: responsablesList
    };
  });

  // 4. Cachear y retornar
  await redisSet('procesos:all', procesosConAreaNombre, 300);
  res.json(procesosConAreaNombre);
};
```

**Importante**: El backend devuelve TODOS los procesos sin filtrar por usuario. El filtrado se hace en el frontend.

## 5. FILTRADO DE PROCESOS EN FRONTEND

### 5.1 Lógica en `useAsignaciones.ts`
```typescript
export const useAreasProcesosAsignados = () => {
  const { user, esGerenteGeneralDirector, esGerenteDueño, esSupervisorRiesgos, esDueñoProcesos } = useAuth();
  const { data: procesosApi = [] } = useGetProcesosQuery();

  let procesosAsignados: Proceso[] = [];

  // 1. Gerente en Modo Director (Supervisor)
  if (esGerenteGeneralDirector) {
    procesosAsignados = procesosApi.filter((p: any) =>
      (p.responsablesList || []).some(
        (r: any) => Number(r.id) === userIdNum && r.modo === 'director'
      )
    );
  }
  // 2. Gerente en Modo Dueño de Proceso
  else if (esGerenteDueño) {
    procesosAsignados = procesosApi.filter((p: any) =>
      (p.responsablesList || []).some(
        (r: any) => Number(r.id) === userIdNum && r.modo === 'proceso'
      )
    );
  }
  // 3. Supervisor de Riesgos
  else if (esSupervisorRiesgos) {
    procesosAsignados = procesosApi.filter((p: any) =>
      Number(p.directorId) === userIdNum || esUsuarioResponsableProceso(p, userIdNum)
    );
  }
  // 4. Dueño de Proceso
  else if (esDueñoProcesos) {
    procesosAsignados = procesosApi.filter((p) => esUsuarioResponsableProceso(p, userIdNum));
  }

  return { areas: areaIds, procesos: procesoIds, loading: isLoading };
};
```

## 6. CLASIFICACIÓN DE PROCESOS POR TIPO

### 6.1 Cómo se Determina el Tipo
El campo `proceso.tipo` contiene el tipo de proceso. Ejemplos:
- "Estratégico"
- "Comercial"
- "Operacional"
- "Talento Humano"
- etc.

### 6.2 Mapeo a "Gestión" (Propuesto)
```typescript
const TIPO_PROCESO_A_GESTION: Record<string, string> = {
  'estratégico': 'estrategica',
  'estrategico': 'estrategica',
  'estrategia': 'estrategica',
  'comercial': 'comercial',
  'operacional': 'riesgos',
  'operativo': 'riesgos',
  'operacion': 'riesgos',
  'talento humano': 'talento',
  'tesorería': 'tesoreria',
  'financiera': 'financiera',
  'administrativa': 'administrativa',
  'nómina': 'nomina',
};

function obtenerGestionDeProceso(proceso: Proceso): string {
  const tipo = (proceso.tipo || '').toLowerCase();
  for (const [key, value] of Object.entries(TIPO_PROCESO_A_GESTION)) {
    if (tipo.includes(key)) return value;
  }
  return 'riesgos'; // Por defecto
}
```

## 7. ESTRUCTURA DE RIESGOS

### 7.1 Tabla: Riesgo
```sql
model Riesgo {
  id                          Int
  procesoId                   Int
  numero                      Int
  descripcion                 String
  clasificacion               String?  -- 'NEGATIVA', 'POSITIVA', etc.
  numeroIdentificacion        String?  -- Formato: {numero}{sigla}
  tipologiaTipo1Id            Int?     -- Tipo de riesgo
  tipologiaTipo2Id            Int?     -- Subtipo de riesgo
  
  causas                      CausaRiesgo[]
  controles                   Control[]
  evaluacion                  EvaluacionRiesgo?
  planesAccion                PlanAccion[]
  proceso                     Proceso
}
```

### 7.2 Tabla: CausaRiesgo
```sql
model CausaRiesgo {
  id                 Int
  riesgoId           Int
  descripcion        String
  fuenteCausa        String?
  frecuencia         String?
  seleccionada       Boolean  @default(false)
  
  controles          ControlRiesgo[]
  planesAccion       PlanAccion[]
  riesgo             Riesgo
}
```

**Nota**: `tipoGestion` en CausaRiesgo se refiere a si es un CONTROL o un PLAN, no a la gestión estratégica/comercial.

## 8. ESTRUCTURA DE CONTROLES Y PLANES

### 8.1 Tabla: ControlRiesgo
```sql
model ControlRiesgo {
  id                  Int
  causaRiesgoId       Int
  descripcion         String
  tipoControl         String?
  responsable         String?
  puntajeControl      Int?
  evaluacionPreliminar String?
  evaluacionDefinitiva String?
  
  causaRiesgo         CausaRiesgo
  planAccionVinculado PlanAccion?
}
```

### 8.2 Tabla: PlanAccion
```sql
model PlanAccion {
  id                      Int
  priorizacionId          Int?
  riesgoId                Int?
  incidenciaId            Int?
  causaRiesgoId           Int?
  nombre                  String?
  objetivo                String?
  descripcion             String
  responsable             String?
  fechaInicio             DateTime?
  fechaFin                DateTime?
  estado                  String
  prioridad               Int?
  presupuesto             Float?
  porcentajeAvance        Int?
  tipoGestion             String?  -- 'CONTROL', 'PLAN', 'AMBOS'
  
  causaRiesgo             CausaRiesgo?
  riesgo                  Riesgo?
  incidencia              Incidencia?
  controlesVinculados     ControlRiesgo[]
}
```

## 9. RESTRICCIONES Y VALIDACIONES

### 9.1 Estados de Proceso
- `'borrador'`: En edición
- `'en_revision'`: Enviado para revisión
- `'aprobado'`: Aprobado (solo lectura)

### 9.2 Validación de Acceso
**En Frontend** (`useAsignaciones.ts`):
```typescript
export const esUsuarioResponsableProceso = (proceso: Proceso, userId?: string | number): boolean => {
  if (!userId || !proceso) return false;
  const userIdNum = Number(userId);

  // Compatibilidad con modelo antiguo: campo responsableId
  if (proceso.responsableId && Number(proceso.responsableId) === userIdNum) {
    return true;
  }

  // Nuevo modelo: lista de responsables
  if (proceso.responsablesList && Array.isArray(proceso.responsablesList)) {
    return proceso.responsablesList.some((r: any) => Number(r.id) === userIdNum);
  }

  return false;
};
```

### 9.3 Modo de Acceso
- Si `estado === 'aprobado'` y no es dueño: fuerza `modo = 'visualizar'`
- Si es supervisor: siempre `modo = 'visualizar'`
- Si es dueño: `modo = 'editar'` (por defecto)

## 10. CACHÉ EN REDIS

### 10.1 Claves de Caché
- `procesos:all` - Todos los procesos (5 minutos)
- `proceso:{id}` - Proceso individual (5 minutos)
- `auth:me:{userId}` - Datos del usuario (1 minuto)
- `dofa:proceso:{id}` - DOFA del proceso

### 10.2 Invalidación
Se invalida caché cuando:
- Se actualiza un proceso
- Se actualiza un riesgo
- Se actualiza un usuario

## 11. RESPUESTAS DEL BACKEND

### 11.1 Login Exitoso
```json
{
  "success": true,
  "token": "jwt_token",
  "expiresIn": "7d",
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "usuario@comware.com.co",
    "fullName": "Nombre Completo",
    "role": "dueño_procesos",
    "department": "Cargo",
    "position": "Cargo",
    "esDuenoProcesos": true,
    "fotoPerfil": "url_o_null",
    "ambito": "OPERATIVO",
    "puedeVisualizar": true,
    "puedeEditar": false
  }
}
```

### 11.2 Procesos
```json
[
  {
    "id": 1,
    "nombre": "Proceso 1",
    "descripcion": "...",
    "objetivo": "...",
    "tipo": "Estratégico",
    "responsableId": 1,
    "areaId": 1,
    "estado": "aprobado",
    "activo": true,
    "sigla": "P1",
    "areaNombre": "Área 1",
    "gerenciaNombre": "Gerencia 1",
    "responsablesList": [
      {
        "id": 1,
        "nombre": "Usuario 1",
        "email": "usuario1@comware.com.co",
        "role": "dueño_procesos",
        "modo": "proceso"
      }
    ]
  }
]
```

## 12. CONCLUSIONES

### 12.1 Respuestas a Preguntas Clave

**P1: ¿Qué valores tiene `tipoProceso`?**
- R: El campo se llama `tipo` (no `tipoProceso`)
- Valores: "Estratégico", "Comercial", "Operacional", "Talento Humano", etc.
- Es un String libre, sin restricción en la BD

**P2: ¿Cómo se mapean a "Gestiones"?**
- R: Basado en el contenido del campo `tipo`
- Mapeo propuesto: estratégico → gestión_estratégica, comercial → gestión_comercial, etc.

**P3: ¿Hay restricciones de acceso por gestión?**
- R: No en el backend. El backend devuelve todos los procesos.
- El filtrado se hace en el frontend según rol y asignaciones.

**P4: ¿Qué permisos hay por gestión?**
- R: Los permisos son por rol, no por gestión.
- Cada rol tiene `puedeVisualizar` y `puedeEditar`.

**P5: ¿Cómo se determina si un usuario puede ver un proceso?**
- R: Basado en:
  1. Si es admin: ve todos
  2. Si es gerente director: ve procesos donde está en `responsablesList` con `modo='director'`
  3. Si es gerente dueño: ve procesos donde está en `responsablesList` con `modo='proceso'`
  4. Si es supervisor: ve procesos donde es `directorId` o está en `responsablesList`
  5. Si es dueño: ve procesos donde está en `responsablesList` o `responsableId`

### 12.2 Implementación Recomendada

1. **GestionContext**: Filtrar procesos por `tipo` del proceso
2. **GestionSelector**: Mostrar gestiones disponibles basadas en procesos del usuario
3. **MainLayout**: Ocultar items del menú según gestión seleccionada
4. **Páginas**: Filtrar procesos y datos según gestión seleccionada

### 12.3 Mapeo Final de Gestiones

```typescript
const GESTIONES = {
  'riesgos': {
    label: 'Gestión de Riesgos',
    tiposIncluidos: ['operacional', 'operativo', 'operacion'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'estrategica': {
    label: 'Gestión Estratégica',
    tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Planes', 'Historial'],
    ocultarItems: ['Controles', 'Materializar']
  },
  'comercial': {
    label: 'Gestión Comercial',
    tiposIncluidos: ['comercial'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'talento': {
    label: 'Gestión de Talento',
    tiposIncluidos: ['talento humano', 'talento'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'tesoreria': {
    label: 'Gestión de Tesorería',
    tiposIncluidos: ['tesorería', 'tesoreria'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'financiera': {
    label: 'Gestión Financiera',
    tiposIncluidos: ['financiera'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'administrativa': {
    label: 'Gestión Administrativa',
    tiposIncluidos: ['administrativa'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  },
  'nomina': {
    label: 'Gestión de Nómina',
    tiposIncluidos: ['nómina', 'nomina'],
    menuItems: ['Dashboard', 'Procesos', 'Identificación', 'Controles', 'Planes', 'Materializar', 'Historial']
  }
};
```
