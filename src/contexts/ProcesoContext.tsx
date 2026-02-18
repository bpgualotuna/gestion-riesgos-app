/**
 * Proceso Context
 * Manages selected process state globally
 * Solo el usuario "Dueño del Proceso" puede gestionar procesos
 */

/* @refresh reset */
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import type { Proceso } from '../types';
import { AuthContext } from './AuthContext';
import { useGetProcesosQuery } from "../api/services/riesgosApi";
import { esUsuarioResponsableProceso } from '../hooks/useAsignaciones';

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
  // Usar AuthContext directamente - debe estar dentro de AuthProvider
  // Si no está disponible, usar valores por defecto
  const authContext = useContext(AuthContext);
  const esDueñoProcesos = authContext ? authContext.esDueñoProcesos : false;
  const user = authContext?.user;

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
      // Buscar el proceso en la lista actual (localStorage guarda strings)
      const storedProcesoIdNum = Number(storedProcesoId);
      const procesoEncontrado = procesos.find((p) => p.id === storedProcesoIdNum);
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

  // Verificar si el usuario puede gestionar procesos
  // Puede gestionar si:
  // 1. Tiene rol 'dueño_procesos' (o es Gerente General en modo proceso)
  // 2. O está en responsablesList del proceso seleccionado (incluso sin rol dueño_procesos)
  const puedeGestionarProcesos = useMemo(() => {
    // Si tiene el rol, puede gestionar todos sus procesos
    if (esDueñoProcesos) return true;
    
    // Si no tiene el rol pero está en responsablesList del proceso seleccionado, puede gestionar ese proceso
    if (procesoSeleccionado && user) {
      return esUsuarioResponsableProceso(procesoSeleccionado, user.id);
    }
    
    return false;
  }, [esDueñoProcesos, procesoSeleccionado, user]);

  const value: ProcesoContextType = {
    procesoSeleccionado,
    setProcesoSeleccionado,
    modoProceso,
    setModoProceso,
    iniciarModoEditar,
    iniciarModoVisualizar,
    isLoading,
    puedeGestionarProcesos, // Considera tanto el rol como si está en responsablesList
  };

  return <ProcesoContext.Provider value={value}>{children}</ProcesoContext.Provider>;
}

// Custom hook to use proceso context
export function useProceso() {
  const context = useContext(ProcesoContext);
  if (context === undefined) {
    // Retornar valores por defecto en lugar de lanzar error
    // Esto puede pasar durante el renderizado inicial antes de que el provider esté montado
    console.warn('useProceso called outside ProcesoProvider, using default values');
    return {
      procesoSeleccionado: null,
      setProcesoSeleccionado: () => { },
      modoProceso: null,
      setModoProceso: () => { },
      iniciarModoEditar: () => { },
      iniciarModoVisualizar: () => { },
      isLoading: true,
      puedeGestionarProcesos: false,
    };
  }
  return context;
}

