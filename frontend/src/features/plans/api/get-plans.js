import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function getPlans() {
  return api('/plans/');
}

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: getPlans });
}
