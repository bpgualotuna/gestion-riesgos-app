# 🔧 Fix: Error 401 en Alertas de Vencimiento

## ❌ Problema

Al cargar la aplicación, se producía un error 401 (Unauthorized) al intentar obtener las alertas:

```
❌ [AUTH] Token no proporcionado para: /api/alertas-vencimiento
GET /api/alertas-vencimiento?soloNoLeidas=true 401 0.593 ms - 53
```

En el frontend se veía:
```
GET http://localhost:8080/api/alertas-vencimiento?soloNoLeidas=...
401 (Unauthorized)
```

## 🔍 Causa Raíz

El servicio de API `planTrazabilidadApi.ts` estaba leyendo el token JWT de la ubicación incorrecta:

### Código Incorrecto:
```typescript
prepareHeaders: (headers) => {
  const token = localStorage.getItem('token'); // ❌ INCORRECTO
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}
```

### Problema:
1. El `AuthContext` guarda el token en `sessionStorage` con la clave `AUTH_TOKEN_KEY` (valor: `'gr_token'`)
2. El API service buscaba en `localStorage` con la clave `'token'`
3. Resultado: No encontraba el token → No enviaba header Authorization → Backend rechazaba con 401

## ✅ Solución Aplicada

### 1. Importar la constante correcta
```typescript
import { AUTH_TOKEN_KEY } from '../../utils/constants';
```

### 2. Leer de sessionStorage con la clave correcta
```typescript
prepareHeaders: (headers) => {
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY); // ✅ CORRECTO
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}
```

### 3. Agregar condición de skip en el query
```typescript
const { data: alertasData } = useObtenerAlertasQuery(
  { soloNoLeidas: true },
  { 
    skip: esAdmin || !user || isLoading, // ✅ Solo ejecutar si hay usuario autenticado
    pollingInterval: 60000
  }
);
```

## 📝 Archivos Modificados

### 1. planTrazabilidadApi.ts
**Ubicación**: `gestion-riesgos-app/src/api/services/planTrazabilidadApi.ts`

**Cambios**:
- Importado `AUTH_TOKEN_KEY` de constants
- Cambiado `localStorage.getItem('token')` → `sessionStorage.getItem(AUTH_TOKEN_KEY)`

### 2. MainLayout.tsx
**Ubicación**: `gestion-riesgos-app/src/components/layout/MainLayout.tsx`

**Cambios**:
- Agregado condición `!user || isLoading` al skip del query
- Asegura que solo se ejecute cuando el usuario esté autenticado

## 🔐 Flujo de Autenticación Correcto

```
1. Usuario hace login
   ↓
2. Backend devuelve JWT token
   ↓
3. AuthContext guarda en: sessionStorage.setItem('gr_token', token)
   ↓
4. API service lee de: sessionStorage.getItem('gr_token')
   ↓
5. Agrega header: Authorization: Bearer <token>
   ↓
6. Backend valida token → 200 OK ✅
```

## 🧪 Verificación

### Antes del fix:
```
❌ GET /api/alertas-vencimiento 401 (Unauthorized)
❌ Token no proporcionado
❌ Badge no muestra alertas
```

### Después del fix:
```
✅ GET /api/alertas-vencimiento 200 OK
✅ Token enviado correctamente
✅ Badge muestra número de alertas
✅ Polling funciona cada 60 segundos
```

## 📊 Comparación de Storage

| Aspecto | Antes (❌) | Después (✅) |
|---------|-----------|-------------|
| Storage | localStorage | sessionStorage |
| Clave | 'token' | 'gr_token' (AUTH_TOKEN_KEY) |
| Resultado | Token no encontrado | Token encontrado |
| Status | 401 Unauthorized | 200 OK |

## 🎯 Lecciones Aprendidas

1. **Consistencia en storage**: Siempre usar la misma ubicación (sessionStorage vs localStorage)
2. **Usar constantes**: Evitar strings hardcodeados, usar constantes compartidas
3. **Condiciones de skip**: Asegurar que queries solo se ejecuten cuando hay datos necesarios
4. **Debugging**: Verificar headers en Network tab del navegador

## ✅ Checklist de Verificación

- [x] Token se lee de sessionStorage
- [x] Se usa la constante AUTH_TOKEN_KEY
- [x] Query tiene condición skip correcta
- [x] No hay errores de compilación
- [x] Backend recibe token correctamente
- [x] Alertas se cargan sin error 401

## 🚀 Estado Actual

**PROBLEMA RESUELTO** ✅

Las alertas ahora se cargan correctamente y el badge muestra el número de alertas no leídas.

---

**Fecha de fix**: 22 de marzo de 2026  
**Tiempo de resolución**: ~10 minutos  
**Impacto**: Crítico → Resuelto
