/**
 * Authentication Context
 * Manages user authentication state with hardcoded users
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// User roles
export type UserRole = 'admin' | 'manager' | 'analyst';

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
}

// Hardcoded users database
const USERS_DB: Array<User & { password: string }> = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@comware.com',
    fullName: 'Carlos Administrador',
    role: 'admin',
    department: 'Tecnología',
    position: 'Administrador del Sistema',
    phone: '+57 300 123 4567',
  },
  {
    id: '2',
    username: 'manager',
    password: 'manager123',
    email: 'manager@comware.com',
    fullName: 'María Gerente',
    role: 'manager',
    department: 'Talento Humano',
    position: 'Gerente de Riesgos',
    phone: '+57 301 234 5678',
  },
  {
    id: '3',
    username: 'analyst',
    password: 'analyst123',
    email: 'analyst@comware.com',
    fullName: 'Juan Analista',
    role: 'analyst',
    department: 'Talento Humano',
    position: 'Analista de Riesgos',
    phone: '+57 302 345 6789',
  },
];

// Auth context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
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
