import { useAuth } from '../contexts/AuthContext';
import { useGetAreasQuery, useGetProcesosQuery, useGetAsignacionesGerenteQuery } from '../api/services/riesgosApi';

type AreaItem = { id: string; directorId?: string };
type ProcesoItem = { id: string; areaId?: string; responsableId?: string };

const getAsignaciones = (userId?: string, areas: AreaItem[] = [], procesos: ProcesoItem[] = []) => {
  if (!userId) {
    return { areaIds: [] as string[], procesoIds: [] as string[] };
  }

  const areaIds = new Set(
    areas.filter((a) => a.directorId === userId).map((a) => String(a.id))
  );

  const procesosPorArea = procesos.filter((p) => p.areaId && areaIds.has(p.areaId));
  const procesosPorResponsable = procesos.filter((p) => p.responsableId === userId);

  const procesoIds = new Set<string>();
  procesosPorArea.forEach((p) => procesoIds.add(String(p.id)));
  procesosPorResponsable.forEach((p) => procesoIds.add(String(p.id)));

  return {
    areaIds: Array.from(areaIds),
    procesoIds: Array.from(procesoIds),
  };
};

export const useAreasProcesosAsignados = () => {
  const { user, esGerenteGeneralDirector, esGerenteGeneralProceso, esSupervisorRiesgos, esDueñoProcesos } = useAuth();
  const { data: areasData = [] } = useGetAreasQuery();
  const { data: procesosData = [] } = useGetProcesosQuery();
  const areas = Array.isArray(areasData) ? areasData : [];
  const procesos = Array.isArray(procesosData) ? procesosData : [];

  // Gerente General: necesitamos asignaciones de AMBOS modos para que Vista de Procesos muestre lo asignado en Modo Director
  const esGerenteGeneral = esGerenteGeneralDirector || esGerenteGeneralProceso;
  const { data: asignacionesDirector, isLoading: loadingDirector } = useGetAsignacionesGerenteQuery(
    { usuarioId: user?.id ?? '', modo: 'director' },
    { skip: !user?.id || !esGerenteGeneral }
  );
  const { data: asignacionesProceso, isLoading: loadingProceso } = useGetAsignacionesGerenteQuery(
    { usuarioId: user?.id ?? '', modo: 'proceso' },
    { skip: !user?.id || !esGerenteGeneralProceso }
  );

  const loadingGerente = loadingDirector || loadingProceso;

  // Modo Director: Gerente General Director + Supervisor
  if (esGerenteGeneralDirector || (esSupervisorRiesgos && !esGerenteGeneralProceso)) {
    if (esGerenteGeneralDirector && asignacionesDirector) {
      return {
        areas: asignacionesDirector.areaIds ?? [],
        procesos: asignacionesDirector.procesoIds ?? [],
        loading: loadingGerente,
      };
    }
    if (esSupervisorRiesgos) {
      const { areaIds, procesoIds } = getAsignaciones(user?.id, areas, procesos);
      return { areas: areaIds, procesos: procesoIds, loading: false };
    }
  }

  // Modo Proceso: Gerente General Proceso - incluir procesos de Modo Director + Modo Proceso
  if (esGerenteGeneralProceso) {
    const areaIdsDirector = (asignacionesDirector?.areaIds ?? []).map(String).filter(Boolean);
    const procesoIdsDirector = (asignacionesDirector?.procesoIds ?? []).map(String).filter(Boolean);
    const procesoIdsProceso = (asignacionesProceso?.procesoIds ?? []).map(String).filter(Boolean);
    const areaIdsProceso = (asignacionesProceso?.areaIds ?? []).map(String).filter(Boolean);

    const procesoIds = new Set<string>([...procesoIdsDirector, ...procesoIdsProceso]);
    procesos
      .filter((p) => areaIdsDirector.includes(String(p.areaId)) || areaIdsProceso.includes(String(p.areaId)))
      .forEach((p) => procesoIds.add(String(p.id)));

    return {
      areas: [...areaIdsDirector, ...areaIdsProceso],
      procesos: Array.from(procesoIds),
      loading: loadingGerente,
    };
  }

  // Dueño de Proceso REAL y cualquier otro rol
  const { areaIds, procesoIds } = getAsignaciones(user?.id, areas, procesos);
  return {
    areas: areaIds,
    procesos: procesoIds,
    loading: false,
  };
};

export const isProcesoAsignadoASupervisor = (
  procesoId: string,
  supervisorId?: string,
  areas: AreaItem[] = [],
  procesos: ProcesoItem[] = []
) => {
  const { procesoIds } = getAsignaciones(supervisorId, areas, procesos);
  return procesoIds.includes(procesoId);
};

export const isAreaAsignadaASupervisor = (
  areaId: string,
  supervisorId?: string,
  areas: AreaItem[] = [],
  _procesos: ProcesoItem[] = []
) => {
  const { areaIds } = getAsignaciones(supervisorId, areas, _procesos);
  return areaIds.includes(areaId);
};
