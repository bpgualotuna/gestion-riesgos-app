/**
 * Proceso Context
 * Manages selected process state globally
 * Solo el usuario "Dueño del Proceso" puede gestionar procesos
 */

/* @refresh reset */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Proceso } from '../features/gestion-riesgos/types';
import { useAuth } from './AuthContext';
import { useGetProcesosQuery } from '../features/gestion-riesgos/api/riesgosApi';

export type ModoProceso = 'editar' | 'visualizar' | null;

interface ProcesoContextType {
  procesoSeleccionado: Proceso | null;
  setProcesoSeleccionado: (proceso: Proceso | null) => void;
  modoProceso: ModoProceso;
  setModoProceso: (modo: ModoProceso) => void;
  iniciarModoEditar: () => void;
  iniciarModoVisualizar: () => void;
  isLoading: boolean;
  puedeGestionarProcesos: boolean; // Solo el dueño del proceso puede gestionar
}

const ProcesoContext = createContext<ProcesoContextType | undefined>(undefined);

interface ProcesoProviderProps {
  children: ReactNode;
}

export function ProcesoProvider({ children }: ProcesoProviderProps) {
  // Usar useAuth de forma segura - debe estar dentro de AuthProvider
  const { esDueñoProcesos } = useAuth();
  const { data: procesos = [], isLoading: loadingProcesos } = useGetProcesosQuery();
  const [procesoSeleccionado, setProcesoSeleccionadoState] = useState<Proceso | null>(null);
  const [modoProceso, setModoProcesoState] = useState<ModoProceso>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar proceso seleccionado y modo del localStorage
  useEffect(() => {
    if (loadingProcesos) return;

    const storedProcesoId = localStorage.getItem('procesoSeleccionadoId');
    const storedModoProceso = localStorage.getItem('modoProceso') as ModoProceso;
    
    if (storedProcesoId && procesos.length > 0) {
      // Buscar el proceso en la lista actual
      const procesoEncontrado = procesos.find((p) => p.id === storedProcesoId);
      if (procesoEncontrado) {
        setProcesoSeleccionadoState(procesoEncontrado);
        localStorage.setItem(`proceso_${procesoEncontrado.id}`, JSON.stringify(procesoEncontrado));
        if (storedModoProceso) {
          setModoProcesoState(storedModoProceso);
        }
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  }, [loadingProcesos, procesos]);

  // Guardar proceso seleccionado en localStorage
  const setProcesoSeleccionado = (proceso: Proceso | null) => {
    setProcesoSeleccionadoState(proceso);
    if (proceso) {
      localStorage.setItem('procesoSeleccionadoId', proceso.id);
      localStorage.setItem(`proceso_${proceso.id}`, JSON.stringify(proceso));
      
      // Si el proceso está aprobado, forzar modo visualización
      if (proceso.estado === 'aprobado') {
        setModoProcesoState('visualizar');
        localStorage.setItem('modoProceso', 'visualizar');
      }
    } else {
      localStorage.removeItem('procesoSeleccionadoId');
      setModoProcesoState(null);
      localStorage.removeItem('modoProceso');
    }
  };

  const setModoProceso = (modo: ModoProceso) => {
    setModoProcesoState(modo);
    if (modo) {
      localStorage.setItem('modoProceso', modo);
    } else {
      localStorage.removeItem('modoProceso');
    }
  };

  const iniciarModoEditar = () => {
    // No permitir editar si el proceso está aprobado
    if (procesoSeleccionado?.estado === 'aprobado') {
      return; // No hacer nada si está aprobado
    }
    setModoProcesoState('editar');
    localStorage.setItem('modoProceso', 'editar');
  };

  const iniciarModoVisualizar = () => {
    setModoProcesoState('visualizar');
    localStorage.setItem('modoProceso', 'visualizar');
  };

  const value: ProcesoContextType = {
    procesoSeleccionado,
    setProcesoSeleccionado,
    modoProceso,
    setModoProceso,
    iniciarModoEditar,
    iniciarModoVisualizar,
    isLoading,
    puedeGestionarProcesos: esDueñoProcesos, // Solo el dueño del proceso puede gestionar
  };

  return <ProcesoContext.Provider value={value}>{children}</ProcesoContext.Provider>;
}

// Custom hook to use proceso context
export function useProceso() {
  const context = useContext(ProcesoContext);
  if (context === undefined) {
    // En lugar de lanzar error, retornar valores por defecto para evitar crashes durante la inicialización
    console.warn('useProceso must be used within a ProcesoProvider. Using default values.');
    return {
      procesoSeleccionado: null,
      setProcesoSeleccionado: () => {},
      modoProceso: null,
      setModoProceso: () => {},
      iniciarModoEditar: () => {},
      iniciarModoVisualizar: () => {},
      isLoading: false,
      puedeGestionarProcesos: false,
    };
  }
  return context;
}

