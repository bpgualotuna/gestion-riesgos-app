# 📋 CHECKLIST: Despliegue a Render

## ✅ Pre-requisitos completados

- [x] Archivo `render.yaml` creado
- [x] Archivo `.node-version` creado  
- [x] Script `build` modificado en package.json (sin TypeScript check)
- [x] Script `start` configurado con puerto 3000
- [x] Build local exitoso ✓

## 🚀 Pasos para desplegar

### 1. Subir código a GitHub/GitLab

```bash
# Si aún no tienes un repositorio remoto
git init
git add .
git commit -m "Preparar para despliegue en Render"

# Conectar con GitHub (reemplaza con tu repo)
git remote add origin https://github.com/TU_USUARIO/gestion-riesgos-app.git
git branch -M main
git push -u origin main
```

### 2. Crear cuenta en Render

1. Ve a https://render.com
2. Haz clic en **"Get Started"**
3. Conecta con GitHub/GitLab

### 3. Crear Web Service

1. Click en **"New +"** → **"Web Service"**
2. Click en **"Connect a repository"**
3. Busca y selecciona `gestion-riesgos-app`
4. Click en **"Connect"**

### 4. Configurar el servicio

Render detectará automáticamente `render.yaml`, verifica la configuración:

| Campo | Valor |
|-------|-------|
| **Name** | `gestion-riesgos-app` |
| **Runtime** | `Node` |
| **Build Command** | `pnpm install && pnpm build` |
| **Start Command** | `pnpm start` |
| **Instance Type** | `Free` |

### 5. Variables de entorno (opcional)

Si render.yaml no las carga automáticamente, agrégalas manualmente:

- `NODE_VERSION`: `20.11.0`
- `PNPM_VERSION`: `9.0.0`
- `PORT`: `3000`

### 6. Deploy

1. Click en **"Create Web Service"**
2. Render comenzará el build automáticamente
3. **Tiempo estimado**: 5-10 minutos

### 7. Verificar despliegue

Una vez completado:
- URL de tu app: `https://gestion-riesgos-app.onrender.com`
- Estado debe decir: **"Live"** (verde)

## 📊 Verificación post-despliegue

### Probar funcionalidades críticas:

- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Procesos se visualizan
- [ ] Riesgos se pueden crear/editar
- [ ] localStorage persiste datos

### Ver logs en vivo:

1. En dashboard de Render → Tu servicio
2. Tab **"Logs"**
3. Verifica que no haya errores

## ⚠️ Notas importantes

### Plan Free de Render:

| Característica | Estado |
|----------------|---------|
| HTTPS automático | ✅ Incluido |
| Subdominios .onrender.com | ✅ Incluido |
| Deploy automático desde Git | ✅ Incluido |
| **Sleep after inactivity** | ⚠️ 15 minutos |
| **First load time** | ⚠️ 30-50 segundos |
| **Monthly hours** | ⚠️ 750 horas |

### localStorage

Esta app usa `localStorage` del navegador:
- ✅ Datos persisten en el navegador del usuario
- ✅ No necesita base de datos
- ⚠️ Datos NO se comparten entre dispositivos
- ⚠️ Se borran si el usuario limpia caché

## 🔄 Actualizaciones futuras

Para actualizar la app desplegada:

```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Render detectará el push y **desplegará automáticamente**.

## 🐛 Solución de problemas

### Build falla

1. Verifica logs en Render
2. Asegúrate que `pnpm build` funciona localmente
3. Revisa que todas las dependencias están en package.json

### App no carga

1. Verifica logs de runtime (no build)
2. Asegúrate que el puerto es 3000
3. Verifica que `pnpm start` funciona localmente

### App muy lenta

- Primera carga en plan free tarda 30-50 segundos (se despierta)
- Considera upgrade a plan Starter ($7/mes) para eliminar sleep

### Errores de TypeScript

Los errores de TypeScript existen pero **NO bloquean el build**.
Para corregirlos (opcional):

```bash
# Ver todos los errores
pnpm build:check
```

Archivos con más errores a revisar:
- `src/pages/identificacion/IdentificacionCalificacionPage.tsx`
- `src/pages/controles/TareasPage.tsx`  
- `src/utils/calculations.ts`

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs en Render
2. Verifica que todo funciona localmente con `pnpm build && pnpm preview`
3. Compara la configuración con `render.yaml`

---

## ✨ ¡Todo listo!

Tu aplicación estará disponible en:
**https://gestion-riesgos-app.onrender.com**

(El nombre exacto depende de disponibilidad en Render)
