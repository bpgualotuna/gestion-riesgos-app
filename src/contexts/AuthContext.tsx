/**
 * Authentication Context
 * Manages user authentication state - usuarios desde API
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { API_BASE_URL } from '../utils/constants';
export type UserRole = 'admin' | 'dueño_procesos' | 'dueno_procesos' | 'supervisor' | 'gerente_general';
export type GerenteGeneralModo = 'director' | 'proceso';

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  avatar?: string;
  phone?: string;
  position: string;
  esDuenoProcesos?: boolean; // Indica si es dueño de procesos
}


// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  gerenteGeneralMode: GerenteGeneralModo | null;
  setGerenteGeneralMode: (mode: GerenteGeneralModo | null) => void;
  esGerenteGeneral: boolean;
  esGerenteGeneralDirector: boolean;
  esGerenteGeneralProceso: boolean;
  esDuenoProcesos: boolean; // Helper para verificar si es dueño de procesos
  esDueñoProcesos: boolean; // Alias for compatibility
  esAdmin: boolean; // Helper para verificar si es admin
  esSupervisorRiesgos: boolean; // Helper para verificar si es supervisor de riesgos
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [gerenteGeneralMode, setGerenteGeneralModeState] = useState<GerenteGeneralModo | null>(() => {
    const storedMode = localStorage.getItem('gerenteGeneralMode');
    if (storedMode === 'director' || storedMode === 'proceso') {
      return storedMode;
    }
    return null;
  });

  // Login function - usa endpoint POST /api/auth/login
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { success: false, error: data.error || 'Usuario o contraseña incorrectos' };
      }

      const apiUser = data.user;
      if (!apiUser) {
        return { success: false, error: 'Error en la respuesta del servidor' };
      }

      const roleNormalized = apiUser.role === 'dueno_procesos' ? 'dueño_procesos' : apiUser.role;
      const contextUser: User = {
        id: String(apiUser.id),
        username: apiUser.username || apiUser.fullName,
        email: apiUser.email || '',
        fullName: apiUser.fullName || apiUser.nombre,
        role: roleNormalized as UserRole,
        department: apiUser.department || 'General',
        position: apiUser.position || apiUser.role || 'Usuario',
        esDuenoProcesos: roleNormalized === 'dueño_procesos',
      };
      setUser(contextUser);
      localStorage.setItem('currentUser', JSON.stringify(contextUser));
      if (contextUser.role === 'gerente_general') {
        setGerenteGeneralModeState(null);
        localStorage.removeItem('gerenteGeneralMode');
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Error al conectar con el servidor' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('gerenteGeneralMode');
    setGerenteGeneralModeState(null);
  };

  const setGerenteGeneralMode = (mode: GerenteGeneralModo | null) => {
    setGerenteGeneralModeState(mode);
    if (mode) {
      localStorage.setItem('gerenteGeneralMode', mode);
    } else {
      localStorage.removeItem('gerenteGeneralMode');
    }
  };

  const esGerenteGeneral = user?.role === 'gerente_general';
  const esGerenteGeneralDirector = esGerenteGeneral && gerenteGeneralMode === 'director';
  const esGerenteGeneralProceso = esGerenteGeneral && gerenteGeneralMode === 'proceso';

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    gerenteGeneralMode,
    setGerenteGeneralMode,
    esGerenteGeneral,
    esGerenteGeneralDirector,
    esGerenteGeneralProceso,
    esDuenoProcesos: user?.role === 'dueño_procesos' || esGerenteGeneralProceso,
    esDueñoProcesos: user?.role === 'dueño_procesos' || esGerenteGeneralProceso,
    esAdmin: user?.role === 'admin',
    esSupervisorRiesgos: user?.role === 'supervisor' || esGerenteGeneralDirector,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
