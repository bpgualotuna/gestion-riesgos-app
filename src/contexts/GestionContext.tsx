/**
 * Gestion Context
 * Manages selected "gestión" (Gestión Estratégica, Gestión Comercial, etc.)
 * Filters processes by type and controls sidebar visibility
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useProcesosVisibles } from '../hooks/useAsignaciones';
import type { Proceso } from '../types';

export type TipoGestion = 'riesgos' | 'estrategica' | 'comercial' | 'talento' | 'tesoreria' | 'financiera' | 'administrativa' | 'nomina';

const GESTIONES_CONFIG: Record<TipoGestion, {
  label: string;
  color: string;
  tiposIncluidos: string[];
  ocultarItems: string[];
  mostrarItems?: string[];
  soloLectura?: boolean;
}> = {
  'riesgos': {
    label: 'Gestión de Riesgos',
    color: '#1976d2',
    tiposIncluidos: ['operacional', 'operativo', 'operacion'],
    ocultarItems: []
  },
  'estrategica': {
    label: 'Gestión Estratégica',
    color: '#d32f2f',
    tiposIncluidos: ['estratégico', 'estrategico', 'estrategia'],
    ocultarItems: ['Controles y Planes de Acción'],
    mostrarItems: ['Medidas de Administración'],
    soloLectura: true
  },
  'comercial': {
    label: 'Gestión Comercial',
    color: '#f57c00',
    tiposIncluidos: ['comercial'],
    ocultarItems: []
  },
  'talento': {
    label: 'Gestión de Talento Humano',
    color: '#c2185b',
    tiposIncluidos: ['talento humano', 'talento'],
    ocultarItems: []
  },
  'tesoreria': {
    label: 'Gestión de Tesorería',
    color: '#388e3c',
    tiposIncluidos: ['tesorería', 'tesoreria'],
    ocultarItems: []
  },
  'financiera': {
    label: 'Gestión Financiera',
    color: '#5e35b1',
    tiposIncluidos: ['financiera'],
    ocultarItems: []
  },
  'administrativa': {
    label: 'Gestión Administrativa',
    color: '#0097a7',
    tiposIncluidos: ['administrativa'],
    ocultarItems: []
  },
  'nomina': {
    label: 'Gestión de Nómina',
    color: '#7b1fa2',
    tiposIncluidos: ['nómina', 'nomina'],
    ocultarItems: []
  }
};

interface GestionContextType {
  gestionSeleccionada: TipoGestion;
  setGestionSeleccionada: (gestion: TipoGestion) => void;
  procesosEnGestion: Proceso[];
  debeOcultarControlesYPlanes: boolean;
  debeOcultarMaterializarRiesgos: boolean;
  debeMostrarMedidasAdministracion: boolean;
  gestionesDisponibles: TipoGestion[];
  obtenerConfigGestion: (gestion: TipoGestion) => typeof GESTIONES_CONFIG[TipoGestion];
}

const GestionContext = createContext<GestionContextType | undefined>(undefined);

interface GestionProviderProps {
  children: ReactNode;
}

export function GestionProvider({ children }: GestionProviderProps) {
  const { esAdmin } = useAuth();
  const { procesosVisibles } = useProcesosVisibles();
  
  const [gestionSeleccionada, setGestionSeleccionadaState] = useState<TipoGestion>(() => {
    if (esAdmin) return 'riesgos';
    const stored = localStorage.getItem('gestionSeleccionada');
    return (stored as TipoGestion) || 'riesgos';
  });

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem('gestionSeleccionada', gestionSeleccionada);
  }, [gestionSeleccionada]);

  // Filtrar procesos por gestión
  const procesosEnGestion = useMemo(() => {
    const config = GESTIONES_CONFIG[gestionSeleccionada];
    if (!config) return procesosVisibles;

    return procesosVisibles.filter(p => {
      const tipo = (p.tipo || '').toLowerCase();
      return config.tiposIncluidos.some(t => tipo.includes(t));
    });
  }, [procesosVisibles, gestionSeleccionada]);

  // Gestiones disponibles (que tienen procesos, o al menos 'riesgos' por defecto)
  const gestionesDisponibles = useMemo(() => {
    const disponibles: TipoGestion[] = [];
    
    for (const [gestion, config] of Object.entries(GESTIONES_CONFIG)) {
      const tieneProc = procesosVisibles.some(p => {
        const tipo = (p.tipo || '').toLowerCase();
        return config.tiposIncluidos.some(t => tipo.includes(t));
      });
      if (tieneProc) {
        disponibles.push(gestion as TipoGestion);
      }
    }
    
    // Siempre incluir 'riesgos' como opción por defecto
    if (!disponibles.includes('riesgos')) {
      disponibles.push('riesgos');
    }
    
    return disponibles;
  }, [procesosVisibles]);

  // DESHABILITADO: Esta validación interfiere con la selección manual de gestión
  // cuando un proceso es seleccionado. El hook useSyncProcesoToGestion establece
  // la gestión basándose en el tipo del proceso, pero esta validación la resetea
  // si no hay otros procesos de ese tipo visibles.
  /*
  useEffect(() => {
    if (!gestionesDisponibles.includes(gestionSeleccionada)) {
      if (gestionesDisponibles.length > 0) {
        setGestionSeleccionadaState(gestionesDisponibles[0]);
      } else {
        setGestionSeleccionadaState('riesgos');
      }
    }
  }, [gestionesDisponibles, gestionSeleccionada]);
  */

  const debeOcultarControlesYPlanes = GESTIONES_CONFIG[gestionSeleccionada]?.ocultarItems.includes('Controles y Planes de Acción') || false;
  const debeOcultarMaterializarRiesgos = GESTIONES_CONFIG[gestionSeleccionada]?.ocultarItems.includes('Materializar Riesgos') || false;
  const debeMostrarMedidasAdministracion = GESTIONES_CONFIG[gestionSeleccionada]?.mostrarItems?.includes('Medidas de Administración') || false;

  const value: GestionContextType = {
    gestionSeleccionada,
    setGestionSeleccionada: setGestionSeleccionadaState,
    procesosEnGestion,
    debeOcultarControlesYPlanes,
    debeOcultarMaterializarRiesgos,
    debeMostrarMedidasAdministracion,
    gestionesDisponibles,
    obtenerConfigGestion: (gestion: TipoGestion) => GESTIONES_CONFIG[gestion]
  };

  return (
    <GestionContext.Provider value={value}>
      {children}
    </GestionContext.Provider>
  );
}

export function useGestion() {
  const context = useContext(GestionContext);
  if (!context) {
    throw new Error('useGestion must be used within GestionProvider');
  }
  return context;
}
