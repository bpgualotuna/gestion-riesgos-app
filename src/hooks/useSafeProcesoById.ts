/**
 * Custom hook for safely fetching proceso by ID
 * Prevents undefined ID queries from being made
 */
import { useGetProcesoByIdQuery } from '../api/services/riesgosApi';

export const useSafeProcesoById = (procesoId?: string | number) => {
  // Only make the query if we have a valid ID
  const shouldFetch = procesoId != null && procesoId !== '' && procesoId !== 'undefined';
  
  const query = useGetProcesoByIdQuery(String(procesoId || ''), {
    skip: !shouldFetch
  });
  
  return query;
};
