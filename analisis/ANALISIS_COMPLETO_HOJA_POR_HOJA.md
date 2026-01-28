# Análisis Completo Hoja por Hoja
## Herramienta de Gestión de Riesgo Talento Humano V1

---

## Resumen Ejecutivo

- **Total de hojas**: 21
- **Total de fórmulas**: 11,851
- **Total de validaciones**: 13
- **Total de formatos condicionales**: 20 rangos (más de 1,270 reglas)
- **Total de referencias cruzadas**: 3,145
- **Contiene macros VBA**: Sí

---

## HOJA 1: Introducción

### Información General
- **Dimensiones**: A1:K87
- **Filas**: 87
- **Columnas**: 11
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Hoja de documentación e instrucciones generales sobre el uso de la herramienta.

### Contenido
- Instrucciones generales
- Información sobre el código: HHC-FO-CI&R-03
- Versión: 01
- Emisión: 26/05/2017
- Descripción de las diferentes secciones de la herramienta

### Columnas con Datos
- **Columna A**: 27 valores de texto (instrucciones)
- **Columna C**: 2 valores (títulos principales)
- **Columna J**: 3 valores (código, versión, emisión)

### Migración a Web
- Convertir a página de ayuda/documentación
- Incluir en el menú principal como "Ayuda" o "Instrucciones"
- Mantener formato legible con markdown o HTML

---

## HOJA 2: 1. Ficha

### Información General
- **Dimensiones**: B2:J41
- **Filas**: 41
- **Columnas**: 10
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Formulario de diligenciamiento obligatorio con información básica del proceso.

### Estructura de Datos
Campos identificados:
- Nombre de la Vicepresidencia/Gerencia Alta
- Nombre de la Gerencia
- Subdivisión
- Responsable del proceso
- Fecha

### Datos de Ejemplo
- Vicepresidencia: "Gestión Financiera y Administrativa"
- Gerencia: "Dirección Financiera Administrativa"
- Subdivisión: "Talento Humano"
- Responsable: "Katherine Chávez"
- Cargo: "Analista de Talento Humano"

### Columnas con Datos
- **Columna B**: 19 valores (etiquetas y datos)
- **Columna C**: 8 valores (datos del proceso)
- **Columna D**: 6 valores (información adicional)

### Migración a Web
- **Formulario de configuración inicial**
- Campos requeridos con validación
- Guardar en tabla `proceso` o `ficha_proceso`
- Permitir edición solo a usuarios autorizados

---

## HOJA 3: 2. Inventario de Normatividad

### Información General
- **Dimensiones**: A1:M32
- **Filas**: 32
- **Columnas**: 13
- **Fórmulas**: 0
- **Validaciones**: 3
- **Formatos condicionales**: 0

### Propósito
Catálogo de normativas aplicables al proceso de Talento Humano.

### Estructura de Datos (Fila 6 = Encabezados)

| Columna | Encabezado | Tipo | Descripción |
|---------|-----------|------|-------------|
| A | Nro. | Integer | Número secuencial |
| B | Nombre de la regulación aplicable | Text | Nombre completo de la normativa |
| C | Proyecto, Requerida, Existente | List | Estado de la normativa |
| D | Regulador | Text | Entidad que regula |
| E | Sanciones Penales/Civiles/Económicas | Text | Descripción de sanciones |
| F | Plazo para implementación | Text | Plazo si es proyecto/requerida |
| G | Cumplimiento Total | Checkbox | Marca X si aplica |
| H | Cumplimiento Parcial | Checkbox | Marca X si aplica |
| I | No cumple | Checkbox | Marca X si aplica |
| J | Detalle del incumplimiento | Text | Descripción detallada |
| K | Riesgo Identificado | Text | Descripción del riesgo |
| L | Clasificación | List | Riesgo Positivo/Negativo |
| M | Comentarios Adicionales | Text | Notas adicionales |

### Validaciones
1. **Columna C (C7:C32)**: Lista desplegable
   - Valores: "Proyecto", "Requerida", "Existente"

2. **Columnas G, H, I (G7:G18, G19:I32, H8:I18, I7)**: Lista desplegable
   - Valor: "X" (checkbox)

3. **Columna L (L7:L32)**: Lista desplegable
   - Valores: "Riesgo Positivo", "Riesgo Negativo"

### Datos de Ejemplo
- **Regulación 1**: Código del Trabajo Art. 2 - Obligatoriedad del trabajo
  - Estado: Existente
  - Regulador: Ministerio de Trabajo
  - Sanciones: Art. 326 Constitución Ecuatoriana, indemnización
  - Cumplimiento: Total (X)
  - Riesgo: Demandas por parte de colaboradores
  - Clasificación: Riesgo Negativo

### Columnas con Datos
- **Columna A**: 17 valores (5 texto, 12 números)
- **Columna B**: 13 valores (nombres de normativas)
- **Columna C**: 13 valores (estados)
- **Columna D**: 13 valores (reguladores)
- **Columna E**: 13 valores (sanciones)
- **Columna F**: 13 valores (plazos, mayormente "N/A")
- **Columna G**: 13 valores (marcas X)
- **Columna K**: 13 valores (riesgos identificados)
- **Columna L**: 13 valores (clasificaciones)

### Migración a Web
- **Tabla**: `normatividad`
- **Formulario**: CRUD completo
- **Validaciones**: 
  - Estado: dropdown (Proyecto/Requerida/Existente)
  - Cumplimiento: checkboxes mutuamente excluyentes
  - Clasificación: dropdown (Riesgo Positivo/Negativo)
- **Funcionalidades**:
  - Búsqueda y filtrado
  - Exportación a Excel/PDF
  - Alertas de vencimiento de plazos
  - Vinculación con riesgos identificados

---

## HOJA 4: Análisis de Proceso

### Información General
- **Dimensiones**: A1:R42
- **Filas**: 42
- **Columnas**: 18
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Documentación del análisis del proceso de Talento Humano mediante diagramas y descripciones.

### Contenido
- Instrucciones para realizar el análisis
- Diagramas de proceso
- Descripción de actividades
- Flujos de trabajo

### Columnas con Datos
- **Columna A**: 7 valores (instrucciones y descripciones)

### Migración a Web
- **Sección de documentación**
- Editor de texto enriquecido para diagramas
- Posibilidad de adjuntar archivos (diagramas, imágenes)
- Versión editable con historial

---

## HOJA 5: Análisis de Contexto Externo

### Información General
- **Dimensiones**: A1:H7
- **Filas**: 7
- **Columnas**: 8
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Análisis de factores externos que afectan el proceso.

### Estructura de Datos (Fila 6 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| B | Económico | Factores económicos externos |
| C | Cultural y social | Factores culturales y sociales |
| D | Legal/Regulatorio | Marco legal y regulatorio |
| E | Tecnológico | Avances tecnológicos |
| F | Ambiental | Factores ambientales |
| G | Grupos de Interés Externos | Stakeholders externos |
| H | Otros factores externos | Otros factores relevantes |

### Datos de Ejemplo (Fila 7)
- **Económico**: "Alta demanda del mercado por perfiles especializados..."
- **Cultural y social**: "Preferencia del sector laboral tecnológico por modalidades..."
- **Legal/Regulatorio**: "La compañía mantiene un proceso documental que asegura..."
- **Tecnológico**: "Gestión del talento humano mediante plataformas innovadoras..."
- **Ambiental**: "N/A"
- **Grupos de Interés Externos**: "El área de Talento Humano interactúa de manera permanente..."
- **Otros factores externos**: "N/A"

### Migración a Web
- **Formulario de análisis contextual**
- Campos de texto largo para cada categoría
- Editor de texto enriquecido
- Guardar en tabla `analisis_contexto_externo`
- Versión editable con historial

---

## HOJA 6: Encuesta

### Información General
- **Dimensiones**: A1:H4
- **Filas**: 4
- **Columnas**: 8
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Estructura básica para encuestas (aparentemente no utilizada o en desarrollo).

### Contenido
Estructura mínima, posiblemente para futuras encuestas a stakeholders.

### Migración a Web
- **Módulo de encuestas** (si se implementa)
- Formularios dinámicos
- Respuestas almacenadas en base de datos
- Reportes de resultados

---

## HOJA 7: Benchmarking

### Información General
- **Dimensiones**: A1:M37
- **Filas**: 37
- **Columnas**: 13
- **Fórmulas**: 0
- **Validaciones**: 2
- **Formatos condicionales**: 0

### Propósito
Comparación de riesgos identificados con otras empresas del sector.

### Estructura de Datos (Fila 5 = Encabezados)
- **Empresa 1**: Columnas A-B (Nro., Riesgos)
- **Empresa 2**: Columnas D-E (Nro., Riesgos)
- **Empresa 3**: Columnas G-H (Nro., Riesgos)

### Validaciones
1. **Rango E52:E101**: Lista desplegable
   - Valores: "1,2,3,4,5,6,7,8,9,10"

2. **Rango D52**: Lista desplegable
   - Valores: "Riesgo Positivo", "Riesgo Negativo"

### Datos de Ejemplo
- Números secuenciales del 1 al 30 para cada empresa
- Estructura para comparar riesgos identificados

### Columnas con Datos
- **Columna A**: 34 valores (4 texto, 30 números)
- **Columna D**: 32 valores (2 texto, 30 números)
- **Columna G**: 32 valores (2 texto, 30 números)

### Migración a Web
- **Tabla**: `benchmarking`
- **Formulario**: Registro de comparaciones
- **Funcionalidades**:
  - Registro de empresas de referencia
  - Comparación de riesgos
  - Visualización comparativa
  - Exportación de reportes

---

## HOJA 8: Análisis de Contexto Interno

### Información General
- **Dimensiones**: A1:K7
- **Filas**: 7
- **Columnas**: 11
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Análisis de factores internos de la organización que afectan el proceso.

### Estructura de Datos (Fila 6 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| B | Financieros | Recursos financieros |
| C | Gente | Recursos humanos |
| D | Procesos | Procesos internos |
| E | Activos Físicos | Infraestructura física |
| F | Cadena de Suministro | Proveedores y suministros |
| G | Información | Gestión de información |
| H | Sistemas | Sistemas de información |
| I | Proyectos | Proyectos en curso |
| J | Impuestos | Aspectos tributarios |
| K | Grupos de Interés Internos | Stakeholders internos |

### Datos de Ejemplo (Fila 7)
- **Financieros**: "El área de Talento Humano administra, controla y optimiza..."
- **Gente**: "El área de Talento Humano es responsable de fortalecer..."
- **Procesos**: "Talento Humano cuenta con políticas y procedimientos..."
- **Activos Físicos**: "Talento Humano coordina los procesos de asignación..."
- **Cadena de Suministro**: "N/A"
- **Información**: "Talento Humano gestiona el control de accesos y asignación..."
- **Sistemas**: "Subutilización de las funcionalidades disponibles..."
- **Proyectos**: "N/A"
- **Impuestos**: "N/A"
- **Grupos de Interés Internos**: "AP: El proceso de Talento Humano cuenta con personal..."

### Migración a Web
- **Formulario de análisis contextual interno**
- Similar a contexto externo
- Guardar en tabla `analisis_contexto_interno`
- Editor de texto enriquecido

---

## HOJA 9: DOFA

### Información General
- **Dimensiones**: A1:H38
- **Filas**: 38
- **Columnas**: 8
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Matriz FODA (Fortalezas, Oportunidades, Debilidades, Amenazas).

### Estructura de Datos (Fila 8 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| A | No. | Número secuencial |
| B | Oportunidades | Oportunidades identificadas |
| C | No. | Número secuencial |
| D | Amenazas | Amenazas identificadas |

### Datos de Ejemplo
- **Oportunidad 1**: "Tendencia del mercado hacia modalidades de trabajo flexibles..."
- **Amenaza 1**: "Alta demanda del mercado por perfiles especializados..."
- **Oportunidad 2**: "Avances tecnológicos y plataformas digitales..."
- **Amenaza 2**: "Rigidez del marco laboral ecuatoriano..."

### Migración a Web
- **Tabla**: `dofa`
- **Formulario**: Matriz interactiva
- **Categorías**: Fortalezas, Oportunidades, Debilidades, Amenazas
- **Funcionalidades**:
  - CRUD completo
  - Visualización matricial
  - Exportación

---

## HOJA 10: 3. Identificación ⚠️ CRÍTICA

### Información General
- **Dimensiones**: A1:W508
- **Filas**: 508
- **Columnas**: 23
- **Fórmulas**: 0
- **Validaciones**: 1
- **Formatos condicionales**: 0

### Propósito
Registro y catalogación de riesgos identificados para el proceso de Talento Humano.

### Estructura de Datos (Fila 8 = Encabezados)

| Columna | Encabezado | Tipo | Descripción |
|---------|-----------|------|-------------|
| A | Nro. | Integer | Número secuencial del riesgo |
| B | DESCRIPCIÓN DEL RIESGO | Text | Descripción completa del riesgo |
| C | CLASIFICACIÓN | List | Riesgo con consecuencia positiva/negativa |
| D | PROCESO | Text | Proceso al que pertenece |
| E | ZONA | Text | Zona geográfica o área |
| F | TIPOLOGÍA NIVEL I | Text | Clasificación nivel I |
| G | TIPOLOGÍA NIVEL II | Text | Clasificación nivel II |
| H | TIPOLOGÍA NIVEL III | Text | Clasificación nivel III |
| I | TIPOLOGÍA NIVEL IV | Text | Clasificación nivel IV |
| J | CAUSA DEL RIESGO | Text | Causa raíz del riesgo |
| K | FUENTE DE CAUSA DE RIESGO | Text | Fuente principal |
| L | FUENTE DE CAUSA (SO/Ambiental) | Text | Fuente específica SSO/Ambiental |
| M | FUENTE DE CAUSA LAFT | Text | Fuente relacionada con LAFT |
| N-P | (Más columnas de clasificación) | Text | Clasificaciones adicionales |
| Q-W | (Áreas afectadas y otros) | Text | Información complementaria |

### Validaciones
1. **Columna C (C9:C508)**: Lista desplegable
   - Valores: "Riesgo con consecuencia positiva (Oportunidad)", "Riesgo con consecuencia negativa"

### Datos de Ejemplo (Fila 9)
- **Nro.**: 1
- **Descripción**: "Probabilidad de afectar la continuidad operacional..."
- **Clasificación**: "Riesgo con consecuencia negativa"
- **Proceso**: "Gestión Talento Humano"
- **Zona**: "Operacional"
- **Tipología Nivel I**: "Procesos"
- **Tipología Nivel II**: "Falta de actualización o cumplimiento..."
- **Causa**: "Personas"
- **Fuente**: "Selección de candidatos que no cumplen con el perfil requerido..."

### Volumen de Datos
- **Aproximadamente 500 riesgos** identificados
- Datos estructurados con múltiples niveles de clasificación

### Columnas con Datos
Todas las columnas contienen datos significativos para la clasificación y descripción de riesgos.

### Referencias Cruzadas
Esta hoja es referenciada por:
- **4. Evaluación**: Toma datos de identificación para evaluar
- **6. Priorización y Respuesta**: Usa riesgos identificados

### Migración a Web
- **Tabla principal**: `riesgo`
- **Tablas relacionadas**:
  - `tipologia_nivel_i`
  - `tipologia_nivel_ii`
  - `tipologia_nivel_iii`
  - `tipologia_nivel_iv`
  - `fuente_causa`
  - `zona`
  - `proceso`
- **Formulario**: 
  - Formulario complejo con múltiples secciones
  - Validaciones en tiempo real
  - Búsqueda y filtrado avanzado
- **Funcionalidades**:
  - CRUD completo
  - Búsqueda por múltiples criterios
  - Filtros por tipología, proceso, zona
  - Exportación masiva
  - Importación desde Excel
  - Historial de cambios
  - Vinculación automática con evaluación

---

## HOJA 11: 4. Evaluación ⚠️ MUY CRÍTICA

### Información General
- **Dimensiones**: A1:CC2403
- **Filas**: 2,403
- **Columnas**: 81
- **Fórmulas**: **10,685** (90.2% del total)
- **Validaciones**: 3 (extensas)
- **Formatos condicionales**: 717 reglas

### Propósito
Evaluación y calificación de cada riesgo identificado, incluyendo cálculo de impacto, probabilidad y riesgo inherente/residual.

### Estructura de Datos (Fila 9 = Encabezados)

#### Columnas Principales

| Columna | Encabezado | Tipo | Descripción |
|---------|-----------|------|-------------|
| A | ID RIESGO | Formula | ID concatenado (C11+E11) |
| B | Nro. | Integer | Número del riesgo |
| C | VICEPRESIDENCIA/GERENCIA ALTA | Text | Nivel organizacional |
| D | SIGLA | Formula | VLOOKUP desde Listas |
| E | GERENCIA | Text | Gerencia responsable |
| F | SIGLA | Formula | VLOOKUP desde Listas |
| G | SUBDIVISIÓN | Text | Subdivisión |
| H | SIGLA | Formula | VLOOKUP desde Listas |
| I | ZONA | Text | Zona geográfica |
| J | PROCESO | Text | Proceso |
| K | MACROPROCESO | Formula | VLOOKUP desde Listas |
| L | DESCRIPCIÓN DEL RIESGO | Text | Descripción completa |
| M | CLASIFICACIÓN | Text | Positivo/Negativo |
| N | TIPOLOGÍA NIVEL I | Text | Clasificación nivel I |
| O | TIPOLOGÍA NIVEL II | Text | Clasificación nivel II |
| P-W | IMPACTOS (Personas, Legal, Ambiental, Procesos, Reputación, Económico, Tecnológico) | Integer (1-5) | Calificaciones de impacto |
| X-AC | PROBABILIDADES | Integer (1-5) | Calificaciones de probabilidad |
| AD | RIESGO INHERENTE | Formula | Cálculo: MAX(impactos) * probabilidad |
| AE | RIESGO INHERENTE (ajustado) | Formula | IF(AND(AD=2,W=2),3.99,AD*W) |
| AF | MAX RIESGO INHERENTE | Formula | MAX(AE:AE20) |
| AG-AM | EVALUACIÓN DE CONTROLES | Integer (1-5) | Calificaciones de controles |
| AN | RIESGO RESIDUAL | Formula | Cálculo similar a inherente |
| AO | RIESGO RESIDUAL (ajustado) | Formula | Similar a AE |
| AP | MAX RIESGO RESIDUAL | Formula | MAX(AO:AO20) |
| AQ | NIVEL DE RIESGO | Formula | IF basado en AF y AP |
| AR-BF | CRITERIOS DE PRIORIZACIÓN | Text/Integer | Variables para priorización |
| BG-BK | EVALUACIÓN DE EFECTIVIDAD | Formula | VLOOKUP desde Formulas |
| BL-CC | (Más columnas de evaluación) | Mixed | Datos adicionales |

### Fórmulas Principales Identificadas

#### 1. Generación de ID
```excel
=+CONCATENATE(C11,E11)
```
O
```excel
=+'1. Ficha'!$C$7
```

#### 2. Búsquedas VLOOKUP
```excel
=+IFERROR((VLOOKUP(D11,Listas!$A$3:$B$9,2,0)),0)
=+VLOOKUP(K11,Listas!$H$3:$I$16,2,0)
```

#### 3. Cálculo de Riesgo Inherente
```excel
=+IF(AND(AD11=2,W11=2),3.99,AD11*W11)
```
- Si impacto máximo = 2 Y probabilidad = 2, entonces resultado = 3.99
- Si no, resultado = impacto máximo * probabilidad

#### 4. Máximo de Riesgo
```excel
=+MAX(AE11:AE20)
=+MAX(AO11:AO20)
```

#### 5. Determinación de Nivel de Riesgo
```excel
=IF(OR(AF11=3,AF11=2,AF11=1,AF11=3.99,N11="Riesgo con consecuencia positiva"),"NIVEL BAJO",...)
```

#### 6. Evaluación de Efectividad de Controles
```excel
=+VLOOKUP(BJ11,[5]Formulas!$B$3:$C$5,2,0)
=+VLOOKUP(BL11,[5]Formulas!$D$3:$E$5,2,0)
=+VLOOKUP(BN11,[5]Formulas!$F$3:$G$5,2,0)
```

### Distribución de Fórmulas por Tipo
- **VLOOKUP**: ~40% (búsquedas en tablas de referencia)
- **IF/IFERROR**: ~30% (lógica condicional)
- **MAX/MIN**: ~10% (cálculos de máximos)
- **CONCATENATE**: ~5% (generación de IDs)
- **Operaciones matemáticas**: ~15% (multiplicaciones, sumas)

### Validaciones
1. **Rango extenso (AR11:BF38 y múltiples rangos)**: Validaciones complejas
2. **Rango W11:AC17 y múltiples**: Listas desplegables para probabilidades
3. **Rango BH11:BH510**: Lista desplegable

### Formatos Condicionales
- **717 reglas** distribuidas en múltiples rangos
- **Coloreo según nivel de riesgo**:
  - Crítico: Rojo
  - Alto: Naranja
  - Medio: Amarillo
  - Bajo: Verde
- **Rangos principales**:
  - AQ11:AQ30: Nivel de riesgo
  - AF11:AF30: Riesgo inherente
  - AG11:AP20: Evaluación de controles
  - AP11:AP20: Riesgo residual

### Referencias Cruzadas
- **Referencia a "1. Ficha"**: Datos del proceso
- **Referencia a "3. Identificación"**: Descripción de riesgos
- **Referencia a "Listas"**: Catálogos de referencia
- **Referencia a "Formulas"**: Parámetros de cálculo
- **Referencia a "Parámetros de Valoración"**: Escalas de calificación

### Volumen de Datos
- **Aproximadamente 500 filas de datos** (riesgos evaluados)
- **Cada riesgo tiene múltiples evaluaciones** (por diferentes dimensiones)
- **Cálculos complejos** en cada fila

### Migración a Web ⚠️ CRÍTICO

#### Backend
```javascript
// Cálculo de Riesgo Inherente
function calcularRiesgoInherente(evaluacion) {
  const impactos = [
    evaluacion.impacto_personas,
    evaluacion.impacto_legal,
    evaluacion.impacto_ambiental,
    evaluacion.impacto_procesos,
    evaluacion.impacto_reputacion,
    evaluacion.impacto_economico,
    evaluacion.impacto_tecnologico
  ];
  
  const maxImpacto = Math.max(...impactos);
  const probabilidad = evaluacion.probabilidad;
  
  // Caso especial
  if (maxImpacto === 2 && probabilidad === 2) {
    return 3.99;
  }
  
  return maxImpacto * probabilidad;
}

// Cálculo de Riesgo Residual
function calcularRiesgoResidual(riesgoInherente, efectividadControles) {
  // Lógica similar con ajustes por controles
  return riesgoInherente * (1 - efectividadControles);
}

// Determinación de Nivel
function determinarNivelRiesgo(riesgoInherente, riesgoResidual, clasificacion) {
  if (clasificacion === "Riesgo con consecuencia positiva") {
    return "NIVEL BAJO";
  }
  
  if (riesgoInherente >= 20) return "NIVEL CRÍTICO";
  if (riesgoInherente >= 15) return "NIVEL ALTO";
  if (riesgoInherente >= 10) return "NIVEL MEDIO";
  return "NIVEL BAJO";
}
```

#### Base de Datos
- **Tabla principal**: `evaluacion_riesgo`
- **Tablas relacionadas**: `riesgo`, `control`, `parametro_valoracion`
- **Índices**: En `riesgo_id`, `fecha_evaluacion`

#### Frontend
- **Formulario complejo** con múltiples pestañas/secciones
- **Cálculos en tiempo real** mientras el usuario completa
- **Validaciones en tiempo real**
- **Visualización de resultados** con colores
- **Gráficos** de matriz de riesgo
- **Exportación** a Excel/PDF

#### Consideraciones de Performance
- **Cálculos en backend** (no en frontend)
- **Cache** de resultados calculados
- **Paginación** de riesgos
- **Lazy loading** de evaluaciones
- **Optimización de consultas** con índices

---

## HOJA 12: Formulas

### Información General
- **Dimensiones**: A1:O34
- **Filas**: 34
- **Columnas**: 15
- **Fórmulas**: 4
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Tabla de referencia con pesos y valores para evaluación de controles.

### Estructura de Datos (Fila 2 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| A | Aplicabilidad | Descripción del nivel |
| B | Peso Var | Peso numérico |
| C | Cobertura | Descripción del nivel |
| D | Peso Var | Peso numérico |
| E | Facilidad de uso | Descripción del nivel |
| F | Peso Var | Peso numérico |
| G | Segregación | Descripción (SI/NO) |
| H | Peso Var | Peso numérico |
| I | Naturaleza | Descripción (Automático/Semiautomático/Manual) |
| J | Peso Var | Peso numérico |
| K | Desviaciones | Descripción del nivel |
| L | IND | Indicador |

### Datos de Ejemplo
- **Aplicabilidad**: 
  - "Cuenta con procedimientos documentados": Peso 1
  - "No se deja evidencia de su ejecución": Peso 0.3
- **Cobertura**:
  - "La frecuencia del control tiene cobertura total": Peso 1
  - "La frecuencia del control es esporádica": Peso 0.1
- **Facilidad de uso**:
  - "La complejidad del control es muy sencilla": Peso 1
  - "El control es muy complejo en su ejecución": Peso 0.7
- **Segregación**:
  - "SI": Peso 1
  - "NO": Peso 0.7
- **Naturaleza**:
  - "Automático": Peso 0.8
  - "Semiautomático": Peso 0.6
  - "Manual": Peso 0.4
- **Desviaciones**:
  - "Se han encontrado desviaciones": Peso variable
  - "El control falla la mayor parte de las veces": Peso 1

### Fórmulas
4 fórmulas simples (probablemente referencias o cálculos básicos).

### Migración a Web
- **Tabla**: `parametro_formula_control`
- **Estructura**:
  ```sql
  - id
  - tipo (aplicabilidad, cobertura, facilidad_uso, segregacion, naturaleza, desviaciones)
  - descripcion
  - peso
  - orden
  ```
- **Uso**: Referencia para cálculos de efectividad de controles
- **Formulario**: CRUD para administración de parámetros

---

## HOJA 13: 5. Mapa de riesgos

### Información General
- **Dimensiones**: A1:AA125
- **Filas**: 125
- **Columnas**: 27
- **Fórmulas**: 4
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Visualización matricial de riesgos (Probabilidad vs Impacto).

### Estructura
- **Matriz de 5x5** para consecuencias negativas
- **Matriz de 5x5** para consecuencias positivas
- **Ejes**:
  - X: Frecuencia/Probabilidad (1-5)
  - Y: Impacto (Muy Bajo, Bajo, Moderada, Alta, Muy Alta)

### Fórmulas
```excel
K19: =SUM(K15:K18)
Y19: =+SUM(Y15:Y18)
F20: =+SUM(F15:F19)
T20: =+SUM(T15:T19)
```
Sumas para totales de categorías.

### Datos de Ejemplo
- Distribución de riesgos en la matriz
- Conteos por celda de la matriz
- Totales por fila y columna

### Migración a Web
- **Visualización interactiva**:
  - Gráfico de dispersión
  - Matriz de calor
  - Filtros dinámicos
- **Tecnologías**:
  - Chart.js, D3.js, o Recharts
  - Colores según nivel de riesgo
  - Tooltips con información detallada
- **Funcionalidades**:
  - Filtros por proceso, zona, tipología
  - Zoom y pan
  - Exportación de imagen
  - Impresión

---

## HOJA 14: 6. Priorización y Respuesta ⚠️ CRÍTICA

### Información General
- **Dimensiones**: A1:AF510
- **Filas**: 510
- **Columnas**: 32
- **Fórmulas**: **1,158**
- **Validaciones**: 4
- **Formatos condicionales**: 553 reglas

### Propósito
Priorización de riesgos evaluados y definición de respuestas estratégicas.

### Estructura de Datos (Fila 9 = Encabezados)

| Columna | Encabezado | Tipo | Descripción |
|---------|-----------|------|-------------|
| A | ID RIESGO | Formula | Referencia a evaluación |
| B | DESCRIPCIÓN DEL RIESGO | Text | Descripción completa |
| C | CLASIFICACIÓN | Text | Positivo/Negativo |
| D | EN CASO DE OPORTUNIDAD... | Text | Descripción si es oportunidad |
| E | CALIFICACIÓN FINAL DEL RIESGO RESIDUAL | Integer | Puntaje final |
| F | PRIORIZACIÓN DE ACUERDO A CALIFICACIÓN RESIDUAL | Text | Prioridad calculada |
| G | DE ACUERDO CON LA PRIORIZACIÓN DE PUNTAJE? | Formula | VLOOKUP desde mapa |
| H | REQUIERE EVALUACIÓN ADICIONAL | List | SI/NO |
| I | CRITERIOS DE PRIORIZACIÓN | Text | Variables adicionales |
| J | PUNTAJE DE PRIORIZACIÓN | Integer | Puntaje calculado |
| K | PRIORIZACIÓN FINAL TALLER | Text | Prioridad final |
| L-Z | VARIABLES DE PRIORIZACIÓN | Mixed | Capacidad, Complejidad, Velocidad, etc. |
| X | RESPUESTA | List | Aceptar/Evitar/Reducir/Compartir |
| Y | RESPONSABLE | Text | Persona responsable |
| Z | FECHA | Date | Fecha de asignación |

### Fórmulas Principales

#### 1. Búsqueda en Mapa de Riesgos
```excel
=+IFERROR(VLOOKUP(B11,'5.Mapa de riesgos'!$J$14:$K$64,2,0),0)
```

#### 2. Lógica Condicional
```excel
=+IF(H11="SI","SI","NO")
```

#### 3. Búsquedas en Tabla de Fórmulas
```excel
=+VLOOKUP(J11,Formulas!$B$16:$C$19,2,0)
=+VLOOKUP(L11,Formulas!$D$16:$E$19,2,0)
=+VLOOKUP(N11,Formulas!$F$16:$G$19,2,0)
=+VLOOKUP(P11,Formulas!$H$16:$I$19,2,0)
```

#### 4. Cálculo de Puntaje de Priorización
```excel
=+IFERROR(Formulas!$C$20*K11+M11*Formulas!$E$20+O11*Formulas!$G$20+Q11*Formulas!$I$20,0)
```

#### 5. Determinación de Respuesta
```excel
=+IF(AND(X11="Aceptar",OR(F11=25,F11=20,F11=15,F11=16,F11=10,F11=12,F11=5)),"DEBE REVISARSE",...)
```

### Validaciones
1. **Rango E11:E510**: Lista desplegable (calificaciones)
2. **Rango H11:H17 y múltiples**: Lista desplegable (SI/NO)
3. **Rango X11:X510**: Lista desplegable (Aceptar/Evitar/Reducir/Compartir)
4. **Rango Y11:Y510**: Lista desplegable (responsables)
5. **Rango Z11:Z510**: Validación de fecha

### Formatos Condicionales
- **553 reglas** distribuidas en múltiples rangos
- **Coloreo según**:
  - Prioridad
  - Respuesta asignada
  - Estado de evaluación
- **Rangos principales**:
  - AB12:AD20: Estado de respuesta
  - J11:J20: Puntaje de priorización
  - L11:L20: Complejidad
  - N11:N20: Velocidad
  - P11:P20: Capacidad

### Referencias Cruzadas
- **Referencia a "4. Evaluación"**: Datos de evaluación
- **Referencia a "5. Mapa de riesgos"**: Priorización
- **Referencia a "Formulas"**: Parámetros de cálculo
- **Referencia a "Tabla de atribuciones"**: Asignación de responsables

### Migración a Web

#### Backend
```javascript
// Cálculo de Puntaje de Priorización
function calcularPuntajePriorizacion(variables, pesos) {
  return (
    variables.capacidad * pesos.capacidad +
    variables.complejidad * pesos.complejidad +
    variables.velocidad * pesos.velocidad +
    variables.otra_variable * pesos.otra_variable
  );
}

// Determinación de Respuesta según Tabla de Atribuciones
function determinarRespuesta(riesgoResidual, severidad) {
  const tabla = obtenerTablaAtribuciones();
  return tabla[riesgoResidual][severidad];
}
```

#### Base de Datos
- **Tabla principal**: `priorizacion_riesgo`
- **Tablas relacionadas**: `riesgo`, `evaluacion_riesgo`, `persona`, `tabla_atribuciones`
- **Campos clave**: `respuesta`, `responsable_id`, `fecha_asignacion`

#### Frontend
- **Formulario de priorización**:
  - Selección de respuesta (dropdown)
  - Asignación de responsable (autocomplete)
  - Fecha de asignación (date picker)
  - Campos de criterios adicionales
- **Visualización**:
  - Lista de riesgos priorizados
  - Filtros por respuesta, responsable, fecha
  - Gráficos de distribución
- **Funcionalidades**:
  - Asignación masiva
  - Notificaciones a responsables
  - Seguimiento de acciones
  - Reportes de priorización

---

## HOJA 15: Parámetros de Valoración

### Información General
- **Dimensiones**: A1:M17
- **Filas**: 17
- **Columnas**: 13
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Tabla de referencia con escalas de calificación para impactos y probabilidades.

### Estructura de Datos (Fila 3 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| A | Calificación/Impacto | Nivel (1-5) |
| B | Personas | Descripción del impacto |
| C | Legal/Normativo | Descripción del impacto |
| D | Ambiental | Descripción del impacto |
| E | Procesos | Descripción del impacto |
| F | Reputacional (*) | Descripción del impacto |
| G | Económico | Descripción del impacto |
| H | Tecnológico | Descripción del impacto |
| I | Calificación/Probabilidad | Nivel (1-5) |
| J | Frecuencia | Descripción de la frecuencia |

### Datos de Ejemplo

#### Impacto Nivel 1
- **Personas**: "-Lesión Leve (Primeros auxilios)"
- **Legal**: "- Queja ante autoridad administrativa"
- **Ambiental**: "Sin afectación ambiental. Sin impacto..."
- **Procesos**: "Mínima afectación en el tiempo de ejecución..."
- **Reputacional**: "No se ve afectada la confianza..."
- **Económico**: "Variación (+ ó -) en los recursos..."
- **Tecnológico**: "-Hay una afectación no significativa..."

#### Probabilidad Nivel 1
- **Frecuencia**: "La actividad que causa el riesgo es..."
- **Descripción**: "Improbable - Improbable que ocurra..."

### Migración a Web
- **Tabla**: `parametro_valoracion`
- **Estructura**:
  ```sql
  - id
  - tipo (impacto/probabilidad)
  - calificacion (1-5)
  - dimension (personas/legal/ambiental/procesos/reputacion/economico/tecnologico)
  - descripcion
  - frecuencia (solo para probabilidad)
  ```
- **Uso**: Referencia para validación y ayuda contextual en formularios
- **Formulario**: CRUD para administración
- **Funcionalidades**:
  - Ayuda contextual en formularios de evaluación
  - Validación de rangos permitidos
  - Exportación de catálogo

---

## HOJA 16: Listas

### Información General
- **Dimensiones**: A1:K10
- **Filas**: 10
- **Columnas**: 11
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Catálogos y listas desplegables utilizadas en validaciones de otras hojas.

### Estructura de Datos (Fila 2 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| A | Vicepresidencia/Gerencia alta | Nombre completo |
| B | Sigla | Código abreviado |
| C | Zona | Zona geográfica |
| D | Proceso | Nombre del proceso |
| E | Macroproceso | Tipo de macroproceso |
| F | Fuente | Fuente de causa |
| G | Fuente LAFT | Fuente relacionada con LAFT |

### Datos de Ejemplo
- **Vicepresidencia**: "Abastecimiento" → Sigla: "AB"
- **Zona**: "Nacional", "Sur", "Oriente"
- **Proceso**: "Gestión de proveedores y adquisiciones" → Sigla: "GPA"
- **Macroproceso**: "Misional", "Apoyo", "Estratégico"
- **Fuente**: "Personas", "Proceso", "Tecnología", "Infraestructura"
- **Fuente LAFT**: "N/A", "Contrapartes", "Productos", "Canales de distribución"

### Migración a Web
- **Tablas de catálogo**:
  - `catalogo_vicepresidencia`
  - `catalogo_zona`
  - `catalogo_proceso`
  - `catalogo_macroproceso`
  - `catalogo_fuente`
  - `catalogo_fuente_laft`
- **Estructura común**:
  ```sql
  - id
  - codigo (opcional)
  - nombre
  - descripcion (opcional)
  - activo
  ```
- **Funcionalidades**:
  - CRUD para cada catálogo
  - Uso en dropdowns/autocomplete
  - Validación de referencias
  - Exportación de catálogos

---

## HOJA 17: Tabla de atribuciones

### Información General
- **Dimensiones**: B1:G15
- **Filas**: 15
- **Columnas**: 7
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Matriz que define los responsables según la respuesta al riesgo y su severidad.

### Estructura de Datos (Fila 4 = Encabezados)

| Fila | Respuesta/Severidad | Extrema | Muy Alta | Alta | Moderada | Baja |
|------|-------------------|---------|----------|------|----------|------|
| 6 | Aceptar | Comité de Auditoría y Riesgos... | Comité de Auditoría y Riesgos... | Comité de Auditoría y Riesgos... | Líder del proceso | Líder del proceso |
| 7 | Evitar | Presidencia, previa validación... | Presidencia, previa validación... | Vicepresidencia del proceso | Líder del proceso | Líder del proceso |
| 8 | Reducir | Líder del proceso | Líder del proceso | Líder del proceso | Líder del proceso | Líder del proceso |
| 9 | Compartir | Líder del proceso | Líder del proceso | Líder del proceso | Líder del proceso | Líder del proceso |

### Datos Adicionales
- **Para oportunidades** (Fila 11): Instrucciones especiales
- **Clasificación de oportunidades** (Fila 13):
  - Excelente Oportunidad
  - Muy buena Oportunidad
  - Oportunidad Marginal
  - Oportunidad Deficiente

### Migración a Web
- **Tabla**: `tabla_atribuciones`
- **Estructura**:
  ```sql
  - id
  - respuesta (Aceptar/Evitar/Reducir/Compartir)
  - severidad (Extrema/Muy Alta/Alta/Moderada/Baja)
  - responsable
  - activo
  ```
- **Uso**: 
  - Consulta automática al asignar respuesta
  - Sugerencia de responsable
  - Validación de asignaciones
- **Formulario**: CRUD para administración
- **Funcionalidades**:
  - Búsqueda por respuesta/severidad
  - Exportación de matriz

---

## HOJA 18: Tipologias Nivel I

### Información General
- **Dimensiones**: A1:B5
- **Filas**: 5
- **Columnas**: 2
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Catálogo de tipologías de primer nivel.

### Contenido
Estructura básica, posiblemente con pocos registros o en desarrollo.

### Migración a Web
- **Tabla**: `tipologia_nivel_i`
- **Estructura**:
  ```sql
  - id
  - codigo
  - nombre
  - descripcion
  - activo
  ```

---

## HOJA 19: Tipologias Nivel II

### Información General
- **Dimensiones**: A1:F31
- **Filas**: 31
- **Columnas**: 6
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Catálogo de tipologías de segundo nivel con descripciones.

### Estructura de Datos (Fila 1 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| A | Nivel II | Nombre de la tipología |
| B | Descripción | Descripción detallada |
| C | (Separador) | - |
| D | Nivel II | Nombre de la tipología (segunda columna) |
| E | Descripción | Descripción detallada |
| F | (Clasificación adicional) | OPERACIONAL, etc. |

### Datos de Ejemplo
- **Político**: "Es el riesgo que emerge debido a la exposición de..."
- **Mercado**: "Cambios en las condiciones macroeconómicas y/o sectoriales..."
- **Competencia**: "Acciones de competidores o nuevos jugadores..."
- **Procesos**: "Son los riesgos relacionados con la inexistencia..."
- **Sistema de gestión en seguridad y salud**: "Son los riesgos relacionados con el recurso humano..."
- **Recurso Humano**: "Fallas en la operación causadas por colaboradores..."

### Columnas con Datos
- **Columna A**: 17 valores (tipologías estratégicas)
- **Columna B**: 17 valores (descripciones)
- **Columna D**: 23 valores (tipologías operacionales)
- **Columna E**: 23 valores (descripciones)

### Migración a Web
- **Tabla**: `tipologia_nivel_ii`
- **Estructura**:
  ```sql
  - id
  - codigo
  - nombre
  - descripcion
  - nivel_i_id (FK)
  - categoria (Estrategico/Operacional)
  - activo
  ```
- **Funcionalidades**:
  - CRUD completo
  - Búsqueda y filtrado
  - Relación jerárquica con Nivel I

---

## HOJA 20: Tipologías III-IV SO y Ambien

### Información General
- **Dimensiones**: B2:M295
- **Filas**: 295
- **Columnas**: 13
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Catálogo detallado de tipologías de nivel III y IV para Seguridad Ocupacional y Ambiental.

### Estructura de Datos (Fila 3 = Encabezados)

| Columna | Encabezado | Descripción |
|---------|-----------|-------------|
| B | TIPO DE RIESGO NIVEL III | Categoría principal |
| C | TIPO DE RIESGO NIVEL IV | Subcategoría específica |
| D | DESCRIPCIÓN | Descripción del riesgo |
| E | FUENTE / CAUSA | Ejemplos de fuentes |
| F | EFECTO O CONSECUENCIA | Consecuencias del riesgo |

### Datos de Ejemplo
- **Nivel III**: "Físicos"
  - **Nivel IV**: "Ruido"
    - **Descripción**: "Exposición A Ruido Provenientes De..."
    - **Fuente**: "Ejemplo: 1. Otras áreas durante pruebas de dinamómetros..."
    - **Consecuencia**: "Enfermedades Sistema Auditivo, Fatiga. Pérdida de audición..."
  
- **Nivel III**: "Físicos"
  - **Nivel IV**: "Vibración"
    - **Descripción**: "Exposición A Vibraciones Provenientes De.."
    - **Fuente**: "Ejemplo: 1. Motortool 2. Pulidora 3. Hidro lavador"
    - **Consecuencia**: "Traumas Oseo Musculares, Dolor de espalda..."

### Categorías Principales Identificadas
- **Físicos**: Ruido, Vibración, Temperatura, Presión, Radiaciones, Iluminación
- **Químicos**: (múltiples subcategorías)
- **Biológicos**: (múltiples subcategorías)
- **Ergonómicos**: (múltiples subcategorías)
- **Psicosociales**: (múltiples subcategorías)

### Columnas con Datos
- **Columna B**: 96 valores (tipos nivel III)
- **Columna C**: 96 valores (tipos nivel IV)
- **Columna D**: 96 valores (descripciones)
- **Columna E**: 51 valores (fuentes/causas)
- **Columna F**: 96 valores (efectos/consecuencias)

### Migración a Web
- **Tabla**: `tipologia_nivel_iii_iv`
- **Estructura**:
  ```sql
  - id
  - nivel_iii
  - nivel_iv
  - descripcion
  - fuente_causa
  - efecto_consecuencia
  - categoria (SO/Ambiental)
  - activo
  ```
- **Funcionalidades**:
  - CRUD completo
  - Búsqueda avanzada
  - Filtros por nivel III, categoría
  - Exportación de catálogo completo
  - Importación masiva

---

## HOJA 21: Tipologías III-Seg. Informacion

### Información General
- **Dimensiones**: A1:B5
- **Filas**: 5
- **Columnas**: 2
- **Fórmulas**: 0
- **Validaciones**: 0
- **Formatos condicionales**: 0

### Propósito
Catálogo de tipologías de nivel III para Seguridad de la Información.

### Contenido
Estructura básica, posiblemente con pocos registros.

### Migración a Web
- **Tabla**: `tipologia_seguridad_informacion`
- **Estructura similar a otras tipologías**

---

## Resumen de Complejidad por Hoja

| Hoja | Fórmulas | Validaciones | Formatos Condicionales | Complejidad |
|------|----------|--------------|------------------------|-------------|
| 4. Evaluación | 10,685 | 3 | 717 | ⚠️ MUY ALTA |
| 6. Priorización y Respuesta | 1,158 | 4 | 553 | ⚠️ ALTA |
| 3. Identificación | 0 | 1 | 0 | MEDIA |
| 2. Inventario de Normatividad | 0 | 3 | 0 | MEDIA |
| 5. Mapa de riesgos | 4 | 0 | 0 | BAJA |
| Formulas | 4 | 0 | 0 | BAJA |
| Resto de hojas | 0 | 2 | 0 | BAJA |

---

## Referencias Cruzadas Totales

- **Total**: 3,145 referencias cruzadas entre hojas
- **Principales flujos**:
  1. **1. Ficha** → **4. Evaluación** (datos del proceso)
  2. **3. Identificación** → **4. Evaluación** (descripción de riesgos)
  3. **4. Evaluación** → **6. Priorización** (calificaciones)
  4. **Listas** → Múltiples hojas (catálogos)
  5. **Formulas** → **4. Evaluación**, **6. Priorización** (parámetros)
  6. **Parámetros de Valoración** → **4. Evaluación** (escalas)
  7. **5. Mapa de riesgos** → **6. Priorización** (priorización)

---

## Plan de Migración Priorizado

### Fase 1: Catálogos y Configuración (2 semanas)
1. Listas
2. Parámetros de Valoración
3. Formulas
4. Tabla de atribuciones
5. Tipologías (Nivel I, II, III-IV)

### Fase 2: Datos Maestros (2 semanas)
1. 1. Ficha
2. 2. Inventario de Normatividad
3. Análisis de Contexto (Externo/Interno)
4. DOFA

### Fase 3: Identificación (2 semanas)
1. 3. Identificación (CRUD de riesgos)
2. Validaciones
3. Búsqueda y filtrado

### Fase 4: Evaluación ⚠️ CRÍTICA (4-6 semanas)
1. Backend de cálculos
2. Formulario complejo
3. Validaciones
4. Formatos condicionales (estilos)
5. Integración con identificación

### Fase 5: Visualización (2 semanas)
1. 5. Mapa de riesgos (gráficos interactivos)
2. Dashboard
3. Reportes

### Fase 6: Priorización ⚠️ CRÍTICA (3-4 semanas)
1. Backend de cálculos
2. Formulario de priorización
3. Asignación de responsables
4. Integración con evaluación

### Fase 7: Integración y Pruebas (2-3 semanas)
1. Integración completa
2. Pruebas end-to-end
3. Optimización de performance
4. Corrección de errores

### Fase 8: Migración de Datos (1 semana)
1. Scripts de migración
2. Validación de datos
3. Pruebas con datos reales

---

## Consideraciones Técnicas Finales

### Performance
- **Cálculos**: Implementar en backend, no en frontend
- **Cache**: Redis para resultados calculados
- **Índices**: En todas las foreign keys
- **Paginación**: Para listas grandes (>100 registros)
- **Lazy loading**: Para evaluaciones y priorizaciones

### Usabilidad
- **Formularios paso a paso**: Para formularios complejos
- **Validación en tiempo real**: Feedback inmediato
- **Ayuda contextual**: Tooltips y guías
- **Autoguardado**: Guardar automáticamente cada X segundos
- **Historial**: Versión de cambios

### Seguridad
- **Autenticación**: JWT o OAuth2
- **Autorización**: Roles y permisos granulares
- **Auditoría**: Log de todas las acciones
- **Encriptación**: Datos sensibles encriptados
- **Backup**: Automático y programado

### Escalabilidad
- **Arquitectura**: Microservicios opcional
- **Base de datos**: PostgreSQL con réplicas
- **Cache**: Redis para sesiones y datos frecuentes
- **CDN**: Para assets estáticos
- **Load balancing**: Para alta disponibilidad

---

**Documento generado**: 2026-01-23  
**Versión**: 2.0 (Análisis Completo)  
**Total de páginas**: ~50+  
**Estado**: Completo y listo para migración

