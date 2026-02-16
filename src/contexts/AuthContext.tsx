/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// User roles
export type UserRole = 'admin' | 'dueño_procesos' | 'supervisor' | 'gerente_general';
export type GerenteGeneralModo = 'director' | 'proceso';

// User interface
export interface User {
  id: number | string;
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

// Hardcoded users database removed in favor of mockData
// const USERS_DB = ...

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
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
  esDirectorProcesos: boolean; // Alias for supervisor de riesgos
  esAuditoria: boolean; // Helper para verificar si es auditor
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gerenteGeneralMode, setGerenteGeneralModeState] = useState<GerenteGeneralModo | null>(null);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const backendUser = data.user;

        // Map backend user to context User format
        const contextUser: User = {
          id: backendUser.id,
          username: backendUser.username,
          email: backendUser.email,
          fullName: backendUser.fullName,
          role: backendUser.role as UserRole,
          department: backendUser.department,
          position: backendUser.position,
          esDuenoProcesos: backendUser.esDuenoProcesos,
        };

        setUser(contextUser);
        if (contextUser.role === 'gerente_general') {
          setGerenteGeneralModeState(null);
        }
        return { success: true, user: contextUser };
      } else {
        return { success: false, error: data.error || 'Credenciales inválidas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setGerenteGeneralModeState(null);
  };

  const setGerenteGeneralMode = (mode: GerenteGeneralModo | null) => {
    setGerenteGeneralModeState(mode);
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
    esDirectorProcesos: user?.role === 'supervisor' || esGerenteGeneralDirector,
    esAuditoria: user?.role === 'gerente_general' && !gerenteGeneralMode, // Por ahora el GG en modo vista es lo más cercano a auditor
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
