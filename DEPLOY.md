# 🚀 Despliegue en Render

## Pasos para desplegar

### 1. Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén commitados
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

### 2. Crear servicio en Render

1. Ve a [https://render.com](https://render.com)
2. Inicia sesión o crea una cuenta
3. Click en **"New +"** → **"Web Service"**
4. Conecta tu repositorio de GitHub/GitLab
5. Selecciona el repositorio `gestion-riesgos-app`

### 3. Configuración del servicio

Render debería detectar automáticamente la configuración desde `render.yaml`, pero verifica:

- **Name**: `gestion-riesgos-app`
- **Runtime**: `Node`
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`
- **Plan**: `Free` (para empezar)

### 4. Variables de entorno (opcional)

Si necesitas configurar variables:
- Click en **"Environment"** en el dashboard
- Agrega las variables necesarias

### 5. Deploy

- Click en **"Create Web Service"**
- Render comenzará el build automáticamente
- Espera a que termine (puede tomar 5-10 minutos)
- Tu app estará en: `https://gestion-riesgos-app.onrender.com`

## 📝 Notas importantes

### Plan Free de Render
- ✅ HTTPS automático
- ✅ Despliegue automático desde Git
- ⚠️ Se duerme después de 15 min de inactividad
- ⚠️ Primer acceso puede tardar 30-50 segundos

### Datos persistentes
Esta aplicación usa `localStorage` del navegador, por lo que:
- ✅ Los datos se mantienen en el navegador del usuario
- ✅ No necesita base de datos externa
- ⚠️ Los datos no se comparten entre navegadores

### Actualizaciones automáticas
Cada vez que hagas `git push` a tu rama principal:
- Render detectará los cambios
- Hará build automáticamente
- Desplegará la nueva versión

## 🔧 Comandos útiles

### Verificar build localmente
```bash
pnpm build
pnpm preview
```

### Ver logs en Render
En el dashboard de Render → Tu servicio → Tab "Logs"

## ⚡ Problemas comunes

### Build falla por memoria
Si el plan free no tiene suficiente memoria:
- Considera actualizar a plan Starter ($7/mes)
- O simplifica las dependencias

### App muy lenta
- Primera carga en plan free es lenta (se despierta del modo sleep)
- Usuarios subsecuentes cargan más rápido

### Errores de TypeScript
Asegúrate de que `pnpm build` funciona localmente antes de desplegar
