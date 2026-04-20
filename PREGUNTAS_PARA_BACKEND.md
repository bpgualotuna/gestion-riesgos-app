# Preguntas Críticas para el Backend

Antes de implementar la solución completa, necesitamos confirmar estos puntos con el equipo de backend:

## 1. CLASIFICACIÓN DE PROCESOS

### Pregunta 1.1: Valores de tipoProceso
¿Cuáles son TODOS los valores posibles que puede tener `proceso.tipoProceso`?

**Contexto**: En el código vemos referencias a:
- "estratégico" / "estrategico"
- "operacional" / "operativo"
- "comercial"
- "talento humano"
- etc.

**Necesitamos**:
- Lista completa de valores
- Formato exacto (mayúsculas, minúsculas, acentos)
- Ejemplos de procesos reales

### Pregunta 1.2: Mapeo de Gestiones
¿Cómo se mapean los tipos de proceso a "gestiones"?

**Contexto**: Queremos crear un selector que agrupe procesos por "gestión":
- Gestión de Riesgos
- Gestión Estratégica
- Gestión Comercial
- etc.

**Necesitamos**:
- Confirmación de que `tipoProceso` es el campo para clasificar
- Mapeo exacto: tipoProceso → Gestión
- ¿Hay otros campos que afecten la clasificación?

## 2. RESTRICCIONES DE ACCESO POR GESTIÓN

### Pregunta 2.1: Acceso por Rol
¿Hay restricciones de acceso a gestiones según el rol del usuario?

**Contexto**: Queremos saber si:
- Admin ve todas las gestiones
- Supervisor ve todas las gestiones
- Dueño de Procesos ve solo sus procesos
- Gerente ve según su modo

**Necesitamos**:
- Matriz de acceso: Rol × Gestión
- ¿Hay gestiones que solo ciertos roles pueden ver?
- ¿Hay gestiones que son solo lectura?

### Pregunta 2.2: Permisos por Gestión
¿Hay permisos diferentes según la gestión?

**Contexto**: Queremos saber si:
- Gestión Estratégica es siempre solo lectura
- Hay otras restricciones de permisos
- Los permisos dependen del rol + gestión

**Necesitamos**:
- Matriz de permisos: Gestión × Rol
- ¿Qué operaciones están permitidas en cada gestión?
- ¿Hay campos que se ocultan en ciertas gestiones?

## 3. COMPORTAMIENTO DEL SELECTOR

### Pregunta 3.1: Gestiones Disponibles
¿Cómo se determina qué gestiones están disponibles para un usuario?

**Contexto**: El selector debe mostrar solo gestiones donde el usuario tiene procesos.

**Necesitamos**:
- ¿Se basa en procesos asignados?
- ¿Se basa en rol?
- ¿Se basa en áreas?
- ¿Hay una tabla de "gestiones disponibles" en el backend?

### Pregunta 3.2: Gestión por Defecto
¿Cuál debe ser la gestión por defecto?

**Contexto**: Cuando el usuario entra por primera vez, ¿qué gestión debe estar seleccionada?

**Necesitamos**:
- ¿Siempre "Gestión de Riesgos"?
- ¿La última gestión seleccionada?
- ¿Según el rol?

### Pregunta 3.3: Sin Procesos en Gestión
¿Qué debe pasar si el usuario no tiene procesos en la gestión seleccionada?

**Contexto**: Si selecciona "Gestión Estratégica" pero no tiene procesos estratégicos.

**Necesitamos**:
- ¿Mostrar mensaje de error?
- ¿Resetear a gestión por defecto?
- ¿Mostrar lista vacía?
- ¿Deshabilitar el selector?

## 4. FILTRADO DE DATOS

### Pregunta 4.1: Filtrado de Procesos
¿Cómo se deben filtrar los procesos según la gestión?

**Contexto**: Cuando el usuario selecciona "Gestión Comercial", ¿qué procesos debe ver?

**Necesitamos**:
- ¿Solo procesos con tipoProceso = "comercial"?
- ¿Hay otros criterios?
- ¿Se combinan con filtros de rol/asignación?

### Pregunta 4.2: Filtrado de Riesgos
¿Cómo se deben filtrar los riesgos según la gestión?

**Contexto**: Los riesgos pertenecen a procesos. Si filtramos procesos, ¿se filtran automáticamente los riesgos?

**Necesitamos**:
- ¿Los riesgos se heredan del filtrado de procesos?
- ¿Hay riesgos que pertenecen a múltiples gestiones?
- ¿Hay filtrado adicional de riesgos?

### Pregunta 4.3: Filtrado de Controles y Planes
¿Cómo se deben filtrar controles y planes según la gestión?

**Contexto**: En Gestión Estratégica, ¿se deben ocultar los controles?

**Necesitamos**:
- ¿Se ocultan completamente o se filtran?
- ¿Se ocultan solo en el menú o también en las páginas?
- ¿Hay datos que no deben ser accesibles en ciertas gestiones?

## 5. PERSISTENCIA Y ESTADO

### Pregunta 5.1: Persistencia de Gestión
¿Debe persistirse la gestión seleccionada?

**Contexto**: Si el usuario selecciona "Gestión Estratégica" y recarga la página, ¿debe mantener esa selección?

**Necesitamos**:
- ¿Persistir en localStorage?
- ¿Persistir en el backend?
- ¿Por usuario?
- ¿Por sesión?

### Pregunta 5.2: Cambio de Gestión
¿Qué debe pasar cuando el usuario cambia de gestión?

**Contexto**: Si estaba viendo un proceso de Gestión Comercial y cambia a Gestión Estratégica.

**Necesitamos**:
- ¿Limpiar la selección de proceso?
- ¿Mostrar alerta?
- ¿Redirigir a una página segura?

## 6. CASOS ESPECIALES

### Pregunta 6.1: Admin
¿Qué ve el admin?

**Necesitamos**:
- ¿Ve el selector de gestión?
- ¿Ve todas las gestiones?
- ¿Hay restricciones?

### Pregunta 6.2: Supervisor
¿Qué ve el supervisor?

**Necesitamos**:
- ¿Ve el selector de gestión?
- ¿Ve todas las gestiones?
- ¿Solo lectura?

### Pregunta 6.3: Gerente
¿Qué ve el gerente en cada modo?

**Necesitamos**:
- Modo Director: ¿Ve todas las gestiones?
- Modo Proceso: ¿Ve solo sus procesos?
- ¿Hay restricciones por gestión?

## 7. DATOS DE EJEMPLO

### Pregunta 7.1: Procesos Reales
¿Puedes proporcionar ejemplos de procesos reales con sus valores?

**Necesitamos**:
```json
{
  "id": 1,
  "nombre": "Ejemplo",
  "tipoProceso": "???",
  "responsablesList": [...],
  "estado": "aprobado"
}
```

### Pregunta 7.2: Usuarios Reales
¿Puedes proporcionar ejemplos de usuarios con diferentes roles?

**Necesitamos**:
```json
{
  "id": 1,
  "username": "ejemplo",
  "role": "???",
  "ambito": "???",
  "puedeVisualizar": true,
  "puedeEditar": false
}
```

## 8. VALIDACIÓN

### Pregunta 8.1: Validación en Backend
¿El backend valida el acceso a gestiones?

**Necesitamos**:
- ¿Hay un endpoint para validar acceso?
- ¿Se valida automáticamente en cada request?
- ¿Qué pasa si intento acceder a datos de una gestión sin permiso?

### Pregunta 8.2: Errores
¿Qué errores devuelve el backend?

**Necesitamos**:
- Códigos de error específicos
- Mensajes de error
- Cómo manejarlos en el frontend

## RESUMEN DE RESPUESTAS NECESARIAS

| Pregunta | Prioridad | Impacto |
|----------|-----------|--------|
| 1.1: Valores de tipoProceso | CRÍTICA | Define toda la clasificación |
| 1.2: Mapeo de Gestiones | CRÍTICA | Define el selector |
| 2.1: Acceso por Rol | ALTA | Define visibilidad |
| 2.2: Permisos por Gestión | ALTA | Define restricciones |
| 3.1: Gestiones Disponibles | ALTA | Define qué mostrar |
| 3.2: Gestión por Defecto | MEDIA | Define comportamiento inicial |
| 3.3: Sin Procesos | MEDIA | Define manejo de errores |
| 4.1: Filtrado de Procesos | CRÍTICA | Define datos mostrados |
| 4.2: Filtrado de Riesgos | ALTA | Define datos mostrados |
| 4.3: Filtrado de Controles | MEDIA | Define visibilidad de menú |
| 5.1: Persistencia | MEDIA | Define UX |
| 5.2: Cambio de Gestión | MEDIA | Define transiciones |
| 6.x: Casos Especiales | MEDIA | Define comportamiento |
| 7.x: Datos de Ejemplo | ALTA | Facilita testing |
| 8.x: Validación | MEDIA | Define seguridad |

## PRÓXIMOS PASOS

1. **Enviar estas preguntas al backend**
2. **Esperar respuestas**
3. **Documentar respuestas**
4. **Implementar basado en respuestas**
5. **Testing exhaustivo**

## NOTAS

- Estas preguntas son CRÍTICAS para una implementación correcta
- Sin respuestas claras, la implementación será frágil
- Es mejor invertir tiempo ahora en clarificar que después en arreglar bugs
