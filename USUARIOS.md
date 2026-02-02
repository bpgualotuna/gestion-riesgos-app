# Sistema de Autenticación - COMWARE

## 📋 Usuario de Prueba

El sistema cuenta con un único usuario para gestión de procesos:

### Dueño de Procesos

- **Usuario:** `dueño_procesos`
- **Contraseña:** `dueño123`
- **Nombre Completo:** Dueño de Procesos
- **Email:** dueño@comware.com
- **Rol:** Dueño de Procesos
- **Departamento:** Gestión de Procesos
- **Posición:** Dueño de Procesos
- **Teléfono:** +57 300 123 4567
- **Permisos:** Gestión completa de procesos (crear, editar, eliminar procesos)

## 🔐 Características de Autenticación

### Funcionalidades Implementadas:

1. **Login Page** - Página de inicio de sesión moderna con branding COMWARE
2. **AuthContext** - Contexto de React para gestión de autenticación
3. **Protected Routes** - Rutas protegidas que requieren autenticación
4. **Session Persistence** - Sesión guardada en localStorage
5. **User Profile Menu** - Menú de perfil con información del usuario
6. **Logout** - Cierre de sesión con redirección al login

### Componentes Creados:

- `src/contexts/AuthContext.tsx` - Context de autenticación
- `src/features/auth/pages/LoginPage.tsx` - Página de login
- `src/components/auth/ProtectedRoute.tsx` - Componente de ruta protegida

### Flujo de Autenticación:

1. Usuario accede a la aplicación
2. Si no está autenticado, es redirigido a `/login`
3. Ingresa credenciales (o usa botones de demo)
4. Sistema valida credenciales contra usuarios quemados
5. Si es válido, guarda sesión y redirige al dashboard
6. Usuario puede ver su perfil y cerrar sesión desde el navbar

## 🎨 Diseño

La página de login incluye:

- Logo COMWARE con estilo corporativo
- Formulario de login con validación
- Botones de acceso rápido para usuarios demo
- Diseño responsive
- Colores corporativos (verde lima #c8d900)
- Efectos visuales modernos

## 🚀 Uso

### Iniciar Sesión:

1. Accede a `http://localhost:5173`
2. Serás redirigido a `/login`
3. Usa cualquiera de los usuarios de prueba
4. O haz clic en los botones de acceso rápido

### Cerrar Sesión:

1. Haz clic en el avatar del usuario (esquina superior derecha)
2. Selecciona "Cerrar Sesión"
3. Serás redirigido al login

## 📝 Notas Técnicas

- **Persistencia:** La sesión se guarda en `localStorage`
- **Seguridad:** Las contraseñas están hardcoded (solo para desarrollo)
- **Backend:** No hay conexión a backend (datos quemados)
- **Roles:** Los roles están definidos pero no se usan para permisos aún
