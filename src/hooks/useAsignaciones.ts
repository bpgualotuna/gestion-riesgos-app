import { useAuth } from '../contexts/AuthContext';
import { Proceso } from '../types';
import { useGetProcesosQuery } from '../api/services/riesgosApi';

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
    // 3) Supervisor de Riesgos: ver procesos donde es responsable (cualquier modo)
    else if (esSupervisorRiesgos) {
        procesosAsignados = procesos.filter((p) => esUsuarioResponsableProceso(p, userIdNum));
    }
    // 4) Dueño de Proceso real: ver procesos donde es responsable con modo 'proceso' o null
    else if (esDueñoProcesos) {
        procesosAsignados = procesos.filter((p: any) =>
            (p.responsablesList || []).some(
                (r: any) =>
                    Number(r.id) === userIdNum &&
                    (r.modo === 'proceso' || r.modo === null)
            )
        );
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
