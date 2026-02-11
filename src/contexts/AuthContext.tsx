/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMockUsuarios } from '../api/services/mockData';
// User roles matching mockData
export type UserRole = 'admin' | 'dueño_procesos' | 'supervisor' | 'gerente_general';
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

// Hardcoded users database removed in favor of mockData
// const USERS_DB = ...

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
  esDirectorProcesos: boolean; // Alias for supervisor de riesgos
  esAuditoria: boolean; // Helper para verificar si es auditor
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

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Obtener usuarios frescos del mockData (que puede venir de localStorage)
    const currentUsers = getMockUsuarios();

    // Buscar usuario por username (o email para compatibilidad) y contraseña
    const foundUser = currentUsers.find(
      u => (u.email?.split('@')[0] === username || u.role === username) && u.password === password
    );

    if (foundUser) {
      // Map mockUser to Context User format if needed, though they are similar
      const contextUser: User = {
        id: foundUser.id,
        username: foundUser.role || foundUser.nombre, // Fallback
        email: foundUser.email || '',
        fullName: foundUser.nombre,
        role: foundUser.role as UserRole, // Cast assuming roles match
        department: foundUser.cargoNombre || 'General', // Map cargo to department/position
        position: foundUser.cargoNombre || foundUser.role || 'Usuario',
        esDuenoProcesos: foundUser.role === 'dueño_procesos',
      };

      setUser(contextUser);
      localStorage.setItem('currentUser', JSON.stringify(contextUser));
      if (contextUser.role === 'gerente_general') {
        setGerenteGeneralModeState(null);
        localStorage.removeItem('gerenteGeneralMode');
      }
      return { success: true };
    }

    return {
      success: false,
      error: 'Usuario o contraseña incorrectos'
    };
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
