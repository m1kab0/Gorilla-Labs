import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';

export async function startPlan(planId) {
  return api(`/plans/${planId}/start`, { method: 'POST' });
}

export function useStartPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
