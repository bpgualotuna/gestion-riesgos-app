# Instrucciones de Despliegue

## Despliegue Rápido en Producción

### 1. Preparar el Código

```bash
# Asegúrate de estar en la rama correcta
git status

# Commit de los cambios
git add .
git commit -m "fix: configurar variables de entorno desde .env único"
git push origin main
```

### 2. Configurar Variables de Entorno en el Servidor

En tu servidor de producción, asegúrate de que existe el archivo `.env` en la raíz del proyecto frontend:

**Ubicación:** `gestion-riesgos-app/.env`

**Contenido:**
```env
VITE_API_BASE_URL=https://erm.comware.com.ec/api
VITE_APP_NAME=Sistema de Gestión de Riesgos
VITE_ENV=production
```

### 3. Build de la Aplicación

```bash
cd gestion-riesgos-app
npm install
npm run build
```

El build generará los archivos en la carpeta `dist/`

### 4. Desplegar

Sube el contenido de la carpeta `dist/` a tu servidor web.

### 5. Verificar

1. Abre `https://erm.comware.com.ec/` en el navegador
2. Abre la consola del navegador (F12)
3. Intenta guardar un control
4. Verifica que las peticiones vayan a `https://erm.comware.com.ec/api/...`

## Troubleshooting

### Error: "Failed to fetch"

**Causa:** La aplicación está intentando conectarse a `localhost:8080`

**Solución:**
1. Verifica que el archivo `.env` existe en el servidor
2. Verifica que `VITE_API_BASE_URL=https://erm.comware.com.ec/api`
3. Rebuild: `npm run build`
4. Limpia caché del navegador (Ctrl+Shift+R)

### Las variables no se cargan

**Solución:**
1. Verifica que el archivo se llame exactamente `.env` (sin espacios)
2. Verifica que las variables empiecen con `VITE_`
3. Rebuild completo: `rm -rf dist && npm run build`

### CORS Error

**Causa:** El backend no acepta peticiones desde el dominio del frontend

**Solución:**
Configura CORS en el backend para aceptar `https://erm.comware.com.ec`

## Comandos Útiles

```bash
# Build de producción
npm run build

# Preview del build localmente
npm run preview

# Limpiar y rebuild
rm -rf dist node_modules
npm install
npm run build

# Ver tamaño del build
du -sh dist/
```

## Checklist de Despliegue

- [ ] Archivo `.env` existe en el servidor con la configuración correcta
- [ ] `VITE_API_BASE_URL` apunta a `https://erm.comware.com.ec/api`
- [ ] Build ejecutado sin errores
- [ ] Archivos de `dist/` desplegados en el servidor
- [ ] Caché del navegador limpiada
- [ ] Peticiones van a la URL correcta (verificado en consola)
- [ ] Funcionalidad de guardar control funciona correctamente

## Configuración de CI/CD (Opcional)

Si usas un servicio de despliegue automático (Render, Vercel, Netlify, etc.):

1. Configura la variable de entorno en el panel del servicio:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://erm.comware.com.ec/api`

2. El servicio hará el build automáticamente al hacer push

3. No necesitas subir el archivo `.env` al repositorio
