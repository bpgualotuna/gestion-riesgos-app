/**
 * Custom hook for safely fetching proceso by ID.
 * Evita peticiones con ID vacío y usa caché corta para no saturar el backend.
 */
import { useGetProcesoByIdQuery } from '../api/services/riesgosApi';

export const useSafeProcesoById = (procesoId?: string | number) => {
  const shouldFetch = procesoId != null && procesoId !== '' && procesoId !== 'undefined';

  const query = useGetProcesoByIdQuery(String(procesoId || ''), {
    skip: !shouldFetch,
    refetchOnMountOrArgChange: 60,
    keepUnusedDataFor: 60,
  });

  return query;
};
