# Contexto — Frontend COMWARE (gestión de riesgos)

Documento vivo: **todo cambio** en pantallas, rutas, roles, integración API, cálculos en cliente o flujos debe reflejarse aquí en la misma tarea. El `README.md` es solo arranque rápido.

---

## 1. Propósito y stack

SPA para **gestión de riesgos por procesos**: identificación, evaluación inherente/residual, mapas, priorización, controles, planes de acción, normatividad, DOFA, contexto, supervisión, administración y vistas de gerente general.

| Tecnología | Uso |
|------------|-----|
| React 19 + TypeScript | UI |
| Vite 6 | Dev server y build (`dist/`) |
| MUI 7 | Componentes y tema |
| Redux Toolkit + RTK Query | Estado servidor (`riesgosApi`, `planTrazabilidadApi`) |
| React Router 7 | Rutas, lazy + `Suspense` |
| Vitest | Pruebas unitarias (`npm test` → `src/**/*.test.ts`, p. ej. `mapaResidualCoords`) |

**Datos:** solo API real (`VITE_API_BASE_URL`); token JWT en **`sessionStorage`** bajo clave `gr_token` (`AUTH_TOKEN_KEY` en `src/utils/constants.ts`). No hay mocks de negocio persistentes en `localStorage`.

---

## 2. Variables de entorno

Archivo **`.env`** en la raíz (solo variables con prefijo **`VITE_`**):

| Variable | Ejemplo | Uso |
|----------|---------|-----|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Base del backend |
| `VITE_APP_NAME` | texto | Nombre en UI |
| `VITE_ENV` | `development` / `production` | Entorno |

Tras cambiar `.env`, reiniciar `npm run dev` o volver a ejecutar build.

---

## 3. Autenticación, roles y permisos

**Login:** `src/pages/auth/LoginPage.tsx` → ruta `/login`. El resto de rutas bajo `/` van envueltas en **`ProtectedRoute`** (`src/components/auth/ProtectedRoute.tsx`) dentro de **`MainLayout`**.

**Roles de usuario** (`AuthContext.tsx`, alineados con backend):

- `admin` — ámbito típico **SISTEMA**: usuarios, áreas, procesos definición, configuración, mapas, parámetros de calificación inherente/residual, panel `/admin-panel`.
- `dueño_procesos` — dueño de proceso(s); trabajo operativo en riesgos y proceso.
- `gerente` — puede operar en modo **dueño** o **supervisor** (`gerenteMode` / `managerMode`).
- `supervisor` — supervisión de riesgos, observaciones, vistas agregadas.
- `gerente_general` — vistas amplias; selector de modo **director** (≈ supervisor) vs **proceso** (≈ dueño) en `/modo-gerente-general`.

**Aliases API → UI:** `manager` se trata como `gerente`; `gerente_general` comparte helpers (`esGerenteGeneralProceso`, `esGerenteGeneralDirector`).

**Ámbito del rol (`ambito`):** `SISTEMA` vs `OPERATIVO` — usado para mostrar administración (`esAdmin`). **Permisos granulares:** `puedeVisualizar`, `puedeEditar` desde payload de login.

**Guardas de ruta:** `RoleGuard` (`src/components/auth/RoleGuard.tsx`) con `allowedRoles` en `router.tsx` para: identificación, planes de acción gestión, administración, supervisión, resumen director, mapas/parametros admin, gerente general, modo gerente general.

**Sesión expirada:** RTK Query y cliente HTTP en **401** limpian token y disparan evento `auth:session-expired` para redirigir a login.

---

## 4. Rutas de la aplicación (`src/app/router.tsx`)

Rutas definidas con constantes **`ROUTES`** en `src/utils/constants.ts` salvo las que están hardcodeadas en router (admin paths duplicados).

| Ruta | Componente / comportamiento | Restricción de rol |
|------|-----------------------------|---------------------|
| `/login` | Login | Público |
| `/modo-gerente-general` | Selector modo GG | `gerente` |
| `/` | `AdminRedirect` (índice) | Autenticado |
| `/dashboard` | Dashboard | Autenticado |
| `/riesgos-procesos` | Listado riesgos por procesos | — |
| `/ficha`, `/ficha/:procesoId` | Ficha de proceso | — |
| `/identificacion` | Identificación y calificación | `dueño_procesos`, `gerente`, `supervisor` |
| `/evaluacion` | Evaluación de riesgos | — |
| `/mapa` | Mapas inherente/residual | — |
| `/admin/mapas`, `/admin/parametros-calificacion`, `/admin/calificacion-inherente`, `/admin/calificacion-residual`, `/admin/residual-estrategico-cwr` | Config avanzada (incl. modo residual CWR por proceso) | `admin` |
| `/priorizacion` | Priorización | — |
| `/plan-accion` | Controles y planes de acción (vista integrada) | — |
| `/planes-accion` | Gestión de planes de acción | `supervisor`, `gerente`, `dueño_procesos` |
| `/evaluacion-control` | Evaluación de controles | — |
| `/historial` | Historial de cambios | — |
| `/normatividad`, `/contexto-externo`, `/contexto-interno`, `/dofa`, `/analisis-proceso` | Módulos de proceso | — |
| `/ayuda` | Ayuda | — |
| `/procesos`, `/procesos/nuevo` | Lista / alta proceso | — |
| `/administracion` | Redirige a usuarios | — |
| `/administracion/usuarios` | Usuarios | `admin` |
| `/administracion/procesos` | Definición de procesos admin | `admin` |
| `/administracion/areas` | Áreas | `admin` |
| `/administracion/configuracion` | Configuración | `admin` |
| `/admin/configuracion-mapa` | Config mapa (misma página que mapas en práctica) | `admin` |
| `/supervision`, `/resumen-director` | Supervisión y resumen director | `supervisor`, `gerente` |
| `/dashboard-supervisor` | Dashboard supervisor | — |
| `/resumen-riesgos` | Resumen riesgos | — |
| `/riesgos-por-proceso`, `/riesgos-por-tipologia` | Informes / vistas agregadas | — |
| `/incidencias` | Materializar riesgos (página `MaterializarRiesgosPage`) | — |
| `/procesos-gerente-general`, `/dashboard-gerente-general` | Vistas GG | `gerente` |
| `/asignaciones` | `Navigate` → `/administracion/areas` | — |
| `/admin-panel` | Panel admin compacto (layout sin sidebar principal) | `admin` |
| `*` | `RouteErrorElement` | — |

**Navegación lateral:** `MainLayout.tsx` — menús dinámicos según rol, proceso seleccionado, notificaciones (auditoría, riesgos críticos), **alertas de vencimiento** (`planTrazabilidadApi`), asistente **CORA** lazy (`VirtualAssistantDemo`).

---

## 5. Clasificación y niveles de riesgo (constantes UI)

En **`src/utils/constants.ts`**:

- **Clasificación de consecuencia:** `CLASIFICACION_RIESGO.POSITIVA` = `Riesgo con consecuencia positiva`; `NEGATIVA` = `Riesgo con consecuencia negativa` (deben coincidir con strings que persiste/consulta el backend).
- **Niveles mostrados:** `NIVELES_RIESGO`: CRÍTICO, ALTO, MEDIO, BAJO.
- **Umbrales numéricos legacy en front** (`UMBRALES_RIESGO`): 20 / 15 / 10 / 5 — la **fuente de verdad** de rangos para inherente/residual configurable está en **backend** (`CalificacionInherenteConfig`, `RangoNivelRiesgoResidual`); el front replica fórmulas en `calculations.ts` para previsualización coherente con Excel/diseño donde aplica.
- **Dimensiones de impacto y pesos por defecto** (`PESOS_IMPACTO`, `DIMENSIONES_IMPACTO`): económico 22%, legal 22%, reputación 22%, procesos 14%, ambiental 10%, personas 10%; SGSI y tecnológico en 0% en la versión actual de constantes — los pesos **reales** pueden venir de API (`Configuracion` `pesos_impacto`).
- **Escala:** probabilidad e impactos 1–5 con etiquetas `LABELS_PROBABILIDAD` / `LABELS_IMPACTO`.
- **Respuestas al riesgo:** Aceptar, Evitar, Reducir, Compartir.
- **Normatividad:** estados Proyecto / Requerida / Existente; cumplimiento Total / Parcial / No cumple.

**Oportunidades (riesgo positivo):** en `calculations.ts`, `determinarNivelRiesgo` fuerza **NIVEL BAJO** si la clasificación es positiva (alineado a reglas de negocio de no tratar oportunidades como amenaza crítica en mapa inherente).

---

## 6. Cálculos en cliente (`src/utils/calculations.ts`)

- **`calcularImpactoGlobal`:** suma ponderada con pesos desde BD (porcentaje 0–100) o fallback `PESOS_IMPACTO`; resultado con **`Math.ceil`** como en backend.
- **`calcularImpactoMaximo`:** máximo entre dimensiones.
- **`calcularRiesgoInherente`:** intenta servicio/hook de calificación inherente sync; fallback: producto probabilidad×impacto con **excepción 3.99** si impacto=2 y probabilidad=2.
- **`determinarNivelRiesgo`:** usa configuración inherente si está disponible; positivos → BAJO.
- Otras utilidades (mapas, estadísticas, comparaciones inherente/residual) según exports del archivo.

**Servicio de config inherente en SPA:** `src/services/calificacionInherenteService.ts` — cachea la configuración activa (alineada con admin y API), funciones sync `calcularCalificacionInherentePorCausaSync`, `determinarNivelRiesgoSync`, `agregarCalificacionInherenteGlobalSync`; usadas en **IdentificacionCalificacionPage**, **CalificacionInherentePage** y hook **`useCalificacionInherenteConfig`**.

---

## 7. Integración con el backend

| Archivo | Función |
|---------|---------|
| `src/utils/constants.ts` | `API_BASE_URL`, `AUTH_TOKEN_KEY`, `ROUTES`, enums y pesos |
| `src/services/api.ts` | `fetch` con JWT |
| `src/app/axiosClient.ts` | Axios + interceptores |
| `src/api/services/riesgosApi.ts` | RTK Query: procesos, riesgos, evaluaciones, causas, controles, catalogos, usuarios, áreas, mapas, configuración, incidencias, historial, etc. Tag types para invalidación: `Riesgo`, `Evaluacion`, `Proceso`, `PlanAccion`, `CalificacionInherente`, `MapaConfig`, … |
| `src/api/services/planTrazabilidadApi.ts` | Planes bajo causas, alertas de vencimiento, marcar leída |

**Prefijo:** todas las URLs son relativas a `VITE_API_BASE_URL` (incluye `/api`).

---

## 8. Estado global y contextos React

- **`src/app/store.ts`:** store con `riesgosApi`, `planTrazabilidadApi` y slices necesarios.
- **`src/contexts/AuthContext.tsx`:** usuario, login/logout, modos gerente/GG, permisos.
- **`src/contexts/ProcesoContext.tsx`**, **`RiesgoContext.tsx`:** proceso y riesgo seleccionados para flujos multi-pantalla.
- **CORA / asistente:** contexto o hooks asociados al demo en layout según implementación actual.

---

## 9. Mapas (`src/pages/mapas/MapaPage.tsx` y features)

- Mapas **inherente** y **residual** con puntos por proceso/riesgo.
- Filtros por **clasificación** consecuencia negativa vs positiva (tabs / filtros que envían `clasificacion` al API de puntos de mapa).
- **`proceso.residualModo`:** `ESTANDAR` (mitigación por % en controles) vs `ESTRATEGICO` (criterios MA + motor CWR / Anexo 6 en backend). La grilla residual sigue siendo **5×5**; en **ESTRATEGICO** las coordenadas residuales del mapa y estadísticas deben alinearse con la **evaluación persistida** (`evaluacion.probabilidadResidual` / `impactoResidual`), no con el recálculo estándar por causas en cliente (`src/utils/mapaResidualCoords.ts` — función `resolverCoordsResidualMapa`).
- **Cabecera:** si el proceso seleccionado es `ESTRATEGICO`, se muestra chip **Residual CWR** (`MainLayout.tsx`).
- **Dashboard supervisor** (`DashboardSupervisorPage.tsx`): en el acordeón “Detalle de Riesgos por Proceso”, cada proceso en modo `ESTRATEGICO` muestra chip **Residual CWR** con tooltip.
- Configuración de ejes y colores ligada a **`useCalificacionInherenteConfig`** y tema (`variables.css`, `theme/`).

---

## 10. Módulos de negocio por carpeta (`src/pages/`)

| Carpeta | Contenido típico |
|---------|------------------|
| `auth/` | Login |
| `dashboard/` | Dashboards y resúmenes |
| `ficha/` | Ficha proceso |
| `identificacion/` | Identificación y calificación de riesgos |
| `evaluacion/` | Evaluación (impactos/probabilidad) |
| `mapas/` | Mapa de calor / dispersión |
| `riesgos/` | Priorización, listados por proceso/tipología, materializar |
| `procesos/` | Procesos, normatividad, contexto, DOFA, análisis |
| `controles/` | Controles, evaluación de control, planes en misma área funcional |
| `planes/` | Gestión planes de acción |
| `supervision/` | Supervisión, dashboard supervisor, resumen director |
| `admin/` | Usuarios, áreas, configuración, mapas, parámetros, calificación inherente/residual; pestaña **Residual CWR** (`ResidualEstrategicoCwrPage.tsx`) para `residualModo` por proceso; **Gestión de Procesos** (`ProcesosDefinicionPage.tsx`) también columna y formulario de modo residual |
| `gerente-general/` | Procesos y dashboard GG |
| `otros/` | Ayuda, historial |

**Componentes compartidos:** `src/components/` (layout, auth, dashboard, mapas, UI). **Hooks:** `src/hooks/` (asignaciones, notificaciones, config inherente, etc.). **Features:** `src/features/` (p. ej. filtros de mapas).

---

## 11. Responsables de proceso

El API permite **varios responsables** con `modo` dueño/supervisor (`updateResponsablesProceso` en `riesgosApi`). La UI de procesos y supervisión filtra según asignaciones (`useAreasProcesosAsignados`, `useProcesosVisibles`).

---

## 12. Despliegue

Build estático: `npm run build` → `dist/`. Servir con nginx/CDN. Variables de entorno inyectadas en build time (Vite). **Docker:** `Dockerfile` en repo.

CORS y URL del API: ver **`context.md`** del backend.

---

## 13. Mantenimiento de este documento

Regla **`.cursor/rules/documentacion.mdc`**: ante cambios de código, actualizar **`context.md`**. El **contrato HTTP** detallado por endpoint está en el repo **`gestion_riesgos_backend`** (`context.md` y código de rutas).
