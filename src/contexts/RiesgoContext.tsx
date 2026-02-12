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

  // No más persistencia de riesgos en localStorage: los riesgos deben venir siempre de la API.
  // Mantener solo estado en memoria para selección/edición durante la sesión.

  // Inicializar sin leer localStorage
  useEffect(() => {
    setRiesgoSeleccionadoState(null);
    setModoState(null);
  }, []);

  const setRiesgoSeleccionado = (riesgo: Riesgo | null) => {
    setRiesgoSeleccionadoState(riesgo);
  };

  const setModo = (nuevoModo: ModoRiesgo) => {
    setModoState(nuevoModo);
  };

  const iniciarNuevo = () => {
    setRiesgoSeleccionadoState(null);
    setModoState('nuevo');
  };

  const iniciarVer = (riesgo: Riesgo) => {
    setRiesgoSeleccionadoState(riesgo);
    setModoState('ver');
  };

  const iniciarEditar = (riesgo: Riesgo) => {
    setRiesgoSeleccionadoState(riesgo);
    setModoState('editar');
  };

  const limpiar = () => {
    setRiesgoSeleccionadoState(null);
    setModoState(null);
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

