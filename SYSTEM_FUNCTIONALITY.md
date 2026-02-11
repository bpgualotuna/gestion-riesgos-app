# Documentación Funcional del Sistema de Gestión de Riesgos

Este documento describe el funcionamiento integral del sistema, sus roles, flujos de trabajo y reglas de negocio, basado en la arquitectura actual implementada.

---

## 1. Perfiles y Roles de Usuario

El sistema administra la gobernanza de riesgos a través de roles específicos con alcances definidos:

### ⚙️ Administrador (Admin)

#### Gestión de Organización (Módulo Admin)
El administrador tiene acceso completo a tres áreas principales:

**1. Usuarios, Cargos y Gerencias** (`UsuariosPage.tsx`)
   - **Pestaña Usuarios:**
     - Crea y gestiona usuarios del sistema
     - Asigna roles: Admin, Gerente General, Supervisor, Dueño de Procesos
     - Vincula usuarios con cargos
     - Activa/desactiva usuarios
     - **Tabla interactiva** con búsqueda y edición
   
   - **Pestaña Cargos:**
     - Define cargos organizacionales con descripción
     - **Tabla interactiva** de cargos disponibles
   
   - **Pestaña Gerencias:**
     - Crea gerencias con nombre, sigla y subdivisión
     - **Tabla de gerencias** para gestión centralizada

**2. Gestión de Áreas** (`AreasPage.tsx`)
   - **Pestaña Gestión de Áreas:**
     - Crea áreas organizacionales
     - Asigna un Director responsable a cada área
     - Define descripción del área
     - **Tabla de áreas** con columnas: ID, Nombre, Descripción, Director Asignado
   
   - **Pestaña Asignación de Responsabilidades:**
     - Selecciona usuario por rol (filtro dinámico)
     - **Para Gerente General:** Presenta dos sub-tabs:
       - **Modo Director:** Asigna áreas/procesos para supervisión
       - **Modo Proceso:** Asigna procesos estratégicos para gestión directa
     - **Para otros usuarios:** Asigna procesos mediante checkboxes agrupados por área
     - **Acordeones por área** mostrando procesos individuales
     - Permite asignación masiva de todos los procesos de un área
     - Guarda asignaciones en localStorage (Gerente General) o actualiza responsableId (otros usuarios)

**3. Definición de Procesos** (`ProcesosDefinicionPage.tsx`)
   - Crea el proceso maestro
   - Define tipo de proceso (Estratégico, Operacional, etc.)
   - Asigna responsable y área
   - **Gestión en tabla** con información completa del proceso

**4. Parametrización del Sistema**

   - **Configuración de Mapas de Riesgo** (`MapasConfigPage.tsx`):
     - Define colores para niveles de riesgo inherente y residual
     - Configura líneas de tolerancia para los mapas de calor
     - Establece umbrales de riesgo (Crítico, Alto, Medio, Bajo)
   
   - **Parámetros de Calificación** (`ParametrosCalificacionPage.tsx`):
     - **Pestañas múltiples** para gestionar catálogos:
       - **Tipos de Riesgo**: Clasificación principal (Estratégico, Operacional, etc.)
       - **Subtipos de Riesgo**: Subcategorías específicas
       - **Causas**: Factores que originan riesgos
       - **Consecuencias**: Impactos potenciales
       - **Objetivos**: Objetivos organizacionales afectados
       - **Impactos**: Dimensiones de impacto (Ambiental, Económico, Legal, Reputación, etc.)
       - **Probabilidad**: Niveles de probabilidad (Muy Baja a Muy Alta)
     - Cada pestaña tiene su propia **tabla editable** con CRUD completo
     - Permite configurar pesos para cálculo de riesgo

**5. Permisos de Creación** (`PermisosPage.tsx`)
   - Selecciona un proceso específico
   - Asigna qué usuarios pueden crear riesgos en ese proceso
   - **Autocomplete multi-selección** de usuarios autorizados

---

### 🛡️ Dueño de Proceso

**Alcance:** Gestiona únicamente los procesos que le han sido asignados desde el módulo de Áreas.

**Operación:**

**1. Selección de Contexto**
   - Selecciona su proceso en la barra superior (Header)
   - Este selector filtra TODA la información en los módulos siguientes

**2. Módulo de Procesos** (Información del proceso seleccionado)
   
   - **Ficha del Proceso** (`FichaPage.tsx`):
     - Información general del proceso
     - Responsable, área, tipo, estado
   
   - **Análisis de Proceso** (`AnalisisProcesoPage.tsx`):
     - Análisis detallado del proceso
   
   - **Normatividad** (`NormatividadPage.tsx`):
     - **Tabla de normatividad aplicable**
     - Columnas: Nombre, Estado (Proyecto/Requerida/Existente), Nivel de Cumplimiento
     - Gestión de requisitos legales y normativos
   
   - **Contexto Interno** (`ContextoInternoPage.tsx`):
     - Factores internos que afectan el proceso
   
   - **Contexto Externo** (`ContextoExternoPage.tsx`):
     - Factores externos relevantes
   
   - **DOFA** (`DofaPage.tsx`):
     - **Matriz interactiva visual de 4 cuadrantes:**
       - Fortalezas (verde)
       - Oportunidades (azul)
       - Debilidades (naranja)
       - Amenazas (rojo)
     - **Pestañas separadas** para:
       - Matriz DOFA completa (vista de cuadrantes)
       - Oportunidades (lista editable)
       - Amenazas (lista editable)
       - Fortalezas (lista editable)
       - Debilidades (lista editable)
       - Estrategias FO (Fortalezas-Oportunidades)
       - Estrategias FA (Fortalezas-Amenazas)
       - Estrategias DO (Debilidades-Oportunidades)
       - Estrategias DA (Debilidades-Amenazas)
     - Cada elemento se puede agregar, editar y eliminar con confirmación
     - Vista de matriz con **scroll independiente** por cuadrante
     - Contador de elementos por categoría
   
   - **Benchmarking** (`BenchmarkingPage.tsx`):
     - Comparación con mejores prácticas

**3. Identificación y Calificación** (`IdentificacionCalificacionPage.tsx`)
   - Registra **Riesgos Inherentes** mediante formulario:
     - Título y descripción del riesgo
     - Selección de causa (del catálogo)
     - Selección de consecuencia (del catálogo)
     - Tipo y subtipo de riesgo
     - Clasificación (positiva/negativa)
   - **Calificación multidimensional de impacto:**
     - Califica cada dimensión (Ambiental, Económico, Legal, Personas, Procesos, Reputación, etc.) del 1 al 5
     - Sistema aplica pesos configurados automáticamente
   - Califica probabilidad (1-5)
   - **Matriz de calor** muestra ubicación del riesgo
   - **Tabla de riesgos** registrados con filtros y búsqueda
   - Persistencia automática en localStorage centralizado

**4. Controles y Planes de Acción** (`ControlesYPlanesAccionPageNueva.tsx`)
   - **Vista de riesgos** identificados previamente
   - **Dos tipos de tratamiento:**
     
     **a) Control (Calificable):**
     - Define control existente
     - **Califica tres dimensiones:**
       - Diseño (1-5)
       - Ejecución (1-5)
       - Solidez (1-5)
     - Sistema calcula **riesgo residual** automáticamente
     - El control reduce el nivel de riesgo inherente
     
     **b) Plan de Acción (No calificable):**
     - Define acción preventiva/correctiva
     - Asigna responsable
     - Define fecha de implementación
     - **No afecta el cálculo residual**
   
   - **Tabla agrupada** de riesgos con sus controles/planes
   - **Cálculo agregado:** Muestra calificación residual solo para riesgos con controles

**5. Eventos - Materialización de Riesgos** (`IncidenciasPage.tsx`)
   - **Carga todos los riesgos inherentes** registrados en Identificación
   - **Selecciona riesgo materializado** de lista desplegable
   - Registra incidente con:
     - Fecha de ocurrencia
     - Descripción del evento
     - Impacto real
   - **Crea Plan de Acción reactivo:**
     - Específico para este incidente
     - Diferente del plan preventivo
     - Permite múltiples planes si el riesgo se materializa varias veces
   - **Tabla de incidencias** registradas con historial

---

### 👁️ Supervisor de Riesgos

**Alcance:** Visualización y monitoreo de procesos asignados (áreas completas o procesos específicos).

**Operación:**

**1. Dashboard de Supervisión** (`DashboardSupervisorPage.tsx`)
   - **Estadísticas agregadas** de todos los procesos supervisados:
     - Total de riesgos
     - Riesgos críticos
     - Distribución por tipología
     - Distribución por proceso
   - **Gráficos visuales:**
     - Total de riesgos (card)
     - Riesgos por proceso (gráfico de barras)
     - Riesgos por tipología (gráfico de pastel)
     - Origen de riesgos

**2. Navegación con Filtros**
   - **Filtros disponibles en cada módulo:**
     - Filtro por Área (dropdown)
     - Filtro por Proceso dentro del área (dropdown dependiente)
   - Los filtros están presentes en:
     - DOFA
     - Normatividad
     - Contexto Interno/Externo
     - Identificación
     - Controles
     - Eventos
   
**3. Modo Solo Lectura**
   - **Todos los formularios y tablas** en modo visualización
   - No puede crear, editar ni eliminar
   - Puede exportar e imprimir información
   - **Chip visual** indica "Modo Visualización"

---

### 👔 Gerente General (Rol Dual)

**Funcionalidad Única:** El Gerente General tiene **dos modos de operación** configurables desde el módulo de Áreas.

**Selección de Modo:**
   - Al iniciar sesión se presenta un **diálogo de selección**
   - Puede cambiar de modo desde su perfil

**Modo 1: Director (Supervisión)**
   - **Comportamiento:** Actúa como Supervisor de alto nivel
   - **Alcance:** Procesos/áreas asignados en la pestaña "Modo Director" de Asignaciones
   - **Dashboard Gerencial** (`DashboardGerenteGeneralPage.tsx`):
     - Resumen ejecutivo de **toda la organización**
     - KPIs principales:
       - Total de procesos
       - Total de riesgos
       - Número de áreas
       - Riesgos críticos
     - **Gráficos consolidados:**
       - Riesgos por tipología
       - Riesgos por proceso
       - Origen de riesgos
       - Procesos por área
       - Procesos por estado
   - **Navegación:** Igual que Supervisor, con filtros de Área/Proceso
   - **Modo:** Solo lectura en todos los módulos

**Modo 2: Dueño de Proceso (Gestión Estratégica)**
   - **Comportamiento:** Actúa como Dueño de Proceso
   - **Alcance:** Solo **Procesos Estratégicos** asignados en "Modo Proceso"
   - **Vista de Procesos** (`ProcesosGerenteGeneralPage.tsx`):
     - **Filtro automático:** Solo muestra procesos tipo "Estratégico" o "Gerencial"
     - **Tarjetas de procesos** con acciones
   - **Funcionalidad completa de Dueño:**
     - Puede crear/editar riesgos estratégicos
     - Define controles de alto nivel
     - Reporta materializaciones estratégicas
   - **Selector de proceso:** Funciona igual que para Dueño de Proceso

---

## 2. Navegación y Contexto del Sistema

### Selector de Proceso (Header)

**Ubicación:** Barra superior (AppBar)

**Función:** Filtro Global Contextual

**Comportamiento:**
1. El usuario selecciona un proceso del dropdown
2. El proceso seleccionado se guarda en el `ProcesoContext`
3. **Todos los módulos** desde "Procesos" hasta "Eventos" filtran su información por este proceso
4. Los módulos afectados son:
   - Ficha del Proceso
   - Análisis de Proceso
   - Normatividad
   - Contexto Interno
   - Contexto Externo
   - DOFA
   - Benchmarking
   - Identificación y Calificación
   - Controles y Planes de Acción
   - Materialización de Riesgos (Eventos)

**Procesos Disponibles:**
- **Admin:** Ve todos los procesos
- **Dueño:** Ve solo sus procesos asignados
- **Supervisor:** Ve procesos de áreas/procesos asignados
- **Gerente General (Proceso):** Ve solo procesos estratégicos

---

### Dashboard Global

**Excepción al Selector:** El Dashboard es **independiente** del selector de proceso.

**Comportamiento:**
1. **Agregación total:** Muestra información de TODOS los procesos asignados al usuario
2. **Sin filtro por proceso individual:** El selector del header no afecta el Dashboard
3. **Información consolidada:**
   - Total de riesgos de todos los procesos
   - Riesgos críticos agregados
   - Distribución general por tipología
   - Distribución por proceso (compara todos los procesos)

**Dashboards Específicos:**
- `DashboardSupervisorPage.tsx`: Para Supervisor y Dueños
- `DashboardGerenteGeneralPage.tsx`: Para Gerente General modo Director

---

### Menú Lateral (Sidebar)

**Estructura Jerárquica:**

1. **Dashboard** (Siempre visible)
   - Estadísticas
   - Mapa de Riesgo

2. **Procesos** (Requiere proceso seleccionado)
   - Ficha del Proceso
   - Análisis de Proceso
   - Normatividad (con tabla)
   - Contexto Interno
   - Contexto Externo
   - DOFA (matriz interactiva)
   - Benchmarking

3. **Identificación y Calificación** (Requiere proceso)
   - Registro de riesgos inherentes
   - Matriz de calificación

4. **Controles y Planes de Acción** (Requiere proceso)
   - Gestión de controles calificables
   - Gestión de planes preventivos

5. **Eventos** (Requiere proceso)
   - Materialización de Riesgos
   - Planes reactivos

**Comportamiento del Sidebar:**
- **Modo colapsado:** Solo muestra iconos
- **Modo expandido:** Muestra texto completo y submenús
- **Hover en colapsado:** Panel flotante con submenús
- **Indicador visual:** Resalta la sección activa

---

## 3. Flujos de Trabajo Detallados

### A. Configuración Inicial del Sistema (Admin)

**Orden recomendado:**

1. **Crear Cargos y Gerencias**
   - Módulo Admin → Usuarios → Pestaña Cargos
   - Módulo Admin → Usuarios → Pestaña Gerencias
   - Definir estructura organizacional

2. **Crear Usuarios**
   - Módulo Admin → Usuarios → Pestaña Usuarios
   - Asignar nombre, email, cargo y rol
   - Activar usuarios

3. **Configurar Áreas**
   - Módulo Admin → Áreas → Gestión de Áreas
   - Crear áreas con su director asignado
   - Tabla de áreas para gestión

4. **Crear Procesos**
   - Módulo Admin → Procesos
   - Definir procesos maestros
   - Asignar tipo (Estratégico, Operacional, etc.)

5. **Asignar Responsabilidades**
   - Módulo Admin → Áreas → Asignación de Responsabilidades
   - Seleccionar usuario
   - Si es Gerente General: elegir modo (Director o Proceso)
   - Marcar áreas/procesos asignados mediante checkboxes
   - Guardar asignaciones

6. **Configurar Parámetros del Sistema**
   - **Mapas de Riesgo**: Definir colores y umbrales
   - **Catálogos**: Crear tipos, causas, consecuencias, impactos
   - **Probabilidades**: Definir niveles

---

### B. Gestión de Procesos (Dueño)

**Paso 1: Seleccionar Proceso**
   - Usar selector del header
   - Todos los módulos se filtran automáticamente

**Paso 2: Completar Información del Proceso**
   
   **a) Ficha del Proceso:**
   - Completar información general
   
   **b) Normatividad:**
   - Agregar normatividad aplicable en tabla
   - Definir estado y nivel de cumplimiento
   
   **c) Contexto Interno/Externo:**
   - Documentar factores relevantes
   
   **d) Matriz DOFA:**
   - Ir a pestaña "Oportunidades" → Agregar items
   - Ir a pestaña "Amenazas" → Agregar items
   - Ir a pestaña "Fortalezas" → Agregar items
   - Ir a pestaña "Debilidades" → Agregar items
   - Ver matriz completa en pestaña "Matriz DOFA"
   - Opcional: Definir estrategias (FO, FA, DO, DA)
   - Guardar DOFA

---

### C. Identificación y Evaluación de Riesgos (Dueño)

**Paso 1: Crear Riesgo Inherente**
   - Navegar a "Identificación y Calificación"
   - Clic en "Nuevo Riesgo"
   - Llenar formulario:
     - Título del riesgo
     - Descripción detallada
     - Seleccionar Tipo de Riesgo (del catálogo)
     - Seleccionar Subtipo
     - Seleccionar Causa (del catálogo)
     - Seleccionar Consecuencia (del catálogo)
     - Clasificación (Positiva/Negativa)

**Paso 2: Calificar Impacto**
   - **Calificación multidimensional:**
     - Ambiental: 1-5
     - Económico: 1-5
     - Legal: 1-5
     - Personas: 1-5
     - Procesos: 1-5
     - Reputación: 1-5
     - (Otras dimensiones configuradas)
   - Sistema aplica pesos automáticamente
   - Calcula impacto ponderado

**Paso 3: Calificar Probabilidad**
   - Seleccionar nivel: 1 (Muy Baja) a 5 (Muy Alta)

**Paso 4: Ubicación en Mapa**
   - Sistema calcula: Impacto × Probabilidad
   - Determina nivel de riesgo (Crítico/Alto/Medio/Bajo)
   - Ubica automáticamente en Matriz de Calor

**Paso 5: Guardar**
   - Clic en "Guardar Riesgo"
   - Sistema persiste en localStorage centralizado
   - Riesgo aparece en tabla de riesgos

**Paso 6: Revisión**
   - Ver riesgo en la tabla de riesgos identificados
   - Ver riesgo ubicado en el Mapa de Calor (Menú → Dashboard → Mapa de Riesgo)

---

### D. Tratamiento del Riesgo: Controles y Planes (Dueño)

**Contexto:** Una vez identificados los riesgos inherentes, se debe definir su tratamiento.

**Paso 1: Acceder a Controles**
   - Navegar a "Controles y Planes de Acción"
   - Sistema carga automáticamente los riesgos inherentes del proceso seleccionado

**Paso 2: Decidir Tipo de Tratamiento**

**Opción A: Implementar un CONTROL (Calificable)**

   **¿Cuándo usar?**
   - Cuando existe un control activo que mitiga el riesgo
   - Requiere evaluación cuantitativa de su efectividad

   **Pasos:**
   1. Seleccionar riesgo de la lista
   2. Clic en "Agregar Control"
   3. Completar información del control:
      - Nombre del control
      - Descripción
      - Tipo de control (Preventivo/Detectivo/Correctivo)
      - Responsable
   4. **Calificar efectividad del control:**
      - **Diseño** (1-5): ¿Qué tan bien está diseñado el control?
      - **Ejecución** (1-5): ¿Qué tan bien se ejecuta?
      - **Solidez** (1-5): ¿Qué tan robusto es el control?
   5. Sistema calcula **Riesgo Residual:**
      - Fórmula: Reduce nivel inherente según efectividad del control
      - Ubica el riesgo residual en la Matriz Residual
   6. Guardar control

   **Resultado:**
   - Riesgo tiene nivel inherente (sin control)
   - Riesgo tiene nivel residual (con control)
   - Aparece en Mapa de Calor Residual

**Opción B: Definir un PLAN DE ACCIÓN (No calificable)**

   **¿Cuándo usar?**
   - Control no existe aún (se va a implementar)
   - Es una medida preventiva en desarrollo
   - No tiene sentido calificar su efectividad actual

   **Pasos:**
   1. Seleccionar riesgo de la lista
   2. Clic en "Agregar Plan de Acción"
   3. Completar información:
      - Descripción del plan
      - Acciones específicas
      - Responsable
      - Fecha de implementación
      - Estado (Pendiente/En Proceso/Completado)
   4. Guardar plan

   **Resultado:**
   - Riesgo tiene plan preventivo documentado
   - **No se calcula riesgo residual**
   - Riesgo permanece en su nivel inherente en el mapa

**Paso 3: Revisión de Calificación Residual**
   - Ver **tabla agrupada** de riesgos:
     - Columna "Riesgo Inherente"
     - Columna "Controles" (lista de controles aplicados)
     - Columna "Riesgo Residual" (solo si tiene controles)
     - Columna "Planes de Acción" (lista de planes)
   - **Cálculo agregado:** Sistema muestra estadísticas solo de riesgos con controles

**Paso 4: Ver Mapas**
   - **Mapa Inherente:** Todos los riesgos en su nivel original
   - **Mapa Residual:** Solo riesgos con controles, en su nivel mitigado

---

### E. Materialización de Riesgos y Gestión de Incidentes (Dueño)

**Contexto:** Un riesgo inherente identificado se ha materializado (ocurrió el evento).

**Importante:** Solo existe el formulario inline expandible por causa. No hay botón "Nueva Incidencia" ni modal.

**Paso 1: Acceder a Eventos**
   - Navegar a "Eventos" → "Materializar Riesgos"

**Paso 2: Seleccionar Riesgo Materializado**
   - Sistema despliega **todos los riesgos inherentes** del proceso en tarjetas expandibles
   - Expandir la tarjeta del riesgo materializado
   - Ver causas asociadas al riesgo
   - Cada causa tiene un chip que indica si ya fue "Materializado" o "No Materializado"

**Paso 3: Registrar el Incidente (Formulario Inline)**
   - Click en "Reportar" en la causa específica que se materializó
   - **El formulario se despliega debajo** (no en modal)
   - Si ya existe una materialización, el botón dice "Ver / Editar"
   - Completar formulario de incidencia:
     - Fecha de ocurrencia
     - Fecha del reporte
     - Descripción del evento que ocurrió
     - Observaciones/Decisión tomada

**Paso 4: Calificar Impactos de la Materialización**
   - **Calificación multidimensional igual que en Identificación:**
     - **Impacto Económico** (slider 0-5 con tooltip)
     - **Impacto Reputacional** (slider 0-5 con tooltip)
     - **Impacto Legal** (slider 0-5 con tooltip)
     - **Impacto Operacional/Procesos** (slider 0-5 con tooltip)
     - **Impacto Personas** (slider 0-5 con tooltip)
     - **Impacto Ambiental** (slider 0-5 con tooltip)
   - **Tooltip con descripción:** Al pasar el mouse sobre cada slider, aparece la descripción textual del nivel seleccionado (ej: "Muy Bajo", "Alto", etc.) según la configuración de catálogos
   - Estos impactos representan el **daño real** que causó la materialización
   - Permite comparar impacto proyectado vs impacto real

**Paso 5: Definir Plan de Acción Reactivo**
   - **IMPORTANTE:** Este plan es diferente al plan preventivo de la fase de Controles
   - Este plan es **específico para el incidente materializado**
   - Completar:
     - Descripción del plan de acción
     - Responsable de ejecutar acciones
   - **No se solicita Estado** (se asume "Abierta" al crear)

**Paso 6: Guardar Incidencia**
   - Click en "Guardar Reporte"
   - Sistema vincula el incidente con el riesgo inherente original y la causa específica
   - Relación 1:N (un riesgo puede tener múltiples incidencias/materializaciones)
   - Sistema cierra automáticamente el formulario
   - Chip cambia de "No Materializado" a "Materializado"

**Paso 7: Seguimiento (Tab "Planes de Acción de Riesgos Materializados")**
   - Ver **tabla de incidencias** registradas
   - Columnas:
     - Riesgo relacionado
     - Plan de acción definido
     - Responsable
   - Filtrado automático por proceso seleccionado

**Diferencia clave:**
- **Plan Preventivo** (Controles): Se define ANTES de que ocurra el riesgo
- **Plan Reactivo** (Incidencias): Se crea DESPUÉS de que el riesgo se materializó
- **Impactos en Identificación:** Proyección teórica del daño potencial
- **Impactos en Materialización:** Daño real medido después del evento

---

### F. Supervisión y Monitoreo (Supervisor / Gerente Director)

**Paso 1: Acceder al Dashboard**
   - Automático al iniciar sesión
   - Vista consolidada de todos los procesos asignados

**Paso 2: Análisis de KPIs**
   - Revisar tarjetas de estadísticas:
     - Total de riesgos
     - Riesgos críticos que requieren atención
     - Distribución por tipología
   - Identificar procesos con mayor riesgo

**Paso 3: Navegación por Filtros**
   **Ejemplo de flujo:**
   1. Ir a "DOFA"
   2. **Filtro Área:** Seleccionar  "Área de TI"
   3. **Filtro Proceso:** Seleccionar "Gestión de Infraestructura"
   4. Ver Matriz DOFA del proceso filtrado
   5. **Modo Solo Lectura:** No puede editar, solo visualizar

**Paso 4: Revisión de Módulos**
   - **Normatividad:** Ver tabla de cumplimiento normativo
   - **Identificación:** Ver riesgos identificados por el dueño
   - **Controles:** Ver controles implementados y su efectividad
   - **Eventos:** Ver incidencias reportadas

**Paso 5: Exportar Información** (funcionalidad pendiente)
   - Generar reportes
   - Exportar datos a Excel

---

## 4. Componentes y Funcionalidades del Sistema

### Tablas Interactivas (Data Grids)

El sistema utiliza **Material-UI Data Grid** en múltiples módulos:

**Características comunes:**
- **Paginación:** Control de registros por página
- **Ordenamiento:** Por cualquier columna
- **Búsqueda:** Filtro de texto rápido
- **Acciones por fila:** Editar, Eliminar, Ver detalle
- **Selección múltiple:** En algunos casos (ej: asignaciones)
- **Exportación:** CSV, Excel (en desarrollo)

**Tablas implementadas:**

1. **Usuarios** (`UsuariosPage`)
   - Columnas: ID, Nombre, Email, Cargo, Rol, Estado (Activo/Inactivo)
   - Acciones: Editar usuario, Eliminar con confirmación

2. **Cargos** (`UsuariosPage`)
   - Columnas: ID, Nombre, Descripción
   - CRUD completo

3. **Gerencias** (`UsuariosPage`)
   - Columnas: ID, Nombre, Sigla, Subdivisión
   - CRUD completo

4. **Áreas** (`AreasPage`)
   - Columnas: ID, Nombre, Descripción, Director Asignado
   - Chip visual para mostrar director

5. **Procesos** (`ProcesosDefinicionPage`)
   - Columnas: Nombre, Tipo, Área, Responsable, Estado
   - Tarjetas visuales con información completa

6. **Normatividad** (`NormatividadPage`)
   - Columnas: Nombre normativa, Estado (Proyecto/Requerida/Existente), Nivel de Cumplimiento (Total/Parcial/No cumple)
   - Filtros por estado y cumplimiento

7. **Riesgos Identificados** (`IdentificacionCalificacionPage`)
   - Columnas: Código, Título, Tipo, Causa, Probabilidad, Impacto, Nivel de Riesgo
   - Indicador visual de nivel (color)
   - Acciones: Ver detalle, Editar, Eliminar

8. **Controles** (`ControlesYPlanesAccionPageNueva`)
   - Tabla agrupada por riesgo
   - Muestra controles asociados
   - Calificación de efectividad
   - Nivel residual calculado

9. **Incidencias** (`IncidenciasPage`)
   - Columnas: Riesgo, Fecha, Descripción, Estado plan reactivo
   - Historial completo

### Matriz DOFA Interactiva

**Componentes visuales:**

1. **Vista de Matriz Completa**
   - **4 cuadrantes con colores distintivos:**
     - Fortalezas: Verde (#4caf50)
     - Oportunidades: Azul (#0288d1)
     - Debilidades: Naranja (#ff9800)
     - Amenazas: Rojo (#f44336)
   - **Cada cuadrante:**
     - Título con icono
     - Contador de elementos
     - Scroll independiente
     - Hover effect con elevación
     - Click para ir a edición

2. **Pestañas de Edición**
   - 8 pestañas individuales:
     1. Matriz DOFA (vista completa)
     2. Oportunidades (editable)
     3. Amenazas (editable)
     4. Fortalezas (editable)
     5. Debilidades (editable)
     6. Estrategias FO
     7. Estrategias FA
     8. Estrategias DO
     9. Estrategias DA

3. **Funcionalidad por pestaña:**
   - Botón "Agregar" (si no es modo solo lectura)
   - Lista de items con:
     - TextField multiline para descripción
     - Botón eliminar (con confirmación)
   - Guardar todos los cambios
   - Persistencia en localStorage

### Mapas de Calor de Riesgos

**Dos mapas principales:**

1. **Mapa Inherente** (`MapaInherentePage`)
   - Muestra TODOS los riesgos sin controles
   - Eje X: Probabilidad (1-5)
   - Eje Y: Impacto (1-5)
   - Zonas coloreadas: Bajo, Medio, Alto, Crítico
   - Puntos posicionados según calificación
   - Líneas de tolerancia configurables

2. **Mapa Residual** (`MapaResidualPage`)
   - Muestra solo riesgos CON controles implementados
   - Posición según nivel residual calculado
   - Comparación visual del efecto de los controles

**Interactividad:**
- Click en punto: Ver detalle del riesgo
- Tooltip al hover: Información resumida
- Filtros: Por proceso, por tipo, por nivel

### Dashboards y Visualizaciones

**Componentes de Dashboard:**

1. **Tarjetas de KPI** (`TotalRiesgosCard`, etc.):
   - Degradados visuales
   - Iconos grandes
   - Números destacados
   - Animaciones al cargar

2. **Gráficos:**
   - **Barras:** Riesgos por proceso
   - **Pastel/Dona:** Distribución por tipología
   - **Líneas:** Tendencias (en desarrollo)

3. **Resúmenes Ejecutivos:**
   - Procesos por área
   - Procesos por estado
   - Distribución de áreas supervisadas

### Sistema de Notificaciones

**Tipos de notificación:**
- **Success (Verde):** Operación exitosa
- **Error (Rojo):** Error en operación
- **Info (Azul):** Información general
- **Warning (Amarillo):** Advertencias

**Ubicación:** Top-right de la pantalla

**Ejemplos:**
- "Riesgo guardado correctamente"
- "Usuario creado exitosamente"
- "Elemento eliminado"
- "Por favor complete todos los campos"

### Diálogos de Confirmación

**Implementado en:**
- Eliminar usuario
- Eliminar área
- Eliminar riesgo
- Eliminar control
- Eliminar elemento de DOFA

**Flujo:**
1. Usuario hace clic en "Eliminar"
2. Sistema muestra diálogo modal:
   - "¿Está seguro de eliminar este elemento?"
   - Botón "Cancelar"
   - Botón "Eliminar" (color rojo)
3. Si confirma: ejecuta eliminación
4. Muestra notificación de éxito

### Modo Responsive

**Breakpoints:**
- **xs:** < 600px (móvil)
- **sm:** 600-900px (tablet)
- **md:** 900-1200px (laptop)
- **lg:** > 1200px (desktop)

**Adaptaciones:**
- Sidebar se convierte en drawer lateral en móvil
- Tablas con scroll horizontal en pantallas pequeñas
- Grids de tarjetas cambian de columnas
- Formularios en columna única en móvil

---

## 5. Reglas de Negocio y Validaciones

### Persistencia de Datos

**Estrategia Actual (Mock Data):**
- **localStorage centralizado:** Todas las entidades se guardan en claves específicas
- **Gestión centralizada:** `mockData.ts` maneja lectura/escritura
- **Funciones principales:**
  - `getCurrentRiesgos()`: Lee riesgos desde localStorage
  - `saveRiesgos()`: Guarda riesgos en localStorage
  - Similar para otras entidades

**Migración a Backend (Roadmap):**
- API REST con endpoints `/api/riesgos`, `/api/procesos`, etc.
- Mantener estructura de datos actual
- RTK Query ya configurado para transición

### Confirmaciones y Validaciones

**Confirmación obligatoria en:**
1. Eliminar usuario
2. Eliminar proceso
3. Eliminar área
4. Eliminar riesgo
5. Eliminar control
6. Eliminar plan de acción
7. Eliminar item de DOFA
8. Eliminar normatividad

**Validaciones de formularios:**
- Campos requeridos: marcados con asterisco (*)
- Email: formato válido
- Fechas: no pueden ser pasadas (en algunos casos)
- Calificaciones: deben estar entre 1 y 5
- Nombres únicos: usuarios, áreas (en desarrollo)

### Cálculos Automáticos

**1. Nivel de Riesgo Inherente:**
```
Impacto Ponderado = Σ (Impacto_dimensión × Peso_dimensión)
Nivel_Inherente = Impacto_Ponderado × Probabilidad
```

**2. Nivel de Riesgo Residual:**
```
Efectividad_Control = (Diseño + Ejecución + Solidez) / 15
Reducción = Nivel_Inherente × Efectividad_Control
Nivel_Residual = Nivel_Inherente - Reducción
```

**3. Clasificación de Nivel:**
- Crítico: >= 20
- Alto: >= 15 y < 20
- Medio: >= 10 y < 15
- Bajo: < 10

### Permisos y Restricciones

**Admin:**
- Acceso completo a configuración
- No ve riesgos operativos (solo administra sistema)

**Dueño de Proceso:**
- Solo sus procesos asignados
- CRUD completo en sus procesos
- No ve procesos de otros

**Supervisor:**
- Ve procesos asignados
- **Solo lectura** en todo
- No puede crear/editar/eliminar

**Gerente General:**
- **Modo Director:** Solo lectura, ve todo lo asignado
- **Modo Proceso:** CRUD en procesos estratégicos únicamente

---

## 6. Funcionalidades Adicionales

### Búsqueda y Filtros

**Búsqueda rápida:**
- Implementada en todas las tablas
- Campo de texto con icono de lupa
- Filtrado instantáneo (debounce 300ms)

**Filtros avanzados:**
- **Por Área:** Dropdown con áreas disponibles
- **Por Proceso:** Dropdown dependiente del área
- **Por Estado:** En normatividad y procesos
- **Por Nivel de Riesgo:** En riesgos identificados
- **Por Tipología:** En dashboards

### Historial y Auditoría (En desarrollo)

**Registro de cambios:**
- Quién creó el registro
- Fecha de creación
- Última actualización
- Usuario que actualizó

**Campos de auditoría:**
- `createdAt`: Timestamp de creación
- `updatedAt`: Timestamp de última modificación
- `createdBy`: ID del usuario creador
- `updatedBy`: ID del último editor

### Exportación de Datos (Roadmap)

**Formatos planeados:**
- Excel (.xlsx)
- PDF
- CSV

**Reportes:**
- Reporte de riesgos por proceso
- Matriz DOFA exportable
- Dashboard ejecutivo en PDF
- Tabla de incidencias

---

## 7. Roadmap y Funcionalidades Futuras

### Corto Plazo (Próximas versiones)

1. **Integración con Backend Real:**
   - API REST con Node.js/Express
   - Base de datos PostgreSQL/MySQL
   - Migración de localStorage a API calls

2. **Gestión de Tareas:**
   - Tareas derivadas de planes de acción
   - Asignación de responsables
   - Seguimiento de cumplimiento
   - Alertas de vencimiento

3. **Reportes Avanzados:**
   - Generador de reportes personalizables
   - Exportación a Excel/PDF
   - Gráficos interactivos con drill-down

### Mediano Plazo

4. **Notificaciones Push:**
   - Alertas de riesgos críticos
   - Recordatorios de tareas pendientes
   - Notificaciones de cambios en procesos supervisados

5. **Workflow de Aprobación:**
   - Riesgos requieren aprobación de supervisor
   - Histórico de aprobaciones
   - Comentarios y retroalimentación

6. **Análisis Avanzado:**
   - Tendencias de riesgos en el tiempo
   - Predicción de materializaciones
   - Análisis de correlación entre riesgos

### Largo Plazo

7. **Integración con Otros Sistemas:**
   - ERP
   - CRM
   - Sistemas de calidad

8. **BI y Analytics:**
   - Dashboard de business intelligence
   - Análisis predictivo
   - Machine learning para detección de patrones

9. **Gestión Documental:**
   - Adjuntar documentos a riesgos
   - Evidencias de controles
   - Políticas y procedimientos

---

## 8. Guía de Uso Rápida

### Para Administradores

**Primer uso del sistema:**
1. Crear cargos y gerencias
2. Crear usuarios y asignar roles
3. Crear áreas organizacionales
4. Crear procesos maestros
5. Configurar catálogos (tipos, causas, consecuencias)
6. Configurar mapas de calor
7. Asignar responsabilidades a usuarios

**Mantenimiento continuo:**
- Gestionar usuarios activos/inactivos
- Actualizar catálogos según necesidad
- Ajustar asignaciones de responsabilidades
- Revisar configuraciones de mapas

### Para Dueños de Proceso

**Flujo estándar:**
1. Seleccionar proceso del header
2. Completar información del proceso (Ficha, Contexto, DOFA)
3. Identificar riesgos inherentes
4. Calificar riesgos (impacto multidimensional + probabilidad)
5. Definir controles o planes de acción
6. Si un riesgo se materializa: registrar en Eventos
7. Seguimiento continuo de incidencias

### Para Supervisores

**Flujo de supervisión:**
1. Revisar Dashboard agregado
2. Identificar procesos con riesgos críticos
3. Usar filtros Área/Proceso para navegar
4. Revisar matrices DOFA
5. Verificar controles implementados
6. Monitorear incidencias reportadas
7. Exportar reportes (cuando esté disponible)

### Para Gerente General

**Modo Director:**
1. Ver Dashboard Gerencial consolidado
2. Identificar áreas de alto riesgo
3. Navegar con filtros para profundizar
4. Modo solo lectura en todo

**Modo Proceso:**
1. Seleccionar proceso estratégico
2. Gestionar riesgos estratégicos como Dueño
3. Definir controles de alto nivel
4. Reportar incidencias estratégicas

---

## 9. Soporte y Ayuda

### Mensajes del Sistema

Todos los mensajes han sido diseñados para ser claros y accionables:
- **Éxito:** "Riesgo guardado correctamente"
- **Error:** "Por favor complete todos los campos requeridos"
- **Información:** "Seleccione un proceso para continuar"
- **Advertencia:** "Este proceso no está asignado a su supervisión"

### Indicadores Visuales

- **Chip "Modo Visualización":** Usuario en solo lectura
- **Chip "Modo Edición":** Usuario puede modificar
- **Colores de nivel de riesgo:** Inmediatamente identificables
- **Iconos descriptivos:** En toda la interfaz para claridad

### Tooltips y Ayuda Contextual

- Hover sobre iconos: descripción de acción
- Ayuda en formularios: placeholder text descriptivo
- Labels claros en todos los campos

---

## 10. Consideraciones Técnicas

### Tecnologías Utilizadas

**Frontend:**
- React 18
- TypeScript
- Material-UI (MUI) v5
- Redux Toolkit + RTK Query
- React Router v6

**Estado Global:**
- Redux para estado de aplicación
- Context API para proceso seleccionado y autenticación

**Persistencia (Actual):**
- localStorage como base de datos temporal
- Estructura JSON para todas las entidades

**Futura Migración:**
- API REST
- Backend Node.js
- Base de datos SQL (PostgreSQL)

### Estructura de Código

```
src/
├── api/
│   └── services/
│       ├── mockData.ts (gestión centralizada de datos)
│       └── riesgosApi.ts (RTK Query API)
├── components/
│   ├── admin/ (componentes de administración)
│   ├── auth/ (autenticación)
│   ├── dashboard/ (tarjetas y gráficos)
│   ├── layout/ (MainLayout, Sidebar)
│   ├── mapas/ (componentes de mapas de calor)
│   ├── notificaciones/
│   ├── procesos/
│   └── ui/ (componentes reutilizables)
├── pages/
│   ├── admin/ (13 páginas de administración)
│   ├── controles/ (5 páginas)
│   ├── dashboard/ (4 páginas)
│   ├── gerente-general/ (2 páginas)
│   ├── identificacion/
│   ├── incidencias/
│   ├── mapas/ (3 páginas)
│   ├── procesos/ (9 páginas)
│   └── supervision/ (5 páginas)
├── contexts/
│   ├── AuthContext.tsx
│   ├── ProcesoContext.tsx
│   └── RiesgoContext.tsx
├── hooks/
│   ├── useNotification.ts
│   └── useAsignaciones.ts
└── utils/
    └── constants.ts (rutas, configuraciones)
```

### Mejores Prácticas Implementadas

1. **Componentización:** Componentes reutilizables y atómicos
2. **Tipado fuerte:** TypeScript en todo el proyecto
3. **Estado predecible:** Redux Toolkit para gestión de estado
4. **Código limpio:** ESLint y Prettier configurados
5. **Performance:** Memoización con useMemo y useCallback
6. **Accesibilidad:** ARIA labels y navegación por teclado

---

## Conclusión

Este sistema de Gestión de Riesgos proporciona una solución integral para la identificación, evaluación, tratamiento y monitoreo de riesgos organizacionales. Con roles claramente definidos, flujos de trabajo estructurados y múltiples herramientas de visualización (tablas interactivas, matriz DOFA, mapas de calor), permite a las organizaciones gestionar eficazmente su exposición al riesgo mientras mantienen un registro auditable y trazable de todas las actividades relacionadas.

La arquitectura modular y las tecnologías modernas utilizadas aseguran que el sistema sea escalable, mantenible y listo para futuras expansiones según las necesidades del negocio evolucionen.
