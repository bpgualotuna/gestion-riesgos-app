/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// User roles
export type UserRole = 'admin' | 'manager' | 'analyst' | 'dueño_procesos' | 'supervisor_riesgos' | 'auditoria';

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
  esDueñoProcesos?: boolean; // Indica si es dueño de procesos
}

// Hardcoded users database
const USERS_DB: Array<User & { password: string }> = [
  {
    id: '1',
    username: 'dueño_procesos',
    password: 'dueño123',
    email: 'katherine.chavez@comware.com',
    fullName: 'Katherine Chávez',
    role: 'dueño_procesos',
    department: 'Gestión de Procesos',
    position: 'Dueño de Procesos',
    phone: '+57 300 123 4567',
    esDueñoProcesos: true,
  },
  {
    id: '2',
    username: 'manager',
    password: 'manager123',
    email: 'maria.gonzalez@comware.com',
    fullName: 'María González',
    role: 'manager',
    department: 'Talento Humano',
    position: 'Gerente de Riesgos',
    phone: '+57 301 234 5678',
  },
  {
    id: '3',
    username: 'analyst',
    password: 'analyst123',
    email: 'juan.perez@comware.com',
    fullName: 'Juan Pérez',
    role: 'analyst',
    department: 'Talento Humano',
    position: 'Analista de Riesgos',
    phone: '+57 302 345 6789',
  },
  {
    id: '4',
    username: 'admin',
    password: 'admin123',
    email: 'andres.martinez@comware.com',
    fullName: 'Andrés Martínez',
    role: 'admin',
    department: 'TI',
    position: 'Administrador',
    phone: '+57 303 456 7890',
  },
  {
    id: '5',
    username: 'supervisor',
    password: 'supervisor123',
    email: 'carlos.rodriguez@comware.com',
    fullName: 'Carlos Rodríguez',
    role: 'supervisor_riesgos',
    department: 'Gestión Financiera y Administrativa',
    position: 'Supervisor de Riesgos',
    phone: '+57 304 567 8901',
  },
];

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  esDueñoProcesos: boolean; // Helper para verificar si es dueño de procesos
  esAdmin: boolean; // Helper para verificar si es admin
  esSupervisorRiesgos: boolean; // Helper para verificar si es supervisor de riesgos
  esAuditoria: boolean; // Helper para verificar si es auditoría
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = USERS_DB.find(
      u => u.username === username && u.password === password
    );

    if (foundUser) {
      // Remove password from user object
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
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
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
    esDueñoProcesos: user?.esDueñoProcesos === true || user?.role === 'dueño_procesos',
    esAdmin: user?.role === 'admin',
    esSupervisorRiesgos: user?.role === 'supervisor_riesgos',
    esAuditoria: user?.role === 'auditoria',
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
