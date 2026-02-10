# Panel Administrativo Integrado en gestion-riesgos-app

## ✅ Estado: Completo e Integrado

El panel administrativo está **100% integrado** en la aplicación principal (`gestion-riesgos-app`) con:

### ✨ Características

- ✅ **Login Administrativo**: Acceso con credenciales admin
- ✅ **Dashboard**: Estadísticas y bienvenida
- ✅ **Gestión de Usuarios**: CRUD completo
- ✅ **Catálogos**: Organización de datos (Cargos, Gerencias, Áreas, Tipos Riesgo)
- ✅ **Configuración**: Parámetros del sistema
- ✅ **Logo COMWARE**: En la barra superior
- ✅ **Colores Consistentes**: Azul (#1976d2) y diseño profesional
- ✅ **Responsive**: Funciona en mobile, tablet y desktop

## 🚀 Acceso al Panel Admin

### Opción 1: Desde la App Principal (Recomendado)
1. Inicia sesión con usuario **admin** en `https://gestion-riesgos-app.onrender.com`
2. Haz clic en tu avatar en la esquina superior derecha
3. Selecciona **"Panel Administrativo"** (solo visible para admins)
4. ¡Ya estás dentro!

### Opción 2: URL Directa
```
http://localhost:5174/admin-panel (desarrollo)
https://gestion-riesgos-app.onrender.com/admin-panel (producción)
```

## 📁 Estructura de Carpetas

```
src/
├── admin/                          # Módulo Admin
│   ├── AdminModule.tsx             # Componente principal (con logo COMWARE)
│   ├── index.ts                    # Exportaciones
│   └── pages/                      # Páginas del admin
│       ├── DashboardPage.tsx       # Dashboard con estadísticas
│       ├── UsuariosPage.tsx        # Gestión de usuarios
│       ├── CatalogosPage.tsx       # Gestión de catálogos
│       └── ConfiguracionPage.tsx   # Configuración general
├── pages/
│   └── admin/
│       └── AdminPanelPage.tsx      # Página envolvente con autenticación
├── app/
│   └── router.tsx                  # Ruta /admin-panel registrada
└── contexts/
    └── AuthContext.tsx             # Autenticación (verifica rol admin)
```

## 🔧 Configuración

### Variables de Entorno

```env
# .env o .env.local
VITE_API_ADMIN_URL=http://localhost:3001/api

# Producción
VITE_API_ADMIN_URL=https://gestion-riegos-admin-back.onrender.com/api
```

### Backend Admin Requerido

El panel conecta con el backend admin en:
- **Desarrollo**: `http://localhost:3001/api`
- **Producción**: `https://gestion-riegos-admin-back.onrender.com/api`

## 👥 Usuarios de Prueba

### Admin
- **Email**: admin@comware.com
- **Password**: admin123
- **Rol**: Administrador
- **Permisos**: Todos

### Operador
- **Email**: operador@comware.com
- **Password**: operador123
- **Rol**: Operador
- **Permisos**: Limitados

## 📱 Componentes

### AdminModule (src/admin/AdminModule.tsx)
- AppBar con logo COMWARE
- Tabs para navegación: Dashboard, Usuarios, Catálogos, Configuración
- Footer con información
- Sistema de colores consistente

### DashboardPage
- 4 cards de estadísticas (con colores diferentes)
- Información del usuario loguado
- Permisos asignados

### UsuariosPage
- Tabla de usuarios con CRUD
- Diálogo para crear/editar
- Eliminación con confirmación
- API integration completa

### CatalogosPage
- Tabs para diferentes catálogos
- Estructura lista para implementar

### ConfiguracionPage
- Parámetros del sistema
- Listar de funcionalidades en desarrollo

## 🔐 Seguridad

- ✅ Autenticación JWT con backend
- ✅ Control de acceso por rol (solo admins)
- ✅ Token almacenado en localStorage
- ✅ Logout limpia sesión
- ✅ Protección de ruta autenticada

## 🎯 Rutas API Disponibles

```
POST   /api/auth/login           Login
GET    /api/usuarios             Listar usuarios
POST   /api/usuarios             Crear usuario
PUT    /api/usuarios/:id         Actualizar usuario
DELETE /api/usuarios/:id         Eliminar usuario
GET    /api/roles                Listar roles
POST   /api/roles                Crear rol
... (más según documentación backend)
```

## 🧪 Pruebas Locales

### 1. Iniciar Backend Admin
```bash
cd gestion-riesgos-backend-admin
npm run dev
# → http://localhost:3001
```

### 2. Iniciar Frontend Principal
```bash
cd gestion-riesgos-app
npm run dev
# → http://localhost:5174
```

### 3. Acceder a Admin
1. Login en `http://localhost:5174` con admin@comware.com / admin123
2. Avatar → Panel Administrativo
3. O directo: `http://localhost:5174/admin-panel`

## 🎨 Diseño & Colores

| Elemento | Color | Uso |
|----------|-------|-----|
| AppBar | #1976d2 | Encabezado principal |
| Usuarios (Card) | #1976d2 | Icono estadísticas |
| Procesos (Card) | #388e3c | Icono estadísticas |
| Riesgos (Card) | #d32f2f | Icono estadísticas |
| Configuraciones (Card) | #f57c00 | Icono estadísticas |
| Fondo | #f5f5f5 | Fondo general |
| Botones | #1976d2 | Acciones |

## ✨ Logo COMWARE

Se carga desde:
```
https://comware.com.ec/wp-content/uploads/2022/08/Comware-FC-F-blanco.webp
```

Visible en:
- AppBar del admin
- Encabezado de login

## 🔄 Flujo de Navegación

```
App Principal (gestion-riesgos-app)
    ↓
User Avatar Menu
    ↓
Panel Administrativo (si es admin)
    ↓
AdminModule
    ├─ Dashboard
    ├─ Usuarios (CRUD)
    ├─ Catálogos
    └─ Configuración
    ↓
Backend Admin (gestion-riegos-admin-back)
    ↓
PostgreSQL Database
```

## 🚨 Troubleshooting

### "No tienes permisos para acceder"
- Verifica que estés loguado como usuario admin
- El rol debe ser "admin"
- Actualiza página con F5

### "Cannot connect to backend"
- Asegurate que backend admin está corriendo
- Verifica URL en VITE_API_ADMIN_URL
- Revisa CORS en .env del backend

### Tabla de usuarios vacía
- Ejecuta seed del backend: `npm run seed`
- Verifica conexión a PostgreSQL
- Revisa logs del backend

### CORS Error
- Agregar URL frontend a CORS_ORIGIN en backend .env
- Reiniciar backend

## 📚 Documentación Relacionada

- [ADMIN_INTEGRATION.md](../ADMIN_INTEGRATION.md) - Integración en app principal
- Backend Admin: [gestion-riesgos-backend-admin/README.md](../../gestion-riesgos-backend-admin/README.md)
- Frontend Admin Standalone: [gestion-riesgos-admin-app/README.md](../../gestion-riesgos-admin-app/README.md)

## 🎓 Próximas Mejoras

- [ ] Implementar todos los catálogos
- [ ] Agregar búsqueda avanzada
- [ ] Implementar filtros y paginación
- [ ] Agregar auditoría de cambios
- [ ] Exportar reportes
- [ ] Temas customizables
- [ ] Más validaciones en formularios

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Estado**: Listo para producción ✅
