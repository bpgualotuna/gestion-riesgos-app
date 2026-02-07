# COMWARE - Sistema de Gestión de Riesgos

<p align="center">
  <img src="public/LogoComware.png" alt="COMWARE Logo" width="200"/>
</p>

> Sistema integral para la gestión de riesgos empresariales desarrollado con React, TypeScript y Material-UI.

## 📋 Descripción

El **Sistema de Gestión de Riesgos COMWARE** es una aplicación web moderna diseñada para identificar, evaluar, priorizar y gestionar los riesgos organizacionales. Permite a las empresas:

- **Identificar** riesgos asociados a procesos organizacionales
- **Evaluar** el impacto y la probabilidad de cada riesgo
- **Priorizar** los riesgos según su criticidad
- **Gestionar** controles y planes de acción para mitigación
- **Visualizar** mapas de calor de riesgos en tiempo real

---

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js** >= 18.x (recomendado 22.x)
- **pnpm** >= 8.x

```bash
# Instalar pnpm si no lo tienes
npm install -g pnpm
```

### Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd gestion-riesgos-app

# Instalar dependencias
pnpm install
```

### Ejecutar en Desarrollo

```bash
# Iniciar solo el frontend (usa datos mock)
pnpm dev

# Iniciar frontend + JSON Server (datos persistentes)
pnpm dev:full
```

- **Frontend**: http://localhost:5173
- **JSON Server**: http://localhost:3001

---

## 📜 Scripts Disponibles

| Comando          | Descripción                               |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | Inicia el servidor de desarrollo          |
| `pnpm build`     | Compila para producción                   |
| `pnpm preview`   | Preview del build de producción           |
| `pnpm start`     | Inicia el preview con host externo        |
| `pnpm lint`      | Ejecuta el linter                         |
| `pnpm server`    | Inicia JSON Server en puerto 3001         |
| `pnpm dev:full`  | Inicia frontend y backend simultáneamente |
| `pnpm migrar`    | Ejecuta script de migración de datos      |
| `pnpm verificar` | Verifica estado del servidor              |

---

## 🔐 Credenciales de Acceso

### Usuario de Desarrollo

| Campo          | Valor                        |
| -------------- | ---------------------------- |
| **Usuario**    | `dueño_procesos`             |
| **Contraseña** | `dueño123`                   |
| **Rol**        | Dueño de Procesos            |
| **Permisos**   | Gestión completa de procesos |

---

## 📁 Estructura del Proyecto

```
gestion-riesgos-app/
├── public/                     # Archivos estáticos
│   └── LogoComware.png
├── src/
│   ├── app/                    # Configuración de la aplicación
│   │   ├── router.tsx          # Rutas de la aplicación
│   │   ├── store.ts            # Redux store
│   │   └── theme/              # Tema personalizado
│   │       ├── variables.css   # Variables CSS (colores)
│   │       ├── colors.ts       # Colores Material-UI
│   │       ├── typography.ts   # Tipografía
│   │       └── index.ts        # Tema principal
│   ├── components/
│   │   ├── layout/             # MainLayout, Sidebar, Navbar
│   │   └── ui/                 # Componentes reutilizables
│   ├── contexts/               # Contextos de React
│   │   └── AuthContext.tsx     # Autenticación
│   ├── features/               # Módulos de la aplicación
│   │   ├── admin/              # Administración
│   │   ├── auth/               # Login/Logout
│   │   ├── dashboard/          # Dashboard principal
│   │   └── gestion-riesgos/    # Módulo principal
│   │       ├── api/            # RTK Query APIs
│   │       ├── hooks/          # Custom hooks
│   │       ├── pages/          # Páginas del flujo
│   │       ├── schemas/        # Validaciones Zod
│   │       ├── slices/         # Redux slices
│   │       └── types/          # TypeScript types
│   ├── hooks/                  # Hooks globales
│   └── utils/                  # Utilidades
├── db.json                     # Base de datos JSON Server
├── scripts/                    # Scripts de utilidad
└── Base de datos Refactorizada/ # Esquema PostgreSQL (futuro)
```

---

## 🎨 Personalización de Colores

Los colores están centralizados para fácil modificación:

### Archivo: `src/app/theme/variables.css`

```css
:root {
  /* Colores principales (del Logo COMWARE) */
  --color-primary-orange: #ff9500;
  --color-primary-yellow-green: #b8d900;
  --color-primary-blue: #0080ff;

  /* Colores de niveles de riesgo */
  --color-risk-critical: #d32f2f; /* Rojo - Crítico */
  --color-risk-high: #f57c00; /* Naranja - Alto */
  --color-risk-medium: #fbc02d; /* Amarillo - Medio */
  --color-risk-low: #388e3c; /* Verde - Bajo */
}
```

### Uso en Componentes

```tsx
// Con sx de MUI
<Box sx={{ backgroundColor: 'var(--color-primary-orange)' }}>

// Con clases CSS
<div className="bg-primary-orange">
```

---

## 🎯 Módulos y Funcionalidades

### ✅ Implementados

| Módulo              | Descripción                       | Estado       |
| ------------------- | --------------------------------- | ------------ |
| **Dashboard**       | Estadísticas generales y KPIs     | ✅ Funcional |
| **Identificación**  | Registro de riesgos y causas      | ✅ Funcional |
| **Evaluación**      | Cálculo de impacto y probabilidad | ✅ Funcional |
| **Mapa de Riesgos** | Matriz 5x5 de calor               | ✅ Funcional |
| **Priorización**    | Asignación de respuestas          | ✅ Funcional |
| **Autenticación**   | Login/Logout con roles            | ✅ Funcional |

### 🔄 En Desarrollo

| Módulo               | Descripción                    | Estado       |
| -------------------- | ------------------------------ | ------------ |
| **Normatividad**     | Gestión de normativas          | 🔄 Pendiente |
| **Planes de Acción** | Seguimiento de acciones        | 🔄 Pendiente |
| **Reportes**         | Generación de informes         | 🔄 Pendiente |
| **API PostgreSQL**   | Backend con base de datos real | 🔄 Pendiente |

---

## 🗄️ Base de Datos

### Datos Actuales (JSON Server)

La aplicación usa `db.json` con datos migrados:

- **Procesos**: 11 registros
- **Personas**: 13 registros
- **Riesgos**: 99 registros
- **Causas**: 432 registros
- **Tipos de Riesgo**: 49 registros
- **Normatividad**: 26 registros
- **Catálogos de Impacto**: 50 registros
- **Catálogos de Control**: 18 registros

### Base de Datos PostgreSQL (Futuro)

Se ha diseñado un esquema completo en la carpeta `Base de datos Refactorizada/`:

- `02_nuevo_esquema_completo.sql` - Esquema con 30+ tablas
- `03_datos_ejemplo.sql` - Datos de ejemplo
- `DOCUMENTACION_CAMBIOS.md` - Documentación del esquema

**Credenciales PostgreSQL (desarrollo):**

- Host: `localhost`
- Database: `comware`
- Usuario: `postgres`
- Contraseña: `bpg2000`

---

## 🔧 Tecnologías

| Categoría        | Tecnología                | Versión        |
| ---------------- | ------------------------- | -------------- |
| **Frontend**     | React                     | 19.2.0         |
| **Lenguaje**     | TypeScript                | 5.9.3          |
| **Build Tool**   | Vite (Rolldown)           | 7.2.5          |
| **UI Framework** | Material-UI               | 7.3.7          |
| **Estado**       | Redux Toolkit + RTK Query | 2.11.2         |
| **Rutas**        | React Router              | 7.13.0         |
| **Formularios**  | React Hook Form + Zod     | 7.71.1 / 4.3.6 |
| **HTTP Client**  | Axios                     | 1.13.3         |
| **Dev Backend**  | JSON Server               | 1.0.0-beta.5   |

---

## 🌐 Variables de Entorno

Crear archivo `.env` en la raíz:

```env
# URL del backend (opcional, usa datos mock si no está configurado)
VITE_API_BASE_URL=http://localhost:3001

# Otras variables
VITE_APP_NAME=COMWARE Gestión de Riesgos
```

---

## 🐛 Solución de Problemas

### Error: Puerto en uso

```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Error: Módulos no encontrados

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Error: TypeScript Grid warnings

Es un warning conocido de MUI v7 y no afecta la funcionalidad.

---

## 📚 Documentación Adicional

| Archivo                  | Descripción                    |
| ------------------------ | ------------------------------ |
| `INICIO_LOCAL.md`        | Guía detallada de inicio local |
| `USUARIOS.md`            | Sistema de autenticación       |
| `RESUMEN_MIGRACION.md`   | Detalles de migración de datos |
| `COMANDOS_MIGRACION.md`  | Comandos de migración          |
| `REVISION_APLICACION.md` | Revisión del estado de la app  |

---

## 👥 Contribución

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es propiedad de **COMWARE**. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte técnico o consultas:

- **Email**: soporte@comware.com
- **Documentación**: Ver archivos `.md` en el proyecto

---

**Versión**: 3.0.0  
**Última actualización**: Febrero 2026  
**Estado**: ✅ En desarrollo activo
