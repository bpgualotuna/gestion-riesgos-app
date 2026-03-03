/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AUTH_TOKEN_KEY } from '../utils/constants';

// User roles - Solo 4 roles permitidos
export type UserRole = 'admin' | 'dueño_procesos' | 'gerente' | 'supervisor';
export type GerenteModo = 'dueño' | 'supervisor';
export type GerenteGeneralMode = 'director' | 'proceso'; // director = supervisor, proceso = dueño

// Ambito del rol: SISTEMA = admin/configuración; OPERATIVO = riesgos, controles, planes
export type AmbitoRol = 'SISTEMA' | 'OPERATIVO';

// User interface
export interface User {
  id: number | string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: string;
  avatar?: string;
  fotoPerfil?: string | null;
  phone?: string;
  position: string;
  esDuenoProcesos?: boolean;
  gerenteMode?: GerenteModo | null;
  ambito?: AmbitoRol;
  puedeVisualizar?: boolean;
  puedeEditar?: boolean;
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
  esAdmin: boolean; // Helper: ambito SISTEMA → ver panel administración
  ambito: AmbitoRol; // SISTEMA | OPERATIVO
  puedeVisualizar: boolean; // Permiso del rol (visualizar)
  puedeEditar: boolean; // Permiso del rol (editar)
  esSupervisorRiesgos: boolean; // Helper para verificar si es supervisor de riesgos
  esDirectorProcesos: boolean;
  esAuditoria: boolean;
  esGerenteGeneral: boolean;
  gerenteGeneralMode: GerenteGeneralMode | null;
  setGerenteGeneralMode: (mode: GerenteGeneralMode | null) => void;
  refreshUser: (updatedUserFromApi?: Record<string, unknown> | null) => Promise<void>;
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
          fotoPerfil: data.fotoPerfil ?? null,
          ambito: data.ambito === 'SISTEMA' || data.ambito === 'OPERATIVO' ? data.ambito : 'OPERATIVO',
          puedeVisualizar: data.puedeVisualizar !== false,
          puedeEditar: data.puedeEditar === true,
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
          fotoPerfil: backendUser.fotoPerfil ?? null,
          ambito: backendUser.ambito === 'SISTEMA' || backendUser.ambito === 'OPERATIVO' ? backendUser.ambito : 'OPERATIVO',
          puedeVisualizar: backendUser.puedeVisualizar !== false,
          puedeEditar: backendUser.puedeEditar === true,
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

  const esGerente = user?.role === 'gerente' || user?.role === 'gerente_general';
  const gerenteGeneralMode: GerenteGeneralMode | null = gerenteMode === 'supervisor' ? 'director' : gerenteMode === 'dueño' ? 'proceso' : null;
  const setGerenteGeneralMode = (mode: GerenteGeneralMode | null) => {
    setGerenteModeState(mode === 'director' ? 'supervisor' : mode === 'proceso' ? 'dueño' : null);
  };

  const refreshUser = async (updatedUserFromApi?: Record<string, unknown> | null) => {
    if (updatedUserFromApi && user) {
      setUser({
        ...user,
        fullName: (updatedUserFromApi.fullName as string) ?? user.fullName,
        fotoPerfil: updatedUserFromApi.fotoPerfil !== undefined ? (updatedUserFromApi.fotoPerfil as string | null) : user.fotoPerfil,
      });
      return;
    }
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token || !user) return;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role as UserRole,
        department: data.department,
        position: data.position,
        esDuenoProcesos: data.esDuenoProcesos,
        fotoPerfil: data.fotoPerfil ?? null,
        ambito: data.ambito === 'SISTEMA' || data.ambito === 'OPERATIVO' ? data.ambito : 'OPERATIVO',
        puedeVisualizar: data.puedeVisualizar !== false,
        puedeEditar: data.puedeEditar === true,
      });
    } catch {
      // ignore
    }
  };
  const esGerenteDueño = esGerente && gerenteMode === 'dueño';
  const esGerenteSupervisor = esGerente && gerenteMode === 'supervisor';

  // Admin = ver panel Administración (ambito SISTEMA). Compat: si no hay ambito, role === 'admin'
  const esAmbitoSistema = user?.ambito === 'SISTEMA';
  const esAdmin = esAmbitoSistema || (user?.ambito == null && user?.role === 'admin');

  // Normalizar roles extendidos (ej: supervisor_auditor, dueño_procesos_xxx)
  const esRolSupervisorBase =
    user?.role === 'supervisor' || (typeof user?.role === 'string' && user.role.startsWith('supervisor'));
  const esRolDuenoBase =
    user?.role === 'dueño_procesos' ||
    (typeof user?.role === 'string' && user.role.startsWith('dueño_procesos'));

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
    esDuenoProcesos: esRolDuenoBase || esGerenteDueño,
    esDueñoProcesos: esRolDuenoBase || esGerenteDueño,
    esAdmin,
    ambito: user?.ambito ?? 'OPERATIVO',
    puedeVisualizar: user?.puedeVisualizar !== false,
    puedeEditar: user?.puedeEditar === true,
    esSupervisorRiesgos: esRolSupervisorBase || esGerenteSupervisor,
    esDirectorProcesos: esRolSupervisorBase || esGerenteSupervisor,
    esAuditoria: false,
    esGerenteGeneral: esGerente,
    gerenteGeneralMode,
    setGerenteGeneralMode,
    refreshUser,
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
