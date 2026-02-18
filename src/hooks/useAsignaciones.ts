import { useAuth } from '../contexts/AuthContext';
import { Proceso } from '../types';

type AreaItem = { id: string; directorId?: string };
type ProcesoItem = { 
    id: string; 
    areaId?: string; 
    responsableId?: string;
    responsablesList?: Array<{ id: number; nombre: string }>;
};

// Helper para verificar si un usuario es responsable de un proceso
export const esUsuarioResponsableProceso = (proceso: Proceso | ProcesoItem | any, userId?: string | number): boolean => {
    if (!userId || !proceso) return false;
    const userIdNum = Number(userId);
    
    // Verificar responsableId (compatibilidad con sistema anterior)
    if (proceso.responsableId && Number(proceso.responsableId) === userIdNum) {
        return true;
    }
    
    // Verificar responsablesList (sistema nuevo de múltiples responsables)
    if (proceso.responsablesList && Array.isArray(proceso.responsablesList)) {
        return proceso.responsablesList.some((r: any) => Number(r.id) === userIdNum);
    }
    
    return false;
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const getAsignaciones = (userId?: string) => {
    if (!userId) {
        return { areaIds: [] as string[], procesoIds: [] as string[] };
    }

    const userIdNum = Number(userId);
    const areas = loadFromStorage<AreaItem[]>('catalog_areas', []);
    const procesos = loadFromStorage<ProcesoItem[]>('catalog_procesos', []);

    const areaIds = new Set(
        areas.filter((a) => a.directorId === userId).map((a) => String(a.id))
    );

    const procesosPorArea = procesos.filter((p) => p.areaId && areaIds.has(p.areaId));
    
    // Buscar procesos donde el usuario es responsable (tanto responsableId como responsablesList)
    const procesosPorResponsable = procesos.filter((p) => esUsuarioResponsableProceso(p, userId));

    const procesoIds = new Set<string>();
    procesosPorArea.forEach((p) => procesoIds.add(String(p.id)));
    procesosPorResponsable.forEach((p) => procesoIds.add(String(p.id)));

    return {
        areaIds: Array.from(areaIds),
        procesoIds: Array.from(procesoIds),
    };
};

const getAsignacionesGerente = (userId?: string, modo?: 'director' | 'proceso') => {
    if (!userId || !modo) {
        return { areaIds: [] as string[], procesoIds: [] as string[] };
    }
    
    const procesos = loadFromStorage<ProcesoItem[]>('catalog_procesos', []);
    const storageKey = modo === 'director' ? `gg_director_${userId}` : `gg_proceso_${userId}`;
    const asignaciones = loadFromStorage<{ areas?: string[]; procesos?: string[] }>(storageKey, {});
    
    // Obtener áreas directamente asignadas
    const areasDirectas = (asignaciones.areas || []).map(String);
    
    // Obtener procesos asignados
    const procesosAsignados = (asignaciones.procesos || []).map(String);
    
    // Agregar áreas de los procesos asignados
    const areaIds = new Set<string>(areasDirectas);
    procesos.forEach((p) => {
        if (procesosAsignados.includes(String(p.id)) && p.areaId) {
            areaIds.add(String(p.areaId));
        }
    });
    
    // Agregar procesos de las áreas asignadas
    const procesoIds = new Set<string>(procesosAsignados);
    procesos.forEach((p) => {
        if (p.areaId && areasDirectas.includes(p.areaId)) {
            procesoIds.add(String(p.id));
        }
    });
    
    return {
        areaIds: Array.from(areaIds),
        procesoIds: Array.from(procesoIds),
    };
};

export const useAreasProcesosAsignados = () => {
    const { user, esGerenteGeneralDirector, esGerenteGeneralProceso, esSupervisorRiesgos, esDueñoProcesos } = useAuth();

    // Modo Director: Gerente General Director + Supervisor
    if (esGerenteGeneralDirector || (esSupervisorRiesgos && !esGerenteGeneralProceso)) {
        const { areaIds, procesoIds } = getAsignacionesGerente(user?.id, 'director');
        return { areas: areaIds, procesos: procesoIds, loading: false };
    }

    // Modo Proceso: SOLO Gerente General Proceso (NO Dueño Real)
    if (esGerenteGeneralProceso) {
        const { areaIds, procesoIds } = getAsignacionesGerente(user?.id, 'proceso');
        return { areas: areaIds, procesos: procesoIds, loading: false };
    }

    // Dueño de Proceso REAL y cualquier otro rol usa getAsignaciones
    const { areaIds, procesoIds } = getAsignaciones(user?.id);
    return {
        areas: areaIds,
        procesos: procesoIds,
        loading: false,
    };
};

export const isProcesoAsignadoASupervisor = (procesoId: string, supervisorId?: string) => {
    const { procesoIds } = getAsignaciones(supervisorId);
    return procesoIds.includes(procesoId);
};

export const isAreaAsignadaASupervisor = (areaId: string, supervisorId?: string) => {
    const { areaIds } = getAsignaciones(supervisorId);
    return areaIds.includes(areaId);
};
