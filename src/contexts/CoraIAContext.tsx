import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ScreenContext } from '../types/ia.types';

interface CoraIAContextType {
  screenContext: ScreenContext | null;
  setScreenContext: (context: ScreenContext | null) => void;
}

const CoraIAContext = createContext<CoraIAContextType | undefined>(undefined);

export function CoraIAProvider({ children }: { children: ReactNode }) {
  const [screenContext, setScreenContext] = useState<ScreenContext | null>(null);

  return (
    <CoraIAContext.Provider value={{ screenContext, setScreenContext }}>
      {children}
    </CoraIAContext.Provider>
  );
}

export function useCoraIAContext() {
  const context = useContext(CoraIAContext);
  if (!context) {
    throw new Error('useCoraIAContext debe usarse dentro de CoraIAProvider');
  }
  return context;
}
