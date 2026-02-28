/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_TOKEN_KEY } from '../utils/constants';

// User roles - Solo 4 roles permitidos
export type UserRole = 'admin' | 'dueño_procesos' | 'gerente' | 'supervisor';
export type GerenteModo = 'dueño' | 'supervisor';

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
  gerenteMode?: GerenteModo | null; // Modo seleccionado por el gerente
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
  gerenteMode: GerenteModo | null;
  setGerenteMode: (mode: GerenteModo | null) => void;
  esGerente: boolean;
  esGerenteDueño: boolean;
  esGerenteSupervisor: boolean;
  esGerenteGeneralProceso: boolean; // Alias para esGerenteDueño (compatibilidad)
  esGerenteGeneralDirector: boolean; // Alias para esGerenteSupervisor (compatibilidad)
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gerenteMode, setGerenteModeState] = useState<GerenteModo | null>(null);

  // Restaurar sesión desde JWT al montar
  useEffect(() => {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const u: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role as UserRole,
          department: data.department,
          position: data.position,
          esDuenoProcesos: data.esDuenoProcesos,
        };
        setUser(u);
        if (u.role === 'gerente') setGerenteModeState(null);
      })
      .catch(() => sessionStorage.removeItem(AUTH_TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  // Si el backend responde 401 (token inválido/expirado), cerrar sesión
  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setGerenteModeState(null);
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const backendUser = data.user;
        if (data.token) sessionStorage.setItem(AUTH_TOKEN_KEY, data.token);

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
        if (contextUser.role === 'gerente') setGerenteModeState(null);
        return { success: true, user: contextUser };
      } else {
        return { success: false, error: data.error || 'Credenciales inválidas' };
      }
    } catch {
      return { success: false, error: 'Error de conexión con el servidor' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setGerenteModeState(null);
  };

  const setGerenteMode = (mode: GerenteModo | null) => {
    setGerenteModeState(mode);
  };

  const esGerente = user?.role === 'gerente';
  const esGerenteDueño = esGerente && gerenteMode === 'dueño';
  const esGerenteSupervisor = esGerente && gerenteMode === 'supervisor';

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    gerenteMode,
    setGerenteMode,
    esGerente,
    esGerenteDueño,
    esGerenteSupervisor,
    esGerenteGeneralProceso: esGerenteDueño, // Alias para compatibilidad
    esGerenteGeneralDirector: esGerenteSupervisor, // Alias para compatibilidad
    esDuenoProcesos: user?.role === 'dueño_procesos' || esGerenteDueño,
    esDueñoProcesos: user?.role === 'dueño_procesos' || esGerenteDueño,
    esAdmin: user?.role === 'admin',
    esSupervisorRiesgos: user?.role === 'supervisor' || esGerenteSupervisor,
    esDirectorProcesos: user?.role === 'supervisor' || esGerenteSupervisor,
    esAuditoria: false, // Ya no hay modo auditor
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
