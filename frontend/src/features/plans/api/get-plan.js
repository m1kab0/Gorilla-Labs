import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getPlan(planId) {
  return api(`/plans/${planId}`);
}

export function usePlan(planId) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: () => getPlan(planId),
    enabled: !!planId,
  });
}
