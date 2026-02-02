# RESUMEN DE MIGRACIÓN DE DATOS A JSON SERVER

**Fecha de migración:** 2026-01-31  
**Origen:** Archivos CSV de Access y Excel  
**Destino:** `db.json` para JSON Server

---

## ✅ DATOS MIGRADOS EXITOSAMENTE

### 1. Procesos
- **Fuente:** `analisis/datos_exportados/01_Procesos.csv`
- **Total:** 11 procesos
- **Campos migrados:**
  - ID, Nombre, Tipo, Responsable, Objetivo
  - Estado inicial: `borrador`
  - Todos los procesos activos

### 2. Personas
- **Fuente:** `analisis/datos_exportados/02_Personas.csv`
- **Total:** 13 personas
- **Campos migrados:**
  - ID, Nombre, Cargo, Estado Activo
  - Email generado automáticamente
  - Rol asignado según cargo (Director → manager, otros → owner)

### 3. Riesgos
- **Fuente:** `analisis/datos_exportados/03_Riesgos.csv`
- **Total:** 99 riesgos
- **Campos migrados:**
  - ID, Descripción, Nombre, Clasificación, Tipo
  - Impactos: Personas, Legal, Ambiental, Procesos, Reputación, Económico, Tecnológico
  - Impactos SGSI: Confidencialidad, Disponibilidad, Integridad
  - Objetivo, Origen del riesgo
  - Relación con Proceso (procesoId)

### 4. Tipos de Riesgo
- **Fuente:** `analisis/datos_exportados/04_Tipo_de_Riesgo.csv`
- **Total:** 49 tipos
- **Campos migrados:**
  - Tipo, Subtipo, Descripciones

### 5. Causas
- **Fuente:** `analisis/datos_exportados/05_Causas.csv`
- **Total:** 432 causas
- **Campos migrados:**
  - Causa, Frecuencia, Fuente
  - Requiere control, Descripción del control
  - Responsable control
  - Parámetros de control: Aplicabilidad, Cobertura, Facilidad de uso, Segregación, Naturaleza, Desviaciones
  - Relación con Riesgo (riesgoId)

### 6. Frecuencia
- **Fuente:** `analisis/datos_exportados/06_Frecuencia.csv`
- **Total:** 5 frecuencias
- **Valores:** Raro, Improbable, Posible, Probable, Esperado

### 7. Objetivos
- **Fuente:** `analisis/datos_exportados/08_Objetivos.csv`
- **Total:** 15 objetivos
- **Campos:** ID, Objetivo (descripción completa)

### 8. Normatividad
- **Fuente:** `analisis/datos_excel_talento_humano/2__Inventario_de_Normatividad.csv`
- **Total:** 26 normatividades (filtradas, solo las válidas)
- **Campos migrados:**
  - Nombre de regulación, Tipo (Proyecto/Requerida/Existente)
  - Regulador, Sanciones, Plazo de implementación
  - Cumplimiento (Total/Parcial/No cumple)
  - Detalle de incumplimiento, Riesgo identificado
  - Clasificación (Positivo/Negativo)
  - Relación con Proceso Talento Humano (procesoId: "8")

### 9. Catálogos de Impacto
- **Fuentes:** `analisis/datos_exportados/07_impacto_*.csv`
- **Total:** 10 catálogos, 5 registros cada uno (50 registros totales)
- **Archivos migrados:**
  - ✅ `07_Impacto_personas.csv` - 5 registros
  - ✅ `07_impacto_legal.csv` - 5 registros
  - ✅ `07_impacto_ambiental.csv` - 5 registros
  - ✅ `07_impacto_procesos.csv` - 5 registros
  - ✅ `07_impacto_reputación.csv` - 5 registros
  - ✅ `07_impacto_económico.csv` - 5 registros
  - ✅ `07_impacto_tecnológico.csv` - 5 registros
  - ✅ `07_impacto_SGSI_confidencialidad.csv` - 5 registros
  - ✅ `07_impacto_SGSI_disponibilidad.csv` - 5 registros
  - ✅ `07_impacto_SGSI_integridad.csv` - 5 registros
- **Campos:** ID, Valor (1-5), Descripción completa del impacto

### 10. Catálogos de Control
- **Fuentes:** `analisis/datos_exportados/09_*.csv`
- **Total:** 6 catálogos, 3 registros cada uno (18 registros totales)
- **Archivos migrados:**
  - ✅ `09_Aplicabilidad.csv` - 3 registros (con Peso)
  - ✅ `09_Cobertura.csv` - 3 registros (con Peso)
  - ✅ `09_Facilidad_de_uso.csv` - 3 registros
  - ✅ `09_Segregación.csv` - 3 registros
  - ✅ `09_Naturaleza.csv` - 3 registros
  - ✅ `09_Desviaciones.csv` - 3 registros
- **Campos:** ID, Valor, Peso (cuando aplica), Descripción

---

## ⚠️ DATOS NO MIGRADOS (Requieren Estructura o No Aplicables)

### 1. Datos de Excel Talento Humano - Hojas No Migradas

#### a) Ficha del Proceso
- **Archivo:** `analisis/datos_excel_talento_humano/1__Ficha.csv`
- **Razón:** Información administrativa/metadata del proceso
- **Recomendación:** Se puede agregar como campo adicional en `procesos` o crear tabla `fichasProceso`

#### b) Identificación de Riesgos (Excel)
- **Archivo:** `analisis/datos_excel_talento_humano/3__Identificación.csv`
- **Razón:** Formato diferente al CSV de Access, estructura más detallada
- **Recomendación:** Crear tabla `identificacionRiesgos` o integrar en `riesgos`

#### c) Evaluación
- **Archivo:** `analisis/datos_excel_talento_humano/4__Evaluación.csv`
- **Razón:** Estructura compleja con múltiples cálculos
- **Recomendación:** Crear tabla `evaluaciones` (ya existe estructura vacía)

#### d) Mapa de Riesgos
- **Archivo:** `analisis/datos_excel_talento_humano/5_Mapa_de_riesgos.csv`
- **Razón:** Datos calculados/derivados
- **Recomendación:** Se genera automáticamente desde `riesgos` y `evaluaciones`

#### e) Priorización y Respuesta
- **Archivo:** `analisis/datos_excel_talento_humano/6__Priorización_y_Respuesta.csv`
- **Razón:** Estructura compleja con planes de acción
- **Recomendación:** Crear tabla `planesAccion` (ya existe estructura vacía)

#### f) Análisis de Proceso
- **Archivo:** `analisis/datos_excel_talento_humano/Análisis_de_Proceso.csv`
- **Razón:** Texto descriptivo/analítico
- **Recomendación:** Agregar campo `analisis` en tabla `procesos`

#### g) Contexto Externo/Interno
- **Archivos:** 
  - `Análisis_de_Contexto_Externo.csv`
  - `Análisis_de_Contexto_Interno.csv`
- **Razón:** Matrices de factores
- **Recomendación:** Crear tablas `contextoExterno` y `contextoInterno`

#### h) DOFA
- **Archivo:** `analisis/datos_excel_talento_humano/DOFA.csv`
- **Razón:** Matriz DOFA
- **Recomendación:** Crear tabla `dofa` con campos: Fortalezas, Oportunidades, Debilidades, Amenazas

#### i) Benchmarking
- **Archivo:** `analisis/datos_excel_talento_humano/Benchmarking.csv`
- **Razón:** Datos comparativos
- **Recomendación:** Crear tabla `benchmarking`

#### j) Encuesta
- **Archivo:** `analisis/datos_excel_talento_humano/Encuesta.csv`
- **Razón:** Datos de encuestas
- **Recomendación:** Crear tabla `encuestas` y `respuestasEncuesta`

#### k) Formulas
- **Archivo:** `analisis/datos_excel_talento_humano/Formulas.csv`
- **Razón:** Configuración de fórmulas de cálculo
- **Recomendación:** Crear tabla `formulasConfiguracion`

#### l) Listas y Parámetros
- **Archivos:**
  - `Listas.csv`
  - `Parámetros_de_Valoración.csv`
- **Razón:** Catálogos de referencia
- **Recomendación:** Crear tablas `listasDesplegables` y `parametrosValoracion`

#### m) Tipologías
- **Archivos:**
  - `Tipologias_Nivel_I.csv`
  - `Tipologias_Nivel_II.csv`
  - `Tipologías_III-IV_SO_y_Ambien.csv`
  - `Tipologías_III-Seg. Informacion.csv`
- **Razón:** Estructura jerárquica de tipologías
- **Recomendación:** Crear tablas relacionadas `tipologiasNivelI`, `tipologiasNivelII`, `tipologiasNivelIII_IV`

#### n) Tabla de Atribuciones
- **Archivo:** `analisis/datos_excel_talento_humano/Tabla_de_atribuciones.csv`
- **Razón:** Tabla de referencia/catálogo
- **Recomendación:** Crear tabla `atribuciones`

### 2. Datos de Access No Migrados

#### a) Personas Control
- **Archivo:** `analisis/datos_exportados/02_Personas_control.csv`
- **Razón:** Similar a Personas, pero para control
- **Recomendación:** Agregar campo `tipo: 'control'` en tabla `personas` o crear tabla separada

#### b) Riesgos (origen)
- **Archivo:** `analisis/datos_exportados/03_Riesgos_(origen).csv`
- **Razón:** Catálogo de orígenes de riesgo
- **Recomendación:** Crear tabla `origenesRiesgo`

#### c) Fuentes de Causa
- **Archivo:** `analisis/datos_exportados/05_1_Fuentes_de_Causa.csv`
- **Razón:** Catálogo de fuentes
- **Recomendación:** Crear tabla `fuentesCausa`

#### d) Errores de Pegado
- **Archivo:** `analisis/datos_exportados/Errores_de_pegado.csv`
- **Razón:** Datos de error/depuración
- **Recomendación:** No migrar (datos de depuración)

---

## 📊 ESTADÍSTICAS FINALES

### Datos Migrados
- ✅ **Procesos:** 11
- ✅ **Personas:** 13
- ✅ **Riesgos:** 99
- ✅ **Tipos de Riesgo:** 49
- ✅ **Causas:** 432
- ✅ **Frecuencia:** 5
- ✅ **Objetivos:** 15
- ✅ **Normatividad:** 26
- ✅ **Catálogos de Impacto:** 10 catálogos × 5 registros = 50 registros
- ✅ **Catálogos de Control:** 6 catálogos × 3 registros = 18 registros
- ✅ **Total de registros migrados:** ~718 registros

### Estructuras Creadas
- ✅ Tablas principales: `procesos`, `personas`, `riesgos`, `tiposRiesgo`, `causas`
- ✅ Catálogos: `frecuencia`, `objetivos`, `normatividad`
- ✅ Arrays dinámicos: `evaluaciones`, `observaciones`, `historial`, `notificaciones`, `tareas`, `planesAccion`
- ✅ Usuarios: 4 usuarios de prueba

---

## 🔧 COMANDOS DISPONIBLES

### Migrar Datos
```bash
cd gestion-riesgos-app
pnpm run migrar
# o
node scripts/migrar-datos-completo.js
```

### Iniciar JSON Server
```bash
pnpm run server
```

### Iniciar Frontend y Backend
```bash
pnpm run dev:full
```

---

## 📝 NOTAS IMPORTANTES

1. **Relaciones:** Los datos mantienen relaciones mediante IDs:
   - `riesgos.procesoId` → `procesos.id`
   - `causas.riesgoId` → `riesgos.id`
   - `normatividad.procesoId` → `procesos.id`

2. **IDs:** Los IDs se generan automáticamente desde los CSV o se mantienen si existen

3. **Formato de Fechas:** Todas las fechas están en formato ISO 8601

4. **Estados:** Los procesos inician con `estado: 'borrador'`

5. **Usuarios:** Se mantienen los usuarios de prueba si no existen en el CSV

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. **Migrar Datos de Evaluación:**
   - Leer `4__Evaluación.csv` de Talento Humano
   - Crear estructura de `evaluaciones` con todos los campos

2. **Migrar Planes de Acción:**
   - Leer `6__Priorización_y_Respuesta.csv`
   - Crear estructura completa de `planesAccion` y `tareasPlanAccion`

3. **Completar Catálogos:**
   - Revisar formato de CSV de impacto y control
   - Migrar todos los catálogos pendientes

4. **Agregar Datos de Análisis:**
   - Migrar DOFA, Contexto Externo/Interno
   - Agregar campos de análisis a procesos

5. **Tipologías:**
   - Crear estructura jerárquica de tipologías
   - Relacionar con riesgos

---

## 📞 SOPORTE

Si encuentras problemas durante la migración:
1. Verifica que los archivos CSV estén en la ruta correcta
2. Revisa el formato de los CSV (separador `;`)
3. Ejecuta el script con `node scripts/migrar-datos-completo.js` para ver errores detallados

---

**Documento generado:** 2026-01-31  
**Script de migración:** `scripts/migrar-datos-completo.js`

