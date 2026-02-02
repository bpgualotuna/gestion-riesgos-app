# COMANDOS Y RESUMEN DE MIGRACIÓN

## ✅ DATOS MIGRADOS EXITOSAMENTE

### Comando para migrar:
```bash
cd gestion-riesgos-app
pnpm run migrar
```

### Resultado:
```
✅ Procesos: 11
✅ Personas: 13
✅ Riesgos: 99
✅ Tipos de Riesgo: 49
✅ Causas: 432
✅ Frecuencia: 5
✅ Objetivos: 15
✅ Normatividad: 26
✅ Catálogos de Impacto: 50 registros (10 catálogos)
✅ Catálogos de Control: 18 registros (6 catálogos)
```

**Total:** ~718 registros migrados

---

## ⚠️ DATOS NO MIGRADOS (Requieren Estructura Adicional)

### 1. Datos de Excel Talento Humano

#### ❌ NO MIGRADOS (Requieren nuevas tablas):

1. **Ficha del Proceso** (`1__Ficha.csv`)
   - **Razón:** Metadata administrativa
   - **Solución:** Agregar campos a `procesos` o crear `fichasProceso`

2. **Identificación de Riesgos** (`3__Identificación.csv`)
   - **Razón:** Formato diferente, estructura más detallada
   - **Solución:** Integrar en `riesgos` o crear `identificacionRiesgos`

3. **Evaluación** (`4__Evaluación.csv`)
   - **Razón:** Estructura compleja con cálculos
   - **Solución:** Crear tabla `evaluaciones` completa (estructura vacía existe)

4. **Mapa de Riesgos** (`5_Mapa_de_riesgos.csv`)
   - **Razón:** Datos calculados/derivados
   - **Solución:** Se genera automáticamente desde `riesgos` + `evaluaciones`

5. **Priorización y Respuesta** (`6__Priorización_y_Respuesta.csv`)
   - **Razón:** Estructura compleja con planes de acción
   - **Solución:** Crear tabla `planesAccion` completa (estructura vacía existe)

6. **Análisis de Proceso** (`Análisis_de_Proceso.csv`)
   - **Razón:** Texto descriptivo
   - **Solución:** Agregar campo `analisis` en `procesos`

7. **Contexto Externo** (`Análisis_de_Contexto_Externo.csv`)
   - **Razón:** Matriz de factores externos
   - **Solución:** Crear tabla `contextoExterno`

8. **Contexto Interno** (`Análisis_de_Contexto_Interno.csv`)
   - **Razón:** Matriz de factores internos
   - **Solución:** Crear tabla `contextoInterno`

9. **DOFA** (`DOFA.csv`)
   - **Razón:** Matriz DOFA
   - **Solución:** Crear tabla `dofa` con campos: Fortalezas, Oportunidades, Debilidades, Amenazas

10. **Benchmarking** (`Benchmarking.csv`)
    - **Razón:** Datos comparativos
    - **Solución:** Crear tabla `benchmarking`

11. **Encuesta** (`Encuesta.csv`)
    - **Razón:** Datos de encuestas
    - **Solución:** Crear tablas `encuestas` y `respuestasEncuesta`

12. **Formulas** (`Formulas.csv`)
    - **Razón:** Configuración de fórmulas
    - **Solución:** Crear tabla `formulasConfiguracion`

13. **Listas** (`Listas.csv`)
    - **Razón:** Catálogo de listas desplegables
    - **Solución:** Crear tabla `listasDesplegables`

14. **Parámetros de Valoración** (`Parámetros_de_Valoración.csv`)
    - **Razón:** Parámetros de cálculo
    - **Solución:** Crear tabla `parametrosValoracion`

15. **Tipologías Nivel I** (`Tipologias_Nivel_I.csv`)
    - **Razón:** Estructura jerárquica
    - **Solución:** Crear tabla `tipologiasNivelI`

16. **Tipologías Nivel II** (`Tipologias_Nivel_II.csv`)
    - **Razón:** Estructura jerárquica
    - **Solución:** Crear tabla `tipologiasNivelII`

17. **Tipologías III-IV SO y Ambiental** (`Tipologías_III-IV_SO_y_Ambien.csv`)
    - **Razón:** Estructura jerárquica
    - **Solución:** Crear tabla `tipologiasNivelIII_IV`

18. **Tipologías III Seg. Información** (`Tipologías_III-Seg. Informacion.csv`)
    - **Razón:** Estructura jerárquica
    - **Solución:** Crear tabla `tipologiasNivelIII_IV` (extender)

19. **Tabla de Atribuciones** (`Tabla_de_atribuciones.csv`)
    - **Razón:** Tabla de referencia
    - **Solución:** Crear tabla `atribuciones`

### 2. Datos de Access No Migrados

#### ❌ NO MIGRADOS:

1. **Personas Control** (`02_Personas_control.csv`)
   - **Razón:** Similar a Personas pero para control
   - **Solución:** Agregar campo `tipo: 'control'` en `personas` o crear tabla separada

2. **Riesgos (origen)** (`03_Riesgos_(origen).csv`)
   - **Razón:** Catálogo de orígenes
   - **Solución:** Crear tabla `origenesRiesgo`

3. **Fuentes de Causa** (`05_1_Fuentes_de_Causa.csv`)
   - **Razón:** Catálogo de fuentes
   - **Solución:** Crear tabla `fuentesCausa`

4. **Errores de Pegado** (`Errores_de_pegado.csv`)
   - **Razón:** Datos de depuración/error
   - **Solución:** ❌ NO MIGRAR (datos de depuración)

---

## 📋 RESUMEN POR CATEGORÍA

### ✅ COMPLETAMENTE MIGRADO
- ✅ Procesos (11)
- ✅ Personas (13)
- ✅ Riesgos (99)
- ✅ Tipos de Riesgo (49)
- ✅ Causas (432)
- ✅ Frecuencia (5)
- ✅ Objetivos (15)
- ✅ Normatividad (28)
- ✅ Catálogos de Impacto (50 registros)
- ✅ Catálogos de Control (18 registros)

### ⚠️ PARCIALMENTE MIGRADO (Estructura vacía creada)
- ⚠️ Evaluaciones (estructura lista, falta migrar datos)
- ⚠️ Planes de Acción (estructura lista, falta migrar datos)
- ⚠️ Observaciones (estructura lista, se llena dinámicamente)
- ⚠️ Historial (estructura lista, se llena dinámicamente)
- ⚠️ Notificaciones (estructura lista, se llena dinámicamente)
- ⚠️ Tareas (estructura lista, se llena dinámicamente)

### ❌ NO MIGRADO (Requiere crear nuevas tablas)
- ❌ Ficha del Proceso
- ❌ Identificación de Riesgos (Excel)
- ❌ Análisis de Proceso
- ❌ Contexto Externo/Interno
- ❌ DOFA
- ❌ Benchmarking
- ❌ Encuesta
- ❌ Formulas
- ❌ Listas
- ❌ Parámetros de Valoración
- ❌ Tipologías (Nivel I, II, III-IV)
- ❌ Tabla de Atribuciones
- ❌ Personas Control
- ❌ Orígenes de Riesgo
- ❌ Fuentes de Causa

---

## 🚀 PRÓXIMOS PASOS SUGERIDOS

### Prioridad Alta:
1. ✅ **Migrar Evaluaciones** - Crear estructura completa y migrar datos de `4__Evaluación.csv`
2. ✅ **Migrar Planes de Acción** - Crear estructura completa y migrar datos de `6__Priorización_y_Respuesta.csv`
3. ✅ **Agregar Análisis a Procesos** - Agregar campo `analisis` y migrar datos

### Prioridad Media:
4. ⚠️ **Migrar DOFA** - Crear tabla `dofa` y migrar datos
5. ⚠️ **Migrar Contexto Externo/Interno** - Crear tablas y migrar datos
6. ⚠️ **Migrar Tipologías** - Crear estructura jerárquica

### Prioridad Baja:
7. ⚠️ **Migrar Benchmarking** - Crear tabla `benchmarking`
8. ⚠️ **Migrar Encuestas** - Crear tablas `encuestas` y `respuestasEncuesta`
9. ⚠️ **Migrar Formulas** - Crear tabla `formulasConfiguracion`
10. ⚠️ **Migrar Listas y Parámetros** - Crear tablas correspondientes

---

## 📝 NOTAS

- Todos los datos migrados mantienen relaciones mediante IDs
- Los arrays dinámicos (evaluaciones, tareas, etc.) se llenan durante el uso de la aplicación
- Los catálogos están completos y listos para usar
- El proceso de Talento Humano tiene 28 normatividades asociadas

---

**Última actualización:** 2026-01-31  
**Script:** `scripts/migrar-datos-completo.js`

