/**
 * COMWARE Color Palette
 * Extracted from Logo-colores.jpeg
 */

export const colors = {
  // Colores Corporativos COMWARE
  primary: {
    main: "#FF9500", // Naranja principal
    light: "#FFB84D",
    dark: "#CC7700",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#B8D900", // Verde-Amarillo
    light: "#D4F54D",
    dark: "#93AD00",
    contrastText: "#000000",
  },
  accent: {
    main: "#0080FF", // Azul
    light: "#4DA6FF",
    dark: "#0066CC",
    contrastText: "#FFFFFF",
  },

  // Gradiente Corporativo
  gradient: {
    main: "linear-gradient(135deg, #FF9500 0%, #B8D900 50%, #0080FF 100%)",
    horizontal: "linear-gradient(90deg, #FF9500 0%, #B8D900 50%, #0080FF 100%)",
    vertical: "linear-gradient(180deg, #FF9500 0%, #B8D900 50%, #0080FF 100%)",
  },

  // Niveles de Riesgo (Semáforo)
  risk: {
    critical: {
      main: "#d32f2f", // Rojo oscuro
      light: "#ef5350",
      dark: "#c62828",
      contrastText: "#FFFFFF",
    },
    high: {
      main: "#f57c00", // Naranja
      light: "#ff9800",
      dark: "#e65100",
      contrastText: "#FFFFFF",
    },
    medium: {
      main: "#fbc02d", // Amarillo
      light: "#fdd835",
      dark: "#f9a825",
      contrastText: "#000000",
    },
    low: {
      main: "#388e3c", // Verde
      light: "#4caf50",
      dark: "#2e7d32",
      contrastText: "#FFFFFF",
    },
  },

  // Grises y Neutros
  grey: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  // Fondos y Superficies (Dark Mode)
  background: {
    default: "#121212",
    paper: "#1e1e1e",
    elevated: "#2a2a2a",
  },

  // Estados
  success: {
    main: "#4caf50",
    light: "#81c784",
    dark: "#388e3c",
    contrastText: "#FFFFFF",
  },
  error: {
    main: "#f44336",
    light: "#e57373",
    dark: "#d32f2f",
    contrastText: "#FFFFFF",
  },
  warning: {
    main: "#ff9800",
    light: "#ffb74d",
    dark: "#f57c00",
    contrastText: "#000000",
  },
  info: {
    main: "#2196f3",
    light: "#64b5f6",
    dark: "#1976d2",
    contrastText: "#FFFFFF",
  },

  // Texto
  text: {
    primary: "rgba(255, 255, 255, 0.87)",
    secondary: "rgba(255, 255, 255, 0.60)",
    disabled: "rgba(255, 255, 255, 0.38)",
  },

  // Divisores
  divider: "rgba(255, 255, 255, 0.12)",
};

// Helper para obtener color de nivel de riesgo
export const getRiskColor = (nivel: string): string => {
  const nivelLower = nivel.toLowerCase();
  if (nivelLower.includes("crítico") || nivelLower.includes("critico")) {
    return colors.risk.critical.main;
  }
  if (nivelLower.includes("alto")) {
    return colors.risk.high.main;
  }
  if (nivelLower.includes("medio")) {
    return colors.risk.medium.main;
  }
  return colors.risk.low.main;
};

// Helper para obtener clase CSS de nivel de riesgo
export const getRiskClass = (nivel: string): string => {
  const nivelLower = nivel.toLowerCase();
  if (nivelLower.includes("crítico") || nivelLower.includes("critico")) {
    return "risk-critical";
  }
  if (nivelLower.includes("alto")) {
    return "risk-high";
  }
  if (nivelLower.includes("medio")) {
    return "risk-medium";
  }
  return "risk-low";
};
