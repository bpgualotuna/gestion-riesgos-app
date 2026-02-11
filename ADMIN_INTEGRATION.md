# Integración del Panel Administrativo en la App Principal

## 📋 Descripción General

El **Panel Administrativo** del sistema Gestion de Riesgos ahora está **totalmente integrado ** en la aplicación principal (`gestion-riesgos-app`). Los usuarios con rol **admin** pueden acceder a todas las funcionalidades de administración sin abandonar la aplicación.

## 🚀 Acceso al Panel Admin

### Opción 1: Desde el Menú de Usuario (Recomendado)
1. Inicia sesión con un usuario **admin**
2. Haz clic en tu **avatar/foto de perfil** en la esquina superior derecha
3. En el menú desplegable, verás la opción **"Panel Administrativo"**
4. Haz clic para acceder al panel completo

### Opción 2: Acceso Directo por URL
- Dirección: `http://localhost:5174/admin-panel` (desarrollo)
- Solo usuarios con rol `admin` pueden acceder
- Los demás serán redirigidos a una página de acceso denegado

## 📁 Estructura de Carpetas

```
src/
├── admin/                          # Módulo Admin
│   ├── AdminModule.tsx             # Componente principal del admin
│   ├── index.ts                    # Exportaciones del módulo
│   └── pages/                      # Páginas del admin
│       ├── DashboardPage.tsx       # Dashboard con estadísticas
│       ├── UsuariosPage.tsx        # Gestión de usuarios
│       ├── CatalogosPage.tsx       # Gestión de catálogos
│       └── ConfiguracionPage.tsx   # Configuración general
├── pages/
│   └── admin/
│       └── AdminPanelPage.tsx      # Página envolvente del admin
└── app/
    └── router.tsx                  # Ruta /admin-panel registrada
```

## 🔧 Funcionalidades

### 1. **Dashboard**
- Estadísticas de usuarios activos, procesos, riesgos y configuraciones
- Información del usuario logeado (nombre, email, rol, permisos)
- Visualización rápida del estado del sistema

### 2. **Gestión de Usuarios**
- **Listar**: Tabla de todos los usuarios con filtros
- **Crear**: Nuevo usuario con asignación de rol
- **Editar**: Modificar datos del usuario existente
- **Eliminar**: Remover usuario del sistema
- Roles: Administrador, Operador, Moderador

### 3. **Catálogos** (En desarrollo)
- **Cargos**: Títulos de puestos en la organización
- **Gerencias**: Departamentos principales
- **Áreas**: Áreas dentro de gerencias
- **Tipos de Riesgo**: Categorías de riesgos

### 4. **Configuración** (En desarrollo)
- Parámetros de evaluación de riesgos
- Escalas de impacto y probabilidad
- Configuraciones de reportes
- Integraciones externas
- Respaldo y recuperación de datos

## 🔌 Conectividad Backend

### API Endpoints
Todos los endpoints están en: `http://localhost:3001/api`

**Usuarios:**
- `GET /usuarios` - Listar usuarios
- `POST /usuarios` - Crear usuario
- `PUT /usuarios/:id` - Actualizar usuario
- `DELETE /usuarios/:id` - Eliminar usuario

**Roles:**
- `GET /roles` - Listar roles
- `POST /roles` - Crear rol
- `PUT /roles/:id` - Actualizar rol

**Permisos:**
- `GET /permisos` - Listar permisos
- `POST /permisos` - Crear permiso

### Autenticación
- Token JWT almacenado en `localStorage.adminToken`
- Header: `Authorization: Bearer <token>`
- Si el token expira, se debe volver a iniciar sesión

## 👥 Usuarios de Prueba

### Admin
- **Email**: `admin@comware.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador (acceso completo)
- **Permisos**: Todos

### Operador
- **Email**: `operador@comware.com`
- **Contraseña**: `operador123`
- **Rol**: Operador (acceso limitado)
- **Permisos**: Limitados

## 🔐 Seguridad

### Protección de Rutas
- La ruta `/admin-panel` está protegida
- Requiere que el usuario esté autenticado
- Requiere que el usuario tenga rol `admin`
- Los intentos de acceso no autorizado son rechazados

### Control de Acceso
- Implementado mediante `ProtectedRoute` component
- Validación en el contexto de autenticación
- Verificación de rol antes de cargar el módulo

## 🛠️ Integración con Context

El panel admin se integra con el `AuthContext` de la aplicación:

```tsx
const { user, esAdmin, logout } = useAuth();

if (!esAdmin) {
  // Mostrar página de acceso denegado
}

// Transmitir datos del usuario al AdminModule
const adminUser = {
  id: user.id,
  nombre: user.fullName,
  email: user.email,
  rol: user.role,
  permisos: []
};
```

## 📱 Responsividad

El panel admin es totalmente responsivo:
- **Desktop**: Interfaz completa con todas las columnas
- **Tablet**: Adaptación de tablas y controles
- **Mobile**: Vista simplificada con scrolls horizontales

## 🔄 Flujos de Trabajo

### Crear Nuevo Usuario
1. Haz clic en "Nuevo Usuario" en la pestaña Usuarios
2. Completa el formulario (Nombre, Email, Rol)
3. Haz clic en "Guardar"
4. El usuario se agrega a la base de datos
5. Los cambios se reflejan inmediatamente en la tabla

### Editar Usuario
1. Haz clic en el ícono ✏️ junto al usuario
2. Modifica los datos en el formulario
3. Haz clic en "Guardar"
4. Los cambios se aplican inmediatamente

### Eliminar Usuario
1. Haz clic en el ícono 🗑️ junto al usuario
2. Confirma la eliminación en el diálogo
3. El usuario se elimina del sistema

## 📊 Base de Datos

### Tabla: usuarios_admin
```sql
- id (PK)
- nombre (String)
- email (String, Unique)
- password (Hashed)
- rol (String: 'admin', 'operador', 'moderador')
- activo (Boolean)
- createdAt
- updatedAt
```

### Tabla: roles
```sql
- id (PK)
- nombre (String)
- descripcion (Text)
- createdAt
```

### Tabla: permisos
```sql
- id (PK)
- nombre (String)
- descripcion (Text)
```

## 🚨 Troubleshooting

### El botón "Panel Administrativo" no aparece
- Verifica que el usuario tenga rol `admin`
- Revisa el localStorage para `adminToken`
- Recarga la página con F5

### Error de conexión al backend
- Asegúrate de que el servidor backend está corriendo: `npm run dev` en `gestion-riesgos-backend-admin`
- Verifica que está escuchando en `http://localhost:3001`
- Revisa la consola del navegador para más detalles

### T ablas vacías
- Ejecuta el seed del backend: `npm run seed`
- Esto creará usuarios, roles y datos de prueba
- Verifica la conexión a la base de datos PostgreSQL

### Token expirado
- Vuelve a iniciar sesión en el admin
- El token se actualizará en localStorage
- Intenta de nuevo

##  📞 Soporte

Para reportar problemas o sugerencias:
1. Revisa la consola del navegador (F12)
2. Ver sección "Troubleshooting" arriba
3. Contacta al equipo de desarrollo

## 🎯 Próximas Mejoras

- [ ] Implementar catálogos (Cargos, Gerencias, Áreas)
- [ ] Completar configuración general
- [ ] Agregar auditoría de cambios
- [ ] Implementar exportación de reportes
- [ ] Mejorar validación de formularios
- [ ] Agregar búsqueda avanzada
- [ ] Implementar paginación
- [ ] Agregar temas de diseño customizables

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Estado**: Producción (MVP)
