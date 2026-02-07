/**
 * Hook para gestionar asignaciones de supervisores y responsables
 * Lee y escribe en localStorage (en producción vendría de la API)
 */

import { useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export interface AsignacionSupervisor {
  id: string;
  supervisorId: string;
  supervisorNombre?: string;
  tipoAsignacion: 'area' | 'proceso';
  areaId?: string;
  areaNombre?: string;
  procesoId?: string;
  procesoNombre?: string;
  activo: boolean;
}

export interface AsignacionResponsable {
  id: string;
  procesoId: string;
  procesoNombre?: string;
  responsableId: string;
  responsableNombre?: string;
  activo: boolean;
}

/**
 * Obtiene las asignaciones de responsables desde localStorage
 */
export function getAsignacionesResponsables(): AsignacionResponsable[] {
  const stored = localStorage.getItem('asignaciones_responsables');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Obtiene las asignaciones de supervisores desde localStorage
 */
export function getAsignacionesSupervisores(): AsignacionSupervisor[] {
  const stored = localStorage.getItem('asignaciones_supervisores');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Hook para obtener procesos asignados al usuario actual (dueño de proceso)
 */
export function useProcesosAsignados() {
  const { user } = useAuth();
  const asignaciones = useMemo(() => getAsignacionesResponsables(), []);

  const procesosAsignados = useMemo(() => {
    if (!user) return [];
    return asignaciones
      .filter((a) => a.responsableId === user.id && a.activo !== false)
      .map((a) => a.procesoId);
  }, [user, asignaciones]);

  return procesosAsignados;
}

/**
 * Hook para obtener áreas/procesos asignados al supervisor actual
 */
export function useAreasProcesosAsignados() {
  const { user } = useAuth();
  const asignaciones = useMemo(() => getAsignacionesSupervisores(), []);

  const areasAsignadas = useMemo(() => {
    if (!user) return [];
    return asignaciones
      .filter((a) => a.supervisorId === user.id && a.tipoAsignacion === 'area' && a.activo !== false)
      .map((a) => a.areaId)
      .filter((id): id is string => !!id);
  }, [user, asignaciones]);

  const procesosAsignados = useMemo(() => {
    if (!user) return [];
    return asignaciones
      .filter((a) => a.supervisorId === user.id && a.tipoAsignacion === 'proceso' && a.activo !== false)
      .map((a) => a.procesoId)
      .filter((id): id is string => !!id);
  }, [user, asignaciones]);

  return { areasAsignadas, procesosAsignados };
}

/**
 * Verifica si un proceso está asignado a un usuario
 */
export function isProcesoAsignadoAUsuario(procesoId: string, usuarioId: string): boolean {
  const asignaciones = getAsignacionesResponsables();
  return asignaciones.some(
    (a) => a.procesoId === procesoId && a.responsableId === usuarioId && a.activo !== false
  );
}

/**
 * Verifica si un área está asignada a un supervisor
 */
export function isAreaAsignadaASupervisor(areaId: string, supervisorId: string): boolean {
  const asignaciones = getAsignacionesSupervisores();
  return asignaciones.some(
    (a) => a.areaId === areaId && a.supervisorId === supervisorId && a.tipoAsignacion === 'area' && a.activo !== false
  );
}

/**
 * Verifica si un proceso está asignado a un supervisor
 */
export function isProcesoAsignadoASupervisor(procesoId: string, supervisorId: string): boolean {
  const asignaciones = getAsignacionesSupervisores();
  return asignaciones.some(
    (a) => a.procesoId === procesoId && a.supervisorId === supervisorId && a.tipoAsignacion === 'proceso' && a.activo !== false
  );
}

