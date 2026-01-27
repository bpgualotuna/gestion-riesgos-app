# COMWARE - Sistema de Gestión de Riesgos

## 🎨 Guía de Colores del Proyecto

Los colores del proyecto están centralizados en el archivo `src/app/theme/variables.css` para facilitar su modificación.

### Colores Principales (del Logo COMWARE)

Los colores están extraídos del archivo `Logo-colores.jpeg`:

```css
--color-primary-orange: #ff9500; /* Naranja principal */
--color-primary-yellow-green: #b8d900; /* Verde-amarillo */
--color-primary-blue: #0080ff; /* Azul */
```

### Cómo Cambiar los Colores Globalmente

**Opción 1: Modificar las Variables CSS (Recomendado)**

Edita el archivo `src/app/theme/variables.css` y cambia los valores en `:root`:

```css
:root {
  /* Cambia estos valores para actualizar los colores en toda la app */
  --color-primary-orange: #TU_NUEVO_COLOR;
  --color-primary-yellow-green: #TU_NUEVO_COLOR;
  --color-primary-blue: #TU_NUEVO_COLOR;
}
```

**Opción 2: Modificar el Tema de Material-UI**

Edita el archivo `src/app/theme/colors.ts` para cambiar los colores del tema:

```typescript
export const colors = {
  primary: {
    main: "#FF9500", // Cambia aquí
    light: "#FFB74D",
    dark: "#F57C00",
    contrastText: "#FFFFFF",
  },
  // ... más colores
};
```

### Estructura de Colores

```
src/app/theme/
├── variables.css    ← Variables CSS globales (RECOMENDADO para cambios)
├── colors.ts        ← Colores de Material-UI
├── typography.ts    ← Configuración de tipografía
└── index.ts         ← Tema principal
```

### Colores de Niveles de Riesgo

Los colores de los niveles de riesgo también están centralizados:

```css
--color-risk-critical: #d32f2f; /* Rojo - Crítico */
--color-risk-high: #f57c00; /* Naranja - Alto */
--color-risk-medium: #fbc02d; /* Amarillo - Medio */
--color-risk-low: #388e3c; /* Verde - Bajo */
```

### Uso de Variables CSS en el Código

Puedes usar las variables CSS directamente en tus componentes:

```tsx
<Box sx={{ backgroundColor: "var(--color-primary-orange)" }}>Contenido</Box>
```

O usar las clases de utilidad:

```tsx
<div className="bg-primary-orange">Contenido</div>
<div className="text-primary-blue">Texto azul</div>
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── router.tsx          # Rutas de la aplicación
│   ├── store.ts            # Redux store
│   └── theme/              # Configuración de tema
│       ├── variables.css   # Variables CSS (COLORES AQUÍ)
│       ├── colors.ts
│       ├── typography.ts
│       └── index.ts
├── components/
│   ├── layout/             # Componentes de layout
│   └── ui/                 # Componentes UI reutilizables
├── features/
│   ├── dashboard/          # Módulo Dashboard
│   └── gestion-riesgos/    # Módulo Gestión de Riesgos
│       ├── api/            # API calls (RTK Query)
│       ├── pages/          # Páginas del módulo
│       ├── slices/         # Redux slices
│       └── types/          # TypeScript types
├── hooks/                  # Custom React hooks
└── utils/                  # Utilidades y constantes
```

## 🚀 Comandos Disponibles

```bash
# Desarrollo
pnpm dev

# Build para producción
pnpm build

# Preview del build
pnpm preview

# Linter
pnpm lint
```

## 🎯 Características

- ✅ Dashboard con estadísticas de riesgos
- ✅ Identificación de riesgos
- ✅ Evaluación con cálculos en tiempo real
- ✅ Mapa de riesgos 5x5
- ✅ Priorización y asignación de respuestas
- ✅ Gestión de normatividad (próximamente)

## 🔧 Tecnologías

- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Material-UI v7** - Componentes UI
- **Redux Toolkit** + **RTK Query** - Estado y API
- **React Router v7** - Enrutamiento

## 📝 Notas

- Los errores de conexión al backend (ERR_CONNECTION_REFUSED) son normales si no hay backend corriendo
- Los warnings de TypeScript sobre Grid son conocidos y no afectan la funcionalidad
- La aplicación está configurada para modo oscuro por defecto
