/**
 * Riesgo Context
 * Manages selected risk state and edit mode globally
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Riesgo } from '../features/gestion-riesgos/types';

export type ModoRiesgo = 'nuevo' | 'ver' | 'editar' | null;

interface RiesgoContextType {
  riesgoSeleccionado: Riesgo | null;
  setRiesgoSeleccionado: (riesgo: Riesgo | null) => void;
  modo: ModoRiesgo;
  setModo: (modo: ModoRiesgo) => void;
  iniciarNuevo: () => void;
  iniciarVer: (riesgo: Riesgo) => void;
  iniciarEditar: (riesgo: Riesgo) => void;
  limpiar: () => void;
}

const RiesgoContext = createContext<RiesgoContextType | undefined>(undefined);

interface RiesgoProviderProps {
  children: ReactNode;
}

export function RiesgoProvider({ children }: RiesgoProviderProps) {
  const [riesgoSeleccionado, setRiesgoSeleccionadoState] = useState<Riesgo | null>(null);
  const [modo, setModoState] = useState<ModoRiesgo>(null);

  // Cargar riesgo seleccionado del localStorage al iniciar
  useEffect(() => {
    const storedRiesgoId = localStorage.getItem('riesgoSeleccionadoId');
    const storedModo = localStorage.getItem('riesgoModo') as ModoRiesgo;
    
    if (storedRiesgoId && storedModo) {
      const storedRiesgo = localStorage.getItem(`riesgo_${storedRiesgoId}`);
      if (storedRiesgo) {
        try {
          setRiesgoSeleccionadoState(JSON.parse(storedRiesgo));
          setModoState(storedModo);
        } catch (error) {
          console.error('Error parsing stored riesgo:', error);
          localStorage.removeItem('riesgoSeleccionadoId');
          localStorage.removeItem('riesgoModo');
        }
      }
    }
  }, []);

  const setRiesgoSeleccionado = (riesgo: Riesgo | null) => {
    setRiesgoSeleccionadoState(riesgo);
    if (riesgo) {
      localStorage.setItem('riesgoSeleccionadoId', riesgo.id);
      localStorage.setItem(`riesgo_${riesgo.id}`, JSON.stringify(riesgo));
    } else {
      localStorage.removeItem('riesgoSeleccionadoId');
    }
  };

  const setModo = (nuevoModo: ModoRiesgo) => {
    setModoState(nuevoModo);
    if (nuevoModo) {
      localStorage.setItem('riesgoModo', nuevoModo);
    } else {
      localStorage.removeItem('riesgoModo');
    }
  };

  const iniciarNuevo = () => {
    setRiesgoSeleccionadoState(null);
    setModoState('nuevo');
    localStorage.removeItem('riesgoSeleccionadoId');
    localStorage.setItem('riesgoModo', 'nuevo');
  };

  const iniciarVer = (riesgo: Riesgo) => {
    setRiesgoSeleccionadoState(riesgo);
    setModoState('ver');
    localStorage.setItem('riesgoSeleccionadoId', riesgo.id);
    localStorage.setItem(`riesgo_${riesgo.id}`, JSON.stringify(riesgo));
    localStorage.setItem('riesgoModo', 'ver');
  };

  const iniciarEditar = (riesgo: Riesgo) => {
    setRiesgoSeleccionadoState(riesgo);
    setModoState('editar');
    localStorage.setItem('riesgoSeleccionadoId', riesgo.id);
    localStorage.setItem(`riesgo_${riesgo.id}`, JSON.stringify(riesgo));
    localStorage.setItem('riesgoModo', 'editar');
  };

  const limpiar = () => {
    setRiesgoSeleccionadoState(null);
    setModoState(null);
    localStorage.removeItem('riesgoSeleccionadoId');
    localStorage.removeItem('riesgoModo');
  };

  const value: RiesgoContextType = {
    riesgoSeleccionado,
    setRiesgoSeleccionado,
    modo,
    setModo,
    iniciarNuevo,
    iniciarVer,
    iniciarEditar,
    limpiar,
  };

  return <RiesgoContext.Provider value={value}>{children}</RiesgoContext.Provider>;
}

// Custom hook to use riesgo context
export function useRiesgo() {
  const context = useContext(RiesgoContext);
  if (context === undefined) {
    throw new Error('useRiesgo must be used within a RiesgoProvider');
  }
  return context;
}

