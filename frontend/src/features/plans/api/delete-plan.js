import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function deletePlan(planId) {
  return api(`/plans/${planId}`, { method: 'DELETE' });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: (_data, planId) => {
      queryClient.setQueryData(['plans'], (prev) => prev?.filter((p) => p.id !== planId) ?? []);
    },
  });
}
