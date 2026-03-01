
import '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Palette {
        brand: {
            lime: string;
            orange: string;
            blue: string;
            blueDark: string;
        };
        sidebar: {
            mainMenu: Record<string, string>;
            submenu: string[];
        };
    }
    interface PaletteOptions {
        brand?: {
            lime?: string;
            orange?: string;
            blue?: string;
            blueDark?: string;
        };
        sidebar?: {
            mainMenu?: Record<string, string>;
            submenu?: string[];
        };
    }
    interface TypeBackground {
        sidebar: string;
        elevated: string;
        card: string;
    }
}
