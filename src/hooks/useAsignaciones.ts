import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProceso } from '../contexts/ProcesoContext';
import { Proceso } from '../types';
import { useGetProcesosQuery } from '../api/services/riesgosApi';

/** Indica si un proceso es de tipo gerencial (para vistas de Gerente General) */
export function isProcesoGerencial(p: { tipoProceso?: string } | null): boolean {
  if (!p?.tipoProceso) return false;
  const t = (p.tipoProceso || '').toLowerCase();
  return t.includes('gerencial') || t.includes('gerencia') || t.includes('01 estratégico');
}

type ProcesoItem = {
    id: string | number;
    areaId?: string | number;
    responsableId?: string | number;
    responsablesList?: Array<{ id: number; nombre: string; role?: string; modo?: 'director' | 'proceso' | null }>;
};

// Helper para verificar si un usuario es responsable de un proceso (independiente del modo)
export const esUsuarioResponsableProceso = (proceso: Proceso | ProcesoItem | any, userId?: string | number): boolean => {
    if (!userId || !proceso) return false;
    const userIdNum = Number(userId);

    // Compatibilidad con modelo antiguo: campo responsableId
    if (proceso.responsableId && Number(proceso.responsableId) === userIdNum) {
        return true;
    }

    // Nuevo modelo: lista de responsables (`responsablesList` proveniente del backend)
    if (proceso.responsablesList && Array.isArray(proceso.responsablesList)) {
        return proceso.responsablesList.some((r: any) => Number(r.id) === userIdNum);
    }

    return false;
};

// Hook centralizado: obtiene las áreas y procesos asignados usando los datos REALES del backend
// ya no depende de localStorage ni de catálogos legacy.
export const useAreasProcesosAsignados = () => {
    const { user, esGerenteGeneralDirector, esGerenteDueño, esSupervisorRiesgos, esDueñoProcesos } = useAuth();
    const { data: procesosApi = [], isLoading } = useGetProcesosQuery();

    if (!user) {
        return { areas: [] as string[], procesos: [] as string[], loading: isLoading };
    }

    const userIdNum = Number(user.id);
    const procesos: ProcesoItem[] = procesosApi as any[];

    const getAreaIdsFromProcesos = (procs: ProcesoItem[]): string[] => {
        const set = new Set<string>();
        procs.forEach((p) => {
            if (p.areaId !== undefined && p.areaId !== null) {
                set.add(String(p.areaId));
            }
        });
        return Array.from(set);
    };

    let procesosAsignados: ProcesoItem[] = [];

    // 1) Gerente en Modo Director (Supervisor): ver procesos donde es responsable con modo 'director'
    if (esGerenteGeneralDirector) {
        procesosAsignados = procesos.filter((p: any) =>
            (p.responsablesList || []).some(
                (r: any) =>
                    Number(r.id) === userIdNum &&
                    r.modo === 'director'
            )
        );
    }
    // 2) Gerente en Modo Dueño de Proceso: ver procesos donde es responsable con modo 'proceso'
    else if (esGerenteDueño) {
        procesosAsignados = procesos.filter((p: any) =>
            (p.responsablesList || []).some(
                (r: any) =>
                    Number(r.id) === userIdNum &&
                    r.modo === 'proceso'
            )
        );
    }
    // 3) Supervisor de Riesgos: procesos donde es director o responsable (igual que el selector del header)
    else if (esSupervisorRiesgos) {
        procesosAsignados = procesos.filter((p: any) =>
            Number(p.directorId) === userIdNum || esUsuarioResponsableProceso(p, userIdNum)
        );
    }
    // 4) Dueño de Proceso: misma lógica que el selector (responsableId o responsablesList)
    else if (esDueñoProcesos) {
        procesosAsignados = procesos.filter((p) => esUsuarioResponsableProceso(p, userIdNum));
    } else {
        // Otros roles (admin, etc.) no usan este hook para restringir vistas
        return { areas: [] as string[], procesos: [] as string[], loading: isLoading };
    }

    const procesoIds = procesosAsignados.map((p) => String(p.id));
    const areaIds = getAreaIdsFromProcesos(procesosAsignados);

    return {
        areas: areaIds,
        procesos: procesoIds,
        loading: isLoading,
    };
};

// Helpers legacy: se mantienen por compatibilidad, pero ahora delegan en esUsuarioResponsableProceso
// y en los procesos que vienen del backend cuando sea necesario. En la práctica, casi no se usan.
export const isProcesoAsignadoASupervisor = (procesoId: string, supervisorId?: string) => {
    // Esta función ya casi no se usa; se mantiene solo para compatibilidad.
    // Siempre devolverá false si no hay supervisorId.
    if (!supervisorId) return false;
    // La lógica real de filtrado se hace en useAreasProcesosAsignados.
    return false;
};

export const isAreaAsignadaASupervisor = (areaId: string, supervisorId?: string) => {
    if (!supervisorId) return false;
    return false;
};

// ========== Hooks reutilizables para vistas escalables ==========

/**
 * Lista de procesos que el usuario puede ver según su rol y asignaciones.
 * Una sola fuente de verdad: usarlo en todas las páginas que filtran por proceso.
 */
export function useProcesosVisibles(): { procesosVisibles: Proceso[]; loading: boolean } {
    const { esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos, user } = useAuth();
    const { data: procesos = [], isLoading } = useGetProcesosQuery();
    const { areas: areasAsignadas, procesos: procesosAsignados } = useAreasProcesosAsignados();

    const procesosVisibles = useMemo((): Proceso[] => {
        if (esGerenteGeneralDirector) return procesos as Proceso[];
        if (esGerenteGeneralProceso && user) {
            return (procesos as Proceso[]).filter((p) => esUsuarioResponsableProceso(p, user.id));
        }
        if (esDueñoProcesos && user) {
            return (procesos as Proceso[]).filter((p) => esUsuarioResponsableProceso(p, user.id));
        }
        if (esSupervisorRiesgos && user) {
            if (areasAsignadas.length === 0 && procesosAsignados.length === 0) return [];
            return (procesos as Proceso[]).filter((p) => {
                if (procesosAsignados.includes(String(p.id))) return true;
                if (p.areaId != null && areasAsignadas.includes(String(p.areaId))) return true;
                return false;
            });
        }
        return procesos as Proceso[];
    }, [procesos, esSupervisorRiesgos, esGerenteGeneralDirector, esGerenteGeneralProceso, esDueñoProcesos, areasAsignadas, procesosAsignados, user]);

    return { procesosVisibles, loading: isLoading };
}

/**
 * Indica si la página de proceso debe mostrarse en solo lectura
 * (visualizar, supervisor o gerente director).
 */
export function useIsReadOnlyProceso(): boolean {
    const { modoProceso } = useProceso();
    const { esSupervisorRiesgos, esGerenteGeneralDirector } = useAuth();
    return modoProceso === 'visualizar' || !!esSupervisorRiesgos || !!esGerenteGeneralDirector;
}

/** Área con id y nombre para selects */
export type AreaOption = { id: string; nombre: string };

/**
 * Procesos visibles + filtro por área en un solo hook.
 * Usar en páginas que muestran selector Área + Proceso para evitar duplicar useMemo.
 */
export function useProcesosFiltradosPorArea(initialFiltroArea = 'all') {
    const { procesosVisibles, loading } = useProcesosVisibles();
    const [filtroArea, setFiltroArea] = useState(initialFiltroArea);

    const areasDisponibles = useMemo((): AreaOption[] => {
        const map = new Map<string, string>();
        procesosVisibles.forEach((p) => {
            if (p.areaId) {
                const id = String(p.areaId);
                const nombre = (p as { areaNombre?: string }).areaNombre || `Área ${id}`;
                map.set(id, nombre);
            }
        });
        return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [procesosVisibles]);

    const procesosFiltrados = useMemo(() => {
        if (filtroArea === 'all') return procesosVisibles;
        return procesosVisibles.filter((p) => String(p.areaId) === filtroArea);
    }, [procesosVisibles, filtroArea]);

    const procesosFiltradosUnicos = useMemo(() => {
        const map = new Map<string, Proceso>();
        procesosFiltrados.forEach((p) => {
            const key = String(p.id);
            if (!map.has(key)) map.set(key, p);
        });
        return Array.from(map.values());
    }, [procesosFiltrados]);

    return {
        procesosVisibles,
        areasDisponibles,
        procesosFiltrados,
        procesosFiltradosUnicos,
        filtroArea,
        setFiltroArea,
        loading,
    };
}

/**
 * Procesos de tipo gerencial (para vista Gerente General).
 * Filtra por tipoProceso gerencial/estrategico.
 */
export function useProcesosGerenciales(): { procesos: Proceso[]; loading: boolean } {
    const { procesosVisibles, loading } = useProcesosVisibles();
    const procesos = useMemo(() => procesosVisibles.filter(isProcesoGerencial), [procesosVisibles]);
    return { procesos, loading };
}
