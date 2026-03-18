/**
 * Proceso Context
 * Manages selected process state globally
 * Solo el usuario "Dueño del Proceso" puede gestionar procesos
 */

/* @refresh reset */
import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
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
  const storagePrefix = useMemo(() => `proceso_ctx_${String(user?.id ?? 'anon')}`, [user?.id]);
  const scopedProcesoIdKey = `${storagePrefix}:procesoSeleccionadoId`;
  const scopedModoKey = `${storagePrefix}:modoProceso`;

  // Cargar proceso seleccionado y modo del localStorage
  useEffect(() => {
    if (loadingProcesos) return;

    const storedProcesoId =
      localStorage.getItem(scopedProcesoIdKey) ?? localStorage.getItem('procesoSeleccionadoId');
    const storedModoProceso =
      (localStorage.getItem(scopedModoKey) ?? localStorage.getItem('modoProceso')) as ModoProceso;

    if (storedProcesoId && procesos.length > 0) {
      // Buscar el proceso en la lista actual (localStorage guarda strings)
      const storedProcesoIdNum = Number(storedProcesoId);
      const procesoEncontrado = procesos.find((p) => p.id === storedProcesoIdNum);
      if (procesoEncontrado) {
        setProcesoSeleccionadoState(procesoEncontrado);
        localStorage.setItem(`proceso_${procesoEncontrado.id}`, JSON.stringify(procesoEncontrado));
        localStorage.setItem(scopedProcesoIdKey, String(procesoEncontrado.id));
        localStorage.removeItem('procesoSeleccionadoId');
        if (storedModoProceso) {
          setModoProcesoState(storedModoProceso);
          localStorage.setItem(scopedModoKey, storedModoProceso);
          localStorage.removeItem('modoProceso');
        }
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
  }, [loadingProcesos, procesos, scopedModoKey, scopedProcesoIdKey]);

  const setProcesoSeleccionado = useCallback((proceso: Proceso | null) => {
    setProcesoSeleccionadoState(proceso);
    if (proceso) {
      localStorage.setItem(scopedProcesoIdKey, String(proceso.id));
      localStorage.setItem(`proceso_${proceso.id}`, JSON.stringify(proceso));
      if (proceso.estado === 'aprobado') {
        setModoProcesoState('visualizar');
        localStorage.setItem(scopedModoKey, 'visualizar');
      }
    } else {
      localStorage.removeItem(scopedProcesoIdKey);
      setModoProcesoState(null);
      localStorage.removeItem(scopedModoKey);
    }
  }, [scopedModoKey, scopedProcesoIdKey]);

  const setModoProceso = useCallback((modo: ModoProceso) => {
    setModoProcesoState(modo);
    if (modo) localStorage.setItem(scopedModoKey, modo);
    else localStorage.removeItem(scopedModoKey);
  }, [scopedModoKey]);

  const iniciarModoEditar = useCallback(() => {
    if (procesoSeleccionado?.estado === 'aprobado') return;
    setModoProcesoState('editar');
    localStorage.setItem(scopedModoKey, 'editar');
  }, [procesoSeleccionado?.estado, scopedModoKey]);

  const iniciarModoVisualizar = useCallback(() => {
    setModoProcesoState('visualizar');
    localStorage.setItem(scopedModoKey, 'visualizar');
  }, [scopedModoKey]);

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

  const value = useMemo<ProcesoContextType>(
    () => ({
      procesoSeleccionado,
      setProcesoSeleccionado,
      modoProceso,
      setModoProceso,
      iniciarModoEditar,
      iniciarModoVisualizar,
      isLoading,
      puedeGestionarProcesos,
    }),
    [
      procesoSeleccionado,
      modoProceso,
      isLoading,
      puedeGestionarProcesos,
      setProcesoSeleccionado,
      setModoProceso,
      iniciarModoEditar,
      iniciarModoVisualizar,
    ]
  );

  return <ProcesoContext.Provider value={value}>{children}</ProcesoContext.Provider>;
}

// Custom hook to use proceso context
export function useProceso() {
  const context = useContext(ProcesoContext);
  if (context === undefined) {
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

