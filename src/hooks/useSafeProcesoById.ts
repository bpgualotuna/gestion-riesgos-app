/**
 * Custom hook for safely fetching proceso by ID
 * Prevents undefined ID queries from being made.
 * Sin caché: siempre datos en tiempo real (incl. documentoUrl/archivos).
 */
import { useGetProcesoByIdQuery } from '../api/services/riesgosApi';

export const useSafeProcesoById = (procesoId?: string | number) => {
  const shouldFetch = procesoId != null && procesoId !== '' && procesoId !== 'undefined';

  const query = useGetProcesoByIdQuery(String(procesoId || ''), {
    skip: !shouldFetch,
    refetchOnMountOrArgChange: true,
    keepUnusedDataFor: 0,
  });

  return query;
};
