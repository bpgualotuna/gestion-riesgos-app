/**
 * COMWARE Color Palette
 * Colores serios y profesionales sin gradientes
 */

export const colors = {
  // Colores Corporativos COMWARE (colores serios y profesionales)
  primary: {
    main: "#1976d2", // Azul profesional
    light: "#42a5f5",
    dark: "#1565c0",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#424242", // Gris oscuro profesional
    light: "#616161",
    dark: "#212121",
    contrastText: "#FFFFFF",
  },
  accent: {
    main: "#546e7a", // Gris azulado
    light: "#78909c",
    dark: "#37474f",
    contrastText: "#FFFFFF",
  },
  tertiary: {
    main: "#455a64", // Gris azulado oscuro
    light: "#607d8b",
    dark: "#263238",
    contrastText: "#FFFFFF",
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

  // Grises y Neutros (del logo: COM gris oscuro, WARE gris claro)
  grey: {
    50: "#f5f5f5",
    100: "#e8e8e8",
    200: "#d0d0d0",
    300: "#b8b8b8",
    400: "#a0a0a0",
    500: "#888888", // Gris medio
    600: "#707070", // Gris claro del logo (WARE)
    700: "#585858", // Gris oscuro del logo (COM)
    800: "#404040",
    900: "#1a1a1a", // Casi negro
  },

  // Fondos y Superficies (Fondo gris claro del logo)
  background: {
    default: "#E8E8E8", // Gris claro del fondo del logo
    paper: "#F5F5F5",
    elevated: "#FFFFFF",
    card: "#FFFFFF",
    sidebar: "#F0F0F0",
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

  // Texto (del logo: COM gris oscuro, WARE gris claro)
  text: {
    primary: "rgba(0, 0, 0, 0.87)", // Texto oscuro sobre fondo claro
    secondary: "rgba(0, 0, 0, 0.60)",
    disabled: "rgba(0, 0, 0, 0.38)",
    com: "#585858", // Gris oscuro del COM
    ware: "#707070", // Gris claro del WARE
  },

  // Divisores
  divider: "rgba(0, 0, 0, 0.12)",
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
